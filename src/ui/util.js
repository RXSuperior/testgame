// UI helpers (Phase 7A): escape, bars, badges, toast, confirm modal, page registry
// UI ทุกไฟล์อ่าน state และเรียก API ของระบบเท่านั้น ไม่มีกติกาเกมใน src/ui
(function(AW){
'use strict';
const U=AW.ui.u={};
U.$=s=>document.querySelector(s);
U.esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
U.n=v=>Number(v||0).toLocaleString('th-TH');
U.pct=(v,m)=>Math.max(0,Math.min(100,m?Math.round(v/m*100):0));
U.bar=(kind,v,m,label)=>`<div class="bar ${kind}" title="${U.esc(label||'')} ${Math.max(0,Math.round(v))}/${m}"><i style="width:${U.pct(v,m)}%"></i></div>`;
U.badge=(t,c='')=>`<span class="badge ${c}">${U.esc(t)}</span>`;
U.rank=r=>r?`<span class="rank" title="แรงก์ฮันเตอร์">${U.esc(r)}</span>`:'<span class="rank none" title="ยังไม่มีแรงก์">-</span>';
U.empty=t=>`<div class="empty">${U.esc(t)}</div>`;
U.todo=t=>`<div class="todo">TODO: ${U.esc(t)}</div>`;
U.RISK={normal:'',high:' ⚠ เสี่ยงสูง (อาจวิกฤต)',lethal:' ☠ อันตรายถึงชีวิต (อาจตายถาวร)'};
U.RISKB={normal:'',high:'<span class="badge red">เสี่ยงสูง</span>',lethal:'<span class="badge red">☠ ถึงชีวิต</span>'};
U.SLOT={morning:'เช้า',day:'กลางวัน',evening:'เย็น',night:'กลางคืน'};
U.STAT_TIP={str:'กาย: พลังโจมตีระยะประชิดและการแบกรับ',agi:'ความเร็ว: หลบหลีกและลงมือก่อน',int:'ปัญญา: เวทมนตร์ การวิเคราะห์ และงานสำนักงาน',vit:'ความอึด: พลังชีวิตสูงสุดและการฟื้นตัว',cha:'เสน่ห์: การเจรจาและความสัมพันธ์',luk:'โชค: โอกาสสำเร็จเล็กน้อยในทุกการทอย'};
// ---- toast ----
U.toast=(msg,kind='')=>{const box=U.$('#toasts');if(!box)return;const d=document.createElement('div');d.className='toast '+kind;d.setAttribute('role','status');d.textContent=msg;box.appendChild(d);setTimeout(()=>d.remove(),3200)};
// ---- confirm modal (การกระทำสำคัญ) · ไม่ใช้ dialog ของเบราว์เซอร์ ----
let pending=null;
U.confirm=(title,text,fn,{yes='ยืนยัน',danger=false}={})=>{pending=fn;const el=U.$('#confirm');el.innerHTML=`<div class="backdrop" data-cf="no"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="cft"><h3 id="cft">${U.esc(title)}</h3><p>${U.esc(text)}</p><div class="row" style="justify-content:flex-end"><button data-cf="no" class="ghost">ยกเลิก</button><button data-cf="yes" class="${danger?'danger':'pri'}">${U.esc(yes)}</button></div></div></div>`;
 const b=el.querySelector('[data-cf=yes]');if(b)b.focus()};
U.confirmClick=(e)=>{const t=e.target.closest('[data-cf]');if(!t)return false;if(t.dataset.cf==='no'&&t!==e.target&&t.classList.contains('backdrop'))return true;
 const fn=pending;pending=null;U.$('#confirm').innerHTML='';if(t.dataset.cf==='yes'&&fn)fn();return true};
// ---- page registry ----
AW.ui.pages=AW.ui.pages||[];
U.page=(id,o)=>AW.ui.pages.push(Object.assign({id},o));
})(globalThis.AW);
