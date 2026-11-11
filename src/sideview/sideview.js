// Side-view runtime (Phase 7B.3): สำรวจพื้นที่แบบ real-time บนระบบเดิม · ไม่มี DOM (ทดสอบใน node ได้)
// สถานะ real-time (ตำแหน่ง ความเร็ว HP ระหว่างสู้ ศัตรู) อยู่ในหน่วยความจำเท่านั้น ไม่เขียน GameState ทุกเฟรม
// slice 'scene' (เจ้าของ 'sideview') เขียนเฉพาะ: เปลี่ยนพื้นที่ · ศัตรูถูกปราบ · ก่อนเซฟ/ออก · เซฟเก่าไม่มี slice นี้ = ค่าเริ่มต้น
// เชื่อมระบบเดิมผ่าน API สาธารณะเท่านั้น: player.moveTo · npcs.at · rels.actions/interact · events.eligible/present · combat.profile/enemy/apply · Rules.apply
(function(AW){
'use strict';
const SV=AW.sv=AW.sv||{},OWNER='sideview',VERSION=1,R=()=>AW.systems.Rules,num=x=>typeof x==='number'&&isFinite(x);
const BODY={w:20,h:44},ENEMY={w:30,h:30},REACH=44,MAX_RESOLVED=60;
// ---- ตรวจข้อมูล areas ตอนลงทะเบียนโลก ----
function validateAreas(def,assets){const d=def.data||{},e=[],locs=new Set((d.locations||[]).map(l=>l.id)),en=new Set((d.enemies||[]).map(x=>x.id)),ev=new Set((d.events||[]).map(x=>def.id+'.'+x.id)),seen=new Set();
 const rect=(r,p,need=['x','y','w','h'])=>{if(!need.every(k=>num(r[k])))e.push(p+'ต้องมี '+need.join(',')+' เป็นตัวเลข')};
 for(const a of d.areas||[]){const p='area '+a.id+': ';if(!locs.has(a.loc))e.push(p+'ไม่มีสถานที่ '+a.loc);if(seen.has(a.loc))e.push(p+'สถานที่ '+a.loc+' มีหลาย area');seen.add(a.loc);
  if(!(num(a.width)&&a.width>=576&&num(a.height)&&a.height>=324))e.push(p+'width>=576 height>=324');if(!(a.spawn&&num(a.spawn.x)))e.push(p+'ต้องมี spawn.x');
  (a.solids||[]).forEach(r=>rect(r,p+'solid '));(a.platforms||[]).forEach(r=>rect(r,p+'platform ',['x','y','w']));if(!(a.solids||[]).length)e.push(p+'ต้องมีพื้นอย่างน้อยหนึ่งชิ้น');
  for(const x of a.doors||[]){if(!locs.has(x.to))e.push(p+'ประตูไปสถานที่ที่ไม่มี '+x.to);if(!num(x.x))e.push(p+'ประตูต้องมี x')}
  for(const s of a.spawns||[]){if(!en.has(s.enemy))e.push(p+'ไม่มีศัตรู '+s.enemy);if(!(num(s.x1)&&num(s.x2)&&s.x2>s.x1))e.push(p+'spawn x1<x2');e.push(...R().validateEffects(s.reward).map(y=>p+'reward: '+y))}
  for(const q of a.talkEvents||[])if(!ev.has(q))e.push(p+'ไม่มีเหตุการณ์ '+q);
  if(assets)for(const k of(a.layers||[]).concat(a.tileset||[]))if(!assets.defs.has(def.assetNs+'.'+k))e.push(p+'ไม่มี asset '+def.assetNs+'.'+k)}
 return e}
function install(E){if(E.sv)return E.sv;E.state.register('scene',OWNER,()=>({_v:VERSION,area:null,x:null,facing:1,resolved:[]}));E.worlds.addValidator(def=>validateAreas(def,E.assets));
 const api=E.sv={get:()=>E.state.get('scene'),_m:fn=>E.state.mutate(OWNER,'scene',fn),area:(w,loc)=>{const c=E.worlds.ctx(w);return c?[...c.list('areas').values()].find(a=>a.loc===loc)||null:null},runtime:null};
 // หลังโหลด: พื้นที่ที่ไม่มีแล้ว = กลับค่าเริ่มต้น (ผู้เล่นไปยืนจุดเกิด) · ตัดรายการปราบแล้วที่เก่า
 E.bus.on('game:loaded',()=>{const s=api.get(),p=E.player.get(),a=p.created&&api.area(p.location.world,p.location.loc);if(s.area&&(!a||a.id!==s.area))api._m(x=>{x.area=null;x.x=null});api.runtime=null},{prio:75,owner:OWNER});
 E.bus.on('game:new',()=>{api.runtime=null},{owner:OWNER});
 return api}
// ---- runtime หนึ่งครั้งที่อยู่ในโหมดสำรวจ ----
class Explore{
 constructor(E){this.E=E;this.t=0;this.msg=[];this.blocked=false}
 enter(){const E=this.E,p=E.player.get();if(!p.created||!p.alive)throw new Error('ยังไม่มีตัวละครที่มีชีวิต');const a=E.sv.area(p.location.world,p.location.loc);if(!a)throw new Error('สถานที่นี้ยังไม่มีฉาก side-view');
  E.loop.pause('explore');E.sv.runtime=this;this.load();return this}
 exit(){this.settle('retreat');this.flush();this.E.loop.resume('explore');if(this.E.sv.runtime===this)this.E.sv.runtime=null}
 // โหลดพื้นที่ของสถานที่ปัจจุบัน · arrive = ชื่อจุดมาถึงจากประตู
 load(arrive){const E=this.E,p=E.player.get(),w=p.location.world,a=E.sv.area(w,p.location.loc);if(!a)throw new Error('สถานที่นี้ยังไม่มีฉาก side-view');
  this.w=w;this.a=a;this.world={width:a.width,height:a.height,solids:a.solids,platforms:a.platforms||[]};const s=E.sv.get();
  const x=arrive&&a.arrivals&&a.arrivals[arrive]?a.arrivals[arrive].x:s.area===a.id&&num(s.x)?s.x:a.spawn.x;
  this.me=Object.assign({x,y:this.groundY(x,BODY)-BODY.h,vx:0,vy:0,ground:true,facing:s.area===a.id?s.facing||1:1,attack:0,hurt:0,inv:0,cd:0,dead:false,hit:new Set()},BODY);
  this.hp=p.hp;this.maxHp=E.player.maxHp();this.rng=new AW.core.Rng(E.state.get('meta').seed+'|sv|'+a.id+'|'+E.loop.month);
  this.cam={x:0,y:0};this.cam=AW.sv.camera({x:Math.max(0,x-288)},this.me,this.world);this.placeNpcs();this.spawn();
  if(s.area!==a.id||arrive)this.flush(true);return this}
 groundY(x,b){let y=this.world.height;for(const s of this.world.solids)if(x+b.w>s.x&&x<s.x+s.w&&s.y<y)y=s.y;return y}
 // NPC ตามตารางเวลาจริง: ใครอยู่สถานที่นี้ตอนนี้ (ช่วงเวลาตาม AP) ยืนที่ npcSpots ตามลำดับ
 placeNpcs(){const E=this.E,here=E.npcs.at(this.w,this.a.loc).filter(n=>n.alive);this._ap=E.player.get().ap;
  this.npcs=here.slice(0,(this.a.npcSpots||[]).length).map((n,i)=>({id:n.id,name:n.name,gender:n.gender,x:this.a.npcSpots[i].x,y:this.groundY(this.a.npcSpots[i].x,BODY)-BODY.h,w:BODY.w,h:BODY.h,facing:-1}))}
 key(sp){return this.a.id+'|'+this.E.loop.month+'|'+sp.id}
 spawn(){const E=this.E,done=new Set(E.sv.get().resolved);this.foes=(this.a.spawns||[]).filter(sp=>!done.has(this.key(sp))).map(sp=>{const e=E.combat.enemy(this.w,sp.enemy),hp=Math.round(e.hp||e.power*3);
  return Object.assign({sp,key:this.key(sp),name:e.name,power:e.power,armor:e.armor||0,hp,max:hp,x:(sp.x1+sp.x2)/2,y:this.groundY((sp.x1+sp.x2)/2,ENEMY)-ENEMY.h,vx:0,dir:1,state:'patrol',wind:0,cd:0,hurt:0,dead:false},ENEMY)})}
 // ---- หนึ่ง fixed step ----
 step(inp={}){const E=this.E;this.t++;
  // หยุดระหว่างมีเหตุการณ์ค้าง การต่อสู้แบบเลือกท่า หรือ UI เปิดหน้าต่างทับ
  if(E.events.pending()||E.combat.session()||this.blocked||!E.player.get().alive)return 'blocked';
  if(E.player.get().ap!==this._ap)this.placeNpcs();
  const K=AW.sv.K,me=this.me;let b=AW.sv.step(me,inp,this.world);Object.assign(me,b);
  if(me.fell){me.fell=false;me.x=this.a.spawn.x;me.y=this.groundY(me.x,BODY)-BODY.h;me.vy=0}
  for(const k of['attack','hurt','inv','cd'])me[k]=Math.max(0,me[k]-K.dt);
  if(inp.attackPressed&&me.cd<=0&&!me.hurt){me.attack=0.32;me.cd=0.42;me.hit=new Set()}
  // หน้าต่างโดน (frame 3-4 ของท่าโจมตี): 0.20-0.10 วินาทีก่อนจบท่า
  if(me.attack>0.1&&me.attack<0.22){const box={x:me.facing>0?me.x+me.w:me.x-34,y:me.y+8,w:34,h:28};for(const f of this.foes)if(!f.dead&&!me.hit.has(f.key)&&AW.sv.overlap(box,f)){me.hit.add(f.key);this.hitFoe(f)}}
  for(const f of this.foes)this.foeAI(f);
  this.foes=this.foes.filter(f=>!(f.dead&&f.hurt<=0));
  this.cam=AW.sv.camera(this.cam,me,this.world);
  if(inp.interactPressed)return this.interact();
  return 'ok'}
 // สูตรความเสียหายเดียวกับการต่อสู้แบบเลือกท่า (combat.js): ผู้เล่นตี = HP สูงสุดศัตรู x 0.22 x (พลังเรา/พลังศัตรู)^0.8 · ศัตรูตี = HP เรา x 0.18 x (พลังศัตรู/พลังเรา)^0.8
 power(){return this.E.combat.profile(this.w).power}
 hitFoe(f){const d=Math.max(1,Math.round(f.max*0.22*Math.pow(this.power()/Math.max(1,f.power),0.8)*(0.85+this.rng.next()*0.3)*(1-f.armor)));
  f.hp=Math.max(0,f.hp-d);f.hurt=0.2;f.vx=this.me.facing*120;this.say(`${f.name} -${d}`);if(f.hp<=0)this.kill(f)}
 foeAI(f){const K=AW.sv.K,me=this.me;f.hurt=Math.max(0,f.hurt-K.dt);f.cd=Math.max(0,f.cd-K.dt);if(f.dead)return;
  const dx=(me.x+me.w/2)-(f.x+f.w/2),near=Math.abs(dx)<160&&Math.abs(me.y-f.y)<80;
  if(f.wind>0){f.wind-=K.dt;if(f.wind<=0){const box={x:f.dir>0?f.x+f.w:f.x-30,y:f.y,w:30,h:f.h};if(AW.sv.overlap(box,me)&&me.inv<=0)this.hurtMe(f);f.cd=1.1}return}
  if(f.hurt>0){f.x+=f.vx*K.dt;f.vx*=0.85}
  else if(near){f.dir=Math.sign(dx)||f.dir;if(Math.abs(dx)<40&&f.cd<=0){f.wind=0.5;f.state='windup'}else{f.x+=f.dir*70*K.dt;f.state='chase'}}
  else{f.state='patrol';f.x+=f.dir*40*K.dt;if(f.x<f.sp.x1)f.dir=1;if(f.x>f.sp.x2)f.dir=-1}
  f.x=Math.max(0,Math.min(this.world.width-f.w,f.x))}
 hurtMe(f){const d=Math.max(1,Math.round(this.maxHp*0.18*Math.pow(f.power/Math.max(1,this.power()),0.8)*(0.85+this.rng.next()*0.3)));this.hp-=d;this.me.hurt=0.3;this.me.inv=0.8;this.me.vx=f.dir*160;this.me.vy=-160;this.say(`โดน ${f.name} -${d}`);
  if(this.hp<=0)this.lose(f)}
 // ---- ผลการต่อสู้ผ่าน combat.apply (API เดิม) ครั้งเดียวต่อเหตุการณ์ · กฎความตายเดิม: ความเสี่ยงปกติไม่ตาย ----
 report(outcome,f,extra={}){return Object.assign({mode:'action',source:{kind:'sideview',area:this.a.id,key:f?f.key:null},win:outcome==='win',outcome,risk:'normal',enemy:f?f.sp.enemy:null,enemyName:f?f.name:'',
  hpAfter:Math.max(1,Math.round(this.hp)),injury:0,critical:false,dead:false,party:[],skillUse:{},lines:this.msg.slice(-6)},extra)}
 kill(f){const E=this.E;f.dead=true;f.hurt=0.4;
  // บันทึกว่าปราบแล้วก่อนให้รางวัล: โหลดเซฟ/กลับเข้าพื้นที่ไม่ได้รางวัลซ้ำ
  E.sv._m(s=>{s.resolved=s.resolved.concat(f.key).slice(-MAX_RESOLVED)});
  E.combat.apply(this.report('win',f,{injury:this.hp<this.maxHp*0.25?1:0}));const run=()=>R().apply(f.sp.reward||[],E.view(this.w)),lines=E.economy?E.economy.as('sideview',run):run();this.hp=E.player.get().hp;
  this.say(`ปราบ${f.name}แล้ว`+(lines.length?' ('+lines.join(', ')+')':''));E.events.log(`สู้กับ${f.name}ที่${this.a.name}: ชนะ`)}
 lose(f){const E=this.E;E.combat.apply(this.report('lose',f,{hpAfter:1,injury:3}));this.hp=E.player.get().hp;this.say('ท่านล้มลง ต้องถอยออกมาพักฟื้น');E.events.log(`สู้กับ${f.name}ที่${this.a.name}: แพ้ (บาดเจ็บ)`);
  const sp=this.a.spawn.x;Object.assign(this.me,{x:sp,y:this.groundY(sp,BODY)-BODY.h,vx:0,vy:0,inv:2});for(const g of this.foes){g.hp=g.max;g.wind=0}}
 // HP ระหว่างสำรวจต่างจากของผู้เล่น (โดนตีแล้วยังไม่จบศึก) = บันทึกเป็นการถอยหนี ก่อนเปลี่ยนพื้นที่/เซฟ/ออก
 settle(outcome='retreat'){const E=this.E;if(Math.round(this.hp)===E.player.get().hp)return false;E.combat.apply(this.report(outcome,null));this.hp=E.player.get().hp;return true}
 flush(force){const s=this.E.sv.get(),x=Math.round(this.me.x),f=this.me.facing;if(!force&&s.area===this.a.id&&s.x===x&&s.facing===f)return false;this.E.sv._m(z=>{z.area=this.a.id;z.x=x;z.facing=f});return true}
 say(t){this.msg.push(t);if(this.msg.length>30)this.msg.shift()}
 // ---- ปฏิสัมพันธ์ (กด E) ----
 nearby(){const me=this.me,cx=me.x+me.w/2,d=this.a.doors.find(x=>Math.abs(x.x-cx)<REACH);if(d)return{kind:'door',door:d,label:d.label};
  const n=this.npcs.find(x=>Math.abs(x.x+x.w/2-cx)<REACH);if(n)return{kind:'npc',npc:n.id,label:'คุยกับ'+n.name};return null}
 interact(){const t=this.nearby();if(!t)return 'none';if(t.kind==='door')return this.useDoor(t.door);this.talk=t.npc;return 'talk'}
 // ตัวเลือกคุยกับ NPC: การกระทำความสัมพันธ์จริง + เหตุการณ์ของพื้นที่ที่เข้าเงื่อนไขตอนนี้
 talkOptions(q=this.talk){const E=this.E;if(!q)return[];const opts=E.rels.actions(q).map(a=>({kind:'rel',id:a.id,name:a.name,why:a.why||''}));
  for(const ev of this.a.talkEvents||[])if(E.events.eligible(ev))opts.push({kind:'event',id:ev,name:E.events.def(ev).title,why:''});return opts}
 choose(opt,q=this.talk){const E=this.E;this.talk=null;if(opt.kind==='rel')return E.rels.interact(q,opt.id);if(opt.kind==='event')return E.events.present(opt.id,q);throw new Error('ตัวเลือกไม่รู้จัก')}
 useDoor(d){const E=this.E;this.settle('retreat');this.flush();try{E.player.moveTo(d.to)}catch(e){this.say(e.message);return 'locked:'+e.message}
  if(!E.sv.area(this.w,d.to))return 'left';this.load(d.arrive);return 'door'}
}
SV.validateAreas=validateAreas;SV.install=install;SV.Explore=Explore;SV.BODY=BODY;SV.ENEMY=ENEMY;
})(globalThis.AW);
