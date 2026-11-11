# Changelog

## Phase 1.1 — Core Hardening (2026-11-11)
- State: get() returns a deep-frozen object, so nested objects and arrays are protected too. mutate() edits a copy and freezes it as the new value (copy-on-write). Reads cost nothing; a write clones only that slice. Added state.check() for snapshot structure.
- Save: one parse() checks JSON, fields, checksum, schema version (rejects newer), body/header match, slice types. Used by load, read, list and import. Import checks everything before writing anything, and backs up an existing slot to `.preimport`. Slot names are validated, and writes outside `mvh1:` are blocked.
- Multiverse time: new src/core/worldtime.js (engine.time) with local time per world, exact integer remainders, instant and timed gates. Loop.tick(force) lets a timed gate run while the game is paused.
- Added 'use strict' to state, save, loop, engine, worldtime.
- Docs: docs/MULTIVERSE_TIME_DESIGN.md.
- Test fixture fix: the old "missing migration" test save lacked an `at` field, which the stricter check now requires.

## Phase 1 — Core Architecture (2026-11-11)
- Added engine core: Rng, Bus, GameState, Loop, SaveSystem, Registry, AssetRegistry, Debug, Engine.
- Added asset manifest for 4 groups (shared, hunter, fantasy, murim), all placeholders.
- Added Phase 1 test page (src/ui/shell.js), build script, unit and browser tests.
- Old game untouched. Only change outside this repo: corrected a stale section in game4/docs/phase0/ASSET_AUDIT.md (docs only).
