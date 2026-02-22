# Quest & NPC Registry

Canonical source of truth for all quests, NPCs, dialog conditions, and state keys.
**Always update this file when adding new NPCs, quests, or dialog.**

To regenerate the Mermaid flowchart, use the data here to update `docs/quest-flowchart.md`.

---

## Location Map

### World: level_town (TownLevel.tscn)
Flat ground, 2200px wide. Camera bounds set by Marker2D nodes.

| Location | Scene File | Notes |
|----------|------------|-------|
| Town Street | TownLevel.tscn (outdoor) | Main area. Black Karim, Brown Karim, Purple Karim wander here. |
| House 1 Interior | levels/level_town/interiors/House1Interior.tscn | Shop house. Blue Karim inside. |
| House 2 Interior | levels/level_town/interiors/House2Interior.tscn | Quest house. Green Karim + Red Karim inside. |

### Town Street — Key Positions

| Node | Type | x (approx) | Description |
|------|------|-------------|-------------|
| Door 1 | Door (Area2D) | ~150 | Enters House1Interior |
| Door 2 | Door (Area2D) | ~450 | Enters House2Interior |
| Black Karim | WanderingNPC | 220–420 (wander) | Flavor NPC |
| Brown Karim | BrownKarimNPC | 550–800 (wander) | One-time spooky event |
| Purple Karim | PurpleKarimNPC | 1200–1700 (wander) | Quest giver — Purple Karim's Debt |
| Jungle Portal | Portal (Area2D) | ~1950 | Leads to level_jungle (green vortex, orange return) |

---

### World: level_jungle (JungleLevel.tscn)
Flat ground, 1600px wide. Permanent green night overlay (humidity/dim atmosphere). No weather controller.

| Location | Scene File | Notes |
|----------|------------|-------|
| Jungle Exterior | JungleLevel.tscn (outdoor) | Hydra Bodies 2+3 wander here. Three-Headed Karim appears after all bodies gone. |
| Jungle House Interior | levels/level_jungle/interiors/JungleHouseInterior.tscn | Hydra Body 1 stands inside. |

### Jungle Exterior — Key Positions

| Node | Type | x (approx) | Description |
|------|------|-------------|-------------|
| PortalBack | Portal (Area2D) | ~50 | Returns to level_town (orange color) |
| Door1 | Door (Area2D) | ~300 | Enters JungleHouseInterior |
| House1 | House prop | ~350 | Visual house prop |
| HydraBody2 | HydraBodyNPC | 550–950 (wander) | Fades after interaction, sets hydra_body_2_gone |
| HydraBody3 | HydraBodyNPC | 1000–1400 (wander) | Fades after interaction, sets hydra_body_3_gone |
| ThreeHeadedKarim | ThreeHeadedKarimNPC | 650–1150 (wander) | Hidden until all 3 bodies gone, fades after encounter |

### House 1 Interior — Key Positions

| Node | Type | x | Description |
|------|------|---|-------------|
| Blue Karim | BlueKarimNPC | ~120 | Shopkeeper → ShopPanel |
| Exit Door | Door (Area2D) | — | Returns to Town Street |

### House 2 Interior — Key Positions

| Node | Type | x | Description |
|------|------|---|-------------|
| Green Karim | GreenKarimNPC | ~80 | Soldier, quest target |
| Red Karim | RedKarimNPC | ~140 | Quest giver |
| Exit Door | Door (Area2D) | — | Returns to Town Street |

---

## NPC Registry

### Black Karim
| Property | Value |
|----------|-------|
| Script | WanderingNPC.gd (no subclass) |
| Scene placement | TownLevel.tscn, Town Street |
| Wander bounds | x: 220–420 |
| voice_pitch | 0.4 |
| Role | Flavor — no quest involvement |
| Repeat dialog | Yes — always plays `black_karim/flavor` |
| Quest dependency | None |

### Purple Karim
| Property | Value |
|----------|-------|
| Script | PurpleKarimNPC.gd (extends WanderingNPC) |
| Scene placement | TownLevel.tscn, Town Street |
| Wander bounds | x: 1200–1700 |
| voice_pitch | 0.95 |
| Role | Quest giver — initiates Purple Karim's Debt (auto-accept) |
| Modulate | Color(0.5, 0.1, 0.8, 1) — purple tint |

