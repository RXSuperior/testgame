# Multiverse Hunter RPG (Reboot)

Private project. A new build, separate from the old game "ต่างโลกที่ไม่มีทางกลับ" (/home/claude/game4), which stays unchanged.

- Build: `python3 tools/build.py` → `dist/index.html`
- Unit tests: `node tests/core.test.js`
- Browser tests: `python3 tests/smoke.py` (Playwright)

## Structure
```
src/core/     engine core: ns, rng, bus, state, loop, save, registry, assets, debug, engine
src/ui/       shell.js (Phase 1 test page)
src/template.html
data/assets/  manifest.js (asset ids per world, all placeholders for now)
data/worlds/  world modules (empty in Phase 1)
tests/        core.test.js (node), smoke.py (browser)
tools/        build.py
docs/         reports
dist/         build output
```
Saves use the `mvh1:` prefix. Keys starting with `hunter-path-` (the old game) are read-only to this code.
