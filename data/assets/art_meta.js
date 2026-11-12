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
 ui:{ratio:'-',w:null,h:null,format:'-',alpha:true,maxKB:0,folder:'ui',decision:true},
 // Phase 7B.3 gameplay pixel art (ART_BIBLE §Pixel gameplay): เฟรมตัวละคร 64x64 · ขนาดไฟล์แผ่นตาม metadata ของ asset (frame x จำนวนเฟรม)
 sprite:{ratio:'sheet',w:null,h:null,frame:64,format:'png',alpha:true,maxKB:200,folder:'sv',pixel:true},
 tileset:{ratio:'sheet',w:null,h:null,tile:16,format:'png',alpha:true,maxKB:120,folder:'tile',pixel:true}};
const KIND_TYPE={bg:'location',mon:'monster',item:'item',char:'sprite_sheet',outfit:'sprite_sheet',wep:'sprite_sheet',fx:'sprite_sheet',ui:'ui',portrait:'portrait',skill:'skill_icon',sv:'sprite',tile:'tileset'};
// P0 = ชุดนำร่อง · P1 = UI แสดงอยู่แล้ว · P2 = ข้อมูลอ้างแต่ UI ยังไม่แสดง · P3 = ต้องตัดสินใจ/ยังไม่มีโลก
const PILOT=['hunter.bg.apartment','hunter.bg.city_day','hunter.bg.association_hall','hunter.bg.school','hunter.bg.dungeon_cave','hunter.bg.gate_blue','fantasy.bg.forest','murim.bg.mountain_sect','shared.portrait.player_m','hunter.portrait.best_friend'];
const UI_NOW=new Set(['hunter.bg.city_night','hunter.bg.training_center','hunter.bg.market','hunter.bg.hunter_hospital','hunter.bg.gov_base','hunter.bg.industrial','hunter.bg.dungeon_ruins','hunter.bg.gate_red','fantasy.bg.town','fantasy.bg.castle']);
// asset ใหม่ที่ UI/ชุดนำร่องต้องใช้ (ลงทะเบียนเป็น placeholder ก่อน · ไม่มีไฟล์ปลอม)
AW.data.assets.push(
 {id:'hunter.bg.school',world:'hunter',kind:'bg',w:576,h:324,layers:1,src:null,license:null,note:'ฉากโรงเรียน ตอนนี้ location school ใช้ bg.city_day · เปลี่ยนการผูกต้องอนุมัติ (7B.2)'},
 {id:'shared.portrait.player_m',world:'shared',kind:'portrait',w:240,h:320,src:null,license:null,note:'ภาพอ้างอิงตัวเอกชาย ค่าเริ่มต้น (ระบบยังไม่มีการปรับรูปลักษณ์)'},
 {id:'shared.portrait.player_f',world:'shared',kind:'portrait',w:240,h:320,src:null,license:null,note:'ภาพอ้างอิงตัวเอกหญิง ค่าเริ่มต้น'},
 {id:'hunter.portrait.best_friend',world:'hunter',kind:'portrait',w:240,h:320,src:null,license:null,note:'ฮาจุน · รูปลักษณ์ยังไม่ได้กำหนดในข้อมูล ต้องอนุมัติก่อนสร้าง'});
// Phase 7B.3 side-view: sprite/tileset ใหม่ เป็น placeholder (ยังไม่ยืนยันสิทธิ์ภาพ game3/a จึงไม่ใช้) · เปลี่ยนเป็นไฟล์จริงได้ด้วยการใส่ src/license เท่านั้น
// frame = ขนาดเฟรมในไฟล์ · anchor = จุดเท้า (วางตรงพื้น) · bbox = กล่องชนในเฟรม (แยกจากขนาดภาพ) · anims: แถวในแผ่น จำนวนเฟรม fps วนซ้ำ
// ทุกค่าถูกใช้จริง: runtime ใช้ bbox.w,h เป็นกล่องชน และ anims.attack (frames/fps, hit) เป็นจังหวะโจมตี · view ใช้ frame/anchor/anims(row,frames,fps,loop) ตัดเฟรม · sheet ใช้ตรวจขนาดไฟล์
// ภาพเก่า 80x64 / 128px ใส่ได้ด้วย frame/anchor/bbox ของมันเอง เมื่อยืนยัน license แล้วเท่านั้น
const ANIMS={idle:{row:0,frames:4,fps:6,loop:true},walk:{row:1,frames:6,fps:10,loop:true},jump:{row:2,frames:2,fps:8,loop:false},fall:{row:3,frames:2,fps:8,loop:true},
 attack:{row:4,frames:5,fps:16,loop:false,hit:[2,3]},hurt:{row:5,frames:2,fps:10,loop:false},death:{row:6,frames:5,fps:8,loop:false}};
const {jump:_j,fall:_f,...GROUND_ANIMS}=ANIMS;// ศัตรูเดินพื้น: ไม่มีท่ากระโดด/ตก (view ใช้ idle แทน)
const SV=(id,world,note,o={})=>Object.assign({id,world,kind:'sv',w:64,h:64,src:null,license:null,note,frame:{w:64,h:64},anchor:{x:32,y:63},bbox:{x:22,y:20,w:20,h:44},anims:ANIMS,sheet:{cols:6,rows:7}},o);
// tileset: แผ่น cols x rows ช่อง · tiles = หมายเลขช่อง (นับซ้ายไปขวา บนลงล่าง) ที่ view ใช้จริง: top = ผิวบนของพื้น · fill = เนื้อพื้นใต้ผิว · platform = แผ่นทางเดียว
const TILE=(id,note)=>({id,world:'hunter',kind:'tile',w:16,h:16,src:null,license:null,note,tile:{w:16,h:16},sheet:{cols:8,rows:2},tiles:{top:0,fill:8,platform:1}});
AW.data.assets.push(
 SV('shared.sv.player_m','shared','ตัวเอกชาย side-view'),SV('shared.sv.player_f','shared','ตัวเอกหญิง side-view'),
 SV('hunter.sv.npc_m','hunter','NPC ชายทั่วไป (รวมฮาจุนจนกว่าจะมีรูปลักษณ์อนุมัติ)'),SV('hunter.sv.npc_f','hunter','NPC หญิงทั่วไป'),
 SV('hunter.sv.goblin','hunter','ก๊อบลิน side-view (ศัตรู hunter.goblins)',{bbox:{x:17,y:34,w:30,h:30},anims:GROUND_ANIMS}),
 TILE('hunter.tile.street','ถนน/ทางเท้า โรงเรียนและเมือง'),TILE('hunter.tile.gate','พื้นหินแตกในย่านเกต'));
for(const d of AW.data.assets){const type=KIND_TYPE[d.kind]||'ui',std=STD[type],name=d.id.split('.').slice(2).join('.');
 Object.assign(d,{type,std,priority:PILOT.includes(d.id)?'P0':UI_NOW.has(d.id)?'P1':std.decision||d.world==='murim'?'P3':'P2',
  status:d.src?'real':PILOT.includes(d.id)?'planned':'placeholder',version:0,
  path:std.decision?null:`assets/${d.world}/${std.folder}/${name}.v1.${std.format}`,
  gen:null});// gen = {tool,model,prompt,negative,seed,date,author,reviewedBy} ใส่เมื่อสร้างจริงเท่านั้น
}
AW.data.assetStandards=STD;AW.data.assetPilot=PILOT;
})(globalThis.AW);
