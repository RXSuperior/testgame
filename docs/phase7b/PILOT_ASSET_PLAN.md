# Pilot asset plan (Phase 7B.2 candidates, not generated yet)

10 images. Each one maps to a registry id that exists now (status `planned`). The prompts follow ART_BIBLE.md. Every prompt also gets the global negative prompt from ART_BIBLE §11.

Nothing has been generated in 7B.1. This session has no image-generation tool, so 7B.2 needs a decision on the tool and its terms of use (§Open decisions).

| # | Need | Asset id | Shown in game | Type / file |
|---|---|---|---|---|
| 1 | Hunter Apartment | `hunter.bg.apartment` | location "home" | Location 1536x864 WebP |
| 2 | Modern City Street | `hunter.bg.city_day` | location "city", and "school" for now | Location |
| 3 | Hunter Association | `hunter.bg.association_hall` | location "association" | Location |
| 4 | Hunter School | `hunter.bg.school` (new) | not linked yet: the school location still uses `bg.city_day`. Linking it is a one-word data change that needs approval. | Location |
| 5 | Dungeon (UI dungeon scene) | `hunter.bg.dungeon_cave` | the scene shown during dungeon runs (E–C) | Location |
| 6 | Gate | `hunter.bg.gate_blue` | location "gate_zone" | Location |
| 7 | Fantasy location | `fantasy.bg.forest` | location "eldran_gate" (Fantasy World) | Location |
| 8 | Murim location | `murim.bg.mountain_sect` | none: there is no Murim world in the game yet | Location |
| 9 | Main character reference | `shared.portrait.player_m` (also registered: `player_f`, P2) | not linked yet (the UI has no portrait slot) | Portrait 1024x1365 |
| 10 | Hajun | `hunter.portrait.best_friend` | not linked yet (dialogue screen) | Portrait |

## What the data says about characters (checked in code)
**Player** (`src/systems/player.js` create):
- the only appearance field is `gender` (m/f)
- age starts at 15
- species is human
- there is no skin, hair, face or outfit customisation
- the old game had one (skin 5, hairstyles 6 per sex, hair colours, outfits in `game4/create5.js`, `gchar.js`), but it was not carried over

**Hajun** (`data/worlds/hunter/people.js`, id `best_friend`):
- male, age 15
- "friend since middle school year 1", student
- temper: cheerful
- traits: brave 20, kind 30, loyal 40
- home: city
- 50% chance to awaken
- the data and the old game files have **no physical description**

## Prompts
### 1. Hunter Apartment (`hunter.bg.apartment`)
> Korean manhwa full-color illustration, semi-realistic, cinematic lighting. Interior of a small modern Seoul studio apartment at evening, a high-school student's room in a world where dimensional gates appeared 20 years ago: single bed, desk with laptop and textbooks, school uniform jacket on a chair, a hunter-ranking poster on the wall without readable text, window showing distant city lights and a faint blue gate glow on the skyline, warm desk lamp as key light, cool blue rim light from the window, detailed lived-in props, eye-level camera, calm darker lower third, 16:9 composition, no people.

### 2. Modern City Street (`hunter.bg.city_day`)
> Korean manhwa full-color illustration, semi-realistic, cinematic. Busy modern Korean downtown street in daylight: convenience store, cafe signs with no readable text, crosswalk, buses, apartment towers, an Association patrol barrier and a small mana-detector pole on the corner, a distant translucent blue gate floating between skyscrapers, soft afternoon sun with long shadows, small anonymous pedestrians as silhouettes, eye level, rule-of-thirds focus on the distant gate, calm lower band, 16:9.

### 3. Hunter Association (`hunter.bg.association_hall`)
> Korean manhwa full-color illustration, semi-realistic, cinematic. Grand lobby of a national Hunter Association building: polished stone floor, reception counter, large rank board screens with abstract glowing bars and no text, security gates, hanging emblem of an abstract shield-and-star shape (original design), hunters in tactical gear as small silhouettes, cool white architectural light with blue accents, gold trim, eye level, deep perspective, calm lower band, 16:9.

