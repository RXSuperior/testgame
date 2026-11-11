# Phase 5 report: Combat, Party, Dungeon & Progression

1. **Done:**
   - Hybrid combat: Auto Resolve + manual turn-based, one report shape, `claim(id)` once, seeded, save mid-fight
   - Death policy linked to Health: normal never kills, high = Critical Condition, lethal only in marked manual events; NPCs injured, die only by script
   - Party: existing NPCs, invite/leave, max 3, roles, synergy, trust/readiness, injury/recovery, shares, conflict, member events. No per-NPC code (Hajun included)
   - Skills and gear data-driven with validation: types, levels, unlock, cost, cooldown, synergy; accessory slot, rank requirements, upgrades
   - Dungeon: seeded floors, rooms, boss, checkpoint, harder with clears, mid-run save
   - Tower: 20 floors (11–20 from a data module), puzzle/choice floors, best floor, wall event back
   - Dark market: access, broker, goods, information, reputation, heat, investigation
   - Rank B prepared (rules + exam), balance E→C checked over 6 play styles
2. **Core changes: none** (`git diff phase4 -- src/core` is empty).
3. **New files:**
   - src/systems/: party.js, dungeon.js, tower.js, underground.js
   - data/worlds/hunter/: progression.js, adventure.js, tower_floors_11_20.js, underground.js
   - tests/balance.js, tests/perf5.js, tests/fixtures/phase4_save.json
   - docs/phase5/* (8 files + screenshot)
4. **Changed files:**
   - combat.js (rewritten: manual sessions, claim, risk), missions.js (mode-agnostic, risk accept, party shares)
   - player.js v3 (accessory, upgrades, skill levels, reference checks on load)
   - rules.js (9 conditions, 11 effects), events.js (dungeon/tower triggers, `who.party`, `who.injured`)
   - health.js (`critical`), npcs.js (combat profile), people.js (critical illness)
   - world.js, events_e2.js (gear no longer auto-equipped), build.py, ui/shell.js (combat, party, dungeon/tower, gear panels)
   - tests: core.test.js, smoke.py, sim.js
5. **Tests:** unit 235/235, browser 48/48, perf and sims in TEST_REPORT.md.
6. **events2.js:** the last 6 moved, all with `src`:
   - :95 คู่หูบาดเจ็บ → `e2_partner_injured` (party)
   - :75 ตลาดมืดแกนอสูร → `e2_black_market` (risk added)
   - :79 ยาเพิ่มพลังเถื่อน → `e2_drug_ring` (risk added)
   - :151 ข้อความบนผนังหอคอย → `e2_tower_wall` (tower ≥ 15)
   - :123 งานลอบสังหาร → `e2_contract_kill`, reworked with consequences
   - :127 คนที่หน้าเหมือนท่าน → `e2_twin_hook`, flags only, no answer to the mystery
   Not moved: none left in events2.js.
7. **Save compatibility:** Phase 2, 3 and 4 real saves load (player v1/v2 → v3). New slices start empty. Invalid NPC/item/party references are removed on load. Saves in the middle of a fight, dungeon or tower climb load and continue without duplicate rewards.
8. **Remaining issues:**
   - Money inflates after C (~100k by 30)
   - Bots use the tower little; mission and solo styles are similar
   - All art is still placeholder
   - The UI is a test page, not a final game UI
9. **Phase 6 direction (not started):** money sinks and B-rank content, then whatever the user approves (Star Favor, supernatural powers, the Multiverse main story are all still out of scope).
