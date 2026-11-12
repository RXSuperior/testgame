// Hunter World (Phase 5): สกิล อุปกรณ์ ศัตรู ภารกิจบอส แรงก์ B และความสามารถต่อสู้ของ NPC (ข้อมูลล้วน)
// ไฟล์นี้เติมข้อมูลจาก base.js/people.js/actions.js ตาม id (ค่าเดิมยังอยู่ เพิ่มฟิลด์ใหม่)
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
const patch=(list,id,o)=>{const x=list.find(e=>e.id===id);if(!x)throw new Error('progression: ไม่มี '+id);Object.assign(x,o)};
// ---- สกิล: type active/passive/support · mp, cd (รอบ), act (damage/heal/guard/stun), mult, synergy, unlock, maxLv ----
patch(H.skills,'slash',{type:'active',act:'damage',mp:4,cd:1,mult:1.5,maxLv:5,synergy:{role:'tank',bonus:0.3}});
patch(H.skills,'aimed_shot',{type:'active',act:'damage',mp:5,cd:2,mult:1.8,maxLv:5,synergy:{after:'defend',bonus:0.4}});
patch(H.skills,'fireball',{type:'active',act:'damage',mp:8,cd:2,mult:1.4,target:'all',maxLv:5});
patch(H.skills,'backstab',{type:'active',act:'damage',mp:6,cd:2,mult:2.2,maxLv:5,synergy:{role:'tank',bonus:0.4}});
patch(H.skills,'heal',{type:'support',act:'heal',mp:6,cd:2,heal:0.3,maxLv:5,synergy:{role:'tank',bonus:0.2}});
patch(H.skills,'shield_wall',{type:'active',act:'guard',mp:3,cd:2,maxLv:5,synergy:{role:'support',bonus:0}});
patch(H.skills,'mana_burst',{type:'active',act:'damage',mp:12,cd:3,mult:2.5,target:'all',maxLv:5});
H.skills.push(
 {id:'iron_body',name:'กายเหล็ก',type:'passive',pct:0.03,power:0,maxLv:5,unlock:{all:[{awakened:true},{stat:{vit:{min:25}}}]},src:'new'},
 {id:'battle_focus',name:'สมาธิในการต่อสู้',type:'passive',pct:0.04,power:0,maxLv:5,unlock:{all:[{awakened:true},{level:{min:5}}]},src:'new'},
 {id:'shock_strike',name:'ฟาดสะท้าน',type:'active',act:'stun',mp:7,cd:3,mult:1.0,power:6,maxLv:5,unlock:{all:[{awakened:true},{stat:{str:{min:30}}}]},src:'new'},
 {id:'rally',name:'ปลุกขวัญ',type:'support',act:'heal',mp:5,cd:3,heal:0.15,power:4,maxLv:5,synergy:{role:'damage',bonus:0.3},unlock:{all:[{awakened:true},{stat:{cha:{min:30}}}]},src:'new'});
// ---- อุปกรณ์: slot weapon/armor/accessory · rank · req (เงื่อนไขสวมใส่) · upgrade {max, cost, per} ----
patch(H.items,'iron_dagger',{rank:'E',upgrade:{max:3,cost:80,per:{power:3}}});
patch(H.items,'mana_blade_d',{rank:'D',req:{rank:{min:'D'}},upgrade:{max:3,cost:250,per:{power:6}}});
patch(H.items,'crystal_blade_c',{rank:'C',req:{rank:{min:'C'}},upgrade:{max:3,cost:700,per:{power:12}}});
patch(H.items,'leather_vest',{rank:'E',upgrade:{max:3,cost:60,per:{hp:10}}});
patch(H.items,'light_armor_d',{rank:'D',req:{rank:{min:'D'}},upgrade:{max:3,cost:220,per:{hp:25}}});
H.items.push(
 {id:'mana_ring',name:'แหวนมานา',slot:'accessory',rank:'E',mp:15,power:3,price:300,upgrade:{max:3,cost:150,per:{mp:5}},src:'new'},
 {id:'guard_charm',name:'เครื่องรางคุ้มกัน',slot:'accessory',rank:'D',hp:60,price:700,req:{rank:{min:'D'}},src:'new'},
 {id:'fang_blade_b',name:'อาวุธเขี้ยวอสูรเกรด B',slot:'weapon',rank:'B',power:150,price:7000,req:{rank:{min:'B'}},upgrade:{max:3,cost:2000,per:{power:20}},src:'logic4.js:45 (เกรด B)'},
 {id:'scale_armor_b',name:'เกราะเกล็ดอสูรเกรด B',slot:'armor',rank:'B',hp:550,price:6500,req:{rank:{min:'B'}},src:'logic4.js:46 (เกรด B)'},
 {id:'black_charm',name:'เครื่องรางตลาดมืด',slot:'accessory',rank:'D',power:25,price:900,req:{underRep:{min:10}},src:'new (ตลาดมืด)'},
 {id:'skill_book_focus',name:'ตำราสมาธิในการต่อสู้',kind:'key',price:400,src:'new'});