**Dialog selection logic (PurpleKarimNPC._get_active_dialog_id):**
```
quest_purple_karim_complete == true   → level_town/purple_karim/done       (forever after)
three_headed_karim_paid == true       → level_town/purple_karim/complete   (triggers reward)
quest_purple_karim_active == true     → level_town/purple_karim/waiting    (repeatable nag)
default                               → level_town/purple_karim/intro      (quest entry point)
```

**On dialog end:**
- `purple_karim/intro` ends → auto-sets `quest_purple_karim_active = true` (no choice panel)
- `purple_karim/complete` ends → sets `quest_purple_karim_complete = true` + 0.5s delay → ItemAcquiredPopup("Vibrator")

---

### Brown Karim
| Property | Value |
|----------|-------|
| Script | BrownKarimNPC.gd (extends WanderingNPC) |
| Scene placement | TownLevel.tscn, Town Street |
| Wander bounds | x: 550–800 |
| voice_pitch | 0.4 |
| Role | One-time spooky event, vanishes permanently |
| Visible condition | `brown_karim_vanished == false` |
| On interact | Plays `brown_karim/spooky` → _spooky_vanish() |
| On vanish | Music ducks to -80dB (0.3s), slides right +200px, fades out (1.5s), unducks (0.5s) |
| Sets on vanish | `brown_karim_vanished = true` |
| Quest dependency | None (independent event) |

### Blue Karim
| Property | Value |
|----------|-------|
| Script | BlueKarimNPC.gd (extends NPC) |
| Scene placement | House1Interior.tscn, x ~120 |
| voice_pitch | 1.0 (default) |
| Role | Shopkeeper → opens ShopPanel after greeting dialog |
| On interact | Plays `blue_karim/greet` → ShopPanel (0.5s delay) |
| Repeat dialog | Yes — greeting plays every visit |
| Quest dependency | None |
| Notes | `blue_karim/bought` and `blue_karim/no_money` dialogs exist in dialogs/ but are NOT wired up. ShopPanel handles those states with visual flash effects instead. Reserved for future use. |

### Green Karim
| Property | Value |
|----------|-------|
| Script | GreenKarimNPC.gd (extends NPC) |
| Scene placement | House2Interior.tscn, x ~80 |
| voice_pitch | 0.8 |
| Role | Soldier — quest target for Red Karim's complaint |
| Quest dependency | Red Karim's Complaint (step 4) |

**Dialog selection logic (GreenKarimNPC._get_active_dialog_id):**
```
quest_red_karim_complete == true      → green_karim/reformed   (forever after)
quest_red_karim_accepted == true
  AND quest_green_karim_confronted == false → green_karim/confronted (triggers step 4)
default                               → green_karim/default
```

**On dialog end:**
- `green_karim/confronted` ends → sets `quest_green_karim_confronted = true`

### Red Karim
| Property | Value |
|----------|-------|
| Script | RedKarimNPC.gd (extends NPC) |
| Scene placement | House2Interior.tscn, x ~140 |
| voice_pitch | 0.9 |
| Role | Quest giver — initiates Red Karim's Complaint |
| Quest dependency | Red Karim's Complaint (all steps) |

**Dialog selection logic (RedKarimNPC._get_active_dialog_id):**
```
quest_red_karim_complete == true      → red_karim/done         (forever after)
quest_green_karim_confronted == true  → red_karim/complete     (triggers step 5)
quest_red_karim_accepted == true      → red_karim/waiting      (repeatable nag)
default                               → red_karim/intro        (quest entry point)
```

**On dialog end:**
- `red_karim/intro` ends → 0.5s delay → ChoicePanel ("Accept the quest" / "Decline")
  - Accept (index 0): sets `quest_red_karim_accepted = true`, emits `red_karim/accept`
  - Decline (index 1): emits `red_karim/decline`
- `red_karim/complete` ends → sets `quest_red_karim_complete = true`, 0.5s delay → ItemAcquiredPopup("Dildo")

