import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { APP_ICON_STATUS, type AppIconStatus } from "./detect/detect";

interface ExtractWindowsAppIconResult {
  iconPayload?: string;
  iconStatus: AppIconStatus;
}

function encodePowerShellCommand(command: string) {
  return Buffer.from(command, "utf16le").toString("base64");
}

export async function extractWindowsAppIcon(appPath: string): Promise<ExtractWindowsAppIconResult> {
  if (process.platform !== "win32" || !appPath || !existsSync(appPath)) {
    return { iconStatus: APP_ICON_STATUS.FALLBACK };
  }

  const script = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$appPath = $env:VCSER_ICON_APP_PATH
if ([string]::IsNullOrWhiteSpace($appPath) -or -not (Test-Path -LiteralPath $appPath)) {
  exit 1
}
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($appPath)
if ($null -eq $icon) {
  exit 1
}
$bitmap = $icon.ToBitmap()
$sourceSize = [Math]::Max($bitmap.Width, $bitmap.Height)
if ($sourceSize -le 0) {
  exit 1
}
$canvas = New-Object System.Drawing.Bitmap $sourceSize, $sourceSize
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$stream = New-Object System.IO.MemoryStream
try {
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $targetSize = [Math]::Max(1, [int][Math]::Floor($sourceSize * 0.82))
  $offset = [int][Math]::Floor(($sourceSize - $targetSize) / 2)
  $graphics.DrawImage($bitmap, $offset, $offset, $targetSize, $targetSize)
  $canvas.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  [Convert]::ToBase64String($stream.ToArray())
}
finally {
  $stream.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
  $bitmap.Dispose()
  $icon.Dispose()
}
`;

  try {
    const encodedCommand = encodePowerShellCommand(script);
    const base64 = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encodedCommand], {
      encoding: "utf8",
      windowsHide: true,
      env: {
        ...process.env,
        VCSER_ICON_APP_PATH: appPath
      }
    }).trim();

    if (!base64) {
      return { iconStatus: APP_ICON_STATUS.FALLBACK };
    }

    return {
      iconPayload: `data:image/png;base64,${base64}`,
      iconStatus: APP_ICON_STATUS.READY
    };
  } catch {
    return { iconStatus: APP_ICON_STATUS.FALLBACK };
  }
}
