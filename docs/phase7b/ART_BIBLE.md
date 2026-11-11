# Art Bible: Multiverse Hunter

Approved style: **Premium Korean Manhwa RPG**. Mood: realistic, serious, cinematic.

Phase 7B.3 update: two styles, each with its own job.
- Korean Manhwa: cinematic cutscenes, character portraits, location key art. Sections 1 to 12 apply.
- Pixel art: all side-view gameplay (characters, monsters, tilesets) and the pixel RPG HUD. Section 14 applies.
Nothing below was removed.

This book is the rule set for every image in the game. Prompts, reviews and replacements all point back here. Asset sizes and files follow ASSET_PIPELINE.md.

## 1. Main art style
- Full-colour Korean webtoon/manhwa illustration with a painted finish. Not cel-flat, not 3D.
- Semi-realistic human proportions: adults about 7.5 heads tall, teenagers about 7 heads. Real anatomy, real hands.
- Clean line art with controlled line weight: heavier on silhouettes, thin on interior detail. No sketchy or messy lines.
- Painted shading with soft gradients and crisp cast shadows. Light shapes the form; outlines do not do all the work.
- Rich environment detail that still reads clearly at the size the UI shows it (a location scene is about 576 px wide on desktop).
- Quality bar: professional RPG concept art or key-visual level.
- Tone: grounded and serious. Humour comes from story events, not from the drawing style.

Never use:
- chibi or super-deformed proportions
- childish cartoon style
- 3D render, plastic or vinyl-toy look
- pixel art (except the old sprite sheets that are waiting for a decision, see §13)
- text, logos, watermarks, signatures, UI frames painted into the image
- any existing copyrighted character, costume, emblem or composition

## 2. Character design rules
- **Faces:**
  - East Asian features for Hunter World locals (the setting is a Korean city)
  - other worlds follow their own peoples
  - real variety in face shape, eyes, nose and jaw: no "same face"
  - age must be readable: a 15-year-old student is not drawn like a 25-year-old
- **Bodies:** proportions follow age and class. Fighters are athletic but not bodybuilders unless the data says so (for example a tank role).
- **Clothing:**
  - functional and grounded
  - Hunter World uses modern clothes and tactical hunter gear (body armour, straps, boots, mana-tech accents)
  - no fantasy armour in the modern city, unless the item comes from a gate
- **Rank shows through gear quality, not glow:**

  | Rank | Look |
  |---|---|
  | E | worn |
  | D | standard issue |
  | C | fitted, branded by the Association |
  | B | custom and high-grade |
  | A/S | not designed yet (out of scope) |

- **Expressions:** restrained and natural. One clear emotion per portrait; no exaggerated anime faces.
- **Consistency:**
  - each named character gets a reference sheet (front portrait, colour notes, key features) before any other image of them
  - every later image is checked against that sheet
  - age changes (15 → adult → elder) are separate, reviewed assets
- **Data comes first:** appearance must not contradict game data: gender, age, role, temper, traits. Anything the data does not say must be proposed and approved before it is drawn (see PILOT_ASSET_PLAN.md §Characters).

## 3. Location design rules
- Show the place as the player stands in it: eye-level or slightly elevated, one clear focal point, readable depth (foreground, midground, background).
- **Keep the bottom 25% calm and darker.** The UI lays the location name and description over it.
- **Keep the top-right corner free of key detail.** The world badge sits there.
- People are optional, small and unnamed silhouettes only, so no NPC identity is fixed by accident.
- Time of day matters:
  - day and night are separate assets (city_day / city_night)
  - other locations are drawn at the time the scene uses most and adjusted in the UI later
- Gates and mana effects are the only things allowed to glow strongly in Hunter World.

## 4. Monster design rules
- Believable creatures with weight, anatomy and texture: skin, scale, chitin, rust, bone. Silhouette first: each monster must read in black.
- Threat grows with rank:
  - E/D: animal-like, small, simple
  - C: armoured or pack hunters
  - B: tactical or magical, with a visible mechanic
- Show combat mechanics in the design so players learn them:
  - armour = heavy plates
  - shield = a mana barrier motif
  - summoner = a staff or rune circle
  - drain = tendrils or mist
  - swarm = several bodies
