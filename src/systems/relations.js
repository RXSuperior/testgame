// Relationship System: ความสัมพันธ์แบบมีทิศทาง ('a>b' คือสิ่งที่ a รู้สึกต่อ b) จึงไม่จำเป็นต้องเท่ากันสองฝ่าย
// ฝั่งผู้เล่นใช้ id 'player' · ค่า: aff (ชอบ) trust (ไว้ใจ) resp (นับถือ) fam (คุ้นเคย) romance · bond: family|spouse
// ประเภท (คนรู้จัก เพื่อน ... คู่ครอง) คำนวณจากค่าและ bond ไม่เก็บซ้ำ · ประวัติเก็บล่าสุด 12 รายการต่อคู่
// แนวคิดจาก rel12.js (นิสัยหลัก, เคมี, ความไว้ใจ/นับถือ, การกระทำเดือนละครั้งต่อคน) เขียนใหม่ทั้งหมด
// slice 'rels' เจ้าของ 'rels' · ดู docs/phase4/RELATIONSHIP_SYSTEM_DESIGN.md
(function(AW){
'use strict';
const OWNER='rels',VERSION=1,PLAYER='player',TYPES=['acquaintance','friend','close_friend','best_friend','rival','enemy','romantic','family','spouse'];
const TYPE_NAME={acquaintance:'คนรู้จัก',friend:'เพื่อน',close_friend:'เพื่อนสนิท',best_friend:'เพื่อนรักที่สุด',rival:'คู่แข่ง',enemy:'ศัตรู',romantic:'คนที่มีใจให้',family:'ครอบครัว',spouse:'คู่ครอง'};
const clamp=v=>Math.max(-100,Math.min(100,Math.round(v)));
const key=(a,b)=>a+'>'+b;
const T=id=>(AW.data.shared.tempers||[]).find(t=>t.id===id)||{};
const pairIn=(list,a,b)=>list.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
class RelationSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,e:{}}));
  E.bus.on('game:loaded',()=>this._afterLoad(),{prio:80,owner:OWNER});
  E.bus.on('npc:died',({id})=>this._died(id),{prio:0,owner:OWNER})}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 _valid(id){return id===PLAYER||this.E.npcs.exists(id)}
 _need(a,b){for(const x of[a,b])if(!this._valid(x))throw new Error('ไม่มีตัวละคร '+x);if(a===b)throw new Error('ความสัมพันธ์กับตัวเองไม่ได้')}
 edge(a,b){return this.E.state.get(OWNER).e[key(a,b)]||null}
 blank(o={}){return Object.assign({aff:0,trust:0,resp:0,fam:0,romance:0,bond:null,hist:[],last:null,flags:{}},o)}
 ensure(a,b,init){this._need(a,b);if(!this.edge(a,b))this._m(s=>{s.e[key(a,b)]=this.blank(init)});return this.edge(a,b)}
 // เปลี่ยนค่า (สร้างคู่ถ้ายังไม่มี) · note ลงประวัติ
 change(a,b,d,note){this.ensure(a,b);const m=this.E.loop.month;this._m(s=>{const x=s.e[key(a,b)];for(const k of['aff','trust','resp','fam'])if(d[k])x[k]=clamp(x[k]+d[k]);
  if(d.romance)x.romance=Math.max(0,Math.round((x.romance+d.romance)*10)/10);if(note){x.hist.unshift({m,t:note});if(x.hist.length>12)x.hist.length=12}});return this.edge(a,b)}
 setBond(a,b,bond,{mutual=true}={}){this.ensure(a,b);if(mutual)this.ensure(b,a);this._m(s=>{s.e[key(a,b)].bond=bond;if(mutual)s.e[key(b,a)].bond=bond})}
 setFlag(a,b,f,on=true){this.ensure(a,b);this._m(s=>{if(on)s.e[key(a,b)].flags[f]=true;else delete s.e[key(a,b)].flags[f]})}
 // ประเภทจากมุมของ a ต่อ b
 type(a,b){const x=this.edge(a,b);if(!x)return null;if(x.bond==='spouse')return'spouse';if(x.bond==='family')return'family';
  if(x.flags.enemy||x.aff<=-60)return'enemy';if(x.romance>=1&&x.aff>=30)return'romantic';if(x.aff<=-25)return'rival';
  if(x.aff>=80&&x.fam>=60)return'best_friend';if(x.aff>=55)return'close_friend';if(x.aff>=25)return'friend';return'acquaintance'}
 typeName(t){return TYPE_NAME[t]||t}
 list(id,{dir='out'}={}){const e=this.E.state.get(OWNER).e,out=[];for(const k of Object.keys(e)){const[a,b]=k.split('>');if(dir==='out'&&a===id)out.push({to:b,...e[k]});if(dir==='in'&&b===id)out.push({from:a,...e[k]})}return out}
 // เคมี -1..1 จากแกนนิสัย (ใกล้กัน=เข้ากัน) และคู่นิสัยหลัก (ดี +0.4 แย่ -0.4)
 chemistry(a,b){const t=id=>id===PLAYER?{traits:this.E.player.get().traits,temper:null}:this.E.npcs.get(id);const x=t(a),y=t(b);if(!x||!y)return 0;
  let d=0;for(const k of AW.systems.TRAITS)d+=Math.abs((x.traits[k]||0)-(y.traits[k]||0));let c=1-d/400;
  const P=AW.data.shared.temperPairs||{good:[],bad:[]};if(x.temper&&y.temper){if(pairIn(P.good,x.temper,y.temper))c+=0.4;if(pairIn(P.bad,x.temper,y.temper))c-=0.4}return Math.max(-1,Math.min(1,c))}
 // ความรู้สึกแรกพบของ NPC ต่อผู้เล่น: นิสัยหลัก + เคมี + กรรม (ใจดีชอบกรรมดี โลภ/ใจร้อนกลับกัน) · อาจติดลบได้
 firstImpression(npc){const n=this.E.npcs.get(npc),p=this.E.player.get(),t=T(n.temper);return clamp((t.first||0)+this.chemistry(npc,PLAYER)*15+(t.karmaLike||0)*p.karma/5+(n.traits.kind||0)/20)}
 meet(npc,{aff}={}){if(this.edge(npc,PLAYER))return false;const a=aff??this.firstImpression(npc);this.ensure(npc,PLAYER,{aff:a,fam:5});this.ensure(PLAYER,npc,{aff:Math.max(0,a),fam:5});return true}
 // ---- การกระทำของผู้เล่น (เดือนละครั้งต่อคน) ----
 actions(npc){const n=this.E.npcs.get(npc),p=this.E.player.get();if(!n||!n.alive||!p.alive)return[];const x=this.edge(npc,PLAYER),me=p.age/12,them=this.E.npcs.ageY(npc);
  const done=x&&x.last===this.E.loop.month,fam=x&&x.bond,sp=this.E.family&&this.E.family.get().spouse,adult=me>=18&&them>=18;
  const out=[{id:'talk',name:'คุย'},{id:'gift',name:'ให้ของขวัญ (30)',why:p.money<30?'เงินไม่พอ':''}];
  if(!fam&&adult&&!sp&&x&&x.aff>=25)out.push({id:'confess',name:'สารภาพความในใจ',why:x.romance>=1?'อีกฝ่ายรู้ใจแล้ว':''});
  if(!fam&&adult&&!sp&&x&&x.romance>=1)out.push({id:'propose',name:'ขอแต่งงาน',why:x.aff<60?'ยังไม่สนิทพอ (60)':x.trust<30?'ยังไม่ไว้ใจพอ (30)':p.money<500?'เงินไม่พอจัดงาน (500)':''});
  if(x&&x.aff<-10)out.push({id:'apologize',name:'ขอคืนดี (50)',why:p.money<50?'เงินไม่พอ':''});
  return out.map(a=>Object.assign({why:''},a,done?{why:'เดือนนี้พบกันแล้ว'}:{}))}
 interact(npc,act){const a=this.actions(npc).find(x=>x.id===act);if(!a)throw new Error('ทำไม่ได้: '+act);if(a.why)throw new Error(a.why);
  const n=this.E.npcs.get(npc),t=T(n.temper),P=this.E.player,p=P.get(),rng=this.E.rng,chem=this.chemistry(npc,PLAYER);this.meet(npc);let ok=true,text='';
  if(act==='talk'){const g=2+rng.int(0,2)+Math.round(p.stats.cha/40)+(t.talk||0);this.change(npc,PLAYER,{aff:g,trust:1,fam:4},'นั่งคุยกัน');this.change(PLAYER,npc,{fam:4});
   if(this.edge(npc,PLAYER).romance>0&&chem>0)this.change(npc,PLAYER,{romance:0.3*chem});text=`ท่านนั่งคุยกับ${n.name}อยู่นาน`}
  if(act==='gift'){P.addMoney(-30);const g=Math.round((5+rng.int(0,4))*(t.gift||1));this.change(npc,PLAYER,{aff:g,trust:2},'ได้รับของขวัญ');text=`${n.name}รับของขวัญไว้ด้วยรอยยิ้ม`}
  if(act==='confess'){const x=this.edge(npc,PLAYER),odds=Math.max(0.05,Math.min(0.95,0.05+x.aff/150+chem*0.3+x.trust/400));ok=rng.next()<odds;
   if(ok){this.change(npc,PLAYER,{romance:1,aff:5},'ตอบรับคำสารภาพ');this.change(PLAYER,npc,{romance:1});text=`${n.name}หน้าแดง แล้วพยักหน้าเบา ๆ`}
   else{this.change(npc,PLAYER,{aff:-5},'ปฏิเสธคำสารภาพ');text=`${n.name}ขอโทษ แล้วบอกว่าเห็นท่านเป็นแค่เพื่อน`}}
  if(act==='propose'){const x=this.edge(npc,PLAYER),odds=Math.max(0.05,Math.min(0.95,0.25+x.aff/150+x.romance*0.1+x.trust/300));ok=rng.next()<odds;
   if(ok){P.addMoney(-500);this.E.family.marry(npc);text=`${n.name}น้ำตาคลอแล้วตอบตกลง งานแต่งจัดขึ้นในเดือนนั้น`}else{this.change(npc,PLAYER,{aff:-8},'ปฏิเสธคำขอแต่งงาน');text=`${n.name}บอกว่ายังไม่พร้อม`}}
  if(act==='apologize'){P.addMoney(-50);ok=rng.next()<0.35+p.stats.cha/200+(t.trust>0?0.1:0);this.change(npc,PLAYER,ok?{aff:25}:{aff:-3},ok?'ยอมคืนดี':'ไม่ยอมคืนดี');text=ok?`${n.name}ยอมจับมือคืนดี`:`${n.name}ยังไม่ยอมให้อภัย`}
  this._m(s=>{s.e[key(npc,PLAYER)].last=this.E.loop.month});this.E.npcs.remember(npc,text,act);
  this.E.events&&this.E.events.log(text);return{title:a.name+' · '+n.name,choice:a.name,success:ok,text,effects:[]}}
 // ---- NPC กับ NPC ----
 // เดือนละครั้งในโลกที่ผู้เล่นอยู่: คนที่อยู่ที่เดียวกันมีโอกาสรู้จักกัน · คู่ที่รู้จักแล้วความชอบเลื่อนตามเคมี · คนที่ไม่ได้พบผู้เล่นนานความคุ้นเคยลดลง
 socialize(w,clk){const N=this.E.npcs,alive=N.all(w).filter(n=>n.alive),by={};for(const n of alive){const at=N.where(n,clk);if(at)(by[at]=by[at]||[]).push(n.id)}
  const rng=this.E.rng,adds=[];for(const ids of Object.values(by))if(ids.length>1&&rng.next()<Math.min(0.6,ids.length*0.05)){const a=ids[rng.int(0,ids.length-1)],b=ids[rng.int(0,ids.length-1)];if(a!==b&&!this.edge(a,b))adds.push([a,b])}
  const wset=new Set(alive.map(n=>n.id)),m=this.E.loop.month;
  this._m(s=>{for(const[a,b]of adds){const c=this.chemistry(a,b);s.e[key(a,b)]=this.blank({aff:clamp(c*20),fam:5});s.e[key(b,a)]=this.blank({aff:clamp(c*20+rng.int(-10,10)),fam:5})}
   for(const k of Object.keys(s.e)){const[a,b]=k.split('>'),x=s.e[k];if(!wset.has(a))continue;
    if(b===PLAYER){if(x.last===null||m-x.last>3)x.fam=Math.max(0,x.fam-1)}
    else if(wset.has(b)&&!x.bond&&x.fam>0){const c=this.chemistry(a,b);if(Math.abs(c)>0.2)x.aff=clamp(x.aff+Math.sign(c))}}})}
 _died(id){if(this.edge(id,PLAYER))this._m(s=>{s.e[key(PLAYER,id)]&&s.e[key(PLAYER,id)].hist.unshift({m:this.E.loop.month,t:'จากไปแล้ว'})})}
 // หลังโหลด: รับความสัมพันธ์เก่าจาก Player v1 และตัดคู่ที่อ้างตัวละครที่ไม่มีอยู่ (orphan)
 _afterLoad(){const leg=this.E.player.legacyRelations;if(leg){for(const q of Object.keys(leg))if(this.E.npcs.exists(q)){this.ensure(q,PLAYER,{aff:leg[q],fam:Math.min(60,Math.abs(leg[q]))});this.ensure(PLAYER,q,{fam:Math.min(60,Math.abs(leg[q]))})}this.E.player.legacyRelations=null}
  const e=this.E.state.get(OWNER).e,bad=Object.keys(e).filter(k=>{const[a,b]=k.split('>');const w=x=>x===PLAYER?null:x.split('.')[0];
   return[a,b].some(x=>x!==PLAYER&&this.E.worlds.has(w(x))&&!this.E.npcs.exists(x))});
  if(bad.length){this._m(s=>{for(const k of bad)delete s.e[k]});this.E.debug&&this.E.debug.log(`ตัดความสัมพันธ์ที่อ้าง NPC ไม่มีอยู่ ${bad.length} คู่`)}}
}
AW.systems.RelationSystem=RelationSystem;AW.systems.REL_TYPES=TYPES;AW.systems.REL_PLAYER=PLAYER;
AW.systems.RelationsModule={id:'rels',deps:['npcs'],install(e){e.rels=new RelationSystem(e)}};
})(globalThis.AW);
