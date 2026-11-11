// Gate Progression: การเข้าถึง Gate แบบเกมเพลย์ (แยกจาก Debug ซึ่งเรียก worlds.travelVia ตรง ๆ)
// สถานะ gate: hidden (ยังไม่ค้นพบ) -> known (ค้นพบแล้ว แต่ยังไม่เปิด) -> open (เดินทางได้)
// ข้อมูลใน data.gates: discover (เงื่อนไขค้นพบอัตโนมัติ), openBy:'event' (ต้องเปิดด้วยผล gateOpen), travel (เงื่อนไขเดินทาง), cost (ผลที่หักตอนเดินทาง)
// gate ที่ไม่มี discover/openBy ถือว่าเปิดอยู่แล้ว (เข้ากันได้กับโลกเดิม) · slice 'gates' เจ้าของ 'gates'
(function(AW){
'use strict';
const OWNER='gates',VERSION=1,R=()=>AW.systems.Rules;
function validateGates(def){const e=[];for(const g of(def.data||{}).gates||[]){const p='gate '+g.id+': ';e.push(...R().validateCond(g.discover).map(x=>p+'discover: '+x),...R().validateCond(g.travel).map(x=>p+'travel: '+x),...R().validateEffects(g.cost).map(x=>p+'cost: '+x));
 if(g.openBy!==undefined&&g.openBy!=='event')e.push(p+"openBy ต้องเป็น 'event'")}return e}
class GateSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,known:{},open:{}}));E.worlds.addValidator(validateGates);
  E.bus.on('month:after',()=>this._discover(),{prio:5,owner:OWNER});E.bus.on('player:moved',()=>this._discover(),{prio:5,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('gates').get(id)||null:null}
 status(q){const g=this.def(q);if(!g)return null;const s=this.get();if(s.open[q]||(!g.discover&&!g.openBy))return'open';if(s.known[q]||!g.discover)return g.openBy?'known':'open';return'hidden'}
 discover(q){if(!this.def(q))throw new Error('ไม่มี gate '+q);if(this.get().known[q])return false;this._m(s=>{s.known[q]=true});this.E.events&&this.E.events.log('ค้นพบ '+this.def(q).name);this.E.bus.emit('gate:discovered',{id:q});return true}
 open(q){if(!this.def(q))throw new Error('ไม่มี gate '+q);this._m(s=>{s.known[q]=true;s.open[q]=true});this.E.bus.emit('gate:opened',{id:q})}
 _discover(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c||!p.created||!p.alive)return;const v=this.E.view(w);
  for(const g of c.list('gates').values()){const q=w+'.'+g.id;if(g.discover&&!this.get().known[q]&&R().check(g.discover,v))this.discover(q)}}
 // รายการสำหรับ UI: gate ที่ค้นพบแล้วในโลกปัจจุบัน พร้อมเหตุผลถ้ายังไปไม่ได้
 list(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c)return[];const v=this.E.view(w);
  return[...c.list('gates').values()].map(g=>{const q=w+'.'+g.id,st=this.status(q);if(st==='hidden')return null;
   const why=!p.alive?'เสียชีวิตแล้ว':st!=='open'?'ยังไม่เปิด':!R().check(g.travel,v)?(g.travelText||'ยังไม่ผ่านเงื่อนไข'):!R().affordable(g.cost,v)?'ค่าใช้จ่ายไม่พอ':this.E.events&&this.E.events.get().pending?'มีเหตุการณ์ค้าง':'';
   return{id:q,name:g.name,to:g.to,months:g.months||0,status:st,why}}).filter(Boolean)}
 travel(q){const g=this.def(q),a=this.list().find(x=>x.id===q);if(!g||!a)throw new Error('ไม่มี gate นี้ในที่ที่อยู่');if(a.why)throw new Error(a.why);
  const w=q.split('.')[0];if(g.cost)R().apply(g.cost,this.E.view(w));return this.E.worlds.travelVia(g.id)}
}
AW.systems.GateSystem=GateSystem;AW.systems.validateGates=validateGates;
AW.systems.GatesModule={id:'gates',deps:['events'],install(e){e.gates=new GateSystem(e)}};
})(globalThis.AW);
