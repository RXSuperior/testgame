"""ทดสอบ Side-view (Phase 7B.3) ในเบราว์เซอร์จริง: python3 tests/sv_smoke.py
คีย์บอร์ด · ปุ่มสัมผัสบนมือถือ · คุยกับฮาจุน · ประตู · ต่อสู้ก๊อบลิน · เซฟ/โหลดตำแหน่ง · Esc กลับ Dashboard · performance · console error"""
import asyncio,os,hashlib,json
from playwright.async_api import async_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));URL='file://'+R+'/dist/index.html'
OLD='/home/claude/game4/index.html';h0=hashlib.sha256(open(OLD,'rb').read()).hexdigest()
SHOT=os.path.join(R,'docs/phase7b3');os.makedirs(SHOT,exist_ok=True)
res=[]
def check(n,c,extra=''):res.append(('PASS ' if c else 'FAIL ')+n+(' :: '+str(extra) if not c and extra!='' else ''))
CLR="(()=>{const E=AW.engine;let g=0;while(E.events.pending()&&g++<20)E.events.answer(E.events.choices().find(c=>c.ok).i);AW.ui.update(true)})()"
# วันทำงาน ช่วงเช้า ที่โรงเรียน (ฮาจุนอยู่ตามตาราง student)
SCHOOL="""(()=>{const E=AW.engine;const clr=()=>{let g=0;while(E.events.pending()&&g++<20)E.events.answer(E.events.choices().find(c=>c.ok).i)};clr();
let g=0;while(E.npcs.clock('hunter').dayType!=='work'&&g++<12){E.loop.tick(true);clr()}E.player.moveTo('school');clr();E.state.mutate('player','player',p=>{p.ap=2});AW.ui.update(true)})()"""
HUNTER="""(()=>{const E=AW.engine;const clr=()=>{let g=0;while(E.events.pending()&&g++<20)E.events.answer(E.events.choices().find(c=>c.ok).i)};clr();
E.state.mutate('player','player',p=>{p.bornAt=E.loop.month-12*19});E.loop.tick(true);clr();E.player.moveTo('association');clr();
E.state.mutate('player','player',p=>{p.ranks.hunter='C';p.class=p.class||'hunter.sword';p.level=14;p.stats.str+=80;p.stats.vit+=30;p.ap=2});E.worlds.ctx('hunter').mutate(s=>{s.flags.registered=true});E.player.addHp(9999);
E.player.moveTo('city');clr();E.player.moveTo('gate_zone');clr();AW.ui.update(true)})()"""
# เดินไปตำแหน่ง x ผ่านตัวช่วยทดสอบ (ใช้ runtime เดียวกับที่เกมใช้ · กระโดดข้ามสิ่งกีดขวาง)
WALK="""(x=>{const S=AW.ui.sv;for(let i=0;i<900;i++){const rt=S.rt(),cx=rt.me.x+rt.me.w/2;if(Math.abs(cx-x)<6){S.advance(30,{});return true}S.advance(1,{right:cx<x,left:cx>x,jump:true,jumpPressed:rt.me.ground&&rt.me.vx===0&&i>0})}return false})"""
FIGHT="""(()=>{const S=AW.ui.sv,rt=S.rt(),f=rt.foes[0],k=f.key;let g=0;while(rt.foes.some(x=>x.key===k&&!x.dead)&&g++<3000){const cx=rt.me.x+rt.me.w/2,fx=f.x+f.w/2;
 if(Math.abs(cx-fx)>36)S.advance(1,{right:cx<fx,left:cx>fx,jump:true,jumpPressed:rt.me.ground&&rt.me.vx===0&&g>1});else{rt.me.facing=fx>cx?1:-1;S.advance(1,{attackPressed:g%3===0})}}return k})()"""
