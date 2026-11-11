// หน้าเล่น Phase 4 (ชีวิต คน ครอบครัว งาน สุขภาพ) + เครื่องมือทดสอบ (เวลา เซฟ debug gate)
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
function render(){$('#app').innerHTML=`<header><b>Multiverse Hunter · Phase 6 (Economy & B-Rank)</b><span id="status"></span><span id="world"></span></header>
 <div id="create"></div>
 <canvas id="stage" width="576" height="324"></canvas>
 <div id="player" class="panel"></div>
 <div id="modal"></div><div id="combat"></div>
 <div class="row" id="locs"></div><div class="row" id="acts"></div><div id="miss"></div><div id="people"></div><div id="adv"></div><div id="partyp"></div><div id="gearp"></div><div id="ecop"></div><div id="lifep"></div><div class="row" id="pgates"></div>
 <div class="row">${[0,1,3,10].map(s=>`<button data-s="${s}">${s?s+'x':'หยุด'}</button>`).join('')}<button id="step">+1 เดือน</button><button id="menu">เปิด/ปิดเมนู (หยุดเวลา)</button><button id="new">เกมใหม่</button></div>
 <div class="row">${[0,1,2].map(i=>`<button data-save="${i}">เซฟช่อง ${i}</button><button data-load="${i}">โหลดช่อง ${i}</button>`).join('')}</div>
 <div id="famp" class="panel"></div><div id="journal" class="panel"></div><div class="row" id="gates"></div>
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
 กรรม ${p.karma} · นิสัย: ${traitText(p.traits)} · สุขภาพ ${E.health.condition()}${E.health.get().ill?` · <span class="err">ป่วย: ${esc(E.health.illDef(E.health.get().ill.id).name)} (${E.health.get().ill.months} เดือน${E.health.get().ill.treated?' รักษาแล้ว':''})</span>`:''}<br>
 ที่พัก: ${esc((E.life.house()||{}).name||'-')} (${({family:'บ้านครอบครัว',rent:'เช่า',own:'เจ้าของ',shelter:'ที่พักพิง'})[(E.life.get().home||{}).mode]||'-'}) · งาน: ${esc((E.life.jobDef()||{}).name||'ไม่มี')} · ${esc(E.life.status())}${E.life.get().arrears?` · <span class="err">ค้างจ่าย ${E.life.get().arrears}</span>`:''}<br>
 <small>อุปกรณ์: ${['weapon','armor'].map(s=>p.equipment[s]?esc(P.itemName(p.equipment[s])):'-').join(' / ')} · กระเป๋า: ${Object.keys(p.inventory).map(q=>esc(P.itemName(q))+' x'+p.inventory[q]).join(', ')||'ว่าง'} · สกิล: ${p.skills.map(q=>esc(P.skillName(q))).join(', ')||'-'}</small>`}
