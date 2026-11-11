# Phase 6 report: Economy, B-Rank Content & Playstyle Balance

1. **Systems added and files changed**
   - New: `src/systems/economy.js`; data `data/worlds/hunter/economy.js`, `data/worlds/hunter/rank_b.js`; tests `tests/econ.js`, `tests/perf6.js`, `tests/fixtures/phase5_save.json`; docs/phase6/* (7 files + screenshot).
   - Changed:
     - player.js:
       - gear condition factor
       - upgrade cost growth and money event
       - **skill/item validator** (Phase 5's docs said this existed; it did not, so it was added now)
     - missions.js (v2): merit, decay, tiers, repeat-mission cut, solo EXP, party perks
     - combat.js:
       - enemy armor, shield, summon and drain
       - skill pierce
       - swarm
       - intel buff and service perks
       - party abilities on result
     - party.js: member abilities, share category
     - dungeon.js (v2): discoveries, explorer level
     - tower.js (v2): readiness check, NPC climbing
     - life.js: tenure raise, `jobTenure`, job perks, money categories
     - events.js: money category and discounts
     - world.js: new data and config
     - ui/shell.js: economy panel, gear condition and repair, tower readiness, NPC leaders, member abilities, mission pay %
     - tests: core.test.js, smoke.py, sim.js
   - `src/core`: no change.
2. **Economy:**
   - one-time, repeat and monthly services priced by rank
   - gear wear and repair
   - B upgrades to +5
   - housing upgrades, lifestyle plans, insurance
   - guild investment (seeded returns, fee, cap) and sponsorship
   - pay rises with tenure
   - repeated missions pay less
   
   No debt: unpaid fees pause the service, and a safety cash floor is kept. Cash at 40 went from 29k–245k to 3k–27k. See ECONOMY_DESIGN.md.
3. **B content:**
   - 10 enemies with real mechanics
   - 11 missions (auto, bosses, raid needing a team, bounty needing no team, senior patrol, 3 guild contracts)
   - 2 dungeons (1 hidden)
   - 4 B gear pieces, 4 materials, 4 skills
   - 7 events + 3 dungeon events
   
   No A/S.
4. **Playstyles:** each style relies on a different system (merit / bounties / raids and abilities / courses and coach / tenure and senior jobs / discoveries and explorer level). All 6 styles reach B by 22–26. Each leads in a different measure. See PLAYSTYLE_BALANCE.md.
5. **Tower AI:**
   - readiness check used by the UI and bots
   - NPCs climb every 6 months, in friend teams only when everyone is ready, and rest after failing
   - cached and batched (about +2 ms at 1,000 NPCs)
6. **Tests:**
   - unit 269/269
   - browser 57/57 ×3
   - perf: 1,000 NPCs 15.3 ms/month
   - simulation: 24 characters to age 40, 0 deaths, 0 errors; sim.js 20/20 reach C
7. **Old saves:** Phases 2, 3, 4 and 5 (mid-dungeon) load and continue with no duplicate rewards.
8. **Remaining issues:**
   - Missions are still most of every style's income.
   - Guild stakes grow slowly as savings.
   - Bot spending is one player model.
   - Trainer bots keep C gear.
   - The party bot sim is slow (bot code).
   - Art is still placeholder.
9. **Commit / tag:** see the final message (tag `phase6`).
10. **Backup:** reboot_phase6.zip. Phase 5 backup bundle and zip are in /home/claude/backups.
