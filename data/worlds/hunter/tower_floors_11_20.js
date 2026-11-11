// Hunter World: หอคอยกลางเมือง ชั้น 11-20 (ตัวอย่างการเพิ่มชั้นผ่าน Data Module โดยไม่แก้โค้ดระบบ)
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
const F=(n,kind,o={})=>Object.assign({id:'city_tower_f'+n,tower:'city_tower',n,kind},o);
H.towerFloors=(H.towerFloors||[]).concat([
 F(11,'fight',{enemy:'tower_guard',mult:1.05,reward:[{money:250}]}),F(12,'fight',{enemy:'tower_guard',mult:1.1,reward:[{exp:250}]}),
 F(13,'puzzle',{event:'tw_rune_door',reward:[{mana:2}]}),F(14,'fight',{enemy:'tower_guard',mult:1.15,reward:[{money:300}]}),
 F(15,'boss',{name:'ผู้คุมชั้น 15',enemy:'tower_warden',mult:1.15,risk:'high',help:{name:'สัญญาณขอถอย',cost:0,damage:0.25},reward:[{item:{id:'guard_charm'}},{exp:400}],when:{rank:{min:'C'}}}),
 F(16,'choice',{event:'tw_two_doors',reward:[{exp:300}]}),F(17,'fight',{enemy:'tower_guard',mult:1.2,reward:[{money:400}]}),
 F(18,'puzzle',{event:'tw_mirror',reward:[{stat:{agi:1,int:1}}]}),F(19,'fight',{enemy:'tower_guard',mult:1.25,reward:[{exp:400}]}),
 F(20,'boss',{name:'ผู้คุมชั้น 20',enemy:'tower_warden',mult:1.3,risk:'high',help:{name:'สัญญาณขอถอย',cost:0,damage:0.25},reward:[{reputation:8},{item:{id:'monster_core',n:3}}],when:{rank:{min:'C'}}}),
]);
})(globalThis.AW);
