// ทดสอบ Core ด้วย Node (ไม่ต้องมีเบราว์เซอร์): node tests/core.test.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..');const ORDER=['ns','rng','bus','state','loop','worldtime','save','registry','assets','debug','engine'].map(n=>`src/core/${n}.js`).concat(['src/systems/worlds.js','src/systems/rules.js','src/systems/player.js','src/systems/ranks.js','src/systems/combat.js','src/systems/events.js','src/systems/missions.js','src/systems/npcs.js','src/systems/relations.js','src/systems/family.js','src/systems/health.js','src/systems/life.js','src/systems/gates.js','src/systems/party.js','src/systems/dungeon.js','src/systems/tower.js','src/systems/underground.js','data/shared/people.js','data/worlds/hunter/base.js','data/worlds/hunter/people.js','data/worlds/hunter/events_life.js','data/worlds/hunter/events_hunter.js','data/worlds/hunter/events_e2.js','data/worlds/hunter/events_people.js','data/worlds/hunter/actions.js','data/worlds/hunter/progression.js','data/worlds/hunter/adventure.js','data/worlds/hunter/tower_floors_11_20.js','data/worlds/hunter/underground.js','data/worlds/hunter/world.js','data/worlds/fantasy.js']);
const ctx={console,Date,Math,JSON,setInterval,clearInterval};ctx.globalThis=ctx;vm.createContext(ctx);
for(const f of ORDER)vm.runInContext(fs.readFileSync(path.join(R,f),'utf8'),ctx,{filename:f});
const C=ctx.AW.core;let pass=0,fail=0;const results=[];
function T(name,fn){try{fn();pass++;results.push('PASS '+name)}catch(e){fail++;results.push('FAIL '+name+' :: '+e.message)}}
const ok=(c,m)=>{if(!c)throw new Error(m||'assert')},throws=(fn,re)=>{try{fn()}catch(e){if(re&&!re.test(e.message))throw new Error('ผิดข้อความ: '+e.message);return}throw new Error('ควร throw')};
class Mem{constructor(){this.m=new Map()}get length(){return this.m.size}key(i){return[...this.m.keys()][i]}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const fakeTimer={setInterval:()=>1,clearInterval:()=>{}};
const mk=(st=new Mem())=>new C.Engine({storage:st,timer:fakeTimer});
// RNG
T('rng: seed เดียวกันได้ผลเดียวกัน',()=>{const a=new C.Rng('x'),b=new C.Rng('x');for(let i=0;i<100;i++)ok(a.next()===b.next())});
T('rng: เก็บ state แล้วต่อได้ตรง',()=>{const a=new C.Rng(5);a.next();const b=new C.Rng(a.state);ok(a.next()===b.next())});
T('rng: int อยู่ในช่วง',()=>{const a=new C.Rng(1);for(let i=0;i<1000;i++){const v=a.int(3,7);ok(v>=3&&v<=7)}});
// Bus
T('bus: เรียงตาม prio',()=>{const b=new C.Bus(),o=[];b.on('e',()=>o.push(1),{prio:0});b.on('e',()=>o.push(2),{prio:5});b.emit('e');ok(o.join()==='2,1')});
T('bus: ตัวรับ error ไม่หยุดตัวอื่น และแจ้ง bus:error',()=>{const b=new C.Bus();let got=0,err=null;b.on('bus:error',e=>err=e);b.on('e',()=>{throw new Error('x')},{owner:'bad'});b.on('e',()=>got++);b.emit('e');ok(got===1&&err&&err.owner==='bad')});
T('bus: off ใช้ได้',()=>{const b=new C.Bus();let n=0;const off=b.on('e',()=>n++);off();b.emit('e');ok(n===0)});
// State
T('state: slice ซ้ำถูกปฏิเสธ',()=>{const s=new C.GameState();s.register('a','x',()=>({}));throws(()=>s.register('a','y',()=>({})),/ซ้ำ/)});
T('state: ไม่ใช่เจ้าของเขียนไม่ได้',()=>{const s=new C.GameState();s.register('a','x',()=>({v:1}));throws(()=>s.mutate('y','a',d=>d.v=2),/เขียน/);ok(s.get('a').v===1)});
T('state: snapshot/restore คืนค่าตรง',()=>{const s=new C.GameState();s.register('a','x',()=>({v:1}));s.mutate('x','a',d=>d.v=9);const snap=s.snapshot();s.reset();ok(s.get('a').v===1);s.restore(snap);ok(s.get('a').v===9)});
T('state: restore ปฏิเสธเวอร์ชันไม่ตรง',()=>{const s=new C.GameState();throws(()=>s.restore({version:0,data:{}}),/เวอร์ชัน/)});
// Loop
T('loop: tick ส่งเหตุการณ์ครบ 3 ขั้นตามลำดับ',()=>{const E=mk(),o=[];['month:before','month','month:after'].forEach(e=>E.bus.on(e,()=>o.push(e)));E.loop.step(1);ok(o.join()==='month:before,month,month:after'&&E.loop.month===1)});
T('loop: หยุดได้หลายเหตุผล เดินต่อเมื่อหมดทุกเหตุผล',()=>{const E=mk();E.loop.pause('menu');E.loop.pause('event');ok(E.loop.step(3)===0);E.loop.resume('menu');ok(E.loop.step(1)===0);E.loop.resume('event');ok(E.loop.step(2)===2&&E.loop.month===2)});
T('loop: 1200 เดือน (100 ปี) ไม่มี error',()=>{const E=mk();E.loop.step(1200);ok(E.loop.month===1200&&E.debug.errors.length===0)});
// Save
T('save: เซฟแล้วโหลดคืนค่าเดือนและ seed',()=>{const st=new Mem(),E=mk(st);E.newGame({seed:'abc'});E.loop.step(37);E.saveTo(0);const F=mk(st);F.loadFrom(0);ok(F.loop.month===37&&F.state.get('meta').seed==='abc')});
T('save: rng ต่อจากจุดเซฟได้ตรง',()=>{const st=new Mem(),E=mk(st);E.newGame({seed:'r'});E.rng.next();E.saveTo(0);const want=E.rng.next();const F=mk(st);F.loadFrom(0);ok(F.rng.next()===want)});
T('save: ไม่แตะคีย์เกมเดิม',()=>{const st=new Mem();st.setItem('hunter-path-v5-s0','OLD');st.setItem('hunter-path-v5-meta','M');const E=mk(st);E.newGame();E.loop.step(5);E.saveTo(0);E.saveTo(1);ok(st.getItem('hunter-path-v5-s0')==='OLD'&&st.getItem('hunter-path-v5-meta')==='M');ok(E.save.legacyKeys().length===2)});
T('save: ห้ามเขียนคีย์เกมเดิมแม้สั่งตรง',()=>{const E=mk();throws(()=>E.save._set('hunter-path-v5-s0','x'),/ห้าม/)});
T('save: เขียนทับเก็บเวอร์ชันก่อนหน้า',()=>{const st=new Mem(),E=mk(st);E.newGame();E.loop.step(3);E.saveTo(0);E.loop.step(4);E.saveTo(0);const F=mk(st);F.loadFrom(0,{prev:true});ok(F.loop.month===3)});
T('save: checksum จับเซฟเสีย',()=>{const st=new Mem(),E=mk(st);E.newGame();E.saveTo(0);const k='mvh1:slot0',r=JSON.parse(st.getItem(k));r.body=r.body.replace('"month":0','"month":99');st.setItem(k,JSON.stringify(r));throws(()=>mk(st).loadFrom(0),/เสียหาย/)});
T('save: migration จากเวอร์ชัน 0',()=>{const st=new Mem();const body=JSON.stringify({version:0,data:{clock:{m:12}}});let s=0;for(let i=0;i<body.length;i++)s=(Math.imul(s,31)+body.charCodeAt(i))|0;
 st.setItem('mvh1:slot0',JSON.stringify({v:0,at:0,meta:{},sum:(s>>>0).toString(16),body}));
 const E=new C.Engine({storage:st,timer:fakeTimer,migrations:{0:x=>({version:1,data:{time:{month:x.data.clock.m}}})}});E.loadFrom(0);ok(E.loop.month===12)});
T('save: ไม่มี migration ต้องแจ้ง error ไม่เดา',()=>{const st=new Mem();const body=JSON.stringify({version:0,data:{}});let s=0;for(let i=0;i<body.length;i++)s=(Math.imul(s,31)+body.charCodeAt(i))|0;st.setItem('mvh1:slot0',JSON.stringify({v:0,at:1,sum:(s>>>0).toString(16),body}));throws(()=>mk(st).loadFrom(0),/migration/)});
T('save: export/import',()=>{const a=new Mem(),E=mk(a);E.newGame({seed:'q'});E.loop.step(8);E.saveTo(0);const txt=E.save.exportSlot(0);const b=new Mem(),F=mk(b);F.save.importSlot(2,txt);F.loadFrom(2);ok(F.loop.month===8)});
// Registry
T('registry: id ซ้ำถูกปฏิเสธ',()=>{const r=new C.Registry('world',['id','name']);r.add({id:'a',name:'A'});throws(()=>r.add({id:'a',name:'B'}),/ซ้ำ/)});
T('registry: ขาดฟิลด์/ id ผิดรูปแบบ ถูกปฏิเสธ',()=>{const r=new C.Registry('world',['id','name']);throws(()=>r.add({id:'b'}),/ขาด/);throws(()=>r.add({id:'Bad-ID',name:'x'}),/id/)});
T('registry: loadAll แยกของดีของเสีย (data loader)',()=>{const r=new C.Registry('thing',['id','name']);const res=r.loadAll([{id:'test_a',name:'A'},{id:'test_b',name:'B'},{id:'test_a',name:'dup'},{id:'x'}]);ok(res.ok.length===2&&res.bad.length===2)});
T('registry: ข้อมูลที่ลงทะเบียนแก้ไม่ได้ (freeze)',()=>{const r=new C.Registry('w',['id']);const d=r.add({id:'z',v:1});'use strict';try{d.v=2}catch(e){}ok(r.get('z').v===1)});
// Engine modules
T('engine: โมดูลต้องติดตั้งตาม deps',()=>{const E=mk();throws(()=>E.use({id:'story',deps:['world'],install(){}}),/ต้องการ/);E.use({id:'world',install(e){e.state.register('worlds','world',()=>({}))}});E.use({id:'story',deps:['world'],install(){}});ok(E.modules.size===2)});
T('engine: โมดูลเพิ่ม slice ใหม่ แล้วเซฟ/โหลดได้',()=>{const st=new Mem(),setup=()=>{const E=mk(st);E.use({id:'world',install(e){e.state.register('worlds','world',()=>({visited:[]}))}});return E};const E=setup();E.newGame();E.state.mutate('world','worlds',w=>w.visited.push('hunter'));E.saveTo(0);const F=setup();F.loadFrom(0);ok(F.state.get('worlds').visited[0]==='hunter')});
// Assets
T('assets: ไม่มีไฟล์ -> placeholder',()=>{const a=new C.AssetRegistry();a.register({id:'x.bg.a',kind:'bg',w:576,h:324});ok(a.status('x.bg.a')==='placeholder'&&a.get('x.bg.a').placeholder)});
T('assets: มีไฟล์แต่ไม่รู้สัญญาอนุญาต -> placeholder',()=>{const a=new C.AssetRegistry({imageFactory:s=>({src:s})});a.register({id:'x',kind:'bg',w:1,h:1,src:'a.png',license:null});ok(a.status('x')==='placeholder')});
T('assets: มีไฟล์ + สัญญายืนยัน -> ภาพจริง',()=>{const a=new C.AssetRegistry({imageFactory:s=>({src:s})});a.register({id:'x',kind:'bg',w:1,h:1,src:'a.png',license:'cc0'});ok(a.status('x')==='real'&&a.get('x').src==='a.png')});
T('assets: id ซ้ำถูกปฏิเสธ',()=>{const a=new C.AssetRegistry();a.register({id:'x',kind:'bg',w:1,h:1});throws(()=>a.register({id:'x',kind:'bg',w:1,h:1}),/ซ้ำ/)});
T('assets: manifest จริงโหลดได้ไม่มี id ซ้ำ',()=>{vm.runInContext(fs.readFileSync(path.join(R,'data/assets/manifest.js'),'utf8'),ctx);const a=new C.AssetRegistry();a.registerAll(ctx.AW.data.assets);const r=a.report();ok(r.placeholder===ctx.AW.data.assets.length&&r.real===0,'ทุกชิ้นยังเป็น placeholder');ok(Object.keys(r.byWorld).join()==='shared,hunter,fantasy,murim')});
// Debug
T('debug: error จากระบบอื่นถูกเก็บ',()=>{const E=mk();E.bus.on('month',()=>{throw new Error('boom')},{owner:'test'});E.loop.step(1);ok(E.debug.errors.length===1&&/boom/.test(E.debug.errors[0]))});

// ===== Phase 1.1: State ownership =====
const strictSet=fn=>{try{fn();return false}catch(e){return e&&e.name==='TypeError'}};
const mkS=()=>{const s=new C.GameState();s.register('p','own',()=>({hp:10,bag:[{id:'a',n:1}],stats:{str:{base:5}}}));return s};
T('state11: get() แก้ค่าชั้นบนไม่ได้',()=>{const s=mkS();ok(strictSet(()=>{'use strict';s.get('p').hp=999}));ok(s.get('p').hp===10)});
T('state11: get() แก้ nested object ไม่ได้',()=>{const s=mkS();ok(strictSet(()=>{'use strict';s.get('p').stats.str.base=99}));ok(s.get('p').stats.str.base===5)});
T('state11: get() แก้ array ไม่ได้ (push/แก้ช่อง/แก้ object ใน array)',()=>{const s=mkS();const b=s.get('p').bag;ok(strictSet(()=>b.push({id:'x'})));ok(strictSet(()=>{'use strict';b[0]={}}));ok(strictSet(()=>{'use strict';b[0].n=50}));ok(s.get('p').bag.length===1&&s.get('p').bag[0].n===1)});
T('state11: delete/เพิ่ม key ผ่าน get() ไม่ได้',()=>{const s=mkS();ok(strictSet(()=>{'use strict';delete s.get('p').hp}));ok(strictSet(()=>{'use strict';s.get('p').gold=1}));ok(s.get('p').hp===10&&!('gold' in s.get('p')))});
T('state11: sloppy mode แก้แล้วเงียบ แต่ค่าไม่เปลี่ยน',()=>{const s=mkS();vm.runInContext('x.get("p").hp=1;x.get("p").bag.length=0',Object.assign(ctx,{x:s}));ok(s.get('p').hp===10&&s.get('p').bag.length===1)});
T('state11: เจ้าของแก้ผ่าน mutate ได้ รวม nested',()=>{const s=mkS();s.mutate('own','p',d=>{d.hp=3;d.bag.push({id:'b',n:2});d.stats.str.base=7});const p=s.get('p');ok(p.hp===3&&p.bag.length===2&&p.stats.str.base===7)});
T('state11: ค่าที่ get ไปก่อน mutate ไม่เปลี่ยนตาม (snapshot ไม่รั่ว)',()=>{const s=mkS();const old=s.get('p');s.mutate('own','p',d=>{d.hp=1});ok(old.hp===10&&s.get('p').hp===1)});
T('state11: เก็บ draft ไว้แก้ทีหลัง mutate ไม่ได้',()=>{const s=mkS();let kept;s.mutate('own','p',d=>{kept=d});ok(strictSet(()=>{'use strict';kept.hp=0}));ok(s.get('p').hp===10)});
T('state11: ไม่ใช่เจ้าของ mutate nested ไม่ได้',()=>{const s=mkS();throws(()=>s.mutate('other','p',d=>{d.stats.str.base=1}),/เขียน/);ok(s.get('p').stats.str.base===5)});
T('state11: snapshot แก้แล้วไม่กระทบ state',()=>{const s=mkS();const sn=s.snapshot();sn.data.p.hp=0;sn.data.p.bag.length=0;ok(s.get('p').hp===10&&s.get('p').bag.length===1)});
T('state11: object ที่ init คืนมาแก้ทีหลังไม่กระทบ',()=>{const shared={v:1};const s=new C.GameState();s.register('a','x',()=>shared);shared.v=2;ok(s.get('a').v===1)});
T('state11: restore แล้วค่ายัง freeze',()=>{const s=mkS();const sn=s.snapshot();s.restore(sn);ok(Object.isFrozen(s.get('p').stats.str))});
T('state11: get เร็ว (100k ครั้ง < 50ms) ไม่ clone ตอนอ่าน',()=>{const s=mkS();const t=Date.now();for(let i=0;i<100000;i++)s.get('p');ok(Date.now()-t<50,'ช้าไป');ok(s.get('p')===s.get('p'))});
T('state11: engine ทั้งเกม: ไม่มีใครแก้ time ผ่าน get ได้',()=>{const E=mk();E.newGame({seed:'s'});E.loop.step(5);ok(strictSet(()=>{'use strict';E.state.get('time').month=0}));ok(E.loop.month===5)});
// ===== Phase 1.1: Save hardening =====
const sum=t=>C.saveChecksum(t);
const rec=(o={})=>{const body=o.body??JSON.stringify(o.snap??{version:1,data:{time:{month:7}}});return JSON.stringify(Object.assign({v:1,at:1,meta:{},sum:sum(body),body},o.rec||{}))};
const imp=(text,setup)=>{const st=new Mem();if(setup)setup(st);const E=mk(st);let err=null;try{E.save.importSlot(0,text)}catch(e){err=e.message}return{st,E,err}};
T('save11: import ที่ถูกต้องผ่าน และโหลดได้',()=>{const r=imp(rec());ok(!r.err,r.err);r.E.loadFrom(0);ok(r.E.loop.month===7)});
T('save11: import checksum ผิด ถูกปฏิเสธ ไม่เขียนอะไร',()=>{const r=imp(rec({rec:{sum:'dead'}}));ok(/checksum/.test(r.err));ok(r.st.m.size===0)});
T('save11: import ไม่ใช่ JSON',()=>{ok(/JSON/.test(imp('{oops').err))});
T('save11: import ไม่ใช่ข้อความ',()=>{ok(/ข้อความ/.test(imp({}).err))});
T('save11: import เป็น array/null/ตัวเลข',()=>{for(const t of['[]','null','42'])ok(imp(t).err,'ควรปฏิเสธ '+t)});
T('save11: ขาด version',()=>{ok(/version/.test(imp(rec({rec:{v:undefined}})).err))});
T('save11: ขาด body หรือ sum',()=>{const a=JSON.parse(rec());delete a.body;ok(/body/.test(imp(JSON.stringify(a)).err));const b=JSON.parse(rec());delete b.sum;ok(/checksum/.test(imp(JSON.stringify(b)).err))});
T('save11: at/meta ผิดชนิด',()=>{ok(/at\/meta/.test(imp(rec({rec:{at:'x'}})).err));ok(/at\/meta/.test(imp(rec({rec:{meta:null}})).err))});
T('save11: schema version ใหม่กว่าเกม ถูกปฏิเสธ',()=>{ok(/ใหม่กว่า/.test(imp(rec({rec:{v:99},snap:{version:99,data:{}}})).err))});
T('save11: version หัวไม่ตรงกับ body',()=>{ok(/ไม่ตรง/.test(imp(rec({snap:{version:0,data:{}}})).err))});
T('save11: body ไม่ใช่ JSON แต่ checksum ตรง',()=>{ok(/body/.test(imp(rec({body:'{bad'})).err))});
T('save11: slice ผิดชนิด ถูกปฏิเสธ',()=>{ok(/ผิดชนิด/.test(imp(rec({snap:{version:1,data:{time:[1,2]}}})).err));ok(/data/.test(imp(rec({snap:{version:1,data:'x'}})).err))});
T('save11: import ทับช่องเดิม สำรองของเดิมไว้ .preimport',()=>{const r=imp(rec(),st=>{const E=mk(st);E.newGame();E.loop.step(3);E.saveTo(0)});ok(!r.err,r.err);const bak=r.st.getItem('mvh1:slot0.preimport');ok(bak);ok(JSON.parse(JSON.parse(bak).body).data.time.month===3)});
T('save11: import ช่องว่างไม่สร้าง backup',()=>{const r=imp(rec());ok(r.st.getItem('mvh1:slot0.preimport')===null)});
T('save11: import ผิด ไม่แตะช่องเดิม',()=>{const r=imp('{bad',st=>{const E=mk(st);E.newGame();E.saveTo(0)});const before=r.st.getItem('mvh1:slot0');ok(before&&!r.st.getItem('mvh1:slot0.preimport'))});
T('save11: ชื่อช่องแปลก ๆ ถูกปฏิเสธ (กันเขียนคีย์อื่น)',()=>{const E=mk();for(const s of['../x','','a.b','A',' x','hunter-path-v5-s0'])throws(()=>E.save.key(s),/ช่องเซฟ/)});
T('save11: import ไม่แตะคีย์เกมเดิม',()=>{const r=imp(rec(),st=>{st.setItem('hunter-path-v5-s0','OLD');st.setItem('hunter-path-v5-meta','M')});ok(r.st.getItem('hunter-path-v5-s0')==='OLD'&&r.st.getItem('hunter-path-v5-meta')==='M')});
T('save11: _set ห้ามเขียนนอก prefix',()=>{const E=mk();throws(()=>E.save._set('other',''),/ห้าม/);throws(()=>E.save._set('hunter-path-v5-s0',''),/ห้าม/)});
T('save11: โหลดเซฟที่เสียใน storage ไม่ทำ state พัง',()=>{const st=new Mem();const E=mk(st);E.newGame();E.loop.step(4);st.setItem('mvh1:slot1',rec({snap:{version:1,data:{time:'x'}}}));throws(()=>E.loadFrom(1),/ผิดชนิด/);ok(E.loop.month===4)});
T('save11: list ไม่แสดง .preimport/.prev และบอกเซฟเสีย',()=>{const st=new Mem();st.setItem('mvh1:slot0',rec());st.setItem('mvh1:slot0.prev',rec());st.setItem('mvh1:slot0.preimport',rec());st.setItem('mvh1:slot1','{x');const l=mk(st).save.list();ok(l.length===2&&l.find(x=>x.key==='mvh1:slot1').broken)});
T('save11: เซฟ Phase 1 (ไม่มี slice worlds_time) ยังโหลดได้',()=>{const st=new Mem();st.setItem('mvh1:slot0',rec({snap:{version:1,data:{time:{month:9},meta:{seed:'a',rng:5,created:1,name:''}}}}));const E=mk(st);ok(E.loadFrom(0)&&E.loop.month===9&&E.time.current===null)});
// ===== Phase 1.1: Multiverse time =====
T('time11: rate 1/2/0.5 หลัง 10 tick',()=>{const E=mk();E.time.addWorld('earth',1);E.time.addWorld('fast',2);E.time.addWorld('slow',0.5);E.loop.step(10);ok(E.time.month('earth')===10&&E.time.month('fast')===20&&E.time.month('slow')===5)});
T('time11: เศษสะสมแม่นยำ (0.5 ต่อ tick)',()=>{const E=mk();E.time.addWorld('slow',0.5);E.loop.step(1);ok(E.time.month('slow')===0&&E.time.fraction('slow')===0.5);E.loop.step(1);ok(E.time.month('slow')===1&&E.time.fraction('slow')===0)});
T('time11: rate 0.1 ครบ 1,200 tick = 120 เดือนพอดี (ไม่มี float drift)',()=>{const E=mk();E.time.addWorld('t',0.1);E.time.addWorld('u',1.7);E.loop.step(1200);ok(E.time.month('t')===120&&E.time.fraction('t')===0);ok(E.time.month('u')===2040)});
T('time11: rate ผิดถูกปฏิเสธ',()=>{const E=mk();for(const r of[0,-1,NaN,'x',0.0001,1/3,1000])throws(()=>E.time.addWorld('w'+String(r).replace(/\W/g,''),r),/timeRate/)});
T('time11: โลกที่ไม่ได้อยู่ยังเดินเวลา',()=>{const E=mk();E.time.addWorld('a',1);E.time.addWorld('b',2);E.time.enter('a');E.loop.step(6);ok(E.time.current==='a'&&E.time.month('b')===12)});
T('time11: Gate ปกติ ไม่กินเวลา อายุ(global) ไม่เพิ่ม',()=>{const E=mk();E.time.addWorld('a',1);E.time.addWorld('b',2);E.time.enter('a');E.loop.step(5);const g=E.loop.month,b=E.time.month('b');E.time.travel('b');ok(E.loop.month===g&&E.time.month('b')===b&&E.time.current==='b')});
T('time11: เดินทางไปกลับหลายรอบ global ไม่เพิ่ม',()=>{const E=mk();E.time.addWorld('a',1);E.time.addWorld('b',0.5);E.time.enter('a');for(let i=0;i<50;i++)E.time.travel(i%2?'a':'b');ok(E.loop.month===0&&E.time.month('a')===0)});
T('time11: Gate พิเศษ 3 เดือน: global +3 ทุกโลกเดินตาม rate',()=>{const E=mk();E.time.addWorld('a',1);E.time.addWorld('b',2);E.time.enter('a');E.loop.step(2);E.time.travel('b',{months:3});ok(E.loop.month===5&&E.time.month('a')===5&&E.time.month('b')===10&&E.time.current==='b')});
T('time11: Gate พิเศษเดินได้แม้เกมหยุดด้วยเมนู',()=>{const E=mk();E.time.addWorld('a',1);E.time.addWorld('b',1);E.time.enter('a');E.loop.pause('menu');E.time.travel('b',{months:2});ok(E.loop.month===2&&E.loop.paused)});
T('time11: ระหว่างเดินทาง current=null มี traveling',()=>{const E=mk();E.time.addWorld('a',1);E.time.addWorld('b',1);E.time.enter('a');let seen=null;E.bus.on('month',()=>{seen=E.state.get('worlds_time').traveling});E.time.travel('b',{months:1});ok(seen&&seen.from==='a'&&seen.to==='b'&&E.time.current==='b')});
T('time11: เวลาเดินทางผิด/โลกไม่มี ถูกปฏิเสธ',()=>{const E=mk();E.time.addWorld('a',1);throws(()=>E.time.travel('a',{months:-1}),/เวลาเดินทาง/);throws(()=>E.time.travel('a',{months:1.5}),/เวลาเดินทาง/);throws(()=>E.time.travel('zz'),/ไม่มีโลก/)});
T('time11: world:month ยิงครบทุกเดือน (rate 2 = 2 ครั้งต่อ tick)',()=>{const E=mk();E.time.addWorld('f',2);const got=[];E.bus.on('world:month',e=>got.push(e.month));E.loop.step(3);ok(got.join()==='1,2,3,4,5,6')});
T('time11: เซฟ/โหลดเก็บเวลาแต่ละโลกและเศษ',()=>{const st=new Mem();const setup=()=>{const E=mk(st);E.time.addWorld('a',1);E.time.addWorld('s',0.5);return E};const E=setup();E.newGame();E.time.enter('a');E.loop.step(7);E.saveTo(0);const F=setup();F.loadFrom(0);ok(F.time.month('s')===3&&F.time.fraction('s')===0.5&&F.time.current==='a');F.loop.step(1);ok(F.time.month('s')===4)});
T('time11: ระบบอื่นแก้เวลาโลกไม่ได้',()=>{const E=mk();E.time.addWorld('a',1);throws(()=>E.state.mutate('story','worlds_time',t=>{t.acc.a=99999}),/เขียน/);ok(strictSet(()=>{'use strict';E.state.get('worlds_time').acc.a=5}))});


// ===== Phase 2: World System =====
const W=ctx.AW.systems;
if(!ctx.AW.data.assets.length)vm.runInContext(fs.readFileSync(path.join(R,'data/assets/manifest.js'),'utf8'),ctx);
const mkE=(st=new Mem())=>{const E=mk(st);E.assets.registerAll(ctx.AW.data.assets);E.use(W.WorldsModule);return E};
const mkG=(st)=>{const E=mkE(st);const r=E.worlds.registerAll(ctx.AW.data.worlds);if(r.bad.length)throw new Error(r.bad.join(' | '));E.newGame({seed:'w'});E.worlds.start('hunter');return E};
const wdef=(o={})=>Object.assign({id:'t1',name:'T',description:'d',timeRate:1,entry:'a',module:{},config:{},assetNs:'t1',storyNs:'t1',data:{locations:[{id:'a',name:'A'}]}},o);
T('world: ลงทะเบียนโลกจริง 2 โลกสำเร็จ',()=>{const E=mkG();ok(E.worlds.ids().join()==='hunter,fantasy'&&E.registries.world.has('fantasy')&&E.worlds.current==='hunter')});
T('world: ปฏิเสธ id ซ้ำ ไม่ติดตั้งซ้ำ',()=>{const E=mkE();E.worlds.register(wdef());throws(()=>E.worlds.register(wdef({name:'B'})),/ซ้ำ/);ok(E.worlds.ids().length===1)});
T('world: ปฏิเสธข้อมูลไม่ครบ (ทุกฟิลด์จำเป็น)',()=>{for(const f of['name','description','timeRate','entry','module','config','assetNs','storyNs']){const E=mkE(),d=wdef();delete d[f];throws(()=>E.worlds.register(d),/ไม่ถูกต้อง/);ok(!E.worlds.has('t1')&&!E.registries.world.has('t1'),f)}});
T('world: ปฏิเสธค่าผิด (rate, entry ไม่มี, ns, hook, state, asset นอก ns, id ซ้ำในข้อมูล)',()=>{const bad=[{timeRate:0},{timeRate:1/3},{entry:'zz'},{assetNs:'Bad'},{module:{fly(){}}},{module:{enter:1}},{state:{}},{state:()=>[]},
 {data:{locations:[{id:'a'}],assets:['hunter.bg.city_day']}},{data:{locations:[{id:'a'}],assets:['t1.bg.none']}},{data:{locations:[{id:'a'},{id:'a'}]}},{data:{locations:[{id:'a'}],gates:[{id:'g',to:'x',months:-1}]}},{data:{locations:'a'}},{id:'Bad'}];
 for(const b of bad){const E=mkE();throws(()=>E.worlds.register(wdef(b)),/ไม่ถูกต้อง/);ok(E.worlds.ids().length===0&&E.registries.world.all().length===0,JSON.stringify(b))}});
T('world: registerAll แยกของดีของเสีย',()=>{const E=mkE();const r=E.worlds.registerAll([wdef(),wdef({id:'t2',assetNs:'t2'}),wdef(),{}]);ok(r.ok.join()==='t1,t2'&&r.bad.length===2)});
T('world: แต่ละโลกมี slice ของตัวเอง โลกอื่นเขียนไม่ได้',()=>{const E=mkG();const h=E.worlds.ctx('hunter');throws(()=>E.state.mutate('world:hunter','world:fantasy',s=>{s.visits=99}),/เขียน/);ok(E.state.owner('world:fantasy')==='world:fantasy');ok(strictSet(()=>{'use strict';h.get().visits=5}))});
T('world: state สองโลกไม่ปะปน',()=>{const E=mkG();E.worlds.ctx('hunter').mutate(s=>{s.flags.x=1});const f=E.worlds.ctx('fantasy').get(),h=E.worlds.ctx('hunter').get();ok(!('x' in f.flags)&&h.flags.x===1&&!('gateAlerts' in f)&&!('season' in h))});
T('world: hook install/enter/leave/update/dispose ถูกเรียกตามลำดับ',()=>{const E=mkE(),log=[];const m={};for(const h of['install','enter','leave','update','dispose'])m[h]=(w,a)=>log.push(h+(a&&a.month?':'+a.month:''));
 E.worlds.register(wdef({module:m}));E.worlds.register(wdef({id:'t2',assetNs:'t2'}));E.newGame();E.worlds.start('t1');E.loop.step(2);E.worlds.travel('t2');E.worlds.dispose('t1');ok(log.join()==='install,enter,update:1,update:2,leave,dispose',log.join())});
T('world: hook error ไม่ทำให้ค้าง แจ้ง world:error',()=>{const E=mkE();let errs=0;E.bus.on('world:error',()=>errs++);E.worlds.register(wdef({module:{leave(){throw new Error('x')},update(){throw new Error('y')}}}));E.worlds.register(wdef({id:'t2',assetNs:'t2',module:{enter(){throw new Error('z')}}}));
 E.newGame();E.worlds.start('t1');E.loop.step(1);E.worlds.travel('t2');ok(errs===3&&E.worlds.current==='t2'&&!E.state.get('worlds_time').traveling)});
T('world: ไปและกลับ',()=>{const E=mkG();E.worlds.travelVia('rift_fantasy');ok(E.worlds.current==='fantasy');E.worlds.travelVia('rift_hunter');ok(E.worlds.current==='hunter'&&E.worlds.ctx('hunter').get().visits===2&&E.worlds.ctx('fantasy').get().visits===1)});
T('world: Gate ปกติ global ไม่เพิ่ม',()=>{const E=mkG();E.loop.step(4);E.worlds.travelVia('rift_fantasy');E.worlds.travelVia('rift_hunter');ok(E.loop.month===4)});
T('world: Gate พิเศษ global +3',()=>{const E=mkG();E.loop.step(4);E.worlds.travelVia('deep_rift_fantasy');ok(E.loop.month===7&&E.worlds.current==='fantasy')});
T('world: WorldTime แต่ละโลกถูกต้อง (1.0 / 0.5)',()=>{const E=mkG();E.loop.step(10);E.worlds.travelVia('deep_rift_fantasy');E.loop.step(5);ok(E.time.month('hunter')===18&&E.time.month('fantasy')===9);
 const h=E.worlds.ctx('hunter').get(),f=E.worlds.ctx('fantasy').get();ok(h.monthsLived===18&&f.monthsLived===9&&h.gateAlerts===3&&f.season===3,JSON.stringify([h,f]))});
T('world: เดินทางไปโลกที่ไม่มี ถูกปฏิเสธ ไม่เปลี่ยนอะไร',()=>{const E=mkG();const before=JSON.stringify(E.state.snapshot());throws(()=>E.worlds.travel('murim'),/ไม่มีโลก/);throws(()=>E.worlds.travelVia('nope'),/ไม่มี gate/);ok(JSON.stringify(E.state.snapshot())===before)});
T('world: ปฏิเสธเดินทางซ้อน / ไปโลกเดิม / เวลาผิด',()=>{const E=mkG();throws(()=>E.worlds.travel('hunter'),/แล้ว/);throws(()=>E.worlds.travel('fantasy',{months:-2}),/เวลาเดินทาง/);let inner=null;E.bus.on('month',()=>{if(!inner){try{E.worlds.travel('hunter')}catch(e){inner=e.message}}});E.worlds.travel('fantasy',{months:1});ok(/กำลังเดินทาง/.test(inner)&&E.worlds.current==='fantasy')});
T('world: error ระหว่างเดินทาง ไม่ค้างสถานะ กลับโลกต้นทาง',()=>{const E=mkG();let n=0,ab=null;const t=E.loop.tick.bind(E.loop);E.loop.tick=f=>{if(++n===2)throw new Error('boom');return t(f)};E.bus.on('gate:abort',e=>ab=e);
 throws(()=>E.worlds.travelVia('deep_rift_fantasy'),/boom/);const wt=E.state.get('worlds_time');ok(wt.traveling===null&&wt.current==='hunter'&&ab&&ab.elapsed===1&&E.loop.month===1);E.loop.tick=t;E.worlds.travelVia('rift_fantasy');ok(E.worlds.current==='fantasy')});
T('world: Save/Load คืนสถานะและเวลาทั้งสองโลก',()=>{const st=new Mem();const E=mkG(st);E.loop.step(7);E.worlds.travelVia('deep_rift_fantasy');E.loop.step(1);E.worlds.ctx('fantasy').mutate(s=>{s.flags.met_liora=true});E.saveTo(0);
 const F=mkE(st);F.worlds.registerAll(ctx.AW.data.worlds);F.newGame();F.loadFrom(0);const snapA=JSON.stringify(E.state.snapshot()),snapB=JSON.stringify(F.state.snapshot());ok(snapA===snapB,'snapshot ต่าง');
 ok(F.worlds.current==='fantasy'&&F.time.month('hunter')===11&&F.time.month('fantasy')===5&&F.time.fraction('fantasy')===0.5&&F.worlds.ctx('fantasy').get().flags.met_liora);F.loop.step(1);ok(F.time.month('fantasy')===6)});
T('world: เซฟ Phase 1.1 (ไม่มีข้อมูลโลก) โหลดได้ โลกเริ่มค่าเริ่มต้น',()=>{const st=new Mem();const old=mk(st);old.newGame();old.loop.step(9);old.saveTo(0);const F=mkE(st);F.worlds.registerAll(ctx.AW.data.worlds);ok(F.loadFrom(0)&&F.loop.month===9&&F.worlds.current===null&&F.worlds.ctx('hunter').get().visits===0&&F.time.month('hunter')===0)});
T('world: โลกในเซฟแต่ยังไม่ติดตั้ง ข้อมูลไม่หาย (เซฟต่อแล้วยังอยู่ ติดตั้งทีหลังได้คืน)',()=>{const st=new Mem();const E=mkG(st);E.loop.step(4);E.worlds.travelVia('rift_fantasy');E.worlds.ctx('fantasy').mutate(s=>{s.flags.k=1});E.saveTo(0);
 const F=mkE(st);F.worlds.register(ctx.AW.data.worlds[0]);F.loadFrom(0);ok(F.worlds.current==='fantasy'&&!F.worlds.has('fantasy'));F.loop.step(2);F.worlds.travel('hunter');F.saveTo(1);
 const G=mkE(st);G.worlds.registerAll(ctx.AW.data.worlds);G.loadFrom(1);ok(G.worlds.ctx('fantasy').get().flags.k===1&&G.time.month('fantasy')===2&&G.loop.month===6,'fantasy เวลาหยุดตอนไม่ได้ติดตั้ง')});
T('world: dispose แล้วเดินทางไปไม่ได้ เวลาโลกนั้นหยุด ข้อมูลยังอยู่',()=>{const E=mkG();E.worlds.dispose('fantasy');throws(()=>E.worlds.travel('fantasy'),/ไม่มีโลก/);E.loop.step(2);ok(E.state.get('world:fantasy').visits===0&&!E.time.has('fantasy'))});
T('world: newGame ล้างข้อมูลโลกกลับค่าเริ่มต้น',()=>{const E=mkG();E.worlds.travelVia('rift_fantasy');E.loop.step(3);E.newGame();ok(E.worlds.current===null&&E.worlds.ctx('fantasy').get().visits===0&&E.time.month('hunter')===0)});
T('world: ไม่มี global ร่วม: นิยามโลก freeze แก้ไม่ได้',()=>{const E=mkG();const d=E.registries.world.get('hunter');ok(strictSet(()=>{'use strict';d.data.locations.push({})}));ok(strictSet(()=>{'use strict';d.config.rules.ranks[0]='Z'}))});
T('world: ctx.asset อยู่ใน namespace ของโลก (placeholder)',()=>{const E=mkG();const img=E.worlds.ctx('hunter').asset('bg.city_day');ok(img&&img.placeholder)});


// ===== Phase 3 =====
const S=ctx.AW.systems;
const mkGP=(st=new Mem(),defs=ctx.AW.data.worlds)=>{const E=mk(st);E.assets.registerAll(ctx.AW.data.assets);S.installGameplay(E);const r=E.worlds.registerAll(defs);if(r.bad.length)throw new Error(r.bad.join(' | '));return E};
const play=(seed='p3',st)=>{const E=mkGP(st);E.newGame({seed});E.worlds.start('hunter');E.player.create({name:'ทดสอบ',stats:{str:10,agi:10,int:10,vit:10,cha:10,luk:10},money:100});return E};
const adv=(E,n)=>{for(let i=0;i<n;i++){clearEv(E);E.loop.tick(true)}clearEv(E)};
const clearEv=E=>{let g=0;while(E.events.pending()&&g++<20){const c=E.events.choices().find(x=>x.ok);E.events.answer(c.i)}};
// สร้างผู้เล่นที่ตื่นพลังแล้วโดยผ่านเหตุการณ์จริง
const awaken=(E,cls=0)=>{clearEv(E);E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*18-7});E.loop.tick(true);let g=0;while(E.events.pending()&&E.events.pending().id!=='hunter.awakening'&&g++<5)clearEv(E)||E.loop.tick(true);
 if(!E.player.get().class){ok(E.events.pending()&&E.events.pending().id==='hunter.awakening','awakening ไม่เกิด');E.events.answer(cls)}clearEv(E);return E};
