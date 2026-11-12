// Side-view runtime (Phase 7B.3): สำรวจพื้นที่แบบ real-time บนระบบเดิม · ไม่มี DOM (ทดสอบใน node ได้)
// สถานะ real-time (ตำแหน่ง ความเร็ว ศัตรู ความเสียหายที่ยังไม่ปิดยอด) อยู่ในหน่วยความจำเท่านั้น ไม่เขียน GameState ทุกเฟรม
// slice 'scene' (เจ้าของ 'sideview') เขียนเฉพาะ: เปลี่ยนพื้นที่ · ศัตรูถูกปราบ · ก่อนเซฟ/ออก · เซฟเก่าไม่มี slice นี้ = ค่าเริ่มต้น
// เชื่อมระบบเดิมผ่าน API สาธารณะเท่านั้น: player.moveTo/canEnter/spendAp · npcs.at · rels.actions/interact · events.eligible/present · combat.profile/enemy/apply · Rules.apply
// HP: แหล่งความจริงเดียวคือ player.hp ใน GameState · runtime ไม่เก็บสำเนา HP เก็บเฉพาะ dmg (ความเสียหายจากศึกในฉากที่ยังไม่ส่งเข้า combat.apply)
// เวลา: runtime หยุดเกมด้วย reason 'explore' ของตัวเองเท่านั้น และปล่อยครั้งเดียว ไม่แตะ reason ของระบบอื่น
(function(AW){
'use strict';
const SV=AW.sv=AW.sv||{},OWNER='sideview',VERSION=1,PAUSE='explore',R=()=>AW.systems.Rules,num=x=>typeof x==='number'&&isFinite(x);
const BODY={w:20,h:44},REACH=44,ATTACK={dur:0.32,t0:0.1,t1:0.22},HZ=Math.round(1/SV.K.dt);
// ฟิสิกส์ของศัตรู: ใช้ step เดียวกับผู้เล่น (ชนกล่องตัน/แพลตฟอร์ม/ขอบโลก) ต่างแค่ความเร็ว
const FOE_K=Object.assign({},SV.K,{speed:40,accel:900,friction:500}),PATROL=40,CHASE=70;
// sprite ของผู้เล่น/NPC ตามธรรมเนียมชื่อใน Asset Registry · ของศัตรูระบุใน spawn.sprite
const SPRITE={player:g=>'shared.sv.player_'+(g==='f'?'f':'m'),npc:(ns,g)=>ns+'.sv.npc_'+(g==='f'?'f':'m')};
const NEED={player:['idle','walk','jump','fall','attack','hurt','death'],npc:['idle'],foe:['idle','walk','attack','hurt','death']};
const has=(o,ks)=>!!o&&ks.every(k=>num(o[k]));
// ---- ตรวจ metadata ของ sprite: สิ่งที่ runtime และ view ใช้จริง (frame, anchor, bbox, anims) ----
function validateSprite(d,need,id){const p='sprite '+id+': ';if(!d)return[p+'ไม่มีใน Asset Registry'];const e=[],sh=d.sheet||{};
 if(!has(d.frame,['w','h']))e.push(p+'ต้องมี frame.w,h');if(!has(d.anchor,['x','y']))e.push(p+'ต้องมี anchor.x,y (จุดเท้า)');
 if(!has(d.bbox,['x','y','w','h']))e.push(p+'ต้องมี bbox x,y,w,h');
 else if(has(d.frame,['w','h'])&&has(d.anchor,['x','y'])){const b=d.bbox;if(b.x<0||b.y<0||b.x+b.w>d.frame.w||b.y+b.h>d.frame.h)e.push(p+'bbox อยู่นอกเฟรม');
  // view วางเฟรมด้วย anchor · runtime ชนด้วย bbox: สองอย่างต้องชี้จุดเท้าเดียวกัน ไม่งั้นภาพกับกล่องชนเหลื่อมกัน
  if(Math.abs(b.x+b.w/2-d.anchor.x)>1||b.y+b.h!==d.anchor.y+1)e.push(p+'anchor ไม่ตรงกับกึ่งกลางล่างของ bbox')}
 for(const k of need){const a=(d.anims||{})[k];if(!a||!(a.frames>=1&&a.fps>0&&num(a.row))){e.push(p+'ขาดท่า '+k);continue}
  if(sh.cols&&a.frames>sh.cols)e.push(p+k+' มีเฟรมเกินจำนวนคอลัมน์ของแผ่น');if(sh.rows&&a.row>=sh.rows)e.push(p+k+' อยู่นอกจำนวนแถวของแผ่น');
  if(k==='attack'&&need===NEED.player&&!(Array.isArray(a.hit)&&a.hit[0]>=0&&a.hit[1]>=a.hit[0]&&a.hit[1]<a.frames))e.push(p+'attack ต้องมี hit [เฟรมเริ่ม,เฟรมจบ]')}
 return e}
// ---- ตรวจข้อมูล areas ตอนลงทะเบียนโลก ----
function validateAreas(def,assets){const d=def.data||{},e=[],ns=def.assetNs,locs=new Set((d.locations||[]).map(l=>l.id)),en=new Set((d.enemies||[]).map(x=>x.id)),ev=new Set((d.events||[]).map(x=>def.id+'.'+x.id)),
  np=new Set((d.npcs||[]).map(x=>x.id)),withArea=new Set((d.areas||[]).map(a=>a.loc)),seen=new Set(),sprites=new Map();
 const rect=(r,p,need=['x','y','w','h'])=>{if(!has(r,need))e.push(p+'ต้องมี '+need.join(',')+' เป็นตัวเลข')};
 for(const a of d.areas||[]){const p='area '+a.id+': ';if(!locs.has(a.loc))e.push(p+'ไม่มีสถานที่ '+a.loc);if(seen.has(a.loc))e.push(p+'สถานที่ '+a.loc+' มีหลาย area');seen.add(a.loc);
  if(!(num(a.width)&&a.width>=576&&num(a.height)&&a.height>=324))e.push(p+'width>=576 height>=324');if(!(a.spawn&&num(a.spawn.x)))e.push(p+'ต้องมี spawn.x');
  (a.solids||[]).forEach(r=>rect(r,p+'solid '));(a.platforms||[]).forEach(r=>rect(r,p+'platform ',['x','y','w']));if(!(a.solids||[]).length)e.push(p+'ต้องมีพื้นอย่างน้อยหนึ่งชิ้น');
  for(const x of a.doors||[]){if(!num(x.x))e.push(p+'ประตูต้องมี x');if(!locs.has(x.to))e.push(p+'ประตูไปสถานที่ที่ไม่มี '+x.to);else if(!withArea.has(x.to))e.push(p+'ประตูไป '+x.to+' ซึ่งยังไม่มี area');
   else if(x.arrive&&!(((d.areas.find(b=>b.loc===x.to)||{}).arrivals||{})[x.arrive]))e.push(p+'ประตูไป '+x.to+' ไม่มีจุดมาถึง '+x.arrive)}
  for(const s of a.spawns||[]){if(!en.has(s.enemy))e.push(p+'ไม่มีศัตรู '+s.enemy);if(!(num(s.x1)&&num(s.x2)&&s.x2>s.x1))e.push(p+'spawn x1<x2');e.push(...R().validateEffects(s.reward).map(y=>p+'reward: '+y));
   if(typeof s.sprite!=='string')e.push(p+'spawn ต้องระบุ sprite');else sprites.set(ns+'.'+s.sprite,NEED.foe)}
  // เหตุการณ์จากการคุยมีเจ้าของเป็น NPC รายตัว: {npc,event}
  for(const t of a.talkEvents||[]){if(!t||!np.has(t.npc))e.push(p+'talkEvents: ไม่มี NPC '+(t&&t.npc));if(!t||!ev.has(t.event))e.push(p+'ไม่มีเหตุการณ์ '+(t&&t.event))}
  if((a.npcSpots||[]).some(s=>!num(s.x)))e.push(p+'npcSpots ต้องมี x');
  for(const g of['m','f']){sprites.set(SPRITE.player(g),NEED.player);sprites.set(SPRITE.npc(ns,g),NEED.npc)}
  if(assets){for(const k of a.layers||[])if(!assets.defs.has(ns+'.'+k))e.push(p+'ไม่มี asset '+ns+'.'+k);
   const t=assets.defs.get(ns+'.'+a.tileset);if(!t)e.push(p+'ไม่มี asset '+ns+'.'+a.tileset);else if(!(has(t.tile,['w','h'])&&has(t.tiles,['top','fill','platform'])))e.push(p+'tileset '+t.id+' ต้องมี tile.w,h และ tiles.top,fill,platform')}}
 if(assets)for(const[id,need]of sprites)e.push(...validateSprite(assets.defs.get(id),need,id));
 return e}
function install(E){if(E.sv)return E.sv;E.state.register('scene',OWNER,()=>({_v:VERSION,area:null,x:null,facing:1,resolved:[]}));E.worlds.addValidator(def=>validateAreas(def,E.assets));
 const api=E.sv={get:()=>E.state.get('scene'),_m:fn=>E.state.mutate(OWNER,'scene',fn),area:(w,loc)=>{const c=E.worlds.ctx(w);return c?[...c.list('areas').values()].find(a=>a.loc===loc)||null:null},runtime:null};
 // state ถูกแทนที่ทั้งก้อน (โหลดเซฟ/เกมใหม่): ยกเลิก runtime ที่ค้างโดยไม่เขียนอะไร และปล่อย pause ของตัวเอง
 const drop=()=>{if(api.runtime)api.runtime.abort()};
 // หลังโหลด: พื้นที่ในเซฟไม่ตรงกับสถานที่ของผู้เล่น = ล้างตำแหน่ง (ผู้เล่นไปยืนจุดเกิด)
 E.bus.on('game:loaded',()=>{drop();const s=api.get(),p=E.player.get(),a=p.created&&api.area(p.location.world,p.location.loc);if(s.area&&(!a||a.id!==s.area))api._m(x=>{x.area=null;x.x=null})},{prio:75,owner:OWNER});
 E.bus.on('game:new',drop,{owner:OWNER});
 return api}
// ---- runtime หนึ่งครั้งที่อยู่ในโหมดสำรวจ ----
class Explore{
 constructor(E){this.E=E;this.t=0;this.msg=[];this.blocked=false;this.active=false;this.dmg=0;this.talk=null;this.atk=ATTACK;this.view={w:576,h:324}}
 // ขนาดมุมกล้อง (หน่วยพิกเซลโลก) · view ปรับได้ เช่นมือถือแนวตั้งใช้มุมแคบลงแต่ขยายใหญ่ขึ้น · เปลี่ยนแล้วกล้องจัดผู้เล่นไว้กลางจอ
 setView(w,h=324){this.view={w,h};if(this.me)this.cam=AW.sv.camera({x:this.me.x+this.me.w/2-w/2},this.me,this.world,this.view);return this}
 // HP ที่แสดง = HP จริงของผู้เล่น - ความเสียหายในฉากที่ยังไม่ปิดยอด · เหตุการณ์/ระบบอื่นเปลี่ยน player.hp ได้โดยไม่ถูกเขียนทับ
 get hp(){return this.E.player.get().hp-this.dmg}
 set hp(v){this.dmg=this.E.player.get().hp-v}
 get maxHp(){return this.E.player.maxHp()}
 enter(){const E=this.E,p=E.player.get();if(this.active||E.sv.runtime)throw new Error('กำลังสำรวจอยู่แล้ว');if(!p.created||!p.alive)throw new Error('ยังไม่มีตัวละครที่มีชีวิต');
  if(!E.sv.area(p.location.world,p.location.loc))throw new Error('สถานที่นี้ยังไม่มีฉาก side-view');
  E.loop.pause(PAUSE);this.active=true;E.sv.runtime=this;try{this.load()}catch(err){this.abort();throw err}return this}
 // ปล่อย pause ของตัวเองครั้งเดียว (เรียกซ้ำไม่มีผล) · ไม่ resume ถ้าไม่ใช่ runtime ที่ถือ pause อยู่
 _release(){if(!this.active)return false;this.active=false;if(this.E.sv.runtime===this){this.E.sv.runtime=null;this.E.loop.resume(PAUSE)}return true}
 exit(){if(!this.active)return false;if(this.E.player.get().alive){this.settle('retreat');this.flush()}return this._release()}
 abort(){this.dmg=0;return this._release()}
 // โหลดพื้นที่ของสถานที่ปัจจุบัน · arrive = ชื่อจุดมาถึงจากประตู
 load(arrive){const E=this.E,p=E.player.get(),w=p.location.world,a=E.sv.area(w,p.location.loc);if(!a)throw new Error('สถานที่นี้ยังไม่มีฉาก side-view');
  this.w=w;this.a=a;this.ns=E.worlds.ctx(w).def.assetNs;this.world={width:a.width,height:a.height,solids:a.solids,platforms:a.platforms||[]};this.dmg=0;const s=E.sv.get();
  const x=arrive&&a.arrivals&&a.arrivals[arrive]?a.arrivals[arrive].x:s.area===a.id&&num(s.x)?s.x:a.spawn.x,sprite=SPRITE.player(p.gender),box=this.box(sprite);
  this.me=Object.assign({sprite,x,y:this.groundY(x,box)-box.h,vx:0,vy:0,ground:true,facing:s.area===a.id?s.facing||1:1,attack:0,swing:0,hurt:0,inv:0,cd:0,dead:false,hit:new Set()},box);
  // จังหวะโจมตีมาจาก metadata ของท่า attack: ยาว frames/fps วินาที · โดนในช่วงเฟรม hit
  const an=((E.assets.defs.get(sprite)||{}).anims||{}).attack;this.atk=an&&an.hit?{dur:an.frames/an.fps,t0:an.hit[0]/an.fps,t1:(an.hit[1]+1)/an.fps}:ATTACK;
  this.rng=new AW.core.Rng(E.state.get('meta').seed+'|sv|'+a.id+'|'+E.loop.month);
  this.cam=AW.sv.camera({x:Math.max(0,x-this.view.w/2)},this.me,this.world,this.view);this.placeNpcs();this.spawn();
  if(s.area!==a.id||arrive)this.flush(true);return this}
 // กล่องชนมาจาก bbox ใน metadata ของ sprite (แยกจากขนาดภาพ)
 box(id){const d=this.E.assets.defs.get(id);return d&&has(d.bbox,['w','h'])?{w:d.bbox.w,h:d.bbox.h}:{w:BODY.w,h:BODY.h}}
 groundY(x,b){let y=this.world.height;for(const s of this.world.solids)if(x+b.w>s.x&&x<s.x+s.w&&s.y<y)y=s.y;return y}
 // NPC ตามตารางเวลาจริง: ทุกคนที่อยู่สถานที่นี้ตอนนี้ (ช่วงเวลาตาม AP) · เจ้าของเหตุการณ์คุยได้จุดยืนที่ออกแบบไว้ก่อน ที่เหลือกระจายตามความกว้างโดยเว้นประตู
 placeNpcs(){const E=this.E,a=this.a;this._ap=E.player.get().ap;const own=new Set((a.talkEvents||[]).map(t=>this.w+'.'+t.npc)),here=E.npcs.at(this.w,a.loc).filter(n=>n.alive),
   list=here.filter(n=>own.has(n.id)).concat(here.filter(n=>!own.has(n.id))),spots=(a.npcSpots||[]).map(s=>s.x),free=[];
  for(let x=80;x<=a.width-80;x+=36)if(!a.doors.some(d=>Math.abs(d.x-x)<REACH+16)&&!spots.some(s=>Math.abs(s-x)<30))free.push(x);
  const extra=Math.max(0,list.length-spots.length);
  this.npcs=list.map((n,i)=>{const j=i-spots.length,x=j<0?spots[i]:free.length?free[Math.floor((j+0.5)*free.length/extra)]:a.spawn.x,sprite=SPRITE.npc(this.ns,n.gender),b=this.box(sprite);
   return{id:n.id,name:n.name,gender:n.gender,sprite,x,y:this.groundY(x,b)-b.h,w:b.w,h:b.h,facing:-1}})}
 key(sp){return this.a.id+'|'+this.E.loop.month+'|'+sp.id}
 spawn(){const E=this.E,done=new Set(E.sv.get().resolved);this.foes=(this.a.spawns||[]).filter(sp=>!done.has(this.key(sp))).map(sp=>{const e=E.combat.enemy(this.w,sp.enemy),hp=Math.round(e.hp||e.power*3),sprite=this.ns+'.'+sp.sprite,b=this.box(sprite),x=(sp.x1+sp.x2)/2;
  return Object.assign({sp,sprite,key:this.key(sp),name:e.name,power:e.power,armor:e.armor||0,hp,max:hp,x,y:this.groundY(x,b)-b.h,vx:0,vy:0,ground:true,dir:1,state:'patrol',wind:0,cd:0,hurt:0,dead:false,engaged:false},b)})}
 // ---- หนึ่ง fixed step ----
 step(inp={}){const E=this.E;this.t++;
  // หยุดระหว่างมีเหตุการณ์ค้าง การต่อสู้แบบเลือกท่า หรือ UI เปิดหน้าต่างทับ
  if(!this.active||E.events.pending()||E.combat.session()||this.blocked||!E.player.get().alive)return 'blocked';
  if(E.player.get().ap!==this._ap)this.placeNpcs();
  const K=AW.sv.K,me=this.me,A=this.atk;Object.assign(me,AW.sv.step(me,inp,this.world));
  if(me.fell){me.fell=false;me.x=this.a.spawn.x;me.y=this.groundY(me.x,me)-me.h;me.vy=0}
  for(const k of['attack','hurt','inv','cd'])me[k]=Math.max(0,me[k]-K.dt);if(me.attack>0)me.swing++;
  if(inp.attackPressed&&me.cd<=0&&!me.hurt){me.attack=A.dur;me.cd=A.dur+0.1;me.swing=0;me.hit=new Set()}
  if(this.swinging()){const box={x:me.facing>0?me.x+me.w:me.x-34,y:me.y+8,w:34,h:28};for(const f of this.foes)if(!f.dead&&!me.hit.has(f.key)&&AW.sv.overlap(box,f)){me.hit.add(f.key);this.hitFoe(f)}}
  const can=!this.fightWhy();for(const f of this.foes)this.foeAI(f,can);
  this.foes=this.foes.filter(f=>!(f.dead&&f.hurt<=0));
  this.cam=AW.sv.camera(this.cam,me,this.world,this.view);
  if(inp.interactPressed)return this.interact();
  return 'ok'}
 // อยู่ในช่วงเฟรมที่ท่าโจมตีโดนเป้า (นับเป็นจำนวน step เต็ม ไม่สะสมทศนิยม)
 swinging(){const me=this.me,el=me.swing/HZ;return me.attack>0&&el>=this.atk.t0&&el<this.atk.t1}
 // ---- กติกาเริ่มศึกและรับรางวัล ----
 // เริ่มศึกได้เมื่อ (เหมือนภารกิจ): ยังมีชีวิต · ไม่บาดเจ็บหนัก (injury < 2) · มี AP >= 1
 // ศึกเริ่มเมื่อฝ่ายใดฝ่ายหนึ่งตีโดนครั้งแรก = จ่าย 1 AP ต่อศัตรูหนึ่งตัว · เริ่มไม่ได้ = ศัตรูไม่ไล่ ตีไม่เข้า ไม่เสีย AP ไม่ได้รางวัล
 // รางวัล: เฉพาะศัตรูที่เริ่มศึกแล้ว (จ่าย AP แล้ว) และครั้งเดียวต่อจุดเกิดต่อเดือน · ถอยหรือแพ้ = AP ที่จ่ายไปไม่คืน
 fightWhy(){const p=this.E.player.get();return !p.alive?'เสียชีวิตแล้ว':p.injury>=2?'บาดเจ็บหนัก ต้องพักก่อน':p.ap<1?'แรงไม่พอเดือนนี้ (AP)':''}
 engage(f){if(f.engaged)return true;const why=this.fightWhy();if(why){this.say('ต่อสู้ไม่ได้: '+why);return false}this.E.player.spendAp(1);f.engaged=true;this.say(`เริ่มปะทะ${f.name} (AP -1)`);return true}
 // สูตรความเสียหายเดียวกับการต่อสู้แบบเลือกท่า (combat.js): ผู้เล่นตี = HP สูงสุดศัตรู x 0.22 x (พลังเรา/พลังศัตรู)^0.8 · ศัตรูตี = HP เรา x 0.18 x (พลังศัตรู/พลังเรา)^0.8
 power(){return this.E.combat.profile(this.w).power}
 hitFoe(f){if(!this.engage(f))return;const d=Math.max(1,Math.round(f.max*0.22*Math.pow(this.power()/Math.max(1,f.power),0.8)*(0.85+this.rng.next()*0.3)*(1-f.armor)));
  f.hp=Math.max(0,f.hp-d);f.hurt=0.2;f.vx=this.me.facing*120;this.say(`${f.name} -${d}`);if(f.hp<=0)this.kill(f)}
 foeAI(f,can){const K=AW.sv.K,me=this.me;f.hurt=Math.max(0,f.hurt-K.dt);f.cd=Math.max(0,f.cd-K.dt);let dir=0;FOE_K.speed=PATROL;
  if(!f.dead){const dx=(me.x+me.w/2)-(f.x+f.w/2),near=(f.engaged||can)&&Math.abs(dx)<160&&Math.abs(me.y-f.y)<80;
   if(f.wind>0){f.wind-=K.dt;if(f.wind<=0){const box={x:f.dir>0?f.x+f.w:f.x-30,y:f.y,w:30,h:f.h};if(AW.sv.overlap(box,me)&&me.inv<=0&&this.engage(f))this.hurtMe(f);f.cd=1.1}}
   else if(f.hurt>0){}// กระเด็น: ไม่เดิน ปล่อยให้แรงเสียดทานหยุด
   else if(near){f.dir=Math.sign(dx)||f.dir;if(Math.abs(dx)<40&&f.cd<=0){f.wind=0.5;f.state='windup'}else{dir=f.dir;FOE_K.speed=CHASE;f.state='chase'}}
   else{f.state='patrol';if(f.x<=f.sp.x1)f.dir=1;else if(f.x>=f.sp.x2)f.dir=-1;dir=f.dir}}
  const x0=f.x;Object.assign(f,AW.sv.step(f,{left:dir<0,right:dir>0},this.world,FOE_K));
  if(dir&&f.state==='patrol'&&Math.abs(f.x-x0)<0.01)f.dir=-dir}// ชนสิ่งกีดขวางระหว่างเดินตรวจ: กลับตัว
 hurtMe(f){const d=Math.max(1,Math.round(this.maxHp*0.18*Math.pow(f.power/Math.max(1,this.power()),0.8)*(0.85+this.rng.next()*0.3)));this.dmg+=d;this.me.hurt=0.3;this.me.inv=0.8;this.me.vx=f.dir*160;this.me.vy=-160;this.say(`โดน ${f.name} -${d}`);
  if(this.hp<=0)this.lose(f)}
 // ---- ผลการต่อสู้ผ่าน combat.apply (API เดิม) ครั้งเดียวต่อเหตุการณ์ · กฎความตายเดิม: ความเสี่ยงปกติไม่ตาย ----
 report(outcome,f,extra={}){return Object.assign({mode:'action',source:{kind:'sideview',area:this.a.id,key:f?f.key:null},win:outcome==='win',outcome,risk:'normal',enemy:f?f.sp.enemy:null,enemyName:f?f.name:'',
  hpAfter:Math.max(1,Math.round(this.hp)),injury:0,critical:false,dead:false,party:[],skillUse:{},lines:this.msg.slice(-6)},extra)}
 // ส่งรายงานเข้าระบบเดิม: ล้างยอด dmg ก่อน เพราะ combat.apply เป็นผู้ตั้ง player.hp = hpAfter
 _apply(rep){this.dmg=0;return this.E.combat.apply(rep)}
 kill(f){const E=this.E,m=E.loop.month;f.dead=true;f.hurt=0.4;
  // บันทึกว่าปราบแล้วก่อนให้รางวัล: โหลดเซฟ/กลับเข้าพื้นที่ไม่ได้รางวัลซ้ำ · key ของเดือนก่อน ๆ ไม่มีผลแล้ว ตัดทิ้ง
  E.sv._m(s=>{s.resolved=s.resolved.filter(k=>+k.split('|')[1]===m).concat(f.key)});
  this._apply(this.report('win',f,{injury:this.hp<this.maxHp*0.25?1:0}));const run=()=>R().apply(f.sp.reward||[],E.view(this.w)),lines=E.economy?E.economy.as('sideview',run):run();
  this.say(`ปราบ${f.name}แล้ว`+(lines.length?' ('+lines.join(', ')+')':''));E.events.log(`สู้กับ${f.name}ที่${this.a.name}: ชนะ`)}
 lose(f){const E=this.E;this._apply(this.report('lose',f,{hpAfter:1,injury:3}));this.say('ท่านล้มลง ต้องถอยออกมาพักฟื้น');E.events.log(`สู้กับ${f.name}ที่${this.a.name}: แพ้ (บาดเจ็บ)`);
  const sp=this.a.spawn.x;Object.assign(this.me,{x:sp,y:this.groundY(sp,this.me)-this.me.h,vx:0,vy:0,inv:2});for(const g of this.foes){g.hp=g.max;g.wind=0;g.engaged=false}}
 // มีความเสียหายจากศึกค้างอยู่ (โดนตีแล้วยังไม่จบศึก) = บันทึกเป็นการถอยหนีครั้งเดียว ก่อนเปลี่ยนพื้นที่/เซฟ/ออก
 // ไม่มีความเสียหายค้าง หรือผู้เล่นตายแล้ว = ไม่ส่งอะไร (ไม่มี combat:done ที่ไม่ได้มาจากศึกจริง)
 settle(outcome='retreat'){if(this.dmg<=0||!this.E.player.get().alive){this.dmg=0;return false}this._apply(this.report(outcome,null));return true}
 flush(force){const s=this.E.sv.get(),x=Math.round(this.me.x),f=this.me.facing;if(!force&&s.area===this.a.id&&s.x===x&&s.facing===f)return false;this.E.sv._m(z=>{z.area=this.a.id;z.x=x;z.facing=f});return true}
 say(t){this.msg.push(t);if(this.msg.length>30)this.msg.shift()}
 // ---- ปฏิสัมพันธ์ (กด E): ประตูก่อน ไม่งั้น NPC ที่ใกล้ที่สุด ----
 nearby(){const me=this.me,cx=me.x+me.w/2,d=this.a.doors.find(x=>Math.abs(x.x-cx)<REACH);if(d)return{kind:'door',door:d,label:d.label};
  let n=null,best=REACH;for(const x of this.npcs){const dist=Math.abs(x.x+x.w/2-cx);if(dist<best){best=dist;n=x}}return n?{kind:'npc',npc:n.id,label:'คุยกับ'+n.name}:null}
 interact(){const t=this.nearby();if(!t)return 'none';if(t.kind==='door')return this.useDoor(t.door);this.talk=t.npc;return 'talk'}
 // ตัวเลือกคุยกับ NPC: การกระทำความสัมพันธ์จริง + เหตุการณ์ที่ NPC คนนี้เป็นเจ้าของและเข้าเงื่อนไขตอนนี้
 talkOptions(q=this.talk){const E=this.E;if(!q)return[];const opts=E.rels.actions(q).map(a=>({kind:'rel',id:a.id,name:a.name,why:a.why||''}));
  for(const t of this.a.talkEvents||[])if(this.w+'.'+t.npc===q&&E.events.eligible(t.event))opts.push({kind:'event',id:t.event,name:E.events.def(t.event).title,why:''});return opts}
 choose(opt,q=this.talk){const E=this.E;this.talk=null;if(!this.npcs.some(n=>n.id===q))throw new Error('คนนี้ไม่ได้อยู่ที่นี่');
  const o=this.talkOptions(q).find(x=>x.kind===opt.kind&&x.id===opt.id);if(!o)throw new Error('ตัวเลือกนี้ใช้กับคนนี้ไม่ได้');
  return o.kind==='rel'?E.rels.interact(q,o.id):E.events.present(o.id,q)}
 // ประตู: ไปได้เฉพาะสถานที่ที่มี area และผ่านเงื่อนไขเข้าสถานที่เดิม · ตรวจก่อน แล้วจึงปิดยอดและย้าย
 useDoor(d){const E=this.E,l=E.worlds.ctx(this.w).locations.get(d.to),no=m=>{this.say(m);return 'locked:'+m};
  if(!l||!E.sv.area(this.w,d.to))return no('ยังไม่มีฉากของสถานที่นั้น');if(!E.player.canEnter(d.to))return no('ยังเข้า'+l.name+'ไม่ได้');
  this.settle('retreat');this.flush();try{E.player.moveTo(d.to)}catch(e){return no(e.message)}
  this.load(d.arrive);return 'door'}
}
SV.validateAreas=validateAreas;SV.validateSprite=validateSprite;SV.install=install;SV.Explore=Explore;SV.BODY=BODY;SV.SPRITE=SPRITE;SV.NEED=NEED;
})(globalThis.AW);
