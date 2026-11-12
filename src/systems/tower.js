// Tower System: หอคอยหลายชั้นจากข้อมูล (data.towers + data.towerFloors ที่เพิ่มชั้นได้โดยไม่แก้โค้ด) แยกจาก Dungeon
// ปีนทีละชั้นถัดจากชั้นสูงสุดที่ผ่าน: fight (auto) / boss (manual) / puzzle, choice (เหตุการณ์ trigger 'tower' ที่ใช้ผล towerClear)
// รางวัลแต่ละชั้นรับได้ครั้งเดียว (claimed) โหลดเซฟไม่ทำให้ได้ซ้ำ · บันทึกชั้นสูงสุด (best) ต่อหอคอย
(function(AW){
'use strict';
const OWNER='tower',VERSION=2,KINDS=['fight','boss','puzzle','choice'],R=()=>AW.systems.Rules;
// ชั้นของหอคอย = floors ในนิยาม + towerFloors ที่ชี้มาที่หอคอยนี้ เรียงตามเลขชั้น
const floorsOf=(d,t)=>(t.floors||[]).concat((d.towerFloors||[]).filter(f=>f.tower===t.id)).slice().sort((a,b)=>a.n-b.n);
function validateTowers(def){const d=def.data||{},e=[],en=new Set((d.enemies||[]).map(x=>x.id)),ev=new Map((d.events||[]).map(x=>[x.id,x])),locs=new Set((d.locations||[]).map(l=>l.id)),ids=new Set((d.towers||[]).map(t=>t.id));
 for(const f of d.towerFloors||[])if(!ids.has(f.tower))e.push('towerFloors: ไม่มีหอคอย '+f.tower);
 for(const t of d.towers||[]){const p='tower '+t.id+': ',fl=floorsOf(d,t);if(!locs.has(t.at))e.push(p+'ไม่มีสถานที่ '+t.at);
  fl.forEach((f,i)=>{const q=p+'ชั้น '+f.n+': ';if(f.n!==i+1)e.push(q+'เลขชั้นต้องต่อเนื่องจาก 1');if(!KINDS.includes(f.kind))e.push(q+'kind ไม่รู้จัก');
   if((f.kind==='fight'||f.kind==='boss')&&!en.has(f.enemy))e.push(q+'ไม่มีศัตรู '+f.enemy);
   if(f.kind==='puzzle'||f.kind==='choice'){const v=ev.get(f.event);if(!v)e.push(q+'ไม่มีเหตุการณ์ '+f.event);else if(v.trigger!=='tower')e.push(q+'เหตุการณ์ต้องเป็น trigger tower');else if(!JSON.stringify(v).includes('towerClear'))e.push(q+'เหตุการณ์ต้องมีผล towerClear')}
   if(f.risk&&!AW.systems.COMBAT_RISKS.includes(f.risk))e.push(q+'risk ไม่รู้จัก');e.push(...R().validateEffects(f.reward).map(x=>q+x),...R().validateCond(f.when).map(x=>q+x))})}
 return e}
class TowerSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,towers:{},attempt:null,npc:{}}));
  E.bus.on('month',()=>this._npcMonth(),{prio:40,owner:OWNER});E.bus.on('game:loaded',()=>this._afterLoad(),{prio:63,owner:OWNER});E.worlds.addValidator(validateTowers);
  E.bus.on('combat:ended',({id,source})=>{if(source&&source.kind==='tower')this._bossDone(id)},{prio:0,owner:OWNER});
  E.bus.on('event:answered',r=>{const a=this.get().attempt;if(a&&a.event===r.id)this._resolveEvent()},{prio:-1,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('towers').get(id)||null:null}
 floors(q){const[w]=q.split('.'),c=this.E.worlds.ctx(w);return c?floorsOf(c.def.data,this.def(q)):[]}
 state(q){return this.get().towers[q]||{best:0,claimed:{}}}
 here(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c||!p.alive)return[];
  return[...c.list('towers').values()].filter(t=>t.at===p.location.loc).map(t=>{const q=w+'.'+t.id,st=this.state(q),fl=this.floors(q),next=fl[st.best];
   const why=!next?'ปีนครบทุกชั้นแล้ว':this.get().attempt?'กำลังปีนอยู่':this.E.combat.session()?'กำลังต่อสู้อยู่':this.E.events.get().pending?'มีเหตุการณ์ค้าง':p.ap<(t.apCost??1)?'แรงไม่พอเดือนนี้ (AP)':
    next.when&&!R().check(next.when,this.E.view(w))?'ยังไม่ผ่านเงื่อนไขชั้นนี้':'';
   return{id:q,name:t.name,best:st.best,total:fl.length,next:next?{n:next.n,kind:next.kind,name:next.name||'',risk:next.risk||'normal'}:null,ok:!why,why}})}
 // ปีนชั้นถัดไป · boss ที่ risk ไม่ใช่ normal ต้อง acceptRisk
 climb(q,{acceptRisk=false}={}){const t=this.def(q),a=this.here().find(x=>x.id===q);if(!t||!a)throw new Error('ไม่มีหอคอยนี้ที่นี่');if(a.why)throw new Error(a.why);
  const w=q.split('.')[0],f=this.floors(q)[this.state(q).best];if(f.kind==='boss'&&(f.risk||'normal')!=='normal'&&!acceptRisk)throw new Error('ต้องยอมรับความเสี่ยงระดับ '+f.risk+' ก่อน');
  this.E.player.spendAp(t.apCost??1);
  if(f.kind==='fight'){const rep=this.E.combat.fight({worldId:w,enemy:f.enemy,mult:f.mult||1});if(rep.win)return Object.assign(this._clear(q,f),{fight:rep});return{cleared:false,floor:f.n,fight:rep}}
  if(f.kind==='boss'){const s=this.E.combat.start({worldId:w,foes:[{enemy:f.enemy,mult:f.mult||1}],risk:f.risk||'normal',acceptRisk,source:{kind:'tower',ref:q},help:f.help||null});this._m(x=>{x.attempt={tower:q,floor:f.n,session:s.id}});return{pending:true,session:s.id}}
  const ev=w+'.'+f.event;this._m(x=>{x.attempt={tower:q,floor:f.n,event:ev,cleared:false}});this.E.events.present(ev);return{pending:true,event:ev}}
 // ผล towerClear ในเหตุการณ์ชั้นปริศนา/ทางเลือก
 markClear(){if(!this.get().attempt)throw new Error('ไม่ได้อยู่ระหว่างปีนหอคอย');this._m(x=>{x.attempt.cleared=true})}
 _resolveEvent(){const a=this.get().attempt,f=this.floors(a.tower).find(x=>x.n===a.floor);this._m(x=>{x.attempt=null});if(a.cleared)this._clear(a.tower,f)}
 _bossDone(id){const a=this.get().attempt;if(!a||a.session!==id)return;const rep=this.E.combat.claim(id),f=this.floors(a.tower).find(x=>x.n===a.floor);this._m(x=>{x.attempt=null});if(rep.win&&this.E.player.get().alive)this._clear(a.tower,f)}
 // ผ่านชั้น: เลื่อน best และรับรางวัลถ้ายังไม่เคยรับ
 _clear(q,f){const w=q.split('.')[0];let fx=[];const st=this.state(q);if(!st.claimed[f.n]){const run=()=>R().apply(f.reward,this.E.view(w));fx=this.E.economy?this.E.economy.as('tower',run):run()}
  this._m(x=>{const s=x.towers[q]||(x.towers[q]={best:0,claimed:{}});s.best=Math.max(s.best,f.n);s.claimed[f.n]=true});
  this.E.events&&this.E.events.log(`${this.def(q).name} ผ่านชั้น ${f.n}`+(fx.length?` (${fx.join(', ')})`:''));this.E.bus.emit('tower:cleared',{tower:q,floor:f.n});return{cleared:true,floor:f.n,effects:fx}}
 // ---- Phase 6: ประเมินความพร้อมก่อนปีน (ผู้เล่นและบอท) ----
 // พร้อม = HP พอ (บอส 80% ชั้นอื่น 60%) ไม่บาดเจ็บ ไม่ป่วยหนัก · ทีม: สมาชิกบาดเจ็บเกินครึ่งถือว่าไม่พร้อมสำหรับบอส
 // แนะนำ: rest (ยังไม่พร้อม) / too_hard (โอกาสต่ำกว่าเกณฑ์) / climb · เกณฑ์ตาม config.tower.need
 cfg(w){const c=this.E.worlds.ctx(w);return Object.assign({need:{fight:0.6,boss:0.7,high:0.75},npcCadence:6,npcScale:2,npcRank:'C',npcRest:3,npcMinAge:18,npcMaxAge:55,friendAff:40,boldTempers:['proud','ambitious'],carefulTempers:['shy','honest'],logFloor:8},(c&&c.config.tower)||{})}
 assess(q){const fl=this.floors(q),st=this.state(q),f=fl[st.best];if(!f)return{recommend:'done',reasons:['ปีนครบแล้ว']};const w=q.split('.')[0],P=this.E.player,p=P.get(),c=this.cfg(w),reasons=[];
  const boss=f.kind==='boss',hp=p.hp/Math.max(1,P.maxHp());if(hp<(boss?0.8:0.6))reasons.push(`พลังชีวิต ${Math.round(hp*100)}%`);if(p.injury>0)reasons.push('บาดเจ็บ');if(this.E.health&&this.E.health.severity()>=2)reasons.push('ป่วยหนัก');
  const mem=this.E.party?this.E.party.get().members:[],hurt=mem.filter(m=>m.injury>0).length;if(hurt)reasons.push(`สมาชิกบาดเจ็บ ${hurt}/${mem.length}`);
  const ready=!reasons.filter(r=>!r.startsWith('สมาชิก')).length&&!(boss&&mem.length&&hurt*2>mem.length);
  const chance=f.kind==='fight'||boss?this.E.combat.chance(w,f.enemy,f.mult||1):null,need=boss?(f.risk==='high'||f.risk==='lethal'?c.need.high:c.need.boss):c.need.fight;
  const recommend=!ready?'rest':chance!==null&&chance<need?'too_hard':'climb';return{floor:f.n,kind:f.kind,risk:f.risk||'normal',chance,need:chance===null?null:need,ready,reasons,recommend}}
 // ---- NPC ปีนหอคอย: ประเมินทีละส่วน (NPC แต่ละคนคิดทุก npcCadence เดือน สลับกันตาม hash) เฉพาะโลกที่ผู้เล่นอยู่ ----
 // พลัง NPC = combat.base x ช่วงอายุ x npcScale x ประสบการณ์หอคอย · เพื่อนฮันเตอร์ (ชอบกัน >= friendAff) ไปเป็นทีมถ้าทุกคนพร้อม
 // ทีมไม่พร้อม (มีคนพักฟื้น) = ไปคนเดียวเฉพาะเมื่อโอกาสสูงมาก ไม่งั้นรอ · ล้มเหลว = พักฟื้น npcRest เดือน · NPC ไม่ตายจากหอคอย
 npcRec(t,n){return((this.get().npc||{})[t]||{})[n]||{best:0,rest:0,tries:0,fails:0}}
 npcPower(q,t){const P=this.E.party,cb=P&&P.combatOf(q),n=this.E.npcs.get(q);if(!cb||!n||!n.alive)return 0;const a=this.E.npcs.ageY(q),c=this.cfg(n.world);
  const ageF=a<20?0.8:a<=40?1:a<=55?0.9:0.7;return Math.round(cb.base*ageF*c.npcScale*(t?1+0.03*Math.min(20,this.npcRec(t,q).best):1))}
 _npcFloorPower(w,f,c){const e=this.E.worlds.ctx(w).list('enemies').get(f.enemy);if(!e)return Infinity;const base=e.powerByRank?(e.powerByRank[c.npcRank]||e.powerByRank._||e.power):e.power;return base*(f.mult||1)}
 _npcMonth(){const w=this.E.player.get().location.world||this.E.worlds.current,ctx=w&&this.E.worlds.ctx(w);if(!ctx||!this.E.party)return;const c=this.cfg(w),m=this.E.loop.month;
  const towers=[...ctx.list('towers').values()];if(!towers.length)return;const N=this.E.npcs,P=this.E.party;
  // รายชื่อฮันเตอร์ที่ปีนได้ (แคชในหน่วยความจำ ต่อโลก ต่อปี และจำนวน NPC) · ไม่อยู่ในเซฟ คำนวณใหม่ได้เสมอ
  const all=N.all(w),key=w+'|'+Math.floor(m/12)+'|'+all.length;if(!this._hc||this._hc.key!==key)this._hc={key,ids:all.filter(n=>n.alive&&P.combatOf(n.id)&&(()=>{const a=N.ageY(n.id);return a>=c.npcMinAge&&a<=c.npcMaxAge})()).map(n=>n.id),slot:new Map()};
  const hunters=this._hc.ids.map(id=>N.get(id)).filter(n=>n&&n.alive&&!P.isMember(n.id));if(!hunters.length)return;const sl=this._hc.slot;
  const turn=hunters.filter(n=>{let v=sl.get(n.id);if(v===undefined){v=Math.floor(AW.systems.h01(n.id+'|tw')*c.npcCadence);sl.set(n.id,v)}return v===m%c.npcCadence});if(!turn.length)return;
  // เพื่อนฮันเตอร์: สแกนเส้นความสัมพันธ์ครั้งเดียวต่อเดือน (แทนการถามทีละคู่) เก็บเฉพาะคนในรอบนี้
  const hs=new Set(hunters.map(n=>n.id)),ts=new Set(turn.map(n=>n.id)),fr=new Map(),E=this.E.state.get('rels').e;
  for(const k in E){const i=k.indexOf('>'),a=k.slice(0,i);if(!ts.has(a))continue;const b=k.slice(i+1);if(!hs.has(b)||E[k].aff<c.friendAff)continue;const l=fr.get(a)||[];if(l.length<2){l.push(b);fr.set(a,l)}}
  this._fr=fr;const pw=new Map(),power=id=>{let v=pw.get(id);if(v===undefined){v=this.npcPower(id,'');pw.set(id,v)}return v};this._pw=power;
  // ผลทั้งเดือนรวมเป็นการเขียน state ครั้งเดียว (copy-on-write ของ slice มีราคา)
  const upd=[];for(const t of towers){const tq=w+'.'+t.id,fl=this.floors(tq);for(const n of turn){const u=this._npcTry(tq,fl,n,hunters,c,w,m);if(u)upd.push(u)}}this._pw=null;this._fr=null;
  if(upd.length)this._m(s=>{s.npc=s.npc||{};for(const u of upd){const T=s.npc[u.tq]=s.npc[u.tq]||{};for(const x of u.grp){const r=T[x]||{best:0,rest:0,tries:0,fails:0};r.tries++;if(u.ok&&r.best<u.floor)r.best=u.floor;if(!u.ok){r.fails++;r.rest=m+c.npcRest}T[x]=r}}})}
 _npcTry(tq,fl,n,hunters,c,w,m){const rec=this.npcRec(tq,n.id),f=fl[rec.best];if(!f||rec.rest>m)return;const rng=this.E.rng;
  const friends=this._fr?(this._fr.get(n.id)||[]).map(id=>this.E.npcs.get(id)):hunters.filter(x=>x.id!==n.id&&(()=>{const e=this.E.rels.edge(n.id,x.id);return e&&e.aff>=c.friendAff})()).slice(0,2),readyF=friends.filter(x=>this.npcRec(tq,x.id).rest<=m);
  const P=id=>(this._pw?this._pw(id):this.npcPower(id,''))*(1+0.03*Math.min(20,this.npcRec(tq,id).best)),solo=P(n.id),team=solo+0.6*readyF.reduce((a,x)=>a+P(x.id),0);
  const bold=c.boldTempers.includes(n.temper)?-0.1:c.carefulTempers.includes(n.temper)?0.1:0,need=(f.kind==='boss'?0.7:0.6)+bold;
  const ch=pw=>f.kind==='fight'||f.kind==='boss'?Math.max(0.02,Math.min(0.98,1/(1+Math.pow(this._npcFloorPower(w,f,c)/Math.max(1,pw),3)))):0.7;
  // ทีมพร้อมทุกคน -> ไปทั้งทีม · มีคนพักฟื้น -> ไปคนเดียวเมื่อโอกาส >= 0.8 · ไม่งั้นรอ
  let go=null,pw=solo;if(friends.length&&readyF.length===friends.length&&ch(team)>=need){go=readyF;pw=team}else if(ch(solo)>=Math.max(need,friends.length?0.8:need))go=[];if(!go)return;
  const ok=rng.next()<ch(pw),grp=[n].concat(go).map(x=>x.id);
  if(ok&&f.n>=c.logFloor&&this.E.events)this.E.events.log(`ข่าวหอคอย: ${n.name}${go.length?` และทีม`:''} ผ่าน${this.def(tq).name}ชั้น ${f.n}`);return{tq,grp,ok,floor:f.n}}
 leaders(tq,k=5){const T=(this.get().npc||{})[tq]||{};return Object.entries(T).map(([id,r])=>({id,name:(this.E.npcs.get(id)||{}).name||id,best:r.best,tries:r.tries})).filter(x=>x.best>0).sort((a,b)=>b.best-a.best).slice(0,k)}
 _afterLoad(){const s=this.get();if((s._v||1)<VERSION||!s.npc)this._m(x=>{x._v=VERSION;x.npc=x.npc||{}});const bad=[];for(const[t,T]of Object.entries(this.get().npc))for(const id of Object.keys(T))if(!this.E.npcs.get(id))bad.push([t,id]);if(bad.length)this._m(x=>{for(const[t,id]of bad)delete x.npc[t][id]})}
}
AW.systems.TowerSystem=TowerSystem;AW.systems.validateTowers=validateTowers;
AW.systems.TowerModule={id:'tower',deps:['party','events'],install(e){e.tower=new TowerSystem(e)}};
})(globalThis.AW);
