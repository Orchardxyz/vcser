export { findExtensionDir } from "./extensionFs";
export { listInstalledExtensions, listInstalledExtensionMetadata, listEditorExtensions, computeExtensionDiff } from "./extensions";
export { setEditorExtensionDisabled, uninstallEditorExtension } from "./extensionManagement";
export { syncExtensionLocal } from "./extensionSync";
export { resolveNamespacesToExtensions, type ResolvedNamespaceMap } from "./configNamespace";
