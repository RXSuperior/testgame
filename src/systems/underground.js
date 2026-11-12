// Underground (Dark Market) System: ชื่อเสียงฝั่งใต้ดิน (rep), ความสนใจของทางการ (heat), สิทธิ์เข้าตลาดมืด (access)
// เนื้อหาทั้งหมด (ตลาดมืด ผู้ค้า สินค้า ข่าว การสอบสวน) อยู่ในข้อมูลโลกเป็นเหตุการณ์/กิจกรรม ระบบนี้เก็บแค่ค่าและกติกา
// กติกา: heat ลดเดือนละ 3 · ทุกการกระทำผิดเพิ่ม heat · heat สูงทำให้เกิดการสอบสวน (เหตุการณ์ในข้อมูล) ที่มีผลเสียจริง
// ห้ามให้การกระทำผิดเป็นทางรวยเร็วโดยไม่มีผลเสีย: กำไรมาพร้อม heat ความเสี่ยงถูกโกง/ถูกจับ และกรรมที่ลดลง
(function(AW){
'use strict';
const OWNER='underground',VERSION=1;
class UndergroundSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,rep:0,heat:0,access:false,deals:0,caught:0}));
  E.bus.on('month',()=>{const p=E.player.get();if(p.created&&p.alive&&this.get().heat>0)this._m(s=>{s.heat=Math.max(0,s.heat-3)})},{prio:10,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 addRep(n){this._m(s=>{s.rep=Math.max(-100,Math.min(100,s.rep+n));if(n>0)s.deals++})}
 addHeat(n){this._m(s=>{s.heat=Math.max(0,Math.min(100,s.heat+n))})}
 setAccess(on){this._m(s=>{s.access=!!on})}
 caught(){this._m(s=>{s.caught++})}
}
AW.systems.UndergroundSystem=UndergroundSystem;
AW.systems.UndergroundModule={id:'underground',deps:['player'],install(e){e.underground=new UndergroundSystem(e)}};
})(globalThis.AW);
