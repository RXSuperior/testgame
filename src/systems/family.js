// Family System: ครอบครัวของผู้เล่น สมาชิกทุกคนเป็น NPC ปกติในระบบ NPC (ไม่มีโค้ดพิเศษต่อคน)
// สร้างพ่อแม่ (และพี่น้องตามโอกาส) ตอนสร้างตัวละคร จากภูมิหลังครอบครัวในข้อมูลโลก (config.familyBackgrounds)
// แต่งงาน: ต้องมีใจให้กันและสนิทพอ ผ่านการขอแต่งงาน (Relations) หรือผลเหตุการณ์ 'marry' · มีลูก: ผ่านเหตุการณ์ที่มีเงื่อนไขเท่านั้น
// lineage เก็บโครงสำหรับระบบสืบทอดรุ่น (Phase 6) · slice 'family' เจ้าของ 'family'
(function(AW){
'use strict';
const OWNER='family',VERSION=1,ROLE_NAME={mother:'แม่',father:'พ่อ',older_sibling:'พี่',younger_sibling:'น้อง',spouse:'คู่ครอง',child:'ลูก'};
class FamilySystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,background:null,members:[],spouse:null,marriedAt:null,history:[],lineage:{id:null,generation:1,ancestors:[],children:[]}}));
  E.bus.on('player:created',()=>this.create(),{prio:20,owner:OWNER});
  // เซฟเก่า (ก่อน Phase 4) ไม่มีครอบครัว: สร้างให้ตอนโหลดโดยไม่แตะเงินของผู้เล่น
  E.bus.on('game:loaded',()=>{const p=E.player.get();if(p.created&&p.alive&&!this.get().members.length)this.create({adjustMoney:false})},{prio:75,owner:OWNER});
  E.bus.on('npc:died',({id,cause})=>{const m=this.get().members.find(x=>x.npc===id);if(m)this.note(`${ROLE_NAME[m.role]||m.role} ${(E.npcs.get(id)||{}).name} จากไป (${cause})`)},{prio:0,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 roleName(r){return ROLE_NAME[r]||r}
 note(t){const m=this.E.loop.month;this._m(s=>{s.history.unshift({m,t});if(s.history.length>40)s.history.length=40})}
 roleOf(npc){const m=this.get().members.find(x=>x.npc===npc);return m?m.role:null}
 members(role){return this.get().members.filter(m=>!role||m.role===role||(role==='sibling'&&/sibling/.test(m.role)))}
 _add(npc,role){this._m(s=>{s.members.push({npc,role,since:this.E.loop.month})});this.E.rels.setBond(npc,'player',role==='spouse'?'spouse':'family')}
 // สร้างครอบครัวตอนเริ่มชีวิต (seed เดียวกันได้ครอบครัวเดียวกัน)
 create({adjustMoney=true}={}){const E=this.E,p=E.player.get(),w=p.location.world,c=E.worlds.ctx(w);if(this.get().members.length||!c||!c.config.namePool)return;
  const r=new AW.core.Rng(E.state.get('meta').seed+'|family|'+w),bgs=c.config.familyBackgrounds||[{id:'ordinary',name:'ครอบครัวธรรมดา',weight:1}];
  let tot=bgs.reduce((a,b)=>a+b.weight,0),x=r.next()*tot,bg=bgs[0];for(const b of bgs){x-=b.weight;if(x<0){bg=b;break}}
  const me=p.age/12,surname=c.config.namePool.family[r.int(0,c.config.namePool.family.length-1)],home=([...c.list('housing').values()].find(h=>h.family)||{loc:c.def.entry}).loc,mk=(role,gender,age,o={})=>{
   const n=E.npcs.generate(w,Object.assign({gender,age,surname,role:this.roleName(role),home,tags:['family']},o));this._add(n.id,role);
   E.rels.change(n.id,'player',{aff:r.int(50,85),trust:30,fam:80});E.rels.change('player',n.id,{aff:60,fam:80});return n};
  const mom=mk('mother','f',me+r.int(24,34),bg.motherJob?{occupation:bg.motherJob}:{}),dad=mk('father','m',me+r.int(26,36),Object.assign(bg.fatherJob?{occupation:bg.fatherJob}:{},bg.id==='retired_hunter'?{tags:['family','retired_hunter']}:{}));
  E.rels.setBond(mom.id,dad.id,'spouse');E.rels.change(mom.id,dad.id,{aff:60,fam:90});E.rels.change(dad.id,mom.id,{aff:60,fam:90});
  if(r.next()<0.6){const older=r.next()<0.5;mk(older?'older_sibling':'younger_sibling',r.next()<0.5?'m':'f',Math.max(1,me+(older?r.int(1,4):-r.int(1,4))))}
  this._m(s=>{s.background=bg.id;s.lineage.id='lin_'+E.state.get('meta').seed+'_'+p.bornAt});if(adjustMoney&&bg.money!==undefined)E.player.addMoney(bg.money-p.money);
  this.note(`เกิดใน${bg.name}`)}
 background(){const b=this.get().background,c=this.E.worlds.ctx(this.E.player.get().location.world);return((c&&c.config.familyBackgrounds)||[]).find(x=>x.id===b)||null}
 married(){const s=this.get().spouse;return!!(s&&(this.E.npcs.get(s)||{}).alive)}
 // แต่งงาน: เงื่อนไขขั้นต่ำตรวจที่นี่เสมอ ไม่ว่าเรียกจากการกระทำหรือเหตุการณ์
 canMarry(npc){const n=this.E.npcs.get(npc),p=this.E.player.get(),x=this.E.rels.edge(npc,'player');
  if(!n||!n.alive)return'ไม่มีคนนี้';if(this.married())return'แต่งงานแล้ว';if(this.roleOf(npc))return'เป็นครอบครัว';if(p.age<18*12||this.E.npcs.ageY(npc)<18)return'อายุยังไม่ถึง';
  if(!x||x.romance<1)return'ยังไม่มีใจให้กัน';if(x.aff<50)return'ยังไม่สนิทพอ';return''}
 marry(npc){const why=this.canMarry(npc);if(why)throw new Error('แต่งงานไม่ได้: '+why);this._add(npc,'spouse');this._m(s=>{s.spouse=npc;s.marriedAt=this.E.loop.month});
  this.E.npcs.remember(npc,'แต่งงานกับผู้เล่น','marry');this.note(`แต่งงานกับ${this.E.npcs.get(npc).name}`);this.E.bus.emit('family:married',{npc})}
 children(){return this.members('child')}
 canHaveChild(){const s=this.get();if(!this.married())return'ยังไม่ได้แต่งงาน';if(this.E.loop.month-s.marriedAt<10)return'เพิ่งแต่งงาน';
  if(this.E.player.get().age/12>=50||this.E.npcs.ageY(s.spouse)>=50)return'อายุมากเกินไป';if(this.children().length>=6)return'ลูกเยอะพอแล้ว';return''}
 haveChild(){const why=this.canHaveChild();if(why)throw new Error('มีลูกไม่ได้: '+why);const E=this.E,p=E.player.get(),sp=E.npcs.get(this.get().spouse),w=p.location.world,c=E.worlds.ctx(w);
  const surname=(p.gender==='f'?sp:E.npcs.get((this.members('father')[0]||{}).npc)||sp).name.split(' ')[0];
  const n=E.npcs.generate(w,{age:0,surname,role:'ลูก',home:(E.life&&E.life.get().home&&E.life.get().home.loc)||p.location.loc,tags:['family','child']});
  this._add(n.id,'child');E.rels.change(n.id,'player',{aff:70,trust:40,fam:60});E.rels.change('player',n.id,{aff:80,fam:60});
  this._m(s=>{s.lineage.children.push({npc:n.id,born:E.loop.month,parents:['player',s.spouse]})});this.note(`${n.name} ลืมตาดูโลก`);E.bus.emit('family:child',{npc:n.id});return n}
}
AW.systems.FamilySystem=FamilySystem;AW.systems.FAMILY_ROLE_NAME=ROLE_NAME;
AW.systems.FamilyModule={id:'family',deps:['rels'],install(e){e.family=new FamilySystem(e)}};
})(globalThis.AW);
