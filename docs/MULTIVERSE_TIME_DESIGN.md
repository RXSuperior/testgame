# Multiverse Time Design (Phase 1.1)

Code: `src/core/worldtime.js` (`engine.time`). No world content yet; worlds in the tests are dummies.

## Rules
1. Global time: 1 tick = 1 month (`loop.month`).
2. Player age = start age + global months. Age reads global time only, never a world's local time.
3. Each world has its own local time, advanced on every global tick by its `timeRate`.
   - 1.0 = normal, 2.0 = twice as fast, 0.5 = half speed.
   - Allowed: 0.001 to 100, in steps of 0.001. Values like 1/3 are rejected because they cannot be stored exactly.
4. Precision: local time is stored as a whole number in 1/1000 month units (`acc`). Local month = floor(acc / 1000). There are no floats, so the remainder never drifts, even over thousands of months.
5. Every registered world advances on every tick, even when the player is not there. Its state (acc) is saved with the game.
6. Normal Gate: `travel(to)` is instant. Global time does not move, so age does not change.
7. Special Gate: `travel(to, {months: n})` runs n real global ticks during the trip.
   - Age goes up by n, and every world advances by n × rate.
   - It works even while the game is paused by a menu, because the trip is something the player chose.
   - During the trip `current = null` and `traveling = {from, to, left}`.
8. Events:
   - `world:month {world, month}` fires once for each local month that passes. A world at rate 2 fires twice per tick.
   - `gate:depart` / `gate:arrive` fire around a trip.

## Calculation examples
Worlds: Earth 1.0, Murim 2.0, Demon 0.5. Player starts at age 15 (180 months).

| Event | Global | Age | Earth | Murim | Demon (acc) |
|---|---|---|---|---|---|
| Start | 0 | 15y 0m | 0 | 0 | 0 (0) |
| 1 tick | 1 | 15y 1m | 1 | 2 | 0 (500) |
| 2 ticks | 2 | 15y 2m | 2 | 4 | 1 (1000) |
| Normal Gate to Murim | 2 | 15y 2m | 2 | 4 | 1 |
| 10 ticks in Murim | 12 | 16y 0m | 12 | 24 | 6 |
| Special Gate to Demon, 3 months | 15 | 16y 3m | 15 | 30 | 7 (7500) |
| 1 tick in Demon | 16 | 16y 4m | 16 | 32 | 8 (8000) |

Rate 0.1 for 1,200 ticks gives exactly 120 months (acc 120000). This is checked by a test.

## Not decided yet (Phase 2+)
- Whether a world can be "frozen" while the player is away (rate 0 is not allowed right now).
- Whether events in a world the player is not in should fire or be summarised (the `world:month` event fires for all worlds).
- Ageing in worlds where age works differently (e.g. long-lived races) needs a separate rule; for now age follows global time only.
