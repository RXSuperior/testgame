"""Phase 7A.1: ตรวจ responsive ทุกหน้า x 8 ขนาดจอ: python3 tests/responsive.py
ไม่ล้นแนวนอน · ของใน header ไม่ทับกัน · ปุ่มไม่ทับกัน · header ไม่บังเนื้อหา · ปุ่มยังกดได้ · ไม่มี console error · screenshot ทุกขนาด"""
import asyncio,os
from playwright.async_api import async_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));URL='file://'+R+'/dist/index.html'
SHOT=os.path.join(R,'docs/phase7a1');os.makedirs(SHOT,exist_ok=True)
WIDTHS=[(1440,900),(1200,860),(1024,768),(900,1000),(768,1024),(600,960),(390,844),(360,740)]
PAGES=['dashboard','character','inventory','skills','equipment','party','missions','map','relations','family','economy','association','guild','dungeon','tower','market','settings']
HUNTER="""(()=>{const E=AW.engine;const clr=()=>{let g=0;while(E.events.pending()&&g++<20)E.events.answer(E.events.choices().find(c=>c.ok).i)};clr();
E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*19;p.name='ซอนอู ชเวอิลฮยอน'});E.loop.tick(true);clr();E.player.moveTo('association');clr();
E.state.mutate('player','player',p=>{p.ranks.hunter='C';p.class=p.class||'hunter.sword';p.level=14;p.stats.str+=80;p.money=1234567;p.ap=2});E.worlds.ctx('hunter').mutate(s=>{s.flags.registered=true});E.player.addHp(9999);
E.player.addItem('hunter.crystal_blade_c');E.player.equip('hunter.crystal_blade_c');E.npcs.setFlag('hunter.master_kang','party');E.party.invite('hunter.master_kang');E.player.moveTo('association');clr();AW.ui.update(true)})()"""
# กล่องที่มองเห็นและซ้อนกันเกิน 2px ในแต่ละด้าน
OVERLAP="""(sel)=>{const els=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent!==null&&!e.closest('#side:not(.open)')&&getComputedStyle(e).visibility!=='hidden');const r=els.map(e=>e.getBoundingClientRect()).map(b=>({l:b.left,t:b.top,r:b.right,b:b.bottom}));const out=[];
 for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const a=r[i],c=r[j];if(els[i].contains(els[j])||els[j].contains(els[i]))continue;const ox=Math.min(a.r,c.r)-Math.max(a.l,c.l),oy=Math.min(a.b,c.b)-Math.max(a.t,c.t);if(ox>2&&oy>2)out.push((els[i].textContent||'').trim().slice(0,18)+' x '+(els[j].textContent||'').trim().slice(0,18))}return out.slice(0,3)}"""
res=[]
def check(n,c):res.append(('PASS ' if c else 'FAIL ')+n)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
        for w,h in WIDTHS:
            pg=await b.new_page(viewport={'width':w,'height':h});errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
            await pg.goto(URL);await pg.wait_for_timeout(300);await pg.fill('#pname','x');await pg.click('#pcreate');await pg.evaluate(HUNTER);await pg.wait_for_timeout(150)
            over=[];hdr=[];btn=[];cover=[];clip=[]
            for pid in PAGES:
                await pg.evaluate(f"AW.ui.go('{pid}')");await pg.wait_for_timeout(40)
                if await pg.evaluate("document.documentElement.scrollWidth")>w: over.append(pid)
                o=await pg.evaluate(OVERLAP,'#hdr .brand, #hdr .hstat, #hdr .hctl button, #hdr .menu-btn')
                if o: hdr.append(pid+': '+'; '.join(o))
                o=await pg.evaluate(OVERLAP,'#main button, #main .tile, #main .badge')
                if o: btn.append(pid+': '+'; '.join(o))
                # header ไม่บังเนื้อหา: เนื้อหาเริ่มใต้ header ทั้งตอนอยู่บนสุดและหลังเลื่อน
                c=await pg.evaluate("""(()=>{scrollTo(0,0);const H=document.querySelector('#hdr').getBoundingClientRect().bottom,m=document.querySelector('#main').getBoundingClientRect().top,s=document.querySelector('#side'),sv=s.offsetParent!==null&&getComputedStyle(s).position!=='fixed';
                  scrollTo(0,500);const H2=document.querySelector('#hdr').getBoundingClientRect().bottom,st=s.getBoundingClientRect().top;scrollTo(0,0);return m>=H-1&&(!sv||st>=H2-1)})()""")
                if not c: cover.append(pid)
                # ตัวอักษรใน header ต้องไม่ถูกตัดแนวตั้ง (ขึ้นบรรทัดใหม่จนล้นกล่อง)
                k=await pg.evaluate("[...document.querySelectorAll('#hdr .hstat, #hdr .hstats, #hdr .hctl, #hdr button')].filter(e=>e.offsetParent!==null&&(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+1)).map(e=>e.className+':'+e.textContent.trim().slice(0,15))")
                if k: clip.append(pid+': '+','.join(k))
            check(f'{w}px: ไม่ล้นแนวนอนทั้ง 17 หน้า {over}',not over)
            check(f'{w}px: ของใน header ไม่ทับกัน {hdr[:2]}',not hdr)
            check(f'{w}px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน {btn[:2]}',not btn)
            check(f'{w}px: header ไม่บังเนื้อหาและเมนู {cover}',not cover)
            check(f'{w}px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) {clip[:2]}',not clip)
            # ปุ่มยังใช้งานได้: เปลี่ยนหน้าด้วยเมนูจริง และเดินทางด้วยปุ่มจริง
            await pg.evaluate("AW.ui.go('dashboard')")
            if w<768:
                await pg.click('#bnav [data-nav-toggle]');await pg.wait_for_timeout(250)
            await pg.click('#side [data-nav="missions"]');await pg.wait_for_timeout(250)
            okn=await pg.evaluate("document.querySelector('#pg-missions').classList.contains('active')")
            await pg.click('#pg-missions [data-loc="gate_zone"]');await pg.wait_for_timeout(80)
            okl=await pg.evaluate("AW.engine.player.get().location.loc==='gate_zone'||!!AW.engine.events.pending()")
            check(f'{w}px: เมนูและปุ่มเดินทางกดได้จริง',okn and okl)
            await pg.evaluate("(()=>{const E=AW.engine;let g=0;while(E.events.pending()&&g++<20)E.events.answer(E.events.choices().find(c=>c.ok).i);E.player.moveTo('association');AW.ui.go('dashboard')})()");await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(SHOT,f'{w}.png'))
            if w==768:
                for pid in['character','equipment','party','economy']:
                    await pg.evaluate(f"AW.ui.go('{pid}')");await pg.wait_for_timeout(150);await pg.screenshot(path=os.path.join(SHOT,f'768_{pid}.png'))
            check(f'{w}px: ไม่มี console error',not errs)
            await pg.close()
        await b.close()
asyncio.run(main())
print('\n'.join(res));f=sum(r.startswith('FAIL') for r in res);print(f'\n{len(res)-f} ผ่าน · {f} ไม่ผ่าน');raise SystemExit(1 if f else 0)
