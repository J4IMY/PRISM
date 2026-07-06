import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type PasswordInputProps = TextInputProps;

export function PasswordInput({ style, ...props }: PasswordInputProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.backgroundElement,
          },
          style,
        ]}
        secureTextEntry={!visible}
        {...props}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        style={styles.toggle}
        accessibilityLabel={visible ? "Hide password" : "Show password"}
        accessibilityRole="button"
      >
        <SymbolView
          name={{
            ios: visible ? "eye.slash" : "eye",
            android: visible ? "visibility_off" : "visibility",
            web: visible ? "visibility_off" : "visibility",
          }}
          size={20}
          tintColor={theme.mutedForeground}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative" },
  input: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingRight: 44,
    fontSize: 15,
  },
  toggle: {
    position: "absolute",
    right: Spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
});