// ---- ศัตรู: hp และรูปแบบการกระทำ (pattern) ใช้ในการต่อสู้แบบ manual ----
const atk={act:'attack',mult:1},heavy=(tell)=>({act:'heavy',name:'โจมตีหนัก',mult:1.8,tell}),guard={act:'guard'},sweep={act:'sweep',name:'กวาดทั้งทีม',mult:0.9,tell:'ง้างแขนกว้าง'};
patch(H.enemies,'goblin_king',{pattern:[atk,atk,heavy('ยกกระบองขึ้นสูง'),guard,{act:'enrage'}]});
patch(H.enemies,'exam_d',{pattern:[atk,guard,atk,heavy('แกนพลังเรืองแสง')]});
patch(H.enemies,'exam_c',{pattern:[atk,heavy('แกนพลังเรืองแสง'),guard,sweep,{act:'enrage'}]});
patch(H.enemies,'gate_boss',{pattern:[atk,heavy('ส่งเสียงคำราม'),atk,sweep,{act:'enrage'}]});
H.enemies.push(
 {id:'red_ogre',name:'อสูรยักษ์เกตแดง',power:260,hp:900,asset:'mon.gate_boss',pattern:[atk,heavy('ยกค้อนหิน'),guard,sweep,{act:'enrage'}],src:'new'},
 {id:'wolf_lord',name:'ราชาหมาป่าเงา',power:330,hp:1100,asset:'mon.dire_wolf',pattern:[atk,atk,heavy('หายเข้าไปในเงา'),sweep,{act:'heal'},{act:'enrage'}],src:'logic4.js:387 (BOSSES หมาป่าเงาสามหัว)'},
 {id:'skel_knight',name:'อัศวินโครงกระดูก',power:330,src:'logic4.js:387 (BOSSES)'},
 {id:'frost_naga',name:'นาคน้ำแข็ง',power:420,src:'logic4.js:387 (BOSSES)'},
 {id:'exam_b',name:'หุ่นประเมินของสมาคม (เกณฑ์ B)',power:380,hp:1200,asset:'mon.golem',pattern:[atk,heavy('แกนพลังเรืองแสง'),guard,sweep,{act:'enrage'}],src:'new'},
 {id:'rat_swarm',name:'ฝูงหนูอสูร',power:35,src:'new'},{id:'sewer_croc',name:'จระเข้ท่อระบายน้ำ',power:70,hp:240,pattern:[atk,heavy('อ้าปากกว้าง')],src:'new'},
 {id:'goblin_scout',name:'ก็อบลินสอดแนม',power:55,src:'new'},{id:'goblin_shaman',name:'ก็อบลินหมอผี',power:90,src:'new'},
 {id:'ruin_golem',name:'โกเลมซากปรักหักพัง',power:200,src:'new'},{id:'tower_guard',name:'ผู้พิทักษ์หอคอย',power:60,powerByRank:{_:50,E:60,D:110,C:200,B:360,A:600,S:1000},src:'new'},
 {id:'tower_warden',name:'ผู้คุมชั้นหอคอย',power:90,hp:300,powerByRank:{_:70,E:90,D:160,C:280,B:480,A:800,S:1300},pattern:[atk,heavy('ดวงตาเรืองแสง'),guard,{act:'enrage'}],src:'new'},
 {id:'b_rank_hunter',name:'ฮันเตอร์แรงก์ B',power:400,hp:1000,pattern:[atk,heavy('ชักอาวุธมานา'),guard,atk],src:'events2.js:123 (เป้าหมายแรงก์ B)'},
 {id:'drug_gang',name:'แก๊งยาเถื่อนกับฮันเตอร์ที่ใช้ยา',power:150,powerByRank:{_:100,E:110,D:170,C:260,B:420,A:700,S:1100},src:'events2.js:79'});
