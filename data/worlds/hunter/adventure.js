// Hunter World (Phase 5): ดันเจี้ยน หอคอย (ชั้น 1-10) เหตุการณ์ในดันเจี้ยน/หอคอย และเหตุการณ์ของทีม (ข้อมูลล้วน)
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
H.locations.push({id:'tower',name:'หอคอยกลางเมือง',desc:'หอคอยที่โผล่ขึ้นพร้อมเกตแรก ปีนได้ทีละชั้น',bg:'bg.gov_base',when:{worldFlag:'registered'},src:'events2.js:151 (หอคอย) new'});
// ---- ดันเจี้ยน ----
H.dungeons=[
 {id:'sewer_nest',name:'รังใต้ท่อระบายน้ำ',rank:'E',tags:['rank_e','dungeon'],at:'gate_zone',floors:2,rooms:3,difficulty:1,mutate:0.08,when:{rank:{min:'E'}},
  groups:[{id:'rats',enemies:[{enemy:'rat_swarm'}],weight:3},{id:'slimes',enemies:[{enemy:'slime_g'},{enemy:'rat_swarm',mult:0.5}],weight:2},{id:'croc',enemies:[{enemy:'sewer_croc'}],weight:1,minFloor:1}],
  events:['dg_trapped_worker','dg_glowing_moss'],rewards:{room:[{money:25},{exp:25}],treasure:[{item:{id:'mana_stone'}},{money:40}],floor:[{exp:30}],clear:[{reputation:1}]},rules:{keepOnFail:0.5},src:'new'},
 {id:'goblin_warren',name:'โพรงก็อบลิน',rank:'D',tags:['rank_d','rank_d','dungeon'],at:'gate_zone',floors:3,rooms:3,difficulty:1,mutate:0.1,when:{rank:{min:'D'}},
  groups:[{id:'scouts',enemies:[{enemy:'goblin_scout'},{enemy:'goblin_scout'}],weight:3},{id:'shaman',enemies:[{enemy:'goblin_shaman'},{enemy:'goblin_scout',mult:0.6}],weight:2,minFloor:1}],
  events:['dg_trapped_worker','dg_goblin_prisoner','dg_glowing_moss'],boss:{enemy:'goblin_king',mult:1,risk:'normal'},
  rewards:{room:[{money:60},{exp:60}],treasure:[{item:{id:'mana_stone',n:2}},{money:100}],floor:[{exp:80}],clear:[{item:{id:'monster_core',n:2}},{reputation:3}]},rules:{keepOnFail:0.5},src:'logic4.js:387 (ราชาก็อบลิน) new'},
 {id:'red_ruins',name:'ซากปรักหักพังหลังเกตแดง',rank:'C',tags:['rank_c','rank_c','dungeon'],at:'gate_zone',floors:4,rooms:3,difficulty:1,mutate:0.1,when:{rank:{min:'C'}},
  groups:[{id:'golems',enemies:[{enemy:'ruin_golem'}],weight:2},{id:'wolves',enemies:[{enemy:'wolf_w'},{enemy:'wolf_w',mult:0.6}],weight:2},{id:'archers',enemies:[{enemy:'skel_a',mult:0.8}],weight:1,minFloor:2}],
  events:['dg_glowing_moss','dg_old_hunter_cache','dg_red_mist'],boss:{enemy:'red_ogre',mult:1,risk:'high',help:{name:'ทีมกู้ภัยสมาคม',cost:0,damage:0.3}},
  rewards:{room:[{money:120},{exp:110}],treasure:[{item:{id:'monster_core'}},{money:250}],floor:[{exp:150}],clear:[{item:{id:'monster_core',n:3}},{reputation:6}]},rules:{keepOnFail:0.4},src:'new'},
 {id:'abandoned_subway',name:'สถานีรถไฟใต้ดินร้าง (ข่าวจากตลาดมืด)',rank:'D',tags:['rank_d','dungeon'],at:'city',floors:2,rooms:4,difficulty:1.1,mutate:0.15,when:{all:[{rank:{min:'D'}},{flag:'info_subway'}]},
  groups:[{id:'mixed',enemies:[{enemy:'goblin_scout'},{enemy:'rat_swarm'}],weight:2},{id:'croc',enemies:[{enemy:'sewer_croc',mult:1.3}],weight:1}],
  events:['dg_old_hunter_cache','dg_glowing_moss'],rewards:{room:[{money:80},{exp:70}],treasure:[{item:{id:'monster_core'}},{money:150}],clear:[{item:{id:'mana_ring'}}]},rules:{keepOnFail:0.5},src:'new'}];
