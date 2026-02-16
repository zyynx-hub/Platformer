from __future__ import annotations

import argparse
import json
from pathlib import Path


def chunks(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def read_ldtk_level(data: dict, level_identifier: str | None):
    levels = data.get("levels") or []
    if not levels:
        raise ValueError("No levels found in LDtk file.")
    if level_identifier:
        for level in levels:
            if str(level.get("identifier")) == level_identifier:
                return level
        raise ValueError(f"Level '{level_identifier}' not found.")
    return levels[0]


def read_intgrid_layer(level: dict, layer_identifier: str | None):
    layers = level.get("layerInstances") or []
    if not layers:
        raise ValueError("No layerInstances in selected level.")
    if layer_identifier:
        for layer in layers:
            if str(layer.get("__identifier")) == layer_identifier:
                return layer
        raise ValueError(f"Layer '{layer_identifier}' not found.")
    for layer in layers:
        if str(layer.get("__type")) == "IntGrid":
            return layer
    raise ValueError("No IntGrid layer found.")


def intgrid_to_matrix(layer: dict):
    w = int(layer.get("__cWid") or 0)
    h = int(layer.get("__cHei") or 0)
    vals = layer.get("intGridCsv") or []
    if w <= 0 or h <= 0 or len(vals) != w * h:
        raise ValueError(f"Invalid IntGrid dimensions: {w}x{h}, values={len(vals)}")
    rows = []
    for row_vals in chunks(vals, w):
        rows.append([1 if int(v) != 0 else 0 for v in row_vals])
    return rows


def downsample_matrix_threshold(grid: list[list[int]], factor: int, threshold: float):
    if factor <= 1:
        return grid
    h = len(grid)
    w = len(grid[0]) if h else 0
    out_h = h // factor
    out_w = w // factor
    out = [[0 for _ in range(out_w)] for _ in range(out_h)]
    threshold = max(0.0, min(1.0, float(threshold)))
    required = max(1, int((factor * factor) * threshold + 0.9999))
    for oy in range(out_h):
        for ox in range(out_w):
            solid_count = 0
            for y in range(oy * factor, oy * factor + factor):
                for x in range(ox * factor, ox * factor + factor):
                    if grid[y][x]:
                        solid_count += 1
            out[oy][ox] = 1 if solid_count >= required else 0
    return out


def matrix_to_line_commands(grid: list[list[int]], solid_char: str = "#"):
    h = len(grid)
    w = len(grid[0]) if h else 0
    cmds = []
    for y in range(h):
        x = 0
        while x < w:
            if grid[y][x] == 0:
                x += 1
                continue
            start = x
            while x + 1 < w and grid[y][x + 1] == 1:
                x += 1
            end = x
            cmds.append({"op": "line", "x1": start, "x2": end, "y": y, "ch": solid_char})
            x += 1
    return cmds


def find_spawn(grid: list[list[int]]):
    h = len(grid)
    w = len(grid[0]) if h else 0
    for y in range(1, h):
        for x in range(w):
            if grid[y][x] == 0 and grid[y - 1][x] == 1:
                return x, y
    # Fallback near top-left.
    return max(0, min(1, w - 1)), max(0, min(1, h - 1))


def main():
    parser = argparse.ArgumentParser(description="Convert LDtk IntGrid layer into game level JSON commands.")
    parser.add_argument("--in", dest="in_path", required=True, help="Path to .ldtk file")
    parser.add_argument("--out", dest="out_path", required=True, help="Output level JSON path")
    parser.add_argument("--level", dest="level_id", default=None, help="LDtk level identifier (default first)")
    parser.add_argument("--layer", dest="layer_id", default=None, help="LDtk IntGrid layer identifier (default first IntGrid)")
    parser.add_argument("--target-grid", dest="target_grid", type=int, default=32, help="Target game tile size in pixels")
    parser.add_argument(
        "--merge-threshold",
        dest="merge_threshold",
        type=float,
        default=0.5,
        help="When downsampling, fraction of solid source cells required to mark target cell as solid (0.0-1.0).",
    )
    parser.add_argument("--add-spawn", dest="add_spawn", action="store_true", help="Add a spawn marker (S)")
    args = parser.parse_args()

    in_path = Path(args.in_path)
    out_path = Path(args.out_path)
    data = json.loads(in_path.read_text(encoding="utf-8"))

    level = read_ldtk_level(data, args.level_id)
    layer = read_intgrid_layer(level, args.layer_id)
    grid = intgrid_to_matrix(layer)

    src_grid_size = int(layer.get("__gridSize") or data.get("defaultGridSize") or args.target_grid)
    factor = 1
    if src_grid_size > 0 and args.target_grid > src_grid_size and args.target_grid % src_grid_size == 0:
        factor = args.target_grid // src_grid_size
    if factor > 1:
        grid = downsample_matrix_threshold(grid, factor, args.merge_threshold)

    h = len(grid)
    w = len(grid[0]) if h else 0
    commands = matrix_to_line_commands(grid, "#")
    if args.add_spawn:
        sx, sy = find_spawn(grid)
        commands.append({"op": "many", "items": [[sx, sy]], "ch": "S"})

    out_obj = {
        "width": w,
        "height": h,
        "commands": commands,
        "meta": {
            "source": str(in_path),
            "ldtkLevel": str(level.get("identifier")),
            "ldtkLayer": str(layer.get("__identifier")),
            "sourceGridSize": src_grid_size,
            "targetGridSize": args.target_grid,
            "downsampleFactor": factor,
            "mergeThreshold": args.merge_threshold,
        },
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_obj, indent=2), encoding="utf-8")
    print(f"[ok] wrote {out_path} ({w}x{h}) commands={len(commands)} factor={factor}")


if __name__ == "__main__":
    main()
