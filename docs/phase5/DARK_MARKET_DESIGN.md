# Dark market and underground path (Phase 5)

File: `src/systems/underground.js` (`engine.underground`). Data: `data/worlds/hunter/underground.js`.

## State
Slice `{_v, rep, heat, access, deals, caught}`.
- `rep`: underground reputation. Opens bigger deals.
- `heat`: how much the authorities know. Drops 3 per month.
- `access`: the `black_market` location needs `underAccess`.
- Rules conditions: `underRep`, `heat`, `underAccess`. Effects: `underRep`, `heat`, `underAccess`, `caught`.

## Access
The `ug_contact` event gives access. The player can lose it (reporting the market to the Association).

## Traders and goods
- NPC `broker_moon` (same NPC system as everyone).
- `e2_black_market` (events2.js:75): sell monster cores at 2× price. Luck check; a failed check means a scam or a report.
- `ug_buy_charm`: `black_charm` accessory, strong but karma −.
- `ug_buy_info`: flag `info_subway`, which opens the `abandoned_subway` dungeon.
- `e2_drug_ring` (events2.js:79): take a cut (money, heat +40, karma −), report it, or walk away.

## Crime is never free money
| Action | Gain | Cost |
|---|---|---|
| Sell a core | 300 vs 150 legal | heat +10, karma −3, scam risk |
| Drug ring cut | money | heat +40, karma, reputation risk |
| Contract kill (reworked) | 1200, about one normal C mission | fight vs a B-rank hunter, karma −30, heat +60, reputation −10; refuse/warn/report options |

When heat reaches 60, `ug_investigation` fires: pay a fine (money, reputation, licence suspended a month, relation with clerk_yoon), deny (hard CHA check), or be detained on failure. Unit tests check that the contract kill pays no more than legal work and always costs heat, karma and reputation.

## events2.js:123 rework
The original gave a big reward with no follow-up. Now it is a dangerous manual fight with lasting consequences, and three non-violent choices exist.
