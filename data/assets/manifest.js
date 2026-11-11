// Asset Manifest: รายการภาพที่เกมต้องใช้ แยกตามโลก
// src:null = ยังไม่มีไฟล์ เกมจะแสดง placeholder · candidate = ไฟล์ที่มีอยู่แล้วในเกมเดิมที่อาจใช้ได้ (ต้องยืนยันก่อนนำมาใช้)
// license ต้องเป็นค่าที่ยืนยันแล้ว (own, cc0, cc-by, craftpix-free, gandalfhardcore, licensed) จึงจะแสดงภาพจริง
(function(AW){const A=(world,kind,list,w,h,extra={})=>list.map(id=>({id:world+'.'+kind+'.'+id,world,kind,w,h,src:null,license:null,...extra}));
AW.data.assets.push(
 // ---------- ใช้ร่วมทุกโลก ----------
 ...A('shared','ui',['frame','button','tab','panel','badge_rank','icon_gold','icon_time','icon_world'],64,64),
 ...A('shared','char',['base_m','base_f'],80,64,{frames:55,note:'ร่างโมดูลาร์ 7 ท่า เฟรม 80x64 (ต่อยอดระบบชั้นจากเกมเดิม)'}),
 ...A('shared','fx',['hit','crit','heal','portal_open','portal_close'],128,128,{frames:8}),
 // ---------- Modern Hunter ----------
 ...A('hunter','bg',['city_day','city_night','association_hall','guild_office','hunter_hospital','market','training_center','danger_zone','apartment','gov_base','industrial'],576,324,{layers:6}),
 ...A('hunter','bg',['gate_blue','gate_red','dungeon_cave','dungeon_ruins'],576,324,{layers:6}),
 ...A('hunter','outfit',['street','hunter_f','hunter_c','hunter_a','hunter_s','suit','medic','gov_agent'],80,64,{frames:55}),
 ...A('hunter','mon',['goblin','orc','dire_wolf','golem','gate_boss'],128,128,{frames:20}),
 ...A('hunter','item',['potion','mana_stone','core_e','core_s','phone','id_card'],32,32),
 // ---------- Fantasy / Demon Realm ----------
 ...A('fantasy','bg',['forest','town','castle','temple','tavern','demon_castle'],576,324,{layers:6}),
 ...A('fantasy','outfit',['tunic','robe','armor','noble','priest'],80,64,{frames:55}),
 ...A('fantasy','mon',['slime','skeleton','wolf','general_rat','general_frost','general_necro','demon_lord'],128,128,{frames:20}),
 // ---------- Martial World / Murim ----------
 ...A('murim','bg',['mountain_sect','clan_manor','inn','market_town','bamboo_forest','cliff_cave','arena'],576,324,{layers:6}),
 ...A('murim','outfit',['disciple','elder','clan_heir','wanderer','assassin','beggar'],80,64,{frames:55}),
 ...A('murim','wep',['sword','saber','spear','fan','fist_wrap'],80,64,{frames:55}),
 ...A('murim','mon',['bandit','demonic_cultist','tiger','sect_master'],128,128,{frames:20}),
);
// ไฟล์จากเกมเดิมที่อาจนำมาใช้ (ยังไม่ผูก ต้องอนุมัติก่อน)
AW.data.assetCandidates=[
 {for:'hunter.bg.city_day',file:'a/bg/awaken/*',source:'CraftPix.net (city skyline)',license:'craftpix-free'},
 {for:'hunter.bg.city_night',file:'a/bg/hospital/*',source:'CraftPix.net',license:'craftpix-free'},
 {for:'fantasy.bg.forest',file:'a/gh/c_n*.png',source:'GandalfHardcore',license:'gandalfhardcore'},
 {for:'shared.char.base_m',file:'a/gh/chars.png',source:'GandalfHardcore',license:'gandalfhardcore'},
 {for:'fantasy.mon.*',file:'a/m/*',source:'CraftPix.net',license:'craftpix-free'},
 {for:'fantasy.mon.general_*',file:'a/m2/rat|frost|necro|demonlord.png',source:'ไม่ทราบ',license:null},
];
})(globalThis.AW);