function traitText(t){return AW.data.shared.traits.map(x=>t[x.id]>=20?x.high:t[x.id]<=-20?x.low:null).filter(Boolean).join(' ')||'กลาง ๆ'}
function modal(){const E=AW.engine,pp=E.player.get();if(pp.created&&!pp.alive&&!result){const L=E.health.get().lives.slice(-1)[0]||{};
  return `<div class="card"><b>สิ้นสุดชีวิตของ ${esc(L.name||pp.name)}</b><p>จากไปเมื่ออายุ ${L.ageY} ปี สาเหตุ: ${esc(L.cause||'')}</p><p>${L.class?esc(E.player.className(L.class)):'ไม่ได้ตื่นพลัง'} · แรงก์ ${esc(Object.values(L.ranks||{}).join(' ')||'-')} · เลเวล ${L.level} · กรรม ${L.karma} · ทรัพย์สิน ${L.assets?L.assets.money:0}</p><p>คนสำคัญ: ${(L.people||[]).slice(0,5).map(x=>esc(x.name)+' ('+esc(E.rels.typeName(x.type))+')').join(', ')||'-'}</p><p>ครอบครัว: ${L.family?L.family.members.map(m=>esc(m.name||'')+' '+esc(E.family.roleName(m.role))+(m.alive?'':' (จากไปแล้ว)')).join(', '):'-'}</p><p><small>ประวัติชีวิตถูกบันทึกไว้แล้ว (ยังไม่มีการเล่นต่อเป็นรุ่นลูก)</small></p><button id="new2">เริ่มชีวิตใหม่</button></div>`}
 if(result){const r=result;return `<div class="card"><b>${esc(r.title)}</b><p>${esc(r.choice?'› '+r.choice:'')}</p>${r.fight?`<pre>${r.fight.lines.map(esc).join('\n')}</pre>`:''}<p>${r.success===false?'<span class="err">ไม่สำเร็จ</span> ':''}${esc(r.text||'')}</p>${r.effects&&r.effects.length?`<p class="ok">${r.effects.map(esc).join(' · ')}</p>`:''}<button data-ok="1">ตกลง</button></div>`}
 const p=E.events.pending();if(!p)return '';
 return `<div class="card"><b>${esc(p.def.title)}</b><p>${esc(E.events.fmt(p.def.text))}</p>${E.events.choices().map(c=>`<button data-choice="${c.i}" ${c.ok?'':'disabled'}>${esc(c.text)}${c.chance<1?` (${Math.round(c.chance*100)}%)`:''}${c.ok?'':' · '+esc(c.lockText||'เลือกไม่ได้')}</button>`).join('')}</div>`}
function locs(){const E=AW.engine,p=E.player.get(),c=p.created&&E.worlds.ctx(p.location.world);if(!c)return '';
 return 'ไปที่: '+[...c.locations.values()].map(l=>`<button data-loc="${l.id}" ${l.id===p.location.loc||!E.player.canEnter(l.id)||E.events.get().pending?'disabled':''} title="${esc(l.desc||'')}">${esc(l.name)}</button>`).join('')}
function acts(){const E=AW.engine;if(!E.player.get().created)return '';const a=E.events.actions();return a.length?'ทำ: '+a.map(x=>`<button data-act="${x.id}" ${x.ok?'':'disabled'}>${esc(x.title)}${x.ap?` (AP ${x.ap})`:''}</button>`).join(''):''}
const RISK={normal:'',high:' ⚠ เสี่ยงสูง (อาจวิกฤต)',lethal:' ☠ อันตรายถึงชีวิต (อาจตายถาวร)'};
function miss(){const E=AW.engine;if(!E.player.get().created)return '';const m=E.missions.available();return m.length?'<div class="row">ภารกิจ: '+m.map(x=>`<button data-mis="${x.id}" ${x.risk!=='normal'?'data-accept="1"':''} ${x.ok?'':'disabled'} title="${esc(x.why)}">[${x.rank}] ${esc(x.name)} · ${esc(x.enemy)} (${Math.round(x.chance*100)}%)${x.mode==='manual'?' · สู้เอง':''}${esc(RISK[x.risk])}${x.pay!==1?` · ค่าตอบแทน ${Math.round(x.pay*100)}%`:''}${x.ok?'':' · '+esc(x.why)}</button>`).join('')+'</div>':''}
function people(){const E=AW.engine,p=E.player.get();if(!p.created||!p.alive)return '';const here=E.npcs.at(p.location.world,p.location.loc);if(!here.length)return '';
 return '<div class="panel"><b>คนที่อยู่ที่นี่</b> <small>('+({morning:'เช้า',day:'กลางวัน',evening:'เย็น',night:'กลางคืน'})[E.npcs.clock(p.location.world).slot]+')</small><br>'+here.map(n=>{const x=E.rels.edge(n.id,'player'),t=E.rels.type(n.id,'player');
  return `<div>${esc(n.name)} <small>${esc(n.role||n.occupationName||((E.worlds.ctx(n.world).list('jobs').get(n.occupation)||{}).name)||'')} · ${E.npcs.ageY(n.id)} ปี · ${t?esc(E.rels.typeName(t))+' '+x.aff:'ยังไม่รู้จัก'}</small> `+E.rels.actions(n.id).map(a=>`<button data-npc="${n.id}" data-ia="${a.id}" ${a.why?'disabled':''} title="${esc(a.why)}">${esc(a.name)}${a.why?' · '+esc(a.why):''}</button>`).join('')+(E.party.combatOf(n.id)&&!E.party.isMember(n.id)?`<button data-invite="${n.id}" ${E.party.canInvite(n.id)?'disabled':''} title="${esc(E.party.canInvite(n.id))}">ชวนเข้าทีม${E.party.canInvite(n.id)?' · '+esc(E.party.canInvite(n.id)):''}</button>`:'')+'</div>'}).join('')+'</div>'}
