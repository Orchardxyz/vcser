import React from "react";
import { Box, Text } from "ink";

interface StepIndicatorProps {
  current: number;
  total?: number;
}

const STEP_LABELS = ["Select Editors", "Review Diff", "Apply Sync"];

export function StepIndicator({ current, total = 3 }: StepIndicatorProps) {
  const steps = [];

  for (let i = 1; i <= total; i++) {
    if (i < current) {
      steps.push(
        <Text key={i} color="greenBright">
          ✓
        </Text>
      );
    } else if (i === current) {
      steps.push(
        <Text key={i} bold color="yellow">
          {i} {STEP_LABELS[i - 1] ?? ""}
        </Text>
      );
    } else {
      steps.push(
        <Text key={i} dimColor>
          {i}
        </Text>
      );
    }

    if (i < total) {
      steps.push(
        <Text key={`sep-${i}`} dimColor>
          {" · "}
        </Text>
      );
    }
  }

  return (
    <Box marginBottom={1}>
      <Text dimColor>{"[ "}</Text>
      {steps}
      <Text dimColor>{" ]"}</Text>
    </Box>
  );
}
