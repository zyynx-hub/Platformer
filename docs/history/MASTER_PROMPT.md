# Master Prompt: Project Memory + Zero-Loss Documentation Protocol

Use this prompt at the start of every future session on this repository.

---

You are working on this project with strict continuity requirements.
Your primary objective is: **no context loss, no unresolved issue drift, and full traceability of decisions over time**.

## Non-Negotiable Rules
1. Treat `CHAT_HISTORY_RAW.md` as canonical long-form history.
2. Treat `docs/history/` as the maintained memory index.
3. Never close an issue without explicit evidence (log, repro result, or code-path proof).
4. Every important claim must be traceable to either:
   - file/path + line reference, or
   - `CHAT_HISTORY_RAW.md` line reference.
5. Never overwrite historical docs with summaries that remove details. Append/update with traceability.

## Mandatory Inputs To Read First (Every Session)
- `docs/history/README.md`
- `docs/history/PROJECT_CONTEXT.md`
- `docs/history/ARCHITECTURE_AND_DECISIONS.md`
- `docs/history/INCIDENTS_AND_ROOT_CAUSES.md`
- `docs/history/OPERATIONS_AND_RELEASES.md`
- `docs/history/CHRONOLOGICAL_TRACE.md`
- `docs/history/PER_FILE_AND_COMMIT_DECISIONS.md`
- `docs/history/UNRESOLVED_ITEMS_TRACKER.md`
- Latest runtime evidence files if present:
  - `updater.log`
  - `runtime-debug.log`
  - `%LOCALAPPDATA%\AnimePlatformer\update_state.json` (if relevant)

## Session Workflow (Always Follow)
1. **Context Sync**
   - Read the mandatory inputs above.
   - Produce a short "Current Understanding" section before coding.
2. **Issue Ledger Pass**
   - Review `docs/history/UNRESOLVED_ITEMS_TRACKER.md`.
   - For each touched subsystem, explicitly list related unresolved items.
3. **Plan Before Edit**
   - Define target behavior, root cause hypothesis, and proof criteria.
4. **Implement Minimally**
   - Make the smallest safe change set.
5. **Verify**
   - Run reproducible checks (build/run/log assertions).
   - Mark each checked unresolved item as one of:
     - `Resolved`
     - `Still Open`
     - `Not Reproducible`
     - `Duplicate`
6. **Document Delta**
   - Update docs/history files with:
     - what changed,
     - why,
     - evidence,
     - remaining risk.
7. **Handoff Block (Required at end of every task)**
   - Changed files
   - Checks run + results
   - Unresolved items status changes
   - Follow-up actions

## Required Documentation Outputs Per Meaningful Change
When code or behavior changes, update all applicable files:
- `docs/history/CHRONOLOGICAL_TRACE.md`
  - add line-referenced event entries.
- `docs/history/PER_FILE_AND_COMMIT_DECISIONS.md`
  - append commit/tag/push + per-file rationale.
- `docs/history/UNRESOLVED_ITEMS_TRACKER.md`
  - move verified items between states with evidence notes.
- If architectural behavior changed:
  - update `docs/history/ARCHITECTURE_AND_DECISIONS.md`.
- If operating/build/update process changed:
  - update `docs/history/OPERATIONS_AND_RELEASES.md`.

## Issue State Standard
Use this strict schema for each tracked issue:
- `ID`: stable identifier (create if missing)
- `Status`: Open | Resolved | Not Reproducible | Duplicate
- `First Seen`: source line/date/tag
- `Subsystem`: updater/menu/world-map/gameplay/options/build/CI/etc.
- `Repro Steps`
- `Expected`
- `Actual`
- `Evidence`: logs/screenshots/line refs
- `Resolution`: commit/file refs
- `Last Verified Build/Tag`

## Evidence Standard (No Guessing)
- If saying "fixed", include at least one of:
  - passing repro steps,
  - relevant log no longer present,
  - direct code-path guard with file reference.
- If uncertain, keep status Open. Do not infer closure.

## Quality Gate Before Declaring Task Complete
All must be true:
1. No touched unresolved item left without updated status.
2. Docs updated for decisions and verification evidence.
3. Build/runtime checks completed or explicitly blocked with reason.
4. Clear statement of residual risk (if any).

## Response Format Requirement (For Every Final Response)
Include these sections, in order:
1. `Outcome`
2. `What Changed`
3. `Verification`
4. `Unresolved Tracker Updates`
5. `Residual Risk / Next Checks`

## Priority Behavior
- Prefer correctness + traceability over speed.
- Prefer explicit logs/status transitions over silent fallback.
- Preserve historical continuity; do not delete context unless it is duplicate and archived.

---

Short operator command for future use:
"Apply MASTER_PROMPT.md protocol before any implementation and keep docs/history fully synchronized with evidence-backed issue states."
