// ทดสอบ Core ด้วย Node (ไม่ต้องมีเบราว์เซอร์): node tests/core.test.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..');const ORDER=['ns','rng','bus','state','loop','worldtime','save','registry','assets','debug','engine'].map(n=>`src/core/${n}.js`);
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
T('registry: loadAll แยกของดีของเสีย (data loader)',()=>{const E=mk();const res=E.registries.world.loadAll([{id:'test_a',name:'A',timeRate:1,entry:{}},{id:'test_b',name:'B',timeRate:2,entry:{}},{id:'test_a',name:'dup',timeRate:1,entry:{}},{id:'x'}]);ok(res.ok.length===2&&res.bad.length===2)});
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

console.log(results.join('\n'));console.log(`\n${pass} ผ่าน · ${fail} ไม่ผ่าน`);process.exit(fail?1:0);
