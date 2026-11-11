// World System: ลงทะเบียนโลก ติดตั้ง World Module ผ่าน Engine และเดินทางผ่าน Gate
// ติดตั้ง: engine.use(AW.systems.WorldsModule) แล้วใช้ engine.worlds
// ทุกโลกได้ slice ของตัวเอง 'world:<id>' เจ้าของ 'world:<id>' โลกอื่นเขียนไม่ได้ (ใช้ state ownership ของ Phase 1.1)
// เวลาใช้ engine.time (WorldTime) · เซฟใช้ engine.save ไม่มีระบบเซฟใหม่
// ดู docs/phase2/WORLD_SYSTEM_DESIGN.md และ WORLD_MODULE_GUIDE.md
(function(AW){
'use strict';
const C=AW.core,ID=/^[a-z][a-z0-9_]*$/,HOOKS=['install','enter','leave','update','dispose','migrate'];
const sliceOf=id=>'world:'+id;
const kindOf=v=>Array.isArray(v)?'array':v===null?'null':typeof v;

// ตรวจนิยามโลก คืนรายการ error (ว่าง = ผ่าน) · ฟิลด์จำเป็นพื้นฐานตรวจโดย Registry อยู่แล้ว
function validateWorld(d,{assets}={}){const e=[];
 if(typeof d.name!=='string'||!d.name)e.push('name ต้องเป็นข้อความ');
 if(typeof d.description!=='string')e.push('description ต้องเป็นข้อความ');
 try{C.WorldTime.rateUnits(d.timeRate)}catch(x){e.push(x.message)}
 if(!d.config||kindOf(d.config)!=='object')e.push('config ต้องเป็น object');
 if(!ID.test(d.assetNs||''))e.push('assetNs ไม่ถูกต้อง');if(!ID.test(d.storyNs||''))e.push('storyNs ไม่ถูกต้อง');
 const m=d.module;if(!m||typeof m!=='object')e.push('module ต้องเป็น object');
 else for(const h of Object.keys(m))if(!HOOKS.includes(h)||typeof m[h]!=='function')e.push('module.'+h+' ไม่รู้จักหรือไม่ใช่ฟังก์ชัน');
 if(d.state!==undefined&&typeof d.state!=='function')e.push('state ต้องเป็นฟังก์ชันคืนค่าเริ่มต้น');
 if(d.state){let s;try{s=d.state()}catch(x){e.push('state() error: '+x.message)}if(s!==undefined&&kindOf(s)!=='object')e.push('state() ต้องคืน object');
  else if(s){try{JSON.stringify(s)}catch(x){e.push('state ต้องเป็น JSON')}}}
 const data=d.data||{};
 for(const k of Object.keys(data))if(!Array.isArray(data[k]))e.push('data.'+k+' ต้องเป็น array');
 if(d.stateVersion!==undefined&&(!Number.isInteger(d.stateVersion)||d.stateVersion<1))e.push('stateVersion ต้องเป็นจำนวนเต็ม >= 1');
 if((d.stateVersion||1)>1&&!(d.module&&typeof d.module.migrate==='function'))e.push('stateVersion > 1 ต้องมี module.migrate');
 if(e.length)return e;
 for(const k of Object.keys(data)){if(k==='assets')continue;const seen=new Set();for(const x of data[k]){if(!x||!ID.test(x.id||''))e.push('data.'+k+': id ผิดรูปแบบ "'+(x&&x.id)+'"');else if(seen.has(x.id))e.push('data.'+k+': id ซ้ำ "'+x.id+'"');else seen.add(x.id)}}
 if(e.length)return e;
 const locs=data.locations||[];if(!locs.some(l=>l&&l.id===d.entry))e.push('entry "'+d.entry+'" ไม่อยู่ใน data.locations');
 for(const g of data.gates||[]){{if(!ID.test(g.to||''))e.push('gate '+g.id+' ไม่มีปลายทาง');if(!Number.isInteger(g.months??0)||(g.months??0)<0)e.push('gate '+g.id+' months ต้องเป็นจำนวนเต็ม >= 0')}}
 for(const a of data.assets||[]){if(typeof a!=='string'||!a.startsWith(d.assetNs+'.'))e.push('asset "'+a+'" อยู่นอก namespace '+d.assetNs);else if(assets&&assets.status(a)==='missing')e.push('asset "'+a+'" ไม่มีใน Asset Registry')}
 return e}

class WorldSystem{
 constructor(engine){this.E=engine;this.reg=engine.registries.world;this.live=new Map();this.validators=[];
  engine.bus.on('game:loaded',()=>this._migrateAll(),{prio:100,owner:'worlds'});
  engine.bus.on('world:month',({world,month})=>{const w=this.live.get(world);if(w&&w.def.module.update)this._hook(w,'update',{month})},{prio:10,owner:'worlds'})}
 // ลงทะเบียน + ติดตั้งแบบ atomic: ตรวจก่อน แล้วทำทีละขั้น ถ้าขั้นใดล้ม ถอยทุกขั้นที่ทำไปแล้ว
 // ลำดับ: registry -> state slice -> WorldTime -> install hook (เรียกเป็นขั้นสุดท้าย ถ้า hook throw ถือว่าติดตั้งไม่สำเร็จ)
 register(def){const errs=def&&typeof def==='object'?validateWorld(def,{assets:this.E.assets}):['ไม่ใช่ object'];
  if(!errs.length)errs.push(...this.reg.check(def));
  if(!errs.length)for(const v of this.validators)errs.push(...(v(def)||[]));
  if(errs.length)throw new Error(`world "${def&&def.id}" ไม่ถูกต้อง: ${errs.join('; ')}`);
  C.deepFreeze(def);const id=def.id,S=this.E.state,name=sliceOf(id),undo=[];
  try{
   this.reg.add(def);undo.push(()=>this.reg.items.delete(id));
   if(S.slices.has(name))throw new Error('slice '+name+' มีอยู่แล้ว (เจ้าของ '+S.owner(name)+')');
   const hadOrphan=name in S.orphans;S.register(name,name,()=>{const v=(def.state||(()=>({})))();return def.stateVersion?Object.assign({_v:def.stateVersion},v):v});
   undo.push(()=>S.unregister(name,name,{keep:hadOrphan}));
   this.E.time.addWorld(id,def.timeRate);undo.push(()=>this.E.time.removeWorld(id));
   const w=this._make(def);this.live.set(id,w);undo.push(()=>this.live.delete(id));
   const f=def.module.install;if(f)f(w.ctx);
  }catch(err){for(const u of undo.reverse()){try{u()}catch(e){}}this.E.bus.emit('world:error',{world:id,hook:'register',err});throw new Error(`world "${id}" ติดตั้งไม่สำเร็จ: ${err.message}`)}
  this.E.bus.emit('world:installed',{world:id});return id}
 registerAll(defs){const ok=[],bad=[];for(const d of defs){try{ok.push(this.register(d))}catch(x){bad.push(x.message)}}return{ok,bad}}
 _make(def){const id=def.id,S=this.E.state,name=sliceOf(id),data=def.data||{},lists={};
  for(const k of Object.keys(data))if(k!=='assets')lists[k]=new Map(data[k].map(x=>[x.id,x]));
  const w={def,lists,locations:lists.locations||new Map(),gates:lists.gates||new Map(),disposed:false};
  w.ctx=Object.freeze({id,def,config:def.config,rules:def.config.rules||{},locations:w.locations,npcs:lists.npcs||new Map(),quests:lists.quests||new Map(),events:lists.events||new Map(),
   list:k=>lists[k]||new Map(),
   get:()=>S.get(name),mutate:fn=>S.mutate(name,name,fn),
   month:()=>this.E.time.month(id),globalMonth:()=>this.E.loop.month,
   asset:k=>this.E.assets.get(def.assetNs+'.'+k),storyId:k=>def.storyNs+'.'+k,
   emit:(ev,payload)=>this.E.bus.emit('world:event',{world:id,ev,payload})});
  return w}
 // หลังโหลดเซฟ: ถ้า state ของโลกเก่ากว่า stateVersion ให้ module.migrate แปลงทีละเวอร์ชัน
 _migrateAll(){for(const w of this.live.values()){const want=w.def.stateVersion||1;let v=w.ctx.get()._v||1;if(v>=want)continue;
  w.ctx.mutate(s=>{while(v<want){w.def.module.migrate(s,v);v++}s._v=want})}}
 // error จาก hook ของโลกถูกแยก ไม่ทำให้ระบบอื่นค้าง: แจ้ง 'world:error' แล้วไปต่อ
 _hook(w,h,arg){const f=w.def.module[h];if(!f)return true;try{f(w.ctx,arg);return true}catch(err){this.E.bus.emit('world:error',{world:w.def.id,hook:h,err});this.E.debug&&this.E.debug.error(`world ${w.def.id}.${h}: ${err.message}`);return false}}
 dispose(id){const w=this.live.get(id);if(!w)throw new Error('ไม่มีโลก '+id);this._hook(w,'dispose');w.disposed=true;this.live.delete(id);this.E.time.removeWorld(id);this.E.bus.emit('world:disposed',{world:id})}
 // ระบบอื่น (Event, Mission) เพิ่มตัวตรวจเนื้อหาโลกได้ ทำงานก่อนลงทะเบียน ถ้าไม่ผ่านไม่ลงทะเบียน
 addValidator(fn){this.validators.push(fn)}
 has(id){return this.live.has(id)}
 ctx(id){const w=this.live.get(id);return w?w.ctx:null}
 ids(){return[...this.live.keys()]}
 get current(){return this.E.time.current}
 // เริ่มเกม: เข้าโลกแรก (ไม่ใช่การเดินทาง)
 start(id){const w=this.live.get(id);if(!w)throw new Error('ไม่มีโลก '+id);this.E.time.enter(id);this._hook(w,'enter',{from:null,via:null});this.E.bus.emit('world:enter',{world:id,from:null})}
 gatesHere(){const w=this.live.get(this.current);return w?[...w.gates.values()]:[]}
 // เดินทางผ่าน gate ของโลกปัจจุบัน
 travelVia(gateId){const w=this.live.get(this.current);const g=w&&w.gates.get(gateId);if(!g)throw new Error('ไม่มี gate "'+gateId+'" ในโลกปัจจุบัน');return this.travel(g.to,{months:g.months||0,via:gateId})}
 // ตรวจทุกอย่างก่อนเปลี่ยนสถานะ ถ้าไม่ผ่าน throw โดยไม่แตะอะไร
 travel(to,{months=0,via=null}={}){const T=this.E.time,from=this.current;
  if(!this.live.has(to))throw new Error('ไม่มีโลกปลายทาง "'+to+'"');
  if(T.state.get('worlds_time').traveling)throw new Error('กำลังเดินทางอยู่');
  if(to===from)throw new Error('อยู่ที่โลก '+to+' แล้ว');
  if(!Number.isInteger(months)||months<0)throw new Error('เวลาเดินทางต้องเป็นจำนวนเต็ม >= 0');
  const fw=this.live.get(from);if(fw)this._hook(fw,'leave',{to,via});
  try{T.travel(to,{months})}catch(err){if(fw)this._hook(fw,'enter',{from:null,via,aborted:true});throw err}
  this._hook(this.live.get(to),'enter',{from,via});this.E.bus.emit('world:enter',{world:to,from,via});return{from,to,months}}
}
AW.systems.WorldSystem=WorldSystem;AW.systems.validateWorld=validateWorld;
AW.systems.WorldsModule={id:'worlds',deps:[],install(e){e.worlds=new WorldSystem(e)}};
})(globalThis.AW);
