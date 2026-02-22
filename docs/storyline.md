# Storyline Guide

**Auto-generated** on 2026-02-22 by `tools/quest_tool.py --story --write`.
Source of truth: `godot_port/data/quests/*.json`.
Do not edit by hand.

---

## Purple Karim's Debt

**Level**: `level_town` + `level_jungle` | **Reward**: Vibrator
**NPCs**: **purple_karim** (giver), **hydra_body_1** (target), **hydra_body_2** (target), **hydra_body_3** (target), **three_headed_karim** (boss)

> Purple Karim couldn't pay off his PC debt because of his busted knee. Miffy delivered the payment to the terrifying three-headed Hydra Karim deep in the jungle village, narrowly avoiding threats of violence. Purple Karim was relieved and grateful.

### Steps

1. Talk to **purple_karim** -> `level_town/purple_karim/intro` -> then (0.5s delay):
   - Choice: "Wil je zijn schuld betalen?"
     - **Ja, ik doe het**: sets `quest_purple_karim_active`, plays `level_town/purple_karim/accept`
     - **Nee, geen tijd**: plays `level_town/purple_karim/decline`
2. **hydra_bodies** (any order):
   - Talk to **hydra_body_1** -> `level_jungle/hydra_body_1/dialog` -> sets `hydra_body_1_gone` -- fades out (1.2s)
   - Talk to **hydra_body_2** -> `level_jungle/hydra_body_2/dialog` -> sets `hydra_body_2_gone` -- fades out (1.2s)
   - Talk to **hydra_body_3** -> `level_jungle/hydra_body_3/dialog` -> sets `hydra_body_3_gone` -- fades out (1.2s)
3. Talk to **three_headed_karim** -> `level_jungle/three_headed_karim/encounter`
   - fades out (1.5s)
   - sets `three_headed_karim_paid`
4. Talk to **purple_karim** -> `level_town/purple_karim/complete`
   - item popup: **Vibrator** (0.5s delay)
   - sets `quest_purple_karim_complete`
5. Reward: **Vibrator**

### All Dialogs

| Dialog ID | NPC | Condition | Post-dialog actions |
|-----------|-----|-----------|---------------------|
| `level_town/purple_karim/done` | purple_karim | quest_purple_karim_complete=True | - |
| `level_town/purple_karim/complete` | purple_karim | three_headed_karim_paid=True | sets `quest_purple_karim_complete`; item popup: **Vibrator** (0.5s delay) |
| `level_town/purple_karim/waiting` | purple_karim | quest_purple_karim_active=True | - |
| `level_town/purple_karim/intro` | purple_karim | default | choice panel: "Wil je zijn schuld betalen?" |
| `level_jungle/hydra_body_1/dialog` | hydra_body_1 | default | sets `hydra_body_1_gone`; fades out (1.2s) |
| `level_jungle/hydra_body_2/dialog` | hydra_body_2 | default | sets `hydra_body_2_gone`; fades out (1.2s) |
| `level_jungle/hydra_body_3/dialog` | hydra_body_3 | default | sets `hydra_body_3_gone`; fades out (1.2s) |
| `level_jungle/three_headed_karim/encounter` | three_headed_karim | default | sets `three_headed_karim_paid`; fades out (1.5s) |

### State Keys

| Key | Meaning |
|-----|---------|
| `quest_purple_karim_active` | Player accepted Purple Karim's debt delivery quest |
| `hydra_body_1_gone` *(parallel: hydra_bodies)* | Hydra Body 1 has been dismissed and removed |
| `hydra_body_2_gone` *(parallel: hydra_bodies)* | Hydra Body 2 has been dismissed and removed |
| `hydra_body_3_gone` *(parallel: hydra_bodies)* | Hydra Body 3 has been dismissed and removed |
| `three_headed_karim_paid` | Payment delivered to Hydra Karim; player should return to Purple Karim |
| `quest_purple_karim_complete` | Quest fully resolved, Vibrator reward given |

---

## Red Karim's Problem

**Level**: `level_town` | **Reward**: Dildo
**NPCs**: **red_karim** (giver), **green_karim** (target)

> Green Karim needed to shut his mouth according to Red Karim. Miffy resolved this conflict by putting his foot down hard.

### Steps

1. Talk to **red_karim** -> `level_town/red_karim/intro` -> then (0.5s delay):
   - Choice: "Will you help Red Karim?"
     - **Accept the quest**: sets `quest_red_karim_accepted`, plays `level_town/red_karim/accept`
     - **Decline**: plays `level_town/red_karim/decline`
2. Talk to **green_karim** -> `level_town/green_karim/confronted`
   - sets `quest_green_karim_confronted`
3. Talk to **red_karim** -> `level_town/red_karim/complete`
   - item popup: **Dildo** (0.5s delay)
   - sets `quest_red_karim_complete`
4. Reward: **Dildo**

### All Dialogs

| Dialog ID | NPC | Condition | Post-dialog actions |
|-----------|-----|-----------|---------------------|
| `level_town/red_karim/done` | red_karim | quest_red_karim_complete=True | - |
| `level_town/red_karim/complete` | red_karim | quest_green_karim_confronted=True | sets `quest_red_karim_complete`; item popup: **Dildo** (0.5s delay) |
| `level_town/red_karim/waiting` | red_karim | quest_red_karim_accepted=True | - |
| `level_town/red_karim/intro` | red_karim | default | choice panel: "Will you help Red Karim?" |
| `level_town/green_karim/reformed` | green_karim | quest_red_karim_complete=True | - |
| `level_town/green_karim/confronted` | green_karim | quest_red_karim_accepted=True, quest_green_karim_confronted=False | sets `quest_green_karim_confronted` |
| `level_town/green_karim/default` | green_karim | default | - |

### State Keys

| Key | Meaning |
|-----|---------|
| `quest_red_karim_accepted` | Player agreed to help Red Karim silence Green Karim |
| `quest_green_karim_confronted` | Player has spoken to Green Karim about the complaint |
| `quest_red_karim_complete` | Quest fully resolved, Dildo reward given |

---

## Events

### Brown Karim Vanishes

**Level**: `level_town`
**NPCs**: **brown_karim** (event)

> Brown Karim delivers one cryptic line and permanently disappears from the world.

#### Flow

1. Talk to **brown_karim** -> `level_town/brown_karim/spooky`
   - fades out (1.5s, slides x+200)
   - sets `brown_karim_vanished`

#### State Keys

| Key | Meaning |
|-----|---------|
| `brown_karim_vanished` | Brown Karim has permanently left the world |

---
