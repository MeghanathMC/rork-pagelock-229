import { Stack } from "expo-router";
import React from "react";
import { colors } from "@/constants/theme";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' as const },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'PageLock' }} />
    </Stack>
  );
}
