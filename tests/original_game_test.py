"""ทดสอบตัวตรวจเกมเดิม (tests/original_game.py): python3 tests/original_game_test.py
ครอบคลุม: มีไฟล์และตรง · ไม่มีไฟล์ (env และพาธสำรอง) · ไฟล์ถูกแก้ · ไฟล์เปลี่ยน/หายระหว่างรัน · ชุดทดสอบเบราว์เซอร์ทั้งสามใช้ตัวตรวจนี้และไม่มีพาธตายตัว
ไม่แตะไฟล์เกมเดิมจริง: ใช้สำเนาในโฟลเดอร์ชั่วคราว"""
import os,sys,tempfile,shutil,hashlib,re
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
import original_game as O
res=[]
def check(n,c,x=''):res.append(('PASS ' if c else 'FAIL ')+n+(' :: '+str(x) if not c and x!='' else ''))
tmp=tempfile.mkdtemp()
try:
    good=os.path.join(tmp,'good.html');open(good,'wb').write(b'<html>original</html>');H=hashlib.sha256(b'<html>original</html>').hexdigest()
    # มีไฟล์ ค่า hash ตรง
    o=O.Original({'ORIGINAL_GAME_PATH':good},expected=H);st,m=o.result()
    check('มีไฟล์และ sha256 ตรง = PASS และบอกพาธกับที่มา',st=='PASS' and good in m and 'ORIGINAL_GAME_PATH' in m,(st,m))
    # มีไฟล์ แต่ไม่ตรงค่าที่ล็อก (เกมเดิมถูกแก้ก่อนรัน)
    st,m=O.Original({'ORIGINAL_GAME_PATH':good},expected='0'*64).result()
    check('ไฟล์ถูกแก้ (sha256 ไม่ตรงค่าที่ล็อก) = FAIL',st=='FAIL' and 'ไม่ตรงค่าที่ล็อกไว้' in m,(st,m))
    # เปลี่ยนระหว่างรัน
    o=O.Original({'ORIGINAL_GAME_PATH':good},expected=H);open(good,'ab').write(b'x');st,m=o.result()
    check('ไฟล์เปลี่ยนระหว่างรันทดสอบ = FAIL',st=='FAIL' and 'เปลี่ยนระหว่างรัน' in m,(st,m))
    o=O.Original({'ORIGINAL_GAME_PATH':good},expected=H);os.remove(good);st,m=o.result()
    check('ไฟล์หายระหว่างรันทดสอบ = FAIL',st=='FAIL' and 'หายไป' in m,(st,m))
    # ไม่มีไฟล์: ระบุผ่าน env
    miss=os.path.join(tmp,'nope','index.html');st,m=O.Original({'ORIGINAL_GAME_PATH':miss}).result()
    check('ไม่มีไฟล์ตาม ORIGINAL_GAME_PATH = SKIP พร้อมเหตุผลและพาธ',st=='SKIP' and 'ถูกข้าม' in m and miss in m and 'ORIGINAL_GAME_PATH' in m,(st,m))
    # ไม่มี env: ใช้พาธสำรอง ../game4/index.html ข้าง repo
    p,src=O.resolve({});check('ไม่มี env ใช้พาธสำรองข้างโฟลเดอร์ repo',p==os.path.join(os.path.dirname(O.ROOT),'game4','index.html') and src.startswith('fallback'),(p,src))
    old=O.FALLBACK;O.FALLBACK=miss
    try:st,m=O.Original({}).result()
    finally:O.FALLBACK=old
    check('ไม่มี env และไม่มีพาธสำรอง = SKIP พร้อมเหตุผล',st=='SKIP' and 'fallback' in m and miss in m,(st,m))
    # SKIP ไม่นับเป็นผ่าน และบรรทัดสรุปบอกจำนวนที่ข้าม
    r=['PASS a'];sk=O.report(r,O.Original({'ORIGINAL_GAME_PATH':miss}));line,f=O.summary(r,sk)
    check('สรุปผล: SKIP ไม่นับเป็นผ่าน และแสดงจำนวนที่ข้าม',sk==1 and f==0 and line.strip().startswith('1 ผ่าน') and 'ข้าม 1' in line and r[-1].startswith('SKIP'),(line,r))
    open(good,'wb').write(b'<html>original</html>');r=['PASS a'];sk=O.report(r,O.Original({'ORIGINAL_GAME_PATH':good},expected=H));line,f=O.summary(r,sk)
    check('สรุปผล: ไม่มีการข้าม = นับเป็นผ่าน ไม่มีข้อความข้าม',sk==0 and f==0 and line.strip().startswith('2 ผ่าน') and 'ข้าม' not in line,(line,r))
finally:shutil.rmtree(tmp)
# ค่าที่ล็อกไว้ต้องเป็นค่าเดิมของเกมเดิม (ตั้งแต่ Phase 1)
check('ค่า sha256 ที่ล็อกไว้เป็นค่าเดิม d53b7879…',O.EXPECTED=='d53b7879736bc2b95e85ca6d1a06f1fb13c0bc42d55ae3d224574ccc81fe79fe')
# เกมเดิมจริง (ถ้ามี) ตรงค่าที่ล็อก
st,m=O.Original().result();check('เกมเดิมจริงบนเครื่องนี้: '+st,st in('PASS','SKIP'),m);res.append('INFO '+m)
# ชุดทดสอบเบราว์เซอร์ทั้งสามใช้ตัวตรวจนี้ ไม่มีพาธตายตัว และไม่มีการตรวจ hash แบบเดิมหลงเหลือ
for t in('smoke.py','ui_smoke.py','sv_smoke.py'):
    s=open(os.path.join(HERE,t),encoding='utf8').read()
    check(f'{t}: ใช้ Original() และ report() อย่างละครั้ง ไม่มีพาธเกมเดิมตายตัว',len(re.findall(r'\bOriginal\(\)',s))==1 and len(re.findall(r'\breport\(res,ORIG\)',s))==1 and 'game4' not in s and 'hashlib' not in s)
print('\n'.join(res));f=sum(r.startswith('FAIL') for r in res);print(f'\n{sum(r.startswith("PASS") for r in res)} ผ่าน · {f} ไม่ผ่าน');raise SystemExit(1 if f else 0)
