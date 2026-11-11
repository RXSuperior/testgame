// สมดุลหลายเส้นทาง: node tests/balance.js [รอบต่อสไตล์]
// เล่นตั้งแต่อายุ 15 ถึง 30 (180 เดือน) ด้วยบอทแต่ละสไตล์ แล้วสรุปค่าเฉลี่ย
const S=require('./sim.js');const ctx=S.boot();
const styles=['mission','solo','party','trainer','worker','dungeon'],n=+process.argv[2]||6,rows=[];
const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10:'-';
for(const st of styles){const rs=[];for(let i=0;i<n;i++)rs.push(S.play(ctx,'bal'+i,st,180));const c=rs.filter(r=>'CBAS'.includes(r.rank)&&r.rank!=='-');
 rows.push({style:st,'ถึง C':`${c.length}/${n}`,'อายุถึง C':avg(c.map(r=>r.marks.C||0)),'ถึง B':rs.filter(r=>'BAS'.includes(r.rank)&&r.rank!=='-').length,lv:avg(rs.map(r=>r.level)),money:avg(rs.map(r=>r.money)),status:avg(rs.map(r=>r.status)),
  skillLv:avg(rs.map(r=>r.skillLv)),party:avg(rs.map(r=>r.party)),dungeon:avg(rs.map(r=>r.dungeons)),tower:avg(rs.map(r=>r.tower)),dead:rs.filter(r=>r.dead).length,errors:rs.reduce((a,r)=>a+r.errs.length,0)})}
console.table(rows);module.exports=rows;
