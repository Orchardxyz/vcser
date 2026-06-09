#!/usr/bin/env bash
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
workspace_root="$(CDPATH= cd -- "$script_dir/.." && pwd)"
desktop_root="$workspace_root/apps/desktop"
logo_svg="$desktop_root/resources/appIcon.svg"
icon_png="$desktop_root/resources/icon-1024.png"
mac_icon_png="$desktop_root/resources/icon-macos-1024.png"
output_dir="$desktop_root/resources"
mac_tmp_dir="$desktop_root/resources/.icon-macos-build"
mac_png_dir="$mac_tmp_dir/png"
mac_svg="$mac_tmp_dir/logo-macos.svg"
mac_inner_scale="${MAC_ICON_INNER_SCALE:-0.82}"
icon_gen_cli="$(node -e 'const path = require("node:path"); const searchRoot = process.argv[1]; const builderPkg = require.resolve("electron-icon-builder/package.json", { paths: [searchRoot] }); const builderDir = path.dirname(builderPkg); console.log(path.join(builderDir, "..", "icon-gen", "dist", "bin", "index.js"));' "$desktop_root")"

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
# mac_inner_scale of the output canvas (e.g. 0.82 -> ~18% transparent margin).
# padding_in_svg_units = (1 - scale) / (2 * scale) * 128
mac_vb_pad=$(perl -e "printf '%d', (1 - ${mac_inner_scale}) / (2 * ${mac_inner_scale}) * 128 + 0.5")
mac_vb_size=$(( 128 + 2 * mac_vb_pad ))
perl -0pe "s/viewBox=\"0 0 128 128\"/viewBox=\"-${mac_vb_pad} -${mac_vb_pad} ${mac_vb_size} ${mac_vb_size}\"/" "$logo_svg" > "$mac_svg"
rsvg-convert -w 1024 -h 1024 "$mac_svg" -o "$mac_icon_png"
pnpm --filter @vcser/desktop exec electron-icon-builder --input="$icon_png" --output="$output_dir"

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

# Derive pure logo SVG (no background, no border, tight viewBox)
logo_out="$workspace_root/assets/logo.svg"
perl -0777 -ne '
  my ($d, $fill) = /<path[^>]+fill-rule="evenodd"[^>]+d="([^"]+)"[^>]+fill="([^"]+)"[^>]*\/>/s;
  my ($outer, $inner) = split /Z\s*(?=M)/, $d // "", 2;
  if (defined $outer && defined $inner) {
    $outer .= "Z";
    print qq{<svg xmlns="http://www.w3.org/2000/svg" viewBox="21.412 14.86 85.176 98.28">\n<path d="$outer" fill="$fill"/>\n<path d="$inner" fill="#F5F5F7"/>\n</svg>\n};
  }
' "$logo_svg" > "$logo_out"
echo "Generated: $logo_out"
