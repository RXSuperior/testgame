// Side-view physics (Phase 7B.3): ฟังก์ชันล้วน ไม่มี DOM ไม่แตะ GameState · fixed step (dt คงที่) จึงผลซ้ำได้และทดสอบใน node ได้
// พิกัดเป็นพิกเซลของจอเสมือน 576x324 · body = กล่อง AABB {x,y,w,h} (x,y มุมซ้ายบน) + vx,vy,ground
// solids = กล่องตัน (ชนทุกด้าน) · platforms = แผ่นทางเดียว {x,y,w} (ชนเฉพาะตอนตกลงมาจากด้านบน)
(function(AW){
'use strict';
const P=AW.sv=AW.sv||{};
const K=P.K={dt:1/60,gravity:1500,speed:140,accel:1400,friction:1800,jump:470,maxFall:620,coyote:0.08,buffer:0.1};
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
P.overlap=hit;
// เดินหนึ่งก้าวเวลา: input={left,right,jump(กดค้าง),jumpPressed(เพิ่งกด),drop(ลงจากแพลตฟอร์ม)} · คืน body ใหม่ (ไม่แก้ของเดิม)
P.step=(b0,input,world,k=K)=>{const b=Object.assign({},b0),dt=k.dt,dir=(input.right?1:0)-(input.left?1:0);
 // แนวนอน: เร่ง/หน่วง
 if(dir){b.vx+=dir*k.accel*dt;if(Math.abs(b.vx)>k.speed)b.vx=Math.sign(b.vx)*k.speed;b.facing=dir}
 else{const f=k.friction*dt;b.vx=Math.abs(b.vx)<=f?0:b.vx-Math.sign(b.vx)*f}
 // กระโดด: coyote time (เพิ่งเดินพ้นขอบยังกระโดดได้) + jump buffer (กดก่อนถึงพื้นนิดหน่อยก็นับ)
 b.coyote=b.ground?k.coyote:Math.max(0,(b.coyote||0)-dt);b.buffer=input.jumpPressed?k.buffer:Math.max(0,(b.buffer||0)-dt);
 if(b.buffer>0&&b.coyote>0){b.vy=-k.jump;b.ground=false;b.coyote=0;b.buffer=0}
 if(!input.jump&&b.vy<-k.jump*0.4)b.vy=-k.jump*0.4;// ปล่อยปุ่มเร็ว = กระโดดต่ำ
 b.vy=Math.min(k.maxFall,b.vy+k.gravity*dt);
 // แยกแกน: X ก่อนแล้ว Y · ชนแล้วดันกลับชิดขอบ
 b.x+=b.vx*dt;for(const s of world.solids)if(hit(b,s)){if(b.vx>0)b.x=s.x-b.w;else if(b.vx<0)b.x=s.x+s.w;b.vx=0}
 b.x=Math.max(0,Math.min(world.width-b.w,b.x));
 const prevBottom=b.y+b.h;b.y+=b.vy*dt;b.ground=false;
 for(const s of world.solids)if(hit(b,s)){if(b.vy>0){b.y=s.y-b.h;b.ground=true}else if(b.vy<0)b.y=s.y+s.h;b.vy=0}
 if(b.vy>=0&&!input.drop)for(const p of world.platforms){const top=p.y;if(prevBottom<=top+0.01&&b.y+b.h>=top&&b.x+b.w>p.x&&b.x<p.x+p.w){b.y=top-b.h;b.vy=0;b.ground=true}}
 if(b.y>world.height+200){b.fell=true}
 return b};
// สถานะแอนิเมชันจากการเคลื่อนที่ (ท่าโจมตี/เจ็บ/ตายมาจาก combat runtime)
P.animOf=b=>b.dead?'death':b.hurt>0?'hurt':b.attack>0?'attack':!b.ground?(b.vy<0?'jump':'fall'):Math.abs(b.vx)>5?'walk':'idle';
// กล้อง: ตามผู้เล่นแบบมี dead-zone แล้วจำกัดไม่ให้เลยขอบพื้นที่
P.camera=(cam,target,world,view={w:576,h:324},dz=60)=>{const cx=target.x+target.w/2;let x=cam.x;if(cx<x+view.w/2-dz)x=cx-(view.w/2-dz);if(cx>x+view.w/2+dz)x=cx-(view.w/2+dz);
 return{x:Math.round(Math.max(0,Math.min(Math.max(0,world.width-view.w),x))),y:0}};
})(globalThis.AW);
