# Dungeon system (Phase 5)

File: `src/systems/dungeon.js` (`engine.dungeon`). Data: `data/worlds/hunter/adventure.js` (`H.dungeons`).

## Data
```js
{id, name, rank, at, ap, floors, rooms, roomWeights, enemies[], boss, risk,
 when, rewards, clearRewards, keepOnFail, mutate, checkpoint, tags, src}
```
`validateDungeons` checks enemies, boss, numbers and fields. A bad dungeon blocks world registration (WorldSystem validator).

## Generation
`generate(def, seed, startFloor)` is pure and seeded. Each floor is a list of rooms: fight, event, rest, treasure. The first room of a floor is a fight; the last floor ends with the boss. Same seed = same layout.

## Run
Slice `{_v, run, seq, records{q:{clears,runs,deepest,checkpoint}}, claimed[]}`.
- `enter(q,{fromCheckpoint})` costs AP. Difficulty multiplier rises with `mutate × clears`, so the dungeon changes as the player clears it.
- `advance()`:
  - fight: auto resolve with party power
  - event: shows a `trigger:'dungeon'` event and waits for the answer
  - rest: heal
  - treasure: loot into the run (not into the inventory yet)
  - boss: manual fight with `source:{kind:'dungeon'}`
- `leave()` = retreat. Loot is kept in full when you leave by choice.
- Fail or retreat in a fight: keep `keepOnFail` of the loot.
- Clear: clear rewards, records, checkpoint, `missions.addTags(tags)` so dungeon clears count toward rank requirements.

## No duplicate rewards
Loot is committed once (`committed`, `claimed[]` by run id). Saving and loading in the middle of a run continues the same run; it does not give loot twice (unit and perf tested).

## Content
| Dungeon | Rank | Notes |
|---|---|---|
| sewer_nest | E | starter |
| goblin_warren | D | boss goblin_king |
| abandoned_subway | D | needs flag `info_subway` (bought from the dark market) |
| red_ruins | C | high-risk boss |
