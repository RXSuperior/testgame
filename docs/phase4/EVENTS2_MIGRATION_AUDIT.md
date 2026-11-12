# events2.js migration audit (Phase 4)

Source: `/home/claude/game4/events2.js` (206 lines). It contains:
- 40 events (`ev`), lines 5–166
- 22 one-line stories (`PASSIVE`), lines 169–190
- 3 chained quests (`QUESTS`), lines 193–206

Total **62 entries** as counted in Phase 0, plus 3 quests. Each one was checked by hand.

Result:
- **Moved:** 34 events + 22 one-liners + 4 events built from the 3 quests (`bfDream2` split in two, one per outcome)
- **Not moved:** 6

Moved content is in `data/worlds/hunter/events_e2.js`, with ids `e2_*` / `e2p_*` and `src:'events2.js:<line>'`.

Conversion rules:
- `tr` → `trait`
- `karma` → `karma`
- `fame` → `reputation`
- `gold` → `money`
- `aff` of a person → `rel` with `who`
- `[cls().m]` → `classStat`
- `hp` as a fraction of max HP → `hpPct`
- `mkPerson` → `meet`
- Dropped (no system yet, Phase 6/7): `fav` (star favor) and `coin` (star coins)
- `cause` (could die in the old game) → injury months, because combat is not lethal yet
- `G()` (rank-scaled): fights use a `powerByRank` enemy with the old multiplier. Money uses fixed values at E–D level

