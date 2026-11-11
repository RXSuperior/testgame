# Multiverse Hunter RPG (Reboot)

Private project. A new build, separate from the old game "ต่างโลกที่ไม่มีทางกลับ" (/home/claude/game4), which stays unchanged.

- Build: `python3 tools/build.py` → `dist/index.html`
- Unit tests: `node tests/core.test.js`
- Browser tests: `python3 tests/smoke.py` (Playwright)
- Balance sim: `node tests/sim.js 10 [active|idle]`
- NPC performance: `node tests/perf.js`
- Phase 5 performance (combat, dungeon, tower, party): `node tests/perf5.js`
- Play-style balance (age 15 to 30): `node tests/balance.js`
- Rules for worlds and the player: docs/MULTIVERSE_POLICY.md

## Structure
```
src/core/     engine core: ns, rng, bus, state, loop, worldtime, save, registry, assets, debug, engine
src/systems/  worlds, player, rules, ranks, combat, events, missions, npcs, relations, family, health, life, gates, party, dungeon, tower, underground
src/ui/       shell.js (test page)
src/template.html
data/assets/  manifest.js (asset ids per world, all placeholders for now)
data/shared/  people.js (tempers, traits, illnesses)
data/worlds/  hunter/ (playable Hunter World: data only), fantasy.js (test world). How to add one: docs/phase2/WORLD_MODULE_GUIDE.md
tests/        core.test.js (node), smoke.py (browser), sim.js, balance.js, perf.js, perf5.js
tools/        build.py
docs/         reports
dist/         build output
```
Saves use the `mvh1:` prefix. Keys starting with `hunter-path-` (the old game) are read-only to this code.
