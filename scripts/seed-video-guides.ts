import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as dotenv from "dotenv";
import { videoGuides } from "../shared/schema";

// Load environment variables (only .env, not .env.local)
dotenv.config({ path: ".env" });

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const db = drizzle(client);

    console.log("🌱 Seeding video guides...");

    const guides = [
      // ── Vendor guides ──
      {
        title: "Kom i gang med Evendi",
        description: "En grundig gjennomgang av hvordan du setter opp din leverandørprofil og kommer i gang med Evendi-plattformen.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "05:30",
        category: "vendor",
        icon: "play-circle",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Administrer dine leveranser",
        description: "Lær hvordan du oppretter, redigerer og administrerer dine leveranser og tilbud til brudepar.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "08:15",
        category: "vendor",
        icon: "package",
        sortOrder: 2,
        isActive: true,
      },
      {
        title: "Kommunikasjon med brudepar",
        description: "Slik bruker du chat-funksjonen for å kommunisere effektivt med potensielle og eksisterende kunder.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "06:45",
        category: "vendor",
        icon: "message-circle",
        sortOrder: 3,
        isActive: true,
      },
      {
        title: "Galleri og inspirasjon",
        description: "Hvordan du laster opp og organiserer ditt galleri for å inspirere brudepar.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "07:20",
        category: "vendor",
        icon: "image",
        sortOrder: 4,
        isActive: true,
      },
      {
        title: "Status og tilgjengelighet",
        description: "Administrer din status og tilgjengelighet for å la brudepar vite når du er ledig.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "04:30",
        category: "vendor",
        icon: "calendar",
        sortOrder: 5,
        isActive: true,
      },
      {
        title: "Motta henvendelser fra par",
        description: "Lær hvordan par finner deg via leverandørsøket i planleggingsskjermene, og hvordan du ser og svarer på nye samtaler i Dashboard.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "05:00",
        category: "vendor",
        icon: "inbox",
        sortOrder: 6,
        isActive: true,
      },
      {
        title: "Synlighet og leverandørmatching",
        description: "Forstå hvordan profilen din vises når par søker etter leverandører i Blomster, Catering, Transport og andre planleggingsskjermer.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "06:00",
        category: "vendor",
        icon: "trending-up",
        sortOrder: 7,
        isActive: true,
      },

      // ── Couple guides ──
      {
        title: "Kom i gang med bryllupsplanlegging",
        description: "En introduksjon til alle planleggingsverktøyene i Evendi — sjekkliste, budsjett, gjesteliste og mer.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "06:00",
        category: "couple",
        icon: "play-circle",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Finn og velg leverandører",
        description: "Lær hvordan du søker etter registrerte leverandører direkte i planleggingsskjermene, ser profiler, og kobler dem til din planlegging.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "07:00",
        category: "couple",
        icon: "search",
        sortOrder: 2,
        isActive: true,
      },
      {
        title: "Chat med leverandører",
        description: "Slik starter du en samtale med en leverandør via leverandørsøket eller profilsiden, og følger opp meldinger i chatten.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "05:15",
        category: "couple",
        icon: "message-circle",
        sortOrder: 3,
        isActive: true,
      },
      {
        title: "Leverandørprofiler og booking",
        description: "Se leverandørens anmeldelser, produkter og priser på profilsiden. Lær hvordan du sender melding eller booker avtale direkte.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "06:30",
        category: "couple",
        icon: "user",
        sortOrder: 4,
        isActive: true,
      },
      {
        title: "Gjesteliste og bordplassering",
        description: "Administrer gjester, spor RSVP-svar, sett matpreferanser og planlegg bordplassering i ett og samme verktøy.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "08:00",
        category: "couple",
        icon: "users",
        sortOrder: 5,
        isActive: true,
      },
      {
        title: "Budsjett og kostnadsoversikt",
        description: "Sett totalbudsjett, fordel på kategorier og hold oversikt over alle kostnader gjennom hele planleggingen.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        duration: "05:45",
        category: "couple",
        icon: "dollar-sign",
        sortOrder: 6,
        isActive: true,
      },
    ];

    for (const guide of guides) {
      await db.insert(videoGuides).values(guide);
      console.log(`✅ Created: ${guide.title}`);
    }

    console.log("\n🎉 Video guides seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding video guides:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed();
