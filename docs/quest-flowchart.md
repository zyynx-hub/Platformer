# Quest Flowchart — Town NPCs + Jungle Village

**Source of truth**: [`docs/quest-registry.md`](quest-registry.md) — all NPCs, quest steps, state keys, dialog IDs, and dependencies. Update that file first, then regenerate this diagram.

Copy only the content between the fences (starting at `flowchart TD`) into [mermaid.live](https://mermaid.live) to render and export as PNG.

```mermaid
flowchart TD
    subgraph Street["Town Street"]
        START([Player enters Town])
        START --> DOOR1["Door1 at x:150<br/>Enter House 1"]
        START --> STREET_NPCS{Street NPCs}
        START --> DOOR2["Door2 at x:450<br/>Enter House 2"]
        START --> JUNGLE_PORTAL_NODE["Jungle Portal x:~1950<br/>Green vortex — always open"]

        STREET_NPCS --> BLACK["BLACK KARIM - Flavor NPC<br/>Wanders x:220-420<br/>No quest - repeats forever"]

        STREET_NPCS --> BROWN["BROWN KARIM - Spooky NPC<br/>Wanders x:550-800<br/>voice_pitch = 0.4"]
        BROWN --> VANISH["Vanish: music ducks -80dB<br/>slides offscreen + fades out<br/>brown_karim_vanished = true<br/>PERMANENTLY GONE"]

        STREET_NPCS --> PURPLE["PURPLE KARIM - Quest Giver<br/>Wanders x:1200-1700<br/>voice_pitch = 0.95"]
    end

    subgraph House1["House 1 Interior - Shop"]
        DOOR1 --> BLUE["BLUE KARIM - Shopkeeper<br/>pos x:120<br/>Greet → ShopPanel opens"]
        BLUE --> SHOP["Opens ShopPanel<br/>(extra_heart / speed_charm / town_key)"]
        SHOP --> EXIT1["Exit Door back to Town Street"]
    end

    subgraph House2["House 2 Interior - Quest Hub"]
        direction TB
        DOOR2 --> H2_NPCS["Two NPCs share this room"]

        H2_NPCS --> GREEN_DEFAULT["GREEN KARIM pos x:80 - Soldier<br/>Before quest accepted:<br/>flavor/rant dialog — repeats"]

        H2_NPCS --> RED_INTRO["RED KARIM pos x:140 - Quest Giver<br/>Hey! Jij ziet eruit als iemand<br/>die een probleem kan oplossen.<br/>Die groene naast je maakt mij helemaal gek."]
    end

    subgraph Quest_Red["Red Karim's Complaint"]
        RED_INTRO --> CHOICE{Will you help Red Karim?}

        CHOICE -->|Decline| RED_DECLINE["Serieus? Laat me nou echt zitten?<br/>...loops back to intro on next talk"]
        RED_DECLINE -.->|Talk again| RED_INTRO

        CHOICE -->|Accept| RED_ACCEPT["Oh YES, bedankt! Ik wist dat<br/>ik op je kon rekenen!<br/>Gewoon even naar links lopen..."]
        RED_ACCEPT --> SET_ACCEPTED["SET quest_red_karim_accepted = true"]

        SET_ACCEPTED --> RED_WAITING["Red Karim if talked to again:<br/>HIJ BLIJFT MAAR BIDDEN!!!<br/>repeats until quest done"]

        SET_ACCEPTED --> GREEN_UNLOCKED["Green Karim dialog CHANGES<br/>quest_red_karim_accepted = true<br/>AND quest_green_karim_confronted = false"]

        GREEN_UNLOCKED --> GREEN_CONFRONT["Player talks to GREEN KARIM:<br/>confronted dialog (4-line exchange)<br/>Player: Wtf man, rooie Karim heeft mij gestuurd...<br/>Green: ...Prima, zeg maar dat ik stil ben."]
        GREEN_CONFRONT --> SET_CONFRONTED["SET quest_green_karim_confronted = true"]

        SET_CONFRONTED --> RED_COMPLETE["Player talks to RED KARIM again:<br/>complete dialog (3 lines)<br/>EINDELIJK RUST! IK KAN HET NIET GELOVEN!<br/>Hier, pak deze dildo, you deserve it"]
        RED_COMPLETE --> REWARD_RED["ItemAcquiredPopup: Dildo"]
        REWARD_RED --> SET_COMPLETE_RED["SET quest_red_karim_complete = true"]

        SET_COMPLETE_RED --> DONE_RED["Red Karim forever: Het is zo rustig. Zo fijn.."]
        SET_COMPLETE_RED --> DONE_GREEN["Green Karim forever: reformed dialog"]
    end

    subgraph Quest_Purple["Purple Karim's Debt (auto-accept)"]
        PURPLE --> PURPLE_INTRO["purple_karim/intro dialog<br/>(10 lines, one_shot)<br/>No choice panel — auto-accepts"]
        PURPLE_INTRO --> SET_PURPLE_ACTIVE["SET quest_purple_karim_active = true"]
        SET_PURPLE_ACTIVE --> PURPLE_WAITING["Purple Karim if talked to again:<br/>purple_karim/waiting — repeatable nag"]
        SET_PURPLE_ACTIVE --> GO_JUNGLE["Player travels east to Jungle Portal<br/>x:~1950 — accessible any time"]
    end

    subgraph Jungle["Jungle Village (level_jungle)"]
        JUNGLE_PORTAL_NODE --> JUNGLE_ENTER([Player enters Jungle])
        GO_JUNGLE --> JUNGLE_ENTER
        JUNGLE_ENTER --> JUNGLE_DOOR["Door1 at x:~300<br/>Enter Jungle House Interior"]
        JUNGLE_ENTER --> JUNGLE_EXT{Jungle Exterior NPCs}

        JUNGLE_EXT --> HYDRA2["HYDRA BODY 2<br/>Wanders x:550-950<br/>dim purple, voice_pitch = 0.3"]
        JUNGLE_EXT --> HYDRA3["HYDRA BODY 3<br/>Wanders x:1000-1400<br/>dim purple, voice_pitch = 0.3"]

        JUNGLE_DOOR --> HYDRA1["HYDRA BODY 1<br/>x:120 standing still (inside house)<br/>dim purple, voice_pitch = 0.3"]

        HYDRA1 --> HYDRA1_FADE["'...' dialog → fades 1.2s → queue_free()"]
        HYDRA1_FADE --> SET_H1["SET hydra_body_1_gone = true"]

        HYDRA2 --> HYDRA2_FADE["'...' dialog → fades 1.2s → queue_free()"]
        HYDRA2_FADE --> SET_H2["SET hydra_body_2_gone = true"]

        HYDRA3 --> HYDRA3_FADE["'...' dialog → fades 1.2s → queue_free()"]
        HYDRA3_FADE --> SET_H3["SET hydra_body_3_gone = true"]

        SET_H1 --> HYDRA_CHECK{All 3 bodies gone?<br/>JungleLevelController}
        SET_H2 --> HYDRA_CHECK
        SET_H3 --> HYDRA_CHECK

        HYDRA_CHECK -->|No| WAIT_BODIES["Continue finding remaining bodies"]
        HYDRA_CHECK -->|Yes| THK_APPEARS["THREE-HEADED KARIM appears<br/>wander x:650-1150 — dark purple<br/>scale 1.3x, voice_pitch = 0.2"]

        THK_APPEARS --> THK_ENCOUNTER["Player talks to THREE-HEADED KARIM:<br/>three_headed_karim/encounter<br/>(6 Dutch lines, one_shot)"]
        THK_ENCOUNTER --> THK_FADE["_fade_and_leave(): fades 1.5s → queue_free()"]
        THK_FADE --> SET_PAID["SET three_headed_karim_paid = true"]

        SET_PAID --> PORTAL_BACK["Return through PortalBack x:~50<br/>Orange vortex → back to Town Street"]
    end

    subgraph Quest_Purple_End["Purple Karim — Completion"]
        PORTAL_BACK --> PURPLE_COMPLETE_TALK["Talk to PURPLE KARIM again:<br/>purple_karim/complete dialog<br/>(4 lines, one_shot)"]
        PURPLE_COMPLETE_TALK --> SET_PURPLE_DONE["SET quest_purple_karim_complete = true"]
        SET_PURPLE_DONE --> REWARD_PURPLE["ItemAcquiredPopup: Vibrator"]
        SET_PURPLE_DONE --> DONE_PURPLE["Purple Karim forever: purple_karim/done (1 line)"]
    end

    subgraph QuestStates["Quest State Keys - progress.cfg"]
        QS1["quest_red_karim_accepted"]
        QS2["quest_green_karim_confronted"]
        QS3["quest_red_karim_complete"]
        QS4["brown_karim_vanished"]
        QS5["quest_purple_karim_active"]
        QS6["hydra_body_1_gone"]
        QS7["hydra_body_2_gone"]
        QS8["hydra_body_3_gone"]
        QS9["three_headed_karim_paid"]
        QS10["quest_purple_karim_complete"]
    end

    style CHOICE fill:#ff9,stroke:#333
    style HYDRA_CHECK fill:#ff9,stroke:#333
    style SET_ACCEPTED fill:#cef,stroke:#333
    style SET_CONFRONTED fill:#cef,stroke:#333
    style SET_COMPLETE_RED fill:#9f9,stroke:#333
    style SET_PURPLE_ACTIVE fill:#cef,stroke:#333
    style SET_H1 fill:#cef,stroke:#333
    style SET_H2 fill:#cef,stroke:#333
    style SET_H3 fill:#cef,stroke:#333
    style SET_PAID fill:#cef,stroke:#333
    style SET_PURPLE_DONE fill:#9f9,stroke:#333
    style VANISH fill:#f99,stroke:#333
    style THK_FADE fill:#f99,stroke:#333
    style REWARD_RED fill:#9f9,stroke:#333
    style REWARD_PURPLE fill:#9f9,stroke:#333
    style RED_DECLINE fill:#fcc,stroke:#333
    style GREEN_UNLOCKED fill:#fcf,stroke:#333
    style DONE_RED fill:#9f9,stroke:#333
    style DONE_GREEN fill:#9f9,stroke:#333
    style DONE_PURPLE fill:#9f9,stroke:#333
```
