/**
 * Couple Feature Routes
 * All wedding-planning feature endpoints (dress, venue, hair/makeup, transport,
 * flowers, photographer, videographer, music, catering, cake, important people,
 * photo shots, planner, wedding invites).
 *
 * Ported from server_dist/index.js (lines 7449-12200) plus new planner/invites
 * endpoints that the client expects.
 */
import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import { eq, and, desc, inArray, asc } from "drizzle-orm";
import {
  appSettings,
  guestInvitations,
  createGuestInvitationSchema,
  // Dress
  coupleDressAppointments,
  coupleDressFavorites,
  coupleDressTimeline,
  createDressAppointmentSchema,
  createDressFavoriteSchema,
  // Important people
  coupleImportantPeople,
  createImportantPersonSchema,
  // Photo shots
  couplePhotoShots,
  createPhotoShotSchema,
  // Hair & Makeup
  coupleHairMakeupAppointments,
  coupleHairMakeupLooks,
  coupleHairMakeupTimeline,
  // Transport
  coupleTransportBookings,
  coupleTransportTimeline,
  // Flowers
  coupleFlowerAppointments,
  coupleFlowerSelections,
  coupleFlowerTimeline,
  // Photographer
  couplePhotographerSessions,
  couplePhotographerShots,
  couplePhotographerTimeline,
  // Videographer
  coupleVideographerSessions,
  coupleVideographerDeliverables,
  coupleVideographerTimeline,
  // Music
  coupleMusicPerformances,
  coupleMusicSetlists,
  coupleMusicTimeline,
  coupleMusicPreferences,
  musicMoments,
  musicSongs,
  musicMomentProfiles,
  musicMomentSongRankings,
  musicSets,
  musicSetItems,
  coupleYoutubeConnections,
  musicExportJobs,
  coupleMusicVendorPermissions,
  vendorOffers,
  // Catering
  coupleCateringTastings,
  coupleCateringMenu,
  coupleCateringDietaryNeeds,
  coupleCateringTimeline,
  // Cake
  coupleCakeTastings,
  coupleCakeDesigns,
  coupleCakeTimeline,
  // Venue
  coupleVenueBookings,
  coupleVenueTimelines,
  // Planner
  couplePlannerMeetings,
  couplePlannerTasks,
  couplePlannerTimeline,
} from "@shared/schema";
import {
  DEFAULT_MOMENT_KEYS,
  normalizeMatcherProfile,
  scoreRecommendation,
  generateYouTubeRecommendations,
  getYouTubeRecommendationApiKey,
  createSignedOAuthState,
  verifySignedOAuthState,
  getYouTubeOAuthConfig,
  exchangeCodeForTokens,
  refreshYouTubeAccessToken,
  fetchYouTubeChannel,
  createYouTubePlaylist,
  insertYouTubePlaylistItem,
  encryptSecret,
  decryptSecret,
} from "./music-matcher";

type DbClient = typeof import("./db")["db"];
type CheckCoupleAuth = (req: Request, res: Response) => Promise<string | null>;

// ── helpers ──────────────────────────────────────────────────────────
/** Generic upsert-timeline helper (coupleId is unique) */
async function upsertTimeline(db: DbClient, table: any, coupleId: string, body: any, res: Response, errMsg: string) {
  try {
    const existing = await db.select().from(table).where(eq(table.coupleId, coupleId));
    if (existing.length > 0) {
      const [row] = await db.update(table).set({ ...body, updatedAt: new Date() }).where(eq(table.coupleId, coupleId)).returning();
      return res.json(row);
    }
    const [row] = await (db.insert(table).values({ coupleId, ...body }).returning() as unknown as any[]);
    return res.json(row);
  } catch (error) {
    console.error(errMsg, error?.message || String(error));
    return res.status(500).json({ error: errMsg });
  }
}

/** Generic CRUD-list helper */
function crudRoutes(
  db: DbClient,
  app: Express,
  checkCoupleAuth: CheckCoupleAuth,
  basePath: string,
  table: any,
  orderCol?: any,
) {
  // LIST
  app.get(basePath, async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const q = db.select().from(table).where(eq(table.coupleId, coupleId));
      const rows = orderCol ? await q.orderBy(orderCol) : await q;
      res.json(rows);
    } catch (error) {
      console.error(`Error GET ${basePath}:`, error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente data" });
    }
  });

  // CREATE
  app.post(basePath, async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [row] = await (db.insert(table).values({ coupleId, ...req.body }).returning() as unknown as any[]);
      res.json(row);
    } catch (error) {
      console.error(`Error POST ${basePath}:`, error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke opprette" });
    }
  });

  // UPDATE
  app.patch(`${basePath}/:id`, async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { id } = req.params;
      const [row] = await db.update(table).set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(table.id, id), eq(table.coupleId, coupleId))).returning();
      res.json(row);
    } catch (error) {
      console.error(`Error PATCH ${basePath}/:id:`, error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere" });
    }
  });

  // DELETE
  app.delete(`${basePath}/:id`, async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { id } = req.params;
      await db.delete(table).where(and(eq(table.id, id), eq(table.coupleId, coupleId)));
      res.json({ success: true });
    } catch (error) {
      console.error(`Error DELETE ${basePath}/:id:`, error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke slette" });
    }
  });
}

function isMusicMatcherEnabled() {
  const raw = (process.env.MUSIC_MATCHER_V1 || "true").toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "off";
}

function getOAuthRedirectUri(req: Request) {
  if (process.env.YOUTUBE_REDIRECT_URI) return process.env.YOUTUBE_REDIRECT_URI;
  const forwardedProto = req.header("x-forwarded-proto");
  const proto = forwardedProto || req.protocol || "https";
  const host = req.header("x-forwarded-host") || req.get("host");
  return `${proto}://${host}/api/couple/music/youtube/callback`;
}

async function getYouTubeAccessTokenForCouple(db: DbClient, coupleId: string, redirectUri: string) {
  const [connection] = await db
    .select()
    .from(coupleYoutubeConnections)
    .where(eq(coupleYoutubeConnections.coupleId, coupleId));

  if (!connection?.refreshTokenEnc) {
    throw new Error("YouTube is not connected");
  }

  const oauth = getYouTubeOAuthConfig(redirectUri);
  if (!oauth.clientId || !oauth.clientSecret || !oauth.redirectUri) {
    throw new Error("YouTube OAuth environment variables are missing");
  }

  const refreshToken = decryptSecret(connection.refreshTokenEnc);

  // Always refresh before export to avoid invalid access token windows.
  const refreshed = await refreshYouTubeAccessToken({
    refreshToken,
    clientId: oauth.clientId,
    clientSecret: oauth.clientSecret,
  });

  const accessToken = String(refreshed.access_token);
  const expiresAt = new Date(Date.now() + Number(refreshed.expires_in || 3600) * 1000);

  await db
    .update(coupleYoutubeConnections)
    .set({
      accessTokenEnc: encryptSecret(accessToken),
      tokenExpiresAt: expiresAt,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(coupleYoutubeConnections.coupleId, coupleId));

  return accessToken;
}

async function getSetWithItems(db: DbClient, coupleId: string, setId: string) {
  const [setRow] = await db
    .select()
    .from(musicSets)
    .where(and(eq(musicSets.id, setId), eq(musicSets.coupleId, coupleId)));
  if (!setRow) return null;

  const items = await db
    .select()
    .from(musicSetItems)
    .where(eq(musicSetItems.setId, setId))
    .orderBy(asc(musicSetItems.position), asc(musicSetItems.createdAt));

  return { set: setRow, items };
}

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && /duplicate key|unique constraint/i.test(error.message);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return fallback;
}

async function reorderSetItemsSafely(db: DbClient, setId: string, orderedItemIds: string[]) {
  // Validate all items belong to this set before reordering
  const existingItems = await db.select({ id: musicSetItems.id })
    .from(musicSetItems)
    .where(eq(musicSetItems.setId, setId));
  const existingIds = new Set(existingItems.map(item => item.id));
  for (const itemId of orderedItemIds) {
    if (!existingIds.has(itemId)) {
      throw new Error(`Item ${itemId} does not belong to set ${setId}`);
    }
  }
  await db.transaction(async (tx) => {
    const offset = 10000;
    for (let i = 0; i < orderedItemIds.length; i += 1) {
      await tx
        .update(musicSetItems)
        .set({ position: offset + i, updatedAt: new Date() })
        .where(eq(musicSetItems.id, orderedItemIds[i]));
    }
    for (let i = 0; i < orderedItemIds.length; i += 1) {
      await tx
        .update(musicSetItems)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(musicSetItems.id, orderedItemIds[i]));
    }
  });
}

