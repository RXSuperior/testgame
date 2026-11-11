// โลกทดสอบ Phase 2: Hunter World (ข้อมูลตัวอย่าง ยังไม่ใช่เนื้อหาจริง)
// เมือง ชื่อ และสถานที่เป็นของที่แต่งขึ้นเอง ภาพอ้างถึง id ใน namespace hunter (ตอนนี้เป็น placeholder ทั้งหมด)
(function(AW){
AW.data.worlds.push({
 id:'hunter',name:'โลกฮันเตอร์',
 description:'โลกสมัยใหม่ที่ประตูมิติเปิดขึ้นกลางเมือง ผู้ตื่นพลังลงทะเบียนเป็นฮันเตอร์กับสมาคม (ข้อมูลตัวอย่าง)',
 timeRate:1,entry:'seonhwa_plaza',assetNs:'hunter',storyNs:'hunter',
 config:{currency:'วอน',startAge:15,rules:{ranks:['F','E','D','C','B','A','S'],gateBreakChance:0.02}},
 data:{
  locations:[
   {id:'seonhwa_plaza',name:'ลานกลางเมืองซอนฮวา',bg:'bg.city_day'},
   {id:'association',name:'สมาคมฮันเตอร์สาขาซอนฮวา',bg:'bg.association_hall'},
   {id:'apartment',name:'ห้องเช่าย่านเก่า',bg:'bg.apartment'},
   {id:'gate_zone',name:'เขตกักกันประตูมิติ',bg:'bg.gate_blue'}],
  npcs:[{id:'clerk_yoon',name:'ยุนแชอา',role:'เจ้าหน้าที่สมาคม',at:'association'}],
  quests:[{id:'register_hunter',name:'ลงทะเบียนฮันเตอร์',at:'association'}],
  events:[{id:'gate_alert',name:'ประกาศเตือนประตูมิติ'}],
  gates:[{id:'rift_fantasy',name:'รอยแยกสีน้ำเงิน',to:'fantasy',months:0},
         {id:'deep_rift_fantasy',name:'รอยแยกลึก (ใช้เวลา 3 เดือน)',to:'fantasy',months:3}],
  assets:['hunter.bg.city_day','hunter.bg.association_hall','hunter.bg.apartment','hunter.bg.gate_blue','hunter.mon.goblin']},
 state:()=>({location:'seonhwa_plaza',visits:0,monthsLived:0,gateAlerts:0,flags:{}}),
 module:{
  enter(w,{aborted}){w.mutate(s=>{if(!aborted)s.visits++;s.location=s.location||w.def.entry})},
  // เดือนละครั้งตามเวลาท้องถิ่น ทำงานแม้ผู้เล่นอยู่โลกอื่น
  update(w,{month}){w.mutate(s=>{s.monthsLived++;if(month%6===0)s.gateAlerts++})}
 }
});
})(globalThis.AW);
