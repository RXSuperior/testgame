# Phase 5 test report (2026-11-11)

Commands:
- `python3 tools/build.py`
- `node tests/core.test.js`
- `python3 tests/smoke.py`
- `node tests/sim.js 20` and `node tests/sim.js 5 idle`
- `node tests/balance.js`
- `node tests/perf5.js`

## Build
built dist/index.html 302898 bytes from 45 files. `node --check` passed.

## Unit: 235 pass, 0 fail
193 old tests (assertions updated: player `_v` is 3, rank D needed to equip D gear, events2 count 44) plus 42 new ones:
- auto: seed เดิมได้ผลเดิม ไม่แตะ state และมีผลถอนตัว
- auto: ภารกิจทั่วไปไม่มีวันตาย (300 ครั้งกับศัตรูแรงมาก) · high = Critical ไม่ตาย
- auto: ทีมเพิ่มพลังรวม
- manual: ต้องยอมรับความเสี่ยงก่อน (high/lethal)
- manual: สกิลใช้ MP และติดคูลดาวน์
- manual: seed + การกระทำเดิม = ผลเดิม
- manual: ไม่แตะผู้เล่นจนกว่าจะ claim และ claim ได้ครั้งเดียว
- manual: รูปแบบศัตรูต่างกัน (โจมตีหนัก ตั้งการ์ด คลั่ง) อยู่ในรายงาน
- manual: ถอนตัวได้
- manual: นโยบายความตาย normal=แพ้ high=วิกฤต lethal=วิกฤตก่อน ล้มซ้ำจึงตาย
- manual: ขอความช่วยเหลือใช้ได้ครั้งเดียว
- manual: synergy สกิลกับบทบาทในทีม
- manual: เซฟกลางศึกแล้วโหลด ต่อได้ผลเหมือนไม่ได้เซฟ
- mission: ภารกิจไม่ผูกโหมด manual จบแล้วได้รางวัลครั้งเดียว ถอนตัวไม่ได้รางวัล
- mission: lethal ใช้ได้เฉพาะ manual (validation)
- party: เงื่อนไขชวนเข้าทีม
- party: จำกัดจำนวน ออกจากทีม ตายแล้วออกเอง
- party: synergy จากบทบาทและคู่อริในทีม
- party: สมาชิกบาดเจ็บไม่ลงสนาม และหายตามเวลา
- party: ส่วนแบ่งรางวัล ไม่ติดลบ ความสัมพันธ์ดีขึ้น
- party: ฮาจุนใช้กติกาเดียวกับทุกคน
- skill: ปลดล็อกตามเงื่อนไข เลเวลจากการฝึก passive เพิ่มพลัง
- equip: ตรวจของจริง ช่อง และเงื่อนไข · accessory · อัปเกรด
- equip: อัปเกรดแล้วเซฟ/โหลด ไม่ได้ซ้ำ
- dungeon: สร้างจาก seed ได้ผังเดิม ต่าง seed ต่างผัง มีบอสชั้นสุดท้าย
- dungeon: ข้อมูลผิดบล็อกการลงทะเบียนโลก
- dungeon: สำรวจจนจบ ได้ของครั้งเดียว บันทึก clears/checkpoint ความยากเพิ่ม
- dungeon: ออกเองได้ของครบ แพ้ได้บางส่วน
- dungeon: เซฟกลางดันเจี้ยนแล้วโหลด ต่อจนจบได้ ไม่ได้ของซ้ำ
- tower: ปีนทีละชั้น ปริศนาใช้ towerClear รางวัลครั้งเดียว มี 20 ชั้นจาก data module
- tower: เซฟ/โหลดเก็บชั้นสูงสุด · ข้อความบนผนังเมื่อผ่านชั้น 15
- underground: ต้องได้ทางเข้าก่อน ขายของได้เงินแต่ heat ขึ้น heat ลดตามเวลา
- underground: heat สูงทำให้ถูกสอบสวน มีผลเสียจริง
- underground: งานลอบสังหารแบบใหม่ ไม่ใช่ทางรวยเร็ว (เงินพอ ๆ งานปกติ แต่ heat/karma/ชื่อเสียงเสีย)
- underground: ยาเถื่อน: เลือกขอส่วนแบ่งได้เงินแต่ heat 40
- e2: เหลือครบ 6 รายการ มี src · คนหน้าเหมือนไม่มีคำเฉลย
- e2: คู่หูบาดเจ็บเกิดเมื่อมีสมาชิกทีมบาดเจ็บ
- save: เซฟจริง Phase 4 โหลดได้ (player v3) ทุกระบบใหม่เริ่มว่าง
- save: เซฟ Phase 2 และ 3 ยังโหลดได้
- save: ตรวจการอ้างไอเทมและ NPC ตอนโหลด
- balance: ทุกสไตล์ถึงแรงก์ C ภายในอายุ 26 และไม่มี error
- perf: ศึก manual 5 ศัตรู + ทีม 3 คน 30 รอบ < 100ms

