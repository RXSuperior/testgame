// วัดต้นทุนการจำลอง NPC: node tests/perf.js
// ต่อจำนวน NPC: เวลาเฉลี่ยต่อเดือน (โลกที่ผู้เล่นอยู่ = จำลองเต็ม, โลกอื่น = รวบทุก 12 เดือน) และขนาดเซฟ
const S=require('./sim.js');const ctx=S.boot();
function run(n,{elsewhere=false,months=24}={}){const E=S.newGame(ctx,'perf'+n);const clr=()=>{let g=0;while(E.events.pending()&&g++<20){const c=E.events.choices().find(x=>x.ok);E.events.answer(c.i)}};clr();
 const w=elsewhere?'fantasy':'hunter',have=E.npcs.all(w).length;for(let i=have;i<n;i++)E.npcs.generate(w==='fantasy'?'hunter':'hunter',{occupation:['student','teacher','shopkeeper','npc_hunter','doctor'][i%5]});
 if(elsewhere)E.worlds.travelVia('rift_fantasy');
 const t0=process.hrtime.bigint();for(let i=0;i<months;i++){clr();E.loop.tick(true)}const ms=Number(process.hrtime.bigint()-t0)/1e6/months;
 E.saveTo(0);const size=E.save.st.getItem('mvh1:slot0').length,rels=Object.keys(E.state.get('rels').e).length;
 const tq=process.hrtime.bigint();for(let i=0;i<100;i++)E.npcs.at('hunter','city');const q=Number(process.hrtime.bigint()-tq)/1e6/100;
 return{n:E.npcs.all('hunter').length,ms:+ms.toFixed(2),saveKB:+(size/1024).toFixed(1),rels,queryMs:+q.toFixed(3)}}
const rows=[];for(const n of[20,100,500,1000])rows.push(Object.assign({mode:'อยู่ในโลก'},run(n)));
for(const n of[500,1000])rows.push(Object.assign({mode:'อยู่โลกอื่น'},run(n,{elsewhere:true})));
console.table(rows);module.exports={run};
