// Side-view view (Phase 7B.3): canvas 576x324 (ขยายแบบ pixel) · HUD · ปุ่มสัมผัส · หน้าต่างคุย/เหตุการณ์
// วาดและรับ input เท่านั้น · กติกาทั้งหมดอยู่ใน AW.sv.Explore (src/sideview) ซึ่งเรียก API ระบบเดิม
// ภาพ: asset ใน Asset Registry ที่เป็นไฟล์จริง (มี license) และโหลดสำเร็จ วาดตาม metadata · ยังไม่มี/โหลดไม่ได้/ขนาดแผ่นผิด = placeholder แบบแบน (ลูปวาดไม่หยุด)
(function(AW){
'use strict';
const U=AW.ui.u,$=U.$,esc=U.esc,VW=576,VH=324,DT=1000/60;
// มือถือแนวตั้ง: มุมกล้องแคบลง (กว้างอย่างน้อย MINW พิกเซลโลก) แต่ขยายใหญ่ขึ้น · ขยายเป็นจำนวนเต็มของพิกเซลจอจริง (pixel perfect) · ไม่ยืดภาพ
const MINW=216,TOUCH='(hover:none),(pointer:coarse),(max-width:900px)';
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ArrowDown:'drop',KeyS:'drop',KeyJ:'attack',KeyK:'attack',KeyE:'interact'};
const V={vw:VW,scale:0,portrait:false,rt:null,raf:0,acc:0,last:0,held:new Set(),press:new Set(),panel:null,frames:0,ms:0,calls:0,anim:new WeakMap(),sheet:new WeakMap(),warned:new Set()};
const E=()=>AW.engine;
// ---- input: ค้าง (held) + เพิ่งกด (press ใช้ครั้งเดียวต่อ fixed step แรก) ----
function input(){const h=V.held,p=V.press,i={left:h.has('left'),right:h.has('right'),jump:h.has('jump'),drop:h.has('drop'),jumpPressed:p.has('jump'),attackPressed:p.has('attack'),interactPressed:p.has('interact')};p.clear();return i}
function down(a){if(!V.held.has(a))V.press.add(a);V.held.add(a)}
function up(a){V.held.delete(a)}
function onKey(e){if(!V.rt)return;const dn=e.type==='keydown';
 if(e.code==='Escape'||e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(dn&&!e.repeat)esc_();return}
 const a=KEYMAP[e.code];if(!a)return;if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 // หน้าต่างเปิดอยู่: Space/Enter/Tab เป็นของปุ่มใน dialog (ไม่ดักไว้) · E ปิดหน้าต่างผลลัพธ์
 if(V.panel){if(a==='interact'){e.preventDefault();e.stopImmediatePropagation();if(dn&&!e.repeat&&V.panel.kind==='result')closePanel()}if(!dn)up(a);return}
 e.preventDefault();e.stopImmediatePropagation();
 // กดค้าง (key repeat) นับเป็นค้างเท่านั้น ไม่นับเป็นกดใหม่: E ค้างหลังปิดหน้าต่างไม่เปิดซ้ำ
 if(!dn)up(a);else if(e.repeat)V.held.add(a);else down(a)}
function esc_(){if(V.panel){closePanel();return}if(!E().events.pending())close()}
// ---- เปิด/ปิด ----
// #sv ถูกสร้างครั้งเดียวและผูก click ครั้งเดียว (เปิด/ปิดฉากกี่รอบก็มี listener ชุดเดียว)
function root(){let el=$('#sv');if(el)return el;el=document.createElement('div');el.id='sv';el.hidden=true;document.body.appendChild(el);
 el.addEventListener('click',e=>{if(!V.rt)return;const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.sv==='exit'){close();return}if(d.sv==='save'){saveHere(0);return}
  if(d.opt!==undefined){choose(+d.opt);return}if(d.ans!==undefined){answer(+d.ans);return}if(d.close!==undefined){closePanel();return}});
 window.addEventListener('keydown',onKey,true);window.addEventListener('keyup',onKey,true);window.addEventListener('blur',()=>V.held.clear());
 window.addEventListener('resize',()=>{if(V.rt)fit()});return el}
