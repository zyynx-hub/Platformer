# Quest & NPC Registry

> **Note (Session 49+):** Quest logic lives in `godot_port/data/quests/*.json`.
> For new quests: write the JSON file first, then update this registry to match.
>
> Auto-generated docs (regenerate from JSON, do not edit by hand):
> - `docs/storyline.md` — narrative step-by-step flow: `python tools/quest_tool.py --story --write`
> - `docs/quest-flowchart.md` — Mermaid state graph: `python tools/quest_tool.py --graph --write`
> - `docs/quest-report.html` — interactive HTML report: `python tools/quest_tool.py --html --write`
> - Validation: `python tools/quest_tool.py --validate`
>
> This file (quest-registry.md) is the **world atlas**: NPC positions, scene placements, shop items, visual properties.
> For quest flow and dialog logic, see `docs/storyline.md` (auto-generated).

Canonical source of truth for all quests, NPCs, dialog conditions, and state keys.
**Always update this file when adding new NPCs, quests, or dialog.**

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
| Jungle House Interior | levels/level_jungle/interiors/JungleHouseInterior.tscn | Hydra Body 1 stands inside. Orange Karim on right side. |

### Jungle Exterior — Key Positions

| Node | Type | x (approx) | Description |
|------|------|-------------|-------------|
| PortalBack | Portal (Area2D) | ~50 | Returns to level_town (orange color) |
| Door1 | Door (Area2D) | ~300 | Enters JungleHouseInterior |
| House1 | House prop | ~350 | Visual house prop |
| HydraBody2 | HydraBodyNPC | 550–950 (wander) | Fades after interaction, sets hydra_body_2_gone |
| HydraBody3 | HydraBodyNPC | 1000–1400 (wander) | Fades after interaction, sets hydra_body_3_gone |
| ThreeHeadedKarim | ThreeHeadedKarimNPC | 650–1150 (wander) | Hidden until all 3 bodies gone, fades after encounter |
| MysticalPortal | Portal (Area2D) | ~1500 | Leads to level_mystical (white-gold color). Hidden until all 3 quests complete. |

---

### World: level_mystical (MysticalLevel.tscn)
Flat ground, 800px wide. Permanent cosmic sky (mystical_sky.gdshader). No day/night cycle. Boss arena markers for Exodia fight (Step 5).

| Location | Scene File | Notes |
|----------|------------|-------|
| Mystical Realm | MysticalLevel.tscn | Open area. Stone pedestal at center. Cloud Karim behind pedestal. |

### Mystical Realm — Key Positions

| Node | Type | x (approx) | Description |
|------|------|-------------|-------------|
| PortalBack | Portal (Area2D) | ~150 | Returns to level_jungle (white-gold color) |
| SpawnPoint | Marker2D | ~200 | Player spawn / portal arrival |
| StonePedestal | Node2D | ~400 | Center. PedestalBase + PedestalTop + 3 hidden Slot ColorRects (Butt Plug, Dildo, Vibrator) |
| CloudKarim | CloudKarimNPC | ~420 | Quest giver — Exodia quest. Translucent white-blue. Permanently gone after boss. |
| BossArena | Node2D | — | CameraLeftLimit (x=50), CameraRightLimit (x=750) |

### House 1 Interior — Key Positions

| Node | Type | x | Description |
|------|------|---|-------------|
| Blue Karim | BlueKarimNPC | ~120 | Shopkeeper → ShopPanel |
| Exit Door | Door (Area2D) | — | Returns to Town Street |

### Jungle House Interior — Key Positions

| Node | Type | x | Description |
|------|------|---|-------------|
| Orange Karim | OrangeKarimNPC | ~150 | Quest giver — De Butt Plug Quest |
| Hydra Body 1 | HydraBodyNPC | ~120 | Fades after interaction |
| Exit Door | Door (Area2D) | ~10 | Returns to Jungle Exterior |

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
| Role | Quest giver — initiates Purple Karim's Debt (ChoicePanel accept/decline) |
| Modulate | Color(0.5, 0.1, 0.8, 1) — purple tint |