### Hydra Body NPC (×3)
| Property | Value |
|----------|-------|
| Script | HydraBodyNPC.gd (extends WanderingNPC) |
| `state_key` export | Set in Inspector per instance: `hydra_body_1_gone`, `hydra_body_2_gone`, `hydra_body_3_gone` |
| Scene placement (Body 1) | JungleHouseInterior.tscn — standing still (wander_min_x = wander_max_x = 120) |
| Scene placement (Body 2) | JungleLevel.tscn — wander x: 550–950 |
| Scene placement (Body 3) | JungleLevel.tscn — wander x: 1000–1400 |
| voice_pitch | 0.3 (very low, eerie) |
| Modulate | Color(0.4, 0.1, 0.6, 1) — dim purple tint |
| On interact | Plays `level_jungle/hydra_body_X/dialog` (one "…" line) → fades out (1.2s EASE_IN) → queue_free() |
| On queue_free | Sets `hydra_body_X_gone = true` via ProgressData (emits quest_state_changed → JungleLevelController reacts) |
| Persist | Yes — on scene load, HydraBodyNPC._ready() calls queue_free() immediately if state_key == true |

### Three-Headed Karim
| Property | Value |
|----------|-------|
| Script | ThreeHeadedKarimNPC.gd (extends WanderingNPC) |
| Scene placement | JungleLevel.tscn, x ~900, wander x: 650–1150 |
| voice_pitch | 0.2 (very deep, intimidating) |
| Modulate | Color(0.3, 0.05, 0.5, 1) — dark purple |
| Scale | Vector2(1.3, 1.3) — slightly larger |
| Visibility | `visible = false` by default; JungleLevelController shows it when all 3 bodies gone AND `three_headed_karim_paid == false` |
| On interact | Plays `level_jungle/three_headed_karim/encounter` (6 Dutch lines, one_shot) |
| On dialog end | `_fade_and_leave()`: sets `three_headed_karim_paid = true`, fades out (1.5s EASE_IN) → queue_free() |
| Persist | Yes — ThreeHeadedKarimNPC._ready() calls queue_free() if `three_headed_karim_paid == true` |

---

## Quest Registry

### Quest: Red Karim's Complaint
**Level**: level_town
**Giver**: Red Karim (House 2, x ~140)
**Target**: Green Karim (House 2, x ~80)
**Reward**: Item popup — "Dildo" (no sprite, `null` passed to ItemAcquiredPopup.setup())
**Repeatable**: No — one-time resolution

#### Step-by-Step Flow

| Step | Actor | Location | Precondition | Player Action | System Action | State Changed |
|------|-------|----------|--------------|---------------|---------------|---------------|
| 1 | Red Karim | House 2 | `quest_red_karim_accepted == false` | Talk to Red Karim | Plays `red_karim/intro` (4 lines) | — |
| 2 | Player | House 2 | After intro ends | — | ChoicePanel appears (0.5s delay) | — |
| 2a | Player | House 2 | Choice shown | Select "Accept the quest" | Plays `red_karim/accept`, sets flag | `quest_red_karim_accepted = true` |
| 2b | Player | House 2 | Choice shown | Select "Decline" | Plays `red_karim/decline`, loops back | — |
| 3 | Red Karim | House 2 | `quest_red_karim_accepted == true` AND `quest_green_karim_confronted == false` | Talk to Red Karim again | Plays `red_karim/waiting` (repeatable) | — |
| 4 | Green Karim | House 2 | `quest_red_karim_accepted == true` AND `quest_green_karim_confronted == false` | Talk to Green Karim | Plays `green_karim/confronted` (4-line exchange) | `quest_green_karim_confronted = true` |
| 5 | Red Karim | House 2 | `quest_green_karim_confronted == true` AND `quest_red_karim_complete == false` | Talk to Red Karim | Plays `red_karim/complete` (3 lines) | `quest_red_karim_complete = true` |
| 5b | — | — | After complete dialog ends | — | ItemAcquiredPopup("Dildo") shown (0.5s delay) | — |
| 6 | Red Karim | House 2 | `quest_red_karim_complete == true` | Talk to Red Karim | Plays `red_karim/done` (repeatable) | — |
| 6b | Green Karim | House 2 | `quest_red_karim_complete == true` | Talk to Green Karim | Plays `green_karim/reformed` (repeatable) | — |

#### Decline Loop
If player declines at step 2b: Red Karim plays `red_karim/decline`, then on next interaction returns to step 1 (intro plays again, choice offered again). Loops until accepted.

---

