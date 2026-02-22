#!/usr/bin/env python3
"""
quest_tool.py -- Quest graph validation and visualization

Usage:
  python tools/quest_tool.py --validate
      Check all quest JSON files for structural errors.

  python tools/quest_tool.py --graph
      Print auto-generated Mermaid flowchart (all quests) to stdout.

  python tools/quest_tool.py --graph --write
      Overwrite docs/quest-flowchart.md with the full chart.

  python tools/quest_tool.py --graph --quest <quest_id>
      Print a Mermaid flowchart for a single quest to stdout.

  python tools/quest_tool.py --graph --quest <quest_id> --write
      Write single-quest chart to docs/quest-flowchart-<id>.md.

  python tools/quest_tool.py --story
      Print a narrative storyline Markdown document to stdout.

  python tools/quest_tool.py --story --write
      Write storyline doc to docs/storyline.md.

  python tools/quest_tool.py --html
      Print a static HTML report (all quests) to stdout.

  python tools/quest_tool.py --html --write
      Write HTML report to docs/quest-report.html.

  python tools/quest_tool.py --npc <npc_id>
      Print the dialog selection logic and post-dialog actions for one NPC.

  python tools/quest_tool.py --quest <quest_id>
      Print a summary of one quest: steps, state keys, reward.

  python tools/quest_tool.py --list
      List all loaded quests/events with their state keys.
"""

import json
import re
import sys
import argparse
import hashlib
import html as _html
from pathlib import Path
from datetime import date

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
TOOLS_DIR      = Path(__file__).parent
GODOT_DIR      = TOOLS_DIR.parent
QUESTS_DIR     = GODOT_DIR / "data" / "quests"
FLOWCHART_FILE = GODOT_DIR.parent / "docs" / "quest-flowchart.md"
STORYLINE_FILE = GODOT_DIR.parent / "docs" / "storyline.md"
HTML_FILE      = GODOT_DIR.parent / "docs" / "quest-report.html"

DIALOG_ID_RE = re.compile(r'^level_\w+/\w+/\w+$')

# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

def load_all() -> dict:
    """Load every *.json file from data/quests/ and return as {id: data}."""
    quests = {}
    for path in sorted(QUESTS_DIR.glob("*.json")):
        with open(path, encoding="utf-8") as fh:
            try:
                data = json.load(fh)
            except json.JSONDecodeError as e:
                print(f"  ERROR: {path.name}: invalid JSON -- {e}", file=sys.stderr)
                continue
        qid = data.get("id", path.stem)
        quests[qid] = data
    return quests

# ---------------------------------------------------------------------------
# Helpers for extracting quest data
# ---------------------------------------------------------------------------

def all_state_keys(quests: dict) -> set:
    keys = set()
    for q in quests.values():
        for sk in q.get("state_keys", []):
            keys.add(sk["key"])
    return keys

def all_complete_keys(quests: dict) -> set:
    return {q["complete_key"] for q in quests.values() if q.get("complete_key")}

def iter_actions(actions: list):
    """Recursively yield every action dict in an action list (handles choice_panel)."""
    for a in actions:
        yield a
        if a.get("action") == "choice_panel":
            for sub in a.get("on_accept", []) + a.get("on_decline", []):
                yield sub

def get_set_keys(quest: dict) -> set:
    keys = set()
    for npc_data in quest.get("npcs", {}).values():
        for actions in npc_data.get("on_dialog_end", {}).values():
            for a in iter_actions(actions):
                if a.get("action") == "set_key":
                    keys.add(a["key"])
    return keys

def get_required_keys(quest: dict) -> set:
    keys = set()
    for npc_data in quest.get("npcs", {}).values():
        for entry in npc_data.get("dialog_selection", []):
            keys.update(entry.get("requires", {}).keys())
        aw = npc_data.get("appears_when", {})
        keys.update(aw.get("all_true", []))
        keys.update(aw.get("all_false", []))
    return keys

def get_all_dialog_refs(quest: dict) -> set:
    dialogs = set()
    for npc_data in quest.get("npcs", {}).values():
        for entry in npc_data.get("dialog_selection", []):
            if "dialog" in entry:
                dialogs.add(entry["dialog"])
        for dialog_id, actions in npc_data.get("on_dialog_end", {}).items():
            dialogs.add(dialog_id)
            for a in iter_actions(actions):
                if a.get("action") == "play_dialog":
                    dialogs.add(a["dialog"])
    return dialogs

def find_setter(quest: dict, key: str):
    """Return (npc_id, dialog_id) that sets a given state key, or None."""
    for npc_id, npc_data in quest.get("npcs", {}).items():
        for dialog_id, actions in npc_data.get("on_dialog_end", {}).items():
            for a in iter_actions(actions):
                if a.get("action") == "set_key" and a.get("key") == key:
                    return (npc_id, dialog_id)
    return None

def has_choice_for_key(quest: dict, key: str) -> bool:
    """Return True if the key is set inside a choice_panel on_accept branch."""
    for npc_data in quest.get("npcs", {}).values():
        for actions in npc_data.get("on_dialog_end", {}).values():
            for a in actions:
                if a.get("action") == "choice_panel":
                    for sub in a.get("on_accept", []):
                        if sub.get("action") == "set_key" and sub.get("key") == key:
                            return True
    return False

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate(quests: dict) -> int:
    """Run all checks. Returns number of errors found."""
    errors = 0
    declared_keys = all_state_keys(quests)
    valid_complete_keys = all_complete_keys(quests)

    for qid, q in quests.items():
        prefix = f"  [{q.get('type','?')}] {qid}"
        errs = []

        for field in ("id", "type", "name"):
            if not q.get(field):
                errs.append(f"missing required field '{field}'")

        qtype = q.get("type", "")
        if qtype == "quest":
            for field in ("active_key", "complete_key"):
                if not q.get(field):
                    errs.append(f"type=quest requires '{field}'")

        for prereq in q.get("prerequisites", []):
            if prereq not in valid_complete_keys:
                errs.append(f"prerequisite '{prereq}' does not match any quest's complete_key")

        for dialog_id in get_all_dialog_refs(q):
            if not DIALOG_ID_RE.match(dialog_id):
                errs.append(f"dialog ID '{dialog_id}' does not match pattern level_X/npc/moment")

        for key in get_required_keys(q):
            if key not in declared_keys:
                errs.append(f"condition key '{key}' not declared in any quest's state_keys")

        for key in get_set_keys(q):
            if key not in declared_keys:
                errs.append(f"set_key '{key}' not declared in any quest's state_keys")

        seen = set()
        for sk in q.get("state_keys", []):
            k = sk.get("key", "")
            if k in seen:
                errs.append(f"duplicate state_key '{k}'")
            seen.add(k)

        actually_set = get_set_keys(q)
        for sk in q.get("state_keys", []):
            k = sk["key"]
            if k not in actually_set:
                errs.append(f"state_key '{k}' is declared but no action sets it in this quest")

        if errs:
            print(f"{prefix} -- {len(errs)} error(s):")
            for e in errs:
                print(f"    FAIL {e}")
            errors += len(errs)
        else:
            print(f"{prefix} -- OK")

    print()
    if errors == 0:
        print(f"  {len(quests)} file(s) validated, 0 errors")
    else:
        print(f"  {len(quests)} file(s) validated, {errors} error(s) found")

    return errors

# ---------------------------------------------------------------------------
# Mermaid helpers (shared between full and single-quest generation)
# ---------------------------------------------------------------------------

def _mid(text: str) -> str:
    """Sanitize text to a valid Mermaid node ID."""
    return re.sub(r'[^a-zA-Z0-9]', '_', text)

def _quest_mermaid_nodes(q: dict, pfx: str, indent: str = "  ") -> list:
    """
    Return a list of Mermaid lines for a single quest's state key chain.
    pfx      -- sanitized prefix for node IDs (unique per quest)
    indent   -- leading whitespace for each line
    """
    lines = []
    state_keys = q.get("state_keys", [])

    if not state_keys:
        lines.append(f"{indent}{pfx}_EMPTY([no state keys])")
        return lines

    # Group consecutive keys with the same parallel_group together
    groups = []
    current_group = None
    for sk in state_keys:
        pg = sk.get("parallel_group")
        if pg and pg == current_group:
            groups[-1].append(sk)
        else:
            current_group = pg
            groups.append([sk])

    prev_nodes = [f"{pfx}_S"]
    lines.append(f"{indent}{pfx}_S([start])")

    for group in groups:
        if len(group) == 1:
            sk = group[0]
            key = sk["key"]
            k_id = f"{pfx}_{_mid(key).upper()}"

            setter = find_setter(q, key)
            is_choice = has_choice_for_key(q, key)
            label = ""
            if setter:
                moment = setter[1].rsplit("/", 1)[-1]
                label = f'|"{"choice: " if is_choice else ""}{setter[0]}: {moment}"|'

            for prev in prev_nodes:
                lines.append(f"{indent}{prev} -->{label} {k_id}(\"{key}\")")
            prev_nodes = [k_id]

        else:
            pg_name = group[0].get("parallel_group", "parallel")
            join_id = f"{pfx}_{_mid(pg_name).upper()}_JOIN"

            for sk in group:
                key = sk["key"]
                k_id = f"{pfx}_{_mid(key).upper()}"

                setter = find_setter(q, key)
                label = ""
                if setter:
                    moment = setter[1].rsplit("/", 1)[-1]
                    label = f'|"any order: {setter[0]}: {moment}"|'

                for prev in prev_nodes:
                    lines.append(f"{indent}{prev} -->{label} {k_id}(\"{key}\")")
                lines.append(f"{indent}{k_id} --> {join_id}{{all done?}}")

            prev_nodes = [join_id]

    reward = q.get("reward", {})
    if reward.get("type") == "item":
        r_id = f"{pfx}_REWARD"
        item = reward["item_id"]
        for prev in prev_nodes:
            lines.append(f"{indent}{prev} --> {r_id}([\"reward: {item}\"])")

    return lines

# ---------------------------------------------------------------------------
# Mermaid — full (all quests)
# ---------------------------------------------------------------------------

def generate_mermaid(quests: dict) -> str:
    lines = [
        "<!-- AUTO-GENERATED by tools/quest_tool.py -- do not edit by hand -->",
        "<!-- Run: python tools/quest_tool.py --graph --write -->",
        "",
        "```mermaid",
        "flowchart TD",
    ]

    for qid, q in quests.items():
        qname = q.get("name", qid)
        pfx   = _mid(qid).upper()[:16]

        lines.append("")
        lines.append(f'  subgraph {pfx}["{qname}"]')
        lines.append(f"    direction LR")
        lines.extend(_quest_mermaid_nodes(q, pfx, indent="    "))
        lines.append("  end")

    # Cross-quest prerequisite edges
    prereq_lines = []
    for qid, q in quests.items():
        pfx = _mid(qid).upper()[:16]
        for prereq_key in q.get("prerequisites", []):
            for other_id, other_q in quests.items():
                if other_q.get("complete_key") == prereq_key:
                    other_pfx = _mid(other_id).upper()[:16]
                    prereq_lines.append(
                        f'  {other_pfx}_REWARD -.->|"{prereq_key}"| {pfx}_S'
                    )
    if prereq_lines:
        lines.append("")
        lines.append("  %% Cross-quest prerequisites")
        lines.extend(prereq_lines)

    lines.append("```")
    return "\n".join(lines)

# ---------------------------------------------------------------------------
# Mermaid — single quest
# ---------------------------------------------------------------------------

def generate_mermaid_single(quests: dict, quest_id: str) -> str:
    q = quests.get(quest_id)
    if not q:
        return f"<!-- Quest '{quest_id}' not found -->"

    qname = q.get("name", quest_id)
    pfx   = _mid(quest_id).upper()[:16]

    lines = [
        f"<!-- Quest: {quest_id} -->",
        f"<!-- {qname} -->",
        f"<!-- Run: python tools/quest_tool.py --graph --quest {quest_id} -->",
        "",
        "```mermaid",
        "flowchart LR",
        "",
    ]
    lines.extend(_quest_mermaid_nodes(q, pfx, indent="  "))
    lines.append("```")
    return "\n".join(lines)

# ---------------------------------------------------------------------------
# HTML report
# ---------------------------------------------------------------------------

def _esc(s) -> str:
    return _html.escape(str(s))

def _search_text(q: dict) -> str:
    parts = [
        q.get("id", ""),
        q.get("name", ""),
        q.get("level", ""),
        q.get("active_key", ""),
        q.get("complete_key", ""),
    ]
    for sk in q.get("state_keys", []):
        parts.append(sk.get("key", ""))
        parts.append(sk.get("meaning", ""))
    for npc_id, npc_data in q.get("npcs", {}).items():
        parts.append(npc_id)
        parts.append(npc_data.get("role", ""))
    reward = q.get("reward", {})
    parts.append(reward.get("item_id", ""))
    return " ".join(p.lower() for p in parts if p)

def _key_chip(k: str, extra_class: str = "") -> str:
    cls = ("key-chip " + extra_class).strip()
    return f'<span class="{cls}">{_esc(k)}</span>'

def _print_action_html(a: dict, depth: int = 0) -> str:
    pad = "&nbsp;" * (depth * 4)
    act = a.get("action", "?")
    if act == "set_key":
        return f'<div class="action">{pad}<span class="act-kw">set_key</span> {_key_chip(a["key"])}</div>'
    elif act == "item_popup":
        delay = a.get("delay", 0)
        delay_txt = f' <span class="act-meta">delay {delay}s</span>' if delay else ""
        return f'<div class="action">{pad}<span class="act-kw">item_popup</span> <span class="act-item">{_esc(a["item_id"])}</span>{delay_txt}</div>'
    elif act == "play_dialog":
        return f'<div class="action">{pad}<span class="act-kw">play_dialog</span> <span class="act-dialog">{_esc(a["dialog"])}</span></div>'
    elif act == "fade_and_remove":
        extra = f', slide_x={a["slide_x"]}' if "slide_x" in a else ""
        return f'<div class="action">{pad}<span class="act-kw">fade_and_remove</span> <span class="act-meta">{a.get("duration","?")}s{extra}</span></div>'
    elif act == "choice_panel":
        delay = a.get("delay", 0)
        delay_txt = f' <span class="act-meta">delay {delay}s</span>' if delay else ""
        inner = f'<div class="action">{pad}<span class="act-kw">choice_panel</span> <span class="act-meta">&ldquo;{_esc(a["prompt"])}&rdquo;</span>{delay_txt}</div>'
        for i, choice in enumerate(a.get("choices", [])):
            branch = "on_accept" if i == 0 else "on_decline"
            inner += f'<div class="action act-branch">{pad}&nbsp;&nbsp;&nbsp;&nbsp;<span class="act-branch-label">[{i}] {_esc(choice)}</span></div>'
            for sub in a.get(branch, []):
                inner += _print_action_html(sub, depth + 2)
        return inner
    else:
        return f'<div class="action">{pad}<span class="act-kw">{_esc(act)}</span></div>'

