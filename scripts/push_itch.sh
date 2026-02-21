#!/usr/bin/env bash
# push_itch.sh — Export the Godot project and push to itch.io via butler
#
# Prerequisites:
#   - Godot 4.6.1 (at GODOT_PATH or default location)
#   - butler installed and logged in (butler login)
#   - Export preset "Windows Desktop" configured in Godot
#
# Usage:
#   bash scripts/push_itch.sh [version]
#   bash scripts/push_itch.sh 0.2.0

set -euo pipefail

# --- Config ---
GODOT="${GODOT_PATH:-c:/Users/Robin/Desktop/Godot_v4.6.1-stable_win64.exe}"
PROJECT_DIR="$(cd "$(dirname "$0")/../godot_port" && pwd)"
BUILD_DIR="${PROJECT_DIR}/build"
ITCH_TARGET="zyynx-hub/platformer:windows"

# --- Version (from CLI arg or extracted from Constants.gd) ---
VERSION="${1:-$(grep 'APP_VERSION' "${PROJECT_DIR}/scripts/core/Constants.gd" | grep -oP '"\K[^"]+')}"
echo "==> Version: ${VERSION}"

# --- Clean and create build dir ---
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# --- Export ---
echo "==> Exporting Windows build..."
"${GODOT}" --headless --path "${PROJECT_DIR}" --export-release "Windows Desktop" "${BUILD_DIR}/AnimePlatformer.exe"

if [ ! -f "${BUILD_DIR}/AnimePlatformer.exe" ]; then
    echo "ERROR: Export failed — no .exe produced"
    exit 1
fi

echo "==> Export complete:"
ls -lh "${BUILD_DIR}/"

# --- Push to itch.io ---
echo "==> Pushing to itch.io (${ITCH_TARGET})..."
butler push "${BUILD_DIR}" "${ITCH_TARGET}" --userversion "${VERSION}"

echo "==> Done! Version ${VERSION} pushed to itch.io"

# --- Discord notification ---
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ -f "${ENV_FILE}" ]; then
    source "${ENV_FILE}"
fi

if [ -n "${DISCORD_WEBHOOK_URL:-}" ]; then
    echo "==> Sending Discord notification..."
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    DISCORD_JSON=$(mktemp)
    cat > "${DISCORD_JSON}" <<ENDJSON
{"embeds": [{"title": "New Build Pushed -- v${VERSION}", "description": "A new version of AnimePlatformer is live on itch.io!", "color": 3447003, "fields": [{"name": "Version", "value": "v${VERSION}", "inline": true}, {"name": "Platform", "value": "Windows", "inline": true}, {"name": "Play Now", "value": "[itch.io](https://zyynx-hub.itch.io/platformer)"}], "timestamp": "${TIMESTAMP}", "footer": {"text": "AnimePlatformer Build Bot"}}]}
ENDJSON
    curl -s -o /dev/null -w "%{http_code}" \
        -H "Content-Type: application/json" \
        -d @"${DISCORD_JSON}" \
        "${DISCORD_WEBHOOK_URL}" && echo " -- sent!" || echo " -- failed (non-critical)"
    rm -f "${DISCORD_JSON}"
else
    echo "==> Skipping Discord notification (no DISCORD_WEBHOOK_URL set in .env)"
fi
