# Hunter World Design (Phase 3)

Data: `data/worlds/hunter/`
- `base.js`: locations, classes, skills, items, enemies, NPCs, rank system
- `events_life.js`: school life and main story
- `events_hunter.js`: hunter life
- `actions.js`: actions and missions
- `world.js`: puts the world definition together

Every entry has `src`. Old content says which line it came from (old source in `/home/claude/game4`, text from before theme7). New content says `new`.

## Content audit (old source → Reboot)
| Content in the old game | Where | Amount | Phase 3 | Note |
|---|---|---|---|---|
| Ranks E–S, enemy power by rank | logic4.js:2-3 | 1 table | used | power of E–C enemies follows GATE_DIFF |
| 6 classes | logic4.js:6-9 | 6 | used | name, main stat and description kept; stat bonus and starting skill are new |
| Places | logic4.js:19-26 | 7 | 6 used + gym (new) | casino not moved (underground path not in scope) |
| Weapons and armor | logic4.js:45-46 | 12 | first 3 grades used | B–S grades wait for later ranks |
| Monsters and bosses | logic4.js:39-40,387 | 8+8 | 6 used | |
| School events | logic4.js:183-232 | 12 | **8 moved** | not moved: bully/rival (needs a person system), festival, parents fighting (family is Phase 4), black cat (pet chain) |
| Hunter events | logic4.js:234-296 | 16 | **9 moved** | not moved: casino/dark jobs, dream voice (star system), S-rank survey (rank too high), black egg (pets), old friend who never awoke (person system) |
| More events | events2.js | 62 (23 school, 37 hunter) | not moved yet | not audited line by line; candidates for Phase 4 |
| Awakening | prog6.js:86-98 | 1 | used, simplified | still picks a class. The rank no longer comes from a random mana roll; the evaluation event at the association sets it from stats and mana instead |
| Opening | logic4.js:90-91,321 | 1 | used | |
| Chained quests | QUESTS.* many files | 42 | not moved | Phase 4–6 |
| 14 long stories, Demon Lord, 7 gods | story13 events11 | | not moved | belong to the Fantasy world (Phase 7) |

## Old effects not moved (no system yet)
- karma, traits (`tr`), star favor (`fav`), star coins (`coin`): dropped from choice results; the rest of each result is unchanged
- people the old game generated (best friend, rival, crush): replaced by the fixed NPC `best_friend` (ฮาจุน, new). The crush stays nameless
- values scaled by rank (`GATE_DIFF[P.rank]*x`): replaced by fixed E–D values, or by an enemy from the data
- **Needs a decision before more is moved:** whether to bring back karma/traits/stars, and in which phase

## Gameplay loop (15 → rank C)
1. Start at 15 at `home`. The opening event picks a life path.
2. City life:
   - 2 AP per month for school/gym/work/rest
   - random events where the player is
   - school is closed after awakening
3. Awakening happens at 17.5–18.5 (25% chance each month, guaranteed at 18.5). Choose 1 of 6 classes; mage and healer need 8 latent mana.
4. Go to the association:
   - rank evaluation: D if stat total ≥ 150 and mana ≥ 25, otherwise E
   - hunter registration: fee 50, or ask for a waiver with a cha check
   - after 2 missions, a guild offer: Iron Fang / North Star / independent
5. Missions at the association and the gate zone (Auto Resolve), plus shopping at the market and selling loot in the city.
6. Rank up only through every condition plus an exam:
   - **D:** level 6, stat total 140, 4 E-rank missions, then win the D exam (enemy power 115)
   - **C:** level 11, stat total 190, 6 D-rank missions, then win the C exam (225)
   - Time alone, or one button, never promotes. Tested: an idle bot gets no rank in 8 years.
7. Reaching C fires the `reached_c` event, which ends the first loop.

Bot test (`node tests/sim.js 10`): the active bot reaches C 10/10 times, at age 21.6 on average. The idle bot gets no rank.
