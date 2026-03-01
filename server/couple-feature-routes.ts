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
import { eq, and, desc } from "drizzle-orm";
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
