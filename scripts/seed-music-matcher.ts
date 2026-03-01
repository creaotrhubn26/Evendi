import { config } from "dotenv";
import { and, eq, isNull } from "drizzle-orm";

import {
  musicMoments,
  musicSongs,
  musicMomentSongRankings,
} from "../shared/schema";
import { db } from "../server/db";

config({ path: ".env.local" });

type SeedMoment = {
  key: string;
  title: string;
  description: string;
  category: string;
  defaultEnergy: number;
  sortOrder: number;
};

type SeedSong = {
  title: string;
  artist: string;
  youtubeVideoId: string;
  energyScore: number;
  dholScore: number;
  danceability: number;
  popularityScore: number;
  explicitFlag: boolean;
  cultureTags: string[];
  languageTags: string[];
  tagTokens: string[];
};

type SeedRanking = {
  momentKey: string;
  youtubeVideoId: string;
  cultureKey?: string;
  rankScore: number;
  isPrimary?: boolean;
};

const MOMENTS: SeedMoment[] = [
  { key: "groom_entry_mehndi", title: "Groom Entry (Mehndi / Baraat)", description: "Energetic groom entry with drums and singalong hooks.", category: "entry", defaultEnergy: 85, sortOrder: 10 },
  { key: "bride_entry", title: "Bride Entry", description: "Elegant and emotional walk-in songs.", category: "entry", defaultEnergy: 55, sortOrder: 20 },
  { key: "couple_entry", title: "Couple Entry", description: "High-impact entry tracks for the couple.", category: "entry", defaultEnergy: 75, sortOrder: 30 },
  { key: "first_dance", title: "First Dance", description: "Romantic dance songs and slow grooves.", category: "dance", defaultEnergy: 40, sortOrder: 40 },
  { key: "family_dance_set", title: "Family Dance Set", description: "Friendly dance-floor songs with easy hooks.", category: "dance", defaultEnergy: 70, sortOrder: 50 },
  { key: "dinner_vibe", title: "Dinner Vibe", description: "Lounge and conversation-friendly music.", category: "dinner", defaultEnergy: 35, sortOrder: 60 },
  { key: "afterparty_peak", title: "Afterparty Peak", description: "Peak dancefloor energy and drops.", category: "party", defaultEnergy: 95, sortOrder: 70 },
  { key: "vidaai_farewell", title: "Vidaai / Farewell", description: "Emotional and reflective farewell tracks.", category: "farewell", defaultEnergy: 30, sortOrder: 80 },
];

