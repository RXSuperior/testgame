// Hunter World: ข้อมูลพื้นฐาน (สถานที่ อาชีพ สกิล ไอเทม ศัตรู แรงก์)
// src: 'logic4.js:N' = ย้ายจากเกมเดิม (ข้อความก่อนผ่าน theme7) · 'new' = เขียนใหม่ใน Phase 3
// ไฟล์นี้เป็นข้อมูลล้วน ไม่มีฟังก์ชัน
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
H.locations=[
 {id:'home',name:'บ้าน',desc:'ที่พักของท่าน',bg:'bg.apartment',src:'logic4.js:20'},
 {id:'school',name:'โรงเรียนมัธยมฮันนัม',desc:'เรียน สอบ ชมรม และเพื่อนร่วมชั้น',bg:'bg.city_day',when:{awakened:false},src:'logic4.js:21'},
 {id:'city',name:'ย่านใจกลางเมือง',desc:'ร้านค้า ข่าวลือ และผู้คน',bg:'bg.city_day',src:'logic4.js:22'},
 {id:'gym',name:'ศูนย์ฝึกเอกชน',desc:'ฝึกร่างกายแบบจ่ายรายครั้ง',bg:'bg.training_center',src:'new'},
 {id:'market',name:'ตลาดอุปกรณ์ฮันเตอร์',desc:'อาวุธและเกราะที่สมาคมรับรอง',bg:'bg.market',when:{awakened:true},src:'logic4.js:23 (ส่วนซื้ออุปกรณ์)'},
 {id:'association',name:'สมาคมฮันเตอร์',desc:'ประเมินแรงก์ ลงทะเบียน รับภารกิจ',bg:'bg.association_hall',when:{awakened:true},src:'logic4.js:23'},
 {id:'gate_zone',name:'ย่านเกต',desc:'เขตกั้นรอบเกตที่เปิดอยู่ อันตรายแต่คุ้มค่า',bg:'bg.gate_blue',when:{worldFlag:'registered'},src:'logic4.js:24'},
 {id:'hospital',name:'โรงพยาบาลฮันเตอร์',desc:'พักรักษาตัว ฟื้นพลังชีวิตเร็วขึ้นมาก',bg:'bg.hunter_hospital',src:'logic4.js:25'}];
H.classes=[
 {id:'sword',name:'นักดาบ',main:'str',desc:'ฟันระยะประชิด เน้นกาย',bonus:{str:5,vit:2},skill:'hunter.slash',src:'logic4.js:7'},
 {id:'bow',name:'นักธนู',main:'agi',desc:'ยิงจากระยะไกล เน้นความเร็ว',bonus:{agi:5,luk:2},skill:'hunter.aimed_shot',src:'logic4.js:7'},
 {id:'mage',name:'นักเวท',main:'int',desc:'ร่ายลูกไฟ เน้นปัญญา',bonus:{int:6},skill:'hunter.fireball',src:'logic4.js:8'},
 {id:'assassin',name:'นักลอบสังหาร',main:'agi',desc:'หายตัวไปด้านหลังศัตรู',bonus:{agi:4,luk:3},skill:'hunter.backstab',src:'logic4.js:8'},
 {id:'healer',name:'ผู้รักษา',main:'int',desc:'ฟื้นฟูตัวเองและทีม',bonus:{int:4,vit:3},skill:'hunter.heal',src:'logic4.js:9'},
 {id:'tank',name:'ผู้คุ้มกัน',main:'vit',desc:'ยกโล่รับดาเมจแทนทีม',bonus:{vit:6,str:1},skill:'hunter.shield_wall',src:'logic4.js:9'}];
H.skills=[
 {id:'slash',name:'ฟันเฉียง',power:8,src:'new'},{id:'aimed_shot',name:'เล็งจุดตาย',power:8,src:'new'},{id:'fireball',name:'ลูกไฟ',power:10,src:'logic4.js:8 (คำอธิบายอาชีพ)'},
 {id:'backstab',name:'แทงข้างหลัง',power:9,src:'logic4.js:8 (คำอธิบายอาชีพ)'},{id:'heal',name:'ฟื้นฟู',power:5,src:'new'},{id:'shield_wall',name:'กำแพงโล่',power:6,src:'new'},
 {id:'mana_burst',name:'ระเบิดมานา',power:15,src:'new'}];
