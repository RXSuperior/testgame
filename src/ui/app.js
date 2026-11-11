// App shell (Phase 7A): boot · router (เปลี่ยนหน้าไม่ reload) · โหมด focus ของหน้าพิเศษ · การกดปุ่มทั้งหมด (event delegation ผ่าน data-*)
// UI เรียก API ของระบบเท่านั้น · ไม่แตะ save format (สถานะ UI เก็บใน sessionStorage แยกจากเซฟ)
(function(AW){
'use strict';
const U=AW.ui.u,$=U.$,esc=U.esc,L=()=>AW.ui.layout,S=()=>AW.ui.screens;
const ss={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}}};
const st=AW.ui.state={page:ss.get('mvh-ui-page')||'dashboard',override:false,right:ss.get('mvh-ui-right')!=='0',dlg:null,result:null,navOpen:false};
let _last=0,_modalWas='';
AW.ui.dev=()=>/[?&]debug=1/.test(location.search)||ss.get('mvh-ui-dev')==='1';
function boot(){const E=new AW.core.Engine({assets:{imageFactory:src=>{const i=new Image();i.src=src;return i},canvasFactory:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c}}});
 E.assets.registerAll(AW.data.assets);AW.systems.installGameplay(E);const wr=E.worlds.registerAll(AW.data.worlds);if(wr.bad.length)wr.bad.forEach(m=>E.debug.error(m));
 window.addEventListener('error',e=>E.debug.error('window: '+e.message));
 E.bus.on('month',({month})=>E.debug.log('เดือน '+month),{owner:'shell'});
 AW.engine=E;newGame('demo');if(!AW.ui.pages.some(p=>p.id===st.page))st.page='dashboard';render();setInterval(AW.ui.scene.draw,200);
 E.bus.on('month:after',()=>update(),{owner:'shell'});E.bus.on('loop:pause',()=>update(),{owner:'shell'});E.bus.on('world:enter',()=>update(true),{owner:'shell'});return E}
function newGame(seed){const E=AW.engine;E.newGame({seed});E.worlds.start('hunter');st.result=null;st.dlg=null}
function createPlayer(name,gender){const E=AW.engine,r=E.rng,s={};for(const k of AW.systems.Rules.STATS)s[k]=r.int(8,12);E.player.create({name,gender,stats:s,money:50})}
// ---- โครงหน้า: header / เมนูซ้าย / main (หน้าพิเศษ + ทุกหน้า) / แผงขวา / เมนูล่าง ----
function render(){$('#app').className='app';$('#app').innerHTML=`<header class="hdr" id="hdr"></header><aside class="side" id="side"></aside>
 <main class="main" id="main"><div id="focusnote"></div><div id="create"></div><div id="modal" aria-live="polite"></div><div id="combat"></div><div id="adv"></div>
 ${AW.ui.pages.map(p=>`<section class="page" data-page="${p.id}" id="pg-${p.id}" aria-label="${esc(p.title)}"></section>`).join('')}</main>
 <aside class="right" id="right" aria-label="ข้อมูลเสริม"></aside><nav class="bnav" id="bnav" aria-label="เมนูมือถือ"></nav><div id="dlg"></div><div id="confirm"></div><div id="toasts"></div>`;
 wire();update(true)}
