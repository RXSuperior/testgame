// Hunter World (Phase 5): ตลาดมืดและเส้นทางใต้ดิน + เหตุการณ์ที่เหลือจาก events2.js (ข้อมูลล้วน)
// หลักการ: ได้เงินมากกว่าทางปกติแต่ต้องแลกด้วย heat (การสอบสวน), กรรม, ความเสี่ยงถูกโกง/ถูกจับ และความสัมพันธ์กับสมาคม
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
H.locations.push({id:'black_market',name:'ตลาดมืดใต้สะพาน',desc:'แผงลอยหลังเที่ยงคืน ไม่ถามที่มา ไม่ออกใบเสร็จ',bg:'bg.industrial',when:{underAccess:true},src:'logic4.js:26 (บ่อนใต้ดิน) new'});
H.npcs.push({id:'broker_moon',name:'นายหน้ามุน',gender:'m',age:52,role:'ผู้ค้าใต้ดิน',temper:'sly',traits:{kind:-20,loyal:-30},home:'black_market',work:'black_market',occupationName:'นายหน้าตลาดมืด',schedule:'worker',src:'events2.js:75 (ชายชราในบ่อน) new'});
const um={underAccess:true};
H.events=(H.events||[]).concat([
 // ---- ทางเข้า ----
 {id:'ug_contact',title:'คนแปลกหน้าในซอย',trigger:'month',at:'city',once:true,weight:2,when:{all:[{rank:{min:'E'}},{underAccess:false}]},src:'new',
  text:'ชายใส่หมวกแก๊ปยื่นนามบัตรสีดำให้ "ถ้าอยากได้ของที่สมาคมไม่ขาย หรือขายของที่สมาคมไม่ซื้อ มาที่ใต้สะพานหลังเที่ยงคืน"',choices:[
  {text:'รับนามบัตรไว้',ok:{text:'นามบัตรไม่มีชื่อ มีแค่รูปวาดสะพาน',effects:[{underAccess:true},{underRep:2}]}},
  {text:'โยนทิ้ง',ok:{text:'ชายคนนั้นยักไหล่แล้วหายเข้าไปในซอย',effects:[{karma:1}]}},
  {text:'แจ้งสมาคม',ok:{text:'สมาคมขอบคุณ แต่บอกว่าตลาดมืดย้ายที่บ่อยจนจับไม่ได้',effects:[{reputation:1},{rel:{npc:'clerk_yoon',n:2}}]}}]},
 // ---- ตลาดมืดแกนอสูร (events2.js:75) มีผลตามมา ----
 {id:'e2_black_market',title:'ตลาดมืดแกนอสูร',trigger:'enter',at:'black_market',cooldown:6,priority:20,who:{npc:'broker_moon'},when:{all:[um,{item:{id:'monster_core'}}]},src:'events2.js:75 (ปรับผลให้มีความเสี่ยง)',
  text:'{who}รับซื้อแกนอสูรราคาสูงกว่าสมาคมสองเท่า ไม่ถามที่มา ไม่ออกใบเสร็จ',choices:[
  {text:'ขายแกนหนึ่งก้อน (300 แต่มีความเสี่ยง)',check:{stat:'luk',dc:'mid'},ok:{text:'เงินสดหนาปึกอยู่ในกระเป๋า',effects:[{item:{id:'monster_core',n:-1}},{money:300},{karma:-3},{underRep:3},{heat:10}]},fail:{text:'ธนบัตรครึ่งปึกเป็นของปลอม และมีคนแอบถ่ายรูปท่านไว้',effects:[{item:{id:'monster_core',n:-1}},{money:120},{heat:20},{caught:true}]}},
  {text:'ถามว่าเอาไปทำอะไร',check:{stat:'cha',dc:'hard'},ok:{text:'เขาบอกว่าแกนเหล่านี้ถูกส่งไปทำยาเพิ่มพลังเถื่อน ท่านจดชื่อผู้ซื้อไว้',effects:[{stat:{int:2}},{karma:2},{flag:'drug_lead'}]},fail:{text:'เขาบอกว่าคนที่ถามมากมักไม่ได้กลับบ้าน',effects:[{underRep:-2}]}},
  {text:'ขายให้สมาคมตามปกติแทน',ok:{text:'ได้เงินน้อยกว่าแต่นอนหลับสบาย',effects:[{item:{id:'monster_core',n:-1}},{money:150}]}}]},
 // ---- ยาเพิ่มพลังเถื่อน (events2.js:79) ----
 {id:'e2_drug_ring',title:'ยาเพิ่มพลังเถื่อน',trigger:'enter',at:'black_market',once:true,priority:30,when:{flag:'drug_lead'},src:'events2.js:79 (ปรับผลให้มีความเสี่ยง)',
  text:'ท่านตามรอยผู้ซื้อแกนอสูรมาถึงโกดังท้ายท่าเรือ ข้างในมีฮันเตอร์วัยรุ่นสิบกว่าคนนอนชักกระตุกอยู่บนเตียงพับ',choices:[
  {text:'บุกเข้าไปคนเดียว',fight:{enemy:'drug_gang'},ok:{text:'ท่านจับหัวหน้าแก๊งได้ เด็กทุกคนถูกส่งโรงพยาบาล',effects:[{reputation:10},{karma:10},{underRep:-15},{unflag:'drug_lead'}]},fail:{text:'ท่านถูกตีสลบ ตื่นมาอีกทีโกดังว่างเปล่า',effects:[{injury:2},{unflag:'drug_lead'}]}},
  {text:'แจ้งสมาคมพร้อมหลักฐาน',check:{stat:'int',dc:'mid'},ok:{text:'สมาคมบุกจับได้ทั้งเครือข่าย ชื่อท่านอยู่ในรายงาน',effects:[{reputation:5},{karma:6},{underRep:-10},{rel:{npc:'clerk_yoon',n:5}},{unflag:'drug_lead'}]},fail:{text:'หลักฐานไม่พอ แก๊งย้ายฐานไปก่อน',effects:[{unflag:'drug_lead'}]}},
  {text:'ขอส่วนแบ่ง',ok:{text:'หัวหน้าแก๊งยิ้มแล้วยื่นซองเงินให้ แต่ชื่อท่านเริ่มอยู่ในแฟ้มของทางการ',effects:[{money:800},{karma:-15},{underRep:10},{heat:40},{trait:{kind:-8}},{unflag:'drug_lead'},{flag:'drug_money'}]}}]},
 // ---- งานลอบสังหาร (events2.js:123) ปรับใหม่: เงินไม่สูงเกินจริง มีผลเสียหลายทาง ----
 {id:'e2_contract_kill',title:'งานลอบสังหาร',trigger:'enter',at:'black_market',once:true,priority:25,when:{all:[um,{rank:{min:'C'}},{underRep:{min:10}}]},src:'events2.js:123 (ปรับผลลัพธ์ใหม่ตามข้อกำหนด Phase 5)',
  text:'ชายใส่สูทยื่นรูปฮันเตอร์แรงก์ B คนหนึ่งให้ท่าน "เขาเห็นสิ่งที่ไม่ควรเห็น" เป้าหมายแข็งแกร่งกว่าท่าน และงานนี้ไม่มีทางทำได้โดยไม่มีใครรู้',choices:[
  {text:'รับงาน (อันตราย มีผลทางกฎหมาย)',fight:{enemy:'b_rank_hunter'},ok:{text:'ท่านทำงานจบ แต่ภายในสัปดาห์ทางการเริ่มสอบสวน และคนในสมาคมมองท่านไม่เหมือนเดิม',effects:[{money:1200},{karma:-30},{heat:60},{underRep:15},{reputation:-10},{rel:{npc:'clerk_yoon',n:-20}},{trait:{kind:-15}},{flag:'blood_contract'}]},fail:{text:'เป้าหมายแข็งแกร่งกว่าที่คิด ท่านหนีออกมาได้พร้อมแผล และเขาจำหน้าท่านได้',effects:[{injury:2},{karma:-10},{heat:30},{flag:'blood_contract_failed'}]}},
  {text:'เตือนเป้าหมายให้หนี',check:{stat:'agi',dc:'mid'},ok:{text:'เขาหายไปจากเมืองพร้อมครอบครัว ทิ้งโน้ตขอบคุณไว้',effects:[{karma:10},{underRep:-10},{heat:5}]},fail:{text:'คนของชายใส่สูทเห็นท่านไปพบเป้าหมาย',effects:[{karma:6},{hp:-30},{underRep:-15}]}},
  {text:'นำหลักฐานไปให้สมาคม',check:{stat:'int',dc:'hard'},ok:{text:'สมาคมเปิดการสอบสวน ชายใส่สูทหายตัวไป',effects:[{reputation:6},{karma:6},{underRep:-25},{underAccess:false}]},fail:{text:'หลักฐานไม่พอ และตลาดมืดรู้ว่าท่านเป็นคนแจ้ง',effects:[{underRep:-20}]}},
  {text:'ปฏิเสธ',ok:{text:'ชายใส่สูทยิ้ม "เสียดายจัง"',effects:[]}}]},
 // ---- การสอบสวน: ผลเสียจริงเมื่อ heat สูง ----
 {id:'ug_investigation',title:'เจ้าหน้าที่สอบสวนมาหา',trigger:'auto',priority:60,cooldown:12,when:{heat:{min:60}},src:'new',
  text:'เจ้าหน้าที่จากฝ่ายตรวจสอบของสมาคมมาพร้อมแฟ้มรูปถ่ายของท่านที่ใต้สะพาน',choices:[
  {text:'ยอมรับและจ่ายค่าปรับ (เงินครึ่งหนึ่งของที่ได้มา)',when:{money:{min:500}},lockText:'เงินไม่พอจ่ายค่าปรับ',ok:{text:'ท่านจ่ายค่าปรับและถูกพักใบอนุญาตหนึ่งเดือน',effects:[{money:-500},{reputation:-8},{heat:-40},{rel:{npc:'clerk_yoon',n:-8}}]}},
  {text:'ปฏิเสธทุกข้อกล่าวหา',check:{stat:'cha',dc:'hard'},ok:{text:'หลักฐานไม่พอ เจ้าหน้าที่จากไปพร้อมสายตาไม่เชื่อ',effects:[{heat:-15},{reputation:-2}]},fail:{text:'ท่านถูกกักตัวสอบสวนสองเดือน ชื่อเสียงเสียหายหนัก',effects:[{reputation:-15},{heat:-30},{injury:2},{rel:{npc:'clerk_yoon',n:-15}},{caught:true}]}},
  {text:'ให้ข้อมูลตลาดมืดแลกกับการยกเว้นโทษ',ok:{text:'ท่านรอดจากโทษ แต่ตลาดมืดรู้ว่าใครเป็นคนให้ข้อมูล',effects:[{heat:-50},{underRep:-30},{underAccess:false},{reputation:-3}]}}]},
 // ---- กิจกรรมที่ตลาดมืด ----
 {id:'ug_buy_charm',title:'ซื้อเครื่องรางตลาดมืด (900)',trigger:'action',at:'black_market',cost:{ap:0},when:{all:[um,{money:{min:900}},{underRep:{min:10}}]},src:'new',text:'เครื่องรางที่เพิ่มพลังได้จริง แต่ไม่มีใบรับรอง',
  choices:[{text:'ซื้อ',check:{stat:'luk',dc:'easy'},ok:{text:'ของจริง พลังไหลเข้าแขนทันที',effects:[{money:-900},{item:{id:'black_charm'}},{heat:8}]},fail:{text:'ของปลอม ท่านเสียเงินฟรี',effects:[{money:-900},{heat:3}]}}]},
 {id:'ug_buy_info',title:'ซื้อข่าว (200)',trigger:'action',at:'black_market',cost:{ap:0},when:{all:[um,{money:{min:200}},{notFlag:'info_subway'}]},src:'new',text:'นายหน้ากระซิบเรื่องสถานีรถไฟใต้ดินร้างที่สมาคมยังไม่รู้',
  choices:[{text:'ซื้อ',ok:{text:'นายหน้ากระซิบเรื่องสถานีรถไฟใต้ดินร้างที่สมาคมยังไม่รู้ (ทางเข้าอยู่ย่านใจกลางเมือง)',effects:[{money:-200},{flag:'info_subway'},{underRep:2},{heat:3}]}}]},
 // ---- ข้อความบนผนังหอคอย (events2.js:151) เมื่อผ่านชั้น 15 ----
 {id:'e2_tower_wall',title:'ข้อความบนผนังหอคอย',trigger:'enter',at:'tower',once:true,priority:20,when:{towerBest:{id:'city_tower',min:15}},src:'events2.js:151',
  text:'ที่ชั้นสิบห้า มีตัวอักษรสลักลึกบนผนัง เป็นภาษาไทยลายมือคน "ถ้าเจ้าอ่านได้ แปลว่าดวงดาวกำลังทดสอบเจ้า อย่ารับสัญญาแรกที่ยื่นมา"',choices:[
  {text:'สลักข้อความตอบ',ok:{text:'เดือนต่อมามีข้อความใหม่ปรากฏข้างใต้ว่า "ดี"',effects:[{stat:{luk:2}},{flag:'tower_wall_reply'}]}},
  {text:'ถ่ายรูปไปให้นักวิจัย',check:{stat:'int',dc:'mid'},ok:{text:'นักวิจัยบอกว่าข้อความนี้เก่ากว่าหอคอยเสียอีก',effects:[{stat:{int:3}}]},fail:{text:'ในรูปไม่มีตัวอักษรเลย',effects:[]}},
  {text:'ไม่สนใจ ปีนต่อ',ok:{text:'ท่านปีนต่อไปจนหมดแรง',effects:[{exp:150}]}}]},
 // ---- คนที่หน้าเหมือนท่าน (events2.js:127): ปริศนาที่ยังไม่มีคำตอบ ห้ามเฉลยจนกว่าจะออกแบบเนื้อเรื่อง Multiverse ----
 {id:'e2_twin_hook',title:'คนที่หน้าเหมือนท่าน',trigger:'month',once:true,weight:1,when:{rank:{min:'D'}},src:'events2.js:127 (unresolved story hook: ไม่มีคำเฉลยจนกว่าจะออกแบบเนื้อเรื่อง Multiverse)',
  text:'ในข่าวเช้า มีฮันเตอร์แรงก์ S จากต่างประเทศที่หน้าตาเหมือนท่านทุกอย่าง เขาประกาศว่ากำลังตามหา "อีกครึ่งหนึ่งของตัวเอง"',choices:[
  {text:'ติดต่อไปหาเขา',ok:{text:'อีเมลถูกส่งออกไป แต่ยังไม่มีคำตอบกลับมา',effects:[{flag:'twin_hook'},{flag:'twin_contacted'}]}},
  {text:'ถามพ่อแม่',ok:{text:'พ่อแม่มองหน้ากันนานเกินไป แล้วเปลี่ยนเรื่องคุย',effects:[{flag:'twin_hook'},{flag:'twin_asked_parents'}]}},
  {text:'ไม่สนใจ',ok:{text:'ท่านปิดทีวีแล้วไปทำงานตามปกติ',effects:[{flag:'twin_hook'}]}}]},
]);
})(globalThis.AW);
