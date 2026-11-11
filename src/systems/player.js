// Player System: ข้อมูลผู้เล่นกลาง ใช้ร่วมทุกโลก (ไม่ใช่ state ของโลกใด)
// slice 'player' เจ้าของ 'player' · ระบบอื่นอ่านด้วย player.get() และเปลี่ยนผ่านเมธอดของระบบนี้เท่านั้น
// อายุคิดจาก global month: age = loop.month - bornAt · เงิน ไอเทม อุปกรณ์ ติดตัวข้ามโลก
// ตำแหน่ง = {world, loc} ตรวจว่ามีจริงทุกครั้งที่เปลี่ยน · ไอเทม/อาชีพ/สกิล ใช้ id แบบ 'โลก.id' และอ่านนิยามจากข้อมูลของโลกนั้น
// ดู docs/phase3/PLAYER_SYSTEM_DESIGN.md
(function(AW){
'use strict';
const OWNER='player',VERSION=2,TRAITS=['brave','kind','dili','loyal'],STATS=['str','agi','int','vit','cha','luk'],AP_PER_MONTH=2;
const blank=()=>({_v:VERSION,created:false,id:'p1',name:'',species:'human',gender:null,bornAt:0,age:0,level:1,exp:0,ranks:{},class:null,
 stats:{str:0,agi:0,int:0,vit:0,cha:0,luk:0},mana:0,hp:0,injury:0,skills:[],inventory:{},equipment:{weapon:null,armor:null},
 money:0,reputation:0,location:{world:null,loc:null},flags:{},ap:0,karma:0,traits:{brave:0,kind:0,dili:0,loyal:0},alive:true,death:null});
// migrations[v]: แปลง player state จาก v ไป v+1
// v1->v2 (Phase 4): เพิ่ม karma, traits, alive/death · relations ย้ายไป Relationship System (เก็บไว้ที่ legacyRelations ให้ระบบนั้นรับต่อ)
const MIGRATIONS={1:(s,sys)=>{sys.legacyRelations=s.relations||{};delete s.relations;s.karma=0;s.traits={brave:0,kind:0,dili:0,loyal:0};s.alive=true;s.death=null}};
class PlayerSystem{
 constructor(E){this.E=E;E.state.register('player',OWNER,blank);
  E.bus.on('month',()=>this._month(),{prio:40,owner:OWNER});
  E.bus.on('world:enter',({world})=>{const c=E.worlds.ctx(world);if(this.get().created&&c)this.setLocation(world,c.def.entry)},{prio:50,owner:OWNER});
  E.bus.on('game:loaded',()=>this._afterLoad(),{prio:90,owner:OWNER})}
 get(){return this.E.state.get('player')}
 _m(fn){return this.E.state.mutate(OWNER,'player',fn)}
 // ---- นิยามจากโลก ----
 _def(kind,q){if(typeof q!=='string'||!q.includes('.'))return null;const[w,id]=q.split('.');const c=this.E.worlds.ctx(w);return c?c.list(kind).get(id)||null:null}
 item(q){return this._def('items',q)} cls(q){return this._def('classes',q)} skill(q){return this._def('skills',q)} npc(q){return this._def('npcs',q)}
 itemName(q){const d=this.item(q);return d?d.name:q} className(q){const d=this.cls(q);return d?d.name:q} skillName(q){const d=this.skill(q);return d?d.name:q} npcName(q){const n=this.E.npcs&&this.E.npcs.get(q);if(n)return n.name;const d=this.npc(q);return d?d.name:q}
 // ---- สร้าง ----
 create({name='ผู้เล่น',gender=null,startAge=15,stats={},money=0,species='human'}={}){const E=this.E,w=E.worlds.current,c=w&&E.worlds.ctx(w);
  if(!c)throw new Error('ต้องเข้าโลกก่อนสร้างผู้เล่น');const p=blank();
  Object.assign(p,{created:true,name:String(name).slice(0,24)||'ผู้เล่น',gender,species,bornAt:E.loop.month-startAge*12,age:startAge*12,money,location:{world:w,loc:c.def.entry},ap:AP_PER_MONTH});
  for(const k of STATS)p.stats[k]=Math.max(0,Math.round(stats[k]||0));p.hp=this.maxHp(p);
  this._m(s=>Object.assign(s,p));E.bus.emit('player:created',{name:p.name});return this.get()}
 // ---- ค่าที่คำนวณ ----
 age(){return this.get().age}
 maxHp(p=this.get()){const a=p.equipment.armor&&this.item(p.equipment.armor);return 50+p.stats.vit*5+p.level*5+(a&&a.hp||0)}
 expNeed(level=this.get().level){return Math.floor(60*Math.pow(level,1.45))}
 // ---- เปลี่ยนค่า (ทุกอย่างผ่าน mutate ของเจ้าของ) ----
 addMoney(n){if(this.get().money+n<0)throw new Error('เงินไม่พอ');this._m(p=>{p.money+=n})}
 addRep(n){this._m(p=>{p.reputation+=n})}
 addMana(n){this._m(p=>{p.mana=Math.max(0,p.mana+n)})}
 addStats(d){for(const k of Object.keys(d))if(!STATS.includes(k))throw new Error('ไม่มีค่าสถานะ '+k);this._m(p=>{for(const k of Object.keys(d))p.stats[k]=Math.max(0,p.stats[k]+d[k])});this._clampHp()}
 addHp(n){const mx=this.maxHp();this._m(p=>{p.hp=Math.max(1,Math.min(mx,p.hp+n))})}
 cure(){this._m(p=>{p.injury=0})}
 injure(months){this._m(p=>{p.injury=Math.max(p.injury,months)})}
 _clampHp(){const mx=this.maxHp();this._m(p=>{p.hp=Math.min(p.hp,mx)})}
 // เลเวลอัป: ค่าหลักของอาชีพ +2 ค่าอื่นแบบสุ่ม +1 (ใช้ rng ของเกม)
 addExp(n){const cls=this.cls(this.get().class);let ups=0;this._m(p=>{p.exp+=Math.round(n);while(p.exp>=this.expNeed(p.level)){p.exp-=this.expNeed(p.level);p.level++;ups++;
   if(cls)p.stats[cls.main]+=2;p.stats[STATS[this.E.rng.int(0,3)]]+=1}});if(ups)this._m(p=>{p.hp=this.maxHp(p)});return ups}
 addItem(q,n=1){if(!this.item(q))throw new Error('ไม่มีไอเทม '+q);this._m(p=>{p.inventory[q]=(p.inventory[q]||0)+n})}
 removeItem(q,n=1){const have=this.get().inventory[q]||0;if(have<n)throw new Error('ไอเทมไม่พอ: '+q);
  this._m(p=>{p.inventory[q]=have-n;if(!p.inventory[q]){delete p.inventory[q];for(const s of Object.keys(p.equipment))if(p.equipment[s]===q)p.equipment[s]=null}});this._clampHp()}
 equip(q){const d=this.item(q);if(!d||!['weapon','armor'].includes(d.slot))throw new Error('สวมใส่ไม่ได้: '+q);if(!this.get().inventory[q])throw new Error('ไม่มีของชิ้นนี้');this._m(p=>{p.equipment[d.slot]=q})}
 unequip(slot){this._m(p=>{p.equipment[slot]=null});this._clampHp()}
 setClass(q){const c=this.cls(q);if(!c)throw new Error('ไม่มีอาชีพ '+q);if(this.get().class)throw new Error('มีอาชีพแล้ว');
  this._m(p=>{p.class=q;for(const k of Object.keys(c.bonus||{}))p.stats[k]+=c.bonus[k];if(c.skill&&!p.skills.includes(c.skill))p.skills.push(c.skill)});const p=this.get();this._m(s=>{s.hp=this.maxHp(p)})}
 addSkill(q){if(!this.skill(q))throw new Error('ไม่มีสกิล '+q);this._m(p=>{if(!p.skills.includes(q))p.skills.push(q)})}
 setRank(sys,r){this._m(p=>{p.ranks[sys]=r})}
 addKarma(n){this._m(p=>{p.karma=Math.max(-100,Math.min(100,p.karma+n))})}
 addTraits(d){for(const k of Object.keys(d))if(!TRAITS.includes(k))throw new Error('ไม่มีนิสัย '+k);this._m(p=>{for(const k of Object.keys(d))p.traits[k]=Math.max(-100,Math.min(100,p.traits[k]+d[k]))})}
 // ตาย: หยุดชีวิต (ไม่ลบข้อมูล) Health System เป็นผู้เรียกและบันทึกประวัติชีวิต
 die(cause){this._m(p=>{p.alive=false;p.ap=0;p.death={cause,month:this.E.loop.month,age:p.age}})}
 setFlag(f,on){this._m(p=>{if(on)p.flags[f]=true;else delete p.flags[f]})}
 spendAp(n=1){if(this.get().ap<n)throw new Error('แรงไม่พอเดือนนี้ (AP)');this._m(p=>{p.ap-=n})}
 // ---- ตำแหน่ง ----
 validLocation(world,loc){const c=this.E.worlds.ctx(world);return!!(c&&c.locations.has(loc))}
 setLocation(world,loc){if(!this.validLocation(world,loc))throw new Error(`ไม่มีสถานที่ ${world}/${loc}`);this._m(p=>{p.location={world,loc}});this.E.bus.emit('player:moved',{world,loc})}
 // ย้ายในโลกปัจจุบัน ตรวจเงื่อนไขของสถานที่ (when) ด้วย Rules
 canEnter(loc){const p=this.get(),c=this.E.worlds.ctx(p.location.world),l=c&&c.locations.get(loc);if(!l)return false;return AW.systems.Rules.check(l.when,this.E.view(c.id))}
 moveTo(loc,{force=false}={}){const p=this.get();if(!p.alive)throw new Error('เสียชีวิตแล้ว');if(this.E.time.state.get('worlds_time').traveling)throw new Error('กำลังเดินทาง');
  if(!this.validLocation(p.location.world,loc))throw new Error('ไม่มีสถานที่ '+loc);if(!force&&!this.canEnter(loc))throw new Error('ยังเข้าไม่ได้: '+loc);this.setLocation(p.location.world,loc)}
 // ---- รายเดือน ----
 _month(){const p=this.get();if(!p.created||!p.alive)return;const mx=this.maxHp(p);
  this._m(s=>{s.age=this.E.loop.month-s.bornAt;s.ap=AP_PER_MONTH;if(s.injury>0)s.injury--;s.hp=Math.min(mx,s.hp+Math.ceil(mx*(s.injury?0.1:0.35)))})}
 // ---- หลังโหลด: migrate, ซ่อมข้อมูลที่ขาด, ตรวจตำแหน่ง ----
 _afterLoad(){const E=this.E;let p=this.get();
  this.legacyRelations=null;if((p._v||1)<VERSION)this._m(s=>{let v=s._v||1;while(v<VERSION){MIGRATIONS[v](s,this);v++}s._v=VERSION});
  const cur=E.worlds.current;
  // เซฟเก่า (Phase 2) ไม่มีผู้เล่น: สร้างผู้เล่นที่อายุ 15 ตอนเดือน 0 (ค่าสถานะ 10 ทุกด้าน) อยู่ที่จุดเริ่มของโลกปัจจุบัน
  if(!p.created&&cur&&E.worlds.has(cur)){this._m(s=>{s.created=true;s.name='ผู้เล่น';s.bornAt=-180;s.ap=AP_PER_MONTH;for(const k of STATS)s.stats[k]=10;s.flags.fromOldSave=true});this._m(s=>{s.hp=this.maxHp(s)})}
  this._m(s=>{s.age=E.loop.month-s.bornAt});p=this.get();
  const w=p.location.world||cur;
  if(p.created&&w&&E.worlds.has(w)&&!this.validLocation(w,p.location.loc)){const c=E.worlds.ctx(w);E.debug&&E.debug.log(`ตำแหน่ง ${w}/${p.location.loc} ไม่มีอยู่ ย้ายไปจุดเริ่ม ${c.def.entry}`);this._m(s=>{s.location={world:w,loc:c.def.entry}})}}
}
AW.systems.PlayerSystem=PlayerSystem;AW.systems.TRAITS=TRAITS;
AW.systems.PlayerModule={id:'player',deps:['worlds'],install(e){e.player=new PlayerSystem(e)}};
})(globalThis.AW);
