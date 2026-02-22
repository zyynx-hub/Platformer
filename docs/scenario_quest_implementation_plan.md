# Scenario Quest — Implementation Plan

> Read this entire plan before starting implementation. Execute step by step.

---

## Overview

This quest introduces a **new NPC (Purple Karim)** in the existing town, a **second village/area** accessible through some kind of transition (described as "further into the jungle"), a **multi-step fetch quest** involving three mysterious NPCs that merge into a three-headed boss NPC, and a **quest log system**. This also serves as a test for quest logging, tracking active/inactive/completed quests, and narrative-style quest descriptions.

---

## 1. Quest Log System (Test This Immediately)

### Requirements
Build a **quest log UI** that tracks all quests with the following states:

| State | Meaning |
|---|---|
| **Active** | Quest has been accepted, currently in progress |
| **Completed** | Quest finished, reward received |
| **Inactive** | Quest exists but hasn't been picked up yet |

### What the quest log must display per quest:
- **Quest name**
- **Status** (Active / Completed / Inactive)
- **Reward** (shown upfront)
- **Description** — This is NOT a mechanical step-by-step checklist. It should read like a **narrative summary** of what happened. Write it as a story, not instructions.

### Example (from the Red/Green Karim quest in the previous town test):
> **Quest:** Red Karim's Problem  
> **Status:** Completed  
> **Reward:** Dildo  
> **Description:** *"Green Karim needed to shut his mouth according to Red Karim. Miffy resolved this conflict by putting his foot down hard."*

This quest log should be testable immediately with the existing Red/Green Karim sidequest from the town environment, then extended to this new quest.

---

## 2. New NPC — Purple Karim (Town Exterior)

**Location:** Outside in the existing town, walking around (same random wandering behavior as Black/Brown Karim).

### On interact (E):

Purple Karim delivers the following dialogue (advances line by line):

1. `"Yo, alles goed maat?"`
2. `"Ja? Nou, met mij zeker niet…"`
3. `"Laatst nieuwe PC gekocht, maar betaal in termijnen, moet elke keer naar die gozer gaan in het dorp verder in het oerwoud."`
4. `"Mijn kankerknie maat… Kan helemaal niet lopen of niks, zou je mijn geld kunnen brengen naar die gozer? Dalijk stuurt hij zijn maten om mijn PC te slopen."`
5. `"Als je dit voor me doet, ik zweer ik zal je belonen."`
6. `"Is wel een duister figuur trouwens… Ze noemen hem de Hydra Karim, omdat hij drie lichamen heeft of iets in die geest."`
7. `"Praat met elk lichaam, dan komen ze bij elkaar, en daarna komt de driekoppige Karim."`
8. `"Vage gozer… Maar goed, ik kreeg 40% korting."`
9. `"Zelfs met de korting weet ik niet of dit het waard is geweest…"`
10. `"Achja… veel success. En alvast bedankt."`

### Quest behavior:
- **AUTO-ACCEPT.** There is no option menu — the quest is automatically accepted after the dialogue ends.
- Quest log updates immediately: status = **Active**.

---

## 3. Second Village — The Jungle Village

### Scene Setup
- A new area/scene separate from the main town (new town will be added to the level select.)
- Flat ground, same style as the main town.
- Contains **one house** (enterable, same entry/exit system as the main town).
- The village should feel distinct from the main town (different backdrop or color palette if possible).

### Entities in the Jungle Village

**3 Karims** — the "three bodies" of Hydra Karim:

| NPC | Location | Behavior |
|---|---|---|
| Hydra Body 1 | Inside the house | Standing still |
| Hydra Body 2 | Outside, wandering | Random walk cycle |
| Hydra Body 3 | Outside, wandering | Random walk cycle |

### Interaction with each body:

- The **order of interaction does not matter** — the player can talk to them in any sequence.
- Upon interact (E), each body says: `"…"`
- After speaking, the body **fades into thin air** (disappears permanently, removed from scene).

### After all three bodies have been interacted with:

- A new NPC spawns **outside**: **Three-Headed Karim** (wandering).
- This is the merged form of the three bodies.

---

## 4. Three-Headed Karim — Dialogue

### On interact (E):

... (81 lines left)

