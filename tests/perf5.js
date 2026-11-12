// วัดต้นทุนระบบ Phase 5: node tests/perf5.js
// ต่อสู้หลายศัตรู × ขนาดทีม, สร้างดันเจี้ยนหลายชั้น, ปีนหอคอย 20 ชั้น, เซฟ/โหลดกลางกิจกรรม, NPC จำนวนมากพร้อมทีม
const S=require('./sim.js');const ctx=S.boot(),AW=ctx.AW;
const now=()=>Number(process.hrtime.bigint())/1e6;
const clr=E=>{let g=0;while(E.events.pending()&&g++<20){const c=E.events.choices().find(x=>x.ok)||E.events.choices()[0];E.events.answer(c.i)}};
function hunter(seed,party=0){const E=S.newGame(ctx,seed);clr(E);
 E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*20;p.ranks.hunter='C';p.level=16;p.stats.str+=150;p.stats.vit+=60;p.mana+=30;p.money=50000;p.ap=9;p.class=p.class||'hunter.sword'});
 E.worlds.ctx('hunter').mutate(s=>{s.flags.registered=true});E.player.addHp(99999);
 for(const n of E.npcs.all('hunter')){if(E.party.get().members.length>=party)break;if(!n.alive||!E.party.combatOf(n.id))continue;E.npcs.setFlag(n.id,'party');if(!E.party.canInvite(n.id))E.party.invite(n.id)}
 return E}
const out={};
// 1) การต่อสู้แบบเลือกท่า: จำนวนศัตรู × ขนาดทีม
const fights=[];
for(const party of[0,1,3])for(const foes of[1,3,5,8]){const E=hunter('pf'+party+foes,party);let t=0,turns=0,N=20;
 for(let i=0;i<N;i++){E.player.addHp(99999);const t0=now();E.combat.start({worldId:'hunter',foes:Array.from({length:foes},()=>({enemy:'goblin_scout'})),seed:'f'+i});let g=0;
  while(E.combat.session().status==='active'&&g++<200){E.combat.act({type:'attack'});turns++}const s=E.combat.session();E.combat.claim(s.id);t+=now()-t0}
 fights.push({party:E.party.get().members.length,foes,msPerFight:+(t/N).toFixed(2),turnsAvg:+(turns/N).toFixed(1)})}
console.log('การต่อสู้แบบเลือกท่า');console.table(fights);
// 2) Auto Resolve
{const E=hunter('pa',3),N=2000,t0=now();for(let i=0;i<N;i++){E.player.addHp(99999);E.combat.resolve({worldId:'hunter',enemy:'red_ogre'},new AW.core.Rng('a'+i))}out.autoUs=+((now()-t0)/N*1000).toFixed(1);console.log('Auto Resolve (ทีม 3):',out.autoUs,'µs/ครั้ง')}
// 3) สร้างดันเจี้ยน หลายชั้น
{const E=hunter('pg');const g=Object.assign({},E.dungeon.def('hunter.goblin_warren'));const rows=[];
 for(const floors of[3,10,30,100]){g.floors=floors;const N=200,t0=now();let rooms=0;for(let i=0;i<N;i++)rooms=AW.systems.generateDungeon(g,'s'+i).reduce((a,f)=>a+f.rooms.length,0);rows.push({floors,rooms,usPerGen:+((now()-t0)/N*1000).toFixed(1)})}
 console.log('สร้างดันเจี้ยน (seeded)');console.table(rows)}
// 4) เล่นดันเจี้ยนจนจบ + เซฟ/โหลดกลางดันเจี้ยน
{const E=hunter('pd',2);E.player.moveTo('gate_zone');clr(E);const t0=now();E.dungeon.enter('hunter.goblin_warren');let g=0,saves=0,ts=0,size=0;
 while(E.dungeon.run().status==='active'&&g++<200){if(E.combat.session()){E.combat.act({type:'attack'});continue}if(E.events.pending()){clr(E);continue}
  if(g%3===0){const a=now();E.saveTo(1);size=E.save.st.getItem('mvh1:slot1').length;E.loadFrom(1);ts+=now()-a;saves++}E.dungeon.advance()}
 out.dungeon={status:E.dungeon.run().status,steps:g,ms:+(now()-t0).toFixed(1),saveLoads:saves,msPerSaveLoad:+(ts/Math.max(1,saves)).toFixed(2),saveKB:+(size/1024).toFixed(1),claimed:E.dungeon.get().claimed.length};
 console.log('ดันเจี้ยนจนจบ + เซฟ/โหลดกลางทาง',out.dungeon)}
// 5) หอคอย 20 ชั้น
{const E=hunter('pt',3);E.state.mutate('player','player',p=>{p.stats.str+=400;p.stats.vit+=200});E.player.moveTo('tower');clr(E);const t0=now();let g=0;
 while(g++<60){E.player.addHp(99999);E.state.mutate('player','player',p=>{p.ap=9});const t=E.tower.here().find(x=>x.id==='hunter.city_tower');if(!t||!t.next||!t.ok)break;
  try{E.tower.climb(t.id,{acceptRisk:true})}catch(e){break}let k=0;while(E.combat.session()&&k++<200){if(E.combat.session().status==='active')E.combat.act({type:'attack'});else break}clr(E)}
 out.tower={best:E.tower.state('hunter.city_tower').best,attempts:g,ms:+(now()-t0).toFixed(1)};console.log('หอคอย',out.tower)}
// 6) NPC จำนวนมาก + ทีม 3 คน
{const rows=[];for(const n of[100,500,1000]){const E=hunter('pn'+n,3);for(let i=E.npcs.all('hunter').length;i<n;i++)E.npcs.generate('hunter',{occupation:['student','teacher','shopkeeper','npc_hunter','doctor'][i%5]});
 const M=12,t0=now();for(let i=0;i<M;i++){clr(E);E.loop.tick(true)}const ms=(now()-t0)/M;E.saveTo(0);rows.push({npcs:E.npcs.all('hunter').length,party:E.party.get().members.length,msPerMonth:+ms.toFixed(2),saveKB:+(E.save.st.getItem('mvh1:slot0').length/1024).toFixed(1)})}
 console.log('NPC จำนวนมาก + ทีม');console.table(rows)}
module.exports={};