const PAD=(side,keys)=>`<div class="sv-touch ${side}" aria-hidden="true">${keys.map(([k,t])=>`<button data-k="${k}" tabindex="-1">${t}</button>`).join('')}</div>`;
function open(){if(V.rt)return true;const e=E();let rt;try{rt=new AW.sv.Explore(e).enter()}catch(x){U.toast('ทำไม่ได้: '+x.message,'bad');return false}
 const el=root();V.rt=rt;
 el.innerHTML=`<div class="sv-stage">${PAD('l',[['left','◀'],['right','▶'],['drop','▼']])}
  <div class="sv-wrap" id="svwrap" role="application" aria-label="ฉากสำรวจ side-view" tabindex="-1"><canvas id="svc" width="${VW}" height="${VH}"></canvas></div>
  <div class="sv-hud" id="svhud"></div>
  <div class="sv-top"><button class="sm" data-sv="save" title="เซฟตำแหน่งและสถานะลงช่อง 0">เซฟ</button><button class="sm" data-sv="exit" title="กลับหน้าหลัก (Esc)">✕ ออก</button></div>
  <div class="sv-msg"><div class="sv-prompt" id="svprompt"></div><div class="sv-log" id="svlog" aria-live="polite"></div></div>
  ${PAD('r',[['interact','E'],['attack','⚔'],['jump','▲']])}</div><div class="sv-panel" id="svpanel"></div>`;
 // ปุ่มสัมผัส: pointer events (หลายนิ้วพร้อมกันได้) · ปล่อยนอกปุ่มก็นับว่าปล่อย · ปุ่มถูกสร้างใหม่ทุกครั้งที่เปิด listener จึงไม่สะสม
 el.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k,on=ev=>{ev.preventDefault();b.classList.add('on');if(V.panel){if(k==='interact'&&V.panel.kind==='result')closePanel();return}down(k)},off=ev=>{ev.preventDefault();b.classList.remove('on');up(k)};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
 // หน้าเกมด้านหลังรับ focus/คลิกไม่ได้ระหว่างอยู่ในฉาก (Tab ไม่หลุดไปกดเมนู/โหลดเซฟ)
 const app=$('#app');if(app)app.inert=true;el.hidden=false;document.body.classList.add('sv-on');$('#svwrap').focus();
 V.held.clear();V.press.clear();V.panel=null;V.acc=0;V.last=0;fit();V.raf=requestAnimationFrame(frame);return true}
// จัดขนาดฉากตามจอ: แนวตั้งบนจอสัมผัส = HUD แถวบน · ภาพเกม · ข้อความ · ปุ่ม (ไม่ซ้อนกัน) · แนวนอน/เดสก์ท็อป = แบบเดิม (มุมกล้อง 576 กว้างเต็มที่)
// แนวตั้ง: scale = ใหญ่สุดที่ทั้งความสูงที่เหลือและความกว้าง MINW พอดี ปัดลงให้ scale x devicePixelRatio เป็นจำนวนเต็ม · มุมกล้อง = ความกว้างจอ / scale (ไม่เกิน 576)
function fit(){const el=$('#sv'),st=el&&el.querySelector('.sv-stage'),wrap=$('#svwrap'),cv=$('#svc');if(!V.rt||!wrap)return;
 const W=innerWidth,H=innerHeight,portrait=H>=W&&matchMedia(TOUCH).matches;el.classList.toggle('sv-portrait',portrait);V.portrait=portrait;let vw=VW;
 if(portrait){wrap.style.width=wrap.style.height='';const cs=getComputedStyle(el),pad=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom),
   rest=st.getBoundingClientRect().height-wrap.getBoundingClientRect().height,dpr=devicePixelRatio||1;
  let s=Math.min((H-pad-rest)/VH,W/MINW);s=Math.max(1,Math.floor(s*dpr))/dpr;vw=Math.min(VW,Math.floor(W/s));
  wrap.style.width=vw*s+'px';wrap.style.height=VH*s+'px';V.scale=s}
 else{wrap.style.width=wrap.style.height='';V.scale=wrap.getBoundingClientRect().width/VW}
 if(cv.width!==vw)cv.width=vw;V.vw=vw;V.rt.setView(vw,VH);draw();placePanel()}
// หน้าต่างคุยเริ่มใต้ HUD/ปุ่มเซฟ เสมอ จึงไม่ทับข้อมูลบนสุด
function placePanel(){const el=$('#sv'),h=$('#svhud'),t=el&&el.querySelector('.sv-top');if(!h||!t)return;const top=Math.max(h.getBoundingClientRect().bottom,t.getBoundingClientRect().bottom)-el.getBoundingClientRect().top+8;
 if(V.top!==top){V.top=top;el.style.setProperty('--svtop',Math.round(top)+'px')}}