async function getNextSetItemPosition(items: { position: number | null }[]) {
  const maxPosition = items.reduce((max, item) => {
    const next = Number.isFinite(item.position) ? Number(item.position) : -1;
    return Math.max(max, next);
  }, -1);
  return maxPosition + 1;
}

export async function exportSetToYouTubePlaylist(params: {
  db: DbClient;
  coupleId: string;
  requestedByRole: "couple" | "vendor";
  requestedByVendorId?: string | null;
  requestedByCoupleId?: string | null;
  setId: string;
  title: string;
  description?: string;
  privacyStatus?: "private" | "public" | "unlisted";
  idempotencyKey?: string;
  redirectUri: string;
  offerId?: string | null;
  playlistId?: string | null;
}) {
  const {
    db,
    coupleId,
    requestedByRole,
    requestedByVendorId,
    requestedByCoupleId,
    setId,
    title,
    description,
    privacyStatus,
    redirectUri,
    offerId,
    playlistId,
  } = params;
  const idempotencyKey = params.idempotencyKey || crypto.randomUUID();

  const [existingJob] = await db
    .select()
    .from(musicExportJobs)
    .where(eq(musicExportJobs.idempotencyKey, idempotencyKey));
  if (existingJob) {
    return existingJob;
  }

  const withItems = await getSetWithItems(db, coupleId, setId);
  if (!withItems) throw new Error("Music set not found");

  const videoIds = withItems.items
    .map((item) => item.youtubeVideoId)
    .filter((id): id is string => !!id);

  if (videoIds.length === 0) {
    throw new Error("Set has no YouTube tracks");
  }
  let pendingJob:
    | typeof musicExportJobs.$inferSelect
    | null = null;
  try {
    [pendingJob] = await db
      .insert(musicExportJobs)
      .values({
        coupleId,
        offerId: offerId || null,
        setId,
        idempotencyKey,
        status: "pending",
        requestedByRole,
        requestedByVendorId: requestedByVendorId || null,
        requestedByCoupleId: requestedByCoupleId || null,
        exportedTrackCount: 0,
      })
      .returning();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const [duplicate] = await db
        .select()
        .from(musicExportJobs)
        .where(eq(musicExportJobs.idempotencyKey, idempotencyKey));
      if (duplicate) return duplicate;
    }
    throw error;
  }

  if (!pendingJob) {
    throw new Error("Failed to create export job");
  }

  try {
    const accessToken = await getYouTubeAccessTokenForCouple(db, coupleId, redirectUri);
    const playlist = playlistId
      ? { id: playlistId, url: `https://www.youtube.com/playlist?list=${playlistId}` }
      : await createYouTubePlaylist({
          accessToken,
          title,
          description,
          privacyStatus: privacyStatus || "unlisted",
        });

    for (const videoId of videoIds) {
      await insertYouTubePlaylistItem({
        accessToken,
        playlistId: playlist.id,
        videoId,
      });
    }

    const [job] = await db
      .update(musicExportJobs)
      .set({
        youtubePlaylistId: playlist.id,
        youtubePlaylistUrl: playlist.url,
        status: "success",
        exportedTrackCount: videoIds.length,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(musicExportJobs.id, pendingJob.id))
      .returning();

    return job;
  } catch (error) {
    const message = getErrorMessage(error, "YouTube export failed");
    const normalized = /invalid_grant/i.test(message)
      ? "YouTube authorization expired. Please reconnect YouTube in Evendi."
      : message;
    await db
      .update(musicExportJobs)
      .set({
        status: "failed",
        errorMessage: normalized,
        updatedAt: new Date(),
      })
      .where(eq(musicExportJobs.id, pendingJob.id));
    throw new Error(normalized);
  }
}

