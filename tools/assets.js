// Asset pipeline tool (Phase 7B.1): node tools/assets.js [--check] [--md out.md] [--json out.json] [--list-src]
// อ่าน registry จริง (manifest + art_meta) และข้อมูลโลก/โค้ด UI เพื่อหาว่าภาพไหนถูกใช้ที่ไหน
// ตรวจ: id/ไฟล์/path ซ้ำ · ไฟล์หาย · ไฟล์ไม่อยู่ใน registry · ขนาด/สัดส่วน · ขนาดไฟล์ · license · ข้อมูล generation · id ที่ถูกอ้างแต่ไม่มีใน registry
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.dirname(__dirname),S=require(path.join(R,'tests/sim.js'));
const LICENSES=['own','cc0','cc-by','craftpix-free','gandalfhardcore','licensed'];
// ---- ขนาดภาพจาก header (ไม่ต้องใช้ไลบรารี) ----
function dims(buf){
 if(buf.length>24&&buf.readUInt32BE(0)===0x89504e47)return{fmt:'png',w:buf.readUInt32BE(16),h:buf.readUInt32BE(20)};
 if(buf.length>30&&buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP'){const c=buf.toString('ascii',12,16);
  if(c==='VP8X')return{fmt:'webp',w:1+buf.readUIntLE(24,3),h:1+buf.readUIntLE(27,3)};
  if(c==='VP8L'){const b=buf.readUInt32LE(21);return{fmt:'webp',w:(b&0x3fff)+1,h:((b>>14)&0x3fff)+1}}
  if(c==='VP8 ')return{fmt:'webp',w:buf.readUInt16LE(26)&0x3fff,h:buf.readUInt16LE(28)&0x3fff}}
 if(buf.length>4&&buf[0]===0xff&&buf[1]===0xd8){let i=2;while(i<buf.length-9){if(buf[i]!==0xff){i++;continue}const m=buf[i+1],len=buf.readUInt16BE(i+2);if(m>=0xc0&&m<=0xcf&&![0xc4,0xc8,0xcc].includes(m))return{fmt:'jpg',h:buf.readUInt16BE(i+5),w:buf.readUInt16BE(i+7)};i+=2+len}}
 return null}
const ratioOf=r=>{const m=/^(\d+):(\d+)$/.exec(r||'');return m?+m[1]/+m[2]:null};
function checkDims(def,d){const s=def.std,sh=def.sheet,cell=def.frame||def.tile;
 // แผ่น sprite/tileset (7B.3): ขนาดไฟล์ต้องเท่ากับ ช่อง x จำนวนคอลัมน์/แถว ใน metadata พอดี
 if(sh&&cell)return d.w===cell.w*sh.cols&&d.h===cell.h*sh.rows?'':`ขนาดแผ่น ${d.w}x${d.h} ไม่ตรง metadata ${cell.w*sh.cols}x${cell.h*sh.rows} (${sh.cols}x${sh.rows} ช่อง ช่องละ ${cell.w}x${cell.h})`;
 if(!s||!s.w)return '';const r=ratioOf(s.ratio);if(r&&Math.abs(d.w/d.h-r)/r>0.01)return `สัดส่วน ${d.w}x${d.h} ไม่ตรง ${s.ratio}`;if(d.w<s.w*0.5||d.h<s.h*0.5)return `เล็กเกินไป ${d.w}x${d.h}`;return ''}
// ---- การใช้งาน: ข้อมูลโลก + โค้ด UI ----
function usage(AW){const use=new Map(),add=(id,w)=>{if(!use.has(id))use.set(id,new Set());use.get(id).add(w)};
 for(const w of AW.data.worlds){const d=w.data||{};
  // side-view areas (7B.3): ฉากหลัง tileset และ sprite ของศัตรู/NPC/ผู้เล่นที่ runtime ใช้
  for(const a of d.areas||[]){const at=`${w.id} areas.${a.id}`;for(const k of a.layers||[])add(w.assetNs+'.'+k,at+'.layers');if(a.tileset)add(w.assetNs+'.'+a.tileset,at+'.tileset');
   for(const s of a.spawns||[])if(s.sprite)add(w.assetNs+'.'+s.sprite,at+'.spawns.'+s.id);
   for(const g of['m','f']){add(AW.sv.SPRITE.player(g),at+'.player');if((a.npcSpots||[]).length)add(AW.sv.SPRITE.npc(w.assetNs,g),at+'.npc')}}
  for(const[k,arr]of Object.entries(d)){if(!Array.isArray(arr))continue;for(const x of arr)for(const f of['bg','asset','icon','portrait'])if(x&&typeof x[f]==='string')add(w.assetNs+'.'+x[f],`${w.id} ${k}.${x.id}.${f}`)}}
 const ui=fs.readdirSync(path.join(R,'src/ui')).filter(f=>f.endsWith('.js'));const ids=new Set(AW.data.assets.map(a=>a.id));
 for(const f of ui){const t=fs.readFileSync(path.join(R,'src/ui',f),'utf8');for(const id of ids){const short=id.split('.').slice(1).join('.');if(t.includes("'"+id+"'")||t.includes("'"+short+"'"))add(id,'UI '+f)}}
 return use}