### 4. Hunter School (`hunter.bg.school`)
> Korean manhwa full-color illustration, semi-realistic, cinematic. Front courtyard of a Korean public high school in the morning: main building with clock, sports field, cherry trees, students as small silhouettes in navy uniforms, an emergency gate-evacuation sign shape with no readable text, a faint gate glow far behind the hills, soft morning light, nostalgic but serious mood, eye level, calm lower band, 16:9.

### 5. Dungeon (`hunter.bg.dungeon_cave`)
> Korean manhwa full-color illustration, semi-realistic, cinematic, dark fantasy. Inside a low-rank gate dungeon: natural rock cave with bioluminescent blue crystals, damp stone, scattered bones of small creatures, shallow water reflecting the crystal light, a narrow path leading into darkness, a dropped hunter flashlight as the only warm light, ominous atmosphere without gore, eye level, strong depth, calm darker lower band, 16:9.

### 6. Gate (`hunter.bg.gate_blue`)
> Korean manhwa full-color illustration, semi-realistic, cinematic. A cordoned gate zone in an industrial district at dusk: a tall vertical rift of swirling blue-violet light hovering above cracked asphalt, Association barricades, floodlights, a mobile command van, hunters as small silhouettes preparing, light from the gate casting strong blue rim light, sense of scale, slightly low camera, calm lower band, 16:9.

### 7. Fantasy location (`fantasy.bg.forest`)
> Korean manhwa full-color illustration, semi-realistic, cinematic high fantasy. The arrival point of a dimensional gate in an ancient forest of another world: giant moss-covered trees, a ring of weathered standing stones with a fading blue portal, shafts of golden sunlight through mist, ferns and wildflowers, a distant stone road toward a medieval town, no modern objects, eye level, calm lower band, 16:9.

### 8. Murim location (`murim.bg.mountain_sect`)
> Korean manhwa full-color illustration, semi-realistic, cinematic martial-arts world. A martial sect on a misty mountain peak: tiered wooden halls with dark tiled roofs, stone training courtyard, pine trees on cliffs, long stone stairs, red lacquer gate, sea of clouds below, early dawn light, ink-wash inspired atmosphere with full color, disciples as tiny silhouettes training, eye level from the stairs, calm lower band, 16:9.

### 9. Main character reference (`shared.portrait.player_m`), needs approval first
Because the game has no appearance system, the reference must stay generic: an "everyman" default the player can project onto. Proposed brief, for approval:
> Korean manhwa full-color illustration, semi-realistic proportions, portrait chest-up, 3:4. Korean male high-school student age 15, average build, neat short black hair, dark brown eyes, determined but calm expression, navy school uniform blazer with white shirt, plain painted dark navy background with a faint blue gate glow behind, soft key light from the left, blue rim light, clean line art.

The female version (`player_f`) uses the same brief. Later life stages (adult hunter, elder) are separate assets.

### 10. Hajun (`hunter.portrait.best_friend`), needs approval first
The data defines personality only. Proposed look derived from it, for approval:
> Korean manhwa full-color illustration, semi-realistic proportions, portrait chest-up, 3:4. Korean male high-school student age 15, best friend type, cheerful open grin, slightly messy short dark-brown hair, warm friendly eyes, loosened school tie, navy uniform blazer with sleeves pushed up, phone in hand, plain painted warm-navy background, soft key light, clean line art.

The data supports cheerful, brave, kind, loyal and student. The hair, the phone and the loose tie are proposals: the phone comes from his gate-video event in events_life.js.

## Review checklist per image
1. It matches ART_BIBLE §1 style and §10 quality.
2. It does not contradict the data (§Characters).
3. No text, logos or watermark.
4. The size and ratio pass `node tools/assets.js --check`.
5. `gen` metadata is complete.

## Open decisions for you
1. **Image tool and its terms.** It must allow commercial use and ownership of output, since the license is recorded as `own`.
2. **Main character:** a single default look, or bring back the old appearance options?
3. **Hajun:** approve the proposed look above, or give his real appearance.
4. **Link the school** to `bg.school`: a one-word data change.
5. **Old sprite sheets** (ART_BIBLE §13): replace with portraits, redraw, or drop.