// Curated starter catalog covering all currently supported cultures.
const SONGS: SeedSong[] = [
  { title: "Gallan Goodiyaan", artist: "Yashita Sharma", youtubeVideoId: "jCEdTq3j-0U", energyScore: 86, dholScore: 72, danceability: 83, popularityScore: 92, explicitFlag: false, cultureTags: ["indisk", "pakistansk", "sikh"], languageTags: ["hindi", "punjabi"], tagTokens: ["drop", "singalong", "family-friendly"] },
  { title: "Morni Banke", artist: "Guru Randhawa", youtubeVideoId: "xWi8nDUjHGA", energyScore: 92, dholScore: 88, danceability: 90, popularityScore: 88, explicitFlag: false, cultureTags: ["sikh", "pakistansk", "indisk"], languageTags: ["punjabi", "hindi"], tagTokens: ["dhol", "drop", "singalong"] },
  { title: "London Thumakda", artist: "Labh Janjua", youtubeVideoId: "udra3Mfw2oo", energyScore: 84, dholScore: 80, danceability: 82, popularityScore: 86, explicitFlag: false, cultureTags: ["indisk", "pakistansk", "sikh"], languageTags: ["hindi", "punjabi"], tagTokens: ["dhol", "family-friendly", "wedding"] },
  { title: "Madhanya", artist: "Rahul Vaidya", youtubeVideoId: "7wH2YySpoXE", energyScore: 42, dholScore: 18, danceability: 40, popularityScore: 74, explicitFlag: false, cultureTags: ["indisk", "pakistansk", "muslimsk"], languageTags: ["hindi", "urdu"], tagTokens: ["romantic", "couple-friendly"] },
  { title: "Raataan Lambiyan", artist: "Jubin Nautiyal", youtubeVideoId: "gvyUuxdRdR4", energyScore: 45, dholScore: 12, danceability: 48, popularityScore: 90, explicitFlag: false, cultureTags: ["indisk", "pakistansk", "annet"], languageTags: ["hindi"], tagTokens: ["romantic", "slow"] },
  { title: "Kesariya", artist: "Arijit Singh", youtubeVideoId: "BddP6PYo2gs", energyScore: 47, dholScore: 14, danceability: 44, popularityScore: 89, explicitFlag: false, cultureTags: ["indisk", "pakistansk", "sikh"], languageTags: ["hindi"], tagTokens: ["romantic", "couple-friendly"] },
  { title: "Dum Dum", artist: "Sufi Ensemble", youtubeVideoId: "2Vv-BfVoq4g", energyScore: 38, dholScore: 10, danceability: 35, popularityScore: 58, explicitFlag: false, cultureTags: ["pakistansk", "muslimsk"], languageTags: ["urdu", "punjabi"], tagTokens: ["sufi", "dinner"] },
  { title: "Dabke Nights", artist: "Levant Project", youtubeVideoId: "fRh_vgS2dFE", energyScore: 81, dholScore: 65, danceability: 86, popularityScore: 66, explicitFlag: false, cultureTags: ["arabisk", "libanesisk", "muslimsk"], languageTags: ["arabic"], tagTokens: ["dabke", "family-friendly", "drop"] },
  { title: "Zaffa Entry", artist: "Oriental Drums", youtubeVideoId: "JGwWNGJdvx8", energyScore: 89, dholScore: 73, danceability: 77, popularityScore: 61, explicitFlag: false, cultureTags: ["arabisk", "libanesisk"], languageTags: ["arabic"], tagTokens: ["zaffa", "entry"] },
  { title: "Hardingfele Procession", artist: "Nordic Folk", youtubeVideoId: "CevxZvSJLk8", energyScore: 34, dholScore: 2, danceability: 28, popularityScore: 52, explicitFlag: false, cultureTags: ["norsk", "svensk", "dansk"], languageTags: ["norwegian"], tagTokens: ["ceremony", "classy", "lounge"] },
  { title: "Brudevals Klassisk", artist: "Oslo Strings", youtubeVideoId: "kJQP7kiw5Fk", energyScore: 31, dholScore: 0, danceability: 30, popularityScore: 49, explicitFlag: false, cultureTags: ["norsk", "dansk", "svensk"], languageTags: ["instrumental"], tagTokens: ["first-dance", "romantic"] },
  { title: "Afrobeats Celebration", artist: "Lagos Live", youtubeVideoId: "4NRXx6U8ABQ", energyScore: 88, dholScore: 24, danceability: 93, popularityScore: 83, explicitFlag: false, cultureTags: ["nigeriansk", "annet"], languageTags: ["english"], tagTokens: ["afterparty", "drop"] },
  { title: "Somali Wedding Groove", artist: "Mogadishu Band", youtubeVideoId: "YQHsXMglC9A", energyScore: 78, dholScore: 20, danceability: 82, popularityScore: 63, explicitFlag: false, cultureTags: ["somalisk", "muslimsk"], languageTags: ["somali", "arabic"], tagTokens: ["family-friendly", "dance"] },
  { title: "Ethiopian Eskista", artist: "Addis Collective", youtubeVideoId: "09R8_2nJtjg", energyScore: 74, dholScore: 18, danceability: 76, popularityScore: 59, explicitFlag: false, cultureTags: ["etiopisk", "annet"], languageTags: ["amharic"], tagTokens: ["dance", "traditional"] },
  { title: "Persian Aghd Strings", artist: "Tehran Ensemble", youtubeVideoId: "hLQl3WQQoQ0", energyScore: 33, dholScore: 5, danceability: 30, popularityScore: 57, explicitFlag: false, cultureTags: ["iransk"], languageTags: ["farsi"], tagTokens: ["ceremony", "romantic"] },
  { title: "Turkish Halay", artist: "Ankara Folk", youtubeVideoId: "OPf0YbXqDm0", energyScore: 79, dholScore: 42, danceability: 81, popularityScore: 64, explicitFlag: false, cultureTags: ["tyrkisk"], languageTags: ["turkish"], tagTokens: ["halay", "family-friendly"] },
  { title: "Chinese Tea Ceremony", artist: "Jade Ensemble", youtubeVideoId: "ktvTqknDobU", energyScore: 25, dholScore: 0, danceability: 20, popularityScore: 46, explicitFlag: false, cultureTags: ["kinesisk"], languageTags: ["instrumental"], tagTokens: ["tea-ceremony", "lounge"] },
  { title: "Korean Pyebaek Theme", artist: "Seoul Traditions", youtubeVideoId: "rYEDA3JcQqw", energyScore: 28, dholScore: 0, danceability: 22, popularityScore: 44, explicitFlag: false, cultureTags: ["koreansk"], languageTags: ["korean", "instrumental"], tagTokens: ["ceremony", "classy"] },
  { title: "Thai Khan Maak Parade", artist: "Bangkok Drums", youtubeVideoId: "60ItHLz5WEA", energyScore: 69, dholScore: 35, danceability: 70, popularityScore: 53, explicitFlag: false, cultureTags: ["thai"], languageTags: ["thai"], tagTokens: ["procession", "entry"] },
  { title: "Filipino Wedding Ballad", artist: "Manila Voices", youtubeVideoId: "1TsVjvEkc4s", energyScore: 36, dholScore: 3, danceability: 34, popularityScore: 58, explicitFlag: false, cultureTags: ["filipino"], languageTags: ["english", "tagalog"], tagTokens: ["romantic", "first-dance"] },
  { title: "Classy Lounge Edit", artist: "Event Collective", youtubeVideoId: "VbfpW0pbvaU", energyScore: 27, dholScore: 0, danceability: 39, popularityScore: 68, explicitFlag: false, cultureTags: ["annet", "norsk", "mixed"], languageTags: ["instrumental"], tagTokens: ["lounge", "dinner", "classy"] },
  { title: "Afterparty Anthem", artist: "DJ Evendi", youtubeVideoId: "3JZ_D3ELwOQ", energyScore: 96, dholScore: 40, danceability: 94, popularityScore: 71, explicitFlag: false, cultureTags: ["annet", "mixed", "indisk", "pakistansk"], languageTags: ["english", "hindi"], tagTokens: ["afterparty", "drop", "singalong"] },
  { title: "Vidaai Strings", artist: "Ceremony House", youtubeVideoId: "pRpeEdMmmQ0", energyScore: 24, dholScore: 1, danceability: 19, popularityScore: 51, explicitFlag: false, cultureTags: ["indisk", "pakistansk", "sikh"], languageTags: ["hindi", "urdu"], tagTokens: ["vidaai", "farewell", "emotional"] },
  { title: "Pakistani Mehndi Beat", artist: "Karachi Nights", youtubeVideoId: "YqeW9_5kURI", energyScore: 87, dholScore: 83, danceability: 88, popularityScore: 70, explicitFlag: false, cultureTags: ["pakistansk", "muslimsk", "sikh"], languageTags: ["urdu", "punjabi"], tagTokens: ["mehndi", "dhol", "drop"] },
];

