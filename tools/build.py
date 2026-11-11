"""รวมไฟล์เป็น dist/index.html ไฟล์เดียว (ไม่คัดลอกภาพของบุคคลที่สาม)
ลำดับไฟล์อยู่ใน ORDER เท่านั้น ตรวจ syntax ทุกไฟล์ด้วย node ก่อนรวม"""
import subprocess,sys,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDER=['src/core/ns.js','src/core/rng.js','src/core/bus.js','src/core/state.js','src/core/loop.js','src/core/worldtime.js','src/core/save.js','src/core/registry.js','src/core/assets.js','src/core/debug.js','src/core/engine.js','src/systems/worlds.js','data/assets/manifest.js','data/worlds/index.js','data/worlds/hunter.js','data/worlds/fantasy.js','src/ui/shell.js']
for f in ORDER:
    r=subprocess.run(['node','--check',os.path.join(R,f)],capture_output=True,text=True)
    if r.returncode:print('SYNTAX ERROR',f,r.stderr);sys.exit(1)
bundle='\n'.join(f'// ==== {f} ====\n'+open(os.path.join(R,f)).read() for f in ORDER)
t=open(os.path.join(R,'src/template.html')).read().replace('/*BUNDLE*/',bundle)
os.makedirs(os.path.join(R,'dist'),exist_ok=True);open(os.path.join(R,'dist/index.html'),'w').write(t)
print('built dist/index.html',len(t),'bytes from',len(ORDER),'files')