const register=E=>{E.player.moveTo('association');ok(E.events.pending().id==='hunter.rank_evaluation');E.events.answer(0);ok(E.events.pending().id==='hunter.registration');if(!E.events.choices()[0].ok)E.state.mutate('player','player',p=>{p.money+=50});E.events.answer(0);clearEv(E);return E};
// --- Player ---
T('p3 player: เริ่มอายุ 15 ที่จุดเริ่มโลก',()=>{const E=play();const p=E.player.get();ok(p.age===180&&p.location.world==='hunter'&&p.location.loc==='home'&&p.created)});
T('p3 player: อายุตาม global ไม่ใช่ local (fantasy 0.5, gate พิเศษ +3)',()=>{const E=play();adv(E,10);E.worlds.travelVia('deep_rift_fantasy');adv(E,4);
 ok(E.player.get().age===180+17,'age '+E.player.get().age);ok(E.time.month('fantasy')===Math.floor(17/2)&&E.time.month('hunter')===17)});
T('p3 player: ข้อมูลกลางข้ามโลก เงิน/ของ/อุปกรณ์/แรงก์คงอยู่ ตำแหน่งเปลี่ยนเป็นโลกใหม่',()=>{const E=play();clearEv(E);E.player.addItem('hunter.iron_dagger');E.player.equip('hunter.iron_dagger');E.player.addMoney(500);E.player.setRank('hunter','E');
 const b=E.player.get();E.worlds.travelVia('rift_fantasy');const a=E.player.get();ok(a.money===b.money&&a.inventory['hunter.iron_dagger']===1&&a.equipment.weapon==='hunter.iron_dagger'&&a.ranks.hunter==='E');
 ok(a.location.world==='fantasy'&&a.location.loc==='eldran_gate');E.worlds.travelVia('rift_hunter');ok(E.player.get().location.loc==='home'&&E.player.itemName('hunter.iron_dagger')==='มีดสั้นเหล็ก')});
