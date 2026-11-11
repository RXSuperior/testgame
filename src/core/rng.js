// สุ่มแบบมี seed (mulberry32) สถานะเป็นตัวเลขเดียว เก็บในเซฟได้ ผลซ้ำได้เมื่อ seed เดิม
(function(AW){
function hashSeed(s){let h=2166136261>>>0;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
class Rng{
 constructor(seed){this.state=typeof seed==='number'?seed>>>0:hashSeed(seed??Date.now())}
 next(){let t=this.state=(this.state+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
 int(a,b){return a+Math.floor(this.next()*(b-a+1))}
 chance(p){return this.next()<p}
 pick(arr){return arr[Math.floor(this.next()*arr.length)]}
}
AW.core.Rng=Rng;AW.core.hashSeed=hashSeed;
})(globalThis.AW);
