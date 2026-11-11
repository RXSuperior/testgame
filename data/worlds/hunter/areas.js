// Hunter World: ผังพื้นที่ side-view (Phase 7B.3) · หนึ่ง area ต่อหนึ่ง location (loc) · พิกัดพิกเซลจอเสมือน 576x324
// ประตูเรียก player.moveTo จึงเคารพเงื่อนไขเข้าสถานที่เดิม: โรงเรียนเข้าได้เฉพาะยังไม่ตื่นพลัง · ย่านเกตต้องลงทะเบียนฮันเตอร์
// NPC ไม่ได้ผูกกับพื้นที่: ใครอยู่ที่นี่ตามตารางเวลาจริง (npcs.at) จะยืนที่ npcSpots ตามลำดับ
(function(AW){
const H=AW.data.parts.hunter,G=296;// ระดับพื้น
H.areas=[
 {id:'school',loc:'school',name:'ถนนหน้าโรงเรียนมัธยมฮันนัม',width:1600,height:324,spawn:{x:140},tileset:'tile.street',layers:['bg.school','bg.city_day'],
  solids:[{x:0,y:G,w:1600,h:28}],platforms:[{x:520,y:236,w:120},{x:700,y:196,w:96}],
  doors:[{id:'to_city',x:1520,to:'city',label:'ไปย่านใจกลางเมือง',arrive:'from_school'}],
  arrivals:{from_city:{x:1480}},npcSpots:[{x:860},{x:1040},{x:1200}],
  talkEvents:['hunter.friend_gate_clip'],src:'new (Phase 7B.3)'},
 {id:'city',loc:'city',name:'ถนนย่านใจกลางเมือง',width:1920,height:324,spawn:{x:160},tileset:'tile.street',layers:['bg.city_day'],
  solids:[{x:0,y:G,w:1920,h:28},{x:980,y:G-36,w:56,h:36}],platforms:[{x:1100,y:220,w:140}],
  doors:[{id:'to_school',x:60,to:'school',label:'ไปหน้าโรงเรียน',arrive:'from_city'},{id:'to_gate',x:1840,to:'gate_zone',label:'ไปย่านเกต',arrive:'from_city'}],
  arrivals:{from_school:{x:120},from_gate:{x:1780}},npcSpots:[{x:520},{x:700},{x:1400},{x:1560}],
  talkEvents:['hunter.friend_gate_clip'],src:'new (Phase 7B.3)'},
 {id:'gate_zone',loc:'gate_zone',name:'แนวรั้วย่านเกต',width:1760,height:324,spawn:{x:120},tileset:'tile.gate',layers:['bg.gate_blue'],
  solids:[{x:0,y:G,w:1760,h:28},{x:640,y:G-28,w:40,h:28}],platforms:[{x:900,y:228,w:160},{x:1120,y:190,w:110}],
  doors:[{id:'to_city',x:60,to:'city',label:'กลับย่านใจกลางเมือง',arrive:'from_gate'}],
  arrivals:{from_city:{x:120}},npcSpots:[{x:300}],
  // ก็อบลิน: เกิดใหม่ทุกเดือน สูงสุด 2 ตัว · รางวัลต่อตัวได้ครั้งเดียว (บันทึกใน slice scene)
  spawns:[{id:'gob_a',enemy:'goblins',x1:780,x2:1080,reward:[{exp:12}]},{id:'gob_b',enemy:'goblins',x1:1300,x2:1640,reward:[{exp:12}]}],src:'new (Phase 7B.3)'}];
})(globalThis.AW);
