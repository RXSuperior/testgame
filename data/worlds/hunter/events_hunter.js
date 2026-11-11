// Hunter World: เหตุการณ์ช่วงเป็นฮันเตอร์ (หลังตื่นพลัง) ย้ายจาก logic4.js
// ค่าที่เดิมคำนวณจากแรงก์ (เช่น GATE_DIFF[P.rank]*x) ถูกแทนด้วยตัวเลขคงที่ระดับแรงก์ E–D หรือศัตรูในข้อมูล
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
const hunter={worldFlag:'registered'};
H.events=(H.events||[]).concat([
{id:'stranger_party',title:'ปาร์ตี้แปลกหน้าชวนลงเกต',trigger:'month',at:'association',when:hunter,cooldown:6,weight:3,src:'logic4.js:234',
 text:'ฮันเตอร์สามคนชวนท่านลงเกตที่สูงกว่าแรงก์หนึ่งขั้น แต่ขอส่วนแบ่ง 70%',
 choices:[
  {text:'ไปด้วย',fight:{enemy:'skel_w'},ok:{text:'ทีมเคลียร์เกตได้ ส่วนของท่านคือ 150',effects:[{money:150},{exp:80}]},fail:{text:'ทีมแตกกระเจิง ท่านหนีออกมาได้',effects:[]}},
  {text:'ต่อรองขอ 50%',check:{stat:'cha',dc:'hard'},ok:{text:'หัวหน้าทีมยอม แต่สีหน้าไม่พอใจ',effects:[{money:120},{exp:30}]},fail:{text:'พวกเขาหัวเราะแล้วไปชวนคนอื่น',effects:[]}},
  {text:'ปฏิเสธ',ok:{text:'สัปดาห์ต่อมาได้ข่าวว่าทีมนั้นกลับมาไม่ครบ',effects:[{stat:{luk:1}}]}}]},
{id:'teammate_stone',title:'เพื่อนร่วมทีมกับหินมานา',trigger:'month',at:'gate_zone',when:hunter,cooldown:12,weight:3,src:'logic4.js:238',
 text:'เพื่อนร่วมทีมบาดเจ็บหนักอยู่กลางดันเจี้ยน ข้างตัวเขามีหินมานาก้อนใหญ่ ฝูงอสูรกำลังวนกลับมา',
 choices:[
  {text:'แบกเขาออกมา',check:{stat:'str',dc:'mid'},ok:{text:'ท่านแบกเขาออกมาได้ ข่าวนี้แพร่ไปทั่วสมาคม',effects:[{reputation:4}]},fail:{text:'ท่านพาเขาออกมาได้แต่โดนกรงเล็บเต็มหลัง',effects:[{hp:-40},{injury:1},{reputation:3}]}},
  {text:'เก็บหินแล้วทิ้งเขาไว้',ok:{text:'ไม่มีใครเห็นท่านทำแบบนั้น',effects:[{item:{id:'mana_stone',n:3}},{reputation:-3}]}},
  {text:'ยิงพลุขอความช่วยเหลือแล้วยันไว้',fight:{enemy:'goblins'},ok:{text:'ทีมกู้ภัยมาถึงทันเวลา ทั้งคู่รอด',effects:[{reputation:2},{exp:40}]},fail:{text:'ทีมกู้ภัยมาช้า เพื่อนร่วมทีมเสียชีวิต',effects:[]}}]},
{id:'energy_drink',title:'บริษัทเครื่องดื่มชูกำลัง',trigger:'month',at:'city',when:{all:[hunter,{rank:{min:'E'}}]},once:true,weight:2,src:'logic4.js:242 (เดิมต้องมีชื่อเสียง 10)',
 text:'บริษัทเครื่องดื่มเสนอให้ท่านเป็นพรีเซนเตอร์ ค่าตัวสูงกว่ารายได้จากเกตสามเดือน',
 choices:[
  {text:'รับงาน',ok:{text:'หน้าท่านอยู่บนป้ายโฆษณาทั่วเมือง',effects:[{money:250},{reputation:5}]}},
  {text:'ขอเพิ่มค่าตัว',check:{stat:'cha',dc:'hard'},ok:{text:'เขายอมเพิ่มให้อีกครึ่งหนึ่ง',effects:[{money:380},{reputation:5}]},fail:{text:'เขาไปจ้างฮันเตอร์คนอื่นแทน',effects:[]}},
  {text:'ปฏิเสธ',ok:{text:'ท่านไม่ชอบถ่ายแบบ',effects:[]}}]},
{id:'secret_room',title:'ห้องลับในดันเจี้ยน',trigger:'month',at:'gate_zone',when:hunter,once:true,weight:2,src:'logic4.js:246',
 text:'หลังกำแพงที่พังมีประตูหินสลักตัวอักษรที่ไม่มีใครอ่านออก ลมเย็นพัดออกมาจากร่องประตู',
 choices:[
  {text:'เปิดเข้าไปคนเดียว',check:{stat:'luk',dc:'hard'},ok:{text:'ข้างในมีคัมภีร์สกิลเก่า',effects:[{skill:'mana_burst'}]},fail:{text:'กับดักลูกดอกพุ่งใส่',effects:[{hp:-50},{injury:1}]}},
  {text:'ถอดรหัสตัวอักษรก่อน',check:{stat:'int',dc:'hard'},ok:{text:'ท่านปลดกลไกได้ ได้แกนอสูรหายากมาขาย',effects:[{item:{id:'monster_core',n:2}}]},fail:{text:'อ่านไม่ออก ประตูปิดตายไปเอง',effects:[{stat:{int:1}}]}},
  {text:'รายงานสมาคม',ok:{text:'สมาคมส่งทีมวิจัยมา จ่ายค่าข้อมูลให้ท่าน',effects:[{money:120},{rel:{npc:'clerk_yoon',n:3}}]}}]},
{id:'alley_thugs',title:'เสียงร้องในซอยมืด',trigger:'month',at:'city',when:{awakened:true},cooldown:8,weight:2,src:'logic4.js:262',
 text:'ฮันเตอร์นอกกฎหมายสามคนรุมรีดไถพ่อค้าแผงลอยในซอยหลังตลาด',
 choices:[
  {text:'เข้าไปจัดการ',fight:{enemy:'thugs'},ok:{text:'พวกมันวิ่งหนีกระเจิง พ่อค้าก้มหัวขอบคุณไม่หยุด',effects:[{reputation:2},{exp:20}]},fail:{text:'พวกมันมีหลายคนเกินไป ท่านต้องถอย',effects:[]}},
  {text:'ถ่ายคลิปแจ้งสมาคม',check:{stat:'agi',dc:'easy'},ok:{text:'สมาคมจับได้ทั้งแก๊ง',effects:[{stat:{int:1}}]},fail:{text:'ถูกจับได้ว่าถ่ายคลิป ต้องวิ่งหนี',effects:[{hp:-10}]}},
  {text:'เดินผ่านไป',ok:{text:'ท่านไม่อยากยุ่ง',effects:[]}}]},
{id:'orphan_patient',title:'ผู้ป่วยไร้ญาติ',trigger:'enter',at:'hospital',when:{awakened:true},cooldown:24,weight:1,src:'logic4.js:266',
 text:'เด็กหญิงที่รอดจาก Dungeon Break นอนอยู่เตียงข้าง ๆ ไม่มีใครมาเยี่ยม ค่ารักษายังค้างอยู่ก้อนใหญ่',
 choices:[
  {text:'จ่ายค่ารักษาให้ (300)',when:{money:{min:300}},lockText:'เงินไม่พอ',ok:{text:'นางยิ้มครั้งแรกตั้งแต่เข้าโรงพยาบาล',effects:[{money:-300},{reputation:3}]}},
  {text:'อยู่เป็นเพื่อนคุย',ok:{text:'นางเล่าว่าอยากเป็นฮันเตอร์เหมือนท่าน',effects:[{stat:{cha:2}}]}},
  {text:'ขอย้ายเตียง',ok:{text:'ท่านอยากพักผ่อนเงียบ ๆ',effects:[{stat:{vit:1}}]}}]},
{id:'escort_governor',title:'ภารกิจคุ้มกันผู้ว่าการ',trigger:'month',at:'association',when:{all:[{worldFlag:'guild_northstar'},{rank:{min:'D'}}]},cooldown:12,weight:3,src:'logic4.js:274 (เดิมสำหรับสาย "คนของสมาคม" ตอนนี้ผูกกับกิลด์ดาวเหนือ)',
 text:'สมาคมมอบหมายให้คุ้มกันผู้ว่าการเมืองระหว่างเยี่ยมย่านเกต มีข่าวว่ากลุ่มต่อต้านฮันเตอร์จะก่อเหตุ',
 choices:[
  {text:'ตรวจเส้นทางล่วงหน้า',check:{stat:'int',dc:'mid'},ok:{text:'ท่านเจอระเบิดใต้รถก่อนออกเดินทาง',effects:[{reputation:6},{money:500}]},fail:{text:'ระเบิดดังกลางขบวน ผู้ว่าการรอดแต่ท่านเจ็บ',effects:[{hp:-30},{money:250}]}},
  {text:'ยืนประกบตัวตลอดทาง',check:{stat:'vit',dc:'mid'},ok:{text:'ท่านใช้ตัวบังกระสุนลูกหลง ผู้ว่าการจับมือขอบคุณ',effects:[{reputation:5},{money:400}]},fail:{text:'ท่านโดนกระสุนเข้าไหล่',effects:[{hp:-45},{injury:1},{money:400}]}},
  {text:'ขอเปลี่ยนเป็นงานอื่น',ok:{text:'หัวหน้าสมาคมจดชื่อท่านไว้ในแฟ้มสีเหลือง',effects:[{reputation:-2}]}}]},
{id:'reporter',title:'นักข่าวขอสัมภาษณ์',trigger:'month',when:hunter,cooldown:18,weight:2,src:'logic4.js:278',
 text:'นักข่าวช่องดังขอสัมภาษณ์เรื่องเกตล่าสุดที่ท่านเคลียร์ เธอถามว่าท่านคิดอย่างไรกับฮันเตอร์ที่ทิ้งชาวบ้านระหว่าง Dungeon Break',
 choices:[
  {text:'ตอบตรง ๆ ว่าคนแบบนั้นไม่ควรเป็นฮันเตอร์',ok:{text:'คลิปถูกแชร์ทั่วประเทศ กิลด์ใหญ่บางแห่งไม่พอใจ',effects:[{reputation:6}]}},
  {text:'ตอบกลาง ๆ',check:{stat:'cha',dc:'easy'},ok:{text:'ทุกฝ่ายพอใจ',effects:[{reputation:2},{stat:{cha:1}}]},fail:{text:'คำตอบฟังดูเลี่ยง คนดูไม่ชอบ',effects:[{reputation:-1}]}},
  {text:'ปฏิเสธการสัมภาษณ์',ok:{text:'ท่านเดินหนีกล้อง',effects:[]}}]},
{id:'border_village',title:'ชาวบ้านชายแดนขอความช่วยเหลือ',trigger:'month',when:hunter,cooldown:10,weight:2,src:'logic4.js:286',
 text:'หมู่บ้านชายแดนมีสัตว์อสูรหลุดออกจากเกตที่ไม่มีใครดูแล ชาวบ้านมีเงินจ่ายแค่ข้าวกับไข่ไก่',
 choices:[
  {text:'ไปช่วย',fight:{enemy:'border_beast'},ok:{text:'หมู่บ้านจัดงานเลี้ยงให้ท่านทั้งคืน',effects:[{reputation:2},{exp:40}]},fail:{text:'ท่านไล่มันไปได้ แต่เจ็บไม่น้อย',effects:[{reputation:1}]}},
  {text:'บอกให้ไปจ้างกิลด์',ok:{text:'ชาวบ้านมองท่านด้วยสายตาผิดหวัง',effects:[]}},
  {text:'ขอเงินค่าจ้างก่อน',check:{stat:'cha',dc:'mid'},ok:{text:'ชาวบ้านรวมเงินกันได้ก้อนหนึ่ง',effects:[{money:200}]},fail:{text:'ชาวบ้านไล่ท่านออกจากหมู่บ้าน',effects:[{reputation:-2}]}}]},
]);
})(globalThis.AW);
