// Game Loop: 1 tick = 1 เดือนของโลกหลัก
// ลำดับต่อ tick: month:before -> month -> month:after (ระบบต่าง ๆ ฟังเหตุการณ์เหล่านี้)
// หยุดได้หลายเหตุผลพร้อมกัน (เปิดเมนู, มีเหตุการณ์รอ, ต่อสู้) เดินต่อเมื่อเหตุผลหมด
(function(AW){
'use strict';
class Loop{
 constructor(state,bus,{owner='loop',baseMs=1200,timer=globalThis}={}){this.state=state;this.bus=bus;this.owner=owner;this.baseMs=baseMs;this.timer=timer;this.speed=0;this.reasons=new Set();this.h=null;
  state.register('time',owner,()=>({month:0}))}
 get month(){return this.state.get('time').month}
 tick(force=false){if(this.reasons.size&&!force)return false;const m=this.month+1;this.bus.emit('month:before',{month:m});this.state.mutate(this.owner,'time',t=>{t.month=m});this.bus.emit('month',{month:m});this.bus.emit('month:after',{month:m});return true}
 step(n=1){let d=0;for(let i=0;i<n;i++)if(this.tick())d++;return d}
 setSpeed(s){this.speed=s;if(this.h){this.timer.clearInterval(this.h);this.h=null}if(s>0)this.h=this.timer.setInterval(()=>this.tick(),this.baseMs/s);this.bus.emit('loop:speed',{speed:s})}
 pause(r){this.reasons.add(r);this.bus.emit('loop:pause',{reasons:[...this.reasons]})}
 resume(r){this.reasons.delete(r);this.bus.emit('loop:pause',{reasons:[...this.reasons]})}
 get paused(){return this.reasons.size>0}
}
AW.core.Loop=Loop;
})(globalThis.AW);
