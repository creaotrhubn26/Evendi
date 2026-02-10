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
    key: "app_description",
    value:
      "Wedflow er en komplett bryllupsplattform for par og leverandorer i Skandinavia. Planlegg gjestelister, bordplassering, budsjett, timeline og samarbeid med leverandorer i en felles oversikt.",
    category: "branding",
  },
  {
    key: "app_company_description",
    value:
      "Appen er laget av Norwedfilm, et team med erfaring fra bryllupsbransjen som forstar hva par trenger for en stressfri planleggingsprosess.",
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