## Browser (Chromium): 48 pass, 0 fail (run 3 times)
39 old checks plus 9 new ones:
- high-risk boss needs a second click to accept, then the manual fight panel opens
- skill use lowers MP and starts a cooldown (button disabled)
- save, reload, load in the middle of a fight; the fight continues
- fight ends, mission result applied once
- invite an NPC from the people list; role and team power shown
- dungeon run from the UI to the end; loot paid once
- tower floor 1 from the UI
- dark market opens only with access; its event shows
- real Phase 4 save loads in the browser

No pageerror. Old game file hash unchanged (d53b7879…). Old `hunter-path-*` keys untouched. Screenshot: phase5_smoke.png.
Fix to an old check: the registration step now makes sure the player has the 50 fee. Start money is random and could be spent earlier, which made the old test flaky.

## Performance (`node tests/perf5.js`)
```
การต่อสู้แบบเลือกท่า
┌─────────┬───────┬──────┬────────────┬──────────┐
│ (index) │ party │ foes │ msPerFight │ turnsAvg │
├─────────┼───────┼──────┼────────────┼──────────┤
│ 0       │ 0     │ 1    │ 0.25       │ 1        │
│ 1       │ 0     │ 3    │ 0.23       │ 3        │
│ 2       │ 0     │ 5    │ 0.37       │ 5        │
│ 3       │ 0     │ 8    │ 0.42       │ 3.4      │
│ 4       │ 1     │ 1    │ 0.16       │ 1        │
│ 5       │ 1     │ 3    │ 0.26       │ 3        │
│ 6       │ 1     │ 5    │ 0.38       │ 5        │
│ 7       │ 1     │ 8    │ 0.44       │ 4        │
│ 8       │ 3     │ 1    │ 0.16       │ 1        │
│ 9       │ 3     │ 3    │ 0.29       │ 3        │
│ 10      │ 3     │ 5    │ 0.46       │ 5        │
│ 11      │ 3     │ 8    │ 0.82       │ 8        │
└─────────┴───────┴──────┴────────────┴──────────┘
Auto Resolve (ทีม 3): 39.2 µs/ครั้ง
สร้างดันเจี้ยน (seeded)
┌─────────┬────────┬───────┬──────────┐
│ (index) │ floors │ rooms │ usPerGen │
├─────────┼────────┼───────┼──────────┤
│ 0       │ 3      │ 10    │ 11.9     │
│ 1       │ 10     │ 31    │ 32       │
│ 2       │ 30     │ 91    │ 71.2     │
│ 3       │ 100    │ 301   │ 154.9    │
└─────────┴────────┴───────┴──────────┘
ดันเจี้ยนจนจบ + เซฟ/โหลดกลางทาง {
  status: 'cleared',
  steps: 14,
  ms: 17.4,
  saveLoads: 4,
  msPerSaveLoad: 3.38,
  saveKB: 18.9,
  claimed: 1
}
หอคอย { best: 20, attempts: 38, ms: 10.5 }
NPC จำนวนมาก + ทีม
┌─────────┬──────┬───────┬────────────┬────────┐
│ (index) │ npcs │ party │ msPerMonth │ saveKB │
├─────────┼──────┼───────┼────────────┼────────┤
│ 0       │ 100  │ 3     │ 2.35       │ 67.9   │
│ 1       │ 500  │ 3     │ 8.21       │ 277.5  │
│ 2       │ 1000 │ 3     │ 20.93      │ 542.8  │
└─────────┴──────┴───────┴────────────┴────────┘
```

## Simulation
- `sim.js 20` (active bot): 20/20 reach C, average age 20.1, no errors, no deaths.
- `sim.js 5 idle`: 0/5 reach C (expected).
- `balance.js`: see PROGRESSION_BALANCE.md.
