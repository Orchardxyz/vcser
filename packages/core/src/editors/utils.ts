import { extname } from "node:path";

export function mimeTypeForPath(filePath: string): string | undefined {
  switch (extname(filePath).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    default:
      return undefined;
  }
}