**Dialog selection logic (via QuestManager + quest_purple_karim.json):**
```
quest_exodia_complete == true         → level_town/purple_karim/post_exodia (forever after boss)
quest_purple_karim_complete == true   → level_town/purple_karim/done       (forever after)
three_headed_karim_paid == true       → level_town/purple_karim/complete   (triggers reward)
quest_purple_karim_active == true     → level_town/purple_karim/waiting    (repeatable nag)
default                               → level_town/purple_karim/intro      (quest entry point)
```

**On dialog end:**
- `purple_karim/intro` ends → 0.5s delay → ChoicePanel("Wil je zijn schuld betalen?", ["Ja, ik doe het", "Nee, geen tijd"])
  - Accept (0): sets `quest_purple_karim_active = true` + plays `purple_karim/accept`
  - Decline (1): plays `purple_karim/decline` (quest not set; intro plays again next visit)
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

**Dialog selection logic (via QuestManager + quest_red_karim.json):**
```
quest_exodia_complete == true                                      → green_karim/post_exodia     (forever after boss)
quest_red_karim_complete == true AND quest_orange_karim_complete == true → green_karim/reformed_plus  (with Orange Karim mention)
quest_red_karim_complete == true                                   → green_karim/reformed         (without extra line)
quest_red_karim_accepted == true
  AND quest_green_karim_confronted == false                        → green_karim/confronted       (triggers step 4)
default                                                            → green_karim/default
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

**Dialog selection logic (via QuestManager + quest_red_karim.json):**
```
quest_exodia_complete == true         → red_karim/post_exodia  (forever after boss)
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

### Orange Karim
| Property | Value |
|----------|-------|
| Script | OrangeKarimNPC.gd (extends NPC) |
| Scene placement | JungleHouseInterior.tscn, x ~150 |
| voice_pitch | 1.1 (energetic, tech-bro) |
| Modulate | Color(1.0, 0.5, 0.0, 1) — orange tint |
| Role | Quest giver — De Butt Plug Quest |
| Quest dependency | Requires `quest_red_karim_complete` to offer quest |

**Dialog selection logic (OrangeKarimNPC._get_active_dialog_id — manual):**
```
quest_exodia_complete == true            → orange_karim/post_exodia    (forever after boss)
quest_orange_karim_complete == true      → orange_karim/done           (post-quest flavor)
quest_orange_karim_active == true
  AND player has rocket_boots equipped   → orange_karim/complete       (turn-in, one_shot)
quest_orange_karim_active == true        → orange_karim/waiting        (repeatable nag)
quest_red_karim_complete == true         → orange_karim/intro          (quest entry point)
default                                  → orange_karim/not_ready      (pre-quest flavor)
```

**On dialog end:**
- `orange_karim/intro` ends → sets `quest_orange_karim_active = true`
- `orange_karim/complete` ends → sets `quest_orange_karim_complete = true` + 0.5s delay → ItemAcquiredPopup("Butt Plug")

**Note:** Manual dialog selection (like BlueKarimNPC) because it needs to check `Player._equipped_item_id == "rocket_boots"` which JSON `requires` cannot handle.

### Cloud Karim (Wolk der Karim)
| Property | Value |
|----------|-------|
| Script | CloudKarimNPC.gd (extends NPC) |
| Scene placement | MysticalLevel.tscn, x ~420 (behind stone pedestal) |
| voice_pitch | 0.15 (extremely deep — Mongolian throat singing) |
| Modulate | Color(0.8, 0.8, 1.0, 0.7) — translucent white-blue |
| Role | Quest giver — The Grand Quest of Exodia Karim |
| Visibility | Permanently gone after `quest_exodia_complete` (queue_free in _ready) |
| Quest dependency | Requires all 3 quest complete keys (portal access already gates this) |

**Dialog selection logic (CloudKarimNPC._get_active_dialog_id — manual):**
```
quest_exodia_complete == true           → (NPC gone — queue_free in _ready)
all 3 pedestal keys == true             → cloud_karim/all_placed     (triggers boss cutscene)
quest_exodia_active == true
  AND player has unplaced items         → cloud_karim/item_placed    (auto-places item)
quest_exodia_active == true             → cloud_karim/tip_menu       (tips ChoicePanel)
default                                 → cloud_karim/intro          (first meeting)
```

