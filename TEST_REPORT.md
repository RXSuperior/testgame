# Test report

## Phase 1.1 (2026-11-11)
- Build: dist/index.html 25,648 bytes from 14 files, `node --check` passed.
- Unit: 83 pass, 0 fail (34 old + 49 new: 14 state, 21 save, 14 time).
- Check that the tests catch the bugs: against the phase1 code, 10 of the new state tests fail and 18 of the new save tests fail. With the new code, all pass.
- Browser: 15 pass, 0 fail (13 old + frozen state in the page, import rejects broken data and backs up the slot). Old game index.html sha256 unchanged.

## Phase 1 (2026-11-11)
Commands: `python3 tools/build.py`, `node tests/core.test.js`, `python3 tests/smoke.py`

- Build: dist/index.html 20,495 bytes from 13 files. `node --check` passed on every file.
- Unit (node): 34 pass, 0 fail. Covers rng, bus (priority, error isolation), state ownership, loop (1,200 months, pause reasons), save (roundtrip, rng continuity, checksum, .prev backup, v0 migration, export/import, old `hunter-path-` keys untouched, writing a protected key throws), registry, engine modules (deps, new slices persist), assets (placeholder rules, all 89 manifest ids are placeholders), debug.
- Browser (Playwright, Chromium): 13 pass, 0 fail. Opens without errors, +1 month, auto time, menu pauses time, save/reload/load restores the month, old saves untouched, new keys use `mvh1:`, debug panel, 390px mobile, no pageerror, old game index.html sha256 unchanged (d53b7879…).

Not tested: real browsers other than Chromium, real devices, long play sessions with game content (none exists yet).