// ปิดฉาก: หยุดลูปวาด คืนหน้าเกม · exit ของ runtime ถูกเรียกเฉพาะเมื่อ runtime ยังทำงาน (ถ้าถูกยกเลิกเพราะโหลดเซฟ/เกมใหม่ จะไม่เขียนอะไรเพิ่ม)
function close(){const rt=V.rt;if(!rt)return false;V.rt=null;cancelAnimationFrame(V.raf);V.raf=0;V.panel=null;V.held.clear();V.press.clear();
 const el=$('#sv');if(el){el.hidden=true;el.innerHTML='';el.classList.remove('sv-portrait')}V.vw=VW;V.portrait=false;document.body.classList.remove('sv-on');const app=$('#app');if(app)app.inert=false;
 if(rt.active)rt.exit();AW.ui.go('dashboard');AW.ui.update(true);const b=$('#svgo button');if(b)b.focus();return true}
// เซฟ: ปิดยอดการต่อสู้ที่ค้างและเขียนตำแหน่งก่อน แล้วใช้ saveTo เดิม
function sync(){const rt=V.rt;if(rt&&rt.active){rt.settle('retreat');rt.flush()}}
function saveHere(slot){try{sync();E().saveTo(slot);U.toast('เซฟช่อง '+slot+' แล้ว (ตำแหน่ง: '+V.rt.a.name+')','good')}catch(x){U.toast('เซฟไม่ได้: '+x.message,'bad')}}
// ---- loop: fixed step 60 Hz + accumulator · หยุดเดินเมื่อมีหน้าต่างเปิด · ไม่จองเฟรมถัดไปหลังปิดฉาก ----
function frame(ts){V.calls++;if(!V.rt)return;const e=E();if(e.sv.runtime!==V.rt||!e.player.get().alive){close();return}
 if(!V.last)V.last=ts;V.acc=Math.min(V.acc+(ts-V.last),250);V.last=ts;const t0=performance.now();let n=0;
 while(V.acc>=DT&&V.rt){V.acc-=DT;if(!V.panel)stepOnce();n++}
 if(n&&V.rt){paint();V.frames++;V.ms+=performance.now()-t0}if(V.rt)V.raf=requestAnimationFrame(frame)}
// วาดหนึ่งเฟรม: ข้อผิดพลาดตอนวาดถูกรายงานครั้งเดียวต่อข้อความ และไม่ทำให้ลูปหยุด
function paint(){try{draw()}catch(x){const m=String(x&&x.message||x);if(!V.warned.has(m)){V.warned.add(m);E().debug.error('side-view draw: '+m)}}}
function stepOnce(){const rt=V.rt,r=rt.step(input());if(r==='talk')openTalk();else if(r==='door'){U.toast('มาถึง '+rt.a.name);V.held.clear()}
 else if(typeof r==='string'&&r.startsWith('locked:'))U.toast(r.slice(7),'bad');
 if(E().events.pending()&&!V.panel)V.panel={kind:'event'}}
// ทดสอบอัตโนมัติ: เดิน n เฟรมด้วย input ที่กำหนด (ไม่รอ requestAnimationFrame)
function advance(n=1,inp={}){for(let i=0;i<n&&V.rt;i++){for(const k of['left','right','jump','drop'])inp[k]?V.held.add(k):V.held.delete(k);if(i===0)for(const k of['jump','attack','interact'])if(inp[k+'Pressed'])V.press.add(k);if(!V.panel)stepOnce()}V.held.clear();if(V.rt)draw();return V.rt}
// ---- หน้าต่างคุย / เหตุการณ์ / ผลลัพธ์ ----
function openTalk(){const rt=V.rt,n=E().npcs.get(rt.talk);V.held.clear();if(!n){rt.talk=null;return}V.panel={kind:'talk',npc:rt.talk,opts:rt.talkOptions()}}
function choose(i){const rt=V.rt,P=V.panel;if(!P||P.kind!=='talk')return;const o=P.opts[i];if(!o||o.why)return;
 try{const r=rt.choose(o,P.npc);V.panel=o.kind==='event'?{kind:'event'}:{kind:'result',r}}catch(x){V.panel={kind:'result',r:{title:'ทำไม่ได้',text:x.message,success:false}}}paint()}
function answer(i){const P=V.panel;if(!P||P.kind!=='event'||!E().events.pending())return;
 try{const r=E().events.answer(i);V.panel=r&&r.text?{kind:'result',r}:null}catch(x){U.toast('ทำไม่ได้: '+x.message,'bad')}if(E().events.pending())V.panel={kind:'event'};paint()}
