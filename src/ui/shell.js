// หน้าทดสอบ Core (Phase 1): ไม่ใช่ UI ของเกมจริง ใช้ตรวจ loop, save, asset, debug ในเบราว์เซอร์
(function(AW){
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function boot(){const E=new AW.core.Engine({assets:{imageFactory:src=>{const i=new Image();i.src=src;return i},canvasFactory:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c}}});
 E.assets.registerAll(AW.data.assets);const wr=E.registries.world.loadAll(AW.data.worlds);if(wr.bad.length)wr.bad.forEach(m=>E.debug.error(m));
 window.addEventListener('error',e=>E.debug.error('window: '+e.message));
 E.bus.on('month',({month})=>E.debug.log('เดือน '+month),{owner:'shell'});
 AW.engine=E;E.newGame({seed:'demo'});render();setInterval(draw,200);
 E.bus.on('month:after',update,{owner:'shell'});E.bus.on('loop:pause',update,{owner:'shell'});return E}
function draw(){const cv=$('#stage');if(!cv)return;const g=cv.getContext('2d'),E=AW.engine;g.imageSmoothingEnabled=false;g.clearRect(0,0,cv.width,cv.height);
 g.drawImage(E.assets.get('hunter.bg.city_day'),0,0,576,324);g.drawImage(E.assets.get('shared.char.base_m'),200,230,80,64);g.drawImage(E.assets.get('hunter.mon.goblin'),380,180,128,128);g.drawImage(E.assets.get('hunter.item.mana_stone'),30,30,32,32)}
function render(){ $('#app').innerHTML=`<header><b>Multiverse Hunter · Core Test (Phase 1)</b><span id="status"></span></header>
 <canvas id="stage" width="576" height="324"></canvas>
 <div class="row">${[0,1,3,10].map(s=>`<button data-s="${s}">${s?s+'x':'หยุด'}</button>`).join('')}<button id="step">+1 เดือน</button><button id="menu">เปิด/ปิดเมนู (หยุดเวลา)</button><button id="new">เกมใหม่</button></div>
 <div class="row">${[0,1,2].map(i=>`<button data-save="${i}">เซฟช่อง ${i}</button><button data-load="${i}">โหลดช่อง ${i}</button>`).join('')}</div>
<div id="info"></div>`;
 wire();update()}
function info(){const E=AW.engine,r=E.assets.report();return `<p>ภาพ: จริง ${r.real} · placeholder ${r.placeholder} · โลกที่ลงทะเบียน ${E.registries.world.all().length} · เซฟเกมเดิมที่พบ (ไม่แตะ) ${E.save.legacyKeys().length}</p>
 <p>เซฟใหม่: ${E.save.list().map(s=>esc(s.key)+(s.broken?' (เสีย)':` v${s.v} เดือน ${s.meta&&s.meta.month}`)).join(' · ')||'ยังไม่มี'}</p>
 <details id="dbg" ${window.__dbgOpen?'open':''}><summary>Debug</summary><p class="err">${E.debug.errors.map(esc).join('<br>')||'ไม่มี error'}</p><pre>${esc(JSON.stringify(E.state.snapshot(),null,1))}</pre><pre>${E.debug.lines.slice(-12).map(l=>esc(l.lvl+' '+l.msg)).join('\n')}</pre></details>`}
let _last=0;function update(){const E=AW.engine,m=E.loop.month,meta=E.state.get('meta'),st=$('#status');if(!st)return;
 st.textContent=`เดือน ${m} (อายุ ${15+Math.floor(m/12)} ปี ${m%12} เดือน) · seed ${meta.seed} · ${E.loop.paused?'หยุด: '+[...E.loop.reasons].join(', '):'ความเร็ว '+E.loop.speed+'x'}`;
 const now=Date.now();if(now-_last<500&&E.loop.speed)return;_last=now;$('#info').innerHTML=info();$('#dbg').ontoggle=e=>window.__dbgOpen=e.target.open}
function wire(){const E=AW.engine;
 document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{E.loop.setSpeed(+b.dataset.s);update()});
 $('#step').onclick=()=>{E.loop.step(1);update()};$('#new').onclick=()=>{E.newGame({seed:String(Date.now())});_last=0;update()};
 $('#menu').onclick=()=>{E.loop.reasons.has('menu')?E.loop.resume('menu'):E.loop.pause('menu')};
 document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{E.saveTo(+b.dataset.save);_last=0;update()});
 document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{try{E.loadFrom(+b.dataset.load)}catch(e){E.debug.error(e.message)}_last=0;update()});
 draw()}
AW.ui.boot=boot;
})(globalThis.AW);
