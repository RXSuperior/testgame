# Asset pipeline (Phase 7B.1)

One registry: the existing `AssetRegistry` (`src/core/assets.js`, unchanged) fed by `data/assets/manifest.js`. Phase 7B.1 adds metadata to those same entries (`data/assets/art_meta.js`), a browser loader (`src/ui/assetpipe.js`) and a build/check tool (`tools/assets.js`). No second registry.

## Asset standards
| Type | Ratio | Recommended file | Format | Transparent | Max size | Folder |
|---|---|---|---|---|---|---|
| Location | 16:9 | 1536x864 | WebP | no | 450 KB | bg |
| Character portrait | 3:4 | 1024x1365 | WebP | no | 300 KB | portrait |
| Character full body | 2:3 | 1024x1536 | PNG | yes | 1.2 MB | char |
| Monster | 3:4 | 1024x1365 | PNG | yes | 900 KB | mon |
| Item | 1:1 | 1024x1024 | PNG | yes | 300 KB | item |
| Skill icon | 1:1 | 512x512 | WebP | no | 80 KB | skill |
| Skill effect | 1:1 | 1024x1024 | PNG | yes | 600 KB | fx |
| Old sprite sheet / UI chrome | — | — | — | — | — | decision needed (ART_BIBLE §13) |

- WebP is for opaque images (quality 80–85) and PNG for transparent ones.
- `w`/`h` already in the manifest are the sizes the UI draws (for example 576x324 for scenes) and are kept. The file to deliver is in `std`.
- Ratio tolerance is 1%. Minimum size is 50% of the recommended size.

## Naming and paths
- Asset id: `<world>.<kind>.<name>` (unchanged), for example `hunter.bg.apartment`.
- File path: `assets/<world>/<folder>/<name>.v<version>.<ext>`, for example `assets/hunter/bg/apartment.v1.webp`.
- Lowercase, `a-z0-9_` only, no spaces. Every file belongs to exactly one asset id.

## Versioning
- A new version gets a new file (`.v2.webp`) and the manifest `src`/`version` change.
- The old file stays in git history and is removed from `assets/` (the tool rejects stray files).
- The file name changes with each version, so the browser cache never shows an old image.

## Metadata on each manifest entry
| Field | Meaning |
|---|---|
| `type` | location, portrait, fullbody, monster, item, skill_icon, skill_fx, sprite_sheet, ui |
| `std` | standard from the table above |
| `priority` | P0 pilot · P1 shown by the UI · P2 referenced by data, not shown yet · P3 needs a decision or its world does not exist |
| `status` | placeholder → planned → generated → approved/real |
| `path` | target file path (null while a decision is pending) |
| `version` | 0 = no file yet |
| `src`, `license` | set only when a reviewed file exists; `license` must be one of own, cc0, cc-by, craftpix-free, gandalfhardcore, licensed |
| `source` | generated / commissioned / third-party |
| `gen` | for generated images: `{tool, model, prompt, negative, seed, date, author, reviewedBy}`. Required by the tool when `source:'generated'`. |

## Runtime (src/ui/assetpipe.js)
- **Path mapping:** the manifest `src` is used as given, relative to `index.html`. `tools/build.py` copies only referenced files into `dist/assets/...`.
- **Loading:** the registry's `imageFactory` is wrapped. Each image's load result is tracked per id.
- **Missing asset:** a load error marks the id `missing`, swaps the registry cache to the placeholder and writes a `warn` line to the debug log. The game keeps running.
- **Dimension check:** on load, the real size is compared with `std`. A mismatch marks the id `invalid` and falls back to the placeholder.
- **Fallback:**
  - the registry placeholder for sprites, icons and monsters
  - the themed scene placeholder for locations, also drawn while an image is still loading
- **Preload:** `AW.ui.assets.preload()` runs at boot and loads P0 and P1 assets that have files.
- **Lazy loading:** everything else loads the first time `assets.get(id)` is called. That is the registry's existing behaviour.
- **Report:** `AW.ui.assets.report()` returns counts and the missing/invalid lists.

## Build and check tool (tools/assets.js)
`node tools/assets.js --check --md docs/phase7b/ASSET_INVENTORY.md --json docs/phase7b/asset_registry_mapping.json`

It checks:
- duplicate ids
- duplicate `src` or `path`
- duplicate file content (sha256)
- files in `assets/` that no entry uses
- `src` pointing to a missing file
- image size and ratio read from PNG/WebP/JPEG headers
- file size over the limit (warning)
- invalid license
- generated images without `gen` data
- asset ids referenced by world data or UI code but missing from the registry

It also writes the inventory, with usage locations taken from world data and UI code.

`--check` exits with code 1 on any error. A fake file, an unlicensed file or a wrong-size file cannot pass.

## Adding a real image (7B.2 onward)
1. Generate or commission the image following ART_BIBLE.md and the prompt in PILOT_ASSET_PLAN.md.
2. Review it against the bible (§10 quality, §2 character data).
3. Save it as `assets/<world>/<folder>/<name>.v1.<ext>` at the standard size.
4. In `data/assets/art_meta.js`, set `src`, `license:'own'`, `source:'generated'`, `status:'real'`, `version:1` and `gen{...}` for that id.
5. Run `node tools/assets.js --check`, then `python3 tools/build.py`, then the tests.
