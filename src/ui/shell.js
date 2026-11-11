// หน้าเล่น Phase 3 (Hunter World vertical slice) + เครื่องมือทดสอบ (เวลา เซฟ debug gate)
// UI อ่าน state และเรียก API ของระบบเท่านั้น ไม่มีกติกาเกมในไฟล์นี้
// ปุ่มที่สร้างใหม่ทุกครั้งใช้ event delegation (data-*) จึงกดได้แม้เวลาเดินเร็ว
(function(AW){
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let result=null,_last=0;
function boot(){const E=new AW.core.Engine({assets:{imageFactory:src=>{const i=new Image();i.src=src;return i},canvasFactory:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c}}});
 E.assets.registerAll(AW.data.assets);AW.systems.installGameplay(E);const wr=E.worlds.registerAll(AW.data.worlds);if(wr.bad.length)wr.bad.forEach(m=>E.debug.error(m));
 window.addEventListener('error',e=>E.debug.error('window: '+e.message));
 E.bus.on('month',({month})=>E.debug.log('เดือน '+month),{owner:'shell'});
 AW.engine=E;newGame('demo');render();setInterval(draw,200);
 E.bus.on('month:after',()=>update(),{owner:'shell'});E.bus.on('loop:pause',()=>update(),{owner:'shell'});E.bus.on('world:enter',()=>update(true),{owner:'shell'});return E}
function newGame(seed){const E=AW.engine;E.newGame({seed});E.worlds.start('hunter');result=null}
function createPlayer(name,gender){const E=AW.engine,r=E.rng,st={};for(const k of AW.systems.Rules.STATS)st[k]=r.int(8,12);E.player.create({name,gender,stats:st,money:50})}
function bgId(){const E=AW.engine,p=E.player.get(),w=p.location.world||E.worlds.current,c=w&&E.worlds.ctx(w);if(!c)return 'hunter.bg.city_day';const l=c.locations.get(p.location.loc)||c.locations.get(c.def.entry);return c.def.assetNs+'.'+l.bg}
function draw(){const cv=$('#stage');if(!cv)return;const g=cv.getContext('2d'),E=AW.engine;g.imageSmoothingEnabled=false;g.clearRect(0,0,cv.width,cv.height);
 g.drawImage(E.assets.get(bgId()),0,0,576,324);g.drawImage(E.assets.get('shared.char.base_m'),200,230,80,64)}
function render(){$('#app').innerHTML=`<header><b>Multiverse Hunter · Phase 3 (Hunter World)</b><span id="status"></span><span id="world"></span></header>
 <div id="create"></div>
 <canvas id="stage" width="576" height="324"></canvas>
 <div id="player" class="panel"></div>
 <div id="modal"></div>
 <div class="row" id="locs"></div><div class="row" id="acts"></div><div id="miss"></div>
 <div class="row">${[0,1,3,10].map(s=>`<button data-s="${s}">${s?s+'x':'หยุด'}</button>`).join('')}<button id="step">+1 เดือน</button><button id="menu">เปิด/ปิดเมนู (หยุดเวลา)</button><button id="new">เกมใหม่</button></div>
 <div class="row">${[0,1,2].map(i=>`<button data-save="${i}">เซฟช่อง ${i}</button><button data-load="${i}">โหลดช่อง ${i}</button>`).join('')}</div>
 <div class="row" id="gates"></div><div id="journal" class="panel"></div>
<div id="info"></div>`;
 wire();update(true)}
const RN=()=>AW.systems.STAT_NAME;
function statusLine(){const E=AW.engine,m=E.loop.month,p=E.player.get(),meta=E.state.get('meta');
 const age=p.created?`อายุ ${Math.floor(p.age/12)} ปี ${p.age%12} เดือน`:`อายุ ${15+Math.floor(m/12)} ปี ${m%12} เดือน (ยังไม่สร้างตัวละคร)`;
 return `เดือน ${m} (${age}) · seed ${meta.seed} · ${E.loop.paused?'หยุด: '+[...E.loop.reasons].join(', '):'ความเร็ว '+E.loop.speed+'x'}`}
function worldLine(){const E=AW.engine,cur=E.worlds.current,tr=E.state.get('worlds_time').traveling;
 return `โลก: ${tr?'กำลังเดินทาง':cur?esc(E.worlds.ctx(cur)?E.worlds.ctx(cur).def.name:cur+' (ยังไม่ติดตั้ง)'):'-'} · `+E.worlds.ids().map(id=>`${id} เดือน ${E.time.month(id)}`).join(' · ')}
function playerPanel(){const E=AW.engine,P=E.player,p=P.get();if(!p.created)return '';const c=E.worlds.ctx(p.location.world),loc=c&&c.locations.get(p.location.loc);
 const rank=Object.keys(p.ranks).map(k=>`${k}: ${p.ranks[k]}`).join(' ')||'ยังไม่มีแรงก์';
 return `<b>${esc(p.name)}</b> · ${p.class?esc(P.className(p.class)):'ยังไม่ตื่นพลัง'} · แรงก์ ${esc(rank)} · เลเวล ${p.level} (EXP ${p.exp}/${P.expNeed()}) · มานา ${p.mana}<br>
 พลังชีวิต ${p.hp}/${P.maxHp()}${p.injury?` · <span class="err">บาดเจ็บ ${p.injury} เดือน</span>`:''} · เงิน ${p.money} · ชื่อเสียง ${p.reputation} · AP ${p.ap}/2 · อยู่ที่ <b>${esc(loc?loc.name:p.location.loc)}</b><br>
 ${AW.systems.Rules.STATS.map(k=>`${RN()[k]} ${p.stats[k]}`).join(' · ')}<br>
 <small>อุปกรณ์: ${['weapon','armor'].map(s=>p.equipment[s]?esc(P.itemName(p.equipment[s])):'-').join(' / ')} · กระเป๋า: ${Object.keys(p.inventory).map(q=>esc(P.itemName(q))+' x'+p.inventory[q]).join(', ')||'ว่าง'} · สกิล: ${p.skills.map(q=>esc(P.skillName(q))).join(', ')||'-'}</small>`}
function modal(){const E=AW.engine;if(result){const r=result;return `<div class="card"><b>${esc(r.title)}</b><p>${esc(r.choice?'› '+r.choice:'')}</p>${r.fight?`<pre>${r.fight.lines.map(esc).join('\n')}</pre>`:''}<p>${r.success===false?'<span class="err">ไม่สำเร็จ</span> ':''}${esc(r.text||'')}</p>${r.effects&&r.effects.length?`<p class="ok">${r.effects.map(esc).join(' · ')}</p>`:''}<button data-ok="1">ตกลง</button></div>`}
 const p=E.events.pending();if(!p)return '';
 return `<div class="card"><b>${esc(p.def.title)}</b><p>${esc(E.events.fmt(p.def.text))}</p>${E.events.choices().map(c=>`<button data-choice="${c.i}" ${c.ok?'':'disabled'}>${esc(c.text)}${c.chance<1?` (${Math.round(c.chance*100)}%)`:''}${c.ok?'':' · '+esc(c.lockText||'เลือกไม่ได้')}</button>`).join('')}</div>`}
function locs(){const E=AW.engine,p=E.player.get(),c=p.created&&E.worlds.ctx(p.location.world);if(!c)return '';
 return 'ไปที่: '+[...c.locations.values()].map(l=>`<button data-loc="${l.id}" ${l.id===p.location.loc||!E.player.canEnter(l.id)||E.events.get().pending?'disabled':''} title="${esc(l.desc||'')}">${esc(l.name)}</button>`).join('')}
function acts(){const E=AW.engine;if(!E.player.get().created)return '';const a=E.events.actions();return a.length?'ทำ: '+a.map(x=>`<button data-act="${x.id}" ${x.ok?'':'disabled'}>${esc(x.title)}${x.ap?` (AP ${x.ap})`:''}</button>`).join(''):''}
function miss(){const E=AW.engine;if(!E.player.get().created)return '';const m=E.missions.available();return m.length?'<div class="row">ภารกิจ: '+m.map(x=>`<button data-mis="${x.id}" ${x.ok?'':'disabled'} title="${esc(x.why)}">[${x.rank}] ${esc(x.name)} · ${esc(x.enemy)} (${Math.round(x.chance*100)}%)${x.ok?'':' · '+esc(x.why)}</button>`).join('')+'</div>':''}
function journal(){const E=AW.engine;return '<b>บันทึก</b><br>'+E.events.get().log.slice(0,8).map(l=>`<small>เดือน ${l.m}: ${esc(l.t)}</small>`).join('<br>')}
function createForm(){const p=AW.engine.player.get();return p.created?'':`<div class="card"><b>เริ่มชีวิตใหม่ในโลกฮันเตอร์</b><p>อายุ 15 ปี นักเรียน ม.4</p><input id="pname" maxlength="24" placeholder="ชื่อตัวละคร" value="ซอนอู"> <select id="pgender"><option value="m">ชาย</option><option value="f">หญิง</option></select> <button id="pcreate">เริ่ม</button></div>`}
function gates(){const E=AW.engine;return E.worlds.gatesHere().map(g=>`<button data-gate="${g.id}">${esc(g.name)}</button>`).join('')||(E.worlds.current&&!E.worlds.has(E.worlds.current)?E.worlds.ids().map(id=>`<button data-go="${id}">กลับไป ${id}</button>`).join(''):'')}
function info(){const E=AW.engine,r=E.assets.report();return `<p>ภาพ: จริง ${r.real} · placeholder ${r.placeholder} · โลกที่ลงทะเบียน ${E.registries.world.all().length} · เซฟเกมเดิมที่พบ (ไม่แตะ) ${E.save.legacyKeys().length}</p>
 <p>เซฟใหม่: ${E.save.list().map(s=>esc(s.key)+(s.broken?' (เสีย)':` v${s.v} เดือน ${s.meta&&s.meta.month}`)).join(' · ')||'ยังไม่มี'}</p>
 <details id="dbg" ${window.__dbgOpen?'open':''}><summary>Debug</summary><p class="err">${E.debug.errors.map(esc).join('<br>')||'ไม่มี error'}</p><pre>${esc(JSON.stringify(E.state.snapshot(),null,1))}</pre><pre>${E.debug.lines.slice(-12).map(l=>esc(l.lvl+' '+l.msg)).join('\n')}</pre></details>`}
const set=(sel,html)=>{const el=$(sel);if(el&&el.__h!==html){el.innerHTML=html;el.__h=html}};
function update(force){const E=AW.engine;if(!$('#status'))return;$('#status').textContent=statusLine();$('#world').textContent=worldLine();
 const now=Date.now();if(!force&&E.loop.speed&&now-_last<300)return;_last=now;
 set('#create',createForm());set('#player',playerPanel());set('#modal',modal());set('#locs',locs());set('#acts',acts());set('#miss',miss());set('#journal',journal());set('#gates',gates());
 set('#info',info());const d=$('#dbg');if(d)d.ontoggle=e=>window.__dbgOpen=e.target.open}
// ผลที่ต้องแสดง: คำตอบเหตุการณ์ (มี choice) หรือรายงานภารกิจ (มี name+fight) · ถ้ามีเหตุการณ์ใหม่ค้าง modal จะแสดงต่อหลังกดตกลง
function act(fn){const E=AW.engine;try{const r=fn();if(r&&r.name&&r.fight)result={title:'ภารกิจ: '+r.name,success:r.win,text:r.win?'ภารกิจสำเร็จ':'ภารกิจล้มเหลว',fight:r.fight,effects:r.effects};else if(r&&r.choice!==undefined)result=r}
 catch(e){E.debug.error(e.message);result={title:'ทำไม่ได้',text:e.message}}update(true)}
function wire(){const E=AW.engine;
 document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{E.loop.setSpeed(+b.dataset.s);update(true)});
 $('#step').onclick=()=>{E.loop.step(1);update(true)};$('#new').onclick=()=>{newGame(String(Date.now()));update(true)};
 $('#menu').onclick=()=>{E.loop.reasons.has('menu')?E.loop.resume('menu'):E.loop.pause('menu')};
 document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{E.saveTo(+b.dataset.save);update(true)});
 document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{try{E.loadFrom(+b.dataset.load);if(!E.worlds.current)E.worlds.start('hunter')}catch(e){E.debug.error(e.message)}result=null;update(true)});
 $('#app').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(b.id==='pcreate'){createPlayer($('#pname').value.trim()||'ซอนอู',$('#pgender').value);update(true)}
  else if(d.ok){result=null;update(true)}
  else if(d.choice!==undefined)act(()=>E.events.answer(+d.choice));
  else if(d.loc)act(()=>{E.player.moveTo(d.loc)});
  else if(d.act)act(()=>E.events.doAction(d.act));
  else if(d.mis)act(()=>E.missions.start(d.mis));
  else if(d.gate)act(()=>{E.worlds.travelVia(d.gate)});
  else if(d.go)act(()=>{E.worlds.travel(d.go)})});
 draw()}
AW.ui.boot=boot;
})(globalThis.AW);