T('p3 player: ตำแหน่งที่ไม่มีอยู่ถูกปฏิเสธ',()=>{const E=play();clearEv(E);throws(()=>E.player.moveTo('nowhere'),/ไม่มีสถานที่/);throws(()=>E.player.setLocation('murim','x'),/ไม่มีสถานที่/);throws(()=>E.player.setLocation('fantasy','home'),/ไม่มีสถานที่/);ok(E.player.get().location.loc==='home')});
T('p3 player: สถานที่มีเงื่อนไข (สมาคมต้องตื่นพลัง)',()=>{const E=play();clearEv(E);throws(()=>E.player.moveTo('association'),/ยังเข้าไม่ได้/);E.player.moveTo('school');ok(E.player.get().location.loc==='school')});
T('p3 player: ระบบอื่นเขียน player ไม่ได้ อ่านแล้วแก้ไม่ได้',()=>{const E=play();throws(()=>E.state.mutate('events','player',p=>{p.money=1e9}),/เขียน/);ok(strictSet(()=>{'use strict';E.player.get().money=1e9}));ok(E.player.get().money===100)});
T('p3 player: เงินติดลบไม่ได้ ไอเทมไม่พอไม่ได้ ไอเทมไม่มีจริงไม่ได้',()=>{const E=play();throws(()=>E.player.addMoney(-101),/เงินไม่พอ/);throws(()=>E.player.removeItem('hunter.mana_stone'),/ไม่พอ/);throws(()=>E.player.addItem('hunter.nope'),/ไม่มีไอเทม/);ok(E.player.get().money===100)});
T('p3 player: ไม่ผูกกับโลกฮันเตอร์ (สร้างในโลก fantasy อย่างเดียวได้)',()=>{const E=mkGP(new Mem(),[ctx.AW.data.worlds[1]]);E.newGame();E.worlds.start('fantasy');E.player.create({name:'เอลฟ์'});ok(E.player.get().location.world==='fantasy'&&E.player.get().age===180);adv(E,3);ok(E.player.get().age===183)});
T('p3 player: เซฟ/โหลดผู้เล่น',()=>{const st=new Mem();const E=play('sv',st);clearEv(E);E.player.addMoney(77);E.player.moveTo('city');E.loop.step(3);clearEv(E);E.saveTo(0);const F=mkGP(st);F.loadFrom(0);
 ok(JSON.stringify(F.player.get())===JSON.stringify(E.player.get()))});
