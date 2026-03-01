import crypto from "node:crypto";

export type MusicMatcherProfile = {
  preferredCultures: string[];
  preferredLanguages: string[];
  vibeLevel: number;
  energyLevel: number;
  cleanLyricsOnly: boolean;
  selectedMoments: string[];
};

export type RecommendationRequestInput = {
  moments?: string[];
  limitPerMoment?: number;
  feedbackByMoment?: Record<string, { moreLikeThis?: string[]; tooSlow?: string[]; tooRomantic?: string[]; moreDhol?: boolean }>;
};

export type RecommendationSong = {
  songId: string;
  youtubeVideoId: string;
  title: string;
  artist: string | null;
  energyScore: number;
  tags: string[];
  matchScore: number;
  momentKey: string;
};

export const DEFAULT_MOMENT_KEYS = [
  "groom_entry_mehndi",
  "bride_entry",
  "couple_entry",
  "first_dance",
  "family_dance_set",
  "dinner_vibe",
  "afterparty_peak",
  "vidaai_farewell",
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeMatcherProfile(raw: Partial<MusicMatcherProfile> | null | undefined): MusicMatcherProfile {
  return {
    preferredCultures: Array.isArray(raw?.preferredCultures) ? raw!.preferredCultures.filter(Boolean) : [],
    preferredLanguages: Array.isArray(raw?.preferredLanguages) ? raw!.preferredLanguages.filter(Boolean) : [],
    vibeLevel: clamp(Number(raw?.vibeLevel ?? 50), 0, 100),
    energyLevel: clamp(Number(raw?.energyLevel ?? 50), 0, 100),
    cleanLyricsOnly: raw?.cleanLyricsOnly ?? true,
    selectedMoments: Array.isArray(raw?.selectedMoments) && raw!.selectedMoments.length > 0
      ? raw!.selectedMoments.filter(Boolean)
      : [...DEFAULT_MOMENT_KEYS],
  };
}

export function scoreRecommendation(params: {
  rankScore: number;
  songEnergy: number;
  songDhol: number;
  songDanceability: number;
  songPopularity: number;
  songCultures: string[];
  songLanguages: string[];
  profile: MusicMatcherProfile;
  feedback?: { moreLikeThis?: string[]; tooSlow?: string[]; tooRomantic?: string[]; moreDhol?: boolean };
  songTagTokens: string[];
  songYoutubeVideoId: string;
}): number {
  const {
    rankScore,
    songEnergy,
    songDhol,
    songDanceability,
    songPopularity,
    songCultures,
    songLanguages,
    profile,
    feedback,
    songTagTokens,
    songYoutubeVideoId,
  } = params;

  const energyMatch = 100 - Math.abs(clamp(songEnergy, 0, 100) - profile.energyLevel);
  const cultureMatches = songCultures.filter((c) => profile.preferredCultures.includes(c)).length;
  const cultureMatch = profile.preferredCultures.length === 0 ? 60 : clamp((cultureMatches / profile.preferredCultures.length) * 100, 0, 100);
  const languageMatches = songLanguages.filter((l) => profile.preferredLanguages.includes(l)).length;
  const languageMatch = profile.preferredLanguages.length === 0 ? 60 : clamp((languageMatches / profile.preferredLanguages.length) * 100, 0, 100);

  let score =
    0.35 * clamp(rankScore, 0, 100) +
    0.2 * energyMatch +
    0.15 * cultureMatch +
    0.1 * languageMatch +
    0.1 * clamp(songDhol, 0, 100) +
    0.05 * clamp(songDanceability, 0, 100) +
    0.05 * clamp(songPopularity, 0, 100);

  // Session-only feedback nudges
  if (feedback?.moreDhol) score += songDhol * 0.08;
  if ((feedback?.moreLikeThis || []).includes(songYoutubeVideoId)) score += 15;
  if ((feedback?.tooSlow || []).includes(songYoutubeVideoId)) score -= 20;
  if ((feedback?.tooRomantic || []).includes(songYoutubeVideoId) && songTagTokens.includes("romantic")) score -= 25;

  return clamp(Math.round(score), 0, 100);
}

function getOauthStateSecret(): string {
  return (
    process.env.YOUTUBE_OAUTH_STATE_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.SESSION_SECRET ||
    "evendi-music-matcher-state"
  );
}

export function createSignedOAuthState(coupleId: string): string {
  const payload = JSON.stringify({
    c: coupleId,
    iat: Date.now(),
    nonce: crypto.randomBytes(8).toString("hex"),
  });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getOauthStateSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySignedOAuthState(state: string, maxAgeMs = 15 * 60 * 1000): { valid: boolean; coupleId?: string } {
  const [encoded, sig] = state.split(".");
  if (!encoded || !sig) return { valid: false };

  const expected = crypto.createHmac("sha256", getOauthStateSecret()).update(encoded).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!parsed?.c || !parsed?.iat) return { valid: false };
    if (Date.now() - Number(parsed.iat) > maxAgeMs) return { valid: false };
    return { valid: true, coupleId: String(parsed.c) };
  } catch {
    return { valid: false };
  }
}

function getEncryptionKey(): Buffer {
  const raw = process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY || process.env.ADMIN_SECRET || "evendi-music-matcher-default-key";

  // Accept base64, hex, or plain text
  try {
    const asBase64 = Buffer.from(raw, "base64");
    if (asBase64.length >= 32) return asBase64.subarray(0, 32);
  } catch {
    // noop
  }

  try {
    const asHex = Buffer.from(raw, "hex");
    if (asHex.length >= 32) return asHex.subarray(0, 32);
  } catch {
    // noop
  }

  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  const [ivRaw, tagRaw, cipherRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !cipherRaw) throw new Error("Invalid encrypted payload");

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  const plain = Buffer.concat([
    decipher.update(Buffer.from(cipherRaw, "base64url")),
    decipher.final(),
  ]);

  return plain.toString("utf8");
}

export function getYouTubeOAuthConfig(redirectOverride?: string) {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = redirectOverride || process.env.YOUTUBE_REDIRECT_URI || "";

  return {
    clientId,
    clientSecret,
    redirectUri,
    scope: [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ].join(" "),
  };
}

export async function exchangeCodeForTokens(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error_description || json?.error || "Failed to exchange OAuth code");
  }

  return json;
}

export async function refreshYouTubeAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}) {
  const body = new URLSearchParams({
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error_description || json?.error || "Failed to refresh YouTube token");
  }

  return json;
}

export async function fetchYouTubeChannel(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "Failed to fetch YouTube channel");
  }

  const first = json?.items?.[0] || null;
  return {
    channelId: first?.id || null,
    channelTitle: first?.snippet?.title || null,
  };
}

export async function createYouTubePlaylist(params: {
  accessToken: string;
  title: string;
  description?: string;
  privacyStatus?: "private" | "public" | "unlisted";
}) {
  const res = await fetch("https://www.googleapis.com/youtube/v3/playlists?part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        title: params.title,
        description: params.description || "Created from Evendi Music Matcher",
      },
      status: {
        privacyStatus: params.privacyStatus || "unlisted",
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "Failed to create YouTube playlist");
  }

  return {
    id: String(json.id),
    url: `https://www.youtube.com/playlist?list=${json.id}`,
  };
}

export async function insertYouTubePlaylistItem(params: {
  accessToken: string;
  playlistId: string;
  videoId: string;
}) {
  const res = await fetch("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        playlistId: params.playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId: params.videoId,
        },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "Failed to insert YouTube playlist item");
  }

  return json;
}
