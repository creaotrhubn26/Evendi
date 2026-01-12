import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { vendors, vendorCategories, vendorRegistrationSchema, deliveries, deliveryItems, createDeliverySchema, inspirationCategories, inspirations, inspirationMedia, createInspirationSchema, vendorFeatures, vendorInspirationCategories, inspirationInquiries, createInquirySchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

function generateAccessCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

interface VendorSession {
  vendorId: string;
  createdAt: Date;
  expiresAt: Date;
}

const VENDOR_SESSIONS: Map<string, VendorSession> = new Map();
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function cleanExpiredSessions() {
  const now = new Date();
  for (const [token, session] of VENDOR_SESSIONS.entries()) {
    if (session.expiresAt < now) {
      VENDOR_SESSIONS.delete(token);
    }
  }
}

setInterval(cleanExpiredSessions, 60 * 60 * 1000);

const YR_CACHE: Map<string, { data: any; expires: Date }> = new Map();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const DEFAULT_CATEGORIES = [
  { name: "Fotograf", icon: "camera", description: "Bryllupsfotografer" },
  { name: "Videograf", icon: "video", description: "Bryllupsvideofilmer" },
  { name: "Blomster", icon: "flower", description: "Blomsterdekoratører" },
  { name: "Catering", icon: "utensils", description: "Mat og drikke" },
  { name: "Musikk", icon: "music", description: "Band, DJ og musikere" },
  { name: "Venue", icon: "home", description: "Bryllupslokaler" },
  { name: "Kake", icon: "cake", description: "Bryllupskaker" },
  { name: "Planlegger", icon: "clipboard", description: "Bryllupsplanleggere" },
  { name: "Hår & Makeup", icon: "scissors", description: "Styling og sminke" },
  { name: "Transport", icon: "car", description: "Bryllupstransport" },
];

const DEFAULT_INSPIRATION_CATEGORIES = [
  { name: "Brudekjoler", icon: "heart", sortOrder: 1 },
  { name: "Blomsterarrangementer", icon: "flower", sortOrder: 2 },
  { name: "Dekorasjon", icon: "star", sortOrder: 3 },
  { name: "Bryllupskaker", icon: "cake", sortOrder: 4 },
  { name: "Lokaler", icon: "home", sortOrder: 5 },
  { name: "Borddekning", icon: "utensils", sortOrder: 6 },
  { name: "Brudebukett", icon: "gift", sortOrder: 7 },
  { name: "Hårfrisyrer", icon: "scissors", sortOrder: 8 },
  { name: "Bryllupsbilder", icon: "camera", sortOrder: 9 },
  { name: "Invitasjoner", icon: "mail", sortOrder: 10 },
];

async function fetchYrWeather(lat: number, lon: number): Promise<any> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = YR_CACHE.get(cacheKey);
  
  if (cached && cached.expires > new Date()) {
    return cached.data;
  }

  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Wedflow/1.0 https://replit.com",
    },
  });

  if (!response.ok) {
    throw new Error(`YR API error: ${response.status}`);
  }

  const data = await response.json();
  
  const expiresHeader = response.headers.get("Expires");
  const expires = expiresHeader ? new Date(expiresHeader) : new Date(Date.now() + 3600000);
  
  YR_CACHE.set(cacheKey, { data, expires });
  
  return data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/weather", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Missing or invalid lat/lon parameters" });
      }

      const weatherData = await fetchYrWeather(lat, lon);
      
      const timeseries = weatherData.properties?.timeseries || [];
      const now = timeseries[0];
      const next6Hours = timeseries.slice(0, 6);
      const next24Hours = timeseries.slice(0, 24);

      const forecast = {
        current: now ? {
          time: now.time,
          temperature: now.data?.instant?.details?.air_temperature,
          windSpeed: now.data?.instant?.details?.wind_speed,
          humidity: now.data?.instant?.details?.relative_humidity,
          symbol: now.data?.next_1_hours?.summary?.symbol_code || now.data?.next_6_hours?.summary?.symbol_code,
          precipitation: now.data?.next_1_hours?.details?.precipitation_amount || 0,
        } : null,
        hourly: next6Hours.map((t: any) => ({
          time: t.time,
          temperature: t.data?.instant?.details?.air_temperature,
          symbol: t.data?.next_1_hours?.summary?.symbol_code || t.data?.next_6_hours?.summary?.symbol_code,
          precipitation: t.data?.next_1_hours?.details?.precipitation_amount || 0,
        })),
        daily: next24Hours
          .filter((_: any, i: number) => i % 6 === 0)
          .map((t: any) => ({
            time: t.time,
            temperature: t.data?.instant?.details?.air_temperature,
            symbol: t.data?.next_6_hours?.summary?.symbol_code,
            precipitationMax: t.data?.next_6_hours?.details?.precipitation_amount || 0,
          })),
      };

      res.json(forecast);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  async function seedCategories() {
    const existing = await db.select().from(vendorCategories);
    if (existing.length === 0) {
      await db.insert(vendorCategories).values(DEFAULT_CATEGORIES);
      console.log("Seeded vendor categories");
    }
  }

  async function seedInspirationCategories() {
    const existing = await db.select().from(inspirationCategories);
    if (existing.length === 0) {
      await db.insert(inspirationCategories).values(DEFAULT_INSPIRATION_CATEGORIES);
      console.log("Seeded inspiration categories");
    }
  }

  seedCategories().catch(console.error);
  seedInspirationCategories().catch(console.error);

  app.get("/api/vendor-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await db.select().from(vendorCategories);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Kunne ikke hente kategorier" });
    }
  });

  app.post("/api/vendors/register", async (req: Request, res: Response) => {
    try {
      const validation = vendorRegistrationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Ugyldig data", 
          details: validation.error.errors 
        });
      }

      const { email, password, ...profileData } = validation.data;

      const existingVendor = await db.select().from(vendors).where(eq(vendors.email, email));
      if (existingVendor.length > 0) {
        return res.status(400).json({ error: "E-postadressen er allerede registrert" });
      }

      const hashedPassword = hashPassword(password);

      const [newVendor] = await db.insert(vendors).values({
        email,
        password: hashedPassword,
        businessName: profileData.businessName,
        categoryId: profileData.categoryId,
        description: profileData.description || null,
        location: profileData.location || null,
        phone: profileData.phone || null,
        website: profileData.website || null,
        priceRange: profileData.priceRange || null,
      }).returning();

      const { password: _, ...vendorWithoutPassword } = newVendor;
      res.status(201).json({ 
        message: "Registrering vellykket! Din søknad er under behandling.",
        vendor: vendorWithoutPassword 
      });
    } catch (error) {
      console.error("Error registering vendor:", error);
      res.status(500).json({ error: "Kunne ikke registrere leverandør" });
    }
  });

  app.post("/api/vendors/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "E-post og passord er påkrevd" });
      }

      const [vendor] = await db.select().from(vendors).where(eq(vendors.email, email));
      if (!vendor) {
        return res.status(401).json({ error: "Ugyldig e-post eller passord" });
      }

      if (vendor.password !== hashPassword(password)) {
        return res.status(401).json({ error: "Ugyldig e-post eller passord" });
      }

      const sessionToken = generateSessionToken();
      const now = new Date();
      VENDOR_SESSIONS.set(sessionToken, {
        vendorId: vendor.id,
        createdAt: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
      });

      const { password: _, ...vendorWithoutPassword } = vendor;
      res.json({ vendor: vendorWithoutPassword, sessionToken });
    } catch (error) {
      console.error("Error logging in vendor:", error);
      res.status(500).json({ error: "Kunne ikke logge inn" });
    }
  });

  app.post("/api/vendors/logout", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      VENDOR_SESSIONS.delete(token);
    }
    res.json({ message: "Logget ut" });
  });

  app.get("/api/vendors", async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      
      let query = db.select({
        id: vendors.id,
        businessName: vendors.businessName,
        categoryId: vendors.categoryId,
        description: vendors.description,
        location: vendors.location,
        phone: vendors.phone,
        website: vendors.website,
        priceRange: vendors.priceRange,
        imageUrl: vendors.imageUrl,
      }).from(vendors).where(eq(vendors.status, "approved"));

      const approvedVendors = await query;
      
      const filtered = categoryId 
        ? approvedVendors.filter(v => v.categoryId === categoryId)
        : approvedVendors;

      res.json(filtered);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ error: "Kunne ikke hente leverandører" });
    }
  });

  const checkAdminAuth = (req: Request, res: Response): boolean => {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      res.status(503).json({ error: "Admin-funksjonalitet er ikke konfigurert" });
      return false;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      res.status(401).json({ error: "Ikke autorisert" });
      return false;
    }
    return true;
  };

  app.get("/api/admin/vendors", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;
    
    try {
      const status = req.query.status as string || "pending";
      
      const vendorList = await db.select({
        id: vendors.id,
        email: vendors.email,
        businessName: vendors.businessName,
        categoryId: vendors.categoryId,
        description: vendors.description,
        location: vendors.location,
        phone: vendors.phone,
        website: vendors.website,
        priceRange: vendors.priceRange,
        status: vendors.status,
        createdAt: vendors.createdAt,
      }).from(vendors).where(eq(vendors.status, status));

      res.json(vendorList);
    } catch (error) {
      console.error("Error fetching admin vendors:", error);
      res.status(500).json({ error: "Kunne ikke hente leverandører" });
    }
  });

  app.post("/api/admin/vendors/:id/approve", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;
    
    try {
      const { id } = req.params;
      
      await db.update(vendors)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(vendors.id, id));

      res.json({ message: "Leverandør godkjent" });
    } catch (error) {
      console.error("Error approving vendor:", error);
      res.status(500).json({ error: "Kunne ikke godkjenne leverandør" });
    }
  });

  app.post("/api/admin/vendors/:id/reject", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;
    
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      await db.update(vendors)
        .set({ 
          status: "rejected", 
          rejectionReason: reason || null,
          updatedAt: new Date() 
        })
        .where(eq(vendors.id, id));

      res.json({ message: "Leverandør avvist" });
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      res.status(500).json({ error: "Kunne ikke avvise leverandør" });
    }
  });

  const checkVendorAuth = async (req: Request, res: Response): Promise<string | null> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Ikke autorisert" });
      return null;
    }
    const token = authHeader.replace("Bearer ", "");
    const session = VENDOR_SESSIONS.get(token);
    
    if (!session) {
      res.status(401).json({ error: "Økt utløpt. Vennligst logg inn på nytt." });
      return null;
    }

    if (session.expiresAt < new Date()) {
      VENDOR_SESSIONS.delete(token);
      res.status(401).json({ error: "Økt utløpt. Vennligst logg inn på nytt." });
      return null;
    }

    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, session.vendorId));
    if (!vendor || vendor.status !== "approved") {
      res.status(401).json({ error: "Ikke autorisert" });
      return null;
    }
    return session.vendorId;
  };

  app.get("/api/vendor/deliveries", async (req: Request, res: Response) => {
    const vendorId = await checkVendorAuth(req, res);
    if (!vendorId) return;

    try {
      const vendorDeliveries = await db.select().from(deliveries).where(eq(deliveries.vendorId, vendorId));
      
      const deliveriesWithItems = await Promise.all(
        vendorDeliveries.map(async (delivery) => {
          const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, delivery.id));
          return { ...delivery, items };
        })
      );

      res.json(deliveriesWithItems);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ error: "Kunne ikke hente leveranser" });
    }
  });

  app.post("/api/vendor/deliveries", async (req: Request, res: Response) => {
    const vendorId = await checkVendorAuth(req, res);
    if (!vendorId) return;

    try {
      const validation = createDeliverySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Ugyldig data", 
          details: validation.error.errors 
        });
      }

      const { items, ...deliveryData } = validation.data;
      const accessCode = generateAccessCode();

      const [newDelivery] = await db.insert(deliveries).values({
        vendorId,
        coupleName: deliveryData.coupleName,
        coupleEmail: deliveryData.coupleEmail || null,
        title: deliveryData.title,
        description: deliveryData.description || null,
        weddingDate: deliveryData.weddingDate || null,
        accessCode,
      }).returning();

      await Promise.all(
        items.map((item, index) =>
          db.insert(deliveryItems).values({
            deliveryId: newDelivery.id,
            type: item.type,
            label: item.label,
            url: item.url,
            description: item.description || null,
            sortOrder: index,
          })
        )
      );

      const createdItems = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, newDelivery.id));

      res.status(201).json({ 
        delivery: { ...newDelivery, items: createdItems },
        message: `Leveranse opprettet! Tilgangskode: ${accessCode}` 
      });
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ error: "Kunne ikke opprette leveranse" });
    }
  });

  app.get("/api/deliveries/:accessCode", async (req: Request, res: Response) => {
    try {
      const { accessCode } = req.params;
      
      const [delivery] = await db.select().from(deliveries).where(eq(deliveries.accessCode, accessCode.toUpperCase()));
      if (!delivery || delivery.status !== "active") {
        return res.status(404).json({ error: "Leveranse ikke funnet" });
      }

      const [vendor] = await db.select({
        businessName: vendors.businessName,
        categoryId: vendors.categoryId,
      }).from(vendors).where(eq(vendors.id, delivery.vendorId));

      const items = await db.select().from(deliveryItems).where(eq(deliveryItems.deliveryId, delivery.id));

      res.json({ 
        delivery: { ...delivery, items },
        vendor 
      });
    } catch (error) {
      console.error("Error fetching delivery:", error);
      res.status(500).json({ error: "Kunne ikke hente leveranse" });
    }
  });

  app.get("/api/inspiration-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await db.select().from(inspirationCategories);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching inspiration categories:", error);
      res.status(500).json({ error: "Kunne ikke hente kategorier" });
    }
  });

  app.get("/api/inspirations", async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;

      const approvedInspirations = await db.select().from(inspirations).where(eq(inspirations.status, "approved"));

      const filtered = categoryId 
        ? approvedInspirations.filter(i => i.categoryId === categoryId)
        : approvedInspirations;

      const inspirationsWithDetails = await Promise.all(
        filtered.map(async (insp) => {
          const media = await db.select().from(inspirationMedia).where(eq(inspirationMedia.inspirationId, insp.id));
          const [vendor] = await db.select({
            id: vendors.id,
            businessName: vendors.businessName,
          }).from(vendors).where(eq(vendors.id, insp.vendorId));
          const [category] = await db.select().from(inspirationCategories).where(eq(inspirationCategories.id, insp.categoryId || ""));
          return { ...insp, media, vendor, category };
        })
      );

      res.json(inspirationsWithDetails);
    } catch (error) {
      console.error("Error fetching inspirations:", error);
      res.status(500).json({ error: "Kunne ikke hente inspirasjoner" });
    }
  });

  app.get("/api/vendor/inspirations", async (req: Request, res: Response) => {
    const vendorId = await checkVendorAuth(req, res);
    if (!vendorId) return;

    try {
      const vendorInspirations = await db.select().from(inspirations).where(eq(inspirations.vendorId, vendorId));

      const inspirationsWithMedia = await Promise.all(
        vendorInspirations.map(async (insp) => {
          const media = await db.select().from(inspirationMedia).where(eq(inspirationMedia.inspirationId, insp.id));
          const [category] = await db.select().from(inspirationCategories).where(eq(inspirationCategories.id, insp.categoryId || ""));
          return { ...insp, media, category };
        })
      );

      res.json(inspirationsWithMedia);
    } catch (error) {
      console.error("Error fetching vendor inspirations:", error);
      res.status(500).json({ error: "Kunne ikke hente inspirasjoner" });
    }
  });

  app.post("/api/vendor/inspirations", async (req: Request, res: Response) => {
    const vendorId = await checkVendorAuth(req, res);
    if (!vendorId) return;

    try {
      const validation = createInspirationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Ugyldig data",
          details: validation.error.errors,
        });
      }

      const { media, ...inspirationData } = validation.data;

      const assignments = await db.select().from(vendorInspirationCategories).where(eq(vendorInspirationCategories.vendorId, vendorId));
      if (assignments.length > 0) {
        const allowedCategoryIds = assignments.map(a => a.categoryId);
        if (!allowedCategoryIds.includes(inspirationData.categoryId)) {
          return res.status(403).json({ error: "Du har ikke tilgang til denne kategorien" });
        }
      }

      const [newInspiration] = await db.insert(inspirations).values({
        vendorId,
        categoryId: inspirationData.categoryId,
        title: inspirationData.title,
        description: inspirationData.description || null,
        coverImageUrl: inspirationData.coverImageUrl || (media.length > 0 ? media[0].url : null),
        priceSummary: inspirationData.priceSummary || null,
        priceMin: inspirationData.priceMin || null,
        priceMax: inspirationData.priceMax || null,
        currency: inspirationData.currency || "NOK",
        websiteUrl: inspirationData.websiteUrl || null,
        inquiryEmail: inspirationData.inquiryEmail || null,
        inquiryPhone: inspirationData.inquiryPhone || null,
        ctaLabel: inspirationData.ctaLabel || null,
        ctaUrl: inspirationData.ctaUrl || null,
        allowInquiryForm: inspirationData.allowInquiryForm || false,
      }).returning();

      await Promise.all(
        media.map((item, index) =>
          db.insert(inspirationMedia).values({
            inspirationId: newInspiration.id,
            type: item.type,
            url: item.url,
            caption: item.caption || null,
            sortOrder: index,
          })
        )
      );

      const createdMedia = await db.select().from(inspirationMedia).where(eq(inspirationMedia.inspirationId, newInspiration.id));

      res.status(201).json({
        inspiration: { ...newInspiration, media: createdMedia },
        message: "Inspirasjon opprettet! Den vil bli synlig etter godkjenning.",
      });
    } catch (error) {
      console.error("Error creating inspiration:", error);
      res.status(500).json({ error: "Kunne ikke opprette inspirasjon" });
    }
  });

  app.get("/api/admin/inspirations", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;

    try {
      const status = req.query.status as string || "pending";

      const inspirationList = await db.select().from(inspirations).where(eq(inspirations.status, status));

      const inspirationsWithDetails = await Promise.all(
        inspirationList.map(async (insp) => {
          const media = await db.select().from(inspirationMedia).where(eq(inspirationMedia.inspirationId, insp.id));
          const [vendor] = await db.select({
            id: vendors.id,
            businessName: vendors.businessName,
          }).from(vendors).where(eq(vendors.id, insp.vendorId));
          const [category] = await db.select().from(inspirationCategories).where(eq(inspirationCategories.id, insp.categoryId || ""));
          return { ...insp, media, vendor, category };
        })
      );

      res.json(inspirationsWithDetails);
    } catch (error) {
      console.error("Error fetching admin inspirations:", error);
      res.status(500).json({ error: "Kunne ikke hente inspirasjoner" });
    }
  });

  app.post("/api/admin/inspirations/:id/approve", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;

    try {
      const { id } = req.params;

      await db.update(inspirations)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(inspirations.id, id));

      res.json({ message: "Inspirasjon godkjent" });
    } catch (error) {
      console.error("Error approving inspiration:", error);
      res.status(500).json({ error: "Kunne ikke godkjenne inspirasjon" });
    }
  });

  app.post("/api/admin/inspirations/:id/reject", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;

    try {
      const { id } = req.params;
      const { reason } = req.body;

      await db.update(inspirations)
        .set({
          status: "rejected",
          rejectionReason: reason || null,
          updatedAt: new Date(),
        })
        .where(eq(inspirations.id, id));

      res.json({ message: "Inspirasjon avvist" });
    } catch (error) {
      console.error("Error rejecting inspiration:", error);
      res.status(500).json({ error: "Kunne ikke avvise inspirasjon" });
    }
  });

  app.get("/api/admin/vendors/:id/features", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;

    try {
      const { id } = req.params;
      const features = await db.select().from(vendorFeatures).where(eq(vendorFeatures.vendorId, id));
      res.json(features);
    } catch (error) {
      console.error("Error fetching vendor features:", error);
      res.status(500).json({ error: "Kunne ikke hente funksjoner" });
    }
  });

  app.put("/api/admin/vendors/:id/features", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;

    try {
      const { id } = req.params;
      const { features } = req.body as { features: { featureKey: string; isEnabled: boolean }[] };

      for (const feature of features) {
        const existing = await db.select().from(vendorFeatures)
          .where(and(eq(vendorFeatures.vendorId, id), eq(vendorFeatures.featureKey, feature.featureKey)));

        if (existing.length > 0) {
          await db.update(vendorFeatures)
            .set({ isEnabled: feature.isEnabled, updatedAt: new Date() })
            .where(and(eq(vendorFeatures.vendorId, id), eq(vendorFeatures.featureKey, feature.featureKey)));
        } else {
          await db.insert(vendorFeatures).values({
            vendorId: id,
            featureKey: feature.featureKey,
            isEnabled: feature.isEnabled,
          });
        }
      }

      res.json({ message: "Funksjoner oppdatert" });
    } catch (error) {
      console.error("Error updating vendor features:", error);
      res.status(500).json({ error: "Kunne ikke oppdatere funksjoner" });
    }
  });

  app.get("/api/admin/vendors/:id/inspiration-categories", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;

    try {
      const { id } = req.params;
      const assignments = await db.select().from(vendorInspirationCategories).where(eq(vendorInspirationCategories.vendorId, id));
      res.json(assignments.map(a => a.categoryId));
    } catch (error) {
      console.error("Error fetching vendor categories:", error);
      res.status(500).json({ error: "Kunne ikke hente kategorier" });
    }
  });

  app.put("/api/admin/vendors/:id/inspiration-categories", async (req: Request, res: Response) => {
    if (!checkAdminAuth(req, res)) return;

    try {
      const { id } = req.params;
      const { categoryIds } = req.body as { categoryIds: string[] };

      await db.delete(vendorInspirationCategories).where(eq(vendorInspirationCategories.vendorId, id));

      if (categoryIds.length > 0) {
        await db.insert(vendorInspirationCategories).values(
          categoryIds.map(categoryId => ({
            vendorId: id,
            categoryId,
          }))
        );
      }

      res.json({ message: "Kategorier oppdatert" });
    } catch (error) {
      console.error("Error updating vendor categories:", error);
      res.status(500).json({ error: "Kunne ikke oppdatere kategorier" });
    }
  });

  app.get("/api/vendor/allowed-categories", async (req: Request, res: Response) => {
    const vendorId = await checkVendorAuth(req, res);
    if (!vendorId) return;

    try {
      const assignments = await db.select().from(vendorInspirationCategories).where(eq(vendorInspirationCategories.vendorId, vendorId));
      
      if (assignments.length === 0) {
        const allCategories = await db.select().from(inspirationCategories);
        res.json(allCategories);
      } else {
        const categoryIds = assignments.map(a => a.categoryId);
        const allowedCategories = await db.select().from(inspirationCategories);
        res.json(allowedCategories.filter(c => categoryIds.includes(c.id)));
      }
    } catch (error) {
      console.error("Error fetching allowed categories:", error);
      res.status(500).json({ error: "Kunne ikke hente kategorier" });
    }
  });

  app.get("/api/vendor/features", async (req: Request, res: Response) => {
    const vendorId = await checkVendorAuth(req, res);
    if (!vendorId) return;

    try {
      const features = await db.select().from(vendorFeatures).where(eq(vendorFeatures.vendorId, vendorId));
      
      const featureMap: Record<string, boolean> = {
        deliveries: true,
        inspirations: true,
      };

      for (const f of features) {
        featureMap[f.featureKey] = f.isEnabled;
      }

      res.json(featureMap);
    } catch (error) {
      console.error("Error fetching vendor features:", error);
      res.status(500).json({ error: "Kunne ikke hente funksjoner" });
    }
  });

  app.post("/api/inspirations/:id/inquiry", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = createInquirySchema.safeParse({ ...req.body, inspirationId: id });
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Ugyldig data",
          details: validation.error.errors,
        });
      }

      const [inspiration] = await db.select().from(inspirations).where(eq(inspirations.id, id));
      if (!inspiration || inspiration.status !== "approved") {
        return res.status(404).json({ error: "Inspirasjon ikke funnet" });
      }

      if (!inspiration.allowInquiryForm) {
        return res.status(400).json({ error: "Forespørsler er ikke aktivert for denne inspirasjonen" });
      }

      const { inspirationId, ...inquiryData } = validation.data;

      await db.insert(inspirationInquiries).values({
        inspirationId: id,
        vendorId: inspiration.vendorId,
        name: inquiryData.name,
        email: inquiryData.email,
        phone: inquiryData.phone || null,
        message: inquiryData.message,
        weddingDate: inquiryData.weddingDate || null,
      });

      res.status(201).json({ message: "Forespørsel sendt!" });
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ error: "Kunne ikke sende forespørsel" });
    }
  });

  app.get("/api/vendor/inquiries", async (req: Request, res: Response) => {
    const vendorId = await checkVendorAuth(req, res);
    if (!vendorId) return;

    try {
      const inquiries = await db.select().from(inspirationInquiries).where(eq(inspirationInquiries.vendorId, vendorId));
      
      const inquiriesWithDetails = await Promise.all(
        inquiries.map(async (inq) => {
          const [insp] = await db.select({ title: inspirations.title }).from(inspirations).where(eq(inspirations.id, inq.inspirationId));
          return { ...inq, inspirationTitle: insp?.title };
        })
      );

      res.json(inquiriesWithDetails);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Kunne ikke hente forespørsler" });
    }
  });

  app.patch("/api/vendor/inquiries/:id/status", async (req: Request, res: Response) => {
    const vendorId = await checkVendorAuth(req, res);
    if (!vendorId) return;

    try {
      const { id } = req.params;
      const { status } = req.body;

      const [inquiry] = await db.select().from(inspirationInquiries).where(eq(inspirationInquiries.id, id));
      if (!inquiry || inquiry.vendorId !== vendorId) {
        return res.status(404).json({ error: "Forespørsel ikke funnet" });
      }

      await db.update(inspirationInquiries)
        .set({ status })
        .where(eq(inspirationInquiries.id, id));

      res.json({ message: "Status oppdatert" });
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ error: "Kunne ikke oppdatere status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
