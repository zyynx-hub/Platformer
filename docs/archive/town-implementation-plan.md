# Town Test Environment — Implementation Plan

> Read this entire plan before starting implementation. Execute step by step.

---

## Overview

This is a **2D town environment**. No platforms — flat ground, straight horizontal line. The camera scrolls left/right as the player walks offscreen in either direction (same as existing behavior, no changes needed).

The town contains **two enterable houses** and **two outdoor NPCs**. The goal is to test: dialogue systems, NPC interaction, entering/exiting buildings, shop menus, option menus, a mini-quest with state tracking, inventory (optional), and NPC movement/behavior.

---

## 1. Building Entry/Exit System

### Entering a building
- Two houses exist in the town. Each has a door.
- When the player stands in front of a door and presses **W (up)** or **E (interact)** — choose whichever feels better — trigger a **fade to black** transition, then load the interior scene of that building.
- The fade should be quick (not slow cinematic — snappy).

### Exiting a building
- When inside a building, pressing **S (down)** or the assigned interact button near the exit triggers the same fade-to-black transition back to the town exterior.
- The player should reappear in front of the door they entered.

---

## 2. NPC Interaction System

- All NPCs are interacted with by standing in front of them and pressing **E**.
- When the player interacts with any NPC, that NPC should **face the player character**.
- Dialogue appears on screen (text box / dialogue box).
- Some NPCs have multi-line dialogue that advances on input (E or Enter or click).
- Some NPCs trigger option menus after dialogue.

---

## 3. House 1 — The Shop

### Entity: Blue Karim (Shopkeeper)

**On interact (E):**

1. Blue Karim says:
   - `"Yo mate, got any cash for my magical goods?"`
   - `"No BS bro, potions, magical fruits, lava boots to walk through fire, I got everything."`

2. A **shop menu** opens listing items for sale (placeholder items are fine — e.g., Potion, Magical Fruit, Lava Boots with made-up prices).

3. **If the player selects an item but doesn't have enough money:**
   - `"Bro, I still gotta pay rent, you're gonna have to dig a little deeper into those pockets."`

4. **If the player selects an item and has enough money:**
   - `"Ah, good choice mate. You're gonna love this one."`
   - Deduct money, add item to inventory.

> **Note:** The item/inventory system is **optional** for now. If you implement it, great. If not, just make the shop menu appear and display the dialogue responses. The priority is the town, interactions, and dialogue — not inventory management.

---

## 4. House 2 — The Couple

### Entity 1: Green Karim (The Soldier)

**Default dialogue on interact (E) — flavour text:**
- `"Bro, the war in Iran was rough, late nights every single evening."`
- `"But hey, made enough cash to live off my pension now, nice!"`
- `"As long as my little red guy does the laundry and cooks, haha!"`

**Post-quest dialogue** (after player accepts the mini-quest from Red Karim — see below):

On interact, the player character speaks:
- **Player:** `"Could you start treating your man right? You think there's nothing to do around the house or what?"`
- **Green Karim:** `"Mind your own business? Watch it pal, or you'll catch a fist to the jaw."`
- **Player:** `"You're the one who should watch it. You'll bone your buddy alright, but picking up a vacuum cleaner? No way."`
- **Green Karim:** `"Maybe you're right… I should behave better. Thanks for the talk."`

After this exchange, Green Karim's state changes — the quest progresses. The player should now go talk to Red Karim to complete the quest.

### Entity 2: Red Karim (Green Karim's worried partner)

**On interact (E):**
- `"Man, my husband does absolutely nothing all day."`
- `"His rough days in the army make him think he gets the last word…"`
- `"I don't even know what to do about it anymore…"`
- `"Could you help me out?"`

**Option menu appears with 2 choices:**

**Option 1 (Reject):**
- **Player:** `"Get lost with that stuff, drop dead."`
- **Red Karim:** `"Okay... no problem, I'll figure it out on my own."`
- Result: Nothing changes. No quest started. The player can return later to pick up the quest (the option menu should reappear).

**Option 2 (Accept):**
- **Player:** `"Sure, I'll teach that bum a lesson."`
- **Red Karim:** `"Oh, thank you... I hope you can get through to him."`
- Result: **Mini-quest starts.** The player must now go interact with Green Karim (triggers the post-quest dialogue above).

**After completing the Green Karim confrontation, return to Red Karim:**
- **Red Karim:** `"Thank you for talking to my man! I don't know how to repay you."`
- **Player:** `"Got anything in stock?"`
- **Red Karim:** `"Sure! Take this, I won't be needing it for a while…"`
- **Popup:** Item "Dildo" added to inventory. **Sidequest complete.**

> **Note:** Whether the item actually functions in inventory is optional. At minimum, show the popup/notification confirming quest completion.

---

## 5. Exterior Town — Roaming NPCs

### Entity 1: Black Karim

**Movement:** Walks around randomly/spontaneously — NOT a fixed repeating pattern. Sometimes drifts a bit to the right, sometimes to the left. This should feel alive and organic, not robotic.

**On interact (E) — flavour text:**
- `"Yoo, booted up Elden Ring again the other day, great game!"`
- `"But yeah well, League is better."`

### Entity 2: Brown Karim

**Movement:** Same random wandering behavior as Black Karim.

**On interact (E):**
1. **Background music stops.**
2. Brown Karim says: `"…"`
3. Brown Karim **runs offscreen** and **disappears permanently** (removed from the scene — does not come back, even if the player re-enters the area).
4. This is a spooky moment. Consider a brief pause/beat before he runs.

---

## 6. State & Quest Tracking

The following states need to be tracked:

| State | Default | Trigger |
|---|---|---|
| `quest_red_karim_accepted` | `false` | Player chooses Option 2 with Red Karim |
| `quest_green_karim_confronted` | `false` | Player completes dialogue with Green Karim post-quest |
| `quest_red_karim_complete` | `false` | Player returns to Red Karim after confrontation |
| `brown_karim_vanished` | `false` | Player interacts with Brown Karim |

- Green Karim's dialogue changes based on `quest_red_karim_accepted`.
- Red Karim's dialogue changes based on quest progression.
- Brown Karim is removed from the scene when `brown_karim_vanished` is true.
- If Option 1 was chosen for Red Karim, the player can return and the option menu should reappear (quest not locked out).

---

## 7. Summary of What This Tests

- Town navigation (flat scrolling environment)
- Entering and exiting buildings (fade-to-black transitions)
- NPC dialogue system (multi-line, advancing on input)
- NPC facing the player on interaction
- Shop menu UI (with conditional responses)
- Option/choice menus in dialogue
- Mini-quest system with state changes
- Dialogue that changes based on game state
- Random NPC wandering (organic, non-patterned movement)
- One-time triggered events (Brown Karim disappearing)
- Optional: inventory system, item popups

---

## Implementation Order (Suggested)

1. Flat town scene with two houses (exteriors with doors)
2. Building entry/exit with fade-to-black transitions
3. House interiors (simple rooms)
4. NPC interaction system (E to talk, NPC faces player)
5. Dialogue box system (multi-line, advances on input)
6. Blue Karim — shopkeeper dialogue + shop menu
7. Green Karim — default flavour dialogue
8. Red Karim — dialogue + option menu (2 choices)
9. Quest state tracking system
10. Green Karim — conditional post-quest dialogue
11. Red Karim — quest completion dialogue + reward popup
12. Black Karim — random wandering + flavour dialogue
13. Brown Karim — random wandering + spooky disappearance event
14. (Optional) Inventory system with item management