// --- Events ---
T('p3 event: intro ขึ้นทันทีหลังสร้างตัวละคร เวลาหยุดจนกว่าจะตอบ',()=>{const E=play();ok(E.events.pending().id==='hunter.intro'&&E.loop.paused);ok(E.loop.step(3)===0);const r=E.events.answer(0);ok(r.success&&r.effects.join().includes('ปัญญา')&&!E.loop.paused&&E.player.get().flags.path_study)});
T('p3 event: once ไม่เกิดซ้ำ',()=>{const E=play();clearEv(E);ok(!E.events.eligible('hunter.intro'));throws(()=>E.events.answer(0),/ไม่มีเหตุการณ์/)});
T('p3 event: เลือกตัวเลือกที่ล็อก/จ่ายไม่ไหวไม่ได้',()=>{const E=awaken(play());E.player.moveTo('association');E.events.answer(0);E.state.mutate('player','player',p=>{p.money=10});
 const cs=E.events.choices();ok(!cs[0].ok);throws(()=>E.events.answer(0),/ยังเลือก/);ok(E.events.pending().id==='hunter.registration')});
T('p3 event: check ใช้สูตรเดิม และโอกาสขึ้นกับค่าสถานะ',()=>{const E=play();clearEv(E);E.events.present('hunter.midterm');const lo=E.events.choices()[0].chance;E.player.addStats({int:30});const hi=E.events.choices()[0].chance;ok(hi>lo&&lo>=0.05&&hi<=0.97,lo+' '+hi)});
T('p3 event: กิจกรรมใช้ AP และหมด AP แล้วทำไม่ได้',()=>{const E=play();clearEv(E);E.player.moveTo('school');E.events.doAction('hunter.class');E.events.doAction('hunter.hangout');ok(E.player.get().ap===0);throws(()=>E.events.doAction('hunter.class'),/AP/);E.loop.step(1);clearEv(E);ok(E.player.get().ap===2)});
const tw=(o={})=>({id:'tw',name:'T',description:'',timeRate:1,entry:'a',module:{},config:{},assetNs:'tw',storyNs:'tw',data:Object.assign({locations:[{id:'a',name:'A'}],enemies:[{id:'dummy',name:'หุ่น',power:1}],
 events:[{id:'e1',title:'หนึ่ง',trigger:'action',at:'a',cost:{ap:0},text:'t',choices:[{text:'ต่อ',ok:{text:'ไป e2',effects:[{unlock:'e3'}]},next:'e2'}]},
  {id:'e2',title:'สอง',trigger:'month',text:'t',weight:0,choices:[{text:'จบ',ok:{text:'จบ',effects:[{money:5}]}}]},
  {id:'e3',title:'สาม',trigger:'action',at:'a',cost:{ap:0},locked:true,text:'t',choices:[{text:'ok',ok:{text:'ok',effects:[{flag:'e3'}]}}]}]},o)});
T('p3 event: ลำดับต่อเนื่อง (next) และปลดล็อก (unlock)',()=>{const E=mkGP(new Mem(),[tw()]);E.newGame();E.worlds.start('tw');E.player.create();ok(!E.events.eligible('tw.e3'));E.events.doAction('tw.e1');
 ok(E.events.pending().id==='tw.e2'&&E.loop.paused);E.events.answer(0);ok(!E.loop.paused&&E.player.get().money===5&&E.events.eligible('tw.e3'));E.events.doAction('tw.e3');ok(E.player.get().flags.e3)});
T('p3 event: ข้อมูลผิดถูกปฏิเสธตอนลงทะเบียน (atomic)',()=>{const bads=[
  {events:[{id:'x',title:'x',trigger:'month',text:'t',when:{evil:1},choices:[{text:'a',ok:{text:'a'}}]}]},
  {events:[{id:'x',title:'x',trigger:'month',text:'t',choices:[{text:'a',ok:{text:'a',effects:[{hack:1}]}}]}]},
  {events:[{id:'x',title:'x',trigger:'month',text:'t',choices:[{text:'a',check:{stat:'int',dc:'mid'},ok:{text:'a'}}]}]},
  {events:[{id:'x',title:'x',trigger:'month',text:'t',choices:[{text:'a',fight:{enemy:'ghost'},ok:{text:'a'},fail:{text:'b'}}]}]},
  {events:[{id:'x',title:'x',trigger:'month',text:'t',choices:[{text:'a',ok:{text:'a'},next:'nope'}]}]},
  {events:[{id:'x',title:'x',trigger:'enter',text:'t',choices:[{text:'a',ok:{text:'a'}}]}]},
  {events:[{id:'x',title:'x',trigger:'month',text:'t',choices:[]}]},
  {missions:[{id:'m',name:'m',enemy:'ghost'}]},
  {locations:[{id:'a',name:'A',when:{money:5}}]}];
 for(const b of bads){const E=mkGP(new Mem(),[]);throws(()=>E.worlds.register(tw(b)),/ไม่ถูกต้อง/);ok(!E.registries.world.has('tw')&&!E.state.slices.has('world:tw')&&!E.time.has('tw'),JSON.stringify(b))}});
T('p3 rules: เงื่อนไขครบทุกชนิดทำงาน',()=>{const E=awaken(play());register(E);const v=E.view('hunter'),C=S.Rules.check;
 ok(C({age:{min:18}},v)&&!C({age:{max:17}},v));ok(C({awakened:true},v));ok(C({rank:{min:'E'}},v)&&!C({rank:{min:'C'}},v)&&C({rank:{is:E.player.get().ranks.hunter}},v));
 ok(C({stat:{str:{min:1}}},v)&&C({statTotal:{min:10}},v)&&C({level:{min:1}},v)&&C({money:{min:0}},v));ok(C({item:{id:'hunter_license'}},v)&&!C({item:{id:'mana_stone'}},v));
 ok(C({location:'association'},v)&&C({world:'hunter'},v)&&C({worldFlag:'registered'},v)&&C({done:'awakening'},v)&&C({notDone:'reached_c'},v));
 ok(C({rel:{npc:'clerk_yoon',min:1}},v)&&C({missions:{tag:'rank_e',max:0}},v)&&C({injured:false},v)&&C({not:{flag:'zzz'}},v)&&C({any:[{flag:'zzz'},{awakened:true}]},v)&&!C({all:[{flag:'zzz'},{awakened:true}]},v));
 ok(S.Rules.validateCond({money:5}).length&&S.Rules.validateCond({foo:1}).length&&!S.Rules.validateCond({money:{min:5}}).length)});
// --- Hunter flow ---
T('p3 hunter: ตื่นพลังเกิดเองช่วงอายุ 17.5-18.5 ได้อาชีพ สกิล ค่าสถานะ',()=>{const E=play();clearEv(E);const before=E.player.get().stats.str;awaken(E,0);const p=E.player.get();ok(p.class==='hunter.sword'&&p.skills.includes('hunter.slash')&&p.stats.str>=before+5&&p.mana>=10)});
T('p3 hunter: ตื่นพลังไม่เกิดก่อนอายุ 17.5',()=>{const E=play();clearEv(E);for(let i=0;i<24;i++){E.loop.tick(true);clearEv(E)}ok(!E.player.get().class&&!E.events.get().done['hunter.awakening'])});
T('p3 hunter: ประเมินแรงก์และลงทะเบียน แล้วเข้าย่านเกตได้',()=>{const E=awaken(play());throws(()=>E.player.moveTo('gate_zone'),/ยังเข้าไม่ได้/);register(E);const p=E.player.get();
 ok(['E','D'].includes(p.ranks.hunter)&&E.worlds.ctx('hunter').get().flags.registered&&p.inventory['hunter.hunter_license']===1);E.player.moveTo('gate_zone');ok(E.player.get().location.loc==='gate_zone')});
T('p3 hunter: ประเมินซ้ำไม่ได้',()=>{const E=register(awaken(play()));throws(()=>E.ranks.init('hunter',E.view('hunter')),/ประเมินแรงก์ไปแล้ว/)});
T('p3 mission: ก่อนลงทะเบียนไม่มีภารกิจ หลังลงทะเบียนมี',()=>{const E=awaken(play());E.player.moveTo('city');ok(E.missions.available().length===0);register(E);ok(E.missions.available().some(m=>m.id==='hunter.sewer_slime'))});
T('p3 mission: ทำภารกิจใช้ AP ได้รางวัล นับ tag มีรายงาน',()=>{const E=register(awaken(play()));E.state.mutate('player','player',p=>{p.ranks.hunter='E'});const b=E.player.get();
 const r=E.missions.start('hunter.sewer_slime');ok(r.fight&&r.fight.lines.length>=3&&typeof r.win==='boolean');const a=E.player.get();ok(a.ap===b.ap-1);
 if(r.win)ok(a.money===b.money+60&&a.inventory['hunter.mana_stone']===1&&E.state.get('missions').byTag.rank_e===1);else ok(E.state.get('missions').byTag.rank_e===undefined)});
T('p3 mission: แพ้ไม่ได้รางวัล บาดเจ็บหนักรับงานไม่ได้',()=>{const E=register(awaken(play()));E.state.mutate('player','player',p=>{p.ranks.hunter='D'});E.player.moveTo('association');
 let r,g=0;do{E.state.mutate('player','player',p=>{p.ap=2;p.injury=0;p.hp=1;p.stats={str:0,agi:0,int:0,vit:0,cha:0,luk:0};p.mana=0;p.level=1});r=E.missions.start('hunter.werewolf_hunt')}while(r.win&&g++<20);
 ok(!r.win&&!E.state.get('missions').byTag.rank_d&&E.player.get().injury===3);ok(E.missions.available().every(m=>!m.ok&&/บาดเจ็บ/.test(m.why)));throws(()=>E.missions.start('hunter.sewer_slime'),/บาดเจ็บ/)});
T('p3 combat: resolve ไม่แตะ state, seed เดิมได้ผลเดิม, พลังโตตามอาวุธ',()=>{const E=register(awaken(play()));const snap=JSON.stringify(E.state.snapshot());E.rng=new C.Rng('x');const a=E.combat.resolve({worldId:'hunter',enemy:'goblins'});
 ok(JSON.stringify(E.state.snapshot())===snap);E.rng=new C.Rng('x');const b=E.combat.resolve({worldId:'hunter',enemy:'goblins'});ok(JSON.stringify(a)===JSON.stringify(b));
 E.state.mutate('player','player',p=>{p.ranks.hunter='D'});const p0=E.combat.profile('hunter').power;E.player.addItem('hunter.mana_blade_d');E.player.equip('hunter.mana_blade_d');ok(E.combat.profile('hunter').power===p0+30)});
T('p3 combat: โหมดใหม่ลงทะเบียนได้ ภารกิจใช้ได้โดยไม่แก้ Mission',()=>{const E=register(awaken(play()));let used=0;E.combat.register('test',(req)=>{used++;return Object.assign(S.autoResolve(req,E.rng),{mode:'test',win:true})});
 throws(()=>E.combat.register('auto',()=>{}),/ซ้ำ/);const rep=E.combat.resolve({worldId:'hunter',enemy:'goblins',mode:'test'});ok(used===1&&rep.mode==='test'&&rep.win);throws(()=>E.combat.resolve({worldId:'hunter',enemy:'goblins',mode:'none'}),/ไม่มีโหมด/)});
T('p3 rank: เลื่อนแรงก์ไม่ได้ถ้าไม่ผ่านเกณฑ์ แม้เวลาผ่าน 5 ปี',()=>{const E=register(awaken(play()));const r0=E.player.get().ranks.hunter;for(let i=0;i<60;i++){E.loop.tick(true);clearEv(E)}
 ok(E.player.get().ranks.hunter===r0&&!E.ranks.canPromote('hunter'));ok(!E.missions.available().some(m=>m.id.includes('exam')));ok(E.ranks.promote('hunter')===null)});
T('p3 rank: ผ่านเกณฑ์แล้วสอบได้ ชนะสอบจึงเลื่อน',()=>{const E=register(awaken(play()));E.state.mutate('player','player',p=>{p.ranks.hunter='E';p.level=6;p.stats.str+=80});E.state.mutate('missions','missions',m=>{m.byTag.rank_e=4});
 ok(E.ranks.canPromote('hunter')==='D'&&E.player.get().ranks.hunter==='E');E.player.moveTo('city');clearEv(E);E.player.moveTo('association');clearEv(E);ok(E.missions.available().some(m=>m.id==='hunter.exam_d'));
 let r,g=0;do{E.state.mutate('player','player',p=>{p.ap=2;p.injury=0;p.hp=999});r=E.missions.start('hunter.exam_d')}while(!r.win&&g++<20);ok(E.player.get().ranks.hunter==='D'&&r.effects.join().includes('แรงก์ D'))});
T('p3 rank: บอทเล่นจริงถึงแรงก์ C ได้ บอทไม่ทำอะไรไม่ได้แรงก์',()=>{const Sim=require('./sim.js'),cx=Sim.boot();const a=Sim.play(cx,'t1','active'),b=Sim.play(cx,'t2','idle',96);
 ok(a.rank==='C'&&a.age<26&&!a.errs.length,JSON.stringify([a.rank,a.age,a.errs]));ok(b.rank==='-'&&!b.errs.length)});