// ความสูง header เปลี่ยนตามความกว้างจอ (หนึ่งหรือสองแถว) · แถบเมนู/แผงขวาที่ sticky ใช้ค่านี้ จึงไม่ถูก header บัง
function syncHdr(){const h=$('#hdr');if(h)document.documentElement.style.setProperty('--hdr',h.offsetHeight+'px')}
window.addEventListener('resize',()=>syncHdr());
const set=(sel,html)=>{const el=$(sel);if(el&&el.__h!==html){el.innerHTML=html;el.__h=html}return el};
function focusOn(E){const s=E.combat.session(),r=E.dungeon.run();return !!((s&&s.status==='active')||(r&&r.status==='active'))}
function update(force){const E=AW.engine;if(!$('#hdr'))return;const now=Date.now();if(!force&&E.loop.speed&&now-_last<300)return;_last=now;
 const p=E.player.get(),focus=focusOn(E);if(!focus)st.override=false;
 const app=$('#app');app.classList.toggle('focus',focus&&!st.override);app.classList.toggle('no-right',!st.right);
 set('#hdr',L().header(E));syncHdr();$('#world').textContent=L().worldLine(E);$('#status').textContent=L().statusLine(E);
 set('#side',L().side(st.page));$('#side').classList.toggle('open',st.navOpen);set('#bnav',L().bnav(st.page));
 set('#focusnote',focus&&st.override?`<div class="todo focus-note">กำลังอยู่ในกิจกรรมพิเศษ <button class="sm" data-a="backFocus">กลับไปที่การต่อสู้/ดันเจี้ยน</button></div>`:'');
 set('#create',S().create(E));const mh=S().modal(E,st.result);set('#modal',mh);
 if(mh&&!_modalWas){const m=$('#modal');if(m&&m.scrollIntoView)m.scrollIntoView({block:'nearest'})}_modalWas=mh;
 set('#combat',S().combat(E));const r=E.dungeon.run();set('#adv',r?S().dungeonRun(E):'');
 for(const pg of AW.ui.pages){const el=$('#pg-'+pg.id);if(!el)continue;el.classList.toggle('active',pg.id===st.page);set('#pg-'+pg.id,p.created||pg.id==='settings'||pg.id==='dashboard'?pg.render(E):'')}
 set('#right',L().right(E));set('#dlg',st.dlg?S().dialogue(E,st.dlg):'')}
// ---- router ----
function go(id,{override=false}={}){if(!AW.ui.pages.some(p=>p.id===id))return;st.page=id;ss.set('mvh-ui-page',id);st.navOpen=false;if(override||focusOn(AW.engine))st.override=true;update(true);const m=$('#main');if(m&&window.scrollTo)window.scrollTo(0,0)}
// เปิดหน้าที่มี element นั้นอยู่ (ใช้กับลิงก์ภายในและการทดสอบอัตโนมัติ)
AW.ui.reveal=sel=>{const el=document.querySelector(sel);if(!el)return false;const pg=el.closest('.page');if(pg&&(!pg.classList.contains('active')||$('#app').classList.contains('focus')))go(pg.dataset.page,{override:true});return true};
AW.ui.go=go;
// ---- การกระทำ: ผลลัพธ์แสดงใน modal (เหตุการณ์/ภารกิจ) หรือ toast · error ไปที่ debug และ toast ----
function act(fn,okMsg){const E=AW.engine;try{const r=fn();if(r&&r.name&&r.fight)st.result={title:'ภารกิจ: '+r.name,success:r.win,text:r.win?'ภารกิจสำเร็จ':'ภารกิจล้มเหลว',fight:r.fight,effects:r.effects};
  else if(r&&r.choice!==undefined)st.result=r;else if(okMsg)U.toast(okMsg,'good')}
 catch(e){E.debug.error(e.message);U.toast('ทำไม่ได้: '+e.message,'bad')}update(true)}
