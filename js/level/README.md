# World Content Layout

Each world lives under `js/level/<world_id>/`.

Required files:
- `world.config.json`
- `nodes.json`

Optional subfolders:
- `backgrounds/` theme layers
- `shop/` shop inventory definitions
- `levels/` level metadata and references
- `enemies/` per-world enemy metadata

## JSON schema expectations

### world.config.json
```json
{
  "id": "world_tutorial",
  "name": "Tutorial World",
  "orderIndex": 0,
  "theme": {
    "font": "Consolas",
    "colors": {
      "bgTop": "#071638"
    }
  },
  "backgroundLayers": [
    { "src": "path/to/layer.png", "parallax": 0.3, "alpha": 0.8 }
  ],
  "lineStyle": {
    "width": 3,
    "color": "#67e8f9",
    "glowWidth": 8,
    "glowColor": "#0f2f63"
  },
  "defaultNodeStyle": {
    "radius": 18,
    "triggerRadius": 40,
    "labelSize": 16
  }
}
```

### nodes.json
```json
{
  "startNodeId": "start",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "pos": { "x": 180, "y": 640 },
      "state": "unlocked",
      "levelRef": "Level_01",
      "shopRef": "shop_01",
      "ui": { "title": "Start", "hint": "Press Enter/E to confirm" },
      "autoWalkTo": "next_node_id"
    }
  ],
  "edges": [
    { "from": "start", "to": "next", "kind": "straight", "unlockRule": "complete:start" }
  ]
}
```

Supported node types:
- `start`
- `tutorial`
- `level`
- `shop`
- `junction`
- `boss`
- `locked`

## Adding a new world
1. Create `js/level/<world_id>/` with `world.config.json` and `nodes.json`.
2. Add background images (optional) under `backgrounds/`.
3. Register it in `js/worldmap/WorldMapManager.js` via `registerWorld(...)`.
4. Validate by launching the game and checking debug logs for load success.

## Asset sourcing (safe defaults)
- Prefer free-to-use assets with clear license terms:
- Kenney.nl (CC0)
- OpenGameArt.org (check item license per asset)
- Itch.io free packs (verify commercial/use terms)
- Keep license notes in your project when importing non-CC0 assets.
