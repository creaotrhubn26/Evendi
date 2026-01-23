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
      {
        title: "Kom i gang med Wedflow",
        description: "En grundig gjennomgang av hvordan du setter opp din leverandørprofil og kommer i gang med Wedflow-plattformen.",
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