| # | Event ID | Name | Old condition | Depends on | Move? | Changed | Status | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | e2_transfer | เพื่อนใหม่ย้ายมากลางเทอม | school, at school | NPC (meet) | after NPC | mkPerson → meet; add trait kind | moved | events2.js:5 |
| 2 | e2_quiz | ครูเสนอให้ลงแข่งตอบปัญหา | school, path study | NPC (teacher) | after NPC | pa:study → flag path_study; the teacher is NPC teacher_park | moved | :9 |
| 3 | e2_election | โกงเลือกตั้งประธานนักเรียน | school | – | now | – | moved | :13 |
| 4 | e2_sibling_sick | (sibling) ป่วยหนัก | school, at home | Family (sibling) | after Family | who role sibling; shows only if there is a sibling | moved | :17 |
| 5 | e2_ramen_rush | ร้านราเมงขาดคน | school, path work | NPC + Life (job) | after NPC | also fires when working at the ramen shop | moved | :21 |
| 6 | e2_harsh_senior | รุ่นพี่ชมรมกีฬาซ้อมโหด | school, path sport | – | now | – | moved | :25 |
| 7 | e2_bf_birthday | ปาร์ตี้วันเกิดเพื่อน | school, path social | Relationship (Hajun) | after Relationship | bf() → Hajun; cost → when + money | moved | :29 |
| 8 | e2_old_man | ชายชราที่ป้ายรถเมล์ | school, once | – (chain) | now | fav dropped; mom aff dropped (no who); every choice sets flag coin_old to start the chain | moved | :33 |
| 9 | e2_drunk_hunter | ฮันเตอร์เมาอาละวาด | school, city | – | now | – | moved | :38 |
| 10 | e2_tuition | ค่าเทอมค้างจ่าย | school, family not merchant | Family (background, mother) | after Family | familyBg; mother via who | moved | :42 |
| 11 | e2_gym_gate | เกตเปิดในโรงยิม | school, once | – | now | title('hero') → flag title_hero; cause → injury 2 | moved | :46 |
| 12 | e2_tutor | ติวเตอร์ราคาแพง | school, path study | – | now | cost → when; adds mana +3 (mana theory course) | moved | :50 |
| 13 | e2_father_hunter | พ่อเคยเป็นฮันเตอร์ | school, retired-hunter family | Family | after Family | familyBg retired_hunter; father via who; remember | moved | :54 |
| 14 | e2_rookies | ฮันเตอร์มือใหม่ขอคำแนะนำ | hunter, guild | NPC (meet) | after NPC | fight → enemy goblins ×0.8 | moved | :59 |
| 15 | e2_ranking | ระบบจัดอันดับฮันเตอร์ | hunter, guild | – | now | G()×1.1 → street_thugs powerByRank ×1.1 | moved | :63 |
| 16 | e2_gate_break | เกตกำลังจะแตก | hunter, gate zone | – | now | boss G()×1.3 → gate_boss ×1.3; fav dropped | moved | :67 |
| 17 | e2_mom_request | คำขอจากแม่ | hunter | Family (mother) | after Family | mother via who | moved | :71 |
| 18 | – | ตลาดมืดแกนอสูร | hunter, casino | casino place + underground path | **wait for another phase** | needs the casino place and the dark path (Phase 5+) | not moved | :75 |
| 19 | – | ยาเพิ่มพลังเถื่อน | flag drug (chain of #18) | as #18 | **wait for another phase** | depends on #18 | not moved | :79 |
| 20 | e2_hunter_corpse | ศพฮันเตอร์ในดันเจี้ยน | hunter, path hunt | – | now | weapon upgrade → item mana_blade_d; fav dropped | moved | :83 |
| 21 | e2_empty_gate | เกตที่ไม่มีมอนสเตอร์ | hunter | – | now | coin dropped; flag letter_from_self kept for later lore | moved | :87 |
| 22 | e2_blood_donation | หมอขอเลือดฮันเตอร์ | hunter, hospital | NPC (doctor) | after NPC | hp −40% → hpPct; doctor is NPC doctor_seo | moved | :91 |
| 23 | – | คู่หูบาดเจ็บ | P.party | party system | **wait for Phase 5** | needs a party for combat | not moved | :95 |
| 24 | e2_reality_show | รายการเรียลลิตี้ฮันเตอร์ | fame ≥ 20 | – | now | fame → reputation | moved | :99 |
| 25 | e2_secret_files | เอกสารลับในห้องประธาน | path guild | – | now | pa:guild → North Star guild or association clerk job; coin dropped | moved | :103 |
| 26 | e2_stalker | คนสะกดรอยตาม | hunter | – | now | fight → street_thugs ×0.9; cause → injury | moved | :107 |
| 27 | e2_red_gate_kids | เกตแดงกับเด็กนักเรียน | hunter, gate zone | – | now | gate_boss ×1.5; title → flag | moved | :111 |
| 28 | e2_artificial_gate | การทดลองเปิดเกตเทียม | path research | – | now | pa:research → int ≥ 30; coin dropped | moved | :115 |
| 29 | e2_livestream | ไลฟ์สดในเกต | hunter | – | now | gate_threat ×0.7 | moved | :119 |
| 30 | – | งานลอบสังหาร | path dark | – | **should not move as written** | see below | not moved | :123 |
| 31 | – | คนที่หน้าเหมือนท่าน | hunter, once | Multiverse lore | **wait for Phase 6/7** | says the player was found at a gate as a baby, which fixes the main Multiverse plot. Needs a decision first | not moved | :127 |
| 32 | e2_chicken_rice | ร้านเปิดใหม่ของฮันเตอร์เกษียณ | hunter, city | NPC (chef) | after NPC | the shop owner is NPC chef_retired | moved | :131 |
| 33 | e2_overtrain | ฝึกจนเกินขีด | path train | – | now | classStat; cause → hpPct −50% + injury 2 | moved | :135 |
| 34 | e2_guild_poach | กิลด์ใหญ่ซื้อตัว | has a guild | – | now | P.guild → worldFlag; new guild guild_silverdragon | moved | :139 |
| 35 | e2_monster_cub | สัตว์อสูรตัวน้อย | gate zone | – (pet system later) | now | pet → flag pet_silverfang | moved | :143 |
| 36 | e2_classmate_funeral | งานศพของเพื่อนร่วมรุ่น | hunter | – | now | – | moved | :147 |
| 37 | – | ข้อความบนผนังหอคอย | tower floor ≥ 15 | tower system | **wait for Phase 5** | no tower or floors yet | not moved | :151 |
| 38 | e2_old_flame | คนเก่าในวันฝนตก | crush exists | NPC + Relationship | after Relationship | the crush is created as an NPC with tag crush in the locker-letter event; romance via relx | moved | :155 |
| 39 | e2_body_age | ร่างกายเริ่มบอกอายุ | age ≥ 30 | Health (lifespan) | after Health | P.life → lifespan effect | moved | :159 |
| 40 | e2_disciple | ศิษย์คนแรก | age ≥ 35 | NPC (meet) | after NPC | mkPerson → meet (disciple) | moved | :163 |
| 41–50 | e2p_quiz_full … e2p_guidance | one-liners, school (10) | school | – (sib_snack: Family) | now / after Family | passive trigger, applied without pausing | moved (10) | :169–178 |
| 51–62 | e2p_fan_art … e2p_kittens | one-liners, hunter/any (12) | hunter/any | – (mom_call: Family) | now / after Family | gold −ri(80,200) → −120; null effect → [] | moved (12) | :179–190 |
| Q1 | e2_bf_promise | คำสัญญาใต้ต้นมะม่วง | 30–34 months after start | NPC + Relationship | after Relationship | timer → player age ≥ 17.6 | moved | :193,205 |
| Q2 | e2_bf_promise2_hunter / _maker | ทวงคำสัญญา | after Q1 | NPC (Hajun's awakening is fixed by seed) | after NPC | split into 2 events by npcFlag hunter; party → NPC flag party | moved | :197 |
| Q3 | e2_oldman_coin | เหรียญทองแดงของชายชรา | flag from #8 | – | now | armor upgrade → item light_armor_d | moved | :201,206 |

## Why #30 (งานลอบสังหาร) should not move as written
- One button takes the job of killing a named person for money. The only results are money and karma −25.
- There is no law, police, wanted or criminal-record system to give it consequences, so it would be the best money in the game with almost no cost.
- To bring it back, rewrite it inside the underground path (with #18, #19) and add consequences first.
