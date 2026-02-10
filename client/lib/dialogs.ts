import { showToast } from "@/lib/toast";

type ConfirmArgs = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type OptionItem = {
  label: string;
  onPress?: () => void;
  destructive?: boolean;
};

type OptionsArgs = {
  title: string;
  message?: string;
  options: OptionItem[];
  cancelLabel?: string;
};

type DialogState =
  | { type: "confirm"; args: Required<ConfirmArgs>; resolve: (value: boolean) => void }
  | { type: "options"; args: Required<OptionsArgs>; resolve: (value: number | null) => void };

type DialogHandler = (state: DialogState) => void;

let dialogHandler: DialogHandler | null = null;

export function registerDialogHandler(handler: DialogHandler | null) {
  dialogHandler = handler;
}

export function showConfirm(args: ConfirmArgs): Promise<boolean> {
  const normalized: Required<ConfirmArgs> = {
    title: args.title,
    message: args.message,
    confirmLabel: args.confirmLabel ?? "OK",
    cancelLabel: args.cancelLabel ?? "Cancel",
    destructive: args.destructive ?? false,
  };

  if (!dialogHandler) {
    showToast(normalized.message);
    return Promise.resolve(false);
  }

  return new Promise((resolve) => dialogHandler!({ type: "confirm", args: normalized, resolve }));
}

export function showOptions(args: OptionsArgs): Promise<number | null> {
  const normalized: Required<OptionsArgs> = {
    title: args.title,
    message: args.message ?? "",
    options: args.options,
    cancelLabel: args.cancelLabel ?? "Cancel",
  };

  if (!dialogHandler) {
    showToast(normalized.title);
    return Promise.resolve(null);
  }

  return new Promise((resolve) => dialogHandler!({ type: "options", args: normalized, resolve }));
}
