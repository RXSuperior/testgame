// Asset pipeline (Phase 7B.1) ฝั่งเบราว์เซอร์: โหลด · preload ภาพสำคัญ · lazy load ที่เหลือ · ตรวจขนาดภาพ · ตรวจไฟล์หาย · fallback
// ใช้ AssetRegistry เดิม (E.assets) ไม่มี registry ใหม่: imageFactory ของ registry ถูกห่อด้วย factory() เพื่อติดตามผลโหลดของแต่ละ id
// ภาพยังไม่ได้ใช้ (ไม่มี src หรือไม่มี license) = registry คืน placeholder เหมือนเดิม
(function(AW){
'use strict';
const P=AW.ui.assets={};
const state=new Map();// id -> {status:'loading'|'ok'|'missing'|'invalid', w,h, reason}
let reg=null,bySrc=new Map();
const ratioOf=r=>{const m=/^(\d+):(\d+)$/.exec(r||'');return m?+m[1]/+m[2]:null};
// ตรวจขนาดจริงกับมาตรฐาน: สัดส่วนต่างได้ไม่เกิน 1% และไม่เล็กกว่า 50% ของขนาดแนะนำ
P.check=(def,w,h)=>{const s=def.std;if(!s||!s.w)return '';const r=ratioOf(s.ratio);if(r&&Math.abs(w/h-r)/r>0.01)return `สัดส่วน ${w}x${h} ไม่ตรง ${s.ratio}`;if(w<s.w*0.5||h<s.h*0.5)return `เล็กเกินไป ${w}x${h} (แนะนำ ${s.w}x${s.h})`;return ''};
// factory ที่ AssetRegistry ใช้สร้างภาพ: ผูก onload/onerror เพื่อรู้สถานะ · ไฟล์หาย/ขนาดผิด = ใส่ placeholder แทนใน cache ของ registry
P.factory=(make)=>src=>{const img=make(src),id=bySrc.get(src);if(!id)return img;state.set(id,{status:'loading'});
 img.onload=()=>{const d=reg.defs.get(id),why=P.check(d,img.naturalWidth,img.naturalHeight);if(why){P.fallback(id,'invalid',why)}else state.set(id,{status:'ok',w:img.naturalWidth,h:img.naturalHeight})};
 img.onerror=()=>P.fallback(id,'missing','โหลดไฟล์ไม่ได้: '+src);return img};
P.fallback=(id,status,reason)=>{state.set(id,{status,reason});const d=reg.defs.get(id);if(d)reg.cache.set(id,reg.placeholder(d));if(AW.engine)AW.engine.debug.log('asset '+id+': '+reason,'warn')};
P.attach=E=>{reg=E.assets;bySrc=new Map([...reg.defs.values()].filter(d=>d.src).map(d=>[d.src,d.id]))};
// พร้อมวาดหรือยัง (ภาพจริงโหลดเสร็จและผ่านการตรวจ) · ใช้ตัดสินใจวาด placeholder ระหว่างรอ
P.ready=id=>{const d=reg&&reg.defs.get(id);if(!d||!reg.usable(d))return false;const img=reg.get(id);const s=state.get(id);return !!(s&&s.status==='ok'&&img&&img.complete!==false)};
P.status=id=>{const d=reg&&reg.defs.get(id);if(!d)return 'unknown';if(!reg.usable(d))return 'placeholder';const s=state.get(id);return s?s.status:'idle'};
// preload: โหลดทันทีเฉพาะ P0/P1 ที่มีไฟล์จริง · ที่เหลือโหลดเมื่อถูกเรียกใช้ครั้งแรก (registry.get) = lazy
P.preload=(prio=['P0','P1'])=>{const ids=[...reg.defs.values()].filter(d=>reg.usable(d)&&prio.includes(d.priority)).map(d=>d.id);ids.forEach(id=>reg.get(id));return ids};
P.report=()=>{const r={placeholder:0,idle:0,loading:0,ok:0,missing:[],invalid:[]};for(const d of reg.defs.values()){const s=P.status(d.id);if(s==='missing'||s==='invalid')r[s].push(d.id+': '+(state.get(d.id)||{}).reason);else r[s]=(r[s]||0)+1}return r};
})(globalThis.AW);
