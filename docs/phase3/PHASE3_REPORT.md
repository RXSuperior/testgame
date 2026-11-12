# Phase 3 report: Hunter World Vertical Slice

1. Done:
   - shared Player System
   - data-driven Ask/Answer Event System
   - Rules (conditions/effects, no eval)
   - Rank System
   - Combat Resolver (auto)
   - Mission System
   - Hunter World, playable from 15 to rank C
   - atomic world registration
   - save migration for each world and for the player
   - playable UI
2. New files:
   - src/systems/: rules.js, player.js, ranks.js, combat.js, events.js, missions.js
   - data/worlds/hunter/: base.js, events_life.js, events_hunter.js, actions.js, world.js
   - tests/sim.js, tests/fixtures/phase2_save.json
   - docs/MULTIVERSE_POLICY.md, docs/phase3/* (6 files + screenshot)
3. Changed files:
   - src/core/state.js: `unregister()`, needed to roll back a registration
   - src/systems/worlds.js:
     - atomic register
     - generic data lists `ctx.list()`
     - `addValidator`
     - `stateVersion` + `migrate` hook
     - an install hook that throws counts as a failed install
   - data/worlds/fantasy.js: location moved to Player (stateVersion 2), test event made valid
   - data/worlds/hunter.js was removed; it is replaced by the folder
   - src/ui/shell.js, src/template.html
   - tools/build.py
   - tests/core.test.js: 1 fixture changed (hunter world data)
   - tests/smoke.py
4. Old game untouched. Tags phase1, phase1.1, phase2 unchanged.