// ─────────────────────────────────────────────────────────────────────
export function registerCoupleFeatureRoutes(
  app: Express,
  db: DbClient,
  checkCoupleAuth: CheckCoupleAuth,
) {

  // ===== DRESS =====
  app.get("/api/couple/dress", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [appointments, favorites, timeline] = await Promise.all([
        db.select().from(coupleDressAppointments).where(eq(coupleDressAppointments.coupleId, coupleId)).orderBy(coupleDressAppointments.date),
        db.select().from(coupleDressFavorites).where(eq(coupleDressFavorites.coupleId, coupleId)).orderBy(coupleDressFavorites.createdAt),
        db.select().from(coupleDressTimeline).where(eq(coupleDressTimeline.coupleId, coupleId)),
      ]);
      res.json({ appointments, favorites, timeline: timeline[0] || null });
    } catch (error) {
      console.error("Error fetching dress data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente kjoledata" });
    }
  });

  app.post("/api/couple/dress/appointments", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const parsed = createDressAppointmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Ugyldig data", details: parsed.error.flatten() });
      const [row] = await db.insert(coupleDressAppointments).values({ coupleId, ...parsed.data }).returning();
      res.json(row);
    } catch (error) {
      console.error("Error creating dress appointment:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke opprette avtale" });
    }
  });

  app.patch("/api/couple/dress/appointments/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { id } = req.params;
      const { shopName, date, time, notes, completed } = req.body;
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (shopName !== undefined) updateData.shopName = shopName;
      if (date !== undefined) updateData.date = date;
      if (time !== undefined) updateData.time = time;
      if (notes !== undefined) updateData.notes = notes;
      if (completed !== undefined) updateData.completed = completed;
      const [row] = await db.update(coupleDressAppointments).set(updateData)
        .where(and(eq(coupleDressAppointments.id, id), eq(coupleDressAppointments.coupleId, coupleId))).returning();
      res.json(row);
    } catch (error) {
      console.error("Error updating dress appointment:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere avtale" });
    }
  });

  app.delete("/api/couple/dress/appointments/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      await db.delete(coupleDressAppointments).where(and(eq(coupleDressAppointments.id, req.params.id), eq(coupleDressAppointments.coupleId, coupleId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dress appointment:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke slette avtale" });
    }
  });

  app.post("/api/couple/dress/favorites", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const parsed = createDressFavoriteSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Ugyldig data", details: parsed.error.flatten() });
      const [row] = await db.insert(coupleDressFavorites).values({ coupleId, ...parsed.data }).returning();
      res.json(row);
    } catch (error) {
      console.error("Error creating dress favorite:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke lagre kjole" });
    }
  });

  app.patch("/api/couple/dress/favorites/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { id } = req.params;
      const { name, designer, shop, price, imageUrl, notes, isFavorite } = req.body;
      const u: Record<string, any> = { updatedAt: new Date() };
      if (name !== undefined) u.name = name;
      if (designer !== undefined) u.designer = designer;
      if (shop !== undefined) u.shop = shop;
      if (price !== undefined) u.price = price;
      if (imageUrl !== undefined) u.imageUrl = imageUrl;
      if (notes !== undefined) u.notes = notes;
      if (isFavorite !== undefined) u.isFavorite = isFavorite;
      const [row] = await db.update(coupleDressFavorites).set(u)
        .where(and(eq(coupleDressFavorites.id, id), eq(coupleDressFavorites.coupleId, coupleId))).returning();
      res.json(row);
    } catch (error) {
      console.error("Error updating dress favorite:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere kjole" });
    }
  });

  app.delete("/api/couple/dress/favorites/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      await db.delete(coupleDressFavorites).where(and(eq(coupleDressFavorites.id, req.params.id), eq(coupleDressFavorites.coupleId, coupleId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dress favorite:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke slette kjole" });
    }
  });

  app.put("/api/couple/dress/timeline", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    const { ordered, orderedDate, firstFitting, firstFittingDate, alterations, alterationsDate, finalFitting, finalFittingDate, pickup, pickupDate, budget } = req.body;
    const data = {
      ordered: ordered ?? false, orderedDate: orderedDate || null,
      firstFitting: firstFitting ?? false, firstFittingDate: firstFittingDate || null,
      alterations: alterations ?? false, alterationsDate: alterationsDate || null,
      finalFitting: finalFitting ?? false, finalFittingDate: finalFittingDate || null,
      pickup: pickup ?? false, pickupDate: pickupDate || null,
      budget: budget ?? 0, updatedAt: new Date(),
    };
    await upsertTimeline(db, coupleDressTimeline, coupleId, data, res, "Kunne ikke oppdatere tidslinje");
  });

  // ===== IMPORTANT PEOPLE =====
  app.get("/api/couple/important-people", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const people = await db.select().from(coupleImportantPeople).where(eq(coupleImportantPeople.coupleId, coupleId)).orderBy(coupleImportantPeople.sortOrder, coupleImportantPeople.createdAt);
      res.json(people);
    } catch (error) {
      console.error("Error fetching important people:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente viktige personer" });
    }
  });

  app.post("/api/couple/important-people", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const parsed = createImportantPersonSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Ugyldig data", details: parsed.error.flatten() });
      const [row] = await db.insert(coupleImportantPeople).values({ coupleId, ...parsed.data }).returning();
      res.json(row);
    } catch (error) {
      console.error("Error creating important person:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke legge til person" });
    }
  });

  app.patch("/api/couple/important-people/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { id } = req.params;
      const { name, role, phone, email, notes, sortOrder } = req.body;
      const u: Record<string, any> = { updatedAt: new Date() };
      if (name !== undefined) u.name = name;
      if (role !== undefined) u.role = role;
      if (phone !== undefined) u.phone = phone;
      if (email !== undefined) u.email = email;
      if (notes !== undefined) u.notes = notes;
      if (sortOrder !== undefined) u.sortOrder = sortOrder;
      const [row] = await db.update(coupleImportantPeople).set(u)
        .where(and(eq(coupleImportantPeople.id, id), eq(coupleImportantPeople.coupleId, coupleId))).returning();
      res.json(row);
    } catch (error) {
      console.error("Error updating important person:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere person" });
    }
  });

  app.delete("/api/couple/important-people/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      await db.delete(coupleImportantPeople).where(and(eq(coupleImportantPeople.id, req.params.id), eq(coupleImportantPeople.coupleId, coupleId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting important person:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke slette person" });
    }
  });

  // ===== PHOTO SHOTS =====
  app.get("/api/couple/photo-shots", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const shots = await db.select().from(couplePhotoShots).where(eq(couplePhotoShots.coupleId, coupleId)).orderBy(couplePhotoShots.sortOrder, couplePhotoShots.createdAt);
      res.json(shots);
    } catch (error) {
      console.error("Error fetching photo shots:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente fotoliste" });
    }
  });

  app.post("/api/couple/photo-shots", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const parsed = createPhotoShotSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Ugyldig data", details: parsed.error.flatten() });
      const [row] = await db.insert(couplePhotoShots).values({ coupleId, ...parsed.data }).returning();
      res.json(row);
    } catch (error) {
      console.error("Error creating photo shot:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke legge til bilde" });
    }
  });

  app.patch("/api/couple/photo-shots/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { id } = req.params;
      const { title, description, category, completed, sortOrder } = req.body;
      const u: Record<string, any> = { updatedAt: new Date() };
      if (title !== undefined) u.title = title;
      if (description !== undefined) u.description = description;
      if (category !== undefined) u.category = category;
      if (completed !== undefined) u.completed = completed;
      if (sortOrder !== undefined) u.sortOrder = sortOrder;
      const [row] = await db.update(couplePhotoShots).set(u)
        .where(and(eq(couplePhotoShots.id, id), eq(couplePhotoShots.coupleId, coupleId))).returning();
      res.json(row);
    } catch (error) {
      console.error("Error updating photo shot:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere bilde" });
    }
  });

  app.delete("/api/couple/photo-shots/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      await db.delete(couplePhotoShots).where(and(eq(couplePhotoShots.id, req.params.id), eq(couplePhotoShots.coupleId, coupleId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting photo shot:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke slette bilde" });
    }
  });

  app.post("/api/couple/photo-shots/seed-defaults", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const existing = await db.select().from(couplePhotoShots).where(eq(couplePhotoShots.coupleId, coupleId));
      if (existing.length > 0) return res.status(400).json({ error: "Fotoliste finnes allerede" });
      const DEFAULTS = [
        { title: "Detaljer av brudekjolen", description: "Nærbilder av kjole og sko", category: "details", sortOrder: 1 },
        { title: "Bruden og forlover", description: "Før seremonien", category: "portraits", sortOrder: 2 },
        { title: "Brudgommen gjør seg klar", description: "Med bestmennene", category: "portraits", sortOrder: 3 },
        { title: "Brudens ankomst", description: "Ved kirken/lokalet", category: "ceremony", sortOrder: 4 },
        { title: "Seremonien", description: "Utveksling av løfter og ringer", category: "ceremony", sortOrder: 5 },
        { title: "Første kyss", description: "Det viktige øyeblikket", category: "ceremony", sortOrder: 6 },
        { title: "Gruppebilde med familie", description: "Begge familier samlet", category: "group", sortOrder: 7 },
        { title: "Brudeparet alene", description: "Romantiske portretter", category: "portraits", sortOrder: 8 },
        { title: "Middagen starter", description: "Første dans og taler", category: "reception", sortOrder: 9 },
        { title: "Kaken skjæres", description: "Bryllupskaken", category: "reception", sortOrder: 10 },
      ];
      const shots = await db.insert(couplePhotoShots).values(DEFAULTS.map(s => ({ coupleId, ...s }))).returning();
      res.json(shots);
    } catch (error) {
      console.error("Error seeding photo shots:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke opprette standardfotoliste" });
    }
  });

  // vendor-planned photo shots (read-only for couple)
  app.get("/api/couple/photo-shots/vendor-planned", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      // Return photographer shots from the photographer feature
      const shots = await db.select().from(couplePhotographerShots).where(eq(couplePhotographerShots.coupleId, coupleId));
      res.json(shots);
    } catch (error) {
      console.error("Error fetching vendor-planned shots:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente leverandør-bilder" });
    }
  });

  // ===== HAIR & MAKEUP =====
  app.get("/api/couple/hair-makeup", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [appointments, looks, timelineRows] = await Promise.all([
        db.select().from(coupleHairMakeupAppointments).where(eq(coupleHairMakeupAppointments.coupleId, coupleId)).orderBy(coupleHairMakeupAppointments.date),
        db.select().from(coupleHairMakeupLooks).where(eq(coupleHairMakeupLooks.coupleId, coupleId)),
        db.select().from(coupleHairMakeupTimeline).where(eq(coupleHairMakeupTimeline.coupleId, coupleId)),
      ]);
      res.json({
        appointments, looks,
        timeline: timelineRows[0] || { consultationBooked: false, trialBooked: false, lookSelected: false, weddingDayBooked: false, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching hair/makeup data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente hår/makeup data" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/hair-makeup/appointments", coupleHairMakeupAppointments, coupleHairMakeupAppointments.date);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/hair-makeup/looks", coupleHairMakeupLooks);

  app.put("/api/couple/hair-makeup/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, coupleHairMakeupTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== TRANSPORT =====
  app.get("/api/couple/transport", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [bookings, timelineRows] = await Promise.all([
        db.select().from(coupleTransportBookings).where(eq(coupleTransportBookings.coupleId, coupleId)),
        db.select().from(coupleTransportTimeline).where(eq(coupleTransportTimeline.coupleId, coupleId)),
      ]);
      res.json({
        bookings,
        timeline: timelineRows[0] || { brideCarBooked: false, groomCarBooked: false, guestShuttleBooked: false, getawayCarBooked: false, allConfirmed: false, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching transport data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente transport data" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/transport/bookings", coupleTransportBookings);

  app.put("/api/couple/transport/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, coupleTransportTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== FLOWERS =====
  app.get("/api/couple/flowers", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [appointments, selections, timelineRows] = await Promise.all([
        db.select().from(coupleFlowerAppointments).where(eq(coupleFlowerAppointments.coupleId, coupleId)).orderBy(coupleFlowerAppointments.date),
        db.select().from(coupleFlowerSelections).where(eq(coupleFlowerSelections.coupleId, coupleId)),
        db.select().from(coupleFlowerTimeline).where(eq(coupleFlowerTimeline.coupleId, coupleId)),
      ]);
      res.json({
        appointments, selections,
        timeline: timelineRows[0] || { floristSelected: false, consultationDone: false, mockupApproved: false, deliveryConfirmed: false, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching flower data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente blomster data" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/flowers/appointments", coupleFlowerAppointments, coupleFlowerAppointments.date);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/flowers/selections", coupleFlowerSelections);

  app.put("/api/couple/flowers/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, coupleFlowerTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== PHOTOGRAPHER =====
  app.get("/api/couple/photographer", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [sessions, shots, timelineRows] = await Promise.all([
        db.select().from(couplePhotographerSessions).where(eq(couplePhotographerSessions.coupleId, coupleId)).orderBy(couplePhotographerSessions.date),
        db.select().from(couplePhotographerShots).where(eq(couplePhotographerShots.coupleId, coupleId)),
        db.select().from(couplePhotographerTimeline).where(eq(couplePhotographerTimeline.coupleId, coupleId)),
      ]);
      res.json({
        sessions, shots,
        timeline: timelineRows[0] || { photographerSelected: false, sessionBooked: false, contractSigned: false, depositPaid: false, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching photographer data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente fotograf data" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/photographer/sessions", couplePhotographerSessions, couplePhotographerSessions.date);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/photographer/shots", couplePhotographerShots);

  app.put("/api/couple/photographer/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, couplePhotographerTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== VIDEOGRAPHER =====
  app.get("/api/couple/videographer", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [sessions, deliverables, timelineRows] = await Promise.all([
        db.select().from(coupleVideographerSessions).where(eq(coupleVideographerSessions.coupleId, coupleId)).orderBy(coupleVideographerSessions.date),
        db.select().from(coupleVideographerDeliverables).where(eq(coupleVideographerDeliverables.coupleId, coupleId)),
        db.select().from(coupleVideographerTimeline).where(eq(coupleVideographerTimeline.coupleId, coupleId)),
      ]);
      res.json({
        sessions, deliverables,
        timeline: timelineRows[0] || { videographerSelected: false, sessionBooked: false, contractSigned: false, depositPaid: false, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching videographer data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente videograf data" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/videographer/sessions", coupleVideographerSessions, coupleVideographerSessions.date);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/videographer/deliverables", coupleVideographerDeliverables);

  app.put("/api/couple/videographer/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, coupleVideographerTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== MUSIC =====
  app.get("/api/couple/music", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [performances, setlists, timelineRows] = await Promise.all([
        db.select().from(coupleMusicPerformances).where(eq(coupleMusicPerformances.coupleId, coupleId)).orderBy(coupleMusicPerformances.date),
        db.select().from(coupleMusicSetlists).where(eq(coupleMusicSetlists.coupleId, coupleId)),
        db.select().from(coupleMusicTimeline).where(eq(coupleMusicTimeline.coupleId, coupleId)),
      ]);
      res.json({
        performances, setlists,
        timeline: timelineRows[0] || { musicianSelected: false, setlistDiscussed: false, contractSigned: false, depositPaid: false, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching music data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente musikk data" });
    }
  });

  // Music preferences (upsert via appSettings key)
  app.get("/api/couple/music/preferences", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [row] = await db.select().from(coupleMusicPreferences).where(eq(coupleMusicPreferences.coupleId, coupleId));
      res.json(row || {});
    } catch (error) {
      console.error("Error fetching music preferences:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente musikkpreferanser" });
    }
  });

  app.put("/api/couple/music/preferences", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const existing = await db.select().from(coupleMusicPreferences).where(eq(coupleMusicPreferences.coupleId, coupleId));
      if (existing.length > 0) {
        const [row] = await db.update(coupleMusicPreferences).set({ ...req.body, updatedAt: new Date() }).where(eq(coupleMusicPreferences.coupleId, coupleId)).returning();
        return res.json(row);
      }
      const [row] = await db.insert(coupleMusicPreferences).values({ coupleId, ...req.body }).returning();
      res.json(row);
    } catch (error) {
      console.error("Error updating music preferences:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere musikkpreferanser" });
    }
  });

  app.get("/api/couple/music/matcher/profile", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;

    try {
      const [row] = await db.select().from(coupleMusicPreferences).where(eq(coupleMusicPreferences.coupleId, coupleId));
      const profile = normalizeMatcherProfile({
        preferredCultures: row?.preferredCultures || [],
        preferredLanguages: row?.preferredLanguages || [],
        vibeLevel: row?.vibeLevel ?? 50,
        energyLevel: row?.energyLevel ?? 50,
        cleanLyricsOnly: row?.cleanLyricsOnly ?? true,
        selectedMoments: row?.selectedMoments || DEFAULT_MOMENT_KEYS,
      });
      res.json(profile);
    } catch (error) {
      console.error("Error fetching music matcher profile:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente matcher-profil" });
    }
  });

  app.put("/api/couple/music/matcher/profile", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;

    try {
      const body = req.body || {};
      const updates = normalizeMatcherProfile({
        preferredCultures: body.preferredCultures || [],
        preferredLanguages: body.preferredLanguages || [],
        vibeLevel: body.vibeLevel,
        energyLevel: body.energyLevel,
        cleanLyricsOnly: body.cleanLyricsOnly,
        selectedMoments: body.selectedMoments || DEFAULT_MOMENT_KEYS,
      });

      const existing = await db.select().from(coupleMusicPreferences).where(eq(coupleMusicPreferences.coupleId, coupleId));
      if (existing.length > 0) {
        const [row] = await db.update(coupleMusicPreferences).set({ ...updates, updatedAt: new Date() }).where(eq(coupleMusicPreferences.coupleId, coupleId)).returning();
        return res.json(row);
      }
      const [row] = await db.insert(coupleMusicPreferences).values({ coupleId, ...updates }).returning();
      res.json(row);
    } catch (error) {
      console.error("Error updating music matcher profile:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere matcher-profil" });
    }
  });

  app.get("/api/couple/music/matcher/moments", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const rows = await db.select().from(musicMoments).orderBy(asc(musicMoments.sortOrder), asc(musicMoments.createdAt));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching music moments:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente moments" });
    }
  });

  app.post("/api/couple/music/matcher/recommendations", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;

    try {
      const [profileRow] = await db.select().from(coupleMusicPreferences).where(eq(coupleMusicPreferences.coupleId, coupleId));
      const profile = normalizeMatcherProfile({
        preferredCultures: profileRow?.preferredCultures || [],
        preferredLanguages: profileRow?.preferredLanguages || [],
        vibeLevel: profileRow?.vibeLevel ?? 50,
        energyLevel: profileRow?.energyLevel ?? 50,
        cleanLyricsOnly: profileRow?.cleanLyricsOnly ?? true,
        selectedMoments: profileRow?.selectedMoments || DEFAULT_MOMENT_KEYS,
      });

      const inputMoments = Array.isArray(req.body?.moments) && req.body.moments.length > 0
        ? req.body.moments
        : profile.selectedMoments;

      const limitPerMoment = Math.max(10, Math.min(20, Number(req.body?.limitPerMoment || 12)));

      const momentRows = await db
        .select()
        .from(musicMoments)
        .where(inArray(musicMoments.key, inputMoments));

      if (momentRows.length === 0) {
        return res.json({ profile, recommendations: {} });
      }

      const feedbackByMoment = req.body?.feedbackByMoment || {};
      const recommendationApiKey = getYouTubeRecommendationApiKey();
      let youtubeAccessToken: string | null = null;
      if (!recommendationApiKey) {
        try {
          youtubeAccessToken = await getYouTubeAccessTokenForCouple(db, coupleId, getOAuthRedirectUri(req));
        } catch {
          youtubeAccessToken = null;
        }
      }

      const youtubeRecommendations = await generateYouTubeRecommendations({
        profile,
        moments: momentRows.map((moment) => ({
          key: moment.key,
          title: moment.title,
          description: moment.description || null,
        })),
        limitPerMoment,
        feedbackByMoment,
        accessToken: youtubeAccessToken,
      });
      const youtubeConfigured = Boolean(recommendationApiKey || youtubeAccessToken);
      const youtubeTrackCount = Object.values(youtubeRecommendations).reduce((sum, list) => sum + list.length, 0);

      const momentIds = momentRows.map((m) => m.id);

      const rankingRows = await db
        .select()
        .from(musicMomentSongRankings)
        .where(inArray(musicMomentSongRankings.momentId, momentIds));
      const momentProfileRows = await db
        .select()
        .from(musicMomentProfiles)
        .where(inArray(musicMomentProfiles.momentId, momentIds));
      const songIds = [...new Set(rankingRows.map((r) => r.songId))];
      const songs = songIds.length > 0
        ? await db.select().from(musicSongs).where(inArray(musicSongs.id, songIds))
        : [];
      const songsById = new Map(songs.map((song) => [song.id, song]));
      const momentProfileMap = new Map<string, Map<string, number>>();
      for (const row of momentProfileRows) {
        const byCulture = momentProfileMap.get(row.momentId) || new Map<string, number>();
        byCulture.set(row.cultureKey, row.defaultWeight ?? 50);
        momentProfileMap.set(row.momentId, byCulture);
      }

      type RecommendationCandidate = {
        songId: string;
        youtubeVideoId: string;
        title: string;
        artist: string | null;
        energyScore: number;
        tags: string[];
        matchScore: number;
        momentKey: string;
      };

      const catalogRecommendations: Record<string, RecommendationCandidate[]> = {};
      for (const moment of momentRows) {
        const rankedCandidates = rankingRows
          .filter((row) => row.momentId === moment.id)
          .map<RecommendationCandidate | null>((row) => {
            const song = songsById.get(row.songId);
            if (!song) return null;
            if (profile.cleanLyricsOnly && song.explicitFlag) return null;
            const preferredCultures = profile.preferredCultures || [];
            const momentCultureWeights = momentProfileMap.get(moment.id) || new Map<string, number>();
            let momentProfileWeight = 50;
            if (preferredCultures.length > 0) {
              const weights = preferredCultures
                .map((culture) => momentCultureWeights.get(culture))
                .filter((value): value is number => Number.isFinite(value));
              if (weights.length > 0) {
                momentProfileWeight = Math.max(...weights);
              }
            }
            const cultureRowPenalty =
              row.cultureKey && preferredCultures.length > 0 && !preferredCultures.includes(row.cultureKey)
                ? -12
                : 0;
            const effectiveRankScore = Math.max(
              0,
              Math.min(
                100,
                Math.round((row.rankScore || 50) * 0.75 + momentProfileWeight * 0.25 + cultureRowPenalty),
              ),
            );
            const matchScore = scoreRecommendation({
              rankScore: effectiveRankScore,
              songEnergy: song.energyScore || 50,
              songDhol: song.dholScore || 0,
              songDanceability: song.danceability || 50,
              songPopularity: song.popularityScore || 0,
              songCultures: song.cultureTags || [],
              songLanguages: song.languageTags || [],
              profile,
              feedback: feedbackByMoment[moment.key],
              songTagTokens: song.tagTokens || [],
              songYoutubeVideoId: song.youtubeVideoId,
            });

            return {
              songId: song.id,
              youtubeVideoId: song.youtubeVideoId,
              title: song.title,
              artist: song.artist || null,
              energyScore: song.energyScore || 50,
              tags: [
                ...(song.tagTokens || []),
                ...(song.explicitFlag ? [] : ["couple-friendly"]),
              ],
              matchScore,
              momentKey: moment.key,
            };
          })
          .filter((candidate): candidate is RecommendationCandidate => candidate !== null);

        const dedupedBySongId = new Map<string, RecommendationCandidate>();
        for (const candidate of rankedCandidates) {
          const current = dedupedBySongId.get(candidate.songId);
          if (!current || candidate.matchScore > current.matchScore) {
            dedupedBySongId.set(candidate.songId, candidate);
          }
        }

        catalogRecommendations[moment.key] = Array.from(dedupedBySongId.values())
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, limitPerMoment);
      }

      const mergedRecommendations: Record<string, RecommendationCandidate[]> = {};
      for (const moment of momentRows) {
        const youtubeCandidates = youtubeRecommendations[moment.key] || [];
        const catalogCandidates = catalogRecommendations[moment.key] || [];
        const mergedByVideoId = new Map<string, RecommendationCandidate>();

        for (const candidate of youtubeCandidates) {
          mergedByVideoId.set(candidate.youtubeVideoId, candidate);
        }

        for (const candidate of catalogCandidates) {
          if (mergedByVideoId.size >= limitPerMoment) break;
          if (!mergedByVideoId.has(candidate.youtubeVideoId)) {
            mergedByVideoId.set(candidate.youtubeVideoId, candidate);
          }
        }

        mergedRecommendations[moment.key] = Array.from(mergedByVideoId.values())
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, limitPerMoment);
      }

      const mergedTrackCount = Object.values(mergedRecommendations).reduce((sum, list) => sum + list.length, 0);
      const source = youtubeTrackCount > 0
        ? (mergedTrackCount > youtubeTrackCount ? "hybrid" : "youtube")
        : "catalog";

      res.json({ profile, recommendations: mergedRecommendations, source, youtubeConfigured });
    } catch (error) {
      console.error("Error generating music recommendations:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente anbefalinger" });
    }
  });

  app.get("/api/couple/music/sets", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;

    try {
      const sets = await db.select().from(musicSets).where(eq(musicSets.coupleId, coupleId)).orderBy(desc(musicSets.updatedAt));
      const setIds = sets.map((set) => set.id);
      const items = setIds.length > 0
        ? await db.select().from(musicSetItems).where(inArray(musicSetItems.setId, setIds)).orderBy(asc(musicSetItems.position))
        : [];
      const itemMap = new Map<string, typeof items>();
      for (const item of items) {
        const existing = itemMap.get(item.setId) || [];
        existing.push(item);
        itemMap.set(item.setId, existing);
      }
      res.json(sets.map((set) => ({ ...set, items: itemMap.get(set.id) || [] })));
    } catch (error) {
      console.error("Error fetching music sets:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente set-lister" });
    }
  });

  app.post("/api/couple/music/sets", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;

    try {
      const body = req.body || {};
      const title = String(body.title || "Untitled Set").trim();
      const offerId = body.offerId ? String(body.offerId) : null;

      if (offerId) {
        const [offer] = await db
          .select()
          .from(vendorOffers)
          .where(and(eq(vendorOffers.id, offerId), eq(vendorOffers.coupleId, coupleId)));
        if (!offer) {
          return res.status(400).json({ error: "Ugyldig offerId for dette paret" });
        }
      }

      const [created] = await db
        .insert(musicSets)
        .values({
          coupleId,
          offerId,
          title,
          description: body.description || null,
          visibility: body.visibility || "private",
          createdByRole: "couple",
          updatedByRole: "couple",
        })
        .returning();
      res.status(201).json({ ...created, items: [] });
    } catch (error) {
      console.error("Error creating music set:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke opprette set-liste" });
    }
  });

  app.patch("/api/couple/music/sets/:setId", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { setId } = req.params;
      const updates: Record<string, unknown> = { updatedAt: new Date(), updatedByRole: "couple" };
      if (req.body?.title !== undefined) updates.title = req.body.title;
      if (req.body?.description !== undefined) updates.description = req.body.description;
      if (req.body?.visibility !== undefined) updates.visibility = req.body.visibility;
      if (req.body?.offerId !== undefined) {
        const nextOfferId = req.body.offerId ? String(req.body.offerId) : null;
        if (nextOfferId) {
          const [offer] = await db
            .select()
            .from(vendorOffers)
            .where(and(eq(vendorOffers.id, nextOfferId), eq(vendorOffers.coupleId, coupleId)));
          if (!offer) {
            return res.status(400).json({ error: "Ugyldig offerId for dette paret" });
          }
        }
        updates.offerId = nextOfferId;
      }

      const [updated] = await db
        .update(musicSets)
        .set(updates)
        .where(and(eq(musicSets.id, setId), eq(musicSets.coupleId, coupleId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Set-liste ikke funnet" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating music set:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere set-liste" });
    }
  });

  app.patch("/api/couple/music/sets/:setId/reorder", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { setId } = req.params;
      const orderedItemIds = Array.isArray(req.body?.orderedItemIds) ? req.body.orderedItemIds.map(String) : [];
      if (orderedItemIds.length === 0) {
        return res.status(400).json({ error: "orderedItemIds er påkrevd" });
      }

      const withItems = await getSetWithItems(db, coupleId, setId);
      if (!withItems) return res.status(404).json({ error: "Set-liste ikke funnet" });
      const allowed = new Set(withItems.items.map((item) => item.id));
      if (orderedItemIds.some((id: string) => !allowed.has(id))) {
        return res.status(400).json({ error: "orderedItemIds inneholder ugyldige elementer" });
      }
      if (orderedItemIds.length !== withItems.items.length) {
        return res.status(400).json({ error: "orderedItemIds må inneholde alle set-items" });
      }

      await reorderSetItemsSafely(db, setId, orderedItemIds);
      await db
        .update(musicSets)
        .set({ updatedAt: new Date(), updatedByRole: "couple" })
        .where(eq(musicSets.id, setId));

      const fresh = await getSetWithItems(db, coupleId, setId);
      res.json(fresh);
    } catch (error) {
      console.error("Error reordering music set items:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke reordne set-liste" });
    }
  });

  app.post("/api/couple/music/sets/:setId/items", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { setId } = req.params;
      const withItems = await getSetWithItems(db, coupleId, setId);
      if (!withItems) return res.status(404).json({ error: "Set-liste ikke funnet" });
      const nextPosition = await getNextSetItemPosition(withItems.items);
      const desiredPosition = Number.isFinite(req.body?.position)
        ? Math.max(0, Math.min(Number(req.body.position), withItems.items.length))
        : null;

      let songSnapshot: typeof musicSongs.$inferSelect | null = null;
      if (req.body?.songId) {
        const [song] = await db.select().from(musicSongs).where(eq(musicSongs.id, String(req.body.songId)));
        if (song) songSnapshot = song;
      }

      const [created] = await db.insert(musicSetItems).values({
        setId,
        songId: songSnapshot?.id || null,
        youtubeVideoId: songSnapshot?.youtubeVideoId || req.body?.youtubeVideoId || null,
        title: songSnapshot?.title || req.body?.title || "Untitled song",
        artist: songSnapshot?.artist || req.body?.artist || null,
        momentKey: req.body?.momentKey || null,
        position: nextPosition,
        dropMarkerSeconds: Number.isFinite(req.body?.dropMarkerSeconds) ? Number(req.body.dropMarkerSeconds) : null,
        notes: req.body?.notes || null,
        addedByRole: "couple",
      }).returning();

      if (desiredPosition !== null && desiredPosition !== nextPosition) {
        const ordered = [...withItems.items, created]
          .sort((a, b) => (Number.isFinite(a.position) ? Number(a.position) : 0) - (Number.isFinite(b.position) ? Number(b.position) : 0))
          .map((item) => item.id);
        const fromIndex = ordered.indexOf(created.id);
        if (fromIndex >= 0) {
          ordered.splice(fromIndex, 1);
          ordered.splice(desiredPosition, 0, created.id);
          await reorderSetItemsSafely(db, setId, ordered);
        }
      }

      await db
        .update(musicSets)
        .set({ updatedAt: new Date(), updatedByRole: "couple" })
        .where(eq(musicSets.id, setId));

      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating music set item:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke legge til låt i set-liste" });
    }
  });

  app.patch("/api/couple/music/sets/:setId/items/:itemId", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { setId, itemId } = req.params;
      const withItems = await getSetWithItems(db, coupleId, setId);
      if (!withItems) return res.status(404).json({ error: "Set-liste ikke funnet" });

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (req.body?.title !== undefined) updates.title = req.body.title;
      if (req.body?.artist !== undefined) updates.artist = req.body.artist;
      if (req.body?.momentKey !== undefined) updates.momentKey = req.body.momentKey;
      if (req.body?.dropMarkerSeconds !== undefined) updates.dropMarkerSeconds = req.body.dropMarkerSeconds;
      if (req.body?.notes !== undefined) updates.notes = req.body.notes;
      if (req.body?.position !== undefined) updates.position = req.body.position;

      const [updated] = await db
        .update(musicSetItems)
        .set(updates)
        .where(and(eq(musicSetItems.id, itemId), eq(musicSetItems.setId, setId)))
        .returning();

      if (!updated) return res.status(404).json({ error: "Set-item ikke funnet" });

      await db
        .update(musicSets)
        .set({ updatedAt: new Date(), updatedByRole: "couple" })
        .where(eq(musicSets.id, setId));

      res.json(updated);
    } catch (error) {
      console.error("Error updating music set item:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere set-item" });
    }
  });

  app.delete("/api/couple/music/sets/:setId/items/:itemId", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { setId, itemId } = req.params;
      const withItems = await getSetWithItems(db, coupleId, setId);
      if (!withItems) return res.status(404).json({ error: "Set-liste ikke funnet" });

      await db
        .delete(musicSetItems)
        .where(and(eq(musicSetItems.id, itemId), eq(musicSetItems.setId, setId)));

      await db
        .update(musicSets)
        .set({ updatedAt: new Date(), updatedByRole: "couple" })
        .where(eq(musicSets.id, setId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting music set item:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke slette set-item" });
    }
  });

  app.post("/api/couple/music/export/share-links", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { setId } = req.body || {};
      if (!setId) return res.status(400).json({ error: "setId er påkrevd" });
      const withItems = await getSetWithItems(db, coupleId, String(setId));
      if (!withItems) return res.status(404).json({ error: "Set-liste ikke funnet" });

      const links = withItems.items
        .filter((item) => !!item.youtubeVideoId)
        .map((item) => ({
          itemId: item.id,
          title: item.title,
          artist: item.artist,
          momentKey: item.momentKey,
          youtubeVideoId: item.youtubeVideoId,
          url: `https://www.youtube.com/watch?v=${item.youtubeVideoId}`,
          dropMarkerSeconds: item.dropMarkerSeconds,
        }));

      res.json({
        setId: withItems.set.id,
        setTitle: withItems.set.title,
        totalLinks: links.length,
        links,
      });
    } catch (error) {
      console.error("Error exporting share links:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke eksportere lenkeliste" });
    }
  });

  app.get("/api/couple/music/youtube/connect-url", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const redirectUri = getOAuthRedirectUri(req);
      const oauth = getYouTubeOAuthConfig(redirectUri);
      if (!oauth.clientId || !oauth.redirectUri) {
        return res.status(500).json({ error: "YouTube OAuth er ikke konfigurert" });
      }
      const state = createSignedOAuthState(coupleId);
      const params = new URLSearchParams({
        client_id: oauth.clientId,
        redirect_uri: oauth.redirectUri,
        response_type: "code",
        scope: oauth.scope,
        access_type: "offline",
        include_granted_scopes: "true",
        prompt: "consent",
        state,
      });
      const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      res.json({ url, state, redirectUri: oauth.redirectUri });
    } catch (error) {
      console.error("Error creating YouTube connect URL:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke starte YouTube OAuth" });
    }
  });

  app.get("/api/couple/music/youtube/callback", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    try {
      const code = String(req.query.code || "");
      const state = String(req.query.state || "");
      if (!code || !state) return res.status(400).json({ error: "Missing code/state" });

      const verified = verifySignedOAuthState(state);
      if (!verified.valid || !verified.coupleId) {
        return res.status(400).json({ error: "Ugyldig OAuth state" });
      }

      const redirectUri = getOAuthRedirectUri(req);
      const oauth = getYouTubeOAuthConfig(redirectUri);
      if (!oauth.clientId || !oauth.clientSecret || !oauth.redirectUri) {
        return res.status(500).json({ error: "YouTube OAuth er ikke konfigurert" });
      }

      const tokens = await exchangeCodeForTokens({
        code,
        clientId: oauth.clientId,
        clientSecret: oauth.clientSecret,
        redirectUri: oauth.redirectUri,
      });

      const accessToken = String(tokens.access_token || "");
      const refreshToken = String(tokens.refresh_token || "");
      if (!accessToken) return res.status(400).json({ error: "Mangler access token" });

      const channel = await fetchYouTubeChannel(accessToken);
      const expiresAt = new Date(Date.now() + Number(tokens.expires_in || 3600) * 1000);

      const existing = await db
        .select()
        .from(coupleYoutubeConnections)
        .where(eq(coupleYoutubeConnections.coupleId, verified.coupleId));

      const updatePayload = {
        youtubeChannelId: channel.channelId,
        youtubeChannelTitle: channel.channelTitle,
        accessTokenEnc: encryptSecret(accessToken),
        refreshTokenEnc: refreshToken ? encryptSecret(refreshToken) : existing[0]?.refreshTokenEnc || null,
        tokenExpiresAt: expiresAt,
        scope: String(tokens.scope || oauth.scope),
        connectedAt: new Date(),
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db
          .update(coupleYoutubeConnections)
          .set(updatePayload)
          .where(eq(coupleYoutubeConnections.coupleId, verified.coupleId));
      } else {
        await db.insert(coupleYoutubeConnections).values({
          coupleId: verified.coupleId,
          ...updatePayload,
        });
      }

      return res.status(200).send(
        `<html><body><h3>YouTube connected</h3><p>You can return to Evendi now.</p></body></html>`,
      );
    } catch (error) {
      console.error("Error handling YouTube OAuth callback:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke fullføre YouTube-tilkobling" });
    }
  });

  app.post("/api/couple/music/youtube/disconnect", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      await db.delete(coupleYoutubeConnections).where(eq(coupleYoutubeConnections.coupleId, coupleId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting YouTube:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke koble fra YouTube" });
    }
  });

  app.post("/api/couple/music/export/youtube-playlist", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const setId = String(req.body?.setId || "");
      if (!setId) return res.status(400).json({ error: "setId er påkrevd" });

      const withItems = await getSetWithItems(db, coupleId, setId);
      if (!withItems) return res.status(404).json({ error: "Set-liste ikke funnet" });

      const job = await exportSetToYouTubePlaylist({
        db,
        coupleId,
        requestedByRole: "couple",
        requestedByCoupleId: coupleId,
        setId,
        title: String(req.body?.title || withItems.set.title || "Evendi Music Set"),
        description: req.body?.description ? String(req.body.description) : `Exported from Evendi set: ${withItems.set.title}`,
        privacyStatus: req.body?.privacyStatus || "unlisted",
        idempotencyKey: req.body?.idempotencyKey ? String(req.body.idempotencyKey) : undefined,
        redirectUri: getOAuthRedirectUri(req),
        offerId: withItems.set.offerId || null,
        playlistId: req.body?.playlistId ? String(req.body.playlistId) : null,
      });

      res.json(job);
    } catch (error) {
      console.error("Error exporting YouTube playlist:", error?.message || String(error));
      res.status(500).json({ error: error instanceof Error ? error.message : "Kunne ikke eksportere YouTube-playlist" });
    }
  });

  app.get("/api/couple/music/vendor-permissions", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const permissions = await db
        .select()
        .from(coupleMusicVendorPermissions)
        .where(eq(coupleMusicVendorPermissions.coupleId, coupleId));
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching music vendor permissions:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente leverandør-samtykker" });
    }
  });

  app.put("/api/couple/music/vendor-permissions/:offerId", async (req: Request, res: Response) => {
    if (!isMusicMatcherEnabled()) return res.status(404).json({ error: "Music matcher is disabled" });
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { offerId } = req.params;
      const canExportYoutube = !!req.body?.canExportYoutube;

      const [offer] = await db
        .select()
        .from(vendorOffers)
        .where(and(eq(vendorOffers.id, offerId), eq(vendorOffers.coupleId, coupleId)));
      if (!offer) return res.status(404).json({ error: "Offer ikke funnet" });

      const [existing] = await db
        .select()
        .from(coupleMusicVendorPermissions)
        .where(eq(coupleMusicVendorPermissions.offerId, offerId));

      const payload = {
        coupleId,
        offerId,
        vendorId: offer.vendorId,
        canExportYoutube,
        grantedAt: canExportYoutube ? new Date() : null,
        revokedAt: canExportYoutube ? null : new Date(),
        updatedAt: new Date(),
      };

      if (existing) {
        const [updated] = await db
          .update(coupleMusicVendorPermissions)
          .set(payload)
          .where(eq(coupleMusicVendorPermissions.id, existing.id))
          .returning();
        return res.json(updated);
      }

      const [created] = await db.insert(coupleMusicVendorPermissions).values(payload).returning();
      res.json(created);
    } catch (error) {
      console.error("Error updating music vendor permissions:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere leverandør-samtykke" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/music/performances", coupleMusicPerformances, coupleMusicPerformances.date);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/music/setlists", coupleMusicSetlists);

  app.put("/api/couple/music/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, coupleMusicTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== CATERING =====
  app.get("/api/couple/catering", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [tastings, menu, dietaryNeeds, timelineRows] = await Promise.all([
        db.select().from(coupleCateringTastings).where(eq(coupleCateringTastings.coupleId, coupleId)).orderBy(coupleCateringTastings.date),
        db.select().from(coupleCateringMenu).where(eq(coupleCateringMenu.coupleId, coupleId)),
        db.select().from(coupleCateringDietaryNeeds).where(eq(coupleCateringDietaryNeeds.coupleId, coupleId)),
        db.select().from(coupleCateringTimeline).where(eq(coupleCateringTimeline.coupleId, coupleId)),
      ]);
      res.json({
        tastings, menu, dietaryNeeds,
        timeline: timelineRows[0] || { catererSelected: false, tastingCompleted: false, menuFinalized: false, guestCountConfirmed: false, guestCount: 0, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching catering data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente catering data" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/catering/tastings", coupleCateringTastings, coupleCateringTastings.date);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/catering/menu", coupleCateringMenu);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/catering/dietary", coupleCateringDietaryNeeds);

  app.put("/api/couple/catering/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, coupleCateringTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== CAKE =====
  app.get("/api/couple/cake", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [tastings, designs, timelineRows] = await Promise.all([
        db.select().from(coupleCakeTastings).where(eq(coupleCakeTastings.coupleId, coupleId)).orderBy(coupleCakeTastings.date),
        db.select().from(coupleCakeDesigns).where(eq(coupleCakeDesigns.coupleId, coupleId)),
        db.select().from(coupleCakeTimeline).where(eq(coupleCakeTimeline.coupleId, coupleId)),
      ]);
      res.json({
        tastings, designs,
        timeline: timelineRows[0] || { bakerySelected: false, tastingCompleted: false, designFinalized: false, depositPaid: false, deliveryConfirmed: false, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching cake data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente kake data" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/cake/tastings", coupleCakeTastings, coupleCakeTastings.date);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/cake/designs", coupleCakeDesigns);

  app.put("/api/couple/cake/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, coupleCakeTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== VENUE =====
  app.get("/api/couple/venue/seating", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const key = `couple_venue_seating_${coupleId}`;
      const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
      res.json(setting?.value ? JSON.parse(setting.value) : { tables: [], guests: [] });
    } catch (error) {
      console.error("Error fetching couple seating:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente seating" });
    }
  });

  app.post("/api/couple/venue/seating", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const key = `couple_venue_seating_${coupleId}`;
      const json = JSON.stringify(req.body || { tables: [], guests: [] });
      const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, key));
      if (existing) {
        await db.update(appSettings).set({ value: json, updatedAt: new Date() }).where(eq(appSettings.key, key));
      } else {
        await db.insert(appSettings).values({ key, value: json, category: "couple_venue_seating" });
      }
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error saving couple seating:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke lagre seating" });
    }
  });

  // Venue bookings & timeline
  app.get("/api/couple/venue/bookings", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const rows = await db.select().from(coupleVenueBookings).where(eq(coupleVenueBookings.coupleId, coupleId)).orderBy(desc(coupleVenueBookings.createdAt));
      res.json(rows);
    } catch (error) {
      console.error("Error fetching venue bookings:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente lokaler" });
    }
  });

  app.get("/api/couple/venue/timeline", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [timeline] = await db.select().from(coupleVenueTimelines).where(eq(coupleVenueTimelines.coupleId, coupleId));
      res.json(timeline || { venueSelected: false, venueVisited: false, contractSigned: false, depositPaid: false });
    } catch (error) {
      console.error("Error fetching venue timeline:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente tidslinje" });
    }
  });

  // Generic venue/:kind routes for backwards compatibility
  app.get("/api/couple/venue/:kind", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    const { kind } = req.params;
    if (!["bookings", "timeline"].includes(kind)) return res.status(400).json({ error: "Ugyldig type" });
    try {
      if (kind === "bookings") {
        const rows = await db.select().from(coupleVenueBookings).where(eq(coupleVenueBookings.coupleId, coupleId)).orderBy(desc(coupleVenueBookings.createdAt));
        return res.json(rows);
      }
      const [timeline] = await db.select().from(coupleVenueTimelines).where(eq(coupleVenueTimelines.coupleId, coupleId));
      res.json(timeline || { venueSelected: false, venueVisited: false, contractSigned: false, depositPaid: false });
    } catch (error) {
      console.error("Error fetching couple venue data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente data" });
    }
  });

  app.post("/api/couple/venue/:kind", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    const { kind } = req.params;
    if (!["bookings", "timeline"].includes(kind)) return res.status(400).json({ error: "Ugyldig type" });
    try {
      if (kind === "bookings") {
        const payload = Array.isArray(req.body) ? req.body : [];
        await db.transaction(async (tx) => {
          await tx.delete(coupleVenueBookings).where(eq(coupleVenueBookings.coupleId, coupleId));
          if (payload.length === 0) return;
          await tx.insert(coupleVenueBookings).values(payload.map((b: any) => ({
            id: b.id || crypto.randomUUID(),
            coupleId,
            venueName: b.venueName,
            date: b.date,
            time: b.time,
            location: b.location,
            capacity: b.capacity ?? null,
            notes: b.notes,
          })));
        });
        return res.status(201).json({ success: true });
      }
      const p = req.body || {};
      await db.insert(coupleVenueTimelines).values({
        coupleId,
        venueSelected: !!p.venueSelected, venueVisited: !!p.venueVisited,
        contractSigned: !!p.contractSigned, depositPaid: !!p.depositPaid,
        capacity: p.capacity ?? null, budget: p.budget ?? null,
      }).onConflictDoUpdate({
        target: coupleVenueTimelines.coupleId,
        set: {
          venueSelected: !!p.venueSelected, venueVisited: !!p.venueVisited,
          contractSigned: !!p.contractSigned, depositPaid: !!p.depositPaid,
          capacity: p.capacity ?? null, budget: p.budget ?? null,
          updatedAt: new Date(),
        },
      });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error saving couple venue data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke lagre" });
    }
  });

  app.patch("/api/couple/venue/:kind", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    const { kind } = req.params;
    if (!["bookings", "timeline"].includes(kind)) return res.status(400).json({ error: "Ugyldig type" });
    try {
      if (kind === "bookings") {
        const payload = Array.isArray(req.body) ? req.body : [];
        await db.transaction(async (tx) => {
          await tx.delete(coupleVenueBookings).where(eq(coupleVenueBookings.coupleId, coupleId));
          if (payload.length === 0) return;
          await tx.insert(coupleVenueBookings).values(payload.map((b: any) => ({
            id: b.id || crypto.randomUUID(),
            coupleId,
            venueName: b.venueName, date: b.date, time: b.time,
            location: b.location, capacity: b.capacity ?? null, notes: b.notes,
          })));
        });
        return res.json({ success: true });
      }
      const p = req.body || {};
      await db.insert(coupleVenueTimelines).values({
        coupleId,
        venueSelected: !!p.venueSelected, venueVisited: !!p.venueVisited,
        contractSigned: !!p.contractSigned, depositPaid: !!p.depositPaid,
        capacity: p.capacity ?? null, budget: p.budget ?? null,
      }).onConflictDoUpdate({
        target: coupleVenueTimelines.coupleId,
        set: {
          venueSelected: !!p.venueSelected, venueVisited: !!p.venueVisited,
          contractSigned: !!p.contractSigned, depositPaid: !!p.depositPaid,
          capacity: p.capacity ?? null, budget: p.budget ?? null,
          updatedAt: new Date(),
        },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating couple venue data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere" });
    }
  });

  app.delete("/api/couple/venue/:kind", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    const { kind } = req.params;
    if (!["bookings", "timeline"].includes(kind)) return res.status(400).json({ error: "Ugyldig type" });
    try {
      if (kind === "bookings") {
        await db.delete(coupleVenueBookings).where(eq(coupleVenueBookings.coupleId, coupleId));
      } else {
        await db.delete(coupleVenueTimelines).where(eq(coupleVenueTimelines.coupleId, coupleId));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting couple venue data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke slette" });
    }
  });

  // ===== PLANNER (meetings, tasks, timeline) =====
  app.get("/api/couple/planner", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const [meetings, tasks, timelineRows] = await Promise.all([
        db.select().from(couplePlannerMeetings).where(eq(couplePlannerMeetings.coupleId, coupleId)).orderBy(couplePlannerMeetings.date),
        db.select().from(couplePlannerTasks).where(eq(couplePlannerTasks.coupleId, coupleId)),
        db.select().from(couplePlannerTimeline).where(eq(couplePlannerTimeline.coupleId, coupleId)),
      ]);
      res.json({
        meetings, tasks,
        timeline: timelineRows[0] || { plannerSelected: false, contractSigned: false, budget: 0 },
      });
    } catch (error) {
      console.error("Error fetching planner data:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente planlegger data" });
    }
  });

  crudRoutes(db, app, checkCoupleAuth, "/api/couple/planner/meetings", couplePlannerMeetings, couplePlannerMeetings.date);
  crudRoutes(db, app, checkCoupleAuth, "/api/couple/planner/tasks", couplePlannerTasks);

  app.put("/api/couple/planner/timeline", (req: Request, res: Response) => {
    checkCoupleAuth(req, res).then(coupleId => {
      if (!coupleId) return;
      upsertTimeline(db, couplePlannerTimeline, coupleId, req.body, res, "Kunne ikke oppdatere tidslinje");
    });
  });

  // ===== WEDDING INVITES (alias for guest-invitations) =====
  app.get("/api/couple/wedding-invites", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const invites = await db.select().from(guestInvitations).where(eq(guestInvitations.coupleId, coupleId)).orderBy(desc(guestInvitations.createdAt));
      res.json(invites);
    } catch (error) {
      console.error("Error fetching wedding invites:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke hente invitasjoner" });
    }
  });

  app.post("/api/couple/wedding-invites", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const parsed = createGuestInvitationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Ugyldig data", details: parsed.error.flatten() });
      const inviteToken = crypto.randomUUID();
      const values = {
        coupleId,
        inviteToken,
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      };
      const [row] = await (db.insert(guestInvitations).values(values).returning() as unknown as any[]);
      res.json(row);
    } catch (error) {
      console.error("Error creating wedding invite:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke opprette invitasjon" });
    }
  });

  app.patch("/api/couple/wedding-invites/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      const { id } = req.params;
      const [row] = await db.update(guestInvitations).set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(guestInvitations.id, id), eq(guestInvitations.coupleId, coupleId))).returning();
      res.json(row);
    } catch (error) {
      console.error("Error updating wedding invite:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke oppdatere invitasjon" });
    }
  });

  app.delete("/api/couple/wedding-invites/:id", async (req: Request, res: Response) => {
    const coupleId = await checkCoupleAuth(req, res);
    if (!coupleId) return;
    try {
      await db.delete(guestInvitations).where(and(eq(guestInvitations.id, req.params.id), eq(guestInvitations.coupleId, coupleId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wedding invite:", error?.message || String(error));
      res.status(500).json({ error: "Kunne ikke slette invitasjon" });
    }
  });

  console.log("[CoupleFeatureRoutes] Registered dress, venue, hair-makeup, transport, flowers, photographer, videographer, music, catering, cake, important-people, photo-shots, planner, wedding-invites routes");
}
