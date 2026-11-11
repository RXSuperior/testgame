// Registry กลางสำหรับข้อมูลที่ลงทะเบียน (โลก เรื่อง ตัวละคร ไอเทม ฯลฯ)
// ตรวจ: id ซ้ำ, ฟิลด์ที่จำเป็น, รูปแบบ id · ใช้เป็น Data Loader ของ World/Story Module ใน Phase ถัดไป
(function(AW){
const ID=/^[a-z][a-z0-9_]*$/;
class Registry{
 constructor(kind,required=[],validate=null){this.kind=kind;this.required=required;this.validate=validate;this.items=new Map()}
 add(def){const errs=this.check(def);if(errs.length)throw new Error(`${this.kind} "${def&&def.id}" ไม่ถูกต้อง: ${errs.join('; ')}`);this.items.set(def.id,Object.freeze(def));return def}
 check(def){const e=[];if(!def||typeof def!=='object')return['ไม่ใช่ object'];if(!ID.test(def.id||''))e.push('id ต้องเป็น a-z0-9_ ขึ้นต้นด้วยตัวอักษร');if(this.items.has(def.id))e.push('id ซ้ำ');
  for(const f of this.required)if(def[f]===undefined)e.push('ขาดฟิลด์ '+f);if(this.validate)e.push(...(this.validate(def)||[]));return e}
 get(id){return this.items.get(id)}
 has(id){return this.items.has(id)}
 all(){return[...this.items.values()]}
 loadAll(defs){const ok=[],bad=[];for(const d of defs){try{ok.push(this.add(d).id)}catch(err){bad.push(err.message)}}return{ok,bad}}
}
AW.core.Registry=Registry;
})(globalThis.AW);
