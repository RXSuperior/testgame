"""ทดสอบ UI Phase 7A ในเบราว์เซอร์จริง (Chromium): python3 tests/ui_smoke.py
ทุกหน้า · ปุ่มกิจกรรม · modal · โหมด focus · responsive 5 ขนาด · เซฟ/โหลด · console error · screenshot desktop/tablet/mobile"""
import asyncio,os,hashlib
from playwright.async_api import async_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));URL='file://'+R+'/dist/index.html'
OLD='/home/claude/game4/index.html';h0=hashlib.sha256(open(OLD,'rb').read()).hexdigest()
PAGES=['dashboard','character','inventory','skills','equipment','party','missions','map','relations','family','economy','association','guild','dungeon','tower','market','settings']
SHOT=os.path.join(R,'docs/phase7a')
res=[]
def check(n,c):res.append(('PASS ' if c else 'FAIL ')+n)
CLR="(()=>{const E=AW.engine;let g=0;while(E.events.pending()&&g++<20)E.events.answer(E.events.choices().find(c=>c.ok).i);AW.ui.update(true)})()"
# ตัวละครแรงก์ C ที่สมาคม (ใช้ API จริงตั้งค่าให้ทดสอบได้เร็ว)
HUNTER="""(()=>{const E=AW.engine;const clr=()=>{let g=0;while(E.events.pending()&&g++<20)E.events.answer(E.events.choices().find(c=>c.ok).i)};clr();
E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*19});E.loop.tick(true);clr();E.player.moveTo('association');clr();
E.state.mutate('player','player',p=>{p.ranks.hunter='C';p.class=p.class||'hunter.sword';p.level=14;p.stats.str+=80;p.money=12000;p.ap=2});E.worlds.ctx('hunter').mutate(s=>{s.flags.registered=true});E.player.addHp(9999);
E.player.addItem('hunter.crystal_blade_c');E.player.equip('hunter.crystal_blade_c');E.player.moveTo('association');clr();AW.ui.update(true)})()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
        pg=await b.new_page(viewport={'width':1440,'height':900});errs=[]
        pg.on('pageerror',lambda e:errs.append('page: '+str(e)));pg.on('console',lambda m:errs.append('console: '+m.text) if m.type=='error' else None)
        html=open(os.path.join(R,'dist/index.html'),encoding='utf-8').read()
        check('มีหน้าจอ Loading ก่อนเกมพร้อม และไม่มี eval',"class=\"loading\"" in html and 'eval(' not in html and 'new Function' not in html)
        await pg.goto(URL);await pg.wait_for_timeout(400)
        check('โหมดผู้เล่น: ไม่แสดง Debug panel',await pg.evaluate("!document.querySelector('#dbg')&&!document.querySelector('[data-gate]')"))
        check('ยังไม่สร้างตัวละคร: หน้าสร้างตัวละครแสดง',await pg.is_visible('#pcreate'))
        await pg.fill('#pname','ทดสอบUI');await pg.click('#pcreate');await pg.wait_for_timeout(150)
        check('สร้างตัวละครแล้วเห็นเหตุการณ์เปิดเรื่องแบบมีตัวเลือก',await pg.is_visible('#modal [data-choice]'))
        await pg.click('#modal [data-choice="0"]');await pg.wait_for_timeout(100)
        check('ตอบเหตุการณ์แล้วเห็นผลลัพธ์ กดตกลงแล้วปิด',await pg.is_visible('[data-ok]'))
        await pg.click('[data-ok]');await pg.wait_for_timeout(100);check('ผลลัพธ์ปิดแล้ว',not await pg.is_visible('[data-ok]'))
        await pg.evaluate(HUNTER);await pg.wait_for_timeout(150)
        # ทุกหน้า
        ok_all=True;bad=[]
        for pid in PAGES:
            await pg.click(f'#side [data-nav="{pid}"]');await pg.wait_for_timeout(60)
            st=await pg.evaluate(f"(()=>{{const s=document.querySelector('#pg-{pid}');const b=document.querySelector('#side [data-nav=\"{pid}\"]');return s.classList.contains('active')&&s.offsetParent!==null&&s.innerText.trim().length>0&&b.classList.contains('active')&&b.getAttribute('aria-current')==='page'&&document.querySelectorAll('.page.active').length===1}})()")
            if not st: ok_all=False;bad.append(pid)
        check(f'เปิดครบ {len(PAGES)} หน้าผ่านเมนู มี active state และเนื้อหาจริง {bad}',ok_all)
        check('ทุกหน้าไม่มี JavaScript error',not errs)
        # ปุ่มที่ disabled ต้องมีเหตุผล หรือเป็นปุ่มที่ทำไม่ได้ชั่วคราวเท่านั้น · ไม่มีปุ่มเปล่าไม่มี handler
        noop=await pg.evaluate("""(()=>{const known=['nav','navToggle','s','save','load','a','dlg','dlgclose','ok','choice','loc','act','mis','cact','invite','pleave','upg','equip','repair','svc','svcx','svcr','inv','wd','dgin','dg','tw','gate','go','ia','job','quit','home','pgate','cf','npc','accept','cid','amt','cp','mode'];
          return [...document.querySelectorAll('#app button')].filter(b=>!b.id&&!Object.keys(b.dataset).some(k=>known.includes(k))).map(b=>b.textContent.trim().slice(0,30))})()""")
        check(f'ทุกปุ่มผูกกับการกระทำจริง (ไม่มีปุ่มกดแล้วไม่มีผล) {noop[:5]}',not noop)
        # จำ tab
        await pg.click('#side [data-nav="economy"]');await pg.reload();await pg.wait_for_timeout(400)
        check('จำหน้าที่เปิดไว้หลังรีโหลด (sessionStorage ไม่ใช่เซฟ)',await pg.evaluate("document.querySelector('#pg-economy').classList.contains('active')&&!Object.keys(localStorage).some(k=>k.startsWith('mvh-ui'))"))
        await pg.fill('#pname','ทดสอบUI');await pg.click('#pcreate');await pg.evaluate(HUNTER);await pg.click('#side [data-nav="dashboard"]');await pg.wait_for_timeout(100)
        # ปุ่มกิจกรรม + toast
        await pg.click('#locs [data-loc="gym"]');await pg.wait_for_timeout(80);await pg.evaluate(CLR)
        if await pg.is_visible('[data-ok]'): await pg.click('[data-ok]')
        ap0=await pg.evaluate("AW.engine.player.get().ap");await pg.click('#acts [data-act]:not([disabled])');await pg.wait_for_timeout(100);await pg.evaluate(CLR)
        check('ปุ่มกิจกรรมทำงานจริง (AP ลด)',await pg.evaluate(f"AW.engine.player.get().ap<{ap0}"))
        if await pg.is_visible('[data-ok]'): await pg.click('[data-ok]')
        await pg.click('#side [data-nav="party"]');check('หน้าว่างแสดง empty state',await pg.evaluate("!!document.querySelector('#pg-party .empty')"))
        await pg.click('#side [data-nav="equipment"]');await pg.click('#pg-equipment [data-upg]');await pg.wait_for_timeout(80)
        check('ทำสำเร็จแล้วมี toast แจ้งผล',await pg.is_visible('.toast'))
        await pg.click('#side [data-nav="character"]');check('ค่าสถานะมี tooltip อธิบาย',await pg.evaluate("[...document.querySelectorAll('#pg-character .tile[title]')].length>=8"))
        # confirm modal
        await pg.click('#side [data-nav="settings"]');m0=await pg.evaluate("AW.engine.loop.month+'|'+AW.engine.player.get().name")
        await pg.click('[data-a="newgame"]');vis=await pg.is_visible('#confirm .dialog');await pg.click('#confirm [data-cf="no"].ghost')
        check('Modal ยืนยันเปิดได้ กดยกเลิกแล้วปิด ไม่มีอะไรเปลี่ยน',vis and not await pg.is_visible('#confirm .dialog') and await pg.evaluate("AW.engine.loop.month+'|'+AW.engine.player.get().name")==m0)
        await pg.click('[data-a="newgame"]');await pg.keyboard.press('Escape');check('กด Escape ปิด modal ได้',not await pg.is_visible('#confirm .dialog'))
        # บทสนทนา NPC
        await pg.click('#side [data-nav="dashboard"]');await pg.click('#people [data-dlg]');await pg.wait_for_timeout(80);d1=await pg.is_visible('#dlg .dialog')
        await pg.screenshot(path=os.path.join(SHOT,'desktop_dialogue.png'))
        await pg.click('#dlg button[data-dlgclose]');check('หน้าบทสนทนา NPC เปิด/ปิดได้',d1 and not await pg.is_visible('#dlg .dialog'))
        # โหมด focus: การต่อสู้
        await pg.evaluate("(()=>{AW.engine.combat.start({worldId:'hunter',foes:[{enemy:'goblins'}]});AW.ui.update(true)})()");await pg.wait_for_timeout(80)
        check('การต่อสู้เปิดหน้าพิเศษ ซ่อนหน้าอื่น',await pg.evaluate("document.querySelector('#app').classList.contains('focus')&&!!document.querySelector('#combat .screen')&&document.querySelector('.page.active').offsetParent===null"))
        await pg.screenshot(path=os.path.join(SHOT,'desktop_combat.png'))
        await pg.click('#side [data-nav="settings"]');ov=await pg.evaluate("document.querySelector('#pg-settings').offsetParent!==null&&!!document.querySelector('[data-a=backFocus]')")
        await pg.click('[data-save="1"]');await pg.click('[data-a="backFocus"]')
        check('ระหว่างต่อสู้เปิดหน้าระบบเพื่อเซฟได้ แล้วกลับไปการต่อสู้',ov and await pg.evaluate("document.querySelector('#app').classList.contains('focus')"))
        for i in range(40):
            if not await pg.evaluate("!!(AW.engine.combat.session()&&AW.engine.combat.session().status==='active')"): break
            await pg.click('[data-cact="attack"]');await pg.wait_for_timeout(15)
        await pg.evaluate("(()=>{const s=AW.engine.combat.session();if(s&&s.status!=='active')AW.engine.combat.claim(s.id);AW.ui.update(true)})()")
        check('จบการต่อสู้แล้วกลับสู่หน้าปกติ',await pg.evaluate("!document.querySelector('#app').classList.contains('focus')"))
        # เซฟ/โหลด
        await pg.click('#side [data-nav="settings"]');await pg.click('[data-save="2"]');m0=await pg.evaluate("AW.engine.player.get().money")
        await pg.evaluate("AW.engine.state.mutate('player','player',p=>{p.money=1})");await pg.click('[data-load="2"]');await pg.wait_for_timeout(80)
        check('เซฟ/โหลดจากหน้าระบบ คืนค่าตรง',await pg.evaluate(f"AW.engine.player.get().money==={m0}"))
        # เปิด debug จากหน้าระบบ
        await pg.click('[data-a="toggleDev"]');await pg.wait_for_timeout(80);check('เปิดโหมดพัฒนาแล้วเห็น Debug panel',await pg.evaluate("!!document.querySelector('#dbg')"))
        await pg.click('[data-a="toggleDev"]')
        # ซ่อนแผงขวา
        await pg.click('#hdr [data-a="toggleRight"]');hid=await pg.evaluate("getComputedStyle(document.querySelector('#right')).display==='none'");await pg.click('#hdr [data-a="toggleRight"]')
        check('ยุบ/แสดงแผงขวาได้',hid and await pg.evaluate("getComputedStyle(document.querySelector('#right')).display!=='none'"))
        await pg.click('#side [data-nav="dashboard"]');await pg.wait_for_timeout(300);await pg.screenshot(path=os.path.join(SHOT,'desktop.png'))
        check('ไม่มี console error ตลอดการทดสอบ',not errs)
        # Responsive
        for name,w,h in [('desktop_l',1440,900),('laptop',1024,768),('tablet',768,1024),('mobile',390,844),('mobile_s',360,740)]:
            m=await b.new_page(viewport={'width':w,'height':h});e2=[];m.on('pageerror',lambda e:e2.append(str(e)))
            await m.goto(URL);await m.wait_for_timeout(300);await m.fill('#pname','จอ');await m.click('#pcreate');await m.evaluate(HUNTER);await m.wait_for_timeout(100)
            over=[]
            for pid in PAGES:
                await m.evaluate(f"AW.ui.go('{pid}')");await m.wait_for_timeout(30)
                if await m.evaluate("document.documentElement.scrollWidth")>w: over.append(pid)
            check(f'{name} {w}px: ไม่มี horizontal overflow ทุกหน้า {over}',not over and not e2)
            if w<768:
                bn=await m.is_visible('#bnav');sd=await m.evaluate("document.querySelector('#side').getBoundingClientRect().right<=0")
                await m.click('#bnav [data-nav-toggle]');await m.wait_for_timeout(250);op=await m.evaluate("document.querySelector('#side').getBoundingClientRect().left>=-1")
                await m.click('#side [data-nav="family"]');await m.wait_for_timeout(250)
                cl=await m.evaluate("document.querySelector('#pg-family').classList.contains('active')&&document.querySelector('#side').getBoundingClientRect().right<=0")
                small=await m.evaluate("[...document.querySelectorAll('#bnav button')].every(b=>b.getBoundingClientRect().height>=44)")
                check(f'{name}: เมนูล่าง + drawer ใช้ได้ ปุ่มสูง >= 44px',bn and sd and op and cl and small)
            if name in('tablet','mobile'):
                await m.evaluate("AW.ui.go('dashboard')");await m.wait_for_timeout(300);await m.screenshot(path=os.path.join(SHOT,name+'.png'),full_page=False)
            if name=='mobile':
                await m.evaluate("(()=>{AW.engine.events.present('hunter.b_kid_fan');AW.ui.update(true)})()");await m.wait_for_timeout(200);await m.screenshot(path=os.path.join(SHOT,'mobile_event.png'))
                check('mobile: เหตุการณ์อ่านได้และกดตัวเลือกได้',await m.is_visible('#modal [data-choice]'))
            await m.close()
        check('localStorage มีเฉพาะเซฟ mvh1: และของเกมเดิม',await pg.evaluate("Object.keys(localStorage).every(k=>k.startsWith('mvh1:')||k.startsWith('hunter-path-'))"))
        check('ไฟล์เกมเดิมไม่เปลี่ยน (sha256)',hashlib.sha256(open(OLD,'rb').read()).hexdigest()==h0)
        await b.close()
asyncio.run(main())
print('\n'.join(res));f=sum(r.startswith('FAIL') for r in res);print(f'\n{len(res)-f} ผ่าน · {f} ไม่ผ่าน');raise SystemExit(1 if f else 0)