### Quest: Purple Karim's Debt
**Level**: level_town (giver/completion) + level_jungle (task)
**Giver**: Purple Karim (Town Street, x ~1400)
**Task**: Deliver payment to Three-Headed Karim in the Jungle Village (talk to all 3 Hydra Bodies, then talk to Three-Headed Karim)
**Reward**: Item popup — "Vibrator" (no sprite, `null` passed to ItemAcquiredPopup.setup())
**Repeatable**: No — one-time resolution
**Auto-accept**: Yes — no ChoicePanel, quest starts automatically after intro dialog

#### Step-by-Step Flow

| Step | Actor | Location | Precondition | Player Action | System Action | State Changed |
|------|-------|----------|--------------|---------------|---------------|---------------|
| 1 | Purple Karim | Town Street | `quest_purple_karim_active == false` | Talk to Purple Karim | Plays `purple_karim/intro` (10 lines) | — |
| 1b | — | — | After intro ends | — | Sets flag automatically (auto-accept) | `quest_purple_karim_active = true` |
| 2 | Purple Karim | Town Street | `quest_purple_karim_active == true` AND payment not yet done | Talk to Purple Karim again | Plays `purple_karim/waiting` (2 lines, repeatable) | — |
| 3a | Hydra Body 1 | Jungle House Interior | `hydra_body_1_gone == false` | Talk to Body 1 | "…" dialog → body fades (1.2s) → queue_free() | `hydra_body_1_gone = true` |
| 3b | Hydra Body 2 | Jungle Exterior | `hydra_body_2_gone == false` | Talk to Body 2 | "…" dialog → body fades (1.2s) → queue_free() | `hydra_body_2_gone = true` |
| 3c | Hydra Body 3 | Jungle Exterior | `hydra_body_3_gone == false` | Talk to Body 3 | "…" dialog → body fades (1.2s) → queue_free() | `hydra_body_3_gone = true` |
| 4 | JungleLevelController | Jungle Exterior | All 3 `hydra_body_X_gone == true` AND `three_headed_karim_paid == false` | — (auto-triggered by quest_state_changed) | ThreeHeadedKarim.visible = true | — |
| 5 | Three-Headed Karim | Jungle Exterior | `three_headed_karim_paid == false` AND all 3 bodies gone | Talk to Three-Headed Karim | Plays `three_headed_karim/encounter` (6 lines, one_shot) | — |
| 5b | Three-Headed Karim | Jungle Exterior | After encounter dialog ends | — | `_fade_and_leave()`: fades (1.5s) → queue_free() | `three_headed_karim_paid = true` |
| 6 | Player | Town Street | — | Return through PortalBack → walk to Purple Karim | — | — |
| 7 | Purple Karim | Town Street | `three_headed_karim_paid == true` AND `quest_purple_karim_complete == false` | Talk to Purple Karim | Plays `purple_karim/complete` (4 lines, one_shot) | `quest_purple_karim_complete = true` |
| 7b | — | — | After complete dialog ends | — | ItemAcquiredPopup("Vibrator") shown (0.5s delay) | — |
| 8 | Purple Karim | Town Street | `quest_purple_karim_complete == true` | Talk to Purple Karim | Plays `purple_karim/done` (1 line, repeatable) | — |

#### Notes
- Steps 3a/3b/3c can be done in **any order** — all three state keys are checked independently by JungleLevelController
- Player must travel to Jungle Village via the JunglePortal (east end of Town Street, x ~1950)
- The JungleHouseInterior door is at x ~300 in JungleLevel. Enter it to find Hydra Body 1.
- Three-Headed Karim DOES NOT need to be re-spawned on reload — JungleLevelController checks all 3 flags on every level load and sets visibility accordingly

---

## Events (Non-Quest Tracked State)

### Event: Brown Karim Vanishes

| Property | Value |
|----------|-------|
| Trigger | Player talks to Brown Karim |
| Dialog | `brown_karim/spooky` (1 line, voice_pitch 0.4) |
| Sequence | Dialog ends → music ducks -80dB (0.3s) → 0.5s pause → NPC slides right +200px (1.5s, EASE_IN TRANS_QUAD) + fades to alpha 0 simultaneously → sets flag → music unducks (0.5s) → queue_free() |
| State set | `brown_karim_vanished = true` |
| Persistent | Yes — on next scene load, BrownKarimNPC._ready() reads flag and calls queue_free() immediately |

---

## Shop Registry

Shop is accessed via Blue Karim (House 1) → `blue_karim/greet` dialog → ShopPanel opens.

