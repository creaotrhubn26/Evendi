/**
 * Vendor Matching System
 * 
 * Intelligent matching between couples/clients and vendors based on:
 * - Event type expertise (does vendor handle weddings? conferences? seminars?)
 * - B2C vs B2B handling (personal vs corporate events)
 * - Budget alignment
 * - Guest count capacity
 * - Location proximity
 * - Past performance & reviews
 * 
 * Match score: 0-100 (higher = better fit)
 */

import { CoupleEventPreferences, VendorEventTypeExpertise, VendorCategoryPreferences, Vendor } from "@shared/schema";

export interface VendorMatchResult {
  vendorId: string;
  vendorName: string;
  overallScore: number;
  scores: {
    eventTypeMatch: number;      // 0-100: expertise in this event type
    categoryMatch: number;        // 0-100: B2C/B2B category match
    budgetMatch: number;          // 0-100: price alignment
    capacityMatch: number;        // 0-100: guest count fit
    locationMatch: number;        // 0-100: distance proximity
    vibeMatch: number;            // 0-100: style compatibility (if available)
    reviewMatch: number;          // 0-100: past performance
  };
  matchReasons: string[]; // Why this vendor is a good match
  warnings?: string[];    // Potential concerns (e.g., "budget is tight")
}

export interface MatchingWeights {
  eventType: number;     // 25% - Most important
  category: number;      // 20% - B2C vs B2B fit
  budget: number;        // 20% - Price alignment
  capacity: number;      // 15% - Guest count
  location: number;      // 10% - Proximity
  vibe: number;          // 5%  - Style
  reviews: number;       // 5%  - Past performance
}

// Default weights prioritizing expertise and category fit
export const DEFAULT_WEIGHTS: MatchingWeights = {
  eventType: 0.25,
  category: 0.20,
  budget: 0.20,
  capacity: 0.15,
  location: 0.10,
  vibe: 0.05,
  reviews: 0.05,
};

/**
 * Calculate event type match score
 * 0-100 points based on vendor expertise in this event type
 */
export function calculateEventTypeMatch(
  candidateEventType: string,
  vendorExpertise: VendorEventTypeExpertise | null,
  vendorIsSpecialized: boolean
): number {
  if (!vendorExpertise) return 0;
  
  const isExactMatch = vendorExpertise.eventType === candidateEventType;
  if (!isExactMatch) return 0; // Vendor must handle this event type
  
  // Bonus points for specialization and years of experience
  let score = 60; // Base score for handling this event type
  
  if (vendorIsSpecialized) score += 20;
  
  if (vendorExpertise.yearsExperience && vendorExpertise.yearsExperience >= 5) {
    score += 10;
  }
  
  // Bonus for completed events in this category
  if (vendorExpertise.completedEvents && vendorExpertise.completedEvents >= 20) {
    score += 10;
  }
  
  return Math.min(100, score);
}

/**
 * Calculate category (B2C vs B2B) match
 * Ensure vendor handles the type of event client needs
 */
export function calculateCategoryMatch(
  coupleCategory: "personal" | "corporate",
  vendorPrefs: VendorCategoryPreferences | null
): number {
  if (!vendorPrefs) return 30; // If no preferences set, assume they handle it (neutral score)
  
  if (coupleCategory === "personal" && vendorPrefs.handleB2C) return 100;
  if (coupleCategory === "corporate" && vendorPrefs.handleB2B) return 100;
  
  // They don't handle this category
  return 0;
}

/**
 * Calculate budget match score
 * 0-100 based on price alignment
 */