ik.txt
9 KB
Goomerang — 12:53 AM
Image
﻿

# Scenario Quest — Implementation Plan

> Read this entire plan before starting implementation. Execute step by step.

---

## Overview

This quest introduces a **new NPC (Purple Karim)** in the existing town, a **second village/area** accessible through some kind of transition (described as "further into the jungle"), a **multi-step fetch quest** involving three mysterious NPCs that merge into a three-headed boss NPC, and a **quest log system**. This also serves as a test for quest logging, tracking active/inactive/completed quests, and narrative-style quest descriptions.

---

## 1. Quest Log System (Test This Immediately)

### Requirements
Build a **quest log UI** that tracks all quests with the following states:

| State | Meaning |
|---|---|
| **Active** | Quest has been accepted, currently in progress |
| **Completed** | Quest finished, reward received |
| **Inactive** | Quest exists but hasn't been picked up yet |

### What the quest log must display per quest:
- **Quest name**
- **Status** (Active / Completed / Inactive)
- **Reward** (shown upfront)
- **Description** — This is NOT a mechanical step-by-step checklist. It should read like a **narrative summary** of what happened. Write it as a story, not instructions.

### Example (from the Red/Green Karim quest in the previous town test):
> **Quest:** Red Karim's Problem  
> **Status:** Completed  
> **Reward:** Dildo  
> **Description:** *"Green Karim needed to shut his mouth according to Red Karim. Miffy resolved this conflict by putting his foot down hard."*

This quest log should be testable immediately with the existing Red/Green Karim sidequest from the town environment, then extended to this new quest.

---

## 2. New NPC — Purple Karim (Town Exterior)

**Location:** Outside in the existing town, walking around (same random wandering behavior as Black/Brown Karim).

### On interact (E):

Purple Karim delivers the following dialogue (advances line by line):

1. `"Yo, alles goed maat?"`
2. `"Ja? Nou, met mij zeker niet…"`
3. `"Laatst nieuwe PC gekocht, maar betaal in termijnen, moet elke keer naar die gozer gaan in het dorp verder in het oerwoud."`
4. `"Mijn kankerknie maat… Kan helemaal niet lopen of niks, zou je mijn geld kunnen brengen naar die gozer? Dalijk stuurt hij zijn maten om mijn PC te slopen."`
5. `"Als je dit voor me doet, ik zweer ik zal je belonen."`
6. `"Is wel een duister figuur trouwens… Ze noemen hem de Hydra Karim, omdat hij drie lichamen heeft of iets in die geest."`
7. `"Praat met elk lichaam, dan komen ze bij elkaar, en daarna komt de driekoppige Karim."`
8. `"Vage gozer… Maar goed, ik kreeg 40% korting."`
9. `"Zelfs met de korting weet ik niet of dit het waard is geweest…"`
10. `"Achja… veel success. En alvast bedankt."`

### Quest behavior:
- **AUTO-ACCEPT.** There is no option menu — the quest is automatically accepted after the dialogue ends.
- Quest log updates immediately: status = **Active**.

---

## 3. Second Village — The Jungle Village

### Scene Setup
- A new area/scene separate from the main town (new town will be added to the level select.)
- Flat ground, same style as the main town.
- Contains **one house** (enterable, same entry/exit system as the main town).
- The village should feel distinct from the main town (different backdrop or color palette if possible).

### Entities in the Jungle Village

**3 Karims** — the "three bodies" of Hydra Karim:

| NPC | Location | Behavior |
|---|---|---|
| Hydra Body 1 | Inside the house | Standing still |
| Hydra Body 2 | Outside, wandering | Random walk cycle |
| Hydra Body 3 | Outside, wandering | Random walk cycle |

### Interaction with each body:

- The **order of interaction does not matter** — the player can talk to them in any sequence.
- Upon interact (E), each body says: `"…"`
- After speaking, the body **fades into thin air** (disappears permanently, removed from scene).

### After all three bodies have been interacted with:

- A new NPC spawns **outside**: **Three-Headed Karim** (wandering).
- This is the merged form of the three bodies.

---

## 4. Three-Headed Karim — Dialogue

### On interact (E):

