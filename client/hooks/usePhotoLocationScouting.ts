/**
 * usePhotoLocationScouting
 * Connects PhotoPlanScreen to the Location Intelligence Bridge
 * — address search, travel from venue, weather tips, scouted status
 *
 * Features:
 * - Search locations via Kartverket (Geonorge)
 * - Calculate travel time + distance from wedding venue to shot location
 * - Generate weather tips for outdoor shot locations
 * - Mark shots as "scouted" with location data
 * - Drive location data into the ShotListManager bridge (CreatorHub ↔ Evendi)
 * - Growing location scouting database from photographers + couples
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import {
  searchAddress,
  calculateTravel,
  getWeatherLocationData,
  weatherSymbolToEmoji,
  getWeddingWeatherTips,
  type BridgeCoordinates,
  type TravelInfo,
  type WeatherLocationData,
  type KartverketSearchResult,
} from '@/lib/api-weather-location-bridge';
import type { PhotoShot } from '@/lib/api-couple-data';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LocationSearchResult {
  address: string;
  coordinates: BridgeCoordinates;
  municipality: string;
  county: string;
}

export interface ShotLocationData {
  locationName: string;
  locationLat: number;
  locationLng: number;
  locationNotes?: string;
  weatherTip?: string;
  travelFromVenue?: string;
  scouted: boolean;
}

export interface PhotoLocationScouting {
  /** Couple's wedding venue coords from bridge */
  venueCoordinates: BridgeCoordinates | null;
  /** Venue name */
  venueName: string | null;
  /** Whether venue data is loading */
  isLoadingVenue: boolean;
  /** Search for a location by text */
  searchLocation: (query: string) => Promise<LocationSearchResult[]>;
  /** Get full ShotLocationData for a search result (calculates travel + weather) */
  resolveLocationForShot: (result: LocationSearchResult) => Promise<ShotLocationData>;
  /** Get travel badge string for a shot that has location_lat/lng */
  getTravelBadgeForShot: (shot: PhotoShot) => string | null;
  /** Open shot location in Maps app */
  openShotOnMap: (shot: PhotoShot) => void;
  /** Open directions from venue to shot location */
  openDirectionsToShot: (shot: PhotoShot) => void;
  /** Get weather emoji for the venue */
  venueWeatherEmoji: string;
  /** Current venue temperature */
  venueTemperature: number | null;
  /** Stats: how many shots have been scouted */
  scoutedCount: (shots: PhotoShot[]) => number;
  /** Stats: how many shots have locations */
  locatedCount: (shots: PhotoShot[]) => number;
  /** Enrichment: auto-fill weather tips for a location */
  getWeatherTipForCoords: (lat: number, lng: number) => Promise<string>;
  /** Get the couple ID being used */
  coupleId: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COUPLE_STORAGE_KEY = 'evendi_couple_session';
const SCOUTING_CACHE_KEY = 'evendi_scouting_travel_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

// ─── Hook ───────────────────────────────────────────────────────────────────

