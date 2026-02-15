import React, { PropsWithChildren } from "react";
import { ScrollView, ScrollViewProps } from "react-native";

type Props = ScrollViewProps & PropsWithChildren<Record<string, never>>;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: Props) {
  return (
    <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
}
