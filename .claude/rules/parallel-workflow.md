# Parallel Workflow

## Starting a Parallel Session

Use Claude Code's built-in worktree flag to create isolated sessions:

```bash
# Feature work
claude -w feature-pause-menu

# Bug fixes
claude -w fix-respawn-flicker

# Research / investigation (read-only exploration)
claude -w research-enemy-ai
```

This creates `.claude/worktrees/<name>/` with a full copy of the repo on branch `worktree-<name>`.

## Naming Conventions

| Prefix      | Purpose                        | Example                     |
|-------------|--------------------------------|-----------------------------|
| `feature-`  | New gameplay/UI feature        | `feature-pause-menu`        |
| `fix-`      | Bug fix                        | `fix-respawn-flicker`       |
| `level-`    | Level building (LDtk + .tscn) | `level-rooftops`            |
| `ui-`       | Menu/HUD/overlay work          | `ui-health-bar-polish`      |
| `audio-`    | Music/SFX additions            | `audio-enemy-sfx`           |
| `research-` | Read-only investigation        | `research-tilemap-perf`     |
| `release-`  | Version bump + export + push   | `release-0-3-0`             |

## File Conflict Zones

These files are touched by almost every feature. Two sessions editing the same hub file will cause merge conflicts.

**HIGH CONFLICT RISK (one session at a time):**
- `core/EventBus.gd` — signal declarations (every new system adds signals)
- `core/Constants.gd` — physics/gameplay constants (every tuning change)
- `project.godot` — autoloads, input actions (new system registration)
- `docs/status.md` — session log (every session writes here)
- `CLAUDE.md` — directory tree (file additions/deletions)

**MEDIUM CONFLICT RISK:**
- `player/Player.gd` — player state/equipment (new mechanics)
- `game/GameScene.gd` — level loading, respawn (new gameplay systems)
- `player/Player.tscn` — new child nodes for player mechanics

**LOW CONFLICT RISK (safe to parallelize):**
- Individual state scripts (`player/states/*.gd`) — unless adding new states
- Menu scene scripts (`ui/menus/MenuScene.gd`, `ui/menus/OptionsScene.gd`, `ui/menus/ExtrasScene.gd`)
- Data definitions (`data/LevelDefs.gd`, `data/AchievementDefs.gd`, `data/ItemDefs.gd`)
- Shaders (`shaders/*.gdshader`)
- Level files (`levels/*/*.tscn`, `*.ldtk`)
- Audio assets (`assets/audio/`)
- Sprite assets (`assets/sprites/`)

## What to Parallelize vs. Keep Serial

**SAFE to run in parallel (different file domains):**
- Level building + Menu polish
- Audio work + Player state bug fix
- Shader work + Data definitions
- Research session + any other session

**MUST be serial (overlapping hub files):**
- Two features that both add EventBus signals
- Two features that both modify Player.gd
- Any work that adds autoloads to project.godot
- Version bump / release (touches Constants.gd, version.json, CLAUDE.md)

**Rule of thumb:** If two sessions would both edit a file in the HIGH CONFLICT RISK list, run them serially — finish one, merge, then start the next.

## Session Lifecycle

### Starting
1. Open a new terminal tab
2. `cd c:/Users/Robin/Desktop/codex`
3. `claude -w <name>`
4. Session reads CLAUDE.md, rules, and checks `docs/status.md`
5. Check the "Current Workstreams" section in status.md to see what other sessions are doing
6. Note which files you plan to touch

### During Work
- Stay within your file domain — do not edit files claimed by another session
- If you need to edit a hub file, check if another session is active on it
- Use `/compact` when context grows large (after 5+ file edits or 20+ messages)
- Use `/clear` to reset context completely when switching to unrelated subtask

### Finishing
1. Run headless Godot validation in the worktree
2. Commit your changes on the worktree branch
3. Switch to main, merge the worktree branch:
   ```bash
   cd c:/Users/Robin/Desktop/codex
   git merge worktree-<name>
   ```
4. Update `docs/status.md` on main with your session results
5. Claude auto-cleans the worktree on session exit

### Handoff Between Sessions
When session A finishes and session B needs the results:
1. Session A merges to main and updates status.md
2. Session B pulls main into its worktree: `git merge main`
3. Session B reads updated status.md for context

## Godot Validation in Worktrees

The path differs from main repo:

```bash
# Main repo:
"c:/Users/Robin/Desktop/Godot_v4.6.1-stable_win64.exe" --headless --path "c:/Users/Robin/Desktop/codex/godot_port" --quit 2>&1

# Worktree (adjust path):
"c:/Users/Robin/Desktop/Godot_v4.6.1-stable_win64.exe" --headless --path "c:/Users/Robin/Desktop/codex/.claude/worktrees/<name>/godot_port" --quit 2>&1
```

## Context Efficiency

- Use `/compact` after completing a subtask to compress conversation history
- Use `/clear` when pivoting to a completely new area of the codebase
- For large investigations, use `research-` prefix sessions — read-only, can run alongside anything
- Delegate codebase exploration to subagents to keep main context clean
- Read `docs/status.md` once at session start, update once at session end — avoid re-reading
