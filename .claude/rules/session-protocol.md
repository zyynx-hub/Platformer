# Session Protocol

## Session Start

1. CLAUDE.md is auto-loaded (project context)
2. Read `docs/status.md` for current state, open issues, and next priorities
3. Check the **Current Workstreams** table in `docs/status.md` — note which files are claimed by other sessions
4. If using a worktree (`claude -w`), update the workstreams table with your name and claimed files
5. Understand the user's goal before editing

## Session End (mandatory, every session)

Update `docs/status.md`:
- Bump `Last updated` date
- Move completed items from Broken/Untested to Working
- Add any new issues discovered
- Update the Session Log with what changed
- Set Next Session priorities
- Update **Current Workstreams** table: mark your entry as DONE (or PAUSED if continuing later)

## Issue Tracking (lightweight)

- Add issues to the **Broken / Untested** section of `docs/status.md`
- Format: one-line description with subsystem tag
- Mark resolved by moving to **Working** with a one-line evidence note
- No formal IDs needed — the description IS the identifier

## Doc Integrity

When you add, rename, or delete files in `godot_port/`, update CLAUDE.md's directory tree in the same turn.

Standalone health check (zero token cost — run in terminal, not in chat):
```bash
python scripts/kb_health.py
```

## Scope Discipline

- No feature expansion during bug-fix work
- Keep changes scoped to the user's stated goal
- Do not mix unrelated refactors into active work

## Chat History

If chat history exceeds 1 GB, delete before starting:
```powershell
Remove-Item "$env:APPDATA\Claude\chat_history*"
```
