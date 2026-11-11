# Placeholders to replace in Phase 7B

All 89 assets in `data/assets/manifest.js` are still placeholders (`src:null`). To use real art, add `src` and a confirmed `license` (own, cc0, cc-by, craftpix-free, gandalfhardcore, licensed). No code change is needed.

The 17 assets the Phase 7A UI shows directly are marked "yes". They are the scene backgrounds (location `bg`, plus dungeon, combat and night variants) and the character sprite. Make those first.

Phase 7A UI needs that are not in the manifest yet (to add in 7B):
- NPC portraits for the dialogue screen (today it shows text only)
- item icons for the inventory (today it shows text only)
- enemy portraits on the combat screen (the `hunter.mon.*` ids exist, but the UI does not show them yet)
- a tower interior background (the tower uses `bg.gov_base`). `hunter.bg.guild_office` exists but no location uses it yet.

### shared.ui
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| shared.ui.frame | 64x64 | 1 |  |
| shared.ui.button | 64x64 | 1 |  |
| shared.ui.tab | 64x64 | 1 |  |
| shared.ui.panel | 64x64 | 1 |  |
| shared.ui.badge_rank | 64x64 | 1 |  |
| shared.ui.icon_gold | 64x64 | 1 |  |
| shared.ui.icon_time | 64x64 | 1 |  |
| shared.ui.icon_world | 64x64 | 1 |  |

### shared.char
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| shared.char.base_m | 80x64 | 55 | yes |
| shared.char.base_f | 80x64 | 55 |  |

### shared.fx
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| shared.fx.hit | 128x128 | 8 |  |
| shared.fx.crit | 128x128 | 8 |  |
| shared.fx.heal | 128x128 | 8 |  |
| shared.fx.portal_open | 128x128 | 8 |  |
| shared.fx.portal_close | 128x128 | 8 |  |

### hunter.bg
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| hunter.bg.city_day | 576x324 | 1 | yes |
| hunter.bg.city_night | 576x324 | 1 | yes |
| hunter.bg.association_hall | 576x324 | 1 | yes |
| hunter.bg.guild_office | 576x324 | 1 |  |
| hunter.bg.hunter_hospital | 576x324 | 1 | yes |
| hunter.bg.market | 576x324 | 1 | yes |
| hunter.bg.training_center | 576x324 | 1 | yes |
| hunter.bg.danger_zone | 576x324 | 1 |  |
| hunter.bg.apartment | 576x324 | 1 | yes |
| hunter.bg.gov_base | 576x324 | 1 | yes |
| hunter.bg.industrial | 576x324 | 1 | yes |
| hunter.bg.gate_blue | 576x324 | 1 | yes |
| hunter.bg.gate_red | 576x324 | 1 | yes |
| hunter.bg.dungeon_cave | 576x324 | 1 | yes |
| hunter.bg.dungeon_ruins | 576x324 | 1 | yes |

### hunter.outfit
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| hunter.outfit.street | 80x64 | 55 |  |
| hunter.outfit.hunter_f | 80x64 | 55 |  |
| hunter.outfit.hunter_c | 80x64 | 55 |  |
| hunter.outfit.hunter_a | 80x64 | 55 |  |
| hunter.outfit.hunter_s | 80x64 | 55 |  |
| hunter.outfit.suit | 80x64 | 55 |  |
| hunter.outfit.medic | 80x64 | 55 |  |
| hunter.outfit.gov_agent | 80x64 | 55 |  |

### hunter.mon
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| hunter.mon.goblin | 128x128 | 20 |  |
| hunter.mon.orc | 128x128 | 20 |  |
| hunter.mon.dire_wolf | 128x128 | 20 |  |
| hunter.mon.golem | 128x128 | 20 |  |
| hunter.mon.gate_boss | 128x128 | 20 |  |

### hunter.item
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| hunter.item.potion | 32x32 | 1 |  |
| hunter.item.mana_stone | 32x32 | 1 |  |
| hunter.item.core_e | 32x32 | 1 |  |
| hunter.item.core_s | 32x32 | 1 |  |
| hunter.item.phone | 32x32 | 1 |  |
| hunter.item.id_card | 32x32 | 1 |  |

### fantasy.bg
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| fantasy.bg.forest | 576x324 | 1 | yes |
| fantasy.bg.town | 576x324 | 1 | yes |
| fantasy.bg.castle | 576x324 | 1 | yes |
| fantasy.bg.temple | 576x324 | 1 |  |
| fantasy.bg.tavern | 576x324 | 1 |  |
| fantasy.bg.demon_castle | 576x324 | 1 |  |

### fantasy.outfit
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| fantasy.outfit.tunic | 80x64 | 55 |  |
| fantasy.outfit.robe | 80x64 | 55 |  |
| fantasy.outfit.armor | 80x64 | 55 |  |
| fantasy.outfit.noble | 80x64 | 55 |  |
| fantasy.outfit.priest | 80x64 | 55 |  |

### fantasy.mon
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| fantasy.mon.slime | 128x128 | 20 |  |
| fantasy.mon.skeleton | 128x128 | 20 |  |
| fantasy.mon.wolf | 128x128 | 20 |  |
| fantasy.mon.general_rat | 128x128 | 20 |  |
| fantasy.mon.general_frost | 128x128 | 20 |  |
| fantasy.mon.general_necro | 128x128 | 20 |  |
| fantasy.mon.demon_lord | 128x128 | 20 |  |

### murim.bg
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| murim.bg.mountain_sect | 576x324 | 1 |  |
| murim.bg.clan_manor | 576x324 | 1 |  |
| murim.bg.inn | 576x324 | 1 |  |
| murim.bg.market_town | 576x324 | 1 |  |
| murim.bg.bamboo_forest | 576x324 | 1 |  |
| murim.bg.cliff_cave | 576x324 | 1 |  |
| murim.bg.arena | 576x324 | 1 |  |

### murim.outfit
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| murim.outfit.disciple | 80x64 | 55 |  |
| murim.outfit.elder | 80x64 | 55 |  |
| murim.outfit.clan_heir | 80x64 | 55 |  |
| murim.outfit.wanderer | 80x64 | 55 |  |
| murim.outfit.assassin | 80x64 | 55 |  |
| murim.outfit.beggar | 80x64 | 55 |  |

### murim.wep
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| murim.wep.sword | 80x64 | 55 |  |
| murim.wep.saber | 80x64 | 55 |  |
| murim.wep.spear | 80x64 | 55 |  |
| murim.wep.fan | 80x64 | 55 |  |
| murim.wep.fist_wrap | 80x64 | 55 |  |

### murim.mon
| Asset id | Size | Frames | Used by Phase 7A UI |
|---|---|---|---|
| murim.mon.bandit | 128x128 | 20 |  |
| murim.mon.demonic_cultist | 128x128 | 20 |  |
| murim.mon.tiger | 128x128 | 20 |  |
| murim.mon.sect_master | 128x128 | 20 |  |
