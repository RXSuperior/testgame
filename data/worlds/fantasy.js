// โลกทดสอบ Phase 2: Fantasy World (ข้อมูลตัวอย่าง) เวลาเดินครึ่งหนึ่งของโลกหลัก
// ต่อไปจะรับเนื้อหาจอมมาร เทพ 7 องค์ และเรื่องยาว 14 เรื่องจากเกมเดิม (Phase 7)
(function(AW){
AW.data.worlds.push({
 id:'fantasy',name:'แดนอาร์เคน',
 description:'อาณาจักรเวทมนตร์ที่ถูกกองทัพจอมมารกดดันจากทางเหนือ (ข้อมูลตัวอย่าง)',
 timeRate:0.5,entry:'eldran_gate',assetNs:'fantasy',storyNs:'fantasy',stateVersion:2,
 config:{currency:'เหรียญทอง',rules:{seasons:['ฤดูใบไม้ผลิ','ฤดูร้อน','ฤดูใบไม้ร่วง','ฤดูหนาว'],manaDensity:2}},
 data:{
  locations:[
   {id:'eldran_gate',name:'ซุ้มประตูมิติแห่งเอลดราน',bg:'bg.forest'},
   {id:'eldran_town',name:'เมืองหลวงเอลดราน',bg:'bg.town'},
   {id:'royal_castle',name:'ปราสาทหลวง',bg:'bg.castle'}],
  npcs:[{id:'mage_liora',name:'ลิโอรา',role:'นักเวทราชสำนัก',at:'royal_castle'}],
  quests:[{id:'meet_king',name:'เข้าเฝ้ากษัตริย์',at:'royal_castle'}],
  events:[{id:'demon_scouts',title:'หน่วยลาดตระเวนของจอมมาร',trigger:'month',weight:1,cooldown:12,text:'ชาวเมืองลือกันว่าเห็นเงาปีกดำบินผ่านกำแพงเมืองเมื่อคืน (เหตุการณ์ทดสอบ)',choices:[{text:'ฟังต่อ',ok:{text:'ข่าวลือเงียบไปเอง',effects:[]}}]}],
  gates:[{id:'rift_hunter',name:'รอยแยกกลับโลกฮันเตอร์',to:'hunter',months:0}],
  assets:['fantasy.bg.forest','fantasy.bg.town','fantasy.bg.castle','fantasy.mon.slime']},
 state:()=>({visits:0,monthsLived:0,season:0,flags:{}}),
 module:{
  enter(w,{aborted}){w.mutate(s=>{if(!aborted)s.visits++})},
  update(w,{month}){w.mutate(s=>{s.monthsLived++;s.season=Math.floor(month/3)%4})},
  migrate(s,from){if(from===1)delete s.location}
 }
});
})(globalThis.AW);
