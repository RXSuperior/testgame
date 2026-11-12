# Phase 4 report: Character & Life System

1. **Done:**
   - NPC System: data + seeded generation, schedules, simulation with LOD
   - Relationship System: directed, 9 types
   - Karma & Traits: used in conditions, choice odds and NPC reactions
   - Life System: housing, jobs, salary, costs, never negative, social status
   - Family System: parents/siblings, marriage, children, lineage groundwork
   - Health: illness, treatment, old age, player and NPC death, life record
   - Gate progression: hidden → known → open, with costs and conditions; Debug kept separate
   - events2.js: 34 events + 22 one-liners + 3 quests moved; 6 not moved, with reasons
   - karma/traits restored in 13 Phase 3 events
2. **Core changes: none** (`git diff phase3 -- src/core` is empty). Everything new is in `src/systems/` and data.
3. **New files:**
   - src/systems/: npcs.js, relations.js, family.js, health.js, life.js, gates.js
   - data/shared/people.js
   - data/worlds/hunter/: people.js, events_e2.js, events_people.js
   - tests/perf.js, tests/fixtures/phase3_save.json
   - docs/phase4/* (9 files + screenshot)
4. **Changed files:**
   - player.js: v2 with karma, traits, alive/death; relations moved to the Relationship System
   - rules.js: about 15 conditions and 25 effects added
   - events.js:
     - `who` binding and `'$who'`
     - passive trigger
     - `oncePerWho`, trait bonus on checks
     - stops when dead
   - combat.js: rank-scaled enemies (powerByRank), illness lowers power
   - missions.js: illness/death block; installGameplay adds the new modules
   - hunter data:
     - NPCs moved to people.js
     - karma/traits added back
     - the gate needs discovery
     - hospital treats illness
   - shell.js: panels for people, life, family, gameplay gates, death screen
   - build.py, tests, sim.js (bot treats illness, skips full-time jobs, handles poor families)
5. Old game untouched; tags phase1–phase3 unchanged.