async def boot(b,**ctx):
    c=await b.new_context(**ctx);pg=await c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('page: '+str(e)));pg.on('console',lambda m:errs.append('console: '+m.text) if m.type=='error' else None)
    await pg.goto(URL);await pg.wait_for_timeout(300)
    await pg.fill('#pname','ทดสอบSV');await pg.click('#pcreate');await pg.wait_for_timeout(100);await pg.evaluate(CLR)
    return c,pg,errs
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
        c,pg,errs=await boot(b,viewport={'width':1440,'height':900})
        check('ที่บ้าน (ไม่มี area): ไม่มีปุ่มเดินสำรวจ',not await pg.is_visible('#svgo'))
        await pg.evaluate(SCHOOL);await pg.wait_for_timeout(100)
        check('Dashboard ที่โรงเรียนมีปุ่มเดินสำรวจ',await pg.is_visible('#svgo [data-a=explore]'))
        await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(250)
        st=await pg.evaluate("(()=>{const rt=AW.ui.sv.rt();return{on:!!rt&&!document.querySelector('#sv').hidden,area:rt&&rt.a.id,paused:AW.engine.loop.reasons.has('explore'),hud:document.querySelector('#svhud').innerText,npcs:rt.npcs.map(n=>n.id)}})()")
        check('เปิดฉากโรงเรียน หยุดเวลาเกม HUD แสดง HP และ AP',st['on'] and st['area']=='school' and st['paused'] and 'HP' in st['hud'] and 'AP 2' in st['hud'],st)
        check('ฮาจุนยืนในฉากตามตารางเวลาจริง (เช้าวันทำงาน)','hunter.best_friend' in st['npcs'],st['npcs'])
        await pg.screenshot(path=os.path.join(SHOT,'sv_school_1440.png'))
        # คีย์บอร์ดจริง: D ค้าง = เดินขวา · Space = กระโดด
        x0=await pg.evaluate("AW.ui.sv.rt().me.x");await pg.keyboard.down('KeyD');await pg.wait_for_timeout(500);await pg.keyboard.up('KeyD')
        x1=await pg.evaluate("AW.ui.sv.rt().me.x");check('คีย์บอร์ด D ค้าง เดินขวาจริง',x1-x0>30,(x0,x1))
        y0=await pg.evaluate("AW.ui.sv.rt().me.y");await pg.keyboard.down('Space');await pg.wait_for_timeout(120);y1=await pg.evaluate("AW.ui.sv.rt().me.y");await pg.keyboard.up('Space');await pg.wait_for_timeout(900)
        y2=await pg.evaluate("AW.ui.sv.rt().me.y");check('Space กระโดดขึ้นแล้วตกกลับพื้น',y1<y0-10 and abs(y2-y0)<1,(y0,y1,y2))
        await pg.keyboard.down('ArrowLeft');await pg.wait_for_timeout(300);await pg.keyboard.up('ArrowLeft');x2=await pg.evaluate("AW.ui.sv.rt().me.x");check('ลูกศรซ้ายเดินซ้าย',x2<x1,(x1,x2))
        cam0=await pg.evaluate("AW.ui.sv.rt().cam.x");await pg.evaluate(WALK+"(1200)");cam1=await pg.evaluate("AW.ui.sv.rt().cam.x");check('กล้องตามผู้เล่น',cam1>cam0+300,(cam0,cam1))
        # คุยกับฮาจุน: เดินไปหา กด E เลือกคุย
        hx=await pg.evaluate("(()=>{const n=AW.ui.sv.rt().npcs.find(n=>n.id==='hunter.best_friend');return n.x+n.w/2})()");await pg.evaluate(WALK+f"({hx})");await pg.wait_for_timeout(80)
        check('เข้าใกล้ฮาจุนเห็นคำแนะนำ [E]','[E]' in await pg.inner_text('#svprompt'))
        await pg.keyboard.press('KeyE');await pg.wait_for_timeout(120)
        check('กด E เปิดหน้าต่างคุยกับฮาจุน',await pg.is_visible('#svpanel [data-opt]') and 'ฮาจุน' in await pg.inner_text('#svpanel'))
        await pg.screenshot(path=os.path.join(SHOT,'sv_talk_1440.png'))
        opts=await pg.evaluate("[...document.querySelectorAll('#svpanel [data-opt]')].map(b=>b.innerText)")
        ev=[i for i,t in enumerate(opts) if '★' in t]
        check('ตัวเลือกมีทั้งการคุยและเหตุการณ์ของพื้นที่',any('คุย' in t for t in opts) and ev,opts)
        await pg.click(f'#svpanel [data-opt="{ev[0]}"]');await pg.wait_for_timeout(120)
        check('เลือกเหตุการณ์แล้วเห็นตัวเลือกคำตอบ และเวลาในฉากหยุด',await pg.is_visible('#svpanel [data-ans]'))
        mx=await pg.evaluate("AW.ui.sv.rt().me.x");await pg.keyboard.down('KeyD');await pg.wait_for_timeout(200);await pg.keyboard.up('KeyD')
        check('ระหว่างเลือกคำตอบผู้เล่นไม่ขยับ',await pg.evaluate("AW.ui.sv.rt().me.x")==mx)
        await pg.click('#svpanel [data-ans]:not([disabled])');await pg.wait_for_timeout(120)
        check('ตอบแล้วเห็นผลลัพธ์ เหตุการณ์ไม่ค้าง',await pg.is_visible('#svpanel [data-close]') and await pg.evaluate("!AW.engine.events.pending()"))
        await pg.keyboard.press('KeyE');await pg.wait_for_timeout(80);check('กด E ปิดผลลัพธ์',not await pg.is_visible('#svpanel [data-close]'))
        await pg.keyboard.press('KeyE');await pg.wait_for_timeout(80);opts2=await pg.evaluate("[...document.querySelectorAll('#svpanel [data-opt]')].map(b=>({t:b.innerText,d:b.disabled}))")
        await pg.click('#svpanel [data-opt]:not([disabled])');await pg.wait_for_timeout(80)
        r=await pg.inner_text('#svpanel');check('คุยกับฮาจุน (rels.interact) ได้ผลลัพธ์',len(r)>5,r)
        await pg.keyboard.press('Escape');await pg.wait_for_timeout(80);check('Esc ปิดหน้าต่างก่อน ยังอยู่ในฉาก',await pg.evaluate("AW.ui.sv.active()") and not await pg.is_visible('#svpanel .dialog'))
        # ประตู: โรงเรียน -> เมือง · เซฟตำแหน่ง
        await pg.evaluate(WALK+"(1520)");await pg.keyboard.press('KeyE');await pg.wait_for_timeout(150);await pg.evaluate(CLR)
        st=await pg.evaluate("({a:AW.ui.sv.rt().a.id,loc:AW.engine.player.get().location.loc})");check('ประตูโรงเรียน -> เมือง ผ่าน player.moveTo',st=={'a':'city','loc':'city'},st)
        await pg.evaluate(WALK+"(1840)");await pg.keyboard.press('KeyE');await pg.wait_for_timeout(150)
        check('ย่านเกตล็อกก่อนลงทะเบียน (กฎเดิม)',await pg.evaluate("AW.ui.sv.rt().a.id")=='city')
        await pg.evaluate(WALK+"(700)");await pg.click('#sv [data-sv=save]');await pg.wait_for_timeout(120)
        sv=await pg.evaluate("(()=>{const r=JSON.parse(localStorage.getItem('mvh1:slot0'));const b=JSON.parse(r.body);return{s:b.data.scene,x:Math.round(AW.ui.sv.rt().me.x)}})()")
        check('ปุ่มเซฟในฉาก: เซฟพื้นที่และตำแหน่งผู้เล่น',sv['s']['area']=='city' and sv['s']['x']==sv['x'],sv)
        await pg.keyboard.press('Escape');await pg.wait_for_timeout(150)
        st=await pg.evaluate("({on:AW.ui.sv.active(),hidden:document.querySelector('#sv').hidden,page:AW.ui.state.page,act:document.querySelector('#pg-dashboard').classList.contains('active'),paused:AW.engine.loop.reasons.has('explore')})")
        check('Esc ออกจากฉาก กลับ Dashboard เวลาเดินต่อ',not st['on'] and st['hidden'] and st['page']=='dashboard' and st['act'] and not st['paused'],st)
        await pg.evaluate("AW.engine.player.moveTo('school')");await pg.evaluate(CLR)
        await pg.click('#side [data-nav="settings"]');await pg.click('[data-load="0"]');await pg.wait_for_timeout(150);await pg.evaluate(CLR);await pg.click('#side [data-nav="dashboard"]');await pg.wait_for_timeout(80)
        await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(150)
        st=await pg.evaluate("({a:AW.ui.sv.rt().a.id,x:Math.round(AW.ui.sv.rt().me.x)})");check('โหลดเซฟแล้วเข้าฉาก ยืนที่ตำแหน่งที่เซฟ',st=={'a':'city','x':sv['x']},st)
        await pg.keyboard.press('Escape');await pg.wait_for_timeout(80)
        # ต่อสู้ก๊อบลิน (ฮันเตอร์ลงทะเบียนแล้ว)
        await pg.evaluate(HUNTER);await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(150)
        await pg.evaluate("(()=>{window.__reps=[];AW.engine.bus.on('combat:done',r=>window.__reps.push({mode:r.mode,win:r.win,out:r.outcome}));return 1})()")
        hp0=await pg.evaluate("AW.engine.player.get().exp");k=await pg.evaluate(FIGHT);await pg.wait_for_timeout(100)
        st=await pg.evaluate(f"({{reps:window.__reps,res:AW.engine.sv.get().resolved.includes('{k}'),exp:AW.engine.player.get().exp,lv:AW.engine.player.get().level,log:document.querySelector('#svlog').innerText}})")
        check('ฆ่าก๊อบลินแบบ real-time: combat.apply ครั้งเดียว บันทึกว่าปราบแล้ว',st['reps']==[{'mode':'action','win':True,'out':'win'}] and st['res'] and 'ปราบ' in st['log'],st)
        await pg.screenshot(path=os.path.join(SHOT,'sv_gate_1440.png'))
        await pg.evaluate("AW.ui.sv.rt().load()");await pg.evaluate("AW.ui.sv.advance(120,{})")
        st=await pg.evaluate(f"({{n:window.__reps.length,back:AW.ui.sv.rt().foes.some(f=>f.key==='{k}')}})");check('โหลดพื้นที่ใหม่ ก๊อบลินที่ปราบแล้วไม่กลับมา ไม่ได้รางวัลซ้ำ',st=={'n':1,'back':False},st)
        # performance: ให้ requestAnimationFrame วิ่ง 3 วินาที
        await pg.evaluate("window.__s0=AW.ui.sv.stats()");await pg.keyboard.down('KeyD');await pg.wait_for_timeout(3000);await pg.keyboard.up('KeyD')
        pf=await pg.evaluate("(()=>{const a=window.__s0,b=AW.ui.sv.stats(),f=b.frames-a.frames;return{f,avg:(b.ms-a.ms)/Math.max(1,f)}})()")
        check(f'performance: frame เฉลี่ย < 4ms และวาด >= 100 เฟรมใน 3 วินาที {pf}',pf['f']>=100 and pf['avg']<4,pf)
        await pg.keyboard.press('Escape');await pg.wait_for_timeout(80)
        check('Dashboard เดิมยังใช้ได้หลังออกจากฉาก',await pg.is_visible('#locs') and not await pg.evaluate("AW.ui.sv.active()"))
        check('เดสก์ท็อป: ไม่มี JavaScript/console error',not errs,errs)
        await c.close()
        # มือถือ: ปุ่มสัมผัส
        c,pg,errs=await boot(b,viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
        await pg.evaluate(SCHOOL);await pg.wait_for_timeout(80);await pg.tap('#svgo [data-a=explore]');await pg.wait_for_timeout(200)
        check('มือถือ: ปุ่มสัมผัสแสดง',await pg.is_visible('.sv-touch [data-k=right]'))
        x0=await pg.evaluate("AW.ui.sv.rt().me.x");await pg.dispatch_event('.sv-touch [data-k=right]','pointerdown');await pg.wait_for_timeout(500);await pg.dispatch_event('.sv-touch [data-k=right]','pointerup')
        await pg.wait_for_timeout(200);x1=await pg.evaluate("AW.ui.sv.rt().me.x");check('มือถือ: กดปุ่ม ▶ ค้าง เดินขวา ปล่อยแล้วหยุด',x1-x0>30,(x0,x1))
        await pg.wait_for_timeout(150);check('มือถือ: ปล่อยปุ่มแล้วหยุดจริง',await pg.evaluate("AW.ui.sv.rt().me.vx")==0)
        y0=await pg.evaluate("AW.ui.sv.rt().me.y");await pg.dispatch_event('.sv-touch [data-k=jump]','pointerdown');await pg.wait_for_timeout(120);y1=await pg.evaluate("AW.ui.sv.rt().me.y");await pg.dispatch_event('.sv-touch [data-k=jump]','pointerup')
        check('มือถือ: ปุ่ม ▲ กระโดด',y1<y0-10,(y0,y1))
        hx=await pg.evaluate("(()=>{const n=AW.ui.sv.rt().npcs.find(n=>n.id==='hunter.best_friend');return n.x+n.w/2})()");await pg.evaluate(WALK+f"({hx})")
        await pg.dispatch_event('.sv-touch [data-k=interact]','pointerdown');await pg.dispatch_event('.sv-touch [data-k=interact]','pointerup');await pg.wait_for_timeout(200)
        check('มือถือ: ปุ่ม E คุยกับ NPC',await pg.is_visible('#svpanel [data-opt]'))
        box=await pg.evaluate("(()=>{const w=document.querySelector('.sv-wrap').getBoundingClientRect(),d=document.querySelector('.sv-dlg').getBoundingClientRect();return{fit:w.width<=390&&d.right<=391&&d.left>=-1,w:w.width}})()")
        check('มือถือ: ฉากและหน้าต่างไม่ล้นจอ',box['fit'],box)
        await pg.screenshot(path=os.path.join(SHOT,'sv_mobile_390.png'))
        await pg.tap('#svpanel [data-close]');await pg.tap('#sv [data-sv=exit]');await pg.wait_for_timeout(120)
        check('มือถือ: ปุ่ม ✕ กลับ Dashboard',not await pg.evaluate("AW.ui.sv.active()") and await pg.evaluate("AW.ui.state.page")=='dashboard')
        check('มือถือ: ไม่มี JavaScript/console error',not errs,errs)
        await c.close();await b.close()
    check('เกมเดิมไม่ถูกแก้ (hash เดิม)',hashlib.sha256(open(OLD,'rb').read()).hexdigest()==h0)
    print('\n'.join(res));f=sum(r.startswith('FAIL') for r in res);print(f'\n{len(res)-f} ผ่าน · {f} ไม่ผ่าน');raise SystemExit(1 if f else 0)
asyncio.run(main())