const dev=(id,title,text,choices,src='new')=>({id,title,trigger:'dungeon',text,choices,src});
H.events=(H.events||[]).concat([
 dev('dg_trapped_worker','คนงานติดอยู่ในโพรง','คนงานซ่อมท่อคนหนึ่งติดอยู่ใต้เศษปูน ข้างนอกยังได้ยินเสียงฝูงอสูร',[
  {text:'ยกปูนช่วยเขาออกมา',check:{stat:'str',dc:'mid',trait:'kind'},ok:{text:'เขาขอบคุณแล้ววิ่งออกไปทางที่ท่านชี้',effects:[{karma:4},{trait:{kind:3}}]},fail:{text:'ปูนหนักเกินไป ท่านต้องเรียกทีมกู้ภัยมาภายหลัง',effects:[{hp:-15},{karma:2}]}},
  {text:'บอกทางออกแล้วไปต่อ',ok:{text:'เขาค่อย ๆ คลานออกไปเอง',effects:[]}}]),
 dev('dg_glowing_moss','มอสเรืองแสง','ผนังห้องปกคลุมด้วยมอสสีฟ้าที่ดูดมานาจากอากาศ',[
  {text:'เก็บไปขาย',check:{stat:'int',dc:'easy'},ok:{text:'ท่านเก็บได้เต็มกระเป๋า',effects:[{item:{id:'mana_stone'}}]},fail:{text:'มอสเหี่ยวทันทีที่แตะ',effects:[]}},
  {text:'นั่งดูดซับมานา',ok:{text:'มานาในตัวไหลเรียบขึ้น',effects:[{mana:1}]}}]),
 dev('dg_goblin_prisoner','ก็อบลินในกรง','ก็อบลินตัวเล็กถูกขังในกรงไม้ มันชี้ไปทางห้องเก็บของแล้วทำท่าขอให้ปล่อย',[
  {text:'ปล่อยมัน',check:{stat:'luk',dc:'mid'},ok:{text:'มันพาท่านไปห้องเก็บของจริง ๆ',effects:[{money:150},{karma:2}]},fail:{text:'มันวิ่งไปส่งเสียงเรียกพวก',effects:[{hp:-20}]}},
  {text:'ไม่สนใจ',ok:{text:'ท่านเดินผ่านไป',effects:[]}}]),
 dev('dg_old_hunter_cache','กล่องเสบียงของฮันเตอร์รุ่นเก่า','กล่องเหล็กมีตราสมาคมรุ่นเก่า ข้างในยังมีของใช้ได้',[
  {text:'เปิดดู',ok:{text:'ยาสามัญกับแกนอสูรหนึ่งก้อน',effects:[{hp:40},{item:{id:'monster_core'}}]}},
  {text:'ส่งคืนสมาคม',ok:{text:'สมาคมบันทึกชื่อท่านไว้',effects:[{reputation:2},{karma:2}]}}]),
 dev('dg_red_mist','หมอกแดง','หมอกสีแดงลอยเข้ามาจากช่องผนัง ทำให้มองเห็นภาพหลอน',[
  {text:'กลั้นหายใจรีบผ่านไป',check:{stat:'vit',dc:'mid'},ok:{text:'ท่านผ่านมาได้โดยไม่เป็นอะไร',effects:[]},fail:{text:'ท่านเวียนหัวจนต้องพักนาน',effects:[{hpPct:-0.2}]}},
  {text:'หาทางอ้อม',check:{stat:'int',dc:'mid'},ok:{text:'ทางอ้อมพาไปเจอห้องลับ',effects:[{money:200}]},fail:{text:'ทางอ้อมวนกลับมาที่เดิม',effects:[]}}]),
]);
// ---- หอคอย: ชั้น 1-10 ในไฟล์นี้ ชั้นต่อไปเพิ่มจากไฟล์ข้อมูลอื่นผ่าน H.towerFloors ----
const F=(n,kind,o={})=>Object.assign({n,kind},o);
H.towers=[{id:'city_tower',name:'หอคอยกลางเมือง',at:'tower',apCost:1,src:'events2.js:151 (หอคอย) new',floors:[
 F(1,'fight',{enemy:'tower_guard',mult:0.6,reward:[{money:50}]}),F(2,'fight',{enemy:'tower_guard',mult:0.7,reward:[{exp:60}]}),
 F(3,'puzzle',{event:'tw_rune_door',reward:[{mana:1}]}),F(4,'fight',{enemy:'tower_guard',mult:0.8,reward:[{money:100}]}),
 F(5,'boss',{name:'ผู้คุมชั้น 5',enemy:'tower_warden',mult:0.7,risk:'normal',reward:[{item:{id:'mana_ring'}},{exp:150}]}),
 F(6,'choice',{event:'tw_two_doors',reward:[{exp:100}]}),F(7,'fight',{enemy:'tower_guard',mult:0.9,reward:[{money:150}]}),
 F(8,'puzzle',{event:'tw_mirror',reward:[{stat:{int:1}}]}),F(9,'fight',{enemy:'tower_guard',mult:1.0,reward:[{exp:200}]}),
 F(10,'boss',{name:'ผู้คุมชั้น 10',enemy:'tower_warden',mult:1.0,risk:'high',help:{name:'สัญญาณขอถอย',cost:0,damage:0.25},reward:[{learnSkill:'battle_focus'},{reputation:4}],when:{rank:{min:'D'}}})]}];
