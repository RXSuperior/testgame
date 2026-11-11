// Hunter World: กิจกรรมประจำสถานที่ (ใช้ AP เดือนละ 2) เป็นเหตุการณ์แบบ trigger 'action'
// อัตราเติบโตเดิม (PATHS ใน logic4.js:11-19) คือ 0.2–0.6 ต่อเดือนแบบอัตโนมัติ ตอนนี้ผู้เล่นเลือกเองครั้งละ +1
(function(AW){
const H=(AW.data.parts=AW.data.parts||{}).hunter=AW.data.parts.hunter||{};
const act=(id,at,title,text,effects,o={})=>Object.assign({id,title,trigger:'action',at,cost:{ap:1},text,choices:[{text:'ทำ',ok:{text,effects}}]},o);
const buy=(id,name,price,when)=>act('buy_'+id,'market','ซื้อ'+name+' ('+price+')','ท่านซื้อ'+name+'แล้วสวมใส่ทันที',[{money:-price},{item:{id}},{equip:id}],{cost:{ap:0},when:Object.assign({money:{min:price}},when||{}),src:'logic4.js:45-46'});
H.events=(H.events||[]).concat([
 act('rest','home','พักผ่อน','ท่านนอนยาวจนสาย ร่างกายสดชื่น',[{hp:60}],{src:'new'}),
 act('study_home','home','อ่านหนังสือ','ท่านอ่านตำราจนดึก',[{stat:{int:1}}],{src:'logic4.js:12 (เรียนหนังสือ)'}),
 act('class','school','เรียนหนังสือ','ท่านตั้งใจฟังครูทั้งวัน',[{stat:{int:1}}],{src:'logic4.js:12'}),
 act('sport','school','ซ้อมกีฬา','ท่านวิ่งรอบสนามจนเหงื่อท่วม',[{stat:{str:1,vit:1}}],{src:'logic4.js:13',cost:{ap:2}}),
 act('hangout','school','เที่ยวกับเพื่อน','ท่านกับฮาจุนเดินเล่นจนค่ำ',[{stat:{cha:1}},{rel:{npc:'best_friend',n:2}}],{src:'logic4.js:14'}),
 act('part_time','city','ทำงานพิเศษ','ท่านทำงานกะดึกได้ค่าแรงมา',[{money:40}],{src:'logic4.js:15'}),
 act('sell_stone','city','ขายหินมานา (+60)','ร้านรับซื้อให้ราคาตามตลาด',[{item:{id:'mana_stone',n:-1}},{money:60}],{src:'new',when:{item:{id:'mana_stone'}},cost:{ap:0}}),
 act('sell_core','city','ขายแกนอสูร (+150)','นักวิจัยรับซื้อไปศึกษา',[{item:{id:'monster_core',n:-1}},{money:150}],{src:'new',when:{item:{id:'monster_core'}},cost:{ap:0}}),
 act('train_str','gym','ยกน้ำหนักกับครูฝึกคัง (20)','ครูฝึกคังเพิ่มน้ำหนักทีละแผ่น',[{money:-20},{stat:{str:1}},{rel:{npc:'master_kang',n:1}}],{src:'new',when:{money:{min:20}}}),
 act('train_agi','gym','ฝึกความเร็ว (20)','ท่านวิ่งหลบลูกบอลจนขาสั่น',[{money:-20},{stat:{agi:1}}],{src:'new',when:{money:{min:20}}}),
 act('train_vit','gym','ฝึกความอึด (20)','ท่านแช่น้ำแข็งตามตำราครูฝึก',[{money:-20},{stat:{vit:1}}],{src:'new',when:{money:{min:20}}}),
 act('meditate','gym','ฝึกควบคุมมานา (30)','ท่านนั่งสมาธิในห้องกันเสียงจนมานาไหลเรียบ',[{money:-30},{mana:2},{stat:{int:1}}],{src:'new',when:{all:[{awakened:true},{money:{min:30}}]}}),
 act('treat','hospital','รักษาตัว (100)','หมอฮันเตอร์ใช้มานารักษาแผลและอาการป่วย',[{money:-100},{cure:true},{treat:true},{hp:999}],{src:'logic4.js:25 (โรงพยาบาลฮันเตอร์)',when:{money:{min:100}}}),
 buy('iron_dagger','มีดสั้นเหล็ก',150),
 buy('leather_vest','เสื้อหนังกันมีด',120),
 buy('mana_blade_d','อาวุธมานาเกรด D',600,{rank:{min:'D'}}),
 buy('light_armor_d','เกราะเบาเกรด D',550,{rank:{min:'D'}}),
 buy('crystal_blade_c','อาวุธผลึกเกรด C',2200,{rank:{min:'C'}}),
]);
// ภารกิจ: Auto Resolve ผ่าน Combat · tags ใช้นับเกณฑ์แรงก์ · 'any' นับทุกภารกิจ
const reg={worldFlag:'registered'};
H.missions=[
 {id:'sewer_slime',name:'กวาดล้างสไลม์ในท่อระบายน้ำ',rank:'E',at:'association',enemy:'slime_g',when:{all:[reg,{rank:{min:'E'}}]},win:[{money:60},{exp:70},{item:{id:'mana_stone'}}],tags:['rank_e'],src:'new (มอนสเตอร์จาก MON_BY_RANK logic4.js:39)'},
 {id:'goblin_gate',name:'เกตแรงก์ E: ฝูงก็อบลิน',rank:'E',at:'gate_zone',enemy:'goblins',when:{rank:{min:'E'}},win:[{money:100},{exp:100},{item:{id:'mana_stone',n:2}}],tags:['rank_e'],src:'logic4.js:384-391 (enterGate)'},
 {id:'porter',name:'แบกของให้ทีมแรงก์ C',rank:'E',at:'association',enemy:'border_beast',when:{all:[reg,{rank:{max:'D'}}]},win:[{money:90},{exp:60}],tags:['rank_e'],src:'logic4.js:258 (ทีมสำรวจรับคนแบกของ)'},
 {id:'exam_d',name:'สอบเลื่อนแรงก์ D',rank:'E',at:'association',enemy:'exam_d',when:{all:[reg,{rank:{is:'E'}},{canPromote:'hunter'}]},win:[{rankUp:'hunter'},{exp:50}],tags:['exam'],src:'new'},
 {id:'skeleton_gate',name:'เกตแรงก์ D: โครงกระดูกนักรบ',rank:'D',at:'gate_zone',enemy:'skel_w',when:{rank:{min:'D'}},win:[{money:220},{exp:180},{item:{id:'monster_core'}}],tags:['rank_d'],src:'logic4.js:39-40'},
 {id:'werewolf_hunt',name:'ล่ามนุษย์หมาป่าขาว',rank:'D',at:'association',enemy:'wolf_w',when:{all:[reg,{rank:{min:'D'}}]},win:[{money:260},{exp:220}],tags:['rank_d'],src:'logic4.js:40'},
 {id:'goblin_king',name:'งานกิลด์เขี้ยวเหล็ก: ราชาก็อบลิน',rank:'D',at:'gate_zone',enemy:'goblin_king',when:{all:[{rank:{min:'D'}},{worldFlag:'guild_ironfang'}]},win:[{money:300},{exp:300},{item:{id:'monster_core'}}],tags:['rank_d'],src:'logic4.js:387 (BOSSES)'},
 {id:'exam_c',name:'สอบเลื่อนแรงก์ C',rank:'D',at:'association',enemy:'exam_c',when:{all:[reg,{rank:{is:'D'}},{canPromote:'hunter'}]},win:[{rankUp:'hunter'},{exp:100}],tags:['exam'],src:'new'},
 {id:'skel_archer_gate',name:'เกตแรงก์ C: โครงกระดูกนักธนู',rank:'C',at:'gate_zone',enemy:'skel_a',when:{rank:{min:'C'}},win:[{money:450},{exp:350},{item:{id:'monster_core',n:2}}],tags:['rank_c'],src:'logic4.js:39-40'},
 {id:'black_wolf',name:'ล่ามนุษย์หมาป่าดำ',rank:'C',at:'association',enemy:'wolf_b',when:{all:[reg,{rank:{min:'C'}}]},win:[{money:500},{exp:400}],tags:['rank_c'],src:'logic4.js:40'},
];
})(globalThis.AW);