const RANKINGS: SeedRanking[] = [
  { momentKey: "groom_entry_mehndi", youtubeVideoId: "xWi8nDUjHGA", rankScore: 95 },
  { momentKey: "groom_entry_mehndi", youtubeVideoId: "YqeW9_5kURI", rankScore: 93, cultureKey: "pakistansk" },
  { momentKey: "groom_entry_mehndi", youtubeVideoId: "JGwWNGJdvx8", rankScore: 90, cultureKey: "arabisk" },
  { momentKey: "bride_entry", youtubeVideoId: "7wH2YySpoXE", rankScore: 88 },
  { momentKey: "bride_entry", youtubeVideoId: "hLQl3WQQoQ0", rankScore: 82, cultureKey: "iransk" },
  { momentKey: "bride_entry", youtubeVideoId: "1TsVjvEkc4s", rankScore: 76, cultureKey: "filipino" },
  { momentKey: "couple_entry", youtubeVideoId: "jCEdTq3j-0U", rankScore: 90 },
  { momentKey: "couple_entry", youtubeVideoId: "JGwWNGJdvx8", rankScore: 84 },
  { momentKey: "couple_entry", youtubeVideoId: "60ItHLz5WEA", rankScore: 80, cultureKey: "thai" },
  { momentKey: "first_dance", youtubeVideoId: "gvyUuxdRdR4", rankScore: 91 },
  { momentKey: "first_dance", youtubeVideoId: "kJQP7kiw5Fk", rankScore: 86, cultureKey: "norsk" },
  { momentKey: "first_dance", youtubeVideoId: "1TsVjvEkc4s", rankScore: 79 },
  { momentKey: "family_dance_set", youtubeVideoId: "udra3Mfw2oo", rankScore: 92 },
  { momentKey: "family_dance_set", youtubeVideoId: "4NRXx6U8ABQ", rankScore: 83, cultureKey: "nigeriansk" },
  { momentKey: "family_dance_set", youtubeVideoId: "OPf0YbXqDm0", rankScore: 81, cultureKey: "tyrkisk" },
  { momentKey: "dinner_vibe", youtubeVideoId: "VbfpW0pbvaU", rankScore: 93 },
  { momentKey: "dinner_vibe", youtubeVideoId: "2Vv-BfVoq4g", rankScore: 80 },
  { momentKey: "dinner_vibe", youtubeVideoId: "CevxZvSJLk8", rankScore: 74 },
  { momentKey: "afterparty_peak", youtubeVideoId: "3JZ_D3ELwOQ", rankScore: 97 },
  { momentKey: "afterparty_peak", youtubeVideoId: "4NRXx6U8ABQ", rankScore: 91 },
  { momentKey: "afterparty_peak", youtubeVideoId: "xWi8nDUjHGA", rankScore: 89 },
  { momentKey: "vidaai_farewell", youtubeVideoId: "pRpeEdMmmQ0", rankScore: 95 },
  { momentKey: "vidaai_farewell", youtubeVideoId: "BddP6PYo2gs", rankScore: 82 },
  { momentKey: "vidaai_farewell", youtubeVideoId: "hLQl3WQQoQ0", rankScore: 78 },
];

