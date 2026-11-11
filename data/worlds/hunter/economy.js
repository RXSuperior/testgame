// Hunter World: ข้อมูลเศรษฐกิจ (Phase 6) · บริการ การลงทุนกิลด์ งานระดับสูง ค่าตั้งต้นของระบบเศรษฐกิจ/ภารกิจ/ทีม/หอคอย
// ทุกตัวเลขอยู่ที่นี่ ระบบ (src/systems/economy.js) ไม่มีราคาฝังในโค้ด · ดู docs/phase6/ECONOMY_DESIGN.md
(function(AW){
const H=AW.data.parts.hunter;
const patch=(list,id,o)=>{const x=list.find(e=>e.id===id);if(!x)throw new Error('economy: ไม่มี '+id);Object.assign(x,o)};
// ---- ค่าตั้งต้น ----
// สภาพอุปกรณ์: ลดต่อการต่อสู้ (auto 1, manual 3, แพ้ x1.5) · ต่ำกว่า 50 พลังจากอุปกรณ์ลดลงจนเหลือครึ่งที่ 0 · ซ่อมคิดต่อแต้มตามเกรด
H.economyConfig={safetyCash:{E:100,D:200,C:500,B:1000,A:2000,S:4000},wearAuto:1,wearManual:3,lossWear:1.5,repairPerPoint:{E:2,D:4,C:10,B:24,A:50,S:100},lowCond:50,planGrace:3,ledgerMonths:24};
// ภารกิจ: ทำงานเดิมซ้ำใน 6 เดือน ค่าตอบแทนลดครั้งละ 12% (ไม่ต่ำกว่า 50%) · สายเดี่ยว EXP +15% · ระดับผลงานกับสมาคม (ลดลง 2%/เดือน)
H.missionConfig={saturation:0.12,window:6,floor:0.5,soloExp:0.15,meritDecay:0.02,
 meritTiers:[{min:60,name:'สมาชิกที่สมาคมไว้ใจ',sat:0.5,pay:0.05},{min:180,name:'ฮันเตอร์อาวุโสของสมาคม',sat:0.3,pay:0.12},{min:400,name:'หัวหน้าภาคสนามของสมาคม',sat:0.2,pay:0.2}]};
// ความสามารถเริ่มต้นตามบทบาท (NPC ที่มี ability ของตัวเองใช้ของตัวเองแทน)
H.partyConfig={roleAbilities:{tank:{kind:'injuryGuard',value:0.25,name:'คุ้มกัน'},support:{kind:'healAfter',value:0.15,name:'ปฐมพยาบาล'},damage:{kind:'moneyPct',value:0.06,name:'เก็บของจากซาก'}}};
H.towerConfig={need:{fight:0.6,boss:0.7,high:0.75},npcCadence:6,npcScale:2,npcRank:'C',npcRest:3,friendAff:40,logFloor:8};
// ---- บริการ ----
const S=(id,at,cat,kind,name,o)=>Object.assign({id,at,cat,kind,name,src:'new (Phase 6)'},o);
const R={E:0,D:1,C:2,B:3};
H.services=[
 // สมาคม: ประกัน ข่าวกรอง หลักสูตร
 S('assoc_insurance','association','association','plan','ประกันฮันเตอร์ของสมาคม',{desc:'ลดค่ารักษา 60% และโอกาสบาดเจ็บเบาลง',monthlyByRank:{E:10,D:30,C:120,B:300},perks:{discount:{medical:0.6},injuryGuard:0.2},when:{worldFlag:'registered'}}),
 S('intel_report','association','association','repeat','รายงานข่าวกรองเกต',{desc:'ข้อมูลศัตรูล่วงหน้า พลัง +10% สองภารกิจถัดไป',priceByRank:{E:40,D:120,C:400,B:1000},effects:[{buff:{id:'intel',name:'ข่าวกรอง',pct:0.1,n:2}}],when:{worldFlag:'registered'}}),
 S('assoc_program','association','training','repeat','หลักสูตรพัฒนาฮันเตอร์ของสมาคม',{desc:'ค่าหลักอาชีพ +3 ราคาขึ้นทุกครั้ง',ap:1,grow:1.06,priceByRank:{E:100,D:300,C:900,B:2200},effects:[{classStat:4},{stat:{vit:2}}],when:{all:[{worldFlag:'registered'},{awakened:true}]}}),
 S('skill_seminar','association','training','repeat','สัมมนาเทคนิคการต่อสู้',{desc:'XP ทุกสกิลที่ใช้งาน',ap:1,grow:1.1,priceByRank:{D:300,C:800,B:2000},effects:[{practice:8}],when:{rank:{min:'D'}}}),
 S('mana_course','gym','training','repeat','คอร์สขยายวงจรมานา',{desc:'มานา +2 ราคาขึ้นทุกครั้ง',ap:1,grow:1.08,priceByRank:{D:400,C:1000,B:2500},effects:[{mana:2}],when:{rank:{min:'D'}}}),
 S('private_coach','gym','training','plan','ครูฝึกส่วนตัว',{desc:'ทุกเดือน: ค่าหลักอาชีพ +1 กาย +1',monthlyByRank:{D:200,C:600,B:1500},monthlyEffects:[{classStat:1},{stat:{vit:1}}],when:{rank:{min:'D'}},
  discounts:[{when:{rel:{npc:'master_kang',min:60}},pct:0.25}]}),
 // อุปกรณ์
 S('gear_maint','market','gear','plan','สัญญาดูแลอุปกรณ์รายเดือน',{desc:'อุปกรณ์ไม่สึกหรอ',monthlyByRank:{D:60,C:250,B:700},perks:{maint:true},when:{rank:{min:'D'}}}),
 S('mana_coating','market','gear','once','ชุบเคลือบมานา',{desc:'อุปกรณ์สึกช้าลงครึ่งหนึ่ง (ถาวร)',priceByRank:{D:1500,C:3000,B:8000},perks:{wearGuard:0.5},when:{rank:{min:'D'}}}),
 // การใช้ชีวิต (เลือกได้ระดับเดียว ยกเลิกได้)
 S('life_comfort','city','lifestyle','plan','ใช้ชีวิตสบาย',{group:'lifestyle',desc:'ทุกเดือน: ฟื้นพลังชีวิต 10%',monthlyByRank:{E:40,D:100,C:300,B:800},monthlyEffects:[{hpPct:0.1}],when:{age:{min:18}}}),
 S('life_luxury','city','lifestyle','plan','ใช้ชีวิตหรูหรา',{group:'lifestyle',desc:'ทุกเดือน: ฟื้นพลังชีวิต 20% ชื่อเสียง +1 · บาดเจ็บเบาลง',monthlyByRank:{C:1200,B:3000},monthlyEffects:[{hpPct:0.2},{reputation:1}],perks:{injuryGuard:0.1},when:{rank:{min:'C'}}}),
 // บ้านของตัวเอง (ต้องซื้อบ้านก่อน) · มีค่าดูแลรายเดือน จ่ายไม่ไหวแค่หยุดใช้
 S('home_gym','home','housing','once','ต่อเติมห้องฝึกในบ้าน',{desc:'ทุกเดือน: กาย +1',price:6000,monthly:60,monthlyEffects:[{stat:{str:1}}],when:{homeOwned:true},hide:true}),
 S('home_meditation','home','housing','once','ต่อเติมห้องสมาธิ',{desc:'ทุกเดือน: มานา +1',price:8000,monthly:80,monthlyEffects:[{mana:1}],when:{homeOwned:true},hide:true}),
 S('home_clinic','home','housing','once','ห้องพยาบาลในบ้าน',{desc:'ทุกเดือน: ฟื้นพลังชีวิต 20% · บาดเจ็บเบาลง',price:12000,monthly:150,monthlyEffects:[{hpPct:0.2}],perks:{injuryGuard:0.25},when:{homeOwned:true},hide:true}),
 // กิลด์: สนับสนุน (เพิ่มความเชื่อถือ ปลดล็อกสัญญากิลด์) · การลงทุนอยู่ใน H.guilds
 S('sponsor_northstar','association','guild','repeat','สนับสนุนกิลด์ดาวเหนือ',{desc:'ความเชื่อถือกิลด์ +10',grow:1.1,priceByRank:{C:2000,B:5000},effects:[{guildStanding:{id:'northstar',n:10}},{reputation:1}],when:{rank:{min:'C'}}}),
 S('sponsor_ironfang','association','guild','repeat','สนับสนุนกิลด์เขี้ยวเหล็ก',{desc:'ความเชื่อถือกิลด์ +10',grow:1.1,priceByRank:{C:2000,B:5000},effects:[{guildStanding:{id:'ironfang',n:10}},{reputation:1}],when:{rank:{min:'C'}}}),
 S('sponsor_silverdragon','association','guild','repeat','สนับสนุนกิลด์มังกรเงิน',{desc:'ความเชื่อถือกิลด์ +10',grow:1.1,priceByRank:{C:2000,B:5000},effects:[{guildStanding:{id:'silverdragon',n:10}},{reputation:1}],when:{rank:{min:'C'}}}),
 // การเดินทาง: ชุดหินมานาสำหรับรอยแยกลึก (ใช้กับ Gate เดิม)
 S('rift_pack','gate_zone','travel','repeat','ชุดหินมานาสำหรับรอยแยกลึก',{desc:'หินมานา 3 ก้อน',priceByRank:{C:600,B:900},effects:[{item:{id:'mana_stone',n:3}}],when:{gate:{id:'rift_fantasy',is:'open'}}}),
];
H.guilds=[
 {id:'northstar',name:'กิลด์ดาวเหนือ',desc:'กิลด์ใหญ่ มั่นคง ผลตอบแทนต่ำ',yield:{mean:0.003,spread:0.01},fee:0.05,capByRank:{E:0,D:2000,C:15000,B:50000},when:{rank:{min:'D'}},src:'events_hunter.js:44 (กิลด์ดาวเหนือ) new'},
 {id:'ironfang',name:'กิลด์เขี้ยวเหล็ก',desc:'กิลด์สายล่า ผลตอบแทนผันผวน',yield:{mean:0.004,spread:0.03},fee:0.08,capByRank:{E:0,D:2000,C:15000,B:50000},when:{rank:{min:'D'}},src:'actions.js:36 (กิลด์เขี้ยวเหล็ก) new'},
 {id:'silverdragon',name:'กิลด์มังกรเงิน',desc:'กิลด์วิจัยเกต เสี่ยงสูง',yield:{mean:0.005,spread:0.05},fee:0.1,capByRank:{E:0,D:2000,C:15000,B:50000},when:{rank:{min:'C'}},src:'events_e2.js:126 (กิลด์มังกรเงิน) new'}];
// ---- งาน: เงินเดือนขึ้นตามอายุงาน (raise/ปี) · ตำแหน่งสูงต้องมีอายุงานในตำแหน่งก่อนหน้า ----
patch(H.jobs,'office',{raise:0.06,perks:{discount:{medical:0.3}}});
patch(H.jobs,'assoc_clerk',{raise:0.06});patch(H.jobs,'hospital_aide',{perks:{discount:{medical:0.5}}});
H.jobs.push(
 {id:'office_senior',name:'หัวหน้าฝ่ายบริษัท',at:'city',salary:520,ap:2,status:55,schedule:'worker',raise:0.05,perks:{discount:{medical:0.5}},when:{jobTenure:{job:'office',min:3}},src:'new (Phase 6)'},
 {id:'assoc_officer',name:'เจ้าหน้าที่อาวุโสของสมาคม',at:'association',salary:420,ap:1,status:50,schedule:'worker',raise:0.05,when:{all:[{jobTenure:{job:'assoc_clerk',min:3}},{stat:{int:{min:45}}}]},src:'new (Phase 6)'},
 {id:'gym_head',name:'หัวหน้าครูฝึก',at:'gym',salary:360,ap:1,status:30,schedule:'worker',monthly:[{stat:{str:1,vit:1}}],when:{all:[{jobTenure:{job:'gym_assist',min:3}},{stat:{str:{min:50}}}]},src:'new (Phase 6)'},
 {id:'guild_senior_contract',name:'ฮันเตอร์สัญญากิลด์อาวุโส',at:'association',salary:950,ap:1,status:60,schedule:'hunter_npc',raise:0.04,perks:{discount:{medical:0.4}},when:{all:[{rank:{min:'B'}},{jobTenure:{job:'guild_contract',min:2}}]},src:'new (Phase 6)'},
 {id:'hospital_nurse',name:'พยาบาลฮันเตอร์',at:'hospital',salary:320,ap:1,status:35,schedule:'worker',perks:{discount:{medical:0.8}},monthly:[{stat:{vit:1}}],when:{all:[{jobTenure:{job:'hospital_aide',min:2}},{stat:{int:{min:35}}}]},src:'new (Phase 6)'});
// ---- ความสามารถเฉพาะตัวของ NPC (ระบบเดียวกันทุกคน) ----
patch(H.npcs,'master_kang',{combat:Object.assign({},H.npcs.find(n=>n.id==='master_kang').combat,{ability:{kind:'skillXp',value:0.5,name:'ชี้แนะท่า'}})});
patch(H.npcs,'rival_hunter',{combat:Object.assign({},H.npcs.find(n=>n.id==='rival_hunter').combat,{ability:{kind:'expPct',value:0.1,name:'แข่งกันพัฒนา'}})});
// ---- หมวดเงินของกิจกรรมเดิม (ใช้ในสมุดบัญชีและส่วนลด) ----
const cat=(id,c)=>{const x=H.events.find(e=>e.id===id);if(x)x.cat=c};
cat('treat','medical');cat('part_time','job');for(const id of['sell_stone','sell_core'])cat(id,'sell');
for(const e of H.events)if(e.trigger==='action'&&/^(buy_|ug_buy)/.test(e.id))e.cat='shop';
for(const id of['train_str','train_agi','train_vit','meditate','practice_skills','learn_shock','learn_iron_body','learn_rally'])cat(id,'training');
for(const e of H.events)if(/^(ug_|e2_black_market|e2_drug_ring|e2_contract_kill)/.test(e.id))e.cat=e.cat||'underground';
})(globalThis.AW);
