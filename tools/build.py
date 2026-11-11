"""รวมไฟล์เป็น dist/index.html ไฟล์เดียว (ไม่คัดลอกภาพของบุคคลที่สาม)
ลำดับไฟล์อยู่ใน ORDER เท่านั้น ตรวจ syntax ทุกไฟล์ด้วย node ก่อนรวม"""
import subprocess,sys,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDER=['src/core/ns.js','src/core/rng.js','src/core/bus.js','src/core/state.js','src/core/loop.js','src/core/worldtime.js','src/core/save.js','src/core/registry.js','src/core/assets.js','src/core/debug.js','src/core/engine.js','src/systems/worlds.js','src/systems/rules.js','src/systems/player.js','src/systems/ranks.js','src/systems/combat.js','src/systems/events.js','src/systems/missions.js','src/systems/npcs.js','src/systems/relations.js','src/systems/family.js','src/systems/health.js','src/systems/life.js','src/systems/gates.js','src/systems/party.js','src/systems/dungeon.js','src/systems/tower.js','src/systems/underground.js','src/systems/economy.js','data/assets/manifest.js','data/assets/art_meta.js','data/shared/people.js','data/worlds/index.js','data/worlds/hunter/base.js','data/worlds/hunter/people.js','data/worlds/hunter/events_life.js','data/worlds/hunter/events_hunter.js','data/worlds/hunter/events_e2.js','data/worlds/hunter/events_people.js','data/worlds/hunter/actions.js','data/worlds/hunter/progression.js','data/worlds/hunter/adventure.js','data/worlds/hunter/tower_floors_11_20.js','data/worlds/hunter/underground.js','data/worlds/hunter/economy.js','data/worlds/hunter/rank_b.js','data/worlds/hunter/world.js','data/worlds/fantasy.js','src/ui/util.js','src/ui/assetpipe.js','src/ui/scene.js','src/ui/layout.js','src/ui/screens.js','src/ui/pages_play.js','src/ui/pages_world.js','src/ui/app.js']
CSS=['src/ui/theme.css']
for f in ORDER:
    r=subprocess.run(['node','--check',os.path.join(R,f)],capture_output=True,text=True)
    if r.returncode:print('SYNTAX ERROR',f,r.stderr);sys.exit(1)
bundle='\n'.join(f'// ==== {f} ====\n'+open(os.path.join(R,f)).read() for f in ORDER)
css='\n'.join(open(os.path.join(R,f)).read() for f in CSS)
t=open(os.path.join(R,'src/template.html')).read().replace('/*CSS*/',css).replace('/*BUNDLE*/',bundle)
os.makedirs(os.path.join(R,'dist'),exist_ok=True);open(os.path.join(R,'dist/index.html'),'w').write(t)
print('built dist/index.html',len(t),'bytes from',len(ORDER),'files')
# Phase 7B.1: คัดลอกเฉพาะไฟล์ภาพที่ registry อ้าง (มี src + license) ไปไว้ข้าง index.html · ไม่มีไฟล์ = ไม่ทำอะไร
import subprocess,shutil
srcs=[x for x in subprocess.run(['node',os.path.join(R,'tools/assets.js'),'--list-src'],capture_output=True,text=True,check=True).stdout.split('\n') if x.strip()]
for f in srcs:
    d=os.path.join(R,'dist',f);os.makedirs(os.path.dirname(d),exist_ok=True);shutil.copyfile(os.path.join(R,f),d)
print('copied',len(srcs),'asset files')
