// เศรษฐกิจระยะยาว: node tests/econ.js [รอบต่อสไตล์] [--json out.json]
// บอท 6 สไตล์ เล่นตั้งแต่อายุ 15 ถึง 40 (300 เดือน) เก็บเงินที่อายุ 20/30/40 รายได้-รายจ่าย แรงก์ อุปกรณ์ สกิล ดันเจี้ยน หอคอย
const S=require('./sim.js');const ctx=S.boot();
const STYLES=['mission','solo','party','trainer','worker','dungeon'];
const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0,med=a=>{if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:Math.round((b[m-1]+b[m])/2)};
function run(seed,style,months=300){const E=S.newGame(ctx,seed),errs=[];E.bus.on('bus:error',e=>errs.push(e.err&&e.err.message));E.bus.on('world:error',e=>errs.push(e.err&&e.err.message));
 const marks={},money={},flow={in:0,out:0},byCat={},moIn=[];let lastIn=0;E.bus.on('rank:set',e=>{marks[e.rank]=marks[e.rank]||Math.round(E.player.get().age/12*10)/10});
 E.bus.on('money:changed',e=>{if(e.n>0)flow.in+=e.n;else flow.out-=e.n;const k=(e.n>0?'+':'-')+(e.cat||'other');byCat[k]=(byCat[k]||0)+Math.abs(e.n)});
 for(let i=0;i<months;i++){try{S.styleMonth(E,style)}catch(e){errs.push('bot: '+e.message)}if(!E.player.get().alive)break;E.loop.tick(true);const a=E.player.get().age;if(a>=25*12){moIn.push(flow.in-lastIn)}lastIn=flow.in;for(const y of[20,30,40])if(a===y*12)money[y]=E.player.get().money}
 const p=E.player.get(),up=Object.values(p.upgrades||{}).reduce((a,x)=>a+(x.lv||x||0),0);
 return{seed,style,rank:p.ranks.hunter||'-',marks,money,flow,byCat,dead:!p.alive,errs,skillLv:Object.values(p.skillLv||{}).reduce((a,x)=>a+x.lv,0),skills:p.skills.length,upgrades:up,
  gear:Object.values(p.equipment).filter(Boolean).map(q=>q.split('.')[1]).join('+'),dungeons:Object.values(E.dungeon.get().records).reduce((a,r)=>a+r.runs,0),clears:Object.values(E.dungeon.get().records).reduce((a,r)=>a+r.clears,0),
  tower:(E.tower.get().towers['hunter.city_tower']||{best:0}).best,merit:E.missions.get().merit||0,power:(()=>{const x=E.combat.profile('hunter');return x.power+x.partyPower})(),statTotal:['str','agi','int','vit'].reduce((x,k)=>x+p.stats[k],0),finds:E.dungeon.discoveries(),raids:(E.missions.get().done['hunter.b_raid_hydra']||0),bounties:(E.missions.get().done['hunter.b_bounty_stalker']||0),guildJobs:Object.entries(E.missions.get().done).filter(([k])=>k.includes('.gc_')).reduce((x,[,v])=>x+v,0),salaryShare:0,stake:E.economy?E.economy.summary().stakes:0,job:(E.life.jobDef()||{}).id||'-',partyN:E.party.get().members.length,towerTries:E.__towerTries||0,econ:E.economy?E.economy.summary():null,incomeCV:(()=>{const n=moIn.length;if(!n)return 0;const mu=moIn.reduce((x,y)=>x+y,0)/n;return mu?Math.sqrt(moIn.reduce((x,y)=>x+(y-mu)**2,0)/n)/mu:0})(),E,salaryIn:byCat['+salary']||0,missionIn:byCat['+mission']||0}}
function table(n=4){const rows=[],all=[],sig=[];for(const st of STYLES){const rs=[];for(let i=0;i<n;i++){const r=run('eco'+i,st);rs.push(r);all.push(r)}
 const at=k=>rs.filter(r=>r.marks[k]).map(r=>r.marks[k]),m=y=>rs.filter(r=>r.money[y]!==undefined).map(r=>r.money[y]);
 rows.push({style:st,C:`${at('C').length}/${n}`,ageC:+(at('C').reduce((a,b)=>a+b,0)/(at('C').length||1)).toFixed(1),B:`${at('B').length}/${n}`,ageB:+(at('B').reduce((a,b)=>a+b,0)/(at('B').length||1)).toFixed(1),
  avg20:avg(m(20)),med20:med(m(20)),avg30:avg(m(30)),med30:med(m(30)),avg40:avg(m(40)),med40:med(m(40)),inMo:avg(rs.map(r=>r.flow.in/300)),outMo:avg(rs.map(r=>r.flow.out/300)),
  upg:+(rs.reduce((a,r)=>a+r.upgrades,0)/n).toFixed(1),skLv:+(rs.reduce((a,r)=>a+r.skillLv,0)/n).toFixed(1),dgRuns:+(rs.reduce((a,r)=>a+r.dungeons,0)/n).toFixed(1),tower:+(rs.reduce((a,r)=>a+r.tower,0)/n).toFixed(1),towerTries:+(rs.reduce((a,r)=>a+r.towerTries,0)/n).toFixed(1),
  ok:`${rs.filter(r=>!r.dead&&'BAS'.includes(r.rank)&&r.rank!=='-').length}/${n}`,dead:rs.filter(r=>r.dead).length,errors:rs.reduce((a,r)=>a+r.errs.length,0)});
 sig.push({style:st,power:avg(rs.map(r=>r.power)),incomeCV:+(rs.reduce((a,r)=>a+r.incomeCV,0)/n).toFixed(2),merit:avg(rs.map(r=>r.merit)),statTotal:avg(rs.map(r=>r.statTotal)),'salary%':Math.round(100*rs.reduce((a,r)=>a+r.salaryIn,0)/Math.max(1,rs.reduce((a,r)=>a+r.flow.in,0))),
  'mission%':Math.round(100*rs.reduce((a,r)=>a+r.missionIn,0)/Math.max(1,rs.reduce((a,r)=>a+r.flow.in,0))),finds:+(rs.reduce((a,r)=>a+r.finds,0)/n).toFixed(1),raids:+(rs.reduce((a,r)=>a+r.raids,0)/n).toFixed(1),bounties:+(rs.reduce((a,r)=>a+r.bounties,0)/n).toFixed(1),
  guildJobs:+(rs.reduce((a,r)=>a+r.guildJobs,0)/n).toFixed(1),party:+(rs.reduce((a,r)=>a+r.partyN,0)/n).toFixed(1),stake:avg(rs.map(r=>r.stake)),gear:rs[0].gear,jobs:[...new Set(rs.map(r=>r.job))].join(',')})}
 return{rows,all,sig}}
module.exports={run,table,STYLES};
if(require.main===module){const n=+process.argv[2]||4;const{rows,all,sig}=table(n);console.table(rows);console.log('style signatures:');console.table(sig);
 const errs=all.flatMap(r=>r.errs);if(errs.length)console.log('errors:',[...new Set(errs)].slice(0,10));
 const cats={};for(const r of all)for(const[k,v]of Object.entries(r.byCat))cats[k]=(cats[k]||0)+v;console.log('money by category (avg per character per month):');
 console.table(Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({cat:k,perMonth:Math.round(v/all.length/300)})));
 const j=process.argv.indexOf('--json');if(j>0)require('fs').writeFileSync(process.argv[j+1],JSON.stringify({rows,sig,cats},null,1))}
