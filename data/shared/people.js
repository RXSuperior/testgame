// ข้อมูลกลางเรื่องคน ใช้ได้ทุกโลก (ข้อมูลล้วน)
// tempers: นิสัยหลักของ NPC จากเกมเดิม rel12.js:2-7 (TEMPERS) ตัวคูณมีผลจริงกับการคุย ของขวัญ ความไว้ใจ ความนับถือ
// traits: แกนนิสัยของผู้เล่นและ NPC จาก logic4.js:10 (TRAITS) ค่า -100..100 (ลบ=ซ้าย บวก=ขวา)
// illnesses: โรคทั่วไป (ใหม่) severity 1-3 · deadly=อาจเสียชีวิตถ้าไม่รักษา
(function(AW){
AW.data.shared=AW.data.shared||{};
AW.data.shared.tempers=[
 {id:'kind',name:'ใจดี',desc:'ใจอ่อน ช่วยคนอื่นก่อนตัวเอง ชอบคนที่ทำดี',talk:1,karmaLike:1},
 {id:'proud',name:'หยิ่ง',desc:'ถือตัว นับถือคนที่เก่งกว่าเท่านั้น',talk:-1,resp:1,first:-5},
 {id:'greedy',name:'โลภ',desc:'ชอบของมีค่า ของขวัญได้ผลดีเป็นพิเศษ',gift:1.5,karmaLike:-0.5},
 {id:'honest',name:'ซื่อสัตย์',desc:'รักษาคำพูด ไว้ใจคนช้าแต่ไม่เปลี่ยนใจ',trust:1,karmaLike:0.5},
 {id:'sly',name:'เจ้าเล่ห์',desc:'พูดเก่ง แต่ไว้ใจยาก',trust:-1},
 {id:'cold',name:'เย็นชา',desc:'พูดน้อย เปิดใจยาก',talk:-1,first:-3},
 {id:'cheerful',name:'ร่าเริง',desc:'คุยสนุก สนิทเร็ว',talk:1,first:3},
 {id:'ambitious',name:'ทะเยอทะยาน',desc:'อยากก้าวหน้า ชอบคนที่มีอนาคต',resp:1},
 {id:'shy',name:'ขี้อาย',desc:'เขินง่าย คุยนาน ๆ จะค่อยเปิดใจ',first:-2},
 {id:'hothead',name:'ใจร้อน',desc:'โกรธง่ายหายเร็ว',first:-2,karmaLike:-0.5}];
// คู่ที่เข้ากันดี/ไม่ดี จาก rel12.js:8-9 (เปลี่ยนจากเลขลำดับเป็น id)
AW.data.shared.temperPairs={good:[['kind','shy'],['cheerful','shy'],['honest','kind'],['cheerful','cold'],['proud','sly'],['ambitious','honest'],['cheerful','cheerful'],['honest','honest'],['kind','kind']],
 bad:[['greedy','kind'],['hothead','shy'],['sly','honest'],['proud','proud'],['hothead','hothead'],['greedy','greedy']]};
AW.data.shared.traits=[
 {id:'brave',low:'ขี้ขลาด',high:'กล้าหาญ'},{id:'kind',low:'โหดร้าย',high:'ใจดี'},
 {id:'dili',low:'ขี้เกียจ',high:'ขยัน'},{id:'loyal',low:'เห็นแก่ตัว',high:'ซื่อสัตย์'}];
AW.data.shared.illnesses=[
 {id:'cold',name:'ไข้หวัด',months:1,severity:1,weight:6},
 {id:'flu',name:'ไข้หวัดใหญ่',months:2,severity:2,weight:3},
 {id:'pneumonia',name:'ปอดอักเสบ',months:3,severity:3,deadly:true,weight:1},
 {id:'back_pain',name:'ปวดหลังเรื้อรัง',months:4,severity:1,minAge:35,weight:2},
 {id:'heart',name:'โรคหัวใจ',months:6,severity:3,deadly:true,minAge:50,weight:1},
 // อาการวิกฤตจากการต่อสู้ (Phase 5) ไม่เกิดแบบสุ่ม (weight 0) และไม่ทำให้ตายเอง
 {id:'critical',name:'อาการวิกฤตจากการต่อสู้',months:3,severity:3,weight:0}];
})(globalThis.AW);
