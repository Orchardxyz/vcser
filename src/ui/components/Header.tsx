import React from "react";
import { Box, Text } from "ink";

export function Header() {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={2}
      marginBottom={1}
    >
      <Text bold color="yellow">
        {"▸ vcser"}
      </Text>
      <Text dimColor>sync your editors</Text>
    </Box>
  );
}