async function seedMoments() {
  const map = new Map<string, string>();
  for (const moment of MOMENTS) {
    const [existing] = await db.select().from(musicMoments).where(eq(musicMoments.key, moment.key));
    if (existing) {
      const [updated] = await db
        .update(musicMoments)
        .set({
          title: moment.title,
          description: moment.description,
          category: moment.category,
          defaultEnergy: moment.defaultEnergy,
          sortOrder: moment.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(musicMoments.id, existing.id))
        .returning();
      map.set(moment.key, updated.id);
    } else {
      const [created] = await db.insert(musicMoments).values(moment).returning();
      map.set(moment.key, created.id);
    }
  }
  return map;
}

async function seedSongs() {
  const map = new Map<string, string>();
  for (const song of SONGS) {
    const [existing] = await db.select().from(musicSongs).where(eq(musicSongs.youtubeVideoId, song.youtubeVideoId));
    if (existing) {
      const [updated] = await db
        .update(musicSongs)
        .set({
          title: song.title,
          artist: song.artist,
          energyScore: song.energyScore,
          dholScore: song.dholScore,
          danceability: song.danceability,
          popularityScore: song.popularityScore,
          explicitFlag: song.explicitFlag,
          cultureTags: song.cultureTags,
          languageTags: song.languageTags,
          tagTokens: song.tagTokens,
          updatedAt: new Date(),
        })
        .where(eq(musicSongs.id, existing.id))
        .returning();
      map.set(song.youtubeVideoId, updated.id);
    } else {
      const [created] = await db.insert(musicSongs).values(song).returning();
      map.set(song.youtubeVideoId, created.id);
    }
  }
  return map;
}

async function seedRankings(momentMap: Map<string, string>, songMap: Map<string, string>) {
  for (const ranking of RANKINGS) {
    const momentId = momentMap.get(ranking.momentKey);
    const songId = songMap.get(ranking.youtubeVideoId);

    if (!momentId || !songId) continue;

    const condition = ranking.cultureKey
      ? and(
          eq(musicMomentSongRankings.momentId, momentId),
          eq(musicMomentSongRankings.songId, songId),
          eq(musicMomentSongRankings.cultureKey, ranking.cultureKey),
        )
      : and(
          eq(musicMomentSongRankings.momentId, momentId),
          eq(musicMomentSongRankings.songId, songId),
          isNull(musicMomentSongRankings.cultureKey),
        );

    const [existing] = await db
      .select()
      .from(musicMomentSongRankings)
      .where(condition);

    if (existing) {
      await db
        .update(musicMomentSongRankings)
        .set({
          rankScore: ranking.rankScore,
          isPrimary: ranking.isPrimary ?? true,
          updatedAt: new Date(),
        })
        .where(eq(musicMomentSongRankings.id, existing.id));
    } else {
      await db.insert(musicMomentSongRankings).values({
        momentId,
        songId,
        cultureKey: ranking.cultureKey || null,
        rankScore: ranking.rankScore,
        isPrimary: ranking.isPrimary ?? true,
      });
    }
  }

  // Ensure each moment has enough coverage for 10-20 recommendations in MVP.
  const allSongIds = Array.from(songMap.values());
  for (const [momentKey, momentId] of momentMap.entries()) {
    const existingForMoment = await db
      .select()
      .from(musicMomentSongRankings)
      .where(eq(musicMomentSongRankings.momentId, momentId));

    if (existingForMoment.length >= 10) continue;

    const existingSongIds = new Set(existingForMoment.map((row) => row.songId));
    const needed = 10 - existingForMoment.length;
    const fillers = allSongIds
      .filter((songId) => !existingSongIds.has(songId))
      .slice(0, needed);

    let offset = 0;
    for (const songId of fillers) {
      await db.insert(musicMomentSongRankings).values({
        momentId,
        songId,
        cultureKey: null,
        rankScore: Math.max(40, 68 - offset * 2),
        isPrimary: false,
      });
      offset += 1;
    }

    console.log(`Added ${fillers.length} filler rankings for moment '${momentKey}'.`);
  }
}

async function run() {
  const momentMap = await seedMoments();
  const songMap = await seedSongs();
  await seedRankings(momentMap, songMap);

  console.log(`Seeded ${momentMap.size} moments, ${songMap.size} songs and ${RANKINGS.length} rankings.`);
}

run().catch((error) => {
  console.error("Failed to seed music matcher data:", error);
  process.exit(1);
});