function load(mutate){const ctx=S.boot();const AW=ctx.AW;if(mutate)mutate(AW);const reg=new AW.core.AssetRegistry();const dup=[];for(const d of AW.data.assets){try{reg.register(d)}catch(e){dup.push(e.message)}}return{AW,reg,dup}}
function inventory({root=R,mutate=null}={}){const{AW,reg,dup}=load(mutate),use=usage(AW),rows=[],errors=[...dup],warns=[];
 const srcSeen=new Map(),pathSeen=new Map(),hashSeen=new Map(),files=new Set();
 const adir=path.join(root,'assets');const walk=d=>fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]):[];
 for(const f of walk(adir))files.add(path.relative(root,f).split(path.sep).join('/'));
 for(const id of use.keys())if(!reg.defs.has(id))errors.push(`${id}: ถูกอ้างใน ${[...use.get(id)].join(', ')} แต่ไม่มีใน registry`);
 for(const d of reg.defs.values()){const u=use.get(d.id);let fileInfo=null;
  for(const f of['type','std','priority','status'])if(d[f]===undefined)errors.push(`${d.id}: ไม่มี metadata ${f}`);
  if(d.path){if(pathSeen.has(d.path))errors.push(`path ซ้ำ: ${d.path} (${pathSeen.get(d.path)}, ${d.id})`);pathSeen.set(d.path,d.id)}
  if(d.src){if(srcSeen.has(d.src))errors.push(`src ซ้ำ: ${d.src} (${srcSeen.get(d.src)}, ${d.id})`);srcSeen.set(d.src,d.id);
   if(!LICENSES.includes(d.license))errors.push(`${d.id}: มี src แต่ license ไม่ถูกต้อง (${d.license})`);
   if(d.license==='own'&&d.source==='generated'&&!(d.gen&&d.gen.prompt&&d.gen.tool&&d.gen.date))errors.push(`${d.id}: ภาพที่สร้างเองต้องมี gen.prompt/tool/date`);
   const fp=path.join(root,d.src);if(!fs.existsSync(fp))errors.push(`${d.id}: ไม่พบไฟล์ ${d.src}`);
   else{const buf=fs.readFileSync(fp),dd=dims(buf),h=crypto.createHash('sha256').update(buf).digest('hex');fileInfo=dd;
    if(hashSeen.has(h))errors.push(`ไฟล์เนื้อหาซ้ำ: ${d.src} = ${hashSeen.get(h)}`);hashSeen.set(h,d.src);
    if(!dd)errors.push(`${d.id}: อ่านขนาดภาพไม่ได้ (ไม่ใช่ PNG/WebP/JPEG)`);else{const why=checkDims(d,dd);if(why)errors.push(`${d.id}: ${why}`)}
    if(d.std&&d.std.maxKB&&buf.length/1024>d.std.maxKB)warns.push(`${d.id}: ไฟล์ ${Math.round(buf.length/1024)}KB เกินแนะนำ ${d.std.maxKB}KB`);files.delete(d.src)}}
  rows.push({id:d.id,type:d.type,world:d.world,current:d.src||'(placeholder)',target:d.path||'(ต้องตัดสินใจ)',ratio:d.std.ratio,size:d.std.w?d.std.w+'x'+d.std.h:'-',alpha:d.std.alpha,priority:d.priority,usage:u?[...u]:[],status:d.status,display:d.w+'x'+d.h,frames:d.frames||1,file:fileInfo})}
 for(const f of files)errors.push(`ไฟล์ ${f} ไม่มีใน registry (ห้ามมีไฟล์ลอย)`);
 return{rows,errors,warns,AW}}
function md(rows){const by={};for(const r of rows)(by[r.priority]=by[r.priority]||[]).push(r);const cnt=k=>(by[k]||[]).length;
 let t=`# Asset inventory (generated by \`node tools/assets.js --md\`)\n\nTotal ${rows.length} assets in the registry: ${rows.filter(r=>r.status==='real').length} real, ${rows.filter(r=>r.status==='planned').length} planned (pilot), ${rows.filter(r=>r.status==='placeholder').length} placeholder.\nPriority: P0 ${cnt('P0')} · P1 ${cnt('P1')} · P2 ${cnt('P2')} · P3 ${cnt('P3')}.\n\n- P0: pilot set (7B.2)\n- P1: already shown by the UI\n- P2: referenced by data, not shown yet\n- P3: needs a decision, or its world does not exist yet\n\nColumns: Current Path = file used now (or placeholder); Target Path = where the final file goes; Required = file to deliver.\n`;
 for(const k of['P0','P1','P2','P3']){t+=`\n## ${k} (${cnt(k)})\n\n| Asset ID | Type | World | Current Path | Target Path | Ratio | Required | Transparent | Usage | Status |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  for(const r of by[k]||[])t+=`| ${r.id} | ${r.type}${r.frames>1?' ('+r.frames+' frames)':''} | ${r.world} | ${r.current} | ${r.target} | ${r.ratio} | ${r.size} | ${r.alpha?'yes':'no'} | ${r.usage.length?r.usage.join('; '):'-'} | ${r.status} |\n`}
 return t}
if(require.main===module){const a=process.argv,{rows,errors,warns}=inventory();
 if(a.includes('--list-src')){console.log(rows.filter(r=>r.current!=='(placeholder)').map(r=>r.current).join('\n'));process.exit(0)}
 const mi=a.indexOf('--md');if(mi>0)fs.writeFileSync(a[mi+1],md(rows));
 const ji=a.indexOf('--json');if(ji>0)fs.writeFileSync(a[ji+1],JSON.stringify(rows.map(({file,...r})=>r),null,1));
 console.log(`assets ${rows.length} · errors ${errors.length} · warnings ${warns.length}`);errors.forEach(e=>console.log('ERROR '+e));warns.forEach(w=>console.log('WARN '+w));
 if(a.includes('--check')&&errors.length)process.exit(1)}
module.exports={inventory,dims,checkDims,md};
