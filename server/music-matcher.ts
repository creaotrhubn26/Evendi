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
  const hasModernToken = songTagTokens.some((token) =>
    ["drop", "afterparty", "party", "edm", "modern", "bhangra"].includes(token),
  );
  const hasTraditionalToken = songTagTokens.some((token) =>
    ["traditional", "sufi", "ceremony", "classy", "lounge", "vidaai", "farewell"].includes(token),
  );
  const songVibeLevel = hasModernToken ? 80 : hasTraditionalToken ? 30 : 50;
  const vibeMatch = 100 - Math.abs(songVibeLevel - profile.vibeLevel);

  let score =
    0.35 * clamp(rankScore, 0, 100) +
    0.2 * energyMatch +
    0.15 * cultureMatch +
    0.1 * languageMatch +
    0.1 * clamp(songDhol, 0, 100) +
    0.05 * clamp(songDanceability, 0, 100) +
    0.05 * clamp(songPopularity, 0, 100);

  // Ensure the vibe slider directly influences ranking in MVP rules mode.
  score += (vibeMatch - 50) * 0.12;

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
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
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
    if (res.ok) {
      return {
        id: String(json.id),
        url: `https://www.youtube.com/playlist?list=${json.id}`,
      };
    }

    const message = json?.error?.message || "Failed to create YouTube playlist";
    const retryable = res.status === 429 || res.status >= 500;
    lastError = new Error(message);
    if (!retryable || attempt === 3) {
      throw lastError;
    }
    const waitMs = 350 * 2 ** (attempt - 1) + Math.floor(Math.random() * 120);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  throw lastError || new Error("Failed to create YouTube playlist");
}

export async function insertYouTubePlaylistItem(params: {
  accessToken: string;
  playlistId: string;
  videoId: string;
}) {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
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
    if (res.ok) {
      return json;
    }

    const reason = json?.error?.errors?.[0]?.reason || "";
    const message = json?.error?.message || "Failed to insert YouTube playlist item";
    const retryable = res.status === 429 || res.status >= 500 || reason === "backendError";
    lastError = new Error(message);
    if (!retryable || attempt === 4) {
      throw lastError;
    }
    const waitMs = 350 * 2 ** (attempt - 1) + Math.floor(Math.random() * 120);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  throw lastError || new Error("Failed to insert YouTube playlist item");
}

type RecommendationFeedback = {
  moreLikeThis?: string[];
  tooSlow?: string[];
  tooRomantic?: string[];
  moreDhol?: boolean;
};

type RecommendationMoment = {
  key: string;
  title: string;
  description?: string | null;
};

type YouTubeVideoSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    defaultAudioLanguage?: string;
    defaultLanguage?: string;
  };
};

type YouTubeVideoDetail = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    tags?: string[];
    defaultAudioLanguage?: string;
    defaultLanguage?: string;
  };
  statistics?: {
    viewCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
};

const MOMENT_QUERY_HINTS: Record<string, string> = {
  groom_entry_mehndi: "groom entry mehndi baraat dhol",
  bride_entry: "bride entry wedding",
  couple_entry: "couple entry wedding",
  first_dance: "first dance wedding romantic",
  family_dance_set: "family dance wedding songs",
  dinner_vibe: "wedding dinner sufi lounge",
  afterparty_peak: "wedding afterparty bollywood bhangra dj",
  vidaai_farewell: "vidaai farewell wedding emotional",
};

const CULTURE_KEYWORDS: Record<string, string> = {
  sikh: "sikh punjabi",
  pakistansk: "pakistani urdu",
  indisk: "indian bollywood",
  norsk: "norwegian",
  muslimsk: "muslim nikah",
  mixed: "fusion",
  somalisk: "somali",
  arabisk: "arabic",
  tyrkisk: "turkish",
  iransk: "iranian persian",
  kinesisk: "chinese",
  thai: "thai",
  filipino: "filipino",
};

const LANGUAGE_KEYWORDS: Record<string, string> = {
  hindi: "hindi",
  punjabi: "punjabi",
  urdu: "urdu",
  english: "english",
  norwegian: "norwegian",
  arabic: "arabic",
  somali: "somali",
  farsi: "farsi persian",
  turkish: "turkish",
  instrumental: "instrumental",
};

