# Images to create (from the code, 2026-11-12)

Source: `node tools/assets.js` (registry) and the world data in `data/worlds/*`. Nothing here is generated yet.

## A. In the registry now (93 ids)
| Type | Count | P0 | P1 | P2 | P3 | Notes |
|---|---|---|---|---|---|---|
| Location (16:9) | 29 | 8 | 10 | 5 | 6 | 18 are shown by the UI today. Murim has 7 (1 in the pilot), but there is no Murim world yet. |
| Portrait (3:4) | 3 | 2 | 0 | 1 | 0 | player_m, player_f, Hajun |
| Monster (3:4) | 16 | 0 | 0 | 12 | 4 | Hunter 5 (4 are used by enemy data), fantasy 7, murim 4 |
| Item (1:1) | 6 | 0 | 0 | 6 | 0 | generic: potion, mana_stone, core_e, core_s, phone, id_card |
| Old sprite sheets | 31 | 0 | 0 | 0 | 31 | decision needed (ART_BIBLE §13) |
| UI chrome | 8 | 0 | 0 | 0 | 8 | probably not needed: the UI is CSS |

Order of work: P0 (pilot, 10), then P1 (10 scenes already on screen), then P2. P3 waits for decisions.

## B. Needed by data or the UI but not registered yet (to register in 7B.2+ after the pilot is approved)
| Need | Count | Ids from data |
|---|---|---|
| NPC portraits | 9 | clerk_yoon (ยุนแชอา, f 26), master_kang (ครูฝึกคัง, m 48), teacher_park (ครูพัก, f 41), ramen_owner (ลุงโจ, m 55), chef_retired (แทซอก, m 44), rival_hunter (คังมินซอก, m 19), doctor_seo (หมอซอ, f 37), broker_moon (นายหน้ามุน, m 52), fantasy mage_liora (ลิโอรา). Hajun is already registered. |
| Item art | 22 items in data, 6 generic ids registered | iron_dagger, mana_blade_d, crystal_blade_c, leather_vest, light_armor_d, mana_stone, monster_core, hunter_license, mana_ring, guard_charm, fang_blade_b, scale_armor_b, black_charm, skill_book_focus, stormsteel_blade_b, colossus_plate_b, seeker_charm_b, hydra_fang_spear_b, wyvern_scale, colossus_core, ancient_relic, archive_page. Some can map to the generic ids (mana_stone, hunter_license → id_card). |
| Skill icons | 15 | slash, aimed_shot, fireball, backstab, heal, shield_wall, mana_burst, iron_body, battle_focus, shock_strike, rally, piercing_thrust, blade_storm, guardian_aura, second_wind |
| Monsters without art | 16 enemies | thugs, skel_w, skel_a, street_thugs, sparring_rival, skel_knight, frost_naga, rat_swarm, sewer_croc, goblin_scout, goblin_shaman, ruin_golem, tower_guard, tower_warden, b_rank_hunter, drug_gang. The 23 enemies that do have art share 4 images (goblin, dire_wolf, gate_boss, golem). Human enemies may need character art rather than monster art. |
| Tower interior | 1 | the tower location uses `bg.gov_base` |

The 10 B-rank enemies from Phase 6 borrow those 4 shared images through `asset` fields. Unique art for them is a P2 decision.