export function calculateBudgetMatch(
  coupleMinBudget: number | null,
  coupleMaxBudget: number | null,
  vendorPriceMin: number | null,
  vendorPriceMax: number | null
): number {
  if (!coupleMinBudget || !coupleMaxBudget) return 75; // No budget specified, neutral
  if (!vendorPriceMin && !vendorPriceMax) return 75;  // Vendor has no price set
  
  const coupleBudgetMid = (coupleMinBudget + coupleMaxBudget) / 2;
  const vendorAvgPrice = vendorPriceMin && vendorPriceMax 
    ? (vendorPriceMin + vendorPriceMax) / 2 
    : (vendorPriceMin || vendorPriceMax || 0);
  
  // Check if ranges overlap
  if (vendorPriceMin && vendorPriceMin > coupleMaxBudget) {
    return 0; // Vendor too expensive
  }
  if (vendorPriceMax && vendorPriceMax < coupleMinBudget) {
    return 0; // Vendor too cheap (might not be quality fit)
  }
  
  // Calculate overlap percentage
  const overlapStart = Math.max(coupleMinBudget, vendorPriceMin || 0);
  const overlapEnd = Math.min(coupleMaxBudget, vendorPriceMax || Infinity);
  const overlapRange = overlapEnd - overlapStart;
  const coupleRange = coupleMaxBudget - coupleMinBudget;
  
  return Math.min(100, Math.round((overlapRange / coupleRange) * 100));
}

/**
 * Calculate capacity match score
 * 0-100 based on guest count fit
 */
export function calculateCapacityMatch(
  coupleGuestCount: number | null,
  vendorMinCapacity: number | null,
  vendorMaxCapacity: number | null
): number {
  if (!coupleGuestCount) return 75; // Not specified
  if (!vendorMinCapacity && !vendorMaxCapacity) return 75; // Vendor has no capacity limits
  
  // Check if guest count is within vendor's range
  if (vendorMinCapacity && coupleGuestCount < vendorMinCapacity) {
    return Math.max(0, 50 - (vendorMinCapacity - coupleGuestCount) / 10); // Penalty for too small
  }
  
  if (vendorMaxCapacity && coupleGuestCount > vendorMaxCapacity) {
    return Math.max(0, 50 - (coupleGuestCount - vendorMaxCapacity) / 10); // Penalty for too large
  }
  
  // Perfect fit
  return 100;
}

/**
 * Calculate location match score
 * 0-100 based on distance proximity
 */
export function calculateLocationMatch(
  coupleLocation: string | null,
  coupleLocationRadius: number | null,
  vendorLocation: string | null
): number {
  if (!coupleLocation || !vendorLocation) return 75; // Not specified, neutral
  if (!coupleLocationRadius) coupleLocationRadius = 50; // Default 50km if not specified
  
  // For simplicity, check if vendor location contains couple location keywords
  // In production, use proper geo-distance calculation via lat/lon
  const vendorCityLower = vendorLocation.toLowerCase();
  const coupleCityLower = coupleLocation.toLowerCase();
  
  if (vendorCityLower.includes(coupleCityLower) || coupleCityLower.includes(vendorCityLower)) {
    return 100; // Same city
  }
  
  // Same region/county (simple heuristic)
  const regionMatch = vendorCityLower.split(",")[vendorCityLower.split(",").length - 1] ===
                      coupleCityLower.split(",")[coupleCityLower.split(",").length - 1];
  
  if (regionMatch) return 80;
  
  // Different location
  return 40;
}

/**
 * Calculate vibe match score
 * 0-100 based on style compatibility
 */
export function calculateVibeMatch(
  coupleVibes: string[] | null,
  vendorDescription: string | null
): number {
  if (!coupleVibes || coupleVibes.length === 0) return 75; // Not specified
  if (!vendorDescription) return 50;                       // Can't assess
  
  const descriptionLower = vendorDescription.toLowerCase();
  let matches = 0;
  
  for (const vibe of coupleVibes) {
    if (descriptionLower.includes(vibe.toLowerCase())) {
      matches++;
    }
  }
  
  return Math.round((matches / coupleVibes.length) * 100);
}

/**
 * Calculate review match score
 * 0-100 based on past performance
 */
export function calculateReviewMatch(
  vendorReviewScore: number | null
): number {
  if (vendorReviewScore === null) return 75; // No reviews, neutral
  return Math.min(100, vendorReviewScore);
}