function lifePanel(){const E=AW.engine,p=E.player.get();if(!p.created||!p.alive)return '';const j=E.life.jobsHere(),h=E.life.housingHere();if(!j.length&&!h.length)return '';
 return '<div class="row">'+j.map(x=>x.current?`<button data-quit="1">ลาออกจาก${esc(x.name)}</button>`:`<button data-job="${x.id}" ${x.ok?'':'disabled'}>สมัครงาน${esc(x.name)} (${x.salary}/เดือน, AP ${x.ap})</button>`).join('')
  +h.filter(x=>!x.current).map(x=>(x.rent!==undefined?`<button data-home="${x.id}" data-mode="rent" ${x.ok&&p.money>=x.rent?'':'disabled'}>เช่า${esc(x.name)} (${x.rent}/เดือน)</button>`:'')+(x.price!==undefined?`<button data-home="${x.id}" data-mode="own" ${x.ok&&p.money>=x.price?'':'disabled'}>ซื้อ${esc(x.name)} (${x.price})</button>`:'')).join('')+'</div>'}
function pgates(){const E=AW.engine,l=E.gates.list();return l.length?'Gate: '+l.map(g=>`<button data-pgate="${g.id}" ${g.why?'disabled':''} title="${esc(g.why)}">${esc(g.name)}${g.months?` (${g.months} เดือน)`:''}${g.why?' · '+esc(g.why):''}</button>`).join(''):''}
function famPanel(){const E=AW.engine,f=E.family.get();if(!f.members.length)return '';const bg=E.family.background();
 return `<b>ครอบครัว</b> ${bg?esc(bg.name):''}<br>`+f.members.map(m=>{const n=E.npcs.get(m.npc);return n?`<small>${esc(E.family.roleName(m.role))}: ${esc(n.name)} ${n.alive?E.npcs.ageY(n.id)+' ปี':'(จากไปแล้ว)'}${n.ill?' · ป่วย':''}</small>`:''}).join(' · ')+(f.history.length?'<br><small>'+f.history.slice(0,3).map(h=>esc(h.t)).join(' · ')+'</small>':'')}
function bar(v,m){return `${Math.max(0,Math.round(v))}/${m}`}
function combatPanel(){const E=AW.engine,s=E.combat.session();if(!s)return '';const RK={normal:'ปกติ',high:'เสี่ยงสูง',lethal:'อันตรายถึงชีวิต'};
 return `<div class="card"><b>การต่อสู้ · รอบ ${s.round}</b> <small>ความเสี่ยง: ${RK[s.risk]}${s.me.critical?' · <span class="err">อาการวิกฤต</span>':''}</small><br>
 ${esc(s.me.name)} HP ${bar(s.me.hp,s.me.max)} · MP ${bar(s.me.mp,s.me.maxMp)}${s.party.map(m=>` · ${esc(m.name)} (${E.party.roleName(m.role)}) ${m.down?'หมดสภาพ':'HP '+bar(m.hp,m.max)}`).join('')}<br>
 ${s.foes.map(f=>`${esc(f.name)} HP ${bar(f.hp,f.max)}${f.enraged?' (คลั่ง)':''}`).join(' · ')}
 <pre>${s.log.slice(-6).map(esc).join('\n')}</pre>${s.status==='active'?E.combat.options().map(o=>`<button data-cact="${o.type}" data-cid="${o.id||''}" ${o.why?'disabled':''}>${esc(o.name)}${o.why?' · '+esc(o.why):''}</button>`).join(''):''}</div>`}