// ---- แรงก์ B (เตรียมไว้ Phase 5) ----
H.rankSystem.promote.B={when:{all:[{level:{min:18}},{statTotal:{min:260}},{missions:{tag:'rank_c',min:8}}]}};
// ---- ภารกิจเพิ่ม: บอสแบบ manual, raid เสี่ยงถึงชีวิต (แจ้งเตือน + ถอย/ขอความช่วยเหลือได้), สอบ B ----
const reg={worldFlag:'registered'};
patch(H.missions,'goblin_king',{retreat:[{reputation:-1}]});
H.missions.push(
 {id:'red_gate_boss',name:'บอสเกตแดง: อสูรยักษ์',rank:'C',at:'gate_zone',enemy:'red_ogre',mode:'manual',risk:'high',when:{rank:{min:'C'}},help:{name:'ทีมกู้ภัยสมาคม',cost:0,damage:0.3},
  win:[{money:900},{exp:500},{item:{id:'monster_core',n:3}},{reputation:5}],lose:[{reputation:-3}],retreat:[{reputation:-1}],tags:['rank_c','boss'],src:'logic4.js:111 (เกตแดง) new'},
 {id:'wolf_lord_raid',name:'Raid: ราชาหมาป่าเงา (อันตรายถึงชีวิต)',rank:'C',at:'association',enemy:'wolf_lord',mode:'manual',risk:'lethal',when:{all:[reg,{rank:{min:'C'}},{level:{min:13}}]},help:{name:'ทีมจู่โจมของสมาคม',cost:0,damage:0.35},
  win:[{money:2500},{exp:900},{reputation:12},{item:{id:'fang_blade_b'}}],lose:[{reputation:-5}],retreat:[{reputation:-2}],tags:['rank_c','boss','raid'],src:'new'},
 {id:'exam_b',name:'สอบเลื่อนแรงก์ B',rank:'C',at:'association',enemy:'exam_b',mode:'manual',risk:'high',when:{all:[reg,{rank:{is:'C'}},{canPromote:'hunter'}]},
  win:[{rankUp:'hunter'},{exp:200}],retreat:[],tags:['exam'],src:'new'},
 {id:'skeleton_knight_gate',name:'เกตแรงก์ C: อัศวินโครงกระดูก',rank:'C',at:'gate_zone',enemy:'skel_knight',when:{rank:{min:'C'}},win:[{money:600},{exp:420},{item:{id:'monster_core',n:2}}],tags:['rank_c'],src:'logic4.js:387'},
 {id:'frost_naga_gate',name:'เกตแรงก์ B: นาคน้ำแข็ง',rank:'B',at:'gate_zone',enemy:'frost_naga',when:{rank:{min:'B'}},win:[{money:1200},{exp:700}],tags:['rank_b'],src:'logic4.js:387'});
// ---- ความสามารถต่อสู้ของ NPC (Party) จากอาชีพ และกำหนดเฉพาะคนในข้อมูล ----
const J=H.jobs;
patch(J,'npc_hunter',{combat:{base:70,share:0.15}});patch(J,'trainer',{combat:{role:'tank',base:65,share:0.1}});patch(J,'doctor',{combat:{role:'support',base:40,share:0.1}});
patch(J,'guild_contract',{combat:{role:'damage',base:80,share:0.15}});
patch(H.npcs,'rival_hunter',{combat:{role:'damage',base:85,share:0.2}});
patch(H.npcs,'master_kang',{combat:{role:'tank',base:90,share:0.1}});
})(globalThis.AW);
