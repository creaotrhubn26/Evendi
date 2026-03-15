import { config } from "dotenv";
import { db } from "../server/db";
import { musicMoments, musicSongs, musicMomentProfiles, musicMomentSongRankings } from "../shared/schema";

config({ path: ".env.local" });

const REQUIRED_CULTURES = [
  "norsk",
  "sikh",
  "indisk",
  "pakistansk",
  "tyrkisk",
  "arabisk",
  "somalisk",
  "etiopisk",
  "nigeriansk",
  "muslimsk",
  "libanesisk",
  "filipino",
  "kinesisk",
  "koreansk",
  "thai",
  "iransk",
  "annet",
  "mixed",
];

async function run() {
  const moments = await db.select().from(musicMoments);
  const songs = await db.select().from(musicSongs);
  const profiles = await db.select().from(musicMomentProfiles);
  const rankings = await db.select().from(musicMomentSongRankings);

  const errors: string[] = [];

  if (moments.length < 8) {
    errors.push(`Expected at least 8 moments, found ${moments.length}.`);
  }

  if (songs.length < 20) {
    errors.push(`Expected at least 20 songs, found ${songs.length}.`);
  }

  for (const moment of moments) {
    const count = rankings.filter((r) => r.momentId === moment.id).length;
    if (count < 10) {
      errors.push(`Moment '${moment.key}' has only ${count} rankings (minimum 10).`);
    }

    const profileRows = profiles.filter((p) => p.momentId === moment.id);
    if (profileRows.length < REQUIRED_CULTURES.length) {
      errors.push(
        `Moment '${moment.key}' has only ${profileRows.length} profiles (minimum ${REQUIRED_CULTURES.length}).`,
      );
    }
    for (const culture of REQUIRED_CULTURES) {
      const hasCulture = profileRows.some((row) => row.cultureKey === culture);
      if (!hasCulture) {
        errors.push(`Moment '${moment.key}' is missing profile for culture '${culture}'.`);
      }
    }
  }

  for (const culture of REQUIRED_CULTURES) {
    const count = songs.filter((song) => (song.cultureTags || []).includes(culture)).length;
    if (count === 0) {
      errors.push(`No songs found for culture '${culture}'.`);
    }
  }

  if (errors.length > 0) {
    console.error("Music catalog validation failed:");
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `Music catalog validation passed. Moments: ${moments.length}, Songs: ${songs.length}, Profiles: ${profiles.length}, Rankings: ${rankings.length}`,
  );
}

run().catch((error) => {
  console.error("Failed to validate music catalog:", error);
  process.exit(1);
});
