"""Phase 7B.1: asset pipeline ในเบราว์เซอร์จริง: python3 tests/asset_smoke.py
ภาพทดสอบสร้างชั่วคราวใน /tmp เท่านั้น (ไม่ใส่ในโปรเจกต์ ไม่ผูกกับ registry จริง)"""
import asyncio,os,tempfile
from PIL import Image
from playwright.async_api import async_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));URL='file://'+R+'/dist/index.html'
T=tempfile.mkdtemp(prefix='p7b-img-')
Image.new('RGB',(1536,864),(30,60,120)).save(os.path.join(T,'ok.webp'),'WEBP')
Image.new('RGB',(400,400),(120,30,30)).save(os.path.join(T,'square.png'))
Image.new('RGBA',(1024,1365),(0,0,0,0)).save(os.path.join(T,'mon.png'))
res=[]
def check(n,c):res.append(('PASS ' if c else 'FAIL ')+n)
# ใส่ src ให้ def ใน registry ระหว่างทดสอบ (เหมือนไฟล์จริงถูกผูกใน manifest) แล้ว attach pipeline ใหม่
BIND="""([id,src])=>{const E=AW.engine,d=E.assets.defs.get(id);d.src=src;d.license='own';E.assets.cache.delete(id);AW.ui.assets.attach(E);return true}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
        pg=await b.new_page(viewport={'width':1280,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(URL);await pg.wait_for_timeout(300)
        r=await pg.evaluate("AW.ui.assets.report()")
        check('ตอนนี้ทุกภาพเป็น placeholder (93) ไม่มีไฟล์หาย/ผิด',r['placeholder']==93 and not r['missing'] and not r['invalid'])
        await pg.fill('#pname','ทดสอบ');await pg.click('#pcreate');await pg.wait_for_timeout(200)
        check('ฉากแสดง placeholder ตามธีมเมื่อยังไม่มีภาพ',await pg.evaluate("document.querySelector('#scene').dataset.asset.startsWith('hunter.bg.')&&AW.ui.assets.status(document.querySelector('#scene').dataset.asset)==='placeholder'"))
        cur=await pg.evaluate("document.querySelector('#scene').dataset.asset")
        # ไฟล์หาย -> fallback
        await pg.evaluate(BIND,[cur,'file://'+T+'/not-here.webp']);await pg.evaluate(f"AW.ui.assets.ready('{cur}')");await pg.wait_for_timeout(300)
        st=await pg.evaluate(f"AW.ui.assets.status('{cur}')");ph=await pg.evaluate(f"!!AW.engine.assets.get('{cur}').placeholder")
        check(f'ไฟล์หาย: ตรวจพบ ({st}) แล้วใช้ placeholder แทน ไม่ error',st=='missing' and ph and not errs)
        check('ไฟล์หายถูกบันทึกใน debug log',await pg.evaluate("AW.engine.debug.lines.some(l=>l.lvl==='warn'&&l.msg.includes('โหลดไฟล์ไม่ได้'))"))
        # ขนาดผิด -> invalid + fallback
        await pg.evaluate(BIND,[cur,'file://'+T+'/square.png']);await pg.evaluate(f"AW.ui.assets.ready('{cur}')");await pg.wait_for_timeout(300)
        check('ภาพสัดส่วนผิด: ตรวจพบ (invalid) และไม่แสดงภาพนั้น',await pg.evaluate(f"AW.ui.assets.status('{cur}')==='invalid'&&!AW.ui.assets.ready('{cur}')"))
        # ภาพถูกต้อง -> โหลดและวาดจริง
        await pg.evaluate(BIND,[cur,'file://'+T+'/ok.webp']);await pg.evaluate(f"AW.ui.assets.ready('{cur}')");await pg.wait_for_timeout(400)
        check('ภาพถูกต้อง: โหลดสำเร็จ ขนาด 1536x864 และฉากใช้ภาพจริง',await pg.evaluate(f"(()=>{{const s=AW.ui.assets;return s.status('{cur}')==='ok'&&s.ready('{cur}')}})()"))
        await pg.wait_for_timeout(300)
        px=await pg.evaluate("(()=>{const g=document.querySelector('#stage').getContext('2d').getImageData(200,150,1,1).data;return [g[0],g[1],g[2]]})()")
        check(f'ฉากวาดจากไฟล์จริง (สีพิกเซล {px})',abs(px[0]-30)<6 and abs(px[1]-60)<6 and abs(px[2]-120)<6)
        # preload vs lazy
        await pg.evaluate("""(()=>{const E=AW.engine;for(const[id,src] of [['hunter.bg.association_hall','A'],['hunter.mon.goblin','B']]){const d=E.assets.defs.get(id);d.src=src;d.license='own';E.assets.cache.delete(id)}})()""")
        await pg.evaluate("(()=>{const E=AW.engine;E.assets.defs.get('hunter.bg.association_hall').src='"+'file://'+T+'/ok2.webp'+"';E.assets.defs.get('hunter.mon.goblin').src='"+'file://'+T+'/mon.png'+"';AW.ui.assets.attach(E)})()")
        pre=await pg.evaluate("AW.ui.assets.preload()")
        check('preload โหลดเฉพาะ P0/P1 ที่มีไฟล์ (ไม่รวมมอนสเตอร์ P2)','hunter.bg.association_hall' in pre and 'hunter.mon.goblin' not in pre)
        check('ภาพ P2 ยังไม่ถูกโหลดจนกว่าจะเรียกใช้ (lazy)',await pg.evaluate("AW.ui.assets.status('hunter.mon.goblin')==='idle'"))
        await pg.evaluate("AW.engine.assets.get('hunter.mon.goblin')");await pg.wait_for_timeout(300)
        check('เรียกใช้แล้วโหลด และตรวจผ่านตามมาตรฐานมอนสเตอร์ 3:4',await pg.evaluate("AW.ui.assets.status('hunter.mon.goblin')==='ok'"))
        check('ไม่มี JavaScript error',not errs)
        await b.close()
asyncio.run(main())
print('\n'.join(res));f=sum(r.startswith('FAIL') for r in res);print(f'\n{len(res)-f} ผ่าน · {f} ไม่ผ่าน');raise SystemExit(1 if f else 0)