**On dialog end:**
- `cloud_karim/intro` ends → sets `quest_exodia_active = true`
- `cloud_karim/item_placed` ends → places first available item on pedestal (sets `pedestal_X` key)
- `cloud_karim/tip_menu` ends → ChoicePanel with unplaced items, selection plays tip dialog
- `cloud_karim/all_placed` ends → (Step 4: pre-boss cutscene trigger)

**Pedestal interaction:**
- Items auto-place when player interacts with Cloud Karim while holding unplaced quest rewards
- Quest completion keys (`quest_red_karim_complete` etc.) serve as "has item" proxy
- Pedestal keys (`pedestal_dildo`, `pedestal_vibrator`, `pedestal_butt_plug`) track placement
- MysticalLevelController updates slot visuals on `quest_state_changed`

**Tip ChoicePanel:**
- Only shows items not yet placed on pedestal
- Each tip hints at the quest needed to obtain the item
- Dildo → Red Karim quest, Vibrator → Purple Karim quest, Butt Plug → Orange Karim quest

**Note:** Manual dialog selection because it handles pedestal state checks, dynamic ChoicePanel filtering, and boss cutscene trigger. Too complex for JSON actions alone.

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
**Accept**: ChoicePanel — "Wil je zijn schuld betalen?" (accept/decline)

#### Step-by-Step Flow

| Step | Actor | Location | Precondition | Player Action | System Action | State Changed |
|------|-------|----------|--------------|---------------|---------------|---------------|
| 1 | Purple Karim | Town Street | `quest_purple_karim_active == false` | Talk to Purple Karim | Plays `purple_karim/intro` (10 lines) | — |
| 1b | — | — | After intro ends | — | ChoicePanel shown ("Wil je zijn schuld betalen?") | — |
| 1c (accept) | — | — | Player chooses "Ja, ik doe het" | — | Sets flag + plays `purple_karim/accept` (2 lines) | `quest_purple_karim_active = true` |
| 1c (decline) | — | — | Player chooses "Nee, geen tijd" | — | Plays `purple_karim/decline` (2 lines); intro plays again next visit | — |
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

### Quest: De Butt Plug Quest
**Level**: level_jungle (Jungle House Interior)
**Giver**: Orange Karim (Jungle House Interior, x ~150)
**Prerequisite**: `quest_red_karim_complete == true`
**Reward**: Item popup — "Butt Plug" (no sprite, `null` passed to ItemAcquiredPopup.setup())
**Repeatable**: No — one-time resolution

#### Step-by-Step Flow

| Step | Actor | Location | Precondition | Player Action | System Action | State Changed |
|------|-------|----------|--------------|---------------|---------------|---------------|
| 1 | Orange Karim | Jungle House | `quest_red_karim_complete == true` AND `quest_orange_karim_active == false` | Talk to Orange Karim | Plays `orange_karim/intro` (4 lines) | `quest_orange_karim_active = true` |
| 2 | Orange Karim | Jungle House | `quest_orange_karim_active == true` AND no rocket boots | Talk to Orange Karim | Plays `orange_karim/waiting` (2 lines, repeatable) | — |
| 3 | Player | Level 1 | — | Pick up Rocket Boots | `EventBus.item_picked_up` → Player equips boots | — |
| 4 | Orange Karim | Jungle House | `quest_orange_karim_active == true` AND rocket boots equipped | Talk to Orange Karim | Plays `orange_karim/complete` (3 lines, one_shot) | `quest_orange_karim_complete = true` |
| 4b | — | — | After complete dialog ends | — | ItemAcquiredPopup("Butt Plug") shown (0.5s delay) | — |
| 5 | Orange Karim | Jungle House | `quest_orange_karim_complete == true` | Talk to Orange Karim | Plays `orange_karim/done` (4 lines, repeatable) | — |
| 5b | Green Karim | Town House 2 | `quest_red_karim_complete AND quest_orange_karim_complete` | Talk to Green Karim | Plays `green_karim/reformed_plus` (extra line about Orange) | — |

#### Pre-Quest State
If `quest_red_karim_complete == false`: Orange Karim plays `orange_karim/not_ready` (2 lines, repeatable flavor).

#### Rocket Boots Check
The `complete` dialog requires the player to have `_equipped_item_id == "rocket_boots"` (runtime check in OrangeKarimNPC.gd). The player must pick up Rocket Boots in Level 1 and return to the Jungle House with them still equipped.

