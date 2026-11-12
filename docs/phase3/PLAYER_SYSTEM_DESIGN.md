# Player System (Phase 3)

Code: `src/systems/player.js` (`engine.player`), installed with `PlayerModule` (deps: worlds).

## State (slice `player`, owner `player`, version `_v: 1`)
| Field | Note |
|---|---|
| id, name, species, gender | gender is only stored; no content depends on it yet |
| bornAt, age | age (months) = global month − bornAt, synced each month |
| level, exp | exp needed = floor(60 × level^1.45) (from the old game, logic4.js:97). Level up: class main stat +2, one random stat +1 |
| ranks `{system: rank}` | e.g. `ranks.hunter = 'D'`. Not tied to Hunter: any world can declare a rank system |
| class | `'world.id'`, e.g. `hunter.sword`. Gives stat bonus and a starting skill |
| stats | str agi int vit cha luk |
| mana, hp, injury | injury = months left; HP regen 35%/month (10% when injured) |
| skills `[ids]`, inventory `{id: count}`, equipment `{weapon, armor}` | item/skill ids are `'world.id'`, resolved from that world's data |
| money, reputation, relations `{npcId: -100..100}`, flags | |
| location `{world, loc}` | always checked against installed worlds |
| ap | action points: 2 per month. Actions and missions spend AP |

## Rules
- Only the Player System writes this slice. Everything else calls its methods or uses Rules effects.
- Money cannot go below 0. Removing items you do not have, or adding items that do not exist, throws.
- Items, classes and skills are defined in world data. The player carries ids across worlds. If the defining world is not installed, the id stays in the inventory and shows as the raw id.
- `moveTo(loc)` checks that the location exists and its `when` condition passes. On `world:enter` the player is placed at the world's entry point.
- Travel does not change money, items, equipment or ranks.

## Save and migration
- The player slice has its own version (`_v`). `MIGRATIONS[v]` upgrades one step. There are none yet.
- Saves from Phase 2 have no player. After load, a player is created who was 15 at month 0, with 10 in every stat, at the current world's entry point, flagged `fromOldSave`.
- Saves from Phase 1.1 (no current world): no player is created. The UI starts the hunter world and the player creates a character.