const LANGUAGE_ISO_TO_KEY: Record<string, string> = {
  hi: "hindi",
  pa: "punjabi",
  ur: "urdu",
  en: "english",
  no: "norwegian",
  nb: "norwegian",
  nn: "norwegian",
  ar: "arabic",
  so: "somali",
  fa: "farsi",
  tr: "turkish",
  zh: "chinese",
  th: "thai",
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9æøå\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  if (!normalized) return [];
  return normalized.split(" ").filter((token) => token.length > 2);
}

function parseIsoDurationToSeconds(duration?: string): number {
  if (!duration || !duration.startsWith("P")) return 0;
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const secondsMatch = duration.match(/(\d+)S/);
  const hours = Number(hoursMatch?.[1] || 0);
  const minutes = Number(minutesMatch?.[1] || 0);
  const seconds = Number(secondsMatch?.[1] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function getPopularityScore(viewCountRaw?: string): number {
  const viewCount = Number(viewCountRaw || 0);
  if (!Number.isFinite(viewCount) || viewCount <= 0) return 0;
  const logScale = Math.log10(viewCount + 10);
  return clamp(Math.round((logScale / 8) * 100), 0, 100);
}

function detectLanguageTags(textBlob: string, defaultLanguage?: string): string[] {
  const tags = new Set<string>();
  for (const [key, keyword] of Object.entries(LANGUAGE_KEYWORDS)) {
    const tokens = keyword.split(" ");
    if (tokens.some((token) => textBlob.includes(token))) {
      tags.add(key);
    }
  }

  const normalizedLang = (defaultLanguage || "").toLowerCase().split("-")[0];
  const mapped = LANGUAGE_ISO_TO_KEY[normalizedLang];
  if (mapped) tags.add(mapped);

  return Array.from(tags);
}

function detectCultureTags(textBlob: string): string[] {
  const tags = new Set<string>();
  for (const [culture, keywordText] of Object.entries(CULTURE_KEYWORDS)) {
    const tokens = keywordText.split(" ");
    if (tokens.some((token) => textBlob.includes(token))) {
      tags.add(culture);
    }
  }
  return Array.from(tags);
}

function deriveMusicTraits(params: {
  textBlob: string;
  viewCount?: string;
  durationSeconds: number;
  momentKey: string;
}) {
  const { textBlob, viewCount, durationSeconds, momentKey } = params;
  const tags = new Set<string>();

  let energy = 52;
  let danceability = 52;
  let dhol = 10;

  const addEnergy = (value: number) => {
    energy = clamp(energy + value, 0, 100);
  };

  const addDance = (value: number) => {
    danceability = clamp(danceability + value, 0, 100);
  };

  const addDhol = (value: number) => {
    dhol = clamp(dhol + value, 0, 100);
  };

  if (/(dhol|bhangra|baraat|nagada|dhamaal)/.test(textBlob)) {
    tags.add("dhol");
    addDhol(70);
    addEnergy(20);
    addDance(15);
  }
  if (/(drop|edm|remix|afterparty|party|club|dj)/.test(textBlob)) {
    tags.add("drop");
    addEnergy(18);
    addDance(16);
  }
  if (/(singalong|anthem|karaoke|chorus)/.test(textBlob)) {
    tags.add("singalong");
    addDance(8);
  }
  if (/(romantic|love|couple|first dance|slow)/.test(textBlob)) {
    tags.add("romantic");
    addEnergy(-16);
    addDance(-6);
  }
  if (/(sufi|lounge|classy|acoustic|instrumental)/.test(textBlob)) {
    tags.add("lounge");
    addEnergy(-10);
    addDance(-5);
  }

  if (momentKey === "afterparty_peak") {
    addEnergy(10);
    addDance(9);
    tags.add("afterparty");
  }
  if (momentKey === "vidaai_farewell" || momentKey === "first_dance") {
    addEnergy(-8);
  }

  if (durationSeconds > 420) {
    addEnergy(-5);
  } else if (durationSeconds > 0 && durationSeconds < 170) {
    addEnergy(4);
    addDance(3);
  }

  const explicitFlag = /(explicit|uncensored|dirty version|parental advisory)/.test(textBlob);
  if (!explicitFlag) {
    tags.add("couple-friendly");
  }

  return {
    energyScore: clamp(Math.round(energy), 0, 100),
    danceability: clamp(Math.round(danceability), 0, 100),
    dholScore: clamp(Math.round(dhol), 0, 100),
    popularityScore: getPopularityScore(viewCount),
    explicitFlag,
    tagTokens: Array.from(tags),
  };
}

function buildYouTubeRecommendationQuery(moment: RecommendationMoment, profile: MusicMatcherProfile): string {
  const momentHint = MOMENT_QUERY_HINTS[moment.key] || moment.title || moment.key;
  const cultureHint = profile.preferredCultures
    .slice(0, 2)
    .map((culture) => CULTURE_KEYWORDS[culture] || culture)
    .join(" ");
  const languageHint = profile.preferredLanguages
    .slice(0, 2)
    .map((language) => LANGUAGE_KEYWORDS[language] || language)
    .join(" ");
  const vibeHint = profile.vibeLevel > 65 ? "modern remix" : profile.vibeLevel < 35 ? "traditional classic" : "";
  const energyHint = profile.energyLevel > 70 ? "high energy dance" : profile.energyLevel < 35 ? "slow melodic" : "";

  return [momentHint, "wedding", cultureHint, languageHint, vibeHint, energyHint]
    .filter((part) => part && part.trim().length > 0)
    .join(" ")
    .trim();
}

function momentRankScore(moment: RecommendationMoment, searchTextBlob: string): number {
  const momentTokens = tokenize(`${moment.title} ${MOMENT_QUERY_HINTS[moment.key] || ""}`);
  if (momentTokens.length === 0) return 55;
  const overlap = momentTokens.filter((token) => searchTextBlob.includes(token)).length;
  const ratio = overlap / momentTokens.length;
  return clamp(Math.round(45 + ratio * 55), 0, 100);
}

async function searchYouTubeVideos(params: {
  apiKey?: string;
  accessToken?: string;
  query: string;
  maxResults: number;
  cleanLyricsOnly: boolean;
}): Promise<YouTubeVideoSearchItem[]> {
  if (!params.apiKey && !params.accessToken) {
    return [];
  }
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("videoSyndicated", "true");
  url.searchParams.set("maxResults", String(params.maxResults));
  url.searchParams.set("safeSearch", params.cleanLyricsOnly ? "strict" : "moderate");
  url.searchParams.set("q", params.query);
  if (params.apiKey) {
    url.searchParams.set("key", params.apiKey);
  }

  const res = await fetch(url.toString(), {
    headers: params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || "YouTube search failed");
  }
  return Array.isArray(json?.items) ? json.items : [];
}

async function fetchYouTubeVideoDetails(params: {
  apiKey?: string;
  accessToken?: string;
  videoIds: string[];
}): Promise<Map<string, YouTubeVideoDetail>> {
  if (!params.apiKey && !params.accessToken) {
    return new Map<string, YouTubeVideoDetail>();
  }
  const uniqueIds = Array.from(new Set(params.videoIds.filter(Boolean)));
  const byId = new Map<string, YouTubeVideoDetail>();
  if (uniqueIds.length === 0) return byId;

  for (let i = 0; i < uniqueIds.length; i += 50) {
    const chunk = uniqueIds.slice(i, i + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails,statistics");
    url.searchParams.set("id", chunk.join(","));
    if (params.apiKey) {
      url.searchParams.set("key", params.apiKey);
    }

    const res = await fetch(url.toString(), {
      headers: params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : undefined,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || "YouTube videos lookup failed");
    }

    const items = Array.isArray(json?.items) ? json.items : [];
    for (const item of items) {
      if (item?.id) {
        byId.set(String(item.id), item);
      }
    }
  }

  return byId;
}

export function getYouTubeRecommendationApiKey(): string {
  return (
    process.env.YOUTUBE_DATA_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.YOUTUBE_API_KEY ||
    ""
  ).trim();
}

export async function generateYouTubeRecommendations(params: {
  profile: MusicMatcherProfile;
  moments: RecommendationMoment[];
  limitPerMoment: number;
  feedbackByMoment?: Record<string, RecommendationFeedback>;
  accessToken?: string | null;
}): Promise<Record<string, RecommendationSong[]>> {
  const apiKey = getYouTubeRecommendationApiKey();
  const accessToken = params.accessToken || undefined;
  if (!apiKey && !accessToken) return {};

  const result: Record<string, RecommendationSong[]> = {};
  const maxResults = Math.max(15, Math.min(30, params.limitPerMoment * 2));

  for (const moment of params.moments) {
    const primaryQuery = buildYouTubeRecommendationQuery(moment, params.profile);
    const fallbackQuery = `${moment.title || moment.key} wedding songs`;

    let searchItems: YouTubeVideoSearchItem[] = [];
    try {
      searchItems = await searchYouTubeVideos({
        apiKey,
        accessToken,
        query: primaryQuery,
        maxResults,
        cleanLyricsOnly: params.profile.cleanLyricsOnly,
      });
      if (searchItems.length < params.limitPerMoment) {
        const fallbackItems = await searchYouTubeVideos({
          apiKey,
          accessToken,
          query: fallbackQuery,
          maxResults: Math.max(10, params.limitPerMoment),
          cleanLyricsOnly: params.profile.cleanLyricsOnly,
        });
        searchItems = [...searchItems, ...fallbackItems];
      }
    } catch {
      searchItems = [];
    }

    const videoIds = searchItems
      .map((item) => item?.id?.videoId || "")
      .filter((videoId): videoId is string => videoId.length > 0);
    const detailsById = await fetchYouTubeVideoDetails({ apiKey, accessToken, videoIds }).catch(() => new Map<string, YouTubeVideoDetail>());

    const byVideoId = new Map<string, RecommendationSong>();
    for (const item of searchItems) {
      const videoId = String(item?.id?.videoId || "");
      if (!videoId) continue;

      const detail = detailsById.get(videoId);
      const title = String(item?.snippet?.title || detail?.snippet?.title || "").trim();
      if (!title) continue;
      const description = String(item?.snippet?.description || detail?.snippet?.description || "");
      const channelTitle = String(item?.snippet?.channelTitle || detail?.snippet?.channelTitle || "");
      const defaultLang = String(
        detail?.snippet?.defaultAudioLanguage ||
        detail?.snippet?.defaultLanguage ||
        item?.snippet?.defaultAudioLanguage ||
        item?.snippet?.defaultLanguage ||
        "",
      );
      const keywordTags = Array.isArray(detail?.snippet?.tags) ? detail!.snippet!.tags!.join(" ") : "";
      const textBlob = normalizeText(`${title} ${description} ${channelTitle} ${keywordTags}`);
      const durationSeconds = parseIsoDurationToSeconds(detail?.contentDetails?.duration);
      const traits = deriveMusicTraits({
        textBlob,
        viewCount: detail?.statistics?.viewCount,
        durationSeconds,
        momentKey: moment.key,
      });
      if (params.profile.cleanLyricsOnly && traits.explicitFlag) continue;

      const songCultures = detectCultureTags(textBlob);
      const songLanguages = detectLanguageTags(textBlob, defaultLang);
      const rankScore = momentRankScore(moment, textBlob);
      const matchScore = scoreRecommendation({
        rankScore,
        songEnergy: traits.energyScore,
        songDhol: traits.dholScore,
        songDanceability: traits.danceability,
        songPopularity: traits.popularityScore,
        songCultures,
        songLanguages,
        profile: params.profile,
        feedback: params.feedbackByMoment?.[moment.key],
        songTagTokens: traits.tagTokens,
        songYoutubeVideoId: videoId,
      });

      const candidate: RecommendationSong = {
        songId: `yt:${videoId}`,
        youtubeVideoId: videoId,
        title,
        artist: channelTitle || null,
        energyScore: traits.energyScore,
        tags: Array.from(new Set([...traits.tagTokens, "youtube"])),
        matchScore,
        momentKey: moment.key,
      };

      const existing = byVideoId.get(videoId);
      if (!existing || candidate.matchScore > existing.matchScore) {
        byVideoId.set(videoId, candidate);
      }
    }

    result[moment.key] = Array.from(byVideoId.values())
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, params.limitPerMoment);
  }

  return result;
}