| Item ID | Name | Cost | Description | Game Effect (planned) | Implemented |
|---------|------|------|-------------|----------------------|-------------|
| `extra_heart` | Extra Heart | 80 coins | +1 max HP permanently | HUD heart increase | No (purchased_items only) |
| `speed_charm` | Speed Charm | 120 coins | Move 10% faster | Player speed multiplier | No (purchased_items only) |
| `town_key` | Town Key | 60 coins | Opens the east gate | Unlock a ProgressionGate | No (purchased_items only) |

**Note**: All items are currently tracked in `ProgressData.purchased_items` on purchase but their in-game effects are not yet implemented. The `town_key` implies a ProgressionGate dependency that does not yet exist in TownLevel.tscn.

**Currency**: `ProgressData.coins` (single pool, never lost on death). F10 debug adds 100 coins.

**ShopPanel behavior**:
- Grey-out slot (75% opacity) = insufficient coins
- Grey-out slot (50% opacity) + "Owned" label + Buy disabled = already purchased
- 2-step confirm: first press → "OK?", second press → execute purchase
- Denied: red flash on cost label + coin label, plays `ui_tick` SFX
- Purchase success: plays `ui_confirm` SFX, emits `EventBus.coins_changed(int)`

---

## Dialog Registry

All dialog files live at: `godot_port/levels/{level_id}/dialogs/{npc_name}/{moment}.tres`
Dialog IDs follow pattern: `level_{id}/{npc_name}/{moment}`
All are DialogSequence resources with DialogLine sub-resources.

| Dialog ID | File | one_shot | Condition | voice_pitch | Lines |
|-----------|------|----------|-----------|-------------|-------|
| `level_town/black_karim/flavor` | `dialogs/black_karim/flavor.tres` | false | Always | 0.4 | 3 |
| `level_town/brown_karim/spooky` | `dialogs/brown_karim/spooky.tres` | effectively true* | `brown_karim_vanished == false` | 0.4 | 1 |
| `level_town/blue_karim/greet` | `dialogs/blue_karim/greet.tres` | false | Always | 1.0 | 2 |
| `level_town/blue_karim/bought` | `dialogs/blue_karim/bought.tres` | — | UNUSED (reserved) | 1.0 | 1 |
| `level_town/blue_karim/no_money` | `dialogs/blue_karim/no_money.tres` | — | UNUSED (reserved) | 1.0 | 1 |
| `level_town/green_karim/default` | `dialogs/green_karim/default.tres` | false | Quest not accepted | 0.8 | 3 |
| `level_town/green_karim/confronted` | `dialogs/green_karim/confronted.tres` | true | `quest_red_karim_accepted AND NOT quest_green_karim_confronted` | 0.8 / 1.2 (player) | 4 |
| `level_town/green_karim/reformed` | `dialogs/green_karim/reformed.tres` | false | `quest_red_karim_complete == true` | 0.8 | 1 |
| `level_town/red_karim/intro` | `dialogs/red_karim/intro.tres` | false | Quest not accepted | 0.9 | 4 |
| `level_town/red_karim/accept` | `dialogs/red_karim/accept.tres` | true | After player accepts choice | 0.9 | 2 |
| `level_town/red_karim/decline` | `dialogs/red_karim/decline.tres` | false | After player declines choice | 0.9 | 2 |
| `level_town/red_karim/waiting` | `dialogs/red_karim/waiting.tres` | false | `quest_red_karim_accepted AND NOT quest_green_karim_confronted` | 0.9 | 1 |
| `level_town/red_karim/complete` | `dialogs/red_karim/complete.tres` | true | `quest_green_karim_confronted AND NOT quest_red_karim_complete` | 0.9 | 3 |
| `level_town/red_karim/done` | `dialogs/red_karim/done.tres` | false | `quest_red_karim_complete == true` | 0.9 | 1 |

