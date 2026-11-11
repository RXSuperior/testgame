// Tower System: หอคอยหลายชั้นจากข้อมูล (data.towers + data.towerFloors ที่เพิ่มชั้นได้โดยไม่แก้โค้ด) แยกจาก Dungeon
// ปีนทีละชั้นถัดจากชั้นสูงสุดที่ผ่าน: fight (auto) / boss (manual) / puzzle, choice (เหตุการณ์ trigger 'tower' ที่ใช้ผล towerClear)
// รางวัลแต่ละชั้นรับได้ครั้งเดียว (claimed) โหลดเซฟไม่ทำให้ได้ซ้ำ · บันทึกชั้นสูงสุด (best) ต่อหอคอย
(function(AW){
'use strict';
const OWNER='tower',VERSION=1,KINDS=['fight','boss','puzzle','choice'],R=()=>AW.systems.Rules;
// ชั้นของหอคอย = floors ในนิยาม + towerFloors ที่ชี้มาที่หอคอยนี้ เรียงตามเลขชั้น
const floorsOf=(d,t)=>(t.floors||[]).concat((d.towerFloors||[]).filter(f=>f.tower===t.id)).slice().sort((a,b)=>a.n-b.n);
function validateTowers(def){const d=def.data||{},e=[],en=new Set((d.enemies||[]).map(x=>x.id)),ev=new Map((d.events||[]).map(x=>[x.id,x])),locs=new Set((d.locations||[]).map(l=>l.id)),ids=new Set((d.towers||[]).map(t=>t.id));
 for(const f of d.towerFloors||[])if(!ids.has(f.tower))e.push('towerFloors: ไม่มีหอคอย '+f.tower);
 for(const t of d.towers||[]){const p='tower '+t.id+': ',fl=floorsOf(d,t);if(!locs.has(t.at))e.push(p+'ไม่มีสถานที่ '+t.at);
  fl.forEach((f,i)=>{const q=p+'ชั้น '+f.n+': ';if(f.n!==i+1)e.push(q+'เลขชั้นต้องต่อเนื่องจาก 1');if(!KINDS.includes(f.kind))e.push(q+'kind ไม่รู้จัก');
   if((f.kind==='fight'||f.kind==='boss')&&!en.has(f.enemy))e.push(q+'ไม่มีศัตรู '+f.enemy);
   if(f.kind==='puzzle'||f.kind==='choice'){const v=ev.get(f.event);if(!v)e.push(q+'ไม่มีเหตุการณ์ '+f.event);else if(v.trigger!=='tower')e.push(q+'เหตุการณ์ต้องเป็น trigger tower');else if(!JSON.stringify(v).includes('towerClear'))e.push(q+'เหตุการณ์ต้องมีผล towerClear')}
   if(f.risk&&!AW.systems.COMBAT_RISKS.includes(f.risk))e.push(q+'risk ไม่รู้จัก');e.push(...R().validateEffects(f.reward).map(x=>q+x),...R().validateCond(f.when).map(x=>q+x))})}
 return e}
class TowerSystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,towers:{},attempt:null}));E.worlds.addValidator(validateTowers);
  E.bus.on('combat:ended',({id,source})=>{if(source&&source.kind==='tower')this._bossDone(id)},{prio:0,owner:OWNER});
  E.bus.on('event:answered',r=>{const a=this.get().attempt;if(a&&a.event===r.id)this._resolveEvent()},{prio:-1,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 def(q){const[w,id]=q.split('.'),c=this.E.worlds.ctx(w);return c?c.list('towers').get(id)||null:null}
 floors(q){const[w]=q.split('.'),c=this.E.worlds.ctx(w);return c?floorsOf(c.def.data,this.def(q)):[]}
 state(q){return this.get().towers[q]||{best:0,claimed:{}}}
 here(){const p=this.E.player.get(),w=p.location.world,c=w&&this.E.worlds.ctx(w);if(!c||!p.alive)return[];
  return[...c.list('towers').values()].filter(t=>t.at===p.location.loc).map(t=>{const q=w+'.'+t.id,st=this.state(q),fl=this.floors(q),next=fl[st.best];
   const why=!next?'ปีนครบทุกชั้นแล้ว':this.get().attempt?'กำลังปีนอยู่':this.E.combat.session()?'กำลังต่อสู้อยู่':this.E.events.get().pending?'มีเหตุการณ์ค้าง':p.ap<(t.apCost??1)?'แรงไม่พอเดือนนี้ (AP)':
    next.when&&!R().check(next.when,this.E.view(w))?'ยังไม่ผ่านเงื่อนไขชั้นนี้':'';
   return{id:q,name:t.name,best:st.best,total:fl.length,next:next?{n:next.n,kind:next.kind,name:next.name||'',risk:next.risk||'normal'}:null,ok:!why,why}})}
 // ปีนชั้นถัดไป · boss ที่ risk ไม่ใช่ normal ต้อง acceptRisk
 climb(q,{acceptRisk=false}={}){const t=this.def(q),a=this.here().find(x=>x.id===q);if(!t||!a)throw new Error('ไม่มีหอคอยนี้ที่นี่');if(a.why)throw new Error(a.why);
  const w=q.split('.')[0],f=this.floors(q)[this.state(q).best];if(f.kind==='boss'&&(f.risk||'normal')!=='normal'&&!acceptRisk)throw new Error('ต้องยอมรับความเสี่ยงระดับ '+f.risk+' ก่อน');
  this.E.player.spendAp(t.apCost??1);
  if(f.kind==='fight'){const rep=this.E.combat.fight({worldId:w,enemy:f.enemy,mult:f.mult||1});if(rep.win)return Object.assign(this._clear(q,f),{fight:rep});return{cleared:false,floor:f.n,fight:rep}}
  if(f.kind==='boss'){const s=this.E.combat.start({worldId:w,foes:[{enemy:f.enemy,mult:f.mult||1}],risk:f.risk||'normal',acceptRisk,source:{kind:'tower',ref:q},help:f.help||null});this._m(x=>{x.attempt={tower:q,floor:f.n,session:s.id}});return{pending:true,session:s.id}}
  const ev=w+'.'+f.event;this._m(x=>{x.attempt={tower:q,floor:f.n,event:ev,cleared:false}});this.E.events.present(ev);return{pending:true,event:ev}}
 // ผล towerClear ในเหตุการณ์ชั้นปริศนา/ทางเลือก
 markClear(){if(!this.get().attempt)throw new Error('ไม่ได้อยู่ระหว่างปีนหอคอย');this._m(x=>{x.attempt.cleared=true})}
 _resolveEvent(){const a=this.get().attempt,f=this.floors(a.tower).find(x=>x.n===a.floor);this._m(x=>{x.attempt=null});if(a.cleared)this._clear(a.tower,f)}
 _bossDone(id){const a=this.get().attempt;if(!a||a.session!==id)return;const rep=this.E.combat.claim(id),f=this.floors(a.tower).find(x=>x.n===a.floor);this._m(x=>{x.attempt=null});if(rep.win&&this.E.player.get().alive)this._clear(a.tower,f)}
 // ผ่านชั้น: เลื่อน best และรับรางวัลถ้ายังไม่เคยรับ
 _clear(q,f){const w=q.split('.')[0];let fx=[];const st=this.state(q);if(!st.claimed[f.n])fx=R().apply(f.reward,this.E.view(w));
  this._m(x=>{const s=x.towers[q]||(x.towers[q]={best:0,claimed:{}});s.best=Math.max(s.best,f.n);s.claimed[f.n]=true});
  this.E.events&&this.E.events.log(`${this.def(q).name} ผ่านชั้น ${f.n}`+(fx.length?` (${fx.join(', ')})`:''));this.E.bus.emit('tower:cleared',{tower:q,floor:f.n});return{cleared:true,floor:f.n,effects:fx}}
}
AW.systems.TowerSystem=TowerSystem;AW.systems.validateTowers=validateTowers;
AW.systems.TowerModule={id:'tower',deps:['party','events'],install(e){e.tower=new TowerSystem(e)}};
})(globalThis.AW);
