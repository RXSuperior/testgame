// Hunter World: คน ตาราง งาน ที่พัก ภูมิหลังครอบครัว (Phase 4) ข้อมูลล้วน
// ฮาจุนเป็น NPC ธรรมดาในระบบ ไม่มีโค้ดพิเศษ · flagChance.hunter = โอกาสตื่นพลัง (คงที่ตาม seed เกม)
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
H.schedules=[
 {id:'student',entries:[{slot:'morning',days:'work',at:'school'},{slot:'day',days:'work',at:'school'},{slot:'evening',at:'city',chance:0.4},{slot:'evening',at:'home'},{slot:'morning',days:'off',at:'home'},{slot:'day',days:'off',at:'city'},{slot:'night',at:'home'}],src:'new'},
 {id:'worker',entries:[{slot:'morning',days:'work',at:'work'},{slot:'day',days:'work',at:'work'},{slot:'evening',at:'city',chance:0.3},{slot:'evening',at:'home'},{slot:'morning',days:'off',at:'home'},{slot:'day',days:'off',at:'city',chance:0.5},{slot:'night',at:'home'}],src:'new'},
 {id:'shift',entries:[{slot:'day',at:'work'},{slot:'evening',at:'work'},{slot:'morning',at:'home'},{slot:'night',at:'home'}],src:'new'},
 {id:'hunter_npc',entries:[{slot:'morning',at:'association'},{slot:'day',at:'gate_zone',chance:0.5},{slot:'day',at:'association'},{slot:'evening',at:'city',chance:0.5},{slot:'evening',at:'home'},{slot:'night',at:'home'}],src:'new'},
 {id:'homebody',entries:[{slot:'morning',at:'home'},{slot:'day',at:'home'},{slot:'evening',at:'home'},{slot:'night',at:'home'}],src:'new'}];
// งาน: npcOnly = อาชีพของ NPC ที่ผู้เล่นสมัครไม่ได้ · monthly = ผลรายเดือนจากงาน (การเติบโตแบบ PATHS เดิม)
H.jobs=[
 {id:'conv_store',name:'พนักงานร้านสะดวกซื้อ',at:'city',salary:60,ap:1,status:5,schedule:'shift',when:{age:{min:15}},monthly:[{stat:{agi:1}}],src:'logic4.js:15,201 (ทำงานพิเศษ/กะดึกร้านสะดวกซื้อ)'},
 {id:'ramen',name:'ลูกจ้างร้านราเมงหน้าสถานี',at:'city',salary:70,ap:1,status:5,schedule:'shift',when:{age:{min:15}},src:'events2.js:21'},
 {id:'gym_assist',name:'ผู้ช่วยครูฝึก',at:'gym',salary:90,ap:1,status:10,schedule:'worker',when:{stat:{str:{min:20}}},monthly:[{stat:{str:1}}],src:'new'},
 {id:'hospital_aide',name:'ผู้ช่วยพยาบาล',at:'hospital',salary:100,ap:1,status:15,schedule:'worker',when:{age:{min:18}},monthly:[{stat:{vit:1}}],src:'new'},
 {id:'office',name:'พนักงานบริษัท',at:'city',salary:180,ap:2,status:30,schedule:'worker',when:{all:[{age:{min:18}},{stat:{int:{min:25}}}]},src:'new'},
 {id:'assoc_clerk',name:'เจ้าหน้าที่สมาคม',at:'association',salary:140,ap:1,status:30,schedule:'worker',when:{all:[{age:{min:18}},{stat:{int:{min:30}}}]},src:'new'},
 {id:'guild_contract',name:'ฮันเตอร์สัญญากิลด์',at:'association',salary:300,ap:1,status:45,schedule:'hunter_npc',when:{all:[{rank:{min:'D'}},{any:[{worldFlag:'guild_ironfang'},{worldFlag:'guild_northstar'},{worldFlag:'guild_silverdragon'}]}]},monthly:[{exp:40}],src:'new'},
 {id:'teacher',name:'ครู',at:'school',salary:150,npcOnly:true,status:30,schedule:'worker',src:'new'},
 {id:'shopkeeper',name:'เจ้าของร้าน',at:'market',salary:200,npcOnly:true,status:25,schedule:'worker',src:'new'},
 {id:'doctor',name:'หมอฮันเตอร์',at:'hospital',salary:400,npcOnly:true,status:60,schedule:'worker',src:'new'},
 {id:'trainer',name:'ครูฝึก',at:'gym',salary:200,npcOnly:true,status:20,schedule:'worker',src:'new'},
 {id:'npc_hunter',name:'ฮันเตอร์',at:'association',salary:250,npcOnly:true,status:40,schedule:'hunter_npc',src:'new'},
 {id:'student',name:'นักเรียน',at:'school',salary:0,npcOnly:true,status:0,schedule:'student',src:'new'}];
