// Rank System: แรงก์แบบข้อมูล ประกาศใน config.rankSystem ของโลก (เช่นแรงก์ฮันเตอร์ E–S)
// {id, order:[...], initial:[{rank, when}], promote:{D:{when}, C:{when}}} · เกณฑ์ใช้ Rules ทั้งหมด
// แรงก์เก็บใน player.ranks[id] (ข้อมูลกลาง ข้ามโลกได้) · เลื่อนได้เมื่อผ่านเกณฑ์เท่านั้น ไม่มีทางลัด
// ไฟล์นี้ยังสร้าง engine.view(worldId) ให้ Rules ใช้ (มุมมองอ่านอย่างเดียวของผู้เล่นและระบบที่เกี่ยวข้อง)
(function(AW){
'use strict';
const R=()=>AW.systems.Rules;
class RankSystem{
 constructor(E){this.E=E}
 def(sys){for(const id of this.E.worlds.ids()){const r=this.E.worlds.ctx(id).config.rankSystem;if(r&&r.id===sys)return r}throw new Error('ไม่มีระบบแรงก์ '+sys)}
 index(sys,r){const i=this.def(sys).order.indexOf(r);if(i<0)throw new Error(`แรงก์ ${r} ไม่มีใน ${sys}`);return i}
 of(sys){return this.E.player.get().ranks[sys]||null}
 // ประเมินครั้งแรก: แถวแรกใน initial ที่เงื่อนไขผ่าน (แถวสุดท้ายควรไม่มีเงื่อนไข)
 init(sys,v){if(this.of(sys))throw new Error('ประเมินแรงก์ไปแล้ว');const d=this.def(sys);const row=d.initial.find(x=>R().check(x.when,v));if(!row)throw new Error('ไม่ผ่านเกณฑ์ประเมินแรงก์');
  this.E.player.setRank(sys,row.rank);this.E.bus.emit('rank:set',{sys,rank:row.rank,initial:true});return row.rank}
 next(sys){const d=this.def(sys),r=this.of(sys);if(!r)return null;return d.order[d.order.indexOf(r)+1]||null}
 // ผ่านเกณฑ์ขั้นถัดไปไหม (ยังไม่เลื่อน) คืนชื่อแรงก์ถัดไปหรือ null
 canPromote(sys,v){const n=this.next(sys);if(!n)return null;const rule=this.def(sys).promote[n];if(!rule)return null;return R().check(rule.when,v||this.E.view(this.E.player.get().location.world))?n:null}
 promote(sys,v){const n=this.canPromote(sys,v);if(!n)return null;this.E.player.setRank(sys,n);this.E.bus.emit('rank:set',{sys,rank:n});return n}
 // ตรวจข้อมูลระบบแรงก์ของโลก (เรียกตอนตรวจเนื้อหา)
 static validate(d){const e=[];if(!d)return e;if(typeof d.id!=='string'||!Array.isArray(d.order)||!d.order.length)return['rankSystem ต้องมี id และ order'];
  if(!Array.isArray(d.initial)||!d.initial.length)e.push('rankSystem.initial ว่าง');for(const x of d.initial||[]){if(!d.order.includes(x.rank))e.push('initial แรงก์ไม่รู้จัก '+x.rank);e.push(...R().validateCond(x.when))}
  for(const k of Object.keys(d.promote||{})){if(!d.order.includes(k))e.push('promote แรงก์ไม่รู้จัก '+k);e.push(...R().validateCond(d.promote[k].when))}return e}
}
AW.systems.RankSystem=RankSystem;
AW.systems.RanksModule={id:'ranks',deps:['player'],install(e){e.ranks=new RankSystem(e);
 e.view=(worldId)=>{const c=worldId&&e.worlds.ctx(worldId),rs=c&&c.config.rankSystem;
  // ค่าเป็น getter เพื่อให้เห็นข้อมูลล่าสุดเสมอ (ผลหลายข้อในชุดเดียวกันต่อเนื่องกันได้ เช่น exp แล้ว rankUp)
  return{E:e,P:e.player,get player(){return e.player.get()},world:c||null,worldId:worldId||null,rankSys:rs?rs.id:null,ranks:e.ranks,
   get events(){return e.state.slices.has('events')?e.state.get('events'):{done:{}}},get missions(){return e.state.slices.has('missions')?e.state.get('missions'):{byTag:{}}},
   get rng(){return e.rng},get eventsApi(){return e.events||null}}}}};
})(globalThis.AW);
