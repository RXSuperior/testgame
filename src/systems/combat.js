// Combat System (Phase 5): Hybrid = Auto Resolve + Manual (turn-based) · แยกจากโลก ใช้ได้ทุกโลก
// auto: resolve() คำนวณอย่างเดียว (ไม่แตะ state) แล้ว apply() ใส่ผล · ใช้กับภารกิจทั่วไปและเหตุการณ์
// manual: start() สร้าง session ใน slice 'combat' (มี rng ของตัวเอง เซฟกลางศึกได้) -> act() ทีละรอบ -> จบแล้ว emit 'combat:ended'
//   เจ้าของศึก (mission/dungeon/tower) เรียก claim(id) ครั้งเดียวเพื่อใส่ผลกับผู้เล่น · claim ซ้ำ = error (กันรับผลซ้ำ)
// นโยบายความตาย: normal ไม่ตาย (HP 1 + บาดเจ็บ) · high = Critical Condition ไม่ตาย · lethal (ต้องยอมรับความเสี่ยงก่อน)
//   ล้มครั้งแรก = Critical ต่อสู้ต่อ/ถอย/ขอความช่วยเหลือได้ ล้มซ้ำขณะ Critical = ตาย · auto ไม่มีวันถึงตาย
// สูตร auto อิง fight() ใน logic4.js:384 · ดู docs/phase5/COMBAT_SYSTEM_DESIGN.md
(function(AW){
'use strict';
const OWNER='combat',VERSION=1,RISKS=['normal','high','lethal'],MAX_ROUNDS=30;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STATS=['str','agi','int','vit'];
// ---- Auto Resolve ----
// พลังรวม = ผู้เล่น + สมาชิกปาร์ตี้ (คูณ synergy) · แพ้แต่ยังไม่ล้ม = ถอนตัว (เสียหายน้อยลง ไม่ได้รางวัล) · ล้ม = แพ้
function auto(req,rng){const{profile:pr,enemy}=req,team=pr.power+(pr.partyPower||0),ratio=team/Math.max(1,enemy.power);
 const chance=clamp(1/(1+Math.pow(1/ratio,3))+pr.luk*0.002,0.02,0.98),win=rng.next()<chance;
 const tank=pr.tankFactor||1,frac=clamp(0.35/Math.pow(ratio,1.5)*(0.5+rng.next()*0.7)*(win?1:1.5)*tank,0.02,1.5);let dmg=Math.round(pr.maxHp*frac);
 let outcome=win?'win':'lose';if(!win&&pr.hp-dmg>pr.maxHp*0.15&&req.retreat!==false){outcome='retreat';dmg=Math.round(dmg*0.6)}
 let hpAfter=pr.hp-dmg,injury=0,critical=false;if(hpAfter<=0){hpAfter=1;injury=3;if(req.risk==='high')critical=true}else if(dmg>pr.maxHp*0.5)injury=1;
 const party=(pr.party||[]).map(m=>{const hurt=!win&&rng.next()<0.5?1+rng.int(0,1):win&&rng.next()<0.1?1:0;return{npc:m.npc,name:m.name,injury:hurt}});
 const sk=pr.skills.length?pr.skills[rng.int(0,pr.skills.length-1)]:null,rounds=2+rng.int(0,3);
 const lines=[`${pr.name}${party.length?` และทีม ${party.length} คน`:''} เผชิญหน้ากับ${enemy.name} (พลัง ${team} ต่อ ${enemy.power})`];
 if(sk)lines.push(`${pr.name} ใช้ ${sk}`);
 lines.push(outcome==='win'?`ผ่านไป ${rounds} ยก ${enemy.name}ล้มลง`:outcome==='retreat'?`ผ่านไป ${rounds} ยก สถานการณ์ไม่ดี ${pr.name}สั่งถอนตัว`:`ผ่านไป ${rounds} ยก ${pr.name}ล้มลง ทีมต้องพาออกมา`);
 for(const m of party)if(m.injury)lines.push(`${m.name} บาดเจ็บ ${m.injury} เดือน`);
 lines.push(`เสียพลังชีวิต ${dmg}`+(critical?' อาการวิกฤต (Critical Condition)':injury===3?' หมดสติ ต้องพักรักษาตัว 3 เดือน':injury?' บาดเจ็บ ต้องพัก 1 เดือน':''));
 return{mode:'auto',enemy:enemy.id,enemyName:enemy.name,win,outcome,chance:Math.round(chance*100)/100,ratio:Math.round(ratio*100)/100,power:team,enemyPower:enemy.power,dmg,hpBefore:pr.hp,hpAfter,injury,critical,dead:false,party,risk:req.risk||'normal',lines}}
class CombatSystem{
 constructor(E){this.E=E;this.modes=new Map();this.register('auto',auto);
  E.state.register(OWNER,OWNER,()=>({_v:VERSION,session:null,seq:0,claimed:[],last:null}))}
 register(mode,fn){if(this.modes.has(mode))throw new Error('โหมดต่อสู้ซ้ำ: '+mode);this.modes.set(mode,fn)}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 // ---- โปรไฟล์ ----
 // พลังผู้เล่น: ค่าหลักอาชีพ + ค่าสถานะรวม + เลเวล + แรงก์ + มานา + อุปกรณ์ (รวมอัปเกรด) + สกิล (ตามระดับ) + passive% · บาดเจ็บ/ป่วยลดพลัง
 profile(worldId,{party=true}={}){const P=this.E.player,p=P.get(),c=this.E.worlds.ctx(worldId),rs=c&&c.config.rankSystem;let power,pct=0;
  if(!p.class)power=(p.stats.str+p.stats.agi+p.stats.vit)*0.6;
  else{const cls=P.cls(p.class),r=rs&&p.ranks[rs.id]?rs.order.indexOf(p.ranks[rs.id]):0;let sk=0;
   for(const q of p.skills){const d=P.skill(q)||{},lv=P.skillLevel(q);if(d.type==='passive')pct+=(d.pct||0)*lv;else sk+=(d.power||0)*(1+0.1*(lv-1))}
   power=p.stats[cls.main]*1.5+STATS.reduce((a,k)=>a+p.stats[k],0)*0.4+p.level*3+r*40+p.mana*0.8+P.gear('power')+sk}
  power=Math.round(power*(1+pct)*(1-0.15*Math.min(p.injury,3))*(this.E.health?this.E.health.powerFactor():1));
  const pr={name:p.name,power,maxHp:P.maxHp(),hp:p.hp,maxMp:P.maxMp(),luk:p.stats.luk,skills:p.skills.map(q=>P.skillName(q)),party:[],partyPower:0,tankFactor:1};
  if(party&&this.E.party){const t=this.E.party.team(worldId);pr.party=t.members;pr.partyPower=t.power;pr.tankFactor=t.tankFactor;pr.synergy=t.synergy}
  return pr}
 // ศัตรูแบบอิงแรงก์ (powerByRank) ใช้แทนสูตรเดิม GATE_DIFF[P.rank]*mult
 enemy(worldId,id,mult=1){const c=this.E.worlds.ctx(worldId),e=c&&c.list('enemies').get(id);if(!e)throw new Error('ไม่มีศัตรู '+worldId+'.'+id);
  if(!e.powerByRank)return mult===1?e:Object.assign({},e,{power:Math.round(e.power*mult)});const rs=c.config.rankSystem,r=this.E.player.get().ranks[rs&&rs.id];
  return Object.assign({},e,{power:Math.round((e.powerByRank[r]||e.powerByRank._||e.power)*mult)})}
 chance(worldId,enemy,mult=1){const pr=this.profile(worldId),en=this.enemy(worldId,enemy,mult),ratio=(pr.power+pr.partyPower)/Math.max(1,en.power);return Math.round(clamp(1/(1+Math.pow(1/ratio,3))+pr.luk*0.002,0.02,0.98)*100)/100}
 // auto (หรือโหมดที่ลงทะเบียนเพิ่ม): คืนรายงาน ไม่แตะ state
 resolve({worldId,enemy,mode='auto',mult=1,risk='normal'}){if(mode==='manual')throw new Error('โหมด manual ใช้ start()');const fn=this.modes.get(mode);if(!fn)throw new Error('ไม่มีโหมดต่อสู้ '+mode);
  return fn({profile:this.profile(worldId),enemy:this.enemy(worldId,enemy,mult),worldId,risk:risk==='lethal'?'high':risk},this.E.rng)}
 // ใส่ผลกับผู้เล่นและปาร์ตี้ (auto ใช้ตรง ๆ, manual ผ่าน claim)
 apply(rep){const P=this.E.player;if(rep.dead){this.E.health.die(rep.deathCause||'เสียชีวิตในการต่อสู้');this.E.bus.emit('combat:done',rep);return rep}
  P.addHp(rep.hpAfter-P.get().hp);if(rep.injury)P.injure(rep.injury);if(rep.critical&&this.E.health)this.E.health.critical();
  if(this.E.party)this.E.party.applyResult(rep);for(const q of Object.keys(rep.skillUse||{}))P.skillXp(q,rep.skillUse[q]*3);
  this.E.bus.emit('combat:done',rep);return rep}
 fight(o){return this.apply(this.resolve(o))}
 // ---- Manual (turn-based) ----
 // foes: [{enemy, mult}] · risk ต้องยอมรับก่อนถ้าไม่ใช่ normal (แจ้งระดับความเสี่ยง) · source: {kind, ref} ให้เจ้าของรู้ว่าศึกของใคร
 start({worldId,foes,risk='normal',source={kind:'free'},acceptRisk=false,seed,help=null}){if(!RISKS.includes(risk))throw new Error('risk ไม่รู้จัก '+risk);
  if(this.get().session)throw new Error('กำลังต่อสู้อยู่');if(risk!=='normal'&&!acceptRisk)throw new Error('ต้องยอมรับความเสี่ยงระดับ '+risk+' ก่อนเริ่ม');
  const P=this.E.player,p=P.get();if(!p.alive)throw new Error('เสียชีวิตแล้ว');const pr=this.profile(worldId),seq=this.get().seq;
  const sd=seed??(this.E.state.get('meta').seed+'|cb|'+seq),rng=new AW.core.Rng(sd);
  const foesS=foes.map((f,i)=>{const e=this.enemy(worldId,f.enemy,f.mult||1),hp=Math.round(e.hp||e.power*3);return{key:i,id:e.id,name:e.name,power:e.power,hp,max:hp,pi:0,stun:0,enraged:false,pattern:e.pattern||[{act:'attack',mult:1}]}});
  const skills=p.skills.map(q=>({q,d:P.skill(q)||{},lv:P.skillLevel(q)})).filter(s=>s.d.type!=='passive'&&s.d.act).map(s=>({id:s.q,name:s.d.name,act:s.d.act,mp:s.d.mp||0,cd:s.d.cd||0,mult:(s.d.mult||1)*(1+0.1*(s.lv-1)),heal:s.d.heal||0,synergy:s.d.synergy||null,target:s.d.target||'one'}));
  const ses={id:'cb_'+(seq+1),seed:String(sd),rng:rng.state,world:worldId,risk,source,round:1,status:'active',help,helpUsed:false,claimed:false,
   me:{name:pr.name,power:pr.power,hp:pr.hp,max:pr.maxHp,mp:pr.maxMp,maxMp:pr.maxMp,guard:false,critical:false,cd:{},last:null},skills,
   party:pr.party.map(m=>({npc:m.npc,name:m.name,role:m.role,power:m.power,hp:100,max:100,down:false})),foes:foesS,log:[`เริ่มการต่อสู้ (${({normal:'ความเสี่ยงปกติ',high:'ความเสี่ยงสูง',lethal:'อันตรายถึงชีวิต'})[risk]}) กับ `+foesS.map(f=>f.name).join(', ')],use:{}};
  this._m(s=>{s.seq=seq+1;s.session=ses});this.E.loop.pause('combat');this.E.bus.emit('combat:started',{id:ses.id,source});return this.session()}
 session(){return this.get().session}
 // ตัวเลือกในรอบนี้ (พร้อมเหตุผลถ้าใช้ไม่ได้)
 options(){const s=this.session();if(!s||s.status!=='active')return[];const out=[{type:'attack',name:'โจมตี'},{type:'defend',name:'ตั้งรับ (ลดความเสียหาย 60%)'}];
  for(const k of s.skills)out.push({type:'skill',id:k.id,name:`${k.name} (MP ${k.mp})`,why:s.me.cd[k.id]>0?`คูลดาวน์ ${s.me.cd[k.id]} รอบ`:s.me.mp<k.mp?'MP ไม่พอ':''});
  if(s.help&&!s.helpUsed)out.push({type:'help',name:s.help.name||'ขอความช่วยเหลือ',why:s.help.cost&&this.E.player.get().money<s.help.cost?'เงินไม่พอ':''});
  out.push({type:'retreat',name:'ถอนตัว'});return out.map(o=>Object.assign({why:''},o))}
 act(a){const s0=this.session();if(!s0||s0.status!=='active')throw new Error('ไม่มีการต่อสู้ที่ดำเนินอยู่');const o=this.options().find(x=>x.type===a.type&&(x.type!=='skill'||x.id===a.id));
  if(!o)throw new Error('ทำไม่ได้: '+a.type);if(o.why)throw new Error(o.why);
  const s=JSON.parse(JSON.stringify(s0)),rng=new AW.core.Rng(1);rng.state=s.rng;const L=t=>s.log.push(`รอบ ${s.round}: ${t}`),alive=()=>s.foes.filter(f=>f.hp>0);
  const hit=(f,mult)=>{const d=Math.max(1,Math.round(f.max*0.22*Math.pow(s.me.power/Math.max(1,f.power),0.8)*mult*(0.85+rng.next()*0.3)));f.hp=Math.max(0,f.hp-d);return d};
  s.me.guard=false;let synergyBonus=0;
  if(a.type==='attack'){const f=alive()[0];L(`${s.me.name}โจมตี${f.name} ${hit(f,1)}`)}
  else if(a.type==='defend'){s.me.guard=true;L(`${s.me.name}ตั้งรับ`)}
  else if(a.type==='skill'){const k=s.skills.find(x=>x.id===a.id);s.me.mp-=k.mp;s.me.cd[k.id]=k.cd+1;s.use[k.id]=(s.use[k.id]||0)+1;
   if(k.synergy&&((k.synergy.role&&s.party.some(m=>!m.down&&m.role===k.synergy.role))||(k.synergy.after&&s.me.last===k.synergy.after)))synergyBonus=k.synergy.bonus||0;
   if(k.act==='damage'){const ts=k.target==='all'?alive():[alive()[0]];L(`${s.me.name}ใช้${k.name}`+(synergyBonus?' (ประสาน)':'')+': '+ts.map(f=>`${f.name} ${hit(f,k.mult+synergyBonus)}`).join(', '))}
   else if(k.act==='heal'){const h=Math.round(s.me.max*(k.heal||0.25)*(1+synergyBonus));s.me.hp=Math.min(s.me.max,s.me.hp+h);for(const m of s.party)if(!m.down)m.hp=Math.min(m.max,m.hp+20);L(`${s.me.name}ใช้${k.name} ฟื้น ${h}`)}
   else if(k.act==='guard'){s.me.guard=true;L(`${s.me.name}ใช้${k.name} ตั้งกำแพงป้องกัน`)}
   else if(k.act==='stun'){const f=alive()[0];f.stun=1;L(`${s.me.name}ใช้${k.name} ${f.name}เสียหลัก ${hit(f,k.mult)}`)}}
  else if(a.type==='help'){s.helpUsed=true;for(const f of alive())f.hp=Math.max(0,f.hp-Math.round(f.max*(s.help.damage||0.35)));L(`${s.help.name||'ความช่วยเหลือ'}มาถึง ศัตรูทุกตัวบาดเจ็บหนัก`)}
  else if(a.type==='retreat'){const ok=rng.next()<0.55+(s0.me.last==='defend'?0.25:0)+(s.party.filter(m=>!m.down).length*0.05);
   if(ok){L(`${s.me.name}ถอนตัวสำเร็จ`);return this._end(s,rng,'retreat')}L(`${s.me.name}ถอนตัวไม่สำเร็จ`)}
  s.me.last=a.type==='skill'?a.id:a.type;
  // สมาชิกปาร์ตี้ทำตามบทบาท
  for(const m of s.party){if(m.down||!alive().length)continue;if(m.role==='support'){const h=Math.round(s.me.max*0.08);s.me.hp=Math.min(s.me.max,s.me.hp+h);L(`${m.name}รักษา ${h}`)}
   else{const f=alive()[0],d=Math.max(1,Math.round(f.max*0.12*Math.pow(m.power/Math.max(1,f.power),0.8)*(m.role==='damage'?1.3:0.8)*(0.85+rng.next()*0.3)));f.hp=Math.max(0,f.hp-d);L(`${m.name}โจมตี${f.name} ${d}`)}}
  if(!alive().length)return this._end(s,rng,'win');
  // ศัตรูทำตามรูปแบบของตัวเอง (pattern วนตามลำดับ · enrage เมื่อเลือดต่ำกว่าครึ่ง)
  const tank=s.party.some(m=>!m.down&&m.role==='tank');
  for(const f of alive()){if(f.stun){f.stun=0;L(`${f.name}เสียจังหวะ`);continue}const pat=f.pattern[f.pi%f.pattern.length];f.pi++;
   if(!f.enraged&&f.hp<f.max/2&&f.pattern.some(x=>x.act==='enrage')){f.enraged=true;L(`${f.name}คลั่ง! พลังเพิ่มขึ้น`)}
   if(pat.act==='guard'){L(`${f.name}ตั้งการ์ด`);continue}if(pat.act==='enrage')continue;
   if(pat.act==='heal'){const h=Math.round(f.max*0.1);f.hp=Math.min(f.max,f.hp+h);L(`${f.name}ฟื้นตัว ${h}`);continue}
   const mult=(pat.mult||1)*(f.enraged?1.3:1),target=tank&&rng.next()<0.5?s.party.find(m=>!m.down&&m.role==='tank'):pat.act==='sweep'?null:null;
   if(target){const d=Math.round(30*mult*Math.pow(f.power/Math.max(1,target.power),0.8)*(0.85+rng.next()*0.3));target.hp-=d;L(`${f.name}${pat.name||'โจมตี'}ใส่${target.name} ${d}`+(target.hp<=0?' หมดสภาพ':''));if(target.hp<=0){target.down=true;target.hp=0}continue}
   let d=Math.round(s.me.max*0.18*Math.pow(f.power/Math.max(1,s.me.power),0.8)*mult*(0.85+rng.next()*0.3)*(s.me.guard?0.4:1)*(tank?0.85:1));s.me.hp-=d;L(`${f.name}${pat.name||'โจมตี'}${pat.tell?` (${pat.tell})`:''} ${d}`);
   if(pat.act==='sweep')for(const m of s.party)if(!m.down){m.hp-=20;if(m.hp<=0){m.down=true;m.hp=0;L(`${m.name}หมดสภาพ`)}}
   if(s.me.hp<=0){if(s.risk==='lethal'&&!s.me.critical){s.me.critical=true;s.me.hp=1;L(`${s.me.name}ล้มลง อาการวิกฤต (Critical Condition) ล้มอีกครั้งอาจเสียชีวิต`)}
    else if(s.risk==='lethal')return this._end(s,rng,'dead');else return this._end(s,rng,s.risk==='high'?'critical':'lose')}}
  for(const k of Object.keys(s.me.cd))if(s.me.cd[k]>0)s.me.cd[k]--;s.me.mp=Math.min(s.me.maxMp,s.me.mp+2);s.round++;
  if(s.round>MAX_ROUNDS){L('ศึกยืดเยื้อ ทีมถอยออกมา');return this._end(s,rng,'retreat')}
  s.rng=rng.state;this._m(x=>{x.session=s});return this.session()}
 // จบศึก: สร้างรายงานเก็บไว้ใน session (ยังไม่ใส่ผลกับผู้เล่น) แล้วแจ้งเจ้าของ
 _end(s,rng,outcome){s.rng=rng.state;s.status=outcome;const win=outcome==='win',m=s.me;
  const injury=outcome==='lose'||outcome==='critical'?3:outcome==='dead'?0:m.hp<m.max*0.25?1:0;
  s.report={mode:'manual',session:s.id,source:s.source,win,outcome,risk:s.risk,enemy:s.foes.map(f=>f.id).join(','),enemyName:s.foes.map(f=>f.name).join(', '),rounds:s.round,
   hpBefore:null,hpAfter:Math.max(1,m.hp),injury,critical:outcome==='critical'||(m.critical&&outcome!=='dead'),dead:outcome==='dead',deathCause:outcome==='dead'?'เสียชีวิตในการต่อสู้กับ'+s.foes.map(f=>f.name).join(', '):null,
   party:s.party.map(p=>({npc:p.npc,name:p.name,injury:p.down?2:p.hp<40?1:0})),skillUse:s.use,lines:s.log.slice(-12)};
  this._m(x=>{x.session=s});this.E.loop.resume('combat');this.E.bus.emit('combat:ended',{id:s.id,source:s.source,report:s.report});return this.session()}
 // ใส่ผลศึก manual กับผู้เล่น ครั้งเดียวต่อ session · คืนรายงาน
 claim(id){const s=this.session();if(this.get().claimed.includes(id))throw new Error('จ่ายผลการต่อสู้นี้ไปแล้ว');if(!s||s.id!==id||s.status==='active')throw new Error('ยังไม่มีผลการต่อสู้ '+id);
  const rep=s.report;this._m(x=>{x.claimed.push(id);if(x.claimed.length>50)x.claimed.shift();x.last=rep;x.session=null});this.apply(rep);return rep}
 // ทิ้งศึกที่ค้าง (เช่น โหลดเซฟที่เจ้าของศึกหายไปแล้ว) โดยนับเป็นถอนตัว
 abandon(){const s=this.session();if(!s)return false;if(s.status==='active'){const rng=new AW.core.Rng(1);rng.state=s.rng;this._end(s,rng,'retreat')}return true}
}
AW.systems.CombatSystem=CombatSystem;AW.systems.autoResolve=auto;AW.systems.COMBAT_RISKS=RISKS;
AW.systems.CombatModule={id:'combat',deps:['player'],install(e){e.combat=new CombatSystem(e);
 e.bus.on('game:loaded',()=>{const s=e.combat.session();if(s&&s.status==='active')e.loop.pause('combat')},{prio:0,owner:'combat'})}};
})(globalThis.AW);
