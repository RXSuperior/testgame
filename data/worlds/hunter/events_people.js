// Hunter World: เหตุการณ์เรื่องคน ครอบครัว ความรัก ชีวิต งาน และ Gate (Phase 4) ข้อมูลล้วน
// ส่วนที่มีต้นแบบในเกมเดิมระบุ src ไว้ (life9.js kinDying/kinFuneral, rel12.js) ที่เหลือเป็นของใหม่
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
H.events=(H.events||[]).concat([
// ---------- ครอบครัวแก่ลงและจากไป (life9.js) ----------
{id:'kin_dying',title:'ผู้ใกล้ชิดใกล้สิ้นอายุขัย',trigger:'month',weight:4,oncePerWho:true,who:{role:'family',minAge:68},src:'life9.js:4-7 (kinDying)',
 text:'{who}ผมขาวโพลน ลุกเดินช้าลงทุกวัน ท่านรู้ในใจว่าเวลาที่เหลืออยู่ด้วยกันไม่มากแล้ว',choices:[
 {text:'อยู่ข้าง ๆ ทุกวันที่เหลือ',ok:{text:'ท่านพาไปดูทะเลสาบที่ชอบ เล่าเรื่องเก่า ๆ จนดึก "ขอบใจนะ ที่ยังจำได้"',effects:[{rel:{npc:'$who',n:15}},{trait:{kind:8}},{remember:{npc:'$who',t:'อยู่ข้าง ๆ ในวันท้าย ๆ',tag:'care'}}]}},
 {text:'จ่ายค่าดูแลพิเศษ (3000)',when:{money:{min:3000}},lockText:'เงินไม่พอ',ok:{text:'สีหน้าของเขาดีขึ้นในสามวัน',effects:[{money:-3000},{rel:{npc:'$who',n:10}}]}},
 {text:'ไปทำงานต่อ ส่งเงินกลับบ้านแทน (200)',when:{money:{min:200}},lockText:'เงินไม่พอ',ok:{text:'ท่านส่งเงินกลับบ้านทุกเดือน แต่ไม่ได้กลับไปเอง',effects:[{money:-200},{rel:{npc:'$who',n:-5}}]}}]},
{id:'kin_funeral',title:'งานศพของ{who}',trigger:'auto',priority:70,oncePerWho:true,who:{role:'family',died:{within:3}},src:'life9.js:8-11 (kinFuneral)',
 text:'{who}จากไปอย่างสงบ ญาติและเพื่อนบ้านมากันเต็มลาน',choices:[
 {text:'กล่าวคำอำลา',check:{stat:'cha',dc:'easy'},ok:{text:'ทุกคนร้องไห้ตามคำพูดของท่าน',effects:[{reputation:2},{trait:{kind:5}}]},fail:{text:'ท่านพูดได้แค่ประโยคเดียวแล้วเสียงก็หายไป',effects:[]}},
 {text:'เก็บของที่ระลึกไว้หนึ่งชิ้น',ok:{text:'ท่านได้ของเก่า ๆ ชิ้นหนึ่งมาพกติดตัว',effects:[{stat:{luk:2}}]}},
 {text:'กลับไปฝึกทันทีหลังงานจบ',ok:{text:'ท่านฝึกจนมือแตก เพราะไม่อยากคิดถึงอะไร',effects:[{stat:{str:2}},{trait:{kind:-5}}]}}]},
{id:'friend_funeral',title:'ลาก่อน {who}',trigger:'auto',priority:65,oncePerWho:true,who:{rel:['friend','close_friend','best_friend','romantic'],died:{within:3}},src:'new',
 text:'ข่าวว่า{who}จากไปมาถึงท่านในเช้าวันธรรมดา ที่งานศพมีรูปถ่ายที่ท่านเคยถ่ายให้วางอยู่ข้างโลง',choices:[
 {text:'ไปร่วมงานจนจบ',ok:{text:'ท่านอยู่จนคนสุดท้ายกลับ',effects:[{trait:{loyal:4}}]}},
 {text:'ส่งพวงหรีดไปแทน (100)',when:{money:{min:100}},lockText:'เงินไม่พอ',ok:{text:'ชื่อท่านอยู่บนพวงหรีดหน้างาน',effects:[{money:-100}]}}]},
// ---------- ความรักและครอบครัวใหม่ ----------
{id:'npc_confession',title:'{who}มีเรื่องอยากบอก',trigger:'month',weight:2,oncePerWho:true,when:{all:[{age:{min:18}},{married:false}]},who:{rel:['friend','close_friend','best_friend'],minAff:45,minAge:18},src:'rel12.js:111 (confess) กลับด้านให้ NPC เป็นฝ่ายเริ่ม',
 text:'{who}ชวนท่านเดินเล่นริมแม่น้ำ แล้วหยุดกลางสะพาน "ฉันชอบเธอมานานแล้ว"',choices:[
 {text:'ตอบรับ',ok:{text:'ทั้งคู่ยืนอยู่บนสะพานจนไฟถนนติด',effects:[{relx:{npc:'$who',aff:10,romance:1}}]}},
 {text:'ขอเวลาคิด',ok:{text:'{who}พยักหน้า "รอได้"',effects:[{relx:{npc:'$who',romance:0.5}}]}},
 {text:'ปฏิเสธอย่างสุภาพ',ok:{text:'{who}ยิ้มฝืน ๆ แล้วบอกว่าเป็นเพื่อนกันเหมือนเดิมนะ',effects:[{rel:{npc:'$who',n:-10}}]}}]},
{id:'child_news',title:'ข่าวดีในบ้าน',trigger:'month',weight:3,when:{all:[{canHaveChild:true},{chance:0.15}]},src:'rel12.js:91 (child) ย้ายเป็นเหตุการณ์ที่มีเงื่อนไข',
 text:'คู่ครองของท่านยื่นผลตรวจให้ดูพร้อมรอยยิ้ม อีกไม่กี่เดือนบ้านนี้จะมีสมาชิกเพิ่ม',choices:[
 {text:'กอดแน่น ๆ',ok:{text:'ท่านทาสีห้องเล็กเป็นสีฟ้าอ่อนในสัปดาห์นั้น',effects:[{haveChild:true},{trait:{kind:3}}]}}]},
{id:'child_growing',title:'',trigger:'passive',cooldown:12,when:{children:{min:1}},who:{role:'child'},src:'new',text:'{who}พูดคำแรกได้แล้ว คำนั้นคือชื่อของท่าน',choices:[{text:'',ok:{text:'{who}โตขึ้นทุกวัน',effects:[{rel:{npc:'$who',n:2}}]}}]},
// ---------- ชีวิตและงาน ----------
{id:'move_out',title:'ถึงเวลาออกจากบ้าน?',trigger:'month',weight:2,once:true,when:{all:[{age:{min:20}},{homeMode:'family'}]},src:'new',
 text:'เพื่อนรุ่นเดียวกันเริ่มย้ายออกไปอยู่เอง ห้องเช่าแถวสถานีมีป้ายว่างหลายห้อง',choices:[
 {text:'ไว้ไปดูที่นายหน้าในเมือง',ok:{text:'ท่านจดเบอร์นายหน้าไว้ (ย้ายได้ที่ย่านใจกลางเมือง)',effects:[]}},
 {text:'อยู่กับครอบครัวต่อ',ok:{text:'ค่าครองชีพไม่ต้องจ่าย แต่แม่เริ่มถามเรื่องแฟน',effects:[{trait:{loyal:2}}]}}]},
{id:'office_offer',title:'งานประจำที่มั่นคง',trigger:'month',weight:2,once:true,when:{all:[{age:{min:18}},{stat:{int:{min:25}}},{job:false}]},src:'new',
 text:'บริษัทประกันภัยข้างสถานีกำลังรับพนักงาน ไม่ต้องตื่นพลังก็สมัครได้ เงินเดือนมั่นคงแต่ต้องเข้างานเต็มเวลา',choices:[
 {text:'สมัครเลย',ok:{text:'ท่านได้งาน เริ่มเดือนนี้',effects:[{takeJob:'office'}]}},
 {text:'ยังไม่สนใจ',ok:{text:'ท่านเก็บใบประกาศไว้ในลิ้นชัก',effects:[]}}]},
{id:'bf_grad_hunter',title:'',trigger:'passive',once:true,when:{all:[{age:{min:18.2}},{npcFlag:{npc:'best_friend',flag:'hunter'}},{npcAlive:'best_friend'}]},who:{npc:'best_friend'},src:'events2.js:197 (เพื่อนตื่นพลัง)',
 text:'{who}ตื่นพลังแล้ว และลงทะเบียนเป็นฮันเตอร์',choices:[{text:'',ok:{text:'{who}ตื่นพลังแล้ว และลงทะเบียนเป็นฮันเตอร์',effects:[{npcJob:{npc:'$who',job:'npc_hunter'}}]}}]},
{id:'bf_grad_engineer',title:'',trigger:'passive',once:true,when:{all:[{age:{min:18.2}},{npcFlag:{npc:'best_friend',flag:'hunter',is:false}},{npcAlive:'best_friend'}]},who:{npc:'best_friend'},src:'events2.js:197 (เพื่อนไม่ได้ตื่นพลัง)',
 text:'{who}ไม่ได้ตื่นพลัง แต่สอบติดวิศวกรรมอุปกรณ์ฮันเตอร์',choices:[{text:'',ok:{text:'{who}ไม่ได้ตื่นพลัง แต่สอบติดวิศวกรรมอุปกรณ์ฮันเตอร์',effects:[{npcJob:{npc:'$who',job:'office'}}]}}]},
// ---------- คู่แข่ง ----------
{id:'rival_meet',title:'คนที่ไม่ชอบหน้าท่าน',trigger:'enter',at:'association',once:true,priority:20,when:{rank:{min:'E'}},who:{npc:'rival_hunter'},src:'new (แทนเหตุการณ์คู่อริ logic4.js:192, rel12 rival)',
 text:'{who}ฮันเตอร์รุ่นเดียวกันเดินชนไหล่ท่านกลางล็อบบี้ "แรงก์เท่านี้ก็กล้ามายืนหน้ากระดานงาน D เหรอ"',choices:[
 {text:'ท้าประลอง',fight:{enemy:'sparring_rival'},ok:{text:'{who}ล้มลงกลางวง คนมุงปรบมือ',effects:[{relx:{npc:'$who',aff:-20,resp:20}},{reputation:3}]},fail:{text:'{who}หัวเราะแล้วเดินจากไป',effects:[{relx:{npc:'$who',aff:-10,resp:-10}}]}},
 {text:'ไม่ตอบโต้',ok:{text:'ท่านเดินผ่านไปเหมือนไม่ได้ยิน',effects:[{relx:{npc:'$who',aff:-15}},{trait:{brave:-2,kind:2}}]}},
 {text:'ชวนไปกินข้าว',check:{stat:'cha',dc:'hard',trait:'kind'},ok:{text:'{who}งงไปครู่หนึ่ง แล้วตามไปจริง ๆ',effects:[{relx:{npc:'$who',aff:25,trust:10}}]},fail:{text:'"ไม่ว่าง"',effects:[{relx:{npc:'$who',aff:-25}}]}}]},
// ---------- กรรมส่งผลต่อผู้คน ----------
{id:'karma_good',title:'',trigger:'passive',cooldown:12,when:{karma:{min:40}},who:{here:true,maxAff:90},src:'new',text:'{who}ได้ยินเรื่องดี ๆ ที่ท่านทำ',choices:[{text:'',ok:{text:'{who}ได้ยินเรื่องดี ๆ ที่ท่านทำ แล้วยิ้มทักทายก่อน',effects:[{rel:{npc:'$who',n:3}}]}}]},
{id:'karma_bad',title:'',trigger:'passive',cooldown:12,when:{karma:{max:-40}},who:{here:true,minAff:-90},src:'new',text:'{who}เลี่ยงสายตาท่าน',choices:[{text:'',ok:{text:'{who}ได้ยินข่าวลือไม่ดีเรื่องท่าน แล้วเลี่ยงสายตา',effects:[{rel:{npc:'$who',n:-3}}]}}]},
// ---------- Gate ไปแดนอาร์เคน ----------
{id:'blue_rift_open',title:'รอยแยกสีน้ำเงิน',trigger:'enter',at:'gate_zone',once:true,priority:40,when:{gate:{id:'rift_fantasy',is:'known'}},src:'new',
 text:'ที่ขอบเขตกักกันมีรอยแยกสีน้ำเงินที่ไม่ได้อยู่ในรายชื่อเกตของสมาคม อีกฝั่งเป็นป่าที่ต้นไม้สูงเท่าตึก และได้ยินเสียงระฆังแบบที่ไม่มีในเมืองนี้',choices:[
 {text:'ใช้มานาเปิดรอยแยกให้คงที่',check:{stat:'int',dc:'mid'},ok:{text:'รอยแยกนิ่งลง ท่านรู้ว่าตอนนี้ข้ามไปกลับได้แล้ว',effects:[{gateOpen:'rift_fantasy'},{mana:2}]},fail:{text:'รอยแยกสั่นแล้วหดเล็กลง ต้องกลับมาลองใหม่',effects:[{hp:-15}]}},
 {text:'รายงานสมาคมให้ทีมวิจัยมาตรึงไว้ (300)',when:{money:{min:300}},lockText:'เงินไม่พอ',ok:{text:'ทีมวิจัยติดตั้งเสาตรึงมานา เปิดทางให้ท่านใช้เป็นคนแรก',effects:[{money:-300},{gateOpen:'rift_fantasy'},{rel:{npc:'clerk_yoon',n:3}}]}},
 {text:'ปล่อยไว้ก่อน',ok:{text:'ท่านจดพิกัดไว้แล้วเดินกลับ',effects:[]}}]},
{id:'blue_rift_retry',title:'รอยแยกสีน้ำเงิน (อีกครั้ง)',trigger:'action',at:'gate_zone',cost:{ap:1},when:{all:[{gate:{id:'rift_fantasy',is:'known'}},{done:'blue_rift_open'}]},src:'new',
 text:'รอยแยกสีน้ำเงินยังอยู่ที่เดิม',choices:[{text:'ลองตรึงรอยแยกอีกครั้ง',check:{stat:'int',dc:'mid'},ok:{text:'รอยแยกนิ่งลงแล้ว',effects:[{gateOpen:'rift_fantasy'}]},fail:{text:'ยังไม่สำเร็จ',effects:[]}}]},
{id:'deep_rift_research',title:'รอยแยกลึก',trigger:'enter',at:'association',once:true,priority:35,when:{gate:{id:'deep_rift_fantasy',is:'known'}},who:{npc:'clerk_yoon'},src:'new',
 text:'{who}กระซิบว่าทีมวิจัยพบรอยแยกที่ลึกกว่าเดิม ข้ามไปแล้วจะออกอีกฝั่งช้ากว่าปกติราวสามเดือน ทุกครั้งที่ใช้ต้องจ่ายหินมานาสามก้อนกับค่าตรึงทาง',choices:[
 {text:'ขอสิทธิ์ใช้ทาง',ok:{text:'ชื่อท่านอยู่ในรายชื่อผู้ใช้รอยแยกลึก',effects:[{gateOpen:'deep_rift_fantasy'}]}},
 {text:'ไม่สนใจ',ok:{text:'ท่านพยักหน้าแล้วเดินออกมา',effects:[]}}]},
]);
})(globalThis.AW);