/**
 * Main matching function
 * Calculate overall compatibility score between couple and vendor
 */
export function calculateVendorMatch(
  couplePreferences: CoupleEventPreferences,
  vendor: Vendor & {
    eventTypeExpertise: VendorEventTypeExpertise | null;
    categoryPrefs: VendorCategoryPreferences | null;
    reviewScore?: number;
  },
  weights: MatchingWeights = DEFAULT_WEIGHTS
): VendorMatchResult {
  // Calculate individual match scores
  const eventTypeMatch = calculateEventTypeMatch(
    couplePreferences.eventType,
    vendor.eventTypeExpertise,
    vendor.eventTypeExpertise?.isSpecialized ?? false
  );
  
  const categoryMatch = calculateCategoryMatch(
    couplePreferences.eventCategory as "personal" | "corporate",
    vendor.categoryPrefs
  );
  
  const budgetMatch = calculateBudgetMatch(
    couplePreferences.budgetMin,
    couplePreferences.budgetMax,
    vendor.priceRange ? parseInt(vendor.priceRange.split("-")[0]) : null,
    vendor.priceRange ? parseInt(vendor.priceRange.split("-")[1]) : null
  );
  
  const capacityMatch = calculateCapacityMatch(
    couplePreferences.guestCount,
    null, // This would come from vendor category details
    null
  );
  
  const locationMatch = calculateLocationMatch(
    couplePreferences.eventLocation,
    couplePreferences.eventLocationRadius,
    vendor.location
  );
  
  const desiredVibes = couplePreferences.desiredEventVibe
    ? (JSON.parse(couplePreferences.desiredEventVibe) as string[])
    : null;

  const vibeMatch = calculateVibeMatch(
    desiredVibes,
    vendor.description
  );
  
  const reviewMatch = calculateReviewMatch(vendor.reviewScore ?? null);
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    eventTypeMatch * weights.eventType +
    categoryMatch * weights.category +
    budgetMatch * weights.budget +
    capacityMatch * weights.capacity +
    locationMatch * weights.location +
    vibeMatch * weights.vibe +
    reviewMatch * weights.reviews
  );
  
  // Generate match reasons
  const matchReasons: string[] = [];
  const warnings: string[] = [];
  
  if (eventTypeMatch >= 80) {
    matchReasons.push(`Specialized expertise in ${couplePreferences.eventType}`);
  }
  
  if (categoryMatch === 100) {
    matchReasons.push(`${vendor.categoryPrefs?.handleB2B ? "Corporate" : "Personal"} event specialist`);
  }
  
  if (budgetMatch === 100) {
    matchReasons.push("Price range perfectly aligned");
  } else if (budgetMatch < 50) {
    warnings.push("Price range may not align with vendor");
  }
  
  if (locationMatch === 100) {
    matchReasons.push("Local vendor - same city");
  } else if (locationMatch >= 80) {
    matchReasons.push("Regional vendor");
  }
  
  if (reviewMatch >= 90) {
    matchReasons.push("Excellent reviews from past clients");
  }
  
  if (eventTypeMatch === 0) {
    warnings.push("Vendor does not have expertise in this event type");
  }
  
  if (categoryMatch === 0) {
    warnings.push("Vendor does not handle this type of event");
  }
  
  return {
    vendorId: vendor.id,
    vendorName: vendor.businessName,
    overallScore,
    scores: {
      eventTypeMatch,
      categoryMatch,
      budgetMatch,
      capacityMatch,
      locationMatch,
      vibeMatch,
      reviewMatch,
    },
    matchReasons,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Sort and filter vendors by match score
 * Returns only vendors that meet minimum threshold
 */
export function rankVendors(
  matchResults: VendorMatchResult[],
  minScore: number = 50
): VendorMatchResult[] {
  return matchResults
    .filter(r => r.overallScore >= minScore)
    .sort((a, b) => b.overallScore - a.overallScore);
}
