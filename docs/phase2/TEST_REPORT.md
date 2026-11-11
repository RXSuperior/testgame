# Phase 2 test report (2026-11-11)

Commands: `python3 tools/build.py`, `node tests/core.test.js`, `python3 tests/smoke.py`

- Build: dist/index.html 37,900 bytes from 17 files, `node --check` passed.
- Unit: **106 pass, 0 fail** (83 from Phase 1.1 + 23 world tests).
  - register 2 worlds
  - duplicate id refused
  - every required field missing is refused
  - 14 kinds of bad value refused, with nothing left behind
  - registerAll
  - own slice, other world cannot write
  - states not mixed
  - hook order
  - hook errors isolated
  - there and back
  - normal gate: global +0
  - special gate: global +3
  - local times (hunter 18, fantasy 9) and the update hooks match them
  - unknown world / unknown gate refused with state byte-identical
  - overlapping trip, same world and bad months refused
  - error mid-trip leaves no stuck state and returns to origin
  - save/load restores both worlds byte-identical, including the 0.5 remainder
  - Phase 1.1 save loads
  - world in save but not installed keeps its data
  - dispose
  - newGame reset
  - world data frozen
  - asset namespace
- Check that the tests catch the bugs: with the Phase 1.1 worldtime, the mid-trip error test fails. With the Phase 1.1 state.js, the orphan-world test fails.
- Browser (Playwright, Chromium): **20 pass, 0 fail** (15 old + 5 world).
  - 2 worlds, start in hunter
  - normal gate button: global unchanged, name shown
  - special gate: global +3
  - unknown world refused, no stuck state
  - save, new game, reload, load restores both world slices and worlds_time exactly
  - no pageerror; old saves untouched; old game index.html sha256 unchanged (d53b7879…)
- Fixture changes: the old "registry loadAll" test used the engine world registry with the old 4-field contract. It now uses a generic Registry (same logic tested). The world contract is covered by the new tests.

Not tested: browsers other than Chromium, real devices, many worlds at once (performance).
