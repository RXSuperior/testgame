// Economy System (Phase 6): ช่องทางใช้เงิน · สภาพอุปกรณ์ · การลงทุนกิลด์ · สมุดบัญชีรายเดือน
// บริการทั้งหมดเป็นข้อมูลของโลก (data.services, data.guilds) ระบบนี้แค่คิดราคา เก็บเงิน และให้ผล
//   kind: once (ซื้อครั้งเดียว อาจมีค่าดูแลรายเดือน) · repeat (ซื้อซ้ำได้ ราคาขึ้นตาม grow) · plan (สมัครรายเดือน ยกเลิกได้)
//   ราคา: price / priceByRank, ค่ารายเดือน: monthly / monthlyByRank (ผูกกับแรงก์ผู้เล่น)
// ไม่มีหนี้: ค่ารายเดือนจ่ายไม่ไหว = บริการหยุดชั่วคราว (ไม่สะสมยอดค้าง) · plan หยุด 3 เดือนติดกันถูกยกเลิกเอง
// เงินทุกก้อนผ่าน player.addMoney ซึ่งส่ง 'money:changed' {n,cat} · ระบบอื่นใช้ economy.as(cat,fn) ระบุหมวด
// slice 'economy' เจ้าของ 'economy' · ดู docs/phase6/ECONOMY_DESIGN.md
(function(AW){
'use strict';
const OWNER='economy',VERSION=1,R=()=>AW.systems.Rules,KINDS=['once','repeat','plan'];
const PERKS={maint:'boolean',discount:'object',powerPct:'number',wearGuard:'number',injuryGuard:'number'};
const isObj=x=>x&&typeof x==='object'&&!Array.isArray(x),isInt=x=>Number.isInteger(x)&&x>=0;
const DEF_CFG={safetyCash:{E:100,D:200,C:500,B:1000,A:2000,S:4000},wearAuto:1,wearManual:3,lossWear:1.5,repairPerPoint:{E:2,D:4,C:10,B:24,A:50,S:100},lowCond:50,planGrace:3,ledgerMonths:24};
function amountOk(x,key){const v=x[key],by=x[key+'ByRank'];if(v!==undefined&&!isInt(v))return[key+' ต้องเป็นจำนวนเต็ม >= 0'];if(by!==undefined&&!(isObj(by)&&Object.values(by).every(isInt)))return[key+'ByRank ต้องเป็น {E:..} จำนวนเต็ม'];return[]}
function validateEconomy(def){const d=def.data||{},e=[],locs=new Set((d.locations||[]).map(l=>l.id)),ids=new Set();
 for(const s of d.services||[]){const p='service '+s.id+': ';if(ids.has(s.id))e.push(p+'id ซ้ำ');ids.add(s.id);
  if(typeof s.name!=='string')e.push(p+'ต้องมี name');if(!KINDS.includes(s.kind))e.push(p+'kind ต้องเป็น '+KINDS.join('|'));if(s.at&&!locs.has(s.at))e.push(p+'ไม่มีสถานที่ '+s.at);
  e.push(...amountOk(s,'price').map(x=>p+x),...amountOk(s,'monthly').map(x=>p+x));
  if(s.kind==='plan'&&!s.monthly&&!s.monthlyByRank)e.push(p+'plan ต้องมี monthly');
  if(s.grow!==undefined&&!(typeof s.grow==='number'&&s.grow>=1&&s.grow<=3))e.push(p+'grow ต้องเป็น 1..3');if(s.cap!==undefined&&!(Number.isInteger(s.cap)&&s.cap>0))e.push(p+'cap ต้องเป็นจำนวนเต็ม > 0');
  if(s.perks!==undefined){if(!isObj(s.perks))e.push(p+'perks ต้องเป็น object');else for(const[k,v]of Object.entries(s.perks)){const t=PERKS[k];if(!t)e.push(p+'perk ไม่รู้จัก '+k);else if(t==='object'?!isObj(v)||!Object.values(v).every(x=>typeof x==='number'&&x>=0&&x<=0.9):typeof v!==t)e.push(p+'perk '+k+' ผิดชนิด')}}
  for(const x of s.discounts||[]){if(!(isObj(x)&&typeof x.pct==='number'&&x.pct>0&&x.pct<=0.5))e.push(p+'discounts ต้องเป็น [{when,pct<=0.5}]');else e.push(...R().validateCond(x.when).map(y=>p+'discount: '+y))}
  e.push(...R().validateCond(s.when).map(x=>p+x),...R().validateEffects(s.effects).map(x=>p+'effects: '+x),...R().validateEffects(s.monthlyEffects).map(x=>p+'monthlyEffects: '+x))}
 for(const g of d.guilds||[]){const p='guild '+g.id+': ';if(typeof g.name!=='string')e.push(p+'ต้องมี name');
  if(!(isObj(g.yield)&&typeof g.yield.mean==='number'&&typeof g.yield.spread==='number'&&Math.abs(g.yield.mean)<0.05&&g.yield.spread>=0&&g.yield.spread<0.2))e.push(p+'yield ต้องเป็น {mean,spread} รายเดือน (|mean|<0.05)');
  if(!(typeof g.fee==='number'&&g.fee>=0&&g.fee<=0.5))e.push(p+'fee ต้องเป็น 0..0.5');if(!(isObj(g.capByRank)&&Object.values(g.capByRank).every(isInt)))e.push(p+'capByRank ต้องเป็น {E:..}');
  e.push(...R().validateCond(g.when).map(x=>p+x))}
 return e}
const scale=(list,mult)=>(list||[]).map(x=>x.money<0?{money:-Math.round(-x.money*mult)}:x);
class EconomySystem{
 constructor(E){this.E=E;this.cat=null;
  E.state.register(OWNER,OWNER,()=>({_v:VERSION,owned:{},cond:{},buffs:{},stakes:{},standing:{},ledger:[],cur:{in:0,out:0,cats:{}},totals:{in:0,out:0,months:0}}));E.worlds.addValidator(validateEconomy);
  E.bus.on('money:changed',e=>this._track(e),{prio:0,owner:OWNER});
  E.bus.on('month',()=>this._month(),{prio:31,owner:OWNER});
  E.bus.on('combat:done',rep=>this._wear(rep),{prio:5,owner:OWNER});
  E.bus.on('mission:done',()=>this._useBuff('mission'),{prio:5,owner:OWNER});
  E.bus.on('game:loaded',()=>this._afterLoad(),{prio:72,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 cfg(w=this._w()){const c=w&&this.E.worlds.ctx(w);return Object.assign({},DEF_CFG,(c&&c.config.economy)||{})}
 _w(){return this.E.player.get().location.world||this.E.worlds.current}
 // หมวดของเงินที่เข้า/ออกระหว่าง fn (ซ้อนกันได้)
 as(cat,fn){const prev=this.cat;this.cat=cat;try{return fn()}finally{this.cat=prev}}
 _track({n,cat}){const k=cat||'other';this._m(s=>{if(n>0)s.cur.in+=n;else s.cur.out-=n;const key=(n>0?'+':'-')+k;s.cur.cats[key]=(s.cur.cats[key]||0)+Math.abs(n)})}
 // ---- แรงก์และราคา ----
 rank(w){const c=this.E.worlds.ctx(w),rs=c&&c.config.rankSystem;return(rs&&this.E.player.get().ranks[rs.id])||'E'}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('services').get(id)||null:null}
 guild(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('guilds').get(id)||null:null}
 _amount(d,key,w){const by=d[key+'ByRank'];if(by){const r=this.rank(w);return by[r]??by._??d[key]??0}return d[key]||0}
 owned(q){return this.get().owned[q]||null}
 uses(q){return(this.owned(q)||{}).uses||0}
 // ส่วนลด: จาก perk discount ของบริการที่ใช้งานอยู่และงานปัจจุบัน + discounts ของบริการนั้นเอง (เลือกค่าสูงสุด ไม่ทบ)
 discount(cat){let d=0;for(const[q,o]of Object.entries(this.get().owned)){if(!o.active)continue;const x=this.def(q);const v=x&&x.perks&&x.perks.discount&&x.perks.discount[cat];if(v>d)d=v}
  const j=this.E.life&&this.E.life.jobDef();const v=j&&j.perks&&j.perks.discount&&j.perks.discount[cat];if(v>d)d=v;return Math.min(0.9,d)}
 price(q){const d=this.def(q);if(!d)return null;const w=q.split('.')[0];let p=this._amount(d,'price',w);if(d.kind==='repeat'&&d.grow)p*=Math.pow(d.grow,this.uses(q));
  let pct=this.discount(d.cat||'service');const v=this.E.view(w);for(const x of d.discounts||[])if(R().check(x.when,v))pct=Math.max(pct,x.pct);return Math.round(p*(1-pct))}
 monthly(q){const d=this.def(q);return d?Math.round(this._amount(d,'monthly',q.split('.')[0])*(1-this.discount(d.cat||'service'))):0}
 // perk รวมจากบริการที่ใช้งานอยู่ (boolean = มีอย่างน้อยหนึ่ง, number = รวม)
 perk(name){let t=PERKS[name]==='boolean'?false:0;for(const[q,o]of Object.entries(this.get().owned)){if(!o.active)continue;const d=this.def(q),v=d&&d.perks&&d.perks[name];if(v===undefined)continue;t=PERKS[name]==='boolean'?(t||!!v):t+v}return t}
 adjust(cat,effects){const d=cat?this.discount(cat):0;return d>0?scale(effects,1-d):effects}
 // ---- บริการ ----
 _why(q,d,v){const o=this.owned(q),p=this.E.player.get();if(!p.alive)return'เสียชีวิตแล้ว';if(this.E.events&&this.E.events.get().pending)return'มีเหตุการณ์ค้าง';
  if(d.kind!=='repeat'&&o)return d.kind==='plan'?'สมัครอยู่แล้ว':'มีแล้ว';if(d.cap&&this.uses(q)>=d.cap)return'ใช้ครบจำนวนแล้ว';if(!R().check(d.when,v))return d.lockText||'ยังไม่ผ่านเงื่อนไข';
  if((d.ap||0)>p.ap)return'แรงไม่พอเดือนนี้ (AP)';if(p.money<this.price(q))return'เงินไม่พอ';if(!R().affordable(d.effects,v))return'ของไม่พอ';return''}
 servicesHere(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c)return[];const v=this.E.view(w);
  return[...c.list('services').values()].filter(d=>d.at===p.location.loc&&(!d.hide||R().check(d.when,v))).map(d=>{const q=w+'.'+d.id,o=this.owned(q),why=this._why(q,d,v);
   return{id:q,name:d.name,desc:d.desc||'',kind:d.kind,cat:d.cat||'service',price:this.price(q),monthly:this.monthly(q),uses:this.uses(q),owned:!!o,active:!!(o&&o.active),paused:!!(o&&o.paused),ap:d.ap||0,ok:!why,why}})}
 buy(q){const d=this.def(q);if(!d)throw new Error('ไม่มีบริการ '+q);const w=q.split('.')[0],v=this.E.view(w),why=this._why(q,d,v);if(why)throw new Error(why);
  const price=this.price(q),P=this.E.player,m=this.E.loop.month;if(d.ap)P.spendAp(d.ap);if(price)P.addMoney(-price,d.cat||'service');
  if(d.kind==='plan'&&d.group)for(const[k]of Object.entries(this.get().owned)){const x=this.def(k);if(x&&x.kind==='plan'&&x.group===d.group&&k!==q)this._m(s=>{delete s.owned[k]})}
  this._m(s=>{const o=s.owned[q]||{since:m,uses:0,active:true,paused:false,missed:0};o.uses++;o.last=m;if(d.kind!=='repeat'){o.active=true;o.paused=false;o.missed=0}s.owned[q]=o});
  const lines=this.as(d.cat||'service',()=>R().apply(d.effects,this.E.view(w)));
  if(this.E.events)this.E.events.log(`${d.kind==='plan'?'สมัคร':'ซื้อ'}${d.name}`+(price?` (-${price})`:'')+(lines.length?` (${lines.join(', ')})`:''));this.E.bus.emit('service:bought',{id:q,price});return{price,lines}}
 // plan = ยกเลิก (ลบ) · once ที่มีค่ารายเดือน = พักใช้ (ไม่เสียค่าดูแล ไม่ได้ผล) แล้ว resume ได้
 cancel(q){const d=this.def(q),o=this.owned(q);if(!d||!o)return false;if(d.kind==='plan')this._m(s=>{delete s.owned[q]});else this._m(s=>{s.owned[q].paused=true;s.owned[q].active=false});
  if(this.E.events)this.E.events.log(`${d.kind==='plan'?'ยกเลิก':'พักใช้'}${d.name}`);return true}
 resume(q){const o=this.owned(q);if(!o||!o.paused)return false;this._m(s=>{s.owned[q].paused=false;s.owned[q].active=true;s.owned[q].missed=0});return true}
 // ---- สภาพอุปกรณ์ ----
 cond(q){const c=this.get().cond[q];return c===undefined?100:c}
 condFactor(q){const c=this.cond(q),low=this.cfg().lowCond;return c>=low?1:0.5+0.5*c/low}
 _gearRank(q){const d=this.E.player.item(q);return(d&&d.rank)||null}
 _wear(rep){const p=this.E.player.get();if(!p.created||this.perk('maint'))return;const c=this.cfg(),base=(rep.mode==='manual'?c.wearManual:c.wearAuto)*(rep.win?1:c.lossWear)*(1-Math.min(0.8,this.perk('wearGuard')));
  const eq=Object.values(p.equipment).filter(q=>q&&this._gearRank(q));if(!eq.length)return;this._m(s=>{for(const q of eq)s.cond[q]=Math.max(0,Math.round(((s.cond[q]??100)-base)*10)/10)})}
 repairCost(q){const r=this._gearRank(q);if(!r)return 0;const per=this.cfg().repairPerPoint[r]||0;return Math.ceil((100-this.cond(q))*per)}
 repair(q){const cost=this.repairCost(q);if(!cost)return 0;this.E.player.addMoney(-cost,'gear');this._m(s=>{delete s.cond[q]});if(this.E.events)this.E.events.log(`ซ่อมบำรุง${this.E.player.itemName(q)} (-${cost})`);return cost}
 // ---- บัฟชั่วคราว (เช่น ข้อมูลข่าวกรองสำหรับภารกิจถัดไป) ----
 addBuff(id,o){this._m(s=>{s.buffs[id]={n:o.n||1,pct:o.pct||0,on:o.on||'mission'}})}
 buff(){return Object.values(this.get().buffs).reduce((a,b)=>a+b.pct,0)}
 _useBuff(on){const b=this.get().buffs;if(!Object.values(b).some(x=>x.on===on))return;this._m(s=>{for(const[k,x]of Object.entries(s.buffs))if(x.on===on){x.n--;if(x.n<=0)delete s.buffs[k]}})}
 // ---- การลงทุนกิลด์ (ถอนได้ เสียค่าธรรมเนียม · ผลตอบแทนรายเดือนสุ่มแบบ seed ติดลบได้ · เพดานตามแรงก์) ----
 stake(q){return(this.get().stakes[q]||{value:0}).value}
 investCap(q){const g=this.guild(q);if(!g)return 0;const r=this.rank(q.split('.')[0]);return g.capByRank[r]??g.capByRank._??0}
 guildsHere(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c)return[];const v=this.E.view(w);
  return[...c.list('guilds').values()].filter(g=>(g.at||'association')===p.location.loc).map(g=>{const q=w+'.'+g.id;return{id:q,name:g.name,stake:this.stake(q),cap:this.investCap(q),fee:g.fee,standing:this.standing(q),ok:R().check(g.when,v),why:R().check(g.when,v)?'':(g.lockText||'ยังไม่ผ่านเงื่อนไข')}})}
 invest(q,amount){const g=this.guild(q);if(!g)throw new Error('ไม่มีกิลด์ '+q);amount=Math.floor(amount);if(!(amount>0))throw new Error('จำนวนเงินไม่ถูกต้อง');
  if(!R().check(g.when,this.E.view(q.split('.')[0])))throw new Error(g.lockText||'ยังไม่ผ่านเงื่อนไข');if(this.stake(q)+amount>this.investCap(q))throw new Error('เกินเพดานการลงทุนของแรงก์นี้ ('+this.investCap(q)+')');
  this.E.player.addMoney(-amount,'invest');this._m(s=>{const x=s.stakes[q]||{value:0,put:0};x.value+=amount;x.put+=amount;s.stakes[q]=x});if(this.E.events)this.E.events.log(`ลงทุนกับ${g.name} ${amount}`);return this.stake(q)}
 withdraw(q,amount){const g=this.guild(q),x=this.get().stakes[q];if(!g||!x)throw new Error('ไม่มีเงินลงทุนที่นี่');amount=Math.min(Math.floor(amount),Math.floor(x.value));if(!(amount>0))throw new Error('จำนวนเงินไม่ถูกต้อง');
  const fee=Math.ceil(amount*g.fee),net=amount-fee;this._m(s=>{s.stakes[q].value-=amount;s.stakes[q].put=Math.max(0,s.stakes[q].put-amount);if(s.stakes[q].value<1)delete s.stakes[q]});
  if(net)this.E.player.addMoney(net,'invest');if(this.E.events)this.E.events.log(`ถอนเงินลงทุนจาก${g.name} ${net} (ค่าธรรมเนียม ${fee})`);return net}
 standing(q){return this.get().standing[q]||0}
 addStanding(q,n){this._m(s=>{s.standing[q]=Math.max(0,(s.standing[q]||0)+n)})}
 // ---- รายเดือน: ค่าบริการ ผลประจำเดือน ผลตอบแทนการลงทุน สมุดบัญชี ----
 _month(){const p=this.E.player.get();if(!p.created){this._close();return}const m=this.E.loop.month,c=this.cfg();
  if(p.alive)for(const[q,o]of Object.entries(this.get().owned)){const d=this.def(q);if(!d||o.paused)continue;const fee=this.monthly(q),w=q.split('.')[0];
   // เงินสดคงเหลือหลังจ่ายต้องไม่ต่ำกว่าเงินสำรองฉุกเฉินตามแรงก์ (กันเงินหมดจนไม่มีค่ารักษา) ไม่งั้นข้ามเดือนนี้
   const safe=(c.safetyCash||{})[this.rank(w)]||0;if(fee>0){if(this.E.player.get().money-fee<safe){const missed=o.missed+1;
     if(d.kind==='plan'&&missed>=c.planGrace){this._m(s=>{delete s.owned[q]});this.E.events&&this.E.events.log(`${d.name} ถูกยกเลิก (ค้างชำระ ${missed} เดือน ไม่มีหนี้ติดตัว)`);continue}
     this._m(s=>{s.owned[q].active=false;s.owned[q].missed=missed});if(o.active)this.E.events&&this.E.events.log(`เงินสดเหลือน้อย ${d.name} หยุดชั่วคราว (ไม่มีหนี้)`);continue}
    this.E.player.addMoney(-fee,d.cat||'service')}
   if(!o.active||o.missed)this._m(s=>{s.owned[q].active=true;s.owned[q].missed=0});
   if(d.monthlyEffects)this.as(d.cat||'service',()=>R().apply(d.monthlyEffects,this.E.view(w)))}
  // ผลตอบแทนการลงทุน: mean ± spread (seed ของเกม) ต่อเดือน
  for(const[q,x]of Object.entries(this.get().stakes)){const g=this.guild(q);if(!g)continue;const r=g.yield.mean+g.yield.spread*(this.E.rng.next()*2-1);this._m(s=>{s.stakes[q].value=Math.max(0,Math.round(x.value*(1+r)*100)/100)})}
  this._close()}
 _close(){const m=this.E.loop.month,n=this.cfg().ledgerMonths;this._m(s=>{const cur=s.cur;s.ledger.unshift({m,in:cur.in,out:cur.out,cats:cur.cats});if(s.ledger.length>n)s.ledger.length=n;s.totals.in+=cur.in;s.totals.out+=cur.out;s.totals.months++;s.cur={in:0,out:0,cats:{}}})}
 summary(){const s=this.get(),t=s.totals,mo=Math.max(1,t.months);return{inMo:Math.round(t.in/mo),outMo:Math.round(t.out/mo),owned:Object.keys(s.owned).length,stakes:Math.round(Object.values(s.stakes).reduce((a,x)=>a+x.value,0)),standing:Object.assign({},s.standing)}}
 // หลังโหลด: ทิ้งบริการ/กิลด์ที่ไม่มีในโลกที่ติดตั้ง และสภาพของอุปกรณ์ที่ไม่มีแล้ว
 _afterLoad(){const s=this.get(),inv=this.E.player.get().inventory,bad=Object.keys(s.owned).filter(q=>!this.def(q)),badS=Object.keys(s.stakes).filter(q=>!this.guild(q)),badC=Object.keys(s.cond).filter(q=>!inv[q]);
  if(bad.length||badS.length||badC.length)this._m(x=>{for(const q of bad)delete x.owned[q];for(const q of badS)delete x.stakes[q];for(const q of badC)delete x.cond[q]})}
}
// ---- เงื่อนไขและผลใหม่ของระบบนี้ (ลงทะเบียนเข้า Rules) ----
const C=AW.systems.Rules.COND,F=AW.systems.Rules.EFF,qid=(x,v)=>AW.systems.Rules.qid(x,v.worldId),inR=(v,c)=>(c.min===undefined||v>=c.min)&&(c.max===undefined||v<=c.max);
C.service={ok:(c,v)=>{const o=v.E.economy&&v.E.economy.owned(qid(c.id,v));return c.active===false?!o||!o.active:!!(o&&(c.active===undefined||o.active))},val:c=>isObj(c)&&typeof c.id==='string'?[]:['service ต้องเป็น {id,active}']};
C.serviceUses={ok:(c,v)=>inR(v.E.economy?v.E.economy.uses(qid(c.id,v)):0,c),val:c=>isObj(c)&&typeof c.id==='string'?[]:['serviceUses ต้องเป็น {id,min,max}']};
C.guildStanding={ok:(c,v)=>inR(v.E.economy?v.E.economy.standing(qid(c.id,v)):0,c),val:c=>isObj(c)&&typeof c.id==='string'?[]:['guildStanding ต้องเป็น {id,min}']};
C.stake={ok:(c,v)=>inR(v.E.economy?v.E.economy.stake(qid(c.id,v)):0,c),val:c=>isObj(c)&&typeof c.id==='string'?[]:['stake ต้องเป็น {id,min}']};
C.homeOwned={ok:(c,v)=>!!(v.E.life&&v.E.life.get().home&&v.E.life.get().home.mode==='own')===c,val:c=>typeof c==='boolean'?[]:['homeOwned ต้องเป็น true/false']};
F.guildStanding={run:(x,v)=>{v.E.economy.addStanding(qid(x.id,v),x.n);return`ความเชื่อถือกิลด์ ${x.n>0?'+':''}${x.n}`},val:x=>isObj(x)&&typeof x.id==='string'&&typeof x.n==='number'?[]:['guildStanding ต้องเป็น {id,n}']};
F.buff={run:(x,v)=>{v.E.economy.addBuff(x.id,x);return`${x.name||'บัฟ'} (${x.n||1} ครั้ง)`},val:x=>isObj(x)&&typeof x.id==='string'&&typeof x.pct==='number'&&x.pct>0&&x.pct<=0.3?[]:['buff ต้องเป็น {id,pct<=0.3,n}']};
F.repairAll={run:(x,v)=>{const E=v.E,eq=Object.values(E.player.get().equipment).filter(Boolean);E.economy._m(s=>{for(const q of eq)delete s.cond[q]});return'อุปกรณ์กลับมาสภาพดี'},val:x=>x===true?[]:['repairAll ต้องเป็น true']};
AW.systems.EconomySystem=EconomySystem;AW.systems.validateEconomy=validateEconomy;AW.systems.ECON_PERKS=PERKS;
AW.systems.EconomyModule={id:'economy',deps:['life','party'],install(e){e.economy=new EconomySystem(e)}};
})(globalThis.AW);
