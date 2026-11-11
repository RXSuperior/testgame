// Hunter World: เนื้อหาแรงก์ B (Phase 6) · ข้อมูลล้วน ใช้ระบบ Mission/Combat/Party/Dungeon/Event/Economy เดิม
// ศัตรู B ไม่ได้แค่เลือดหนา: เกราะ (armor) ต้องใช้สกิลเจาะ · โล่ (shield) ต้องทำให้เสียหลัก · เรียกลูกน้อง (summon) · ดูดมานา (drain) · ฝูง (swarm) ลงโทษคนเดียว
// ทางเลือกสายทีม (Raid ต้องมีทีม 2+) และสายเดี่ยว (ค่าหัวต้องไม่มีทีม) · ยังไม่มีเนื้อหาแรงก์ A/S
(function(AW){
const H=AW.data.parts.hunter;
const patch=(list,id,o)=>{const x=list.find(e=>e.id===id);if(!x)throw new Error('rank_b: ไม่มี '+id);Object.assign(x,o)};
const atk={act:'attack',mult:1},heavy=tell=>({act:'heavy',name:'โจมตีหนัก',mult:1.8,tell}),guard={act:'guard'},sweep={act:'sweep',name:'กวาดทั้งทีม',mult:0.9,tell:'ง้างกว้าง'};
const shield=tell=>({act:'shield',name:'กางโล่มานา',n:2,tell}),drain={act:'drain',name:'ดูดมานา',mult:0.8,mp:8},summon=id=>({act:'summon',summon:id});
const SRC='new (Phase 6 แรงก์ B)';
// ---- ศัตรู ----
H.enemies.push(
 {id:'harpy_flock',name:'ฝูงฮาร์ปี้',power:430,hp:1000,swarm:0.25,asset:'mon.goblin',pattern:[atk,sweep,atk,heavy('ร่อนลงพร้อมกัน')],src:SRC},
 {id:'wyvern',name:'ไวเวิร์นหางพิษ',power:470,hp:1300,asset:'mon.dire_wolf',pattern:[atk,sweep,heavy('สูดลมหายใจลึก'),{act:'heal'},{act:'enrage'}],src:SRC},
 {id:'iron_colossus',name:'ยักษ์เหล็กเกต',power:480,hp:1400,armor:0.45,asset:'mon.golem',pattern:[guard,heavy('ยกกำปั้นเหล็ก'),atk,heavy('แกนอกเรืองแดง')],src:SRC},
 {id:'shadow_stalker',name:'นักล่าเงา',power:460,hp:1100,armor:0.15,asset:'mon.dire_wolf',pattern:[atk,shield('ร่างจางลง'),heavy('หายไปข้างหลัง'),atk],src:SRC},
 {id:'lich_adept',name:'ลิชฝึกหัด',power:450,hp:1150,asset:'mon.gate_boss',pattern:[drain,summon('skel_w'),shield('อักขระวนรอบตัว'),atk,{act:'enrage'}],src:SRC},
 {id:'abyss_hound',name:'สุนัขก้นเหว',power:300,hp:600,asset:'mon.dire_wolf',pattern:[atk,atk,heavy('ขย้ำ')],src:SRC},
 {id:'abyss_knight',name:'อัศวินก้นเหว',power:600,hp:2200,armor:0.3,asset:'mon.gate_boss',pattern:[atk,shield('ยกโล่ดำ'),heavy('ดาบลุกเป็นไฟ'),sweep,summon('abyss_hound'),{act:'enrage'}],src:SRC},
 {id:'gate_hydra',name:'ไฮดราเกตแดง',power:680,hp:2600,armor:0.15,asset:'mon.gate_boss',pattern:[sweep,{act:'heal'},heavy('หัวทั้งห้าง้างพร้อมกัน'),summon('abyss_hound'),sweep,{act:'enrage'}],src:SRC},
 {id:'rogue_crew',name:'ทีมฮันเตอร์นอกกฎหมาย',power:500,hp:1300,swarm:0.2,asset:'mon.goblin',pattern:[atk,guard,heavy('ประสานโจมตี'),sweep],src:SRC},
 {id:'archive_warden',name:'ผู้คุมหอจดหมายเหตุจมน้ำ',power:560,hp:1900,armor:0.25,asset:'mon.golem',pattern:[drain,shield('หน้ากระดาษลอยรอบตัว'),heavy('คลื่นน้ำดำ'),summon('skel_w'),{act:'enrage'}],src:SRC});
// ---- อุปกรณ์และวัตถุดิบ ----
patch(H.items,'fang_blade_b',{upgrade:{max:5,cost:2000,grow:1.5,per:{power:20}}});
patch(H.items,'scale_armor_b',{upgrade:{max:5,cost:1800,grow:1.5,per:{hp:40}}});
H.items.push(
 {id:'stormsteel_blade_b',name:'ดาบเหล็กพายุเกรด B',slot:'weapon',rank:'B',power:175,price:9000,req:{rank:{min:'B'}},upgrade:{max:5,cost:2500,grow:1.5,per:{power:24}},src:SRC},
 {id:'colossus_plate_b',name:'เกราะแกนยักษ์เหล็กเกรด B',slot:'armor',rank:'B',hp:620,price:9500,req:{rank:{min:'B'}},upgrade:{max:5,cost:2200,grow:1.5,per:{hp:45}},src:SRC},
 {id:'seeker_charm_b',name:'เครื่องรางผู้แสวงหาเกรด B',slot:'accessory',rank:'B',power:25,mp:40,price:6000,req:{rank:{min:'B'}},upgrade:{max:5,cost:1600,grow:1.5,per:{power:6,mp:6}},src:SRC},
 {id:'hydra_fang_spear_b',name:'หอกเขี้ยวไฮดรา',slot:'weapon',rank:'B',power:205,price:0,req:{rank:{min:'B'}},upgrade:{max:5,cost:2800,grow:1.5,per:{power:26}},src:SRC},
 {id:'wyvern_scale',name:'เกล็ดไวเวิร์น',price:400,src:SRC},{id:'colossus_core',name:'แกนยักษ์เหล็ก',price:900,src:SRC},
 {id:'ancient_relic',name:'วัตถุโบราณจากดันเจี้ยน',price:500,src:SRC},{id:'archive_page',name:'หน้ากระดาษจากหอจดหมายเหตุ',price:0,src:SRC});
// ---- สกิลแรงก์ B ----
H.skills.push(
 {id:'piercing_thrust',name:'แทงเจาะเกราะ',type:'active',act:'damage',mp:10,cd:2,mult:1.9,pierce:true,maxLv:5,power:20,unlock:{rank:{min:'B'}},src:SRC},
 {id:'blade_storm',name:'พายุคมดาบ',type:'active',act:'damage',mp:14,cd:3,mult:1.5,target:'all',maxLv:5,power:25,unlock:{all:[{rank:{min:'B'}},{statTotal:{min:300}}]},src:SRC},
 {id:'guardian_aura',name:'ออร่าผู้พิทักษ์',type:'support',act:'heal',mp:10,cd:3,heal:0.25,maxLv:5,synergy:{role:'tank',bonus:0.3},unlock:{all:[{rank:{min:'B'}},{partySize:{min:1}}]},src:SRC},
 {id:'second_wind',name:'ลมหายใจที่สอง',type:'passive',pct:0.03,maxLv:5,unlock:{all:[{rank:{min:'B'}},{stat:{vit:{min:60}}}]},src:SRC});
// ---- กิจกรรม: ซื้อของ/เรียนสกิล/ขายของ ----
const act=(id,at,title,text,effects,o={})=>Object.assign({id,title,trigger:'action',at,cost:{ap:1},text,choices:[{text:'ทำ',ok:{text,effects}}],src:SRC},o);
const buy=(id,name,price)=>act('buy_'+id,'market','ซื้อ'+name+' ('+price+')','ท่านซื้อ'+name+'แล้ว',[{money:-price},{item:{id}}],{cost:{ap:0},cat:'shop',when:{all:[{rank:{min:'B'}},{money:{min:price}},{not:{item:{id}}}]}});
const learn=(id,name,price,at='gym')=>act('learn_'+id,at,'เรียน'+name+' ('+price+')','ท่านฝึก'+name+'จนใช้ได้',[{money:-price},{learnSkill:id}],{cat:'training',when:{all:[{rank:{min:'B'}},{money:{min:price}},{not:{skillLv:{id,min:1}}}].concat((H.skills.find(k=>k.id===id)||{}).unlock||[])}});
H.events=H.events.concat([
 buy('stormsteel_blade_b','ดาบเหล็กพายุเกรด B',9000),buy('colossus_plate_b','เกราะแกนยักษ์เหล็กเกรด B',9500),buy('seeker_charm_b','เครื่องรางผู้แสวงหาเกรด B',6000),
 learn('piercing_thrust','แทงเจาะเกราะ',3000),learn('blade_storm','พายุคมดาบ',4500),learn('guardian_aura','ออร่าผู้พิทักษ์',3500,'hospital'),learn('second_wind','ลมหายใจที่สอง',4000),
 act('sell_relic','city','ขายวัตถุโบราณ (+500)','นักสะสมรับซื้อโดยไม่ต่อราคา',[{item:{id:'ancient_relic',n:-1}},{money:500}],{cost:{ap:0},cat:'sell',when:{item:{id:'ancient_relic'}}}),
 act('sell_b_mats','city','ขายวัตถุดิบเกรด B','ศูนย์วิจัยรับซื้อเกล็ดและแกนเกรด B',[{item:{id:'wyvern_scale',n:-1}},{money:400}],{cost:{ap:0},cat:'sell',when:{item:{id:'wyvern_scale'}}}),
 act('sell_colossus_core','city','ขายแกนยักษ์เหล็ก (+900)','บริษัทวัสดุรับซื้อทันที',[{item:{id:'colossus_core',n:-1}},{money:900}],{cost:{ap:0},cat:'sell',when:{item:{id:'colossus_core'}}}),
]);
// ---- ภารกิจแรงก์ B ----
const reg={worldFlag:'registered'},B={rank:{min:'B'}};
const help={name:'ทีมจู่โจมของสมาคม',cost:0,damage:0.3};
H.missions.push(
 // ทั่วไป (auto)
 {id:'b_escort_caravan',name:'คุ้มกันขบวนขนแกนมานาข้ามเขตเกต',rank:'B',at:'association',enemy:'harpy_flock',when:{all:[reg,B]},win:[{money:1300},{exp:700},{reputation:2}],tags:['rank_b','escort'],src:SRC},
 {id:'b_hunt_wyvern',name:'ล่าไวเวิร์นหางพิษ',rank:'B',at:'gate_zone',enemy:'wyvern',when:B,win:[{money:1500},{exp:850},{item:{id:'wyvern_scale',n:2}}],tags:['rank_b'],src:SRC},
 {id:'b_rogue_crew',name:'ไล่จับทีมฮันเตอร์นอกกฎหมาย',rank:'B',at:'association',enemy:'rogue_crew',when:{all:[reg,B]},win:[{money:1700},{exp:900},{karma:3},{merit:3}],lose:[{reputation:-2}],tags:['rank_b'],src:SRC},
 // บอส (manual, เสี่ยงสูง)
 {id:'b_colossus_gate',name:'เกตแรงก์ B: ยักษ์เหล็ก',rank:'B',at:'gate_zone',enemy:'iron_colossus',mode:'manual',risk:'high',help,when:B,
  win:[{money:2600},{exp:1200},{item:{id:'colossus_core'}}],retreat:[{reputation:-1}],tags:['rank_b','boss'],src:SRC},
 {id:'b_lich_trace',name:'สืบร่องรอยลิชในเขตร้าง',rank:'B',at:'association',enemy:'lich_adept',mode:'manual',risk:'high',help,when:{all:[reg,B]},
  win:[{money:2000},{exp:1100},{flag:'lich_traced'},{item:{id:'archive_page'}}],retreat:[{reputation:-1}],tags:['rank_b','boss'],src:SRC},
 // สายทีม: Raid ต้องมีทีมอย่างน้อย 2 คน
 {id:'b_raid_hydra',name:'Raid: ไฮดราเกตแดง (ต้องมีทีม 2 คนขึ้นไป)',rank:'B',at:'association',enemy:'gate_hydra',mode:'manual',risk:'high',help,when:{all:[reg,B,{partySize:{min:2}}]},
  win:[{money:5200},{exp:2400},{reputation:10},{item:{id:'hydra_fang_spear_b'}}],retreat:[{reputation:-2}],tags:['rank_b','rank_b','boss','raid'],src:SRC},
 // สายเดี่ยว: ค่าหัวรับได้เฉพาะคนที่ไม่มีทีม (ไม่ต้องแบ่งเงิน แต่ไม่มีใครช่วย)
 {id:'b_bounty_stalker',name:'ค่าหัว: นักล่าเงา (กระดานค่าหัว เฉพาะคนที่ไม่มีทีม)',rank:'B',at:'association',merit:-3,enemy:'shadow_stalker',mode:'manual',risk:'high',when:{all:[reg,B,{partySize:{max:0}},{any:[{flag:'bounty_board'},{guildStanding:{id:'ironfang',min:20}}]}]},
  win:[{money:3400},{exp:1500},{reputation:4}],retreat:[{reputation:-1}],tags:['rank_b','boss','bounty'],src:SRC},
 // ผลงานกับสมาคม: งานลาดตระเวนสำหรับฮันเตอร์อาวุโสของสมาคม
 {id:'assoc_senior_patrol',name:'ลาดตระเวนเขตเกตให้สมาคม (ฮันเตอร์อาวุโส)',rank:'C',at:'association',enemy:'rogue_crew',merit:4,when:{all:[reg,{rank:{min:'C'}},{merit:{min:180}}]},win:[{money:1800},{exp:800},{reputation:2}],tags:['rank_c','rank_b'],src:SRC},
 // สัญญากิลด์ (ต้องเป็นสมาชิกกิลด์หรือมีความเชื่อถือ 20+)
 {id:'gc_northstar_relief',name:'สัญญากิลด์ดาวเหนือ: กู้ภัยเกตแตก',rank:'B',at:'association',enemy:'harpy_flock',when:{all:[B,{any:[{worldFlag:'guild_northstar'},{guildStanding:{id:'northstar',min:20}}]},{partySize:{min:1}}]},
  win:[{money:2000},{exp:900},{guildStanding:{id:'northstar',n:3}},{reputation:3}],tags:['rank_b','guild'],src:SRC},
 {id:'gc_ironfang_hunt',name:'สัญญากิลด์เขี้ยวเหล็ก: ล่าเดี่ยวไวเวิร์น',rank:'B',at:'gate_zone',enemy:'wyvern',when:{all:[B,{any:[{worldFlag:'guild_ironfang'},{guildStanding:{id:'ironfang',min:20}}]}]},
  win:[{money:2100},{exp:1000},{guildStanding:{id:'ironfang',n:3}},{item:{id:'wyvern_scale'}}],tags:['rank_b','guild'],src:SRC},
 {id:'gc_silver_survey',name:'สัญญากิลด์มังกรเงิน: สำรวจเกตใหม่',rank:'B',at:'gate_zone',enemy:'shadow_stalker',when:{all:[B,{any:[{worldFlag:'guild_silverdragon'},{guildStanding:{id:'silverdragon',min:20}}]},{discoveries:{min:3}}]},
  win:[{money:1900},{exp:1000},{guildStanding:{id:'silverdragon',n:3}},{item:{id:'ancient_relic'}}],tags:['rank_b','guild'],src:SRC});
// ---- ดันเจี้ยนแรงก์ B ----
H.dungeons.push(
 {id:'abyss_gate',name:'เกตก้นเหว',rank:'B',tags:['rank_b','rank_b','dungeon'],at:'gate_zone',floors:4,rooms:3,difficulty:1,mutate:0.1,apCost:1,when:B,
  groups:[{id:'hounds',enemies:[{enemy:'abyss_hound'},{enemy:'abyss_hound'}],weight:3},{id:'harpies',enemies:[{enemy:'harpy_flock',mult:0.7}],weight:2},{id:'lich',enemies:[{enemy:'lich_adept',mult:0.6}],weight:1,minFloor:2}],
  events:['dg_abyss_whisper','dg_fallen_team','dg_glowing_moss'],boss:{enemy:'abyss_knight',mult:1,risk:'high',help:{name:'ทีมกู้ภัยสมาคม',cost:0,damage:0.3}},
  rewards:{room:[{money:220},{exp:200}],treasure:[{item:{id:'wyvern_scale'}},{money:400}],floor:[{exp:250}],clear:[{item:{id:'colossus_core'}},{reputation:6}]},rules:{keepOnFail:0.4},
  finds:[{id:'abyss_map',name:'แผนที่ทางลัดก้นเหว',chance:0.25,effects:[{flag:'abyss_map'}]},{id:'abyss_relic',name:'ตราประจำทีมที่หายสาบสูญ',chance:0.2,minFloor:1,effects:[{item:{id:'ancient_relic',n:2}},{reputation:2}]},
   {id:'abyss_manual',name:'บันทึกท่าดาบของฮันเตอร์รุ่นก่อน',chance:0.15,minFloor:2,effects:[{practice:10}]}],src:SRC},
 // ซ่อนอยู่: เปิดเมื่อค้นพบในดันเจี้ยนครบ 4 ชิ้น หรือได้เบาะแสจากภารกิจลิช (เส้นทางนักสำรวจ)
 {id:'drowned_archive',name:'หอจดหมายเหตุจมน้ำ (ซ่อนอยู่)',rank:'B',tags:['rank_b','rank_b','dungeon'],at:'city',floors:3,rooms:4,difficulty:1,mutate:0.12,apCost:1,
  when:{all:[{rank:{min:'B'}},{any:[{discoveries:{min:4}},{flag:'lich_traced'}]}]},
  groups:[{id:'drowned',enemies:[{enemy:'skel_w',mult:1.6},{enemy:'skel_a',mult:1.2}],weight:3},{id:'stalker',enemies:[{enemy:'shadow_stalker',mult:0.7}],weight:1,minFloor:1}],
  events:['dg_archive_shelf','dg_abyss_whisper'],boss:{enemy:'archive_warden',mult:1,risk:'high',help:{name:'ทีมกู้ภัยสมาคม',cost:0,damage:0.3}},roomWeights:{fight:4,event:2,rest:1,treasure:3},
  rewards:{room:[{money:180},{exp:180}],treasure:[{item:{id:'ancient_relic'}},{money:300}],floor:[{exp:220}],clear:[{item:{id:'seeker_charm_b'}},{reputation:5}]},rules:{keepOnFail:0.5},
  finds:[{id:'archive_index',name:'สารบัญหอจดหมายเหตุ',chance:0.3,effects:[{stat:{int:3}}]},{id:'archive_gate_notes',name:'บันทึกการเปิดเกตยุคแรก',chance:0.2,minFloor:1,effects:[{flag:'gate_notes'},{item:{id:'archive_page',n:2}}]},
   {id:'archive_mana_text',name:'ตำราวงจรมานาโบราณ',chance:0.15,minFloor:2,effects:[{mana:5}]}],src:SRC});
// การค้นพบในดันเจี้ยนเดิม (สายนักสำรวจเติบโตได้ตั้งแต่แรงก์ต่ำ)
patch(H.dungeons,'sewer_nest',{finds:[{id:'sewer_relic',name:'เหรียญเก่าในตะกอน',chance:0.25,effects:[{item:{id:'ancient_relic'}}]},{id:'sewer_map',name:'ผังท่อระบายน้ำดั้งเดิม',chance:0.2,effects:[{stat:{int:1}}]}]});
patch(H.dungeons,'goblin_warren',{finds:[{id:'goblin_totem',name:'โทเท็มเผ่าก็อบลิน',chance:0.2,minFloor:1,effects:[{item:{id:'ancient_relic'}}]},{id:'goblin_tactics',name:'ภาพวาดยุทธวิธีบนผนัง',chance:0.2,effects:[{practice:4}]}]});
patch(H.dungeons,'red_ruins',{finds:[{id:'ruins_inscription',name:'จารึกก่อนเกตแดง',chance:0.2,minFloor:1,effects:[{stat:{int:2}},{item:{id:'ancient_relic'}}]},{id:'ruins_vault',name:'ห้องเก็บของที่ถูกลืม',chance:0.15,minFloor:2,effects:[{item:{id:'ancient_relic',n:2}}]}]});
patch(H.dungeons,'abandoned_subway',{finds:[{id:'subway_logbook',name:'สมุดบันทึกนายสถานี',chance:0.3,effects:[{item:{id:'ancient_relic'}},{flag:'subway_logbook'}]}]});
// ---- เหตุการณ์ ----
const ev=(o)=>Object.assign({src:SRC},o);
const dev=(id,title,text,choices)=>({id,title,trigger:'dungeon',text,choices,src:SRC});
H.events=H.events.concat([
 // เลื่อนแรงก์ B: เลือกทิศทาง (ไม่ถาวร ทุกเส้นทางยังเปิดอยู่)
 ev({id:'b_promotion',title:'พิธีรับรองฮันเตอร์แรงก์ B',trigger:'enter',at:'association',once:true,priority:40,when:{rank:{min:'B'}},
  text:'ประธานสาขามอบตราแรงก์ B ให้ท่านต่อหน้าฮันเตอร์ทั้งสมาคม หลังพิธีมีคนสามกลุ่มรอคุยกับท่าน',choices:[
  {text:'คุยกับฝ่ายปฏิบัติการของสมาคม',ok:{text:'สมาคมจดชื่อท่านเป็นผู้รับงานลำดับต้น',effects:[{merit:20},{reputation:2}]}},
  {text:'คุยกับตัวแทนกิลด์ทั้งสาม',ok:{text:'ทั้งสามกิลด์ยื่นนามบัตรให้ และบอกว่าประตูเปิดเสมอ',effects:[{guildStanding:{id:'northstar',n:5}},{guildStanding:{id:'ironfang',n:5}},{guildStanding:{id:'silverdragon',n:5}}]}},
  {text:'ขอตัวกลับ ฮันเตอร์อิสระไม่ต้องการเจ้านาย',ok:{text:'นายหน้าค่าหัวคนหนึ่งเดินตามออกมา ยื่นรายชื่อเป้าหมายให้',effects:[{flag:'bounty_board'},{trait:{brave:3}}]}}]}),
 ev({id:'b_media_interview',title:'สัมภาษณ์ฮันเตอร์แรงก์ B',trigger:'month',cooldown:24,weight:2,when:{all:[{rank:{min:'B'}},{reputation:{min:40}}]},
  text:'สถานีข่าวขอสัมภาษณ์ท่านสั้น ๆ เรื่องเกตล่าสุด',choices:[
  {text:'ให้เครดิตทีมและสมาคม',ok:{text:'คลิปถูกแชร์ในหมู่ฮันเตอร์รุ่นใหม่',effects:[{reputation:3},{karma:2}]}},
  {text:'เล่าวีรกรรมของตัวเองเต็มที่',check:{stat:'cha',dc:'mid'},ok:{text:'ยอดผู้ชมพุ่ง สปอนเซอร์ติดต่อมา',effects:[{reputation:5},{money:800}]},fail:{text:'คนดูมองว่าท่านขี้โม้',effects:[{reputation:-2}]}},
  {text:'ปฏิเสธ',ok:{text:'ท่านเดินผ่านกล้องไปเงียบ ๆ',effects:[]}}]}),
 ev({id:'b_rival_spar',title:'คำท้าจากคู่แข่งเก่า',trigger:'month',cooldown:18,weight:2,who:{npc:'rival_hunter',alive:true},when:{rank:{min:'B'}},
  text:'{who}มาหาที่สมาคม "แรงก์ B แล้วสินะ ลองดูว่าเปลี่ยนไปแค่ตัวอักษรหรือเปล่า"',choices:[
  {text:'รับคำท้า',fight:{enemy:'b_rank_hunter',mult:0.9},ok:{text:'{who}ยอมรับผลแพ้ แล้วยิ้มครั้งแรกในรอบหลายปี',effects:[{rel:{npc:'$who',n:8}},{reputation:2}]},fail:{text:'{who}ชนะ แต่ยื่นมือมาดึงท่านขึ้น',effects:[{rel:{npc:'$who',n:4}}]}},
  {text:'ชวนไปทำภารกิจด้วยกันแทน',ok:{text:'{who}ไม่ตอบ แต่มารอที่สมาคมเช้าวันรุ่งขึ้น',effects:[{rel:{npc:'$who',n:5}},{npcFlag:{npc:'$who',flag:'party'}}]}},
  {text:'ไม่สนใจ',ok:{text:'{who}เดินจากไปพร้อมเสียงจิ๊ปาก',effects:[{rel:{npc:'$who',n:-3}}]}}]}),
 ev({id:'b_team_share',title:'ทีมขอปรับส่วนแบ่ง',trigger:'month',cooldown:24,weight:2,who:{party:true},when:{all:[{rank:{min:'B'}},{partySize:{min:2}}]},
  text:'{who}พูดแทนทีม "งานแรงก์ B เสี่ยงขึ้น พวกเราขอส่วนแบ่งเพิ่มอีกนิด"',choices:[
  {text:'จ่ายโบนัสพิเศษให้ทีมครั้งนี้ (1500)',when:{money:{min:1500}},lockText:'เงินไม่พอ',ok:{text:'ทีมทำงานอย่างตั้งใจขึ้นชัดเจน',effects:[{money:-1500},{relx:{npc:'$who',aff:8,trust:6}}]}},
  {text:'อธิบายว่าค่าใช้จ่ายของทีมก็เพิ่มขึ้น',check:{stat:'cha',dc:'mid'},ok:{text:'{who}พยักหน้า "งั้นก็ยุติธรรม"',effects:[{relx:{npc:'$who',trust:4}}]},fail:{text:'{who}ไม่พอใจ แต่ยังอยู่ในทีม',effects:[{relx:{npc:'$who',aff:-6,trust:-4}}]}},
  {text:'ปฏิเสธ',ok:{text:'บรรยากาศในทีมตึงเครียด',effects:[{relx:{npc:'$who',aff:-10,trust:-6}}]}}]}),
 ev({id:'b_kid_fan',title:'แฟนตัวน้อย',trigger:'month',cooldown:24,weight:1,when:{rank:{min:'B'}},
  text:'เด็กชายคนหนึ่งยื่นสมุดให้ท่านเซ็น "โตขึ้นผมจะเป็นฮันเตอร์แรงก์ B แบบพี่"',choices:[
  {text:'เซ็นให้และคุยด้วย',ok:{text:'แม่ของเด็กโค้งขอบคุณหลายครั้ง',effects:[{karma:3},{reputation:1}]}},
  {text:'รีบเซ็นแล้วไป',ok:{text:'ท่านมีภารกิจรออยู่',effects:[]}}]}),
 ev({id:'b_association_audit',title:'สมาคมตรวจสอบประวัติ',trigger:'month',cooldown:24,weight:3,when:{all:[{rank:{min:'B'}},{heat:{min:20}}]},
  text:'ฝ่ายตรวจสอบเรียกฮันเตอร์แรงก์ B ทุกคนที่มีชื่อในรายงานตลาดมืดมาสัมภาษณ์',choices:[
  {text:'ให้ความร่วมมือเต็มที่',ok:{text:'ท่านถูกตักเตือน แต่ไม่ถูกลงโทษ',effects:[{heat:-15},{merit:-10},{reputation:-2}]}},
  {text:'ปิดบังข้อมูล',check:{stat:'int',dc:'hard'},ok:{text:'เอกสารของท่านไม่มีช่องโหว่',effects:[{heat:-5}]},fail:{text:'ผู้ตรวจจับได้ว่าท่านโกหก',effects:[{merit:-30},{reputation:-6},{heat:10}]}}]}),
 ev({id:'b_lich_hint',title:'เบาะแสจากหน้ากระดาษ',trigger:'enter',at:'city',once:true,when:{all:[{flag:'lich_traced'},{rank:{min:'B'}}]},
  text:'หน้ากระดาษที่ได้จากลิชมีแผนผังอาคารใต้น้ำแถวท่าเรือเก่า',choices:[
  {text:'จดตำแหน่งไว้',ok:{text:'ท่านรู้แล้วว่าทางเข้าหอจดหมายเหตุอยู่ที่ไหน',effects:[{flag:'archive_known'}]}}]}),
 // ห้องเหตุการณ์ในดันเจี้ยน B
 dev('dg_abyss_whisper','เสียงกระซิบจากก้นเหว','เสียงเรียกชื่อท่านดังมาจากความมืด',[
  {text:'ตะโกนกลับให้ทีมได้ยิน',ok:{text:'ทุกคนตั้งสติได้',effects:[{hpPct:0.05}]}},
  {text:'เดินตามเสียง',check:{stat:'int',dc:'hard'},ok:{text:'ท่านพบห้องลับ',effects:[{item:{id:'ancient_relic'}}]},fail:{text:'ท่านหลงทางและบาดเจ็บ',effects:[{hp:-60}]}}]),
 dev('dg_fallen_team','ทีมที่ไม่ได้กลับไป','ป้ายชื่อของทีมฮันเตอร์ที่หายไปเมื่อปีก่อนตกอยู่บนพื้น',[
  {text:'เก็บป้ายชื่อไปคืนสมาคม',ok:{text:'สมาคมจะได้แจ้งครอบครัวของพวกเขา',effects:[{karma:3},{merit:2}]}},
  {text:'ค้นของในเป้',ok:{text:'ท่านได้ของใช้ที่ยังดีอยู่',effects:[{money:300},{karma:-2}]}}]),
 dev('dg_archive_shelf','ชั้นหนังสือที่ไม่เปียก','ชั้นหนังสือหนึ่งยังแห้งสนิทกลางห้องที่น้ำท่วม',[
  {text:'อ่านอย่างระวัง',check:{stat:'int',dc:'mid'},ok:{text:'ท่านเข้าใจวงจรมานามากขึ้น',effects:[{mana:2}]},fail:{text:'หน้ากระดาษสลายในมือ',effects:[]}},
  {text:'เก็บใส่กระเป๋าทั้งเล่ม',ok:{text:'หนังสือหนักกว่าที่คิด',effects:[{item:{id:'archive_page'}}]}}]),
]);
})(globalThis.AW);
