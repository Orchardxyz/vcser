export const APP_ROUTE = {
  ROOT: "/",
  OVERVIEW: "/overview",
  EDITORS: "/editors",
  SETTINGS: "/settings"
} as const;

export function getEditorExtensionsRoute(editorSlug: string): string {
  return `${APP_ROUTE.EDITORS}/${editorSlug}/extensions`;
}
