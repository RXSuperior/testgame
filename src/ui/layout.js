// Layout components (Phase 7A): sticky header · เมนูซ้าย · เมนูล่าง (มือถือ) · แผงขวา
(function(AW){
'use strict';
const U=AW.ui.u,esc=U.esc;
// ---- header: ชื่อ อายุ/เดือน HP MP เงิน แรงก์ เลเวล/EXP AP เวลา ความเร็ว ----
function header(E){const P=E.player,p=P.get(),m=E.loop.month,rs=E.worlds.current&&E.worlds.ctx(E.worlds.current),rank=p.created&&rs&&rs.config.rankSystem?p.ranks[rs.config.rankSystem.id]:null;
 const age=p.created?`${Math.floor(p.age/12)} ปี ${p.age%12} ด.`:'-',speed=E.loop.paused||!E.loop.speed?'หยุด':E.loop.speed+'x';
 const stats=p.created?`<div class="hstat name" title="${esc(p.name)}"><span>${esc(p.class?P.className(p.class):'ยังไม่ตื่นพลัง')}</span><b>${esc(p.name)}</b></div>
  <div class="hstat" title="แรงก์ฮันเตอร์">${U.rank(rank)}</div>
  <div class="hstat" title="พลังชีวิต"><span>HP ${Math.max(0,p.hp)}/${P.maxHp()}</span>${U.bar('hp',p.hp,P.maxHp(),'HP')}</div>
  <div class="hstat opt2" title="มานาสูงสุดในการต่อสู้"><span>MP ${P.maxMp()}</span>${U.bar('mp',P.maxMp(),P.maxMp(),'MP')}</div>
  <div class="hstat" title="เงิน"><span>เงิน</span><b class="gold-t">${U.n(p.money)}</b></div>
  <div class="hstat opt3" title="เลเวลและค่าประสบการณ์"><span>Lv ${p.level}</span>${U.bar('xp',p.exp,P.expNeed(),'EXP')}</div>
  <div class="hstat" title="แรงกายต่อเดือน (AP) ใช้ทำกิจกรรม/ภารกิจ"><span>AP</span><span class="ap">${[0,1].map(i=>`<i class="${i<p.ap?'on':''}"></i>`).join('')}</span></div>
  <div class="hstat opt" title="อายุ"><span>อายุ</span><b>${age}</b></div>`:'<div class="hstat"><b>ยังไม่สร้างตัวละคร</b></div>';
 return `<button class="menu-btn ghost sm" data-nav-toggle="1" aria-label="เปิดเมนู">☰</button><span class="brand">MULTIVERSE HUNTER</span>
 <div class="hstats">${stats}<div class="hstat opt" title="เดือนของเกม"><span>เดือน ${m} · ${esc(speed)}</span><span id="world"></span></div></div>
 <div class="hctl" role="group" aria-label="ควบคุมเวลา">${[0,1,3,10].map(s=>`<button data-s="${s}" class="${(!E.loop.paused||s===0)&&E.loop.speed===s?'on':''}" title="${s?'ความเร็ว '+s+'x':'หยุดเวลา'}">${s?s+'x':'⏸'}</button>`).join('')}<button id="step" title="ข้ามไป 1 เดือน">+1 เดือน</button><button id="menu" class="${E.loop.reasons.has('menu')?'on':''}" title="หยุด/เดินเวลา (เมนู)">⏯</button><button data-a="toggleRight" class="opt-right ${AW.ui.state.right?'on':''}" title="แสดง/ซ่อนแผงข้าง" aria-label="แสดงหรือซ่อนแผงข้าง">▤</button></div><span id="status"></span>`}
function worldLine(E){const cur=E.worlds.current,tr=E.state.get('worlds_time').traveling;
 return `โลก: ${tr?'กำลังเดินทาง':cur?(E.worlds.ctx(cur)?E.worlds.ctx(cur).def.name:cur+' (ยังไม่ติดตั้ง)'):'-'}`}
function statusLine(E){const m=E.loop.month,meta=E.state.get('meta');return `เดือน ${m} · seed ${meta.seed} · ${E.loop.paused?'หยุด: '+[...E.loop.reasons].join(', '):'ความเร็ว '+E.loop.speed+'x'}`}
// ---- เมนู ----
const NAV=[['dashboard','⌂','หน้าหลัก'],['character','☺','ตัวละคร'],['inventory','▣','กระเป๋า'],['skills','✦','สกิล'],['equipment','⚔','อุปกรณ์'],['party','⚑','ทีม'],['missions','✉','ภารกิจ'],['map','⌖','แผนที่ / โลก'],
 ['relations','♡','ความสัมพันธ์'],['family','⌂','ครอบครัว'],['economy','¤','การเงิน'],['sep','','ฮันเตอร์'],['association','⛨','สมาคมฮันเตอร์'],['guild','⚜','กิลด์'],['dungeon','⛰','ดันเจี้ยน'],['tower','♜','หอคอย'],['market','☾','ตลาดมืด'],['sep','','ระบบ'],['settings','⚙','ระบบ / ตั้งค่า']];
const BNAV=[['dashboard','⌂','หน้าหลัก'],['character','☺','ตัวละคร'],['missions','✉','ภารกิจ'],['map','⌖','แผนที่'],['more','☰','เมนู']];
function side(cur){return `<nav class="nav" aria-label="เมนูหลัก">${NAV.map(([id,ic,t])=>id==='sep'?`<div class="sep">${esc(t)}</div>`:`<button data-nav="${id}" class="${id===cur?'active':''}" ${id===cur?'aria-current="page"':''} title="${esc(t)}"><span class="ic" aria-hidden="true">${ic}</span><span class="lbl">${esc(t)}</span></button>`).join('')}</nav>`}
function bnav(cur){return BNAV.map(([id,ic,t])=>`<button ${id==='more'?'data-nav-toggle="1"':`data-nav="${id}"`} class="${id===cur?'active':''}"><span class="ic">${ic}</span>${esc(t)}</button>`).join('')}
// ---- แผงขวา: NPC ที่พบ · งานที่ทำอยู่ · เหตุการณ์ล่าสุด · ข่าวโลก · บันทึกประจำเดือน ----
function right(E){const p=E.player.get();if(!p.created)return '<div class="panel"><h4>ยินดีต้อนรับ</h4><small>สร้างตัวละครเพื่อเริ่มเล่น</small></div>';
 const met=E.rels.list('player',{dir:'in'}).filter(x=>E.npcs.get(x.from)).sort((a,b)=>(b.last||0)-(a.last||0)).slice(0,6);
 const active=[];const s=E.combat.session(),r=E.dungeon.run(),pm=E.missions.get().pending,ta=E.tower.get().attempt,ev=E.events.pending();
 if(s&&s.status==='active')active.push(`การต่อสู้ รอบ ${s.round}`);if(pm)active.push('ภารกิจ: '+((E.missions.def(pm.q)||{}).name||pm.q));if(r&&r.status==='active')active.push('สำรวจ: '+((E.dungeon.def(r.dungeon)||{}).name||''));
 if(ta)active.push('ปีนหอคอยชั้น '+ta.floor);if(ev)active.push('เหตุการณ์: '+ev.def.title);
 const log=E.events.get().log,news=log.filter(l=>/ข่าว|เกต|หอคอย/.test(l.t)).slice(0,4),EL=E.economy.get().ledger[0],LL=E.life.get().ledger[0];
 const age=Math.floor(p.age/12)+' ปี '+(p.age%12)+' เดือน';
 return `<div class="panel only-compact"><h4>เวลา</h4><small>เดือน ${E.loop.month} · ${esc(worldLine(E))} · อายุ ${age} · ${E.loop.paused||!E.loop.speed?'หยุดเวลา':'ความเร็ว '+E.loop.speed+'x'}</small></div><div class="panel"><h4>งานที่กำลังทำ</h4>${active.length?active.map(a=>`<small>• ${esc(a)}</small>`).join('<br>'):'<small class="dim">ว่าง</small>'}</div>
 <div class="panel"><h4>คนที่รู้จัก</h4>${met.length?met.map(x=>{const n=E.npcs.get(x.from);return `<div class="row" style="margin:2px 0"><button class="sm ghost" data-dlg="${x.from}" title="เปิดบทสนทนา">${esc(n.name)}</button><small>${esc(E.rels.typeName(E.rels.type(x.from,'player'))||'')} ${x.aff}</small></div>`}).join(''):'<small class="dim">ยังไม่รู้จักใคร</small>'}</div>
 <div class="panel"><h4>เหตุการณ์ล่าสุด</h4><div class="feed" id="journal">${log.slice(0,8).map(l=>`<small>เดือน ${l.m}: ${esc(l.t)}</small>`).join('')||'<small class="dim">ยังไม่มี</small>'}</div></div>
 <div class="panel"><h4>ข่าวสารโลก</h4><div class="feed">${news.map(l=>`<small>${esc(l.t)}</small>`).join('')||'<small class="dim">ยังไม่มีข่าว</small>'}</div></div>
 <div class="panel"><h4>บันทึกประจำเดือน</h4>${EL?`<small>เดือน ${EL.m}: รับ <span class="ok">${U.n(EL.in)}</span> · จ่าย <span class="err">${U.n(EL.out)}</span></small>`:'<small class="dim">ยังไม่มี</small>'}${LL&&LL.note?`<br><small>${esc(LL.note)}</small>`:''}</div>`}
AW.ui.layout={header,worldLine,statusLine,side,bnav,right,NAV};
})(globalThis.AW);
