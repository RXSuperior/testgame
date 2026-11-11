// Rules: ตัวตรวจเงื่อนไขและตัวใช้ผลลัพธ์แบบข้อมูลล้วน (ไม่มี eval ไม่มีฟังก์ชันในข้อมูล)
// ใช้ร่วมกันโดย Event System, Mission System, การย้ายสถานที่ และเกณฑ์แรงก์
// id ที่ไม่มีจุดถือว่าอยู่ในโลกของข้อมูลนั้น: 'iron_dagger' ในโลก hunter = 'hunter.iron_dagger'
// ดู docs/phase3/STORY_EVENT_SYSTEM.md
(function(AW){
'use strict';
const qid=(id,world)=>typeof id==='string'&&id.includes('.')?id:world+'.'+id;
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const inRange=(v,r)=>(r.min===undefined||v>=r.min)&&(r.max===undefined||v<=r.max);
const rangeOk=r=>isObj(r)&&Object.keys(r).every(k=>(k==='min'||k==='max')&&typeof r[k]==='number');
const STATS=['str','agi','int','vit','cha','luk'];
const list=v=>Array.isArray(v)?v:[v];

// ---- เงื่อนไข ----
// v = view: {player, world (ctx ของโลกเจ้าของข้อมูล), worldId, ranks, events, missions, rng}
const COND={
 all:{ok:(c,v)=>c.every(x=>check(x,v)),val:c=>Array.isArray(c)?c.flatMap(validateCond):['all ต้องเป็น array']},
 any:{ok:(c,v)=>c.some(x=>check(x,v)),val:c=>Array.isArray(c)?c.flatMap(validateCond):['any ต้องเป็น array']},
 not:{ok:(c,v)=>!check(c,v),val:c=>validateCond(c)},
 age:{ok:(c,v)=>inRange(v.player.age/12,c),val:c=>rangeOk(c)?[]:['age ต้องเป็น {min,max} (ปี)']},
 awakened:{ok:(c,v)=>!!v.player.class===c,val:c=>typeof c==='boolean'?[]:['awakened ต้องเป็น true/false']},
 class:{ok:(c,v)=>list(c).map(x=>qid(x,v.worldId)).includes(v.player.class),val:c=>list(c).every(x=>typeof x==='string')?[]:['class ต้องเป็นข้อความ']},
 rank:{ok:(c,v)=>{const sys=c.sys||v.rankSys,r=v.player.ranks[sys]||null;if(c.is!==undefined)return(c.is===null?r===null:r===c.is);if(r===null)return false;const i=v.ranks.index(sys,r);
   return(c.min===undefined||i>=v.ranks.index(sys,c.min))&&(c.max===undefined||i<=v.ranks.index(sys,c.max))},
  val:c=>isObj(c)&&Object.keys(c).every(k=>['sys','min','max','is'].includes(k))?[]:['rank ต้องเป็น {sys,min,max,is}']},
 level:{ok:(c,v)=>inRange(v.player.level,c),val:c=>rangeOk(c)?[]:['level ต้องเป็น {min,max}']},
 stat:{ok:(c,v)=>Object.keys(c).every(k=>inRange(v.player.stats[k],c[k])),val:c=>isObj(c)&&Object.keys(c).every(k=>STATS.includes(k)&&rangeOk(c[k]))?[]:['stat ต้องเป็น {str:{min}}']},
 statTotal:{ok:(c,v)=>inRange(STATS.reduce((a,k)=>a+v.player.stats[k],0),c),val:c=>rangeOk(c)?[]:['statTotal ต้องเป็น {min,max}']},
 mana:{ok:(c,v)=>inRange(v.player.mana,c),val:c=>rangeOk(c)?[]:['mana ต้องเป็น {min,max}']},
 money:{ok:(c,v)=>inRange(v.player.money,c),val:c=>rangeOk(c)?[]:['money ต้องเป็น {min,max}']},
 ap:{ok:(c,v)=>inRange(v.player.ap,c),val:c=>rangeOk(c)?[]:['ap ต้องเป็น {min,max}']},
 item:{ok:(c,v)=>(v.player.inventory[qid(c.id,v.worldId)]||0)>=(c.min??1),val:c=>isObj(c)&&typeof c.id==='string'?[]:['item ต้องเป็น {id,min}']},
 location:{ok:(c,v)=>v.player.location.world===v.worldId&&list(c).includes(v.player.location.loc),val:c=>list(c).every(x=>typeof x==='string')?[]:['location ต้องเป็นข้อความ']},
 world:{ok:(c,v)=>v.player.location.world===c,val:c=>typeof c==='string'?[]:['world ต้องเป็นข้อความ']},
 rel:{ok:(c,v)=>inRange(v.player.relations[qid(c.npc,v.worldId)]||0,c),val:c=>isObj(c)&&typeof c.npc==='string'&&['min','max'].every(k=>c[k]===undefined||typeof c[k]==='number')?[]:['rel ต้องเป็น {npc,min,max}']},
 flag:{ok:(c,v)=>list(c).every(f=>v.player.flags[f]),val:c=>list(c).every(x=>typeof x==='string')?[]:['flag ต้องเป็นข้อความ']},
 notFlag:{ok:(c,v)=>list(c).every(f=>!v.player.flags[f]),val:c=>list(c).every(x=>typeof x==='string')?[]:['notFlag ต้องเป็นข้อความ']},
 worldFlag:{ok:(c,v)=>list(c).every(f=>v.world&&(v.world.get().flags||{})[f]),val:c=>list(c).every(x=>typeof x==='string')?[]:['worldFlag ต้องเป็นข้อความ']},
 notWorldFlag:{ok:(c,v)=>list(c).every(f=>!(v.world&&(v.world.get().flags||{})[f])),val:c=>list(c).every(x=>typeof x==='string')?[]:['notWorldFlag ต้องเป็นข้อความ']},
 done:{ok:(c,v)=>list(c).every(e=>(v.events.done[qid(e,v.worldId)]||0)>0),val:c=>list(c).every(x=>typeof x==='string')?[]:['done ต้องเป็นข้อความ']},
 notDone:{ok:(c,v)=>list(c).every(e=>!(v.events.done[qid(e,v.worldId)]||0)),val:c=>list(c).every(x=>typeof x==='string')?[]:['notDone ต้องเป็นข้อความ']},
 missions:{ok:(c,v)=>inRange(v.missions.byTag[c.tag]||0,c),val:c=>isObj(c)&&typeof c.tag==='string'?[]:['missions ต้องเป็น {tag,min}']},
 canPromote:{ok:(c,v)=>!!v.ranks.canPromote(c===true?v.rankSys:c,v),val:c=>typeof c==='string'||c===true?[]:['canPromote ต้องเป็นชื่อระบบแรงก์']},
 injured:{ok:(c,v)=>(v.player.injury>0)===c,val:c=>typeof c==='boolean'?[]:['injured ต้องเป็น true/false']},
 chance:{ok:(c,v)=>v.rng.next()<c,val:c=>typeof c==='number'&&c>=0&&c<=1?[]:['chance ต้องเป็น 0..1']},
};
function validateCond(c){if(c===undefined||c===null)return[];if(!isObj(c))return['เงื่อนไขต้องเป็น object'];const e=[];
 for(const k of Object.keys(c)){const d=COND[k];if(!d)e.push('ไม่รู้จักเงื่อนไข "'+k+'"');else e.push(...d.val(c[k]))}return e}
function check(c,v){if(!c)return true;for(const k of Object.keys(c)){if(!COND[k].ok(c[k],v))return false}return true}

// ---- ผลลัพธ์ ----
// แต่ละผลเป็น object คีย์เดียว เช่น {money:100} · apply คืนข้อความสรุปให้ผู้เล่นอ่าน
const P=v=>v.P;
const EFF={
 money:{run:(x,v)=>{P(v).addMoney(x);return`เงิน ${x>0?'+':''}${x}`},val:x=>typeof x==='number'?[]:['money ต้องเป็นตัวเลข']},
 exp:{run:(x,v)=>{const up=P(v).addExp(x);return`EXP +${x}`+(up?` · เลเวลอัป ${up} ขั้น`:'')},val:x=>typeof x==='number'&&x>=0?[]:['exp ต้องเป็นตัวเลข >= 0']},
 stat:{run:(x,v)=>{P(v).addStats(x);return Object.keys(x).map(k=>`${AW.systems.STAT_NAME[k]} ${x[k]>0?'+':''}${x[k]}`).join(' ')},val:x=>isObj(x)&&Object.keys(x).every(k=>STATS.includes(k)&&typeof x[k]==='number')?[]:['stat ต้องเป็น {str:1}']},
 mana:{run:(x,v)=>{P(v).addMana(x);return`มานา ${x>0?'+':''}${x}`},val:x=>typeof x==='number'?[]:['mana ต้องเป็นตัวเลข']},
 hp:{run:(x,v)=>{P(v).addHp(x);return`พลังชีวิต ${x>0?'+':''}${x}`},val:x=>typeof x==='number'?[]:['hp ต้องเป็นตัวเลข']},
 cure:{run:(x,v)=>{P(v).cure();return'แผลหายสนิท'},val:x=>x===true?[]:['cure ต้องเป็น true']},
 injury:{run:(x,v)=>{P(v).injure(x);return`บาดเจ็บ ${x} เดือน`},val:x=>Number.isInteger(x)&&x>=0?[]:['injury ต้องเป็นจำนวนเต็ม']},
 item:{run:(x,v)=>{const id=qid(x.id,v.worldId),n=x.n??1;n>=0?P(v).addItem(id,n):P(v).removeItem(id,-n);return`${P(v).itemName(id)} ${n>0?'+':''}${n}`},val:x=>isObj(x)&&typeof x.id==='string'&&(x.n===undefined||Number.isInteger(x.n))?[]:['item ต้องเป็น {id,n}']},
 equip:{run:(x,v)=>{P(v).equip(qid(x,v.worldId));return`สวมใส่ ${P(v).itemName(qid(x,v.worldId))}`},val:x=>typeof x==='string'?[]:['equip ต้องเป็นข้อความ']},
 flag:{run:(x,v)=>{P(v).setFlag(x,true);return null},val:x=>typeof x==='string'?[]:['flag ต้องเป็นข้อความ']},
 unflag:{run:(x,v)=>{P(v).setFlag(x,false);return null},val:x=>typeof x==='string'?[]:['unflag ต้องเป็นข้อความ']},
 worldFlag:{run:(x,v)=>{v.world.mutate(s=>{s.flags=s.flags||{};s.flags[x]=true});return null},val:x=>typeof x==='string'?[]:['worldFlag ต้องเป็นข้อความ']},
 rel:{run:(x,v)=>{const id=qid(x.npc,v.worldId);P(v).addRel(id,x.n);return`ความสัมพันธ์กับ${P(v).npcName(id)} ${x.n>0?'+':''}${x.n}`},val:x=>isObj(x)&&typeof x.npc==='string'&&typeof x.n==='number'?[]:['rel ต้องเป็น {npc,n}']},
 reputation:{run:(x,v)=>{P(v).addRep(x);return`ชื่อเสียง ${x>0?'+':''}${x}`},val:x=>typeof x==='number'?[]:['reputation ต้องเป็นตัวเลข']},
 class:{run:(x,v)=>{const id=qid(x,v.worldId);P(v).setClass(id);return`ได้รับอาชีพ ${P(v).className(id)}`},val:x=>typeof x==='string'?[]:['class ต้องเป็นข้อความ']},
 skill:{run:(x,v)=>{const id=qid(x,v.worldId);P(v).addSkill(id);return`ได้สกิล ${P(v).skillName(id)}`},val:x=>typeof x==='string'?[]:['skill ต้องเป็นข้อความ']},
 rankInit:{run:(x,v)=>{const r=v.ranks.init(x===true?v.rankSys:x,v);return`ประเมินแรงก์: ${r}`},val:x=>typeof x==='string'||x===true?[]:['rankInit ต้องเป็นชื่อระบบแรงก์']},
 rankUp:{run:(x,v)=>{const r=v.ranks.promote(x===true?v.rankSys:x,v);return r?`เลื่อนเป็นแรงก์ ${r}`:'ยังไม่ผ่านเกณฑ์เลื่อนแรงก์'},val:x=>typeof x==='string'||x===true?[]:['rankUp ต้องเป็นชื่อระบบแรงก์']},
 unlock:{run:(x,v)=>{v.eventsApi.unlock(qid(x,v.worldId));return null},val:x=>typeof x==='string'?[]:['unlock ต้องเป็นข้อความ']},
 move:{run:(x,v)=>{P(v).moveTo(x,{force:true});return`ย้ายไป ${v.world.locations.get(x).name}`},val:x=>typeof x==='string'?[]:['move ต้องเป็นข้อความ']},
 log:{run:x=>x,val:x=>typeof x==='string'?[]:['log ต้องเป็นข้อความ']},
};
function validateEffects(list){if(list===undefined)return[];if(!Array.isArray(list))return['effects ต้องเป็น array'];const e=[];
 for(const x of list){if(!isObj(x)||Object.keys(x).length!==1){e.push('effect ต้องเป็น object คีย์เดียว');continue}const k=Object.keys(x)[0];if(!EFF[k])e.push('ไม่รู้จักผล "'+k+'"');else e.push(...EFF[k].val(x[k]))}return e}
function apply(list,v){const out=[];for(const x of list||[]){const k=Object.keys(x)[0],r=EFF[k].run(x[k],v);if(r)out.push(r)}return out}
// ตรวจว่าผลที่ทำให้เสียของ (เงิน/ไอเทม) จ่ายไหวไหมก่อนใช้
function affordable(list,v){let m=0;const need={};for(const x of list||[]){if(x.money<0)m-=x.money;if(x.item&&(x.item.n??1)<0){const id=qid(x.item.id,v.worldId);need[id]=(need[id]||0)-x.item.n}}
 if(v.player.money<m)return false;return Object.keys(need).every(id=>(v.player.inventory[id]||0)>=need[id])}
AW.systems.Rules={check,validateCond,apply,validateEffects,affordable,qid,COND,EFF,STATS};
AW.systems.STAT_NAME={str:'กาย',agi:'ความเร็ว',int:'ปัญญา',vit:'ความอึด',cha:'เสน่ห์',luk:'โชค'};
})(globalThis.AW);
