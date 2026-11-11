# Changelog

## Phase 5 — Combat, Party, Dungeon & Progression (2026-11-11)
- Combat: Auto Resolve and manual turn-based combat share one report shape. Results change the player only through `claim(id)`, once per fight. Fights are seeded and can be saved mid-fight. Risk levels normal/high/lethal with a confirm step, retreat and call-for-help.
- Death policy: normal fights never kill; high = Critical Condition (Health); lethal only in marked manual events. NPC members are injured, never killed by combat.
- New systems: Party (existing NPCs, roles, synergy, shares, injuries, conflict), Dungeon (seeded floors, checkpoint, mid-run save), Tower (20 floors, floors 11–20 from a data module, puzzle/choice floors, best floor), Underground (access, reputation, heat, investigation).
- Player v3: accessory slot, gear rank requirements, upgrades, skill levels. Phase 2/3/4 saves load.
- Content: skills, gear, 14 new enemies, rank B prep, 5 missions, 4 dungeons, tower events, party events, dark market. The last 6 events2.js events moved (twin event kept as an unresolved hook; contract kill reworked with consequences).
- No changes to src/core.

## Phase 4 — Character & Life System (2026-11-11)
- New systems: NPC (data + seeded generation, schedules, LOD simulation), Relationships (directed, 9 types, NPC↔NPC), Family (parents, marriage, children, lineage groundwork), Health (illness, treatment, old age, death, life records), Life (housing, jobs, salary, costs, arrears, social status), Gates (discover/open/travel with cost; Debug travel kept separate).
- Player v2: karma, traits, alive/death; relationships migrate from Player v1.
- Rules/Events: `who` binding (`'$who'`), passive one-liners, once-per-person events, trait bonus on checks, many new conditions/effects.
- Content: events2.js audited (62 + 3), 34 events + 22 one-liners + 3 chains moved; family/romance/life/gate events; karma/traits restored in Phase 3 events.
- No changes to src/core.

## Phase 3 — Hunter World Vertical Slice (2026-11-11)
- Player System (shared across worlds), Rules, Rank System, Combat Resolver (auto), Event System (Ask/Answer, data only), Mission System.
- Hunter World content in data/worlds/hunter: 8 school events and 9 hunter events moved from the old source, plus new main story, 18 actions, 10 missions, ranks E–C with clear promotion rules and exams.
- Atomic world registration with rollback; GameState.unregister.
- Per-world state versions + migrate hook; Phase 2 saves load (tested with a real Phase 2 save).
- Playable UI: character creation, events, locations, actions, missions, journal.
- docs/MULTIVERSE_POLICY.md, docs/phase3/*.

## Phase 2 — World System & Multiverse Architecture (2026-11-11)
- World System (src/systems/worlds.js), installed with engine.use(WorldsModule): register and validate worlds, lifecycle hooks, per-world state slices, gate travel, errors from world hooks isolated.
- Test worlds: hunter (rate 1.0) and fantasy (rate 0.5) with sample locations, NPC, quest, event, gates. Not real content.
- Core: GameState keeps orphan slices (worlds in a save that are not installed); WorldTime adds removeWorld/has and aborts a failed trip cleanly (gate:abort); world registry requires description, module, config, assetNs, storyNs.
- Test page shows the world and gate buttons.

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
