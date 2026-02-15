import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


def read_build_version(root: Path) -> str:
    build_info = root / "js" / "core" / "build-info.js"
    if not build_info.exists():
        raise RuntimeError("build-info.js not found.")
    text = build_info.read_text(encoding="utf-8", errors="ignore")
    marker = 'Platformer.BUILD_VERSION = "'
    start = text.find(marker)
    if start < 0:
        raise RuntimeError("BUILD_VERSION not found in build-info.js")
    start += len(marker)
    end = text.find('"', start)
    if end < 0:
        raise RuntimeError("Malformed BUILD_VERSION in build-info.js")
    return text[start:end].strip()


def gh_request(url: str, token: str, method: str = "GET", data=None, accept: str = "application/vnd.github+json"):
    body = None
    headers = {
        "User-Agent": "AnimePlatformerReleasePublisher/1.0",
        "Accept": accept,
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
        if not raw:
            return {}
        return json.loads(raw)


def get_or_create_release(repo: str, tag: str, channel: str, token: str):
    by_tag_url = f"https://api.github.com/repos/{repo}/releases/tags/{urllib.parse.quote(tag)}"
    try:
        rel = gh_request(by_tag_url, token, "GET")
        print(f"[publish] Using existing release tag={tag} id={rel.get('id')}")
        return rel
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise

    create_url = f"https://api.github.com/repos/{repo}/releases"
    name_suffix = "" if channel.lower() in ("stable", "latest") else f" [{channel}]"
    payload = {
        "tag_name": tag,
        "name": f"Anime Platformer {tag}{name_suffix}",
        "body": f"Automated build {tag}",
        "draft": False,
        "prerelease": channel.lower() not in ("stable", "latest"),
        "generate_release_notes": True,
    }
    rel = gh_request(create_url, token, "POST", payload)
    print(f"[publish] Created release tag={tag} id={rel.get('id')}")
    return rel


def delete_asset_if_exists(repo: str, release: dict, asset_name: str, token: str):
    assets = release.get("assets") or []
    for asset in assets:
        if str(asset.get("name", "")).lower() == asset_name.lower():
            asset_id = asset.get("id")
            if asset_id:
                del_url = f"https://api.github.com/repos/{repo}/releases/assets/{asset_id}"
                gh_request(del_url, token, "DELETE")
                print(f"[publish] Deleted old asset: {asset_name} (id={asset_id})")


def upload_asset(repo: str, release: dict, exe_path: Path, token: str):
    release_id = release.get("id")
    if not release_id:
        raise RuntimeError("Release id missing.")
    name = exe_path.name
    upload_url = f"https://uploads.github.com/repos/{repo}/releases/{release_id}/assets?name={urllib.parse.quote(name)}"
    headers = {
        "User-Agent": "AnimePlatformerReleasePublisher/1.0",
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/octet-stream",
    }
    data = exe_path.read_bytes()
    req = urllib.request.Request(upload_url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read().decode("utf-8")
        uploaded = json.loads(raw) if raw else {}
    print(f"[publish] Uploaded asset: {name} ({exe_path.stat().st_size} bytes)")
    print(f"[publish] Asset URL: {uploaded.get('browser_download_url', '(missing)')}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish AnimePlatformer.exe to GitHub Releases")
    parser.add_argument("--repo", required=True, help="owner/repo")
    parser.add_argument("--channel", default="stable", help="stable by default")
    parser.add_argument("--exe", required=True, help="Path to built exe")
    args = parser.parse_args()

    repo = str(args.repo or "").strip().strip("/")
    if "/" not in repo:
        print("[publish] Invalid --repo, expected owner/repo")
        return 2

    token = os.getenv("GH_TOKEN", "").strip() or os.getenv("GITHUB_TOKEN", "").strip()
    if not token:
        print("[publish] GH_TOKEN/GITHUB_TOKEN is required")
        return 2

    exe_path = Path(args.exe).resolve()
    if not exe_path.exists():
        print(f"[publish] EXE not found: {exe_path}")
        return 2

    root = Path(__file__).resolve().parent.parent
    version = read_build_version(root)
    tag = version
    channel = str(args.channel or "stable").strip() or "stable"

    try:
        release = get_or_create_release(repo, tag, channel, token)
        delete_asset_if_exists(repo, release, exe_path.name, token)
        # Refresh release state if asset deleted.
        release = gh_request(f"https://api.github.com/repos/{repo}/releases/{release.get('id')}", token, "GET")
        upload_asset(repo, release, exe_path, token)
        print(f"[publish] Success repo={repo} tag={tag} channel={channel}")
        return 0
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="ignore")
        print(f"[publish] HTTP error {e.code}: {msg}")
        return 1
    except Exception as e:
        print(f"[publish] Failed: {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
