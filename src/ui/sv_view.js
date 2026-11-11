// Side-view view (Phase 7B.3): canvas 576x324 (ขยายแบบ pixel) · HUD · ปุ่มสัมผัส · หน้าต่างคุย/เหตุการณ์
// วาดและรับ input เท่านั้น · กติกาทั้งหมดอยู่ใน AW.sv.Explore (src/sideview) ซึ่งเรียก API ระบบเดิม
// ภาพ: ถ้า asset ใน Asset Registry เป็นไฟล์จริง (มี license) วาดจากแผ่น sprite ตาม metadata · ไม่งั้นวาด placeholder แบบแบนพร้อมป้ายกำกับ
(function(AW){
'use strict';
const U=AW.ui.u,$=U.$,esc=U.esc,VW=576,VH=324,DT=1000/60;
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ArrowDown:'drop',KeyS:'drop',KeyJ:'attack',KeyK:'attack',KeyE:'interact'};
const V={rt:null,raf:0,acc:0,last:0,held:new Set(),press:new Set(),panel:null,t:0,frames:0,ms:0};
const E=()=>AW.engine;
// ---- input: ค้าง (held) + เพิ่งกด (press ใช้ครั้งเดียวต่อ fixed step แรก) ----
function input(){const h=V.held,p=V.press,i={left:h.has('left'),right:h.has('right'),jump:h.has('jump'),drop:h.has('drop'),jumpPressed:p.has('jump'),attackPressed:p.has('attack'),interactPressed:p.has('interact')};p.clear();return i}
function down(a){if(!V.held.has(a))V.press.add(a);V.held.add(a)}
function up(a){V.held.delete(a)}
function onKey(e){if(!V.rt)return;if(e.code==='Escape'||e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(e.type==='keydown')esc_();return}
 const a=KEYMAP[e.code];if(!a)return;if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;e.preventDefault();e.stopImmediatePropagation();
 if(V.panel&&e.type==='keydown'){if(a==='interact'&&V.panel.kind!=='talk')closePanel();return}e.type==='keydown'?down(a):up(a)}
function esc_(){if(V.panel&&V.panel.kind!=='event')closePanel();else if(!E().events.pending())close()}
// ---- เปิด/ปิด ----
function open(){const e=E();try{V.rt=new AW.sv.Explore(e).enter()}catch(x){U.toast('ทำไม่ได้: '+x.message,'bad');return false}
 let el=$('#sv');if(!el){el=document.createElement('div');el.id='sv';document.body.appendChild(el)}
 el.innerHTML=`<div class="sv-wrap" role="application" aria-label="ฉากสำรวจ side-view"><canvas id="svc" width="${VW}" height="${VH}"></canvas>
  <div class="sv-hud" id="svhud"></div><div class="sv-prompt" id="svprompt"></div><div class="sv-log" id="svlog" aria-live="polite"></div>
  <div class="sv-top"><button class="sm" data-sv="save" title="เซฟตำแหน่งและสถานะ">เซฟ</button><button class="sm" data-sv="exit" title="กลับหน้าหลัก (Esc)">✕ ออก</button></div>
  <div class="sv-touch" aria-hidden="true"><div class="pad"><button data-k="left">◀</button><button data-k="right">▶</button><button data-k="drop">▼</button></div>
  <div class="pad"><button data-k="interact">E</button><button data-k="attack">⚔</button><button data-k="jump">▲</button></div></div>
  <div class="sv-panel" id="svpanel"></div></div>`;
 el.hidden=false;document.body.classList.add('sv-on');V.held.clear();V.press.clear();V.panel=null;V.acc=0;V.last=0;wire(el);sync();draw();V.raf=requestAnimationFrame(frame);return true}
function close(){const rt=V.rt;V.rt=null;cancelAnimationFrame(V.raf);const el=$('#sv');if(el){el.hidden=true;el.innerHTML=''}document.body.classList.remove('sv-on');
 if(rt&&E().sv.runtime===rt)rt.exit();AW.ui.go('dashboard');AW.ui.update(true)}
let wired=false;
function wire(el){
 // ปุ่มสัมผัส: pointer events (นิ้วหลายนิ้วพร้อมกันได้) · ปล่อยนอกปุ่มก็นับว่าปล่อย
 el.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k,on=e=>{e.preventDefault();b.classList.add('on');if(V.panel){if(k==='interact'&&V.panel.kind!=='talk')closePanel();return}down(k)},off=e=>{e.preventDefault();b.classList.remove('on');up(k)};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.sv==='exit'){close();return}if(d.sv==='save'){saveHere(0);return}
  if(d.opt!==undefined){choose(+d.opt);return}if(d.ans!==undefined){answer(+d.ans);return}if(d.close!==undefined){closePanel();return}});
 if(!wired){wired=true;window.addEventListener('keydown',onKey,true);window.addEventListener('keyup',onKey,true);window.addEventListener('blur',()=>V.held.clear())}}
