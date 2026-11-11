// ทดสอบ Core ด้วย Node (ไม่ต้องมีเบราว์เซอร์): node tests/core.test.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..');const ORDER=['ns','rng','bus','state','loop','save','registry','assets','debug','engine'].map(n=>`src/core/${n}.js`);
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
T('save: ไม่มี migration ต้องแจ้ง error ไม่เดา',()=>{const st=new Mem();const body=JSON.stringify({version:0,data:{}});let s=0;for(let i=0;i<body.length;i++)s=(Math.imul(s,31)+body.charCodeAt(i))|0;st.setItem('mvh1:slot0',JSON.stringify({v:0,sum:(s>>>0).toString(16),body}));throws(()=>mk(st).loadFrom(0),/migration/)});
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
console.log(results.join('\n'));console.log(`\n${pass} ผ่าน · ${fail} ไม่ผ่าน`);process.exit(fail?1:0);
