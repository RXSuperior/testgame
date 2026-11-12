"""ตรวจว่าเกมเดิม (ต่างโลกที่ไม่มีทางกลับ) ไม่ถูกแก้ ใช้ร่วมกันใน smoke.py, ui_smoke.py, sv_smoke.py

พาธ: ตัวแปรแวดล้อม ORIGINAL_GAME_PATH ถ้ามี ไม่งั้นใช้ ../game4/index.html ข้างโฟลเดอร์ repo
ผลลัพธ์มี 3 แบบ และพิมพ์พาธกับที่มาของพาธเสมอ:
  PASS  ไฟล์มีอยู่ sha256 ตรงค่าที่ล็อกไว้ และไม่เปลี่ยนระหว่างรันทดสอบ
  FAIL  ไฟล์มีอยู่แต่ sha256 ไม่ตรง (เกมเดิมถูกแก้) หรือเปลี่ยนระหว่างรัน
  SKIP  ไม่พบไฟล์ (บอกเหตุผล) · ไม่นับว่าผ่าน
ค่า sha256 ด้านล่างคือไฟล์เกมเดิมที่ล็อกไว้ตั้งแต่ Phase 1 ห้ามแก้ค่าเพื่อให้ทดสอบผ่าน"""
import hashlib,os
EXPECTED='d53b7879736bc2b95e85ca6d1a06f1fb13c0bc42d55ae3d224574ccc81fe79fe'
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FALLBACK=os.path.join(os.path.dirname(ROOT),'game4','index.html')
NAME='Original hash check'

def _sha(p):
    with open(p,'rb') as f:return hashlib.sha256(f.read()).hexdigest()

def resolve(env=None):
    """คืน (พาธ, ที่มา) · env ใช้แทน os.environ ในการทดสอบตัวเอง"""
    env=os.environ if env is None else env
    p=env.get('ORIGINAL_GAME_PATH')
    return (os.path.abspath(p),'ORIGINAL_GAME_PATH') if p else (FALLBACK,'fallback ../game4/index.html')

class Original:
    """เรียก Original() ตอนเริ่ม และ .result() ตอนจบ คืน (สถานะ, ข้อความ)"""
    def __init__(self,env=None,expected=EXPECTED):
        self.path,self.src=resolve(env);self.expected=expected
        self.h0=_sha(self.path) if os.path.isfile(self.path) else None
    def result(self):
        where=f'{self.path} (จาก {self.src})'
        if self.h0 is None:
            return 'SKIP',f'{NAME} ถูกข้าม: ไม่พบไฟล์เกมเดิมที่ {where} · ตั้ง ORIGINAL_GAME_PATH ให้ชี้ไปที่ index.html ของเกมเดิมเพื่อเปิดการตรวจ'
        if not os.path.isfile(self.path):
            return 'FAIL',f'{NAME}: ไฟล์เกมเดิมหายไประหว่างรันทดสอบ {where}'
        h1=_sha(self.path)
        if h1!=self.h0:return 'FAIL',f'{NAME}: ไฟล์เกมเดิมเปลี่ยนระหว่างรันทดสอบ {where}'
        if h1!=self.expected:return 'FAIL',f'{NAME}: sha256 {h1[:12]} ไม่ตรงค่าที่ล็อกไว้ {self.expected[:12]} {where}'
        return 'PASS',f'{NAME}: เกมเดิมไม่ถูกแก้ sha256 {h1[:8]} {where}'

def report(res,orig):
    """เพิ่มผลตรวจเกมเดิมลงรายการผลทดสอบ แล้วคืนจำนวนที่ข้าม (0 หรือ 1)"""
    st,msg=orig.result();res.append(f'{st} {msg}');return 1 if st=='SKIP' else 0

def summary(res,skipped):
    f=sum(r.startswith('FAIL') for r in res);p=sum(r.startswith('PASS') for r in res)
    return f'\n{p} ผ่าน · {f} ไม่ผ่าน'+(f' · ข้าม {skipped} (ดูบรรทัด SKIP)' if skipped else ''),f
