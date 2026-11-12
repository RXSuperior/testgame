# Progression and balance (Phase 5)

## Skills (data-driven)
- `type`: active / passive / support. Fields: `mp`, `cd`, `mult`, `synergy` (role), `maxLv`, `unlock` (Rules condition).
- Level: skill XP from use and from `practice_skills`; level up at lv×10 XP, up to `maxLv`.
- New skills: iron_body (passive), battle_focus, shock_strike, rally (support).
- Validation: unknown types, missing numbers and bad unlock conditions block world registration.

## Equipment
- Slots: weapon, armor, accessory (new). Fields: `rank`, `req` (Rules condition), stats, `upgrade{max,cost}`.
- `upgrade(q)` pays and raises the level in one state write. A reload cannot repeat it for free (unit tested).
- New: mana_ring, guard_charm, fang_blade_b, scale_armor_b, black_charm, skill_book_focus.

## Ranks
E → D → C as in Phase 3, plus rank B prepared: level 18, stat total 260, 8 rank_c tags, and the exam_b mission. No B content past the exam.

## Play-style results (`node tests/balance.js`, 6 seeds, age 15 → 30)
| Style | Reached C | Avg age at C | Reached B | Money at 30 | Notes |
|---|---|---|---|---|---|
| mission | 6/6 | 20.5 | 6 | 103k | fastest money |
| solo | 6/6 | 20.2 | 6 | 116k | missions + dungeons |
| party | 6/6 | 20.1 | 6 | 69k | 3 members, shares paid |
| trainer | 6/6 | 22.5 | 4 | 7k | skill lv 8.5, poor |
| worker | 6/6 | 22.4 | 5 | 69k | social status 103 |
| dungeon | 6/6 | 21.8 | 0 | 61k | 14.8 clears |

Every style reaches C, no style is the only viable one, no deaths, no errors.
`node tests/sim.js 20`: 20/20 reach C, average age 20.1. Idle bot: 0/5 (expected).

## Known balance issues
- Money inflates after C (around 100k by age 30). Phase 6 needs sinks.
- Bots climb the tower little; the dungeon style does not take the B exam.
- Mission and solo styles play almost the same.
