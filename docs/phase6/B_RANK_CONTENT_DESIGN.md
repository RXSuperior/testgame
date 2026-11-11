# B-rank content (Phase 6)

Data only: `data/worlds/hunter/rank_b.js`. It uses the existing Mission, Combat, Party, Dungeon, Event and Economy systems. There is no A/S content.

## Getting to B
The rule and exam from Phase 5 are unchanged (level 18, stat total 260, 8 rank_c tags, `exam_b`). After promotion, the `b_promotion` event offers three directions:
- the Association (merit +20)
- the guilds (standing +5 with each)
- independent work (the bounty board flag)

None of these is permanent. Every other path stays open through standing, merit or flags.

## Enemies: harder without just more HP
| Enemy | Mechanic | Counter |
|---|---|---|
| iron_colossus | armor 0.45 | pierce skill (piercing_thrust) |
| shadow_stalker | shield (−70% damage for 2 hits) | stun breaks the shield |
| lich_adept | drain MP, summons skeletons, shield | kill fast, stun |
| harpy_flock, rogue_crew | swarm (solo auto power −25% / −20%) | bring a team |
| wyvern, gate_hydra | sweep, heal, enrage, summon | tank and support roles |
| abyss_knight (dungeon boss) | armor + shield + summon + enrage | full kit |

The new combat mechanics are in `combat.js`:
- `armor`
- pattern acts `shield`, `summon`, `drain`
- skill flag `pierce`
- enemy `swarm` for auto resolve

Enemy data is validated: armor 0–0.6, swarm 0–0.4, known acts, summon target exists.

## Missions
| Mission | Mode / risk | Notes |
|---|---|---|
| b_escort_caravan, b_hunt_wyvern, b_rogue_crew | auto | everyday B work |
| b_colossus_gate, b_lich_trace | manual / high | bosses; the lich trace opens a story hint and the hidden dungeon |
| b_raid_hydra | manual / high | team only (party ≥ 2), best reward, B weapon |
| b_bounty_stalker | manual / high | solo only (no party) and needs the bounty board or Ironfang standing; −3 merit |
| assoc_senior_patrol | auto | needs merit 180 (Association route) |
| gc_northstar_relief / gc_ironfang_hunt / gc_silver_survey | auto | guild contracts: member or standing ≥ 20; each matches a style (team / solo / explorer) |

## Dungeons
- `abyss_gate` (B, 4 floors, high-risk boss, 3 discoveries).
- `drowned_archive` (hidden, B): needs 4 discoveries or the lich trace. It has 3 discoveries and an accessory reward.
- The four existing dungeons gained discoveries too, so explorers can grow from rank E.

## Gear and skills
- Gear: stormsteel blade, colossus plate, seeker charm (shop), and the hydra fang spear (raid reward). All upgrade to +5 with growing cost. Phase 5's fang_blade_b and scale_armor_b were raised to +5.
- Materials: wyvern scale, colossus core, ancient relic (sellable).
- Skills:
  - piercing_thrust (pierce)
  - blade_storm (all targets, needs stat total 300)
  - guardian_aura (support, needs a team)
  - second_wind (passive, needs VIT 60)
  
  Each is learned through an action that also checks its unlock condition.

## Events
- b_promotion
- b_media_interview (reputation)
- b_rival_spar (the rival NPC through the normal `who` selector)
- b_team_share (the team asks for a bigger cut)
- b_kid_fan
- b_association_audit (dark-market heat ≥ 20)
- b_lich_hint
- 3 dungeon room events
