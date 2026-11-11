// Save System: คีย์ใหม่ 'mvh1:*' ไม่แตะคีย์ของเกมเดิม ('hunter-path-*')
// ทุกเซฟมี schema version, เวลาบันทึก, checksum · เขียนทับช่องเดิมจะเก็บเวอร์ชันก่อนหน้าไว้ที่ '.prev'
// import ทับช่องที่มีเซฟอยู่ จะสำรองของเดิมไว้ที่ '.preimport' ก่อน
// migrations[v] แปลงเซฟจากเวอร์ชัน v ไป v+1
(function(AW){
'use strict';
const PREFIX='mvh1:',PROTECTED=/^hunter-path-/,SLOT=/^[a-z0-9_]{1,24}$/;
function checksum(s){let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(h,31)+s.charCodeAt(i))|0;return(h>>>0).toString(16)}
class SaveSystem{
 constructor(state,{storage=globalThis.localStorage,migrations={}}={}){this.state=state;this.st=storage;this.migrations=migrations}
 key(slot){const s=String(slot);if(!SLOT.test(s))throw new Error('ชื่อช่องเซฟไม่ถูกต้อง: '+s);return PREFIX+'slot'+s}
 _set(k,v){if(PROTECTED.test(k)||!k.startsWith(PREFIX))throw new Error('ห้ามเขียนคีย์นอก '+PREFIX+': '+k);this.st.setItem(k,v)}
 save(slot,meta={}){const snap=this.state.snapshot(),body=JSON.stringify(snap);const rec=JSON.stringify({v:snap.version,at:Date.now(),meta,sum:checksum(body),body});
  const k=this.key(slot),old=this.st.getItem(k);if(old)this._set(k+'.prev',old);this._set(k,rec);return true}
 // ตรวจข้อความเซฟทั้งก้อน: JSON, ฟิลด์, checksum, version, โครงสร้าง slice · คืน {rec,snap} ที่ migrate แล้ว หรือ throw
 parse(text){let rec;try{rec=JSON.parse(text)}catch(e){throw new Error('เซฟไม่ใช่ JSON')}
  if(!rec||typeof rec!=='object'||Array.isArray(rec))throw new Error('เซฟผิดรูปแบบ');
  if(!Number.isInteger(rec.v)||rec.v<0)throw new Error('เซฟไม่มี version');
  if(typeof rec.body!=='string'||typeof rec.sum!=='string')throw new Error('เซฟขาด body หรือ checksum');
  if(typeof rec.at!=='number'||(rec.meta!==undefined&&(typeof rec.meta!=='object'||rec.meta===null)))throw new Error('เซฟผิดรูปแบบ (at/meta)');
  if(checksum(rec.body)!==rec.sum)throw new Error('เซฟเสียหาย (checksum ไม่ตรง)');
  if(rec.v>AW.core.SCHEMA_VERSION)throw new Error('เซฟมาจากเวอร์ชันใหม่กว่าเกม ('+rec.v+')');
  let snap;try{snap=JSON.parse(rec.body)}catch(e){throw new Error('body เสียหาย')}
  if(!snap||snap.version!==rec.v)throw new Error('version ใน body ไม่ตรงกับหัวเซฟ');
  snap=this.migrate(snap);const err=this.state.check(snap);if(err)throw new Error('โครงสร้างเซฟผิด: '+err);return{rec,snap}}
 read(slot,{prev=false}={}){const raw=this.st.getItem(this.key(slot)+(prev?'.prev':''));if(!raw)return null;return this.parse(raw).rec}
 migrate(snap){let s=snap;while(s.version<AW.core.SCHEMA_VERSION){const f=this.migrations[s.version];if(!f)throw new Error('ไม่มี migration จากเวอร์ชัน '+s.version);s=f(s)}return s}
 load(slot,{prev=false}={}){const raw=this.st.getItem(this.key(slot)+(prev?'.prev':''));if(!raw)return false;this.state.restore(this.parse(raw).snap);return true}
 list(){const out=[];for(let i=0;i<this.st.length;i++){const k=this.st.key(i);if(k.startsWith(PREFIX)&&!k.includes('.')){try{const r=this.parse(this.st.getItem(k)).rec;out.push({key:k,at:r.at,meta:r.meta,v:r.v})}catch(e){out.push({key:k,broken:true,error:e.message})}}}return out}
 remove(slot){this.st.removeItem(this.key(slot));}
 exportSlot(slot){return this.st.getItem(this.key(slot))}
 // ตรวจครบก่อนเขียน ถ้าไม่ผ่านไม่แตะ storage เลย · ถ้าช่องมีเซฟอยู่ สำรองไว้ที่ '.preimport'
 importSlot(slot,text){if(typeof text!=='string')throw new Error('ข้อมูล import ต้องเป็นข้อความ');this.parse(text);const k=this.key(slot),old=this.st.getItem(k);
  if(old)this._set(k+'.preimport',old);this._set(k,text);return{backup:old?k+'.preimport':null}}
 legacyKeys(){const out=[];for(let i=0;i<this.st.length;i++){const k=this.st.key(i);if(PROTECTED.test(k))out.push(k)}return out}
}
AW.core.SaveSystem=SaveSystem;AW.core.SAVE_PREFIX=PREFIX;AW.core.saveChecksum=checksum;
})(globalThis.AW);
