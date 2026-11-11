# Phase 7A test report (2026-11-11)

Commands:
- `python3 tools/build.py`
- `node tests/core.test.js`
- `python3 tests/smoke.py` (3 runs)
- `python3 tests/ui_smoke.py`

## Build
dist/index.html, 54 files plus 1 CSS file. `node --check` passed. No `eval` and no `new Function` (checked in the UI test).

## Unit: 269 pass, 0 fail
Unchanged from Phase 6. No unit test was edited.

## Old browser tests: 57 pass, 0 fail, 3 runs in a row
Assertions unchanged. Two harness changes, both needed because the UI now has pages:
- The URL opens with `?debug=1`, since the old tests use the Debug gate buttons and the debug panel, which are hidden in player mode.
- `pg.click(sel)` became `click(sel)`. It first calls `AW.ui.reveal(sel)` to open the page that holds the button, then clicks as before.

## New UI tests (tests/ui_smoke.py): 34 pass, 0 fail
- มีหน้าจอ Loading ก่อนเกมพร้อม และไม่มี eval
- โหมดผู้เล่น: ไม่แสดง Debug panel
- ยังไม่สร้างตัวละคร: หน้าสร้างตัวละครแสดง
- สร้างตัวละครแล้วเห็นเหตุการณ์เปิดเรื่องแบบมีตัวเลือก
- ตอบเหตุการณ์แล้วเห็นผลลัพธ์ กดตกลงแล้วปิด
- ผลลัพธ์ปิดแล้ว
- เปิดครบ 17 หน้าผ่านเมนู มี active state และเนื้อหาจริง []
- ทุกหน้าไม่มี JavaScript error
- ทุกปุ่มผูกกับการกระทำจริง (ไม่มีปุ่มกดแล้วไม่มีผล) []
- จำหน้าที่เปิดไว้หลังรีโหลด (sessionStorage ไม่ใช่เซฟ)
- ปุ่มกิจกรรมทำงานจริง (AP ลด)
- หน้าว่างแสดง empty state
- ทำสำเร็จแล้วมี toast แจ้งผล
- ค่าสถานะมี tooltip อธิบาย
- Modal ยืนยันเปิดได้ กดยกเลิกแล้วปิด ไม่มีอะไรเปลี่ยน
- กด Escape ปิด modal ได้
- หน้าบทสนทนา NPC เปิด/ปิดได้
- การต่อสู้เปิดหน้าพิเศษ ซ่อนหน้าอื่น
- ระหว่างต่อสู้เปิดหน้าระบบเพื่อเซฟได้ แล้วกลับไปการต่อสู้
- จบการต่อสู้แล้วกลับสู่หน้าปกติ
- เซฟ/โหลดจากหน้าระบบ คืนค่าตรง
- เปิดโหมดพัฒนาแล้วเห็น Debug panel
- ยุบ/แสดงแผงขวาได้
- ไม่มี console error ตลอดการทดสอบ
- desktop_l 1440px: ไม่มี horizontal overflow ทุกหน้า []
- laptop 1024px: ไม่มี horizontal overflow ทุกหน้า []
- tablet 768px: ไม่มี horizontal overflow ทุกหน้า []
- mobile 390px: ไม่มี horizontal overflow ทุกหน้า []
- mobile: เมนูล่าง + drawer ใช้ได้ ปุ่มสูง >= 44px
- mobile: เหตุการณ์อ่านได้และกดตัวเลือกได้
- mobile_s 360px: ไม่มี horizontal overflow ทุกหน้า []
- mobile_s: เมนูล่าง + drawer ใช้ได้ ปุ่มสูง >= 44px
- localStorage มีเฉพาะเซฟ mvh1: และของเกมเดิม
- ไฟล์เกมเดิมไม่เปลี่ยน (sha256)

## Screenshots
- desktop.png (1440)
- desktop_combat.png
- desktop_dialogue.png
- tablet.png (768)
- mobile.png (390)
- mobile_event.png

## Not changed
`src/core`, `src/systems`, `data/*` and the save format. Phase 2–6 saves load as before (unit tests p3–p6 and browser tests).
Game file hash d53b7879… unchanged.
