# Phase 7A.1 report: responsive polish (2026-11-12)

Base: phase7a (`f125329`). Only the UI layout changed: `src/ui/theme.css`, `src/ui/layout.js`, `src/ui/app.js`. `src/core`, `src/systems`, data and the save format are unchanged (`git diff phase7a -- src/core src/systems data` is empty).

## What was wrong
At 768 px (and, it turned out, up to 1365 px) the header had to fit everything in one row:
- character info, HP/MP, money and AP were squeezed together, so text spilled out of its box ("HP 180/180MP 40")
- the time buttons pressed against the stats
- the long name wrapped

## Fixes
- **Header layout:** below 1366 px the header has two rows. Row 1 is the game name and time controls (smaller buttons). Row 2 is the stats, which may wrap but never overlap.
- **Header height:** `--hdr` is measured from the real header height (on each render and on resize). The sticky sidebars start below it, so the header never covers them.
- **Name:** shortened with an ellipsis; the full name is in the tooltip.
- **Secondary info:**
  - age and month/world are hidden from the header below 1200 px
  - they move to a "time" panel in the right sidebar (shown only in compact layouts)
  - level is hidden on mobile; it is still on the Character page
- **Breakpoints:**

  | Width | Layout |
  |---|---|
  | ≥ 1366 | one-row header, sidebar, main, right panel |
  | 1200–1365 | two-row header, same 3 columns |
  | 1024–1199 | two-row header, sidebar, main, right panel below main |
  | 768–1023 | two-row header, sidebar collapses to a 64 px icon rail (labels in tooltips), main, right panel below |
  | < 768 | mobile: bottom nav and drawer (drawer shows full labels) |
  | ≤ 420 | tighter header so the stats fit on one row |

## New test: tests/responsive.py (56 pass, 0 fail)
8 widths × 17 pages. For each width it checks:
- no horizontal overflow
- header items do not overlap
- header text is not squeezed out of its box in either direction
- buttons, cards and badges in the content do not overlap
- the header does not cover the content or the sidebar (at the top and after scrolling)
- the menu and a travel button still work
- no console errors

The header check was confirmed against the phase7a build: it fails there at 768 px (the reported bug) and passes now.

- PASS 1440px: ไม่ล้นแนวนอนทั้ง 17 หน้า []
- PASS 1440px: ของใน header ไม่ทับกัน []
- PASS 1440px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน []
- PASS 1440px: header ไม่บังเนื้อหาและเมนู []
- PASS 1440px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) []
- PASS 1440px: เมนูและปุ่มเดินทางกดได้จริง
- PASS 1440px: ไม่มี console error
- PASS 1200px: ไม่ล้นแนวนอนทั้ง 17 หน้า []
- PASS 1200px: ของใน header ไม่ทับกัน []
- PASS 1200px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน []
- PASS 1200px: header ไม่บังเนื้อหาและเมนู []
- PASS 1200px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) []
- PASS 1200px: เมนูและปุ่มเดินทางกดได้จริง
- PASS 1200px: ไม่มี console error
- PASS 1024px: ไม่ล้นแนวนอนทั้ง 17 หน้า []
- PASS 1024px: ของใน header ไม่ทับกัน []
- PASS 1024px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน []
- PASS 1024px: header ไม่บังเนื้อหาและเมนู []
- PASS 1024px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) []
- PASS 1024px: เมนูและปุ่มเดินทางกดได้จริง
- PASS 1024px: ไม่มี console error
- PASS 900px: ไม่ล้นแนวนอนทั้ง 17 หน้า []
- PASS 900px: ของใน header ไม่ทับกัน []
- PASS 900px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน []
- PASS 900px: header ไม่บังเนื้อหาและเมนู []
- PASS 900px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) []
- PASS 900px: เมนูและปุ่มเดินทางกดได้จริง
- PASS 900px: ไม่มี console error
- PASS 768px: ไม่ล้นแนวนอนทั้ง 17 หน้า []
- PASS 768px: ของใน header ไม่ทับกัน []
- PASS 768px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน []
- PASS 768px: header ไม่บังเนื้อหาและเมนู []
- PASS 768px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) []
- PASS 768px: เมนูและปุ่มเดินทางกดได้จริง
- PASS 768px: ไม่มี console error
- PASS 600px: ไม่ล้นแนวนอนทั้ง 17 หน้า []
- PASS 600px: ของใน header ไม่ทับกัน []
- PASS 600px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน []
- PASS 600px: header ไม่บังเนื้อหาและเมนู []
- PASS 600px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) []
- PASS 600px: เมนูและปุ่มเดินทางกดได้จริง
- PASS 600px: ไม่มี console error
- PASS 390px: ไม่ล้นแนวนอนทั้ง 17 หน้า []
- PASS 390px: ของใน header ไม่ทับกัน []
- PASS 390px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน []
- PASS 390px: header ไม่บังเนื้อหาและเมนู []
- PASS 390px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) []
- PASS 390px: เมนูและปุ่มเดินทางกดได้จริง
- PASS 390px: ไม่มี console error
- PASS 360px: ไม่ล้นแนวนอนทั้ง 17 หน้า []
- PASS 360px: ของใน header ไม่ทับกัน []
- PASS 360px: ปุ่ม/การ์ด/ป้ายในเนื้อหาไม่ทับกัน []
- PASS 360px: header ไม่บังเนื้อหาและเมนู []
- PASS 360px: ข้อความใน header ไม่ถูกบีบจนล้นหรือทับกัน (แนวตั้งและแนวนอน) []
- PASS 360px: เมนูและปุ่มเดินทางกดได้จริง
- PASS 360px: ไม่มี console error

## Other suites
- Unit: 269 pass.
- Old browser tests: 57 pass, 3 runs.
- UI tests: 34 pass.
- Build: passes.
- Game file hash d53b7879… is unchanged.

## Screenshots (docs/phase7a1)
- 1440.png, 1200.png, 1024.png, 900.png, 768.png, 600.png, 390.png, 360.png (dashboard)
- 768_character.png, 768_equipment.png, 768_party.png, 768_economy.png
