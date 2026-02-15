import React, { PropsWithChildren } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

type KeyboardProviderCompatProps = PropsWithChildren<Record<string, never>>;

export function KeyboardProviderCompat({ children }: KeyboardProviderCompatProps) {
  return <KeyboardProvider>{children}</KeyboardProvider>;
}
