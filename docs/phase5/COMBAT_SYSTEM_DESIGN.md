# Combat system (Phase 5)

File: `src/systems/combat.js` (`engine.combat`). Registered as the `combat` module; `combat.register()` from Phase 3 is kept, so the mission, dungeon and tower systems all go through one combat API.

## Two modes, one result shape
| | Auto Resolve | Manual (turn-based) |
|---|---|---|
| Call | `combat.resolve(req, rng)` / `combat.fight(req)` | `combat.start({...})`, `combat.act(a)`, `combat.claim(id)` |
| Used by | normal missions, dungeon rooms, normal tower floors | boss missions, dungeon bosses, tower bosses |
| Outcomes | win / lose / retreat (+ injury, party injuries) | win / lose / retreat (+ critical, death only when lethal) |

Both return the same report shape (`outcome`, `hpLoss`, `injury`, `critical`, `dead`, `party[]`, `log[]`), so a mission does not care which mode ran. A mission picks its mode in data (`mode:'auto'|'manual'`).

## The resolver does not touch player state
- `resolve()` is pure: it reads a frozen profile and an Rng and returns a report.
- A manual fight lives in the `combat` slice (`session`) with its own Rng state. `act()` only changes the session.
- When a fight ends, `combat:ended` is emitted. Player HP, injury, health and party injuries change only in `claim(id)`, which works once per fight id (`claimed[]`). A second claim throws.
- A session can be saved and loaded mid-fight. The game loop is paused with reason `combat` while a session is active, and paused again after load.

## Power model
- Player power: main stat ×1.5 + stat total ×0.4 + level ×3 + rank ×40 + mana ×0.8 + gear power + passive skill bonus.
- Party: Σ member power × 0.6 × synergy. Tank and support lower damage taken (tank 0.8, support 0.9).
- Enemies scale by rank (`powerByRank`) and a multiplier (dungeons grow harder with clears).

## Manual actions
attack · defend · skill (MP cost, cooldown, level, synergy with party roles) · help (once, when the source provides it) · retreat.
Party members act on their own by role. Enemy patterns: attack, heavy, guard, sweep, heal, enrage.

## Risk and death policy
| Risk | Who sets it | Fall to 0 HP |
|---|---|---|
| normal | default | loss, HP 1, injury. Never death. |
| high | boss / raid / exam | Critical Condition (Health: ill `critical`, 3 months, severity 3). Never death. |
| lethal | only clearly marked manual events | first fall = critical, a second fall in the same fight = death |

- `start()` refuses high/lethal without `acceptRisk:true`. The UI shows the risk label and needs a second click to accept (no browser dialog).
- Retreat is always available. Help, if offered, can be called once.
- NPC party members are only injured (`injury` months). An NPC dies only through a scripted effect `npcKill`.
- Validation: `lethal` is allowed only with `mode:'manual'`.

## Seeds
`resolve()` uses the given Rng. A manual fight uses `seed` or a seed from the engine Rng. Same seed + same actions = same log (unit tested).
