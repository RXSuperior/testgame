// Hunter World: เหตุการณ์ที่ย้ายจาก events2.js (Phase 4) · ตารางตรวจทั้ง 62 รายการอยู่ใน docs/phase4/EVENTS2_MIGRATION_AUDIT.md
// การแปลงผล: tr->trait, karma->karma, fame->reputation, gold->money, aff(คน)->rel, [cls().m]->classStat, hp ตามสัดส่วน->hpPct
// ผลที่ยังไม่มีระบบ (fav ความโปรดปรานดวงดาว, coin ดาวเหรียญ) ตัดออก · cause (ตายได้ในเกมเดิม) -> บาดเจ็บ (การต่อสู้ยังไม่ทำให้ตาย)
// ค่าเงินที่เดิมคูณตามแรงก์ (G()) ใช้ตัวเลขคงที่ระดับ E-D · การต่อสู้ที่อิงแรงก์ใช้ศัตรู powerByRank พร้อม mult เดิม
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
const school={awakened:false},hunter={awakened:true};
const ev=(id,line,o)=>Object.assign({id:'e2_'+id,trigger:'month',weight:2,src:'events2.js:'+line},o);
H.events=(H.events||[]).concat([
// ---------- ช่วงนักเรียน ----------
ev('transfer',5,{title:'เพื่อนใหม่ย้ายมากลางเทอม',at:'school',when:school,cooldown:24,text:'นักเรียนย้ายมาใหม่นั่งโต๊ะข้างท่าน ไม่พูดกับใครเลยทั้งวัน กระเป๋าของเขามีรอยไหม้เหมือนผ่านไฟมา',choices:[
 {text:'ชวนไปกินข้าวด้วยกัน',check:{stat:'cha',dc:'easy',trait:'kind'},ok:{text:'{who}พูดเบา ๆ ว่าบ้านเก่าอยู่ในเขต Dungeon Break เมื่อปีก่อน',effects:[{meet:{role:'เพื่อนร่วมชั้น',tags:['classmate'],ageOffset:0,aff:45}},{stat:{cha:1}},{karma:2},{trait:{kind:5}}]},fail:{text:'เขาส่ายหน้าแล้วเดินหนีไป',effects:[]}},
 {text:'ปล่อยให้เขามีที่ส่วนตัว',ok:{text:'สัปดาห์ต่อมาเขาวางขนมไว้บนโต๊ะท่านหนึ่งห่อ',effects:[{stat:{luk:1}}]}},
 {text:'ถามเรื่องรอยไหม้ตรง ๆ',check:{stat:'cha',dc:'hard'},ok:{text:'เขาเล่าเรื่องคืนนั้นทั้งน้ำตา ท่านนั่งฟังจนจบ',effects:[{stat:{cha:2}},{karma:3}]},fail:{text:'เขาโกรธจนลุกเดินออกจากห้อง',effects:[{stat:{cha:-1}}]}}]}),
ev('quiz',9,{title:'ครูเสนอให้ลงแข่งตอบปัญหา',at:'school',when:{all:[school,{flag:'path_study'}]},once:true,who:{npc:'teacher_park'},text:'{who} ครูวิทยาศาสตร์อยากให้ท่านเป็นตัวแทนแข่งตอบปัญหาเรื่องเกตระดับประเทศ ต้องติวทุกเย็นสองเดือน',choices:[
 {text:'รับ แล้วติวหนัก',check:{stat:'int',dc:'mid',trait:'dili'},ok:{text:'ทีมของท่านได้ที่สอง รูปขึ้นบอร์ดหน้าโรงเรียน',effects:[{stat:{int:3}},{reputation:3},{trait:{dili:6}},{rel:{npc:'$who',n:5}}]},fail:{text:'ตกรอบแรก แต่ได้ความรู้ติดตัวมาเยอะ',effects:[{stat:{int:2}}]}},
 {text:'รับ แต่ไม่ค่อยไปติว',check:{stat:'luk',dc:'hard'},ok:{text:'คำถามสุดท้ายเป็นเรื่องที่ท่านบังเอิญอ่านเมื่อคืน ทีมชนะ',effects:[{reputation:4},{trait:{dili:-3}}]},fail:{text:'ท่านตอบผิดข้อง่าย ๆ ต่อหน้ากล้อง',effects:[{reputation:-1},{trait:{dili:-3}}]}},
 {text:'ปฏิเสธ',ok:{text:'ครูดูผิดหวังเล็กน้อย',effects:[{rel:{npc:'$who',n:-2}}]}}]}),
ev('election',13,{title:'โกงเลือกตั้งประธานนักเรียน',at:'school',when:school,once:true,text:'ท่านเห็นกรรมการคนหนึ่งแอบเปลี่ยนกล่องบัตรเลือกตั้งในห้องเก็บของ เขาเป็นเพื่อนของคนที่กำลังจะชนะ',choices:[
 {text:'แจ้งครูทันที',check:{stat:'cha',dc:'mid',trait:'brave'},ok:{text:'มีการนับคะแนนใหม่ ผลพลิก ทั้งโรงเรียนพูดถึงท่าน',effects:[{reputation:3},{karma:4},{trait:{loyal:6,brave:4}}]},fail:{text:'ครูไม่เชื่อ ท่านถูกมองว่าอิจฉา',effects:[{stat:{cha:-1}},{karma:2}]}},
 {text:'ถ่ายรูปเก็บไว้ก่อน',check:{stat:'agi',dc:'mid'},ok:{text:'รูปนั้นกลายเป็นหลักฐานชิ้นสำคัญในภายหลัง',effects:[{stat:{int:1}},{karma:3}]},fail:{text:'เขาหันมาเห็นพอดี',effects:[{hp:-10}]}},
 {text:'ทำเป็นไม่เห็น',ok:{text:'ท่านเดินกลับห้องเงียบ ๆ',effects:[{trait:{loyal:-4,brave:-3}}]}}]}),
ev('sibling_sick',17,{title:'{who}ป่วยหนัก',at:'home',when:school,cooldown:36,who:{role:'sibling'},text:'{who}ไข้ขึ้นสูงกลางดึก พ่อแม่ไปต่างจังหวัด โรงพยาบาลอยู่อีกฝั่งเมือง และฝนกำลังตกหนัก',choices:[
 {text:'แบกไปโรงพยาบาลเอง',check:{stat:'vit',dc:'mid',trait:'brave'},ok:{text:'ท่านไปถึงทันเวลา หมอบอกว่าช้ากว่านี้อีกนิดอาจอันตราย "ขอบคุณนะ"',effects:[{stat:{vit:2}},{rel:{npc:'$who',n:15}},{trait:{brave:5}}]},fail:{text:'ท่านไปถึงได้แต่หมดแรงล้มหน้าห้องฉุกเฉิน',effects:[{hp:-20},{rel:{npc:'$who',n:15}}]}},
 {text:'โทรเรียกรถพยาบาล',check:{stat:'luk',dc:'mid'},ok:{text:'รถมาถึงในสิบนาที',effects:[{rel:{npc:'$who',n:5}}]},fail:{text:'รถติดน้ำท่วม มาถึงตอนเช้า ไข้ลดลงเองพอดี',effects:[{rel:{npc:'$who',n:3}}]}},
 {text:'เช็ดตัวและเฝ้าทั้งคืน',check:{stat:'int',dc:'easy'},ok:{text:'ไข้ลดตอนรุ่งสาง ท่านหลับคาเก้าอี้',effects:[{stat:{int:1}},{rel:{npc:'$who',n:8}}]},fail:{text:'ไข้ไม่ลด ต้องพาไปโรงพยาบาลตอนเช้า',effects:[{rel:{npc:'$who',n:4}}]}}]}),
ev('ramen_rush',21,{title:'ร้านราเมงขาดคน',at:'city',when:{all:[{age:{max:22}},{any:[{flag:'path_work'},{job:'ramen'}]}]},cooldown:12,weight:3,who:{npc:'ramen_owner'},text:'{who} เจ้าของร้านราเมงหน้าสถานีขอให้ช่วยทำกะเพิ่มช่วงสอบ จ่ายเป็นสองเท่า',choices:[
 {text:'รับกะเพิ่ม',ok:{text:'ได้เงินก้อนโต แต่สอบได้คะแนนแย่',effects:[{money:200},{stat:{int:-1}},{trait:{dili:4}},{rel:{npc:'$who',n:4}}]}},
 {text:'ขอทำครึ่งเดียว',check:{stat:'cha',dc:'easy'},ok:{text:'เจ้าของร้านยอม แถมราเมงให้กลับบ้าน',effects:[{money:100},{hp:10}]},fail:{text:'เจ้าของร้านไปหาคนอื่นแทน',effects:[]}},
 {text:'ปฏิเสธเพื่อไปอ่านหนังสือ',ok:{text:'ท่านอ่านหนังสือจนดึกทุกคืน',effects:[{stat:{int:2}}]}}]}),
ev('harsh_senior',25,{title:'รุ่นพี่ชมรมกีฬาซ้อมโหด',when:{all:[school,{flag:'path_sport'}]},cooldown:18,text:'รุ่นพี่สั่งให้วิ่งรอบสนามจนกว่าจะอาเจียน ใครหยุดก่อนต้องล้างห้องน้ำทั้งเทอม',choices:[
 {text:'วิ่งจนสุดแรง',check:{stat:'vit',dc:'mid',trait:'dili'},ok:{text:'ท่านเป็นคนสุดท้ายที่ยังวิ่งอยู่ รุ่นพี่ตบไหล่',effects:[{stat:{vit:3}},{trait:{dili:5}}]},fail:{text:'ท่านเป็นลมกลางสนาม',effects:[{hp:-15},{stat:{vit:1}}]}},
 {text:'บอกว่านี่ไม่ใช่การฝึก นี่คือการแกล้ง',check:{stat:'cha',dc:'hard',trait:'brave'},ok:{text:'สมาชิกคนอื่นพยักหน้าตาม รุ่นพี่ยอมเลิก',effects:[{stat:{cha:2}},{reputation:2},{trait:{brave:6}}]},fail:{text:'ท่านถูกสั่งล้างห้องน้ำทั้งเทอม',effects:[{stat:{str:1}}]}},
 {text:'แกล้งเจ็บข้อเท้า',check:{stat:'cha',dc:'mid'},ok:{text:'รุ่นพี่เชื่อ ท่านนั่งพักข้างสนาม',effects:[{trait:{dili:-5}}]},fail:{text:'รุ่นพี่จับได้ โทษหนักขึ้นสองเท่า',effects:[{stat:{str:1}},{trait:{dili:-5}}]}}]}),
ev('bf_birthday',29,{title:'ปาร์ตี้วันเกิดเพื่อน',at:'city',when:{all:[{age:{max:19}},{npcAlive:'best_friend'}]},cooldown:12,weight:3,who:{npc:'best_friend'},text:'{who}จัดปาร์ตี้วันเกิดที่ห้องคาราโอเกะ มีคนในโรงเรียนมาเกือบครึ่ง',choices:[
 {text:'ร้องเพลงเปิดงาน',check:{stat:'cha',dc:'mid'},ok:{text:'ทั้งห้องร้องตาม คลิปถูกส่งต่อในกลุ่มโรงเรียน',effects:[{stat:{cha:2}},{reputation:2},{rel:{npc:'$who',n:5}}]},fail:{text:'เสียงหลงตั้งแต่ท่อนแรก แต่ทุกคนหัวเราะอย่างเอ็นดู',effects:[{stat:{cha:1}},{rel:{npc:'$who',n:3}}]}},
 {text:'ซื้อของขวัญราคาแพง (150)',when:{money:{min:150}},lockText:'เงินไม่พอ',ok:{text:'{who}กอดท่านแน่น',effects:[{money:-150},{rel:{npc:'$who',n:10}}]}},
 {text:'นั่งคุยกับคนที่ไม่รู้จัก',ok:{text:'ท่านได้รู้จักคนที่ฝันอยากเป็นนักวิจัยเกต',effects:[{meet:{role:'คนรู้จักจากงานเลี้ยง',aff:35}},{stat:{cha:1}}]}}]}),
ev('old_man',33,{title:'ชายชราที่ป้ายรถเมล์',when:school,once:true,weight:1,text:'ชายชรามือข้างหนึ่งเป็นเหล็ก ถามท่านว่า "ถ้าวันหนึ่งเจ้ามีพลัง เจ้าจะใช้มันปกป้องใคร"',choices:[
 {text:'ครอบครัว',ok:{text:'เขายิ้มแล้วยื่นเหรียญทองแดงเก่า ๆ ให้หนึ่งเหรียญ',effects:[{stat:{luk:2}},{flag:'coin_old'}]}},
 {text:'ทุกคนที่อ่อนแอกว่า',ok:{text:'เขาหัวเราะเสียงดัง "เด็กโง่แบบนี้แหละที่โลกต้องการ" แล้ววางเหรียญทองแดงไว้ในมือท่าน',effects:[{karma:4},{flag:'coin_old'}]}},
 {text:'ตัวเอง',ok:{text:'เขาพยักหน้า "อย่างน้อยเจ้าก็ซื่อสัตย์" แล้วโยนเหรียญทองแดงให้',effects:[{stat:{vit:2}},{flag:'coin_old'}]}},
 {text:'ไม่รู้',ok:{text:'"ดีแล้ว คนที่ตอบได้ทันทีมักจะตอบผิด" เขาทิ้งเหรียญทองแดงไว้บนม้านั่ง',effects:[{stat:{int:2}},{flag:'coin_old'}]}}]}),
ev('drunk_hunter',38,{title:'ฮันเตอร์เมาอาละวาด',at:'city',when:school,cooldown:24,text:'ฮันเตอร์แรงก์ D เมาเหล้าทุบกระจกร้านสะดวกซื้อ พนักงานหญิงตัวสั่นอยู่หลังเคาน์เตอร์',choices:[
 {text:'ถ่ายคลิปแล้วเรียกตำรวจ',check:{stat:'agi',dc:'easy'},ok:{text:'ทีมสมาคมมาลากเขาไปในห้านาที',effects:[{karma:2}]},fail:{text:'เขาเห็นท่านถ่ายคลิป แล้วปาขวดใส่',effects:[{hp:-15}]}},
 {text:'พาพนักงานหนีออกประตูหลัง',check:{stat:'agi',dc:'mid',trait:'brave'},ok:{text:'ทั้งคู่ปลอดภัย เธอขอบคุณจนร้องไห้',effects:[{karma:5},{trait:{brave:6,kind:4}}]},fail:{text:'เขาเห็นแล้วเหวี่ยงชั้นวางล้มใส่',effects:[{hp:-25},{karma:3}]}},
 {text:'เดินหนี',ok:{text:'คืนนั้นท่านนอนไม่หลับ',effects:[{trait:{brave:-4}}]}}]}),
ev('tuition',42,{title:'ค่าเทอมค้างจ่าย',at:'home',when:{all:[school,{familyBg:['poor','middle','retired_hunter']},{familyRole:{role:'mother',alive:true}}]},cooldown:24,who:{role:'mother'},text:'จดหมายจากโรงเรียนแจ้งว่าค่าเทอมค้างจ่ายสองเดือน {who}บอกว่ารอเงินเดือนพ่อออกก่อน',choices:[
 {text:'เอาเงินเก็บของตัวเองจ่าย (150)',when:{money:{min:150}},lockText:'เงินไม่พอ',ok:{text:'แม่ไม่พูดอะไร แต่คืนนั้นทำกับข้าวที่ท่านชอบ',effects:[{money:-150},{rel:{npc:'$who',n:10}},{trait:{loyal:5}}]}},
 {text:'ขอผ่อนผันกับฝ่ายการเงิน',check:{stat:'cha',dc:'mid'},ok:{text:'โรงเรียนให้ผ่อนได้สามเดือน',effects:[{stat:{cha:1}}]},fail:{text:'ท่านถูกเรียกชื่อหน้าแถวตอนเช้า',effects:[{stat:{cha:-1}}]}},
 {text:'ทำเป็นไม่รู้',ok:{text:'พ่อทำงานล่วงเวลาทุกคืนจนจ่ายได้',effects:[{trait:{loyal:-2}}]}}]}),
ev('gym_gate',46,{title:'เกตเปิดในโรงยิม',at:'school',when:school,once:true,weight:1,text:'เสียงไซเรนดังทั่วโรงเรียน เกตแรงก์ E เปิดขึ้นกลางโรงยิมระหว่างคาบพละ ครูพละสั่งให้ทุกคนวิ่งออกไป แต่มีเด็กชั้น ม.1 ติดอยู่บนอัฒจันทร์',choices:[
 {text:'วิ่งกลับไปช่วย',check:{stat:'agi',dc:'hard',trait:'brave'},ok:{text:'ท่านอุ้มเด็กกระโดดลงจากอัฒจันทร์ได้ทันก่อนสไลม์จะพุ่งถึง ทั้งเมืองพูดถึงชื่อท่าน',effects:[{reputation:8},{karma:6},{trait:{brave:12}},{flag:'title_hero'}]},fail:{text:'ท่านพาเด็กออกมาได้แต่ถูกกรดสไลม์ลวกแขน',effects:[{hp:-40},{injury:2},{karma:6},{reputation:4},{trait:{brave:10}}]}},
 {text:'ตะโกนบอกให้ครูไปช่วย',check:{stat:'cha',dc:'mid'},ok:{text:'ครูพละวิ่งกลับไปพาเด็กออกมาได้',effects:[{karma:2}]},fail:{text:'เสียงไซเรนกลบเสียงท่านหมด',effects:[]}},
 {text:'วิ่งออกไปตามคำสั่ง',ok:{text:'ทีมสมาคมช่วยเด็กออกมาได้ในสิบนาที',effects:[{trait:{brave:-3}}]}}]}),
ev('tutor',50,{title:'ติวเตอร์ราคาแพง',at:'city',when:{all:[school,{flag:'path_study'}]},once:true,text:'สถาบันกวดวิชาชื่อดังเปิดคอร์ส "เตรียมตัวตื่นพลัง" สอนทฤษฎีมานา ราคาเท่ากับค่าขนมทั้งปี',choices:[
 {text:'ลงเรียน (300)',when:{money:{min:300}},lockText:'เงินไม่พอ',ok:{text:'เนื้อหาครึ่งหนึ่งเป็นเรื่องจริง อีกครึ่งเป็นการขายของ',effects:[{money:-300},{stat:{int:3}},{mana:3}]}},
 {text:'ขอเอกสารเพื่อนมาอ่าน',check:{stat:'cha',dc:'easy'},ok:{text:'ได้เนื้อหาเดียวกันโดยไม่เสียเงิน',effects:[{stat:{int:2}}]},fail:{text:'เพื่อนบอกว่าเอกสารมีลิขสิทธิ์',effects:[]}},
 {text:'ไม่เชื่อว่าเรียนแล้วจะตื่นพลังได้',ok:{text:'ท่านใช้เวลาไปออกกำลังกายแทน',effects:[{stat:{str:1,vit:1}}]}}]}),
ev('father_hunter',54,{title:'พ่อเคยเป็นฮันเตอร์',at:'home',when:{all:[school,{familyBg:'retired_hunter'},{familyRole:{role:'father',alive:true}}]},once:true,who:{role:'father'},text:'ท่านเจอกล่องเหล็กใต้เตียงพ่อ ข้างในมีบัตรฮันเตอร์แรงก์ C ที่ถูกตัดมุม และรูปถ่ายทีมห้าคนที่หน้าถูกขีดฆ่าไปสามคน',choices:[
 {text:'ถามพ่อตรง ๆ',check:{stat:'cha',dc:'mid'},ok:{text:'พ่อเล่าเรื่องเกตแดงเมื่อยี่สิบปีก่อนเป็นครั้งแรก แล้วสอนท่าฟันพื้นฐานให้',effects:[{stat:{str:3}},{rel:{npc:'$who',n:12}},{remember:{npc:'$who',t:'เล่าเรื่องเกตแดงให้ลูกฟัง'}}]},fail:{text:'พ่อเงียบไปทั้งคืน แล้วเก็บกล่องไปซ่อนที่อื่น',effects:[{rel:{npc:'$who',n:-4}}]}},
 {text:'เก็บไว้ที่เดิม',ok:{text:'ท่านจำหน้าสองคนที่เหลือในรูปไว้',effects:[{stat:{int:1}}]}},
 {text:'เอาบัตรไปค้นประวัติในเน็ต',check:{stat:'int',dc:'mid'},ok:{text:'ทีมของพ่อเคยถูกยกย่องว่าเป็นทีมที่ดีที่สุดของเมือง',effects:[{stat:{int:2}}]},fail:{text:'ข้อมูลถูกลบออกจากระบบหมด',effects:[]}}]}),
// ---------- หลังตื่นพลัง ----------
ev('rookies',59,{title:'ฮันเตอร์มือใหม่ขอคำแนะนำ',at:'association',when:{rank:{min:'E'}},cooldown:12,weight:3,text:'ฮันเตอร์แรงก์ E สองคนที่เพิ่งได้บัตรมายืนลังเลหน้ากระดานภารกิจ แล้วหันมาถามท่านว่าควรเริ่มจากเกตไหน',choices:[
 {text:'พาลงเกตง่าย ๆ หนึ่งรอบ',fight:{enemy:'goblins',mult:0.8},ok:{text:'ทั้งคู่ผ่านเกตแรกได้ แล้วขอแลกเบอร์ไว้',effects:[{reputation:2},{karma:3},{stat:{cha:1}},{meet:{role:'ฮันเตอร์รุ่นน้อง',occupation:'npc_hunter',aff:40}}]},fail:{text:'ท่านพาทั้งคู่ถอยออกมาได้ ทุกคนรอด',effects:[{karma:2}]}},
 {text:'สอนวิธีอ่านกระดานภารกิจ',ok:{text:'ทั้งคู่จดตามท่านทุกคำ',effects:[{stat:{int:1}},{karma:2}]}},
 {text:'บอกให้ไปถามเจ้าหน้าที่',ok:{text:'ทั้งคู่เดินจากไปอย่างเก้อ ๆ',effects:[{trait:{kind:-2}}]}}]}),
ev('ranking',63,{title:'ระบบจัดอันดับฮันเตอร์',at:'association',when:{rank:{min:'E'}},cooldown:12,text:'สมาคมเปิดการประเมินอันดับประจำปี ใครติดร้อยอันดับแรกจะได้สิทธิ์เลือกเกตก่อน ต้องสู้กับหุ่นจำลองต่อหน้ากรรมการ',choices:[
 {text:'ลงแข่งเต็มที่',fight:{enemy:'street_thugs',mult:1.1},ok:{text:'ท่านติดอันดับ ชื่อขึ้นป้ายไฟหน้าสมาคม',effects:[{reputation:8},{money:500}]},fail:{text:'คะแนนท่านอยู่กลางตาราง',effects:[{reputation:1}]}},
 {text:'ศึกษาจุดอ่อนหุ่นก่อนแข่ง',check:{stat:'int',dc:'mid'},ok:{text:'ท่านจบการทดสอบเร็วเป็นอันดับสาม',effects:[{reputation:6},{stat:{int:1}}]},fail:{text:'หุ่นอัปเดตรุ่นใหม่ จุดอ่อนที่จดไว้ใช้ไม่ได้',effects:[]}},
 {text:'ไม่ลงแข่ง',ok:{text:'ท่านใช้เวลาไปฝึกแทน',effects:[{classStat:1}]}}]}),
ev('gate_break',67,{title:'เกตกำลังจะแตก',at:'gate_zone',when:{rank:{min:'E'}},cooldown:18,weight:3,text:'เกตที่ไม่มีใครรับมาสามเดือนเริ่มสั่นและมีรอยร้าว เจ้าหน้าที่ประเมินว่าเหลือเวลาไม่ถึงชั่วโมง ทีมใหญ่ยังมาไม่ถึง',choices:[
 {text:'บุกเข้าไปปิดเกตก่อน',fight:{enemy:'gate_boss',mult:1.3},ok:{text:'ท่านล้มบอสได้ก่อนเกตแตก ทั้งย่านปลอดภัย',effects:[{reputation:10},{exp:120},{money:300}]},fail:{text:'ท่านลากตัวเองออกมาทันก่อนประตูปิด',effects:[{injury:1}]}},
 {text:'จัดคนอพยพชาวบ้าน',check:{stat:'cha',dc:'mid',trait:'kind'},ok:{text:'ทุกบ้านในรัศมีห้าร้อยเมตรว่างเปล่าเมื่อเกตแตก ไม่มีใครเจ็บ',effects:[{karma:8},{reputation:4}]},fail:{text:'คนแก่บางคนไม่ยอมออกจากบ้าน',effects:[{karma:3}]}},
 {text:'รอทีมใหญ่',ok:{text:'ทีมใหญ่มาช้าไปสิบนาที ร้านค้าแถวนั้นพังหมด',effects:[{trait:{brave:-2}}]}}]}),
ev('mom_request',71,{title:'คำขอจากแม่',when:{all:[{rank:{min:'E'}},{familyRole:{role:'mother',alive:true}}]},cooldown:36,who:{role:'mother'},text:'{who}โทรมาเสียงสั่น ขอให้ท่านเลิกลงเกตแล้วกลับมาทำงานที่บ้าน "แม่ฝันร้ายทุกคืนตั้งแต่ลูกเป็นฮันเตอร์"',choices:[
 {text:'กลับไปหาแม่หนึ่งสัปดาห์',ok:{text:'แม่ทำอาหารให้ทุกมื้อ ท่านได้พักเต็มที่ "กินเยอะ ๆ นะลูก"',effects:[{hp:999},{rel:{npc:'$who',n:10}}]}},
 {text:'ส่งเงินให้แม่แทน (500)',when:{money:{min:500}},lockText:'เงินไม่พอ',ok:{text:'แม่รับเงินแต่น้ำเสียงยังเป็นห่วง',effects:[{money:-500},{rel:{npc:'$who',n:4}}]}},
 {text:'บอกว่าลูกเลือกทางนี้แล้ว',check:{stat:'cha',dc:'mid'},ok:{text:'แม่เงียบไปนาน แล้วบอกว่า "ระวังตัวด้วยนะ"',effects:[{rel:{npc:'$who',n:2}}]},fail:{text:'แม่วางสายใส่',effects:[{rel:{npc:'$who',n:-8}}]}}]}),
ev('hunter_corpse',83,{title:'ศพฮันเตอร์ในดันเจี้ยน',at:'gate_zone',when:{rank:{min:'E'}},cooldown:24,weight:3,text:'ท่านเจอศพฮันเตอร์ที่หายไปเมื่อเดือนก่อน ในมือยังกำโทรศัพท์ไว้ ในนั้นยังมีเสียงฝากถึงลูกสาวที่ยังส่งไม่ถึง',choices:[
 {text:'นำศพและโทรศัพท์กลับไปให้ครอบครัว',check:{stat:'str',dc:'mid'},ok:{text:'ลูกสาวของเขาได้ฟังข้อความสุดท้ายของพ่อ',effects:[{karma:8},{trait:{kind:6}}]},fail:{text:'ท่านนำได้แค่โทรศัพท์กลับมา',effects:[{karma:5}]}},
 {text:'เก็บอุปกรณ์ของเขามาใช้',ok:{text:'อาวุธของเขาดีกว่าของท่าน',effects:[{classStat:2},{karma:-3},{item:{id:'mana_blade_d'}}]}},
 {text:'แจ้งพิกัดให้สมาคม',ok:{text:'ทีมกู้ศพมาถึงในสองวัน',effects:[{karma:2}]}}]}),
ev('empty_gate',87,{title:'เกตที่ไม่มีมอนสเตอร์',when:{rank:{min:'E'}},once:true,weight:1,text:'ข้างในเกตเงียบสนิท มีแต่สวนดอกไม้สีขาวกับบ้านไม้หลังเล็ก ประตูบ้านแง้มอยู่',choices:[
 {text:'เข้าไปในบ้าน',check:{stat:'luk',dc:'hard'},ok:{text:'บนโต๊ะมีจดหมายที่จ่าหน้าถึงท่าน ลายมือของท่านเอง ข้างในเขียนว่า "อย่าเชื่อดวงดาวทุกดวง"',effects:[{stat:{int:3,luk:3}},{flag:'letter_from_self'}]},fail:{text:'ท่านตื่นขึ้นมานอกเกต จำอะไรไม่ได้เลยสามวัน',effects:[{hp:-20}]}},
 {text:'เก็บดอกไม้ไปให้นักวิจัย',ok:{text:'ดอกไม้เหี่ยวทันทีที่ออกจากเกต',effects:[{stat:{int:1}}]}},
 {text:'ออกจากเกตทันที',ok:{text:'ประตูเกตปิดลงข้างหลังท่านช้า ๆ เหมือนโบกมือลา',effects:[]}}]}),
ev('blood_donation',91,{title:'หมอขอเลือดฮันเตอร์',at:'hospital',when:{rank:{min:'E'}},cooldown:24,weight:3,who:{npc:'doctor_seo'},text:'{who}บอกว่าเด็กที่ถูกพิษอสูรต้องการเลือดของฮันเตอร์ที่มีค่ามานาสูงเพื่อทำเซรุ่ม ถ้าให้ ท่านจะอ่อนแรงไปหนึ่งเดือน',choices:[
 {text:'ให้เลือด',ok:{text:'เด็กฟื้นในสามวัน แม่ของเด็กส่งจดหมายขอบคุณมาทุกปี',effects:[{hpPct:-0.4},{karma:10},{trait:{kind:8}},{rel:{npc:'$who',n:6}}]}},
 {text:'ขอค่าตอบแทน',check:{stat:'cha',dc:'easy'},ok:{text:'โรงพยาบาลจ่ายค่าตอบแทนให้ตามระเบียบ',effects:[{hpPct:-0.4},{money:400},{karma:4}]},fail:{text:'หมอมองท่านด้วยสายตาที่ไม่ค่อยดี',effects:[{karma:-2},{rel:{npc:'$who',n:-4}}]}},
 {text:'ปฏิเสธ',ok:{text:'คืนนั้นมีฮันเตอร์อีกคนมาให้เลือดแทน',effects:[{trait:{kind:-4}}]}}]}),
ev('reality_show',99,{title:'รายการเรียลลิตี้ฮันเตอร์',at:'city',when:{all:[{rank:{min:'E'}},{reputation:{min:20}}]},once:true,text:'สถานีโทรทัศน์เสนอให้ท่านเป็นนักแสดงหลักในรายการ "หนึ่งปีในชีวิตฮันเตอร์" กล้องจะตามท่านเข้าเกตทุกครั้ง',choices:[
 {text:'รับเล่น',ok:{text:'ทั้งประเทศรู้จักหน้าท่าน แต่ไม่มีเวลาส่วนตัวอีกเลย',effects:[{reputation:20},{money:3000},{stat:{cha:2}}]}},
 {text:'รับ แต่ห้ามกล้องเข้าเกต',check:{stat:'cha',dc:'hard'},ok:{text:'สถานียอม รายการออกมาอบอุ่นกว่าที่คิด',effects:[{reputation:12},{money:1800}]},fail:{text:'สถานีไปจ้างคู่แข่งของท่านแทน',effects:[]}},
 {text:'ปฏิเสธ',ok:{text:'ท่านอยากเป็นฮันเตอร์ ไม่ใช่ดารา',effects:[{trait:{loyal:3}}]}}]}),
ev('secret_files',103,{title:'เอกสารลับในห้องประธาน',at:'association',when:{all:[{rank:{min:'D'}},{any:[{worldFlag:'guild_northstar'},{job:'assoc_clerk'}]}]},once:true,text:'ระหว่างส่งรายงาน ท่านเห็นแฟ้มบนโต๊ะประธานสมาคม หน้าแรกเขียนว่า "เกตแรงก์ S ที่ปิดข่าว: 4 แห่ง"',choices:[
 {text:'แอบเปิดอ่าน',check:{stat:'agi',dc:'hard'},ok:{text:'มีเกต S แห่งหนึ่งอยู่ใต้หอคอยกลางเมือง ท่านรีบปิดแฟ้มก่อนประตูเปิด',effects:[{stat:{int:3}},{flag:'secret_s_gates'}]},fail:{text:'เลขาประธานเดินเข้ามาพอดี ท่านถูกพักงานหนึ่งเดือน',effects:[{reputation:-5}]}},
 {text:'ถามประธานตรง ๆ',check:{stat:'cha',dc:'ext',trait:'brave'},ok:{text:'ประธานจ้องท่านนาน แล้วเชิญเข้าทีมพิเศษ',effects:[{reputation:6},{money:1000}]},fail:{text:'ประธานยิ้มแล้วบอกว่าท่านเห็นผิด',effects:[]}},
 {text:'ทำเป็นไม่เห็น',ok:{text:'ท่านวางรายงานแล้วเดินออกไป',effects:[]}}]}),
ev('stalker',107,{title:'คนสะกดรอยตาม',at:'city',when:{rank:{min:'E'}},cooldown:24,text:'สามวันติดกันที่ท่านเห็นรถตู้สีดำจอดหน้าที่พัก คืนนี้มีคนลงจากรถแล้วเดินตามท่านเข้าซอย',choices:[
 {text:'หันไปเผชิญหน้า',fight:{enemy:'street_thugs',mult:0.9},ok:{text:'ท่านจับเขาได้ เขาเป็นคนของกิลด์คู่แข่งที่ถูกจ้างมาข่มขู่',effects:[{reputation:3},{trait:{brave:6}}]},fail:{text:'มีคนอีกสามคนออกมาจากเงา ท่านหนีขึ้นหลังคาได้',effects:[{injury:1}]}},
 {text:'ล่อเข้ากล้องวงจรปิด',check:{stat:'int',dc:'mid'},ok:{text:'ตำรวจตามรอยรถตู้จนเจอผู้จ้างวาน',effects:[{stat:{int:2}},{karma:2}]},fail:{text:'กล้องเสียพอดี',effects:[]}},
 {text:'ย้ายที่พัก (400)',when:{money:{min:400}},lockText:'เงินไม่พอ',ok:{text:'รถตู้ไม่กลับมาอีก',effects:[{money:-400}]}}]}),
ev('red_gate_kids',111,{title:'เกตแดงกับเด็กนักเรียน',at:'gate_zone',when:{rank:{min:'D'}},once:true,weight:1,text:'รถทัศนศึกษาถูกดูดเข้าไปในเกตแดงที่เพิ่งเปิดกลางถนน ข้างในมีนักเรียนสามสิบคน ทีมกู้ภัยต้องใช้เวลาอีกสองชั่วโมง',choices:[
 {text:'เข้าไปทันที',fight:{enemy:'gate_boss',mult:1.5},ok:{text:'ท่านพาเด็กออกมาได้ทั้งสามสิบคน ภาพนั้นขึ้นปกหนังสือพิมพ์ทุกฉบับ',effects:[{reputation:20},{karma:15},{exp:240},{flag:'title_red'},{flag:'title_hero'}]},fail:{text:'ท่านพาเด็กออกมาได้ยี่สิบคนก่อนหมดแรง',effects:[{reputation:8},{karma:8},{injury:2}]}},
 {text:'เปิดทางให้ทีมอื่นตามเข้ามา',check:{stat:'int',dc:'hard'},ok:{text:'ท่านปักหมุดเส้นทางในเกตให้ทีมกู้ภัย ทุกคนรอด',effects:[{reputation:8},{karma:8}]},fail:{text:'หมุดหายไปกับหมอกแดง',effects:[]}},
 {text:'รอทีมกู้ภัย',ok:{text:'สองชั่วโมงต่อมา มีเด็กออกมาไม่ครบ',effects:[{karma:-3}]}}]}),
ev('artificial_gate',115,{title:'การทดลองเปิดเกตเทียม',at:'association',when:{all:[{rank:{min:'E'}},{stat:{int:{min:30}}}]},once:true,text:'ห้องวิจัยอยากลองเปิดเกตขนาดเล็กด้วยแกนอสูรห้าสิบก้อน ต้องมีฮันเตอร์ยืนเฝ้าเผื่อมีอะไรหลุดออกมา',choices:[
 {text:'อาสาเฝ้าหน้าเกต',fight:{enemy:'gate_threat'},ok:{text:'เกตเทียมเปิดได้สามวินาที มีสไลม์หลุดออกมาตัวเดียว ท่านจัดการได้',effects:[{stat:{int:2}},{reputation:3}]},fail:{text:'อสูรตัวที่หลุดมาแรงกว่าที่คิด ห้องแล็บพังครึ่งห้อง',effects:[{stat:{int:1}}]}},
 {text:'คำนวณใหม่ก่อนเปิด',check:{stat:'int',dc:'hard'},ok:{text:'ท่านเจอจุดผิดพลาดที่อาจทำให้หอทั้งหอหายไป',effects:[{stat:{int:4}},{reputation:4}]},fail:{text:'ตัวเลขดูถูกต้องทุกตัว',effects:[{stat:{int:1}}]}},
 {text:'คัดค้านการทดลอง',check:{stat:'cha',dc:'mid'},ok:{text:'การทดลองถูกเลื่อนไปไม่มีกำหนด',effects:[{karma:2}]},fail:{text:'ท่านถูกย้ายไปทำงานเอกสาร',effects:[]}}]}),
ev('livestream',119,{title:'ไลฟ์สดในเกต',when:{rank:{min:'E'}},cooldown:18,text:'สตรีมเมอร์ชื่อดังจ้างท่านเป็นบอดี้การ์ดระหว่างไลฟ์สดในเกตแรงก์ต่ำ คนดูห้าแสนคน',choices:[
 {text:'คุ้มกันอย่างจริงจัง',fight:{enemy:'gate_threat',mult:0.7},ok:{text:'ไลฟ์จบสวย ยอดผู้ติดตามท่านเพิ่มขึ้นมาก',effects:[{reputation:6},{money:600}]},fail:{text:'สตรีมเมอร์ล้มกลางไลฟ์ คลิปกลายเป็นมีม',effects:[{reputation:2},{money:300}]}},
 {text:'โชว์ท่าเท่ ๆ ให้คนดู',check:{stat:'cha',dc:'mid'},ok:{text:'คลิปท่านถูกตัดไปลงทุกแพลตฟอร์ม',effects:[{reputation:10},{stat:{cha:2}}]},fail:{text:'ท่านพลาดท่าตกบ่อน้ำต่อหน้าคนห้าแสน',effects:[{reputation:-2}]}},
 {text:'ปฏิเสธงาน',ok:{text:'ท่านไม่ชอบความวุ่นวาย',effects:[]}}]}),
ev('chicken_rice',131,{title:'ร้านเปิดใหม่ของฮันเตอร์เกษียณ',at:'city',when:{all:[hunter,{npcAlive:'chef_retired'}]},once:true,who:{npc:'chef_retired'},text:'{who} ฮันเตอร์ขาพิการเปิดร้านข้าวมันไก่หน้าสมาคม ลูกค้าน้อยมากเพราะคนกลัวรอยแผลบนหน้าเขา',choices:[
 {text:'ชวนทีมมากินทุกวัน',ok:{text:'ไม่นานร้านก็มีคิวยาวทุกเที่ยง',effects:[{karma:5},{reputation:2},{rel:{npc:'$who',n:15}}]}},
 {text:'โพสต์รีวิวลงโซเชียล',check:{stat:'cha',dc:'mid'},ok:{text:'รีวิวไวรัล ร้านขายหมดก่อนบ่ายทุกวัน',effects:[{karma:4},{stat:{cha:1}},{rel:{npc:'$who',n:10}}]},fail:{text:'มีคนเข้ามาด่าว่าท่านรับเงินรีวิว',effects:[]}},
 {text:'กินแล้วกลับ',ok:{text:'ข้าวมันไก่อร่อยมาก',effects:[{hp:20}]}}]}),
ev('overtrain',135,{title:'ฝึกจนเกินขีด',at:'gym',when:{rank:{min:'E'}},cooldown:12,weight:3,text:'ท่านรู้สึกว่าพลังติดอยู่ที่เดิมหลายเดือน มีตำราเก่าบอกว่าการฝึกจนเกือบตายจะทะลุขีดจำกัดได้',choices:[
 {text:'ฝึกจนเกือบตาย',check:{stat:'vit',dc:'hard',trait:'dili'},ok:{text:'ร่างกายแตกสลายแล้วประกอบใหม่ ท่านรู้สึกแข็งแกร่งขึ้นชัดเจน',effects:[{classStat:5},{stat:{vit:3}}]},fail:{text:'ท่านสลบกลางลานฝึก ตื่นมาในโรงพยาบาล',effects:[{hpPct:-0.5},{injury:2}]}},
 {text:'หาคู่ซ้อมที่เก่งกว่า',fight:{enemy:'sparring_rival',mult:1.2},ok:{text:'ท่านเห็นจุดบกพร่องของตัวเองชัดเจน',effects:[{classStat:3},{exp:80}]},fail:{text:'ท่านแพ้ทุกยก แต่ได้เรียนรู้',effects:[{classStat:1}]}},
 {text:'พักผ่อนเต็มที่สักเดือน',ok:{text:'ร่างกายสดชื่น',effects:[{hp:999},{trait:{dili:-3}}]}}]}),
ev('guild_poach',139,{title:'กิลด์ใหญ่ซื้อตัว',at:'association',when:{any:[{worldFlag:'guild_ironfang'},{worldFlag:'guild_northstar'}]},once:true,text:'กิลด์มังกรเงินเสนอเงินเซ็นสัญญาสองเท่าให้ย้ายจากกิลด์เดิม แต่ต้องเอาข้อมูลเกตของกิลด์เก่าไปด้วย',choices:[
 {text:'ย้ายพร้อมข้อมูล',ok:{text:'ท่านรวยขึ้นทันที แต่คนในกิลด์เก่าเลิกพูดกับท่าน',effects:[{money:4000},{karma:-8},{trait:{loyal:-15}},{worldUnflag:'guild_ironfang'},{worldUnflag:'guild_northstar'},{worldFlag:'guild_silverdragon'}]}},
 {text:'ย้ายแต่ไม่เอาข้อมูล',check:{stat:'cha',dc:'hard'},ok:{text:'กิลด์ใหม่ยอมรับเงื่อนไข',effects:[{money:2000},{worldUnflag:'guild_ironfang'},{worldUnflag:'guild_northstar'},{worldFlag:'guild_silverdragon'}]},fail:{text:'ข้อเสนอถูกถอน',effects:[]}},
 {text:'อยู่กิลด์เดิม',ok:{text:'หัวหน้ากิลด์รู้เรื่องนี้ แล้วขึ้นเงินเดือนให้',effects:[{money:500},{trait:{loyal:8}}]}}]}),
ev('monster_cub',143,{title:'สัตว์อสูรตัวน้อย',at:'gate_zone',when:{rank:{min:'E'}},once:true,text:'หลังล้มบอส ท่านเจอลูกสัตว์อสูรตัวเล็กซุกอยู่ใต้ร่างแม่ของมัน มันส่งเสียงขู่แต่ขาสั่น',choices:[
 {text:'พามันกลับไปเลี้ยง',check:{stat:'cha',dc:'hard',trait:'kind'},ok:{text:'มันกัดมือท่านหนึ่งครั้ง แล้วเลียแผลนั้น',effects:[{stat:{luk:2,str:2}},{flag:'pet_silverfang'}]},fail:{text:'มันวิ่งหายเข้าไปในความมืด',effects:[]}},
 {text:'ส่งให้ห้องวิจัย',ok:{text:'ห้องวิจัยจ่ายเงินให้ก้อนหนึ่ง',effects:[{money:200}]}},
 {text:'จบชีวิตมันอย่างไม่ทรมาน',ok:{text:'ท่านเก็บแกนเล็ก ๆ ของมันไว้ในกระเป๋า',effects:[{exp:30},{trait:{kind:-5}}]}}]}),
ev('classmate_funeral',147,{title:'งานศพของเพื่อนร่วมรุ่น',when:{rank:{min:'E'}},once:true,text:'เพื่อนร่วมรุ่นที่ตื่นพลังวันเดียวกับท่านเสียชีวิตในเกตแรงก์ C ที่งานศพ แม่ของเขาถามท่านว่า "ลูกฉันกลัวไหมตอนนั้น"',choices:[
 {text:'บอกว่าเขากล้าหาญจนวินาทีสุดท้าย',ok:{text:'แม่ของเขากอดท่านแล้วร้องไห้',effects:[{karma:3},{stat:{cha:1}}]}},
 {text:'บอกความจริงว่าไม่รู้',ok:{text:'แม่ของเขาพยักหน้าเงียบ ๆ',effects:[{trait:{loyal:4}}]}},
 {text:'ไปสืบว่าเกิดอะไรขึ้นในเกต',check:{stat:'int',dc:'hard'},ok:{text:'ท่านพบว่าหัวหน้าทีมทิ้งเขาไว้ แล้วนำหลักฐานส่งสมาคม',effects:[{karma:8},{reputation:4},{trait:{brave:5}}]},fail:{text:'ทุกคนในทีมให้การตรงกันว่าเป็นอุบัติเหตุ',effects:[]}}]}),
ev('old_flame',155,{title:'คนเก่าในวันฝนตก',at:'city',when:{rank:{min:'E'}},once:true,who:{tag:'crush'},text:'{who}ยืนหลบฝนใต้ป้ายรถเมล์เดิมเหมือนสมัยเรียน ตอนนี้เป็นพยาบาลที่โรงพยาบาลฮันเตอร์ ยิ้มแล้วถามว่า "ยังจำซองสีฟ้าได้ไหม"',choices:[
 {text:'ชวนไปกินข้าว',check:{stat:'cha',dc:'mid'},ok:{text:'คืนนั้นทั้งคู่คุยกันจนร้านปิด "ไม่คิดว่าจะได้เจอกันอีก"',effects:[{relx:{npc:'$who',aff:20,romance:1}},{stat:{cha:2}},{npcJob:{npc:'$who',job:'hospital_aide'}}]},fail:{text:'วันนี้มีเวรกลางคืน',effects:[{rel:{npc:'$who',n:5}}]}},
 {text:'ยื่นร่มให้แล้วเดินตากฝนกลับ',ok:{text:'สัปดาห์ต่อมาร่มถูกส่งคืนพร้อมโน้ตและเบอร์โทร',effects:[{relx:{npc:'$who',aff:12,romance:0.5}},{karma:2}]}},
 {text:'ทำเป็นจำไม่ได้',ok:{text:'ยิ้มเศร้า ๆ แล้วก้าวขึ้นรถเมล์',effects:[{rel:{npc:'$who',n:-10}}]}}]}),
ev('body_age',159,{title:'ร่างกายเริ่มบอกอายุ',at:'hospital',when:{all:[{awakened:true},{age:{min:30}}]},once:true,trigger:'enter',text:'หมอบอกว่ามานาในร่างกายท่านเริ่มกัดกร่อนข้อต่อ ถ้ายังลงเกตหนักแบบนี้อีกสิบปีอาจเดินไม่ได้',choices:[
 {text:'ลดงานลงครึ่งหนึ่ง',ok:{text:'ร่างกายดีขึ้น แต่รายได้ก็ลดลง',effects:[{stat:{vit:3}},{trait:{dili:-3}},{lifespan:3}]}},
 {text:'ซื้อยาฟื้นฟูราคาแพง (3000)',when:{money:{min:3000}},lockText:'เงินไม่พอ',ok:{text:'ข้อต่อกลับมาแข็งแรงเหมือนอายุยี่สิบ',effects:[{money:-3000},{stat:{vit:5}},{lifespan:5}]}},
 {text:'ไม่สนใจคำเตือน',ok:{text:'ท่านลงเกตต่อตามปกติ',effects:[{classStat:1},{lifespan:-2}]}}]}),
ev('disciple',163,{title:'ศิษย์คนแรก',when:{all:[{rank:{min:'D'}},{age:{min:35}}]},once:true,text:'เด็กหนุ่มที่เพิ่งตื่นพลังแรงก์ E มานั่งรอหน้าที่พักท่านทุกวันเป็นเดือน ขอให้รับเป็นศิษย์',choices:[
 {text:'รับเป็นศิษย์',ok:{text:'{who}ร้องไห้ดีใจ แล้วกวาดลานฝึกให้ทุกเช้า',effects:[{meet:{role:'ศิษย์',tags:['disciple'],age:18,occupation:'npc_hunter',aff:60}},{reputation:3},{stat:{cha:2}}]}},
 {text:'ให้ทดสอบก่อน',check:{stat:'int',dc:'mid'},ok:{text:'ท่านเห็นแววในตัวเด็กคนนี้ แล้วฝากไปเรียนกับอาจารย์ที่ดีกว่า',effects:[{karma:3}]},fail:{text:'เด็กสอบไม่ผ่าน แต่ยังมานั่งรอทุกวัน',effects:[]}},
 {text:'ไล่กลับไป',ok:{text:'เด็กไม่มาอีก',effects:[{trait:{kind:-3}}]}}]}),
// ---------- เรื่องต่อเนื่อง (QUESTS ใน events2.js:193-206) ----------
{id:'e2_bf_promise',title:'คำสัญญาใต้ต้นมะม่วง',trigger:'auto',priority:40,once:true,src:'events2.js:193,205 (เดิมนัดไว้ 30-34 เดือนหลังเริ่มเกม)',when:{all:[{age:{min:17.6}},{npcAlive:'best_friend'}]},who:{npc:'best_friend'},
 text:'วันปัจฉิมนิเทศ {who}ลากท่านไปใต้ต้นมะม่วงหลังโรงเรียน "ไม่ว่าใครตื่นพลังหรือไม่ เราจะยังเป็นทีมเดียวกันนะ"',choices:[
 {text:'สัญญา',ok:{text:'ทั้งคู่สลักชื่อไว้บนเปลือกต้นมะม่วง "สัญญาแล้วนะ!"',effects:[{rel:{npc:'$who',n:15}},{trait:{loyal:8}},{flag:'promise_bf'},{remember:{npc:'$who',t:'สัญญาใต้ต้นมะม่วง',tag:'promise'}}]}},
 {text:'บอกว่าอนาคตไม่แน่นอน',ok:{text:'{who}หัวเราะแห้ง ๆ "อือ...จริงของแก"',effects:[{rel:{npc:'$who',n:-5}}]}},
 {text:'ล้อว่าพูดเหมือนพระเอกละคร',check:{stat:'cha',dc:'easy'},ok:{text:'ทั้งคู่หัวเราะจนน้ำตาไหล',effects:[{rel:{npc:'$who',n:8}}]},fail:{text:'เพื่อนงอนไปทั้งวัน',effects:[{rel:{npc:'$who',n:-3}}]}}]},
{id:'e2_bf_promise2_hunter',title:'ทวงคำสัญญา',trigger:'enter',at:'association',priority:30,once:true,src:'events2.js:197 (กรณีเพื่อนเป็นฮันเตอร์)',when:{all:[{flag:'promise_bf'},{rank:{min:'D'}},{npcFlag:{npc:'best_friend',flag:'hunter'}},{notDone:'e2_bf_promise2_maker'}]},who:{npc:'best_friend'},
 text:'{who}เป็นฮันเตอร์แล้ว เดินเข้ามาในสมาคมพร้อมเปลือกไม้ที่สลักชื่อสองคน "ทีมเดียวกันนะ"',choices:[
 {text:'รักษาคำสัญญา',ok:{text:'{who}เข้าทีมของท่าน "รู้อยู่แล้วว่าแกไม่ลืม"',effects:[{rel:{npc:'$who',n:25}},{karma:4},{npcFlag:{npc:'$who',flag:'party'}}]}},
 {text:'บอกว่าทีมเต็มแล้ว',ok:{text:'{who}ยิ้ม แล้ววางเปลือกไม้ไว้บนโต๊ะก่อนเดินออกไป "...โอเค"',effects:[{rel:{npc:'$who',n:-30}},{trait:{loyal:-15}}]}}]},
{id:'e2_bf_promise2_maker',title:'ทวงคำสัญญา',trigger:'enter',at:'association',priority:30,once:true,src:'events2.js:197 (กรณีเพื่อนไม่ได้ตื่นพลัง)',when:{all:[{flag:'promise_bf'},{rank:{min:'D'}},{npcFlag:{npc:'best_friend',flag:'hunter',is:false}},{notDone:'e2_bf_promise2_hunter'}]},who:{npc:'best_friend'},
 text:'{who}ไม่ได้ตื่นพลัง แต่เรียนจบด้านวิศวกรรมอุปกรณ์ฮันเตอร์ แล้วเดินมาหาพร้อมเปลือกไม้ที่สลักชื่อสองคน "ข้าเป็นฮันเตอร์ไม่ได้ แต่สร้างอาวุธให้แกได้"',choices:[
 {text:'รักษาคำสัญญา',ok:{text:'{who}ตีอาวุธเล่มใหม่ให้ท่านโดยไม่คิดเงิน "รู้อยู่แล้วว่าแกไม่ลืม"',effects:[{rel:{npc:'$who',n:25}},{karma:4},{item:{id:'crystal_blade_c'}}]}},
 {text:'บอกว่าไม่ต้องหรอก',ok:{text:'{who}ยิ้ม แล้ววางเปลือกไม้ไว้บนโต๊ะก่อนเดินออกไป',effects:[{rel:{npc:'$who',n:-30}},{trait:{loyal:-15}}]}}]},
{id:'e2_oldman_coin',title:'เหรียญทองแดงของชายชรา',trigger:'month',weight:2,once:true,src:'events2.js:201,206',when:{all:[{flag:'coin_old'},{rank:{min:'E'}}]},
 text:'เหรียญทองแดงที่ชายชรามือเหล็กให้ไว้เริ่มร้อนในกระเป๋า แล้วชี้ทางไปยังตรอกเล็กที่ท่านไม่เคยเห็นมาก่อน',choices:[
 {text:'ตามเหรียญไป',check:{stat:'luk',dc:'mid'},ok:{text:'ปลายตรอกคือร้านซ่อมแขนกลของชายชรา เขายิ้มแล้วมอบเกราะที่เขาเคยใช้ให้ท่าน',effects:[{stat:{str:4,vit:4}},{item:{id:'light_armor_d'}}]},fail:{text:'ตรอกพาไปทางตัน เหรียญเย็นลง',effects:[{stat:{luk:1}}]}},
 {text:'เก็บเหรียญไว้',ok:{text:'เหรียญเย็นลงเหมือนผิดหวัง',effects:[]}}]},
]);
// ---------- เรื่องสั้นบรรทัดเดียว (PASSIVE ใน events2.js:168-189) ----------
const pv=(id,line,text,effects,when)=>({id:'e2p_'+id,title:'',trigger:'passive',cooldown:24,src:'events2.js:'+line,when,text,choices:[{text:'',ok:{text,effects}}]});
H.events=H.events.concat([
 pv('quiz_full',169,'สอบย่อยได้คะแนนเต็ม ครูเอากระดาษไปติดบอร์ด',[{stat:{int:1}}],school),
 pv('movie',170,'ไปดูหนังฮันเตอร์กับเพื่อน ฉากต่อสู้ไม่สมจริงเลย',[{stat:{cha:1}}],school),
 pv('neighbor',171,'ช่วยยายข้างบ้านแบกข้าวสารขึ้นบันได',[{stat:{str:1}},{karma:1}],school),
 pv('train_view',172,'นั่งรถไฟฟ้าผ่านเขตกั้นเกต เห็นแสงสีฟ้าเรืองอยู่ไกล ๆ',[{stat:{luk:1}}],school),
 pv('sib_snack',173,'{who}แอบเอาขนมของท่านไปกิน',[{rel:{npc:'$who',n:-1}}],school),
 pv('late',174,'ตื่นสายจนวิ่งไปโรงเรียน ทันเข้าแถวพอดี',[{stat:{agi:1}}],school),
 pv('comic',175,'อ่านการ์ตูนฮันเตอร์ทั้งเล่มในคืนเดียว',[{trait:{dili:-1}}],school),
 pv('sports_day',176,'งานกีฬาสี ท่านได้เหรียญทองแดงวิ่งผลัด',[{stat:{agi:1}},{reputation:1}],school),
 pv('blackout',177,'ไฟดับทั้งเมืองเพราะเกตรบกวนสายไฟ ทั้งบ้านจุดเทียนกินข้าวด้วยกัน',[{stat:{vit:1}}],school),
 pv('guidance',178,'ครูแนะแนวถามว่าถ้าไม่ตื่นพลังจะเรียนต่ออะไร ท่านตอบไม่ได้',[{stat:{int:1}}],school),
 pv('fan_art',179,'ได้อีเมลจากแฟนคลับที่วาดรูปท่านส่งมา',[{stat:{cha:1}}],hunter),
 pv('repair',180,'อาวุธบิ่นจากเกตครั้งก่อน ต้องส่งซ่อม',[{money:-120}],{all:[hunter,{money:{min:120}}]}),
 pv('dream_class',181,'ฝันว่ากลับไปนั่งในห้องเรียนเก่า ทุกคนยังอยู่ครบ',[{hp:10}],hunter),
 pv('scarf',182,'สมาคมส่งของขวัญปีใหม่มาให้ เป็นผ้าพันคอลายโลโก้สมาคม',[],{worldFlag:'registered'}),
 pv('mom_call',183,'โทรหา{who} (แม่) แม่บ่นเรื่องข้าวราคาแพงอยู่ครึ่งชั่วโมง',[{rel:{npc:'$who',n:2}}],{all:[hunter,{familyRole:{role:'mother',alive:true}}]}),
 pv('sale',184,'ร้านขายอุปกรณ์ลดราคาครึ่งหนึ่ง ท่านซื้อยาสามัญเก็บไว้เต็มกระเป๋า',[{hp:20}],hunter),
 pv('old_school',185,'เดินผ่านโรงเรียนเก่า ภารโรงคนเดิมยังจำหน้าท่านได้',[{stat:{cha:1}}],hunter),
 pv('photo',186,'ฮันเตอร์รุ่นน้องขอถ่ายรูปคู่',[{reputation:1}],hunter),
 pv('gate_hum',187,'นอนไม่หลับเพราะได้ยินเสียงเกตสั่นในหัว',[{hp:-8}],hunter),
 pv('savings',188,'เก็บเงินได้ก้อนหนึ่ง ฝากธนาคารไว้',[{stat:{luk:1}}],hunter),
 pv('rain',189,'ฝนตกทั้งวัน ท่านนั่งดูสายฝนจากหน้าต่าง',[{stat:{vit:1}}]),
 pv('kittens',190,'แมวจรคลอดลูกสามตัวใต้บันไดที่พัก',[{karma:1}]),
]);
const sib=H.events.find(e=>e.id==='e2p_sib_snack');sib.who={role:'sibling'};
const mom=H.events.find(e=>e.id==='e2p_mom_call');mom.who={role:'mother'};
})(globalThis.AW);
