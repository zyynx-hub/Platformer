from __future__ import annotations

import json
from pathlib import Path


ORDER = [
    "core/constants.js",
    "core/build-info.js",
    "core/settings.js",
    "core/debug.js",
    "core/updater.js",
    "systems/update-manager.js",
    "worldmap/WorldMapManager.js",
    "worldmap/WorldMapView.js",
    "worldmap/data/world-map-data.js",
    "worldmap/progress/progress-manager.js",
    "worldmap/nodes/level-node.js",
    "worldmap/controller/player-map-controller.js",
    "worldmap/ui/world-map-ui.js",
    "worldmap/ui/shop-panel.js",
    "systems/beeper.js",
    "systems/jetpack.js",
    "level/level-1.js",
    "level/level-2.js",
    "level/level-3.js",
    "level/level-4.js",
    "level/level-5.js",
    "level/level-data.js",
    "scenes/boot-scene.js",
    "scenes/menu-scene.js",
    "scenes/world-map-scene.js",
    "scenes/extras-scene.js",
    "scenes/intro-scene.js",
    "scenes/options-scene.js",
    "scenes/game-scene.js",
    "scenes/ui-scene.js",
    "main.js",
]

BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"


def to_vlq_signed(value: int) -> int:
    return ((-value) << 1) + 1 if value < 0 else (value << 1)


def encode_vlq(value: int) -> str:
    vlq = to_vlq_signed(value)
    out = []
    while True:
        digit = vlq & 31
        vlq >>= 5
        if vlq > 0:
            digit |= 32
        out.append(BASE64[digit])
        if vlq <= 0:
            break
    return "".join(out)


def build_bundle(root: Path) -> None:
    js_dir = root / "js"
    bundle_path = js_dir / "app.bundle.js"
    map_path = js_dir / "app.bundle.js.map"

    sources = []
    sources_content = []
    generated_lines: list[str] = []
    line_metas: list[tuple[int, int]] = []

    prelude = [
        "(function (global) {",
        "  // Auto-generated bundle. Do not edit directly.",
        "  var Platformer = global.AnimePlatformer || (global.AnimePlatformer = {});",
        "",
    ]
    generated_lines.extend(prelude)
    line_metas.extend([(-1, -1)] * len(prelude))

    for source_index, rel in enumerate(ORDER):
        src_path = js_dir / rel
        text = src_path.read_text(encoding="utf-8")
        if not text.endswith("\n"):
            text += "\n"

        sources.append(rel)
        sources_content.append(text)

        generated_lines.append(f"  /* >>> {rel} */")
        line_metas.append((-1, -1))

        src_lines = text.splitlines()
        for i, ln in enumerate(src_lines):
            clean = ln.lstrip("\ufeff").strip()
            if clean == "window.Platformer = window.Platformer || {};":
                ln = "// [bundle] namespace init removed; using local Platformer namespace."
            generated_lines.append(ln)
            line_metas.append((source_index, i))

        generated_lines.append(f"  /* <<< {rel} */")
        generated_lines.append("")
        line_metas.extend([(-1, -1), (-1, -1)])

    postlude = [
        "})(window);",
        "",
    ]
    generated_lines.extend(postlude)
    line_metas.extend([(-1, -1)] * len(postlude))

    bundle_text = "\n".join(generated_lines)

    mapping_lines: list[str] = []
    prev_src = 0
    prev_src_line = 0
    prev_src_col = 0

    for src_idx, src_line in line_metas:
        if src_idx < 0:
            mapping_lines.append("")
            continue
        seg = [
            encode_vlq(0),
            encode_vlq(src_idx - prev_src),
            encode_vlq(src_line - prev_src_line),
            encode_vlq(0 - prev_src_col),
        ]
        prev_src = src_idx
        prev_src_line = src_line
        prev_src_col = 0
        mapping_lines.append("".join(seg))

    source_map = {
        "version": 3,
        "file": "app.bundle.js",
        "sourceRoot": "",
        "sources": sources,
        "sourcesContent": sources_content,
        "names": [],
        "mappings": ";".join(mapping_lines),
    }

    bundle_text += "//# sourceMappingURL=app.bundle.js.map\n"

    bundle_path.write_text(bundle_text, encoding="utf-8")
    map_path.write_text(json.dumps(source_map, separators=(",", ":")), encoding="utf-8")
    print(f"[bundle] wrote {bundle_path}")
    print(f"[bundle] wrote {map_path}")


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    build_bundle(root)