1. `"Spreek, maat."`
2. `"Oh, je komt voor Purple Karim? Deze gozer is bijna te laat met zijn betaling…"`
3. `"Ik steek hem lek, ik zoek hem op, penetreer zijn gladde kont en gooi zijn PC in de rivier."`
4. `"Wat is dit? Jij wilt voor hem betalen?"`
5. `"Dan heeft hij geluk. Noem het uitstel van executie, want het is en blijft een wanbetaler."`
6. `"Vooruit, scheer je weg, kankerschorem. Laat karim weten dat zijn kontje voor mij altijd een ingang zal blijven."`

### After dialogue ends:
- **Three-Headed Karim fades away** (disappears permanently).
- Quest state updates — payment delivered.
- Player must now return to the main town to talk to Purple Karim.

---

## 5. Quest Completion — Back to Purple Karim

### On interact (E) after returning:

1. `"Nu al terug? Zo, dat was snel."`
2. `"Dus er zijn geen problemen van gekomen? Gelukkig maar…"`
3. `"Als ik nog een keer een opmerking over mijn kontje hoor, dan vlucht ik naar het buitenland."`
4. `"Afijn, hier is je beloning, gebruik het met beleid, neef."`

### Reward:
- **Popup:** Item **"Vibrator"** added to inventory.
- **Quest log updates:** Status = **Completed**.

### Quest log entry (narrative style):
> **Quest:** Purple Karim's Debt  
> **Status:** Completed  
> **Reward:** Vibrator  
> **Description:** *"Purple Karim couldn't pay off his PC debt because of his busted knee. Miffy delivered the payment to the terrifying three-headed Hydra Karim deep in the jungle village, narrowly avoiding threats of violence. Purple Karim was relieved and grateful."*

---

## 6. State Tracking

| State | Default | Trigger |
|---|---|---|
| `quest_purple_karim_active` | `false` | Dialogue with Purple Karim ends (auto-accept) |
| `hydra_body_1_gone` | `false` | Player interacts with body 1 |
| `hydra_body_2_gone` | `false` | Player interacts with body 2 |
| `hydra_body_3_gone` | `false` | Player interacts with body 3 |
| `three_headed_karim_spawned` | `false` | All 3 bodies have been interacted with |
| `three_headed_karim_paid` | `false` | Dialogue with Three-Headed Karim ends |
| `quest_purple_karim_complete` | `false` | Player returns to Purple Karim after payment |

### Logic Flow:
1. All three `hydra_body_X_gone` = true → spawn Three-Headed Karim, set `three_headed_karim_spawned` = true
2. `three_headed_karim_paid` = true → Three-Headed Karim fades away, player can return to town
3. Interact with Purple Karim while `three_headed_karim_paid` = true → deliver reward, set `quest_purple_karim_complete` = true

---

## 7. Summary of What This Tests

- **Quest log system** — active/inactive/completed states, narrative descriptions, reward display
- **Auto-accept quests** (no option menu, quest starts after dialogue)
- **Multi-area navigation** — transitioning between the main town and a second village
- **Multi-step quest logic** — talk to 3 NPCs in any order → trigger new NPC → complete dialogue → return to quest giver
- **NPC spawning based on conditions** (Three-Headed Karim appears only after all bodies are gone)
- **NPC fade/disappear effects** (bodies fading into air, Three-Headed Karim fading away)
- **Dialogue changes based on quest state** (Purple Karim's dialogue changes post-quest)
- **Inventory reward system** (Vibrator item popup)

---

## 8. Implementation Order (Suggested)

1. Quest log UI — build the system, test with existing Red/Green Karim quest first
2. Purple Karim NPC — add to town exterior with random wandering + dialogue
3. Auto-accept quest mechanic + quest log integration
4. Second village scene — flat ground, one house, transitions from main town
5. Three Hydra Body NPCs — 1 inside house, 2 wandering outside
6. Body interaction → "…" dialogue → fade/disappear effect
7. Conditional spawn: Three-Headed Karim appears when all bodies are gone
8. Three-Headed Karim dialogue sequence
9. Three-Headed Karim fade-away after dialogue
10. Purple Karim post-quest dialogue + Vibrator reward popup
11. Quest log completion entry with narrative description
scenario_quest_implementation_plan.md