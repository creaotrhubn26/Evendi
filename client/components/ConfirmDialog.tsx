import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <ThemedText type="h3" style={styles.title}>{title}</ThemedText>
          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>{message}</ThemedText>
          <View style={styles.buttons}>
            <Pressable onPress={onCancel} style={[styles.button, { borderColor: theme.border }]}
            >
              <ThemedText style={{ color: theme.textSecondary }}>{cancelLabel}</ThemedText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: destructive ? theme.error : theme.accent }]}
            >
              <ThemedText style={{ color: "#FFFFFF" }}>{confirmLabel}</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
});