// --- Save compat ---
T('p3 save: เซฟจริงจาก Phase 2 โหลดได้ (migrate โลก + สร้างผู้เล่น)',()=>{const st=new Mem();st.setItem('mvh1:slot0',fs.readFileSync(path.join(__dirname,'fixtures/phase2_save.json'),'utf8'));const E=mkGP(st);ok(E.loadFrom(0));
 const h=E.worlds.ctx('hunter').get(),f=E.worlds.ctx('fantasy').get(),p=E.player.get();ok(!('location' in h)&&h._v===2&&h.visits===2&&f._v===2&&f.flags.met&&!('location' in f));
 ok(p.created&&p.age===180+E.loop.month&&p.location.world==='hunter'&&p.location.loc==='home'&&p.flags.fromOldSave);ok(E.time.month('fantasy')===E.time.month('fantasy')&&E.worlds.current==='hunter');
 E.loop.step(1);clearEv(E);E.saveTo(1);const F=mkGP(st);F.loadFrom(1);ok(JSON.stringify(F.state.snapshot())===JSON.stringify(E.state.snapshot()))});
T('p3 save: เซฟ Phase 1.1 (ไม่มีโลก) โหลดได้ ไม่สร้างผู้เล่นถ้ายังไม่มีโลกปัจจุบัน',()=>{const st=new Mem();const o=mk(st);o.newGame();o.loop.step(5);o.saveTo(0);const E=mkGP(st);ok(E.loadFrom(0)&&!E.player.get().created&&E.loop.month===5)});
T('p3 save: ตำแหน่งเสียในเซฟถูกซ่อมเป็นจุดเริ่ม',()=>{const st=new Mem();const E=play('x',st);clearEv(E);E.saveTo(0);const raw=JSON.parse(st.getItem('mvh1:slot0')),b=JSON.parse(raw.body);b.data.player.location.loc='gone';raw.body=JSON.stringify(b);raw.sum=C.saveChecksum(raw.body);st.setItem('mvh1:slot0',JSON.stringify(raw));
 const F=mkGP(st);F.loadFrom(0);ok(F.player.get().location.loc==='home')});
T('p3 save: เหตุการณ์ค้างในเซฟ โหลดแล้วยังค้างและเวลาหยุด',()=>{const st=new Mem();const E=play('pend',st);E.saveTo(0);const F=mkGP(st);F.loadFrom(0);ok(F.events.pending().id==='hunter.intro'&&F.loop.paused)});
// --- Atomic registration ---
T('p3 atomic: id ซ้ำใน registry ไม่สร้างอะไรเพิ่ม',()=>{const E=mkE();E.worlds.register(wdef());throws(()=>E.worlds.register(wdef()),/ซ้ำ/);ok(E.worlds.ids().length===1&&E.state.owner('world:t1')==='world:t1')});
T('p3 atomic: slice ชนกับเจ้าของอื่น ถอย registry และ WorldTime',()=>{const E=mkE();E.state.register('world:t1','someone',()=>({}));throws(()=>E.worlds.register(wdef()),/ติดตั้งไม่สำเร็จ/);ok(!E.registries.world.has('t1')&&!E.time.has('t1')&&E.state.owner('world:t1')==='someone'&&!E.worlds.has('t1'))});
T('p3 atomic: WorldTime ชน ถอย registry และ slice',()=>{const E=mkE();E.time.addWorld('t1',1);throws(()=>E.worlds.register(wdef()),/ติดตั้งไม่สำเร็จ/);ok(!E.registries.world.has('t1')&&!E.state.slices.has('world:t1')&&!E.worlds.has('t1'))});
T('p3 atomic: install hook throw ถอยทุกอย่าง ไม่มี world:installed',()=>{const E=mkE();let n=0,inst=0;E.bus.on('world:installed',()=>inst++);throws(()=>E.worlds.register(wdef({module:{install(){n++;throw new Error('boom')}}})),/boom/);
 ok(n===1&&inst===0&&!E.registries.world.has('t1')&&!E.state.slices.has('world:t1')&&!E.time.has('t1')&&!E.worlds.has('t1'));E.worlds.register(wdef());ok(E.worlds.has('t1'))});
T('p3 atomic: ล้มเหลวแล้วข้อมูล orphan จากเซฟไม่หาย',()=>{const st=new Mem();const A=mkE(st);A.worlds.register(wdef({state:()=>({k:0})}));A.newGame();A.worlds.ctx('t1').mutate(s=>{s.k=42});A.saveTo(0);
 const B=mkE(st);B.loadFrom(0);throws(()=>B.worlds.register(wdef({state:()=>({k:0}),module:{install(){throw new Error('x')}}})),/x/);ok(B.state.orphans['world:t1'].k===42);B.worlds.register(wdef({state:()=>({k:0})}));ok(B.worlds.ctx('t1').get().k===42)});
T('p3 atomic: ตัวตรวจเนื้อหาล้ม ไม่เรียก install',()=>{const E=mkGP(new Mem(),[]);let n=0;throws(()=>E.worlds.register(tw({events:[{id:'x',title:'x',trigger:'zzz',text:'t',choices:[{text:'a',ok:{text:'a'}}]}]})),/ไม่ถูกต้อง/);ok(n===0&&!E.registries.world.has('tw'))});


// ===== Phase 4 =====
const life=(seed='p4',st)=>{const E=play(seed,st);clearEv(E);return E};
const evs=E=>E.state.get('events');
const runTo=(E,fn,max=400)=>{for(let i=0;i<max;i++){if(fn())return true;clearEv(E);E.loop.tick(true)}return fn()};
// --- NPC ---
T('p4 npc: ฮาจุนเป็น NPC ธรรมดาจากข้อมูลโลก มีโลก ตำแหน่ง อายุ',()=>{const E=life();const h=E.npcs.get('hunter.best_friend');ok(h&&h.origin==='data'&&h.world==='hunter'&&E.worlds.ctx('hunter').locations.has(h.home)&&E.npcs.ageY(h.id)===15&&h.alive)});
T('p4 npc: id ซ้ำถูกปฏิเสธ',()=>{const E=life();throws(()=>E.npcs.add('hunter',{id:'best_friend',name:'x'}),/ซ้ำ/);E.npcs.add('hunter',{id:'new_guy',name:'ใหม่'});throws(()=>E.npcs.add('hunter',{id:'new_guy',name:'ซ้ำ'}),/ซ้ำ/)});
T('p4 npc: สุ่มด้วย seed เดียวกันได้คนเดียวกัน seed ต่างได้ต่าง',()=>{const a=life('same'),b=life('same'),c=life('other');const pick=E=>E.npcs.all('hunter').filter(n=>n.origin==='gen').map(n=>n.name+JSON.stringify(n.traits)+n.temper).join('|');ok(pick(a)===pick(b)&&pick(a)!==pick(c))});
T('p4 npc: นิยาม NPC ผิดทำให้ลงทะเบียนโลกไม่สำเร็จ (atomic)',()=>{for(const b of[{npcs:[{id:'n',name:'x',home:'nowhere'}]},{npcs:[{id:'n',name:'x',schedule:'none'}]},{npcs:[{id:'n',name:'x',rels:[{to:'ghost'}]}]},{npcs:[{id:'n',name:'x',traits:{evil:5}}]},{schedules:[{id:'s',entries:[{slot:'noon',at:'a'}]}]}]){
 const E=mkGP(new Mem(),[]);throws(()=>E.worlds.register(tw(b)),/ไม่ถูกต้อง/);ok(!E.registries.world.has('tw')&&!E.state.slices.has('world:tw'))}});
T('p4 npc: ตารางเวลา: วันทำงานไปโรงเรียน วันหยุดไม่ไป เย็นกลับบ้าน',()=>{const E=life();const k=(slot,dayType)=>({month:1,slot,dayType});ok(E.npcs.where('hunter.best_friend',k('morning','work'))==='school');ok(E.npcs.where('hunter.best_friend',k('morning','off'))==='city');ok(E.npcs.where('hunter.best_friend',k('night','work'))==='city')});
T('p4 npc: ช่วงเวลาตาม AP ของผู้เล่น และวันหยุดตามปฏิทินโลก',()=>{const E=life();ok(E.npcs.clock('hunter').dayType==='off');adv(E,1);ok(E.npcs.clock('hunter').dayType==='work'&&E.npcs.clock('hunter').slot==='morning');E.player.spendAp(1);ok(E.npcs.clock('hunter').slot==='day')});
T('p4 npc: เปลี่ยนที่ด้วย override และเปลี่ยนอาชีพ',()=>{const E=life();adv(E,1);E.npcs.setOverride('hunter.best_friend','hospital',2,'test');ok(E.npcs.where('hunter.best_friend')==='hospital');adv(E,3);ok(E.npcs.where('hunter.best_friend')!=='hospital');
 E.npcs.setJob('hunter.best_friend','doctor');ok(E.npcs.get('hunter.best_friend').work==='hospital'&&E.npcs.where('hunter.best_friend',{month:1,slot:'morning',dayType:'work'})==='hospital');throws(()=>E.npcs.setJob('hunter.best_friend','astronaut'),/ไม่มีอาชีพ/)});
T('p4 npc: ป่วยหนักอยู่บ้าน ตายแล้วไม่อยู่ที่ไหน',()=>{const E=life();E.npcs.setIll('hunter.clerk_yoon',{id:'flu',months:2,severity:2});ok(E.npcs.where('hunter.clerk_yoon',{month:1,slot:'morning',dayType:'work'})==='city');E.npcs.kill('hunter.clerk_yoon','ทดสอบ');const n=E.npcs.get('hunter.clerk_yoon');ok(!n.alive&&n.death.cause==='ทดสอบ'&&E.npcs.where(n)===null)});
T('p4 npc: อายุ NPC ใช้เวลาโลกของตัวเอง อายุผู้เล่นไม่เปลี่ยนตาม',()=>{const E=life();const f=E.npcs.add('fantasy',{id:'elf',name:'เอลฟ์',age:20});adv(E,24);ok(E.npcs.ageY('fantasy.elf')===21&&E.npcs.ageY('hunter.clerk_yoon')===28&&E.player.get().age===180+24)});
T('p4 npc: memory บันทึกและจำกัด 12 รายการ',()=>{const E=life();for(let i=0;i<15;i++)E.npcs.remember('hunter.best_friend','เรื่อง '+i);const m=E.npcs.get('hunter.best_friend').memory;ok(m.length===12&&m[0].t==='เรื่อง 14')});
T('p4 npc: จำลองแบบรวบ โลกที่ผู้เล่นไม่ได้อยู่ ทำทุก 12 เดือนท้องถิ่น',()=>{const E=life();E.npcs.add('fantasy',{id:'elf',name:'เอลฟ์'});let n=0;E.bus.on('state:changed',e=>{if(e.name==='npcs:fantasy')n++});adv(E,22);ok(n===0,'n '+n);adv(E,2);ok(n===1,'n '+n)});
// --- Relationships ---
T('p4 rel: ความสัมพันธ์สองทางไม่เท่ากัน',()=>{const E=life();E.rels.change('hunter.best_friend','player',{aff:50});ok(E.rels.edge('hunter.best_friend','player').aff>=50&&(E.rels.edge('player','hunter.best_friend')||{aff:0}).aff<50)});
T('p4 rel: ประเภทความสัมพันธ์ครบ',()=>{const E=life(),q='hunter.clerk_yoon',R=E.rels;const set=o=>{E.state.mutate('rels','rels',s=>{s.e[q+'>player']=R.blank(o)})};const t=o=>{set(o);return R.type(q,'player')};
 ok(t({})==='acquaintance'&&t({aff:30})==='friend'&&t({aff:60})==='close_friend'&&t({aff:85,fam:70})==='best_friend'&&t({aff:-30})==='rival'&&t({aff:-70})==='enemy'&&t({aff:40,romance:1})==='romantic'&&t({bond:'family'})==='family'&&t({bond:'spouse'})==='spouse')});
T('p4 rel: อ้าง NPC ที่ไม่มีถูกปฏิเสธ',()=>{const E=life();throws(()=>E.rels.change('hunter.ghost','player',{aff:5}),/ไม่มีตัวละคร/);throws(()=>E.rels.ensure('player','player'),/ตัวเอง/)});
T('p4 rel: NPC รู้จักกันเองตามที่ที่อยู่ร่วมกัน',()=>{const E=life();const before=Object.keys(E.state.get('rels').e).filter(k=>!k.includes('player')).length;adv(E,24);const after=Object.keys(E.state.get('rels').e).filter(k=>!k.includes('player')).length;ok(after>before,before+' '+after)});
T('p4 rel: คุยได้เดือนละครั้งต่อคน ของขวัญใช้เงิน',()=>{const E=life();E.rels.interact('hunter.best_friend','talk');throws(()=>E.rels.interact('hunter.best_friend','talk'),/เดือนนี้/);adv(E,1);const m=E.player.get().money;E.rels.interact('hunter.best_friend','gift');ok(E.player.get().money===m-30&&E.npcs.get('hunter.best_friend').memory.length===2)});
T('p4 rel: ไม่ใช่ทุกคนชอบผู้เล่น (ความประทับใจแรกติดลบได้)',()=>{const E=life();E.player.addKarma(-80);E.player.addTraits({kind:-80,loyal:-60});const imp=E.npcs.all('hunter').map(n=>E.rels.firstImpression(n.id));ok(imp.some(x=>x<0)&&imp.some(x=>x>imp[0]-100),imp.join())});
T('p4 rel: ตัดคู่ที่อ้าง NPC ที่ไม่มีตอนโหลด',()=>{const st=new Mem();const E=life('orph',st);E.saveTo(0);const raw=JSON.parse(st.getItem('mvh1:slot0')),b=JSON.parse(raw.body);b.data.rels.e['hunter.ghost>player']={aff:9};raw.body=JSON.stringify(b);raw.sum=C.saveChecksum(raw.body);st.setItem('mvh1:slot0',JSON.stringify(raw));
 const F=mkGP(st);F.loadFrom(0);ok(!F.rels.edge('hunter.ghost','player'))});
