// Mission System: ภารกิจจากข้อมูลของโลก (data.missions) ต่อสู้ผ่าน Combat Resolver (โหมดตามภารกิจ ค่าเริ่ม 'auto')
// ใช้ AP 1 ต่อภารกิจ · ชนะได้ผล win[] และนับ tags (ใช้เป็นเกณฑ์แรงก์) · แพ้ได้ผล lose[] · ความเสียหาย/บาดเจ็บมาจาก Combat
// บาดเจ็บหนัก (injury >= 2) รับภารกิจไม่ได้จนกว่าจะหาย
// slice 'missions' เจ้าของ 'missions': done (ต่อภารกิจ), byTag, last (รายงานล่าสุด)
(function(AW){
'use strict';
const OWNER='missions',R=()=>AW.systems.Rules;
function validateMissions(def){const d=def.data||{},en=new Set((d.enemies||[]).map(x=>x.id)),locs=new Set((d.locations||[]).map(l=>l.id)),e=[];
 for(const m of d.missions||[]){const p='mission '+m.id+': ';
  if(typeof m.name!=='string')e.push(p+'ต้องมี name');if(!en.has(m.enemy))e.push(p+'ไม่มีศัตรู '+m.enemy);
  if(m.at&&!locs.has(m.at))e.push(p+'ไม่มีสถานที่ '+m.at);
  if(m.tags&&!(Array.isArray(m.tags)&&m.tags.every(t=>typeof t==='string')))e.push(p+'tags ต้องเป็น array ของข้อความ');
  if(m.mode&&!['auto','manual'].includes(m.mode))e.push(p+'mode ต้องเป็น auto|manual');if(m.risk&&!AW.systems.COMBAT_RISKS.includes(m.risk))e.push(p+'risk ไม่รู้จัก');if(m.risk==='lethal'&&m.mode!=='manual')e.push(p+'risk lethal ใช้ได้กับ manual เท่านั้น');
  for(const f of m.foes||[])if(!en.has(f.enemy))e.push(p+'ไม่มีศัตรู '+f.enemy);
  e.push(...R().validateCond(m.when).map(x=>p+x),...R().validateEffects(m.win).map(x=>p+'win: '+x),...R().validateEffects(m.lose).map(x=>p+'lose: '+x),...R().validateEffects(m.retreat).map(x=>p+'retreat: '+x))}
 for(const x of d.enemies||[])if(typeof x.name!=='string'||!(x.power>0))e.push('enemy '+x.id+': ต้องมี name และ power > 0');
 const rs=def.config&&def.config.rankSystem;if(rs)e.push(...AW.systems.RankSystem.validate(rs));
 for(const l of d.locations||[])e.push(...R().validateCond(l.when).map(x=>'location '+l.id+': '+x));
 return e}
class MissionSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({done:{},byTag:{},last:null,pending:null}));E.worlds.addValidator(validateMissions);
  // ศึก manual ของภารกิจจบ: รับผลครั้งเดียวแล้วใส่รางวัล
  E.bus.on('combat:ended',({id,source})=>{if(source&&source.kind==='mission'){const rep=this.E.combat.claim(id);this.finish(source.ref,rep)}},{prio:0,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('missions').get(id)||null:null}
 // ภารกิจที่สถานที่ปัจจุบัน พร้อมเหตุผลถ้ายังรับไม่ได้ (ภารกิจที่เงื่อนไขไม่ผ่านจะไม่แสดง)
 available(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c)return[];const v=this.E.view(w);
  return[...c.list('missions').values()].filter(m=>(!m.at||m.at===p.location.loc)&&R().check(m.when,v)).map(m=>{const q=w+'.'+m.id;
   const why=!p.alive?'เสียชีวิตแล้ว':this.E.events&&this.E.events.get().pending?'มีเหตุการณ์ค้าง':p.injury>=2?'บาดเจ็บหนัก ต้องพักก่อน':this.E.health&&this.E.health.severity()>=2?'ป่วยหนัก ต้องรักษาก่อน':p.ap<1?'แรงไม่พอเดือนนี้ (AP)':'';
   const en=this.E.combat.enemy(w,m.enemy);const why2=why||(this.E.combat.session()?'กำลังต่อสู้อยู่':'')||(this.get().pending?'มีภารกิจค้างอยู่':'');
   return{id:q,name:m.name,rank:m.rank,enemy:en.name,mode:m.mode||'auto',risk:m.risk||'normal',ok:!why2,why:why2,chance:this.E.combat.chance(w,m.enemy)}})}
 // เริ่มภารกิจ: ไม่ผูกกับโหมดต่อสู้ · auto จบทันที · manual สร้าง session แล้วรอ 'combat:ended' (risk ไม่ใช่ normal ต้อง acceptRisk)
 start(q,{acceptRisk=false}={}){const m=this.def(q);if(!m)throw new Error('ไม่มีภารกิจ '+q);const a=this.available().find(x=>x.id===q);
  if(!a)throw new Error('รับภารกิจนี้ไม่ได้ที่นี่');if(!a.ok)throw new Error(a.why);if(this.get().pending)throw new Error('มีภารกิจค้างอยู่');
  const w=q.split('.')[0],mode=m.mode||'auto',risk=m.risk||'normal';if(mode==='manual'&&risk!=='normal'&&!acceptRisk)throw new Error('ต้องยอมรับความเสี่ยงระดับ '+risk+' ก่อน');
  this.E.player.spendAp(1);
  if(mode==='manual'){const s=this.E.combat.start({worldId:w,foes:m.foes||[{enemy:m.enemy}],risk,acceptRisk,source:{kind:'mission',ref:q},help:m.help||null});this._m(x=>{x.pending={q,session:s.id}});return{pending:true,session:s.id}}
  const fight=this.E.combat.resolve({worldId:w,enemy:m.enemy,mode,risk});
  // โหมดอนาคตอาจคืน pending: เก็บไว้แล้วจบด้วย finish() ทีหลัง
  if(fight.pending){this._m(x=>{x.pending={q,session:fight.session||null}});return{pending:true,fight}}
  this.E.combat.apply(fight);return this.finish(q,fight)}
 // ใส่รางวัล/ผลของภารกิจ (ผลการต่อสู้ถูกใส่แล้วโดย combat.apply/claim) · ชนะ=win[] · แพ้=lose[] · ถอนตัว=ไม่มีรางวัล
 finish(q,fight){const m=this.def(q),w=q.split('.')[0],v=this.E.view(w),P=this.E.player,before=P.get().money;
  const effects=P.get().alive?R().apply(fight.win?m.win:fight.outcome==='retreat'?m.retreat:m.lose,v):[];
  const gain=Math.max(0,P.get().money-before);if(fight.win&&gain&&this.E.party){const paid=this.E.party.payShares(gain,m.name);if(paid)effects.push(`ส่วนแบ่งทีม -${paid}`)}
  this._m(s=>{s.pending=null;if(fight.win){s.done[q]=(s.done[q]||0)+1;for(const t of(m.tags||[]).concat('any'))s.byTag[t]=(s.byTag[t]||0)+1}});
  const rep={id:q,name:m.name,win:fight.win,outcome:fight.outcome||(fight.win?'win':'lose'),fight,effects,month:this.E.loop.month};this._m(s=>{s.last=rep});
  if(this.E.events)this.E.events.log(`ภารกิจ ${m.name}: ${({win:'สำเร็จ',lose:'ล้มเหลว',retreat:'ถอนตัว',critical:'บาดเจ็บสาหัส',dead:'เสียชีวิต'})[rep.outcome]||rep.outcome}`+(effects.length?` (${effects.join(', ')})`:''));
  this.E.bus.emit('mission:done',rep);return rep}
 // นับผลงานจากกิจกรรมอื่น (เช่น เคลียร์ดันเจี้ยน) เข้าเกณฑ์แรงก์ด้วย tag เดียวกับภารกิจ
 addTags(tags){this._m(s=>{for(const t of(tags||[]).concat('any'))s.byTag[t]=(s.byTag[t]||0)+1})}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
}
AW.systems.MissionSystem=MissionSystem;AW.systems.validateMissions=validateMissions;
AW.systems.MissionsModule={id:'missions',deps:['events'],install(e){e.missions=new MissionSystem(e)}};
// ติดตั้งระบบเกมเพลย์ทั้งชุดตามลำดับ deps
AW.systems.installGameplay=e=>{for(const m of['WorldsModule','PlayerModule','RanksModule','CombatModule','EventsModule','MissionsModule','NpcsModule','RelationsModule','FamilyModule','HealthModule','LifeModule','GatesModule','PartyModule','DungeonModule','TowerModule','UndergroundModule'])e.use(AW.systems[m]);return e};
})(globalThis.AW);
