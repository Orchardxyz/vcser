import React, { useState, useCallback } from "react";
import { Box, useApp, useInput } from "ink";
import type { ResolvedEditor, CliFlags } from "./editors/types.js";
import type { ExtensionDiffResult } from "./extensions/diff.js";
import type { SettingsDiffResult } from "./settings/diff.js";
import { Header } from "./ui/components/Header.js";
import { StepIndicator } from "./ui/components/StepIndicator.js";
import { Step1Select } from "./ui/Step1Select.js";
import { Step2Diff } from "./ui/Step2Diff.js";
import { Step3Sync } from "./ui/Step3Sync.js";

interface AppProps {
  detectedEditors: ResolvedEditor[];
  flags: CliFlags;
}

type Step = 1 | 2 | 3;

export function App({ detectedEditors, flags }: AppProps) {
  const { exit } = useApp();
  const [step, setStep] = useState<Step>(1);
  const [selectedEditors, setSelectedEditors] = useState<ResolvedEditor[]>([]);
  const [extDiff, setExtDiff] = useState<ExtensionDiffResult | null>(null);
  const [settingsDiffs, setSettingsDiffs] = useState<SettingsDiffResult[]>([]);

  const handleStep1Complete = useCallback((editors: ResolvedEditor[]) => {
    setSelectedEditors(editors);
    setStep(2);
  }, []);

  const handleStep2Complete = useCallback(
    (ext: ExtensionDiffResult, settings: SettingsDiffResult[]) => {
      setExtDiff(ext);
      setSettingsDiffs(settings);
      setStep(3);
    },
    []
  );

  const handleBack = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }, []);

  const handleDone = useCallback(() => {
    exit();
  }, [exit]);

  useInput((_input, key) => {
    if (step === 3 && key.return && extDiff === null) {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Header />
      <StepIndicator current={step} />

      {step === 1 && (
        <Step1Select
          detectedEditors={detectedEditors}
          onComplete={handleStep1Complete}
        />
      )}

      {step === 2 && (
        <Step2Diff
          editors={selectedEditors}
          settingsMode={flags.settingsMode}
          onComplete={handleStep2Complete}
          onBack={handleBack}
        />
      )}

      {step === 3 && extDiff && (
        <Step3Sync
          editors={selectedEditors}
          extDiff={extDiff}
          settingsDiffs={settingsDiffs}
          dryRun={flags.dryRun}
          onBack={handleBack}
          onDone={handleDone}
        />
      )}
    </Box>
  );
}
