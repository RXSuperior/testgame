// Dungeon System: ดันเจี้ยนสร้างจากข้อมูล (data.dungeons) ด้วย seed · แยกจากโลกและจาก Tower
// การสำรวจหนึ่งครั้ง = run: ชั้น x ห้อง (fight/event/rest/treasure) ชั้นสุดท้ายมีบอสถ้ากำหนด · บอสใช้ manual combat
// ของที่ได้สะสมใน run.loot ใส่ให้ผู้เล่นตอนจบครั้งเดียว (ออกเอง/เคลียร์ = ได้ครบ, แพ้/ถอนตัว = ได้ตาม keepOnFail)
// ความคืบหน้าถาวร (records): จำนวนครั้งที่เคลียร์ ชั้นลึกสุด checkpoint · ยิ่งเคลียร์บ่อยยิ่งยาก (mutate) และ seed ต่างกันทุกครั้ง
// เซฟ/โหลดกลางดันเจี้ยนได้ (run อยู่ใน slice 'dungeon') · ดู docs/phase5/DUNGEON_SYSTEM_DESIGN.md
(function(AW){
'use strict';
const OWNER='dungeon',VERSION=1,KINDS=['fight','event','rest','treasure'],R=()=>AW.systems.Rules;
function validateDungeons(def){const d=def.data||{},e=[],en=new Set((d.enemies||[]).map(x=>x.id)),ev=new Map((d.events||[]).map(x=>[x.id,x])),locs=new Set((d.locations||[]).map(l=>l.id));
 for(const g of d.dungeons||[]){const p='dungeon '+g.id+': ';if(typeof g.name!=='string')e.push(p+'ต้องมี name');if(!locs.has(g.at))e.push(p+'ไม่มีสถานที่ '+g.at);
  const fl=g.floors;if(!(Number.isInteger(fl)&&fl>=1&&fl<=20))e.push(p+'floors ต้องเป็น 1-20');if(!Array.isArray(g.groups)||!g.groups.length)e.push(p+'ต้องมี groups');
  for(const gr of g.groups||[])for(const x of gr.enemies||[])if(!en.has(x.enemy))e.push(p+'ไม่มีศัตรู '+x.enemy);
  for(const x of g.events||[]){const v=ev.get(x);if(!v)e.push(p+'ไม่มีเหตุการณ์ '+x);else if(v.trigger!=='dungeon')e.push(p+'เหตุการณ์ '+x+' ต้องเป็น trigger dungeon')}
  if(g.boss&&!en.has(g.boss.enemy))e.push(p+'ไม่มีบอส '+g.boss.enemy);if(g.boss&&g.boss.risk&&!AW.systems.COMBAT_RISKS.includes(g.boss.risk))e.push(p+'risk ไม่รู้จัก');
  for(const k of Object.keys(g.roomWeights||{}))if(!KINDS.includes(k))e.push(p+'ชนิดห้องไม่รู้จัก '+k);
  for(const k of['room','treasure','floor','clear'])e.push(...R().validateEffects((g.rewards||{})[k]).map(x=>p+'rewards.'+k+': '+x));e.push(...R().validateCond(g.when).map(x=>p+x))}
 return e}
// สร้างผังด้วย seed (ฟังก์ชันบริสุทธิ์ ทดสอบซ้ำได้)
function generate(g,seed,startFloor=0){const r=new AW.core.Rng(seed),w=Object.assign({fight:5,event:2,rest:1,treasure:2},g.roomWeights||{}),tot=KINDS.reduce((a,k)=>a+w[k],0),n=g.rooms||3,floors=[];
 const pickKind=()=>{let x=r.next()*tot;for(const k of KINDS){x-=w[k];if(x<0)return k}return'fight'};
 for(let f=startFloor;f<g.floors;f++){const rooms=[];for(let i=0;i<n;i++){let k=pickKind();if(k==='event'&&!(g.events||[]).length)k='fight';
   const room={kind:k};if(k==='fight'){const gs=g.groups.filter(x=>(x.minFloor||0)<=f);const gt=gs.reduce((a,x)=>a+(x.weight||1),0);let y=r.next()*gt;room.group=gs[gs.length-1].id;for(const x of gs){y-=x.weight||1;if(y<0){room.group=x.id;break}}}
   if(k==='event')room.event=g.events[r.int(0,g.events.length-1)];rooms.push(room)}
  if(rooms[0].kind!=='fight'){const gs=g.groups.filter(x=>(x.minFloor||0)<=f);rooms[0]={kind:'fight',group:gs[0].id}}
  if(g.boss&&f===g.floors-1)rooms.push({kind:'boss'});floors.push({n:f,rooms})}
 return floors}
class DungeonSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,run:null,seq:0,records:{},claimed:[]}));E.worlds.addValidator(validateDungeons);
  E.bus.on('combat:ended',({id,source})=>{if(source&&source.kind==='dungeon')this._bossDone(id)},{prio:0,owner:OWNER});
  E.bus.on('event:answered',r=>{const run=this.run();if(run&&run.waiting&&run.waiting.kind==='event'&&run.waiting.id===r.id)this._m(s=>{s.run.waiting=null;s.run.room++;s.run.log.push(`เหตุการณ์: ${r.title}`)})},{prio:0,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 run(){return this.get().run}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('dungeons').get(id)||null:null}
 record(q){return this.get().records[q]||{clears:0,runs:0,deepest:0,checkpoint:0}}
 // ดันเจี้ยนที่สถานที่ปัจจุบัน
 here(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c||!p.alive)return[];const v=this.E.view(w);
  return[...c.list('dungeons').values()].filter(g=>g.at===p.location.loc).map(g=>{const q=w+'.'+g.id,rec=this.record(q);
   const why=this.run()?'กำลังสำรวจอยู่':this.E.combat.session()?'กำลังต่อสู้อยู่':this.E.events.get().pending?'มีเหตุการณ์ค้าง':!R().check(g.when,v)?'ยังไม่ผ่านเงื่อนไข':p.ap<(g.apCost??1)?'แรงไม่พอเดือนนี้ (AP)':(p.injury>=2||this.E.health.severity()>=2)?'บาดเจ็บหรือป่วยหนัก':'';
   return{id:q,name:g.name,rank:g.rank,floors:g.floors,clears:rec.clears,checkpoint:rec.checkpoint,risk:(g.boss&&g.boss.risk)||'normal',ok:!why,why}})}
 // เข้า: seed = seed เกม | ดันเจี้ยน | จำนวนครั้งที่เข้า (ผังต่างกันทุกครั้ง แต่ทดสอบซ้ำได้) · ความยากเพิ่มตามจำนวนครั้งที่เคลียร์
 enter(q,{fromCheckpoint=false,seed}={}){const g=this.def(q),a=this.here().find(x=>x.id===q);if(!g||!a)throw new Error('ไม่มีดันเจี้ยนนี้ที่นี่');if(a.why)throw new Error(a.why);
  const rec=this.record(q),start=fromCheckpoint?Math.min(rec.checkpoint,g.floors-1):0,sd=seed??(this.E.state.get('meta').seed+'|dg|'+q+'|'+rec.runs);
  this.E.player.spendAp(g.apCost??1);const mult=(g.difficulty||1)*(1+(g.mutate||0)*rec.clears),seq=this.get().seq+1;
  const run={id:'dg_'+seq,dungeon:q,seed:String(sd),mult:Math.round(mult*100)/100,layout:generate(g,sd,start),fi:0,room:0,status:'active',waiting:null,loot:{money:0,exp:0,items:{}},log:[`เข้า${g.name}${start?` จาก checkpoint ชั้น ${start+1}`:''}`],committed:false};
  this._m(s=>{s.seq=seq;s.run=run;s.records[q]=Object.assign({},rec,{runs:rec.runs+1})});this.E.bus.emit('dungeon:entered',{id:run.id,dungeon:q});return this.run()}
 current(){const r=this.run();if(!r||r.status!=='active')return null;const f=r.layout[r.fi];return f?{floor:f.n,index:r.room,room:f.rooms[r.room]||null,rooms:f.rooms.length}:null}
 _loot(effects,w){const out={money:0,exp:0,items:{}};for(const x of effects||[]){if(x.money)out.money+=x.money;if(x.exp)out.exp+=x.exp;if(x.item){const id=R().qid(x.item.id,w);out.items[id]=(out.items[id]||0)+(x.item.n??1)}}return out}
 _add(l){this._m(s=>{const L=s.run.loot;L.money+=l.money;L.exp+=l.exp;for(const k of Object.keys(l.items))L.items[k]=(L.items[k]||0)+l.items[k]})}
 // ไปห้องถัดไป
 advance(){const r=this.run();if(!r||r.status!=='active')throw new Error('ไม่ได้อยู่ในดันเจี้ยน');if(r.waiting)throw new Error('ต้องจัดการห้องปัจจุบันก่อน');
  const g=this.def(r.dungeon),w=r.dungeon.split('.')[0],cur=this.current();
  if(!cur.room){// จบชั้น
   const f=cur.floor;this._add(this._loot((g.rewards||{}).floor,w));this._m(s=>{s.run.fi++;s.run.room=0;s.run.log.push(`ผ่านชั้น ${f+1}`);const rec=s.records[r.dungeon];rec.deepest=Math.max(rec.deepest,f+1);rec.checkpoint=Math.max(rec.checkpoint,f+1)});
   if(this.run().fi>=this.run().layout.length)return this._finish('cleared');return{kind:'floor',floor:f+1}}
  const room=cur.room;
  if(room.kind==='fight'){const gr=g.groups.find(x=>x.id===room.group),base=this.E.combat.enemy(w,gr.enemies[0].enemy),total=gr.enemies.reduce((a,x)=>a+this.E.combat.enemy(w,x.enemy,x.mult||1).power,0);
   const rep=this.E.combat.fight({worldId:w,enemy:base.id,mult:total/base.power*r.mult,risk:'normal'});this._m(s=>{s.run.log.push(`ต่อสู้: ${({win:'ชนะ',retreat:'ถอนตัว',lose:'แพ้'})[rep.outcome]} ${rep.enemyName}`)});
   if(rep.outcome!=='win')return Object.assign(this._finish(rep.outcome==='retreat'?'retreated':'failed'),{fight:rep});this._add(this._loot((g.rewards||{}).room,w));this._m(s=>{s.run.room++});return{kind:'fight',fight:rep}}
  if(room.kind==='rest'){this.E.player.addHp(Math.round(this.E.player.maxHp()*0.3));this._m(s=>{s.run.room++;s.run.log.push('พักฟื้นในห้องปลอดภัย')});return{kind:'rest'}}
  if(room.kind==='treasure'){this._add(this._loot((g.rewards||{}).treasure||(g.rewards||{}).room,w));this._m(s=>{s.run.room++;s.run.log.push('พบหีบสมบัติ')});return{kind:'treasure'}}
  if(room.kind==='event'){const q=w+'.'+room.event;this._m(s=>{s.run.waiting={kind:'event',id:q}});this.E.events.present(q);return{kind:'event',event:q}}
  if(room.kind==='boss'){const b=g.boss,s=this.E.combat.start({worldId:w,foes:[{enemy:b.enemy,mult:(b.mult||1)*r.mult}],risk:b.risk||'normal',acceptRisk:true,source:{kind:'dungeon',ref:r.id},help:b.help||null});
   this._m(x=>{x.run.waiting={kind:'combat',session:s.id}});return{kind:'boss',session:s.id}}}
 // บอส: ต้องยอมรับความเสี่ยงตอนเข้า (here() แสดง risk) · ผลศึกรับครั้งเดียวผ่าน claim
 _bossDone(id){const r=this.run();if(!r||!r.waiting||r.waiting.session!==id)return;const rep=this.E.combat.claim(id);this._m(s=>{s.run.waiting=null;s.run.room++;s.run.log.push(`บอส: ${rep.outcome}`)});
  if(rep.outcome==='win')return this.advance();this._finish(rep.outcome==='retreat'?'retreated':'failed')}
 // ออกเอง (ระหว่างห้อง): ได้ของครบ
 leave(){const r=this.run();if(!r||r.status!=='active')throw new Error('ไม่ได้อยู่ในดันเจี้ยน');if(r.waiting)throw new Error('ต้องจัดการห้องปัจจุบันก่อน');return this._finish('left')}
 // จบ run: ใส่ของให้ผู้เล่นครั้งเดียว (run id อยู่ใน claimed) แล้วเก็บ run ไว้ดูผล
 _finish(status){const r=this.run(),g=this.def(r.dungeon),w=r.dungeon.split('.')[0];if(this.get().claimed.includes(r.id))throw new Error('ใส่ของจากการสำรวจนี้ไปแล้ว');
  const keep=status==='cleared'||status==='left'?1:(g.rules&&g.rules.keepOnFail!==undefined?g.rules.keepOnFail:0.5),L=r.loot,P=this.E.player,got=[];
  const money=Math.floor(L.money*keep),exp=Math.floor(L.exp*keep);if(P.get().alive){if(money)P.addMoney(money);if(exp)P.addExp(exp);for(const k of Object.keys(L.items)){const n=Math.floor(L.items[k]*keep);if(n>0&&P.item(k)){P.addItem(k,n);got.push(`${P.itemName(k)} x${n}`)}}}
  let clearFx=[];if(status==='cleared'&&P.get().alive)clearFx=R().apply((g.rewards||{}).clear,this.E.view(w));
  this._m(s=>{s.run.status=status;s.run.committed=true;s.claimed.push(r.id);if(s.claimed.length>50)s.claimed.shift();if(status==='cleared')s.records[r.dungeon].clears++});
  if(status==='cleared'&&g.tags&&this.E.missions)this.E.missions.addTags(g.tags);
  const sum={status,money,exp,items:got,clear:clearFx};this.E.events&&this.E.events.log(`${g.name}: ${({cleared:'เคลียร์',left:'ออกจากดันเจี้ยน',retreated:'ถอนตัว',failed:'ล้มเหลว'})[status]} (เงิน ${money}, EXP ${exp}${got.length?', '+got.join(', '):''})`);
  this.E.bus.emit('dungeon:finished',{id:r.id,dungeon:r.dungeon,...sum});return sum}
 close(){const r=this.run();if(r&&r.status==='active')throw new Error('ยังสำรวจอยู่');this._m(s=>{s.run=null})}
}
AW.systems.DungeonSystem=DungeonSystem;AW.systems.validateDungeons=validateDungeons;AW.systems.generateDungeon=generate;
AW.systems.DungeonModule={id:'dungeon',deps:['party','events'],install(e){e.dungeon=new DungeonSystem(e)}};
})(globalThis.AW);
