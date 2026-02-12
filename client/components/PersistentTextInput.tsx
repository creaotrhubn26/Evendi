import React, { useEffect, useMemo, useRef, useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";

const STORAGE_PREFIX = "evendi_draft";

function normalizeKey(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildDraftKey(
  routeName: string,
  draftKey: string | undefined,
  placeholder: string | undefined,
  accessibilityLabel: string | undefined,
) {
  if (draftKey) {
    return `${STORAGE_PREFIX}:${normalizeKey(draftKey)}`;
  }

  const label = normalizeKey(accessibilityLabel || placeholder || "input");
  return `${STORAGE_PREFIX}:${routeName}:${label}`;
}

export type PersistentTextInputProps = TextInputProps & {
  draftKey?: string;
};

export const PersistentTextInput = React.forwardRef<TextInput, PersistentTextInputProps>(
  (
    {
      draftKey,
      onChangeText,
      value,
      defaultValue,
      placeholder,
      accessibilityLabel,
      ...rest
    },
    ref,
  ) => {
  const route = useRoute();
  const storageKey = useMemo(
    () => buildDraftKey(route.name, draftKey, placeholder, accessibilityLabel),
    [route.name, draftKey, placeholder, accessibilityLabel],
  );
  const [internalValue, setInternalValue] = useState<string>(
    typeof value === "string" ? value : String(defaultValue ?? ""),
  );
  const isHydrated = useRef(false);

  useEffect(() => {
    if (typeof value === "string") {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    let isMounted = true;
    const hydrateDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem(storageKey);
        if (!isMounted || draft == null) return;

        if (typeof value === "string") {
          onChangeText?.(draft);
        } else {
          setInternalValue(draft);
        }
      } catch {
        // Best-effort draft hydration
      } finally {
        if (isMounted) {
          isHydrated.current = true;
        }
      }
    };

    hydrateDraft();
    return () => {
      isMounted = false;
    };
  }, [storageKey, value, onChangeText]);

  const handleChangeText = (text: string) => {
    if (!isHydrated.current) {
      isHydrated.current = true;
    }

    if (typeof value !== "string") {
      setInternalValue(text);
    }

    onChangeText?.(text);

    if (text.trim().length === 0) {
      AsyncStorage.removeItem(storageKey).catch(() => undefined);
      return;
    }

    AsyncStorage.setItem(storageKey, text).catch(() => undefined);
  };

    return (
      <TextInput
        ref={ref}
        {...rest}
        value={typeof value === "string" ? value : internalValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
      />
    );
  },
);

PersistentTextInput.displayName = "PersistentTextInput";

export default PersistentTextInput;