function advPanel(){const E=AW.engine,p=E.player.get();if(!p.created||!p.alive)return '';let h='';const r=E.dungeon.run();
 if(r){const g=E.dungeon.def(r.dungeon),cur=E.dungeon.current();h+=`<div class="panel"><b>${esc(g.name)}</b> · ${r.status==='active'?`ชั้น ${cur?cur.floor+1:'-'}/${g.floors} ห้อง ${cur?cur.index+1:'-'}/${cur?cur.rooms:'-'}`:'จบแล้ว ('+r.status+')'} · ความยาก x${r.mult} · ของที่เก็บได้: เงิน ${r.loot.money} EXP ${r.loot.exp}<br><small>${r.log.slice(-4).map(esc).join(' · ')}</small><br>`+
  (r.status==='active'?(r.waiting?'<small>จัดการห้องนี้ก่อน</small>':`<button data-dg="advance">ไปห้องถัดไป</button><button data-dg="leave">ออกจากดันเจี้ยน (ได้ของครบ)</button>`):`<button data-dg="close">ปิด</button>`)+'</div>'}
 else{const ds=E.dungeon.here();if(ds.length)h+='<div class="row">ดันเจี้ยน: '+ds.map(d=>`<button data-dgin="${d.id}" ${d.risk!=='normal'?'data-accept="1"':''} ${d.ok?'':'disabled'}>[${d.rank}] ${esc(d.name)} · ${d.floors} ชั้น · เคลียร์ ${d.clears}${esc(RISK[d.risk]||'')}${d.ok?'':' · '+esc(d.why)}</button>`+(d.checkpoint&&d.ok?`<button data-dgin="${d.id}" data-cp="1">เริ่มจาก checkpoint ชั้น ${d.checkpoint+1}</button>`:'')).join('')+'</div>'}
 for(const t of E.tower.here())h+=`<div class="row">${esc(t.name)}: ผ่านแล้ว ${t.best}/${t.total} ชั้น ${t.next?`<button data-tw="${t.id}" ${t.next.risk!=='normal'?'data-accept="1"':''} ${t.ok?'':'disabled'}>ปีนชั้น ${t.next.n} (${({fight:'ต่อสู้',boss:'บอส',puzzle:'ปริศนา',choice:'ทางเลือก'})[t.next.kind]})${esc(RISK[t.next.risk]||'')}${t.ok?'':' · '+esc(t.why)}</button>`:''}${(()=>{const a=E.tower.assess(t.id);return a.recommend==='done'?'':` <small id="twassess">ประเมิน: ${({climb:'พร้อมปีน',rest:'ควรพักก่อน',too_hard:'ยากเกินไปตอนนี้'})[a.recommend]}${a.chance!==null?` (โอกาส ${Math.round(a.chance*100)}%)`:''}${a.reasons.length?' · '+esc(a.reasons.join(', ')):''}</small>`})()}${(()=>{const L=E.tower.leaders(t.id,3);return L.length?`<br><small>NPC ที่ปีนสูงสุด: ${L.map(x=>esc(x.name)+' ชั้น '+x.best).join(', ')}</small>`:''})()}</div>`;
 return h}
