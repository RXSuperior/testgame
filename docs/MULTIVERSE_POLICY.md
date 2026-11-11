# Multiverse Policy (default since Phase 3)

| Rule | How it works in code |
|---|---|
| Installed worlds keep moving in time at their timeRate | WorldTime advances every installed world on each global tick. The world's `update` hook runs on every local month, even when the player is elsewhere. |
| Worlds that are not installed stop: no time, no events | `time.removeWorld` / not added. Their saved state and `acc` stay as orphans in the save, unchanged. |
| Returning to a world uses its saved state | The world slice `world:<id>` is never reset by travel. `enter` only runs the world's own hook. |
| Player age comes from global time only | `player.age = loop.month - bornAt`, synced every month and after load. Local time never touches age. |
| Player data is shared; worlds reach it only through the Player System | The `player` slice is owned by `player`. Worlds and systems read `player.get()` (frozen) and change it with Player methods or data effects (Rules). A world module has no write access to the player slice. |
| Player events only run in the world the player is in | The Event System checks `player.location.world`. Other worlds run only their `update` hook (world state), never player events. |
| Normal gate is instant; special gate takes real global months | Unchanged from Phase 2 (see MULTIVERSE_TIME_DESIGN.md). Age goes up by the trip length. |
| Location is always `{world, loc}` and must exist | `Player.setLocation` checks both. On load, a bad `loc` in an installed world is moved to that world's entry point. A world that is not installed is left as is. |

## Added in Phase 4
| Rule | How it works in code |
|---|---|
| NPC age uses the NPC's own world time | `bornAt` is in local months. The player's age stays on global time. |
| NPCs in the world the player is in run every month; other installed worlds run as a batch every 12 local months | NpcSystem.simulate (LOD). Uninstalled worlds do not run (unchanged). |
| Gameplay travel goes through the Gate System (discover/open/conditions/cost) | `engine.gates.travel`. `engine.worlds.travel*` is Debug/system access and skips gameplay conditions. |
| The player's life history is never deleted | `health.lives` is append-only. Death stops time with reason `dead`, and the save still loads. |
