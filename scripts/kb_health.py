"""
KB Health Check — validates knowledge base integrity.

Run from repo root:
    python scripts/kb_health.py

Checks:
  1. Phantom paths: every file in CLAUDE.md's directory tree exists on disk
  2. Dead links: every markdown [text](path) in active docs resolves
  3. Phaser contamination: no Phaser-era keywords in active docs
  4. Staleness: docs/status.md updated within 7 days
"""

import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
GODOT = REPO / "godot_port"

ACTIVE_DOCS = [
    REPO / "CLAUDE.md",
    REPO / ".claude" / "rules" / "godot-workflow.md",
    REPO / ".claude" / "rules" / "session-protocol.md",
    REPO / "docs" / "index.md",
    REPO / "docs" / "status.md",
    REPO / "docs" / "decisions.md",
    REPO / "docs" / "phaser-archive.md",
    REPO / "docs" / "archive" / "index.md",
    REPO / "godot_port" / "README.md",
]

PHASER_KEYWORDS = [
    r"PyInstaller",
    r"PyWebView",
    r"build_portable_exe",
    r"app\.bundle",
    r"desktop_launcher",
    r"runtime-debug\.log",
    r"updater\.log",
    r"build_js_bundle",
]

# These files intentionally reference Phaser — exclude from contamination check
CONTAMINATION_EXCLUDES = {"phaser-archive.md", "index.md"}

# Lines containing these patterns are intentional negations, not contamination
NEGATION_PATTERNS = [r"\bNo\s+PyInstaller\b", r"\bNo\s+PyWebView\b", r"\bnot\b.*\bPyInstaller\b"]


def _expand_entry(entry: str) -> list[str]:
    """Expand multi-file shorthand into individual filenames.

    Handles patterns like:
      "NPC.tscn + NPC.gd"        -> ["NPC.tscn", "NPC.gd"]
      "ProgressionTrigger.tscn + .gd"  -> ["ProgressionTrigger.tscn", "ProgressionTrigger.gd"]
      "Rock1.png, Rock2.png"     -> ["Rock1.png", "Rock2.png"]
      "Boot.tscn"                -> ["Boot.tscn"]
    """
    # Split on " + " or ", "
    parts = re.split(r"\s*[+,]\s*", entry)
    if len(parts) == 1:
        return [entry]

    base_name = Path(parts[0]).stem  # e.g. "NPC" from "NPC.tscn"
    result = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if p.startswith("."):
            # Shorthand like ".gd" -> use base name from first part
            result.append(base_name + p)
        else:
            result.append(p)
    return result


def check_phantom_paths():
    """Parse CLAUDE.md directory tree, verify each file exists."""
    claude_md = REPO / "CLAUDE.md"
    if not claude_md.exists():
        return ["CLAUDE.md not found"]

    text = claude_md.read_text(encoding="utf-8")

    # Extract the directory tree code block
    tree_match = re.search(
        r"## Directory Structure.*?```\n(.*?)```", text, re.DOTALL
    )
    if not tree_match:
        return ["Could not find directory tree in CLAUDE.md"]

    tree_block = tree_match.group(1)

    # Build full paths by tracking indent-based directory context.
    # Each line's indent depth determines its parent directory.
    # Example:
    #   ├── scripts/
    #   │   ├── core/Constants.gd    -> scripts/core/Constants.gd
    #   ├── assets/sprites/
    #   │   └── Cavernas.png         -> assets/sprites/Cavernas.png
    dir_stack = []  # [(indent_depth, dir_name), ...]
    failures = []

    for line in tree_block.splitlines():
        if not line.strip():
            continue

        # Measure indent: count characters before the first alphanumeric/dot
        indent_match = re.match(r"^([│├└─\s]+)", line)
        indent = len(indent_match.group(1)) if indent_match else 0

        # Extract the entry name (strip tree chars, take before comment)
        entry = re.sub(r"^[│├└─\s]+", "", line).split("#")[0].strip()
        if not entry or entry == "godot_port/":
            continue

        # Pop directories from stack that are at same or deeper indent
        while dir_stack and dir_stack[-1][0] >= indent:
            dir_stack.pop()

        if entry.endswith("/"):
            # Directory entry — push onto stack
            dir_stack.append((indent, entry.rstrip("/")))
            full_dir = GODOT / "/".join(d for _, d in dir_stack)
            if not full_dir.is_dir():
                failures.append(f"  {'/'.join(d for _, d in dir_stack)}/ (directory not found)")
        else:
            # Expand multi-file shorthand: "A.tscn + .gd", "A.png, B.png"
            files = _expand_entry(entry)
            for f in files:
                parts = [d for _, d in dir_stack] + [f]
                full_path = GODOT / "/".join(parts)
                if not full_path.exists():
                    failures.append(f"  {'/'.join(parts)} (not found)")

    return failures