- 3:4 full-body pose, three-quarter view, transparent background, no ground shadow baked into the edges (the UI adds its own).
- No gore. Wounds are implied, not shown.

## 5. Item design rules
- One object, centred, three-quarter view, on transparent background. It fills 70–80% of the canvas.
- Material reads clearly at 64 px: metal, leather, crystal, cloth.
- Rank shown by finish and trim:

  | Rank | Finish |
  |---|---|
  | E | rough |
  | D | clean |
  | C | refined |
  | B | ornate with a mana inlay |

- Mana stones and monster cores glow from inside, coloured by rank (see §8).

## 6. Skill icon rules
- Square, opaque, framed by the UI rather than the art. One readable symbol per icon, filling the centre 70%.
- Colour by skill type:
  - active / damage: steel and blue-white
  - support / heal: teal and green
  - passive: gold
  - pierce: a sharp silver line
  - area (all targets): a radial burst
- No letters or numbers.

## 7. Lighting rules
- One key light, a soft fill, and a rim light for figures. Motivated light only (sun, street lamps, gate glow, fire).
- Cinematic contrast: deep shadows are allowed, but faces and focal points must stay readable.
- Gate and mana light is cool blue or violet. Danger and rare high-rank threat is red. Reward and rank is gold. These match the UI colours.

## 8. Colour palette
UI palette (src/ui/theme.css), for art that sits next to it:

| Role | Colour |
|---|---|
| Night base | navy `#0b0f1a`, charcoal `#141b2e` |
| Mana and gates | blue `#4cc3ff`, violet `#9b7bff` |
| Rank, reward, rare items | gold `#f2c14e` |
| Danger, red gates, boss threat | red `#ff5c6c` |

Rank glow for mana stones, cores and gates:

| Rank | Glow |
|---|---|
| E | dull grey-blue |
| D | blue |
| C | violet |
| B | gold-violet |
| A/S | reserved |

Each world shifts the base palette (§12) but keeps the same light logic.

## 9. Camera and composition
| Type | Camera |
|---|---|
| Location | 16:9, about 35 mm, eye level, rule-of-thirds focal point, calm lower band |
| Portrait | 3:4, chest-up, head in the upper third, slight three-quarter turn, plain painted backdrop in the world palette |
| Full body | 2:3, full figure with 5% margin, neutral stance, transparent background |
| Monster | 3:4, full body, three-quarter view, transparent background |
| Item and skill effect | 1:1, centred |

No dutch angles or extreme perspective in reference art. Story CGs can break this later, after approval.

## 10. Image quality requirements
- Deliver at the sizes in ASSET_PIPELINE.md or larger in the same ratio. The tool checks the ratio within 1% and requires at least 50% of the recommended size.
- Reject the image if any of these show:
  - hand or face anatomy errors
  - extra or missing fingers or limbs
  - melted details
  - repeated textures
  - text-like noise
  - visible seams
  - halos around transparent edges
  - JPEG artefacts
- Transparent PNGs must have clean alpha with no white fringe. Opaque images are WebP at quality 80–85.
- Every final image is reviewed against this bible before its manifest entry gets `src`.

## 11. Negative prompt rules
Every generation prompt includes:

> chibi, super deformed, cartoon, childish, 3d render, cgi, plastic, toy, pixel art, low poly, text, letters, watermark, signature, logo, ui, frame, border, blurry, lowres, jpeg artifacts, deformed hands, extra fingers, missing fingers, extra limbs, bad anatomy, disfigured face, cross-eyed, duplicate, cropped head, oversaturated, neon overload

Add for characters: `nsfw, revealing clothing, sexualized` (the cast includes 15-year-old students).
Add for monsters: `gore, blood splatter, exposed organs`.
Never name a real artist, studio, game or manhwa title in a prompt.

