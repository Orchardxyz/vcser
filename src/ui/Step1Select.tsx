import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import type { ResolvedEditor, CustomEditorInput } from "../editors/types";
import { EditorBadge } from "./components/EditorBadge";
import { resolveCustomEditor } from "../editors/detect";

interface Step1Props {
  detectedEditors: ResolvedEditor[];
  onComplete: (selected: ResolvedEditor[]) => void;
}

type Phase = "select" | "custom-name" | "custom-ext" | "custom-settings" | "custom-cli";

export function Step1Select({ detectedEditors, onComplete }: Step1Props) {
  const [editors, setEditors] = useState<ResolvedEditor[]>(detectedEditors);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<Phase>("select");
  const [customInput, setCustomInput] = useState<Partial<CustomEditorInput>>({});

  const itemCount = editors.length + 1;

  useInput((input, key) => {
    if (phase !== "select") return;

    if (key.upArrow) {
      setCursor((c) => (c > 0 ? c - 1 : itemCount - 1));
    } else if (key.downArrow) {
      setCursor((c) => (c < itemCount - 1 ? c + 1 : 0));
    } else if (input === " ") {
      if (cursor < editors.length) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(cursor)) next.delete(cursor);
          else next.add(cursor);
          return next;
        });
      }
    } else if (key.return) {
      if (cursor === editors.length) {
        setPhase("custom-name");
        setCustomInput({});
      } else if (selected.size >= 2) {
        onComplete(editors.filter((_, i) => selected.has(i)));
      }
    }
  });

  if (phase === "custom-name") {
    return (
      <Box flexDirection="column">
        <Text color="yellow" bold>Add Custom Editor</Text>
        <Box>
          <Text>Name: </Text>
          <TextInput
            placeholder="e.g. MyEditor"
            onSubmit={(value) => {
              setCustomInput((prev) => ({ ...prev, name: value }));
              setPhase("custom-ext");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (phase === "custom-ext") {
    return (
      <Box flexDirection="column">
        <Text color="yellow" bold>Add Custom Editor: {customInput.name}</Text>
        <Box>
          <Text>Extensions path: </Text>
          <TextInput
            placeholder="/path/to/extensions"
            onSubmit={(value) => {
              setCustomInput((prev) => ({ ...prev, extensionsPath: value }));
              setPhase("custom-settings");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (phase === "custom-settings") {
    return (
      <Box flexDirection="column">
        <Text color="yellow" bold>Add Custom Editor: {customInput.name}</Text>
        <Box>
          <Text>Settings path: </Text>
          <TextInput
            placeholder="/path/to/settings.json"
            onSubmit={(value) => {
              setCustomInput((prev) => ({ ...prev, settingsPath: value }));
              setPhase("custom-cli");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (phase === "custom-cli") {
    return (
      <Box flexDirection="column">
        <Text color="yellow" bold>Add Custom Editor: {customInput.name}</Text>
        <Box>
          <Text>CLI command: </Text>
          <TextInput
            placeholder="e.g. myeditor"
            onSubmit={(value) => {
              const input: CustomEditorInput = {
                name: customInput.name!,
                extensionsPath: customInput.extensionsPath!,
                settingsPath: customInput.settingsPath!,
                cli: value,
              };
              const resolved = resolveCustomEditor(input);
              setEditors((prev) => [...prev, resolved]);
              setPhase("select");
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyanBright" bold>
        Select editors to sync <Text dimColor>(space to toggle, enter to confirm)</Text>
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {editors.map((editor, i) => {
          const isSelected = selected.has(i);
          const isCursor = cursor === i;
          return (
            <Box key={editor.slug} gap={1}>
              <Text color={isCursor ? "yellow" : undefined}>
                {isCursor ? "▸" : " "}
              </Text>
              <Text color={isSelected ? "greenBright" : "gray"}>
                {isSelected ? "◆" : "◇"}
              </Text>
              <EditorBadge name={editor.name} color={editor.badgeColor} />
              {!editor.cliAvailable && (
                <Text dimColor>(no CLI)</Text>
              )}
              {!editor.extensionsExist && !editor.settingsExist && (
                <Text dimColor>(not found)</Text>
              )}
            </Box>
          );
        })}
        <Box gap={1}>
          <Text color={cursor === editors.length ? "yellow" : undefined}>
            {cursor === editors.length ? "▸" : " "}
          </Text>
          <Text color="gray">＋</Text>
          <Text dimColor>Add custom editor...</Text>
        </Box>
      </Box>
      {selected.size < 2 && (
        <Box marginTop={1}>
          <Text dimColor>Select at least 2 editors to continue</Text>
        </Box>
      )}
    </Box>
  );
}
