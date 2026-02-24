# The Grand Quest of Exodia Karim — Integration Plan

> Source: `docs/THE GRAND QUEST OF EXODIA KARIM (1).odt` (translated and structured below)
> All dialog is in Dutch (consistent with existing quests).

---

## Table of Contents

1. [Quest Overview](#1-quest-overview)
2. [Quest Chain Structure](#2-quest-chain-structure)
3. [New Level: The Mystical Realm](#3-new-level-the-mystical-realm)
4. [New NPCs](#4-new-npcs)
5. [Dialog Files](#5-dialog-files)
6. [Quest JSON Files](#6-quest-json-files)
7. [State Keys](#7-state-keys)
8. [Item Definitions](#8-item-definitions)
9. [Green Karim Dialog Modification](#9-green-karim-dialog-modification)
10. [Pedestal Interaction System](#10-pedestal-interaction-system)
11. [Exodia Karim Boss Fight](#11-exodia-karim-boss-fight)
12. [Pre-Boss Cutscene](#12-pre-boss-cutscene)
13. [Post-Boss Cutscene](#13-post-boss-cutscene)
14. [Post-Quest Flavor Dialog](#14-post-quest-flavor-dialog)
15. [File Manifest](#15-file-manifest)
16. [Implementation Order](#16-implementation-order)
17. [Risk Assessment](#17-risk-assessment)
18. [Testing Checklist](#18-testing-checklist)
19. [Dashboard & Auto-Generated Docs](#19-dashboard--auto-generated-docs)

---

## 1. Quest Overview

The Exodia Karim questline is the game's **endgame meta-quest**. It ties together all three existing quest reward items (Dildo, Vibrator, Butt Plug) into a final boss encounter. The questline has three acts:

| Act | Name | Location | Summary |
|-----|------|----------|---------|
| I | De Butt Plug Quest | Jungle House Interior | Orange Karim wants to see futuristic tech. Bring Rocket Boots (from Level 1). Reward: Butt Plug. |
| II | The Mystical Realm | level_mystical (new) | Cloud Karim needs 3 items on a stone pedestal. Collect all 3 quest rewards. |
| III | Exodia Karim | level_mystical (boss arena) | All 4 Karims absorbed into Exodia. 3-phase boss fight. Reward: Master of Pleasure weapon. |

**Prerequisites**: Red Karim's Complaint (Dildo) + Purple Karim's Debt (Vibrator) must be completable. Rocket Boots must be obtainable in Level 1 ("Awakening").

---

## 2. Quest Chain Structure

```
EXISTING QUESTS (prerequisites)
├── Red Karim's Complaint → reward: Dildo
├── Purple Karim's Debt   → reward: Vibrator
└── Level 1 "Awakening"   → pickup: Rocket Boots

NEW: ACT I — De Butt Plug Quest
├── Prerequisite: quest_red_karim_complete == true
├── Talk to Orange Karim (Jungle House Interior)
│     └── "Laat maar eens zien wat je kan!"
│     └── quest_orange_karim_active = true
├── Equip Rocket Boots (from Level 1 pickup)
├── Talk to Orange Karim again (with rocket boots equipped)
│     └── "Heilige kak! Zijn dat raketlaarzen?!"
│     └── quest_orange_karim_complete = true
│     └── ItemAcquiredPopup("Butt Plug")
└── Post-complete: Orange Karim mentions Green Karim
      └── Green Karim extra line: "...kankernerd dat het is..."

NEW: ACT II — The Mystical Realm
├── Prerequisite: all 3 items exist (Dildo, Vibrator, Butt Plug obtained)
├── Portal to level_mystical (from Jungle or Town — TBD)
├── Talk to Cloud Karim / Stone Pedestal
│     └── "...heb ik drie objecten nodig."
│     └── quest_exodia_active = true
├── Each visit: if player has uncollected item → auto-place on pedestal
│     ├── Has Butt Plug  → pedestal_butt_plug = true
│     ├── Has Dildo      → pedestal_dildo = true
│     └── Has Vibrator   → pedestal_vibrator = true
├── Cloud Karim tips (ChoicePanel: select item for hint)
│     ├── Dildo:    "groene en rode kleur conflict" → Red Karim quest
│     ├── Vibrator: "driekoppige entiteit + paars" → Purple Karim quest
│     └── Butt Plug: "eenzame man gekleurd in oranje" → Orange Karim quest
└── All 3 placed → triggers Act III

NEW: ACT III — Exodia Karim Boss Fight
├── Cutscene: Cloud speaks → Purple, Green, Red, Orange Karims arrive
├── All 4 absorbed by cloud → Hydra Karim revealed → Exodia Karim forms
├── 3-phase boss fight (see §11)
├── Defeat → sad rain cutscene + monologue
├── Exodia explodes → 4 Karims return
├── Victory dialog
├── quest_exodia_complete = true
├── Reward: Master of Pleasure (weapon)
└── All Karims return to original positions with new flavor dialog
```

---

## 3. New Level: The Mystical Realm

### 3a. Level Definition

Add to `data/LevelDefs.gd`:

```gdscript
{
    "id": "level_mystical",
    "title": "The Mystical Realm",
    "scene": "res://levels/level_mystical/MysticalLevel.tscn",
    "star_pos": Vector2(0.05, 0.78),  # below jungle on constellation map
    "connections": ["level_jungle"],
    "unlock_requires": "",
}
```

### 3b. Level Scene Structure

```
levels/level_mystical/
├── MysticalLevel.tscn          # Scene root (Node2D)
├── MysticalLevelController.gd  # Level controller script
├── dialogs/
│   └── cloud_karim/
│       ├── intro.tres           # "Gegroet. Ik ben de wolk der Karim..."
│       ├── tip_menu.tres        # "Welkom terug, makker..." → ChoicePanel
│       ├── tip_dildo.tres       # "Ah, het dynamische object..."
│       ├── tip_vibrator.tres    # "Duidelijk, het elektrische apparaat..."
│       ├── tip_butt_plug.tres   # "Het meest traditionale object..."
│       ├── item_placed.tres     # Reactie bij plaatsing
│       └── all_placed.tres      # "Het is je gelukt, je bent uitverkoren..." → boss cutscene
└── interiors/                   # (none needed — single open area)
```

### 3c. Scene Layout (MysticalLevel.tscn)

Scene-first construction — all nodes placed in .tscn:

```
MysticalLevel (Node2D)
├── MysticalLevelController.gd (script)
├── Background (ColorRect, mystical sky shader — purple/cosmic theme)
├── Ground (StaticBody2D + CollisionShape2D, flat ~800px wide)
├── GroundVisual (Sprite2D or ColorRect, stone/cloud texture)
├── StonePedestal (Node2D, positioned center)
│   ├── PedestalBase (Sprite2D — stone table sprite)
│   ├── Slot1 (Sprite2D — empty, becomes Butt Plug when placed)
│   ├── Slot2 (Sprite2D — empty, becomes Dildo when placed)
│   └── Slot3 (Sprite2D — empty, becomes Vibrator when placed)
├── CloudKarim (NPC instance, positioned behind pedestal)
├── PortalBack (Portal instance — returns to source level)
├── BossArena (Node2D — invisible bounds markers for boss fight)
│   ├── LeftWall (StaticBody2D)
│   ├── RightWall (StaticBody2D)
│   ├── CameraLeftLimit (Marker2D)
│   └── CameraRightLimit (Marker2D)
└── NightOverlay (CanvasLayer — cosmic/mystical atmosphere)
```

### 3d. Portal Access

**Option A (recommended):** Portal in Jungle level, east side (beyond ThreeHeadedKarim spawn area). Only visible/interactable after `quest_orange_karim_complete` AND `quest_purple_karim_complete` AND `quest_red_karim_complete` — i.e., all 3 items obtained.

**Option B:** Portal appears in Town after all 3 items.

The portal should use a unique color (white/gold — divine theme) and be conditionally visible via a new state key or direct ProgressData checks in the level controller.

### 3e. Music

A new ambient track for the mystical realm. If no custom music available, reuse `menu_bgm` at low pitch or create a placeholder. The sad music after the boss fight uses an external reference (YouTube link in source doc — will need a custom track or placeholder).

---

## 4. New NPCs

### 4a. Orange Karim

| Property | Value |
|----------|-------|
| Script | `OrangeKarimNPC.gd` (extends NPC — stands still, inside house) |
| Scene placement | `JungleHouseInterior.tscn`, x ~200 (right side, away from Hydra Body 1) |
| voice_pitch | 1.1 (energetic, tech-bro) |
| Modulate | `Color(1.0, 0.5, 0.0, 1)` — orange tint |
| Role | Quest giver — De Butt Plug Quest |
| Visibility | Always visible (independent of Hydra Body 1 state) |

**Dialog selection logic:**
```
quest_orange_karim_complete == true AND quest_exodia_complete == true
  → level_jungle/orange_karim/post_exodia       (forever after boss)
quest_orange_karim_complete == true
  → level_jungle/orange_karim/done               (post-quest flavor)
quest_orange_karim_active == true AND has_rocket_boots == true
  → level_jungle/orange_karim/complete           (turn-in, one_shot)
quest_orange_karim_active == true
  → level_jungle/orange_karim/waiting            (repeatable nag)
quest_red_karim_complete == true
  → level_jungle/orange_karim/intro              (quest entry point)
default (Red Karim quest not done)
  → level_jungle/orange_karim/not_ready          (pre-quest flavor)
```

**Special mechanic — Rocket Boots check:**
The `complete` dialog requires checking if the player has Rocket Boots equipped. This is read from `ProgressData` (the Rocket Boots pickup in Level 1 sets a key when collected). The dialog_selection `requires` in the JSON would need a new key like `has_rocket_boots` OR the NPC script handles this manually (like BlueKarimNPC handles the shop — keeps this NPC in the "intentionally manual" category).

**Recommendation:** Keep `OrangeKarimNPC.gd` manual (like BlueKarimNPC) since it needs to check `ProgressData.has_item("rocket_boots")` which the JSON `requires` system doesn't currently support (it only checks boolean quest keys). Add the quest JSON for documentation/QuestLog but have the NPC script handle dialog selection.

### 4b. Cloud Karim (Wolk der Karim)

| Property | Value |
|----------|-------|
| Script | `CloudKarimNPC.gd` (extends NPC — stationary) |
| Scene placement | `MysticalLevel.tscn`, behind stone pedestal |
| voice_pitch | 0.15 (extremely deep — Mongolian throat singing) |
| Modulate | `Color(0.8, 0.8, 1.0, 0.7)` — translucent white-blue |
| Visual | Cloud sprite (new pixel art needed — fluffy white cloud shape) |
| Role | Quest giver for Mystical Realm + boss fight trigger |
| **Secret** | **Hydra Karim (Three-Headed Karim from the Jungle) is hidden behind the Cloud.** When all 3 items are placed, the 4 Karims get absorbed by the Cloud, and Hydra Karim is revealed behind it. Hydra Karim + 4 absorbed Karims fuse into Exodia Karim. After the boss fight, both Cloud and Hydra Karim are permanently gone. |

**Dialog selection logic:**
```
quest_exodia_complete == true
  → (NPC gone — Cloud + Hydra Karim permanently removed after boss fight)
all 3 pedestal keys == true AND quest_exodia_complete == false
  → level_mystical/cloud_karim/all_placed         (triggers boss cutscene)
quest_exodia_active == true
  → level_mystical/cloud_karim/tip_menu           (tips + item placement)
default
  → level_mystical/cloud_karim/intro              (first meeting)
```

**Special mechanic — Pedestal interaction:**
When player interacts and has unplaced items, items auto-place on pedestal (see §10). After placement, Cloud gives a reaction. If player needs tips, Cloud offers a ChoicePanel to select which item to get a hint about (excluding already-placed items).

**Recommendation:** CloudKarimNPC.gd should be manual (like ThreeHeadedKarimNPC) since it handles the pedestal state, conditional ChoicePanel with dynamic options, and triggers the boss cutscene. Too complex for JSON actions alone.

### 4c. Exodia Karim (Boss)

| Property | Value |
|----------|-------|
| Script | `ExodiaKarimBoss.gd` (extends CharacterBody2D — NOT Enemy base) |
| Scene | `enemies/exodia/ExodiaKarim.tscn` |
| Scale | Large (2.0–3.0x normal NPC size) |
| Health | 3 HP (one stomp per phase transition) |
| Origin | Hydra Karim (Three-Headed Karim from Jungle) was hiding behind the Cloud. 4 Karims absorbed + Hydra Karim = Exodia Karim. |
| Composition | Orange Karim = HEAD, Red + Green Karim = TORSO, 2x Purple Karim = ARMS, 2x Purple Karim = LEGS |
| Visual | Multi-colored composite sprite matching the composition above |

Detailed in §11.

---

## 5. Dialog Files

### 5a. Orange Karim Dialogs

**Location:** `levels/level_jungle/dialogs/orange_karim/`

| File | Dialog ID | one_shot | Lines | Content (first line) |
|------|-----------|----------|-------|---------|
| `not_ready.tres` | `level_jungle/orange_karim/not_ready` | false | 2 | (origineel schrijven — geen ODT tekst, pre-quest flavor) |
| `intro.tres` | `level_jungle/orange_karim/intro` | false | 4 | "Maat, wat een genot is dit." ... "Laat maar eens zien wat je kan!" |
| `waiting.tres` | `level_jungle/orange_karim/waiting` | false | 2 | "Boh pik, die DLSS 8 kan me toch wat." |
| `complete.tres` | `level_jungle/orange_karim/complete` | true | 3 | "Heilige kak! Zijn dat raketlaarzen?!" |
| `done.tres` | `level_jungle/orange_karim/done` | false | 4 | "Ja ja, die raketlaarzen houden me nachten wakker." ... "doe hem vooral de groeten!" |
| `post_exodia.tres` | `level_jungle/orange_karim/post_exodia` | false | 3 | "Laatste tijd ben ik veel bezig met het experimenteren van oude technologie." |

### 5b. Cloud Karim Dialogs

**Location:** `levels/level_mystical/dialogs/cloud_karim/`

| File | Dialog ID | one_shot | Lines | Content (first line) |
|------|-----------|----------|-------|---------|
| `intro.tres` | `level_mystical/cloud_karim/intro` | true | 8 | "Gegroet." ... "Zoek deze objecten voor mij, en je beloning zal niet mals zijn." |
| `tip_menu.tres` | `level_mystical/cloud_karim/tip_menu` | false | 2 | "Welkom terug, makker." "Moet je tips over de locaties van de objecten hebben?" → triggers ChoicePanel |
| `tip_dildo.tres` | `level_mystical/cloud_karim/tip_dildo` | false | 2 | "Ah, het dynamische object, voor veel dingen geschikt." "Het gerucht gaat dat een groene en rode kleur conflict hebben..." |
| `tip_vibrator.tres` | `level_mystical/cloud_karim/tip_vibrator` | false | 3 | "Duidelijk, het elektrische apparaat, stimulance op elke gebied..." |
| `tip_butt_plug.tres` | `level_mystical/cloud_karim/tip_butt_plug` | false | 4 | "Het meest traditionale object, natuurlijk." ... "Aantonen dat er altijd meer is zal jou tot het object leiden." |
| `item_placed.tres` | `level_mystical/cloud_karim/item_placed` | false | 1 | (origineel schrijven — korte reactie bij plaatsing) |
| `all_placed.tres` | `level_mystical/cloud_karim/all_placed` | true | 3 | "Het is je gelukt, je bent uitverkoren." "Jaren in de lucht, jaren eenzaam." "Nu kan ik ontwaken." → triggers boss cutscene |

### 5c. Exodia Karim Boss Dialog (in-fight)

**Location:** `levels/level_mystical/dialogs/exodia_karim/`

| File | Dialog ID | one_shot | Lines | Content (first line) |
|------|-----------|----------|-------|---------|
| `phase1_taunt.tres` | `level_mystical/exodia_karim/phase1_taunt` | true | 2 | "Ah! Vuil schorem! Wie denk je wel niet dat je bent? IK BEN DE ULTIEME KARIM!" |
| `phase2_taunt.tres` | `level_mystical/exodia_karim/phase2_taunt` | true | 2 | "Vuile... vieze... dit kan niet waar zijn... je bent NIKS! IK BEN DE HEERSER VAN ALLEN!" |
| `phase3_taunt.tres` | `level_mystical/exodia_karim/phase3_taunt` | true | 2 | (origineel schrijven — Phase 3 wapen-summon taunt) |
| `defeat.tres` | `level_mystical/exodia_karim/defeat` | true | 11 | "Nee..." ... "... Einde." (volledige monoloog, regen + trieste muziek) |

### 5d. Victory Dialog (4 Karims speaking)

**Location:** `levels/level_mystical/dialogs/victory/`

| File | Dialog ID | one_shot | Lines | Content (first line) |
|------|-----------|----------|-------|---------|
| `reunion.tres` | `level_mystical/victory/reunion` | true | 9 | PURPLE: "Je hebt ons gered! Oh mijn god..." ... RED: "Zo is het! Nou jongens, maar eens tijd om naar huis te gaan." |

### 5e. Pre-Boss Cutscene Dialog

**Location:** `levels/level_mystical/dialogs/pre_boss/`

| File | Dialog ID | one_shot | Lines | Content (first line) |
|------|-----------|----------|-------|---------|
| `karims_arrive.tres` | `level_mystical/pre_boss/karims_arrive` | true | 6 | PURPLE: "Maat, wat is dit?" ... ORANGE: "Yo, maten. Zeg, wat is het hier druk." |
| `exodia_forms.tres` | `level_mystical/pre_boss/exodia_forms` | true | 3 | "HAHAHA! GEEN REKENINGEN MEER, GEEN CADEAUS!" ... "Dit is wie ik ben... Mijn ultieme vorm, kom als je durft." |

**Note:** The Cloud's "Het is je gelukt..." lines are `all_placed.tres` (Cloud Karim dialog, §5b). The pre-boss cutscene starts with that dialog, then continues into `karims_arrive.tres` and `exodia_forms.tres`. No separate `cloud_awakens.tres` needed — `all_placed.tres` serves that role.

### 5f. Post-Exodia Flavor Dialogs (existing NPCs)

**Location:** Added to existing NPC dialog folders.

| File | Dialog ID | one_shot | Lines | Content (first line) |
|------|-----------|----------|-------|---------|
| `levels/level_town/dialogs/green_karim/post_exodia.tres` | `level_town/green_karim/post_exodia` | false | 2 | "Moet eerlijk zeggen, sinds Exodia Karim geslacht is als een varken, kan ik veel beter opschieten met die rode lelijke aap." |
| `levels/level_town/dialogs/red_karim/post_exodia.tres` | `level_town/red_karim/post_exodia` | false | 3 | "Hey maat!" ... "Laten we de ervaring zelf maar als de beloning zien..." |
| `levels/level_town/dialogs/purple_karim/post_exodia.tres` | `level_town/purple_karim/post_exodia` | false | 5 | "Het leuke is, ik heb mijn PC nog steeds en omdat Hydra Karim dood is..." ... "Thanks voor alles!" |
| `levels/level_jungle/dialogs/orange_karim/post_exodia.tres` | (listed in 5a above) | false | 3 | "Laatste tijd ben ik veel bezig met het experimenteren van oude technologie." |

---

## 6. Quest JSON Files

### 6a. `data/quests/quest_orange_karim.json`

```json
{
  "id": "quest_orange_karim",
  "type": "quest",
  "name": "De Butt Plug Quest",
  "description": "Orange Karim in the jungle house is obsessed with futuristic technology. Show him something truly impressive — your Rocket Boots from the Awakening level.",
  "level": "level_jungle",
  "secondary_levels": ["level_1"],
  "prerequisites": ["quest_red_karim"],
  "active_key": "quest_orange_karim_active",
  "complete_key": "quest_orange_karim_complete",
  "reward": {
    "type": "item",
    "item_id": "Butt Plug"
  },
  "npcs": {
    "orange_karim": {
      "voice_pitch": 1.1,
      "role": "giver",
      "dialog_selection": [
        { "requires": {"quest_exodia_complete": true}, "dialog": "level_jungle/orange_karim/post_exodia" },
        { "requires": {"quest_orange_karim_complete": true}, "dialog": "level_jungle/orange_karim/done" },
        { "requires": {"quest_orange_karim_active": true}, "dialog": "level_jungle/orange_karim/waiting" },
        { "requires": {"quest_red_karim_complete": true}, "dialog": "level_jungle/orange_karim/intro" },
        { "dialog": "level_jungle/orange_karim/not_ready" }
      ],
      "on_dialog_end": {
        "level_jungle/orange_karim/intro": [
          { "action": "set_key", "key": "quest_orange_karim_active" }
        ],
        "level_jungle/orange_karim/complete": [
          { "action": "set_key", "key": "quest_orange_karim_complete" },
          { "action": "item_popup", "item_id": "Butt Plug", "delay": 0.5 }
        ]
      }
    }
  },
  "state_keys": [
    {
      "key": "quest_orange_karim_active",
      "set_by": "orange_karim — after intro dialog ends",
      "read_by": ["orange_karim"],
      "meaning": "Player accepted Orange Karim's tech challenge"
    },
    {
      "key": "quest_orange_karim_complete",
      "set_by": "orange_karim — after showing rocket boots",
      "read_by": ["orange_karim", "green_karim (extra line)", "MysticalLevelController (portal visibility)"],
      "meaning": "Butt Plug reward given"
    }
  ]
}
```

**NOTE:** The `waiting` → `complete` transition requires checking `has_rocket_boots` — the JSON `requires` system only supports boolean quest keys. `OrangeKarimNPC.gd` must handle this manually: if `quest_orange_karim_active` AND `ProgressData.has_item("rocket_boots")` → play `complete` dialog. The JSON dialog_selection for `waiting` is a fallback that only fires when the NPC script defers to QuestManager (which it won't for this specific check). Document this as an intentional manual override.

### 6b. `data/quests/quest_exodia_karim.json`

```json
{
  "id": "quest_exodia_karim",
  "type": "quest",
  "name": "The Grand Quest of Exodia Karim",
  "description": "Cloud Karim in the Mystical Realm demands three sacred objects to complete the Karim world-domination ritual. Collect all three and place them on the stone pedestal — but beware what awakens.",
  "level": "level_mystical",
  "secondary_levels": ["level_town", "level_jungle"],
  "prerequisites": ["quest_red_karim", "quest_purple_karim", "quest_orange_karim"],
  "active_key": "quest_exodia_active",
  "complete_key": "quest_exodia_complete",
  "reward": {
    "type": "item",
    "item_id": "Master of Pleasure"
  },
  "npcs": {
    "cloud_karim": {
      "voice_pitch": 0.15,
      "role": "giver",
      "dialog_selection": [
        { "requires": {"quest_exodia_complete": true}, "dialog": "level_mystical/cloud_karim/done" },
        { "dialog": "level_mystical/cloud_karim/intro" }
      ],
      "on_dialog_end": {}
    }
  },
  "state_keys": [
    {
      "key": "quest_exodia_active",
      "set_by": "cloud_karim — after intro dialog",
      "read_by": ["cloud_karim", "MysticalLevelController"],
      "meaning": "Player met Cloud Karim, quest to collect 3 items begun"
    },
    {
      "key": "pedestal_butt_plug",
      "set_by": "MysticalLevelController — auto on interact with pedestal while item in inventory",
      "read_by": ["MysticalLevelController (pedestal visuals)", "cloud_karim (tip filtering)"],
      "meaning": "Butt Plug placed on stone pedestal",
      "parallel_group": "pedestal_items"
    },
    {
      "key": "pedestal_dildo",
      "set_by": "MysticalLevelController — same",
      "read_by": ["MysticalLevelController", "cloud_karim"],
      "meaning": "Dildo placed on stone pedestal",
      "parallel_group": "pedestal_items"
    },
    {
      "key": "pedestal_vibrator",
      "set_by": "MysticalLevelController — same",
      "read_by": ["MysticalLevelController", "cloud_karim"],
      "meaning": "Vibrator placed on stone pedestal",
      "parallel_group": "pedestal_items"
    },
    {
      "key": "exodia_boss_defeated",
      "set_by": "MysticalLevelController — after boss death cutscene",
      "read_by": ["MysticalLevelController"],
      "meaning": "Exodia Karim has been defeated in combat"
    },
    {
      "key": "quest_exodia_complete",
      "set_by": "MysticalLevelController — after victory dialog + reward",
      "read_by": ["all 4 Karims (post-exodia dialog)", "cloud_karim", "MysticalLevelController"],
      "meaning": "Entire Exodia questline finished, weapon rewarded"
    }
  ]
}
```

**NOTE:** Cloud Karim's dialog and pedestal logic are too complex for JSON actions (dynamic ChoicePanel options, item-inventory checks, boss cutscene trigger). `CloudKarimNPC.gd` and `MysticalLevelController.gd` handle this manually. The JSON exists for QuestLog display, validation, and documentation.

---

## 7. State Keys

Complete registry of new keys:

| Key | Default | Set By | Read By | Meaning |
|-----|---------|--------|---------|---------|
| `quest_orange_karim_active` | false | OrangeKarimNPC (intro ends) | OrangeKarimNPC | Player accepted tech challenge |
| `quest_orange_karim_complete` | false | OrangeKarimNPC (complete ends) | OrangeKarimNPC, GreenKarimNPC, MysticalLevelController | Butt Plug given |
| `quest_exodia_active` | false | CloudKarimNPC (intro ends) | CloudKarimNPC, MysticalLevelController | Player started mystical realm quest |
| `pedestal_butt_plug` | false | MysticalLevelController | MysticalLevelController, CloudKarimNPC | Item placed on pedestal |
| `pedestal_dildo` | false | MysticalLevelController | MysticalLevelController, CloudKarimNPC | Item placed on pedestal |
| `pedestal_vibrator` | false | MysticalLevelController | MysticalLevelController, CloudKarimNPC | Item placed on pedestal |
| `exodia_boss_defeated` | false | MysticalLevelController (post-death) | MysticalLevelController | Boss fight won |
| `quest_exodia_complete` | false | MysticalLevelController (post-victory dialog) | All 4 Karims, CloudKarimNPC | Full questline done |

---

## 8. Item Definitions

### 8a. Quest Reward Items (popup-only, no gameplay effect)

These items already work via `item_popup` action — they show `ItemAcquiredPopup` with a name string. No `ItemDefs.ALL` entry needed unless we want sprites/gameplay effects.

| Item | Source Quest | Current State |
|------|-------------|---------------|
| Dildo | Red Karim's Complaint | Already implemented (popup only) |
| Vibrator | Purple Karim's Debt | Already implemented (popup only) |
| Butt Plug | De Butt Plug Quest | **NEW** — same pattern as above |

### 8b. Boss Reward Item

| Item | ID | Description |
|------|----|-------------|
| Master of Pleasure, Weapon of the Ancients | `master_of_pleasure` | A sword shaped like a pink dildo. Combines all 3 quest items. |

**Implementation options:**
- **Option A (popup only):** Show ItemAcquiredPopup — purely narrative reward, no gameplay effect. Simplest.
- **Option B (equippable weapon):** Add to `ItemDefs.ALL` with composited sprites (player holding sword). Requires new pixel art for all animation sheets. Significant art effort.
- **Option C (stat boost):** Invisible equipment — permanently increases damage or adds a new ability. No visual change needed.

**Recommendation:** Start with Option A (popup only). The weapon can get gameplay effects in a future session.

### 8c. Inventory Tracking

Currently, quest reward items (Dildo, Vibrator) are NOT tracked in any inventory — they only trigger a popup. For the pedestal mechanic to work, we need a way to check "does the player have item X?"

**Options:**
1. **Use existing quest completion keys as proxy:** `quest_red_karim_complete` = "has Dildo", `quest_purple_karim_complete` = "has Vibrator", `quest_orange_karim_complete` = "has Butt Plug". Simple, no new system needed.
2. **Add `ProgressData.quest_items` array:** Track collected quest items explicitly. More correct but adds a new subsystem.

**Recommendation:** Option 1 — use quest completion keys. The items are unique and permanent. If the quest is complete, the player "has" the item. The pedestal placement keys then track what's been offered to the pedestal.

---

## 9. Green Karim Dialog Modification

After `quest_orange_karim_complete`, Green Karim's dialog gets an extra line at the end.

### Current Green Karim Dialog Flow
```
quest_red_karim_complete → green_karim/reformed (forever)
quest_red_karim_accepted AND NOT confronted → green_karim/confronted
default → green_karim/default
```

### Updated Flow
```
quest_exodia_complete → green_karim/post_exodia (forever after boss)
quest_red_karim_complete AND quest_orange_karim_complete → green_karim/reformed_plus (with extra line about Orange)
quest_red_karim_complete → green_karim/reformed (without extra line)
quest_red_karim_accepted AND NOT confronted → green_karim/confronted
default → green_karim/default
```

**New dialog file:** `levels/level_town/dialogs/green_karim/reformed_plus.tres`
- Same content as `reformed.tres` + extra line:
- Green Karim: "Oh, wat hoor ik daar? Je hebt mijn broer ontmoet? Ah, dus je moest de groeten doen. Doe vooral niet de groeten terug, kankernerd dat het is, mijn vader had zich in zijn eigen graf omgedraait."

**Implementation:** Update `GreenKarimNPC.gd` dialog selection (or update `quest_red_karim.json` with the new condition). Since GreenKarimNPC is already manual, add the extra condition in `_get_active_dialog_id()`.

---

## 10. Pedestal Interaction System

### Design

The stone pedestal is an interactable object (like an NPC with E-key prompt). When the player interacts:

1. Check which quest items the player has (via quest completion keys) that aren't yet on the pedestal
2. If any unplaced items exist → play placement animation → set pedestal key → update visuals
3. If no items to place → Cloud Karim offers tips via ChoicePanel
4. If all 3 placed → trigger boss cutscene

### Implementation Pattern

**Option A (Pedestal as NPC):** Make `StonePedestalNPC.gd extends NPC`. Interaction triggers Cloud Karim's dialog + item placement logic. Simple, reuses existing E-key interaction.

**Option B (Separate interactable):** Custom `StonePedestal.gd extends Area2D` with its own E-key logic. More code but cleaner separation from Cloud Karim.

**Recommendation:** Option A — treat the pedestal+cloud as a single NPC interaction point. CloudKarimNPC handles all logic: dialog, placement, tips, and boss trigger. The pedestal is a visual child node whose sprites update based on state keys.

### Pedestal Visual Updates

In `MysticalLevelController._ready()` and on `quest_state_changed`:
```gdscript
_pedestal_slot_1.visible = ProgressData.get_quest("pedestal_butt_plug")
_pedestal_slot_2.visible = ProgressData.get_quest("pedestal_dildo")
_pedestal_slot_3.visible = ProgressData.get_quest("pedestal_vibrator")
```

### Item Placement Animation

When player interacts and has an unplaced item:
1. Short dialog: Cloud acknowledges
2. Tween: item sprite floats from player position to pedestal slot (0.8s, EASE_OUT)
3. Flash/glow effect on slot
4. Set pedestal key → `EventBus.quest_state_changed` fires
5. Check if all 3 placed → if yes, trigger all_placed dialog → boss cutscene

### Tip ChoicePanel

When player has no items to place and not all items collected:
1. Cloud plays `tip_menu` dialog
2. On dialog end → ChoicePanel with available (unplaced) items:
   - Filter out items where `pedestal_X == true`
   - Show 1-3 choices: "Dildo", "Vibrator", "Butt Plug"
3. On selection → play corresponding tip dialog

---

## 11. Exodia Karim Boss Fight

### 11a. Boss Entity

**Scene:** `enemies/exodia/ExodiaKarim.tscn`

```
ExodiaKarim (CharacterBody2D)
├── ExodiaKarimBoss.gd (script)
├── Sprite (Sprite2D — large multi-colored composite sprite)
├── CollisionShape (CollisionShape2D — large rectangle)
├── Hitbox (Area2D — damages player on contact)
│   └── HitboxShape (CollisionShape2D)
├── Hurtbox (Area2D — receives stomp damage on head)
│   └── HurtboxShape (CollisionShape2D — only covers top/head area)
├── WeaponSprite (Sprite2D — Phase 3 sword, initially hidden)
└── StateMachine (Node)
    ├── BossIdleState
    ├── BossPhase1State
    ├── BossPhase2State
    ├── BossPhase3State
    ├── BossStunnedState (after each phase, vulnerable to stomp)
    └── BossDefeatedState
```

**Why not extend Enemy.gd:** The boss has phase-based behavior, screen-crossing movement patterns, and a weapon phase. This is fundamentally different from the patrol/chase Enemy AI. A dedicated `ExodiaKarimBoss.gd` with its own state machine is cleaner.

**Collision layers:** Same as Enemy (layer 3 = Enemy, mask includes World + Player).

### 11b. Phase 1 — Horizontal Sweeps

```
Movement: Exodia walks from left edge to right edge (slow, ~60px/s)
Pattern:  LEFT→RIGHT, RIGHT→LEFT, LEFT→RIGHT, RIGHT→LEFT (4 passes)
Damage:   Body contact = 1 HP to player
Dodge:    Jump over (Exodia is ground-level, ~2 tiles tall)
After:    Exodia stops at center, collapses (stunned 3s)
Punish:   Player stomps head → 1 damage to boss
Dialog:   Phase 1 taunt after taking damage
```

**Implementation:**
```gdscript
# BossPhase1State
var passes_done := 0
var direction := 1  # 1 = right, -1 = left

func enter() -> void:
    passes_done = 0
    direction = -1  # start moving left
    _start_pass()

func _start_pass() -> void:
    direction *= -1
    # Tween boss from current x to target x
    var target_x = ARENA_RIGHT if direction == 1 else ARENA_LEFT
    var tween = boss.create_tween()
    tween.tween_property(boss, "global_position:x", target_x, PHASE1_DURATION)
    tween.tween_callback(_on_pass_complete)

func _on_pass_complete() -> void:
    passes_done += 1
    if passes_done >= 4:
        state_machine.transition_to("Stunned")
    else:
        _start_pass()
```

### 11c. Phase 2 — Vertical Dives

```
Movement: Exodia dives from top to bottom, targeting player's X position
Pattern:  TOP→BOTTOM (aimed at player), BOTTOM→TOP, repeat (4 passes)
Speed:    Faster than Phase 1 (~120px/s)
Damage:   Body contact = 1 HP
Dodge:    Dash sideways (mandatory — tracks player center)
After:    Collapses at center, stunned 3s → stomp
Dialog:   Phase 2 taunt after damage
```

**Implementation:**
- On each pass start, record player's X position
- Tween boss from off-screen top to bottom at recorded X
- Player must dash to avoid (tight timing window)
- After 4 passes → stunned at center

### 11d. Phase 3 — Combined + Weapon

```
Setup:    Exodia summons 3 items → "Master of Pleasure" sword forms
Movement: Horizontal sweep (like Phase 1) + vertical sword slash (like Phase 2)
Pattern:  Move LEFT→RIGHT, sword slashes TOP→BOTTOM from entry side
          Only one corner of screen is safe per pass
          Rotates clockwise: pass 1 = top-right safe, pass 2 = bottom-right,
          pass 3 = bottom-left, pass 4 = top-left
Speed:    Same as Phase 2
Damage:   Body = 1 HP, Sword aftereffect = 1 HP
Dodge:    Combination of jump + dash to reach safe corner
After:    4 passes → stunned at center → final stomp
```

**Implementation:**
- WeaponSprite becomes visible
- Each pass: boss tweens horizontally while sword slash tween covers vertical
- "Aftereffect" = lingering hitbox Area2D that covers the slashed area for ~0.5s
- Safe corner rotates clockwise
- After stomp → boss defeated

### 11e. Stunned State (between phases)

```gdscript
# BossStunnedState
func enter() -> void:
    boss.velocity = Vector2.ZERO
    boss.global_position.x = ARENA_CENTER_X
    # Boss collapses animation
    var tween = boss.create_tween()
    tween.tween_property(boss, "global_position:y", GROUND_Y, 0.3)
    # Enable head hurtbox
    boss._hurtbox_active = true
    # Auto-recover after 3s if player doesn't stomp
    await get_tree().create_timer(3.0).timeout
    if not boss._took_damage_this_phase:
        state_machine.transition_to(_next_phase())
```

### 11f. Health & Phase Transitions

| Event | HP Remaining | Next State |
|-------|-------------|------------|
| Start | 3 | Phase 1 |
| Stomp after Phase 1 | 2 | Phase 2 (after taunt dialog) |
| Stomp after Phase 2 | 1 | Phase 3 (after taunt dialog) |
| Stomp after Phase 3 | 0 | Defeated → death cutscene |

### 11g. Screen Lock

During the boss fight, the camera must be locked to the arena bounds:
- `EventBus.camera_limits_override.emit(left, right, top, bottom)` — new signal
- GameScene receives this and sets Camera2D limits
- On boss defeat, `EventBus.camera_limits_reset.emit()` restores defaults

Alternative: MysticalLevelController directly accesses the camera via GameScene reference.

### 11h. Boss Sprites

**Pixel art needed:**
- Exodia Karim idle (large composite sprite)
- Exodia Karim moving left/right
- Exodia Karim moving up/down
- Exodia Karim stunned/collapsed
- Exodia Karim with sword (Phase 3)
- Exodia Karim defeat animation
- Sword slash effect sprite
- Sword "aftereffect" warning area

**Placeholder approach:** Use a scaled-up NPC sprite with color modulation as placeholder. Add real art later.

---

## 12. Pre-Boss Cutscene

Triggered when all 3 pedestal items are placed and player interacts with Cloud Karim.

### Sequence (all tween-based, following JungleLevelController boss cutscene pattern):

```
1.  Cloud Karim dialog (all_placed.tres):
    - "Het is je gelukt, je bent uitverkoren."
    - "Jaren in de lucht, jaren eenzaam."
    - "Nu kan ik ontwaken."

2.  Music ducks to -18dB
3.  Screen shake (0.5s, intensity 3.0)

4.  Purple Karim NPC clone walks in from right edge
    - Purple Karim: "Maat, wat is dit?"
    - "Oh, jij bent het. Ik ben hiernaartoe geleid door een gevoel in mijn
       onderbuik... Alsof het mijn eindbestemming is."

5.  Green Karim, Red Karim, Orange Karim walk in from left edge (staggered 0.3s each)
    - Purple: "Wat is dit? Waarom zijn jullie hier?"
    - Red: "Ik voelde iets... overal en nergens, vooral in mijn scrotum."
    - Green: "Ik voelde niks, maarja, Rode Karim is weer bezig met een kankerstumper
              te zijn, waarom ben ik hier uberhaupt?"
    - Orange: "Yo, maten. Zeg, wat is het hier druk."

6.  Fade to white (0.5s)
7.  All 4 Karim NPCs tween toward Cloud (absorbed by the cloud)
8.  Camera shake (1.0s, intensity 6.0)

9.  HYDRA KARIM REVEAL: Cloud fades/parts → behind it, Hydra Karim (Three-Headed
    Karim from the Jungle) is revealed. This is the same entity from before.
    Hydra Karim + 4 absorbed Karims fuse together:
    - Orange Karim = HEAD
    - Red Karim + Green Karim = TORSO
    - 2x Purple Karim = ARMS
    - 2x Purple Karim = LEGS
    Exodia Karim forms (scale pop from 0.1 → 2.0)

10. Pedestal removed (queue_free or hide)
11. Cloud sprite removed (permanently gone)
12. Fade from white (0.5s)

13. Exodia Karim dialog (exodia_forms.tres):
    - "HAHAHA! GEEN REKENINGEN MEER, GEEN CADEAUS!"
    - "ELKE SCHULD ZAL BETAALD WORDEN, JIJ DACHT DAT IK JE ZOU HELPEN? NEE MAKKER!"
    - "Dit is wie ik ben... Mijn ultieme vorm, kom als je durft."

14. Screen lock → boss fight begins
```

### Implementation Notes

- **Karim NPC clones:** Spawn temporary NPC sprites (not real NPC instances). Simple Sprite2D nodes with modulate colors matching each Karim. Tween them walking in.
- **Absorption tween:** Tween all 4 sprites toward cloud center + scale to 0 + fade alpha.
- **Hydra Karim reveal:** Hidden Sprite2D behind Cloud, made visible when Cloud fades. Tween Hydra sprite + absorbed energy into Exodia form. This is the key narrative reveal — the Cloud was hiding Hydra Karim all along.
- **Exodia spawn:** Instance ExodiaKarim.tscn at Hydra Karim's position, scale pop. Hydra sprite removed.
- **Follow existing pattern:** Use `SceneTransition.fade_to_black()` / `fade_from_black()`, `EventBus.camera_pan_requested`, `EventBus.camera_shake_requested` — same as JungleLevelController boss cutscene.

---

## 13. Post-Boss Cutscene

Triggered when Exodia Karim HP reaches 0.

### Sequence:

```
1.  Boss stops moving, weapon disappears
2.  Music crossfades to sad track (or ducks to silence)
3.  Weather: start rain (EventBus.weather_change_requested if available,
    or direct WeatherController call — may need to add weather to mystical level)
4.  Screen dims slightly (modulate the background)

5.  Exodia defeat dialog (11 lines, slow typewriter):
    "Nee..."
    "Niet ik..."
    "Waarom ik? Waarom niet iemand anders?"
    "Ik wilde alleen het beste voor elke Karim... alle kleuren, alle liefde..."
    "We zouden samen een zijn... voor elkaar, met elkaar..."
    "Samen sterk, nooit eenzaam, nooit alleen..."
    "Mijn geduld, mijn kracht, mijn doel..."
    "Alles in het niet, door de macht van een ander zink ik zelf in een oneindig
     dal, gedoemd tot eeuwig pijn en verlies..."
    "Mijn tranen gaan verloren in de regen, zoals mijn doel vergeten zal worden
     door tijd..."
    "Dit is... mijn eeuwige bestemming... mijn..."
    "... Einde."

6.  Exodia explodes:
    - Camera shake (1.5s, intensity 8.0)
    - Scale pop (2.0 → 3.0) + flash white + alpha → 0
    - Particle burst (golden particles, like ThreeHeadedKarim but bigger)
    - ExodiaKarim queue_free()
    - exodia_boss_defeated = true

7.  4 Karim sprites materialize (reverse of absorption):
    - Scale from 0 → 1, alpha 0 → 1 at positions around arena center
    - Each gets their modulate color

8.  Rain stops (2s transition)
9.  Music restores / crossfades to level music

10. Victory dialog (reunion.tres, multi-character, 9 lines):
    Purple Karim: "Je hebt ons gered! Oh mijn god..."
    Orange Karim: "Jij held! Woohoo!"
    Green Karim: "Goed werk... I guess."
    Red Karim: "Top werk man! Lekker hoor!"
    Purple Karim: "We zijn allemaal anders, allemaal ons eigen persoon... ik zal er
                   voortaan maar voor zorgen dat ik geen schulden meer krijg bij vage
                   driekoppige Karims..."
    Orange Karim: "Vertel mij wat... misschien moet ik ook maar eens wat minder met de
                   toekomst bezig zijn en meer met het heden."
    Red Karim: "Nou, we steken deze ervaring mooi in onze zak dan. Green Karim, zin om
                over vrouwen te praten thuis?"
    Green Karim: "Rot op met je onzin! Altijd zeiken dat ik stil moet zijn! Ik wil...
                  weet je wat? Waarom ook niet? Bepaalde dingen moeten we misschien
                  matigen, maar we zijn nou eenmaal samen. Laten we er het beste van
                  maken."
    Red Karim: "Zo is het! Nou jongens, maar eens tijd om naar huis te gaan."

11. 4 Karim sprites walk off screen (staggered, fade out)
12. quest_exodia_complete = true
13. ItemAcquiredPopup("Master of Pleasure, Weapon of the Ancients")
14. Camera limits reset
15. Cloud + Hydra Karim + pedestal permanently gone (keys prevent respawn on reload)
```

---

## 14. Post-Quest Flavor Dialog

After `quest_exodia_complete == true`, all 4 Karims return to their original positions with new dialog.

### Dialog Selection Updates

Each existing Karim NPC script needs a new top-priority check:

**GreenKarimNPC:**
```
quest_exodia_complete == true → green_karim/post_exodia
(existing chain follows)
```

**RedKarimNPC:**
```
quest_exodia_complete == true → red_karim/post_exodia
(existing chain follows)
```

**PurpleKarimNPC:**
```
quest_exodia_complete == true → purple_karim/post_exodia
(existing chain follows)
```

**OrangeKarimNPC:**
```
quest_exodia_complete == true → orange_karim/post_exodia
(existing chain follows)
```

---

## 15. File Manifest

### New Files

| Path | Type | Description |
|------|------|-------------|
| `godot_port/data/quests/quest_orange_karim.json` | Data | Orange Karim quest definition |
| `godot_port/data/quests/quest_exodia_karim.json` | Data | Exodia Karim meta-quest definition |
| `godot_port/npcs/OrangeKarimNPC.gd` | Script | Orange Karim NPC (extends NPC) |
| `godot_port/npcs/CloudKarimNPC.gd` | Script | Cloud Karim NPC (extends NPC) |
| `godot_port/enemies/exodia/ExodiaKarim.tscn` | Scene | Boss scene |
| `godot_port/enemies/exodia/ExodiaKarimBoss.gd` | Script | Boss logic + state machine |
| `godot_port/enemies/exodia/states/BossStateMachine.gd` | Script | Boss state machine |
| `godot_port/enemies/exodia/states/BossIdleState.gd` | Script | |
| `godot_port/enemies/exodia/states/BossPhase1State.gd` | Script | Horizontal sweeps |
| `godot_port/enemies/exodia/states/BossPhase2State.gd` | Script | Vertical dives |
| `godot_port/enemies/exodia/states/BossPhase3State.gd` | Script | Combined + weapon |
| `godot_port/enemies/exodia/states/BossStunnedState.gd` | Script | Vulnerable between phases |
| `godot_port/enemies/exodia/states/BossDefeatedState.gd` | Script | Death sequence |
| `godot_port/levels/level_mystical/MysticalLevel.tscn` | Scene | Mystical Realm level |
| `godot_port/levels/level_mystical/MysticalLevelController.gd` | Script | Level controller + cutscenes |
| `godot_port/levels/level_mystical/dialogs/cloud_karim/*.tres` | Dialog | 7 dialog files (intro, tip_menu, tip_dildo/vibrator/butt_plug, item_placed, all_placed) |
| `godot_port/levels/level_mystical/dialogs/exodia_karim/*.tres` | Dialog | 4 boss dialog files (phase1-3 taunts, defeat) |
| `godot_port/levels/level_mystical/dialogs/pre_boss/*.tres` | Dialog | 2 cutscene dialogs (karims_arrive, exodia_forms) |
| `godot_port/levels/level_mystical/dialogs/victory/*.tres` | Dialog | 1 multi-character dialog |
| `godot_port/levels/level_jungle/dialogs/orange_karim/*.tres` | Dialog | ~6 dialog files |
| `godot_port/levels/level_town/dialogs/green_karim/reformed_plus.tres` | Dialog | Extended reformed dialog |
| `godot_port/levels/level_town/dialogs/green_karim/post_exodia.tres` | Dialog | Post-boss flavor |
| `godot_port/levels/level_town/dialogs/red_karim/post_exodia.tres` | Dialog | Post-boss flavor |
| `godot_port/levels/level_town/dialogs/purple_karim/post_exodia.tres` | Dialog | Post-boss flavor |
| `godot_port/shaders/mystical_sky.gdshader` | Shader | Cosmic background for mystical realm |

### Modified Files

| Path | Change |
|------|--------|
| `godot_port/data/LevelDefs.gd` | Add `level_mystical` entry |
| `godot_port/data/ItemDefs.gd` | (optional) Add `master_of_pleasure` if gameplay effect wanted |
| `godot_port/npcs/GreenKarimNPC.gd` | Add `quest_exodia_complete` and `quest_orange_karim_complete` dialog checks |
| `godot_port/npcs/RedKarimNPC.gd` | Add `quest_exodia_complete` dialog check |
| `godot_port/npcs/PurpleKarimNPC.gd` | Add `quest_exodia_complete` dialog check |
| `godot_port/levels/level_jungle/JungleLevel.tscn` | Add Orange Karim NPC to house interior, add mystical portal |
| `godot_port/levels/level_jungle/interiors/JungleHouseInterior.tscn` | Place OrangeKarimNPC instance |
| `godot_port/core/EventBus.gd` | (optional) Add `camera_limits_override` signal for boss arena |
| `godot_port/core/Constants.gd` | Add boss-related constants (speeds, damage, arena bounds) |
| `CLAUDE.md` | Update directory tree |
| `docs/quest-registry.md` | Add Orange Karim, Cloud Karim, Exodia quest entries |
| `docs/status.md` | Session log update |

---

## 16. Implementation Order

Ordered by dependency and risk. Each step is a potential session boundary.

### Step 1: Orange Karim + Butt Plug Quest (1 session) — DONE (Session 60)

**Files touched:** `npcs/OrangeKarimNPC.gd`, `data/quests/quest_orange_karim.json`, 6 dialog .tres files, `JungleHouseInterior.tscn`, `GreenKarimNPC.gd` (extra line via quest_red_karim.json), `reformed_plus.tres`

**Status:** All tasks complete. Green Karim dialog updated via quest_red_karim.json dialog_selection (not GreenKarimNPC.gd directly). Orange Karim placed at x=150 in JungleHouseInterior. Also fixed 3 bugs: spawn dialog auto-play, gate persistence, item persistence across scene transitions.

### Step 2: Mystical Realm Level (1 session)

**Files touched:** `levels/level_mystical/` (new dir), `LevelDefs.gd`, `JungleLevel.tscn` (portal), `shaders/mystical_sky.gdshader`

**Risk:** LOW — level creation follows existing town/jungle patterns. Portal is proven pattern.

**Tasks:**
1. Create `levels/level_mystical/` directory structure
2. Build `MysticalLevel.tscn` (flat ground, background, placeholder visuals)
3. Create `MysticalLevelController.gd` (basic, no boss logic yet)
4. Add `level_mystical` to `LevelDefs.gd`
5. Add portal in jungle level (conditionally visible after all 3 quests complete)
6. Add return portal in mystical level
7. Create `mystical_sky.gdshader` (cosmic theme)
8. Test: portal appears after all quests, transitions work both ways

### Step 3: Cloud Karim + Pedestal System (1 session)

**Files touched:** `npcs/CloudKarimNPC.gd`, `MysticalLevel.tscn` (add NPC + pedestal nodes), `MysticalLevelController.gd` (pedestal logic), 9 dialog .tres files, `quest_exodia_karim.json`

**Risk:** MEDIUM — ChoicePanel with dynamic filtering is new behavior. Follow PurpleKarimNPC choice pattern.

**Tasks:**
1. Create `CloudKarimNPC.gd` (extends NPC, manual dialog + pedestal interaction)
2. Add Cloud Karim + Stone Pedestal nodes to `MysticalLevel.tscn`
3. Create all Cloud Karim dialog .tres files
4. Implement pedestal item placement logic in `MysticalLevelController.gd`
5. Implement tip ChoicePanel (dynamic options based on placed items)
6. Create `quest_exodia_karim.json`
7. Test: intro dialog, item placement, tip system, all-placed detection
8. Update quest-registry.md

### Step 4: Pre-Boss Cutscene (1 session)

**Files touched:** `MysticalLevelController.gd` (cutscene code), pre-boss dialog .tres files

**Risk:** MEDIUM — complex tween chain. Follow JungleLevelController `_trigger_boss_spawn()` pattern exactly.

**Tasks:**
1. Create pre-boss dialog .tres files
2. Implement Karim clone spawning + walk-in tweens
3. Implement absorption animation (4 clones → cloud center)
4. Implement cloud → Exodia transition (flash, scale pop)
5. Implement Exodia intro dialog
6. Test: trigger cutscene with all 3 items placed

### Step 5: Exodia Boss Fight — Core (1-2 sessions)

**Files touched:** `enemies/exodia/` (new dir, all files), `Constants.gd`, `EventBus.gd` (optional)

**Risk:** HIGH — first real boss fight in the game. New state machine, movement patterns, phase transitions. Most complex single feature.

**Tasks:**
1. Create `ExodiaKarim.tscn` with collision shapes, hitbox, hurtbox
2. Create `ExodiaKarimBoss.gd` with health, phase tracking, damage/stomp detection
3. Create `BossStateMachine.gd` + all state scripts
4. Implement Phase 1 (horizontal sweeps, 4 passes, stunned)
5. Implement stomp detection on stunned boss → phase transition
6. Implement Phase 2 (vertical dives, player targeting, 4 passes)
7. Implement Phase 3 (combined + weapon sprite + aftereffect hitbox)
8. Implement screen lock (camera bounds)
9. Add boss-related constants to `Constants.gd`
10. Test each phase independently via debug shortcut

### Step 6: Post-Boss Cutscene + Reward (1 session)

**Files touched:** `MysticalLevelController.gd`, defeat/victory dialog .tres files

**Risk:** MEDIUM — long tween chain but follows established patterns.

**Tasks:**
1. Create defeat dialog .tres (10-line monologue)
2. Create victory dialog .tres (multi-character)
3. Implement sad music + rain effect
4. Implement Exodia death animation (explosion, particles)
5. Implement 4 Karim materialization
6. Implement victory dialog sequence
7. ItemAcquiredPopup for Master of Pleasure
8. Set `quest_exodia_complete`
9. Clean up: remove temporary sprites, reset camera
10. Test: full boss fight through to reward

### Step 7: Post-Quest State + Flavor Dialog (1 session)

**Files touched:** `GreenKarimNPC.gd`, `RedKarimNPC.gd`, `PurpleKarimNPC.gd`, `OrangeKarimNPC.gd`, 4 post-exodia dialog .tres files

**Risk:** LOW — small dialog selection additions to existing scripts.

**Tasks:**
1. Create 4 post-exodia dialog .tres files (town NPCs)
2. Add `quest_exodia_complete` check to each NPC's `_get_active_dialog_id()`
3. Test: complete entire questline, verify all NPCs have updated dialog
4. Update quest-registry.md with final state

### Step 8: Documentation + Polish (1 session)

**Tasks:**
1. Update CLAUDE.md directory tree
2. Update quest-registry.md with all new entries
3. Run `python tools/quest_tool.py --validate` — fix any warnings
4. Run `python tools/quest_tool.py --story --write` + `--graph --write` + `--html --write`
5. Update docs/status.md session log
6. Playtest full questline start-to-finish
7. Tune boss difficulty (speeds, timing windows)

---

## 17. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Boss fight is the first real boss — no proven pattern | HIGH | Build Phase 1 first, test thoroughly, then add Phase 2/3 incrementally |
| Rocket boots inventory check not supported by JSON requires | LOW | Manual NPC script (documented above, same pattern as BlueKarimNPC) |
| Pre/post-boss cutscenes are long tween chains | MEDIUM | Follow JungleLevelController pattern exactly; test each step in isolation |
| New level needs visual assets (cloud sprite, pedestal, Exodia sprite) | MEDIUM | Use placeholder sprites (scaled/recolored existing NPCs); add real art later |
| Enemy collision system is currently bugged (Session 58) | HIGH | Boss stomp detection should be fixed BEFORE implementing boss. Resolve Session 58 bug first. |
| Many new state keys — save file compatibility | LOW | All default to false; existing saves unaffected |
| ChoicePanel with dynamic options | LOW | PurpleKarimNPC already uses ChoicePanel; extend pattern |
| Hub files modified (EventBus, Constants, LevelDefs) | MEDIUM | Only add new entries, don't modify existing ones. Use worktree if paralleling |
| Post-exodia dialog changes to 4 existing NPCs | LOW | Single condition added at top of each dialog selection — no existing logic changes |

### Blocker: Enemy Collision Bug

The Session 58 combat collision bug **must be resolved** before Step 5 (boss fight). The boss uses the same stomp-to-kill mechanic. If `_check_enemy_collisions()` doesn't fire, the boss can't be damaged.

**Recommendation:** Fix the collision bug first (Session 59 priority), THEN start this questline.

---

## 18. Testing Checklist

### Act I — De Butt Plug Quest
- [ ] Orange Karim shows "not_ready" dialog before Red Karim quest is complete
- [ ] Orange Karim shows "intro" dialog after Red Karim quest complete
- [ ] Quest accepted → "waiting" dialog plays on repeat
- [ ] With rocket boots equipped → "complete" dialog, Butt Plug popup
- [ ] Without rocket boots → stays on "waiting"
- [ ] Post-complete → "done" dialog with Green Karim mention
- [ ] Green Karim shows extra line about Orange Karim
- [ ] Quest appears in QuestLog with correct status

### Act II — Mystical Realm
- [ ] Portal hidden when not all 3 quests complete
- [ ] Portal visible when all 3 quests complete
- [ ] Portal transition works both ways
- [ ] Cloud Karim intro dialog plays on first visit
- [ ] Pedestal starts empty
- [ ] Item auto-places when interacting with pedestal (for each of 3 items)
- [ ] Pedestal slot visuals update correctly
- [ ] Tip ChoicePanel only shows unplaced items
- [ ] Each tip dialog plays correctly
- [ ] All 3 placed → triggers boss cutscene

### Act III — Boss Fight
- [ ] Pre-boss cutscene: 4 Karims walk in, absorption, Exodia forms
- [ ] Phase 1: 4 horizontal passes, jumpable, stunned after
- [ ] Stomp on stunned boss → 1 damage, phase 2 begins
- [ ] Phase 2: 4 vertical passes targeting player, dashable, stunned after
- [ ] Phase 3: combined movement + sword, safe corner rotates, stunned after
- [ ] Final stomp → defeat cutscene begins
- [ ] Rain + sad music during defeat monologue
- [ ] Exodia explosion + 4 Karims materialize
- [ ] Victory dialog (multi-character)
- [ ] Master of Pleasure reward popup
- [ ] Camera unlocked, player can leave

### Post-Quest
- [ ] All 4 Karims at original positions with post-exodia dialog
- [ ] Mystical realm portal still accessible
- [ ] Cloud Karim + pedestal gone in mystical realm
- [ ] Full save/load cycle preserves all state correctly
- [ ] QuestLog shows all quests as complete

---

## 19. Dashboard & Auto-Generated Docs

### How It Works (existing pipeline)

The quest dashboard is **fully automatic** — no manual steps needed beyond committing:

1. **Pre-commit hook** detects staged `data/quests/*.json`, `*Defs.gd`, `dialogs/**/*.tres`, or `npcs/*.gd`
2. Hook runs `quest_tool.py` three times:
   - `--dashboard --write` → `docs/game-bible.html` (Cytoscape.js 6-tab SPA)
   - `--story --write` → `docs/storyline.md`
   - `--graph --write` → `docs/quest-flowchart.md` (Mermaid)
3. Output files are auto-staged into the same commit
4. On push to `main`, GitHub Pages workflow (`.github/workflows/pages.yml`) deploys `docs/` → live at `https://zyynx-hub.github.io/Platformer/game-bible.html`

`quest_tool.py` uses `glob("*.json")` over `data/quests/` — any new JSON file is automatically discovered. No registration list.

### What the New Quests Provide to the Dashboard

Both `quest_orange_karim.json` and `quest_exodia_karim.json` must be well-formed for the graph to render correctly. Key fields consumed by the dashboard:

| JSON Field | Dashboard Effect |
|-----------|-----------------|
| `state_keys[]` array order | Determines top-to-bottom node ranking in Cytoscape graph |
| `state_keys[].parallel_group` | Groups nodes visually (e.g., pedestal items grouped like hydra bodies) |
| `prerequisites[]` | Creates cross-quest edge arrows between subgraphs |
| `npcs{}` keys + `role` | NPC nodes with role badges (giver/target/boss) |
| `npcs{}.dialog_selection[]` | Rendered in HTML report cards |
| `npcs{}.on_dialog_end{}` | Action trees shown in report cards |
| `level` / `secondary_levels` | `@ Level` labels on NPC nodes + travel indicator nodes between levels |
| `reward{}` | Diamond reward node at end of quest subgraph |

### JSON Design Considerations for Dashboard

**`quest_orange_karim.json`:**
- `prerequisites: ["quest_red_karim"]` → arrow from Red Karim subgraph to Orange Karim subgraph
- `state_keys` order: `quest_orange_karim_active` → `quest_orange_karim_complete`
- Single level (`level_jungle`), no travel nodes needed

**`quest_exodia_karim.json`:**
- `prerequisites: ["quest_red_karim", "quest_purple_karim", "quest_orange_karim"]` → three incoming prerequisite arrows (visually shows this is the endgame convergence)
- `state_keys` order: `quest_exodia_active` → `pedestal_butt_plug` / `pedestal_dildo` / `pedestal_vibrator` (parallel_group: `"pedestal_items"`) → `exodia_boss_defeated` → `quest_exodia_complete`
- `secondary_levels: ["level_town", "level_jungle"]` → travel indicators for NPCs appearing from other levels in the cutscene
- The parallel_group `"pedestal_items"` on the three pedestal keys will create a grouped layout with a diamond join node (same visual pattern as hydra bodies)

### Validation Before Commit

Always run before staging new quest JSONs:
```bash
python godot_port/tools/quest_tool.py --validate
```

This catches: missing dialog files, undefined state keys, broken prerequisites, orphaned NPCs.

### New Level in LevelDefs

The dashboard also reads `LevelDefs.gd` for its level map tab. Adding `level_mystical` there ensures:
- NPC nodes show `@ Mystical Realm` labels
- Travel indicator nodes (`>> Mystical Realm`) appear between level transitions
- Level connections render on the constellation map tab

### Checklist for Dashboard Correctness

- [ ] `quest_orange_karim.json` passes `--validate`
- [ ] `quest_exodia_karim.json` passes `--validate`
- [ ] Pedestal keys use `parallel_group: "pedestal_items"` for visual grouping
- [ ] Prerequisites create correct cross-quest arrows (3 arrows into Exodia quest)
- [ ] `state_keys` array order matches narrative chronology
- [ ] All dialog .tres files exist at paths referenced by dialog_selection
- [ ] `level_mystical` added to `LevelDefs.gd` before commit
- [ ] Pre-commit hook runs without errors
- [ ] Live dashboard shows both new quest subgraphs after push

---

## Appendix A: Original Dialog Text (Dutch)

All dialog preserved from the source document. See the `.tres` files for final formatted versions.

### Orange Karim — Intro
```
"Maat, wat een genot is dit."
"Laatst gewoon nieuwe technologie getest, VR glasses enzo."
"Hoe zit het met jou en technologie? Als jij me iets kan laten zien, geef ik je er graag iets voor, ik ben echt een futuristisch persoon!"
"Laat maar eens zien wat je kan!"
```

### Orange Karim — Waiting
```
"Boh pik, die DLSS 8 kan me toch wat."
"Al iets gevonden waar ik van onder de indruk ben? Ik zie het graag tegemoet."
```

### Orange Karim — Complete
```
"Heilige kak! Zijn dat raketlaarzen?!"
"Oke, nu moet ik toegeven dat ik onder de indruk ben..."
"Deze heb je echt verdient, geniet ervan knaap."
```

### Orange Karim — Done (post-complete)
```
"Ja ja, die raketlaarzen houden me nachten wakker."
"Je zou mijn broer eens moeten ontmoeten, Green Karim, woont samen met Red Karim, die twee hebben me toch een partij problemen."
"Oh, je kent hem al?"
"Als je hem nog een keer ziet, doe hem vooral de groeten!"
```

### Green Karim — Extra Line (after Orange Karim quest)
```
"Oh, wat hoor ik daar? Je hebt mijn broer ontmoet? Ah, dus je moest de groeten doen. Doe vooral niet de groeten terug, kankernerd dat het is, mijn vader had zich in zijn eigen graf omgedraait."
```

### Cloud Karim — Intro
```
"Gegroet."
"Ik ben de wolk der Karim."
"Alle Karim's in deze wereld hebben mijn zegening."
"Om het traject van wereld-dominatie van de Karim's te voltooien, heb ik drie objecten nodig."
"Een object, bedoelt voor insertie. Maar slechts geschikt voor een specifiek gat..."
"De ander, wederom een insertie object, maar met meer flexibiliteit..."
"De laatste, een andere type object, gevoerd door electriciteit, maker van trillende bewegingen."
"Zoek deze objecten voor mij, en je beloning zal niet mals zijn."
```

### Cloud Karim — Tip Menu (elke keer bij terugkomst)
```
"Welkom terug, makker."
"Moet je tips over de locaties van de objecten hebben?"
→ ChoicePanel: kies een van de nog niet geplaatste items voor uitleg
```

### Cloud Karim — Tips
**Dildo:**
```
"Ah, het dynamische object, voor veel dingen geschikt."
"Het gerucht gaat dat een groene en rode kleur conflict hebben, het oplossen van dit conflict zal je naar dit object leiden."
```

**Vibrator:**
```
"Duidelijk, het elektrische apparaat, stimulance op elke gebied, volledig geautomatiseerd."
"Deze is te vinden na een driekoppige entiteit te ontwaken en zijn ware aard naar voren te laten komen."
"Ook zie ik de kleur paars, waar het begint en waar het eindigt."
```

**Butt Plug:**
```
"Het meest traditionale object, natuurlijk."
"Een manier van gebruik, een doel, een concrete bestemming."
"Het gefluister in de wolken toont mij een eenzame man gekleurd in oranje, alleen interesse in de toekomst en wat het te bieden heeft."
"Aantonen dat er altijd meer is zal jou tot het object leiden."
```

### Cloud Karim — All Placed
```
"Het is je gelukt, je bent uitverkoren."
"Jaren in de lucht, jaren eenzaam."
"Nu kan ik ontwaken."
```

### Pre-Boss — Karims Arrive
```
PURPLE: "Maat, wat is dit?"
PURPLE: "Oh, jij bent het. Ik ben hiernaartoe geleid door een gevoel in mijn onderbuik... Alsof het mijn eindbestemming is."
PURPLE: "Wat is dit? Waarom zijn jullie hier?"
RED: "Ik voelde iets... overal en nergens, vooral in mijn scrotum."
GREEN: "Ik voelde niks, maarja, Rode Karim is weer bezig met een kankerstumper te zijn, waarom ben ik hier uberhaupt?"
ORANGE: "Yo, maten. Zeg, wat is het hier druk."
```

### Exodia — Entrance
```
"HAHAHA! GEEN REKENINGEN MEER, GEEN CADEAUS!"
"ELKE SCHULD ZAL BETAALD WORDEN, JIJ DACHT DAT IK JE ZOU HELPEN? NEE MAKKER!"
"Dit is wie ik ben... Mijn ultieme vorm, kom als je durft."
```

### Exodia — Phase Taunts
```
Phase 1: "Ah! Vuil schorem! Wie denk je wel niet dat je bent? IK BEN DE ULTIEME KARIM! IK! EN NIEMAND ANDERS!"
         "Laten we eens kijken hoe je HIER mee omgaat!"
Phase 2: "Vuile... vieze... dit kan niet waar zijn... je bent NIKS! IK BEN DE HEERSER VAN ALLEN!"
         "Goed dan, je hebt erom gevraagd, kijk maar eens of je hier tegen opgewassen bent!"
```

### Exodia — Defeat Monologue
```
"Nee..."
"Niet ik..."
"Waarom ik? Waarom niet iemand anders?"
"Ik wilde alleen het beste voor elke Karim... alle kleuren, alle liefde..."
"We zouden samen een zijn... voor elkaar, met elkaar..."
"Samen sterk, nooit eenzaam, nooit alleen..."
"Mijn geduld, mijn kracht, mijn doel..."
"Alles in het niet, door de macht van een ander zink ik zelf in een oneindig dal, gedoemd tot eeuwig pijn en verlies..."
"Mijn tranen gaan verloren in de regen, zoals mijn doel vergeten zal worden door tijd..."
"Dit is... mijn eeuwige bestemming... mijn..."
"... Einde."
```

### Post-Boss — Victory
```
PURPLE: "Je hebt ons gered! Oh mijn god..."
ORANGE: "Jij held! Woohoo!"
GREEN: "Goed werk... I guess."
RED: "Top werk man! Lekker hoor!"
PURPLE: "We zijn allemaal anders, allemaal ons eigen persoon... ik zal er voortaan maar voor zorgen dat ik geen schulden meer krijg bij vage driekoppige Karims..."
ORANGE: "Vertel mij wat... misschien moet ik ook maar eens wat minder met de toekomst bezig zijn en meer met het heden."
RED: "Nou, we steken deze ervaring mooi in onze zak dan. Green Karim, zin om over vrouwen te praten thuis?"
GREEN: "Rot op met je onzin! Altijd zeiken dat ik stil moet zijn! Ik wil... weet je wat? Waarom ook niet? Bepaalde dingen moeten we misschien matigen, maar we zijn nou eenmaal samen. Laten we er het beste van maken."
RED: "Zo is het! Nou jongens, maar eens tijd om naar huis te gaan."
```

### Post-Quest — Flavor (forever-after dialog)

**Green Karim:**
```
"Moet eerlijk zeggen, sinds Exodia Karim geslacht is als een varken, kan ik veel beter opschieten met die rode lelijke aap."
"Ach ja... misschien is de wereld zo slecht nog niet..."
```

**Red Karim:**
```
"Hey maat!"
"Heb veel aan je te danken hoor, dit keer heb ik alleen niks om aan je te geven als beloning..."
"Laten we de ervaring zelf maar als de beloning zien in dit geval, op naar de toekomst!"
```

**Orange Karim:**
```
"Laatste tijd ben ik veel bezig met het experimenteren van oude technologie."
"Een ding hier heet 'Windows XP' geen idee wat het is en hoe het werkt, maar dat is juist het leuke!"
"Ik heb nog zoveel dingen uit het verleden om te ontdekken, de toekomst zit in het verleden!"
```

**Purple Karim:**
```
"Het leuke is, ik heb mijn PC nog steeds en omdat Hydra Karim dood is, hoef ik niks terug te betalen."
"Of was het Exodia Karim? Of was het Hydra Exodia Karim?"
"Afijn... hij is weg, maar toch, de connectie tussen hem en mij, het paarse dat ik met hem deelde zit me soms nog dwars."
"In ieder geval gaat het leven door, nu in ieder geval met een goedkope PC."
"Thanks voor alles!"
```