// ยืนยันความเสี่ยงสองจังหวะบนปุ่ม (ไม่บังจอ) · การกระทำสำคัญอื่นใช้ confirm modal
function confirm2(b){if(b.dataset.armed)return true;b.dataset.armed='1';b.textContent='ยืนยัน: ยอมรับความเสี่ยงและเริ่ม';b.classList.add('danger');return false}
function wire(){const E=AW.engine,app=$('#app');
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#confirm').innerHTML){$('#confirm').innerHTML=''}else if(st.dlg){st.dlg=null;update(true)}else if(st.navOpen){st.navOpen=false;update(true)}}});
 app.addEventListener('click',e=>{if(U.confirmClick(e))return;const b=e.target.closest('button,[data-dlgclose]');if(!b)return;if(b.disabled)return;const d=b.dataset;
  if(d.dlgclose!==undefined){if(b.tagName!=='BUTTON'&&e.target!==b)return;st.dlg=null;update(true);return}
  if(d.nav){go(d.nav);return}
  if(d.navToggle){st.navOpen=!st.navOpen;update(true);return}
  if(d.s!==undefined){E.loop.setSpeed(+d.s);update(true);return}
  if(b.id==='step'){E.loop.step(1);update(true);return}
  if(b.id==='menu'){E.loop.reasons.has('menu')?E.loop.resume('menu'):E.loop.pause('menu');update(true);return}
  if(d.save!==undefined){act(()=>{E.saveTo(+d.save)},'เซฟช่อง '+d.save+' แล้ว');return}
  if(d.load!==undefined){try{E.loadFrom(+d.load);if(!E.worlds.current)E.worlds.start('hunter');U.toast('โหลดช่อง '+d.load+' แล้ว','good')}catch(err){E.debug.error(err.message);U.toast('โหลดไม่ได้: '+err.message,'bad')}st.result=null;st.dlg=null;update(true);return}
  if(b.id==='new'){newGame(String(Date.now()));update(true);return}
  if(b.id==='new2'){newGame(String(Date.now()));go('dashboard');return}
  if(b.id==='pcreate'){createPlayer(($('#pname').value||'').trim()||'ซอนอู',$('#pgender').value);go('dashboard');return}
  if(d.a==='newgame'){U.confirm('เริ่มเกมใหม่?','ความคืบหน้าที่ยังไม่ได้เซฟจะหายไป เซฟที่มีอยู่ไม่ถูกลบ',()=>{newGame(String(Date.now()));go('dashboard')},{yes:'เริ่มใหม่',danger:true});return}
  if(d.a==='toggleRight'){st.right=!st.right;ss.set('mvh-ui-right',st.right?'1':'0');update(true);return}
  if(d.a==='toggleDev'){ss.set('mvh-ui-dev',AW.ui.dev()&&ss.get('mvh-ui-dev')==='1'?'0':'1');update(true);return}
  if(d.a==='backFocus'){st.override=false;update(true);return}
  if(d.dlg){st.dlg=d.dlg;update(true);return}
  if(d.ok){st.result=null;update(true);return}
  if(d.choice!==undefined){act(()=>E.events.answer(+d.choice));return}
  if(d.loc){act(()=>{E.player.moveTo(d.loc)});return}
  if(d.act){act(()=>E.events.doAction(d.act));return}
  if(d.mis){if(d.accept&&!confirm2(b))return;act(()=>E.missions.start(d.mis,{acceptRisk:!!d.accept}));return}
  if(d.cact){act(()=>{E.combat.act(d.cact==='skill'?{type:'skill',id:d.cid}:{type:d.cact})});return}
  if(d.invite){act(()=>{E.party.invite(d.invite)},'เข้าร่วมทีมแล้ว');return}
  if(d.pleave){const n=E.npcs.get(d.pleave);U.confirm('ให้ออกจากทีม?',`${n?n.name:''} จะออกจากทีม ความสัมพันธ์อาจลดลง`,()=>act(()=>{E.party.leave(d.pleave,'ผู้เล่นให้ออก')},'ออกจากทีมแล้ว'),{yes:'ให้ออก',danger:true});return}
  if(d.upg){act(()=>{E.player.upgrade(d.upg)},'อัปเกรดแล้ว');return}
  if(d.equip){act(()=>{E.player.equip(d.equip)},'สวมแล้ว');return}
  if(d.repair){act(()=>{E.economy.repair(d.repair)},'ซ่อมแล้ว');return}
  if(d.svc){act(()=>{E.economy.buy(d.svc)},'ดำเนินการแล้ว');return}
  if(d.svcx){act(()=>{E.economy.cancel(d.svcx)},'หยุดบริการแล้ว');return}
  if(d.svcr){act(()=>{E.economy.resume(d.svcr)},'ใช้บริการต่อแล้ว');return}
  if(d.inv){act(()=>{E.economy.invest(d.inv,+d.amt)},'ลงทุนแล้ว');return}
  if(d.wd){act(()=>{E.economy.withdraw(d.wd,+d.amt)},'ถอนเงินแล้ว');return}
  if(d.dgin){if(d.accept&&!confirm2(b))return;act(()=>{E.dungeon.enter(d.dgin,{fromCheckpoint:!!d.cp})});return}
  if(d.dg){act(()=>{const r=d.dg==='advance'?E.dungeon.advance():d.dg==='leave'?E.dungeon.leave():E.dungeon.close();if(r&&r.status)st.result={title:'ผลการสำรวจ',text:({cleared:'เคลียร์ดันเจี้ยน',left:'ออกจากดันเจี้ยน',retreated:'ถอนตัว',failed:'สำรวจล้มเหลว'})[r.status]+` · เงิน ${r.money} EXP ${r.exp}`,effects:(r.items||[]).concat(r.clear||[])};else if(r&&r.fight&&r.fight.outcome!=='win')st.result={title:'ต่อสู้ในดันเจี้ยน',success:false,text:r.fight.outcome,fight:r.fight}});return}
  if(d.tw){if(d.accept&&!confirm2(b))return;act(()=>{E.tower.climb(d.tw,{acceptRisk:!!d.accept})});return}
  if(d.gate){act(()=>{E.worlds.travelVia(d.gate)});return}
  if(d.go){act(()=>{E.worlds.travel(d.go)});return}
  if(d.ia){act(()=>E.rels.interact(d.npc,d.ia));return}
  if(d.job){act(()=>{E.life.takeJob(d.job)},'เริ่มงานแล้ว');return}
  if(d.quit){U.confirm('ลาออกจากงาน?','อายุงานจะเริ่มนับใหม่เมื่อทำงานใหม่',()=>act(()=>{E.life.quitJob()},'ลาออกแล้ว'),{yes:'ลาออก',danger:true});return}
  if(d.home){const h=()=>act(()=>{E.life.moveIn(d.home,d.mode)},'ย้ายที่พักแล้ว');if(d.mode==='own')U.confirm('ซื้อที่พัก?','การซื้อบ้านใช้เงินก้อนใหญ่ และมีค่าดูแลรายเดือน',h,{yes:'ซื้อ'});else h();return}
  if(d.pgate){act(()=>{E.gates.travel(d.pgate)});return}});
 app.addEventListener('toggle',e=>{if(e.target.id==='dbg')window.__dbgOpen=e.target.open},true)}
