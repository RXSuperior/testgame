# Asset requirements per world (Phase 1)

All 89 ids in `data/assets/manifest.js` are placeholders (`src:null, license:null`). The game draws a labelled "PLACEHOLDER" box for them. The logic uses ids only, so a real image can be swapped in by adding `src` + `license` without code changes.

An asset counts as real only when it has `src` and one of the licenses: own, cc0, cc-by, craftpix-free, gandalfhardcore, licensed. Anything else stays a placeholder and must not ship.

| World | bg | outfit | mon | other | total |
|---|---|---|---|---|---|
| shared | | | | ui 8, char 2, fx 5 | 15 |
| hunter (Modern Hunter) | 15 | 8 | 5 | item 6 | 34 |
| fantasy (Demon Realm) | 6 | 5 | 7 | | 18 |
| murim (Martial) | 7 | 6 | 4 | wep 5 | 22 |

## Candidates from the old game (not yet used)
Listed in `AW.data.assetCandidates`. To use one, copy the file into the repo, set `src`, and confirm the license.
- hunter.bg.city_*: CraftPix city skylines in game3/a/bg/awaken, casino, guild, hospital (craftpix-free)
- fantasy bg and character base: GandalfHardcore (gandalfhardcore)
- fantasy monsters: CraftPix a/m/* (craftpix-free)
- td, rat, frost, necro, demonlord: license unknown. Cannot ship until the source license is found.
