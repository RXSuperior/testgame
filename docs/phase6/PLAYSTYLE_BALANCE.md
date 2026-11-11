# Playstyle balance (Phase 6)

`node tests/econ.js 4`: 6 styles × 4 seeds = 24 characters, played from age 15 to 40 (300 months).

## What makes each style different (systems, not text)
| Style | System it leans on |
|---|---|
| Mission Hunter | Association merit (full merit for Association work, half for gate work, −2%/month). Tiers 60/180/400 soften the repeat-mission cut and add pay (+5/12/20%). Senior patrol at merit 180. Intel reports. |
| Solo Hunter | Full rewards, no shares. EXP +15% with no party. Bounties (no team, bounty board). Swarm enemies hurt more. Mana coating instead of team healing. |
| Party Hunter | Raids need 2+ members. Member abilities (tank: injury guard, support: heal after a win, damage: money +6%, plus NPC-specific ones like Master Kang +50% skill XP). Shares and team events cost money and trust. |
| Trainer | Association program (+4 main stat, +2 VIT), mana course and skill seminar, all with growing prices. Private coach plan. Home gym and meditation room. |
| Worker | Pay rises with tenure. Senior jobs need tenure. Job perks (medical discount). Steadier income. Guild contract hunter → senior guild contract at B. |
| Dungeon Explorer | Discoveries per dungeon. Explorer level (every 3 finds: +5% dungeon money and keep-on-fail). The hidden archive. Silverdragon survey contracts. |

The bots in `tests/sim.js` play these styles with the same spending rules (cash reserve by rank, repair, upgrade, insurance, house, lifestyle, investment). Only their priorities differ.

## Results after the changes
| Style | C (age) | B (age) | Cash 20 avg/med | Cash 30 avg/med | Cash 40 avg/med | In/month | Out/month | Deaths | Errors |
|---|---|---|---|---|---|---|---|---|---|
| mission | 4/4 (20.1) | 4/4 (24.0) | 6,034 / 6,377 | 15,772 / 16,144 | 19,806 / 21,644 | 2,222 | 2,157 | 0 | 0 |
| solo | 4/4 (19.9) | 4/4 (22.4) | 5,307 / 4,499 | 27,966 / 28,325 | 27,251 / 27,902 | 3,049 | 2,959 | 0 | 0 |
| party | 4/4 (20.0) | 4/4 (25.2) | 3,561 / 3,690 | 15,149 / 14,128 | 21,463 / 21,603 | 4,451 | 4,380 | 0 | 0 |
| trainer | 4/4 (20.7) | 4/4 (25.1) | 271 / 258 | 2,638 / 3,018 | 2,957 / 3,218 | 927 | 918 | 0 | 0 |
| worker | 4/4 (21.0) | 4/4 (26.0) | 7,512 / 7,319 | 18,186 / 18,077 | 25,265 / 24,928 | 1,573 | 1,490 | 0 | 0 |
| dungeon | 4/4 (20.7) | 4/4 (25.6) | 3,112 / 2,909 | 11,965 / 12,294 | 20,151 / 20,377 | 1,639 | 1,572 | 0 | 0 |

Success rate (B and alive at 40): 24/24.

## Style signatures at age 40
| Style | Power | Income CV | Merit | Stat total | Salary % | Finds | Raids | Bounties | Guild jobs | Stake |
|---|---|---|---|---|---|---|---|---|---|---|
| mission | 1,093 | 0.27 | **371** | 328 | 0 | 0 | 0 | 0 | 1.3 | 28,886 |
| solo | 1,677 | 0.31 | 70 | 557 | 0 | 11.8 | 0 | **188** | 12.5 | 74,207 |
| party | **1,787** | 0.32 | 298 | 423 | 0 | 3.8 | **287** | 0 | 0 | 50,155 |
| trainer | 1,078 | 0.44 | 100 | **561** | 0 | 0 | 0 | 0 | 55.5 | 0 |
| worker | 1,110 | 0.34 | 109 | 412 | **48** | 0 | 0 | 0 | 23.3 | 64,672 |
| dungeon | 1,184 | 0.66 | 35 | 307 | 0 | **11.8** | 0 | 42.5 | 12 | 25,718 |

Gear and skills: everyone except the trainer ends in full B gear with 23–26 upgrade levels. The trainer spends on courses and keeps C gear, but ties for the highest stats. Skill levels total 9–15.

Dungeon runs: dungeon 274, solo 116, party 17. Tower best floor: dungeon 20, party 18.5, mission 17.8, worker 16.8.

No style is best at everything:
- solo and party are strongest
- mission has the highest merit
- worker has the steadiest income from a job
- dungeon has the discoveries and the tower
- trainer has the stats but the least cash

## Before (Phase 5 build, same harness)
| Style | B age | Cash 40 avg | Spending / income |
|---|---|---|---|
| mission | 27.0 | 218,825 | 2% |
| solo | 25.9 | 244,509 | 2% |
| party | 26.4 | 135,283 | 41% |
| trainer | 29.1 | 29,155 | 68% |
| worker | 29.0 | 144,583 | 23% |
| dungeon | 33.2 | 126,006 | 4% |

## Money by category (after, average per character per month)
In: mission 1,882 · dungeon 182 · salary 127 · sell 100 · event 17 · tower 3.
Out: association 709 · lifestyle 309 · training 295 · party shares 276 · upgrade 196 · gear 189 · invest 82 · shop 72 · housing 54 · living 27 · guild 20 · event 14 · medical 1.

## Remaining issues
- Missions still bring most of the income for every style, including workers (47%).
- Solo builds the largest stake. Guild stakes are savings that keep growing slowly.
- Bot spending is one model of a player. Real players will differ.
