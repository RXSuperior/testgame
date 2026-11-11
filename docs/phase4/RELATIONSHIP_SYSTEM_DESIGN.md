# Relationship System (Phase 4)

Code: `src/systems/relations.js` (`engine.rels`). It takes ideas from `rel12.js` (tempers, chemistry, trust/respect, one action per person per month, history) and rewrites them.

## Data
- Slice `rels` (owner `rels`, `_v: 1`): `e['a>b']` = what a feels about b. **It is directed**, so the two sides can differ.
- The player's id is `player`.
- Fields: `aff` (fondness), `trust`, `resp` (respect), `fam` (familiarity), `romance`, `bond` (family|spouse), `hist` (last 12), `last` (month of the last interaction), `flags`.
- Every change checks that both sides exist. A missing NPC throws.

## Types (computed, not stored)
Checked in this order; the first match wins:

| Type | Rule |
|---|---|
| spouse | bond spouse |
| family | bond family |
| enemy | flags.enemy or aff ≤ −60 |
| romantic | romance ≥ 1 and aff ≥ 30 |
| rival | aff ≤ −25 |
| best_friend | aff ≥ 80 and fam ≥ 60 |
| close_friend | aff ≥ 55 |
| friend | aff ≥ 25 |
| acquaintance | anything else |

## How values change
- **First meeting:** the NPC's view of the player = temper + chemistry × 15 + karma reaction + kind/20.
  - Karma reaction: a kind NPC likes good karma; greedy or hot-headed NPCs are the opposite.
  - This can be **negative**. Not everyone likes the player (tested).
- **Chemistry:** −1..1, from how close the traits are, plus/minus 0.4 for good or bad temper pairs (rel12).
- **Player actions:** one per person per month.
  - talk, gift (30, greedy NPCs ×1.5)
  - confess: chance from fondness + chemistry + trust
  - propose: needs romance, fondness 60, trust 30 and 500 money
  - apologize: when fondness is below −10
  - Results go into NPC memory and the journal.
- **Event choices:** `rel` (fondness), `relx` (fondness/trust/respect/romance).
- **NPCs on their own:** NPCs in the same place meet each other. Fondness drifts with chemistry. Familiarity with the player drops if they have not met for more than 3 months.
- **Death:** history is kept and "passed away" is added on the player's side.

## Save
- On load, orphan pairs (an NPC that no longer exists in an installed world) are dropped and logged.
- `relations` from Player v1 (Phase 3) moves to `npc>player` (aff), with familiarity from the old value.
