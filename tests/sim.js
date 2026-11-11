// จำลองการเล่นด้วยบอท: node tests/sim.js [จำนวนรอบ] [โหมด: active|idle]
// ใช้ตรวจสมดุลและว่าเกมเล่นจบวงจร 15 -> แรงก์ C ได้จริง
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(R,'tools/build.py'),'utf8').match(/ORDER=\[(.*?)\]/s)[1].match(/'([^']+)'/g).map(s=>s.slice(1,-1)).filter(f=>!f.includes('/ui/'));
function boot(){const ctx={console,Date,Math,JSON,setInterval,clearInterval};ctx.globalThis=ctx;vm.createContext(ctx);for(const f of ORDER)vm.runInContext(fs.readFileSync(path.join(R,f),'utf8'),ctx,{filename:f});return ctx}
class Mem{constructor(){this.m=new Map()}get length(){return this.m.size}key(i){return[...this.m.keys()][i]}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
function newGame(ctx,seed){const AW=ctx.AW,E=new AW.core.Engine({storage:new Mem(),timer:{setInterval:()=>1,clearInterval:()=>{}}});E.assets.registerAll(AW.data.assets);AW.systems.installGameplay(E);
 const r=E.worlds.registerAll(AW.data.worlds);if(r.bad.length)throw new Error(r.bad.join('\n'));E.newGame({seed});E.worlds.start('hunter');E.player.create({name:'บอท',stats:{str:10,agi:10,int:10,vit:10,cha:10,luk:10},money:100});return E}
// ---- บอทหลายสไตล์ (Phase 5) ----
// mission: ทำภารกิจทุก AP · solo: เหมือน mission แต่ไม่ใช้ทีม · party: คุยกับ NPC สายต่อสู้ทุกเดือนแล้วชวนเข้าทีม
// trainer: ครึ่งหนึ่งฝึก/เรียนสกิล ครึ่งหนึ่งทำภารกิจ · worker: ทำงานประจำและใช้ชีวิต ต่อสู้น้อย · dungeon: ดันเจี้ยนและหอคอยเป็นหลัก
// active (Phase 3/4): mission + หยุดเมื่อถึงแรงก์ C
function helpers(E){const ev=E.events,P=E.player;
 const answer=()=>{let g=0;while(ev.pending()&&g++<12){const id=ev.pending().id;if(id==='hunter.office_offer'){ev.answer(E.__style==='worker'?0:1);continue}if(id==='hunter.registration'){const c=ev.choices();ev.answer(c[0].ok?0:1);continue}
   const cs=ev.choices().filter(c=>c.ok&&!/ลอบสังหาร|ขอส่วนแบ่ง|รับงาน \(/.test(c.text));const best=cs.sort((a,b)=>b.chance-a.chance)[0]||ev.choices().filter(c=>c.ok).pop()||ev.choices()[ev.choices().length-1];ev.answer(best.i)}};
 const go=loc=>{if(P.get().location.loc!==loc&&P.canEnter(loc)){P.moveTo(loc);answer()}};
 // ต่อสู้ manual แบบง่าย: เลือดต่ำถอย, ใช้สกิลรักษาเมื่อจำเป็น, ไม่งั้นสกิลโจมตีที่แรงสุด
 const fight=()=>{let g=0;while(E.combat.session()&&E.combat.session().status==='active'&&g++<60){const s=E.combat.session(),o=E.combat.options().filter(x=>!x.why);
   if(s.me.hp<s.me.max*0.25&&!s.me.critical&&o.find(x=>x.type==='help')){E.combat.act({type:'help'});continue}
   if(s.me.hp<s.me.max*0.2||s.me.critical){E.combat.act({type:'retreat'});continue}
   const heal=o.find(x=>x.type==='skill'&&s.skills.find(k=>k.id===x.id).act==='heal');if(heal&&s.me.hp<s.me.max*0.5){E.combat.act(heal);continue}
   const dmg=o.filter(x=>x.type==='skill'&&['damage','stun'].includes(s.skills.find(k=>k.id===x.id).act)).sort((a,b)=>s.skills.find(k=>k.id===b.id).mult-s.skills.find(k=>k.id===a.id).mult)[0];
   E.combat.act(dmg||{type:'attack'})}answer()};
 return{ev,P,answer,go,fight}}
function prep(E,h){const{ev,P,answer,go}=h;answer();let p=P.get();if(!p.alive)return false;
 if((p.injury>=2||(E.health.severity()>=2&&!E.health.get().ill.treated))&&p.money>=100){go('hospital');try{ev.doAction('hunter.treat')}catch(e){}answer()}
 if(!p.class){go('school');for(const a of['hunter.class','hunter.hangout'])if(P.get().ap>0)try{ev.doAction(a);answer()}catch(e){}return false}
 go('association');answer();
 for(const it of['crystal_blade_c','light_armor_d','mana_blade_d','leather_vest','iron_dagger']){const q='hunter.'+it;if(!P.get().inventory[q]){go('market');const a=ev.actions().find(x=>x.id==='hunter.buy_'+it);if(a&&a.ok&&P.get().money>=P.item(q).price+50){ev.doAction(a.id);answer();break}}}
 if(!P.get().inventory['hunter.mana_ring']&&P.get().money>800){go('market');const a=ev.actions().find(x=>x.id==='hunter.buy_mana_ring');if(a&&a.ok){ev.doAction(a.id);answer()}}
 for(const sl of['weapon','armor','accessory']){const q=P.get().equipment[sl],c=q&&P.upgradeCost(q);if(c&&P.get().money>c.money*2+300)P.upgrade(q)}
 for(const it of['mana_stone','monster_core'])while(P.get().inventory['hunter.'+it]){go('city');try{ev.doAction(it==='mana_stone'?'hunter.sell_stone':'hunter.sell_core')}catch(e){break}answer()}
 return true}
function doMission(E,h,{risky=false}={}){const{P,go,answer,fight}=h;for(const loc of['association','gate_zone']){if(!P.canEnter(loc))continue;go(loc);
  const ms=E.missions.available().filter(m=>m.ok&&m.risk!=='lethal'&&(risky||m.mode==='auto'||m.id.includes('exam'))).sort((a,b)=>(b.id.includes('exam')-a.id.includes('exam'))||(b.chance>0.6)-(a.chance>0.6)||'EDCBAS'.indexOf(b.rank)-'EDCBAS'.indexOf(a.rank));
  const m=ms.find(x=>x.chance>=0.55);if(m){E.missions.start(m.id,{acceptRisk:true});fight();answer();return true}}return false}
function doTrain(E,h){const{ev,P,go,answer}=h;go('gym');for(const a of['hunter.learn_shock','hunter.learn_iron_body','hunter.practice_skills','hunter.train_str','hunter.train_vit','hunter.meditate','hunter.train_agi']){const x=ev.actions().find(y=>y.id===a);if(x&&x.ok){ev.doAction(a);answer();return true}}
 go('association');const r=ev.actions().find(y=>y.id==='hunter.learn_rally');if(r&&r.ok){ev.doAction(r.id);answer();return true}return false}
function doWork(E,h){const{ev,P,go,answer}=h;go('city');try{ev.doAction('hunter.part_time')}catch(e){}answer()}
function social(E,h){const{P,go,answer}=h;for(const loc of['association','gym','hospital','city']){if(!P.canEnter(loc))continue;go(loc);for(const n of E.npcs.at(P.get().location.world,loc)){if(!E.party.combatOf(n.id))continue;
  if(!E.party.canInvite(n.id))E.party.invite(n.id);else if(E.rels.actions(n.id).find(a=>a.id==='talk'&&!a.why)){E.rels.interact(n.id,'talk');if(E.rels.actions(n.id).find(a=>a.id==='gift'&&!a.why)&&P.get().money>500){}}}answer()}}
function doDungeon(E,h){const{P,go,answer,fight}=h;go('gate_zone');const ds=E.dungeon.here().filter(d=>d.ok).sort((a,b)=>'EDCBAS'.indexOf(b.rank)-'EDCBAS'.indexOf(a.rank));if(!ds.length)return false;
 E.dungeon.enter(ds[0].id,{fromCheckpoint:false});let g=0;while(E.dungeon.run()&&E.dungeon.run().status==='active'&&g++<40){const r=E.dungeon.run();if(r.waiting){if(r.waiting.kind==='combat')fight();else answer();continue}
  if(P.get().hp<P.maxHp()*0.35&&!r.waiting){E.dungeon.leave();break}E.dungeon.advance();fight();answer()}if(E.dungeon.run()&&E.dungeon.run().status!=='active')E.dungeon.close();return true}
function doTower(E,h){const{P,go,answer,fight}=h;if(!P.canEnter('tower'))return false;go('tower');const t=E.tower.here().find(x=>x.ok);if(!t||(t.next.kind==='boss'&&E.combat.chance('hunter','tower_warden')<0.5))return false;E.tower.climb(t.id,{acceptRisk:true});fight();answer();return true}
function styleMonth(E,style){E.__style=style;const h=helpers(E);if(!prep(E,h))return;const P=E.player;
 if(style==='party')social(E,h);
 if(style==='worker'){const cur=E.life.jobDef();for(const loc of['city','hospital','association','gym']){if(!P.canEnter(loc))continue;h.go(loc);const j=E.life.jobsHere().filter(x=>x.ok&&x.ap===1&&!x.current).sort((a,b)=>b.salary-a.salary)[0];if(j&&(!cur||j.salary>cur.salary)){E.life.takeJob(j.id);break}}}
 if(style==='worker'&&E.life.get().home.mode==='family'&&P.get().age>=12*22&&P.get().money>6000){h.go('city');try{E.life.moveIn('apartment','rent')}catch(e){}}
 // สอบเลื่อนแรงก์ก่อนเสมอถ้าเปิดแล้ว (ทุกสไตล์)
 for(const loc of['association']){if(P.get().ap>0&&P.canEnter(loc)){h.go(loc);const ex=E.missions.available().find(m=>m.ok&&m.id.includes('exam')&&m.chance>=0.5);if(ex){E.missions.start(ex.id,{acceptRisk:true});h.fight();h.answer()}}}
 let tries=0;while(P.get().ap>0&&P.get().alive&&tries++<6){let done=false;
  if(style==='trainer'&&P.get().ap===2)done=doTrain(E,h);
  else if(style==='dungeon')done=doDungeon(E,h)||doTower(E,h);
  else if(style==='solo'&&P.get().ap===2&&E.loop.month%3===0)done=doDungeon(E,h)||doTower(E,h);
  if(!done)done=doMission(E,h,{risky:['mission','party','dungeon','solo'].includes(style)});
  if(!done)done=doTrain(E,h);if(!done){doWork(E,h)}}}
function activeMonth(E){styleMonth(E,'solo')}
// บอทไม่ทำอะไร: ตอบตัวเลือกแรกที่เลือกได้ ไม่ฝึก ไม่รับภารกิจ (พิสูจน์ว่าเวลาอย่างเดียวไม่ทำให้เลื่อนแรงก์)
function idleMonth(E){const ev=E.events;if(!E.player.get().alive)return;let g=0;while(ev.pending()&&g++<10){const c=ev.choices().find(x=>x.ok)||ev.choices()[0];ev.answer(c.i)}}
function play(ctx,seed,mode,maxMonths=12*12){const style=mode==='active'?'solo':mode;const E=newGame(ctx,seed),errs=[];E.bus.on('bus:error',e=>errs.push(e.err&&e.err.message));E.bus.on('world:error',e=>errs.push(e.err&&e.err.message));
 const marks={};E.bus.on('rank:set',e=>{marks[e.rank]=marks[e.rank]||Math.round(E.player.get().age/12*10)/10});E.bus.on('event:show',({id})=>{if(id==='hunter.awakening')marks.awake=E.player.get().age/12});
 for(let i=0;i<maxMonths;i++){mode==='idle'?idleMonth(E):styleMonth(E,style);if(!E.player.get().alive)break;E.loop.tick(true);if(E.player.get().ranks.hunter==='C'&&mode==='active'){idleMonth(E);break}}
 const p=E.player.get();return{seed,style:mode,status:E.life.statusScore(),party:E.party.get().members.length,skills:p.skills.length,skillLv:Object.values(p.skillLv||{}).reduce((a,x)=>a+x.lv,0),dungeons:Object.values(E.dungeon.get().records).reduce((a,r)=>a+r.clears,0),tower:(E.tower.get().towers['hunter.city_tower']||{best:0}).best,dead:!p.alive&&p.death,rank:p.ranks.hunter||'-',age:Math.round(p.age/12*10)/10,level:p.level,money:p.money,cls:p.class,marks,events:Object.keys(E.state.get('events').done).length,missions:E.state.get('missions').byTag,errs,E}}
module.exports={boot,newGame,play,activeMonth,idleMonth,styleMonth,Mem};
if(require.main===module){const n=+process.argv[2]||20,mode=process.argv[3]||'active',ctx=boot(),res=[];for(let i=0;i<n;i++)res.push(play(ctx,'sim'+i,mode));
 for(const r of res)console.log(r.seed,r.dead?'DEAD '+r.dead.cause:'',r.rank,'age',r.age,'lv',r.level,'money',r.money,r.cls,JSON.stringify(r.marks),'events',r.events,JSON.stringify(r.missions),r.errs.length?'ERR '+r.errs.slice(0,2):'');
 const c=res.filter(r=>r.rank==='C');console.log(`ถึงแรงก์ C ${c.length}/${n}`+(c.length?` อายุเฉลี่ย ${(c.reduce((a,r)=>a+r.age,0)/c.length).toFixed(1)}`:''))}
