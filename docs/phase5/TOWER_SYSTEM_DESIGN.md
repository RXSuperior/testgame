# Tower system (Phase 5)

File: `src/systems/tower.js` (`engine.tower`). Data: `H.towers` and `H.towerFloors`.

## Floors are data
- A tower has its own `floors[]` plus any `towerFloors` items with `tower:<id>`. They are merged and sorted.
- Floors 1–10 are in `adventure.js`. Floors 11–20 come from a separate module, `data/worlds/hunter/tower_floors_11_20.js`, to show that floors can be added without touching the system.
- Validation: floor numbers must run from 1 with no gaps; enemies and events must exist.

## Floor kinds
| kind | How it is cleared |
|---|---|
| fight | auto resolve |
| boss | manual fight (risk from data) |
| puzzle | a `trigger:'tower'` event; the right answer runs effect `towerClear` |
| choice | a `trigger:'tower'` event with different costs and outcomes |

Events: `tw_rune_door`, `tw_two_doors`, `tw_mirror`.

## State
Slice `{_v, towers{q:{best, claimed[]}}, attempt}`.
- `climb(q,{acceptRisk})` tries the next floor and costs AP.
- Best floor is recorded. Rewards per floor are paid once (`claimed`).
- Condition `towerBest` lets events react to progress.

## Tower wall event
`e2_tower_wall` (events2.js:151) returns when `towerBest ≥ 15`.
