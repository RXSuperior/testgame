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
 const answer=()=>{let g=0;while(ev.pending()&&g++<12){const id=ev.pending().id;if(id==='hunter.office_offer'){ev.answer(E.__style==='worker'?0:1);continue}if(id==='hunter.b_promotion'){ev.answer({solo:2,party:1,dungeon:1}[E.__style]||0);continue}if(id==='hunter.registration'){const c=ev.choices();ev.answer(c[0].ok?0:1);continue}
   const cs=ev.choices().filter(c=>c.ok&&!/ลอบสังหาร|ขอส่วนแบ่ง|รับงาน \(/.test(c.text));const best=cs.sort((a,b)=>b.chance-a.chance)[0]||ev.choices().filter(c=>c.ok).pop()||ev.choices()[ev.choices().length-1];try{ev.answer(best.i)}catch(e){const alt=ev.choices().filter(c=>c.ok&&c.i!==best.i).pop()||ev.choices()[ev.choices().length-1];ev.answer(alt.i)}}};
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
// ---- ภารกิจ: เลือกจากค่าคาดหวัง (โอกาส x เงิน x ตัวคูณ saturation) · สอบก่อนเสมอ · หลบงานที่ทำซ้ำถี่ ----
function misMoney(E,q){const d=E.missions.def(q);return(d.win||[]).reduce((a,x)=>a+(x.money>0?x.money:0),0)+((d.win||[]).some(x=>x.item)?150:0)+((d.win||[]).some(x=>x.exp)?d.win.find(x=>x.exp).exp*0.4:0)}
function doMission(E,h,{risky=false,solo=false}={}){const{P,go,answer,fight}=h;let best=null;for(const loc of['association','gate_zone']){if(!P.canEnter(loc))continue;go(loc);
  for(const m of E.missions.available()){if(!m.ok||m.risk==='lethal'||!(risky||m.mode==='auto'||m.id.includes('exam')))continue;const need=m.mode==='manual'?0.62:0.55;if(m.chance<need)continue;
   const ev=m.id.includes('exam')?1e9:m.chance*misMoney(E,m.id)*m.pay*(E.__style==='mission'&&(E.missions.def(m.id).at||'association')==='association'?1.6:1);if(!best||ev>best.ev)best={m,loc,ev}}}
 if(!best)return false;go(best.loc);if(best.m.mode==='manual'&&P.get().money>3000){go('association');buySvc(E,h,'hunter.intel_report');go(best.loc)}
 if(E.missions.available().find(x=>x.id===best.m.id&&x.ok)){E.missions.start(best.m.id,{acceptRisk:true});fight();answer();return true}return false}
function buySvc(E,h,q){const x=E.economy.servicesHere().find(y=>y.id===q);if(x&&x.ok){try{E.economy.buy(q);h.answer();E.__spent=(E.__spent||0)+x.price;return true}catch(e){}}return false}
function doTrain(E,h){const{ev,P,go,answer}=h;const money=P.get().money,res=reserve(E);
 // เทรนเนอร์ใช้เงินกับหลักสูตร ราคาขึ้นทุกครั้ง ซื้อเมื่อยังคุ้ม
 if(E.__style==='trainer'){go('association');for(const q of['hunter.assoc_program','hunter.skill_seminar']){const x=E.economy.servicesHere().find(y=>y.id===q);if(x&&x.ok&&money-x.price>res)return buySvc(E,h,q)}
  go('gym');const x=E.economy.servicesHere().find(y=>y.id==='hunter.mana_course');if(x&&x.ok&&money-x.price>res)return buySvc(E,h,x.id)}
 go('gym');for(const a of['hunter.learn_piercing_thrust','hunter.learn_blade_storm','hunter.learn_second_wind','hunter.learn_shock','hunter.learn_iron_body','hunter.practice_skills','hunter.train_str','hunter.train_vit','hunter.meditate','hunter.train_agi']){const x=ev.actions().find(y=>y.id===a);if(x&&x.ok){ev.doAction(a);answer();return true}}
 go('association');const r=ev.actions().find(y=>y.id==='hunter.learn_rally');if(r&&r.ok){ev.doAction(r.id);answer();return true}return false}
function doWork(E,h){const{ev,P,go,answer}=h;go('city');try{ev.doAction('hunter.part_time')}catch(e){}answer()}
function social(E,h){const{P,go,answer}=h;for(const loc of['association','gym','hospital','city']){if(!P.canEnter(loc))continue;go(loc);for(const n of E.npcs.at(P.get().location.world,loc)){if(!E.party.combatOf(n.id))continue;
  if(!E.party.canInvite(n.id))E.party.invite(n.id);else if(E.rels.actions(n.id).find(a=>a.id==='talk'&&!a.why)){E.rels.interact(n.id,'talk')}}answer()}}
function doDungeon(E,h){const{P,go,answer,fight}=h;const ds=[];for(const loc of['gate_zone','city']){if(!P.canEnter(loc))continue;go(loc);for(const d of E.dungeon.here())if(d.ok)ds.push(Object.assign({loc},d))}
 // นักสำรวจเลือกดันเจี้ยนที่ยังค้นพบไม่ครบก่อน แล้วค่อยเลือกแรงก์สูงสุด
 if(P.get().hp<P.maxHp()*0.6)return false;
 // ถ้าดันเจี้ยนนี้ล้มเหลว 3 ครั้งล่าสุด ข้ามไปก่อน
 const bad=d=>((E.__dgSkip||{})[d.id]||0)>E.loop.month;
 const left=d=>{const g=E.dungeon.def(d.id),f=(E.dungeon.record(d.id).found||[]).length;return((g.finds||[]).length-f)>0?1:0};
 const ok=ds.filter(d=>!bad(d));ok.sort((a,b)=>(E.__style==='dungeon'?left(b)-left(a):0)||'EDCBAS'.indexOf(b.rank)-'EDCBAS'.indexOf(a.rank));if(!ok.length)return false;ds.length=0;ds.push(...ok);
 go(ds[0].loc);E.dungeon.enter(ds[0].id,{fromCheckpoint:false});let g=0;while(E.dungeon.run()&&E.dungeon.run().status==='active'&&g++<40){const r=E.dungeon.run();if(r.waiting){if(r.waiting.kind==='combat')fight();else answer();continue}
  if(P.get().hp<P.maxHp()*0.35&&!r.waiting){E.dungeon.leave();break}E.dungeon.advance();fight();answer()}const st=E.dungeon.run()&&E.dungeon.run().status,id=ds[0].id;E.__dgFail=E.__dgFail||{};E.__dgSkip=E.__dgSkip||{};
 if(st==='cleared')E.__dgFail[id]=0;else if(st){E.__dgFail[id]=(E.__dgFail[id]||0)+1;if(E.__dgFail[id]>=3){E.__dgSkip[id]=E.loop.month+12;E.__dgFail[id]=0}}
 if(E.dungeon.run()&&E.dungeon.run().status!=='active')E.dungeon.close();return true}
// หอคอย: ปีนเฉพาะเมื่อ assess แนะนำ climb (พร้อมและโอกาสพอ) · เป็นกิจกรรมหนึ่งไม่ใช่ทุกเดือน
function doTower(E,h){const{P,go,answer,fight}=h;if(!P.canEnter('tower'))return false;go('tower');const t=E.tower.here().find(x=>x.ok);if(!t)return false;const a=E.tower.assess(t.id);E.__towerLook=(E.__towerLook||0)+1;
 if(a.recommend!=='climb')return false;E.__towerTries=(E.__towerTries||0)+1;E.tower.climb(t.id,{acceptRisk:true});fight();answer();return true}
// ---- การใช้เงินแบบผู้เล่นที่มีเหตุผล: กันเงินสำรอง ซ่อม/อัปเกรด/ประกัน/บ้าน/ลงทุน ตามความถนัดของแต่ละสไตล์ ----
const RANK_RES={E:200,D:600,C:2500,B:6000};
function reserve(E){return Math.round((RANK_RES[E.player.get().ranks.hunter||'E']||200)*(E.__style==='trainer'?0.3:1))}
function spend(E,h,style){const{P,go}=h,res=reserve(E),m=()=>P.get().money,rank=P.get().ranks.hunter||'E',EC=E.economy;
 // ซ่อมอุปกรณ์เมื่อสภาพต่ำ
 for(const q of Object.values(P.get().equipment).filter(Boolean))if(EC.cond(q)<60&&m()>EC.repairCost(q)+res/2){try{EC.repair(q)}catch(e){}}
 // อุปกรณ์ B
 if(rank==='B'||rank==='A'){go('market');for(const a of['hunter.buy_stormsteel_blade_b','hunter.buy_colossus_plate_b','hunter.buy_seeker_charm_b']){const x=E.events.actions().find(y=>y.id===a);if(x&&x.ok&&m()-9500>res){E.events.doAction(a);h.answer()}}
  for(const it of['stormsteel_blade_b','hydra_fang_spear_b','colossus_plate_b','seeker_charm_b']){const q='hunter.'+it;if(P.get().inventory[q]&&!P.canEquip(q)){const cur=P.get().equipment[P.item(q).slot],cd=cur&&P.item(cur);if(!cd||(P.item(q).power||0)+(P.item(q).hp||0)/4>=(cd.power||0)+(cd.hp||0)/4)P.equip(q)}}}
 // อัปเกรด
 for(const sl of['weapon','armor','accessory']){const q=P.get().equipment[sl],c=q&&P.upgradeCost(q);if(c&&m()>c.money*1.5+res)P.upgrade(q)}
 // ประกันสำหรับสายเสี่ยง
 if(['C','B','A'].includes(rank)&&['mission','solo','party','dungeon'].includes(style)&&!EC.owned('hunter.assoc_insurance')&&m()>res*2){go('association');buySvc(E,h,'hunter.assoc_insurance')}
 // สัญญาดูแลอุปกรณ์ (สายต่อสู้บ่อย) หรือชุบเคลือบ
 if(['B','A'].includes(rank)&&['mission','dungeon','party'].includes(style)&&!EC.owned('hunter.gear_maint')&&m()>res*3){go('market');buySvc(E,h,'hunter.gear_maint')}
 if(['C','B'].includes(rank)&&style==='solo'&&!EC.owned('hunter.mana_coating')&&m()>8000+res){go('market');buySvc(E,h,'hunter.mana_coating')}
 // เทรนเนอร์: ครูฝึกส่วนตัว
 if(style==='trainer'&&rank!=='E'&&!EC.owned('hunter.private_coach')&&m()>res*2){go('gym');buySvc(E,h,'hunter.private_coach')}
 // บ้าน: ซื้อบ้านเมื่อมีเงินพอ แล้วต่อเติมตามสไตล์
 const age=P.get().age/12,home=E.life.get().home;
 if(age>=22&&home&&home.mode!=='own'&&m()>20000+res*2){go('city');try{E.life.moveIn('house','own')}catch(e){}}
 if(home&&home.mode==='own'){go('home');const order=style==='trainer'?['home_gym','home_meditation','home_clinic']:style==='worker'?['home_clinic','home_gym']:['home_clinic','home_meditation','home_gym'];
  for(const id of order){const x=EC.servicesHere().find(y=>y.id==='hunter.'+id);if(x&&x.ok&&m()-x.price>res*2){buySvc(E,h,x.id);break}}}
 // ชีวิตความเป็นอยู่
 if(age>=22){go('city');const mo=x=>(EC.servicesHere().find(y=>y.id===x)||{}).monthly||0;
  if(['C','B'].includes(rank)&&m()>mo('hunter.life_luxury')*30+res&&!EC.owned('hunter.life_luxury'))buySvc(E,h,'hunter.life_luxury');
  else if(!EC.owned('hunter.life_comfort')&&!EC.owned('hunter.life_luxury')&&m()>mo('hunter.life_comfort')*20+res)buySvc(E,h,'hunter.life_comfort')}
 // สนับสนุนกิลด์ตามสไตล์ (เปิดสัญญากิลด์)
 const gs={party:'northstar',solo:'ironfang',dungeon:'silverdragon',mission:'northstar'}[style];
 if(gs&&rank==='B'&&EC.standing('hunter.'+gs)<20&&m()>12000+res){go('association');buySvc(E,h,'hunter.sponsor_'+gs)}
 // ลงทุน: เงินส่วนเกิน (สายทำงานลงทุนมากสุด)
 const share={worker:0.5,trainer:0.1,mission:0.3,party:0.3,solo:0.2,dungeon:0.2}[style]||0.2,g=style==='solo'?'hunter.ironfang':style==='dungeon'?'hunter.silverdragon':'hunter.northstar';
 if(['C','B'].includes(rank)&&m()>res*4){go('association');const cap=EC.investCap(g)-EC.stake(g),amt=Math.min(cap,Math.floor((m()-res*4)*share));if(amt>500){try{EC.invest(g,amt)}catch(e){}}}
 // เงินสดต่ำกว่าเงินสำรอง: ยกเลิกแผนรายเดือนที่ไม่จำเป็นก่อน
 if(m()<res){for(const q of['hunter.life_luxury','hunter.private_coach','hunter.life_comfort','hunter.gear_maint'])if(EC.owned(q)){EC.cancel(q);break}}
 // เงินเหลือมาก: ทุกสไตล์ลงหลักสูตรของสมาคมเดือนละครั้ง (เงินยังมีความหมายหลังแรงก์ C)
 if(style!=='trainer'&&['C','B'].includes(rank)&&m()>res*5&&P.get().ap>0){go('association');buySvc(E,h,'hunter.assoc_program')}
 // ถ้าเงินสดเหลือน้อยเกินไป ถอนการลงทุนบางส่วน (ไม่มีวงจรหนี้)
 if(m()<res/2){for(const x of['hunter.northstar','hunter.ironfang','hunter.silverdragon'])if(EC.stake(x)>1000){go('association');try{EC.withdraw(x,Math.min(EC.stake(x),res))}catch(e){}break}}}
function styleMonth(E,style){E.__style=style;const h=helpers(E);if(!prep(E,h))return;const P=E.player;
 if(style==='party'){social(E,h)}
 if(style==='worker'){const cur=E.life.jobDef();for(const loc of['city','hospital','association','gym']){if(!P.canEnter(loc))continue;h.go(loc);const j=E.life.jobsHere().filter(x=>x.ok&&x.ap<=(cur&&cur.ap===2?2:1)&&!x.current).sort((a,b)=>b.salary-a.salary)[0];
   if(j&&(!cur||j.salary>E.life.salary()*1.15)){E.life.takeJob(j.id);break}}}
 if(style==='worker'&&E.life.get().home.mode==='family'&&P.get().age>=12*22&&P.get().money>6000){h.go('city');try{E.life.moveIn('apartment','rent')}catch(e){}}
 try{spend(E,h,style)}catch(e){E.__botErr=(E.__botErr||0)+1}
 // สอบเลื่อนแรงก์ก่อนเสมอถ้าเปิดแล้ว (ทุกสไตล์)
 if(P.get().ap>0&&P.canEnter('association')){h.go('association');const ex=E.missions.available().find(m=>m.ok&&m.id.includes('exam')&&m.chance>=0.5);if(ex){E.missions.start(ex.id,{acceptRisk:true});h.fight();h.answer()}}
 const mo=E.loop.month;let tries=0;while(P.get().ap>0&&P.get().alive&&tries++<6){let done=false;
  if(style==='trainer'&&P.get().ap===2)done=doTrain(E,h);
  else if(style==='dungeon')done=(mo%3===0&&doTower(E,h))||doDungeon(E,h)||doTower(E,h);
  else if(style==='solo'&&P.get().ap===2&&mo%2===0)done=doDungeon(E,h)||doTower(E,h);
  else if(style==='party'&&P.get().ap===2&&mo%4===0)done=doTower(E,h)||doDungeon(E,h);
  else if(P.get().ap===2&&mo%6===0)done=doTower(E,h);
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
