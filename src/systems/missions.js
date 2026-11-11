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
  e.push(...R().validateCond(m.when).map(x=>p+x),...R().validateEffects(m.win).map(x=>p+'win: '+x),...R().validateEffects(m.lose).map(x=>p+'lose: '+x))}
 for(const x of d.enemies||[])if(typeof x.name!=='string'||!(x.power>0))e.push('enemy '+x.id+': ต้องมี name และ power > 0');
 const rs=def.config&&def.config.rankSystem;if(rs)e.push(...AW.systems.RankSystem.validate(rs));
 for(const l of d.locations||[])e.push(...R().validateCond(l.when).map(x=>'location '+l.id+': '+x));
 return e}
class MissionSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({done:{},byTag:{},last:null}));E.worlds.addValidator(validateMissions)}
 get(){return this.E.state.get(OWNER)}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('missions').get(id)||null:null}
 // ภารกิจที่สถานที่ปัจจุบัน พร้อมเหตุผลถ้ายังรับไม่ได้ (ภารกิจที่เงื่อนไขไม่ผ่านจะไม่แสดง)
 available(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c)return[];const v=this.E.view(w);
  return[...c.list('missions').values()].filter(m=>(!m.at||m.at===p.location.loc)&&R().check(m.when,v)).map(m=>{const q=w+'.'+m.id;
   const why=!p.alive?'เสียชีวิตแล้ว':this.E.events&&this.E.events.get().pending?'มีเหตุการณ์ค้าง':p.injury>=2?'บาดเจ็บหนัก ต้องพักก่อน':this.E.health&&this.E.health.severity()>=2?'ป่วยหนัก ต้องรักษาก่อน':p.ap<1?'แรงไม่พอเดือนนี้ (AP)':'';
   const pr=this.E.combat.profile(w),en=this.E.combat.enemy(w,m.enemy),ratio=pr.power/en.power;
   return{id:q,name:m.name,rank:m.rank,enemy:en.name,ok:!why,why,chance:Math.round(Math.max(0.02,Math.min(0.98,1/(1+Math.pow(1/ratio,3))+pr.luk*0.002))*100)/100}})}
 start(q){const m=this.def(q);if(!m)throw new Error('ไม่มีภารกิจ '+q);const a=this.available().find(x=>x.id===q);
  if(!a)throw new Error('รับภารกิจนี้ไม่ได้ที่นี่');if(!a.ok)throw new Error(a.why);
  const w=q.split('.')[0];this.E.player.spendAp(1);
  const fight=this.E.combat.resolve({worldId:w,enemy:m.enemy,mode:m.mode||'auto'});
  // โหมดอนาคตอาจคืน pending (รอผู้เล่นเลือกสกิล) ตอนนั้นจะเรียก finish() ทีหลัง ตอนนี้ auto จบในครั้งเดียว
  if(fight.pending)return{pending:true,fight};
  return this.finish(q,fight)}
 finish(q,fight){const m=this.def(q),w=q.split('.')[0];this.E.combat.apply(fight);const v=this.E.view(w);
  const effects=R().apply(fight.win?m.win:m.lose,v);
  this._m(s=>{if(fight.win){s.done[q]=(s.done[q]||0)+1;for(const t of(m.tags||[]).concat('any'))s.byTag[t]=(s.byTag[t]||0)+1}});
  const rep={id:q,name:m.name,win:fight.win,fight,effects,month:this.E.loop.month};this._m(s=>{s.last=rep});
  if(this.E.events)this.E.events.log(`ภารกิจ ${m.name}: ${fight.win?'สำเร็จ':'ล้มเหลว'}`+(effects.length?` (${effects.join(', ')})`:''));
  this.E.bus.emit('mission:done',rep);return rep}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
}
AW.systems.MissionSystem=MissionSystem;AW.systems.validateMissions=validateMissions;
AW.systems.MissionsModule={id:'missions',deps:['events'],install(e){e.missions=new MissionSystem(e)}};
// ติดตั้งระบบเกมเพลย์ทั้งชุดตามลำดับ deps
AW.systems.installGameplay=e=>{for(const m of['WorldsModule','PlayerModule','RanksModule','CombatModule','EventsModule','MissionsModule','NpcsModule','RelationsModule','FamilyModule','HealthModule','LifeModule','GatesModule'])e.use(AW.systems[m]);return e};
})(globalThis.AW);