function partyPanel(){const E=AW.engine,ps=E.party.get();if(!ps.members.length)return '';const t=E.party.team(E.player.get().location.world);
 return `<div class="panel"><b>ทีม</b> (${ps.members.length}/${ps.max}) · พลังทีม ${t.power} · synergy x${t.synergy}${E.party.conflict()?' · <span class="err">มีความขัดแย้งในทีม</span>':''}<br>`+ps.members.map(m=>{const n=E.npcs.get(m.npc);return `<small>${esc(n?n.name:m.npc)} · ${E.party.roleName(m.role)} · พลัง ${E.party.power(m.npc)}${(()=>{const a=(E.party.combatOf(m.npc)||{}).ability;return a?` · ${esc(a.name||a.kind)}`:''})()}${m.injury?` · <span class="err">บาดเจ็บ ${m.injury} เดือน</span>`:''} · ได้ส่วนแบ่งรวม ${m.earned}</small> <button data-pleave="${m.npc}">ให้ออกจากทีม</button>`}).join('<br>')+'</div>'}
function gearPanel(){const E=AW.engine,P=E.player,p=P.get();if(!p.created||!p.alive||!p.class)return '';
 const sk=p.skills.map(q=>{const d=P.skill(q)||{},l=(p.skillLv||{})[q]||{lv:1,xp:0};return `${esc(d.name||q)} Lv${l.lv}${d.type?' ('+({active:'โจมตี',passive:'ติดตัว',support:'สนับสนุน'})[d.type]+')':''}`}).join(', ');
 const eq=AW.systems.EQUIP_SLOTS.map(sl=>{const q=p.equipment[sl];if(!q)return '';const c=P.upgradeCost(q),lv=(p.upgrades||{})[q]||0;const cd=E.economy.cond(q),rc=E.economy.repairCost(q);return `${esc(P.itemName(q))}${lv?' +'+lv:''}${P.item(q).rank?` <small>สภาพ ${Math.round(cd)}%</small>`:''}${rc&&cd<100?` <button data-repair="${q}" ${p.money<rc?'disabled':''}>ซ่อม (${rc})</button>`:''}${c?` <button data-upg="${q}" ${p.money<c.money?'disabled':''}>อัปเกรด (${c.money})</button>`:''}`}).filter(Boolean).join(' · ');
 const inv=Object.keys(p.inventory).filter(q=>{const d=P.item(q);return d&&d.slot&&!Object.values(p.equipment).includes(q)}).map(q=>`<button data-equip="${q}" ${P.canEquip(q)?'disabled':''} title="${esc(P.canEquip(q))}">สวม ${esc(P.itemName(q))}${P.canEquip(q)?' · '+esc(P.canEquip(q)):''}</button>`).join('');
 const ug=E.underground.get();return `<div class="panel"><small>สกิล: ${sk||'-'}<br>อุปกรณ์: ${eq||'-'} ${inv}${ug.access?`<br>ใต้ดิน: ชื่อเสียง ${ug.rep} · ความสนใจของทางการ ${ug.heat}`:''}</small></div>`}
function journal(){const E=AW.engine;return '<b>บันทึก</b><br>'+E.events.get().log.slice(0,8).map(l=>`<small>เดือน ${l.m}: ${esc(l.t)}</small>`).join('<br>')}
function createForm(){const p=AW.engine.player.get();return p.created?'':`<div class="card"><b>เริ่มชีวิตใหม่ในโลกฮันเตอร์</b><p>อายุ 15 ปี นักเรียน ม.4</p><input id="pname" maxlength="24" placeholder="ชื่อตัวละคร" value="ซอนอู"> <select id="pgender"><option value="m">ชาย</option><option value="f">หญิง</option></select> <button id="pcreate">เริ่ม</button></div>`}
// Debug: เดินทางตรงผ่าน worlds.travelVia ไม่ตรวจเงื่อนไขเกมเพลย์ (ใช้ทดสอบโลก Fantasy)
function gates(){const E=AW.engine;return 'Debug: '+E.worlds.gatesHere().map(g=>`<button data-gate="${g.id}">${esc(g.name)}</button>`).join('')||(E.worlds.current&&!E.worlds.has(E.worlds.current)?E.worlds.ids().map(id=>`<button data-go="${id}">กลับไป ${id}</button>`).join(''):'')}
function info(){const E=AW.engine,r=E.assets.report();return `<p>ภาพ: จริง ${r.real} · placeholder ${r.placeholder} · โลกที่ลงทะเบียน ${E.registries.world.all().length} · เซฟเกมเดิมที่พบ (ไม่แตะ) ${E.save.legacyKeys().length}</p>
 <p>เซฟใหม่: ${E.save.list().map(s=>esc(s.key)+(s.broken?' (เสีย)':` v${s.v} เดือน ${s.meta&&s.meta.month}`)).join(' · ')||'ยังไม่มี'}</p>
 <details id="dbg" ${window.__dbgOpen?'open':''}><summary>Debug</summary><p class="err">${E.debug.errors.map(esc).join('<br>')||'ไม่มี error'}</p><pre>${esc(JSON.stringify(E.state.snapshot(),null,1))}</pre><pre>${E.debug.lines.slice(-12).map(l=>esc(l.lvl+' '+l.msg)).join('\n')}</pre></details>`}
