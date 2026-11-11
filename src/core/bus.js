// Event Bus: ระบบคุยกันผ่านเหตุการณ์ แทนการห่อฟังก์ชันของกันและกัน
// ตัวรับที่ error ไม่หยุดตัวรับอื่น (error ถูกส่งต่อเป็นเหตุการณ์ 'bus:error')
(function(AW){
class Bus{
 constructor(){this.h=new Map();this.trace=null}
 on(ev,fn,{prio=0,owner='?'}={}){const l=this.h.get(ev)||[];const e={fn,prio,owner};l.push(e);l.sort((a,b)=>b.prio-a.prio);this.h.set(ev,l);return()=>this.off(ev,fn)}
 off(ev,fn){const l=this.h.get(ev);if(l)this.h.set(ev,l.filter(e=>e.fn!==fn))}
 emit(ev,payload){if(this.trace)this.trace(ev,payload);const l=this.h.get(ev);if(!l)return 0;let n=0;
  for(const e of l.slice()){try{e.fn(payload);n++}catch(err){if(ev!=='bus:error')this.emit('bus:error',{ev,owner:e.owner,err});else console.error(err)}}return n}
 listeners(ev){return(this.h.get(ev)||[]).map(e=>e.owner)}
}
AW.core.Bus=Bus;
})(globalThis.AW);
