#!/usr/bin/env bash
# Install the Montserrat font family (all weights) into the current user's
# fonts directory and refresh the font cache so LibreOffice can pick them up.
#
# This is what the preview pipeline needs: when detailedSlideV2.js requests
# `fontFace: "Montserrat ExtraBold"` etc., LibreOffice (headless) resolves
# those face names against the system font cache during PDF conversion.
# Without these installed, every weight falls back to a default sans.
#
# Usage:  bash scripts/install-montserrat.sh
# Idempotent — re-running is safe.

set -euo pipefail

FONT_DIR="${HOME}/.local/share/fonts/Montserrat"
TMP_DIR="$(mktemp -d -t montserrat-XXXXXX)"
ZIP_URL="https://github.com/JulietaUla/Montserrat/archive/refs/heads/master.zip"

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "→ Target: $FONT_DIR"
mkdir -p "$FONT_DIR"

echo "→ Downloading Montserrat from upstream repo"
if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$ZIP_URL" -o "$TMP_DIR/montserrat.zip"
elif command -v wget >/dev/null 2>&1; then
    wget -q "$ZIP_URL" -O "$TMP_DIR/montserrat.zip"
else
    echo "ERROR: need curl or wget" >&2
    exit 1
fi

echo "→ Extracting"
unzip -q "$TMP_DIR/montserrat.zip" -d "$TMP_DIR"

# The repo ships TTFs under fonts/ttf/. Copy every weight (Thin → Black,
# upright + italic) so any Montserrat face name resolves.
SRC_TTF_DIR="$(find "$TMP_DIR" -type d -name ttf -path '*/fonts/ttf' | head -n 1)"
if [[ -z "$SRC_TTF_DIR" ]]; then
    echo "ERROR: could not locate fonts/ttf in archive" >&2
    exit 1
fi

echo "→ Installing TTFs"
cp -f "$SRC_TTF_DIR"/*.ttf "$FONT_DIR/"

echo "→ Refreshing font cache"
fc-cache -f "$FONT_DIR"

echo
echo "✔ Installed weights:"
fc-list | grep -i montserrat | sed 's|.*/||' | sort -u

cat <<'EOF'

Done. If LibreOffice (or any soffice background process) is already running,
quit it before regenerating previews so it re-reads the font cache:

    pkill -f soffice || true

Then regenerate:

    node scripts/preview-v2.js 1,2,3 --no-open
EOF