// --- Karma & traits ---
T('p4 karma/trait: ผลและเงื่อนไขทำงาน จำกัด -100..100',()=>{const E=life();const v=()=>E.view('hunter');S.Rules.apply([{karma:150},{trait:{brave:30}}],v());const p=E.player.get();ok(p.karma===100&&p.traits.brave===30);ok(S.Rules.check({karma:{min:90}},v())&&S.Rules.check({trait:{brave:{min:20}}},v())&&!S.Rules.check({trait:{kind:{min:1}}},v()));throws(()=>E.player.addTraits({evil:1}),/นิสัย/)});
T('p4 trait: นิสัยมีผลกับโอกาสสำเร็จของตัวเลือก',()=>{const E=life();E.player.moveTo('school');E.events.present('hunter.e2_election');const a=E.events.choices()[0].chance;E.player.addTraits({brave:80});const b=E.events.choices()[0].chance;ok(b>a,a+' '+b)});
T('p4 karma: NPC ใจดีชอบคนกรรมดี',()=>{const E=life(),q='hunter.teacher_park';const a=E.rels.firstImpression(q);E.player.addKarma(90);ok(E.rels.firstImpression(q)>a)});
// --- Life ---
T('p4 life: เริ่มอยู่บ้านครอบครัว ไม่เสียค่าใช้จ่าย',()=>{const E=life();ok(E.life.get().home.mode==='family');const m=E.player.get().money;adv(E,3);ok(E.player.get().money>=m||E.life.get().ledger[0].expense===0)});
T('p4 life: งานต้องผ่านเงื่อนไข ได้เงินเดือน ใช้ AP',()=>{const E=life();E.player.moveTo('city');throws(()=>E.life.takeJob('office'),/เงื่อนไข/);E.life.takeJob('conv_store');const m=E.player.get().money;adv(E,1);const L=E.life.get().ledger[0];ok(L.income===60&&E.player.get().ap===1,'income '+L.income)});
T('p4 life: ป่วยหนักไม่ได้เงินเดือน วันหยุดยาวได้เงินไม่ใช้ AP',()=>{const E=life();E.player.moveTo('city');E.life.takeJob('conv_store');adv(E,12);ok(E.life.get().ledger[0].income===60&&E.player.get().ap===2,'holiday');E.health.makeIll('flu');adv(E,1);ok(E.life.get().ledger[0].income===0)});
T('p4 life: ตื่นพลังแล้วยังทำงานธรรมดาได้',()=>{const E=awaken(play());E.player.moveTo('city');E.life.takeJob('ramen');adv(E,1);ok(E.life.get().job.id==='ramen'&&E.life.get().ledger[0].income>0)});
T('p4 life: เงินไม่พอจ่าย ไม่ติดลบ เป็นหนี้ค้าง ค้างนานถูกให้ออก',()=>{const E=life();E.state.mutate('player','player',p=>{p.age=12*20;p.bornAt=E.loop.month-240;p.money=200});E.player.moveTo('city');E.life.moveIn('apartment','rent');
 ok(E.player.get().money===50&&E.life.get().home.id==='apartment');for(let i=0;i<6&&E.life.get().home.mode==='rent';i++){adv(E,1);ok(E.player.get().money>=0)}ok(E.life.get().home.mode==='family'&&E.life.get().arrears===0)});
T('p4 life: ซื้อบ้านแล้วสถานะสังคมสูงขึ้น',()=>{const E=life();E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*25;p.age=300;p.money=30000});E.player.moveTo('city');const a=E.life.statusScore();E.life.moveIn('house','own');ok(E.life.statusScore()>a&&E.player.get().money===10000&&E.life.get().home.mode==='own')});
// --- Family ---
T('p4 family: มีพ่อแม่เป็น NPC พร้อมความสัมพันธ์แบบครอบครัว',()=>{const E=life();const f=E.family.get();ok(f.background&&E.family.members('mother').length===1&&E.family.members('father').length===1);const mom=E.family.members('mother')[0].npc;ok(E.rels.type(mom,'player')==='family'&&E.npcs.get(mom).alive&&E.npcs.ageY(mom)>=39)});
T('p4 family: แต่งงานต้องมีเงื่อนไข',()=>{const E=life();const q='hunter.clerk_yoon';ok(/อายุ/.test(E.family.canMarry(q)));E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*25;p.age=300});ok(/ใจ/.test(E.family.canMarry(q)));
 E.rels.change(q,'player',{aff:60,romance:1});ok(E.family.canMarry(q)==='');E.family.marry(q);ok(E.family.married()&&E.rels.type(q,'player')==='spouse');throws(()=>E.family.marry('hunter.teacher_park'),/แต่งงานแล้ว/)});
T('p4 family: ขอแต่งงานผ่านการกระทำ',()=>{const E=life();const q='hunter.clerk_yoon';E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*25;p.age=300;p.money=5000});E.rels.change(q,'player',{aff:90,trust:60,romance:3});
 let g=0;while(!E.family.married()&&g++<20){try{E.rels.interact(q,'propose')}catch(e){}adv(E,1)}ok(E.family.married()&&E.family.get().spouse===q)});
T('p4 family: มีลูกผ่านเหตุการณ์ที่มีเงื่อนไขเท่านั้น',()=>{const E=life();const q='hunter.clerk_yoon';E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*25;p.age=300});ok(/แต่งงาน/.test(E.family.canHaveChild()));
 E.rels.change(q,'player',{aff:60,romance:1});E.family.marry(q);ok(/เพิ่ง/.test(E.family.canHaveChild()));ok(runTo(E,()=>E.family.children().length>0,200));const c=E.family.children()[0].npc;ok(E.npcs.get(c).alive&&E.family.get().lineage.children[0].npc===c&&E.rels.type(c,'player')==='family')});
T('p4 family: ญาติเสียชีวิต มีงานศพ (ครั้งเดียวต่อคน) และประวัติครอบครัว',()=>{const E=life();const dad=E.family.members('father')[0].npc;E.npcs.kill(dad,'ทดสอบ');ok(E.family.get().history[0].t.includes('จากไป'));adv(E,1);ok(evs(E).done['hunter.kin_funeral@'+dad]===1);adv(E,2);ok(evs(E).done['hunter.kin_funeral']===1)});
// --- Health & death ---
T('p4 health: ป่วยหนัก AP ลด รับภารกิจไม่ได้ รักษาแล้วหายเร็วขึ้น',()=>{const E=register(awaken(play()));E.health.makeIll('flu');adv(E,1);ok(E.player.get().ap===1);ok(E.missions.available().every(m=>!m.ok));
 E.state.mutate('player','player',p=>{p.money=500});E.player.moveTo('hospital');clearEv(E);E.events.doAction('hunter.treat');ok(E.health.get().ill===null||E.health.get().ill.treated);adv(E,2);ok(E.health.get().ill===null)});
T('p4 health: โรคร้ายไม่รักษาอาจเสียชีวิต อายุมากเสียชีวิตตามธรรมชาติ',()=>{const E=life();E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*85;p.age=1020});ok(runTo(E,()=>!E.player.get().alive,600));ok(E.player.get().death.cause)});
T('p4 death: ตายแล้วหยุดทุกอย่าง บันทึกประวัติชีวิต ไม่ลบข้อมูล',()=>{const E=register(awaken(play()));E.player.addItem('hunter.mana_stone',2);const money=E.player.get().money;const rec=E.health.die('ทดสอบ');
 ok(rec&&E.health.get().lives.length===1&&rec.assets.money===money&&rec.assets.items['hunter.mana_stone']===2&&rec.family.members.length>=2&&rec.cause==='ทดสอบ');
 ok(E.loop.paused&&E.loop.reasons.has('dead')&&E.loop.step(1)===0);ok(!E.events._active()&&E.missions.available().every(m=>!m.ok));throws(()=>E.player.moveTo('city'),/เสียชีวิต/);ok(E.player.get().money===money&&E.npcs.all('hunter').length>10);ok(E.health.die('ซ้ำ')===null)});
T('p4 death: เซฟ/โหลดหลังตายได้ ยังตายและเวลาหยุด',()=>{const st=new Mem();const E=life('dead',st);E.health.die('ทดสอบ');E.saveTo(0);const F=mkGP(st);ok(F.loadFrom(0));ok(!F.player.get().alive&&F.loop.reasons.has('dead')&&F.health.get().lives.length===1)});
// --- Gates ---
T('p4 gate: ไม่ค้นพบก็ไปไม่ได้ (Debug ยังไปได้)',()=>{const E=register(awaken(play()));ok(E.gates.status('hunter.rift_fantasy')==='hidden'&&E.gates.list().length===0);throws(()=>E.gates.travel('hunter.rift_fantasy'),/ไม่มี gate/);E.worlds.travelVia('rift_fantasy');ok(E.worlds.current==='fantasy')});
T('p4 gate: ค้นพบ -> เหตุการณ์เปิด -> เดินทางได้ -> กลับได้',()=>{const E=register(awaken(play()));E.state.mutate('player','player',p=>{p.ranks.hunter='D'});E.player.moveTo('gate_zone');ok(E.gates.status('hunter.rift_fantasy')==='known');
 ok(E.events.pending()&&E.events.pending().id==='hunter.blue_rift_open');E.state.mutate('player','player',p=>{p.money=1000});E.events.answer(1);ok(E.gates.status('hunter.rift_fantasy')==='open');clearEv(E);
 const g=E.loop.month;E.gates.travel('hunter.rift_fantasy');ok(E.worlds.current==='fantasy'&&E.loop.month===g&&E.player.get().location.world==='fantasy');E.gates.travel('fantasy.rift_hunter');ok(E.worlds.current==='hunter')});
T('p4 gate: Gate พิเศษมีค่าใช้จ่าย และเงื่อนไข',()=>{const E=register(awaken(play()));E.state.mutate('player','player',p=>{p.ranks.hunter='C';p.money=2000});E.gates.open('hunter.rift_fantasy');E.player.moveTo('gate_zone');clearEv(E);ok(E.gates.status('hunter.deep_rift_fantasy')==='known');
 E.gates.open('hunter.deep_rift_fantasy');ok(/หินมานา/.test(E.gates.list().find(x=>x.id==='hunter.deep_rift_fantasy').why));E.player.addItem('hunter.mana_stone',4);const g=E.loop.month;E.gates.travel('hunter.deep_rift_fantasy');
 ok(E.worlds.current==='fantasy'&&E.loop.month===g+3&&E.player.get().inventory['hunter.mana_stone']===1&&E.player.get().money<=1500)});
// --- events2 migration ---
T('p4 e2: ย้าย 34 เหตุการณ์ 22 เรื่องสั้น 4 เรื่องต่อเนื่อง ทุกอันมี src',()=>{const ev=ctx.AW.data.worlds[0].data.events;const e2=ev.filter(e=>/^e2_/.test(e.id)),p=ev.filter(e=>/^e2p_/.test(e.id));ok(e2.length===44&&p.length===22,e2.length+' '+p.length);ok(ev.every(e=>typeof e.src==='string'&&e.src.length>0))});
T('p4 e2: เรื่องสั้น (passive) ไม่หยุดเวลา ลงบันทึก',()=>{const E=life();let n=0;E.bus.on('event:passive',()=>n++);adv(E,30);ok(n>0&&evs(E).log.length>0)});
T('p4 e2: เหตุการณ์ที่ต้องมีพี่น้อง เกิดเฉพาะเมื่อมีพี่น้อง',()=>{const E=life();E.player.moveTo('home');const has=E.family.members('sibling').length>0;ok(!!E.events.pickWho('hunter.e2_sibling_sick')===has);
 if(has){E.events.present('hunter.e2_sibling_sick');ok(E.events.pending().who===E.family.members('sibling')[0].npc)}});
T('p4 e2: เรื่องต่อเนื่องเหรียญชายชรา',()=>{const E=life();E.events.present('hunter.e2_old_man');E.events.answer(0);ok(E.player.get().flags.coin_old);awaken(E);register(E);ok(E.events.eligible('hunter.e2_oldman_coin'))});
T('p4 e2: ฮาจุนตื่นพลังหรือไม่ คงที่ตาม seed และเลือกเหตุการณ์ทวงสัญญาถูกแบบ',()=>{const a=life('bfA'),b=life('bfA');ok(!!a.npcs.get('hunter.best_friend').flags.hunter===!!b.npcs.get('hunter.best_friend').flags.hunter);
 const E=register(awaken(life('bfB')));E.player.setFlag('promise_bf',true);E.state.mutate('player','player',p=>{p.ranks.hunter='D'});const isH=!!E.npcs.get('hunter.best_friend').flags.hunter;ok(E.events.eligible('hunter.e2_bf_promise2_hunter')===isH&&E.events.eligible('hunter.e2_bf_promise2_maker')===!isH)});
// --- Save compat ---
T('p4 save: เซฟจริง Phase 3 โหลดได้ ความสัมพันธ์ย้ายมา มีครอบครัว ไม่สร้าง NPC ซ้ำ',()=>{const st=new Mem();st.setItem('mvh1:slot0',fs.readFileSync(path.join(__dirname,'fixtures/phase3_save.json'),'utf8'));const E=mkGP(st);ok(E.loadFrom(0));const p=E.player.get();
 ok(p._v===3&&!('relations' in p)&&p.karma===0&&p.alive&&p.money===2800);ok(E.rels.edge('hunter.best_friend','player').aff===67&&E.rels.type('hunter.best_friend','player')==='close_friend');ok(E.family.get().members.length>=2&&E.life.get().home.mode==='family');
 const n=E.npcs.all('hunter').length;E.saveTo(1);const F=mkGP(st);F.loadFrom(1);F.loadFrom(1);ok(F.npcs.all('hunter').length===n&&JSON.stringify(F.state.snapshot())===JSON.stringify(E.state.snapshot()))});
T('p4 save: เซฟจริง Phase 2 ยังโหลดได้',()=>{const st=new Mem();st.setItem('mvh1:slot0',fs.readFileSync(path.join(__dirname,'fixtures/phase2_save.json'),'utf8'));const E=mkGP(st);ok(E.loadFrom(0));ok(E.player.get().created&&E.player.get()._v===3&&E.family.get().members.length>=2&&E.npcs.exists('hunter.best_friend'))});
T('p4 save: ทุกระบบใหม่ เซฟ/โหลด ตรงทุกไบต์ และมี stateVersion',()=>{const st=new Mem();const E=register(awaken(life('all',st)));E.rels.interact('hunter.clerk_yoon','talk');E.health.makeIll('cold');E.player.moveTo('city');E.life.takeJob('ramen');adv(E,5);E.saveTo(0);const F=mkGP(st);F.loadFrom(0);
 ok(JSON.stringify(F.state.snapshot())===JSON.stringify(E.state.snapshot()));for(const k of['npcs:hunter','rels','family','health','life','gates','player'])ok(F.state.get(k)._v>=1,k)});
T('p4 perf: NPC 500 คน จำลอง 1 เดือนเร็วพอ (< 150ms)',()=>{const E=life('perf');for(let i=0;i<480;i++)E.npcs.generate('hunter',{occupation:['student','teacher','shopkeeper','npc_hunter'][i%4]});const t=Date.now();adv(E,3);const ms=(Date.now()-t)/3;ok(ms<150,'ms '+ms);ok(E.npcs.all('hunter').length>=500)});


