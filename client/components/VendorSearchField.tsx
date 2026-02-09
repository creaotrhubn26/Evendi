/**
 * VendorSearchField – Drop-in vendor search for any couple-facing screen.
 *
 * Bundles useVendorSearch + VendorSuggestions + VendorActionBar into ONE component.
 * Future screens only need to import this single component:
 *
 * ```tsx
 * import { VendorSearchField } from '@/components/VendorSearchField';
 *
 * <VendorSearchField
 *   category="florist"
 *   icon="sun"
 *   label="Florist"
 *   placeholder="Søk etter registrert florist..."
 * />
 * ```
 *
 * For form modals where you also need the selected name as local state:
 *
 * ```tsx
 * <VendorSearchField
 *   category="bakery"
 *   icon="gift"
 *   label="Bakeri navn *"
 *   placeholder="Søk etter registrert bakeri..."
 *   onNameChange={(name) => setBakeryName(name)}
 *   externalValue={bakeryName}
 * />
 * ```
 */
import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { VendorSuggestions } from "@/components/VendorSuggestions";
import { VendorActionBar } from "@/components/VendorActionBar";
import { useVendorSearch, VendorSuggestion } from "@/hooks/useVendorSearch";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { PlanningStackParamList } from "@/navigation/PlanningStackNavigator";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];
type NavigationProp = NativeStackNavigationProp<PlanningStackParamList>;

export interface VendorSearchFieldProps {
  /** Vendor category slug (e.g., "florist", "catering", "beauty", "photographer") */
  category: string;
  /** Feather icon name for this category */
  icon?: FeatherIconName;
  /** Label above the search input */
  label?: string;
  /** Placeholder text in the search input */
  placeholder?: string;
  /**
   * Called whenever the displayed vendor name changes (typing or selection).
   * Useful for syncing with form state in modal screens.
   */
  onNameChange?: (name: string) => void;
  /**
   * External controlled value for the text input.
   * When provided, the component uses this OR the internal search text, whichever is non-empty.
   */
  externalValue?: string;
  /**
   * Called when a vendor is selected from suggestions.
   * The VendorActionBar is shown automatically; this is for extra side-effects.
   */
  onSelect?: (vendor: VendorSuggestion) => void;
  /**
   * Called when user clears the selection.
   */
  onClear?: () => void;
  /** Override the input style */
  inputStyle?: object;
}

/**
 * All-in-one vendor search field.
 * Renders: label → TextInput → VendorActionBar (when selected) → VendorSuggestions dropdown.
 */
export function VendorSearchField({
  category,
  icon = "briefcase",
  label,
  placeholder = "Søk etter leverandør...",
  onNameChange,
  externalValue,
  onSelect: onSelectProp,
  onClear: onClearProp,
  inputStyle,
}: VendorSearchFieldProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const vendorSearch = useVendorSearch({ category });

  const displayValue = externalValue ?? vendorSearch.searchText;

  const handleChangeText = (text: string) => {
    vendorSearch.onChangeText(text);
    onNameChange?.(text);
  };

  const handleSelect = (vendor: VendorSuggestion) => {
    vendorSearch.onSelectVendor(vendor);
    onNameChange?.(vendor.businessName);
    onSelectProp?.(vendor);
  };

  const handleClear = () => {
    vendorSearch.clearSelection();
    onNameChange?.("");
    onClearProp?.();
  };

  const handleViewProfile = (vendor: VendorSuggestion) => {
    navigation.navigate("VendorDetail", {
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorDescription: vendor.description || "",
      vendorLocation: vendor.location || "",
      vendorPriceRange: vendor.priceRange || "",
      vendorCategory: category,
    });
  };

  return (
    <View>
      {label && (
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            color: theme.text,
          },
          inputStyle,
        ]}
        value={displayValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
      />
      {vendorSearch.selectedVendor && (
        <VendorActionBar
          vendor={vendorSearch.selectedVendor}
          vendorCategory={category}
          onClear={handleClear}
          icon={icon}
        />
      )}
      <VendorSuggestions
        suggestions={vendorSearch.suggestions}
        isLoading={vendorSearch.isLoading}
        onSelect={handleSelect}
        onViewProfile={handleViewProfile}
        icon={icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
});
