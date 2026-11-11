// ทดสอบ Core ด้วย Node (ไม่ต้องมีเบราว์เซอร์): node tests/core.test.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..');const ORDER=['ns','rng','bus','state','loop','worldtime','save','registry','assets','debug','engine'].map(n=>`src/core/${n}.js`).concat(['src/systems/worlds.js','src/systems/rules.js','src/systems/player.js','src/systems/ranks.js','src/systems/combat.js','src/systems/events.js','src/systems/missions.js','data/worlds/hunter/base.js','data/worlds/hunter/events_life.js','data/worlds/hunter/events_hunter.js','data/worlds/hunter/actions.js','data/worlds/hunter/world.js','data/worlds/fantasy.js']);
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
const register=E=>{E.player.moveTo('association');ok(E.events.pending().id==='hunter.rank_evaluation');E.events.answer(0);ok(E.events.pending().id==='hunter.registration');E.events.answer(0);clearEv(E);return E};
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
 const p0=E.combat.profile('hunter').power;E.player.addItem('hunter.mana_blade_d');E.player.equip('hunter.mana_blade_d');ok(E.combat.profile('hunter').power===p0+30)});
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

console.log(results.join('\n'));console.log(`\n${pass} ผ่าน · ${fail} ไม่ผ่าน`);process.exit(fail?1:0);
