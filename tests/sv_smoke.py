"""ทดสอบ Side-view (Phase 7B.3) ในเบราว์เซอร์จริง: python3 tests/sv_smoke.py
คีย์บอร์ด · ปุ่มสัมผัสบนมือถือ · คุยกับฮาจุน · ประตู · ต่อสู้ก๊อบลิน · เซฟ/โหลดตำแหน่ง · Esc กลับ Dashboard · performance · console error"""
import asyncio,os,sys,json
from playwright.async_api import async_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));URL='file://'+R+'/dist/index.html'
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));from original_game import Original,report,summary
ORIG=Original()
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
 if(Math.abs(cx-fx)>36)S.advance(1,{right:cx<fx,left:cx>fx,jump:true,jumpPressed:rt.me.ground&&rt.me.vx===0&&g>1});else S.advance(1,{right:fx>cx&&rt.me.facing<0,left:fx<cx&&rt.me.facing>0,attackPressed:g%3===0})}return k})()"""
async def boot(b,**ctx):
    c=await b.new_context(**ctx);pg=await c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append('page: '+str(e)));pg.on('console',lambda m:errs.append('console: '+m.text) if m.type=='error' else None)
    await pg.goto(URL);await pg.wait_for_timeout(300)
    await pg.fill('#pname','ทดสอบSV');await pg.click('#pcreate');await pg.wait_for_timeout(100);await pg.evaluate(CLR)
    return c,pg,errs
# ---- Phase 7B.3 Bug Fix: regression ในเบราว์เซอร์จริง ----
HAJUN_X="(()=>{const n=AW.ui.sv.rt().npcs.find(n=>n.id==='hunter.best_friend');return n.x+n.w/2})()"
OUTSIDE="(()=>{const a=document.activeElement;return a&&a!==document.body&&!a.closest('#sv')?(a.id||a.outerHTML.slice(0,60)):null})()"
# ภาพทดสอบสร้างในหน้าเว็บ (data URL) แล้วใส่ src+license ให้ asset ตอน runtime: ทดสอบทางเดียวกับที่ภาพจริงจะใช้ โดยไม่เพิ่มไฟล์ภาพเข้า repo
SETIMG="""(([id,w,h,mode])=>{const E=AW.engine,d=E.assets.defs.get(id),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 if(mode==='tiles'){[[0,'#ff0000'],[1,'#00ff00'],[8,'#0000ff']].forEach(([i,col])=>{g.fillStyle=col;g.fillRect((i%8)*16,Math.floor(i/8)*16,16,16)})}else{g.fillStyle='#ff00ff';g.fillRect(0,0,w,h)}
 d.src=mode==='missing'?'assets/none/missing.png':c.toDataURL();d.license='own';E.assets.cache.delete(id);AW.ui.assets.attach(E);E.assets.get(id);return 1})"""
PIX="(([x,y])=>{const rt=AW.ui.sv.rt();AW.ui.sv.advance(1,{});return [...document.querySelector('#svc').getContext('2d').getImageData(Math.round(x-rt.cam.x),Math.round(y),1,1).data].slice(0,3)})"
RECTS="""(()=>{const q=e=>{const r=e.getBoundingClientRect();return{l:r.left,t:r.top,r:r.right,b:r.bottom}},cv=q(document.querySelector('#svc')),bs=[...document.querySelectorAll('.sv-touch button')].map(q);
 const hit=bs.filter(b=>b.l<cv.r-0.5&&b.r>cv.l+0.5&&b.t<cv.b-0.5&&b.b>cv.t+0.5).length,out=bs.concat([cv]).filter(b=>b.l<-0.5||b.t<-0.5||b.r>innerWidth+0.5||b.b>innerHeight+0.5).length;
 return{n:bs.length,vis:bs.filter(b=>b.r-b.l>=40).length,hit,out,cw:Math.round(cv.r-cv.l),ch:Math.round(cv.b-cv.t)}})()"""
LAYOUTS=[]
def inter(a,b):return a[0]<b[2]-0.5 and a[2]>b[0]+0.5 and a[1]<b[3]-0.5 and a[3]>b[1]+0.5
LAYOUT="""(()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return r.width&&r.height?[r.left,r.top,r.right,r.bottom]:null};
 const L=AW.ui.sv.layout(),cv=q('#svc'),pct=Math.round((cv[2]-cv[0])*(cv[3]-cv[1])/(innerWidth*innerHeight)*1000)/10,msg=[...document.querySelectorAll('.sv-prompt,.sv-log')].map(e=>e.getBoundingClientRect()).filter(r=>r.width).map(r=>[r.left,r.top,r.right,r.bottom]);
 const over={hud:q('#svhud'),top:q('.sv-top'),pl:q('.sv-touch.l'),pr:q('.sv-touch.r')};msg.forEach((r,i)=>over['msg'+i]=r);
 return{...L,cv,pct,over,pixelated:['pixelated','crisp-edges'].includes(getComputedStyle(document.querySelector('#svc')).imageRendering)}})()"""
DLG="""(()=>{const q=s=>{const r=document.querySelector(s).getBoundingClientRect();return[r.left,r.top,r.right,r.bottom]},d=q('.sv-dlg');
 return{dlg:d,hud:q('#svhud'),top:q('.sv-top'),ok:d[0]>=-0.5&&d[1]>=-0.5&&d[2]<=innerWidth+0.5&&d[3]<=innerHeight+0.5,minBtn:Math.round(Math.min(...[...document.querySelectorAll('.sv-dlg button')].map(b=>b.getBoundingClientRect().height)))}})()"""
PADS="""(()=>{const c=k=>{const r=document.querySelector(`.sv-touch [data-k=${k}]`).getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};return{right:c('right'),jump:c('jump')}})()"""
async def fixes():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
        c,pg,errs=await boot(b,viewport={'width':1440,'height':900})
        await pg.evaluate(SCHOOL)
        await pg.evaluate("(()=>{const E=AW.engine;window.__sv=0;const o=E.saveTo.bind(E);E.saveTo=s=>{window.__sv++;return o(s)};window.__ans=[];const ev=E.events,a=ev.answer.bind(ev);ev.answer=i=>{try{const r=a(i);window.__ans.push('ok');return r}catch(x){window.__ans.push('ERR '+x.message);throw x}};return 1})()")
        # focus: หน้าเกมด้านหลัง inert · Tab ไม่หลุดออกจากฉาก
        await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(120)
        check('fix focus: เปิดฉากแล้วหน้าเกมด้านหลัง inert และ focus อยู่ในฉาก',await pg.evaluate("document.querySelector('#app').inert===true&&!!document.activeElement.closest('#sv')"))
        esc=None
        for k in range(30):
            await pg.keyboard.press('Tab');esc=esc or await pg.evaluate(OUTSIDE)
        for k in range(8):
            await pg.keyboard.press('Shift+Tab');esc=esc or await pg.evaluate(OUTSIDE)
        check('fix focus: กด Tab/Shift+Tab 38 ครั้ง focus ไม่หลุดไปปุ่มของหน้าเกม',esc is None and await pg.evaluate("AW.ui.sv.active()"),esc)
        await pg.evaluate("document.querySelector('#svwrap').focus()")
        # listener: เปิด/ปิดสามรอบ แล้วกดเซฟและตอบเหตุการณ์อย่างละหนึ่งคลิก
        for n in (1,2):
            await pg.keyboard.press('Escape');await pg.wait_for_timeout(80);await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(100)
        await pg.evaluate("window.__sv=0");await pg.click('#sv [data-sv=save]');await pg.wait_for_timeout(80)
        check('fix listener: เปิดฉากครั้งที่ 3 กดเซฟหนึ่งคลิก saveTo ถูกเรียกครั้งเดียว',await pg.evaluate("window.__sv")==1,await pg.evaluate("window.__sv"))
        await pg.evaluate(WALK+f"({await pg.evaluate(HAJUN_X)})");await pg.keyboard.press('KeyE');await pg.wait_for_timeout(100)
        i=await pg.evaluate("[...document.querySelectorAll('#svpanel [data-opt]')].findIndex(b=>b.innerText.includes('★'))")
        await pg.click(f'#svpanel [data-opt="{i}"]');await pg.wait_for_timeout(80);await pg.click('#svpanel [data-ans]:not([disabled])');await pg.wait_for_timeout(120)
        check('fix listener: ตอบเหตุการณ์หนึ่งคลิก events.answer ถูกเรียกครั้งเดียว ไม่มี error',await pg.evaluate("window.__ans")==['ok'],await pg.evaluate("window.__ans"))
        # Space / Enter ใน dialog · E ค้างไม่เปิดซ้ำ
        check('fix dialog: ผลลัพธ์เปิดอยู่ focus อยู่ที่ปุ่มตกลง',await pg.evaluate("AW.ui.sv.panel().kind==='result'&&document.activeElement.hasAttribute('data-close')"))
        await pg.keyboard.press('Space');await pg.wait_for_timeout(80);check('fix dialog: Space กดปุ่มที่ focus ได้ (ปิดผลลัพธ์)',await pg.evaluate("AW.ui.sv.panel()===null"))
        y0=await pg.evaluate("AW.ui.sv.rt().me.y");await pg.wait_for_timeout(120);check('fix dialog: Space ที่ใช้ปิด dialog ไม่ทำให้กระโดดตาม',await pg.evaluate("AW.ui.sv.rt().me.y")==y0)
        await pg.keyboard.press('KeyE');await pg.wait_for_timeout(100);check('fix dialog: เปิดหน้าต่างคุยอีกครั้ง',await pg.evaluate("AW.ui.sv.panel()&&AW.ui.sv.panel().kind")=='talk')
        await pg.evaluate("document.querySelector('#svpanel [data-opt]:not([disabled])').focus()");await pg.keyboard.press('Enter');await pg.wait_for_timeout(100)
        check('fix dialog: Enter กดตัวเลือกที่ focus ได้',await pg.evaluate("AW.ui.sv.panel()&&AW.ui.sv.panel().kind")=='result')
        await pg.keyboard.down('KeyE');await pg.wait_for_timeout(60);closed=await pg.evaluate("AW.ui.sv.panel()===null")
        for k in range(6):
            await pg.keyboard.down('KeyE');await pg.wait_for_timeout(40)
        still=await pg.evaluate("AW.ui.sv.panel()===null");await pg.keyboard.up('KeyE')
        check('fix dialog: E ปิดผลลัพธ์ และ E ที่กดค้าง (key repeat) ไม่เปิดหน้าต่างคุยซ้ำ',closed and still,(closed,still))
        # โหลดเซฟระหว่างอยู่ในฉาก (ผ่าน API เดียวกับปุ่มโหลด)
        await pg.evaluate("AW.engine.loadFrom(0)");await pg.wait_for_timeout(200)
        st=await pg.evaluate("({on:AW.ui.sv.active(),hidden:document.querySelector('#sv').hidden,inert:document.querySelector('#app').inert,reasons:[...AW.engine.loop.reasons],rt:AW.engine.sv.runtime===null})")
        check('fix pause: โหลดเซฟระหว่างอยู่ในฉาก ฉากปิดเอง explore ไม่ค้าง หน้าเกมกลับมาใช้ได้',not st['on'] and st['hidden'] and not st['inert'] and 'explore' not in st['reasons'] and st['rt'],st)
        await pg.evaluate(CLR);m0=await pg.evaluate("AW.engine.loop.month");await pg.click('#step');await pg.wait_for_timeout(100);await pg.evaluate(CLR)
        check('fix pause: หลังจากนั้นปุ่มเดินเวลาทำงาน (เดือน +1)',await pg.evaluate("AW.engine.loop.month")==m0+1)
        # ลูปวาดหยุดหลังปิด · เปิดซ้อนได้ลูปเดียว
        await pg.evaluate(SCHOOL);await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(100)
        two=await pg.evaluate("(()=>{const a=AW.ui.sv.rt(),ok=AW.ui.sv.open()&&AW.ui.sv.open();return ok&&AW.ui.sv.rt()===a&&AW.engine.sv.runtime===a})()")
        c0=await pg.evaluate("AW.ui.sv.stats().calls");await pg.wait_for_timeout(500);c1=await pg.evaluate("AW.ui.sv.stats().calls")
        check(f'fix lifecycle: open ซ้อนไม่สร้าง runtime/ลูปที่สอง ({c1-c0} เฟรมใน 0.5 วินาที)',two and 15<=c1-c0<=40,(two,c1-c0))
        await pg.keyboard.press('Escape');await pg.wait_for_timeout(120);c2=await pg.evaluate("AW.ui.sv.stats().calls");await pg.wait_for_timeout(400);c3=await pg.evaluate("AW.ui.sv.stats().calls")
        check('fix lifecycle: ปิดฉากแล้วลูปวาดหยุด (ไม่มี requestAnimationFrame ค้าง)',c3==c2 and await pg.evaluate("document.querySelector('#app').inert===false"),(c2,c3))
        # เริ่มเกมใหม่ระหว่างอยู่ในฉาก
        await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(100);await pg.evaluate("(()=>{AW.engine.newGame({seed:'again'});AW.engine.worlds.start('hunter');return 1})()");await pg.wait_for_timeout(200)
        st=await pg.evaluate("({on:AW.ui.sv.active(),reasons:[...AW.engine.loop.reasons],inert:document.querySelector('#app').inert})")
        check('fix pause: เริ่มเกมใหม่ระหว่างอยู่ในฉาก ฉากปิดเอง explore ไม่ค้าง',not st['on'] and 'explore' not in st['reasons'] and not st['inert'],st)
        check('fix: ส่วนนี้ไม่มี JavaScript/console error',not errs,errs);await c.close()
        # ---- NPC จำนวนมาก · HUD · AP · ภาพจริง/ภาพเสีย ----
        c,pg,errs=await boot(b,viewport={'width':1440,'height':900})
        await pg.evaluate(SCHOOL);await pg.evaluate("(()=>{for(let i=0;i<15;i++)AW.engine.npcs.generate('hunter',{occupation:'student'});AW.engine.state.mutate('player','player',p=>{p.ap=2});AW.ui.update(true);return 1})()")
        await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(150)
        st=await pg.evaluate("({scene:AW.ui.sv.rt().npcs.length,real:AW.engine.npcs.at('hunter','school').filter(n=>n.alive).length})")
        check(f"fix NPC: ทุกคนในสถานที่ถูกวาดในฉาก ({st['scene']} คน)",st['scene']==st['real'] and st['real']>=15,st)
        await pg.screenshot(path=os.path.join(SHOT,'sv_crowd_1440.png'))
        # แผ่น sprite ขนาดผิด (64x64 แทน 384x448): placeholder + แจ้งใน debug
        await pg.evaluate(SETIMG+"(['hunter.sv.npc_m',64,64,'fill'])");await pg.evaluate(SETIMG+"(['hunter.sv.npc_f',64,64,'fill'])");await pg.wait_for_timeout(250)
        np=await pg.evaluate("(()=>{const rt=AW.ui.sv.rt(),n=rt.npcs[0];rt.me.x=n.x-40;AW.ui.sv.advance(2,{});return [n.x+n.w/2-8,n.y+n.h-6]})()");px=await pg.evaluate(PIX+f"({json.dumps(np)})")
        warn=await pg.evaluate("AW.engine.debug.errors.filter(m=>m.includes('เล็กกว่าที่ metadata'))")
        check('fix asset: แผ่น sprite เล็กกว่า metadata ใช้ placeholder และแจ้งใน debug',px==[143,209,143] and len(warn)>=1,(px,warn))
        await pg.keyboard.press('Escape');await pg.wait_for_timeout(80)
        await pg.evaluate(HUNTER);await pg.evaluate("(()=>{const E=AW.engine;E.state.mutate('player','player',p=>{p.exp=E.player.expNeed()-5});return 1})()")
        await pg.click('#svgo [data-a=explore]');await pg.wait_for_timeout(150);lv=await pg.evaluate("AW.engine.player.get().level");await pg.evaluate(FIGHT);await pg.wait_for_timeout(80)
        st=await pg.evaluate("(()=>{const m=/HP (\\d+)\\/(\\d+)/.exec(document.querySelector('#svhud').innerText),p=AW.engine.player;return{hp:+m[1],max:+m[2],real:p.maxHp(),lv:p.get().level,ap:p.get().ap,hud:document.querySelector('#svhud').innerText}})()")
        check('fix HUD: หลังเลเวลอัปในฉาก HP ไม่เกินค่าสูงสุด และค่าสูงสุดตรงกับผู้เล่น',st['lv']==lv+1 and st['hp']<=st['max'] and st['max']==st['real'],st)
        check('fix AP: ศึกหนึ่งครั้งใช้ 1 AP และ HUD แสดง AP ที่เหลือ',st['ap']==1 and 'AP 1' in st['hud'],st)
        await pg.evaluate("(()=>{AW.engine.state.mutate('player','player',p=>{p.ap=0});AW.ui.sv.advance(2,{});return 1})()")
        check('fix AP: AP หมด HUD บอกว่าต่อสู้ไม่ได้',('ต่อสู้ไม่ได้' in await pg.inner_text('#svhud')))
        # sprite เสีย: ลูปไม่หยุด วาด placeholder
        f0=await pg.evaluate("AW.ui.sv.stats().frames");await pg.evaluate(SETIMG+"(['hunter.sv.goblin',0,0,'missing'])");await pg.wait_for_timeout(600);f1=await pg.evaluate("AW.ui.sv.stats().frames")
        await pg.evaluate("(()=>{const rt=AW.ui.sv.rt(),f=rt.foes[0];AW.engine.state.mutate('player','player',p=>{p.ap=0});rt.me.x=f.x-80;AW.ui.sv.advance(2,{});return 1})()")
        gp=await pg.evaluate("(()=>{const f=AW.ui.sv.rt().foes[0];return [f.x+f.w/2-8,f.y+f.h-6]})()");px=await pg.evaluate(PIX+f"({json.dumps(gp)})")
        await pg.evaluate("(()=>{AW.engine.state.mutate('player','player',p=>{p.ap=2});return 1})()")
        pe=[e for e in errs if e.startswith('page:')]
        check('fix asset: sprite โหลดไม่ได้ ลูปวาดไม่หยุด ไม่มี exception',f1-f0>=20 and not pe and await pg.evaluate("AW.ui.assets.status('hunter.sv.goblin')")=='missing',(f1-f0,pe))
        check('fix asset: sprite โหลดไม่ได้ วาด placeholder แทน',px==[127,191,63],px)
        # sprite จริงขนาดถูก: วาดจากแผ่น · ขนาดแผ่นผิด: placeholder + แจ้งเตือน
        await pg.evaluate(SETIMG+"(['shared.sv.player_m',384,448,'fill'])");await pg.wait_for_timeout(250)
        mp=await pg.evaluate("(()=>{const m=AW.ui.sv.rt().me;return [m.x+m.w/2,m.y+m.h-1]})()");px=await pg.evaluate(PIX+f"({json.dumps(mp)})")
        check('fix asset: sprite จริงวาดจากแผ่นตาม metadata (แถวล่างสุดของเฟรมอยู่บนพื้นพอดี)',px==[255,0,255],px)
        px=await pg.evaluate(PIX+f"({json.dumps([mp[0],mp[1]+1.5])})");check('fix asset: sprite จริงไม่จมลงในพื้น',px!=[255,0,255],px)
        # tileset จริงจาก Asset Registry
        before=await pg.evaluate(PIX+"([AW.ui.sv.rt().cam.x+300,298])");await pg.evaluate(SETIMG+"(['hunter.tile.gate',128,32,'tiles'])");await pg.wait_for_timeout(250)
        top=await pg.evaluate(PIX+"([AW.ui.sv.rt().cam.x+300,298])");fill=await pg.evaluate(PIX+"([AW.ui.sv.rt().cam.x+300,318])")
        await pg.evaluate("(()=>{const rt=AW.ui.sv.rt();rt.me.x=930;rt.me.y=100;AW.ui.sv.advance(40,{});return 1})()");plat=await pg.evaluate(PIX+"([960,232])")
        check('fix asset: tileset จริงถูกวาดจาก Asset Registry (ผิวพื้น/เนื้อพื้น/แพลตฟอร์ม ตามช่องใน metadata)',top==[255,0,0] and fill==[0,0,255] and plat==[0,255,0] and before!=top,(before,top,fill,plat))
        await pg.screenshot(path=os.path.join(SHOT,'sv_real_assets_1440.png'))
        exp=[e for e in errs if not ('Failed to load resource' in e)]
        check('fix asset: ไม่มี error อื่นนอกจากไฟล์ที่ตั้งใจให้หาย',not exp and len(errs)<=1,errs);await c.close()
        # ---- Layout 5 ขนาด: พื้นที่ภาพเกมจริง · ไม่มีอะไรทับภาพเกม · pixel perfect · ไม่ยืด · หน้าต่างไม่ทับ HUD · multi-touch ----
        for (w,h,dpr,mob,name) in ((390,844,3,1,'portrait'),(360,740,3,1,'portrait'),(430,932,3,1,'portrait'),(844,390,3,1,'landscape'),(1280,720,1,0,'desktop')):
            kw=dict(viewport={'width':w,'height':h},device_scale_factor=dpr)
            if mob:kw.update(has_touch=True,is_mobile=True)
            c,pg,errs=await boot(b,**kw);tag=f'{w}x{h}'
            await pg.evaluate(SCHOOL);await pg.evaluate("document.querySelector('#svgo [data-a=explore]').click()");await pg.wait_for_timeout(200)
            L=await pg.evaluate(LAYOUT);cv=L['cv'];LAYOUTS.append((tag,name,L))
            cover=[k for k,r in L['over'].items() if r and inter(r,cv)]
            check(f"layout {tag} {name}: ภาพเกม {round(cv[2]-cv[0])}x{round(cv[3]-cv[1])} px ({L['pct']}% ของจอ) มุมกล้อง {L['view']}x324 พิกเซลโลก",L['pct']>0,L)
            check(f'layout {tag}: ไม่ยืดภาพ (กว้าง/สูงตรงสัดส่วนมุมกล้อง) และอยู่ในจอทั้งหมด',abs((cv[2]-cv[0])/(cv[3]-cv[1])-L['view']/324)<0.01 and cv[0]>=-0.5 and cv[1]>=-0.5 and cv[2]<=w+0.5 and cv[3]<=h+0.5,cv)
            check(f'layout {tag}: pixel perfect (ขยายแบบ nearest-neighbor: image-rendering pixelated/crisp-edges)',L['pixelated'])
            if name=='portrait':
                check(f"layout {tag}: แนวตั้งใช้ scale x dpr เป็นจำนวนเต็ม ({L['scale']:.3f} x {dpr})",abs(L['scale']*dpr-round(L['scale']*dpr))<1e-6,L['scale'])
                check(f'layout {tag}: แนวตั้ง HUD ปุ่มเซฟ/ออก ข้อความ และปุ่มสัมผัส ไม่ทับภาพเกมเลย',not cover,cover)
                check(f"layout {tag}: แนวตั้งภาพเกมใหญ่กว่าแบบ 16:9 เดิมอย่างน้อย 2 เท่า (เดิม {w}x{round(w*9/16)})",(cv[3]-cv[1])>=2*w*9/16,cv)
                check(f'layout {tag}: แนวตั้ง HUD ไม่ทับปุ่มเซฟ/ออก',not inter(L['over']['hud'],L['over']['top']))
            else:
                check(f'layout {tag}: {name} รูปแบบเดิม (มุมกล้อง 576 · HUD มุมซ้ายบนของภาพ · ปุ่มเซฟมุมขวาบน)',L['view']==576 and abs(L['over']['hud'][0]-cv[0]-8)<1 and abs(L['over']['hud'][1]-cv[1]-8)<1 and abs(cv[2]-L['over']['top'][2]-8)<1,L)
                check(f'layout {tag}: {name} ปุ่มสัมผัสไม่ทับภาพเกม',not [k for k in('pl','pr') if L['over'][k] and inter(L['over'][k],cv)])
            await pg.screenshot(path=os.path.join(SHOT,f'sv_layout_{tag}.png'))
            # หน้าต่างคุย: ไม่ทับ HUD/ปุ่มเซฟ อยู่ในจอ ปุ่มสูงพอสำหรับนิ้ว
            await pg.evaluate(WALK+f"({await pg.evaluate(HAJUN_X)})");await pg.keyboard.press('KeyE');await pg.wait_for_timeout(150)
            D=await pg.evaluate(DLG)
            check(f'layout {tag}: หน้าต่างคุยไม่ทับ HUD และปุ่มเซฟ/ออก และอยู่ในจอทั้งหมด',D['ok'] and not inter(D['dlg'],D['hud']) and not inter(D['dlg'],D['top']),D)
            if mob:check(f"layout {tag}: ปุ่มในหน้าต่างสูงอย่างน้อย 44px (เตี้ยสุด {D['minBtn']}px)",D['minBtn']>=44 or name!='portrait',D['minBtn'])
            await pg.screenshot(path=os.path.join(SHOT,f'sv_layout_{tag}_dialog.png'))
            await pg.keyboard.press('Escape');await pg.wait_for_timeout(80)
            if mob:
                # multi-touch จริง (CDP touch): นิ้วหนึ่งกด ▶ ค้าง อีกนิ้วกด ▲ = เดินขวาพร้อมกระโดด · ยกนิ้วกระโดดแล้วยังเดินต่อ
                cdp=await c.new_cdp_session(pg);P=await pg.evaluate(PADS)
                st0=await pg.evaluate("(()=>{const m=AW.ui.sv.rt().me;return{x:m.x,y:m.y}})()")
                await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':P['right'][0],'y':P['right'][1],'id':1}]});await pg.wait_for_timeout(150)
                await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':P['right'][0],'y':P['right'][1],'id':1},{'x':P['jump'][0],'y':P['jump'][1],'id':2}]});await pg.wait_for_timeout(120)
                both=await pg.evaluate("(()=>{const m=AW.ui.sv.rt().me;return{x:m.x,y:m.y,on:[...document.querySelectorAll('.sv-touch button.on')].map(b=>b.dataset.k).sort()}})()")
                # Chrome CDP: touchEnd ที่ระบุจุด = ยกเฉพาะนิ้วนั้น (นิ้ว 2 = ▲) · touchEnd ว่าง = ยกนิ้วที่เหลือทั้งหมด
                await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[{'x':P['jump'][0],'y':P['jump'][1],'id':2}]});await pg.wait_for_timeout(250)
                after=await pg.evaluate("(()=>{const m=AW.ui.sv.rt().me;return{x:m.x,on:[...document.querySelectorAll('.sv-touch button.on')].map(b=>b.dataset.k)}})()")
                await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});await pg.wait_for_timeout(300)
                end=await pg.evaluate("(()=>{const m=AW.ui.sv.rt().me;return{x:m.x,vx:m.vx,on:document.querySelectorAll('.sv-touch button.on').length}})()")
                check(f'layout {tag}: multi-touch สองนิ้ว (▶ ค้าง + ▲) เดินและกระโดดพร้อมกัน',both['on']==['jump','right'] and both['x']>st0['x']+5 and both['y']<st0['y']-10,(st0,both))
                check(f'layout {tag}: multi-touch ยกนิ้ว ▲ แล้ว ▶ ยังค้าง เดินต่อ · ยกทุกนิ้วแล้วหยุด',after['on']==['right'] and after['x']>both['x'] and end['on']==0 and end['vx']==0,(after,end))
            # หมุนจอ (resize): layout จัดใหม่ทันที
            if name=='portrait' and w==390:
                await pg.set_viewport_size({'width':844,'height':390});await pg.wait_for_timeout(200);R1=await pg.evaluate("AW.ui.sv.layout()")
                await pg.set_viewport_size({'width':390,'height':844});await pg.wait_for_timeout(200);R2=await pg.evaluate("AW.ui.sv.layout()")
                check('layout หมุนจอ 390x844 -> 844x390 -> 390x844 จัดใหม่ทุกครั้ง',not R1['portrait'] and R1['view']==576 and R2['portrait'] and R2['view']==L['view'],(R1,R2))
            check(f'layout {tag}: ไม่มี JavaScript/console error',not errs,errs);await c.close()
        await b.close()
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
    await fixes()
    sk=report(res,ORIG);line,f=summary(res,sk);print('\n'.join(res))
    print('\nพื้นที่ภาพเกม (CSS px · % ของจอ · มุมกล้องพิกเซลโลก · scale):')
    for tag,name,L in LAYOUTS:cv=L['cv'];print(f"  {tag:9} {name:9} {round(cv[2]-cv[0])}x{round(cv[3]-cv[1])} · {L['pct']}% · {L['view']}x324 · x{L['scale']:.3f}")
    print(line);raise SystemExit(1 if f else 0)
asyncio.run(main())