| `level_town/purple_karim/intro` | `dialogs/purple_karim/intro.tres` | true | Quest not accepted | 0.95 | 10 |
| `level_town/purple_karim/waiting` | `dialogs/purple_karim/waiting.tres` | false | `quest_purple_karim_active AND NOT three_headed_karim_paid` | 0.95 | 2 |
| `level_town/purple_karim/complete` | `dialogs/purple_karim/complete.tres` | true | `three_headed_karim_paid AND NOT quest_purple_karim_complete` | 0.95 | 4 |
| `level_town/purple_karim/done` | `dialogs/purple_karim/done.tres` | false | `quest_purple_karim_complete == true` | 0.95 | 1 |
| `level_jungle/hydra_body_1/dialog` | `dialogs/hydra_body_1/dialog.tres` | true | `hydra_body_1_gone == false` | 0.3 | 1 |
| `level_jungle/hydra_body_2/dialog` | `dialogs/hydra_body_2/dialog.tres` | true | `hydra_body_2_gone == false` | 0.3 | 1 |
| `level_jungle/hydra_body_3/dialog` | `dialogs/hydra_body_3/dialog.tres` | true | `hydra_body_3_gone == false` | 0.3 | 1 |
| `level_jungle/three_headed_karim/encounter` | `dialogs/three_headed_karim/encounter.tres` | true | All 3 bodies gone AND `three_headed_karim_paid == false` | 0.2 | 6 |

*`brown_karim/spooky` is effectively one-shot because the NPC vanishes permanently and is never recreated.

---

## Quest State Key Registry

All keys live in `ProgressData.quest_states` (Dictionary), persisted to `progress.cfg` under `[quests]`.
All read via `ProgressData.get_quest(key)`, all set via `ProgressData.set_quest(key)`.
`set_quest` auto-saves and emits `EventBus.quest_state_changed(key, value)`.

| Key | Type | Default | Set By | Read By | Meaning |
|-----|------|---------|--------|---------|---------|
| `quest_red_karim_accepted` | bool | false | RedKarimNPC — player selects Accept in ChoicePanel | RedKarimNPC._get_active_dialog_id(), GreenKarimNPC._get_active_dialog_id() | Player agreed to help Red Karim silence Green Karim |
| `quest_green_karim_confronted` | bool | false | GreenKarimNPC — `green_karim/confronted` dialog ends | RedKarimNPC._get_active_dialog_id(), GreenKarimNPC._get_active_dialog_id() | Player has spoken to Green Karim about the complaint |
| `quest_red_karim_complete` | bool | false | RedKarimNPC — `red_karim/complete` dialog ends | RedKarimNPC._get_active_dialog_id(), GreenKarimNPC._get_active_dialog_id() | Quest fully resolved, Dildo reward given |
| `brown_karim_vanished` | bool | false | BrownKarimNPC._spooky_vanish() | BrownKarimNPC._ready() | Brown Karim has permanently left the world |
| `quest_purple_karim_active` | bool | false | PurpleKarimNPC — `purple_karim/intro` dialog ends (auto-accept) | PurpleKarimNPC._get_active_dialog_id(), QuestLogScene | Player accepted Purple Karim's debt delivery quest |
| `hydra_body_1_gone` | bool | false | HydraBodyNPC (body 1) — after `hydra_body_1/dialog` ends | JungleLevelController._update_npc_visibility(), HydraBodyNPC._ready() | Hydra Body 1 has faded and been removed |
| `hydra_body_2_gone` | bool | false | HydraBodyNPC (body 2) — after `hydra_body_2/dialog` ends | JungleLevelController._update_npc_visibility(), HydraBodyNPC._ready() | Hydra Body 2 has faded and been removed |
| `hydra_body_3_gone` | bool | false | HydraBodyNPC (body 3) — after `hydra_body_3/dialog` ends | JungleLevelController._update_npc_visibility(), HydraBodyNPC._ready() | Hydra Body 3 has faded and been removed |
| `three_headed_karim_paid` | bool | false | ThreeHeadedKarimNPC — after `three_headed_karim/encounter` dialog ends | PurpleKarimNPC._get_active_dialog_id(), ThreeHeadedKarimNPC._ready(), JungleLevelController._update_npc_visibility() | Payment delivered to Three-Headed Karim; player should return to Purple Karim |
| `quest_purple_karim_complete` | bool | false | PurpleKarimNPC — `purple_karim/complete` dialog ends | PurpleKarimNPC._get_active_dialog_id(), QuestLogScene | Quest fully resolved, Vibrator reward given |

---

## How to Add a New Quest

