import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { ResolvedEditor } from "../editors/types";
import { readAllExtensions } from "../extensions/reader";
import { computeExtensionDiff, type ExtensionDiffResult } from "../extensions/diff";
import { readAllSettings } from "../settings/reader";
import { computeSettingsDiff, type SettingsDiffResult } from "../settings/diff";
import { DiffMatrix } from "./components/DiffMatrix";
import type { SettingsMode } from "../editors/types";

interface Step2Props {
  editors: ResolvedEditor[];
  settingsMode: SettingsMode;
  onComplete: (
    extDiff: ExtensionDiffResult,
    settingsDiffs: SettingsDiffResult[]
  ) => void;
  onBack: () => void;
}

export function Step2Diff({ editors, settingsMode, onComplete, onBack }: Step2Props) {
  const [showAll, setShowAll] = useState(false);

  const extDiff = useMemo(() => {
    const allExt = readAllExtensions(editors);
    return computeExtensionDiff(allExt);
  }, [editors]);

  const settingsDiffs = useMemo(() => {
    const allSettings = readAllSettings(editors);
    const diffs: SettingsDiffResult[] = [];
    for (let i = 1; i < allSettings.length; i++) {
      diffs.push(computeSettingsDiff(allSettings[0]!, allSettings[i]!, settingsMode));
    }
    return diffs;
  }, [editors, settingsMode]);

  useInput((input, key) => {
    if (input === "a") {
      setShowAll((v) => !v);
    } else if (key.return) {
      onComplete(extDiff, settingsDiffs);
    } else if (key.escape) {
      onBack();
    }
  });

  const totalSettingsChanges = settingsDiffs.reduce(
    (sum, d) => sum + d.diffs.length,
    0
  );

  return (
    <Box flexDirection="column">
      <Text color="cyanBright" bold>
        Extensions Diff
      </Text>
      <DiffMatrix diff={extDiff} showAll={showAll} />

      <Box marginTop={1} flexDirection="column">
        <Text color="cyanBright" bold>
          Settings Diff
        </Text>
        {settingsDiffs.length === 0 ? (
          <Text dimColor>No settings differences found.</Text>
        ) : (
          settingsDiffs.map((sd) => (
            <Box key={`${sd.sourceName}-${sd.targetName}`} gap={1} marginLeft={1}>
              <Text>
                {sd.sourceName} → {sd.targetName}:
              </Text>
              <Text color="greenBright">+{sd.addCount}</Text>
              <Text color="yellow">~{sd.updateCount}</Text>
              {sd.deleteCount > 0 && (
                <Text color="redBright">-{sd.deleteCount}</Text>
              )}
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          [a] toggle all/diffs only {"  "}[enter] continue {"  "}[esc] back
        </Text>
        <Text dimColor>
          {extDiff.onlyDiffs.length} ext diff{extDiff.onlyDiffs.length !== 1 ? "s" : ""},{" "}
          {totalSettingsChanges} settings change{totalSettingsChanges !== 1 ? "s" : ""}
        </Text>
      </Box>
    </Box>
  );
}
