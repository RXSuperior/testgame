// Multiverse Time: ทุกโลกมีเวลาท้องถิ่นของตัวเอง เดินตาม global tick คูณ timeRate
// เก็บเป็นจำนวนเต็มหน่วย 1/1000 เดือน (acc) จึงไม่มีเศษทศนิยมคลาดสะสม: เดือนท้องถิ่น = floor(acc/1000)
// ทุกโลกที่ลงทะเบียนเดินเวลาทุก tick แม้ผู้เล่นไม่อยู่ · อายุผู้เล่นคิดจาก global month เท่านั้น
// ดู docs/MULTIVERSE_TIME_DESIGN.md
(function(AW){
'use strict';
const UNIT=1000,OWNER='worldtime';
class WorldTime{
 constructor(state,bus,loop){this.state=state;this.bus=bus;this.loop=loop;this.rates=new Map();
  state.register('worlds_time',OWNER,()=>({current:null,traveling:null,acc:{}}));
  bus.on('month',()=>this._advance(1),{prio:50,owner:OWNER})}
 static rateUnits(rate){const u=Math.round(rate*UNIT);if(!(rate>0)||u<1||u>100*UNIT||Math.abs(u-rate*UNIT)>1e-9)throw new Error('timeRate ไม่ถูกต้อง: '+rate);return u}
 addWorld(id,rate){if(this.rates.has(id))throw new Error('โลกซ้ำ: '+id);this.rates.set(id,WorldTime.rateUnits(rate))}
 removeWorld(id){this.rates.delete(id)}
 has(id){return this.rates.has(id)}
 _acc(id){const a=this.state.get('worlds_time').acc[id];return a||0}
 month(id){if(!this.rates.has(id))throw new Error('ไม่มีโลก '+id);return Math.floor(this._acc(id)/UNIT)}
 fraction(id){return(this._acc(id)%UNIT)/UNIT}
 get current(){return this.state.get('worlds_time').current}
 _advance(n){const ev=[];this.state.mutate(OWNER,'worlds_time',t=>{for(const[id,u]of this.rates){const a=t.acc[id]||0,b=a+u*n;t.acc[id]=b;
   for(let m=Math.floor(a/UNIT)+1;m<=Math.floor(b/UNIT);m++)ev.push({world:id,month:m})}});
  for(const e of ev)this.bus.emit('world:month',e)}
 // เข้าโลกแรก (ไม่ใช่การเดินทาง)
 enter(id){this.month(id);this.state.mutate(OWNER,'worlds_time',t=>{t.current=id})}
 // Gate ปกติ months=0: ทันที global time ไม่เดิน · Gate พิเศษ months>0: global time เดินจริง n tick (อายุ +n ทุกโลกเดินตาม rate)
 travel(to,{months=0}={}){this.month(to);if(!Number.isInteger(months)||months<0)throw new Error('เวลาเดินทางต้องเป็นจำนวนเต็ม >= 0');
  const from=this.current;if(this.state.get('worlds_time').traveling)throw new Error('กำลังเดินทางอยู่');
  this.state.mutate(OWNER,'worlds_time',t=>{t.traveling={from,to,left:months};t.current=null});this.bus.emit('gate:depart',{from,to,months});
  // ถ้า error ระหว่างทาง: ยกเลิก กลับโลกต้นทาง เวลาที่ผ่านไปแล้วไม่ย้อน (ไม่ค้างสถานะ traveling)
  let done=0;try{for(let i=0;i<months;i++){this.loop.tick(true);done++;this.state.mutate(OWNER,'worlds_time',t=>{t.traveling.left--})}}
  catch(err){this.state.mutate(OWNER,'worlds_time',t=>{t.traveling=null;t.current=from});this.bus.emit('gate:abort',{from,to,months,elapsed:done,error:err.message});throw err}
  this.state.mutate(OWNER,'worlds_time',t=>{t.traveling=null;t.current=to});this.bus.emit('gate:arrive',{from,to,months});return months}
}
AW.core.WorldTime=WorldTime;AW.core.TIME_UNIT=UNIT;
})(globalThis.AW);