---

### Quest: The Grand Quest of Exodia Karim
**Level**: level_mystical
**Giver**: Cloud Karim (Mystical Realm, x ~420)
**Prerequisites**: `quest_red_karim_complete`, `quest_purple_karim_complete`, `quest_orange_karim_complete` (all 3 quest rewards obtained)
**Reward**: Item popup — "Master of Pleasure" (no sprite, `null` passed to ItemAcquiredPopup.setup())
**Repeatable**: No — one-time resolution

#### Step-by-Step Flow

| Step | Actor | Location | Precondition | Player Action | System Action | State Changed |
|------|-------|----------|--------------|---------------|---------------|---------------|
| 1 | Cloud Karim | Mystical Realm | First visit (quest not active) | Talk to Cloud Karim | Plays `cloud_karim/intro` (8 lines, one_shot) | `quest_exodia_active = true` |
| 2 | Cloud Karim | Mystical Realm | `quest_exodia_active == true` AND no items to place | Talk to Cloud Karim | Plays `cloud_karim/tip_menu` (2 lines) → ChoicePanel | — |
| 2b | — | — | ChoicePanel shown | Select item name | Plays corresponding tip dialog (tip_dildo/vibrator/butt_plug) | — |
| 3 | Cloud Karim | Mystical Realm | `quest_exodia_active == true` AND player has unplaced item | Talk to Cloud Karim | Plays `cloud_karim/item_placed` (1 line) → auto-places item | `pedestal_X = true` |
| 4 | — | Mystical Realm | All 3 pedestal keys == true | Talk to Cloud Karim | Plays `cloud_karim/all_placed` (3 lines, one_shot) | — |
| 5 | MysticalLevelController | Mystical Realm | After all_placed dialog | — | Pre-boss cutscene: shake, Purple walks in (`purple_arrives`), others walk in (`others_arrive`), absorption, white flash, Exodia forms (`exodia_forms`), assembly animation, boss fight starts | — |
| 6 | ExodiaKarimBoss | Mystical Realm | Boss fight active | Stomp Exodia (3 phases, 5 HP total) | Phase taunts between phases, 3-phase boss fight (sweep/dive/wave), stomp-to-kill | `exodia_boss_defeated = true` |
| 7 | MysticalLevelController | Mystical Realm | After boss defeated | — | Post-boss cutscene: sad music + rain → defeat monologue (11 lines) → explosion → 4 Karims materialize → weather clears → victory reunion (9 lines) → Karims leave → ItemAcquiredPopup("Master of Pleasure") | `quest_exodia_complete = true` |

#### Pedestal Items

| Pedestal Key | Item | Source Quest Key | Slot Visual |
|-------------|------|-----------------|-------------|
| `pedestal_butt_plug` | Butt Plug | `quest_orange_karim_complete` | Slot1 — orange ColorRect |
| `pedestal_dildo` | Dildo | `quest_red_karim_complete` | Slot2 — red ColorRect |
| `pedestal_vibrator` | Vibrator | `quest_purple_karim_complete` | Slot3 — purple ColorRect |

