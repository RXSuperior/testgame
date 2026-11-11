// จำลองการเล่นด้วยบอท: node tests/sim.js [จำนวนรอบ] [โหมด: active|idle]
// ใช้ตรวจสมดุลและว่าเกมเล่นจบวงจร 15 -> แรงก์ C ได้จริง
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(R,'tools/build.py'),'utf8').match(/ORDER=\[(.*?)\]/s)[1].match(/'([^']+)'/g).map(s=>s.slice(1,-1)).filter(f=>!f.includes('/ui/'));
function boot(){const ctx={console,Date,Math,JSON,setInterval,clearInterval};ctx.globalThis=ctx;vm.createContext(ctx);for(const f of ORDER)vm.runInContext(fs.readFileSync(path.join(R,f),'utf8'),ctx,{filename:f});return ctx}
class Mem{constructor(){this.m=new Map()}get length(){return this.m.size}key(i){return[...this.m.keys()][i]}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
function newGame(ctx,seed){const AW=ctx.AW,E=new AW.core.Engine({storage:new Mem(),timer:{setInterval:()=>1,clearInterval:()=>{}}});E.assets.registerAll(AW.data.assets);AW.systems.installGameplay(E);
 const r=E.worlds.registerAll(AW.data.worlds);if(r.bad.length)throw new Error(r.bad.join('\n'));E.newGame({seed});E.worlds.start('hunter');E.player.create({name:'บอท',stats:{str:10,agi:10,int:10,vit:10,cha:10,luk:10},money:100});return E}
// บอทแบบตั้งใจเล่น: ตอบตัวเลือกที่โอกาสสูงสุด ฝึกค่าสถานะ ทำภารกิจ ซื้ออุปกรณ์
function activeMonth(E){const ev=E.events,P=E.player;
 // บอทนี้เล่นสายฮันเตอร์: ไม่รับงานประจำเต็มเวลา (ใช้ AP หมด)
 const answer=()=>{let g=0;while(ev.pending()&&g++<10){if(ev.pending().id==='hunter.office_offer'){ev.answer(1);continue}if(ev.pending().id==='hunter.registration'){const c=ev.choices();ev.answer(c[0].ok?0:1);continue}const cs=ev.choices().filter(c=>c.ok);const best=cs.sort((a,b)=>b.chance-a.chance)[0]||ev.choices()[ev.choices().length-1];ev.answer(best.i)}};
 const go=loc=>{if(P.get().location.loc!==loc&&P.canEnter(loc)){P.moveTo(loc);answer()}};
 answer();let p=P.get();
 if(!p.alive)return;
 if((p.injury>=2||(E.health&&E.health.severity()>=2&&!E.health.get().ill.treated))&&p.money>=100){go('hospital');try{ev.doAction('hunter.treat')}catch(e){}answer()}
 if(!p.class){go('school');for(const a of['hunter.class','hunter.hangout'])if(P.get().ap>0)try{ev.doAction(a);answer()}catch(e){}return}
 go('association');answer();
 for(const it of['crystal_blade_c','light_armor_d','mana_blade_d','leather_vest','iron_dagger']){const q='hunter.'+it;if(!P.get().inventory[q]){go('market');const a=ev.actions().find(x=>x.id==='hunter.buy_'+it);if(a&&a.ok&&P.get().money>=P.item(q).price+50){ev.doAction(a.id);answer();break}}}
 for(const it of['mana_stone','monster_core'])while(P.get().inventory['hunter.'+it]){go('city');try{ev.doAction(it==='mana_stone'?'hunter.sell_stone':'hunter.sell_core')}catch(e){break}answer()}
 let tries=0;while(P.get().ap>0&&tries++<6){let done=false;for(const loc of['association','gate_zone']){if(!P.canEnter(loc))continue;go(loc);
   const ms=E.missions.available().filter(m=>m.ok).sort((a,b)=>(b.id.includes('exam')-a.id.includes('exam'))||(b.chance>0.6)-(a.chance>0.6)||'EDCBAS'.indexOf(b.rank)-'EDCBAS'.indexOf(a.rank));
   const m=ms.find(x=>x.chance>=0.55)||null;if(m){E.missions.start(m.id);answer();done=true;break}}
  if(!done){go('gym');const t=['hunter.train_str','hunter.train_vit','hunter.meditate','hunter.train_agi'].find(a=>(ev.actions().find(x=>x.id===a)||{}).ok);if(t){ev.doAction(t);answer()}else{go('city');try{ev.doAction('hunter.part_time')}catch(e){}answer()}}}}
// บอทไม่ทำอะไร: ตอบตัวเลือกแรกที่เลือกได้ ไม่ฝึก ไม่รับภารกิจ (พิสูจน์ว่าเวลาอย่างเดียวไม่ทำให้เลื่อนแรงก์)
function idleMonth(E){const ev=E.events;if(!E.player.get().alive)return;let g=0;while(ev.pending()&&g++<10){const c=ev.choices().find(x=>x.ok)||ev.choices()[0];ev.answer(c.i)}}
function play(ctx,seed,mode,maxMonths=12*12){const E=newGame(ctx,seed),errs=[];E.bus.on('bus:error',e=>errs.push(e.err&&e.err.message));E.bus.on('world:error',e=>errs.push(e.err&&e.err.message));
 const marks={};E.bus.on('rank:set',e=>{marks[e.rank]=marks[e.rank]||Math.round(E.player.get().age/12*10)/10});E.bus.on('event:show',({id})=>{if(id==='hunter.awakening')marks.awake=E.player.get().age/12});
 for(let i=0;i<maxMonths;i++){(mode==='idle'?idleMonth:activeMonth)(E);if(!E.player.get().alive)break;E.loop.tick(true);if(E.player.get().ranks.hunter==='C'&&mode!=='idle'){idleMonth(E);break}}
 const p=E.player.get();return{seed,dead:!p.alive&&p.death,rank:p.ranks.hunter||'-',age:Math.round(p.age/12*10)/10,level:p.level,money:p.money,cls:p.class,marks,events:Object.keys(E.state.get('events').done).length,missions:E.state.get('missions').byTag,errs,E}}
module.exports={boot,newGame,play,activeMonth,idleMonth,Mem};
if(require.main===module){const n=+process.argv[2]||20,mode=process.argv[3]||'active',ctx=boot(),res=[];for(let i=0;i<n;i++)res.push(play(ctx,'sim'+i,mode));
 for(const r of res)console.log(r.seed,r.dead?'DEAD '+r.dead.cause:'',r.rank,'age',r.age,'lv',r.level,'money',r.money,r.cls,JSON.stringify(r.marks),'events',r.events,JSON.stringify(r.missions),r.errs.length?'ERR '+r.errs.slice(0,2):'');
 const c=res.filter(r=>r.rank==='C');console.log(`ถึงแรงก์ C ${c.length}/${n}`+(c.length?` อายุเฉลี่ย ${(c.reduce((a,r)=>a+r.age,0)/c.length).toFixed(1)}`:''))}
