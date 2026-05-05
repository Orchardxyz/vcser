#!/usr/bin/env bash
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repo_root="$(CDPATH= cd -- "$script_dir/.." && pwd)"
logo_svg="$repo_root/resources/logo.svg"
icon_png="$repo_root/resources/icon-1024.png"
mac_icon_png="$repo_root/resources/icon-macos-1024.png"
output_dir="$repo_root/resources"
mac_tmp_dir="$repo_root/resources/.icon-macos-build"
mac_png_dir="$mac_tmp_dir/png"
mac_svg="$mac_tmp_dir/logo-macos.svg"
mac_inner_scale="${MAC_ICON_INNER_SCALE:-0.82}"
icon_gen_cli="$(node -e 'const path = require("node:path"); const builderDir = path.dirname(require.resolve("electron-icon-builder")); console.log(path.join(builderDir, "..", "icon-gen", "dist", "bin", "index.js"));')"

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert is required. Install librsvg first."
  exit 1
fi

if ! command -v sips >/dev/null 2>&1; then
  echo "sips is required."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required."
  exit 1
fi

if [ ! -f "$logo_svg" ]; then
  echo "Missing source SVG: $logo_svg"
  exit 1
fi

rm -rf "$mac_png_dir"
rm -rf "$mac_tmp_dir"
mkdir -p "$mac_png_dir"

rsvg-convert -w 1024 -h 1024 "$logo_svg" -o "$icon_png"
# Expand the SVG viewBox to add transparent padding so the macOS icon fills
# mac_inner_scale of the output canvas (e.g. 0.82 → ~18% transparent margin).
# padding_in_svg_units = (1 - scale) / (2 * scale) * 128
mac_vb_pad=$(perl -e "printf '%d', (1 - ${mac_inner_scale}) / (2 * ${mac_inner_scale}) * 128 + 0.5")
mac_vb_size=$(( 128 + 2 * mac_vb_pad ))
perl -0pe "s/viewBox=\"0 0 128 128\"/viewBox=\"-${mac_vb_pad} -${mac_vb_pad} ${mac_vb_size} ${mac_vb_size}\"/" "$logo_svg" > "$mac_svg"
rsvg-convert -w 1024 -h 1024 "$mac_svg" -o "$mac_icon_png"
pnpm exec electron-icon-builder --input="$icon_png" --output="$output_dir"

for size in 16 32 64 128 256 512 1024; do
  sips --resampleHeightWidth "$size" "$size" "$mac_icon_png" --out "$mac_png_dir/$size.png" >/dev/null
done

node "$icon_gen_cli" \
  --input "$mac_png_dir" \
  --output "$output_dir/icons/mac" \
  --icns \
  --icns-name icon \
  --report

rm -rf "$mac_png_dir"
rm -rf "$mac_tmp_dir"