## 12. World-specific art direction
| World | In game today | Visual identity | Palette | Materials | Avoid |
|---|---|---|---|---|---|
| Hunter World (modern) | yes (10 locations) | Present-day Korean megacity living with gates for 20 years: dense streets, convenience stores, apartment blocks, Association offices, cordoned gate zones, mana-tech mixed into everyday life | night navy, concrete grey, neon and gate blue/violet, warm interior yellow | glass, concrete, asphalt, tactical fabric | fantasy castles, medieval props in the city |
| Fantasy World (Arcane / Demon Realm) | yes (3 locations) | Old-world high fantasy: forests, stone towns, royal castle, temples; the demon realm is darker and twisted | daylight greens and warm stone; demon realm crimson and black | timber, stone, iron, parchment | modern objects, guns, phones |
| Murim World | no (22 placeholder ids: 1 in the pilot, 21 P3) | Martial world: mountain sects, clan manors, inns, bamboo forests, cliff caves, arenas | ink-wash greys, pine green, lacquer red, mist white | wood, silk, paper lanterns, stone | Japanese-specific motifs used as Chinese, modern objects |
| Apocalypse World | no (no data and no assets) | Planned identity only: ruined cities after a gate break, survivor camps, mutated monsters | ash, rust, sick green sky, emergency orange | broken concrete, scrap metal, tarps | Hunter World cleanliness; draw nothing until the world exists |
| Other worlds | no | Each new world gets its own row here (identity, palette, materials, avoid) before any art is made | | | |

## 13. Old sprite sheets (decision needed)
These were planned for the old pixel-art body system and do not fit the manhwa style:
- `shared.char.base_*` (80x64, 55 frames)
- `*.outfit.*`
- `murim.wep.*`
- `shared.fx.*`
- `shared.ui.*` (the UI is CSS now)

They stay in the registry as P3 placeholders, nothing is deleted. Options for later:
1. replace the walking sprite with portraits and full-body illustrations
2. make manhwa-style sprite sheets (expensive)
3. drop them

Nothing is drawn for these until you choose.

Phase 7B.3 note: the side-view slice now uses pixel art for gameplay (section 14). The old 80x64 and 128px sheets can be used again only after their license is confirmed, through their own frame metadata. Until then they stay P3 placeholders.

## 14. Pixel gameplay (Phase 7B.3)
Used for everything the player controls or fights in side-view. Portraits and cutscenes stay manhwa.

### Display
- Virtual screen 576x324 (16:9), scaled by whole or fractional factors with `image-rendering: pixelated`. No smoothing.
- One pixel scale for the whole scene. Never mix sprites drawn at different scales in one view.

### Character sprites
- Frame: 64x64 px. Foot anchor at (32,63): the bottom-centre pixel sits on the ground line.
- Collision box is separate from the image: default bbox x22 y20 w20 h44 inside the frame. Gameplay uses the bbox, never the image size.
- Sheet layout: one row per animation, frames left to right, 6 columns x 7 rows.

| Animation | Row | Frames | fps | Loop |
|---|---|---|---|---|
| idle | 0 | 4 | 6 | yes |
| walk | 1 | 6 | 10 | yes |
| jump | 2 | 2 | 8 | no |
| fall | 3 | 2 | 8 | yes |
| attack | 4 | 5 | 16 | no (hit frames 2-3) |
| hurt | 5 | 2 | 10 | no |
| death | 6 | 5 | 8 | no |

- Sheets with other frame sizes (80x64, 128x128) are allowed. Each asset declares its own `frame`, `anchor`, `bbox` and `anims` in metadata, so code never assumes 64.
- Facing: draw facing right; the engine mirrors for left. Keep weapons and hair readable when mirrored.

### Pixel style
- Limited palette per character (about 16 colours plus outline). 1 px dark outline, no anti-aliased edges, no semi-transparent pixels except effects.
- Light from upper left, matching section 7.
- Readable silhouettes at 1x: head about 12-14 px tall for a 44 px body.
- Monsters keep the section 4 identity (goblins: green-grey skin, scrap armour), drawn in pixel form.

### Tilesets
- Tile 16x16. Ground tiles tile seamlessly left-right. Top edge 2 px lighter.
- Hunter: `hunter.tile.street` (school, city), `hunter.tile.gate` (gate zone).

### Pixel RPG HUD
- Top-left framed panel: area name, time slot, HP bar, AP diamonds. 2 px border, hard drop shadow, no blur.
- Prompts (`[E] ...`) centred above the ground. Touch buttons round, semi-transparent, bottom corners.

### Licensing
- Same rule as section 10: no file goes in without a confirmed license. Unlicensed or missing files show placeholders, never the real file.
- Replacing a placeholder = add `src` and `license` to the asset entry. No code change.
