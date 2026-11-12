// NPC System: NPC กลางของทุกโลก · ข้อมูลแยกตามโลกใน slice 'npcs:<world>' เจ้าของ 'npcs'
// NPC มาจาก 2 ทาง: นิยามในข้อมูลโลก (data.npcs) และสุ่มสร้าง (generate) ด้วย seed ที่กำหนดได้
// อายุ NPC ใช้เวลาท้องถิ่นของโลกที่สังกัด (bornAt เป็นเดือนท้องถิ่น) ไม่เกี่ยวกับอายุผู้เล่น
// ตำแหน่งคำนวณจากตาราง (schedule) ตอนถูกถาม ไม่จำลองทุก tick · การจำลองรายเดือนทำเต็มเฉพาะโลกที่ผู้เล่นอยู่
// โลกอื่นจำลองแบบรวบทุก 12 เดือนท้องถิ่น (LOD) · ดู docs/phase4/NPC_SYSTEM_DESIGN.md
(function(AW){
'use strict';
const OWNER='npcs',VERSION=1,SLOTS=['morning','day','evening','night'],TRAITS=['brave','kind','dili','loyal'],ID=/^[a-z][a-z0-9_]*$/;
const sliceOf=w=>'npcs:'+w;
const R=()=>AW.systems.Rules;
// hash คงที่ (ไม่กิน rng) ใช้กับเรื่องที่ต้องได้ผลเดิมทุกครั้งที่ถาม เช่น ตารางแบบสุ่มรายเดือน
const h01=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296};
// ตรวจนิยาม NPC และตารางในข้อมูลโลก (ก่อนลงทะเบียนโลก)
function validateNpcs(def){const d=def.data||{},e=[],locs=new Set((d.locations||[]).map(l=>l.id)),sch=new Set((d.schedules||[]).map(s=>s.id)),ids=new Set((d.npcs||[]).map(n=>n.id)),jobs=new Set((d.jobs||[]).map(j=>j.id));
 const tempers=new Set(((AW.data.shared||{}).tempers||[]).map(t=>t.id));
 for(const s of d.schedules||[]){if(!Array.isArray(s.entries)||!s.entries.length)e.push('schedule '+s.id+': ต้องมี entries');
  for(const x of s.entries||[]){if(!SLOTS.includes(x.slot))e.push('schedule '+s.id+': slot ไม่รู้จัก '+x.slot);if(x.days&&!['work','off','any'].includes(x.days))e.push('schedule '+s.id+': days ต้องเป็น work|off|any');
   if(!['home','work'].includes(x.at)&&!locs.has(x.at))e.push('schedule '+s.id+': ไม่มีสถานที่ '+x.at);if(x.chance!==undefined&&!(x.chance>0&&x.chance<=1))e.push('schedule '+s.id+': chance ต้องเป็น 0..1')}}
 for(const n of d.npcs||[]){const p='npc '+n.id+': ';if(typeof n.name!=='string')e.push(p+'ต้องมี name');
  for(const k of['home','work'])if(n[k]&&!locs.has(n[k]))e.push(p+k+' ไม่มีสถานที่ '+n[k]);
  if(n.schedule&&!sch.has(n.schedule))e.push(p+'ไม่มีตาราง '+n.schedule);if(n.occupation&&!jobs.has(n.occupation)&&!n.occupationName)e.push(p+'ไม่มีอาชีพ '+n.occupation);
  if(n.age!==undefined&&!(n.age>=0&&n.age<150))e.push(p+'age ไม่ถูกต้อง');if(n.temper&&tempers.size&&!tempers.has(n.temper))e.push(p+'ไม่รู้จัก temper '+n.temper);
  for(const k of Object.keys(n.traits||{}))if(!TRAITS.includes(k))e.push(p+'ไม่รู้จักนิสัย '+k);
  for(const r of n.rels||[])if(!ids.has(r.to))e.push(p+'อ้าง NPC ที่ไม่มี '+r.to)}
 for(const j of d.jobs||[])if(j.schedule&&!sch.has(j.schedule))e.push('job '+j.id+': ไม่มีตาราง '+j.schedule);
 return e}
class NpcSystem{
 constructor(E){this.E=E;E.worlds.addValidator(validateNpcs);
  E.bus.on('world:installed',({world})=>this._slice(world),{prio:50,owner:OWNER});
  E.bus.on('game:new',()=>{for(const w of E.worlds.ids())this.seed(w)},{prio:50,owner:OWNER});
  E.bus.on('game:loaded',()=>this._afterLoad(),{prio:85,owner:OWNER});
  E.bus.on('world:month',({world,month})=>this.simulate(world,month),{prio:5,owner:OWNER})}
 _slice(w){const n=sliceOf(w);if(!this.E.state.slices.has(n))this.E.state.register(n,OWNER,()=>({_v:VERSION,list:{},seq:0}));return n}
 _st(w){return this.E.state.get(this._slice(w))}
 _m(w,fn){return this.E.state.mutate(OWNER,this._slice(w),fn)}
 get(q){if(typeof q!=='string'||!q.includes('.'))return null;const w=q.split('.')[0];if(!this.E.worlds.has(w)&&!this.E.state.slices.has(sliceOf(w)))return null;return this._st(w).list[q]||null}
 exists(q){return!!this.get(q)}
 all(w){return Object.values(this._st(w).list)}
 ageY(q){const n=this.get(q);if(!n)return null;const w=n.world;return Math.floor(((n.death?n.death.month:this.E.time.month(w))-n.bornAt)/12)}
 // ---- สร้าง ----
 _make(w,def,origin){const c=this.E.worlds.ctx(w),id=w+'.'+def.id;if(!ID.test(def.id))throw new Error('id NPC ไม่ถูกต้อง: '+def.id);
  const loc=v=>{if(v&&!c.locations.has(v))throw new Error(`NPC ${id}: ไม่มีสถานที่ ${v}`);return v||null};
  const tr={brave:0,kind:0,dili:0,loyal:0};for(const k of Object.keys(def.traits||{}))tr[k]=def.traits[k];
  const flags=Object.assign({},def.flags||{});for(const k of Object.keys(def.flagChance||{}))if(h01(this._seedStr()+'|flag|'+id+'|'+k)<def.flagChance[k])flags[k]=true;
  return{id,name:def.name,world:w,gender:def.gender||null,species:def.species||'human',role:def.role||'',faction:def.faction||null,
   home:loc(def.home||c.def.entry),work:loc(def.work||(def.occupation&&(c.list('jobs').get(def.occupation)||{}).at)||null),occupation:def.occupation||null,occupationName:def.occupationName||null,status:def.status||'common',
   schedule:def.schedule||null,override:null,bornAt:this.E.time.month(w)-Math.round((def.age??20)*12),traits:tr,temper:def.temper||'cheerful',
   tags:(def.tags||[]).slice(),flags,memory:[],alive:true,death:null,ill:null,origin,combat:def.combat||null}}
 _seedStr(){return String(this.E.state.get('meta').seed)}
 // ใส่ NPC จากข้อมูลโลกที่ยังไม่มี (ไม่ซ้ำ: ตรวจจาก id) และความสัมพันธ์เริ่มต้นระหว่าง NPC
 seed(w){const c=this.E.worlds.ctx(w);if(!c)return 0;const add=[];for(const d of c.list('npcs').values())if(!this._st(w).list[w+'.'+d.id])add.push(this._make(w,d,'data'));
  if(add.length)this._m(w,s=>{for(const n of add)s.list[n.id]=n});
  // ประชากรสุ่มของโลก (config.population) สร้างครั้งเดียวต่อเกม มี flag กันซ้ำตอนโหลด
  const pop=c.config.population;if(pop&&!this._st(w).populated){const r=new AW.core.Rng(this._seedStr()+'|pop|'+w);for(let i=0;i<pop.count;i++){const job=pop.jobs[r.int(0,pop.jobs.length-1)];this.generate(w,{occupation:job||undefined,age:job==='student'?r.int(15,18):r.int(19,70)})}this._m(w,s=>{s.populated=true})}
  if(this.E.rels)for(const d of c.list('npcs').values())for(const r of d.rels||[])if(!this.E.rels.edge(w+'.'+d.id,w+'.'+r.to))this.E.rels.ensure(w+'.'+d.id,w+'.'+r.to,{aff:r.aff||0,trust:r.trust||0,fam:r.fam??30,bond:r.bond||null});
  return add.length}
 add(w,def,origin='script'){if(this._st(w).list[w+'.'+def.id])throw new Error('NPC id ซ้ำ: '+w+'.'+def.id);const n=this._make(w,def,origin);this._m(w,s=>{s.list[n.id]=n});this.E.bus.emit('npc:created',{id:n.id});return n}
 // สุ่มสร้างด้วย seed: seed เดียวกัน + ลำดับเดียวกัน = NPC เดียวกันเสมอ (ไม่ใช้ rng หลักของเกม)
 generate(w,o={}){const c=this.E.worlds.ctx(w);if(!c)throw new Error('ไม่มีโลก '+w);const pool=c.config.namePool;if(!pool)throw new Error('โลก '+w+' ไม่มี namePool');
  const seq=this._st(w).seq,r=new AW.core.Rng((o.seed??this._seedStr())+'|gen|'+w+'|'+seq),pick=a=>a[r.int(0,a.length-1)];
  const gender=o.gender||(r.next()<0.5?'m':'f'),tempers=AW.data.shared.tempers;const traits={};for(const k of TRAITS)traits[k]=r.int(-40,40);
  const def={id:'gen_'+seq,name:(o.surname||pick(pool.family))+' '+pick(pool[gender]),gender,age:o.age??r.int(16,60),role:o.role||'',temper:o.temper||pick(tempers).id,traits,
   home:o.home||pick(c.config.homeLocs||[c.def.entry]),work:o.work||null,occupation:o.occupation||null,schedule:o.schedule||(o.occupation&&(c.list('jobs').get(o.occupation)||{}).schedule)||c.config.defaultSchedule||null,tags:o.tags||[],faction:o.faction||null};
  const n=this._make(w,def,'gen');this._m(w,s=>{s.list[n.id]=n;s.seq=seq+1});this.E.bus.emit('npc:created',{id:n.id});return n}
 // ---- เวลาและตาราง ----
 // ช่วงเวลาของโลกที่ผู้เล่นอยู่ = ตาม AP ที่เหลือ (2 เช้า, 1 กลางวัน, 0 เย็น) · โลกอื่นถือเป็นกลางวัน
 clock(w){const p=this.E.player.get(),m=this.E.time.month(w),cal=(this.E.worlds.ctx(w)||{config:{}}).config.calendar||{};
  const slot=p.location.world===w?['evening','day','morning'][Math.max(0,Math.min(2,p.ap))]:'day';
  return{month:m,slot,dayType:(cal.holidayMonths||[]).includes(m%12)?'off':'work'}}
 schedule(n){const c=this.E.worlds.ctx(n.world);if(!c)return null;const job=n.occupation&&c.list('jobs').get(n.occupation);return c.list('schedules').get(n.schedule||(job&&job.schedule)||c.config.defaultSchedule)||null}
 // ตำแหน่ง ณ เวลา: ตาย=ไม่มี, ป่วยหนัก=บ้าน, override (เหตุการณ์พิเศษ), แล้วตาราง (แถวแรกที่ตรง slot/วัน/โอกาส)
 where(q,clk){const n=typeof q==='string'?this.get(q):q;if(!n||!n.alive)return null;const k=clk||this.clock(n.world);
  if(n.ill&&n.ill.severity>=2)return n.home;if(n.override&&k.month<n.override.until)return n.override.loc;
  const s=this.schedule(n);if(!s)return n.home;
  for(const x of s.entries){if(x.slot!==k.slot)continue;if(x.days&&x.days!=='any'&&x.days!==k.dayType)continue;if(x.chance&&h01(n.id+'|'+k.month+'|'+x.slot)>=x.chance)continue;
   const at=x.at==='home'?n.home:x.at==='work'?n.work:x.at;if(at)return at}return n.home}
 at(w,loc,clk){const k=clk||this.clock(w);return this.all(w).filter(n=>this.where(n,k)===loc)}
 // ---- เปลี่ยนสถานะ ----
 setOverride(q,loc,months,reason=''){const n=this.get(q);if(!n)throw new Error('ไม่มี NPC '+q);if(!this.E.worlds.ctx(n.world).locations.has(loc))throw new Error('ไม่มีสถานที่ '+loc);
  const until=this.E.time.month(n.world)+months;this._m(n.world,s=>{s.list[q].override={loc,until,reason}})}
 setJob(q,job,work){const n=this.get(q);if(!n)throw new Error('ไม่มี NPC '+q);const c=this.E.worlds.ctx(n.world),j=job&&c.list('jobs').get(job);if(job&&!j)throw new Error('ไม่มีอาชีพ '+job);
  this._m(n.world,s=>{const x=s.list[q];x.occupation=job||null;x.work=work||(j?j.at:null);x.schedule=null})}
 remember(q,t,tag=''){const n=this.get(q);if(!n)throw new Error('ไม่มี NPC '+q);const m=this.E.loop.month;this._m(n.world,s=>{const x=s.list[q];x.memory.unshift({m,t,tag});if(x.memory.length>12)x.memory.length=12})}
 setFlag(q,f,on=true){const n=this.get(q);if(!n)throw new Error('ไม่มี NPC '+q);this._m(n.world,s=>{if(on)s.list[q].flags[f]=true;else delete s.list[q].flags[f]})}
 setIll(q,ill){const n=this.get(q);this._m(n.world,s=>{s.list[q].ill=ill})}
 kill(q,cause){const n=this.get(q);if(!n)throw new Error('ไม่มี NPC '+q);if(!n.alive)return;const m=this.E.time.month(n.world),gm=this.E.loop.month;
  this._m(n.world,s=>{const x=s.list[q];x.alive=false;x.death={cause,month:m,global:gm,ageY:Math.floor((m-x.bornAt)/12)};x.override=null});
  this.E.bus.emit('npc:died',{id:q,cause})}
 // ---- จำลองรายเดือน ----
 // เต็ม: โลกที่ผู้เล่นอยู่ (ทุกเดือนท้องถิ่น) · รวบ: โลกอื่น ทุก 12 เดือนท้องถิ่น (factor 12)
 simulate(w,month){if(!this.E.state.slices.has(sliceOf(w)))return;const p=this.E.player.get(),full=p.location.world===w;if(!full&&month%12!==0)return;
  const f=full?1:12,H=AW.systems.Health,rng=this.E.rng,deaths=[],k=this.clock(w);
  this._m(w,s=>{for(const n of Object.values(s.list)){if(!n.alive)continue;
   if(n.override&&month>=n.override.until)n.override=null;
   const ageY=(month-n.bornAt)/12,r=H.roll({ageY,ill:n.ill,treated:false,condition:100},rng,f);
   n.ill=r.ill;if(r.die)deaths.push([n.id,r.die])}});
  for(const[q,c]of deaths)this.kill(q,c);
  if(this.E.rels&&full)this.E.rels.socialize(w,k)}
 _afterLoad(){for(const w of this.E.worlds.ids()){this._slice(w);const added=this.seed(w);if(added)this.E.debug&&this.E.debug.log(`เพิ่ม NPC ที่ขาด ${added} คนในโลก ${w}`)}}
}
AW.systems.NpcSystem=NpcSystem;AW.systems.validateNpcs=validateNpcs;AW.systems.SLOTS=SLOTS;AW.systems.h01=h01;
AW.systems.NpcsModule={id:'npcs',deps:['player'],install(e){e.npcs=new NpcSystem(e)}};
})(globalThis.AW);