function closePanel(){if(V.panel&&V.panel.kind==='event'&&E().events.pending())return;if(V.panel&&V.panel.kind==='talk'&&V.rt)V.rt.talk=null;V.panel=null;V.held.clear();V.press.clear();const w=$('#svwrap');if(w)w.focus();paint()}
function panelHtml(){const P=V.panel,e=E();if(!P)return'';
 if(P.kind==='talk'){const n=e.npcs.get(P.npc);return `<div class="dialog sv-dlg" role="dialog" aria-modal="true" aria-label="คุยกับ ${esc(n.name)}"><h3>${esc(n.name)}</h3><div class="actions">${P.opts.map((o,i)=>`<button data-opt="${i}" ${o.why?'disabled':''} title="${esc(o.why)}">${esc(o.name)}${o.kind==='event'?' ★':''}${o.why?` <small>(${esc(o.why)})</small>`:''}</button>`).join('')}<button class="ghost" data-close>ไว้ก่อน</button></div></div>`}
 if(P.kind==='event'){const p=e.events.pending();if(!p)return'';const who=p.who&&e.npcs.get(p.who);return `<div class="dialog sv-dlg" role="dialog" aria-modal="true" aria-label="${esc(p.def.title)}"><h3>${esc(p.def.title)}</h3><p>${esc(e.events.fmt(p.def.text||'',p.who))}</p>
  <div class="actions">${e.events.choices().map(c=>`<button data-ans="${c.i}" ${c.ok?'':'disabled'}>${esc(c.text)}${c.chance!=null&&c.chance<1?` <small>(${Math.round(c.chance*100)}%)</small>`:''}</button>`).join('')}</div>${who?`<small class="dim">กับ ${esc(who.name)}</small>`:''}</div>`}
 const r=P.r||{};return `<div class="dialog sv-dlg" role="dialog" aria-modal="true"><h3>${esc(r.title||'ผลลัพธ์')}</h3><p class="${r.success===false?'bad':''}">${esc(r.text||'')}</p>${(r.effects||[]).length?`<p><small>${esc(r.effects.join(' · '))}</small></p>`:''}<button class="pri" data-close>ตกลง (E)</button></div>`}
// ---- ภาพจริงจาก Asset Registry ----
// คืนภาพเมื่อ: registry บอกว่าใช้ได้ (มี src+license) · pipeline โหลดสำเร็จ · ภาพถอดรหัสได้ · แผ่นใหญ่พอสำหรับเฟรมที่ metadata อ้าง · ไม่งั้นคืน null = วาด placeholder
function realImg(e,id,needW,needH){if(!AW.ui.assets.ready(id))return null;const im=e.assets.get(id);if(!(im&&im.complete&&im.naturalWidth>0))return null;
 let ok=V.sheet.get(im);if(ok===undefined){ok=im.naturalWidth>=needW&&im.naturalHeight>=needH;V.sheet.set(im,ok);if(!ok)e.debug.error(`asset ${id}: แผ่นภาพ ${im.naturalWidth}x${im.naturalHeight} เล็กกว่าที่ metadata ต้องการ ${needW}x${needH} ใช้ placeholder แทน`)}
 return ok?im:null}