export function usePhotoLocationScouting(): PhotoLocationScouting {
  const [venueCoordinates, setVenueCoordinates] = useState<BridgeCoordinates | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [isLoadingVenue, setIsLoadingVenue] = useState(false);
  const [venueWeatherEmoji, setVenueWeatherEmoji] = useState('🌤️');
  const [venueTemperature, setVenueTemperature] = useState<number | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  const travelCacheRef = useRef<Record<string, string>>({});
  const venueLoadedRef = useRef(false);
  const travelCacheKey = useMemo(
    () => (coupleId ? `${SCOUTING_CACHE_KEY}:${coupleId}` : SCOUTING_CACHE_KEY),
    [coupleId],
  );

  // ─ Auto-load venue data on first use ─
  const ensureVenueLoaded = useCallback(async () => {
    if (venueLoadedRef.current) return;
    venueLoadedRef.current = true;
    setIsLoadingVenue(true);

    try {
      const session = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
      if (!session) return;
      const { coupleId: cId } = JSON.parse(session);
      if (!cId) return;
      setCoupleId(cId);

      const rawCache = await AsyncStorage.getItem(`${SCOUTING_CACHE_KEY}:${cId}`);
      if (rawCache) {
        const parsed = JSON.parse(rawCache) as { timestamp: number; data: Record<string, string> };
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          travelCacheRef.current = parsed.data;
        }
      }

      const data: WeatherLocationData = await getWeatherLocationData(cId);
      if (data.venue?.coordinates) {
        setVenueCoordinates(data.venue.coordinates);
        setVenueName(data.venue.name || null);
      }
      if (data.weather?.current) {
        setVenueWeatherEmoji(weatherSymbolToEmoji(data.weather.current.symbol));
        setVenueTemperature(data.weather.current.temperature);
      }
    } catch (e) {
      // Venue data not available yet — not critical
      console.log('[PhotoScouting] Venue data not available:', (e as Error).message);
    } finally {
      setIsLoadingVenue(false);
    }
  }, []);

  // ─ Search location ─
  const searchLocation = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    await ensureVenueLoaded();
    if (!query || query.length < 2) return [];

    try {
      const results: KartverketSearchResult[] = await searchAddress(query);
      return results.map((r) => ({
        address: r.address,
        coordinates: r.coordinates,
        municipality: r.municipality,
        county: r.county,
      }));
    } catch {
      return [];
    }
  }, [ensureVenueLoaded]);

  // ─ Resolve full location data for a shot ─
  const resolveLocationForShot = useCallback(async (result: LocationSearchResult): Promise<ShotLocationData> => {
    await ensureVenueLoaded();

    let travelText = '';
    let weatherTipText = '';
    const locationKey = `${result.coordinates.lat.toFixed(4)},${result.coordinates.lng.toFixed(4)}`;

    // Calculate travel from venue to this location
    if (coupleId && venueCoordinates) {
      const cachedTravel = travelCacheRef.current[locationKey];
      if (cachedTravel) {
        travelText = cachedTravel;
      } else {
        try {
          const travelResult = await calculateTravel(coupleId, {
            lat: result.coordinates.lat,
            lng: result.coordinates.lng,
          });
          const travel: TravelInfo | undefined = travelResult.travel;
          if (travel) {
            travelText = `${travel.drivingFormatted} • ${travel.roadDistanceKm.toFixed(1)} km`;
            travelCacheRef.current[locationKey] = travelText;
            await AsyncStorage.setItem(
              travelCacheKey,
              JSON.stringify({ timestamp: Date.now(), data: travelCacheRef.current }),
            );
          }
        } catch {
          // Travel calc failed — non-critical
        }
      }
    }

    // Generate a weather tip based on location
    if (venueTemperature !== null) {
      // Use current venue weather as proxy
      weatherTipText = venueTemperature < 5
        ? '🧥 Kaldt — ha varme klær for utendørsfotografering'
        : venueTemperature > 25
          ? '☀️ Varmt — planlegg skyggefulle pauser'
          : venueTemperature >= 15
            ? '✨ Fint vær for fotografering utendørs'
            : '🌤️ Moderat temperatur — ok for utendørsbilder';
    }

    return {
      locationName: result.address,
      locationLat: result.coordinates.lat,
      locationLng: result.coordinates.lng,
      locationNotes: `${result.municipality}, ${result.county}`,
      weatherTip: weatherTipText,
      travelFromVenue: travelText,
      scouted: true,
    };
  }, [coupleId, venueCoordinates, venueTemperature, ensureVenueLoaded, travelCacheKey]);

  // ─ Travel badge for an existing shot ─
  const getTravelBadgeForShot = useCallback((shot: PhotoShot): string | null => {
    if (shot.travelFromVenue) return shot.travelFromVenue;
    return null;
  }, []);

  // ─ Open shot on map ─
  const openShotOnMap = useCallback((shot: PhotoShot) => {
    if (!shot.locationLat || !shot.locationLng) return;
    const label = encodeURIComponent(shot.locationName || shot.title);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${shot.locationLat},${shot.locationLng}`,
      android: `geo:${shot.locationLat},${shot.locationLng}?q=${shot.locationLat},${shot.locationLng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${shot.locationLat},${shot.locationLng}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  }, []);

  // ─ Directions from venue to shot ─
  const openDirectionsToShot = useCallback((shot: PhotoShot) => {
    if (!shot.locationLat || !shot.locationLng) return;
    const dest = `${shot.locationLat},${shot.locationLng}`;
    const origin = venueCoordinates ? `${venueCoordinates.lat},${venueCoordinates.lng}` : '';
    const url = Platform.select({
      ios: origin
        ? `maps:?saddr=${origin}&daddr=${dest}`
        : `maps:?daddr=${dest}`,
      android: origin
        ? `google.navigation:q=${dest}&origin=${origin}`
        : `google.navigation:q=${dest}`,
      default: origin
        ? `https://www.google.com/maps/dir/${origin}/${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  }, [venueCoordinates]);

  // ─ Stats helpers ─
  const scoutedCount = useCallback((shots: PhotoShot[]): number => {
    return shots.filter((s) => s.scouted).length;
  }, []);

  const locatedCount = useCallback((shots: PhotoShot[]): number => {
    return shots.filter((s) => s.locationLat && s.locationLng).length;
  }, []);

  // ─ Weather tip for arbitrary coords ─
  const getWeatherTipForCoords = useCallback(async (lat: number, lng: number): Promise<string> => {
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);
    if (!hasValidCoords) {
      return '🌤️ Ugyldig lokasjon - sjekk koordinater før fotografering';
    }

    // For now use a heuristic based on venue weather (same region)
    if (venueTemperature !== null) {
      const weddingTips = getWeddingWeatherTips({
        temperature: venueTemperature,
        windSpeed: 3,
        humidity: 60,
        symbol: 'partlycloudy_day',
        precipitation: 0,
        time: new Date().toISOString(),
      });
      if (weddingTips.length > 0) {
        return weddingTips[0];
      }
      if (venueTemperature < 0) return '❄️ Under null — vurder innendørs alternativ';
      if (venueTemperature < 5) return '🧥 Kaldt — ha varme klær for utendørsfotografering';
      if (venueTemperature > 25) return '☀️ Varmt — planlegg skyggefulle pauser og vann';
      if (venueTemperature >= 15) return '✨ Fint vær for fotografering utendørs';
      return '🌤️ Moderat temperatur — passende for utendørsbilder';
    }
    if (Math.abs(lat) > 67) {
      return '🧤 Nordlig lokasjon - planlegg ekstra varme og korte takes utendørs';
    }
    return '🌤️ Sjekk lokalt vær før fotografering';
  }, [venueTemperature]);

  return {
    venueCoordinates,
    venueName,
    isLoadingVenue,
    searchLocation,
    resolveLocationForShot,
    getTravelBadgeForShot,
    openShotOnMap,
    openDirectionsToShot,
    venueWeatherEmoji,
    venueTemperature,
    scoutedCount,
    locatedCount,
    getWeatherTipForCoords,
    coupleId,
  };
}