// เซฟ: ปิดยอดการต่อสู้ที่ค้าง (HP) และเขียนตำแหน่งก่อน แล้วใช้ saveTo เดิม
function sync(){const rt=V.rt;if(rt){rt.settle('retreat');rt.flush()}}
function saveHere(slot){try{sync();E().saveTo(slot);U.toast('เซฟช่อง '+slot+' แล้ว (ตำแหน่ง: '+V.rt.a.name+')','good')}catch(x){U.toast('เซฟไม่ได้: '+x.message,'bad')}}
// ---- loop: fixed step 60 Hz + accumulator · หยุดเดินเมื่อมีหน้าต่างเปิด ----
function frame(ts){if(!V.rt)return;const e=E();if(e.sv.runtime!==V.rt||!e.player.get().alive){close();return}
 if(!V.last)V.last=ts;V.acc=Math.min(V.acc+(ts-V.last),250);V.last=ts;const t0=performance.now();let n=0;
 while(V.acc>=DT){V.acc-=DT;if(!V.panel)stepOnce();n++}if(n){draw();V.frames++;V.ms+=performance.now()-t0}V.raf=requestAnimationFrame(frame)}
function stepOnce(){const rt=V.rt,r=rt.step(input());if(r==='talk')openTalk();else if(r==='door'){U.toast('มาถึง '+rt.a.name);V.held.clear()}
 else if(r==='left'){close();return}else if(typeof r==='string'&&r.startsWith('locked:'))U.toast(r.slice(7),'bad');
 if(E().events.pending()&&!V.panel)V.panel={kind:'event'}}
// ทดสอบอัตโนมัติ: เดิน n เฟรมด้วย input ที่กำหนด (ไม่รอ requestAnimationFrame)
function advance(n=1,inp={}){for(let i=0;i<n&&V.rt;i++){for(const k of['left','right','jump','drop'])inp[k]?V.held.add(k):V.held.delete(k);if(i===0)for(const k of['jump','attack','interact'])if(inp[k+'Pressed'])V.press.add(k);if(!V.panel)stepOnce()}V.held.clear();if(V.rt)draw();return V.rt}
// ---- หน้าต่างคุย / เหตุการณ์ / ผลลัพธ์ ----
function openTalk(){const rt=V.rt,n=E().npcs.get(rt.talk);V.panel={kind:'talk',npc:rt.talk,opts:rt.talkOptions()};V.held.clear();
 if(!n){V.panel=null;return}draw()}
function choose(i){const rt=V.rt,P=V.panel;if(!P||P.kind!=='talk')return;const o=P.opts[i];if(!o||o.why)return;
 try{const r=rt.choose(o,P.npc);V.panel=o.kind==='event'?{kind:'event'}:{kind:'result',r}}catch(x){V.panel={kind:'result',r:{title:'ทำไม่ได้',text:x.message,success:false}}}draw()}
