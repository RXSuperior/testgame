// Special screens (Phase 7A): สร้างตัวละคร · เหตุการณ์/ผลลัพธ์/สิ้นชีวิต · การต่อสู้ · สำรวจดันเจี้ยน · บทสนทนา NPC · เดินทางผ่าน Gate
// หน้าพิเศษแสดงแทนเนื้อหาปกติ (โหมด focus) เพื่อไม่ให้ Dashboard แย่งพื้นที่
(function(AW){
'use strict';
const U=AW.ui.u,esc=U.esc,S=AW.ui.screens={};
S.create=E=>{const p=E.player.get();return p.created?'':`<div class="screen"><h2>เริ่มชีวิตใหม่ในโลกฮันเตอร์</h2><p class="muted">อายุ 15 ปี นักเรียน ม.4 · เกตเปิดมาได้ 20 ปี วันหนึ่งท่านอาจตื่นพลัง</p>
 <div class="row"><label>ชื่อ <input id="pname" maxlength="20" placeholder="ซอนอู" autocomplete="off"></label><label>เพศ <select id="pgender"><option value="m">ชาย</option><option value="f">หญิง</option></select></label></div>
 <div class="row"><button id="pcreate" class="pri">เริ่มเล่น</button></div></div>`};
// เหตุการณ์ที่ต้องตอบ · ผลลัพธ์ล่าสุด · สิ้นสุดชีวิต (ใช้ id #modal เดิม)
S.modal=(E,result)=>{const pp=E.player.get();
 if(pp.created&&!pp.alive&&!result){const L=E.health.get().lives.slice(-1)[0]||{};
  return `<div class="screen card danger" role="dialog" aria-label="สิ้นสุดชีวิต"><h2>สิ้นสุดชีวิตของ ${esc(L.name||pp.name)}</h2><p>จากไปเมื่ออายุ ${L.ageY} ปี สาเหตุ: ${esc(L.cause||'')}</p>
  <div class="kv"><span>อาชีพ</span><span>${L.class?esc(E.player.className(L.class)):'ไม่ได้ตื่นพลัง'}</span><span>แรงก์</span><span>${esc(Object.values(L.ranks||{}).join(' ')||'-')}</span><span>เลเวล</span><span>${L.level}</span><span>กรรม</span><span>${L.karma}</span><span>ทรัพย์สิน</span><span>${U.n(L.assets?L.assets.money:0)}</span></div>
  <p>คนสำคัญ: ${(L.people||[]).slice(0,5).map(x=>esc(x.name)+' ('+esc(E.rels.typeName(x.type))+')').join(', ')||'-'}</p><p>ครอบครัว: ${L.family?L.family.members.map(m=>esc(m.name||'')+' '+esc(E.family.roleName(m.role))+(m.alive?'':' (จากไปแล้ว)')).join(', '):'-'}</p>
  <p><small>ประวัติชีวิตถูกบันทึกไว้แล้ว (ยังไม่มีการเล่นต่อเป็นรุ่นลูก)</small></p><button id="new2" class="pri">เริ่มชีวิตใหม่</button></div>`}
 if(result){const r=result;return `<div class="screen card event" role="dialog" aria-label="${esc(r.title)}"><h2>${esc(r.title)}</h2>${r.choice?`<p class="muted">› ${esc(r.choice)}</p>`:''}${r.fight?`<pre>${r.fight.lines.map(esc).join('\n')}</pre>`:''}
  <p>${r.success===false?'<span class="err">ไม่สำเร็จ</span> ':''}${esc(r.text||'')}</p>${r.effects&&r.effects.length?`<p class="ok">${r.effects.map(esc).join(' · ')}</p>`:''}<div class="row"><button data-ok="1" class="pri">ตกลง</button></div></div>`}
 const p=E.events.pending();if(!p)return '';const who=p.who&&E.npcs.get(p.who);
 return `<div class="screen card event" role="dialog" aria-label="${esc(p.def.title)}"><h2>${esc(p.def.title)} ${who?U.badge(who.name,'vio'):''}</h2><p>${esc(E.events.fmt(p.def.text,p.who))}</p>
 <div class="choice-list">${E.events.choices().map(c=>`<button data-choice="${c.i}" ${c.ok?'':'disabled'}>${esc(c.text)}${c.chance<1?` <span class="badge blue">${Math.round(c.chance*100)}%</span>`:''}${c.ok?'':' · '+esc(c.lockText||'เลือกไม่ได้')}</button>`).join('')}</div></div>`};
// การต่อสู้แบบเลือกท่า
S.combat=E=>{const s=E.combat.session();if(!s)return '';const RK={normal:'ปกติ',high:'เสี่ยงสูง',lethal:'อันตรายถึงชีวิต'};
 const unit=(n,hp,max,extra='',down=false)=>`<div class="unit ${down?'down':''}"><div class="row" style="margin:0;justify-content:space-between"><b>${esc(n)}</b><small>${extra}</small></div>${U.bar('hp',hp,max,'HP')}<small>HP ${Math.max(0,Math.round(hp))}/${max}</small></div>`;
 return `<div class="screen combat" role="region" aria-label="การต่อสู้"><h2>⚔ การต่อสู้ · รอบ ${s.round} ${U.badge('ความเสี่ยง: '+RK[s.risk],s.risk==='normal'?'':'red')}${s.me.critical?U.badge('อาการวิกฤต','red'):''}</h2>
 <div class="vs"><div><h4>ฝ่ายเรา</h4>${unit(s.me.name,s.me.hp,s.me.max,`MP ${Math.round(s.me.mp)}/${s.me.maxMp}`)}${s.party.map(m=>unit(m.name,m.hp,m.max,E.party.roleName(m.role)+(m.down?' · หมดสภาพ':''),m.down)).join('')}</div>
 <div><h4>ศัตรู</h4>${s.foes.map(f=>unit(f.name,f.hp,f.max,(f.enraged?'คลั่ง ':'')+(f.shield>0?'โล่ ':'')+(f.armor?'เกราะ':''),f.hp<=0)).join('')}</div></div>
 <pre aria-live="polite">${s.log.slice(-6).map(esc).join('\n')}</pre>
 ${s.status==='active'?`<div class="actions">${E.combat.options().map(o=>`<button data-cact="${o.type}" data-cid="${o.id||''}" ${o.why?'disabled':''} class="${o.type==='retreat'?'danger':o.type==='skill'?'pri':''}">${esc(o.name)}${o.why?' · '+esc(o.why):''}</button>`).join('')}</div>`:'<small>จบการต่อสู้แล้ว</small>'}</div>`};
// ดันเจี้ยน: กำลังสำรวจหรือเพิ่งจบ (ใช้ id #adv เดิม)
S.dungeonRun=E=>{const r=E.dungeon.run();if(!r)return '';const g=E.dungeon.def(r.dungeon),cur=E.dungeon.current();
 return `<div class="screen" role="region" aria-label="ดันเจี้ยน"><h2>⛰ ${esc(g.name)} ${U.badge('แรงก์ '+g.rank,'gold')} ${r.status==='active'?U.badge(`ชั้น ${cur?cur.floor+1:'-'}/${g.floors} · ห้อง ${cur?cur.index+1:'-'}/${cur?cur.rooms:'-'}`,'blue'):U.badge('จบแล้ว ('+r.status+')')}</h2>
 <div class="kv"><span>ความยาก</span><span>x${r.mult}</span><span>ของที่เก็บได้</span><span>เงิน ${U.n(r.loot.money)} · EXP ${U.n(r.loot.exp)}${Object.keys(r.loot.items).length?' · ไอเทม '+Object.values(r.loot.items).reduce((a,b)=>a+b,0)+' ชิ้น':''}</span></div>
 <pre>${r.log.slice(-6).map(esc).join('\n')}</pre>
 <div class="actions">${r.status==='active'?(r.waiting?'<small>จัดการห้องนี้ก่อน (เหตุการณ์หรือการต่อสู้)</small>':`<button data-dg="advance" class="pri">ไปห้องถัดไป</button><button data-dg="leave">ออกจากดันเจี้ยน (ได้ของครบ)</button>`):`<button data-dg="close" class="pri">ปิด</button>`}</div></div>`};
// บทสนทนา NPC (เปิดจากรายชื่อคน)
S.dialogue=(E,q)=>{const n=q&&E.npcs.get(q);if(!n)return '';const x=E.rels.edge(q,'player'),t=E.rels.type(q,'player'),here=E.npcs.at(n.world,E.player.get().location.loc).some(m=>m.id===q),mem=(n.memory||[]).slice(0,3);
 const job=n.role||n.occupationName||((E.worlds.ctx(n.world).list('jobs').get(n.occupation)||{}).name)||'';const cb=E.party.combatOf(q);
 return `<div class="backdrop" data-dlgclose="1"><div class="dialog wide" role="dialog" aria-modal="true" aria-label="คุยกับ ${esc(n.name)}"><div class="row" style="justify-content:space-between;margin:0"><h3>${esc(n.name)} ${U.badge(job)}</h3><button class="sm ghost" data-dlgclose="1" aria-label="ปิด">✕</button></div>
 <div class="grid sm"><div class="tile"><div class="s">อายุ</div><div class="t">${E.npcs.ageY(q)} ปี${n.alive?'':' (จากไปแล้ว)'}</div></div><div class="tile"><div class="s">ความสัมพันธ์</div><div class="t">${t?esc(E.rels.typeName(t)):'ยังไม่รู้จัก'}</div></div>
 <div class="tile" title="ความชอบ"><div class="s">ชอบ</div><div class="t">${x?x.aff:0}</div></div><div class="tile" title="ความไว้ใจ"><div class="s">ไว้ใจ</div><div class="t">${x?x.trust:0}</div></div>${cb?`<div class="tile"><div class="s">สายต่อสู้</div><div class="t">${esc(E.party.roleName(cb.role))}</div></div>`:''}</div>
 ${mem.length?`<h4 style="margin-top:10px">ความทรงจำล่าสุด</h4>${mem.map(m=>`<small>• ${esc(m.t||m)}</small>`).join('<br>')}`:''}
 <div class="actions" style="margin-top:12px">${here&&n.alive?E.rels.actions(q).map(a=>`<button data-npc="${q}" data-ia="${a.id}" ${a.why?'disabled':''} title="${esc(a.why)}">${esc(a.name)}${a.why?' · '+esc(a.why):''}</button>`).join('')+(cb&&!E.party.isMember(q)?`<button data-invite="${q}" ${E.party.canInvite(q)?'disabled':''} title="${esc(E.party.canInvite(q))}">ชวนเข้าทีม</button>`:''):'<small class="dim">ต้องอยู่ที่เดียวกันจึงจะคุยได้</small>'}</div></div></div>`};
// เดินทางผ่าน Gate (ฝั่งเกมเพลย์)
S.gates=E=>{const l=E.gates.list();return l.length?`<div class="grid">${l.map(g=>`<div class="tile"><div class="t">🌀 ${esc(g.name)}</div><div class="s">${g.months?`ใช้เวลา ${g.months} เดือน`:'เดินทางทันที'}${g.why?' · '+esc(g.why):''}</div><div class="row"><button data-pgate="${g.id}" ${g.why?'disabled':''} class="pri sm">เดินทาง</button></div></div>`).join('')}</div>`:''};
})(globalThis.AW);
