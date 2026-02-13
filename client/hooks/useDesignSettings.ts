import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";

export interface DesignSettings {
  primaryColor: string;
  backgroundColor: string;
  appName: string;
  appTagline: string;
  appTaglineEn: string;
  logoUrl: string;
  logoUseHeader: boolean;
  logoUseSplash: boolean;
  logoUseAbout: boolean;
  logoUseAuth: boolean;
  logoUseAdminHeader: boolean;
  logoUseDocs: boolean;
  darkMode: boolean;
  fontFamily: string;
  fontSize: string;
  layoutDensity: string;
  buttonRadius: string;
  cardRadius: string;
  borderWidth: string;
  // Semantic colors (admin-overridable)
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  ratingStarColor: string;
}

const DEFAULT_SETTINGS: DesignSettings = {
  primaryColor: "#1E6BFF",
  backgroundColor: "#0F1F3A",
  appName: "Evendi",
  appTagline: "Ditt arrangement. Perfekt Match.",
  appTaglineEn: "Your Event. Perfectly Matched.",
  logoUrl: "", // Will be set from backend or use bundled logo in HeaderTitle
  logoUseHeader: true,
  logoUseSplash: true,
  logoUseAbout: true,
  logoUseAuth: true,
  logoUseAdminHeader: true,
  logoUseDocs: true,
  darkMode: true,
  fontFamily: "System",
  fontSize: "16",
  layoutDensity: "standard",
  buttonRadius: "8",
  cardRadius: "12",
  borderWidth: "1",
  colorSuccess: "",
  colorWarning: "",
  colorError: "",
  colorInfo: "",
  ratingStarColor: "",
};

export function useDesignSettings() {
  const { data: rawSettings, isLoading } = useQuery({
    queryKey: ["design-settings"],
    queryFn: async () => {
      try {
        const url = new URL("/api/app-settings", getApiUrl());
        const response = await fetch(url.toString());
        if (!response.ok) {
          console.log("Failed to fetch design settings:", response.status);
          return null;
        }
        const data = await response.json();
        console.log("Design settings loaded:", data);
        return data;
      } catch (error) {
        console.log("Failed to load design settings, using defaults:", error);
        return null;
      }
    },
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });

  // Convert raw settings array to DesignSettings object (copy defaults to avoid mutation)
  const settings: DesignSettings = { ...DEFAULT_SETTINGS };

  if (rawSettings && Array.isArray(rawSettings)) {
    rawSettings.forEach((setting: { key: string; value: string }) => {
      switch (setting.key) {
        case "design_primary_color":
          settings.primaryColor = setting.value;
          break;
        case "design_background_color":
          settings.backgroundColor = setting.value;
          break;
        case "app_name":
          settings.appName = setting.value;
          break;
        case "app_tagline":
          settings.appTagline = setting.value;
          break;
        case "app_tagline_en":
          settings.appTaglineEn = setting.value;
          break;
        case "app_logo_url":
          settings.logoUrl = setting.value;
          break;
        case "logo_use_header":
          settings.logoUseHeader = setting.value === "true";
          break;
        case "logo_use_splash":
          settings.logoUseSplash = setting.value === "true";
          break;
        case "logo_use_about":
          settings.logoUseAbout = setting.value === "true";
          break;
        case "logo_use_auth":
          settings.logoUseAuth = setting.value === "true";
          break;
        case "logo_use_admin_header":
          settings.logoUseAdminHeader = setting.value === "true";
          break;
        case "logo_use_docs":
          settings.logoUseDocs = setting.value === "true";
          break;
        case "design_dark_mode":
          settings.darkMode = setting.value === "true";
          break;
        case "design_font_family":
          settings.fontFamily = setting.value;
          break;
        case "design_font_size":
          settings.fontSize = setting.value;
          break;
        case "design_layout_density":
          settings.layoutDensity = setting.value;
          break;
        case "design_button_radius":
          settings.buttonRadius = setting.value;
          break;
        case "design_card_radius":
          settings.cardRadius = setting.value;
          break;
        case "design_border_width":
          settings.borderWidth = setting.value;
          break;
        case "color_success":
          settings.colorSuccess = setting.value;
          break;
        case "color_warning":
          settings.colorWarning = setting.value;
          break;
        case "color_error":
          settings.colorError = setting.value;
          break;
        case "color_info":
          settings.colorInfo = setting.value;
          break;
        case "rating_star_color":
          settings.ratingStarColor = setting.value;
          break;
      }
    });
  }

  console.log("Final design settings:", settings);

  return { settings, isLoading, DEFAULT_SETTINGS };
}
