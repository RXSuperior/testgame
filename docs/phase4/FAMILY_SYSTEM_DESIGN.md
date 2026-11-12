# Family System (Phase 4)

Code: `src/systems/family.js` (`engine.family`). Every family member is a normal NPC.

## Data (slice `family`, `_v: 1`)
- `background`, `members [{npc, role, since}]`, `spouse`, `marriedAt`, `history` (last 40)
- `lineage {id, generation, ancestors, children[{npc, born, parents}]}`: groundwork for Phase 6

## Creating the family
- When a character is created, the background is picked from `config.familyBackgrounds` (from logic4.js:85-86):
  - middle class / poor (money 40) / merchant (600) / retired hunter
  - Seeded by `game seed + world`, so the same game gives the same family.
- Members: mother and father (24–36 years older), plus a 60% chance of a sibling.
  - Bond `family` both ways; parents have a spouse bond with each other.
  - Their home is the world's family house.
- Saves from before Phase 4 get a family on load, and the player's money is not touched.

## Marriage and children (only through conditions and events)
- `canMarry`:
  - both 18 or older, both alive, not already married, not family
  - romance ≥ 1 and fondness ≥ 50
  - It is checked on every path: the propose action or the `marry` effect.
- `canHaveChild`:
  - married with the spouse alive, at least 10 months since the wedding
  - both under 50, fewer than 6 children
  - A child comes only from the `child_news` event (chance 15% per month while the conditions hold).
- A child is a new NPC (age 0) with bond family, and is added to `lineage.children`.
- A member's death goes into family history, and the `kin_funeral` event happens once per person.

## Not done yet (Phase 6)
- Playing as a child, inheritance, reincarnation.
- `lineage` and the Health life record keep what that system will need.
