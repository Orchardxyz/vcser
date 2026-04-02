import React from "react";
import { Text } from "ink";

interface EditorBadgeProps {
  name: string;
  color: string;
}

export function EditorBadge({ name, color }: EditorBadgeProps) {
  return (
    <Text backgroundColor={color} color="black">
      {` ${name} `}
    </Text>
  );
}
