// วัดต้นทุนระบบ Phase 6: node tests/perf6.js
// NPC จำนวนมาก + AI ปีนหอคอย (เปิด/ปิด) · ระบบเศรษฐกิจ (บริการรายเดือน/ลงทุน/สมุดบัญชี) · ขนาดเซฟ · บอทเล่น 25 ปี
const S=require('./sim.js');const ctx=S.boot();
const now=()=>Number(process.hrtime.bigint())/1e6;
const clr=E=>{let g=0;while(E.events.pending()&&g++<20){const c=E.events.choices().find(x=>x.ok)||E.events.choices()[0];E.events.answer(c.i)}};
function world(n,{towerAI=true,eco=true}={}){const E=S.newGame(ctx,'p6perf'+n);clr(E);E.state.mutate('player','player',p=>{p.ranks.hunter='C';p.class='hunter.sword';p.money=200000});E.worlds.ctx('hunter').mutate(s=>{s.flags.registered=true});
 for(let i=E.npcs.all('hunter').length;i<n;i++)E.npcs.generate('hunter',{occupation:['student','teacher','shopkeeper','npc_hunter','doctor'][i%5]});
 if(eco){E.player.moveTo('association',{force:true});clr(E);E.economy.buy('hunter.assoc_insurance');E.economy.invest('hunter.northstar',10000);E.economy.invest('hunter.ironfang',10000)}
 if(!towerAI)E.tower._npcMonth=()=>{};let money=0;E.bus.on('money:changed',()=>money++);
 const M=24,t0=now();for(let i=0;i<M;i++){clr(E);E.loop.tick(true)}const ms=(now()-t0)/M;
 const tq='hunter.city_tower',T=E.tower.get().npc[tq]||{},tries=Object.values(T).reduce((a,r)=>a+r.tries,0);E.saveTo(0);
 return{npcs:E.npcs.all('hunter').length,towerAI,eco,msPerMonth:+ms.toFixed(2),npcClimbsPerMonth:+(tries/M).toFixed(2),moneyEvents:+(money/M).toFixed(1),saveKB:+(E.save.st.getItem('mvh1:slot0').length/1024).toFixed(1)}}
const rows=[];for(const n of[100,500,1000]){rows.push(world(n));rows.push(world(n,{towerAI:false}))}rows.push(world(500,{eco:false,towerAI:false}));
console.log('NPC + AI หอคอย + เศรษฐกิจ (เฉลี่ย 24 เดือน)');console.table(rows);
// บอทเล่น 25 ปี (อายุ 15-40) ต่อสไตล์
const X=require('./econ.js'),bot=[];for(const st of X.STYLES){const t0=now(),r=X.run('perf',st,300);bot.push({style:st,ms:Math.round(now()-t0),msPerMonth:+((now()-t0)/300).toFixed(2),errors:r.errs.length})}
console.log('บอทเล่น 300 เดือน');console.table(bot);
