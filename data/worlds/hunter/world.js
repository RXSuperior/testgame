// Hunter World: ประกอบนิยามโลกจากไฟล์ข้อมูลในโฟลเดอร์นี้ (base, people, events_life, events_hunter, events_e2, events_people, actions)
// state ของโลกเก็บเฉพาะเรื่องของโลก (flags การลงทะเบียน กิลด์ ข่าวเกต) ส่วนข้อมูลผู้เล่นอยู่ใน Player System
(function(AW){
const H=AW.data.parts.hunter;
AW.data.worlds.push({
 id:'hunter',name:'โลกฮันเตอร์',
 description:'โลกยุคปัจจุบันที่เกตเปิดมาได้ 20 ปี ผู้ตื่นพลังลงทะเบียนเป็นฮันเตอร์กับสมาคม',
 timeRate:1,entry:'home',assetNs:'hunter',storyNs:'hunter',stateVersion:2,
 config:{currency:'วอน',startAge:15,eventChance:0.45,passiveChance:0.3,rankSystem:H.rankSystem,rules:{ranks:H.rankSystem.order},
  namePool:H.namePool,familyBackgrounds:H.familyBackgrounds,homeLocs:['city'],defaultSchedule:'worker',livingCost:30,
  calendar:{holidayMonths:[0,6]},economy:H.economyConfig,missions:H.missionConfig,party:H.partyConfig,tower:H.towerConfig,population:{count:12,jobs:['student','teacher','shopkeeper','npc_hunter','trainer','doctor',null]}},
 data:{locations:H.locations,npcs:H.npcs,schedules:H.schedules,jobs:H.jobs,housing:H.housing,dungeons:H.dungeons,towers:H.towers,towerFloors:H.towerFloors,areas:H.areas,services:H.services,guilds:H.guilds,classes:H.classes,skills:H.skills,items:H.items,enemies:H.enemies,events:H.events,missions:H.missions,
  quests:[{id:'reach_rank_c',name:'เป็นฮันเตอร์แรงก์ C',src:'new'}],
  // Gate (Phase 4): ต้องค้นพบและเปิดตามเนื้อเรื่อง · ปุ่ม Debug ในหน้าทดสอบยังเรียก worlds.travelVia ได้ตรง ๆ
  gates:[{id:'rift_fantasy',name:'รอยแยกสีน้ำเงิน',to:'fantasy',months:0,discover:{all:[{rank:{min:'D'}},{location:'gate_zone'}]},openBy:'event'},
         {id:'deep_rift_fantasy',name:'รอยแยกลึก (3 เดือน)',to:'fantasy',months:3,discover:{all:[{rank:{min:'C'}},{gate:{id:'rift_fantasy',is:'open'}}]},openBy:'event',
          cost:[{item:{id:'mana_stone',n:-3}},{money:-500}],travel:{item:{id:'mana_stone',min:3}},travelText:'ต้องมีหินมานา 3 ก้อน'}],
  assets:['hunter.bg.city_day','hunter.bg.association_hall','hunter.bg.apartment','hunter.bg.gate_blue','hunter.bg.training_center','hunter.bg.market','hunter.bg.hunter_hospital','hunter.mon.goblin','hunter.mon.dire_wolf','hunter.mon.golem','hunter.mon.gate_boss','hunter.bg.gov_base','hunter.bg.industrial']},
 state:()=>({visits:0,monthsLived:0,gateAlerts:0,flags:{}}),
 module:{
  enter(w,{aborted}){if(!aborted)w.mutate(s=>{s.visits++})},
  update(w,{month}){w.mutate(s=>{s.monthsLived++;if(month%6===0)s.gateAlerts++})},
  // v1 (Phase 2) มี location ใน state ของโลก ตอนนี้ตำแหน่งย้ายไปอยู่ที่ Player
  migrate(s,from){if(from===1){delete s.location;s.flags=s.flags||{}}}
 }
});
})(globalThis.AW);
