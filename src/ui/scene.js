// Location Scene component (Phase 7A): เลือกภาพฉากจากสถานที่/กิจกรรมปัจจุบัน แล้ววาดลง canvas 16:9 (576x324)
// ภาพมาจาก asset manifest ทั้งหมด: ใส่ src+license ใน data/assets/manifest.js แล้วฉากเปลี่ยนเป็นภาพจริงเอง ไม่ต้องแก้ไฟล์นี้
(function(AW){
'use strict';
const U=AW.ui.u;
// ฉากพิเศษ (ไม่ได้มาจาก location.bg): ใช้เมื่ออยู่ในดันเจี้ยน/หอคอย/การต่อสู้
const SPECIAL={dungeon:'bg.dungeon_cave',dungeonB:'bg.dungeon_ruins',combat:'bg.gate_red',night:'bg.city_night'};
function sceneOf(E){const p=E.player.get(),w=p.location.world||E.worlds.current,c=w&&E.worlds.ctx(w);
 if(!c)return{asset:'hunter.bg.city_day',title:'-',sub:''};const ns=c.def.assetNs,loc=c.locations.get(p.location.loc)||c.locations.get(c.def.entry);
 const slot=E.npcs&&p.created?E.npcs.clock(w).slot:'day',run=E.dungeon&&E.dungeon.run();let asset=ns+'.'+loc.bg,title=loc.name,sub=U.SLOT[slot]||'';
 if(run&&run.status==='active'){const g=E.dungeon.def(run.dungeon);asset=ns+'.'+(g&&'BAS'.includes(g.rank)?SPECIAL.dungeonB:SPECIAL.dungeon);title=g?g.name:title;sub='ดันเจี้ยน'}
 else if(E.combat&&E.combat.session()&&E.combat.session().status==='active')asset=ns+'.'+SPECIAL.combat;
 else if((slot==='evening'||slot==='night')&&loc.bg==='bg.city_day'&&E.assets.defs.has(ns+'.'+SPECIAL.night))asset=ns+'.'+SPECIAL.night;
 return{asset,title,sub,desc:loc.desc||'',world:c.def.name}}
function html(E){const s=sceneOf(E);return `<div class="scene" id="scene" data-asset="${U.esc(s.asset)}" data-title="${U.esc(s.title)}"><canvas id="stage" width="576" height="324" aria-label="${U.esc(s.title)}"></canvas>
 <span class="tag badge blue">${U.esc(s.world)}</span><div class="cap"><b>${U.esc(s.title)}</b> <span class="muted">· ${U.esc(s.sub)}</span>${s.desc?`<div class="muted" style="font-size:13px">${U.esc(s.desc)}</div>`:''}</div></div>`}
// ยังไม่มีภาพจริง: วาดฉากชั่วคราวตามธีม (ขนาด 576x324 เท่าภาพจริง) พร้อมรหัส asset ที่ต้องสร้างใน Phase 7B
function placeholder(g,id,title){const gr=g.createLinearGradient(0,0,576,324);gr.addColorStop(0,'#14204a');gr.addColorStop(.6,'#22164a');gr.addColorStop(1,'#0b0f1a');g.fillStyle=gr;g.fillRect(0,0,576,324);
 g.strokeStyle='rgba(76,195,255,.12)';g.lineWidth=1;for(let x=0;x<=576;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,324);g.stroke()}for(let y=0;y<=324;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(576,y);g.stroke()}
 g.fillStyle='rgba(10,14,26,.55)';g.beginPath();g.moveTo(0,250);for(let x=0;x<=576;x+=48)g.lineTo(x,200+((x*7)%60));g.lineTo(576,324);g.lineTo(0,324);g.fill();
 g.fillStyle='rgba(242,193,78,.85)';g.font='12px monospace';g.fillText('PLACEHOLDER · '+id+' · 576x324',12,20);g.fillStyle='rgba(232,235,245,.25)';g.font='bold 28px sans-serif';g.fillText(title,12,60)}
function draw(){const cv=U.$('#stage'),el=U.$('#scene');if(!cv||!el)return;const E=AW.engine,g=cv.getContext('2d'),id=el.dataset.asset,d=E.assets.defs.get(id);g.imageSmoothingEnabled=false;g.clearRect(0,0,576,324);
 if(AW.ui.assets.ready(id))g.drawImage(E.assets.get(id),0,0,576,324);else placeholder(g,id,el.dataset.title||'');// ระหว่างโหลด/ไฟล์หาย = ฉากชั่วคราว
 const ch=E.assets.defs.get('shared.char.base_m');if(E.player.get().created&&ch&&AW.ui.assets.ready('shared.char.base_m'))g.drawImage(E.assets.get('shared.char.base_m'),248,250,80,64)}
AW.ui.scene={sceneOf,html,draw,SPECIAL};
})(globalThis.AW);
