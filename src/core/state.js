// Game State: แบ่งเป็น slice แต่ละ slice มีเจ้าของ (ระบบเดียวที่เขียนได้)
// อ่าน: state.get(name) · เขียน: state.mutate(owner,name,fn) ถ้าไม่ใช่เจ้าของจะ throw
(function(AW){
const SCHEMA_VERSION=1;
class GameState{
 constructor(bus){this.bus=bus;this.slices=new Map();this.data={}}
 register(name,owner,init){if(this.slices.has(name))throw new Error(`slice "${name}" ซ้ำ (เจ้าของเดิม ${this.slices.get(name).owner})`);this.slices.set(name,{owner,init});this.data[name]=init()}
 owner(name){const s=this.slices.get(name);if(!s)throw new Error(`ไม่มี slice "${name}"`);return s.owner}
 get(name){if(!this.slices.has(name))throw new Error(`ไม่มี slice "${name}"`);return this.data[name]}
 mutate(owner,name,fn){const o=this.owner(name);if(o!==owner)throw new Error(`"${owner}" เขียน slice "${name}" ไม่ได้ (เจ้าของคือ "${o}")`);const r=fn(this.data[name]);this.bus&&this.bus.emit('state:changed',{name,owner});return r}
 reset(){for(const[n,s]of this.slices)this.data[n]=s.init()}
 snapshot(){return{version:SCHEMA_VERSION,data:JSON.parse(JSON.stringify(this.data))}}
 restore(snap){if(!snap||snap.version!==SCHEMA_VERSION)throw new Error('เวอร์ชันเซฟไม่ตรง ต้องผ่าน migration ก่อน');this.reset();for(const n of Object.keys(snap.data)){if(this.slices.has(n))this.data[n]=snap.data[n]}}
}
AW.core.GameState=GameState;AW.core.SCHEMA_VERSION=SCHEMA_VERSION;
})(globalThis.AW);
