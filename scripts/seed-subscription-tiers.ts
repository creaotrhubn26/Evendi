import { db } from "./db";
import { subscriptionTiers } from "@shared/schema";

const DEFAULT_TIERS = [
  {
    name: "starter",
    displayName: "Starter",
    description: "Perfect for new vendors getting started",
    priceNok: 149,
    sortOrder: 1,
    isActive: true,
    maxInspirationPhotos: 10,
    maxMonthlyVideoMinutes: 0,
    maxStorageGb: 5,
    hasAdvancedAnalytics: false,
    hasPrioritizedSearch: false,
    hasCustomLandingPage: false,
    hasApiAccess: false,
    hasVippsPaymentLink: false,
    hasCustomBranding: false,
    commissionPercentage: 3,
    stripeFeePercentage: 0,
  },
  {
    name: "professional",
    displayName: "Professional",
    description: "For established vendors with growing businesses",
    priceNok: 299,
    sortOrder: 2,
    isActive: true,
    maxInspirationPhotos: -1, // Unlimited
    maxMonthlyVideoMinutes: 60,
    maxStorageGb: 50,
    hasAdvancedAnalytics: true,
    hasPrioritizedSearch: true,
    hasCustomLandingPage: true,
    hasApiAccess: false,
    hasVippsPaymentLink: true,
    hasCustomBranding: false,
    commissionPercentage: 2,
    stripeFeePercentage: 0,
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "Full suite for high-volume vendors",
    priceNok: 599,
    sortOrder: 3,
    isActive: true,
    maxInspirationPhotos: -1, // Unlimited
    maxMonthlyVideoMinutes: 300,
    maxStorageGb: 500,
    hasAdvancedAnalytics: true,
    hasPrioritizedSearch: true,
    hasCustomLandingPage: true,
    hasApiAccess: true,
    hasVippsPaymentLink: true,
    hasCustomBranding: true,
    commissionPercentage: 1,
    stripeFeePercentage: 0,
  },
];

async function seedTiers() {
  try {
    console.log("🌱 Starting subscription tiers seed...");

    // Check if tiers already exist
    const existing = await db.select().from(subscriptionTiers);
    if (existing.length > 0) {
      console.log("⚠️  Tiers already exist. Skipping seed.");
      return;
    }

    // Insert tiers
    for (const tier of DEFAULT_TIERS) {
      const [created] = await db.insert(subscriptionTiers).values(tier).returning();
      console.log(`✅ Created tier: ${created.displayName} (${created.priceNok} NOK/mnd)`);
    }

    console.log("🎉 Subscription tiers seed completed!");
    console.log("\nTiers created:");
    DEFAULT_TIERS.forEach((t) => {
      console.log(`  • ${t.displayName}: ${t.priceNok} NOK/month`);
    });
  } catch (error) {
    console.error("❌ Error seeding tiers:", error);
    throw error;
  }
}

// Run the seed
seedTiers()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
