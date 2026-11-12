# Performance (Phase 6)

Commands: `node tests/perf6.js`, `node tests/perf5.js`. Node 22, the same container as earlier phases.

## NPCs + tower AI + economy (perf6, average over 24 months)
| NPCs | Tower AI | Economy active | ms/month | NPC climbs/month | Save |
|---|---|---|---|---|---|
| 101 | on | yes | 3.21 | 1.46 | 80.5 KB |
| 102 | off | yes | 3.55 | 0 | 81.2 KB |
| 501 | on | yes | 11.19 | 4.42 | 295.6 KB |
| 500 | off | yes | 8.52 | 0 | 290.7 KB |
| 1,001 | on | yes | 15.32 | 7.21 | 562 KB |
| 1,001 | off | yes | 13.03 | 0 | 558.1 KB |
| 500 | off | no | 5.79 | 0 | 288.9 KB |

The economy adds about one money event per month in this setup. Its listener only adds to the month counters.

## Phase 5 cases (perf5) with Phase 6 code
- Manual combat: 0.2–0.8 ms per fight, same as Phase 5.
- Dungeon run with save/load mid-run: about 3–4 ms per save+load, 19.4 KB save.
- Tower 20 floors: 38 attempts.
- NPCs + party: 4.25 ms (100), 9.04 ms (500), 14.32 ms (1,000) per month. Phase 5 was 2.46 / 7.95 / 13.8.

## Bots (300 months each)
| Style | ms total | ms/month |
|---|---|---|
| mission | 2,421 | 8.1 |
| solo | 2,996 | 10.0 |
| party | 8,872 | 29.6 |
| trainer | 1,829 | 6.1 |
| worker | 1,469 | 4.9 |
| dungeon | 3,120 | 10.4 |

The party bot is slow because it talks to every fighter NPC every month. That is bot code, not game code.

## Fix made in this phase
The first version of the NPC tower AI cost +15 ms/month at 1,000 NPCs, because it looked up relations pair by pair. It now:
- scans the edges once
- caches the hunter list
- batches its writes

That brought the cost down to about +2 ms.

Unit test guard: 500 NPCs + tower AI + economy for 12 months < 25 ms/month.
