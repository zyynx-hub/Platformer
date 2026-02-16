# World Map Notes

## Add a new level node
1. Edit `js/worldmap/data/world-map-data.js`.
2. Add a node object in `nodes` with:
   - `id` unique node id
   - `levelId` display id
   - `gameLevel` numeric level passed to `GameScene`
   - `displayName`, `difficulty`, `x`, `y`
   - `requires` array of prerequisite node ids
   - `next` array of connected unlock node ids
   - optional `tutorial` text
3. Add visual path by linking from `next` (lines are auto-drawn).

## Unlock logic
- Completion unlocks all `next` nodes whose `requires` are all completed.
- Progress is stored in localStorage key: `anime_platformer_progress_v1`.

## Entry flow
- Main menu `Play` -> `WorldMapScene`.
- Walk onto a node and press `E`/`Enter` to launch level.
- `Esc` returns to menu.