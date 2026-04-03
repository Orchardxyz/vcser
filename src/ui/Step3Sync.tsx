import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import type { ResolvedEditor, SettingsMode } from "../editors/types";
import type { ExtensionDiffResult } from "../extensions/diff";
import type { SettingsDiffResult } from "../settings/diff";
import {
  executeExtensionSync,
  executeSettingsSync,
  type SyncAction,
  type SettingsSyncAction,
  type SyncResult,
} from "../sync/index";

interface Step3Props {
  editors: ResolvedEditor[];
  extDiff: ExtensionDiffResult;
  settingsDiffs: SettingsDiffResult[];
  dryRun: boolean;
  onBack: () => void;
  onDone: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  type: "install" | "uninstall" | "settings";
  extensionId?: string;
  targetEditor: ResolvedEditor;
  settingsDiffIndex?: number;
}

function buildActions(
  editors: ResolvedEditor[],
  extDiff: ExtensionDiffResult,
  settingsDiffs: SettingsDiffResult[]
): ActionItem[] {
  const actions: ActionItem[] = [];
  let idx = 0;

  for (const row of extDiff.onlyDiffs) {
    for (const editorName of extDiff.editorNames) {
      const present = row.presence.get(editorName);
      if (!present) {
        const editor = editors.find((e) => e.name === editorName);
        if (editor) {
          actions.push({
            id: `ext-${idx++}`,
            label: `Install ${row.extensionId} → ${editorName}`,
            type: "install",
            extensionId: row.extensionId,
            targetEditor: editor,
          });
        }
      }
    }
  }

  for (let i = 0; i < settingsDiffs.length; i++) {
    const sd = settingsDiffs[i]!;
    if (sd.diffs.length > 0) {
      const target = editors.find((e) => e.name === sd.targetName);
      if (target) {
        actions.push({
          id: `settings-${idx++}`,
          label: `Sync settings: ${sd.sourceName} → ${sd.targetName} (${sd.diffs.length} keys)`,
          type: "settings",
          targetEditor: target,
          settingsDiffIndex: i,
        });
      }
    }
  }

  return actions;
}

export function Step3Sync({
  editors,
  extDiff,
  settingsDiffs,
  dryRun,
  onBack,
  onDone,
}: Step3Props) {
  const actions = useMemo(
    () => buildActions(editors, extDiff, settingsDiffs),
    [editors, extDiff, settingsDiffs]
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(actions.map((a) => a.id))
  );
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<"select" | "running" | "done">("select");
  const [results, setResults] = useState<SyncResult[]>([]);

  useInput((input, key) => {
    if (phase !== "select") return;

    if (key.upArrow) {
      setCursor((c) => (c > 0 ? c - 1 : actions.length - 1));
    } else if (key.downArrow) {
      setCursor((c) => (c < actions.length - 1 ? c + 1 : 0));
    } else if (input === " ") {
      const id = actions[cursor]?.id;
      if (id) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    } else if (input === "a") {
      if (selected.size === actions.length) {
        setSelected(new Set());
      } else {
        setSelected(new Set(actions.map((a) => a.id)));
      }
    } else if (key.return && selected.size > 0) {
      runSync();
    } else if (key.escape) {
      onBack();
    }
  });

  function runSync() {
    setPhase("running");

    const selectedActions = actions.filter((a) => selected.has(a.id));
    const allResults: SyncResult[] = [];

    const extActions: SyncAction[] = selectedActions
      .filter((a) => a.type === "install" || a.type === "uninstall")
      .map((a) => ({
        type: a.type as "install" | "uninstall",
        extensionId: a.extensionId!,
        targetEditor: a.targetEditor,
      }));

    if (extActions.length > 0) {
      allResults.push(...executeExtensionSync(extActions, dryRun));
    }

    for (const action of selectedActions.filter((a) => a.type === "settings")) {
      const sd = settingsDiffs[action.settingsDiffIndex!]!;
      const source = editors.find((e) => e.name === sd.sourceName);
      if (source) {
        const syncAction: SettingsSyncAction = {
          sourceEditor: source,
          targetEditor: action.targetEditor,
          diffs: sd.diffs,
        };
        allResults.push(executeSettingsSync(syncAction, dryRun));
      }
    }

    setResults(allResults);
    setPhase("done");
  }

  if (phase === "running") {
    return (
      <Box gap={1}>
        <Spinner label="Syncing..." />
      </Box>
    );
  }

  if (phase === "done") {
    const successes = results.filter((r) => r.success).length;
    const failures = results.filter((r) => !r.success).length;

    return (
      <Box flexDirection="column">
        <Text color="cyanBright" bold>
          {dryRun ? "Dry Run Complete" : "Sync Complete"}
        </Text>
        <Box flexDirection="column" marginTop={1}>
          {results.map((r, i) => (
            <Box key={i} gap={1}>
              <Text color={r.success ? "greenBright" : "redBright"}>
                {r.success ? "✓" : "✗"}
              </Text>
              <Text>{r.action}</Text>
              {r.backupPath && (
                <Text dimColor>(backup: {r.backupPath})</Text>
              )}
              {r.error && <Text color="redBright">{r.error}</Text>}
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color="greenBright">{successes} succeeded</Text>
          {failures > 0 && (
            <Text color="redBright">, {failures} failed</Text>
          )}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press any key to exit</Text>
        </Box>
      </Box>
    );
  }

  if (actions.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="greenBright">Nothing to sync — all editors are already in sync!</Text>
        <Text dimColor>Press any key to exit</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyanBright" bold>
        Select actions to apply{" "}
        {dryRun && <Text color="yellowBright">[DRY RUN]</Text>}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {actions.map((action, i) => {
          const isSelected = selected.has(action.id);
          const isCursor = cursor === i;
          const color =
            action.type === "install"
              ? "greenBright"
              : action.type === "uninstall"
              ? "redBright"
              : "yellow";

          return (
            <Box key={action.id} gap={1}>
              <Text color={isCursor ? "yellow" : undefined}>
                {isCursor ? "▸" : " "}
              </Text>
              <Text color={isSelected ? color : "gray"}>
                {isSelected ? "◆" : "◇"}
              </Text>
              <Text color={color}>
                {action.type === "install"
                  ? "INSTALL"
                  : action.type === "uninstall"
                  ? "REMOVE"
                  : "SETTINGS"}
              </Text>
              <Text>{action.label}</Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          [space] toggle {"  "}[a] select all {"  "}[enter] apply {"  "}[esc] back
        </Text>
      </Box>
    </Box>
  );
}
