# Quest Registry Rule

## Mandatory: Always Update `docs/quest-registry.md`

Any time you add, modify, or remove an NPC, quest, dialog file, or quest state key, you **must** update `docs/quest-registry.md` in the same session. This is not optional.

`docs/quest-registry.md` is the single canonical source of truth for all content state. It must never fall out of sync with the implementation.

---

## What Triggers an Update

| Change | Registry sections to update |
|--------|-----------------------------|
| New NPC added | NPC Registry + Location Map (position table) |
| NPC script changed (new dialog logic) | NPC Registry entry (dialog selection logic, on-dialog-end behavior) |
| New dialog `.tres` file | Dialog Registry (new row with ID, file, one_shot, condition, voice_pitch, line count) |
| New quest state key | Quest State Key Registry (who sets, who reads, meaning) |
| New quest (full flow) | Quest Registry (step table), Dependency Graph |
| Quest reward changed | Quest Registry entry + Shop Registry if applicable |
| NPC removed or moved | Location Map + NPC Registry |

---

## Checklist (copy into your TodoWrite when adding a quest)

```
[ ] NPC Registry — add/update entry with script, placement, x, voice_pitch, role, dialog logic
[ ] Location Map — add/update position table row for each new NPC placement
[ ] Dialog Registry — add a row for every new .tres file created
[ ] Quest State Key Registry — add a row for every new state key
[ ] Quest Registry — add full step-by-step flow table for any new quest
[ ] Dependency Graph — extend the plain-text graph with the new quest branch
[ ] docs/quest-flowchart.md — extend Mermaid diagram to match new flow
[ ] CLAUDE.md directory tree — update NPC count/list and any new directories
```

---

## File Location

```
docs/quest-registry.md       ← repo (update here)
docs/quest-flowchart.md      ← update after registry is complete
```

The registry lives in the repo, not in memory/. The `MEMORY.md` entry for quest registry is a pointer only — keep it pointing at this file, not duplicating content.

---

## Format Reference

When adding a new dialog row to the Dialog Registry table:

```
| `level_id/npc_name/moment` | `dialogs/npc_name/moment.tres` | true/false | Condition string | voice_pitch | Line count |
```

When adding a new state key:

```
| `key_name` | bool | false | ScriptName — event that sets it | NPC scripts that read it | Human-readable meaning |
```
