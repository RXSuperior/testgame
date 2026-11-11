# Combat Resolver (Phase 3)

Code: `src/systems/combat.js` (`engine.combat`). It is separate from the worlds and has no Hunter code.

## Interface
- `profile(worldId)`: the player's power, maxHp, hp, luk and skill names, using the rank system of that world.
- `resolve({worldId, enemy, mode='auto'})`: works out the result **without touching state** and returns a report. The same seed gives the same result.
- `apply(report)`: sets HP and injury on the player and emits `combat:done`.
- `register(mode, fn)`: adds a combat mode. `fn(request, rng)` returns a report. A future mode may return `{pending:true}`; MissionSystem.start already returns that as-is, and `finish(q, report)` completes the mission later. Phase 5 can add `hybrid` this way without changing missions or events.

## Auto Resolve (from the old fight(), logic4.js:384)
- power (awakened) = main stat × 1.5 + (str+agi+int+vit) × 0.4 + level × 3 + rank index × 40 + mana × 0.8 + weapon + skill power
- power (not awakened) = (str+agi+vit) × 0.6
- injury lowers power by 15% per month left (max 3)
- ratio = power / enemy power
- win chance = 1/(1+(1/ratio)^3) + luk × 0.002, clamped to 2–98%
- damage = maxHp × 0.35/ratio^1.5 × random 0.5–1.2 (× 1.5 on a loss)
- HP reaching 0 does not kill (death is Phase 4): HP is set to 1 and the player is injured 3 months
- damage over half of maxHp: injured 1 month
- The report has 3–4 lines of text for the player, plus chance, ratio, damage and HP before/after.

## Missions (`src/systems/missions.js`)
- Data: `{id, name, rank, at, enemy, when, win:[effects], lose:[effects], tags:[...], mode}`.
- A mission costs 1 AP. Heavy injury (2+ months) blocks missions.
- A win adds `tags` and `any` to `missions.byTag`. Rank rules use these counts.