// ---- Debug panel (เฉพาะโหมดพัฒนา: ?debug=1 หรือเปิดในหน้าระบบ) ----
AW.ui.debugPanel=E=>{const r=E.assets.report(),dg=E.worlds.gatesHere().map(g=>`<button class="sm" data-gate="${g.id}">${esc(g.name)}</button>`).join('')||(E.worlds.current&&!E.worlds.has(E.worlds.current)?E.worlds.ids().map(id=>`<button class="sm" data-go="${id}">กลับไป ${id}</button>`).join(''):'');
 return `<div class="panel devp"><h3 class="gold-t">Debug (โหมดพัฒนา)</h3><div class="row" id="gates">Debug Gate: ${dg}</div><div class="row"><button id="new" class="sm">เกมใหม่ทันที (ไม่ถาม)</button></div>
 <div id="info"><p><small>ภาพ: จริง ${r.real} · placeholder ${r.placeholder} · โลกที่ลงทะเบียน ${E.registries.world.all().length} · เซฟเกมเดิมที่พบ (ไม่แตะ) ${E.save.legacyKeys().length}</small></p>
 <p><small>เซฟใหม่: ${E.save.list().map(s=>esc(s.key)+(s.broken?' (เสีย)':` v${s.v} เดือน ${s.meta&&s.meta.month}`)).join(' · ')||'ยังไม่มี'}</small></p>
 <details id="dbg" ${window.__dbgOpen?'open':''}><summary>สถานะภายใน</summary><p class="err">${E.debug.errors.map(esc).join('<br>')||'ไม่มี error'}</p><pre>${esc(JSON.stringify(E.state.snapshot(),null,1))}</pre><pre>${E.debug.lines.slice(-12).map(l=>esc(l.lvl+' '+l.msg)).join('\n')}</pre></details></div></div>`};
AW.ui.boot=boot;AW.ui.update=update;
})(globalThis.AW);
