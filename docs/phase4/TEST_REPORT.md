# Phase 4 test report (2026-11-11)

Commands:
- `python3 tools/build.py`
- `node tests/core.test.js`
- `python3 tests/smoke.py`
- `node tests/sim.js 16`
- `node tests/perf.js`

## Build
dist/index.html 222,767 bytes from 37 files. `node --check` passed.

## Unit: 193 pass, 0 fail
145 old tests plus 48 new ones.
- **NPC:**
  - Hajun is an ordinary data NPC
  - duplicate id refused
  - same seed gives the same people, a different seed gives different people
  - 5 kinds of bad NPC data block world registration
  - schedule work day / day off / evening
  - slot comes from AP, holidays from the calendar
  - override and job change
  - ill at home, dead nowhere
  - NPC age follows local time and the player's age does not change
  - memory capped at 12
  - LOD for other worlds every 12 months
- **Relationship:**
  - the two sides differ
  - all 9 types
  - missing NPC refused
  - NPCs meet each other
  - one interaction per month, gifts cost money
  - not everyone likes the player
  - orphans dropped on load
- **Karma/Traits:**
  - effects and conditions, limited to −100..100
  - traits change choice odds
  - kind NPCs like good karma
- **Life:**
  - family home is free
  - job conditions, salary, AP
  - sick means no pay; holiday month means paid without AP
  - awakened players can still work normal jobs
  - money never negative, arrears, eviction back to the family
  - buying a house raises status
- **Family:**
  - parents as NPCs
  - marriage conditions; propose action
  - a child only through an event with conditions
  - funeral once per person, plus family history
- **Health/Death:**
  - illness lowers AP and blocks missions; treatment shortens it
  - old age leads to death
  - on death: life record kept, everything stops, data kept
  - save/load after death
- **Gates:**
  - cannot travel before discovery, while Debug still can
  - discover, then event, then open, then there and back
  - the special gate takes stones and money, and global time +3
- **events2:**
  - 38 events + 22 one-liners, every one with `src`
  - one-liners do not pause time
  - the sibling event fires only if there is a sibling
  - the old-man coin chain
  - Hajun's awakening is fixed by seed and picks the right promise event
- **Save:**
  - **a real Phase 3 save** (tests/fixtures/phase3_save.json, made with code from tag phase3): relationships moved over, a family is created, money unchanged, no duplicate NPCs after loading twice, identical snapshot
  - a real Phase 2 save
  - every new system has `_v` and round-trips byte for byte
- **Perf:** 500 NPCs under 150 ms per month.

Fixture changes in old tests:
- The `register` helper now adds 50 money when the player cannot afford the registration fee. A poor family starts with 40, and family backgrounds are new in this phase.
- The age test died of illness under Phase 4 rules. Illness death for young people was lowered (see HEALTH_DEATH_DESIGN), and the test passes without changes.

## Browser (Chromium): 39 pass, 0 fail
30 old tests plus 9 new ones:
- family shown on screen
- Hajun at school on schedule
- talking to an NPC changes the relationship and memory
- applying for a job from the screen
- gameplay gates hidden before discovery, Debug still present
- death shows the life record and time stops
- loading after death
- starting a new life
- a real Phase 3 save loads in the browser

Also: no pageerror, old game index.html sha256 unchanged (d53b7879…), old save keys untouched.

## Bot
16/16 reach rank C, at age 20.5 on average. A bot that does nothing gets no rank.

Not tested: real browsers other than Chromium, phones, a person playing a whole life by hand.
