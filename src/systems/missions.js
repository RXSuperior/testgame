// Mission System: ภารกิจจากข้อมูลของโลก (data.missions) ต่อสู้ผ่าน Combat Resolver (โหมดตามภารกิจ ค่าเริ่ม 'auto')
// ใช้ AP 1 ต่อภารกิจ · ชนะได้ผล win[] และนับ tags (ใช้เป็นเกณฑ์แรงก์) · แพ้ได้ผล lose[] · ความเสียหาย/บาดเจ็บมาจาก Combat
// บาดเจ็บหนัก (injury >= 2) รับภารกิจไม่ได้จนกว่าจะหาย
// slice 'missions' เจ้าของ 'missions': done (ต่อภารกิจ), byTag, last (รายงานล่าสุด)
(function(AW){
'use strict';
const OWNER='missions',VERSION=2,R=()=>AW.systems.Rules;
// Phase 6: ผลงานกับสมาคม (merit) · ค่าตอบแทนลดลงเมื่อทำภารกิจเดิมซ้ำถี่ (saturation) · โบนัสสายเดี่ยว · ความสามารถสมาชิกทีม
const DEF_CFG={saturation:0.12,window:6,floor:0.5,soloExp:0.15,meritDecay:0.02,meritTiers:[]};
const RANK_I={E:0,D:1,C:2,B:3,A:4,S:5};
const scaleRewards=(list,money,exp)=>(list||[]).map(x=>x.money>0&&money!==1?{money:Math.round(x.money*money)}:x.exp>0&&exp!==1?{exp:Math.round(x.exp*exp)}:x);
function validateMissions(def){const d=def.data||{},en=new Set((d.enemies||[]).map(x=>x.id)),locs=new Set((d.locations||[]).map(l=>l.id)),e=[];
 for(const m of d.missions||[]){const p='mission '+m.id+': ';
  if(typeof m.name!=='string')e.push(p+'ต้องมี name');if(!en.has(m.enemy))e.push(p+'ไม่มีศัตรู '+m.enemy);
  if(m.at&&!locs.has(m.at))e.push(p+'ไม่มีสถานที่ '+m.at);
  if(m.tags&&!(Array.isArray(m.tags)&&m.tags.every(t=>typeof t==='string')))e.push(p+'tags ต้องเป็น array ของข้อความ');
  if(m.mode&&!['auto','manual'].includes(m.mode))e.push(p+'mode ต้องเป็น auto|manual');if(m.risk&&!AW.systems.COMBAT_RISKS.includes(m.risk))e.push(p+'risk ไม่รู้จัก');if(m.risk==='lethal'&&m.mode!=='manual')e.push(p+'risk lethal ใช้ได้กับ manual เท่านั้น');
  for(const f of m.foes||[])if(!en.has(f.enemy))e.push(p+'ไม่มีศัตรู '+f.enemy);if(m.merit!==undefined&&!Number.isInteger(m.merit))e.push(p+'merit ต้องเป็นจำนวนเต็ม');
  e.push(...R().validateCond(m.when).map(x=>p+x),...R().validateEffects(m.win).map(x=>p+'win: '+x),...R().validateEffects(m.lose).map(x=>p+'lose: '+x),...R().validateEffects(m.retreat).map(x=>p+'retreat: '+x))}
 for(const x of d.enemies||[]){const p='enemy '+x.id+': ';if(typeof x.name!=='string'||!(x.power>0))e.push(p+'ต้องมี name และ power > 0');
  if(x.armor!==undefined&&!(typeof x.armor==='number'&&x.armor>=0&&x.armor<=0.6))e.push(p+'armor ต้องเป็น 0..0.6');if(x.swarm!==undefined&&!(typeof x.swarm==='number'&&x.swarm>=0&&x.swarm<=0.4))e.push(p+'swarm ต้องเป็น 0..0.4');
  for(const a of x.pattern||[]){if(!AW.systems.ENEMY_ACTS.includes(a.act))e.push(p+'pattern act ไม่รู้จัก '+a.act);if(a.act==='summon'&&!en.has(a.summon))e.push(p+'summon ไม่มีศัตรู '+a.summon)}}
 const rs=def.config&&def.config.rankSystem;if(rs)e.push(...AW.systems.RankSystem.validate(rs));
 for(const l of d.locations||[])e.push(...R().validateCond(l.when).map(x=>'location '+l.id+': '+x));
 return e}
class MissionSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,done:{},byTag:{},last:null,pending:null,merit:0,recent:{}}));
  E.bus.on('game:loaded',()=>this._afterLoad(),{prio:66,owner:OWNER});
  // ผลงานกับสมาคมลดลงเดือนละ meritDecay (2%) ต้องรับงานต่อเนื่องจึงรักษาระดับได้
  E.bus.on('month',()=>{const s=this.get();if(s.merit>0){const w=this.E.player.get().location.world||this.E.worlds.current,d=this.cfg(w).meritDecay;this._m(x=>{x.merit=Math.floor(x.merit*(1-d))})}},{prio:25,owner:OWNER});E.worlds.addValidator(validateMissions);
  // ศึก manual ของภารกิจจบ: รับผลครั้งเดียวแล้วใส่รางวัล
  E.bus.on('combat:ended',({id,source})=>{if(source&&source.kind==='mission'){const rep=this.E.combat.claim(id);this.finish(source.ref,rep)}},{prio:0,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('missions').get(id)||null:null}
 // ภารกิจที่สถานที่ปัจจุบัน พร้อมเหตุผลถ้ายังรับไม่ได้ (ภารกิจที่เงื่อนไขไม่ผ่านจะไม่แสดง)
 available(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c)return[];const v=this.E.view(w);
  return[...c.list('missions').values()].filter(m=>(!m.at||m.at===p.location.loc)&&R().check(m.when,v)).map(m=>{const q=w+'.'+m.id;
   const why=!p.alive?'เสียชีวิตแล้ว':this.E.events&&this.E.events.get().pending?'มีเหตุการณ์ค้าง':p.injury>=2?'บาดเจ็บหนัก ต้องพักก่อน':this.E.health&&this.E.health.severity()>=2?'ป่วยหนัก ต้องรักษาก่อน':p.ap<1?'แรงไม่พอเดือนนี้ (AP)':'';
   const en=this.E.combat.enemy(w,m.enemy);const why2=why||(this.E.combat.session()?'กำลังต่อสู้อยู่':'')||(this.get().pending?'มีภารกิจค้างอยู่':'');
   const k=this.rewardMult(q);return{id:q,name:m.name,rank:m.rank,enemy:en.name,mode:m.mode||'auto',risk:m.risk||'normal',ok:!why2,why:why2,chance:this.E.combat.chance(w,m.enemy),pay:k.money,exp:k.exp,repeat:k.count}})}
 cfg(w){const c=this.E.worlds.ctx(w);return Object.assign({},DEF_CFG,(c&&c.config.missions)||{})}
 // ระดับผลงานกับสมาคม (จาก config.missions.meritTiers): ลดผลของ saturation และเพิ่มค่าตอบแทน
 meritTier(w=this.E.player.get().location.world||this.E.worlds.current){let t=null;for(const x of this.cfg(w).meritTiers)if(this.get().merit>=x.min)t=x;return t}
 recentCount(q,w=q.split('.')[0]){const win=this.cfg(w).window,m=this.E.loop.month;return(this.get().recent[q]||[]).filter(x=>m-x<win).length}
 // ตัวคูณรางวัลถ้าชนะครั้งนี้: เงิน = (1 - ซ้ำ x saturation) [ไม่ต่ำกว่า floor] x (1 + pay ของ merit) x (1 + moneyPct ทีม) · exp = 1 + โบนัสเดี่ยว + expPct ทีม
 rewardMult(q){const w=q.split('.')[0],c=this.cfg(w),t=this.meritTier(w),n=this.recentCount(q,w),solo=!this.E.party||this.E.party.get().members.length===0,pk=k=>this.E.party?this.E.party.perk(k,w):0;
  const sat=c.saturation*(t&&t.sat!==undefined?t.sat:1),money=Math.max(c.floor,1-n*sat)*(1+(t&&t.pay||0))*(1+pk('moneyPct')),exp=1+(solo?c.soloExp:0)+pk('expPct');
  return{money:Math.round(money*100)/100,exp:Math.round(exp*100)/100,count:n,solo,tier:t&&t.name||null}}
 _afterLoad(){const s=this.get();if((s._v||1)<VERSION)this._m(x=>{x._v=VERSION;x.merit=x.merit??(x.byTag.any||0);x.recent=x.recent||{}})}
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
 finish(q,fight){const m=this.def(q),w=q.split('.')[0],v=this.E.view(w),P=this.E.player,before=P.get().money,k=fight.win?this.rewardMult(q):null;
  const list=fight.win?scaleRewards(m.win,k.money,k.exp):fight.outcome==='retreat'?m.retreat:m.lose,run=()=>R().apply(list,v);
  const effects=P.get().alive?(this.E.economy?this.E.economy.as('mission',run):run()):[];
  if(k&&k.money<1&&k.count)effects.push(`งานซ้ำ ${k.count} ครั้งใน ${this.cfg(w).window} เดือน ค่าตอบแทนเหลือ ${Math.round(k.money*100)}%`);
  const gain=Math.max(0,P.get().money-before);if(fight.win&&gain&&this.E.party){const paid=this.E.party.payShares(gain,m.name);if(paid)effects.push(`ส่วนแบ่งทีม -${paid}`)}
  const win=this.cfg(w).window,mo=this.E.loop.month;
  this._m(s=>{s.pending=null;if(fight.win){s.done[q]=(s.done[q]||0)+1;for(const t of(m.tags||[]).concat('any'))s.byTag[t]=(s.byTag[t]||0)+1;
   s.merit=Math.max(0,(s.merit||0)+Math.max(0,Math.round((1+(RANK_I[m.rank]||0))*(m.at==='association'||!m.at?1:0.5))+(m.merit||0)));s.recent=s.recent||{};s.recent[q]=(s.recent[q]||[]).filter(x=>mo-x<win).concat(mo)}});
  const rep={id:q,name:m.name,win:fight.win,outcome:fight.outcome||(fight.win?'win':'lose'),fight,effects,month:this.E.loop.month};this._m(s=>{s.last=rep});
  if(this.E.events)this.E.events.log(`ภารกิจ ${m.name}: ${({win:'สำเร็จ',lose:'ล้มเหลว',retreat:'ถอนตัว',critical:'บาดเจ็บสาหัส',dead:'เสียชีวิต'})[rep.outcome]||rep.outcome}`+(effects.length?` (${effects.join(', ')})`:''));
  this.E.bus.emit('mission:done',rep);return rep}
 // นับผลงานจากกิจกรรมอื่น (เช่น เคลียร์ดันเจี้ยน) เข้าเกณฑ์แรงก์ด้วย tag เดียวกับภารกิจ
 addTags(tags){this._m(s=>{for(const t of(tags||[]).concat('any'))s.byTag[t]=(s.byTag[t]||0)+1})}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
}
{const RL=AW.systems.Rules,inR=(v,c)=>(c.min===undefined||v>=c.min)&&(c.max===undefined||v<=c.max);
 RL.COND.merit={ok:(c,v)=>inR(v.E.missions?v.E.missions.get().merit||0:0,c),val:c=>c&&typeof c==='object'&&(c.min!==undefined||c.max!==undefined)?[]:['merit ต้องเป็น {min,max}']};
 RL.EFF.merit={run:(x,v)=>{v.E.missions._m(s=>{s.merit=Math.max(0,(s.merit||0)+x)});return`ผลงานกับสมาคม ${x>0?'+':''}${x}`},val:x=>typeof x==='number'?[]:['merit ต้องเป็นตัวเลข']}}
AW.systems.MissionSystem=MissionSystem;AW.systems.validateMissions=validateMissions;
AW.systems.MissionsModule={id:'missions',deps:['events'],install(e){e.missions=new MissionSystem(e)}};
// ติดตั้งระบบเกมเพลย์ทั้งชุดตามลำดับ deps
AW.systems.installGameplay=e=>{for(const m of['WorldsModule','PlayerModule','RanksModule','CombatModule','EventsModule','MissionsModule','NpcsModule','RelationsModule','FamilyModule','HealthModule','LifeModule','GatesModule','PartyModule','DungeonModule','TowerModule','UndergroundModule','EconomyModule'])e.use(AW.systems[m]);return e};
})(globalThis.AW);
