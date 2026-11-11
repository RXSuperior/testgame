// Save System: คีย์ใหม่ 'mvh1:*' ไม่แตะคีย์ของเกมเดิม ('hunter-path-*')
// ทุกเซฟมี schema version, เวลาบันทึก, checksum · เขียนทับช่องเดิมจะเก็บเวอร์ชันก่อนหน้าไว้ที่ '.prev'
// migrations[v] แปลงเซฟจากเวอร์ชัน v ไป v+1
(function(AW){
const PREFIX='mvh1:',PROTECTED=/^hunter-path-/;
function checksum(s){let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(h,31)+s.charCodeAt(i))|0;return(h>>>0).toString(16)}
class SaveSystem{
 constructor(state,{storage=globalThis.localStorage,migrations={}}={}){this.state=state;this.st=storage;this.migrations=migrations}
 key(slot){return PREFIX+'slot'+slot}
 _set(k,v){if(PROTECTED.test(k))throw new Error('ห้ามเขียนคีย์ของเกมเดิม: '+k);this.st.setItem(k,v)}
 save(slot,meta={}){const snap=this.state.snapshot(),body=JSON.stringify(snap);const rec=JSON.stringify({v:snap.version,at:Date.now(),meta,sum:checksum(body),body});
  const k=this.key(slot),old=this.st.getItem(k);if(old)this._set(k+'.prev',old);this._set(k,rec);return true}
 read(slot,{prev=false}={}){const raw=this.st.getItem(this.key(slot)+(prev?'.prev':''));if(!raw)return null;const rec=JSON.parse(raw);
  if(checksum(rec.body)!==rec.sum)throw new Error('เซฟเสียหาย (checksum ไม่ตรง)');return rec}
 migrate(snap){let s=snap;while(s.version<AW.core.SCHEMA_VERSION){const f=this.migrations[s.version];if(!f)throw new Error('ไม่มี migration จากเวอร์ชัน '+s.version);s=f(s)}return s}
 load(slot,opts){const rec=this.read(slot,opts);if(!rec)return false;this.state.restore(this.migrate(JSON.parse(rec.body)));return true}
 list(){const out=[];for(let i=0;i<this.st.length;i++){const k=this.st.key(i);if(k.startsWith(PREFIX)&&!k.endsWith('.prev')){try{const r=JSON.parse(this.st.getItem(k));out.push({key:k,at:r.at,meta:r.meta,v:r.v})}catch(e){out.push({key:k,broken:true})}}}return out}
 remove(slot){this.st.removeItem(this.key(slot));}
 exportSlot(slot){return this.st.getItem(this.key(slot))}
 importSlot(slot,text){const rec=JSON.parse(text);if(checksum(rec.body)!==rec.sum)throw new Error('ไฟล์เซฟเสียหาย');this._set(this.key(slot),text)}
 legacyKeys(){const out=[];for(let i=0;i<this.st.length;i++){const k=this.st.key(i);if(PROTECTED.test(k))out.push(k)}return out}
}
AW.core.SaveSystem=SaveSystem;AW.core.SAVE_PREFIX=PREFIX;
})(globalThis.AW);
