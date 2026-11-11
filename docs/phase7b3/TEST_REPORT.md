# Phase 7B.3 test report

| Suite | Result |
|---|---|
| `node tests/core.test.js` | 295 pass, 0 fail (274 old + 21 new `p7b3`) |
| `python3 tests/sv_smoke.py` (new, Chromium) | 36 pass, 0 fail |
| `python3 tests/smoke.py` ×3 | 57/57 each run |
| `python3 tests/ui_smoke.py` | 34/34 |
| `python3 tests/responsive.py` | 56/56 |
| `python3 tests/asset_smoke.py` | 11/11 (count 93 → 100) |
| `node tools/assets.js --check` | 100 assets, 0 errors, 0 warnings |
| `node tests/perf6.js` | runs, unchanged |

## New node tests (p7b3)
- Physics: landing and walking at capped speed, jump and fall, short hop, wall collision, world edges, one-way platform (stand, drop through, walk off, jump up through), coyote time, jump buffer.
- Camera: dead zone, clamping at both ends.
- Area validator: real data passes; broken door, enemy, spawn range, reward effect, event, solid and asset ids are all caught.
- Runtime: enter only where an area exists, loop pauses/resumes, no GameState write per frame.
- NPC schedule: scene NPCs equal `npcs.at`; Hajun at school on a work morning; list updates when AP changes the slot.
- Talk: E near Hajun, `rels.interact` result, once-per-month rule, area event chosen and answered, runtime blocked while the event is open.
- Doors: school → city → school, gate locked before registration; registered hunter city ↔ gate, school locked.
- Combat: kill one goblin → one `combat:done` (`mode:'action'`), reward once; area reload and save/load do not respawn or pay again. Loss at HP 0 → not dead, HP 1, injury 3, respawn. Retreat recorded once when leaving hurt.
- Save: area/x/facing saved and restored; Phase 2–5 fixtures load with default `scene` and round-trip byte for byte; a new save loads in a build without side-view (orphan slice); mismatched area cleared on load.
- Performance: 600 frames with goblins under 100 ms.

## Browser tests (sv_smoke.py)
Keyboard (D, ←, Space, E, Esc), camera, talk and event dialogs, doors, in-scene save, load and re-enter at the saved spot, real-time goblin fight, no double reward, rAF performance (180 frames in 3 s, about 0.4 ms per frame), mobile touch buttons (move, stop on release, jump, talk), mobile layout fits 390 px, ✕ returns to Dashboard, no console errors, old game hash unchanged (`d53b7879`).

Screenshots: `sv_school_1440.png`, `sv_talk_1440.png`, `sv_gate_1440.png`, `sv_mobile_390.png`.

## Not tested
- Real touch hardware (tests dispatch pointer events in Chromium mobile emulation).
- Firefox/Safari.
- Sprite drawing from real sheets (no licensed sheet exists yet; the code path is in place).
