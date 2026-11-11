# Phase 7B.1 test report (2026-11-12)

| Suite | Result |
|---|---|
| Build `python3 tools/build.py` | pass (56 files; copied 0 asset files, since none exist yet) |
| Asset check `node tools/assets.js --check` | 93 assets, 0 errors, 0 warnings |
| Unit `node tests/core.test.js` | 274 pass, 0 fail (269 old + 5 new) |
| Old browser `tests/smoke.py` | 57/57, 3 runs |
| UI `tests/ui_smoke.py` | 34/34 |
| Responsive `tests/responsive.py` | 56/56 |
| Asset pipeline in browser `tests/asset_smoke.py` | 11/11 |

## New unit tests (p7b)
- Every asset has art metadata (type, std, priority, status, path or decision). 93 assets, no `src`/`license`/`gen` (no fake files). The 10 pilot ids are P0/planned. Paths are unique.
- Paths follow `assets/<world>/<folder>/<name>.v1.<ext>` and the standards (location 1536x864 16:9 WebP; monster 3:4 PNG with alpha; sprite sheets have no path while undecided).
- The header reader gets sizes from PNG and WebP and rejects non-images. The dimension check catches a wrong ratio and too-small files.
- On a temporary folder, the tool catches all of these: generated image without prompt data, duplicate file content, wrong ratio, missing file, bad license, and files not in the registry.
- The real registry passes, and usage is found for location `bg`, UI scene code and enemy `asset` fields.

## Browser pipeline tests (temporary images in /tmp only, never in the project)
- All 93 assets report as placeholder at start, and the scene shows the themed placeholder.
- A missing file is detected, falls back to the placeholder, is written to the debug log, and causes no JS error.
- A wrong-ratio image is marked invalid and not shown.
- A correct 1536x864 image loads, and the scene draws it (pixel colour checked).
- Preload loads only P0/P1 assets that have files. A P2 monster stays idle until used (lazy), then loads and passes the 3:4 check.

## Not changed
`src/core`, `src/systems` and world data (`git diff phase7a.1` is empty for these), gameplay, combat, economy, NPC and save. All 89 old placeholders are kept, and 4 placeholder ids were added. Game file hash d53b7879… unchanged.