def _quest_card_html(q: dict) -> str:
    qid      = q.get("id", "?")
    name     = q.get("name", qid)
    qtype    = q.get("type", "quest")
    level    = q.get("level", "?")
    prereqs  = q.get("prerequisites", [])
    active_key   = q.get("active_key", "")
    complete_key = q.get("complete_key", "")
    reward   = q.get("reward", {})
    npcs     = q.get("npcs", {})
    state_keys   = q.get("state_keys", [])
    secondary    = q.get("secondary_levels", [])
    search   = _search_text(q)

    type_badge   = f'<span class="badge badge-{qtype}">{qtype}</span>'
    prereq_badge = '<span class="badge badge-prereq">prereqs</span>' if prereqs else ""

    # ---- Basics section ----
    secondary_row = ""
    if secondary:
        secondary_row = f'<div class="row"><span class="row-label">also</span><span class="row-value">{_esc(", ".join(secondary))}</span></div>'

    reward_html = ""
    if reward.get("type") == "item":
        reward_html = f'<span class="reward-item">{_esc(reward["item_id"])}</span>'
    else:
        reward_html = '<span class="muted">none</span>'

    # ---- Prerequisites ----
    prereq_section = ""
    if prereqs:
        chips = "".join(_key_chip(p) for p in prereqs)
        prereq_section = f'''<div class="section">
        <div class="section-title">Prerequisites</div>
        <div>{chips}</div>
      </div>'''

    # ---- Quest keys ----
    keys_section = ""
    if active_key or complete_key:
        ak = f'<div><span class="row-label">active</span>{_key_chip(active_key, "active")}</div>' if active_key else ""
        ck = f'<div><span class="row-label">complete</span>{_key_chip(complete_key, "complete")}</div>' if complete_key else ""
        keys_section = f'''<div class="section">
        <div class="section-title">Quest Keys</div>
        {ak}{ck}
      </div>'''

    # ---- NPCs ----
    npc_section = ""
    if npcs:
        npc_rows = ""
        for npc_id, npc_data in npcs.items():
            role = npc_data.get("role", "")

            # Dialog selection rules
            sel_rows = ""
            for entry in npc_data.get("dialog_selection", []):
                req = entry.get("requires", {})
                dialog = entry.get("dialog", "?")
                if req:
                    conds = ", ".join(f"{k}={v}" for k, v in req.items())
                    sel_rows += f'<div class="sel-row"><span class="sel-cond">[{_esc(conds)}]</span> &rarr; <span class="act-dialog">{_esc(dialog)}</span></div>'
                else:
                    sel_rows += f'<div class="sel-row"><span class="sel-cond">[default]</span> &rarr; <span class="act-dialog">{_esc(dialog)}</span></div>'

            # On dialog end actions
            on_end_rows = ""
            for did, actions in npc_data.get("on_dialog_end", {}).items():
                acts_html = "".join(_print_action_html(a) for a in actions)
                on_end_rows += f'''<div class="on-end-block">
              <div class="on-end-trigger">after <span class="act-dialog">{_esc(did)}</span>:</div>
              {acts_html}
            </div>'''

            npc_rows += f'''<div class="npc-block">
            <div class="npc-header">
              <span class="npc-id">{_esc(npc_id)}</span>
              <span class="npc-role">{_esc(role)}</span>
            </div>
            {('<div class="sub-title">dialog selection</div>' + sel_rows) if sel_rows else ""}
            {('<div class="sub-title">on dialog end</div>' + on_end_rows) if on_end_rows else ""}
          </div>'''

        npc_section = f'''<div class="section">
        <div class="section-title">NPCs ({len(npcs)})</div>
        {npc_rows}
      </div>'''

    # ---- State keys ----
    sk_section = ""
    if state_keys:
        sk_rows = ""
        for sk in state_keys:
            k       = sk.get("key", "")
            meaning = sk.get("meaning", "")
            set_by  = sk.get("set_by", "")
            pg      = sk.get("parallel_group", "")
            pg_note = f' <span class="muted">[parallel: {_esc(pg)}]</span>' if pg else ""
            sk_rows += f'''<div class="sk-row">
            <div>{_key_chip(k)}{pg_note}</div>
            <div class="sk-meaning">{_esc(meaning)}</div>
            <div class="sk-setby">{_esc(set_by)}</div>
          </div>'''
        sk_section = f'''<div class="section">
        <div class="section-title">State Keys ({len(state_keys)})</div>
        {sk_rows}
      </div>'''

    return f'''<div class="card type-{qtype}" data-search="{_esc(search)}">
  <div class="card-header" onclick="toggleCard(this)">
    <div class="card-title">
      <div class="card-name">{_esc(name)}</div>
      <div class="card-id">{_esc(qid)}</div>
    </div>
    <div class="card-badges">{type_badge}{prereq_badge}<span class="chevron">&#9654;</span></div>
  </div>
  <div class="card-body">
    <div class="section">
      <div class="row"><span class="row-label">level</span><span class="row-value">{_esc(level)}</span></div>
      {secondary_row}
      <div class="row"><span class="row-label">reward</span><span class="row-value">{reward_html}</span></div>
    </div>
    {prereq_section}
    {keys_section}
    {npc_section}
    {sk_section}
  </div>
</div>'''

