import React from "react";
import { Box, Text } from "ink";
import type { ExtensionDiffResult } from "../../extensions/diff.js";

interface DiffMatrixProps {
  diff: ExtensionDiffResult;
  showAll?: boolean;
}

const COL_WIDTH = 12;
const EXT_COL_WIDTH = 36;

function pad(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return str + " ".repeat(width - str.length);
}

export function DiffMatrix({ diff, showAll = false }: DiffMatrixProps) {
  const rows = showAll ? diff.all : diff.onlyDiffs;

  if (rows.length === 0) {
    return (
      <Box marginY={1}>
        <Text color="greenBright">All extensions are identical across selected editors.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Header row */}
      <Box>
        <Text dimColor>{pad("Extension", EXT_COL_WIDTH)}</Text>
        {diff.editorNames.map((name) => (
          <Text key={name} bold color="cyanBright">
            {pad(name, COL_WIDTH)}
          </Text>
        ))}
      </Box>

      {/* Separator */}
      <Text dimColor>{"─".repeat(EXT_COL_WIDTH + diff.editorNames.length * COL_WIDTH)}</Text>

      {/* Data rows */}
      {rows.map((row) => (
        <Box key={row.extensionId}>
          <Text>{pad(row.extensionId, EXT_COL_WIDTH)}</Text>
          {diff.editorNames.map((name) => {
            const present = row.presence.get(name);
            return (
              <Text key={name} color={present ? "greenBright" : "red"} dimColor={!present}>
                {pad(present ? "✓" : "✗", COL_WIDTH)}
              </Text>
            );
          })}
        </Box>
      ))}

      {/* Summary */}
      <Box marginTop={1}>
        <Text dimColor>
          {rows.length} extension{rows.length !== 1 ? "s" : ""} differ across{" "}
          {diff.editorNames.length} editors
        </Text>
      </Box>
    </Box>
  );
}