// ราคาและพลังจากตาราง WEAPONS/ARMORS เดิม (logic4.js:45-46) สามเกรดแรก
H.items=[
 {id:'iron_dagger',name:'มีดสั้นเหล็ก',slot:'weapon',power:12,price:150,src:'logic4.js:45'},
 {id:'mana_blade_d',name:'อาวุธมานาเกรด D',slot:'weapon',power:30,price:600,src:'logic4.js:45'},
 {id:'crystal_blade_c',name:'อาวุธผลึกเกรด C',slot:'weapon',power:70,price:2200,src:'logic4.js:45'},
 {id:'leather_vest',name:'เสื้อหนังกันมีด',slot:'armor',hp:40,price:120,src:'logic4.js:46'},
 {id:'light_armor_d',name:'เกราะเบาเกรด D',slot:'armor',hp:110,price:550,src:'logic4.js:46'},
 {id:'mana_stone',name:'หินมานา',kind:'loot',price:60,src:'logic4.js:238 (ของในเกต)'},
 {id:'monster_core',name:'แกนอสูร',kind:'loot',price:150,src:'logic4.js:270'},
 {id:'hunter_license',name:'ใบอนุญาตฮันเตอร์',kind:'key',src:'new'}];
// พลังศัตรูอิง GATE_DIFF เดิม [60,120,220,...] (logic4.js:3) ชื่อจาก MON_N (logic4.js:40) และ BOSSES
H.enemies=[
 {id:'slime_g',name:'สไลม์เขียว',power:40,asset:'mon.goblin',src:'logic4.js:40'},
 {id:'goblins',name:'ฝูงก็อบลิน',power:60,asset:'mon.goblin',src:'new'},
 {id:'thugs',name:'ฮันเตอร์นอกกฎหมายสามคน',power:45,src:'logic4.js:262'},
 {id:'border_beast',name:'สัตว์อสูรหลุดจากเกต',power:55,asset:'mon.dire_wolf',src:'logic4.js:286'},
 {id:'skel_w',name:'โครงกระดูกนักรบ',power:110,src:'logic4.js:40'},
 {id:'wolf_w',name:'มนุษย์หมาป่าขาว',power:135,asset:'mon.dire_wolf',src:'logic4.js:40'},
 {id:'goblin_king',name:'ราชาก็อบลิน',power:150,asset:'mon.gate_boss',src:'logic4.js:387 (BOSSES)'},
 {id:'exam_d',name:'หุ่นประเมินของสมาคม (เกณฑ์ D)',power:115,asset:'mon.golem',src:'new'},
 {id:'skel_a',name:'โครงกระดูกนักธนู',power:210,src:'logic4.js:40'},
 {id:'wolf_b',name:'มนุษย์หมาป่าดำ',power:230,asset:'mon.dire_wolf',src:'logic4.js:40'},
 {id:'exam_c',name:'หุ่นประเมินของสมาคม (เกณฑ์ C)',power:225,asset:'mon.golem',src:'new'},
 // อิงแรงก์ผู้เล่น (แทน GATE_DIFF[P.rank] ในเหตุการณ์เดิม) _ = ยังไม่มีแรงก์
 {id:'gate_threat',name:'สัตว์อสูรในเกต',power:60,powerByRank:{_:40,E:60,D:120,C:220,B:400,A:680,S:1100},asset:'mon.goblin',src:'logic4.js:3 (GATE_DIFF)'},
 {id:'gate_boss',name:'บอสของเกต',power:80,powerByRank:{_:60,E:80,D:160,C:290,B:520,A:880,S:1400},asset:'mon.gate_boss',src:'logic4.js:3,387'},
 {id:'street_thugs',name:'อันธพาลนอกกฎหมาย',power:50,powerByRank:{_:30,E:50,D:100,C:180,B:330,A:560,S:900},src:'logic4.js:262 (foe thug)'},
 {id:'sparring_rival',name:'คู่ซ้อมฝีมือดี',power:70,powerByRank:{_:40,E:70,D:140,C:260,B:470,A:800,S:1300},src:'events2.js:135 (foe rival)'}];
// NPC ย้ายไป people.js (Phase 4)
// เกณฑ์แรงก์ (ใหม่): ไม่มีทางเลื่อนด้วยเวลาอย่างเดียว ต้องมีเลเวล ค่าสถานะ จำนวนภารกิจ และผ่านภารกิจสอบ
H.rankSystem={id:'hunter',name:'แรงก์ฮันเตอร์',order:['E','D','C','B','A','S'],
 initial:[{rank:'D',when:{all:[{statTotal:{min:150}},{mana:{min:25}}]}},{rank:'E'}],
 promote:{
  D:{when:{all:[{level:{min:6}},{statTotal:{min:140}},{missions:{tag:'rank_e',min:4}}]}},
  C:{when:{all:[{level:{min:11}},{statTotal:{min:190}},{missions:{tag:'rank_d',min:6}}]}}}};
})(globalThis.AW);