def check_dead_links():
    """Scan active docs for markdown links, verify targets exist."""
    link_pattern = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
    failures = []

    for doc in ACTIVE_DOCS:
        if not doc.exists():
            continue
        text = doc.read_text(encoding="utf-8")
        doc_dir = doc.parent

        for match in link_pattern.finditer(text):
            target = match.group(2)

            # Skip external URLs, anchors, and code references
            if target.startswith(("http://", "https://", "#", "mailto:")):
                continue

            # Strip anchor from path
            target_path = target.split("#")[0]
            if not target_path:
                continue

            resolved = (doc_dir / target_path).resolve()
            if not resolved.exists():
                failures.append(
                    f"  {doc.relative_to(REPO)}  ->  {target} (not found)"
                )

    return failures


def check_phaser_contamination():
    """Search active docs for Phaser-era keywords."""
    pattern = re.compile("|".join(PHASER_KEYWORDS), re.IGNORECASE)
    negation = re.compile("|".join(NEGATION_PATTERNS), re.IGNORECASE)
    warnings = []

    for doc in ACTIVE_DOCS:
        if not doc.exists():
            continue
        if doc.name in CONTAMINATION_EXCLUDES:
            continue

        text = doc.read_text(encoding="utf-8")

        # Skip sections that are explicitly about legacy/archive
        in_legacy_section = False
        for i, line in enumerate(text.splitlines(), 1):
            if re.match(r"^##\s*(Legacy|Archive)", line, re.IGNORECASE):
                in_legacy_section = True
                continue
            if re.match(r"^##\s", line) and in_legacy_section:
                in_legacy_section = False

            if in_legacy_section:
                continue

            if pattern.search(line) and not negation.search(line):
                warnings.append(
                    f"  {doc.relative_to(REPO)}:{i}  {line.strip()[:80]}"
                )

    return warnings


def check_staleness():
    """Check docs/status.md was updated within 7 days."""
    status = REPO / "docs" / "status.md"
    if not status.exists():
        return ["docs/status.md not found"]

    text = status.read_text(encoding="utf-8")
    date_match = re.search(r"Last updated:\s*(\d{4}-\d{2}-\d{2})", text)
    if not date_match:
        return ["docs/status.md has no 'Last updated' date"]

    last_updated = datetime.strptime(date_match.group(1), "%Y-%m-%d")
    age = (datetime.now() - last_updated).days

    if age > 7:
        return [f"  docs/status.md last updated {age} days ago (threshold: 7)"]

    return []


def main():
    print("KB Health Check")
    print()

    all_ok = True

    # 1. Phantom paths
    phantom = check_phantom_paths()
    if phantom:
        print(f"  Phantom paths:        FAIL")
        for f in phantom:
            print(f)
        all_ok = False
    else:
        print(f"  Phantom paths:        PASS")

    # 2. Dead links
    dead = check_dead_links()
    if dead:
        print(f"  Dead links:           FAIL")
        for f in dead:
            print(f)
        all_ok = False
    else:
        print(f"  Dead links:           PASS")

    # 3. Phaser contamination
    contamination = check_phaser_contamination()
    if contamination:
        print(f"  Phaser contamination: WARN")
        for w in contamination:
            print(w)
    else:
        print(f"  Phaser contamination: PASS")

    # 4. Staleness
    stale = check_staleness()
    if stale:
        print(f"  Staleness:            WARN")
        for s in stale:
            print(s)
    else:
        print(f"  Staleness:            PASS")

    print()
    if all_ok and not contamination and not stale:
        print("  Result: HEALTHY")
        return 0
    elif not all_ok:
        print("  Result: FAIL")
        return 1
    else:
        print("  Result: WARN")
        return 0


if __name__ == "__main__":
    sys.exit(main())
