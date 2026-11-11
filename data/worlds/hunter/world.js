// Hunter World: ประกอบนิยามโลกจากไฟล์ข้อมูลในโฟลเดอร์นี้ (base, events_life, events_hunter, actions)
// state ของโลกเก็บเฉพาะเรื่องของโลก (flags การลงทะเบียน กิลด์ ข่าวเกต) ส่วนข้อมูลผู้เล่นอยู่ใน Player System
(function(AW){
const H=AW.data.parts.hunter;
AW.data.worlds.push({
 id:'hunter',name:'โลกฮันเตอร์',
 description:'โลกยุคปัจจุบันที่เกตเปิดมาได้ 20 ปี ผู้ตื่นพลังลงทะเบียนเป็นฮันเตอร์กับสมาคม',
 timeRate:1,entry:'home',assetNs:'hunter',storyNs:'hunter',stateVersion:2,
 config:{currency:'วอน',startAge:15,eventChance:0.45,rankSystem:H.rankSystem,rules:{ranks:H.rankSystem.order}},
 data:{locations:H.locations,npcs:H.npcs,classes:H.classes,skills:H.skills,items:H.items,enemies:H.enemies,events:H.events,missions:H.missions,
  quests:[{id:'reach_rank_c',name:'เป็นฮันเตอร์แรงก์ C',src:'new'}],
  gates:[{id:'rift_fantasy',name:'รอยแยกสีน้ำเงิน (ทดสอบ)',to:'fantasy',months:0},
         {id:'deep_rift_fantasy',name:'รอยแยกลึก 3 เดือน (ทดสอบ)',to:'fantasy',months:3}],
  assets:['hunter.bg.city_day','hunter.bg.association_hall','hunter.bg.apartment','hunter.bg.gate_blue','hunter.bg.training_center','hunter.bg.market','hunter.bg.hunter_hospital','hunter.mon.goblin','hunter.mon.dire_wolf','hunter.mon.golem','hunter.mon.gate_boss']},
 state:()=>({visits:0,monthsLived:0,gateAlerts:0,flags:{}}),
 module:{
  enter(w,{aborted}){if(!aborted)w.mutate(s=>{s.visits++})},
  update(w,{month}){w.mutate(s=>{s.monthsLived++;if(month%6===0)s.gateAlerts++})},
  // v1 (Phase 2) มี location ใน state ของโลก ตอนนี้ตำแหน่งย้ายไปอยู่ที่ Player
  migrate(s,from){if(from===1){delete s.location;s.flags=s.flags||{}}}
 }
});
})(globalThis.AW);
