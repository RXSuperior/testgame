// Life System: ที่อยู่อาศัย งาน รายได้ ค่าใช้จ่าย สถานะทางสังคม (แนวคิดจาก life9/life5 เขียนใหม่เป็นโมดูลแยก)
// ข้อมูลบ้านและงานอยู่ในข้อมูลโลก (data.housing, data.jobs) งานไม่จำกัดแค่ฮันเตอร์ ตื่นพลังแล้วก็ทำงานธรรมดาได้
// ทุกเดือน: ทำงาน (ใช้ AP ตามงาน) ได้เงินเดือน หักค่าเช่า/ค่าดูแล/ค่าครองชีพ
// เงินไม่พอ: จ่ายเท่าที่มี ส่วนที่ขาดเป็นหนี้ค้าง (arrears) ห้ามเงินติดลบ · ค้างเกิน 3 เดือนของค่าเช่าถูกให้ออกจากบ้านเช่า กลับบ้านครอบครัว
// slice 'life' เจ้าของ 'life' · ดู docs/phase4/LIFE_SYSTEM_DESIGN.md
(function(AW){
'use strict';
const OWNER='life',VERSION=1,R=()=>AW.systems.Rules;
const STATUS=[[0,'ชนชั้นล่าง'],[30,'ชนชั้นกลาง'],[70,'ชนชั้นกลางค่อนบน'],[120,'ชนชั้นสูง']];
function validateLife(def){const d=def.data||{},e=[],locs=new Set((d.locations||[]).map(l=>l.id));
 for(const h of d.housing||[]){const p='housing '+h.id+': ';if(!locs.has(h.loc))e.push(p+'ไม่มีสถานที่ '+h.loc);for(const k of['rent','price','upkeep','comfort'])if(h[k]!==undefined&&!(Number.isInteger(h[k])&&h[k]>=0))e.push(p+k+' ต้องเป็นจำนวนเต็ม >= 0');
  if(h.rent===undefined&&h.price===undefined&&!h.family&&!h.shelter)e.push(p+'ต้องมี rent หรือ price');e.push(...R().validateCond(h.when).map(x=>p+x))}
 for(const j of d.jobs||[]){const p='job '+j.id+': ';if(!locs.has(j.at))e.push(p+'ไม่มีสถานที่ '+j.at);if(!(Number.isInteger(j.salary)&&j.salary>=0))e.push(p+'salary ต้องเป็นจำนวนเต็ม >= 0');
  if(j.ap!==undefined&&![0,1,2].includes(j.ap))e.push(p+'ap ต้องเป็น 0-2');e.push(...R().validateCond(j.when).map(x=>p+x),...R().validateEffects(j.monthly).map(x=>p+'monthly: '+x))}
 return e}
class LifeSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,home:null,job:null,arrears:0,ledger:[],worked:0}));E.worlds.addValidator(validateLife);
  E.bus.on('player:created',()=>this._start(),{prio:15,owner:OWNER});
  E.bus.on('month',()=>this._month(),{prio:30,owner:OWNER});
  E.bus.on('game:loaded',()=>this._afterLoad(),{prio:70,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 _ctx(w){return this.E.worlds.ctx(w||this.E.player.get().location.world)}
 house(h=this.get().home){if(!h)return null;const c=this._ctx(h.world);return c?c.list('housing').get(h.id)||null:null}
 jobDef(j=this.get().job){if(!j)return null;const c=this._ctx(j.world);return c?c.list('jobs').get(j.id)||null:null}
 _familyHome(w){const c=this._ctx(w);return c?[...c.list('housing').values()].find(h=>h.family)||null:null}
 _start(){const w=this.E.player.get().location.world,h=this._familyHome(w);if(h&&!this.get().home)this._m(s=>{s.home={world:w,id:h.id,loc:h.loc,mode:'family'}})}
 // ---- งาน ----
 jobsHere(){const p=this.E.player.get(),c=this._ctx();if(!c||!p.alive)return[];const v=this.E.view(c.id),cur=this.get().job;
  return[...c.list('jobs').values()].filter(j=>j.at===p.location.loc&&!j.npcOnly).map(j=>({id:j.id,name:j.name,salary:j.salary,ap:j.ap??1,current:!!(cur&&cur.id===j.id&&cur.world===c.id),ok:R().check(j.when,v)}))}
 takeJob(id,{force=false}={}){const c=this._ctx(),j=c&&c.list('jobs').get(id);if(!j)throw new Error('ไม่มีงาน '+id);if(!force&&!R().check(j.when,this.E.view(c.id)))throw new Error('ยังไม่ผ่านเงื่อนไขของงานนี้');
  this._m(s=>{s.job={world:c.id,id,since:this.E.loop.month}});this.E.events&&this.E.events.log(`เริ่มงาน${j.name}`)}
 quitJob(){const j=this.jobDef();if(!j)return false;this._m(s=>{s.job=null});this.E.events&&this.E.events.log(`ลาออกจากงาน${j.name}`);return true}
 // ---- บ้าน ----
 housingHere(){const p=this.E.player.get(),c=this._ctx();if(!c||!p.alive)return[];const v=this.E.view(c.id),cur=this.get().home;
  return[...c.list('housing').values()].filter(h=>h.agent===p.location.loc||h.loc===p.location.loc).map(h=>({id:h.id,name:h.name,rent:h.rent,price:h.price,comfort:h.comfort||0,current:!!(cur&&cur.id===h.id),ok:R().check(h.when,v)}))}
 moveIn(id,mode){const c=this._ctx(),h=c&&c.list('housing').get(id);if(!h)throw new Error('ไม่มีที่พัก '+id);if(!R().check(h.when,this.E.view(c.id)))throw new Error('ยังไม่ผ่านเงื่อนไข');
  const P=this.E.player;if(mode==='own'){if(h.price===undefined)throw new Error('ที่นี่ไม่ขาย');P.addMoney(-h.price)}
  else if(mode==='rent'){if(h.rent===undefined)throw new Error('ที่นี่ไม่ให้เช่า');P.addMoney(-h.rent)}
  else if(!(mode==='family'&&h.family)&&!(mode==='shelter'&&h.shelter))throw new Error('รูปแบบไม่ถูกต้อง');
  this._m(s=>{s.home={world:c.id,id,loc:h.loc,mode};if(mode!=='rent')s.arrears=0});this.E.events&&this.E.events.log(`ย้ายไปอยู่${h.name}`)}
 // ---- รายเดือน ----
 // ค่าครองชีพ: อยู่บ้านครอบครัวไม่เสีย · อื่น ๆ ตาม config.livingCost ของโลก
 dues(){const s=this.get(),h=this.house(),c=this._ctx(s.home&&s.home.world),lc=(c&&c.config.livingCost)||0;if(!h)return{rent:0,upkeep:0,living:0};
  return{rent:s.home.mode==='rent'?h.rent||0:0,upkeep:s.home.mode==='own'?h.upkeep||0:0,living:s.home.mode==='family'||s.home.mode==='shelter'?0:lc}}
 _month(){const P=this.E.player,p=P.get();if(!p.created||!p.alive)return;const s=this.get(),j=this.jobDef(),m=this.E.loop.month;let income=0,note=[];
  if(j&&s.job.world===p.location.world){const ill=this.E.health?this.E.health.severity():0,cal=(this._ctx(s.job.world).config.calendar||{}),off=(cal.holidayMonths||[]).includes(this.E.time.month(s.job.world)%12);
   const ap=off?0:(j.ap??1);if(p.injury>=2||ill>=2){note.push('ลาป่วย ไม่ได้เงินเดือน')}else if(p.ap<ap){note.push('แรงไม่พอไปทำงาน')}else{if(ap)P.spendAp(ap);income=j.salary;P.addMoney(income);
    if(j.monthly)R().apply(j.monthly,this.E.view(s.job.world));note.push(off?'วันหยุดยาว ได้เงินเดือนตามปกติ':'ทำงาน '+j.name)}}
  const d=this.dues(),due=d.rent+d.upkeep+d.living+s.arrears,pay=Math.min(due,P.get().money);if(pay)P.addMoney(-pay);const left=due-pay;
  this._m(x=>{x.arrears=left;x.ledger.unshift({m,income,expense:pay,owed:left,note:note.join(', ')});if(x.ledger.length>12)x.ledger.length=12});
  if(left>0&&d.rent&&left>d.rent*3)this._evict()}
 _evict(){const s=this.get(),w=s.home.world,h=this._familyHome(w),parents=this.E.family?this.E.family.members().filter(m=>/mother|father/.test(m.role)&&(this.E.npcs.get(m.npc)||{}).alive):[];
  const c=this._ctx(w),shelter=[...c.list('housing').values()].find(x=>x.shelter);const to=parents.length&&h?{id:h.id,loc:h.loc,mode:'family'}:shelter?{id:shelter.id,loc:shelter.loc,mode:'shelter'}:null;
  this._m(x=>{x.home=to?Object.assign({world:w},to):null;x.arrears=0});this.E.events&&this.E.events.log('ค้างค่าเช่านานเกินไป ถูกให้ออกจากที่พัก'+(to?` ย้ายไป${(c.list('housing').get(to.id)||{}).name}`:''));this.E.bus.emit('life:evicted',{})}
 // สถานะทางสังคม: งาน + บ้าน + ชื่อเสียง + แรงก์ (ทุกแรงก์ระบบที่ผู้เล่นมี)
 statusScore(){const p=this.E.player.get(),j=this.jobDef(),h=this.house(),s=this.get();let r=0;for(const k of Object.keys(p.ranks)){try{r+=this.E.ranks.index(k,p.ranks[k])*10}catch(e){}}
  return Math.max(0,Math.round((j&&j.status||0)+(h&&h.comfort||0)*(s.home&&s.home.mode==='own'?2:1)+p.reputation/5+r))}
 status(){const v=this.statusScore();let n=STATUS[0][1];for(const[t,name]of STATUS)if(v>=t)n=name;return n}
 _afterLoad(){const p=this.E.player.get();if(p.created&&!this.get().home)this._start()}
}
AW.systems.LifeSystem=LifeSystem;AW.systems.validateLife=validateLife;
AW.systems.LifeModule={id:'life',deps:['player'],install(e){e.life=new LifeSystem(e)}};
})(globalThis.AW);
