import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { registerDialogHandler } from "@/lib/dialogs";

type ConfirmArgs = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
};

type OptionsArgs = {
  title: string;
  message: string;
  options: { label: string; onPress?: () => void; destructive?: boolean }[];
  cancelLabel: string;
};

type DialogState =
  | { type: "confirm"; args: ConfirmArgs; resolve: (value: boolean) => void }
  | { type: "options"; args: OptionsArgs; resolve: (value: number | null) => void };

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const handler = useCallback((state: DialogState) => {
    setDialog(state);
  }, []);

  useEffect(() => {
    registerDialogHandler(handler);
    return () => registerDialogHandler(null);
  }, [handler]);

  const handleClose = useCallback(() => {
    if (!dialog) return;
    if (dialog.type === "confirm") {
      dialog.resolve(false);
    } else {
      dialog.resolve(null);
    }
    setDialog(null);
  }, [dialog]);

  const handleConfirm = useCallback(() => {
    if (!dialog || dialog.type !== "confirm") return;
    dialog.resolve(true);
    setDialog(null);
  }, [dialog]);

  const handleOption = useCallback((index: number) => {
    if (!dialog || dialog.type !== "options") return;
    const option = dialog.args.options[index];
    option?.onPress?.();
    dialog.resolve(index);
    setDialog(null);
  }, [dialog]);

  const content = useMemo(() => {
    if (!dialog) return null;

    const title = dialog.type === "confirm" ? dialog.args.title : dialog.args.title;
    const message = dialog.type === "confirm" ? dialog.args.message : dialog.args.message;

    return (
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText type="h3" style={styles.title}>{title}</ThemedText>
          {message ? (
            <ThemedText style={[styles.message, { color: theme.textSecondary }]}>{message}</ThemedText>
          ) : null}

          {dialog.type === "confirm" ? (
            <View style={styles.buttons}>
              <Pressable onPress={handleClose} style={[styles.button, { borderColor: theme.border }]}
              >
                <ThemedText style={{ color: theme.textSecondary }}>{dialog.args.cancelLabel}</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={[styles.button, { backgroundColor: dialog.args.destructive ? theme.error : theme.accent }]}
              >
                <ThemedText style={{ color: "#FFFFFF" }}>{dialog.args.confirmLabel}</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.options}>
              {dialog.args.options.map((opt, index) => (
                <Pressable
                  key={`${opt.label}-${index}`}
                  onPress={() => handleOption(index)}
                  style={[styles.optionRow, { borderColor: theme.border }]}
                >
                  <ThemedText style={{ color: opt.destructive ? theme.error : theme.text }}>{opt.label}</ThemedText>
                </Pressable>
              ))}
              <Pressable onPress={handleClose} style={[styles.cancelRow, { borderColor: theme.border }]}
              >
                <ThemedText style={{ color: theme.textSecondary }}>{dialog.args.cancelLabel}</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }, [dialog, handleClose, handleConfirm, handleOption, theme]);

  return (
    <>
      {children}
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={handleClose}>
        {content}
      </Modal>
    </>
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
  options: {
    gap: Spacing.sm,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  cancelRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
});
