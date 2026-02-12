import { config } from "dotenv";
import { eq } from "drizzle-orm";

import { appSettings } from "../shared/schema";
import { db } from "../server/db";

config({ path: ".env.local" });

type SettingSeed = {
  key: string;
  value: string;
  category: string;
};

const SETTINGS: SettingSeed[] = [
  {
    key: "app_name",
    value: "Evendi",
    category: "branding",
  },
  {
    key: "app_tagline",
    value: "Ditt arrangement. Perfekt Match.",
    category: "branding",
  },
  {
    key: "app_tagline_en",
    value: "Your Event. Perfectly Matched.",
    category: "branding",
  },
  {
    key: "app_logo_url",
    value: "",
    category: "branding",
  },
  {
    key: "design_primary_color",
    value: "#1E6BFF",
    category: "design",
  },
  {
    key: "design_background_color",
    value: "#0F1F3A",
    category: "design",
  },
  {
    key: "design_dark_mode",
    value: "true",
    category: "design",
  },
  {
    key: "design_font_family",
    value: "System",
    category: "design",
  },
  {
    key: "design_font_size",
    value: "16",
    category: "design",
  },
  {
    key: "design_layout_density",
    value: "standard",
    category: "design",
  },
  {
    key: "design_button_radius",
    value: "8",
    category: "design",
  },
  {
    key: "design_card_radius",
    value: "12",
    category: "design",
  },
  {
    key: "design_border_width",
    value: "1",
    category: "design",
  },
  {
    key: "logo_use_header",
    value: "true",
    category: "branding",
  },
  {
    key: "logo_use_splash",
    value: "true",
    category: "branding",
  },
  {
    key: "logo_use_about",
    value: "true",
    category: "branding",
  },
  {
    key: "logo_use_auth",
    value: "true",
    category: "branding",
  },
  {
    key: "logo_use_admin_header",
    value: "true",
    category: "branding",
  },
  {
    key: "logo_use_docs",
    value: "true",
    category: "branding",
  },
  {
    key: "app_description",
    value:
      "Evendi er en komplett arrangementsplattform for kunder og leverandorer i Skandinavia. Planlegg gjestelister, bordplassering, budsjett, timeline og samarbeid med leverandorer i en felles oversikt.",
    category: "branding",
  },
  {
    key: "app_company_description",
    value:
      "Appen er laget av Norwedfilm, et team med erfaring fra eventbransjen som forstar hva arrangorer trenger for en stressfri planleggingsprosess.",
    category: "branding",
  },
  {
    key: "app_website",
    value: "https://norwedfilm.no",
    category: "branding",
  },
  {
    key: "app_instagram_url",
    value: "https://instagram.com/norwedfilm",
    category: "branding",
  },
  {
    key: "app_instagram_handle",
    value: "@norwedfilm",
    category: "branding",
  },
  {
    key: "support_email",
    value: "contact@norwedfilm.no",
    category: "support",
  },
  {
    key: "support_phone",
    value: "+47 900 00 000",
    category: "support",
  },
  {
    key: "app_version",
    value: "1.0.0",
    category: "general",
  },
  {
    key: "vendor_availability_highlight_ms",
    value: "1200",
    category: "vendor",
  },
  {
    key: "vendor_availability_highlight_intensity",
    value: "0.12",
    category: "vendor",
  },
  {
    key: "wedding_date_min",
    value: "",
    category: "planning",
  },
  {
    key: "wedding_date_max",
    value: "",
    category: "planning",
  },
  {
    key: "delivery_access_confirm_vendor",
    value: "true",
    category: "deliveries",
  },
  {
    key: "delivery_access_confirm_manual",
    value: "false",
    category: "deliveries",
  },
];

async function seedAppSettings() {
  for (const setting of SETTINGS) {
    const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, setting.key));

    if (existing) {
      await db
        .update(appSettings)
        .set({ value: setting.value, category: setting.category, updatedAt: new Date() })
        .where(eq(appSettings.key, setting.key));
    } else {
      await db.insert(appSettings).values({
        key: setting.key,
        value: setting.value,
        category: setting.category,
      });
    }
  }

  console.log("Seeded app settings:", SETTINGS.map((setting) => setting.key));
}

seedAppSettings().catch((error) => {
  console.error("Failed to seed app settings:", error);
  process.exit(1);
});
