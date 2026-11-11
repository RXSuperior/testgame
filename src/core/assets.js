// Asset Registry: เกมอ้างภาพด้วย id เท่านั้น ไม่อ้าง path
// ถ้ายังไม่มีไฟล์จริง หรือไฟล์ไม่มีสัญญาอนุญาตที่ยืนยัน ระบบจะคืนภาพ placeholder ที่เขียนคำว่า PLACEHOLDER ชัดเจน
// เปลี่ยนภาพภายหลัง = แก้ manifest ไม่ต้องแก้ game logic
(function(AW){
const LICENSES=new Set(['own','cc0','cc-by','craftpix-free','gandalfhardcore','licensed']);
class AssetRegistry{
 constructor({imageFactory=null,canvasFactory=null,allowUnlicensed=false}={}){this.defs=new Map();this.cache=new Map();this.img=imageFactory;this.cv=canvasFactory;this.allowUnlicensed=allowUnlicensed}
 register(def){const need=['id','kind','w','h'];for(const f of need)if(def[f]===undefined)throw new Error(`asset ${def.id}: ขาด ${f}`);if(this.defs.has(def.id))throw new Error('asset id ซ้ำ: '+def.id);
  this.defs.set(def.id,{frames:1,anchor:'bottom-center',world:'shared',license:null,src:null,...def})}
 registerAll(list){list.forEach(d=>this.register(d))}
 usable(d){return !!d.src&&(this.allowUnlicensed||LICENSES.has(d.license))}
 status(id){const d=this.defs.get(id);if(!d)return 'missing';return this.usable(d)?'real':'placeholder'}
 get(id){if(this.cache.has(id))return this.cache.get(id);const d=this.defs.get(id);let out;
  if(d&&this.usable(d)&&this.img){out=this.img(d.src)}else{out=this.placeholder(d||{id,w:32,h:32,kind:'missing'})}this.cache.set(id,out);return out}
 placeholder(d){if(!this.cv)return{placeholder:true,id:d.id,w:d.w,h:d.h};const c=this.cv(d.w,d.h),g=c.getContext('2d');
  let h=0;for(const ch of d.id)h=(h*31+ch.charCodeAt(0))>>>0;g.fillStyle=`hsl(${h%360},35%,30%)`;g.fillRect(0,0,d.w,d.h);g.strokeStyle='#ff3b9a';g.lineWidth=2;g.strokeRect(1,1,d.w-2,d.h-2);
  g.beginPath();g.moveTo(0,0);g.lineTo(d.w,d.h);g.moveTo(d.w,0);g.lineTo(0,d.h);g.stroke();if(d.w>=60){g.fillStyle='#fff';g.font='10px monospace';g.fillText('PLACEHOLDER',4,12);g.fillText(d.id.slice(0,Math.floor(d.w/6)),4,24)}c.placeholder=true;return c}
 report(){const r={real:0,placeholder:0,byWorld:{}};for(const d of this.defs.values()){const s=this.usable(d)?'real':'placeholder';r[s]++;(r.byWorld[d.world]=r.byWorld[d.world]||{real:0,placeholder:0})[s]++}return r}
}
AW.core.AssetRegistry=AssetRegistry;
})(globalThis.AW);