// ขนาดแผ่นขั้นต่ำที่ท่าทั้งหมดใน metadata อ้างถึง (คำนวณครั้งเดียวต่อ asset)
const NEEDC=new Map(),sheetNeed=d=>{let n=NEEDC.get(d.id);if(!n){let c=1,r=1;for(const a of Object.values(d.anims)){c=Math.max(c,a.frames);r=Math.max(r,a.row+1)}n=[c*d.frame.w,r*d.frame.h];NEEDC.set(d.id,n)}return n};
const PAL={school:['#9fd3ff','#cfe9ff','#6f8fa8','#c9b38a'],city:['#7fb2e8','#b7d3f0','#555f78','#8d8f99'],gate_zone:['#1a2350','#2e3a7a','#2a2f44','#4b4f63']};
// พื้นและแพลตฟอร์มจาก tileset: ช่อง top/fill/platform ตาม metadata · วาดเฉพาะช่องที่อยู่ในจอ
function ground(g,e,a,cam,pal,id){const d=e.assets.defs.get(id),sh=d&&d.sheet,im=d&&d.tile&&d.tiles&&sh?realImg(e,id,sh.cols*d.tile.w,sh.rows*d.tile.h):null;
 if(!im){for(const s of a.solids){g.fillStyle=pal[3];g.fillRect(s.x,s.y,s.w,s.h);g.fillStyle='rgba(0,0,0,.18)';for(let x=s.x;x<s.x+s.w;x+=16)g.fillRect(x,s.y,1,s.h);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(s.x,s.y,s.w,2)}
  for(const p of a.platforms||[]){g.fillStyle=pal[3];g.fillRect(p.x,p.y,p.w,6);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(p.x,p.y+6,p.w,2)}
  g.fillStyle='rgba(255,59,154,.8)';g.font='8px monospace';g.fillText('PLACEHOLDER '+id,Math.max(4,cam.x+4),318);return false}
 const VW=V.vw,tw=d.tile.w,th=d.tile.h,T=d.tiles,row=(i,x0,x1,y,hMax)=>{const sx=(i%sh.cols)*tw,sy=Math.floor(i/sh.cols)*th;for(let x=x0+Math.max(0,Math.floor((cam.x-x0)/tw))*tw;x<x1&&x<cam.x+VW;x+=tw){const w=Math.min(tw,x1-x),h=Math.min(th,hMax);g.drawImage(im,sx,sy,w,h,x,y,w,h)}};
 for(const s of a.solids)for(let y=s.y;y<s.y+s.h;y+=th)row(y===s.y?T.top:T.fill,s.x,s.x+s.w,y,s.y+s.h-y);
 for(const p of a.platforms||[])row(T.platform,p.x,p.x+p.w,p.y,th);return true}
// ---- วาด ----
function draw(){const rt=V.rt,c=$('#svc');if(!rt||!c)return;const g=c.getContext('2d'),e=E(),a=rt.a,cam=rt.cam,pal=PAL[a.id]||PAL.city,ns=rt.ns;g.imageSmoothingEnabled=false;
 // ฉากหลัง: layer ไกล -> ใกล้ (parallax) · ไฟล์จริงถ้ามี ไม่งั้นท้องฟ้า+ตึกแบน
 const VW=V.vw,sky=g.createLinearGradient(0,0,0,VH);sky.addColorStop(0,pal[0]);sky.addColorStop(1,pal[1]);g.fillStyle=sky;g.fillRect(0,0,VW,VH);
 (a.layers||[]).slice().reverse().forEach((k,li)=>{const id=ns+'.'+k,f=0.2+li*0.25,ox=-cam.x*f,im=realImg(e,id,1,1);if(im){const w=VW*1.2;for(let x=ox%w;x<VW;x+=w)g.drawImage(im,x,0,w,VH);return}
  g.fillStyle=li?pal[2]+'cc':pal[2]+'88';for(let i=0;i<40;i++){const bw=60+(i*37)%70,bh=60+(i*53)%(110+li*40),x=ox+i*(bw+30)*(1+li*0.3);if(x>VW||x+bw<0)continue;g.fillRect(Math.round(x),296-bh-(li?0:30),bw,bh+(li?0:30))}});
 g.save();g.translate(-cam.x,-cam.y);ground(g,e,a,cam,pal,ns+'.'+a.tileset);
 // ประตู
 for(const d of a.doors){const lock=!e.player.canEnter(d.to);g.fillStyle=lock?'#5a2a35':'#2d6b8f';g.fillRect(d.x-14,256,28,40);g.fillStyle=lock?'#ff5c6c':'#4cc3ff';g.fillRect(d.x-14,256,28,3);g.font='9px sans-serif';g.textAlign='center';g.fillStyle='#fff';g.fillText(d.label+(lock?' (ล็อก)':''),d.x,250);g.textAlign='left'}
 // NPC ทุกคนในพื้นที่ (วาดเฉพาะที่อยู่ในจอ) · คนเยอะ: แสดงชื่อเฉพาะคนที่อยู่ใกล้ผู้เล่น
 const me=rt.me,mx=me.x+me.w/2,few=rt.npcs.length<=6;
 for(const n of rt.npcs){if(n.x+n.w<cam.x-8||n.x>cam.x+VW+8)continue;sprite(g,e,n,'idle','#8fd18f',few||Math.abs(n.x+n.w/2-mx)<70?n.name:'',n.facing)}
 for(const f of rt.foes){sprite(g,e,f,f.dead?'death':f.hurt>0?'hurt':f.wind>0?'attack':Math.abs(f.vx)>5?'walk':'idle','#7fbf3f','',f.dir);
  if(!f.dead){g.fillStyle='#000a';g.fillRect(f.x,f.y-8,f.w,4);g.fillStyle='#ff5c6c';g.fillRect(f.x,f.y-8,f.w*f.hp/f.max,4);if(f.wind>0){g.fillStyle='#ffd34d';g.fillText('!',f.x+f.w/2-2,f.y-12)}}}
 if(!(me.inv>0&&rt.t%6<3))sprite(g,e,me,AW.sv.animOf(me),'#4cc3ff','',me.facing);
 if(rt.swinging()){g.fillStyle='rgba(255,255,255,.7)';g.fillRect(me.facing>0?me.x+me.w:me.x-34,me.y+16,34,4)}
 g.restore();hud()}