1. **NPC Registry** — add entry above with: script, scene placement, x position, voice_pitch, role, dialog logic
2. **Dialog files** — create `.tres` files at `levels/{level_id}/dialogs/{npc_name}/{moment}.tres`
3. **Dialog Registry** — add rows for each new dialog ID (condition, one_shot, voice_pitch, line count)
4. **Quest Registry** — add new quest section with full step table, preconditions, reward
5. **State Key Registry** — add rows for each new key (who sets it, who reads it, what it means)
6. **NPC script** — create `npcs/{NpcName}.gd` extending NPC.gd or WanderingNPC.gd; implement `_get_active_dialog_id()` and `_on_dialog_ended()`
7. **Place NPC** — add to the appropriate `.tscn` with correct x position, wander bounds, voice_pitch
8. **Update quest-flowchart.md** — extend the Mermaid diagram to include the new flow

## How to Add a Shop Item

1. **ItemDefs.gd** — add entry to `SHOP` array: `{id, name, desc, cost}`
2. **Shop Registry** above — add row with planned game effect
3. **Implement effect** — in Player.gd or HUD.gd, check `ProgressData.is_purchased("item_id")` on load
4. If item unlocks a gate: add ProgressionGate to the level with matching gate_id, wire the EventBus signal on purchase

---

## Dependency Graph (Plain Text)

```
ENTER TOWN
  ├── Talk to BLACK KARIM  →  flavor dialog (no state change, repeatable)
  │
  ├── Talk to BROWN KARIM  →  spooky dialog
  │     └── brown_karim_vanished = true  →  NPC permanently gone
  │
  ├── Enter HOUSE 1
  │     └── Talk to BLUE KARIM  →  greet dialog  →  ShopPanel
  │           ├── Buy extra_heart    →  purchased_items += "extra_heart"  (effect: TBD)
  │           ├── Buy speed_charm    →  purchased_items += "speed_charm"  (effect: TBD)
  │           └── Buy town_key       →  purchased_items += "town_key"     (effect: unlock east gate, TBD)
  │
  └── Enter HOUSE 2
        ├── Talk to RED KARIM (default)
        │     └── intro dialog  →  ChoicePanel
        │           ├── Decline  →  decline dialog  →  loop back to intro on next talk
        │           └── Accept   →  accept dialog
        │                 └── quest_red_karim_accepted = true
        │                       │
        │                       ├── RED KARIM now plays: waiting (repeatable nag)
        │                       │
        │                       └── Talk to GREEN KARIM  →  confronted dialog
        │                             └── quest_green_karim_confronted = true
        │                                   │
        │                                   └── Talk to RED KARIM  →  complete dialog
        │                                         └── quest_red_karim_complete = true
        │                                               └── ItemAcquiredPopup("Dildo")
        │                                                     │
        │                                                     ├── RED KARIM forever: done
        │                                                     └── GREEN KARIM forever: reformed
        │
        └── Talk to GREEN KARIM (default, no quest active)  →  flavor/rant dialog (repeatable)
  │
  ├── Talk to PURPLE KARIM  →  intro dialog (auto-accept)
  │     └── quest_purple_karim_active = true
  │           │
  │           ├── PURPLE KARIM now plays: waiting (repeatable)
  │           │
  │           └── Enter JUNGLE PORTAL (east end of town, x~1950)
  │                 └── JUNGLE VILLAGE
  │                       ├── Enter JUNGLE HOUSE INTERIOR
  │                       │     └── Talk to HYDRA BODY 1  →  "…"  →  fades
  │                       │           └── hydra_body_1_gone = true
  │                       │
  │                       ├── Talk to HYDRA BODY 2  →  "…"  →  fades
  │                       │     └── hydra_body_2_gone = true
  │                       │
  │                       ├── Talk to HYDRA BODY 3  →  "…"  →  fades
  │                       │     └── hydra_body_3_gone = true
  │                       │
  │                       └── [all 3 bodies gone] → THREE-HEADED KARIM appears
  │                             └── Talk to THREE-HEADED KARIM  →  encounter dialog (6 lines)
  │                                   └── fades away
  │                                         └── three_headed_karim_paid = true
  │                                               │
  │                                               └── Return to TOWN via portal
  │                                                     └── Talk to PURPLE KARIM  →  complete dialog
  │                                                           └── quest_purple_karim_complete = true
  │                                                                 └── ItemAcquiredPopup("Vibrator")
  │                                                                       └── PURPLE KARIM forever: done
  │
  └── JUNGLE PORTAL  →  accessible even before talking to Purple Karim (bodies still there, wandering)
```
