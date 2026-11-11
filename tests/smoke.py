"""ทดสอบในเบราว์เซอร์จริง (Chromium): python3 tests/smoke.py"""
import asyncio,os,hashlib,sys
from playwright.async_api import async_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));URL='file://'+R+'/dist/index.html'
OLD='/home/claude/game4/index.html';h0=hashlib.sha256(open(OLD,'rb').read()).hexdigest()
res=[]
def check(n,c):res.append(('PASS ' if c else 'FAIL ')+n)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
        ctx=await b.new_context(viewport={'width':1000,'height':900});pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(URL);await pg.evaluate("localStorage.setItem('hunter-path-v5-s0','OLD_SAVE');localStorage.setItem('hunter-path-v5-meta','OLD_META')");await pg.reload();await pg.wait_for_timeout(500)
        check('เปิดหน้าได้ ไม่มี error',not errs and await pg.evaluate("!!AW.engine"))
        check('manifest โหลด (placeholder ทั้งหมด)',await pg.evaluate("AW.engine.assets.report().real===0&&AW.engine.assets.report().placeholder>50"))
        await pg.click('#step');await pg.click('#step');check('ปุ่ม +1 เดือนทำงาน',await pg.evaluate("AW.engine.loop.month")==2)
        await pg.evaluate("AW.engine.loop.baseMs=50");await pg.click('[data-s="10"]');await pg.wait_for_timeout(400);m=await pg.evaluate("AW.engine.loop.month");check(f'เวลาเดินเอง (ถึงเดือน {m})',m>5)
        await pg.click('#menu');m1=await pg.evaluate("AW.engine.loop.month");await pg.wait_for_timeout(400);m2=await pg.evaluate("AW.engine.loop.month");check('เปิดเมนูแล้วเวลาหยุด',m1==m2)
        await pg.click('#menu');await pg.click('[data-s="0"]');await pg.wait_for_timeout(100)
        saved=await pg.evaluate("AW.engine.loop.month");await pg.click('[data-save="1"]')
        await pg.reload();await pg.wait_for_timeout(400);check('รีโหลดแล้วเริ่มเดือน 0',await pg.evaluate("AW.engine.loop.month")==0)
        await pg.click('[data-load="1"]');check(f'โหลดเซฟคืนเดือน {saved}',await pg.evaluate("AW.engine.loop.month")==saved)
        check('state ในเบราว์เซอร์ แก้ผ่าน get ไม่ได้',await pg.evaluate("(()=>{'use strict';const m=AW.engine.loop.month;try{AW.engine.state.get('time').month=-5}catch(e){};return AW.engine.loop.month===m&&Object.isFrozen(AW.engine.state.get('meta'))})()"))
        r=await pg.evaluate("(()=>{const S=AW.engine.save,good=S.exportSlot(1);let bad=0;for(const t of['{x',good.replace(/\\d/,'9'),'[]'])try{S.importSlot(1,t)}catch(e){bad++};const after=S.exportSlot(1)===good;const r=S.importSlot(1,good);return bad===3&&after&&r.backup==='mvh1:slot1.preimport'&&!!localStorage.getItem('mvh1:slot1.preimport')})()")
        check('import ในเบราว์เซอร์: ข้อมูลเสียถูกปฏิเสธ ทับช่องเดิมมี backup',r)
        check('เซฟเกมเดิมไม่ถูกแตะ',await pg.evaluate("localStorage.getItem('hunter-path-v5-s0')==='OLD_SAVE'&&localStorage.getItem('hunter-path-v5-meta')==='OLD_META'"))
        check('คีย์เซฟใหม่ขึ้นต้น mvh1:',await pg.evaluate("Object.keys(localStorage).filter(k=>!k.startsWith('hunter-path-')).every(k=>k.startsWith('mvh1:'))"))
        await pg.evaluate('AW.engine.loop.setSpeed(0)');await pg.click('#dbg summary');await pg.wait_for_timeout(200);check('Debug panel เปิดได้ และไม่มี error ภายใน',await pg.evaluate("document.querySelector('#dbg').open&&AW.engine.debug.errors.length===0"))
        await pg.screenshot(path=R+'/docs/phase1_smoke.png',full_page=True)
        pm=await b.new_page(viewport={'width':390,'height':800});await pm.goto(URL);await pm.wait_for_timeout(300);check('หน้าจอมือถือ 390px ไม่ล้น',await pm.evaluate("document.documentElement.scrollWidth<=390"))
        check('ไม่มี pageerror ตลอดการทดสอบ',not errs);await b.close()
asyncio.run(main())
check('ไฟล์เกมเดิมไม่เปลี่ยน (sha256)',hashlib.sha256(open(OLD,'rb').read()).hexdigest()==h0)
print('\n'.join(res));f=sum(r.startswith('FAIL') for r in res);print(f'\n{len(res)-f} ผ่าน · {f} ไม่ผ่าน');sys.exit(1 if f else 0)
