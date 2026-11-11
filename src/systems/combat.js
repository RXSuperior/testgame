// Combat Resolver: แยกจากโลก ใช้ได้ทุกโลก · Phase 3 มีแค่โหมด 'auto' (Auto Resolve)
// resolve() คำนวณอย่างเดียว ไม่แตะ state · apply() นำความเสียหายและการบาดเจ็บไปใส่ผู้เล่น
// โหมดใหม่ (เช่น 'hybrid' ใน Phase 5) ลงทะเบียนด้วย register(mode, fn) โดยไม่ต้องแก้ Mission System
// สูตรอิงเกมเดิม fight() ใน logic4.js:384 · ดู docs/phase3/COMBAT_RESOLVER_DESIGN.md
(function(AW){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const STATS=['str','agi','int','vit'];
function auto(req,rng){const{profile:pr,enemy}=req,ratio=pr.power/Math.max(1,enemy.power);
 const chance=clamp(1/(1+Math.pow(1/ratio,3))+pr.luk*0.002,0.02,0.98),win=rng.next()<chance;
 const frac=clamp(0.35/Math.pow(ratio,1.5)*(0.5+rng.next()*0.7)*(win?1:1.5),0.02,1.5),dmg=Math.round(pr.maxHp*frac);
 let hpAfter=pr.hp-dmg,injury=0;if(hpAfter<=0){hpAfter=1;injury=3}else if(dmg>pr.maxHp*0.5)injury=1;
 const sk=pr.skills.length?pr.skills[rng.int(0,pr.skills.length-1)]:null,rounds=2+rng.int(0,3);
 const lines=[`${pr.name} เผชิญหน้ากับ${enemy.name} (พลัง ${pr.power} ต่อ ${enemy.power})`];
 if(sk)lines.push(`${pr.name} ใช้ ${sk}`);
 lines.push(win?`ผ่านไป ${rounds} ยก ${enemy.name}ล้มลง`:`ผ่านไป ${rounds} ยก ${pr.name}ต้องถอยออกมา`);
 lines.push(`เสียพลังชีวิต ${dmg}`+(injury===3?' หมดสติ ต้องพักรักษาตัว 3 เดือน':injury?' บาดเจ็บ ต้องพัก 1 เดือน':''));
 return{mode:'auto',enemy:enemy.id,enemyName:enemy.name,win,chance:Math.round(chance*100)/100,ratio:Math.round(ratio*100)/100,power:pr.power,enemyPower:enemy.power,dmg,hpBefore:pr.hp,hpAfter,injury,lines}}
class CombatSystem{
 constructor(E){this.E=E;this.modes=new Map();this.register('auto',auto)}
 register(mode,fn){if(this.modes.has(mode))throw new Error('โหมดต่อสู้ซ้ำ: '+mode);this.modes.set(mode,fn)}
 // พลังผู้เล่น: ยังไม่ตื่นพลังใช้ร่างกายล้วน · ตื่นแล้ว = ค่าหลักอาชีพ + ค่าสถานะรวม + เลเวล + แรงก์ + มานา + อาวุธ + สกิล · บาดเจ็บลดพลัง
 profile(worldId){const P=this.E.player,p=P.get(),c=this.E.worlds.ctx(worldId),rs=c&&c.config.rankSystem;let power;
  if(!p.class)power=(p.stats.str+p.stats.agi+p.stats.vit)*0.6;
  else{const cls=P.cls(p.class),w=p.equipment.weapon&&P.item(p.equipment.weapon),r=rs&&p.ranks[rs.id]?rs.order.indexOf(p.ranks[rs.id]):0;
   power=p.stats[cls.main]*1.5+STATS.reduce((a,k)=>a+p.stats[k],0)*0.4+p.level*3+r*40+p.mana*0.8+(w?w.power||0:0)+p.skills.reduce((a,q)=>a+((P.skill(q)||{}).power||0),0)}
  power=Math.round(power*(1-0.15*Math.min(p.injury,3))*(this.E.health?this.E.health.powerFactor():1));
  return{name:p.name,power,maxHp:P.maxHp(),hp:p.hp,luk:p.stats.luk,skills:p.skills.map(q=>P.skillName(q))}}
 // ศัตรูแบบอิงแรงก์ (powerByRank) ใช้แทนสูตรเดิม GATE_DIFF[P.rank]*mult: พลัง = ตารางตามแรงก์ปัจจุบันของผู้เล่น x mult
 enemy(worldId,id,mult=1){const c=this.E.worlds.ctx(worldId),e=c&&c.list('enemies').get(id);if(!e)throw new Error('ไม่มีศัตรู '+worldId+'.'+id);
  if(!e.powerByRank)return mult===1?e:Object.assign({},e,{power:Math.round(e.power*mult)});const rs=c.config.rankSystem,r=this.E.player.get().ranks[rs&&rs.id];
  return Object.assign({},e,{power:Math.round((e.powerByRank[r]||e.powerByRank._||e.power)*mult)})}
 resolve({worldId,enemy,mode='auto',mult=1}){const fn=this.modes.get(mode);if(!fn)throw new Error('ไม่มีโหมดต่อสู้ '+mode);
  return fn({profile:this.profile(worldId),enemy:this.enemy(worldId,enemy,mult),worldId},this.E.rng)}
 apply(rep){const P=this.E.player;P.addHp(rep.hpAfter-P.get().hp);if(rep.injury)P.injure(rep.injury);this.E.bus.emit('combat:done',rep);return rep}
 fight(o){return this.apply(this.resolve(o))}
}
AW.systems.CombatSystem=CombatSystem;AW.systems.autoResolve=auto;
AW.systems.CombatModule={id:'combat',deps:['player'],install(e){e.combat=new CombatSystem(e)}};
})(globalThis.AW);
