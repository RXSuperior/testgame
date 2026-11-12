# Tower AI (Phase 6)

File: `src/systems/tower.js`. Config: `H.towerConfig`.

## Problem
In Phase 5, bots either climbed whenever a floor was open or never looked at the tower. Nothing checked whether they were ready.

## Readiness check: `tower.assess(q)`
Used by the UI ("ประเมิน: …") and by the bots.
- **Ready** means:
  - HP ≥ 60% (≥ 80% for a boss floor)
  - not injured, not seriously ill
  - for a boss floor with a team, no more than half the members injured
- **Chance** comes from `combat.chance` for fight and boss floors.
- **Required chance:** fight 0.6, boss 0.7, high or lethal boss 0.75.
- **Result:** `rest` (not ready), `too_hard` (chance below the bar) or `climb`, with reasons such as "HP 40%" or "injured members 2/3".

The bots climb only on `climb`, and only now and then: dungeon every 3rd month, party every 4th, others every 6th. Climbing is one activity among several, not a monthly chore.

## NPC climbing
- Only in the player's current world.
- Only alive fighters aged 18–55 who are not in the player's party.
- **Cadence:** each NPC thinks once every 6 months. The month offset comes from a hash of its id, so NPCs spread out.
- **Power:**
  - NPC power = combat base × age factor × `npcScale` × (1 + 3% per floor already cleared)
  - Floor power uses `powerByRank[npcRank]`
- **Team:** up to 2 hunter friends (affection ≥ 40) join if **all** of them are ready. If a friend is still resting, the NPC goes alone only when its solo chance is ≥ 0.8. Otherwise it waits.
- **Temper:** proud NPCs accept 10% lower odds. Shy and honest NPCs want 10% more.
- **Failure:** rest for 3 months. NPCs never die in the tower.
- **State:** `tower.npc[tower][npc] = {best, rest, tries, fails}`, written once per month. `leaders()` feeds the UI. Floors ≥ 8 go to the journal as news.

## Performance
- The hunter list is cached in memory per world, per year and per NPC count. It is not saved.
- Friends come from a single pass over the relation edges each month.
- All updates are batched into one state write.

| NPCs | ms/month with AI | without AI |
|---|---|---|
| 100 | 3.2 | 3.6 |
| 500 | 11.2 | 8.5 |
| 1,000 | 15.3 | 13.0 |

(perf6, 24 months each.) Before these optimisations the AI cost +15 ms at 1,000 NPCs.

## Results
In the 24-character simulation:
- Bots that use the tower reach floor 17–20 by 40.
- In unit tests, NPC records are the same for the same seed.
- In one 25-year debug run, the top NPCs reached floor 19 (5 NPCs, 6–34 tries each).
