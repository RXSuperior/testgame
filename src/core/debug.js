// Debug System: บันทึก log วงแหวน, จับ error ทั้งจาก bus และ window, คำสั่งทดสอบ
(function(AW){
class Debug{
 constructor(bus,{max=300}={}){this.bus=bus;this.max=max;this.lines=[];this.errors=[];
  bus.on('bus:error',e=>this.error(`[${e.owner}] ${e.ev}: ${e.err&&e.err.message}`),{owner:'debug'})}
 log(msg,lvl='info'){this.lines.push({t:Date.now(),lvl,msg});if(this.lines.length>this.max)this.lines.shift()}
 error(msg){this.errors.push(msg);this.log(msg,'error')}
 traceBus(on){this.bus.trace=on?(ev,p)=>{if(!ev.startsWith('state:'))this.log('emit '+ev+(p&&p.month?' m'+p.month:''),'trace')}:null}
}
AW.core.Debug=Debug;
})(globalThis.AW);