const tev=(id,title,text,choices,src='new')=>({id,title,trigger:'tower',text,choices,src});
H.events=H.events.concat([
 tev('tw_rune_door','ประตูอักษรรูน','ประตูหินสลักอักษรรูนสามแถว แถวหนึ่งเรืองแสงเมื่อท่านเข้าใกล้',[
  {text:'อ่านอักษรตามลำดับที่เรืองแสง',check:{stat:'int',dc:'mid'},ok:{text:'ประตูเปิดออกช้า ๆ',effects:[{towerClear:true}]},fail:{text:'อักษรดับลง ต้องกลับมาใหม่',effects:[]}},
  {text:'ใช้แรงผลักประตู',check:{stat:'str',dc:'hard'},ok:{text:'ประตูยอมแพ้แรงของท่าน',effects:[{towerClear:true}]},fail:{text:'ประตูไม่ขยับ',effects:[{hp:-10}]}}]),
 tev('tw_two_doors','สองประตู','ประตูซ้ายมีเสียงคนร้องขอความช่วยเหลือ ประตูขวามีแสงของรางวัล ทางเดินจะปิดหลังเลือก',[
  {text:'ประตูซ้าย',ok:{text:'คนที่ติดอยู่คือฮันเตอร์ที่หลงทาง ท่านพาเขาขึ้นมาด้วย',effects:[{towerClear:true},{karma:5}]}},
  {text:'ประตูขวา',ok:{text:'หีบรางวัลว่างเปล่า แต่ทางขึ้นเปิดแล้ว',effects:[{towerClear:true},{karma:-2}]}}]),
 tev('tw_mirror','ห้องกระจก','ในกระจกมีอีกตัวท่านยืนอยู่ มันทำทุกอย่างช้ากว่าท่านครึ่งจังหวะ',[
  {text:'ขยับให้เร็วกว่าเงา',check:{stat:'agi',dc:'mid'},ok:{text:'เงาตามไม่ทันแล้วแตกสลาย',effects:[{towerClear:true}]},fail:{text:'เงาหัวเราะ ห้องมืดลง',effects:[]}},
  {text:'ยืนนิ่งรอ',check:{stat:'luk',dc:'mid',trait:'dili'},ok:{text:'เงาเบื่อแล้วเดินหายไป',effects:[{towerClear:true}]},fail:{text:'ทั้งคู่ยืนนิ่งจนหมดวัน',effects:[]}}]),
]);
// ---- เหตุการณ์ของทีม ----
H.events=H.events.concat([
 {id:'party_conflict',title:'ทีมแตกคอ',trigger:'month',weight:4,cooldown:6,when:{partyConflict:true},who:{party:true},src:'new',
  text:'{who}กับเพื่อนร่วมทีมอีกคนทะเลาะกันกลางล็อบบี้สมาคม เรื่องใครเป็นคนพลาดในเกตครั้งก่อน',choices:[
  {text:'ไกล่เกลี่ย',check:{stat:'cha',dc:'mid',trait:'kind'},ok:{text:'ทั้งคู่ยอมจับมือกันแบบฝืน ๆ',effects:[{relx:{npc:'$who',trust:5}}]},fail:{text:'ทั้งคู่ไม่ฟัง บรรยากาศในทีมแย่ลง',effects:[{rel:{npc:'$who',n:-5}}]}},
  {text:'ให้{who}ออกจากทีม',ok:{text:'{who}เก็บของแล้วเดินออกไป',effects:[{partyLeave:{npc:'$who',reason:'ทะเลาะในทีม'}},{rel:{npc:'$who',n:-15}}]}}]},
 {id:'e2_partner_injured',title:'คู่หูบาดเจ็บ',trigger:'enter',at:'hospital',oncePerWho:true,priority:30,who:{party:true,injured:true},src:'events2.js:95',
  text:'{who}นอนพักอยู่เตียงข้าง ๆ หลังเกตครั้งล่าสุด หมอบอกว่าแขนอาจไม่กลับมาเหมือนเดิม',choices:[
  {text:'จ่ายค่าผ่าตัดด้วยหมอที่ดีที่สุด (1500)',when:{money:{min:1500}},lockText:'เงินไม่พอ',ok:{text:'แขนกลับมาใช้ได้เต็มที่ เพื่อนร่วมทีมพูดไม่ออก "ข้าติดหนี้แกตลอดชีวิต"',effects:[{money:-1500},{partyHeal:'$who'},{relx:{npc:'$who',aff:20,trust:10}}]}},
  {text:'อยู่เฝ้าทุกวัน',ok:{text:'ทั้งคู่คุยกันทุกเรื่องที่ไม่เคยคุย',effects:[{rel:{npc:'$who',n:10}},{stat:{cha:1}}]}},
  {text:'บอกให้พักทีมไปก่อน',ok:{text:'เพื่อนพยักหน้าเงียบ ๆ "อือ...เข้าใจ"',effects:[{rel:{npc:'$who',n:-5}},{partyLeave:{npc:'$who',reason:'พักรักษาตัว'}}]}}]},
 {id:'party_bond',title:'',trigger:'passive',cooldown:6,when:{partySize:{min:1}},who:{party:true},src:'new',text:'{who}เลี้ยงข้าวทีมหลังงาน',choices:[{text:'',ok:{text:'{who}เลี้ยงข้าวทีมหลังงาน บรรยากาศดีขึ้น',effects:[{relx:{npc:'$who',aff:2,trust:2}}]}}]},
 // ฝึกสกิล
]);
H.events=H.events.concat([
 {id:'practice_skills',title:'ฝึกสกิลกับครูฝึก (40)',trigger:'action',at:'gym',cost:{ap:1},when:{all:[{awakened:true},{money:{min:40}}]},src:'new',text:'ครูฝึกคังให้ท่านใช้สกิลซ้ำจนชิน',
  choices:[{text:'ฝึก',ok:{text:'ครูฝึกคังให้ท่านใช้สกิลซ้ำจนชิน',effects:[{money:-40},{practice:4}]}}]},
 {id:'learn_shock',title:'เรียนท่าฟาดสะท้าน (300)',trigger:'action',at:'gym',cost:{ap:1},when:{all:[{awakened:true},{money:{min:300}},{stat:{str:{min:30}}}]},src:'new',text:'ครูฝึกคังสอนท่าที่เขาใช้สมัยเป็นฮันเตอร์',
  choices:[{text:'เรียน',ok:{text:'ครูฝึกคังสอนท่าที่เขาใช้สมัยเป็นฮันเตอร์',effects:[{money:-300},{learnSkill:'shock_strike'}]}}]},
 {id:'learn_iron_body',title:'ฝึกกายเหล็ก (300)',trigger:'action',at:'gym',cost:{ap:1},when:{all:[{awakened:true},{money:{min:300}},{stat:{vit:{min:25}}}]},src:'new',text:'ท่านแช่น้ำแข็งพร้อมควบคุมมานาจนผิวแข็งขึ้น',
  choices:[{text:'ฝึก',ok:{text:'ท่านแช่น้ำแข็งพร้อมควบคุมมานาจนผิวแข็งขึ้น',effects:[{money:-300},{learnSkill:'iron_body'}]}}]},
 {id:'learn_rally',title:'เรียนการปลุกขวัญทีม (300)',trigger:'action',at:'association',cost:{ap:1},when:{all:[{awakened:true},{money:{min:300}},{stat:{cha:{min:30}}}]},src:'new',text:'หัวหน้าทีมรุ่นเก่าสอนวิธีพูดให้ทีมสู้ต่อ',
  choices:[{text:'เรียน',ok:{text:'หัวหน้าทีมรุ่นเก่าสอนวิธีพูดให้ทีมสู้ต่อ',effects:[{money:-300},{learnSkill:'rally'}]}}]},
 {id:'buy_mana_ring',title:'ซื้อแหวนมานา (300)',trigger:'action',at:'market',cost:{ap:0},when:{all:[{awakened:true},{money:{min:300}}]},src:'new',text:'แหวนเงินฝังหินมานาเม็ดเล็ก',
  choices:[{text:'ซื้อ',ok:{text:'ท่านสวมแหวนมานา',effects:[{money:-300},{item:{id:'mana_ring'}},{equip:'mana_ring'}]}}]},
 {id:'buy_guard_charm',title:'ซื้อเครื่องรางคุ้มกัน (700)',trigger:'action',at:'market',cost:{ap:0},when:{all:[{rank:{min:'D'}},{money:{min:700}}]},src:'new',text:'เครื่องรางที่สมาคมรับรอง',
  choices:[{text:'ซื้อ',ok:{text:'ท่านแขวนเครื่องรางคุ้มกัน',effects:[{money:-700},{item:{id:'guard_charm'}},{equip:'guard_charm'}]}}]},
]);
})(globalThis.AW);
