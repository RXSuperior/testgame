// Health System: สุขภาพ เจ็บป่วย รักษา ชราภาพ และความตาย ของผู้เล่น (NPC ใช้ฟังก์ชัน roll เดียวกัน)
// slice 'health' เจ้าของ 'health': ill (โรคปัจจุบัน), lifeMod (ปรับอายุขัย), lives (ประวัติชีวิตที่จบแล้ว ห้ามลบ)
// ผู้เล่นตาย: หยุดเวลา (loop reason 'dead') ปิดกิจกรรมทั้งหมด บันทึกประวัติชีวิต ไม่ลบข้อมูลใด ๆ · ยังไม่มีการเล่นต่อเป็นลูก (Phase 6)
// การต่อสู้ยังไม่ทำให้ตาย (HP หมด = บาดเจ็บ 3 เดือน ตาม Phase 3)
(function(AW){
'use strict';
const OWNER='health',VERSION=1,BASE_ILL=0.02;
const ills=()=>(AW.data.shared&&AW.data.shared.illnesses)||[];
// สุ่มสุขภาพ f เดือนรวดเดียว (NPC ในโลกที่ไม่ได้อยู่ใช้ f=12) · คืน {ill, die}
function roll(s,rng,f=1){let ill=s.ill?Object.assign({},s.ill):null,die=null;const mod=s.lifeMod||0;
 if(ill){const def=ills().find(x=>x.id===ill.id)||{};
  // โรคร้ายที่ไม่รักษา: คนหนุ่มสาวรอดง่ายกว่ามาก (อายุ <40 x0.15, <60 x0.5)
  const dp=0.06*(s.ageY<40?0.15:s.ageY<60?0.5:1);if(def.deadly&&!ill.treated&&rng.next()<1-Math.pow(1-dp,f))die=def.name||ill.id;
  ill.months-=f;if(ill.months<=0)ill=null}
 else{const p=BASE_ILL*(1+(100-(s.condition??100))/50)*(s.ageY>50?2:1),pf=1-Math.pow(1-p,f);
  if(rng.next()<pf){const pool=ills().filter(x=>!x.minAge||s.ageY>=x.minAge),tot=pool.reduce((a,x)=>a+x.weight,0);let r=rng.next()*tot;
   for(const x of pool){r-=x.weight;if(r<0){ill={id:x.id,months:x.months,severity:x.severity,treated:false};break}}}}
 const old=s.ageY-mod;if(!die&&old>=62){const py=(old-58)/220;if(rng.next()<1-Math.pow(1-py/12,f))die='ชราภาพ'}
 return{ill,die}}
class HealthSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,ill:null,lifeMod:0,lives:[]}));
  E.bus.on('month',()=>this._month(),{prio:35,owner:OWNER});
  E.bus.on('game:loaded',()=>{if(E.player.get().created&&!E.player.get().alive)E.loop.pause('dead')},{prio:0,owner:OWNER});
  E.bus.on('game:new',()=>E.loop.resume('dead'),{prio:0,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 illDef(id){return ills().find(x=>x.id===id)||null}
 // สภาพร่างกาย 0-100: ลดลงหลังอายุ 40 ปี (ปีละ 1.5) ปรับด้วย lifeMod และการบาดเจ็บ
 condition(){const p=this.E.player.get(),a=p.age/12,h=this.get();return Math.max(10,Math.min(100,Math.round(100-Math.max(0,a-40)*1.5+h.lifeMod*3-p.injury*10)))}
 severity(){const i=this.get().ill;return i?i.severity:0}
 // ผลต่อกิจกรรม: ป่วยระดับ 2 ขึ้นไป AP ลด 1 และรับภารกิจไม่ได้ · พลังต่อสู้ลด 10% ต่อระดับ
 powerFactor(){return 1-0.1*this.severity()}
 makeIll(id){const d=this.illDef(id);if(!d)throw new Error('ไม่มีโรค '+id);this._m(s=>{s.ill={id,months:d.months,severity:d.severity,treated:false}});this.E.bus.emit('health:ill',{id})}
 treat(){if(!this.get().ill)return false;this._m(s=>{s.ill.treated=true;s.ill.months=Math.ceil(s.ill.months/2)});return true}
 addLifeMod(n){this._m(s=>{s.lifeMod+=n})}
 _month(){const P=this.E.player,p=P.get();if(!p.created||!p.alive)return;
  const r=roll({ageY:p.age/12,ill:this.get().ill,condition:this.condition(),lifeMod:this.get().lifeMod},this.E.rng,1),was=this.get().ill;
  this._m(s=>{s.ill=r.ill});if(r.ill&&!was){this.E.events&&this.E.events.log(`ล้มป่วยเป็น${this.illDef(r.ill.id).name}`)}else if(was&&!r.ill&&!r.die)this.E.events&&this.E.events.log(`หายจาก${this.illDef(was.id).name}แล้ว`);
  if(r.die)return this.die(r.die);if(this.severity()>=2&&P.get().ap>0)P.spendAp(1)}
 // ผู้เล่นเสียชีวิต: บันทึกประวัติชีวิตแบบครบ แล้วหยุดทุกอย่าง (เซฟ/โหลดได้ตามปกติ)
 die(cause){const P=this.E.player;if(!P.get().alive)return null;P.die(cause);const rec=this.record();this._m(s=>{s.lives.push(rec)});
  if(this.E.events&&this.E.events.get().pending)this.E.events._m(s=>{s.pending=null});this.E.loop.resume('event');this.E.loop.pause('dead');
  this.E.events&&this.E.events.log(`${rec.name} เสียชีวิตเมื่ออายุ ${rec.ageY} ปี (${cause})`);this.E.bus.emit('player:died',rec);return rec}
 // ประวัติชีวิต: สำหรับแสดงผลและให้ระบบสืบทอดใน Phase 6 ใช้ต่อ
 record(){const E=this.E,p=E.player.get(),fam=E.family?E.family.get():null,life=E.life?E.life.get():null,R=E.rels;
  const people=R?R.list('player',{dir:'in'}).sort((a,b)=>b.aff-a.aff).slice(0,8).map(x=>({id:x.from,name:(E.npcs.get(x.from)||{}).name||x.from,type:R.type(x.from,'player'),aff:x.aff})):[];
  return{id:'life_'+(this.get().lives.length+1),name:p.name,gender:p.gender,world:p.location.world,bornGlobal:p.bornAt,diedGlobal:E.loop.month,ageY:Math.floor(p.age/12),cause:p.death&&p.death.cause,
   level:p.level,class:p.class,ranks:Object.assign({},p.ranks),karma:p.karma,traits:Object.assign({},p.traits),reputation:p.reputation,
   assets:{money:p.money,items:Object.assign({},p.inventory),equipment:Object.assign({},p.equipment),home:life&&life.home},job:life&&life.job,
   family:fam?{background:fam.background,spouse:fam.spouse,members:fam.members.map(m=>({npc:m.npc,role:m.role,name:(E.npcs.get(m.npc)||{}).name,alive:(E.npcs.get(m.npc)||{}).alive})),lineage:fam.lineage}:null,
   people,flags:Object.assign({},p.flags)}}
}
AW.systems.HealthSystem=HealthSystem;AW.systems.Health={roll};
AW.systems.HealthModule={id:'health',deps:['player'],install(e){e.health=new HealthSystem(e)}};
})(globalThis.AW);
