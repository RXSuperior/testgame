// Party System: ทีมของผู้เล่นจาก NPC ที่มีอยู่แล้ว (ทุกคนใช้กติกาเดียวกัน ไม่มีโค้ดเฉพาะตัวละคร)
// ความสามารถต่อสู้ของ NPC มาจากข้อมูลอาชีพ (job.combat: role/base/share) หรือ npc.combat ในข้อมูลโลก
// เข้าทีมได้เมื่อ: มีชีวิต อยู่โลกเดียวกัน อายุ 18+ ต่อสู้ได้ ไม่บาดเจ็บ และ (ชอบ 30+ ไว้ใจ 10+ หรือมี flag 'party' จากเนื้อเรื่อง)
// บทบาท tank/damage/support มีผลจริงทั้ง auto และ manual · synergy จากบทบาทและความสัมพันธ์ระหว่างสมาชิก
// NPC ในทีมบาดเจ็บ/หมดสภาพได้ แต่ไม่ตายจากการสุ่ม (ตายได้เฉพาะผล npcKill ในเหตุการณ์ที่กำหนด)
// slice 'party' เจ้าของ 'party' · ดู docs/phase5/PARTY_SYSTEM_DESIGN.md
(function(AW){
'use strict';
const OWNER='party',VERSION=1,ROLES=['tank','damage','support'],ROLE_NAME={tank:'แนวหน้า (Tank)',damage:'ผู้สร้างความเสียหาย',support:'ผู้สนับสนุน'};
class PartySystem{
 constructor(E){this.E=E;E.state.register(OWNER,OWNER,()=>({_v:VERSION,members:[],max:3,history:[]}));
  E.bus.on('month',()=>this._month(),{prio:20,owner:OWNER});
  E.bus.on('npc:died',({id})=>{if(this.isMember(id))this.leave(id,'จากไปแล้ว')},{prio:0,owner:OWNER});
  E.bus.on('game:loaded',()=>this._afterLoad(),{prio:60,owner:OWNER})}
 get(){return this.E.state.get(OWNER)}
 _m(fn){return this.E.state.mutate(OWNER,OWNER,fn)}
 note(t){const m=this.E.loop.month;this._m(s=>{s.history.unshift({m,t});if(s.history.length>30)s.history.length=30})}
 roleName(r){return ROLE_NAME[r]||r}
 isMember(q){return this.get().members.some(m=>m.npc===q)}
 // ความสามารถต่อสู้ของ NPC (null = ต่อสู้ไม่ได้) · npc_hunter ที่ไม่ได้กำหนดบทบาท ใช้ hash ของ id เลือกบทบาท (คงที่)
 combatOf(q){const n=this.E.npcs.get(q);if(!n)return null;const c=this.E.worlds.ctx(n.world);if(!c)return null;const def=c.list('npcs').get(q.split('.')[1]),job=n.occupation&&c.list('jobs').get(n.occupation);
  const cb=n.combat||(def&&def.combat)||(job&&job.combat)||(n.flags.hunter&&(c.list('jobs').get('npc_hunter')||{}).combat)||null;if(!cb)return null;
  return{role:cb.role||ROLES[Math.floor(AW.systems.h01(q+'|role')*3)],base:cb.base||50,share:cb.share??0.15}}
 // พลังสมาชิก: ฐาน x ประสบการณ์ในทีม x ช่วงอายุ x ขวัญกำลังใจ (ความชอบต่อผู้เล่น)
 power(q){const cb=this.combatOf(q),n=this.E.npcs.get(q),mem=this.get().members.find(m=>m.npc===q);if(!cb||!n)return 0;const a=this.E.npcs.ageY(q),e=this.E.rels.edge(q,'player');
  const ageF=a<20?0.8:a<=40?1:a<=55?0.9:0.7,morale=0.8+Math.max(0,Math.min(100,e?e.aff:0))/250,exp=1+0.05*Math.min(40,mem?mem.missions:0);return Math.round(cb.base*exp*ageF*morale)}
 canInvite(q){const n=this.E.npcs.get(q),p=this.E.player.get(),s=this.get();if(!n||!n.alive)return'ไม่มีคนนี้';if(!p.class)return'ผู้เล่นยังไม่ตื่นพลัง';if(this.isMember(q))return'อยู่ในทีมแล้ว';
  if(s.members.length>=s.max)return`ทีมเต็ม (${s.max} คน)`;if(n.world!==p.location.world)return'อยู่คนละโลก';if(this.E.npcs.ageY(q)<18)return'อายุยังไม่ถึง';if(!this.combatOf(q))return'ไม่ใช่สายต่อสู้';
  const e=this.E.rels.edge(q,'player');if(!n.flags.party&&!(e&&e.aff>=30&&e.trust>=10))return'ยังไม่สนิทหรือไม่ไว้ใจพอ (ชอบ 30 ไว้ใจ 10)';return''}
 invite(q){const why=this.canInvite(q);if(why)throw new Error(why);const cb=this.combatOf(q);
  this._m(s=>{s.members.push({npc:q,role:cb.role,joined:this.E.loop.month,injury:0,missions:0,earned:0})});this.E.npcs.remember(q,'เข้าร่วมทีมของผู้เล่น','party');
  this.note(`${this.E.npcs.get(q).name} เข้าร่วมทีม (${this.roleName(cb.role)})`);this.E.bus.emit('party:joined',{npc:q});return true}
 leave(q,reason='ออกจากทีม'){if(!this.isMember(q))return false;this._m(s=>{s.members=s.members.filter(m=>m.npc!==q)});const n=this.E.npcs.get(q);
  this.note(`${n?n.name:q} ออกจากทีม (${reason})`);if(n&&n.alive)this.E.npcs.remember(q,'ออกจากทีม: '+reason,'party');this.E.bus.emit('party:left',{npc:q,reason});return true}
 // ทีมที่พร้อมรบในโลกนี้ (ไม่รวมคนบาดเจ็บ/อยู่โลกอื่น) พร้อม synergy
 team(worldId){const s=this.get(),ready=s.members.filter(m=>m.injury<=0&&(this.E.npcs.get(m.npc)||{}).alive&&(this.E.npcs.get(m.npc)||{}).world===worldId);
  const roles=new Set(ready.map(m=>m.role));let syn=1;if(roles.size===3)syn=1.15;else if(roles.has('tank')&&roles.has('support'))syn=1.1;else if(ready.filter(m=>m.role==='damage').length>=2)syn=1.05;
  const pairs=[];for(const a of ready)for(const b of ready)if(a!==b)pairs.push(this.E.rels.type(a.npc,b.npc));if(pairs.some(t=>t==='rival'||t==='enemy'))syn-=0.1;else if(pairs.length&&pairs.every(t=>t&&!['acquaintance'].includes(t)))syn+=0.05;
  const members=ready.map(m=>({npc:m.npc,name:this.E.npcs.get(m.npc).name,role:m.role,power:this.power(m.npc)}));
  return{members,power:Math.round(members.reduce((a,m)=>a+m.power,0)*0.6*syn),synergy:Math.round(syn*100)/100,tankFactor:(roles.has('tank')?0.8:1)*(roles.has('support')?0.9:1)}}
 conflict(){const ms=this.get().members;for(const a of ms)for(const b of ms)if(a!==b&&['rival','enemy'].includes(this.E.rels.type(a.npc,b.npc)))return[a.npc,b.npc];return null}
 // ผลการต่อสู้: บาดเจ็บของสมาชิก + นับประสบการณ์เมื่อชนะ
 applyResult(rep){const inj={};for(const x of rep.party||[])inj[x.npc]=x.injury||0;if(!Object.keys(inj).length)return;
  this._m(s=>{for(const m of s.members)if(m.npc in inj){m.injury=Math.max(m.injury,inj[m.npc]);if(rep.win)m.missions++}});
  for(const q of Object.keys(inj))if(inj[q]>=2&&this.E.npcs.get(q))this.E.npcs.remember(q,`บาดเจ็บหนักในการต่อสู้กับ${rep.enemyName}`,'injury')}
 // แบ่งรางวัลเงินตามสัดส่วนของแต่ละคน (ไม่ทำให้เงินผู้เล่นติดลบ) · ได้ส่วนแบ่ง = ชอบผู้เล่นขึ้นเล็กน้อย
 payShares(gain,label){const P=this.E.player,team=this.get().members.filter(m=>m.injury<=0);let paid=0;
  for(const m of team){const cb=this.combatOf(m.npc);if(!cb)continue;const amt=Math.min(Math.round(gain*cb.share),P.get().money);if(amt<=0)continue;P.addMoney(-amt);paid+=amt;
   this._m(s=>{const x=s.members.find(y=>y.npc===m.npc);x.earned+=amt});this.E.rels.change(m.npc,'player',{aff:1,trust:1},`ได้ส่วนแบ่งจาก${label}`)}return paid}
 _month(){const s=this.get();if(!s.members.length)return;const leave=[];
  this._m(x=>{for(const m of x.members)if(m.injury>0)m.injury--});
  for(const m of this.get().members){const e=this.E.rels.edge(m.npc,'player');if(e&&e.aff<0)leave.push([m.npc,'ไม่พอใจผู้เล่น'])}
  for(const[q,r]of leave)this.leave(q,r)}
 _afterLoad(){const bad=this.get().members.filter(m=>{const n=this.E.npcs.get(m.npc);return!n||!n.alive||!this.combatOf(m.npc)&&this.E.worlds.has(m.npc.split('.')[0])});
  if(bad.length){const ids=bad.map(m=>m.npc);this._m(s=>{s.members=s.members.filter(m=>!ids.includes(m.npc))});this.E.debug&&this.E.debug.log(`ตัดสมาชิกทีมที่อ้าง NPC ไม่มีอยู่ ${bad.length} คน`)}}
}
AW.systems.PartySystem=PartySystem;AW.systems.PARTY_ROLES=ROLES;
AW.systems.PartyModule={id:'party',deps:['rels'],install(e){e.party=new PartySystem(e)}};
})(globalThis.AW);
