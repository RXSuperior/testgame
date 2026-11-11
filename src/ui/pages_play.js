// Pages (Phase 7A, ส่วนที่ 1): หน้าหลัก · ตัวละคร · กระเป๋า · สกิล · อุปกรณ์ · ทีม · ภารกิจ
// ทุกหน้าดึงข้อมูลจาก API ของระบบจริง ปุ่มทุกปุ่มเรียก API (ผ่าน data-* ใน app.js)
(function(AW){
'use strict';
const U=AW.ui.u,esc=U.esc,page=U.page;
const alive=E=>{const p=E.player.get();return p.created&&p.alive};
const sec=(title,body,id='',extra='')=>body?`<div class="panel" ${id?`id="${id}"`:''}><div class="sec-title"><h3>${title}</h3>${extra}</div>${body}</div>`:(id?`<div id="${id}"></div>`:'');
const kindName={active:'โจมตี',passive:'ติดตัว',support:'สนับสนุน'};
// ---------- หน้าหลัก: ฉาก + สิ่งที่ทำได้ที่สถานที่นี้ ----------
function locs(E){const p=E.player.get(),c=E.worlds.ctx(p.location.world);if(!c)return '';
 return [...c.locations.values()].map(l=>`<button data-loc="${l.id}" ${l.id===p.location.loc||!E.player.canEnter(l.id)||E.events.get().pending?'disabled':''} title="${esc(l.desc||'')}" class="${l.id===p.location.loc?'gold':''} sm">${esc(l.name)}</button>`).join('')}
function acts(E){const a=E.events.actions();return a.length?a.map(x=>`<button data-act="${x.id}" ${x.ok?'':'disabled'}>${esc(x.title)}${x.ap?` <span class="badge">AP ${x.ap}</span>`:''}</button>`).join(''):''}
function miss(E){const m=E.missions.available();return m.length?`<div class="grid">${m.map(x=>`<div class="tile"><div class="t">${U.badge(x.rank,'gold')} ${esc(x.name)}</div><div class="s">ศัตรู: ${esc(x.enemy)} · โอกาส ${Math.round(x.chance*100)}%${x.mode==='manual'?' · สู้เอง':''}${x.pay!==1?` · ค่าตอบแทน ${Math.round(x.pay*100)}%`:''}</div><div class="row">${U.RISKB[x.risk]}
 <button data-mis="${x.id}" ${x.risk!=='normal'?'data-accept="1"':''} ${x.ok?'':'disabled'} title="${esc(x.why)}" class="sm ${x.risk!=='normal'?'danger':'pri'}">${x.ok?'รับภารกิจ':esc(x.why)}${esc(U.RISK[x.risk])}</button></div></div>`).join('')}</div>`:''}
function people(E){const p=E.player.get(),here=E.npcs.at(p.location.world,p.location.loc);if(!here.length)return '';
 return `<div class="list">${here.map(n=>{const x=E.rels.edge(n.id,'player'),t=E.rels.type(n.id,'player'),job=n.role||n.occupationName||((E.worlds.ctx(n.world).list('jobs').get(n.occupation)||{}).name)||'';
  return `<div><div class="row" style="margin:0"><button class="sm ghost" data-dlg="${n.id}" title="เปิดบทสนทนา"><b>${esc(n.name)}</b></button><small>${esc(job)} · ${E.npcs.ageY(n.id)} ปี · ${t?esc(E.rels.typeName(t))+' '+x.aff:'ยังไม่รู้จัก'}</small></div><div class="actions">`+
  E.rels.actions(n.id).map(a=>`<button class="sm" data-npc="${n.id}" data-ia="${a.id}" ${a.why?'disabled':''} title="${esc(a.why)}">${esc(a.name)}${a.why?' · '+esc(a.why):''}</button>`).join('')+
  (E.party.combatOf(n.id)&&!E.party.isMember(n.id)?`<button class="sm" data-invite="${n.id}" ${E.party.canInvite(n.id)?'disabled':''} title="${esc(E.party.canInvite(n.id))}">ชวนเข้าทีม${E.party.canInvite(n.id)?' · '+esc(E.party.canInvite(n.id)):''}</button>`:'')+'</div></div>'}).join('')}</div>`}
function advList(E){let h='';const r=E.dungeon.run();if(!r){const ds=E.dungeon.here();if(ds.length)h+=`<div class="grid">${ds.map(d=>`<div class="tile"><div class="t">${U.badge(d.rank,'gold')} ${esc(d.name)}</div><div class="s">${d.floors} ชั้น · เคลียร์ ${d.clears}</div><div class="row">${U.RISKB[d.risk]}<button class="sm ${d.risk!=='normal'?'danger':'pri'}" data-dgin="${d.id}" ${d.risk!=='normal'?'data-accept="1"':''} ${d.ok?'':'disabled'}>${d.ok?'เข้าสำรวจ':esc(d.why)}${esc(U.RISK[d.risk]||'')}</button>${d.checkpoint&&d.ok?`<button class="sm" data-dgin="${d.id}" data-cp="1">เริ่มชั้น ${d.checkpoint+1}</button>`:''}</div></div>`).join('')}</div>`}
 for(const t of E.tower.here())h+=towerTile(E,t);return h}
function towerTile(E,t){const a=E.tower.assess(t.id),L=E.tower.leaders(t.id,3);
 return `<div class="tile" style="margin-top:8px"><div class="t">♜ ${esc(t.name)} · ผ่านแล้ว ${t.best}/${t.total} ชั้น</div>${t.next?`<div class="row"><button data-tw="${t.id}" ${t.next.risk!=='normal'?'data-accept="1"':''} ${t.ok?'':'disabled'} class="sm ${t.next.risk!=='normal'?'danger':'pri'}">ปีนชั้น ${t.next.n} (${({fight:'ต่อสู้',boss:'บอส',puzzle:'ปริศนา',choice:'ทางเลือก'})[t.next.kind]})${esc(U.RISK[t.next.risk]||'')}${t.ok?'':' · '+esc(t.why)}</button></div>`:''}
 ${a.recommend==='done'?'':`<small id="twassess" class="${a.recommend==='climb'?'ok':a.recommend==='rest'?'err':'gold-t'}">ประเมิน: ${({climb:'พร้อมปีน',rest:'ควรพักก่อน',too_hard:'ยากเกินไปตอนนี้'})[a.recommend]}${a.chance!==null?` (โอกาส ${Math.round(a.chance*100)}%)`:''}${a.reasons.length?' · '+esc(a.reasons.join(', ')):''}</small>`}
 ${L.length?`<br><small>NPC ที่ปีนสูงสุด: ${L.map(x=>esc(x.name)+' ชั้น '+x.best).join(', ')}</small>`:''}</div>`}
function services(E){const EC=E.economy,sv=EC.servicesHere(),KIND={once:'ครั้งเดียว',repeat:'ซื้อซ้ำได้',plan:'รายเดือน'};if(!sv.length)return '';
 return `<div class="grid">${sv.map(x=>`<div class="tile"><div class="t">${esc(x.name)}</div><div class="s">${esc(x.desc)}</div><div class="s">${x.price?U.n(x.price):''}${x.monthly?(x.price?' + ':'')+U.n(x.monthly)+'/เดือน':''} · ${KIND[x.kind]}${x.ap?' · AP '+x.ap:''}</div><div class="row">`+
  (x.owned&&x.kind!=='repeat'?`<span class="badge ${x.active?'blue':'red'}">${x.active?'ใช้งานอยู่':x.paused?'พักไว้':'หยุดชั่วคราว'}</span>`+(x.kind==='plan'||x.monthly?(x.paused?`<button class="sm" data-svcr="${x.id}">ใช้ต่อ</button>`:`<button class="sm" data-svcx="${x.id}">${x.kind==='plan'?'ยกเลิก':'พักใช้'}</button>`):''):
  `<button class="sm pri" data-svc="${x.id}" ${x.ok?'':'disabled'} title="${esc(x.desc)}">${x.ok?(x.kind==='plan'?'สมัคร':'ซื้อ'):esc(x.why)}</button>`)+`</div></div>`).join('')}</div>`}
function lifeHere(E){const p=E.player.get(),j=E.life.jobsHere(),h=E.life.housingHere();if(!j.length&&!h.length)return '';
 return '<div class="actions">'+j.map(x=>x.current?`<button class="sm danger" data-quit="1">ลาออกจาก${esc(x.name)}</button>`:`<button class="sm" data-job="${x.id}" ${x.ok?'':'disabled'}>สมัครงาน${esc(x.name)} (${U.n(x.salary)}/เดือน, AP ${x.ap})</button>`).join('')
  +h.filter(x=>!x.current).map(x=>(x.rent!==undefined?`<button class="sm" data-home="${x.id}" data-mode="rent" ${x.ok&&p.money>=x.rent?'':'disabled'}>เช่า${esc(x.name)} (${U.n(x.rent)}/เดือน)</button>`:'')+(x.price!==undefined?`<button class="sm gold" data-home="${x.id}" data-mode="own" ${x.ok&&p.money>=x.price?'':'disabled'}>ซื้อ${esc(x.name)} (${U.n(x.price)})</button>`:'')).join('')+'</div>'}
page('dashboard',{title:'หน้าหลัก',render(E){if(!alive(E))return E.player.get().created?U.empty('ตัวละครเสียชีวิตแล้ว ดูประวัติชีวิตด้านบน หรือโหลดเซฟ'):'';
 const ac=acts(E),ms=miss(E),pg=AW.ui.screens.gates(E);
 return AW.ui.scene.html(E)+
  sec('ไปที่',`<div class="actions" id="locs">${locs(E)}</div>`)+
  (ac?sec('กิจกรรมที่นี่',`<div class="actions" id="acts">${ac}</div>`):'<div id="acts"></div>')+
  sec('ภารกิจที่นี่',ms,'miss')+sec('ดันเจี้ยน / หอคอย',advList(E),'advlist')+sec('บริการ',services(E),'ecop')+sec('งานและที่พัก',lifeHere(E),'lifep')+
  `<div class="panel" ${pg?'':'hidden'}><h3>Gate</h3><div id="pgates">${pg}</div></div>`+sec(`คนที่อยู่ที่นี่ <small>(${U.SLOT[E.npcs.clock(E.player.get().location.world).slot]})</small>`,people(E),'people')}});
// ---------- ตัวละคร ----------
function traitText(t){return AW.data.shared.traits.map(x=>t[x.id]>=20?x.high:t[x.id]<=-20?x.low:null).filter(Boolean).join(' ')||'กลาง ๆ'}
page('character',{title:'ตัวละคร',render(E){if(!E.player.get().created)return U.empty('ยังไม่สร้างตัวละคร');const P=E.player,p=P.get(),RN=AW.systems.STAT_NAME,H=E.health,ill=H.get().ill;
 const rs=E.worlds.ctx(p.location.world),sys=rs&&rs.config.rankSystem&&rs.config.rankSystem.id,next=sys&&E.ranks.next(sys),can=sys&&E.ranks.canPromote(sys);
 return `<div class="panel" id="player"><div class="row" style="justify-content:space-between"><h2>${esc(p.name)} ${U.rank(sys&&p.ranks[sys])}</h2>${U.badge(p.class?P.className(p.class):'ยังไม่ตื่นพลัง','vio')}</div>
 <div class="grid sm"><div class="tile" title="พลังชีวิต"><div class="s">HP</div><div class="t">${p.hp}/${P.maxHp()}</div>${U.bar('hp',p.hp,P.maxHp())}</div><div class="tile" title="มานาสูงสุดในการต่อสู้"><div class="s">MP / มานา</div><div class="t">${P.maxMp()} / ${p.mana}</div></div>
 <div class="tile" title="ค่าประสบการณ์ถึงเลเวลถัดไป"><div class="s">เลเวล ${p.level}</div><div class="t">EXP ${U.n(p.exp)}/${U.n(P.expNeed())}</div>${U.bar('xp',p.exp,P.expNeed())}</div><div class="tile"><div class="s">เงิน</div><div class="t gold-t">${U.n(p.money)}</div></div>
 <div class="tile" title="ชื่อเสียงในสังคมฮันเตอร์"><div class="s">ชื่อเสียง</div><div class="t">${p.reputation}</div></div><div class="tile" title="ผลรวมการกระทำดี/ร้าย มีผลกับเหตุการณ์และ NPC"><div class="s">กรรม</div><div class="t">${p.karma}</div></div></div>
 <h3 style="margin-top:12px">ค่าสถานะ</h3><div class="grid sm">${AW.systems.Rules.STATS.map(k=>`<div class="tile" title="${esc(U.STAT_TIP[k]||'')}"><div class="s">${esc(RN[k])}</div><div class="t">${p.stats[k]}</div></div>`).join('')}</div>
 <h3 style="margin-top:12px">ชีวิต</h3><div class="kv"><span>นิสัย</span><span>${esc(traitText(p.traits))}</span><span>สุขภาพ</span><span>${esc(H.condition())}${ill?` · <span class="err">ป่วย: ${esc(H.illDef(ill.id).name)} (${ill.months} เดือน${ill.treated?' รักษาแล้ว':''})</span>`:''}${p.injury?` · <span class="err">บาดเจ็บ ${p.injury} เดือน</span>`:''}</span>
 <span>ที่พัก</span><span>${esc((E.life.house()||{}).name||'-')} (${({family:'บ้านครอบครัว',rent:'เช่า',own:'เจ้าของ',shelter:'ที่พักพิง'})[(E.life.get().home||{}).mode]||'-'})</span><span>งาน</span><span>${esc((E.life.jobDef()||{}).name||'ไม่มี')}</span><span>สถานะสังคม</span><span>${esc(E.life.status())}${E.life.get().arrears?` · <span class="err">ค้างจ่าย ${U.n(E.life.get().arrears)}</span>`:''}</span>
 <span>แรงก์ถัดไป</span><span>${next?esc(next)+(can?' · <span class="ok">ผ่านเกณฑ์แล้ว ไปสอบที่สมาคม</span>':' · ยังไม่ผ่านเกณฑ์'):'-'}</span></div></div>`}});
// ---------- กระเป๋า ----------
page('inventory',{title:'กระเป๋า',render(E){const P=E.player,p=P.get();if(!p.created)return '';const ks=Object.keys(p.inventory);
 return sec('กระเป๋า',ks.length?`<div class="grid">${ks.map(q=>{const d=P.item(q)||{},eq=Object.values(p.equipment).includes(q),why=d.slot?P.canEquip(q):'';
  return `<div class="tile"><div class="t">${esc(P.itemName(q))} <span class="badge">x${p.inventory[q]}</span>${d.rank?' '+U.badge(d.rank,'gold'):''}</div><div class="s">${d.slot?esc(({weapon:'อาวุธ',armor:'เกราะ',accessory:'เครื่องประดับ'})[d.slot]):'ของใช้/วัตถุดิบ'}${d.price?' · ราคา '+U.n(d.price):''}</div>
  ${d.slot?`<div class="row">${eq?'<span class="badge blue">สวมอยู่</span>':`<button class="sm" data-equip="${q}" ${why?'disabled':''} title="${esc(why)}">สวม${why?' · '+esc(why):''}</button>`}</div>`:''}</div>`}).join('')}</div>`:U.empty('กระเป๋าว่าง'))+`<small class="dim">ขายของได้ที่ย่านใจกลางเมือง (กิจกรรมขายในหน้าหลัก)</small>`}});
// ---------- สกิล ----------
page('skills',{title:'สกิล',render(E){const P=E.player,p=P.get();if(!p.created)return '';
 return sec('สกิลที่มี',p.skills.length?`<div class="grid">${p.skills.map(q=>{const d=P.skill(q)||{},l=(p.skillLv||{})[q]||{lv:1,xp:0};
  return `<div class="tile"><div class="t">${esc(d.name||q)} <span class="badge vio">Lv ${l.lv}${d.maxLv?'/'+d.maxLv:''}</span></div><div class="s">${esc(kindName[d.type]||'พื้นฐาน')}${d.mp?' · MP '+d.mp:''}${d.cd?' · คูลดาวน์ '+d.cd:''}${d.pierce?' · เจาะเกราะ':''}${d.target==='all'?' · ทุกเป้า':''}</div>${d.maxLv?U.bar('xp',l.xp,l.lv*10,'XP สกิล'):''}</div>`}).join('')}</div>`:U.empty('ยังไม่มีสกิล ตื่นพลังแล้วเรียนได้ที่ศูนย์ฝึก'))}});
// ---------- อุปกรณ์ (id #gearp เดิม) ----------
page('equipment',{title:'อุปกรณ์',render(E){const P=E.player,p=P.get();if(!p.created||!p.alive||!p.class)return `<div id="gearp">${U.empty('ตื่นพลังก่อนจึงจะใช้อุปกรณ์ต่อสู้ได้')}</div>`;
 const slots=AW.systems.EQUIP_SLOTS.map(sl=>{const q=p.equipment[sl],SN={weapon:'อาวุธ',armor:'เกราะ',accessory:'เครื่องประดับ'}[sl];if(!q)return `<div class="tile"><div class="s">${SN}</div><div class="t dim">ว่าง</div></div>`;
  const c=P.upgradeCost(q),lv=(p.upgrades||{})[q]||0,cd=E.economy.cond(q),rc=E.economy.repairCost(q),d=P.item(q);
  return `<div class="tile"><div class="s">${SN}</div><div class="t">${esc(P.itemName(q))}${lv?' +'+lv:''} ${d.rank?U.badge(d.rank,'gold'):''}</div>${d.rank?`<small title="สภาพต่ำกว่า 50% พลังจากอุปกรณ์ลดลง">สภาพ ${Math.round(cd)}%</small>${U.bar(cd<50?'hp':'mp',cd,100,'สภาพ')}`:''}
  <div class="row">${rc&&cd<100?`<button class="sm" data-repair="${q}" ${p.money<rc?'disabled':''}>ซ่อม (${U.n(rc)})</button>`:''}${c?`<button class="sm gold" data-upg="${q}" ${p.money<c.money?'disabled':''}>อัปเกรด (${U.n(c.money)})</button>`:''}</div></div>`}).join('');
 const inv=Object.keys(p.inventory).filter(q=>{const d=P.item(q);return d&&d.slot&&!Object.values(p.equipment).includes(q)}).map(q=>`<button class="sm" data-equip="${q}" ${P.canEquip(q)?'disabled':''} title="${esc(P.canEquip(q))}">สวม ${esc(P.itemName(q))}${P.canEquip(q)?' · '+esc(P.canEquip(q)):''}</button>`).join('');
 const sk=p.skills.map(q=>{const d=P.skill(q)||{},l=(p.skillLv||{})[q]||{lv:1};return `${esc(d.name||q)} Lv${l.lv}${d.type?' ('+kindName[d.type]+')':''}`}).join(', '),ug=E.underground.get();
 return `<div class="panel" id="gearp"><h3>อุปกรณ์ที่สวม</h3><div class="grid">${slots}</div>${inv?`<h4 style="margin-top:10px">เปลี่ยนอุปกรณ์</h4><div class="actions">${inv}</div>`:''}<small>สกิล: ${sk||'-'}${ug.access?`<br>ใต้ดิน: ชื่อเสียง ${ug.rep} · ความสนใจของทางการ ${ug.heat}`:''}</small></div>`}});
// ---------- ทีม (id #partyp เดิม) ----------
page('party',{title:'ทีม',render(E){const p=E.player.get();if(!p.created)return '';const ps=E.party.get();
 const cand=E.npcs.at(p.location.world,p.location.loc).filter(n=>E.party.combatOf(n.id)&&!E.party.isMember(n.id));
 const mem=ps.members.length?(()=>{const t=E.party.team(p.location.world);return `<div class="panel" id="partyp"><div class="sec-title"><h3>ทีม (${ps.members.length}/${ps.max})</h3><span>${U.badge('พลังทีม '+t.power,'blue')} ${U.badge('synergy x'+t.synergy,'vio')}${E.party.conflict()?' '+U.badge('มีความขัดแย้งในทีม','red'):''}</span></div>
  <div class="grid">${ps.members.map(m=>{const n=E.npcs.get(m.npc),a=(E.party.combatOf(m.npc)||{}).ability;return `<div class="tile"><div class="t">${esc(n?n.name:m.npc)}</div><div class="s">${E.party.roleName(m.role)} · พลัง ${E.party.power(m.npc)}${a?` · ${esc(a.name||a.kind)}`:''}</div><div class="s">${m.injury?`<span class="err">บาดเจ็บ ${m.injury} เดือน</span> · `:''}ได้ส่วนแบ่งรวม ${U.n(m.earned)}</div><div class="row"><button class="sm ghost" data-dlg="${m.npc}">คุย</button><button class="sm danger" data-pleave="${m.npc}">ให้ออกจากทีม</button></div></div>`}).join('')}</div>
  ${ps.history.length?`<h4 style="margin-top:10px">ประวัติทีม</h4>${ps.history.slice(0,5).map(h=>`<small>เดือน ${h.m}: ${esc(h.t)}</small>`).join('<br>')}`:''}</div>`})():`<div id="partyp">${U.empty('ยังไม่มีทีม ชวน NPC สายต่อสู้ที่สนิทกันเข้าทีมได้')}</div>`;
 return mem+sec('ชวนคนที่อยู่ที่นี่',cand.map(n=>`<div class="row"><b>${esc(n.name)}</b><button class="sm" data-invite="${n.id}" ${E.party.canInvite(n.id)?'disabled':''} title="${esc(E.party.canInvite(n.id))}">ชวนเข้าทีม${E.party.canInvite(n.id)?' · '+esc(E.party.canInvite(n.id)):''}</button></div>`).join(''))}});
// ---------- ภารกิจ ----------
page('missions',{title:'ภารกิจ',render(E){const p=E.player.get();if(!p.created)return '';const M=E.missions.get(),t=E.missions.meritTier(),last=M.last;
 const top=Object.entries(M.done).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([q,n])=>`${esc((E.missions.def(q)||{}).name||q)} x${n}`).join(' · ');
 return `<div class="panel"><div class="sec-title"><h3>สมาคมและผลงาน</h3>${U.badge('ผลงาน '+(M.merit||0)+(t?' · '+t.name:''),'gold')}</div><small>ภารกิจแสดงตามสถานที่: สมาคมฮันเตอร์ และย่านเกต</small><div class="actions" style="margin-top:6px">${['association','gate_zone'].filter(l=>E.worlds.ctx(p.location.world)&&E.worlds.ctx(p.location.world).locations.has(l)).map(l=>`<button class="sm" data-loc="${l}" ${l===p.location.loc||!E.player.canEnter(l)||E.events.get().pending?'disabled':''}>ไป${esc(E.worlds.ctx(p.location.world).locations.get(l).name)}</button>`).join('')}</div></div>`+
 sec('ภารกิจที่รับได้ที่นี่',miss(E)||U.empty('ไม่มีภารกิจที่สถานที่นี้'))+
 (M.pending?sec('ภารกิจที่กำลังทำ',`<b>${esc((E.missions.def(M.pending.q)||{}).name||'')}</b>`):'')+
 (last?sec('รายงานล่าสุด',`<b>${esc(last.name)}</b> · ${({win:'สำเร็จ',lose:'ล้มเหลว',retreat:'ถอนตัว',critical:'บาดเจ็บสาหัส',dead:'เสียชีวิต'})[last.outcome]||esc(last.outcome)} · เดือน ${last.month}${last.effects&&last.effects.length?`<br><small class="ok">${last.effects.map(esc).join(' · ')}</small>`:''}`):'')+
 (top?sec('ทำบ่อยที่สุด',`<small>${top}</small>`):'')}});
AW.ui.parts={sec,services,advList,towerTile,lifeHere,miss};
})(globalThis.AW);