#### Implementation Notes
- All steps (1-7) fully implemented (Sessions 60-79). Pre-boss cutscene, 3-phase boss fight, post-boss cutscene, victory reward, post-quest flavor dialog for all 4 Karims.
- Cloud Karim is permanently removed (`queue_free()`) after `quest_exodia_complete`.
- Pedestal slot visuals are managed by MysticalLevelController via `quest_state_changed` signal.
- Post-quest dialog: Red/Purple Karims use JSON `dialog_selection` with `quest_exodia_complete` check (first entry, highest priority). Green/Orange Karims handle it in GDScript.

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
| `level_town/purple_karim/accept` | `dialogs/purple_karim/accept.tres` | true | Player accepts via ChoicePanel | 0.95 | 2 |
| `level_town/purple_karim/decline` | `dialogs/purple_karim/decline.tres` | false | Player declines via ChoicePanel | 0.95 | 2 |
| `level_town/purple_karim/waiting` | `dialogs/purple_karim/waiting.tres` | false | `quest_purple_karim_active AND NOT three_headed_karim_paid` | 0.95 | 2 |
| `level_town/purple_karim/complete` | `dialogs/purple_karim/complete.tres` | true | `three_headed_karim_paid AND NOT quest_purple_karim_complete` | 0.95 | 4 |
| `level_town/purple_karim/done` | `dialogs/purple_karim/done.tres` | false | `quest_purple_karim_complete == true` | 0.95 | 1 |
| `level_jungle/hydra_body_1/dialog` | `dialogs/hydra_body_1/dialog.tres` | true | `hydra_body_1_gone == false` | 0.3 | 1 |
| `level_jungle/hydra_body_2/dialog` | `dialogs/hydra_body_2/dialog.tres` | true | `hydra_body_2_gone == false` | 0.3 | 1 |
| `level_jungle/hydra_body_3/dialog` | `dialogs/hydra_body_3/dialog.tres` | true | `hydra_body_3_gone == false` | 0.3 | 1 |
| `level_jungle/three_headed_karim/encounter` | `dialogs/three_headed_karim/encounter.tres` | true | All 3 bodies gone AND `three_headed_karim_paid == false` | 0.2 | 6 |
| `level_jungle/orange_karim/not_ready` | `dialogs/orange_karim/not_ready.tres` | false | `quest_red_karim_complete == false` | 1.1 | 2 |
| `level_jungle/orange_karim/intro` | `dialogs/orange_karim/intro.tres` | false | `quest_red_karim_complete == true` AND quest not active | 1.1 | 4 |
| `level_jungle/orange_karim/waiting` | `dialogs/orange_karim/waiting.tres` | false | `quest_orange_karim_active` AND no rocket boots | 1.1 | 2 |
| `level_jungle/orange_karim/complete` | `dialogs/orange_karim/complete.tres` | true | `quest_orange_karim_active` AND rocket boots equipped | 1.1 | 3 |
| `level_jungle/orange_karim/done` | `dialogs/orange_karim/done.tres` | false | `quest_orange_karim_complete == true` | 1.1 | 4 |
| `level_jungle/orange_karim/post_exodia` | `dialogs/orange_karim/post_exodia.tres` | false | `quest_exodia_complete == true` | 1.1 | 3 |
| `level_town/green_karim/reformed_plus` | `dialogs/green_karim/reformed_plus.tres` | false | `quest_red_karim_complete AND quest_orange_karim_complete` | 0.8 | 2 |
| `level_town/green_karim/post_exodia` | `dialogs/green_karim/post_exodia.tres` | false | `quest_exodia_complete == true` | 0.8 | 2 |
| `level_mystical/cloud_karim/intro` | `dialogs/cloud_karim/intro.tres` | true | First visit (quest not active) | 0.15 | 8 |
| `level_mystical/cloud_karim/tip_menu` | `dialogs/cloud_karim/tip_menu.tres` | false | `quest_exodia_active` AND no items to place | 0.15 | 2 |
| `level_mystical/cloud_karim/tip_dildo` | `dialogs/cloud_karim/tip_dildo.tres` | false | Selected from ChoicePanel | 0.15 | 2 |
| `level_mystical/cloud_karim/tip_vibrator` | `dialogs/cloud_karim/tip_vibrator.tres` | false | Selected from ChoicePanel | 0.15 | 3 |
| `level_mystical/cloud_karim/tip_butt_plug` | `dialogs/cloud_karim/tip_butt_plug.tres` | false | Selected from ChoicePanel | 0.15 | 4 |
| `level_mystical/cloud_karim/item_placed` | `dialogs/cloud_karim/item_placed.tres` | false | `quest_exodia_active` AND player has unplaced item | 0.15 | 1 |
| `level_mystical/cloud_karim/all_placed` | `dialogs/cloud_karim/all_placed.tres` | true | All 3 pedestal keys == true | 0.15 | 3 |
| `level_mystical/pre_boss/purple_arrives` | `dialogs/pre_boss/purple_arrives.tres` | true | Pre-boss cutscene (Purple Karim walks in) | 0.95 | 2 |
| `level_mystical/pre_boss/others_arrive` | `dialogs/pre_boss/others_arrive.tres` | true | Pre-boss cutscene (Green/Red/Orange arrive) | multi | 4 |
| `level_mystical/pre_boss/exodia_forms` | `dialogs/pre_boss/exodia_forms.tres` | true | Pre-boss cutscene (Exodia reveals) | 0.3 | 3 |
| `level_mystical/exodia_karim/phase1_taunt` | `dialogs/exodia_karim/phase1_taunt.tres` | true | Boss Phase 1 taunt | 0.4 | 2 |
| `level_mystical/exodia_karim/phase2_taunt` | `dialogs/exodia_karim/phase2_taunt.tres` | true | Boss Phase 2 taunt | 0.4 | 2 |
| `level_mystical/exodia_karim/phase3_taunt` | `dialogs/exodia_karim/phase3_taunt.tres` | true | Boss Phase 3 taunt | 0.4 | 2 |
| `level_mystical/exodia_karim/defeat` | `dialogs/exodia_karim/defeat.tres` | true | Boss defeat monologue (rain) | 0.4 | 11 |
| `level_mystical/victory/reunion` | `dialogs/victory/reunion.tres` | true | Victory — all 4 Karims freed | multi | 9 |
| `level_town/red_karim/post_exodia` | `dialogs/red_karim/post_exodia.tres` | false | `quest_exodia_complete == true` | 0.9 | 2 |
| `level_town/purple_karim/post_exodia` | `dialogs/purple_karim/post_exodia.tres` | false | `quest_exodia_complete == true` | 0.95 | 2 |

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
| `quest_purple_karim_active` | bool | false | PurpleKarimNPC — ChoicePanel accept after `purple_karim/intro` ends | PurpleKarimNPC._get_active_dialog_id(), QuestLogScene | Player accepted Purple Karim's debt delivery quest |
| `hydra_body_1_gone` | bool | false | HydraBodyNPC (body 1) — after `hydra_body_1/dialog` ends | JungleLevelController._update_npc_visibility(), HydraBodyNPC._ready() | Hydra Body 1 has faded and been removed |
| `hydra_body_2_gone` | bool | false | HydraBodyNPC (body 2) — after `hydra_body_2/dialog` ends | JungleLevelController._update_npc_visibility(), HydraBodyNPC._ready() | Hydra Body 2 has faded and been removed |
| `hydra_body_3_gone` | bool | false | HydraBodyNPC (body 3) — after `hydra_body_3/dialog` ends | JungleLevelController._update_npc_visibility(), HydraBodyNPC._ready() | Hydra Body 3 has faded and been removed |
| `three_headed_karim_paid` | bool | false | ThreeHeadedKarimNPC — after `three_headed_karim/encounter` dialog ends | PurpleKarimNPC._get_active_dialog_id(), ThreeHeadedKarimNPC._ready(), JungleLevelController._update_npc_visibility() | Payment delivered to Three-Headed Karim; player should return to Purple Karim |
| `quest_purple_karim_complete` | bool | false | PurpleKarimNPC — `purple_karim/complete` dialog ends | PurpleKarimNPC._get_active_dialog_id(), QuestLogScene | Quest fully resolved, Vibrator reward given |
| `quest_orange_karim_active` | bool | false | OrangeKarimNPC — `orange_karim/intro` dialog ends | OrangeKarimNPC._get_active_dialog_id() | Player accepted Orange Karim's tech challenge |
| `quest_orange_karim_complete` | bool | false | OrangeKarimNPC — `orange_karim/complete` dialog ends | OrangeKarimNPC._get_active_dialog_id(), GreenKarimNPC (reformed_plus dialog) | Butt Plug reward given |
| `quest_exodia_active` | bool | false | CloudKarimNPC — `cloud_karim/intro` dialog ends | CloudKarimNPC._get_active_dialog_id(), MysticalLevelController | Player met Cloud Karim, quest begun |
| `pedestal_butt_plug` | bool | false | CloudKarimNPC — auto on interact while item obtained | MysticalLevelController (slot visuals), CloudKarimNPC (tip filtering) | Butt Plug placed on pedestal |
| `pedestal_dildo` | bool | false | CloudKarimNPC — same | MysticalLevelController, CloudKarimNPC | Dildo placed on pedestal |
| `pedestal_vibrator` | bool | false | CloudKarimNPC — same | MysticalLevelController, CloudKarimNPC | Vibrator placed on pedestal |
| `exodia_boss_defeated` | bool | false | MysticalLevelController — after boss death cutscene | MysticalLevelController | Exodia Karim defeated in combat |
| `quest_exodia_complete` | bool | false | MysticalLevelController — after victory dialog + reward | All 4 Karims (post-exodia dialog), CloudKarimNPC | Full Exodia questline done, weapon rewarded |

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
  ├── Talk to PURPLE KARIM  →  intro dialog  →  ChoicePanel("Wil je zijn schuld betalen?")
  │     ├── [Accept]  →  accept dialog  →  quest_purple_karim_active = true
  │     └── [Decline] →  decline dialog (repeatable; intro plays again next visit)
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
        │
        └── JUNGLE HOUSE INTERIOR
              └── Talk to ORANGE KARIM (requires quest_red_karim_complete)
                    └── intro dialog → quest_orange_karim_active = true
                          │
                          ├── ORANGE KARIM now plays: waiting (repeatable)
                          │
                          └── Pick up ROCKET BOOTS in Level 1 → return with them equipped
                                └── Talk to ORANGE KARIM → complete dialog
                                      └── quest_orange_karim_complete = true
                                            └── ItemAcquiredPopup("Butt Plug")
                                                  │
                                                  ├── ORANGE KARIM forever: done (mentions Green Karim)
                                                  └── GREEN KARIM now plays: reformed_plus (extra line about Orange)
  │
  └── [all 3 quests complete: red + purple + orange]
        │
        └── MYSTICAL PORTAL appears in Jungle (x~1500, white-gold)
              │
              └── MYSTICAL REALM
                    ├── Talk to CLOUD KARIM  →  intro dialog (8 lines, one_shot)
                    │     └── quest_exodia_active = true
                    │           │
                    │           ├── CLOUD KARIM: tip_menu → ChoicePanel (unplaced items)
                    │           │     ├── "Dildo" → tip_dildo (hints at Red Karim quest)
                    │           │     ├── "Vibrator" → tip_vibrator (hints at Purple Karim quest)
                    │           │     └── "Butt Plug" → tip_butt_plug (hints at Orange Karim quest)
                    │           │
                    │           └── [player has unplaced item] → CLOUD KARIM: item_placed
                    │                 └── pedestal_X = true (slot lights up)
                    │
                    └── [all 3 pedestal items placed]
                          └── Talk to CLOUD KARIM → all_placed dialog (3 lines, one_shot)
                                │
                                └── PRE-BOSS CUTSCENE
                                      ├── Screen shake, sad music, Purple walks in (purple_arrives)
                                      ├── Green/Red/Orange walk in (others_arrive)
                                      ├── White flash absorption → Cloud Karim + pedestal removed
                                      └── Exodia forms (exodia_forms) → assembly animation → BOSS FIGHT
                                            │
                                            └── BOSS FIGHT (3 phases, 5 HP, stomp-to-kill)
                                                  ├── Phase 1: horizontal sweep (L→R→L)
                                                  ├── Phase 2: pass-through dive cycle
                                                  └── Phase 3: sinusoidal wave sweeps
                                                        │
                                                        └── [all HP depleted]
                                                              └── exodia_boss_defeated = true
                                                                    │
                                                                    └── POST-BOSS CUTSCENE
                                                                          ├── Aerith's Theme + rain starts
                                                                          ├── Defeat monologue (11 lines, exodia_karim/defeat)
                                                                          ├── Explosion + white flash → boss removed
                                                                          ├── 4 Karims materialize from particles
                                                                          ├── Weather clears (rain → clear)
                                                                          ├── Victory reunion (9 lines, victory/reunion)
                                                                          ├── 4 Karims walk off-screen
                                                                          └── ItemAcquiredPopup("Master of Pleasure")
                                                                                └── quest_exodia_complete = true
                                                                                      │
                                                                                      ├── CLOUD KARIM permanently gone (queue_free)
                                                                                      ├── RED KARIM forever: post_exodia
                                                                                      ├── PURPLE KARIM forever: post_exodia
                                                                                      ├── GREEN KARIM forever: post_exodia
                                                                                      └── ORANGE KARIM forever: post_exodia
```
