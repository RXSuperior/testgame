// Art metadata (Phase 7B.1): เพิ่มข้อมูลงานภาพให้ asset เดิมใน manifest (ไม่สร้าง registry ใหม่ ไม่ลบ placeholder)
// type/มาตรฐานไฟล์/priority/สถานะการสร้าง/ข้อมูล generation อยู่บน def เดียวกับที่ AssetRegistry ใช้
// w,h ของเดิม = ขนาดที่ UI วาด (logical) · std = ขนาดไฟล์ต้นฉบับที่ต้องส่งมอบ · ดู docs/phase7b/ASSET_PIPELINE.md
(function(AW){
// มาตรฐานไฟล์ต่อประเภท (ART_BIBLE §Asset standards)
const STD={
 location:{ratio:'16:9',w:1536,h:864,format:'webp',alpha:false,maxKB:450,folder:'bg'},
 portrait:{ratio:'3:4',w:1024,h:1365,format:'webp',alpha:false,maxKB:300,folder:'portrait'},
 fullbody:{ratio:'2:3',w:1024,h:1536,format:'png',alpha:true,maxKB:1200,folder:'char'},
 monster:{ratio:'3:4',w:1024,h:1365,format:'png',alpha:true,maxKB:900,folder:'mon'},
 item:{ratio:'1:1',w:1024,h:1024,format:'png',alpha:true,maxKB:300,folder:'item'},
 skill_icon:{ratio:'1:1',w:512,h:512,format:'webp',alpha:false,maxKB:80,folder:'skill'},
 skill_fx:{ratio:'1:1',w:1024,h:1024,format:'png',alpha:true,maxKB:600,folder:'fx'},
 // ชุดภาพเคลื่อนไหวแบบ pixel จากระบบเดิม: ไม่เข้ากับแนว manhwa ต้องตัดสินใจก่อนทำ (ไม่ลบ)
 sprite_sheet:{ratio:'sheet',w:null,h:null,format:'png',alpha:true,maxKB:600,folder:'sprite',decision:true},
 ui:{ratio:'-',w:null,h:null,format:'-',alpha:true,maxKB:0,folder:'ui',decision:true}};
const KIND_TYPE={bg:'location',mon:'monster',item:'item',char:'sprite_sheet',outfit:'sprite_sheet',wep:'sprite_sheet',fx:'sprite_sheet',ui:'ui',portrait:'portrait',skill:'skill_icon'};
// P0 = ชุดนำร่อง · P1 = UI แสดงอยู่แล้ว · P2 = ข้อมูลอ้างแต่ UI ยังไม่แสดง · P3 = ต้องตัดสินใจ/ยังไม่มีโลก
const PILOT=['hunter.bg.apartment','hunter.bg.city_day','hunter.bg.association_hall','hunter.bg.school','hunter.bg.dungeon_cave','hunter.bg.gate_blue','fantasy.bg.forest','murim.bg.mountain_sect','shared.portrait.player_m','hunter.portrait.best_friend'];
const UI_NOW=new Set(['hunter.bg.city_night','hunter.bg.training_center','hunter.bg.market','hunter.bg.hunter_hospital','hunter.bg.gov_base','hunter.bg.industrial','hunter.bg.dungeon_ruins','hunter.bg.gate_red','fantasy.bg.town','fantasy.bg.castle']);
// asset ใหม่ที่ UI/ชุดนำร่องต้องใช้ (ลงทะเบียนเป็น placeholder ก่อน · ไม่มีไฟล์ปลอม)
AW.data.assets.push(
 {id:'hunter.bg.school',world:'hunter',kind:'bg',w:576,h:324,layers:1,src:null,license:null,note:'ฉากโรงเรียน ตอนนี้ location school ใช้ bg.city_day · เปลี่ยนการผูกต้องอนุมัติ (7B.2)'},
 {id:'shared.portrait.player_m',world:'shared',kind:'portrait',w:240,h:320,src:null,license:null,note:'ภาพอ้างอิงตัวเอกชาย ค่าเริ่มต้น (ระบบยังไม่มีการปรับรูปลักษณ์)'},
 {id:'shared.portrait.player_f',world:'shared',kind:'portrait',w:240,h:320,src:null,license:null,note:'ภาพอ้างอิงตัวเอกหญิง ค่าเริ่มต้น'},
 {id:'hunter.portrait.best_friend',world:'hunter',kind:'portrait',w:240,h:320,src:null,license:null,note:'ฮาจุน · รูปลักษณ์ยังไม่ได้กำหนดในข้อมูล ต้องอนุมัติก่อนสร้าง'});
for(const d of AW.data.assets){const type=KIND_TYPE[d.kind]||'ui',std=STD[type],name=d.id.split('.').slice(2).join('.');
 Object.assign(d,{type,std,priority:PILOT.includes(d.id)?'P0':UI_NOW.has(d.id)?'P1':std.decision||d.world==='murim'?'P3':'P2',
  status:d.src?'real':PILOT.includes(d.id)?'planned':'placeholder',version:0,
  path:std.decision?null:`assets/${d.world}/${std.folder}/${name}.v1.${std.format}`,
  gen:null});// gen = {tool,model,prompt,negative,seed,date,author,reviewedBy} ใส่เมื่อสร้างจริงเท่านั้น
}
AW.data.assetStandards=STD;AW.data.assetPilot=PILOT;
})(globalThis.AW);