// sprite: ไฟล์จริง = ตัดเฟรมตาม metadata (frame/anchor/anims) จุดเท้าของเฟรมวางที่กึ่งกลางล่างของกล่องชน · placeholder = กล่องตามกล่องชน
// เวลาแอนิเมชันนับจาก step ของ runtime ตั้งแต่เปลี่ยนท่า: ท่าวน (loop) วนซ้ำ · ท่าไม่วนเล่นจากเฟรมแรกแล้วค้างเฟรมสุดท้าย
function sprite(g,e,b,anim,col,label,facing=-1){const id=b.sprite,d=e.assets.defs.get(id),fx=b.x+b.w/2,fy=b.y+b.h,rt=V.rt;let st=V.anim.get(b);if(!st||st.a!==anim){st={a:anim,t:rt.t};V.anim.set(b,st)}
 const need=d&&d.frame&&d.anims?sheetNeed(d):null,im=need?realImg(e,id,need[0],need[1]):null;
 if(im){const an=d.anims[anim]||d.anims.idle,el=(rt.t-st.t)/60,k=Math.floor(el*an.fps),fr=an.loop?k%an.frames:Math.min(an.frames-1,k);g.save();g.translate(Math.round(fx),Math.round(fy));if(facing<0)g.scale(-1,1);
  g.drawImage(im,fr*d.frame.w,an.row*d.frame.h,d.frame.w,d.frame.h,-d.anchor.x,-(d.anchor.y+1),d.frame.w,d.frame.h);g.restore()}
 else{const sq=anim==='jump'?3:anim==='fall'?-2:0;g.fillStyle=anim==='hurt'?'#ff5c6c':anim==='death'?'#555':col;g.fillRect(Math.round(b.x)-sq/2,Math.round(b.y)+sq,b.w+sq,b.h-sq);
  g.fillStyle='#0b0f1a';g.fillRect(Math.round(fx+(facing>0?3:-6)),Math.round(b.y)+8,3,3)}
 if(label){g.font='9px sans-serif';g.textAlign='center';g.fillStyle='#fff';g.fillText(label,fx,b.y-4);g.textAlign='left'}}
function hud(){const rt=V.rt,e=E(),p=e.player.get(),slot=U.SLOT[e.npcs.clock(rt.w).slot],near=rt.nearby(),hp=Math.max(0,Math.round(rt.hp)),mx=rt.maxHp,why=rt.foes.length?rt.fightWhy():'';
 const h=$('#svhud');if(h){const html=`<div class="sv-name">${esc(rt.a.name)} <small>${esc(slot)}</small></div><div class="sv-bars"><span>HP ${hp}/${mx}</span>${U.bar('hp',hp,mx)}<span>AP ${p.ap}</span><span class="sv-ap">${'◆'.repeat(Math.max(0,p.ap))}${'◇'.repeat(Math.max(0,3-p.ap))}</span></div>${why?`<div class="sv-warn">ต่อสู้ไม่ได้: ${esc(why)}</div>`:''}`;if(h.__h!==html){h.innerHTML=html;h.__h=html;placePanel()}}
 const pr=$('#svprompt');if(pr){const t=V.panel?'':near?`[E] ${near.label}`:'';if(pr.textContent!==t)pr.textContent=t}
 const lg=$('#svlog');if(lg){const t=rt.msg.slice(-3).join(' · ');if(lg.textContent!==t)lg.textContent=t}
 const pn=$('#svpanel');if(pn){const html=panelHtml();if(pn.__h!==html){pn.innerHTML=html;pn.__h=html;const f=pn.querySelector('button:not([disabled])');if(f)f.focus()}}}
AW.ui.sv={open,close,advance,sync,fit,active:()=>!!V.rt,rt:()=>V.rt,panel:()=>V.panel,stats:()=>({frames:V.frames,ms:V.ms,calls:V.calls}),layout:()=>({portrait:V.portrait,view:V.vw,scale:V.scale})};
})(globalThis.AW);
