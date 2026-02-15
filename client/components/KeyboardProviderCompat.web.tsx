import React, { PropsWithChildren } from "react";

type KeyboardProviderCompatProps = PropsWithChildren<Record<string, never>>;

export function KeyboardProviderCompat({ children }: KeyboardProviderCompatProps) {
  return <>{children}</>;
}