const set=(sel,html)=>{const el=$(sel);if(el&&el.__h!==html){el.innerHTML=html;el.__h=html}};
// Phase 6: บริการที่สถานที่นี้ การลงทุนกิลด์ ผลงานกับสมาคม การค้นพบ และสมุดบัญชีเดือนล่าสุด
function ecoPanel(){const E=AW.engine,p=E.player.get();if(!p.created||!p.alive)return '';const EC=E.economy,sv=EC.servicesHere(),gs=EC.guildsHere(),L=EC.get().ledger[0],t=E.missions.meritTier(),KIND={once:'ครั้งเดียว',repeat:'ซื้อซ้ำได้',plan:'รายเดือน'};
 let h='';if(sv.length)h+='<div class="row">บริการ: '+sv.map(x=>x.owned&&x.kind!=='repeat'?`<small>${esc(x.name)} ${x.active?'(ใช้งานอยู่)':x.paused?'(พักไว้)':'(หยุดชั่วคราว)'}${x.monthly?` · ${x.monthly}/เดือน`:''}</small>`+(x.kind==='plan'||x.monthly?(x.paused?`<button data-svcr="${x.id}">ใช้ต่อ</button>`:`<button data-svcx="${x.id}">${x.kind==='plan'?'ยกเลิก':'พักใช้'}</button>`):''):
  `<button data-svc="${x.id}" ${x.ok?'':'disabled'} title="${esc(x.desc)}">${esc(x.name)} · ${x.price?x.price:''}${x.monthly?(x.price?' + ':'')+x.monthly+'/เดือน':''} (${KIND[x.kind]}${x.ap?' AP '+x.ap:''})${x.ok?'':' · '+esc(x.why)}</button>`).join('')+'</div>';
 for(const g of gs)h+=`<div class="row"><small>${esc(g.name)}: ลงทุนอยู่ ${Math.round(g.stake)} / เพดาน ${g.cap} · ค่าถอน ${Math.round(g.fee*100)}% · ความเชื่อถือ ${g.standing}</small>${g.ok?[1000,5000].map(a=>`<button data-inv="${g.id}" data-amt="${a}" ${p.money<a||g.stake+a>g.cap?'disabled':''}>ลงทุน ${a}</button>`).join('')+(g.stake>=1?`<button data-wd="${g.id}" data-amt="${Math.floor(g.stake)}">ถอนทั้งหมด</button>`:''):' · '+esc(g.why)}</div>`;
 const fd=E.dungeon.discoveries();h+=`<div class="panel" id="ledger"><small>ผลงานกับสมาคม ${E.missions.get().merit||0}${t?' ('+esc(t.name)+')':''} · ค้นพบในดันเจี้ยน ${fd}${fd>=3?' (นักสำรวจระดับ '+E.dungeon.explorerLevel()+')':''}${L?` · เดือนล่าสุด: รับ ${L.in} จ่าย ${L.out}`:''}</small></div>`;return h}
