# Party system (Phase 5)

File: `src/systems/party.js` (`engine.party`). Slice `party` `{_v:1, members[], max:3, history[]}`.

## Members are existing NPCs
- No new character type. A member is `{npc, role, joined, injury, missions, earned}` pointing at an NPC from the Phase 4 NPC system.
- Combat ability is read the same way for everyone: the NPC's own `combat`, then the def, then the job's combat profile, then `npc_hunter` if the NPC is a hunter. No NPC has its own code. Hajun follows the same rules (unit tested).

## Invite and leave
`canInvite(q)` refuses when:
- player not awakened, NPC dead, under age, in another world, no combat ability, team full (3)
- relationship too low: affection ≥ 30 and trust ≥ 10, or a story flag `party` set by an event

`invite(q)`, `leave(q)`. A member leaves on their own if affection drops below 0, or if they die.

## Roles and synergy
Roles: tank, damage, support (from data, or a stable hash).
- all 3 roles: ×1.15; tank + support: ×1.10; two damage: ×1.05
- a rival pair in the team: −0.10; everyone friendly: +0.05
- Skills can name a role for extra synergy in manual fights.

## Readiness, injury, recovery
- Members with `injury > 0` do not fight. Injury goes down 1 per month. Event effects `partyHeal`.
- `applyResult` takes party injuries from a claimed combat report.

## Rewards
`payShares(gain)` pays each member their share (`share` in combat profile) out of a mission's money. Money never goes negative. Members gain affection from shared wins.

## Conflict and member events
- `conflict()` reports rival pairs and low trust. Condition `partyConflict`.
- Data events: `party_conflict`, `party_bond`, `e2_partner_injured` (events2.js:95), using the `who` selector keys `party` and `injured`.

## Save
`_afterLoad` drops members whose NPC no longer exists and removes duplicates.
