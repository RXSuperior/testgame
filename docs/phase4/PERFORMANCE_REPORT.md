# Performance report (Phase 4)

Command: `node tests/perf.js`. Node 22, the same sandbox as the other tests. For each size it runs 24 months, with all systems on and no UI.

| NPCs | Player | ms / month | Save size | Relationship pairs | `npcs.at()` per call |
|---|---|---|---|---|---|
| 22 (default game) | in the world | 1.04 | 22.9 KB | 47 | 0.016 ms |
| 100 | in the world | 2.2 | 74.9 KB | 131 | 0.029 ms |
| 500 | in the world | 7.38 | 282.7 KB | 153 | 0.22 ms |
| 1,000 | in the world | 14.64 | 534.7 KB | 129 | 0.305 ms |
| 522 | in another world (batch) | 1.61 | 277.8 KB | 9 | 0.71 ms |
| 1,022 | in another world (batch) | 2.23 | 535.3 KB | 9 | 1.456 ms |

The unit test `p4 perf` checks that 500 NPCs cost under 150 ms per month.

## How it stays cheap
- **No per-tick movement simulation.** An NPC's place is worked out from its schedule when asked, at O(1) per NPC.
- **LOD:**
  - The world the player is in runs every month.
  - Other worlds run once every 12 local months as a batch. With the player away, 1,000 NPCs cost 2.2 ms/month on average.
- **One write per world per month.** Copy-on-write (Phase 1.1) clones a world's NPC slice once per month, not once per NPC.
- **NPCs meet each other** only in groups at the same place, a few pairs per month, so the pair count does not grow as N².

## Limits and what to do next
- Save size grows about 0.5 KB per NPC (records keep their field names). localStorage is about 5 MB, so a few thousand NPCs fit.
  - If it needs to grow, compress records or drop the memory of NPCs who have been dead a long time.
- At 1,000 NPCs in the player's world it is 14.6 ms/month. At 10x speed (120 ms per tick) that is fine.
  - Above about 5,000 NPCs, the player's world should simulate only NPCs near the player.
- The real browser has not been measured. The browser tests run with 22 NPCs.
