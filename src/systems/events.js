// Event System: เหตุการณ์แบบ Ask/Answer จากข้อมูลของโลก (data.events) ไม่มีเนื้อเรื่องในโค้ดนี้
// trigger: 'auto' (ทุกเดือนเมื่อเงื่อนไขผ่าน เรียงตาม priority) · 'month' (สุ่มตาม weight เดือนละไม่เกินหนึ่งครั้ง)
//          'enter' (เมื่อผู้เล่นเข้าสถานที่ at) · 'action' (ผู้เล่นกดเองที่สถานที่ ใช้ AP)
// เหตุการณ์ค้าง (pending) ทำให้เวลาหยุด (loop reason 'event') จนกว่าจะตอบ · ตอบแล้วถ้ามี next จะต่อเรื่องทันที
// slice 'events' เจ้าของ 'events' เก็บ pending, done, last, unlocked, log · ดู docs/phase3/STORY_EVENT_SYSTEM.md
(function(AW){
'use strict';
const OWNER='events',R=()=>AW.systems.Rules,TRIGGERS=['auto','month','enter','action','passive','dungeon','tower'],WHO_KEYS=['npc','rel','role','tag','alive','here','died','minAff','maxAff','minAge','party','injured'],DC={easy:10,mid:22,hard:36,ext:55},STATS=['str','agi','int','vit','cha','luk'];
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
// ตรวจข้อมูลเหตุการณ์ทั้งโลก (เรียกโดย WorldSystem ก่อนลงทะเบียน)
function validateEvents(def){const d=def.data||{},ev=d.events||[],npcs=new Set((d.npcs||[]).map(n=>n.id)),ids=new Set(ev.map(e=>e.id)),locs=new Set((d.locations||[]).map(l=>l.id)),en=new Set((d.enemies||[]).map(x=>x.id)),e=[];
 const ref=(id)=>typeof id==='string'&&(id.includes('.')||ids.has(id));
 for(const x of ev){const p='event '+x.id+': ';
  if(typeof x.title!=='string'||typeof x.text!=='string')e.push(p+'ต้องมี title และ text');
  if(!TRIGGERS.includes(x.trigger))e.push(p+'trigger ไม่รู้จัก '+x.trigger);
  if((x.trigger==='enter'||x.trigger==='action')&&!x.at)e.push(p+'trigger '+x.trigger+' ต้องมี at');
  if(x.at&&!locs.has(x.at))e.push(p+'at ไม่มีสถานที่ '+x.at);
  for(const k of['weight','priority','cooldown'])if(x[k]!==undefined&&(typeof x[k]!=='number'||x[k]<0))e.push(p+k+' ต้องเป็นตัวเลข >= 0');
  if(x.cost&&!(isObj(x.cost)&&Object.keys(x.cost).every(k=>k==='ap'&&Number.isInteger(x.cost[k])&&x.cost[k]>=0)))e.push(p+'cost ต้องเป็น {ap}');
  e.push(...R().validateCond(x.when).map(m=>p+m));
  if(x.who!==undefined){if(!isObj(x.who)||!Object.keys(x.who).every(k=>WHO_KEYS.includes(k)))e.push(p+'who ใช้ได้เฉพาะ '+WHO_KEYS.join(','));if(x.who&&x.who.npc&&!npcs.has(x.who.npc))e.push(p+'who อ้าง NPC ที่ไม่มี '+x.who.npc)}
  const walk=o=>{if(Array.isArray(o))return o.forEach(walk);if(!isObj(o))return;if(typeof o.npc==='string'){if(o.npc==='$who'){if(!x.who&&!JSON.stringify(x).includes('"meet"'))e.push(p+"ใช้ '$who' ต้องมี who")}else if(!o.npc.includes('.')&&!npcs.has(o.npc))e.push(p+'อ้าง NPC ที่ไม่มี '+o.npc)}
   for(const k of Object.keys(o))if(k!=='text')walk(o[k])};walk([x.when,x.choices]);
  if(!Array.isArray(x.choices)||!x.choices.length){e.push(p+'ต้องมี choices อย่างน้อย 1');continue}
  x.choices.forEach((c,i)=>{const q=p+'choice '+i+': ';if(typeof c.text!=='string')e.push(q+'ต้องมี text');
   e.push(...R().validateCond(c.when).map(m=>q+m));
   if(c.check&&c.fight)e.push(q+'ใช้ check กับ fight พร้อมกันไม่ได้');
   if(c.check&&!(STATS.includes(c.check.stat)&&DC[c.check.dc]!==undefined&&(c.check.trait===undefined||AW.systems.TRAITS.includes(c.check.trait))))e.push(q+'check ต้องเป็น {stat,dc:easy|mid|hard|ext,trait?}');
   if(c.fight&&!en.has(c.fight.enemy))e.push(q+'ไม่มีศัตรู '+(c.fight&&c.fight.enemy));
   if(!isObj(c.ok)||typeof c.ok.text!=='string')e.push(q+'ต้องมี ok.text');else e.push(...R().validateEffects(c.ok.effects).map(m=>q+'ok: '+m));
   if((c.check||c.fight)&&!(isObj(c.fail)&&typeof c.fail.text==='string'))e.push(q+'มี check/fight ต้องมี fail.text');
   if(c.fail)e.push(...R().validateEffects(c.fail.effects).map(m=>q+'fail: '+m));
   for(const r of[c.next].concat([...(c.ok&&c.ok.effects||[]),...(c.fail&&c.fail.effects||[])].filter(f=>f.unlock).map(f=>f.unlock)))if(r!==undefined&&!ref(r))e.push(q+'อ้างเหตุการณ์ที่ไม่มี '+r)});
  try{JSON.stringify(x)}catch(err){e.push(p+'ต้องเป็นข้อมูล JSON')}}
 return e}
class EventSystem{
 constructor(E){this.E=E;E.state.register('events',OWNER,()=>({pending:null,done:{},last:{},unlocked:{},log:[]}));
  E.worlds.addValidator(validateEvents);
  E.bus.on('month:after',()=>this._month(),{prio:0,owner:OWNER});
  // เหตุการณ์ enter ที่แสดงไปแล้วในการมาครั้งนี้จะไม่ขึ้นซ้ำ (กันวนกรณีเลือก 'ไว้ก่อน') ล้างเมื่อย้ายที่
  this._seen=new Set();E.bus.on('player:moved',({world,loc})=>{this._seen=new Set();this._enter(world,loc)},{prio:0,owner:OWNER});
  E.bus.on('game:loaded',()=>{if(this.pending())E.loop.pause('event')},{prio:0,owner:OWNER});
  E.bus.on('game:new',()=>E.loop.resume('event'),{prio:0,owner:OWNER});
  E.bus.on('player:created',()=>this._month({autoOnly:true}),{prio:0,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.events.get(id)||null:null}
 view(w){return this.E.view(w)}
 log(t){const m=this.E.loop.month;this._m(s=>{s.log.unshift({m,t});if(s.log.length>80)s.log.length=80})}
 pending(){const p=this.get().pending;return p?Object.assign({},p,{def:this.def(p.id)}):null}
 _active(){const p=this.E.player.get();return p.created&&p.alive&&p.location.world&&this.E.worlds.has(p.location.world)&&!this.E.time.state.get('worlds_time').traveling&&!this.get().pending}
 // ผ่านเงื่อนไขทุกข้อไหม (ไม่รวมการสุ่ม trigger)
 eligible(q,{v}={}){const x=this.def(q);if(!x)return false;const s=this.get(),w=q.split('.')[0],P=this.E.player.get();
  if(P.location.world!==w)return false;if(x.at&&P.location.loc!==x.at)return false;
  if(x.locked&&!s.unlocked[q])return false;if(x.once&&s.done[q])return false;
  if(x.cooldown&&s.last[q]!==undefined&&this.E.loop.month-s.last[q]<x.cooldown)return false;
  if(x.who&&!this.pickWho(q))return false;
  return R().check(x.when,this._v(w,x.who?this.pickWho(q):null))}
 _v(w,who){const v=this.view(w);v.who=who||null;return v}
 // เลือก NPC ของเหตุการณ์ (who): เรียงจากคนที่ชอบผู้เล่นมากที่สุด เพื่อให้ได้ผลเดิมทุกครั้ง
 pickWho(q){const x=this.def(q),wh=x&&x.who;if(!wh)return null;const w=q.split('.')[0],N=this.E.npcs,Rl=this.E.rels,P=this.E.player.get(),F=this.E.family;if(!N)return null;
  const alive=wh.alive??(wh.died?false:true),m=this.E.loop.month;
  let c=wh.npc?[N.get(w+'.'+wh.npc)].filter(Boolean):N.all(w);
  c=c.filter(n=>n.alive===alive);
  if(wh.died)c=c.filter(n=>n.death&&m-n.death.global<=wh.died.within);
  if(wh.tag)c=c.filter(n=>n.tags.includes(wh.tag));
  if(wh.role)c=c.filter(n=>F&&(wh.role==='family'?!!F.roleOf(n.id):wh.role==='sibling'?/sibling/.test(F.roleOf(n.id)||''):F.roleOf(n.id)===wh.role));
  if(wh.rel)c=c.filter(n=>[].concat(wh.rel).includes(Rl.type(n.id,'player')));
  const aff=n=>{const e=Rl.edge(n.id,'player');return e?e.aff:0};
  if(wh.minAff!==undefined)c=c.filter(n=>aff(n)>=wh.minAff);if(wh.maxAff!==undefined)c=c.filter(n=>aff(n)<=wh.maxAff);
  if(wh.here)c=c.filter(n=>N.where(n)===P.location.loc);if(wh.party)c=c.filter(n=>this.E.party&&this.E.party.isMember(n.id));
  if(wh.injured)c=c.filter(n=>this.E.party&&(this.E.party.get().members.find(m=>m.npc===n.id)||{}).injury>0);if(wh.minAge!==undefined)c=c.filter(n=>N.ageY(n.id)>=wh.minAge);
  // oncePerWho: เหตุการณ์เกิดได้ครั้งเดียวต่อคน (เช่น งานศพของแต่ละคน)
  if(x.oncePerWho){const d=this.get().done;c=c.filter(n=>!d[q+'@'+n.id])}
  c.sort((a,b)=>aff(b)-aff(a)||(a.id<b.id?-1:1));return c.length?c[0].id:null}
 _list(trigger,w){const c=this.E.worlds.ctx(w);return c?[...c.events.values()].filter(x=>x.trigger===trigger).map(x=>w+'.'+x.id):[]}
 _month({autoOnly=false}={}){if(!this._active())return;const w=this.E.player.get().location.world,c=this.E.worlds.ctx(w);
  const auto=this._list('auto',w).filter(q=>this.eligible(q)).sort((a,b)=>(this.def(b).priority||0)-(this.def(a).priority||0));
  if(auto.length)return this.present(auto[0]);if(autoOnly)return;
  // เรื่องสั้นผ่าน ๆ (passive): ใช้ผลทันที ลงบันทึก ไม่หยุดเวลา
  if(this.E.rng.next()<(c.config.passiveChance??0)){const ps=this._list('passive',w).filter(q=>this.eligible(q));if(ps.length)this._passive(ps[this.E.rng.int(0,ps.length-1)])}
  const ch=c.config.eventChance??0.4;if(this.E.rng.next()>=ch)return;
  const pool=this._list('month',w).filter(q=>this.eligible(q));if(!pool.length)return;
  const tot=pool.reduce((a,q)=>a+(this.def(q).weight??1),0);let r=this.E.rng.next()*tot;
  for(const q of pool){r-=this.def(q).weight??1;if(r<0)return this.present(q)}return this.present(pool[pool.length-1])}
 _enter(w,loc){if(!this._active())return;const list=this._list('enter',w).filter(q=>this.def(q).at===loc&&!this._seen.has(q)&&this.eligible(q)).sort((a,b)=>(this.def(b).priority||0)-(this.def(a).priority||0));
  if(list.length){this._seen.add(list[0]);this.present(list[0])}}
 // แสดงเหตุการณ์: เก็บเป็น pending และหยุดเวลา
 present(q,who){if(!this.def(q))throw new Error('ไม่มีเหตุการณ์ '+q);if(this.get().pending)throw new Error('มีเหตุการณ์ค้างอยู่');
  const wh=who||this.pickWho(q);if(this.def(q).who&&!wh)throw new Error('ไม่มีตัวละครสำหรับเหตุการณ์ '+q);
  this._m(s=>{s.pending={id:q,at:this.E.loop.month,who:wh||null}});this.E.loop.pause('event');this.E.bus.emit('event:show',{id:q});return this.pending()}
 // ตัวเลือกที่แสดง: ทุกข้อ พร้อมสถานะเลือกได้/ไม่ได้ และโอกาสสำเร็จ
 choices(){const p=this.pending();if(!p)return[];const w=p.id.split('.')[0],v=this._v(w,p.who);
  return p.def.choices.map((c,i)=>({i,text:c.text,ok:R().check(c.when,v)&&R().affordable(c.ok&&c.ok.effects,v),lockText:c.lockText||'',chance:this.chance(c,w)}))}
 chance(c,w){if(c.fight)return this.E.combat.chance(w,c.fight.enemy,c.fight.mult||1);
  if(!c.check)return 1;const p=this.E.player.get(),rs=this.E.worlds.ctx(w).config.rankSystem,r=rs&&p.ranks[rs.id];
  // สูตรเดิม logic4.js:144: หลังตื่นพลังเกณฑ์ยากขึ้นตามแรงก์ เพราะค่าสถานะโตเร็ว
  // นิสัยช่วยหรือขัด: check.trait บวกโอกาส trait/200 (นิสัยติดลบก็ลดโอกาส)
  const off=p.class?18+(r?rs.order.indexOf(r):0)*12:0,tb=c.check.trait?p.traits[c.check.trait]/200:0;return Math.round(Math.max(0.05,Math.min(0.97,0.5+(p.stats[c.check.stat]-DC[c.check.dc]-off)/30+tb))*100)/100}
 // ตอบ: ตรวจว่าเลือกได้ -> ทอย check/fight -> ใช้ผล -> บันทึก -> ต่อ next หรือปล่อยเวลาเดิน
 answer(i){const p=this.pending();if(!p)throw new Error('ไม่มีเหตุการณ์ค้าง');const c=p.def.choices[i];if(!c)throw new Error('ไม่มีตัวเลือก '+i);
  const w=p.id.split('.')[0],v=this._v(w,p.who);if(!R().check(c.when,v))throw new Error('ยังเลือกข้อนี้ไม่ได้');if(!R().affordable(c.ok&&c.ok.effects,v))throw new Error('เงินหรือของไม่พอ');
  let success=true,fight=null;
  if(c.check)success=this.E.rng.next()<this.chance(c,w);
  if(c.fight){fight=this.E.combat.fight({worldId:w,enemy:c.fight.enemy,mode:c.fight.mode||'auto',mult:c.fight.mult||1});success=fight.win}
  const out=success?c.ok:c.fail,lines=R().apply(out.effects,v);
  if(p.who&&this.E.npcs.get(p.who))this.E.npcs.remember(p.who,`${p.def.title}: ${c.text}`,p.id);
  const text=this.fmt(out.text,v.who),res={id:p.id,title:this.fmt(p.def.title,v.who),choice:c.text,success,text,effects:lines,fight};
  this._m(s=>{s.pending=null;s.done[p.id]=(s.done[p.id]||0)+1;s.last[p.id]=this.E.loop.month;if(p.who)s.done[p.id+'@'+p.who]=1});
  this.log(`${p.def.title}: ${text}`+(lines.length?` (${lines.join(', ')})`:''));
  this.E.bus.emit('event:answered',res);
  const nx=c.next&&(c.next.includes('.')?c.next:w+'.'+c.next);
  // ต่อเรื่อง: next ก่อน ไม่มีก็ดูเหตุการณ์ enter อื่นที่สถานที่เดิม (เช่น ประเมินแรงก์ -> ลงทะเบียน)
  if(nx)this.present(nx);else{this.E.loop.resume('event');const L=this.E.player.get().location;if(L.world)this._enter(L.world,L.loc)}
  return res}
 // กิจกรรมที่สถานที่ปัจจุบัน
 actions(){const p=this.E.player.get(),w=p.location.world;if(!w||!this.E.worlds.has(w))return[];
  return this._list('action',w).filter(q=>this.def(q).at===p.location.loc).map(q=>{const x=this.def(q),v=this.view(w),ap=(x.cost&&x.cost.ap)??1;
   return{id:q,title:x.title,ap,ok:!this.get().pending&&this.eligible(q,{v})&&p.ap>=ap&&R().affordable(x.choices[0].ok.effects,v)}})}
 // ทำกิจกรรม: กิจกรรมตัวเลือกเดียวใช้ผลทันที กิจกรรมหลายตัวเลือกแสดงเป็นเหตุการณ์
 doAction(q){const x=this.def(q);if(!x||x.trigger!=='action')throw new Error('ไม่มีกิจกรรม '+q);if(this.get().pending)throw new Error('มีเหตุการณ์ค้างอยู่');
  if(!this.eligible(q))throw new Error('ทำกิจกรรมนี้ไม่ได้ตอนนี้');const ap=(x.cost&&x.cost.ap)??1;if(ap)this.E.player.spendAp(ap);
  this.present(q);if(x.choices.length===1)return this.answer(0);return this.pending()}
 _passive(q){const x=this.def(q),w=q.split('.')[0],wh=this.pickWho(q),v=this._v(w,wh),o=x.choices[0].ok,lines=R().apply(o.effects,v);
  this._m(s=>{s.done[q]=(s.done[q]||0)+1;s.last[q]=this.E.loop.month});this.log(this.fmt(o.text||x.text,wh)+(lines.length?` (${lines.join(', ')})`:''));this.E.bus.emit('event:passive',{id:q})}
 unlock(q){this._m(s=>{s.unlocked[q]=true})}
 fmt(t,who){const p=this.E.player.get(),pend=this.get().pending,wq=who||(pend&&pend.who),n=wq&&this.E.npcs&&this.E.npcs.get(wq);
  return String(t).replace(/\{name\}/g,p.name).replace(/\{age\}/g,String(Math.floor(p.age/12))).replace(/\{who\}/g,n?n.name:'คนผู้นั้น')}
}
AW.systems.EventSystem=EventSystem;AW.systems.validateEvents=validateEvents;AW.systems.CHECK_DC=DC;
AW.systems.EventsModule={id:'events',deps:['ranks','combat'],install(e){e.events=new EventSystem(e)}};
})(globalThis.AW);