function answer(i){try{const r=E().events.answer(i);V.panel=r&&r.text?{kind:'result',r}:null}catch(x){U.toast('ทำไม่ได้: '+x.message,'bad')}if(E().events.pending())V.panel={kind:'event'};draw()}
function closePanel(){if(V.panel&&V.panel.kind==='event'&&E().events.pending())return;if(V.panel&&V.panel.kind==='talk')V.rt.talk=null;V.panel=null;V.held.clear();draw()}
function panelHtml(){const P=V.panel,e=E();if(!P)return'';
 if(P.kind==='talk'){const n=e.npcs.get(P.npc);return `<div class="dialog sv-dlg" role="dialog" aria-label="คุยกับ ${esc(n.name)}"><h3>${esc(n.name)}</h3><div class="actions">${P.opts.map((o,i)=>`<button data-opt="${i}" ${o.why?'disabled':''} title="${esc(o.why)}">${esc(o.name)}${o.kind==='event'?' ★':''}${o.why?` <small>(${esc(o.why)})</small>`:''}</button>`).join('')}<button class="ghost" data-close>ไว้ก่อน</button></div></div>`}
 if(P.kind==='event'){const p=e.events.pending();if(!p)return'';const who=p.who&&e.npcs.get(p.who);return `<div class="dialog sv-dlg" role="dialog" aria-label="${esc(p.def.title)}"><h3>${esc(p.def.title)}</h3><p>${esc(e.events.fmt(p.def.text||'',p.who))}</p>
  <div class="actions">${e.events.choices().map(c=>`<button data-ans="${c.i}" ${c.ok?'':'disabled'}>${esc(c.text)}${c.chance!=null&&c.chance<1?` <small>(${Math.round(c.chance*100)}%)</small>`:''}</button>`).join('')}</div>${who?`<small class="dim">กับ ${esc(who.name)}</small>`:''}</div>`}
 const r=P.r||{};return `<div class="dialog sv-dlg" role="dialog"><h3>${esc(r.title||'ผลลัพธ์')}</h3><p class="${r.success===false?'bad':''}">${esc(r.text||'')}</p>${(r.effects||[]).length?`<p><small>${esc(r.effects.join(' · '))}</small></p>`:''}<button class="pri" data-close>ตกลง (E)</button></div>`}
// ---- วาด ----
const PAL={school:['#9fd3ff','#cfe9ff','#6f8fa8','#c9b38a'],city:['#7fb2e8','#b7d3f0','#555f78','#8d8f99'],gate_zone:['#1a2350','#2e3a7a','#2a2f44','#4b4f63']};
function draw(){const rt=V.rt,c=$('#svc');if(!rt||!c)return;const g=c.getContext('2d'),e=E(),a=rt.a,cam=rt.cam,pal=PAL[a.id]||PAL.city,ns=e.worlds.ctx(rt.w).def.assetNs;V.t++;g.imageSmoothingEnabled=false;
 // ฉากหลัง: layer ไกล -> ใกล้ (parallax) · ไฟล์จริงถ้ามี ไม่งั้นท้องฟ้า+ตึกแบน
 const sky=g.createLinearGradient(0,0,0,VH);sky.addColorStop(0,pal[0]);sky.addColorStop(1,pal[1]);g.fillStyle=sky;g.fillRect(0,0,VW,VH);
 (a.layers||[]).slice().reverse().forEach((k,li)=>{const id=ns+'.'+k,f=0.2+li*0.25,ox=-cam.x*f;if(e.assets.status(id)==='real'){const im=e.assets.get(id);if(im.complete!==false){const w=VW*1.2;for(let x=ox%w;x<VW;x+=w)g.drawImage(im,x,0,w,VH)}return}
  g.fillStyle=li?pal[2]+'cc':pal[2]+'88';for(let i=0;i<40;i++){const bw=60+(i*37)%70,bh=60+(i*53)%(110+li*40),x=ox+i*(bw+30)*(1+li*0.3);if(x>VW||x+bw<0)continue;g.fillRect(Math.round(x),296-bh-(li?0:30),bw,bh+(li?0:30))}});
 g.save();g.translate(-cam.x,-cam.y);
 // พื้น/แพลตฟอร์ม (tileset)
 const tile=ns+'.'+a.tileset,real=e.assets.status(tile)==='real';
 for(const s of a.solids){g.fillStyle=pal[3];g.fillRect(s.x,s.y,s.w,s.h);g.fillStyle='rgba(0,0,0,.18)';for(let x=s.x;x<s.x+s.w;x+=16)g.fillRect(x,s.y,1,s.h);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(s.x,s.y,s.w,2)}
 for(const p of a.platforms||[]){g.fillStyle=pal[3];g.fillRect(p.x,p.y,p.w,6);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(p.x,p.y+6,p.w,2)}
 if(!real){g.fillStyle='rgba(255,59,154,.8)';g.font='8px monospace';g.fillText('PLACEHOLDER '+tile,Math.max(4,cam.x+4),318)}
 // ประตู
 for(const d of a.doors){const lock=!e.player.canEnter(d.to);g.fillStyle=lock?'#5a2a35':'#2d6b8f';g.fillRect(d.x-14,256,28,40);g.fillStyle=lock?'#ff5c6c':'#4cc3ff';g.fillRect(d.x-14,256,28,3);g.font='9px sans-serif';g.textAlign='center';g.fillStyle='#fff';g.fillText(d.label+(lock?' (ล็อก)':''),d.x,250);g.textAlign='left'}
 // NPC · ศัตรู · ผู้เล่น
 for(const n of rt.npcs)sprite(g,e,n.gender==='f'?'hunter.sv.npc_f':'hunter.sv.npc_m',n,'idle','#8fd18f',n.name);
 for(const f of rt.foes){sprite(g,e,'hunter.sv.goblin',f,f.dead?'death':f.hurt>0?'hurt':f.wind>0?'attack':'walk','#7fbf3f','',f.dir);
  if(!f.dead){g.fillStyle='#000a';g.fillRect(f.x,f.y-8,f.w,4);g.fillStyle='#ff5c6c';g.fillRect(f.x,f.y-8,f.w*f.hp/f.max,4);if(f.wind>0){g.fillStyle='#ffd34d';g.fillText('!',f.x+f.w/2-2,f.y-12)}}}
 const me=rt.me,pid=e.player.get().gender==='f'?'shared.sv.player_f':'shared.sv.player_m';if(!(me.inv>0&&V.t%6<3))sprite(g,e,pid,me,AW.sv.animOf(me),'#4cc3ff','',me.facing);
 if(me.attack>0.1&&me.attack<0.22){g.fillStyle='rgba(255,255,255,.7)';g.fillRect(me.facing>0?me.x+me.w:me.x-34,me.y+16,34,4)}
 g.restore();hud()}