# CSS is defined as a plain string (no format variables inside)
_HTML_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #111827; color: #d1d5db; font-family: 'Courier New', monospace; font-size: 13px; }
header { background: #1f2937; padding: 14px 24px; border-bottom: 1px solid #374151; }
header h1 { color: #f9fafb; font-size: 1.05em; letter-spacing: 0.04em; }
header p { color: #9ca3af; font-size: 0.78em; margin-top: 3px; }
header code { color: #a5b4fc; }
#search-bar { padding: 10px 24px; background: #1f2937; border-bottom: 1px solid #374151; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
#search { background: #111827; border: 1px solid #374151; color: #d1d5db; padding: 6px 10px; font-family: inherit; font-size: 0.88em; width: 320px; }
#search:focus { outline: 1px solid #3b82f6; }
.stats { color: #9ca3af; font-size: 0.78em; }
#quest-list { padding: 14px 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 10px; align-items: start; }
.card { background: #1f2937; border: 1px solid #374151; border-radius: 3px; overflow: hidden; }
.card.type-quest { border-left: 3px solid #3b82f6; }
.card.type-event { border-left: 3px solid #f59e0b; }
.card-header { padding: 9px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: flex-start; user-select: none; gap: 8px; }
.card-header:hover { background: #374151; }
.card-title { flex: 1; min-width: 0; }
.card-name { color: #f9fafb; font-size: 0.88em; }
.card-id { color: #6b7280; font-size: 0.7em; margin-top: 2px; font-style: italic; }
.card-badges { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
.badge { font-size: 0.67em; padding: 2px 5px; border-radius: 2px; white-space: nowrap; }
.badge-quest { background: #1d4ed8; color: #bfdbfe; }
.badge-event { background: #92400e; color: #fde68a; }
.badge-prereq { background: #374151; color: #9ca3af; }
.chevron { color: #6b7280; font-size: 0.72em; line-height: 1; transition: transform 0.15s; display: inline-block; }
.card.open .chevron { transform: rotate(90deg); }
.card-body { display: none; padding: 0 12px 10px; border-top: 1px solid #374151; }
.card.open .card-body { display: block; }
.section { margin-top: 10px; }
.section-title { color: #6b7280; font-size: 0.68em; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #2d3748; }
.row { display: flex; gap: 8px; margin-bottom: 3px; align-items: baseline; }
.row-label { color: #6b7280; min-width: 72px; font-size: 0.8em; flex-shrink: 0; }
.row-value { color: #d1d5db; font-size: 0.8em; }
.key-chip { display: inline-block; background: #111827; border: 1px solid #374151; padding: 1px 5px; font-size: 0.7em; color: #93c5fd; margin: 1px 2px 1px 0; border-radius: 2px; }
.key-chip.complete { color: #86efac; border-color: #166534; }
.key-chip.active { color: #fbbf24; border-color: #92400e; }
.muted { color: #6b7280; }
.reward-item { color: #fbbf24; font-size: 0.82em; }
.npc-block { margin-bottom: 8px; padding: 6px 8px; background: #111827; border: 1px solid #2d3748; border-radius: 2px; }
.npc-header { display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px; }
.npc-id { color: #c4b5fd; font-size: 0.82em; font-weight: bold; }
.npc-role { color: #9ca3af; font-size: 0.75em; }
.sub-title { color: #6b7280; font-size: 0.68em; text-transform: uppercase; letter-spacing: 0.05em; margin: 5px 0 3px; }
.sel-row { font-size: 0.78em; margin-bottom: 2px; }
.sel-cond { color: #6b7280; }
.on-end-block { margin-bottom: 5px; }
.on-end-trigger { font-size: 0.75em; color: #9ca3af; margin-bottom: 2px; }
.action { font-size: 0.78em; margin-bottom: 1px; }
.act-kw { color: #f472b6; }
.act-dialog { color: #a5b4fc; }
.act-item { color: #fbbf24; }
.act-meta { color: #9ca3af; }
.act-branch { margin-left: 8px; }
.act-branch-label { color: #6b7280; }
.sk-row { margin-bottom: 6px; }
.sk-meaning { color: #9ca3af; font-size: 0.77em; padding-left: 8px; margin-top: 2px; }
.sk-setby { color: #6b7280; font-size: 0.72em; padding-left: 8px; }
.no-results { padding: 60px 24px; color: #6b7280; text-align: center; display: none; }
"""

_HTML_JS = """
function filterCards() {
  var q = document.getElementById('search').value.toLowerCase();
  var cards = document.querySelectorAll('#quest-list .card');
  var total = cards.length;
  var shown = 0;
  cards.forEach(function(c) {
    var match = !q || (c.dataset.search || '').indexOf(q) !== -1;
    c.style.display = match ? '' : 'none';
    if (match) shown++;
  });
  document.getElementById('stats').textContent = shown + ' of ' + total + ' shown';
  document.getElementById('no-results').style.display = shown === 0 ? '' : 'none';
}
function toggleCard(header) {
  header.parentElement.classList.toggle('open');
}
"""

def generate_html(quests: dict) -> str:
    today = date.today().isoformat()
    count = len(quests)

    sorted_quests = sorted(
        quests.values(),
        key=lambda q: (0 if q.get("type") == "quest" else 1, q.get("name", ""))
    )
    cards = "\n".join(_quest_card_html(q) for q in sorted_quests)

    return (
        "<!DOCTYPE html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>Quest Registry &mdash; AnimePlatformer</title>\n"
        "<style>" + _HTML_CSS + "</style>\n"
        "</head>\n"
        "<body>\n"
        "<header>\n"
        "  <h1>Quest Registry &mdash; AnimePlatformer</h1>\n"
        "  <p>Auto-generated " + today + " &mdash; "
        "<code>tools/quest_tool.py --html --write</code>. "
        "Source of truth: <code>godot_port/data/quests/*.json</code></p>\n"
        "</header>\n"
        '<div id="search-bar">\n'
        '  <input type="text" id="search" placeholder="Filter by name, ID, NPC, key..." '
        'oninput="filterCards()" autofocus />\n'
        '  <span class="stats" id="stats">' + str(count) + " loaded</span>\n"
        "</div>\n"
        '<div id="quest-list">\n'
        + cards + "\n"
        "</div>\n"
        '<div class="no-results" id="no-results">No results match your filter.</div>\n'
        "<script>" + _HTML_JS + "</script>\n"
        "</body>\n"
        "</html>"
    )

# ---------------------------------------------------------------------------
# --npc display
# ---------------------------------------------------------------------------

def show_npc(quests: dict, npc_id: str):
    found = False
    for qid, q in quests.items():
        npcs = q.get("npcs", {})
        if npc_id not in npcs:
            continue
        found = True
        npc_data = npcs[npc_id]
        print(f"NPC: {npc_id}")
        print(f"  Quest : {q['name']} ({qid})")
        print(f"  Role  : {npc_data.get('role', '?')}")
        print(f"  Pitch : {npc_data.get('voice_pitch', '?')}")

        aw = npc_data.get("appears_when")
        if aw:
            print(f"  Appears when:")
            if aw.get("all_true"):
                print(f"    all true  : {', '.join(aw['all_true'])}")
            if aw.get("all_false"):
                print(f"    all false : {', '.join(aw['all_false'])}")

        print(f"\n  Dialog selection (first match wins):")
        for entry in npc_data.get("dialog_selection", []):
            req = entry.get("requires", {})
            dialog = entry.get("dialog", "?")
            if req:
                conds = ", ".join(f"{k}={v}" for k, v in req.items())
                print(f"    [{conds}]  ->  {dialog}")
            else:
                print(f"    [default]  ->  {dialog}")

        on_end = npc_data.get("on_dialog_end", {})
        if on_end:
            print(f"\n  On dialog end:")
            for dialog_id, actions in on_end.items():
                print(f"    {dialog_id}:")
                for a in actions:
                    _print_action_terminal(a, indent=6)
        print()

    if not found:
        print(f"  NPC '{npc_id}' not found in any quest.")

def _print_action_terminal(a: dict, indent: int):
    pad = " " * indent
    act = a.get("action", "?")
    if act == "set_key":
        print(f"{pad}set_key: {a['key']}")
    elif act == "item_popup":
        print(f"{pad}item_popup: {a['item_id']} (delay {a.get('delay', 0)}s)")
    elif act == "play_dialog":
        print(f"{pad}play_dialog: {a['dialog']}")
    elif act == "fade_and_remove":
        extra = f", slide_x={a['slide_x']}" if "slide_x" in a else ""
        print(f"{pad}fade_and_remove: {a.get('duration', '?')}s{extra}")
    elif act == "choice_panel":
        print(f"{pad}choice_panel: \"{a['prompt']}\" (delay {a.get('delay', 0)}s)")
        for i, choice in enumerate(a.get("choices", [])):
            branch = "on_accept" if i == 0 else "on_decline"
            print(f"{pad}  [{i}] {choice}:")
            for sub in a.get(branch, []):
                _print_action_terminal(sub, indent + 4)
    else:
        print(f"{pad}{act}: {a}")

# ---------------------------------------------------------------------------
# --quest display
# ---------------------------------------------------------------------------

def show_quest(quests: dict, quest_id: str):
    q = quests.get(quest_id)
    if not q:
        print(f"  Quest '{quest_id}' not found.")
        return

    print(f"Quest  : {q['name']}")
    print(f"ID     : {q['id']}")
    print(f"Type   : {q.get('type', '?')}")
    print(f"Level  : {q.get('level', '?')}")
    if q.get("secondary_levels"):
        print(f"Also   : {', '.join(q['secondary_levels'])}")
    if q.get("prerequisites"):
        print(f"Prereqs: {', '.join(q['prerequisites'])}")
    else:
        print(f"Prereqs: none")
    print(f"Active : {q.get('active_key', 'n/a')}")
    print(f"Done   : {q.get('complete_key', 'n/a')}")
    reward = q.get("reward", {})
    print(f"Reward : {reward.get('type', 'none')} -- {reward.get('item_id', '')}")

    print(f"\n  NPCs ({len(q.get('npcs', {}))}):")
    for npc_id, npc_data in q.get("npcs", {}).items():
        print(f"    {npc_id} [{npc_data.get('role','?')}]")

    print(f"\n  State keys ({len(q.get('state_keys', []))}):")
    for sk in q.get("state_keys", []):
        pg = f" [parallel: {sk['parallel_group']}]" if sk.get("parallel_group") else ""
        print(f"    {sk['key']}{pg}")
        print(f"      Set by : {sk.get('set_by', '?')}")
        print(f"      Meaning: {sk.get('meaning', '?')}")

# ---------------------------------------------------------------------------
# --list display
# ---------------------------------------------------------------------------

def show_list(quests: dict):
    quests_only = [(qid, q) for qid, q in quests.items() if q.get("type") == "quest"]
    events_only  = [(qid, q) for qid, q in quests.items() if q.get("type") != "quest"]

    print(f"  Quests ({len(quests_only)}):")
    for qid, q in quests_only:
        keys = [sk["key"] for sk in q.get("state_keys", [])]
        print(f"    {qid}")
        print(f"      Name    : {q['name']}")
        print(f"      Active  : {q.get('active_key','?')}")
        print(f"      Complete: {q.get('complete_key','?')}")
        print(f"      Keys    : {', '.join(keys)}")

    print(f"\n  Events ({len(events_only)}):")
    for qid, q in events_only:
        keys = [sk["key"] for sk in q.get("state_keys", [])]
        print(f"    {qid}")
        print(f"      Name : {q['name']}")
        print(f"      Keys : {', '.join(keys)}")

# ---------------------------------------------------------------------------
# Storyline — narrative Markdown doc (auto-generated from JSON)
# ---------------------------------------------------------------------------

def _topo_sort_quests(quests: dict) -> list:
    """Sort quests so that prerequisites come before dependents. Events last."""
    quest_list = [q for q in quests.values() if q.get("type") == "quest"]
    event_list = [q for q in quests.values() if q.get("type") != "quest"]

    # Simple topo sort by prerequisite depth
    depth = {}
    def get_depth(q):
        qid = q["id"]
        if qid in depth:
            return depth[qid]
        d = 0
        for prereq_key in q.get("prerequisites", []):
            for other in quests.values():
                if other.get("complete_key") == prereq_key:
                    d = max(d, get_depth(other) + 1)
        depth[qid] = d
        return d

    for q in quest_list:
        get_depth(q)

    quest_list.sort(key=lambda q: (depth.get(q["id"], 0), q.get("name", "")))
    event_list.sort(key=lambda q: q.get("name", ""))
    return quest_list + event_list


def _action_desc(a: dict) -> str:
    """One-line description of a quest action."""
    act = a.get("action", "?")
    if act == "set_key":
        return f"sets `{a['key']}`"
    elif act == "play_dialog":
        return f"plays `{a['dialog']}`"
    elif act == "item_popup":
        delay = a.get("delay", 0)
        d = f" ({delay}s delay)" if delay else ""
        return f"item popup: **{a['item_id']}**{d}"
    elif act == "fade_and_remove":
        dur = a.get("duration", "?")
        slide = f", slides x+{a['slide_x']}" if a.get("slide_x") else ""
        return f"fades out ({dur}s{slide})"
    elif act == "choice_panel":
        return f'choice panel: "{a["prompt"]}"'
    return act


def _story_quest_steps(q: dict) -> list:
    """Generate numbered step list from state_keys + on_dialog_end actions."""
    lines = []
    state_keys = q.get("state_keys", [])
    if not state_keys:
        lines.append("*(no tracked steps)*")
        return lines

    # Group consecutive keys with the same parallel_group
    groups = []
    current_pg = None
    for sk in state_keys:
        pg = sk.get("parallel_group")
        if pg and pg == current_pg:
            groups[-1].append(sk)
        else:
            current_pg = pg
            groups.append([sk])

    step = 1
    for group in groups:
        if len(group) == 1:
            sk = group[0]
            setter = find_setter(q, sk["key"])
            is_choice = has_choice_for_key(q, sk["key"])
            npc_id = setter[0] if setter else "?"
            dialog_id = setter[1] if setter else "?"

            # Find all actions for this dialog
            npc_data = q.get("npcs", {}).get(npc_id, {})
            actions = npc_data.get("on_dialog_end", {}).get(dialog_id, [])

            if is_choice:
                # Find the choice_panel action
                cp = None
                for a in actions:
                    if a.get("action") == "choice_panel":
                        cp = a
                        break
                if cp:
                    delay_txt = f" ({cp['delay']}s delay)" if cp.get("delay") else ""
                    lines.append(f'{step}. Talk to **{npc_id}** -> `{dialog_id}` -> then{delay_txt}:')
                    lines.append(f'   - Choice: "{cp["prompt"]}"')
                    for i, choice_text in enumerate(cp.get("choices", [])):
                        branch = "on_accept" if i == 0 else "on_decline"
                        branch_actions = cp.get(branch, [])
                        descs = [_action_desc(a) for a in branch_actions]
                        lines.append(f'     - **{choice_text}**: {", ".join(descs)}')
                else:
                    lines.append(f'{step}. Talk to **{npc_id}** -> `{dialog_id}` -> sets `{sk["key"]}`')
            else:
                lines.append(f'{step}. Talk to **{npc_id}** -> `{dialog_id}`')
                # Show non-set_key actions (set_key is implicit from the step itself)
                extras = [a for a in actions if a.get("action") != "set_key"]
                for a in extras:
                    lines.append(f'   - {_action_desc(a)}')
                # Always mention the key set
                lines.append(f'   - sets `{sk["key"]}`')

        else:
            pg_name = group[0].get("parallel_group", "parallel")
            lines.append(f'{step}. **{pg_name}** (any order):')
            for sk in group:
                setter = find_setter(q, sk["key"])
                npc_id = setter[0] if setter else "?"
                dialog_id = setter[1] if setter else "?"
                npc_data = q.get("npcs", {}).get(npc_id, {})
                actions = npc_data.get("on_dialog_end", {}).get(dialog_id, [])
                extras = [a for a in actions if a.get("action") != "set_key"]
                extra_txt = ""
                if extras:
                    extra_txt = " -- " + ", ".join(_action_desc(a) for a in extras)
                lines.append(f'   - Talk to **{npc_id}** -> `{dialog_id}` -> sets `{sk["key"]}`{extra_txt}')

        step += 1

    # Reward step
    reward = q.get("reward", {})
    if reward.get("type") == "item":
        lines.append(f'{step}. Reward: **{reward["item_id"]}**')

    return lines


def _story_dialog_table(q: dict) -> list:
    """Generate a dialog reference table for a quest."""
    lines = []
    lines.append("| Dialog ID | NPC | Condition | Post-dialog actions |")
    lines.append("|-----------|-----|-----------|---------------------|")

    for npc_id, npc_data in q.get("npcs", {}).items():
        for entry in npc_data.get("dialog_selection", []):
            dialog = entry.get("dialog", "?")
            req = entry.get("requires", {})
            if req:
                cond = ", ".join(f"{k}={v}" for k, v in req.items())
            else:
                cond = "default"

            on_end = npc_data.get("on_dialog_end", {}).get(dialog, [])
            if on_end:
                act_descs = [_action_desc(a) for a in on_end]
                acts = "; ".join(act_descs)
            else:
                acts = "-"

            lines.append(f"| `{dialog}` | {npc_id} | {cond} | {acts} |")

    return lines


def generate_story(quests: dict) -> str:
    """Generate a narrative Markdown storyline document from quest JSONs."""
    today = date.today().isoformat()
    sorted_qs = _topo_sort_quests(quests)

    quest_list = [q for q in sorted_qs if q.get("type") == "quest"]
    event_list = [q for q in sorted_qs if q.get("type") != "quest"]

    lines = [
        "# Storyline Guide",
        "",
        f"**Auto-generated** on {today} by `tools/quest_tool.py --story --write`.",
        "Source of truth: `godot_port/data/quests/*.json`.",
        "Do not edit by hand.",
        "",
    ]

    # Quests
    if quest_list:
        lines.append("---")
        lines.append("")

        for q in quest_list:
            name = q.get("name", q["id"])
            level = q.get("level", "?")
            secondary = q.get("secondary_levels", [])
            prereqs = q.get("prerequisites", [])
            reward = q.get("reward", {})
            npcs = q.get("npcs", {})
            desc = q.get("description", "")

            lines.append(f"## {name}")
            lines.append("")

            # Metadata line
            level_txt = f"`{level}`"
            if secondary:
                level_txt += " + " + ", ".join(f"`{s}`" for s in secondary)

            reward_txt = reward.get("item_id", "none") if reward.get("type") == "item" else "none"

            lines.append(f"**Level**: {level_txt} | **Reward**: {reward_txt}")

            if prereqs:
                prereq_names = []
                for pk in prereqs:
                    for oq in quests.values():
                        if oq.get("complete_key") == pk:
                            prereq_names.append(oq.get("name", pk))
                            break
                    else:
                        prereq_names.append(f"`{pk}`")
                lines.append(f"**Requires**: {', '.join(prereq_names)}")

            npc_txt = ", ".join(f"**{nid}** ({nd.get('role', '?')})" for nid, nd in npcs.items())
            lines.append(f"**NPCs**: {npc_txt}")
            lines.append("")

            if desc:
                lines.append(f"> {desc}")
                lines.append("")

            # Steps
            lines.append("### Steps")
            lines.append("")
            lines.extend(_story_quest_steps(q))
            lines.append("")

            # Dialog reference table
            lines.append("### All Dialogs")
            lines.append("")
            lines.extend(_story_dialog_table(q))
            lines.append("")

            # State keys
            state_keys = q.get("state_keys", [])
            if state_keys:
                lines.append("### State Keys")
                lines.append("")
                lines.append("| Key | Meaning |")
                lines.append("|-----|---------|")
                for sk in state_keys:
                    pg = f" *(parallel: {sk['parallel_group']})*" if sk.get("parallel_group") else ""
                    lines.append(f'| `{sk["key"]}`{pg} | {sk.get("meaning", "")} |')
                lines.append("")

            lines.append("---")
            lines.append("")

    # Events
    if event_list:
        lines.append("## Events")
        lines.append("")

        for q in event_list:
            name = q.get("name", q["id"])
            level = q.get("level", "?")
            npcs = q.get("npcs", {})
            desc = q.get("description", "")

            lines.append(f"### {name}")
            lines.append("")
            lines.append(f"**Level**: `{level}`")

            npc_txt = ", ".join(f"**{nid}** ({nd.get('role', '?')})" for nid, nd in npcs.items())
            lines.append(f"**NPCs**: {npc_txt}")
            lines.append("")

            if desc:
                lines.append(f"> {desc}")
                lines.append("")

            # Steps (events usually have just one key)
            lines.append("#### Flow")
            lines.append("")
            lines.extend(_story_quest_steps(q))
            lines.append("")

            # State keys
            state_keys = q.get("state_keys", [])
            if state_keys:
                lines.append("#### State Keys")
                lines.append("")
                lines.append("| Key | Meaning |")
                lines.append("|-----|---------|")
                for sk in state_keys:
                    lines.append(f'| `{sk["key"]}` | {sk.get("meaning", "")} |')
                lines.append("")

            lines.append("---")
            lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# GDScript / .tres parsers (for dashboard)
# ---------------------------------------------------------------------------

def _parse_level_defs() -> list:
    """Parse LevelDefs.gd const ALL array using regex."""
    path = GODOT_DIR / "data" / "LevelDefs.gd"
    if not path.exists():
        return []
    try:
        text = path.read_text(encoding="utf-8")
        levels = []
        all_pos = text.find("const ALL")
        if all_pos < 0:
            return []
        text_after = text[all_pos:]
        for block_match in re.finditer(r'\{([^}]+)\}', text_after):
            block = block_match.group(1)
            level = {}
            for kv in re.finditer(r'"(\w+)":\s*"([^"]*)"', block):
                level[kv.group(1)] = kv.group(2)
            vec = re.search(r'Vector2\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)', block)
            if vec:
                level["star_pos"] = [float(vec.group(1)), float(vec.group(2))]
            conn = re.search(r'"connections":\s*\[([^\]]*)\]', block)
            if conn:
                level["connections"] = re.findall(r'"([^"]+)"', conn.group(1))
            else:
                level["connections"] = []
            if "id" in level:
                levels.append(level)
        return levels
    except Exception as e:
        print(f"  WARN: failed to parse LevelDefs.gd: {e}", file=sys.stderr)
        return []


def _parse_item_defs() -> dict:
    """Parse ItemDefs.gd const ALL and SHOP using regex."""
    path = GODOT_DIR / "data" / "ItemDefs.gd"
    if not path.exists():
        return {"all": {}, "shop": []}
    try:
        text = path.read_text(encoding="utf-8")
        result = {"all": {}, "shop": []}
        # Parse ALL dict: find top-level item keys
        all_pos = text.find("const ALL")
        shop_pos = text.find("const SHOP")
        if all_pos >= 0:
            all_text = text[all_pos:shop_pos] if shop_pos > all_pos else text[all_pos:]
            for m in re.finditer(r'"(\w+)":\s*\{', all_text):
                item_id = m.group(1)
                start = m.end()
                depth = 1
                pos = start
                while pos < len(all_text) and depth > 0:
                    if all_text[pos] == '{':
                        depth += 1
                    elif all_text[pos] == '}':
                        depth -= 1
                    pos += 1
                block = all_text[start:pos - 1]
                item = {"id": item_id}
                name_m = re.search(r'"name":\s*"([^"]*)"', block)
                if name_m:
                    item["name"] = name_m.group(1)
                result["all"][item_id] = item
        # Parse SHOP array
        if shop_pos >= 0:
            shop_text = text[shop_pos:]
            for block_match in re.finditer(r'\{([^}]+)\}', shop_text):
                block = block_match.group(1)
                item = {}
                for kv in re.finditer(r'"(\w+)":\s*"([^"]*)"', block):
                    item[kv.group(1)] = kv.group(2)
                cost_m = re.search(r'"cost":\s*(\d+)', block)
                if cost_m:
                    item["cost"] = int(cost_m.group(1))
                if "id" in item:
                    result["shop"].append(item)
        return result
    except Exception as e:
        print(f"  WARN: failed to parse ItemDefs.gd: {e}", file=sys.stderr)
        return {"all": {}, "shop": []}


def _parse_achievement_defs() -> list:
    """Parse AchievementDefs.gd const ALL array using regex."""
    path = GODOT_DIR / "data" / "AchievementDefs.gd"
    if not path.exists():
        return []
    try:
        text = path.read_text(encoding="utf-8")
        achievements = []
        all_pos = text.find("const ALL")
        if all_pos < 0:
            return []
        text_after = text[all_pos:]
        for block_match in re.finditer(r'\{([^}]+)\}', text_after):
            block = block_match.group(1)
            ach = {}
            for kv in re.finditer(r'"(\w+)":\s*"([^"]*)"', block):
                ach[kv.group(1)] = kv.group(2)
            hidden_m = re.search(r'"hidden":\s*(true|false)', block)
            if hidden_m:
                ach["hidden"] = hidden_m.group(1) == "true"
            if "id" in ach:
                achievements.append(ach)
        return achievements
    except Exception as e:
        print(f"  WARN: failed to parse AchievementDefs.gd: {e}", file=sys.stderr)
        return []


def _parse_dialog_tres_files() -> dict:
    """Walk levels/*/dialogs/**/*.tres and extract dialog metadata + lines."""
    dialogs = {}
    levels_dir = GODOT_DIR / "levels"
    if not levels_dir.exists():
        return {}
    for tres_path in sorted(levels_dir.rglob("dialogs/**/*.tres")):
        try:
            rel = tres_path.relative_to(levels_dir)
            parts = rel.parts
            if len(parts) < 3:
                continue
            level_id = parts[0]
            dialog_parts = list(parts[2:])
            dialog_parts[-1] = dialog_parts[-1].replace(".tres", "")
            dialog_id = level_id + "/" + "/".join(dialog_parts)
            text = tres_path.read_text(encoding="utf-8")
            lines = []
            for block in re.finditer(
                r'\[sub_resource[^\]]*\](.*?)(?=\[(?:sub_resource|resource)\]|\Z)',
                text, re.DOTALL
            ):
                block_text = block.group(1)
                char_m = re.search(r'character_name\s*=\s*"([^"]*)"', block_text)
                text_m = re.search(r'text\s*=\s*"([^"]*)"', block_text)
                pitch_m = re.search(r'voice_pitch\s*=\s*([\d.]+)', block_text)
                if char_m and text_m:
                    lines.append({
                        "character": char_m.group(1),
                        "text": text_m.group(1),
                        "voice_pitch": float(pitch_m.group(1)) if pitch_m else 1.0,
                    })
            desc_m = re.search(r'description\s*=\s*"([^"]*)"', text)
            one_shot_m = re.search(r'one_shot\s*=\s*(true|false)', text)
            dialogs[dialog_id] = {
                "description": desc_m.group(1) if desc_m else "",
                "one_shot": one_shot_m.group(1) == "true" if one_shot_m else True,
                "line_count": len(lines),
                "lines": lines,
                "file": str(rel).replace("\\", "/"),
            }
        except Exception as e:
            print(f"  WARN: failed to parse {tres_path.name}: {e}", file=sys.stderr)
    return dialogs


# ---------------------------------------------------------------------------
# Data aggregation (for dashboard)
# ---------------------------------------------------------------------------

def _aggregate_npc_profiles(quests: dict) -> dict:
    """Build per-NPC profile data aggregated across all quest JSONs."""
    profiles = {}
    for qid, q in quests.items():
        for npc_id, npc_data in q.get("npcs", {}).items():
            if npc_id not in profiles:
                profiles[npc_id] = {
                    "voice_pitch": npc_data.get("voice_pitch"),
                    "role": npc_data.get("role", ""),
                    "quest_ids": [],
                    "dialog_ids": [],
                    "state_keys_set": [],
                    "state_keys_read": [],
                }
            p = profiles[npc_id]
            if qid not in p["quest_ids"]:
                p["quest_ids"].append(qid)
            for entry in npc_data.get("dialog_selection", []):
                did = entry.get("dialog", "")
                if did and did not in p["dialog_ids"]:
                    p["dialog_ids"].append(did)
            for dialog_id, actions in npc_data.get("on_dialog_end", {}).items():
                if dialog_id not in p["dialog_ids"]:
                    p["dialog_ids"].append(dialog_id)
                for a in iter_actions(actions):
                    if a.get("action") == "set_key":
                        k = a["key"]
                        if k not in p["state_keys_set"]:
                            p["state_keys_set"].append(k)
            for entry in npc_data.get("dialog_selection", []):
                for k in entry.get("requires", {}):
                    if k not in p["state_keys_read"]:
                        p["state_keys_read"].append(k)
            aw = npc_data.get("appears_when", {})
            for k in aw.get("all_true", []) + aw.get("all_false", []):
                if k not in p["state_keys_read"]:
                    p["state_keys_read"].append(k)
    return profiles


def _build_graph_data(quests: dict) -> dict:
    """Pre-compute Cytoscape.js nodes and edges for the quest dependency graph.

    Two strategies ensure correct top-to-bottom chronological ordering:

    1. **Flow chain edges** between consecutive state keys (based on their
       order in the JSON array) give dagre an explicit progression spine.

    2. **NPC phase splitting** — NPCs that interact at multiple points in the
       quest (e.g. purple_karim gives quest at start, receives payment at end)
       are split into "start" and "return" nodes.  Only triggered when an NPC
       has dialog_selection entries with ``requires`` keys it doesn't itself
       set.  ``appears_when`` alone does NOT trigger a split (it's a spawn
       condition, not a multi-phase interaction).
    """
    nodes = []
    edges = []
    node_ids = set()

    npc_quests: dict[str, list[str]] = {}
    for qid, q in quests.items():
        for npc_id in q.get("npcs", {}):
            npc_quests.setdefault(npc_id, []).append(qid)

    for qid, q in quests.items():
        # Quest container
        nodes.append({
            "data": {"id": qid, "label": q.get("name", qid), "type": q.get("type", "quest")},
            "classes": q.get("type", "quest"),
        })

        all_keys = q.get("state_keys", [])

        # State key nodes
        for sk in all_keys:
            key = sk["key"]
            is_active = key == q.get("active_key")
            is_complete = key == q.get("complete_key")
            subtype = "active" if is_active else ("complete" if is_complete else "regular")
            nodes.append({
                "data": {
                    "id": "key:" + key, "label": key, "type": "state_key",
                    "parent": qid, "meaning": sk.get("meaning", ""),
                    "subtype": subtype, "parallel_group": sk.get("parallel_group", ""),
                },
                "classes": "state-key " + subtype,
            })

        # Flow chain: invisible edges between consecutive state keys
        # (respecting parallel_group — keys in the same group are siblings,
        #  not sequential, so chain from the previous non-parallel key to all
        #  members of the group, then from all members to the next key).
        prev_keys = []  # list of key IDs at the previous rank
        i = 0
        while i < len(all_keys):
            pg = all_keys[i].get("parallel_group", "")
            if pg:
                # Collect all keys in this parallel group
                group = []
                while i < len(all_keys) and all_keys[i].get("parallel_group", "") == pg:
                    group.append(all_keys[i]["key"])
                    i += 1
                # prev → each member of group
                for pk in prev_keys:
                    for gk in group:
                        edges.append({"data": {
                            "source": "key:" + pk, "target": "key:" + gk,
                            "label": "", "etype": "flow",
                        }})
                prev_keys = group
            else:
                key = all_keys[i]["key"]
                for pk in prev_keys:
                    edges.append({"data": {
                        "source": "key:" + pk, "target": "key:" + key,
                        "label": "", "etype": "flow",
                    }})
                prev_keys = [key]
                i += 1

        # Build flow-predecessor map: for each key, which keys precede it
        # in the flow chain.  Used below to anchor NPC nodes between keys.
        flow_pred: dict[str, list[str]] = {}   # key -> [predecessor keys]
        prev_keys2: list[str] = []
        j = 0
        while j < len(all_keys):
            pg = all_keys[j].get("parallel_group", "")
            if pg:
                group2: list[str] = []
                while j < len(all_keys) and all_keys[j].get("parallel_group", "") == pg:
                    group2.append(all_keys[j]["key"])
                    j += 1
                for gk in group2:
                    flow_pred[gk] = list(prev_keys2)
                prev_keys2 = group2
            else:
                k2 = all_keys[j]["key"]
                flow_pred[k2] = list(prev_keys2)
                prev_keys2 = [k2]
                j += 1

        # --- NPC analysis ---
        for npc_id, npc_data in q.get("npcs", {}).items():
            keys_set = {}
            for dialog_id, actions in npc_data.get("on_dialog_end", {}).items():
                for a in iter_actions(actions):
                    if a.get("action") == "set_key":
                        keys_set[a["key"]] = dialog_id

            appears_keys = set()
            for rk in npc_data.get("appears_when", {}).get("all_true", []):
                appears_keys.add(rk)

            # Only dialog_selection.requires counts for split (NOT appears_when)
            dialog_reads = set()
            for entry in npc_data.get("dialog_selection", []):
                for req_key in entry.get("requires", {}):
                    dialog_reads.add(req_key)

            dialog_reads_external = dialog_reads - set(keys_set.keys())

            # Split only when NPC sets keys AND reads different keys via
            # dialog_selection (meaning it has multi-phase interaction)
            needs_split = len(keys_set) > 0 and len(dialog_reads_external) > 0

            if needs_split:
                start_id = qid + ":npc:" + npc_id + ":start"
                return_id = qid + ":npc:" + npc_id + ":return"
                node_ids.update([start_id, return_id])

                nodes.append({"data": {
                    "id": start_id, "label": npc_id, "type": "npc",
                    "role": npc_data.get("role", ""), "parent": qid,
                    "quest": qid, "npc_id": npc_id, "phase": "start",
                }, "classes": "npc npc-start"})

                nodes.append({"data": {
                    "id": return_id, "label": npc_id + " (return)", "type": "npc",
                    "role": npc_data.get("role", ""), "parent": qid,
                    "quest": qid, "npc_id": npc_id, "phase": "return",
                }, "classes": "npc npc-return"})

                # Classify keys into start vs return phase
                return_phase_keys = set()
                for entry in npc_data.get("dialog_selection", []):
                    req = set(entry.get("requires", {}).keys())
                    if req & dialog_reads_external:
                        dialog = entry.get("dialog", "")
                        for a in iter_actions(npc_data.get("on_dialog_end", {}).get(dialog, [])):
                            if a.get("action") == "set_key":
                                return_phase_keys.add(a["key"])
                start_phase_keys = set(keys_set.keys()) - return_phase_keys

                for key in start_phase_keys:
                    edges.append({"data": {"source": start_id, "target": "key:" + key, "label": "sets", "etype": "sets"}})
                for rk in dialog_reads_external:
                    edges.append({"data": {"source": "key:" + rk, "target": return_id, "label": "requires", "etype": "condition"}})
                for key in return_phase_keys:
                    edges.append({"data": {"source": return_id, "target": "key:" + key, "label": "sets", "etype": "sets"}})

                # Anchor start node: flow predecessors of start-phase keys → start
                anchor_preds: set[str] = set()
                for key in start_phase_keys:
                    for pk in flow_pred.get(key, []):
                        anchor_preds.add(pk)
                for pk in anchor_preds:
                    edges.append({"data": {"source": "key:" + pk, "target": start_id, "label": "", "etype": "flow"}})

            else:
                npc_node_id = qid + ":npc:" + npc_id
                node_ids.add(npc_node_id)
                nodes.append({"data": {
                    "id": npc_node_id, "label": npc_id, "type": "npc",
                    "role": npc_data.get("role", ""), "parent": qid,
                    "quest": qid, "npc_id": npc_id,
                }, "classes": "npc"})

                for key in keys_set:
                    edges.append({"data": {"source": npc_node_id, "target": "key:" + key, "label": "sets", "etype": "sets"}})
                for rk in (dialog_reads - set(keys_set.keys())):
                    edges.append({"data": {"source": "key:" + rk, "target": npc_node_id, "label": "requires", "etype": "condition"}})
                for rk in appears_keys:
                    edges.append({"data": {"source": "key:" + rk, "target": npc_node_id, "label": "spawns", "etype": "appears"}})

                # Anchor NPC between flow keys: predecessors of keys it sets → NPC
                npc_anchor_preds: set[str] = set()
                for key in keys_set:
                    for pk in flow_pred.get(key, []):
                        npc_anchor_preds.add(pk)
                for pk in npc_anchor_preds:
                    edges.append({"data": {"source": "key:" + pk, "target": npc_node_id, "label": "", "etype": "flow"}})

        # Reward
        reward = q.get("reward", {})
        if reward.get("type") == "item":
            r_id = "reward:" + qid
            nodes.append({"data": {"id": r_id, "label": reward["item_id"], "type": "reward", "parent": qid}, "classes": "reward"})
            ck = q.get("complete_key")
            if ck:
                edges.append({"data": {"source": "key:" + ck, "target": r_id, "label": "unlocks", "etype": "unlocks"}})

    # Cross-quest prerequisites
    for qid, q in quests.items():
        for prereq_key in q.get("prerequisites", []):
            for other_id, other_q in quests.items():
                if other_q.get("complete_key") == prereq_key:
                    edges.append({"data": {"source": "key:" + prereq_key, "target": qid, "label": "prerequisite", "etype": "prerequisite"}})

    # Cross-quest NPC links
    for npc_id, quest_ids in npc_quests.items():
        if len(quest_ids) > 1:
            for i in range(len(quest_ids) - 1):
                src_candidates = [quest_ids[i] + ":npc:" + npc_id + ":start", quest_ids[i] + ":npc:" + npc_id]
                tgt_candidates = [quest_ids[i + 1] + ":npc:" + npc_id + ":start", quest_ids[i + 1] + ":npc:" + npc_id]
                src = next((c for c in src_candidates if c in node_ids), None)
                tgt = next((c for c in tgt_candidates if c in node_ids), None)
                if src and tgt:
                    edges.append({"data": {"source": src, "target": tgt, "label": "same NPC", "etype": "npc_link"}})

    return {"nodes": nodes, "edges": edges}


def _collect_game_data(quests: dict) -> dict:
    """Aggregate all game data sources into a single JSON-serializable dict."""
    levels = _parse_level_defs()
    items = _parse_item_defs()
    achievements = _parse_achievement_defs()
    dialogs = _parse_dialog_tres_files()
    npc_profiles = _aggregate_npc_profiles(quests)
    graph = _build_graph_data(quests)

    state_keys = {}
    for qid, q in quests.items():
        for sk in q.get("state_keys", []):
            key = sk["key"]
            read_by = []
            for nid, nd in q.get("npcs", {}).items():
                for entry in nd.get("dialog_selection", []):
                    if key in entry.get("requires", {}):
                        if nid not in read_by:
                            read_by.append(nid)
                aw = nd.get("appears_when", {})
                if key in aw.get("all_true", []) + aw.get("all_false", []):
                    if nid not in read_by:
                        read_by.append(nid)
            state_keys[key] = {
                "meaning": sk.get("meaning", ""),
                "set_by": sk.get("set_by", ""),
                "read_by": read_by,
                "quest_id": qid,
                "quest_name": q.get("name", qid),
                "parallel_group": sk.get("parallel_group", ""),
                "is_active": key == q.get("active_key"),
                "is_complete": key == q.get("complete_key"),
            }

    return {
        "meta": {
            "generated": date.today().isoformat(),
            "tool": "quest_tool.py --dashboard",
            "quest_count": sum(1 for q in quests.values() if q.get("type") == "quest"),
            "event_count": sum(1 for q in quests.values() if q.get("type") != "quest"),
            "npc_count": len(npc_profiles),
            "dialog_count": len(dialogs),
            "state_key_count": len(state_keys),
            "level_count": len(levels),
            "achievement_count": len(achievements),
        },
        "quests": quests,
        "levels": levels,
        "items": items,
        "achievements": achievements,
        "dialogs": dialogs,
        "npc_profiles": npc_profiles,
        "state_keys": state_keys,
        "graph": graph,
    }


# ---------------------------------------------------------------------------
# Dashboard — CSS
# ---------------------------------------------------------------------------

_DASHBOARD_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg-0:#0a0f1a;--bg-1:#111827;--bg-2:#1e293b;--bg-3:#334155;
  --border:#475569;--text-1:#f1f5f9;--text-2:#94a3b8;--text-3:#64748b;
  --blue:#3b82f6;--amber:#f59e0b;--green:#22c55e;--purple:#a78bfa;
  --pink:#f472b6;--gold:#fbbf24;--red:#ef4444;
}
body{background:var(--bg-0);color:var(--text-2);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.5}
.header{background:var(--bg-1);border-bottom:1px solid var(--border);padding:12px 24px;display:flex;align-items:center;gap:24px;position:sticky;top:0;z-index:90}
.header-title{color:var(--text-1);font-size:16px;font-weight:600;white-space:nowrap}
.header-title span{color:var(--text-3);font-weight:400;font-size:12px;margin-left:8px}
.nav{display:flex;gap:2px;flex:1}
.nav-tab{padding:8px 16px;color:var(--text-3);cursor:pointer;border-radius:4px;font-size:13px;transition:all .15s;user-select:none}
.nav-tab:hover{background:var(--bg-2);color:var(--text-2)}
.nav-tab.active{background:var(--bg-2);color:var(--text-1)}
.search-wrap{position:relative}
.search-input{background:var(--bg-2);border:1px solid var(--border);color:var(--text-1);padding:6px 12px 6px 32px;font-size:13px;border-radius:4px;width:260px;font-family:inherit}
.search-input:focus{outline:none;border-color:var(--blue)}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:14px;pointer-events:none}
.search-results{position:absolute;top:100%;left:0;right:0;background:var(--bg-2);border:1px solid var(--border);border-radius:4px;margin-top:4px;max-height:400px;overflow-y:auto;z-index:100;display:none;min-width:320px}
.search-results.open{display:block}
.sr-group{padding:4px 0;border-bottom:1px solid var(--border)}
.sr-group:last-child{border-bottom:none}
.sr-group-label{padding:4px 12px;font-size:10px;text-transform:uppercase;color:var(--text-3);letter-spacing:.05em}
.sr-item{padding:6px 12px;cursor:pointer;display:flex;gap:8px;align-items:baseline}
.sr-item:hover{background:var(--bg-3)}
.sr-item-title{color:var(--text-1);font-size:13px}
.sr-item-sub{color:var(--text-3);font-size:11px}
#app{padding:24px;max-width:1400px;margin:0 auto}
.view-title{color:var(--text-1);font-size:18px;font-weight:600;margin-bottom:16px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:24px}
.stat-card{background:var(--bg-1);border:1px solid var(--border);border-radius:6px;padding:16px;cursor:pointer;transition:border-color .15s}
.stat-card:hover{border-color:var(--blue)}
.stat-value{font-size:28px;font-weight:700;color:var(--text-1)}
.stat-label{font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:12px}
.card{background:var(--bg-1);border:1px solid var(--border);border-radius:6px;overflow:hidden}
.card-quest{border-left:3px solid var(--blue)}
.card-event{border-left:3px solid var(--amber)}
.card-hdr{padding:12px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.card-hdr:hover{background:var(--bg-2)}
.card-name{color:var(--text-1);font-size:14px;font-weight:500}
.card-id{color:var(--text-3);font-size:11px;font-family:'Courier New',monospace;margin-top:2px}
.card-badges{display:flex;gap:4px;align-items:center}
.badge{font-size:11px;padding:2px 8px;border-radius:3px}
.badge-quest{background:#1e3a5f;color:#93c5fd}
.badge-event{background:#3d2800;color:#fde68a}
.badge-role{background:var(--bg-3);color:var(--text-2)}
.chevron{color:var(--text-3);font-size:12px;transition:transform .15s;display:inline-block}
.card.open .chevron{transform:rotate(90deg)}
.card-body{display:none;padding:0 16px 16px;border-top:1px solid var(--border)}
.card.open .card-body{display:block}
.sec{margin-top:12px}
.sec-title{color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--bg-3)}
.row{display:flex;gap:8px;margin-bottom:4px;align-items:baseline}
.row-label{color:var(--text-3);min-width:80px;font-size:12px}
.row-value{color:var(--text-2);font-size:12px}
.kc{display:inline-block;background:var(--bg-0);border:1px solid var(--border);padding:1px 6px;font-size:11px;color:#93c5fd;border-radius:3px;margin:1px 2px;cursor:pointer;font-family:'Courier New',monospace;text-decoration:none}
.kc:hover{border-color:var(--blue)}
.kc-active{color:var(--gold);border-color:#92400e}
.kc-complete{color:#86efac;border-color:#166534}
.npc-block{margin-bottom:8px;padding:8px 10px;background:var(--bg-0);border:1px solid var(--bg-3);border-radius:4px}
.npc-hdr{display:flex;gap:8px;align-items:baseline;margin-bottom:4px}
.npc-name{color:var(--purple);font-weight:600;font-size:13px;cursor:pointer}
.npc-name:hover{text-decoration:underline}
.npc-role{color:var(--text-3);font-size:11px}
.sub-t{color:var(--text-3);font-size:10px;text-transform:uppercase;letter-spacing:.04em;margin:6px 0 3px}
.sel-row{font-size:12px;margin-bottom:2px}
.sel-cond{color:var(--text-3)}
.on-end{margin-bottom:4px}
.on-end-trigger{font-size:11px;color:var(--text-3);margin-bottom:2px}
.act{font-size:12px;margin-bottom:1px;font-family:'Courier New',monospace}
.act-kw{color:var(--pink)}
.act-dialog{color:#a5b4fc}
.act-item{color:var(--gold)}
.act-meta{color:var(--text-3)}
.act-branch{margin-left:16px}
.act-branch-label{color:var(--text-3)}
.transcript{margin-top:8px}
.dl-line{padding:4px 8px;border-left:2px solid var(--bg-3);margin-bottom:4px}
.dl-char{color:var(--purple);font-size:11px;font-weight:600}
.dl-text{color:var(--text-2);font-size:12px}
.sk-table{width:100%;border-collapse:collapse;font-size:12px}
.sk-table th{text-align:left;padding:8px 12px;color:var(--text-3);font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--border);cursor:pointer;user-select:none}
.sk-table th:hover{color:var(--text-1)}
.sk-table td{padding:8px 12px;border-bottom:1px solid var(--bg-3);vertical-align:top}
.sk-table tr:hover{background:var(--bg-1)}
.npc-card{background:var(--bg-1);border:1px solid var(--border);border-radius:6px;padding:16px}
.npc-card-name{color:var(--purple);font-size:16px;font-weight:600;margin-bottom:4px}
.npc-card-role{color:var(--text-3);font-size:12px;margin-bottom:12px}
.npc-card-stat{display:flex;gap:8px;margin-bottom:4px;font-size:12px}
.npc-card-stat-label{color:var(--text-3);min-width:80px}
.world-section{margin-bottom:24px}
.world-section h3{color:var(--text-1);font-size:14px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.w-table{width:100%;border-collapse:collapse;font-size:12px}
.w-table th{text-align:left;padding:8px 12px;color:var(--text-3);font-size:11px;text-transform:uppercase;border-bottom:1px solid var(--border)}
.w-table td{padding:8px 12px;border-bottom:1px solid var(--bg-3)}
.w-table tr:hover{background:var(--bg-1)}
.implemented{color:var(--green)}
.placeholder{color:var(--text-3);font-style:italic}
.item-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.item-card{background:var(--bg-2);border:1px solid var(--border);border-radius:6px;padding:12px}
.item-name{color:var(--text-1);font-weight:500}
.item-desc{color:var(--text-3);font-size:12px;margin-top:4px}
.item-cost{color:var(--gold);font-size:12px;margin-top:4px}
.ach-hidden{opacity:.5}
#cy{width:100%;height:calc(100vh - 140px);min-height:400px;background:var(--bg-0);border:1px solid var(--border);border-radius:6px}
.graph-controls{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
.graph-btn{background:var(--bg-2);border:1px solid var(--border);color:var(--text-2);padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit;transition:all .15s}
.graph-btn:hover{background:var(--bg-3);color:var(--text-1)}
.graph-btn.filter-btn{border-color:var(--border);color:var(--text-3)}
.graph-btn.filter-btn.active{background:#1e3a5f;border-color:#3b82f6;color:#93c5fd}
.graph-btn.filter-btn[data-quest="all"].active{background:var(--bg-3);border-color:var(--text-2);color:var(--text-1)}
.graph-detail{position:fixed;right:0;top:52px;width:320px;height:calc(100vh - 52px);background:var(--bg-1);border-left:1px solid var(--border);padding:16px;overflow-y:auto;z-index:50;display:none}
.graph-detail.open{display:block}
.graph-detail h3{color:var(--text-1);font-size:14px;margin-bottom:8px}
.graph-detail-close{position:absolute;top:12px;right:12px;background:none;border:none;color:var(--text-3);cursor:pointer;font-size:18px}
.steps{margin-top:8px}
.step{font-size:12px;color:var(--text-2);margin-bottom:4px;padding-left:8px;border-left:2px solid var(--bg-3)}
.step strong{color:var(--text-1)}
.step code{color:#a5b4fc;font-size:11px}
.footer{padding:12px 24px;text-align:center;color:var(--text-3);font-size:11px;border-top:1px solid var(--border);margin-top:24px}
.gate{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:16px}
.gate h1{color:var(--text-1);font-size:20px}
.gate input{background:var(--bg-2);border:1px solid var(--border);color:var(--text-1);padding:10px 16px;font-size:14px;border-radius:4px;width:260px;font-family:inherit}
.gate input:focus{outline:none;border-color:var(--blue)}
.gate button{background:var(--blue);color:white;border:none;padding:10px 24px;border-radius:4px;cursor:pointer;font-size:14px}
.gate button:hover{opacity:.9}
.gate .error{color:var(--red);font-size:12px;min-height:18px}
.muted{color:var(--text-3)}
.reward-item{color:var(--gold)}
.overview-quests{margin-top:24px}
.overview-quests h3{color:var(--text-1);font-size:14px;margin-bottom:12px}
.oq-item{display:flex;gap:12px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--bg-3);cursor:pointer}
.oq-item:hover .oq-name{text-decoration:underline}
.oq-name{color:var(--text-1);font-weight:500}
.oq-type{font-size:11px}
.oq-desc{color:var(--text-3);font-size:12px;flex:1}
.filter-bar{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.filter-btn{background:var(--bg-2);border:1px solid var(--border);color:var(--text-3);padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px}
.filter-btn.active{color:var(--text-1);border-color:var(--blue)}
@media(max-width:768px){
  .header{flex-wrap:wrap;gap:8px;padding:8px 12px}
  .nav{order:2;width:100%;overflow-x:auto}
  .search-wrap{order:1;width:100%}
  .search-input{width:100%}
  #app{padding:12px}
  .card-grid{grid-template-columns:1fr}
  .stat-grid{grid-template-columns:repeat(2,1fr)}
}
"""

# ---------------------------------------------------------------------------
# Dashboard — JavaScript
# ---------------------------------------------------------------------------

_DASHBOARD_JS = r"""
const D = window.GAME_DATA;
const VIEWS = {overview:renderOverview,graph:renderGraph,quests:renderQuests,npcs:renderNPCs,keys:renderKeys,world:renderWorld};
let searchIndex = [];
let currentView = 'overview';

function esc(s){const d=document.createElement('div');d.textContent=String(s);return d.innerHTML}
function keyChip(k,extra){
  extra=extra||'';
  const sk=D.state_keys[k];
  let cls='kc';
  if(sk){if(sk.is_active)cls+=' kc-active';if(sk.is_complete)cls+=' kc-complete'}
  if(extra)cls+=' '+extra;
  return '<a class="'+cls+'" href="#keys/'+esc(k)+'" onclick="event.stopPropagation()">'+esc(k)+'</a>';
}
function npcLink(id){return '<a class="npc-name" href="#npcs/'+esc(id)+'" onclick="event.stopPropagation()">'+esc(id)+'</a>'}

function navigate(view,sub){
  currentView=view;
  document.querySelectorAll('.nav-tab').forEach(function(t){t.classList.toggle('active',t.dataset.view===view)});
  const app=document.getElementById('app');
  app.innerHTML='';
  if(VIEWS[view])VIEWS[view](app,sub);
}
function toggleCard(el){el.closest('.card').classList.toggle('open')}

/* ---- Search ---- */
function buildSearchIndex(){
  searchIndex=[];
  for(const[qid,q]of Object.entries(D.quests)){
    const parts=[q.name||'',qid,q.level||'',q.description||'',q.active_key||'',q.complete_key||''];
    (q.state_keys||[]).forEach(function(sk){parts.push(sk.key,sk.meaning||'')});
    for(const nid of Object.keys(q.npcs||{}))parts.push(nid);
    const r=q.reward||{};if(r.item_id)parts.push(r.item_id);
    searchIndex.push({type:'quest',id:qid,text:parts.join(' ').toLowerCase(),hash:'#quests/'+qid,title:q.name||qid,sub:q.type+' — '+(q.level||'')});
  }
  for(const[nid,np]of Object.entries(D.npc_profiles)){
    searchIndex.push({type:'npc',id:nid,text:[nid,np.role,...np.quest_ids,...np.dialog_ids].join(' ').toLowerCase(),hash:'#npcs/'+nid,title:nid,sub:np.role});
  }
  for(const[k,info]of Object.entries(D.state_keys)){
    searchIndex.push({type:'key',id:k,text:[k,info.meaning,info.set_by,...info.read_by].join(' ').toLowerCase(),hash:'#keys/'+k,title:k,sub:info.meaning});
  }
  for(const[did,dl]of Object.entries(D.dialogs)){
    const lt=(dl.lines||[]).map(function(l){return l.text}).join(' ');
    searchIndex.push({type:'dialog',id:did,text:[did,dl.description||'',lt].join(' ').toLowerCase(),hash:'#quests',title:did,sub:dl.description||''});
  }
}
function onSearch(e){
  const q=e.target.value.toLowerCase().trim();
  const box=document.getElementById('search-results');
  if(!q){box.classList.remove('open');return}
  const matches=searchIndex.filter(function(r){return r.text.indexOf(q)!==-1}).slice(0,15);
  if(!matches.length){box.classList.remove('open');return}
  const groups={};
  matches.forEach(function(m){if(!groups[m.type])groups[m.type]=[];groups[m.type].push(m)});
  let html='';
  for(const[type,items]of Object.entries(groups)){
    html+='<div class="sr-group"><div class="sr-group-label">'+esc(type)+'s</div>';
    items.forEach(function(item){
      html+='<div class="sr-item" onclick="location.hash=\''+item.hash+'\';document.getElementById(\'search-results\').classList.remove(\'open\');document.getElementById(\'search-box\').value=\'\'">';
      html+='<span class="sr-item-title">'+esc(item.title)+'</span><span class="sr-item-sub">'+esc(item.sub)+'</span></div>';
    });
    html+='</div>';
  }
  box.innerHTML=html;
  box.classList.add('open');
}

/* ---- Action renderer (shared) ---- */
function renderAction(a,depth){
  depth=depth||0;
  const pad='&nbsp;'.repeat(depth*4);
  const act=a.action||'?';
  if(act==='set_key')return '<div class="act">'+pad+'<span class="act-kw">set_key</span> '+keyChip(a.key)+'</div>';
  if(act==='item_popup'){
    const dl=a.delay?(' <span class="act-meta">delay '+a.delay+'s</span>'):'';
    return '<div class="act">'+pad+'<span class="act-kw">item_popup</span> <span class="act-item">'+esc(a.item_id)+'</span>'+dl+'</div>';
  }
  if(act==='play_dialog')return '<div class="act">'+pad+'<span class="act-kw">play_dialog</span> <span class="act-dialog">'+esc(a.dialog)+'</span></div>';
  if(act==='fade_and_remove'){
    const extra=a.slide_x?', slide_x='+a.slide_x:'';
    return '<div class="act">'+pad+'<span class="act-kw">fade_and_remove</span> <span class="act-meta">'+(a.duration||'?')+'s'+extra+'</span></div>';
  }
  if(act==='choice_panel'){
    const dl=a.delay?(' <span class="act-meta">delay '+a.delay+'s</span>'):'';
    let h='<div class="act">'+pad+'<span class="act-kw">choice_panel</span> <span class="act-meta">&ldquo;'+esc(a.prompt)+'&rdquo;</span>'+dl+'</div>';
    (a.choices||[]).forEach(function(ch,i){
      const branch=i===0?'on_accept':'on_decline';
      h+='<div class="act act-branch">'+pad+'&nbsp;&nbsp;<span class="act-branch-label">['+i+'] '+esc(ch)+'</span></div>';
      (a[branch]||[]).forEach(function(sub){h+=renderAction(sub,depth+2)});
    });
    return h;
  }
  return '<div class="act">'+pad+'<span class="act-kw">'+esc(act)+'</span></div>';
}

/* ---- Overview ---- */
function renderOverview(app){
  const m=D.meta;
  let h='<div class="view-title">Game Bible Overview</div>';
  h+='<div class="stat-grid">';
  h+='<div class="stat-card" onclick="navigate(\'quests\')"><div class="stat-value">'+m.quest_count+'</div><div class="stat-label">Quests</div></div>';
  h+='<div class="stat-card" onclick="navigate(\'quests\')"><div class="stat-value">'+m.event_count+'</div><div class="stat-label">Events</div></div>';
  h+='<div class="stat-card" onclick="navigate(\'npcs\')"><div class="stat-value">'+m.npc_count+'</div><div class="stat-label">NPCs</div></div>';
  h+='<div class="stat-card" onclick="navigate(\'keys\')"><div class="stat-value">'+m.state_key_count+'</div><div class="stat-label">State Keys</div></div>';
  h+='<div class="stat-card" onclick="navigate(\'quests\')"><div class="stat-value">'+m.dialog_count+'</div><div class="stat-label">Dialogs</div></div>';
  h+='<div class="stat-card" onclick="navigate(\'world\')"><div class="stat-value">'+m.level_count+'</div><div class="stat-label">Levels</div></div>';
  h+='<div class="stat-card" onclick="navigate(\'world\')"><div class="stat-value">'+m.achievement_count+'</div><div class="stat-label">Achievements</div></div>';
  const shopTotal=D.items.shop.reduce(function(s,i){return s+(i.cost||0)},0);
  h+='<div class="stat-card" onclick="navigate(\'world\')"><div class="stat-value">'+shopTotal+'</div><div class="stat-label">Total Shop Cost</div></div>';
  h+='</div>';
  // Quest summary list
  h+='<div class="overview-quests"><h3>Quest & Event Summary</h3>';
  const sorted=Object.values(D.quests).sort(function(a,b){return(a.type==='quest'?0:1)-(b.type==='quest'?0:1)||a.name.localeCompare(b.name)});
  sorted.forEach(function(q){
    const badge=q.type==='quest'?'<span class="badge badge-quest">quest</span>':'<span class="badge badge-event">event</span>';
    const reward=q.reward&&q.reward.item_id?(' &rarr; <span class="reward-item">'+esc(q.reward.item_id)+'</span>'):'';
    h+='<div class="oq-item" onclick="location.hash=\'#quests/'+esc(q.id)+'\'">';
    h+='<span class="oq-name">'+esc(q.name)+'</span>'+badge;
    h+='<span class="oq-desc">'+esc(q.level||'')+reward+'</span></div>';
  });
  h+='</div>';
  app.innerHTML=h;
}

/* ---- Quest Graph ---- */
function renderGraph(app,sub){
  let h='<div class="view-title">Quest Dependency Graph</div>';
  h+='<div class="graph-controls">';
  h+='<button class="graph-btn filter-btn active" id="graph-all" data-quest="all">All Quests</button>';
  Object.values(D.quests).forEach(function(q){
    const cls=q.type==='quest'?'badge-quest':'badge-event';
    h+='<button class="graph-btn filter-btn" data-quest="'+esc(q.id)+'">'+esc(q.name)+'</button>';
  });
  h+='<span style="flex:1"></span>';
  h+='<button class="graph-btn" id="graph-fit">Fit to View</button>';
  h+='<button class="graph-btn" id="graph-topo">Chronological</button>';
  h+='<button class="graph-btn" id="graph-dagre">Hierarchical</button>';
  h+='<button class="graph-btn" id="graph-cose">Force</button>';
  h+='</div>';
  h+='<div id="cy"></div>';
  h+='<div class="graph-detail" id="graph-detail"><button class="graph-detail-close" onclick="document.getElementById(\'graph-detail\').classList.remove(\'open\')">&times;</button><div id="graph-detail-content"></div></div>';
  app.innerHTML=h;
  if(typeof cytoscape==='undefined'){
    document.getElementById('cy').innerHTML='<div style="padding:40px;text-align:center;color:var(--text-3)">Graph library not loaded. Connect to the internet to use the interactive graph.<br><br>CDN: cytoscape.js + dagre</div>';
    return;
  }
  const allElements=D.graph.nodes.concat(D.graph.edges);
  const cy=cytoscape({
    container:document.getElementById('cy'),
    elements:allElements,
    style:[
      {selector:'.quest',style:{'background-color':'#1e3a5f','border-color':'#3b82f6','border-width':2,'label':'data(label)','text-valign':'top','text-halign':'center','color':'#93c5fd','font-size':12,'padding':30,'shape':'round-rectangle','text-margin-y':-5}},
      {selector:'.event',style:{'background-color':'#3d2800','border-color':'#f59e0b','border-width':2,'label':'data(label)','text-valign':'top','text-halign':'center','color':'#fde68a','font-size':12,'padding':30,'shape':'round-rectangle','text-margin-y':-5}},
      {selector:'.state-key',style:{'shape':'round-rectangle','background-color':'#1f2937','border-color':'#4b5563','border-width':1,'label':'data(label)','color':'#e2e8f0','font-size':9,'width':'label','height':26,'padding':8,'text-max-width':160,'text-valign':'center','text-halign':'center','text-wrap':'ellipsis'}},
      {selector:'.active',style:{'border-color':'#f59e0b','border-width':2}},
      {selector:'.complete',style:{'border-color':'#22c55e','border-width':2}},
      {selector:'.npc',style:{'shape':'ellipse','background-color':'#4c1d95','border-color':'#c4b5fd','border-width':2,'label':'data(label)','color':'#f5f3ff','font-size':10,'width':'label','height':40,'padding':12,'text-valign':'center','text-halign':'center'}},
      {selector:'.npc-return',style:{'border-style':'dashed','border-color':'#a78bfa'}},
      {selector:'.reward',style:{'shape':'diamond','background-color':'#92400e','border-color':'#fbbf24','border-width':2,'label':'data(label)','color':'#fbbf24','font-size':10,'width':50,'height':50,'text-valign':'center','text-halign':'center'}},
      {selector:'edge',style:{'curve-style':'bezier','target-arrow-shape':'triangle','line-color':'#4b5563','target-arrow-color':'#4b5563','width':1.5,'font-size':7,'color':'#94a3b8','label':'data(label)','text-opacity':0.8,'text-background-color':'#0f172a','text-background-opacity':0.7,'text-background-padding':2}},
      {selector:'edge[etype="prerequisite"]',style:{'line-style':'dashed','line-color':'#f59e0b','target-arrow-color':'#f59e0b','width':2}},
      {selector:'edge[etype="condition"]',style:{'line-style':'dotted','line-color':'#64748b','width':1}},
      {selector:'edge[etype="unlocks"]',style:{'line-color':'#22c55e','target-arrow-color':'#22c55e','width':2}},
      {selector:'edge[etype="npc_link"]',style:{'line-style':'dotted','line-color':'#7c3aed','target-arrow-color':'#7c3aed','width':1}},
      {selector:'edge[etype="appears"]',style:{'line-style':'dashed','line-color':'#a78bfa','target-arrow-color':'#a78bfa','width':2}},
      {selector:'edge[etype="flow"]',style:{'line-color':'#334155','target-arrow-color':'#334155','width':1,'line-style':'dotted','opacity':0.4}},
      {selector:'.dimmed',style:{'opacity':0.15}},
      {selector:':selected',style:{'border-width':3,'border-color':'#3b82f6'}},
    ],
    layout:{name:'preset'},
    wheelSensitivity:0.3,
  });
  function runDagre(eles){
    const target=eles||cy.elements(':visible');
    try{
      target.layout({name:'dagre',rankDir:'TB',nodeSep:35,rankSep:50,edgeSep:15,animate:true,animationDuration:300}).run();
    }catch(e){runCose(eles)}
  }
  function runCose(eles){
    const target=eles||cy.elements(':visible');
    target.layout({name:'cose',animate:true,animationDuration:300,nodeRepulsion:function(){return 10000},idealEdgeLength:function(){return 90}}).run();
  }
  function runTopo(){
    /* Topological-sort layout: compute longest-path rank from directed edges,
       then assign deterministic Y (rank) and X (per-quest column) positions.
       This guarantees correct chronological top-to-bottom ordering. */
    var childNodes=cy.nodes().filter(function(n){return !!n.data('parent')});
    /* Build adjacency from child→child edges only */
    var adj={};var indeg={};
    childNodes.forEach(function(n){var id=n.id();adj[id]=[];indeg[id]=0});
    cy.edges().forEach(function(e){
      var s=e.data('source'),t=e.data('target');
      if(s in adj&&t in adj){
        adj[s].push(t);indeg[t]=indeg[t]+1;
      }
    });
    /* Longest-path rank via topological sort (Kahn's with max propagation) */
    var rank={};var queue=[];
    var ids=Object.keys(indeg);
    for(var i=0;i<ids.length;i++){if(indeg[ids[i]]===0){queue.push(ids[i]);rank[ids[i]]=0}}
    var safety=0;
    while(queue.length>0&&safety<10000){
      safety++;
      var cur=queue.shift();
      var neighbors=adj[cur];
      for(var j=0;j<neighbors.length;j++){
        var nb=neighbors[j];
        var newRank=rank[cur]+1;
        if(rank[nb]===undefined||newRank>rank[nb])rank[nb]=newRank;
        indeg[nb]--;
        if(indeg[nb]===0)queue.push(nb);
      }
    }
    /* Fallback for cycles or isolates */
    childNodes.forEach(function(n){if(rank[n.id()]===undefined)rank[n.id()]=0});
    /* Group children by parent quest */
    var questChildren={};
    childNodes.forEach(function(n){
      var p=n.data('parent');
      if(!questChildren[p])questChildren[p]=[];
      questChildren[p].push(n);
    });
    /* Sort children within each quest by rank, then by id for stability */
    var qkeys=Object.keys(questChildren);
    for(var qi=0;qi<qkeys.length;qi++){
      questChildren[qkeys[qi]].sort(function(a,b){
        var dr=rank[a.id()]-rank[b.id()];
        return dr!==0?dr:(a.id()<b.id()?-1:1);
      });
    }
    /* Compute each quest's width (max nodes at any single rank * nodeSpacing) */
    var nodeSpacing=170;var rowHeight=65;var questGap=100;var padding=80;
    var questWidths=[];
    for(var qi=0;qi<qkeys.length;qi++){
      var children=questChildren[qkeys[qi]];
      var rankCount={};
      for(var k=0;k<children.length;k++){
        var r=rank[children[k].id()];
        rankCount[r]=(rankCount[r]||0)+1;
      }
      var maxAtRank=0;
      var rkeys=Object.keys(rankCount);
      for(var k=0;k<rkeys.length;k++){if(rankCount[rkeys[k]]>maxAtRank)maxAtRank=rankCount[rkeys[k]]}
      questWidths.push(Math.max(maxAtRank,1)*nodeSpacing);
    }
    /* Assign positions: cumulative X offset per quest column */
    var cumX=padding;
    cy.startBatch();
    for(var ci=0;ci<qkeys.length;ci++){
      var children=questChildren[qkeys[ci]];
      var minRank=rank[children[0].id()];
      for(var k=1;k<children.length;k++){
        var rk=rank[children[k].id()];if(rk<minRank)minRank=rk;
      }
      var rankSlot={};
      for(var k=0;k<children.length;k++){
        var r=rank[children[k].id()]-minRank;
        if(rankSlot[r]===undefined)rankSlot[r]=0;
        var xOff=rankSlot[r]*nodeSpacing;
        rankSlot[r]++;
        children[k].position({x:cumX+xOff,y:r*rowHeight+padding});
      }
      cumX+=questWidths[ci]+questGap;
    }
    cy.endBatch();
    cy.fit(null,40);
    console.log('[Topo] Layout applied, '+childNodes.length+' nodes positioned');
  }
  try{runTopo();console.log('[Graph] Using topo layout')}catch(e){console.error('[Graph] Topo failed:',e);try{runDagre()}catch(e2){runCose()}}
  /* Quest filter */
  let activeFilter='all';
  document.querySelectorAll('.filter-btn').forEach(function(btn){
    btn.onclick=function(){
      const qid=btn.dataset.quest;
      activeFilter=qid;
      document.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      if(qid==='all'){
        cy.elements().removeClass('dimmed');
        setTimeout(function(){try{runTopo()}catch(e){try{runDagre()}catch(e2){runCose()}}},50);
      }else{
        /* Show selected quest + its children + connected edges; dim everything else */
        const questNode=cy.getElementById(qid);
        const children=questNode.children();
        const connected=children.connectedEdges();
        const crossEdges=cy.edges().filter(function(e){
          return children.contains(cy.getElementById(e.data('source')))||children.contains(cy.getElementById(e.data('target')));
        });
        const highlight=questNode.union(children).union(crossEdges);
        cy.elements().addClass('dimmed');
        highlight.removeClass('dimmed');
        setTimeout(function(){cy.fit(highlight,40)},100);
      }
    };
  });
  document.getElementById('graph-fit').onclick=function(){
    if(activeFilter==='all')cy.fit(null,30);
    else{var q=cy.getElementById(activeFilter);cy.fit(q.union(q.children()),40)}
  };
  document.getElementById('graph-topo').onclick=function(){try{runTopo()}catch(e){try{runDagre()}catch(e2){runCose()}}};
  document.getElementById('graph-dagre').onclick=function(){try{runDagre()}catch(e){runCose()}};
  document.getElementById('graph-cose').onclick=function(){runCose()};
  cy.on('tap','node',function(evt){
    const d=evt.target.data();
    const panel=document.getElementById('graph-detail');
    const content=document.getElementById('graph-detail-content');
    let h='<h3>'+esc(d.label||d.id)+'</h3>';
    h+='<div class="row"><span class="row-label">Type</span><span class="row-value">'+esc(d.type)+'</span></div>';
    if(d.type==='state_key'){
      const sk=D.state_keys[d.label];
      if(sk){
        h+='<div class="row"><span class="row-label">Quest</span><span class="row-value">'+esc(sk.quest_name)+'</span></div>';
        h+='<div class="row"><span class="row-label">Meaning</span><span class="row-value">'+esc(sk.meaning)+'</span></div>';
        h+='<div class="row"><span class="row-label">Set by</span><span class="row-value">'+esc(sk.set_by)+'</span></div>';
        if(sk.read_by.length)h+='<div class="row"><span class="row-label">Read by</span><span class="row-value">'+sk.read_by.map(function(n){return esc(n)}).join(', ')+'</span></div>';
      }
    }else if(d.type==='npc'){
      const np=D.npc_profiles[d.label]||D.npc_profiles[d.npc_id];
      if(np){
        h+='<div class="row"><span class="row-label">Role</span><span class="row-value">'+esc(d.role||np.role)+'</span></div>';
        if(np.voice_pitch!=null)h+='<div class="row"><span class="row-label">Voice</span><span class="row-value">'+np.voice_pitch+'</span></div>';
        h+='<div class="row"><span class="row-label">Quests</span><span class="row-value">'+np.quest_ids.map(function(q){return esc(q)}).join(', ')+'</span></div>';
        h+='<div class="row"><span class="row-label">Dialogs</span><span class="row-value">'+np.dialog_ids.length+'</span></div>';
      }
    }else if(d.type==='quest'||d.type==='event'){
      const q=D.quests[d.id];
      if(q){
        h+='<div class="row"><span class="row-label">Level</span><span class="row-value">'+esc(q.level||'')+'</span></div>';
        if(q.reward&&q.reward.item_id)h+='<div class="row"><span class="row-label">Reward</span><span class="row-value reward-item">'+esc(q.reward.item_id)+'</span></div>';
        h+='<div class="row"><span class="row-label">NPCs</span><span class="row-value">'+Object.keys(q.npcs||{}).join(', ')+'</span></div>';
      }
    }
    content.innerHTML=h;
    panel.classList.add('open');
  });
  if(sub){
    const node=cy.getElementById(sub);
    if(node.length){cy.animate({center:{eles:node},zoom:1.5},300);node.select()}
  }
}

/* ---- Quests ---- */
function renderQuests(app,sub){
  let h='<div class="view-title">Quests & Events</div>';
  h+='<div class="filter-bar">';
  h+='<button class="filter-btn active" data-f="all" onclick="filterQuests(this)">All</button>';
  h+='<button class="filter-btn" data-f="quest" onclick="filterQuests(this)">Quests</button>';
  h+='<button class="filter-btn" data-f="event" onclick="filterQuests(this)">Events</button>';
  h+='</div>';
  h+='<div class="card-grid" id="quest-cards">';
  const sorted=Object.values(D.quests).sort(function(a,b){return(a.type==='quest'?0:1)-(b.type==='quest'?0:1)||a.name.localeCompare(b.name)});
  sorted.forEach(function(q){
    const qid=q.id;const qtype=q.type||'quest';const open=sub===qid?' open':'';
    h+='<div class="card card-'+qtype+open+'" data-qtype="'+qtype+'" id="q-'+esc(qid)+'">';
    h+='<div class="card-hdr" onclick="toggleCard(this)">';
    h+='<div><div class="card-name">'+esc(q.name||qid)+'</div><div class="card-id">'+esc(qid)+'</div></div>';
    h+='<div class="card-badges"><span class="badge badge-'+qtype+'">'+qtype+'</span><span class="chevron">&#9654;</span></div></div>';
    h+='<div class="card-body">';
    // Basics
    h+='<div class="sec"><div class="sec-title">Basics</div>';
    h+='<div class="row"><span class="row-label">Level</span><span class="row-value">'+esc(q.level||'?')+'</span></div>';
    if(q.secondary_levels&&q.secondary_levels.length)h+='<div class="row"><span class="row-label">Also</span><span class="row-value">'+esc(q.secondary_levels.join(', '))+'</span></div>';
    const reward=q.reward&&q.reward.item_id?'<span class="reward-item">'+esc(q.reward.item_id)+'</span>':'<span class="muted">none</span>';
    h+='<div class="row"><span class="row-label">Reward</span><span class="row-value">'+reward+'</span></div>';
    if(q.prerequisites&&q.prerequisites.length)h+='<div class="row"><span class="row-label">Prereqs</span><span class="row-value">'+q.prerequisites.map(function(p){return keyChip(p)}).join('')+'</span></div>';
    h+='</div>';
    // Quest keys
    if(q.active_key||q.complete_key){
      h+='<div class="sec"><div class="sec-title">Quest Keys</div>';
      if(q.active_key)h+='<div class="row"><span class="row-label">Active</span><span class="row-value">'+keyChip(q.active_key,'kc-active')+'</span></div>';
      if(q.complete_key)h+='<div class="row"><span class="row-label">Complete</span><span class="row-value">'+keyChip(q.complete_key,'kc-complete')+'</span></div>';
      h+='</div>';
    }
    // NPCs
    const npcs=q.npcs||{};
    if(Object.keys(npcs).length){
      h+='<div class="sec"><div class="sec-title">NPCs ('+Object.keys(npcs).length+')</div>';
      for(const[nid,nd]of Object.entries(npcs)){
        h+='<div class="npc-block"><div class="npc-hdr">'+npcLink(nid)+' <span class="npc-role">'+esc(nd.role||'')+'</span></div>';
        // Dialog selection
        if(nd.dialog_selection&&nd.dialog_selection.length){
          h+='<div class="sub-t">dialog selection</div>';
          nd.dialog_selection.forEach(function(entry){
            const req=entry.requires||{};const did=entry.dialog||'?';
            if(Object.keys(req).length){
              const conds=Object.entries(req).map(function(e){return e[0]+'='+e[1]}).join(', ');
              h+='<div class="sel-row"><span class="sel-cond">['+esc(conds)+']</span> &rarr; <span class="act-dialog">'+esc(did)+'</span></div>';
            }else{
              h+='<div class="sel-row"><span class="sel-cond">[default]</span> &rarr; <span class="act-dialog">'+esc(did)+'</span></div>';
            }
          });
        }
        // On dialog end
        const onEnd=nd.on_dialog_end||{};
        if(Object.keys(onEnd).length){
          h+='<div class="sub-t">on dialog end</div>';
          for(const[did,actions]of Object.entries(onEnd)){
            h+='<div class="on-end"><div class="on-end-trigger">after <span class="act-dialog">'+esc(did)+'</span>:</div>';
            actions.forEach(function(a){h+=renderAction(a)});
            h+='</div>';
          }
        }
        // Dialog transcripts
        const allDialogIds=[];
        (nd.dialog_selection||[]).forEach(function(e){if(e.dialog&&allDialogIds.indexOf(e.dialog)===-1)allDialogIds.push(e.dialog)});
        Object.keys(onEnd).forEach(function(d){if(allDialogIds.indexOf(d)===-1)allDialogIds.push(d)});
        const hasTranscripts=allDialogIds.some(function(did){return D.dialogs[did]&&D.dialogs[did].lines.length>0});
        if(hasTranscripts){
          h+='<div class="sub-t">dialog transcripts</div>';
          allDialogIds.forEach(function(did){
            const dl=D.dialogs[did];
            if(!dl||!dl.lines.length)return;
            h+='<div style="margin-bottom:6px"><span class="act-dialog" style="font-size:11px">'+esc(did)+'</span>';
            if(dl.description)h+=' <span class="muted" style="font-size:10px">&mdash; '+esc(dl.description)+'</span>';
            h+='<div class="transcript">';
            dl.lines.forEach(function(line){
              h+='<div class="dl-line"><div class="dl-char">'+esc(line.character)+'</div><div class="dl-text">'+esc(line.text)+'</div></div>';
            });
            h+='</div></div>';
          });
        }
        h+='</div>';
      }
      h+='</div>';
    }
    // State keys
    const sks=q.state_keys||[];
    if(sks.length){
      h+='<div class="sec"><div class="sec-title">State Keys ('+sks.length+')</div>';
      sks.forEach(function(sk){
        const pg=sk.parallel_group?' <span class="muted">[parallel: '+esc(sk.parallel_group)+']</span>':'';
        h+='<div style="margin-bottom:6px"><div>'+keyChip(sk.key)+pg+'</div>';
        h+='<div style="color:var(--text-3);font-size:11px;padding-left:8px;margin-top:2px">'+esc(sk.meaning||'')+'</div>';
        h+='<div style="color:var(--text-3);font-size:10px;padding-left:8px">'+esc(sk.set_by||'')+'</div></div>';
      });
      h+='</div>';
    }
    h+='</div></div>';
  });
  h+='</div>';
  app.innerHTML=h;
  if(sub){const el=document.getElementById('q-'+sub);if(el){el.classList.add('open');el.scrollIntoView({behavior:'smooth',block:'center'})}}
}
window.filterQuests=function(btn){
  document.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  const f=btn.dataset.f;
  document.querySelectorAll('#quest-cards .card').forEach(function(c){
    c.style.display=(f==='all'||c.dataset.qtype===f)?'':'none';
  });
};

/* ---- NPCs ---- */
function renderNPCs(app,sub){
  let h='<div class="view-title">NPC Profiles</div><div class="card-grid">';
  const sorted=Object.entries(D.npc_profiles).sort(function(a,b){return a[0].localeCompare(b[0])});
  sorted.forEach(function(entry){
    const nid=entry[0],np=entry[1];
    const open=sub===nid?' open':'';
    h+='<div class="card'+open+'" id="npc-'+esc(nid)+'">';
    h+='<div class="card-hdr" onclick="toggleCard(this)">';
    h+='<div><div class="card-name" style="color:var(--purple)">'+esc(nid)+'</div><div class="card-id">'+esc(np.role)+'</div></div>';
    h+='<div class="card-badges"><span class="badge badge-role">'+esc(np.role)+'</span><span class="chevron">&#9654;</span></div></div>';
    h+='<div class="card-body">';
    h+='<div class="sec"><div class="sec-title">Profile</div>';
    if(np.voice_pitch!=null)h+='<div class="row"><span class="row-label">Voice Pitch</span><span class="row-value">'+np.voice_pitch+'</span></div>';
    h+='<div class="row"><span class="row-label">Quests</span><span class="row-value">'+np.quest_ids.map(function(q){return '<a href="#quests/'+esc(q)+'" style="color:var(--blue);text-decoration:none" onclick="event.stopPropagation()">'+esc(q)+'</a>'}).join(', ')+'</span></div>';
    h+='<div class="row"><span class="row-label">Dialogs</span><span class="row-value">'+np.dialog_ids.length+'</span></div>';
    h+='</div>';
    if(np.state_keys_set.length){
      h+='<div class="sec"><div class="sec-title">Sets Keys</div><div>'+np.state_keys_set.map(function(k){return keyChip(k)}).join(' ')+'</div></div>';
    }
    if(np.state_keys_read.length){
      h+='<div class="sec"><div class="sec-title">Reads Keys</div><div>'+np.state_keys_read.map(function(k){return keyChip(k)}).join(' ')+'</div></div>';
    }
    if(np.dialog_ids.length){
      h+='<div class="sec"><div class="sec-title">All Dialogs</div>';
      np.dialog_ids.forEach(function(did){
        const dl=D.dialogs[did];
        h+='<div style="margin-bottom:4px"><span class="act-dialog" style="font-size:12px">'+esc(did)+'</span>';
        if(dl){
          h+=' <span class="muted" style="font-size:10px">('+dl.line_count+' lines'+(dl.one_shot?', one-shot':'')+') '+esc(dl.description||'')+'</span>';
        }
        h+='</div>';
      });
      h+='</div>';
    }
    h+='</div></div>';
  });
  h+='</div>';
  app.innerHTML=h;
  if(sub){const el=document.getElementById('npc-'+sub);if(el){el.classList.add('open');el.scrollIntoView({behavior:'smooth',block:'center'})}}
}

/* ---- State Keys ---- */
function renderKeys(app,sub){
  let h='<div class="view-title">State Keys</div>';
  h+='<div class="filter-bar">';
  h+='<button class="filter-btn active" data-f="all" onclick="filterKeys(this)">All</button>';
  h+='<button class="filter-btn" data-f="active" onclick="filterKeys(this)">Active Keys</button>';
  h+='<button class="filter-btn" data-f="complete" onclick="filterKeys(this)">Complete Keys</button>';
  h+='<button class="filter-btn" data-f="regular" onclick="filterKeys(this)">Regular</button>';
  h+='</div>';
  h+='<table class="sk-table"><thead><tr>';
  h+='<th>Key</th><th>Quest</th><th>Set By</th><th>Read By</th><th>Meaning</th>';
  h+='</tr></thead><tbody id="sk-body">';
  const sorted=Object.entries(D.state_keys).sort(function(a,b){return a[0].localeCompare(b[0])});
  sorted.forEach(function(entry){
    const k=entry[0],info=entry[1];
    const subtype=info.is_active?'active':(info.is_complete?'complete':'regular');
    const highlight=sub===k?' style="background:var(--bg-2)"':'';
    h+='<tr data-subtype="'+subtype+'" id="sk-'+esc(k)+'"'+highlight+'>';
    h+='<td>'+keyChip(k)+'</td>';
    h+='<td><a href="#quests/'+esc(info.quest_id)+'" style="color:var(--blue);text-decoration:none">'+esc(info.quest_name)+'</a></td>';
    h+='<td style="font-size:11px">'+esc(info.set_by)+'</td>';
    h+='<td>'+info.read_by.map(function(n){return npcLink(n)}).join(', ')+'</td>';
    h+='<td style="color:var(--text-3);font-size:11px">'+esc(info.meaning)+'</td>';
    h+='</tr>';
  });
  h+='</tbody></table>';
  app.innerHTML=h;
  if(sub){const el=document.getElementById('sk-'+sub);if(el)el.scrollIntoView({behavior:'smooth',block:'center'})}
}
window.filterKeys=function(btn){
  document.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  const f=btn.dataset.f;
  document.querySelectorAll('#sk-body tr').forEach(function(r){
    r.style.display=(f==='all'||r.dataset.subtype===f)?'':'none';
  });
};

/* ---- World ---- */
function renderWorld(app){
  let h='<div class="view-title">World</div>';
  // Levels
  h+='<div class="world-section"><h3>Levels ('+D.levels.length+')</h3>';
  if(D.levels.length){
    h+='<table class="w-table"><thead><tr><th>ID</th><th>Title</th><th>Scene</th><th>Connections</th><th>Requires</th><th>Status</th></tr></thead><tbody>';
    D.levels.forEach(function(lv){
      const hasScene=lv.scene&&lv.scene!=='';
      const status=hasScene?'<span class="implemented">Implemented</span>':'<span class="placeholder">Placeholder</span>';
      h+='<tr><td style="font-family:monospace;font-size:12px">'+esc(lv.id||'')+'</td>';
      h+='<td>'+esc(lv.title||'')+'</td>';
      h+='<td style="font-size:11px;color:var(--text-3)">'+esc(lv.scene||'(none)')+'</td>';
      h+='<td style="font-size:12px">'+(lv.connections||[]).join(', ')+'</td>';
      h+='<td style="font-size:12px">'+(lv.unlock_requires||'(always)')+'</td>';
      h+='<td>'+status+'</td></tr>';
    });
    h+='</tbody></table>';
  }else{h+='<div class="muted">No level data parsed.</div>'}
  h+='</div>';
  // Shop items
  h+='<div class="world-section"><h3>Shop Items ('+D.items.shop.length+')</h3>';
  if(D.items.shop.length){
    h+='<div class="item-grid">';
    D.items.shop.forEach(function(item){
      h+='<div class="item-card"><div class="item-name">'+esc(item.name||item.id)+'</div>';
      if(item.desc)h+='<div class="item-desc">'+esc(item.desc)+'</div>';
      if(item.cost!=null)h+='<div class="item-cost">'+item.cost+' coins</div>';
      h+='</div>';
    });
    h+='</div>';
  }else{h+='<div class="muted">No shop data parsed.</div>'}
  h+='</div>';
  // Collectibles
  const allItems=D.items.all||{};
  const collectKeys=Object.keys(allItems);
  if(collectKeys.length){
    h+='<div class="world-section"><h3>Collectible Items ('+collectKeys.length+')</h3>';
    h+='<div class="item-grid">';
    collectKeys.forEach(function(k){
      const item=allItems[k];
      h+='<div class="item-card"><div class="item-name">'+esc(item.name||item.id)+'</div></div>';
    });
    h+='</div></div>';
  }
  // Achievements
  h+='<div class="world-section"><h3>Achievements ('+D.achievements.length+')</h3>';
  if(D.achievements.length){
    h+='<div class="item-grid">';
    D.achievements.forEach(function(ach){
      const cls=ach.hidden?'item-card ach-hidden':'item-card';
      h+='<div class="'+cls+'"><div class="item-name">'+esc(ach.title||ach.id)+'</div>';
      h+='<div class="item-desc">'+esc(ach.description||'')+'</div>';
      if(ach.hidden)h+='<div style="color:var(--text-3);font-size:10px;margin-top:4px">Hidden achievement</div>';
      h+='</div>';
    });
    h+='</div>';
  }else{h+='<div class="muted">No achievement data parsed.</div>'}
  h+='</div>';
  app.innerHTML=h;
}

/* ---- Init ---- */
function init(){
  buildSearchIndex();
  document.getElementById('search-box').addEventListener('input',onSearch);
  document.addEventListener('click',function(e){
    if(!e.target.closest('.search-wrap'))document.getElementById('search-results').classList.remove('open');
  });
  window.addEventListener('hashchange',function(){
    const hash=location.hash.slice(1)||'overview';
    const parts=hash.split('/');
    navigate(parts[0],parts.slice(1).join('/'));
  });
  const hash=location.hash.slice(1)||'overview';
  const parts=hash.split('/');
  navigate(parts[0],parts.slice(1).join('/'));
}
document.addEventListener('DOMContentLoaded',init);
"""

_DASHBOARD_PASSWORD_JS = r"""
async function hashPw(pw){
  const enc=new TextEncoder().encode(pw);
  const buf=await crypto.subtle.digest('SHA-256',enc);
  return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0')}).join('').slice(0,16);
}
async function checkGate(){
  const hash=window.PW_HASH;
  if(!hash){document.getElementById('main-app').style.display='';return}
  document.getElementById('gate').style.display='flex';
  document.getElementById('gate-btn').onclick=async function(){
    const input=document.getElementById('gate-input').value;
    const h=await hashPw(input);
    if(h===hash){
      document.getElementById('gate').style.display='none';
      document.getElementById('main-app').style.display='';
    }else{
      document.getElementById('gate-error').textContent='Wrong password.';
    }
  };
  document.getElementById('gate-input').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('gate-btn').click()});
}
checkGate();
"""

DASHBOARD_FILE = GODOT_DIR.parent / "docs" / "game-bible.html"


def generate_dashboard(quests: dict, password_hash: str = "") -> str:
    """Generate the full interactive HTML dashboard."""
    data = _collect_game_data(quests)
    data_json = json.dumps(data, indent=None, ensure_ascii=False)
    today = date.today().isoformat()
    m = data["meta"]

    pw_script = ""
    gate_html = ""
    main_display = ""
    if password_hash:
        pw_script = f'<script>window.PW_HASH="{_html.escape(password_hash)}";</script>\n<script>{_DASHBOARD_PASSWORD_JS}</script>'
        gate_html = (
            '<div id="gate" class="gate" style="display:none">'
            '<h1>AnimePlatformer Game Bible</h1>'
            '<input type="password" id="gate-input" placeholder="Enter password..." autofocus />'
            '<button id="gate-btn">Unlock</button>'
            '<div class="error" id="gate-error"></div>'
            '</div>'
        )
        main_display = ' style="display:none"'

    nav_tabs = "".join(
        f'<div class="nav-tab" data-view="{v}" onclick="navigate(\'{v}\')">{label}</div>'
        for v, label in [
            ("overview", "Overview"),
            ("graph", "Graph"),
            ("quests", "Quests"),
            ("npcs", "NPCs"),
            ("keys", "State Keys"),
            ("world", "World"),
        ]
    )

    footer_text = (
        f"AnimePlatformer Game Bible &mdash; Generated {today} &mdash; "
        f"{m['quest_count']} quests, {m['event_count']} events, "
        f"{m['npc_count']} NPCs, {m['dialog_count']} dialogs, "
        f"{m['state_key_count']} state keys, {m['level_count']} levels"
    )

    return (
        '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<title>Game Bible &mdash; AnimePlatformer</title>\n'
        f'<style>{_DASHBOARD_CSS}</style>\n'
        '</head>\n<body>\n'
        f'{gate_html}\n'
        f'<div id="main-app"{main_display}>\n'
        '<div class="header">\n'
        '  <div class="header-title">AnimePlatformer<span>Game Bible</span></div>\n'
        f'  <div class="nav">{nav_tabs}</div>\n'
        '  <div class="search-wrap">\n'
        '    <span class="search-icon">&#128269;</span>\n'
        '    <input type="text" class="search-input" id="search-box" placeholder="Search quests, NPCs, keys..." />\n'
        '    <div class="search-results" id="search-results"></div>\n'
        '  </div>\n'
        '</div>\n'
        '<div id="app"></div>\n'
        f'<div class="footer">{footer_text}</div>\n'
        '</div>\n'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js"></script>\n'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js"></script>\n'
        '<script src="https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js"></script>\n'
        f'<script>window.GAME_DATA={data_json};</script>\n'
        f'{pw_script}\n'
        f'<script>{_DASHBOARD_JS}</script>\n'
        '</body>\n</html>'
    )


# ---------------------------------------------------------------------------
# Local dev server (optional)
# ---------------------------------------------------------------------------

def _serve_dashboard(port: int) -> None:
    """Start a local HTTP server that regenerates the dashboard on each request."""
    import http.server
    import socketserver

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/' or self.path == '/index.html':
                quests = load_all()
                html = generate_dashboard(quests)
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(html.encode('utf-8'))
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, format, *args):
            print(f"  [{self.log_date_time_string()}] {format % args}")

    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"  Dashboard server: http://localhost:{port}")
        print(f"  Regenerates on every page load. Press Ctrl+C to stop.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Quest graph validation and visualization tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--validate",  action="store_true", help="Validate all quest files")
    parser.add_argument("--graph",     action="store_true", help="Generate Mermaid flowchart")
    parser.add_argument("--story",     action="store_true", help="Generate narrative storyline Markdown")
    parser.add_argument("--html",      action="store_true", help="Generate static HTML report (simple card view)")
    parser.add_argument("--dashboard", action="store_true", help="Generate interactive Game Bible dashboard")
    parser.add_argument("--write",     action="store_true", help="Write output to docs/")
    parser.add_argument("--serve",     type=int, nargs='?', const=8080, metavar="PORT",
                        help="Start local dashboard server (default port 8080)")
    parser.add_argument("--password",  metavar="PW", help="Set password gate for dashboard")
    parser.add_argument("--npc",       metavar="NPC_ID",    help="Show dialog flow for one NPC")
    parser.add_argument("--quest",     metavar="QUEST_ID",  help="Show summary / filter graph for one quest")
    parser.add_argument("--list",      action="store_true", help="List all quests and events")
    args = parser.parse_args()

    if not QUESTS_DIR.exists():
        print(f"ERROR: quests directory not found: {QUESTS_DIR}", file=sys.stderr)
        sys.exit(1)

    quests = load_all()
    if not quests:
        print("No quest files found.", file=sys.stderr)
        sys.exit(1)

    print(f"Loaded {len(quests)} quest file(s) from {QUESTS_DIR.relative_to(GODOT_DIR.parent)}\n")

    if args.serve is not None:
        _serve_dashboard(args.serve)
        return

    if args.validate:
        errors = validate(quests)
        sys.exit(1 if errors else 0)

    elif args.dashboard:
        pw_hash = ""
        if args.password:
            pw_hash = hashlib.sha256(args.password.encode()).hexdigest()[:16]
        html = generate_dashboard(quests, password_hash=pw_hash)
        if args.write:
            DASHBOARD_FILE.write_text(html, encoding="utf-8")
            print(f"Written to {DASHBOARD_FILE.relative_to(GODOT_DIR.parent)}")
            if pw_hash:
                print(f"  Password gate enabled (hash: {pw_hash})")
        else:
            print(html)

    elif args.story:
        story = generate_story(quests)
        if args.write:
            STORYLINE_FILE.write_text(story, encoding="utf-8")
            print(f"Written to {STORYLINE_FILE.relative_to(GODOT_DIR.parent)}")
        else:
            print(story)

    elif args.html:
        html = generate_html(quests)
        if args.write:
            HTML_FILE.write_text(html, encoding="utf-8")
            print(f"Written to {HTML_FILE.relative_to(GODOT_DIR.parent)}")
        else:
            print(html)

    elif args.graph:
        if args.quest:
            chart = generate_mermaid_single(quests, args.quest)
            if args.write:
                out = GODOT_DIR.parent / "docs" / f"quest-flowchart-{args.quest}.md"
                header = (
                    f"# Quest Flowchart: {args.quest}\n\n"
                    f"**Auto-generated** by `tools/quest_tool.py --graph --quest {args.quest} --write`.\n"
                    f"Do not edit by hand.\n\n"
                )
                out.write_text(header + chart, encoding="utf-8")
                print(f"Written to {out.relative_to(GODOT_DIR.parent)}")
            else:
                print(chart)
        else:
            chart = generate_mermaid(quests)
            if args.write:
                header = (
                    "# Quest Flowchart\n\n"
                    "**Auto-generated** by `tools/quest_tool.py --graph --write`.\n"
                    "Do not edit by hand -- edit the JSON files in `godot_port/data/quests/` instead.\n"
                    "To re-render: copy the Mermaid block into [mermaid.live](https://mermaid.live).\n\n"
                )
                FLOWCHART_FILE.write_text(header + chart, encoding="utf-8")
                print(f"Written to {FLOWCHART_FILE.relative_to(GODOT_DIR.parent)}")
            else:
                print(chart)

    elif args.npc:
        show_npc(quests, args.npc)

    elif args.quest:
        show_quest(quests, args.quest)

    elif args.list:
        show_list(quests)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