function update(force){const E=AW.engine;if(!$('#status'))return;$('#status').textContent=statusLine();$('#world').textContent=worldLine();
 const now=Date.now();if(!force&&E.loop.speed&&now-_last<300)return;_last=now;
 set('#create',createForm());set('#player',playerPanel());set('#modal',modal());set('#combat',combatPanel());set('#adv',advPanel());set('#partyp',partyPanel());set('#gearp',gearPanel());set('#ecop',ecoPanel());set('#locs',locs());set('#acts',acts());set('#miss',miss());set('#people',people());set('#lifep',lifePanel());set('#pgates',pgates());set('#famp',famPanel());set('#journal',journal());set('#gates',gates());
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
  else if(d.mis){if(d.accept&&!confirm2(b))return;act(()=>E.missions.start(d.mis,{acceptRisk:!!d.accept}))}
  else if(d.cact)act(()=>{E.combat.act(d.cact==='skill'?{type:'skill',id:d.cid}:{type:d.cact})});
  else if(d.invite)act(()=>{E.party.invite(d.invite)});
  else if(d.pleave)act(()=>{E.party.leave(d.pleave,'ผู้เล่นให้ออก')});
  else if(d.upg)act(()=>{E.player.upgrade(d.upg)});
  else if(d.equip)act(()=>{E.player.equip(d.equip)});
  else if(d.repair)act(()=>{E.economy.repair(d.repair)});
  else if(d.svc)act(()=>{E.economy.buy(d.svc)});
  else if(d.svcx)act(()=>{E.economy.cancel(d.svcx)});
  else if(d.svcr)act(()=>{E.economy.resume(d.svcr)});
  else if(d.inv)act(()=>{E.economy.invest(d.inv,+d.amt)});
  else if(d.wd)act(()=>{E.economy.withdraw(d.wd,+d.amt)});
  else if(d.dgin){if(d.accept&&!confirm2(b))return;act(()=>{E.dungeon.enter(d.dgin,{fromCheckpoint:!!d.cp})})}
  else if(d.dg)act(()=>{const r=d.dg==='advance'?E.dungeon.advance():d.dg==='leave'?E.dungeon.leave():E.dungeon.close();if(r&&r.status)result={title:'ผลการสำรวจ',text:({cleared:'เคลียร์ดันเจี้ยน',left:'ออกจากดันเจี้ยน',retreated:'ถอนตัว',failed:'สำรวจล้มเหลว'})[r.status]+` · เงิน ${r.money} EXP ${r.exp}`,effects:r.items.concat(r.clear||[])}});
  else if(d.tw){if(d.accept&&!confirm2(b))return;act(()=>{E.tower.climb(d.tw,{acceptRisk:!!d.accept})})}
  else if(d.gate)act(()=>{E.worlds.travelVia(d.gate)});
  else if(d.go)act(()=>{E.worlds.travel(d.go)})
  else if(d.ia)act(()=>E.rels.interact(d.npc,d.ia));
  else if(d.job)act(()=>{E.life.takeJob(d.job)});
  else if(d.quit)act(()=>{E.life.quitJob()});
  else if(d.home)act(()=>{E.life.moveIn(d.home,d.mode)});
  else if(d.pgate)act(()=>{E.gates.travel(d.pgate)});
  else if(b.id==='new2'){newGame(String(Date.now()));update(true)}});
 draw()}
// ยืนยันความเสี่ยงสองจังหวะ: คลิกแรกแสดงคำเตือนบนปุ่ม คลิกที่สองจึงเริ่ม (ไม่ใช้ dialog ของเบราว์เซอร์)
function confirm2(b){if(b.dataset.armed)return true;b.dataset.armed='1';b.textContent='ยืนยัน: ยอมรับความเสี่ยงและเริ่ม';b.classList.add('err');return false}
AW.ui.boot=boot;
})(globalThis.AW);
