// Game State: แบ่งเป็น slice แต่ละ slice มีเจ้าของ (ระบบเดียวที่เขียนได้)
// อ่าน: state.get(name) ได้ object ที่ freeze ทั้งต้นไม้ แก้ไม่ได้ (strict mode จะ throw)
// เขียน: state.mutate(owner,name,fn) fn ได้สำเนาที่แก้ได้ แล้วสำเนานั้นจะถูก freeze เป็นค่าใหม่ (copy-on-write)
// อ่านไม่เสียค่าใช้จ่าย เขียนเสียค่า clone ของ slice นั้น slice เดียว
// ข้อมูลใน slice ต้องเป็น JSON ล้วน (เพราะต้องเซฟได้)
(function(AW){
'use strict';
const SCHEMA_VERSION=1;
const clone=v=>v===undefined?v:JSON.parse(JSON.stringify(v));
function deepFreeze(o){if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const k of Object.keys(o))deepFreeze(o[k])}return o}
const kind=v=>Array.isArray(v)?'array':v===null?'null':typeof v;
class GameState{
 constructor(bus){this.bus=bus;this.slices=new Map();this.data={};this.orphans={}}
 // slice ที่มีในเซฟแต่ยังไม่มีใครลงทะเบียน (orphan) จะถูกเก็บไว้ไม่หาย และถูกรับไปใช้เมื่อมีการ register ชื่อนั้นทีหลัง
 register(name,owner,init){if(this.slices.has(name))throw new Error(`slice "${name}" ซ้ำ (เจ้าของเดิม ${this.slices.get(name).owner})`);this.slices.set(name,{owner,init});
  const o=this.orphans[name],fresh=init();delete this.orphans[name];this.data[name]=deepFreeze(clone(o!==undefined&&kind(o)===kind(fresh)?o:fresh))}
 // ถอน slice (ใช้ตอน rollback การติดตั้งที่ไม่สำเร็จ) เจ้าของเท่านั้น · keep=true คืนข้อมูลไปเป็น orphan
 unregister(name,owner,{keep=false}={}){if(this.owner(name)!==owner)throw new Error(`"${owner}" ถอน slice "${name}" ไม่ได้`);if(keep)this.orphans[name]=this.data[name];this.slices.delete(name);delete this.data[name]}
 owner(name){const s=this.slices.get(name);if(!s)throw new Error(`ไม่มี slice "${name}"`);return s.owner}
 get(name){if(!this.slices.has(name))throw new Error(`ไม่มี slice "${name}"`);return this.data[name]}
 mutate(owner,name,fn){const o=this.owner(name);if(o!==owner)throw new Error(`"${owner}" เขียน slice "${name}" ไม่ได้ (เจ้าของคือ "${o}")`);
  const draft=clone(this.data[name]);const r=fn(draft);this.data[name]=deepFreeze(draft);this.bus&&this.bus.emit('state:changed',{name,owner});return r}
 reset(){this.orphans={};for(const[n,s]of this.slices)this.data[n]=deepFreeze(clone(s.init()))}
 snapshot(){return{version:SCHEMA_VERSION,data:clone(Object.assign({},this.orphans,this.data))}}
 // ตรวจรูปแบบ snapshot โดยไม่แตะ state: คืน null ถ้าผ่าน หรือข้อความ error
 check(snap){if(!snap||typeof snap!=='object')return'snapshot ไม่ใช่ object';if(snap.version!==SCHEMA_VERSION)return'เวอร์ชันเซฟไม่ตรง ('+snap.version+')';
  if(kind(snap.data)!=='object')return'data ต้องเป็น object';
  for(const[n,s]of this.slices){if(!(n in snap.data))continue;const a=kind(snap.data[n]),b=kind(s.init());if(a!==b)return`slice "${n}" ผิดชนิด (${a} แทน ${b})`}return null}
 restore(snap){const e=this.check(snap);if(e)throw new Error(e);this.reset();for(const n of Object.keys(snap.data)){if(this.slices.has(n))this.data[n]=deepFreeze(clone(snap.data[n]));else this.orphans[n]=deepFreeze(clone(snap.data[n]))}}
}
AW.core.GameState=GameState;AW.core.SCHEMA_VERSION=SCHEMA_VERSION;AW.core.deepFreeze=deepFreeze;
})(globalThis.AW);