// ===== Phase 5 =====
const hunterAt=(rank='C',seed='p5',o={})=>{const E=register(awaken(play(seed)));E.state.mutate('player','player',p=>{p.ranks.hunter=rank;p.level=o.level||14;p.stats.str+=o.str??60;p.stats.vit+=30;p.money=o.money??20000;p.mana+=20});E.player.addHp(9999);clearEv(E);return E};
const fightOut=(E,pick)=>{let g=0;while(E.combat.session()&&E.combat.session().status==='active'&&g++<80)E.combat.act(pick(E.combat.session(),E.combat.options().filter(o=>!o.why)));return E.combat.session()};
const atkOnly=()=>({type:'attack'});
// --- Combat: auto ---
T('p5 auto: seed เดิมได้ผลเดิม ไม่แตะ state และมีผลถอนตัว',()=>{const E=hunterAt('D');const snap=JSON.stringify(E.state.snapshot());const outs=new Set();
 for(let i=0;i<60;i++){E.rng=new C.Rng('a'+i);outs.add(E.combat.resolve({worldId:'hunter',enemy:'wolf_w'}).outcome)}ok(JSON.stringify(E.state.snapshot())===snap);ok(outs.has('win')&&outs.has('retreat'),[...outs].join());
 E.rng=new C.Rng('x');const a=E.combat.resolve({worldId:'hunter',enemy:'wolf_w'});E.rng=new C.Rng('x');ok(JSON.stringify(a)===JSON.stringify(E.combat.resolve({worldId:'hunter',enemy:'wolf_w'})))});
T('p5 auto: ภารกิจทั่วไปไม่มีวันตาย (300 ครั้งกับศัตรูแรงมาก) · high = Critical ไม่ตาย',()=>{const E=hunterAt('E','dd',{str:0});for(let i=0;i<300;i++){const r=E.combat.fight({worldId:'hunter',enemy:'frost_naga'});ok(!r.dead);E.player.addHp(999);E.state.mutate('player','player',p=>{p.injury=0})}
 ok(E.player.get().alive);const r=E.combat.fight({worldId:'hunter',enemy:'frost_naga',risk:'high'});ok(E.player.get().alive&&(r.outcome==='win'||r.critical||r.outcome==='retreat'))});
T('p5 auto: ทีมเพิ่มพลังรวม',()=>{const E=hunterAt('C');const a=E.combat.profile('hunter');E.npcs.setFlag('hunter.rival_hunter','party');E.party.invite('hunter.rival_hunter');const b=E.combat.profile('hunter');ok(b.partyPower>0&&a.partyPower===0&&b.party.length===1)});
// --- Combat: manual ---
T('p5 manual: ต้องยอมรับความเสี่ยงก่อน (high/lethal)',()=>{const E=hunterAt();throws(()=>E.combat.start({worldId:'hunter',foes:[{enemy:'red_ogre'}],risk:'high'}),/ยอมรับความเสี่ยง/);throws(()=>E.combat.start({worldId:'hunter',foes:[{enemy:'red_ogre'}],risk:'lethal'}),/ยอมรับความเสี่ยง/);
 E.combat.start({worldId:'hunter',foes:[{enemy:'red_ogre'}],risk:'high',acceptRisk:true});ok(E.combat.session().status==='active'&&E.loop.reasons.has('combat'))});
T('p5 manual: สกิลใช้ MP และติดคูลดาวน์',()=>{const E=hunterAt();E.combat.start({worldId:'hunter',foes:[{enemy:'red_ogre'}]});const s0=E.combat.session(),sk=s0.skills[0];E.combat.act({type:'skill',id:sk.id});const s1=E.combat.session();
 ok(s1.me.mp===Math.min(s1.me.maxMp,s0.me.mp-sk.mp+2));ok(/คูลดาวน์/.test(E.combat.options().find(o=>o.id===sk.id).why));throws(()=>E.combat.act({type:'skill',id:sk.id}),/คูลดาวน์/);
 E.state.mutate('combat','combat',x=>{x.session.me.mp=0;x.session.me.cd={}});ok(/MP/.test(E.combat.options().find(o=>o.id===sk.id).why))});
T('p5 manual: seed + การกระทำเดิม = ผลเดิม',()=>{const run=()=>{const E=hunterAt();E.combat.start({worldId:'hunter',foes:[{enemy:'red_ogre'}],seed:'fixed'});return fightOut(E,atkOnly).log.join('|')};ok(run()===run())});
T('p5 manual: ไม่แตะผู้เล่นจนกว่าจะ claim และ claim ได้ครั้งเดียว',()=>{const E=hunterAt();const hp=E.player.get().hp;E.combat.start({worldId:'hunter',foes:[{enemy:'red_ogre'}],seed:'c1'});const s=fightOut(E,atkOnly);
 ok(s.status!=='active'&&E.player.get().hp===hp);const rep=E.combat.claim(s.id);ok(E.player.get().hp===rep.hpAfter||E.player.get().hp===Math.min(E.player.maxHp(),rep.hpAfter));throws(()=>E.combat.claim(s.id),/ไปแล้ว|ยังไม่มี/);ok(E.combat.get().claimed.includes(s.id))});
T('p5 manual: รูปแบบศัตรูต่างกัน (โจมตีหนัก ตั้งการ์ด คลั่ง) อยู่ในรายงาน',()=>{const E=hunterAt('C','pat',{str:200});E.combat.start({worldId:'hunter',foes:[{enemy:'goblin_king'}],seed:'p'});const log=fightOut(E,()=>({type:'defend'})).log.join('|');ok(/โจมตีหนัก/.test(log)&&/ตั้งการ์ด/.test(log),log.slice(0,300))});
T('p5 manual: ถอนตัวได้',()=>{const E=hunterAt();E.combat.start({worldId:'hunter',foes:[{enemy:'wolf_lord'}],seed:'r'});const s=fightOut(E,()=>({type:'retreat'}));ok(s.status==='retreat'||s.status==='lose')});
T('p5 manual: นโยบายความตาย normal=แพ้ high=วิกฤต lethal=วิกฤตก่อน ล้มซ้ำจึงตาย',()=>{const weak=r=>{const E=hunterAt('E','dp'+r,{str:0,level:1});E.combat.start({worldId:'hunter',foes:[{enemy:'frost_naga',mult:2}],risk:r,acceptRisk:true,seed:r});const s=fightOut(E,()=>({type:'defend'}));const rep=E.combat.claim(s.id);return{E,s,rep}};
 const n=weak('normal');ok(n.s.status==='lose'&&n.E.player.get().alive&&n.E.player.get().injury===3);
 const h=weak('high');ok(h.s.status==='critical'&&h.E.player.get().alive&&h.E.health.get().ill.id==='critical');
 const l=weak('lethal');ok(l.s.status==='dead'&&l.s.log.some(x=>/Critical/.test(x))&&!l.E.player.get().alive&&l.E.health.get().lives.length===1)});
T('p5 manual: ขอความช่วยเหลือใช้ได้ครั้งเดียว',()=>{const E=hunterAt();E.combat.start({worldId:'hunter',foes:[{enemy:'wolf_lord'}],help:{name:'ทีมช่วย',damage:0.3}});const f0=E.combat.session().foes[0].hp;E.combat.act({type:'help'});ok(E.combat.session().foes[0].hp<f0);ok(!E.combat.options().some(o=>o.type==='help'))});
T('p5 manual: synergy สกิลกับบทบาทในทีม',()=>{const E=hunterAt();E.party.invite!==undefined;E.npcs.setFlag('hunter.master_kang','party');E.party.invite('hunter.master_kang');ok(E.party.get().members[0].role==='tank');
 E.combat.start({worldId:'hunter',foes:[{enemy:'red_ogre'}]});E.combat.act({type:'skill',id:'hunter.slash'});ok(E.combat.session().log.some(x=>/ประสาน/.test(x)))});
T('p5 manual: เซฟกลางศึกแล้วโหลด ต่อได้ผลเหมือนไม่ได้เซฟ',()=>{const st=new Mem();const mkf=()=>{const E=hunterAt('C','mid');E.save.st=st;return E};const A=mkf();A.combat.start({worldId:'hunter',foes:[{enemy:'red_ogre'}],seed:'m'});A.combat.act({type:'attack'});A.combat.act({type:'attack'});A.saveTo(3);
 const a=fightOut(A,atkOnly).log.join('|');const B=mkGP(st);B.loadFrom(3);ok(B.loop.reasons.has('combat'));const b=fightOut(B,atkOnly).log.join('|');ok(a===b)});
// --- Missions with modes ---
T('p5 mission: ภารกิจไม่ผูกโหมด manual จบแล้วได้รางวัลครั้งเดียว ถอนตัวไม่ได้รางวัล',()=>{const E=hunterAt('C','mm',{str:150});E.player.moveTo('gate_zone');clearEv(E);throws(()=>E.missions.start('hunter.red_gate_boss'),/ยอมรับความเสี่ยง/);
 const m0=E.player.get().money;const r=E.missions.start('hunter.red_gate_boss',{acceptRisk:true});ok(r.pending&&E.missions.get().pending);fightOut(E,atkOnly);const L=E.missions.get().last;
 ok(!E.missions.get().pending&&L&&L.id==='hunter.red_gate_boss');if(L.outcome==='win')ok(E.player.get().money>m0&&E.missions.get().byTag.boss===1);else ok(!E.missions.get().byTag.boss);
 E.state.mutate('player','player',p=>{p.ap=2;p.injury=0});E.health._m(x=>{x.ill=null});E.player.addHp(9999);E.missions.start('hunter.red_gate_boss',{acceptRisk:true});const before=E.player.get().money,tags=JSON.stringify(E.missions.get().byTag);fightOut(E,()=>({type:'retreat'}));
 const L2=E.missions.get().last;if(L2.outcome==='retreat')ok(E.player.get().money===before&&JSON.stringify(E.missions.get().byTag)===tags)});
T('p5 mission: lethal ใช้ได้เฉพาะ manual (validation)',()=>{const E=mkGP(new Mem(),[]);throws(()=>E.worlds.register(tw({missions:[{id:'m',name:'m',enemy:'dummy',risk:'lethal'}]})),/lethal/)});
// --- Party ---
T('p5 party: เงื่อนไขชวนเข้าทีม',()=>{const E=hunterAt();const q='hunter.rival_hunter';ok(/สนิท/.test(E.party.canInvite(q)));E.rels.change(q,'player',{aff:60,trust:20});ok(E.party.canInvite(q)==='');
 ok(/สายต่อสู้/.test(E.party.canInvite('hunter.teacher_park')));const kid=E.npcs.add('hunter',{id:'kid',name:'เด็ก',age:10,occupation:'npc_hunter'});E.npcs.setFlag(kid.id,'party');ok(/อายุ/.test(E.party.canInvite(kid.id)));
 const elf=E.npcs.add('fantasy',{id:'elf',name:'เอลฟ์',combat:{role:'damage'}});ok(/โลก|สายต่อสู้/.test(E.party.canInvite(elf.id)))});
T('p5 party: จำกัดจำนวน ออกจากทีม ตายแล้วออกเอง',()=>{const E=hunterAt();const ids=[];for(let i=0;i<4;i++){const n=E.npcs.generate('hunter',{occupation:'npc_hunter',age:25});E.npcs.setFlag(n.id,'party');ids.push(n.id)}
 for(let i=0;i<3;i++)E.party.invite(ids[i]);ok(/เต็ม/.test(E.party.canInvite(ids[3])));E.party.leave(ids[0]);ok(E.party.get().members.length===2);E.npcs.kill(ids[1],'เหตุการณ์ทดสอบ');ok(E.party.get().members.length===1&&E.party.get().history.length>=3)});
T('p5 party: synergy จากบทบาทและคู่อริในทีม',()=>{const E=hunterAt();const mk=role=>{const n=E.npcs.add('hunter',{id:'p_'+role,name:role,age:25,combat:{role,base:60},flags:{party:true}});return n.id};
 const t=mk('tank'),d=mk('damage'),s=mk('support');E.party.invite(t);E.party.invite(d);E.party.invite(s);ok(E.party.team('hunter').synergy>=1.15);
 E.rels.change(t,d,{aff:-40});ok(E.party.conflict()&&E.party.team('hunter').synergy<1.15);ok(E.events.eligible('hunter.party_conflict'))});
T('p5 party: สมาชิกบาดเจ็บไม่ลงสนาม และหายตามเวลา',()=>{const E=hunterAt();E.npcs.setFlag('hunter.master_kang','party');E.party.invite('hunter.master_kang');E.party.applyResult({party:[{npc:'hunter.master_kang',injury:2}],win:false,enemyName:'x'});
 ok(E.party.team('hunter').members.length===0);adv(E,2);ok(E.party.team('hunter').members.length===1);ok(E.npcs.get('hunter.master_kang').memory.some(m=>m.tag==='injury'))});
T('p5 party: ส่วนแบ่งรางวัล ไม่ติดลบ ความสัมพันธ์ดีขึ้น',()=>{const E=hunterAt('C','sh',{money:100});E.npcs.setFlag('hunter.rival_hunter','party');E.party.invite('hunter.rival_hunter');const a=(E.rels.edge('hunter.rival_hunter','player')||{aff:0}).aff;
 const paid=E.party.payShares(1000,'งาน');ok(paid===Math.min(200,100)&&E.player.get().money>=0&&E.rels.edge('hunter.rival_hunter','player').aff>a)});
T('p5 party: ฮาจุนใช้กติกาเดียวกับทุกคน',()=>{const E=hunterAt();const q='hunter.best_friend',isH=!!E.npcs.get(q).flags.hunter;E.state.mutate('npcs','npcs:hunter',s=>{s.list[q].bornAt=E.time.month('hunter')-12*19});
 if(!isH)ok(/สายต่อสู้/.test(E.party.canInvite(q)));else{ok(/สนิท/.test(E.party.canInvite(q))||E.party.canInvite(q)==='');E.npcs.setFlag(q,'party');ok(E.party.canInvite(q)==='')}});
// --- Skills & equipment ---
T('p5 skill: ปลดล็อกตามเงื่อนไข เลเวลจากการฝึก passive เพิ่มพลัง',()=>{const E=hunterAt('D','sk',{str:0});E.state.mutate('player','player',p=>{p.stats.vit=10});throws(()=>E.player.addSkill('hunter.iron_body',{check:true}),/ปลดล็อก/);
 E.player.addStats({vit:30});const p0=E.combat.profile('hunter',{party:false}).power;E.player.addSkill('hunter.iron_body',{check:true});ok(E.combat.profile('hunter',{party:false}).power>p0);
 const lv=E.player.skillLevel('hunter.slash');S.Rules.apply([{practice:30}],E.view('hunter'));ok(E.player.skillLevel('hunter.slash')>lv);for(let i=0;i<20;i++)E.player.skillXp('hunter.slash',100);ok(E.player.skillLevel('hunter.slash')===5)});