// sprite: ไฟล์จริง = ตัดเฟรมตาม metadata (frame/anchor/anims) · placeholder = กล่องตาม bbox + ป้ายท่า
function sprite(g,e,id,b,anim,col,label,facing=-1){const d=e.assets.defs.get(id),fx=b.x+b.w/2,fy=b.y+b.h;
 if(d&&e.assets.status(id)==='real'){const im=e.assets.get(id),an=(d.anims||{})[anim]||(d.anims||{}).idle,fr=Math.floor(V.t/60*an.fps)%an.frames;g.save();g.translate(Math.round(fx),Math.round(fy));if(facing<0)g.scale(-1,1);
  g.drawImage(im,fr*d.frame.w,an.row*d.frame.h,d.frame.w,d.frame.h,-d.anchor.x,-d.anchor.y,d.frame.w,d.frame.h);g.restore()}
 else{const sq=anim==='jump'?3:anim==='fall'?-2:0;g.fillStyle=anim==='hurt'?'#ff5c6c':anim==='death'?'#555':col;g.fillRect(Math.round(b.x)-sq/2,Math.round(b.y)+sq,b.w+sq,b.h-sq);
  g.fillStyle='#0b0f1a';g.fillRect(Math.round(fx+(facing>0?3:-6)),Math.round(b.y)+8,3,3)}
 if(label){g.font='9px sans-serif';g.textAlign='center';g.fillStyle='#fff';g.fillText(label,fx,b.y-4);g.textAlign='left'}}
function hud(){const rt=V.rt,e=E(),p=e.player.get(),slot=U.SLOT[e.npcs.clock(rt.w).slot],near=rt.nearby();
 const h=$('#svhud');if(h){const html=`<div class="sv-name">${esc(rt.a.name)} <small>${esc(slot)}</small></div><div class="sv-bars"><span>HP ${Math.max(0,Math.round(rt.hp))}/${rt.maxHp}</span>${U.bar('hp',rt.hp,rt.maxHp)}<span>AP ${p.ap}</span><span class="sv-ap">${'◆'.repeat(Math.max(0,p.ap))}${'◇'.repeat(Math.max(0,3-p.ap))}</span></div>`;if(h.__h!==html){h.innerHTML=html;h.__h=html}}
 const pr=$('#svprompt');if(pr){const t=V.panel?'':near?`[E] ${near.label}`:'';if(pr.textContent!==t)pr.textContent=t}
 const lg=$('#svlog');if(lg){const t=rt.msg.slice(-3).join(' · ');if(lg.textContent!==t)lg.textContent=t}
 const pn=$('#svpanel');if(pn){const html=panelHtml();if(pn.__h!==html){pn.innerHTML=html;pn.__h=html;const f=pn.querySelector('button:not([disabled])');if(f)f.focus()}}}
AW.ui.sv={open,close,advance,sync,active:()=>!!V.rt,rt:()=>V.rt,panel:()=>V.panel,stats:()=>({frames:V.frames,ms:V.ms})};
})(globalThis.AW);