// ที่พัก: agent = ที่ที่ไปติดต่อ · family = บ้านครอบครัว (ไม่เสียค่าใช้จ่าย) · shelter = ที่พักพิงเมื่อไม่มีที่ไป
H.housing=[
 {id:'family_home',name:'บ้านพ่อแม่',loc:'home',family:true,comfort:5,src:'logic4.js:20'},
 {id:'shelter',name:'ห้องพักพิงของเขต',loc:'home',shelter:true,comfort:0,src:'new'},
 {id:'one_room',name:'ห้องเช่าเล็กย่านเก่า',loc:'home',agent:'city',rent:60,comfort:5,when:{age:{min:18}},src:'new'},
 {id:'apartment',name:'อพาร์ตเมนต์ใกล้สถานี',loc:'home',agent:'city',rent:150,comfort:15,when:{age:{min:18}},src:'new'},
 {id:'hunter_dorm',name:'หอพักฮันเตอร์ของสมาคม',loc:'home',agent:'association',rent:80,comfort:10,when:{worldFlag:'registered'},src:'new'},
 {id:'house',name:'บ้านเดี่ยวชานเมือง',loc:'home',agent:'city',price:20000,upkeep:40,comfort:35,when:{age:{min:20}},src:'new'}];
// ภูมิหลังครอบครัว จาก logic4.js:85-86 (เงินเริ่มต้นตามเดิม: ยากจน 40, พ่อค้า 600)
H.familyBackgrounds=[
 {id:'middle',name:'ครอบครัวชนชั้นกลาง',weight:4,motherJob:'teacher',src:'logic4.js:85'},
 {id:'poor',name:'ครอบครัวยากจน',weight:2,money:40,src:'logic4.js:85-86'},
 {id:'merchant',name:'ครอบครัวพ่อค้า',weight:2,money:600,fatherJob:'shopkeeper',src:'logic4.js:85-86'},
 {id:'retired_hunter',name:'ครอบครัวฮันเตอร์เกษียณ',weight:1,src:'logic4.js:85'}];
H.namePool={family:['คิม','อี','พัก','ชเว','จอง','คัง','โจ','ยุน','ฮัน','ซอ'],m:['มินจุน','ซอจุน','โดฮยอน','ฮยอนอู','จีโฮ','ยองฮุน','แทยัง','จุนโฮ'],f:['ซออา','ฮาอึน','จียู','มินซอ','ยูนา','ซูอา','ดาอึน','เยริน']};
H.npcs=[
 {id:'best_friend',name:'ฮาจุน',gender:'m',age:15,role:'เพื่อนสนิทตั้งแต่ ม.1',temper:'cheerful',traits:{brave:20,kind:30,loyal:40},home:'city',occupation:'student',schedule:'student',flagChance:{hunter:0.5},tags:['bf'],src:'new (แทนเพื่อนสนิทที่เกมเดิมสุ่มสร้าง logic4.js:89)'},
 {id:'clerk_yoon',name:'ยุนแชอา',gender:'f',age:26,role:'เจ้าหน้าที่สมาคม',temper:'honest',traits:{kind:20,dili:40},home:'city',occupation:'assoc_clerk',work:'association',src:'new'},
 {id:'master_kang',name:'ครูฝึกคัง',gender:'m',age:48,role:'ครูฝึกที่ศูนย์ฝึก',temper:'proud',traits:{brave:40,dili:50},home:'city',occupation:'trainer',work:'gym',tags:['retired_hunter'],src:'new'},
 {id:'teacher_park',name:'ครูพัก',gender:'f',age:41,role:'ครูวิทยาศาสตร์',temper:'kind',traits:{kind:40,dili:30},home:'city',occupation:'teacher',work:'school',src:'events2.js:9 (ครูวิทยาศาสตร์)'},
 {id:'ramen_owner',name:'ลุงโจ',gender:'m',age:55,role:'เจ้าของร้านราเมง',temper:'cheerful',home:'city',occupation:'shopkeeper',work:'city',src:'events2.js:21'},
 {id:'chef_retired',name:'แทซอก',gender:'m',age:44,role:'ฮันเตอร์เกษียณ เจ้าของร้านข้าวมันไก่',temper:'shy',traits:{kind:30,brave:30},home:'city',occupationName:'เจ้าของร้านข้าวมันไก่',work:'association',schedule:'worker',tags:['retired_hunter'],src:'events2.js:131'},
 {id:'rival_hunter',name:'คังมินซอก',gender:'m',age:19,role:'ฮันเตอร์รุ่นเดียวกัน',temper:'hothead',traits:{brave:50,kind:-30,loyal:-20},home:'city',occupation:'npc_hunter',rels:[{to:'best_friend',aff:-20}],src:'new (แทนคู่อริที่เกมเดิมสุ่มสร้าง logic4.js:192)'},
 {id:'doctor_seo',name:'หมอซอ',gender:'f',age:37,role:'หมอฮันเตอร์',temper:'cold',traits:{kind:20,dili:60},home:'city',occupation:'doctor',work:'hospital',src:'new'}];
})(globalThis.AW);