T('p5 equip: ตรวจของจริง ช่อง และเงื่อนไข · accessory · อัปเกรด',()=>{const E=hunterAt('E');throws(()=>E.player.equip('hunter.mana_ring'),/ไม่มีของ/);throws(()=>E.player.equip('hunter.ghost_item'),/สวมใส่ไม่ได้/);
 E.player.addItem('hunter.mana_blade_d');throws(()=>E.player.equip('hunter.mana_blade_d'),/เงื่อนไข/);E.player.addItem('hunter.mana_ring');E.player.equip('hunter.mana_ring');ok(E.player.get().equipment.accessory==='hunter.mana_ring'&&E.player.maxMp()>=20+E.player.get().mana*2+15);
 E.player.addItem('hunter.iron_dagger');E.player.equip('hunter.iron_dagger');const p0=E.combat.profile('hunter').power,m0=E.player.get().money;ok(E.player.upgrade('hunter.iron_dagger')===1);ok(E.player.get().money===m0-80&&E.combat.profile('hunter').power>p0);
 E.player.upgrade('hunter.iron_dagger');E.player.upgrade('hunter.iron_dagger');throws(()=>E.player.upgrade('hunter.iron_dagger'),/อัปเกรดไม่ได้/)});
T('p5 equip: อัปเกรดแล้วเซฟ/โหลด ไม่ได้ซ้ำ',()=>{const st=new Mem();const E=hunterAt('E');E.save.st=st;E.player.addItem('hunter.iron_dagger');E.player.upgrade('hunter.iron_dagger');E.saveTo(0);const F=mkGP(st);F.loadFrom(0);F.loadFrom(0);ok(F.player.get().upgrades['hunter.iron_dagger']===1&&F.player.get().money===E.player.get().money)});
// --- Dungeon ---
T('p5 dungeon: สร้างจาก seed ได้ผังเดิม ต่าง seed ต่างผัง มีบอสชั้นสุดท้าย',()=>{const g=ctx.AW.data.worlds[0].data.dungeons.find(d=>d.id==='goblin_warren');const a=S.generateDungeon(g,'s1'),b=S.generateDungeon(g,'s1'),c=S.generateDungeon(g,'s2');
 ok(JSON.stringify(a)===JSON.stringify(b)&&JSON.stringify(a)!==JSON.stringify(c));ok(a.length===3&&a[2].rooms.slice(-1)[0].kind==='boss'&&a.every(f=>f.rooms[0].kind==='fight'))});
T('p5 dungeon: ข้อมูลผิดบล็อกการลงทะเบียนโลก',()=>{for(const b of[{dungeons:[{id:'d',name:'d',at:'a',floors:0,groups:[{id:'g',enemies:[{enemy:'dummy'}]}]}]},{dungeons:[{id:'d',name:'d',at:'a',floors:1,groups:[{id:'g',enemies:[{enemy:'ghost'}]}]}]},{dungeons:[{id:'d',name:'d',at:'a',floors:1,groups:[{id:'g',enemies:[{enemy:'dummy'}]}],events:['e2']}]}]){
 const E=mkGP(new Mem(),[]);throws(()=>E.worlds.register(tw(b)),/ไม่ถูกต้อง/);ok(!E.registries.world.has('tw'))}});
const runDungeon=(E,q,{stopFloor}={})=>{E.player.moveTo('gate_zone');clearEv(E);E.dungeon.enter(q);let g=0,res=null;while(E.dungeon.run()&&E.dungeon.run().status==='active'&&g++<60){const r=E.dungeon.run();
  if(r.waiting){if(r.waiting.kind==='combat')fightOut(E,atkOnly);else{const c=E.events.choices().find(x=>x.ok);E.events.answer(c.i)}continue}if(stopFloor!==undefined&&r.fi>=stopFloor){res=E.dungeon.leave();break}res=E.dungeon.advance()}return res};
T('p5 dungeon: สำรวจจนจบ ได้ของครั้งเดียว บันทึก clears/checkpoint ความยากเพิ่ม',()=>{const E=hunterAt('D','dg',{str:200});const q='hunter.goblin_warren',m0=E.player.get().money;runDungeon(E,q);const r=E.dungeon.run();
 ok(r.status==='cleared',r.status+' '+r.log.slice(-3).join(','));ok(E.player.get().money>m0&&E.dungeon.record(q).clears===1&&E.dungeon.record(q).checkpoint===3);ok(E.missions.get().byTag.rank_d>=2);
 throws(()=>E.dungeon._finish('cleared'),/ไปแล้ว/);E.dungeon.close();E.state.mutate('player','player',p=>{p.ap=2});E.dungeon.enter(q);ok(E.dungeon.run().mult>r.mult)});
T('p5 dungeon: ออกเองได้ของครบ แพ้ได้บางส่วน',()=>{const E=hunterAt('D','dl',{str:200});const q='hunter.goblin_warren';const s=runDungeon(E,q,{stopFloor:1});ok(s.status==='left'?s.money>0:['retreated','failed'].includes(s.status));
 const E2=hunterAt('D','df',{str:0,level:1});E2.state.mutate('player','player',p=>{p.stats={str:1,agi:1,int:1,vit:1,cha:1,luk:1};p.mana=0});const s2=runDungeon(E2,q);ok(['failed','retreated','cleared'].includes(E2.dungeon.run().status))});
T('p5 dungeon: เซฟกลางดันเจี้ยนแล้วโหลด ต่อจนจบได้ ไม่ได้ของซ้ำ',()=>{const st=new Mem();const E=hunterAt('D','ds',{str:200});E.save.st=st;E.player.moveTo('gate_zone');clearEv(E);E.dungeon.enter('hunter.sewer_nest');E.dungeon.advance();clearEv(E);E.saveTo(0);
 const F=mkGP(st);F.loadFrom(0);ok(F.dungeon.run()&&F.dungeon.run().status==='active');let g=0;while(F.dungeon.run().status==='active'&&g++<40){if(F.dungeon.run().waiting){clearEv(F);continue}F.dungeon.advance()}ok(F.dungeon.get().claimed.length===1)});
// --- Tower ---
T('p5 tower: ปีนทีละชั้น ปริศนาใช้ towerClear รางวัลครั้งเดียว มี 20 ชั้นจาก data module',()=>{const E=hunterAt('C','tw',{str:200});ok(E.tower.floors('hunter.city_tower').length===20);E.player.moveTo('tower');clearEv(E);
 for(let i=0;i<4;i++){E.state.mutate('player','player',p=>{p.ap=2});E.player.addHp(9999);const r=E.tower.climb('hunter.city_tower',{acceptRisk:true});if(r.event){const c=E.events.choices().find(x=>x.ok&&x.chance>=0.5)||E.events.choices()[0];E.events.answer(c.i)}if(r.session)fightOut(E,atkOnly)}
 const st=E.tower.state('hunter.city_tower');ok(st.best>=2&&st.claimed[1]);const m=E.player.get().money;E.tower._clear('hunter.city_tower',E.tower.floors('hunter.city_tower')[0]);ok(E.player.get().money===m)});
T('p5 tower: เซฟ/โหลดเก็บชั้นสูงสุด · ข้อความบนผนังเมื่อผ่านชั้น 15',()=>{const st=new Mem();const E=hunterAt('C','tw2');E.save.st=st;E.tower._m(x=>{x.towers['hunter.city_tower']={best:15,claimed:{}}});E.saveTo(0);const F=mkGP(st);F.loadFrom(0);ok(F.tower.state('hunter.city_tower').best===15);
 F.player.moveTo('tower');ok(F.events.pending()&&F.events.pending().id==='hunter.e2_tower_wall')});
// --- Dark market ---
T('p5 underground: ต้องได้ทางเข้าก่อน ขายของได้เงินแต่ heat ขึ้น heat ลดตามเวลา',()=>{const E=hunterAt('D');ok(!E.player.canEnter('black_market'));E.underground.setAccess(true);E.player.addItem('hunter.monster_core',2);E.player.moveTo('black_market');
 ok(E.events.pending().id==='hunter.e2_black_market');E.events.answer(0);ok(E.underground.get().heat>=10);const h=E.underground.get().heat;clearEv(E);adv(E,2);ok(E.underground.get().heat<h)});
T('p5 underground: heat สูงทำให้ถูกสอบสวน มีผลเสียจริง',()=>{const E=hunterAt('D');E.underground.addHeat(80);clearEv(E);E.loop.tick(true);ok(E.events.pending()&&E.events.pending().id==='hunter.ug_investigation');const rep=E.player.get().reputation,m=E.player.get().money;E.events.answer(0);ok(E.player.get().reputation<rep&&E.player.get().money<m&&E.underground.get().heat<80)});
T('p5 underground: งานลอบสังหารแบบใหม่ ไม่ใช่ทางรวยเร็ว (เงินพอ ๆ งานปกติ แต่ heat/karma/ชื่อเสียงเสีย)',()=>{const ev=ctx.AW.data.worlds[0].data.events.find(e=>e.id==='e2_contract_kill'),acc=ev.choices[0];const money=acc.ok.effects.find(x=>x.money).money;
 ok(money<=1500&&acc.ok.effects.some(x=>x.heat>=50)&&acc.ok.effects.some(x=>x.karma<=-25)&&acc.ok.effects.some(x=>x.reputation<0)&&!!acc.fight&&!!acc.fail)});
T('p5 underground: ยาเถื่อน: เลือกขอส่วนแบ่งได้เงินแต่ heat 40',()=>{const E=hunterAt('D');E.underground.setAccess(true);E.player.setFlag('drug_lead',true);E.player.moveTo('black_market');ok(E.events.pending().id==='hunter.e2_drug_ring');const k=E.player.get().karma;E.events.answer(2);ok(E.underground.get().heat>=40&&E.player.get().karma<k)});
// --- events2 remaining ---
T('p5 e2: เหลือครบ 6 รายการ มี src · คนหน้าเหมือนไม่มีคำเฉลย',()=>{const ev=ctx.AW.data.worlds[0].data.events;for(const id of['e2_black_market','e2_drug_ring','e2_partner_injured','e2_tower_wall','e2_twin_hook','e2_contract_kill'])ok(ev.find(e=>e.id===id&&/events2\.js:/.test(e.src)),id);
 const tw=ev.find(e=>e.id==='e2_twin_hook');ok(tw.choices.every(c=>c.ok.effects.every(x=>x.flag)));ok(!/ถูกพบหน้าเกต|เกิดจากเกตเดียวกัน/.test(JSON.stringify(tw)))});
T('p5 e2: คู่หูบาดเจ็บเกิดเมื่อมีสมาชิกทีมบาดเจ็บ',()=>{const E=hunterAt();E.npcs.setFlag('hunter.master_kang','party');E.party.invite('hunter.master_kang');ok(!E.events.pickWho('hunter.e2_partner_injured'));
 E.party.applyResult({party:[{npc:'hunter.master_kang',injury:2}],win:false,enemyName:'x'});E.player.moveTo('hospital');ok(E.events.pending()&&E.events.pending().id==='hunter.e2_partner_injured');E.events.answer(0);ok(E.party.get().members[0].injury===0)});
// --- Save compat ---
T('p5 save: เซฟจริง Phase 4 โหลดได้ (player v3) ทุกระบบใหม่เริ่มว่าง',()=>{const st=new Mem();st.setItem('mvh1:slot0',fs.readFileSync(path.join(__dirname,'fixtures/phase4_save.json'),'utf8'));const E=mkGP(st);ok(E.loadFrom(0));const p=E.player.get();
 ok(p._v===3&&p.equipment.accessory===null&&p.skillLv['hunter.slash'].lv===1&&p.ranks.hunter==='C'&&p.money===12550);ok(E.party.get().members.length===0&&!E.dungeon.run()&&!E.combat.session()&&E.underground.get().heat===0);
 ok(E.life.get().job.id==='ramen'&&E.health.get().ill&&E.npcs.get('hunter.best_friend').flags.party);E.saveTo(1);const F=mkGP(st);F.loadFrom(1);ok(JSON.stringify(F.state.snapshot())===JSON.stringify(E.state.snapshot()))});
T('p5 save: เซฟ Phase 2 และ 3 ยังโหลดได้',()=>{for(const f of['phase2_save.json','phase3_save.json']){const st=new Mem();st.setItem('mvh1:slot0',fs.readFileSync(path.join(__dirname,'fixtures/'+f),'utf8'));const E=mkGP(st);ok(E.loadFrom(0),f);ok(E.player.get()._v===3,f)}});
T('p5 save: ตรวจการอ้างไอเทมและ NPC ตอนโหลด',()=>{const st=new Mem();const E=hunterAt();E.save.st=st;E.npcs.setFlag('hunter.master_kang','party');E.party.invite('hunter.master_kang');E.saveTo(0);const raw=JSON.parse(st.getItem('mvh1:slot0')),b=JSON.parse(raw.body);
 b.data.player.inventory['hunter.ghost_item']=3;b.data.player.equipment.accessory='hunter.ghost_item';b.data.party.members.push({npc:'hunter.ghost',role:'tank',injury:0,missions:0,earned:0});raw.body=JSON.stringify(b);raw.sum=C.saveChecksum(raw.body);st.setItem('mvh1:slot0',JSON.stringify(raw));
 const F=mkGP(st);F.loadFrom(0);ok(!F.player.get().inventory['hunter.ghost_item']&&F.player.get().equipment.accessory===null&&F.party.get().members.length===1)});
// --- Balance & performance ---
T('p5 balance: ทุกสไตล์ถึงแรงก์ C ภายในอายุ 26 และไม่มี error',()=>{const Sim=require('./sim.js'),cx=Sim.boot();for(const st of['mission','solo','party','trainer','worker','dungeon']){const r=Sim.play(cx,'bt_'+st,st,12*11);ok(r.rank&&'CBAS'.includes(r.rank)&&r.rank!=='-'&&!r.errs.length&&!r.dead,st+' '+r.rank+' '+r.errs.slice(0,1))}});
T('p5 perf: ศึก manual 5 ศัตรู + ทีม 3 คน 30 รอบ < 100ms',()=>{const E=hunterAt('C','pf',{str:400});for(let i=0;i<3;i++){const n=E.npcs.generate('hunter',{occupation:'npc_hunter',age:25});E.npcs.setFlag(n.id,'party');E.party.invite(n.id)}
 const t=Date.now();E.combat.start({worldId:'hunter',foes:[1,2,3,4,5].map(()=>({enemy:'wolf_lord',mult:3}))});fightOut(E,()=>({type:'defend'}));ok(Date.now()-t<100,'ms '+(Date.now()-t))});

console.log(results.join('\n'));console.log(`\n${pass} ผ่าน · ${fail} ไม่ผ่าน`);process.exit(fail?1:0);
