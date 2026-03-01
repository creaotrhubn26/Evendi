import { Request, Response, Express } from "express";
import {
  createVendorEventTypeExpertiseSchema,
  createVendorCategoryPreferencesSchema,
  createCoupleEventPreferencesSchema,
  vendorEventTypeExpertise,
  vendorCategoryPreferences,
  coupleEventPreferences,
  vendorMatchScores,
  vendors,
  coupleProfiles,
} from "@shared/schema";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { calculateVendorMatch } from "@shared/vendor-matching";

const toJsonText = (value: unknown) =>
  value === undefined || value === null ? undefined : JSON.stringify(value);

export function registerExpertiseRoutes(app: Express) {
  // ============================================================================
  // VENDOR EXPERTISE ENDPOINTS
  // ============================================================================

  /**
   * POST /api/vendor/expertise
   * Add or update vendor expertise for an event type
   */
  app.post("/api/vendor/expertise", async (req: Request, res: Response) => {
    try {
      const validatedData = createVendorEventTypeExpertiseSchema.parse(req.body);

      // Check if expertise record already exists
      const existing = await db
        .select()
        .from(vendorEventTypeExpertise)
        .where(
          and(
            eq(vendorEventTypeExpertise.vendorId, validatedData.vendorId),
            eq(vendorEventTypeExpertise.eventType, validatedData.eventType)
          )
        )
        .limit(1);

      let result;

      if (existing.length > 0) {
        // Update existing
        result = await db
          .update(vendorEventTypeExpertise)
          .set({
            yearsExperience: validatedData.yearsExperience,
            completedEvents: validatedData.completedEvents,
            isSpecialized: validatedData.isSpecialized,
            notes: validatedData.notes,
            updatedAt: new Date(),
          })
          .where(eq(vendorEventTypeExpertise.id, existing[0].id))
          .returning();
      } else {
        // Insert new
        result = await db
          .insert(vendorEventTypeExpertise)
          .values({
            vendorId: validatedData.vendorId,
            eventType: validatedData.eventType,
            yearsExperience: validatedData.yearsExperience,
            completedEvents: validatedData.completedEvents,
            isSpecialized: validatedData.isSpecialized,
            notes: validatedData.notes,
          })
          .returning();
      }

      // Invalidate match scores for this vendor
      await db
        .delete(vendorMatchScores)
        .where(eq(vendorMatchScores.vendorId, validatedData.vendorId));

      res.json({
        success: true,
        data: result[0],
        message: existing.length > 0 ? "Expertise updated" : "Expertise added",
      });
    } catch (error) {
      console.error("Error adding expertise:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to add expertise",
      });
    }
  });

  /**
   * GET /api/vendor/expertise/:vendorId
   * Get all expertise records for a vendor
   */
  app.get("/api/vendor/expertise/:vendorId", async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const expertise = await db
        .select()
        .from(vendorEventTypeExpertise)
        .where(eq(vendorEventTypeExpertise.vendorId, vendorId));

      res.json({
        success: true,
        data: expertise,
        count: expertise.length,
      });
    } catch (error) {
      console.error("Error fetching expertise:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch expertise",
      });
    }
  });

  /**
   * DELETE /api/vendor/expertise/:expertiseId
   * Remove expertise record
   */
  app.delete("/api/vendor/expertise/:expertiseId", async (req: Request, res: Response) => {
    try {
      const { expertiseId } = req.params;

      // Get expertise to find vendor
      const expertise = await db
        .select()
        .from(vendorEventTypeExpertise)
        .where(eq(vendorEventTypeExpertise.id, expertiseId))
        .limit(1);

      if (expertise.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Expertise record not found",
        });
      }

      // Delete it
      await db
        .delete(vendorEventTypeExpertise)
        .where(eq(vendorEventTypeExpertise.id, expertiseId));

      // Invalidate match scores
      await db
        .delete(vendorMatchScores)
        .where(eq(vendorMatchScores.vendorId, expertise[0].vendorId));

      res.json({
        success: true,
        message: "Expertise record deleted",
      });
    } catch (error) {
      console.error("Error deleting expertise:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete expertise",
      });
    }
  });

  // ============================================================================
  // VENDOR CATEGORY PREFERENCES ENDPOINTS
  // ============================================================================

  /**
   * POST /api/vendor/category-preferences
   * Set vendor's B2C/B2B preferences
   */
  app.post(
    "/api/vendor/category-preferences",
    async (req: Request, res: Response) => {
      try {
        const validatedData =
          createVendorCategoryPreferencesSchema.parse(req.body);

        // Check if preferences exist
        const existing = await db
          .select()
          .from(vendorCategoryPreferences)
          .where(eq(vendorCategoryPreferences.vendorId, validatedData.vendorId))
          .limit(1);

        let result;

        if (existing.length > 0) {
          result = await db
            .update(vendorCategoryPreferences)
            .set({
              handleB2C: validatedData.handleB2C,
              handleB2B: validatedData.handleB2B,
              b2bSubCategories: validatedData.b2bSubCategories
                ? JSON.stringify(validatedData.b2bSubCategories)
                : null,
              minGuestCountB2C: validatedData.minGuestCountB2C,
              maxGuestCountB2C: validatedData.maxGuestCountB2C,
              minGuestCountB2B: validatedData.minGuestCountB2B,
              maxGuestCountB2B: validatedData.maxGuestCountB2B,
              b2cDetails: validatedData.b2cDetails
                ? JSON.stringify(validatedData.b2cDetails)
                : null,
              b2bDetails: validatedData.b2bDetails
                ? JSON.stringify(validatedData.b2bDetails)
                : null,
              updatedAt: new Date(),
            })
            .where(eq(vendorCategoryPreferences.id, existing[0].id))
            .returning();
        } else {
          result = await db
            .insert(vendorCategoryPreferences)
            .values({
              vendorId: validatedData.vendorId,
              handleB2C: validatedData.handleB2C,
              handleB2B: validatedData.handleB2B,
              b2bSubCategories: validatedData.b2bSubCategories
                ? JSON.stringify(validatedData.b2bSubCategories)
                : null,
              minGuestCountB2C: validatedData.minGuestCountB2C,
              maxGuestCountB2C: validatedData.maxGuestCountB2C,
              minGuestCountB2B: validatedData.minGuestCountB2B,
              maxGuestCountB2B: validatedData.maxGuestCountB2B,
              b2cDetails: validatedData.b2cDetails
                ? JSON.stringify(validatedData.b2cDetails)
                : null,
              b2bDetails: validatedData.b2bDetails
                ? JSON.stringify(validatedData.b2bDetails)
                : null,
            })
            .returning();
        }

        // Invalidate match scores
        await db
          .delete(vendorMatchScores)
          .where(eq(vendorMatchScores.vendorId, validatedData.vendorId));

        res.json({
          success: true,
          data: result[0],
          message: existing.length > 0 ? "Preferences updated" : "Preferences saved",
        });
      } catch (error) {
        console.error("Error setting preferences:", error);
        res.status(400).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to set preferences",
        });
      }
    }
  );

  /**
   * GET /api/vendor/category-preferences/:vendorId
   * Get vendor's B2C/B2B preferences
   */
  app.get(
    "/api/vendor/category-preferences/:vendorId",
    async (req: Request, res: Response) => {
      try {
        const { vendorId } = req.params;

        const prefs = await db
          .select()
          .from(vendorCategoryPreferences)
          .where(eq(vendorCategoryPreferences.vendorId, vendorId))
          .limit(1);

        if (prefs.length === 0) {
          return res.json({
            success: true,
            data: null,
            message: "No preferences set yet",
          });
        }

        res.json({
          success: true,
          data: prefs[0],
        });
      } catch (error) {
        console.error("Error fetching preferences:", error);
        res.status(400).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch preferences",
        });
      }
    }
  );

  // ============================================================================
  // USER EVENT PREFERENCES ENDPOINTS
  // ============================================================================

  /**
   * POST /api/user/preferences
   * Save or update user's event preferences
   */
  app.post("/api/user/preferences", async (req: Request, res: Response) => {
    try {
      const validatedData = createCoupleEventPreferencesSchema.parse(req.body);

      // Check if preferences exist
      const existing = await db
        .select()
        .from(coupleEventPreferences)
        .where(eq(coupleEventPreferences.coupleId, validatedData.coupleId))
        .limit(1);

      let result;

      if (existing.length > 0) {
        result = await db
          .update(coupleEventPreferences)
          .set({
            eventType: validatedData.eventType,
            eventCategory: validatedData.eventCategory,
            corporateSubCategory: validatedData.corporateSubCategory,
            guestCount: validatedData.guestCount,
            budgetMin: validatedData.budgetMin,
            budgetMax: validatedData.budgetMax,
            currency: validatedData.currency,
            eventLocation: validatedData.eventLocation,
            eventLocationRadius: validatedData.eventLocationRadius,
            desiredEventVibe: validatedData.desiredEventVibe
              ? JSON.stringify(validatedData.desiredEventVibe)
              : null,
            specialRequirements: validatedData.specialRequirements,
            vendorPreferences: validatedData.vendorPreferences
              ? JSON.stringify(validatedData.vendorPreferences)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(coupleEventPreferences.id, existing[0].id))
          .returning();
      } else {
        result = await db
          .insert(coupleEventPreferences)
          .values({
            coupleId: validatedData.coupleId,
            eventType: validatedData.eventType,
            eventCategory: validatedData.eventCategory,
            corporateSubCategory: validatedData.corporateSubCategory,
            guestCount: validatedData.guestCount,
            budgetMin: validatedData.budgetMin,
            budgetMax: validatedData.budgetMax,
            currency: validatedData.currency,
            eventLocation: validatedData.eventLocation,
            eventLocationRadius: validatedData.eventLocationRadius,
            desiredEventVibe: validatedData.desiredEventVibe
              ? JSON.stringify(validatedData.desiredEventVibe)
              : null,
            specialRequirements: validatedData.specialRequirements,
            vendorPreferences: validatedData.vendorPreferences
              ? JSON.stringify(validatedData.vendorPreferences)
              : null,
          })
          .returning();
      }

      res.json({
        success: true,
        data: result[0],
        message: existing.length > 0 ? "Preferences updated" : "Preferences saved",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save preferences",
      });
    }
  });

  /**
   * GET /api/user/preferences/:userId
   * Get user's event preferences
   */
  app.get("/api/user/preferences/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const prefs = await db
        .select()
        .from(coupleEventPreferences)
        .where(eq(coupleEventPreferences.coupleId, userId))
        .limit(1);

      if (prefs.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: "No preferences set",
        });
      }

      res.json({
        success: true,
        data: prefs[0],
      });
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch preferences",
      });
    }
  });

  // ============================================================================
  // VENDOR SEARCH & MATCHING ENDPOINTS
  // ============================================================================

  /**
   * GET /api/user/vendor-matches
   * Get ranked vendors matching user's preferences for their event type
   *
   * Query params:
   * - userId: ID of user planning event
   * - limit: (optional, default 20) Number of results
   */
  app.get(
    "/api/user/vendor-matches",
    async (req: Request, res: Response) => {
      try {
        const { userId, limit = "20" } = req.query;

        if (!userId || typeof userId !== "string") {
          return res.status(400).json({
            success: false,
            error: "userId is required",
          });
        }

        const limitNum = Math.min(parseInt(limit as string) || 20, 100);

        // Get user's event preferences
        const userPrefsResult = await db
          .select()
          .from(coupleEventPreferences)
          .where(eq(coupleEventPreferences.coupleId, userId))
          .limit(1);

        if (userPrefsResult.length === 0) {
          return res.json({
            success: true,
            data: [],
            message: "User has not set preferences yet",
          });
        }

        const userPrefs = userPrefsResult[0];

        // Fetch vendors
        const allVendors = await db
          .select()
          .from(vendors)
          .limit(limitNum * 3);

        // Calculate match scores for each vendor
        const matches = await Promise.all(
          allVendors.map(async (vendor) => {
            // Check if we have cached match score
            const cachedResult = await db
              .select()
              .from(vendorMatchScores)
              .where(
                and(
                  eq(vendorMatchScores.vendorId, vendor.id),
                  eq(vendorMatchScores.coupleId, userId)
                )
              )
              .limit(1);

            const cached = cachedResult.length > 0 ? cachedResult[0] : null;

            if (
              cached &&
              new Date(cached.lastCalculatedAt ?? 0).getTime() > Date.now() - 86400000
            ) {
              // Cache valid for 24 hours
              return {
                vendor,
                ...cached,
              };
            }

            // Fetch vendor expertise for this event type
            const expertiseResult = await db
              .select()
              .from(vendorEventTypeExpertise)
              .where(
                and(
                  eq(vendorEventTypeExpertise.vendorId, vendor.id),
                  eq(vendorEventTypeExpertise.eventType, userPrefs.eventType)
                )
              )
              .limit(1);

            const expertise =
              expertiseResult.length > 0 ? expertiseResult[0] : null;

            // Fetch vendor category preferences
            const prefResult = await db
              .select()
              .from(vendorCategoryPreferences)
              .where(eq(vendorCategoryPreferences.vendorId, vendor.id))
              .limit(1);

            const categoryPrefs = prefResult.length > 0 ? prefResult[0] : null;

            // Calculate fresh match score
            const matchResult = calculateVendorMatch(
              userPrefs,
              {
                ...vendor,
                eventTypeExpertise: expertise || null,
                categoryPrefs: categoryPrefs || null,
                reviewScore: undefined,
              },
              {
                eventType: 0.25,
                category: 0.2,
                budget: 0.2,
                capacity: 0.15,
                location: 0.1,
                vibe: 0.05,
                reviews: 0.05,
              }
            );

            // Save to cache
            await db
              .insert(vendorMatchScores)
              .values({
                vendorId: vendor.id,
                coupleId: userId,
                overallScore: matchResult.overallScore,
                eventTypeMatch: matchResult.scores.eventTypeMatch,
                budgetMatch: matchResult.scores.budgetMatch,
                capacityMatch: matchResult.scores.capacityMatch,
                locationMatch: matchResult.scores.locationMatch,
                vibeMatch: matchResult.scores.vibeMatch,
                reviewScore: matchResult.scores.reviewMatch,
                lastCalculatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [vendorMatchScores.vendorId, vendorMatchScores.coupleId],
                set: {
                  overallScore: matchResult.overallScore,
                  eventTypeMatch: matchResult.scores.eventTypeMatch,
                  budgetMatch: matchResult.scores.budgetMatch,
                  capacityMatch: matchResult.scores.capacityMatch,
                  locationMatch: matchResult.scores.locationMatch,
                  vibeMatch: matchResult.scores.vibeMatch,
                  reviewScore: matchResult.scores.reviewMatch,
                  lastCalculatedAt: new Date(),
                },
              });

            return {
              vendor,
              ...matchResult,
            };
          })
        );

        // Sort by overall score descending
        const ranked = matches
          .filter((m) => m.vendor.status === "approved")
          .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
          .slice(0, limitNum);

        res.json({
          success: true,
          data: ranked,
          count: ranked.length,
        });
      } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch matches",
        });
      }
    }
  );

  /**
   * GET /api/vendor/:vendorId/match-details/:userId
   * Get detailed match breakdown for specific vendor-user pair
   */
  app.get(
    "/api/vendor/:vendorId/match-details/:userId",
    async (req: Request, res: Response) => {
      try {
        const { vendorId, userId } = req.params;

        // Get vendor data
        const vendorResult = await db
          .select()
          .from(vendors)
          .where(eq(vendors.id, vendorId))
          .limit(1);

        if (vendorResult.length === 0) {
          return res.status(404).json({
            success: false,
            error: "Vendor not found",
          });
        }

        const vendorData = vendorResult[0];

        // Get user's preferences
        const userPrefsResult = await db
          .select()
          .from(coupleEventPreferences)
          .where(eq(coupleEventPreferences.coupleId, userId))
          .limit(1);

        if (userPrefsResult.length === 0) {
          return res.status(404).json({
            success: false,
            error: "User preferences not found",
          });
        }

        const userPrefs = userPrefsResult[0];

        // Fetch vendor expertise for this event type
        const expertiseResult = await db
          .select()
          .from(vendorEventTypeExpertise)
          .where(
            and(
              eq(vendorEventTypeExpertise.vendorId, vendorId),
              eq(vendorEventTypeExpertise.eventType, userPrefs.eventType)
            )
          )
          .limit(1);

        const expertise =
          expertiseResult.length > 0 ? expertiseResult[0] : null;

        // Fetch vendor category preferences
        const prefResult = await db
          .select()
          .from(vendorCategoryPreferences)
          .where(eq(vendorCategoryPreferences.vendorId, vendorId))
          .limit(1);

        const categoryPrefs = prefResult.length > 0 ? prefResult[0] : null;

        // Calculate match
        const matchResult = calculateVendorMatch(
          userPrefs,
          {
            ...vendorData,
            eventTypeExpertise: expertise || null,
            categoryPrefs: categoryPrefs || null,
            reviewScore: undefined,
          },
          {
            eventType: 0.25,
            category: 0.2,
            budget: 0.2,
            capacity: 0.15,
            location: 0.1,
            vibe: 0.05,
            reviews: 0.05,
          }
        );

        res.json({
          success: true,
          data: {
            vendor: {
              id: vendorData.id,
              businessName: vendorData.businessName,
              description: vendorData.description,
              priceRange: vendorData.priceRange,
            },
            event: {
              eventType: userPrefs.eventType,
              budget: {
                min: userPrefs.budgetMin,
                max: userPrefs.budgetMax,
              },
              guestCount: userPrefs.guestCount,
            },
            match: matchResult,
          },
        });
      } catch (error) {
        console.error("Error fetching match details:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch match details",
        });
      }
    }
  );
  // ============================================================================
  // VENDOR EXPERTISE ENDPOINTS
  // ============================================================================

  /**
   * POST /api/vendor/expertise
   * Add or update vendor expertise for an event type
   */
  app.post("/api/vendor/expertise", async (req: Request, res: Response) => {
    try {
      const validatedData = createVendorEventTypeExpertiseSchema.parse(req.body);

      // Check if expertise record already exists
      const existing = await db.query.vendorEventTypeExpertise.findFirst({
        where: and(
          eq(vendorEventTypeExpertise.vendorId, validatedData.vendorId),
          eq(vendorEventTypeExpertise.eventType, validatedData.eventType)
        ),
      });

      let result;

      if (existing) {
        // Update existing
        result = await db
          .update(vendorEventTypeExpertise)
          .set({
            yearsExperience: validatedData.yearsExperience,
            completedEvents: validatedData.completedEvents,
            isSpecialized: validatedData.isSpecialized,
            notes: validatedData.notes,
            updatedAt: new Date(),
          })
          .where(eq(vendorEventTypeExpertise.id, existing.id))
          .returning();
      } else {
        // Insert new
        result = await db
          .insert(vendorEventTypeExpertise)
          .values({
            vendorId: validatedData.vendorId,
            eventType: validatedData.eventType,
            yearsExperience: validatedData.yearsExperience,
            completedEvents: validatedData.completedEvents,
            isSpecialized: validatedData.isSpecialized,
            notes: validatedData.notes,
          })
          .returning();
      }

      // Invalidate match scores for this vendor (need recalculation)
      await db
        .delete(vendorMatchScores)
        .where(eq(vendorMatchScores.vendorId, validatedData.vendorId));

      res.json({
        success: true,
        data: result[0],
        message: existing ? "Expertise updated" : "Expertise added",
      });
    } catch (error) {
      console.error("Error adding expertise:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to add expertise",
      });
    }
  });

  /**
   * GET /api/vendor/expertise/:vendorId
   * Get all expertise records for a vendor
   */
  app.get("/api/vendor/expertise/:vendorId", async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const expertise = await db.query.vendorEventTypeExpertise.findMany({
        where: eq(vendorEventTypeExpertise.vendorId, vendorId),
      });

      res.json({
        success: true,
        data: expertise,
        count: expertise.length,
      });
    } catch (error) {
      console.error("Error fetching expertise:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch expertise",
      });
    }
  });

  /**
   * DELETE /api/vendor/expertise/:expertiseId
   * Remove expertise record
   */
  app.delete("/api/vendor/expertise/:expertiseId", async (req: Request, res: Response) => {
    try {
      const { expertiseId } = req.params;

      // Get expertise to find vendor
      const expertise = await db.query.vendorEventTypeExpertise.findFirst({
        where: eq(vendorEventTypeExpertise.id, expertiseId),
      });

      if (!expertise) {
        return res.status(404).json({
          success: false,
          error: "Expertise record not found",
        });
      }

      // Delete it
      await db
        .delete(vendorEventTypeExpertise)
        .where(eq(vendorEventTypeExpertise.id, expertiseId));

      // Invalidate match scores
      await db
        .delete(vendorMatchScores)
        .where(eq(vendorMatchScores.vendorId, expertise.vendorId));

      res.json({
        success: true,
        message: "Expertise record deleted",
      });
    } catch (error) {
      console.error("Error deleting expertise:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete expertise",
      });
    }
  });

  // ============================================================================
  // VENDOR CATEGORY PREFERENCES ENDPOINTS
  // ============================================================================

  /**
   * POST /api/vendor/category-preferences
   * Set vendor's B2C/B2B preferences
   */
  app.post(
    "/api/vendor/category-preferences",
    async (req: Request, res: Response) => {
      try {
        const validatedData =
          createVendorCategoryPreferencesSchema.parse(req.body);

        // Check if preferences exist
        const existing = await db.query.vendorCategoryPreferences.findFirst({
          where: eq(vendorCategoryPreferences.vendorId, validatedData.vendorId),
        });

        let result;

        if (existing) {
          result = await db
            .update(vendorCategoryPreferences)
            .set({
              handleB2C: validatedData.handleB2C,
              handleB2B: validatedData.handleB2B,
              b2bSubCategories: toJsonText(validatedData.b2bSubCategories),
              minGuestCountB2C: validatedData.minGuestCountB2C,
              maxGuestCountB2C: validatedData.maxGuestCountB2C,
              minGuestCountB2B: validatedData.minGuestCountB2B,
              maxGuestCountB2B: validatedData.maxGuestCountB2B,
              b2cDetails: toJsonText(validatedData.b2cDetails),
              b2bDetails: toJsonText(validatedData.b2bDetails),
              updatedAt: new Date(),
            })
            .where(eq(vendorCategoryPreferences.id, existing.id))
            .returning();
        } else {
          result = await db
            .insert(vendorCategoryPreferences)
            .values({
              ...validatedData,
              b2bSubCategories: toJsonText(validatedData.b2bSubCategories),
              b2cDetails: toJsonText(validatedData.b2cDetails),
              b2bDetails: toJsonText(validatedData.b2bDetails),
            })
            .returning();
        }

        // Invalidate match scores
        await db
          .delete(vendorMatchScores)
          .where(eq(vendorMatchScores.vendorId, validatedData.vendorId));

        res.json({
          success: true,
          data: result[0],
          message: existing ? "Preferences updated" : "Preferences saved",
        });
      } catch (error) {
        console.error("Error setting preferences:", error);
        res.status(400).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to set preferences",
        });
      }
    }
  );

  /**
   * GET /api/vendor/category-preferences/:vendorId
   * Get vendor's B2C/B2B preferences
   */
  app.get(
    "/api/vendor/category-preferences/:vendorId",
    async (req: Request, res: Response) => {
      try {
        const { vendorId } = req.params;

        const prefs = await db.query.vendorCategoryPreferences.findFirst({
          where: eq(vendorCategoryPreferences.vendorId, vendorId),
        });

        if (!prefs) {
          return res.json({
            success: true,
            data: null,
            message: "No preferences set yet",
          });
        }

        res.json({
          success: true,
          data: prefs,
        });
      } catch (error) {
        console.error("Error fetching preferences:", error);
        res.status(400).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch preferences",
        });
      }
    }
  );

  // ============================================================================
  // USER EVENT PREFERENCES ENDPOINTS
  // ============================================================================

  /**
   * POST /api/user/preferences
   * Save or update user's event preferences
   */
  app.post("/api/user/preferences", async (req: Request, res: Response) => {
    try {
      const validatedData = createCoupleEventPreferencesSchema.parse(req.body);

      // Check if preferences exist
      const existing = await db.query.coupleEventPreferences.findFirst({
        where: eq(coupleEventPreferences.coupleId, validatedData.coupleId),
      });

      let result;

      if (existing) {
        result = await db
          .update(coupleEventPreferences)
          .set({
            eventType: validatedData.eventType,
            eventCategory: validatedData.eventCategory,
            guestCount: validatedData.guestCount,
            budgetMin: validatedData.budgetMin,
            budgetMax: validatedData.budgetMax,
            currency: validatedData.currency,
            eventLocation: validatedData.eventLocation,
            eventLocationRadius: validatedData.eventLocationRadius,
            desiredEventVibe: toJsonText(validatedData.desiredEventVibe),
            specialRequirements: validatedData.specialRequirements,
            vendorPreferences: toJsonText(validatedData.vendorPreferences),
            updatedAt: new Date(),
          })
          .where(eq(coupleEventPreferences.id, existing.id))
          .returning();
      } else {
        result = await db
          .insert(coupleEventPreferences)
          .values({
            ...validatedData,
            desiredEventVibe: toJsonText(validatedData.desiredEventVibe),
            vendorPreferences: toJsonText(validatedData.vendorPreferences),
          })
          .returning();
      }

      res.json({
        success: true,
        data: result[0],
        message: existing ? "Preferences updated" : "Preferences saved",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save preferences",
      });
    }
  });

  /**
   * GET /api/user/preferences/:userId
   * Get user's event preferences
   */
  app.get("/api/user/preferences/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const prefs = await db.query.coupleEventPreferences.findFirst({
        where: eq(coupleEventPreferences.coupleId, userId),
      });

      if (!prefs) {
        return res.json({
          success: true,
          data: null,
          message: "No preferences set",
        });
      }

      res.json({
        success: true,
        data: prefs,
      });
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(400).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch preferences",
      });
    }
  });

  // ============================================================================
  // VENDOR SEARCH & MATCHING ENDPOINTS
  // ============================================================================

  /**
   * GET /api/user/vendor-matches
   * Get ranked vendors matching user's preferences for their event type
   *
   * Query params:
   * - userId: ID of user planning event
   * - limit: (optional, default 20) Number of results
   */
  app.get(
    "/api/user/vendor-matches",
    async (req: Request, res: Response) => {
      try {
        const { userId, limit = "20" } = req.query;

        if (!userId || typeof userId !== "string") {
          return res.status(400).json({
            success: false,
            error: "userId is required",
          });
        }

        const limitNum = Math.min(parseInt(limit as string) || 20, 100);

        // Get user's event preferences
        const userPrefs = await db.query.coupleEventPreferences.findFirst({
          where: eq(coupleEventPreferences.coupleId, userId),
        });

        if (!userPrefs) {
          return res.json({
            success: true,
            data: [],
            message: "User has not set preferences yet",
          });
        }

        // Fetch vendors (without relations for now)
        const allVendors = await db.query.vendors.findMany({
          limit: limitNum * 3,
        });

        // Calculate match scores for each vendor
        const matches = await Promise.all(
          allVendors.map(async (vendor) => {
            // Check if we have cached match score
            const cached = await db.query.vendorMatchScores.findFirst({
              where: and(
                eq(vendorMatchScores.vendorId, vendor.id),
                eq(vendorMatchScores.coupleId, userId)
              ),
            });

            if (
              cached &&
              new Date(cached.lastCalculatedAt ?? 0).getTime() > Date.now() - 86400000
            ) {
              // Cache valid for 24 hours
              return {
                vendor,
                ...cached,
              };
            }

            // Fetch vendor expertise for their event type
            const expertise = await db.query.vendorEventTypeExpertise.findFirst({
              where: and(
                eq(vendorEventTypeExpertise.vendorId, vendor.id),
                eq(vendorEventTypeExpertise.eventType, userPrefs.eventType)
              ),
            });

            // Fetch vendor category preferences
            const categoryPrefs = await db.query.vendorCategoryPreferences.findFirst({
              where: eq(vendorCategoryPreferences.vendorId, vendor.id),
            });

            // Calculate fresh match score
            const matchResult = calculateVendorMatch(userPrefs, { 
              ...vendor, 
              eventTypeExpertise: expertise || null,
              categoryPrefs: categoryPrefs || null,
              reviewScore: undefined
            }, {
              eventType: 0.25,
              category: 0.2,
              budget: 0.2,
              capacity: 0.15,
              location: 0.1,
              vibe: 0.05,
              reviews: 0.05,
            });

            // Save to cache
            await db
              .insert(vendorMatchScores)
              .values({
                vendorId: vendor.id,
                coupleId: userId,
                overallScore: matchResult.overallScore,
                eventTypeMatch: matchResult.scores.eventTypeMatch,
                budgetMatch: matchResult.scores.budgetMatch,
                capacityMatch: matchResult.scores.capacityMatch,
                locationMatch: matchResult.scores.locationMatch,
                vibeMatch: matchResult.scores.vibeMatch,
                reviewScore: matchResult.scores.reviewMatch,
                lastCalculatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [vendorMatchScores.vendorId, vendorMatchScores.coupleId],
                set: {
                  overallScore: matchResult.overallScore,
                  eventTypeMatch: matchResult.scores.eventTypeMatch,
                  budgetMatch: matchResult.scores.budgetMatch,
                  capacityMatch: matchResult.scores.capacityMatch,
                  locationMatch: matchResult.scores.locationMatch,
                  vibeMatch: matchResult.scores.vibeMatch,
                  reviewScore: matchResult.scores.reviewMatch,
                  lastCalculatedAt: new Date(),
                },
              });

            return {
              vendor,
              ...matchResult,
            };
          })
        );

        // Sort by overall score descending
        const ranked = matches
          .filter((m) => m.vendor.status === "approved")
          .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
          .slice(0, limitNum);

        res.json({
          success: true,
          data: ranked,
          count: ranked.length,
        });
      } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch matches",
        });
      }
    }
  );

  /**
   * GET /api/vendor/:vendorId/match-details/:userId
   * Get detailed match breakdown for specific vendor-user pair
   */
  app.get(
    "/api/vendor/:vendorId/match-details/:userId",
    async (req: Request, res: Response) => {
      try {
        const { vendorId, userId } = req.params;

        // Get vendor data
        const vendorData = await db.query.vendors.findFirst({
          where: eq(vendors.id, vendorId),
        });

        if (!vendorData) {
          return res.status(404).json({
            success: false,
            error: "Vendor not found",
          });
        }

        // Get user's preferences
        const userPrefs = await db.query.coupleEventPreferences.findFirst({
          where: eq(coupleEventPreferences.coupleId, userId),
        });

        if (!userPrefs) {
          return res.status(404).json({
            success: false,
            error: "User preferences not found",
          });
        }

        // Fetch vendor expertise for this event type
        const expertise = await db.query.vendorEventTypeExpertise.findFirst({
          where: and(
            eq(vendorEventTypeExpertise.vendorId, vendorId),
            eq(vendorEventTypeExpertise.eventType, userPrefs.eventType)
          ),
        });

        // Fetch vendor category preferences
        const categoryPrefs = await db.query.vendorCategoryPreferences.findFirst({
          where: eq(vendorCategoryPreferences.vendorId, vendorId),
        });

        // Calculate match
        const matchResult = calculateVendorMatch(userPrefs, { 
          ...vendorData, 
          eventTypeExpertise: expertise || null,
          categoryPrefs: categoryPrefs || null,
          reviewScore: undefined
        }, {
          eventType: 0.25,
          category: 0.2,
          budget: 0.2,
          capacity: 0.15,
          location: 0.1,
          vibe: 0.05,
          reviews: 0.05,
        });

        res.json({
          success: true,
          data: {
            vendor: {
              id: vendorData.id,
              businessName: vendorData.businessName,
              description: vendorData.description,
              priceRange: vendorData.priceRange,
            },
            event: {
              eventType: userPrefs.eventType,
              budget: {
                min: userPrefs.budgetMin,
                max: userPrefs.budgetMax,
              },
              guestCount: userPrefs.guestCount,
            },
            match: matchResult,
          },
        });
      } catch (error) {
        console.error("Error fetching match details:", error);
        res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch match details",
        });
      }
    }
  );
}
