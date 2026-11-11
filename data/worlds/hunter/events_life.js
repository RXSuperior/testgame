// Hunter World: เหตุการณ์ช่วงเป็นนักเรียน (ก่อนตื่นพลัง) และเรื่องหลัก (ตื่นพลัง ประเมิน ลงทะเบียน กิลด์)
// ข้อมูลล้วน รูปแบบอธิบายใน docs/phase3/STORY_EVENT_SYSTEM.md
// ผลที่เกมเดิมมีแต่ Phase 3 ยังไม่มีระบบรองรับ (karma, นิสัย tr, ความโปรดปรานดวงดาว fav, ดาวเหรียญ coin) ถูกตัดออก บันทึกไว้ใน HUNTER_WORLD_DESIGN.md
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
const school={awakened:false};
H.events=(H.events||[]).concat([
// ---------- เปิดเรื่อง ----------
{id:'intro',title:'ชีวิต ม.ปลายเริ่มต้นขึ้น',trigger:'auto',once:true,priority:100,when:{age:{max:15.99}},src:'logic4.js:90-91,321',
 text:'{name} อายุ 15 ปี นักเรียน ม.4 โรงเรียนมัธยมฮันนัม โลกนี้มีเกตเปิดขึ้นมาได้ 20 ปีแล้ว คนที่ตื่นพลังเรียกว่าฮันเตอร์ ส่วนใหญ่ตื่นพลังตอนอายุ 18 อีกสามปีจะถึงวันนั้น ท่านจะใช้ชีวิตแบบไหน',
 choices:[
  {text:'ตั้งใจเรียน',ok:{text:'ท่านตั้งใจจะสอบให้ได้ที่หนึ่งของชั้น',effects:[{stat:{int:2}},{flag:'path_study'}]}},
  {text:'เล่นกีฬา',ok:{text:'ท่านสมัครทีมกรีฑาตั้งแต่สัปดาห์แรก',effects:[{stat:{str:1,vit:1}},{flag:'path_sport'}]}},
  {text:'ผูกมิตร',ok:{text:'ท่านรู้จักคนทั้งห้องภายในเดือนเดียว',effects:[{stat:{cha:2}},{rel:{npc:'best_friend',n:5}},{flag:'path_social'}]}},
  {text:'ทำงานพิเศษ',ok:{text:'ท่านได้งานกะดึกที่ร้านสะดวกซื้อ',effects:[{money:80},{flag:'path_work'}]}}]},
{id:'midterm',title:'สอบกลางภาค',trigger:'month',at:'school',when:school,cooldown:6,weight:3,src:'logic4.js:183',
 text:'ข้อสอบคณิตศาสตร์ยากกว่าที่คิด เพื่อนข้าง ๆ เลื่อนกระดาษคำตอบมาให้ดูครึ่งแผ่น ครูกำลังหันหลังเขียนกระดาน',
 choices:[
  {text:'ตั้งใจทำเอง',check:{stat:'int',dc:'mid'},ok:{text:'ทำได้เกือบเต็ม ครูชมหน้าห้อง',effects:[{stat:{int:2}},{reputation:1}]},fail:{text:'คะแนนกลาง ๆ แต่ภูมิใจที่ทำเอง',effects:[{stat:{int:1}}]}},
  {text:'แอบลอกคำตอบ',check:{stat:'agi',dc:'mid'},ok:{text:'ได้คะแนนสูงโดยไม่มีใครรู้',effects:[]},fail:{text:'ครูจับได้ ถูกเรียกพบผู้ปกครอง',effects:[{stat:{cha:-1}}]}},
  {text:'ส่งกระดาษเปล่าแล้วนอน',ok:{text:'ตื่นมาอีกทีห้องว่างแล้ว',effects:[{stat:{vit:1}}]}}]},
{id:'club',title:'ชมรมเปิดรับสมัคร',trigger:'month',at:'school',when:school,once:true,weight:2,src:'logic4.js:187',
 text:'ต้นเทอมแต่ละชมรมตั้งโต๊ะเรียกสมาชิกเต็มโถงอาคาร ชมรมไหนก็ได้เลือกแค่ชมรมเดียว',
 choices:[
  {text:'ชมรมเคนโด้',ok:{text:'ได้ดาบไม้มาหนึ่งเล่ม ซ้อมจนมือพอง',effects:[{stat:{str:3}},{flag:'club_kendo'}]}},
  {text:'ชมรมยิงธนู',ok:{text:'ยิงเข้าเป้าตั้งแต่ลูกแรก รุ่นพี่ตาโต',effects:[{stat:{agi:3}},{flag:'club_archery'}]}},
  {text:'ชมรมวิทยาศาสตร์ที่ศึกษาเกต',ok:{text:'ได้จับเศษแกนอสูรของจริงเป็นครั้งแรก',effects:[{stat:{int:3}},{mana:3},{flag:'club_science'}]}},
  {text:'ชมรมอาสาพยาบาล',ok:{text:'เรียนปฐมพยาบาลจนพันแผลได้คล่อง',effects:[{stat:{vit:2,cha:1}},{flag:'club_nurse'}]}}]},
{id:'locker_letter',title:'จดหมายในล็อกเกอร์',trigger:'month',at:'school',when:school,once:true,weight:2,src:'logic4.js:197',
 text:'มีซองสีฟ้าเสียบอยู่ในล็อกเกอร์ ข้างในเขียนว่า "หลังเลิกเรียน ดาดฟ้า" ไม่ได้ลงชื่อ',
 choices:[
  {text:'ขึ้นไปตามนัด',ok:{text:'คนที่รออยู่เป็นรุ่นเดียวกันห้องข้าง ๆ หน้าแดงจนพูดไม่ออก',effects:[{stat:{cha:2}}]}},
  {text:'พาเพื่อนสนิทไปด้วย',ok:{text:'ฮาจุนแซวท่านทั้งทางจนลืมไปว่ามานัดใคร คนที่รอหนีไปก่อน',effects:[{rel:{npc:'best_friend',n:5}}]}},
  {text:'ไม่ไป',ok:{text:'วันต่อมาซองฟ้าหายไปจากล็อกเกอร์',effects:[]}}]},
{id:'store_robber',title:'โจรในร้านสะดวกซื้อ',trigger:'month',when:{all:[school,{flag:'path_work'}]},cooldown:12,weight:3,src:'logic4.js:201',
 text:'กะดึกที่ร้านสะดวกซื้อ ชายสวมหมวกไหมพรมยื่นมีดข้ามเคาน์เตอร์ สั่งให้เปิดลิ้นชักเงิน',
 choices:[
  {text:'แย่งมีด',check:{stat:'agi',dc:'hard'},ok:{text:'ท่านบิดข้อมือเขาจนมีดหล่น ตำรวจมาถึงพอดี เจ้าของร้านให้โบนัส',effects:[{money:120},{reputation:3}]},fail:{text:'มีดเฉี่ยวแขนเป็นแผลยาว',effects:[{hp:-25}]}},
  {text:'ส่งเงินให้แล้วกดปุ่มฉุกเฉิน',check:{stat:'int',dc:'easy'},ok:{text:'ตำรวจจับเขาได้ที่ปากซอย',effects:[{stat:{int:1}}]},fail:{text:'ปุ่มเสีย เขาหนีไปได้ เจ้าของร้านหักเงินเดือน',effects:[{money:-60}]}},
  {text:'ชวนคุย ถามว่าเดือดร้อนเรื่องอะไร',check:{stat:'cha',dc:'mid'},ok:{text:'เขาร้องไห้ บอกว่าลูกป่วยหนัก แล้ววางมีดเดินออกไปเอง',effects:[{stat:{cha:2}}]},fail:{text:'เขาตะคอกให้หุบปากแล้วกวาดเงินไป',effects:[{money:-40}]}}]},
{id:'friend_gate_clip',title:'เพื่อนชวนแอบเข้าเขตเกต',trigger:'month',when:school,cooldown:18,weight:2,src:'logic4.js:217',
 text:'ฮาจุนกระซิบว่ารั้วกั้นเกตแรงก์ E หลังตลาดมีช่องโหว่ อยากเข้าไปถ่ายคลิปลงโซเชียล',
 choices:[
  {text:'ไปด้วย',check:{stat:'luk',dc:'mid'},ok:{text:'ทั้งคู่ได้คลิปหน้าเกตเรืองแสง ยอดวิวทะลุแสน',effects:[{reputation:4},{rel:{npc:'best_friend',n:6}}]},fail:{text:'สไลม์ตัวหนึ่งพุ่งออกมา ท่านลากเพื่อนหนีจนแขนถลอก',effects:[{hp:-30},{rel:{npc:'best_friend',n:10}}]}},
  {text:'ห้ามเพื่อน',check:{stat:'cha',dc:'mid'},ok:{text:'เพื่อนยอมกลับบ้าน',effects:[{rel:{npc:'best_friend',n:2}}]},fail:{text:'เพื่อนไปคนเดียว กลับมาพร้อมแผลที่ขา',effects:[{rel:{npc:'best_friend',n:-5}}]}},
  {text:'แจ้งยามสมาคม',ok:{text:'ยามปิดช่องโหว่ เพื่อนโกรธท่านไปหนึ่งสัปดาห์',effects:[{rel:{npc:'best_friend',n:-6}}]}}]},
{id:'track_meet',title:'แข่งกรีฑาระดับเขต',trigger:'month',when:{all:[school,{flag:'path_sport'}]},cooldown:12,weight:3,src:'logic4.js:221',
 text:'ท่านถูกส่งลงแข่งวิ่ง 400 เมตรแทนเพื่อนที่ขาพลิก แมวมองจากสมาคมนั่งอยู่บนอัฒจันทร์',
 choices:[
  {text:'ออกตัวแรงตั้งแต่ต้น',check:{stat:'agi',dc:'mid'},ok:{text:'เข้าเส้นชัยเป็นอันดับหนึ่ง แมวมองจดชื่อท่านไว้',effects:[{stat:{agi:2}},{reputation:3}]},fail:{text:'หมดแรงช่วงโค้งสุดท้าย ได้ที่ห้า',effects:[{stat:{vit:1}}]}},
  {text:'เก็บแรงไว้ช่วงท้าย',check:{stat:'vit',dc:'mid'},ok:{text:'แซงสามคนในร้อยเมตรสุดท้าย ได้ที่สอง',effects:[{stat:{vit:2}},{reputation:2}]},fail:{text:'แซงไม่ทัน ได้ที่สี่',effects:[{stat:{vit:1}}]}},
  {text:'วิ่งเป็นเพื่อนคนที่ล้ม',ok:{text:'ไม่ได้เหรียญแต่ภาพนั้นถูกแชร์ทั่วเมือง',effects:[{stat:{cha:2}}]}}]},
{id:'library_night',title:'ห้องสมุดตอนดึก',trigger:'month',at:'school',when:{all:[school,{flag:'path_study'}]},once:true,weight:2,src:'logic4.js:225',
 text:'ท่านเจอหนังสือเล่มบาง ๆ ไม่มีชื่อผู้แต่ง ชื่อเรื่องว่า "บันทึกก่อนเกตแรกเปิด" ซ่อนอยู่หลังชั้นวาง',
 choices:[
  {text:'อ่านจนจบในคืนเดียว',check:{stat:'int',dc:'hard'},ok:{text:'เนื้อหาบอกว่าเกตเปิดตามจังหวะของดวงดาว ท่านจดไว้ทุกบรรทัด',effects:[{stat:{int:3}},{mana:5},{flag:'lore_first_gate'}]},fail:{text:'ตัวอักษรเลือนจนอ่านไม่ออก ปวดหัวไปสามวัน',effects:[{stat:{int:1}}]}},
  {text:'ยืมกลับบ้าน',ok:{text:'วันรุ่งขึ้นหนังสือหายไปจากกระเป๋า',effects:[{stat:{luk:1}}]}},
  {text:'ส่งให้บรรณารักษ์',ok:{text:'บรรณารักษ์หน้าซีดแล้วรีบเก็บเข้าห้องด้านใน',effects:[]}}]},
{id:'scout_rumor',title:'ข่าวลือเรื่องแมวมอง',trigger:'month',when:{all:[school,{age:{min:17}}]},once:true,weight:2,src:'logic4.js:229',
 text:'มีข่าวว่ากิลด์ใหญ่ส่งคนมาดูตัวนักเรียน ม.6 ที่มีแววจะตื่นพลังแรงก์สูง หลายคนเริ่มไปฟิตเนส',
 choices:[
  {text:'ฝึกหนักทุกเช้า',ok:{text:'กล้ามเนื้อเริ่มแน่น',effects:[{stat:{str:2,vit:1}}]}},
  {text:'อ่านเรื่องฮันเตอร์ให้มากที่สุด',ok:{text:'ท่านรู้ชื่อมอนสเตอร์ทุกตัวในฐานข้อมูลสมาคม',effects:[{stat:{int:2}},{mana:2}]}},
  {text:'ไม่สน ตื่นได้ก็ตื่น',ok:{text:'ชีวิตยังเหมือนเดิม',effects:[{stat:{luk:1}}]}}]},
// ---------- เรื่องหลัก ----------
{id:'awakening',title:'วันตื่นพลัง',trigger:'auto',once:true,priority:90,src:'prog6.js:86-98 (ข้อความลูกแก้วย้ายไปเหตุการณ์ประเมินแรงก์)',
 when:{all:[{awakened:false},{age:{min:17.5}},{any:[{chance:0.25},{age:{min:18.5}}]}]},
 text:'คืนนั้นร่างกายร้อนผ่าวเหมือนมีไฟไหลในเส้นเลือด เช้าวันต่อมาท่านมองเห็นมานารอบตัวเป็นสายแสงจาง ๆ ท่านตื่นพลังแล้ว พลังในตัวกำลังรอให้ท่านเลือกทาง',
 choices:[
  {text:'นักดาบ — ฟันระยะประชิด เน้นกาย',ok:{text:'ท่านตื่นพลังเป็นนักดาบ',effects:[{class:'sword'},{mana:10}]}},
  {text:'นักธนู — ยิงจากระยะไกล เน้นความเร็ว',ok:{text:'ท่านตื่นพลังเป็นนักธนู',effects:[{class:'bow'},{mana:10}]}},
  {text:'นักเวท — ร่ายลูกไฟ เน้นปัญญา',when:{mana:{min:8}},lockText:'ต้องมีมานาแฝง 8 ขึ้นไป',ok:{text:'ท่านตื่นพลังเป็นนักเวท',effects:[{class:'mage'},{mana:12}]}},
  {text:'นักลอบสังหาร — หายตัวไปด้านหลังศัตรู',ok:{text:'ท่านตื่นพลังเป็นนักลอบสังหาร',effects:[{class:'assassin'},{mana:10}]}},
  {text:'ผู้รักษา — ฟื้นฟูตัวเองและทีม',when:{mana:{min:8}},lockText:'ต้องมีมานาแฝง 8 ขึ้นไป',ok:{text:'ท่านตื่นพลังเป็นผู้รักษา',effects:[{class:'healer'},{mana:12}]}},
  {text:'ผู้คุ้มกัน — ยกโล่รับดาเมจแทนทีม',ok:{text:'ท่านตื่นพลังเป็นผู้คุ้มกัน',effects:[{class:'tank'},{mana:10}]}}]},
{id:'rank_evaluation',title:'ประเมินแรงก์',trigger:'enter',at:'association',once:true,priority:80,when:{all:[{awakened:true},{rank:{is:null}}]},src:'prog6.js:96 (ข้อความลูกแก้วประเมินพลัง)',
 text:'เจ้าหน้าที่ยุนแชอาพาท่านไปที่ห้องประเมิน ท่านวางมือลงบนลูกแก้วประเมินพลัง แสงพุ่งขึ้นเต็มห้อง',
 choices:[{text:'รอฟังผล',ok:{text:'เจ้าหน้าที่ประกาศผลและบันทึกลงฐานข้อมูลสมาคม',effects:[{rankInit:'hunter'}]}}]},
{id:'registration',title:'ลงทะเบียนฮันเตอร์',trigger:'enter',at:'association',priority:70,when:{all:[{rank:{min:'E'}},{notWorldFlag:'registered'}]},src:'new',
 text:'ยุนแชอายื่นแบบฟอร์มให้ "ถ้าจะรับภารกิจหรือเข้าย่านเกต ต้องลงทะเบียนเป็นฮันเตอร์ก่อน ค่าธรรมเนียมแรกเข้า 50 ถ้าเป็นนักเรียนเพิ่งจบขอยกเว้นได้ แต่ต้องคุยให้ผ่าน"',
 choices:[
  {text:'จ่ายค่าธรรมเนียม 50',when:{money:{min:50}},lockText:'เงินไม่พอ',ok:{text:'ท่านได้รับบัตรฮันเตอร์ ชื่อของท่านขึ้นบนกระดานสมาคมแล้ว',effects:[{money:-50},{worldFlag:'registered'},{item:{id:'hunter_license'}},{rel:{npc:'clerk_yoon',n:3}}]}},
  {text:'ขอยกเว้นค่าธรรมเนียม',check:{stat:'cha',dc:'easy'},ok:{text:'ยุนแชอาหัวเราะแล้วประทับตรายกเว้นให้',effects:[{worldFlag:'registered'},{item:{id:'hunter_license'}}]},fail:{text:'"ระเบียบคือระเบียบ" ยุนแชอาบอก ท่านต้องกลับมาใหม่พร้อมเงิน',effects:[]}},
  {text:'ไว้ก่อน',ok:{text:'ท่านเก็บแบบฟอร์มใส่กระเป๋า',effects:[]}}]},
{id:'guild_offer',title:'กิลด์ชวนเข้าร่วม',trigger:'enter',at:'association',once:true,priority:60,when:{all:[{worldFlag:'registered'},{missions:{tag:'any',min:2}}]},src:'new',
 text:'หลังงานที่สองของท่าน มีคนจากสองกิลด์มารอที่ล็อบบี้สมาคม กิลด์เขี้ยวเหล็กเน้นงานล่าที่ได้ประสบการณ์มาก ส่วนกิลด์ดาวเหนือเน้นงานคุ้มกันที่จ่ายดี',
 choices:[
  {text:'เข้ากิลด์เขี้ยวเหล็ก',ok:{text:'หัวหน้ากิลด์ตบไหล่ท่าน "ที่นี่เราล่าอย่างเดียว"',effects:[{worldFlag:'guild_ironfang'},{reputation:2}]}},
  {text:'เข้ากิลด์ดาวเหนือ',ok:{text:'ท่านได้เสื้อกิลด์สีน้ำเงินกับตารางงานคุ้มกัน',effects:[{worldFlag:'guild_northstar'},{reputation:2}]}},
  {text:'อยู่อิสระต่อไป',ok:{text:'ท่านอยากเลือกงานเอง',effects:[{worldFlag:'guild_none'}]}}]},
{id:'rank_d_ready',title:'สมาคมเรียกสอบเลื่อนแรงก์',trigger:'enter',at:'association',once:true,priority:50,when:{canPromote:'hunter',rank:{is:'E'}},src:'new',
 text:'ยุนแชอายิ้มเมื่อเห็นประวัติภารกิจของท่าน "ผลงานถึงเกณฑ์แรงก์ D แล้ว ไปลงชื่อสอบภาคปฏิบัติได้ที่กระดานภารกิจ"',
 choices:[{text:'รับทราบ',ok:{text:'ภารกิจสอบเลื่อนแรงก์ D ปรากฏบนกระดาน',effects:[]}}]},
{id:'rank_c_ready',title:'คำแนะนำก่อนสอบแรงก์ C',trigger:'enter',at:'association',once:true,priority:50,when:{canPromote:'hunter',rank:{is:'D'}},src:'new',
 text:'"แรงก์ C คือเส้นแบ่งระหว่างมือใหม่กับมืออาชีพ" ยุนแชอาบอก "หุ่นประเมินรอบนี้แรงกว่าครั้งก่อนสองเท่า เตรียมอุปกรณ์ให้พร้อม"',
 choices:[{text:'รับทราบ',ok:{text:'ภารกิจสอบเลื่อนแรงก์ C ปรากฏบนกระดาน',effects:[]}}]},
{id:'reached_c',title:'ฮันเตอร์แรงก์ C',trigger:'auto',once:true,priority:95,when:{rank:{is:'C'}},src:'new',
 text:'ชื่อของ {name} ถูกย้ายไปกระดานแรงก์ C ฮาจุนส่งข้อความมาแสดงความยินดีพร้อมรูปคลิปเก่าหน้าเกตที่เคยถ่ายด้วยกัน จบวงจรแรกของโลกฮันเตอร์',
 choices:[{text:'ก้าวต่อไป',ok:{text:'ท่านเป็นฮันเตอร์แรงก์ C แล้ว',effects:[{reputation:10},{flag:'hunter_c_reached'}]}}]},
]);
})(globalThis.AW);
