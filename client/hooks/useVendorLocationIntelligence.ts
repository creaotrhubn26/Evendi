/**
 * useVendorLocationIntelligence
 * Provides travel time, distance, and location intelligence for vendor discovery.
 * Connects the Weather/Location Bridge (api-weather-location-bridge) to vendor screens.
 *
 * Features:
 * - Calculates travel from wedding venue to each vendor
 * - Provides distance-sorted vendor suggestions
 * - Quick navigation links (Google Maps directions)
 * - Travel time badges for vendor cards
 * - Venue-to-vendor drive time for timeline integration
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import {
  getWeatherLocationData,
  calculateTravel,
  searchAddress,
  type BridgeCoordinates,
  type TravelInfo,
  type WeatherLocationData,
  type KartverketSearchResult,
} from '@/lib/api-weather-location-bridge';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VendorWithLocation {
  id: string;
  businessName: string;
  location: string | null;
  /** Resolved coordinates for the vendor */
  coordinates?: BridgeCoordinates | null;
}

export interface VendorTravelInfo {
  vendorId: string;
  travel: TravelInfo | null;
  isLoading: boolean;
  error: string | null;
}

export interface VendorLocationIntelligence {
  /** Wedding venue coordinates (from bridge data) */
  venueCoordinates: BridgeCoordinates | null;
  /** Wedding venue name */
  venueName: string | null;
  /** Whether venue data is loading */
  isLoadingVenue: boolean;
  /** Map of vendorId → travel info */
  vendorTravelMap: Record<string, VendorTravelInfo>;
  /** Calculate travel for a specific vendor */
  calculateVendorTravel: (vendor: VendorWithLocation) => Promise<TravelInfo | null>;
  /** Calculate travel for a batch of vendors */
  calculateBatchTravel: (vendors: VendorWithLocation[]) => Promise<void>;
  /** Open directions in Maps app */
  openDirections: (vendor: VendorWithLocation) => void;
  /** Open vendor location in Maps app */
  openVendorOnMap: (vendor: VendorWithLocation) => void;
  /** Get formatted travel badge text (e.g., "15 min • 12 km") */
  getTravelBadge: (vendorId: string) => string | null;
  /** Get travel info for a vendor */
  getVendorTravel: (vendorId: string) => VendorTravelInfo | null;
  /** Sort vendors by distance from venue */
  sortByDistance: <T extends { id: string }>(vendors: T[]) => T[];
  /** Geocode a vendor location string to coordinates */
  geocodeVendorLocation: (locationText: string) => Promise<BridgeCoordinates | null>;
  /** Couple ID used */
  coupleId: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COUPLE_STORAGE_KEY = 'evendi_couple_session';
const VENDOR_COORDS_CACHE_KEY = 'evendi_vendor_coords_cache';
const TRAVEL_CACHE_KEY = 'evendi_vendor_travel_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for vendor travel data

// ─── Geocode Cache ──────────────────────────────────────────────────────────

interface GeocodeCacheEntry {
  coordinates: BridgeCoordinates;
  timestamp: number;
}

async function getCachedCoords(location: string): Promise<BridgeCoordinates | null> {
  try {
    const raw = await AsyncStorage.getItem(VENDOR_COORDS_CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, GeocodeCacheEntry> = JSON.parse(raw);
    const entry = cache[location.toLowerCase()];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_DURATION) return null;
    return entry.coordinates;
  } catch {
    return null;
  }
}

async function setCachedCoords(location: string, coords: BridgeCoordinates): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(VENDOR_COORDS_CACHE_KEY);
    const cache: Record<string, GeocodeCacheEntry> = raw ? JSON.parse(raw) : {};
    cache[location.toLowerCase()] = { coordinates: coords, timestamp: Date.now() };
    await AsyncStorage.setItem(VENDOR_COORDS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Silent
  }
}

// ─── Travel Cache ───────────────────────────────────────────────────────────

interface TravelCacheEntry {
  travel: TravelInfo;
  timestamp: number;
}

async function getCachedTravel(vendorId: string): Promise<TravelInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(TRAVEL_CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, TravelCacheEntry> = JSON.parse(raw);
    const entry = cache[vendorId];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_DURATION) return null;
    return entry.travel;
  } catch {
    return null;
  }
}

async function setCachedTravel(vendorId: string, travel: TravelInfo): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TRAVEL_CACHE_KEY);
    const cache: Record<string, TravelCacheEntry> = raw ? JSON.parse(raw) : {};
    cache[vendorId] = { travel, timestamp: Date.now() };
    await AsyncStorage.setItem(TRAVEL_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Silent
  }
}

// ─── Norwegian City Coordinates ─────────────────────────────────────────────

const NORWEGIAN_CITY_COORDS: Record<string, BridgeCoordinates> = {
  oslo: { lat: 59.9139, lng: 10.7522 },
  bergen: { lat: 60.3913, lng: 5.3221 },
  trondheim: { lat: 63.4305, lng: 10.3951 },
  stavanger: { lat: 58.9700, lng: 5.7331 },
  kristiansand: { lat: 58.1599, lng: 8.0182 },
  tromsø: { lat: 69.6492, lng: 18.9553 },
  drammen: { lat: 59.7439, lng: 10.2045 },
  fredrikstad: { lat: 59.2181, lng: 10.9298 },
  sandnes: { lat: 58.8524, lng: 5.7352 },
  bodø: { lat: 67.2804, lng: 14.4049 },
  ålesund: { lat: 62.4722, lng: 6.1549 },
  tønsberg: { lat: 59.2671, lng: 10.4076 },
  moss: { lat: 59.4350, lng: 10.6594 },
  haugesund: { lat: 59.4138, lng: 5.2680 },
  sandefjord: { lat: 59.1310, lng: 10.2265 },
  arendal: { lat: 58.4614, lng: 8.7726 },
  hamar: { lat: 60.7945, lng: 11.0680 },
  larvik: { lat: 59.0531, lng: 10.0268 },
  halden: { lat: 59.1234, lng: 11.3875 },
  kongsberg: { lat: 59.6631, lng: 9.6500 },
  lillehammer: { lat: 61.1153, lng: 10.4662 },
  molde: { lat: 62.7373, lng: 7.1591 },
  hønefoss: { lat: 60.1685, lng: 10.2570 },
  gjøvik: { lat: 60.7957, lng: 10.6916 },
  ski: { lat: 59.7195, lng: 10.8351 },
  lørenskog: { lat: 59.8979, lng: 10.9616 },
  asker: { lat: 59.8333, lng: 10.4392 },
  lillestrøm: { lat: 59.9560, lng: 11.0493 },
};

/**
 * Try to resolve vendor location text to coordinates
 * First checks known city names, then falls back to Kartverket search
 */
async function resolveVendorCoordinates(
  locationText: string
): Promise<BridgeCoordinates | null> {
  if (!locationText) return null;

  // Check cache first
  const cached = await getCachedCoords(locationText);
  if (cached) return cached;

  const locLower = locationText.toLowerCase().trim();

  // Check known Norwegian cities
  for (const [city, coords] of Object.entries(NORWEGIAN_CITY_COORDS)) {
    if (locLower.includes(city) || locLower === city) {
      await setCachedCoords(locationText, coords);
      return coords;
    }
  }

  // Fall back to Kartverket address search
  try {
    const results = await searchAddress(locationText);
    if (results.length > 0) {
      const coords = results[0].coordinates;
      await setCachedCoords(locationText, coords);
      return coords;
    }
  } catch {
    // Silent fallback
  }

  return null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useVendorLocationIntelligence(): VendorLocationIntelligence {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [venueCoordinates, setVenueCoordinates] = useState<BridgeCoordinates | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [isLoadingVenue, setIsLoadingVenue] = useState(true);
  const [vendorTravelMap, setVendorTravelMap] = useState<Record<string, VendorTravelInfo>>({});

  // Track in-flight requests to avoid duplicates
  const inFlightRef = useRef<Set<string>>(new Set());

  // Load couple session and venue data on mount
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const sessionData = await AsyncStorage.getItem(COUPLE_STORAGE_KEY);
        if (!sessionData) {
          setIsLoadingVenue(false);
          return;
        }
        const { coupleId: id } = JSON.parse(sessionData);
        if (!mounted) return;
        setCoupleId(id);

        // Fetch venue data from bridge
        const bridgeData = await getWeatherLocationData(id);
        if (!mounted) return;

        if (bridgeData.venue?.coordinates) {
          setVenueCoordinates(bridgeData.venue.coordinates);
          setVenueName(bridgeData.venue.name || null);
        }
      } catch (err) {
        console.warn('[VendorLocationIntelligence] Could not load venue data:', err);
      } finally {
        if (mounted) setIsLoadingVenue(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Geocode a vendor location string to coordinates
   */
  const geocodeVendorLocation = useCallback(
    async (locationText: string): Promise<BridgeCoordinates | null> => {
      return resolveVendorCoordinates(locationText);
    },
    []
  );

  /**
   * Calculate travel time from venue to a single vendor
   */
  const calculateVendorTravel = useCallback(
    async (vendor: VendorWithLocation): Promise<TravelInfo | null> => {
      if (!coupleId || !venueCoordinates) return null;
      if (!vendor.location && !vendor.coordinates) return null;

      // Check if already in flight
      if (inFlightRef.current.has(vendor.id)) return null;

      // Check cache
      const cached = await getCachedTravel(vendor.id);
      if (cached) {
        setVendorTravelMap(prev => ({
          ...prev,
          [vendor.id]: { vendorId: vendor.id, travel: cached, isLoading: false, error: null },
        }));
        return cached;
      }

      // Mark loading
      inFlightRef.current.add(vendor.id);
      setVendorTravelMap(prev => ({
        ...prev,
        [vendor.id]: { vendorId: vendor.id, travel: null, isLoading: true, error: null },
      }));

      try {
        // Resolve vendor coordinates if not already provided
        let coords = vendor.coordinates;
        if (!coords && vendor.location) {
          coords = await resolveVendorCoordinates(vendor.location);
        }
        if (!coords) {
          setVendorTravelMap(prev => ({
            ...prev,
            [vendor.id]: {
              vendorId: vendor.id,
              travel: null,
              isLoading: false,
              error: 'Kunne ikke finne koordinater',
            },
          }));
          return null;
        }

        // Calculate travel from venue to vendor
        const result = await calculateTravel(coupleId, { lat: coords.lat, lng: coords.lng });
        const travel = result.travel;

        await setCachedTravel(vendor.id, travel);

        setVendorTravelMap(prev => ({
          ...prev,
          [vendor.id]: { vendorId: vendor.id, travel, isLoading: false, error: null },
        }));

        return travel;
      } catch (err: any) {
        setVendorTravelMap(prev => ({
          ...prev,
          [vendor.id]: {
            vendorId: vendor.id,
            travel: null,
            isLoading: false,
            error: err.message || 'Feil ved beregning',
          },
        }));
        return null;
      } finally {
        inFlightRef.current.delete(vendor.id);
      }
    },
    [coupleId, venueCoordinates]
  );

  /**
   * Calculate travel for a batch of vendors (first 10 to avoid overloading)
   */
  const calculateBatchTravel = useCallback(
    async (vendors: VendorWithLocation[]) => {
      if (!coupleId || !venueCoordinates) return;

      const batch = vendors.filter(v => v.location).slice(0, 10);
      // Process concurrently but with a limit of 3 at a time
      const chunkSize = 3;
      for (let i = 0; i < batch.length; i += chunkSize) {
        const chunk = batch.slice(i, i + chunkSize);
        await Promise.allSettled(chunk.map(v => calculateVendorTravel(v)));
      }
    },
    [coupleId, venueCoordinates, calculateVendorTravel]
  );

  /**
   * Open Google Maps directions from venue to vendor
   */
  const openDirections = useCallback(
    (vendor: VendorWithLocation) => {
      const destination = vendor.location
        ? encodeURIComponent(vendor.location + ', Norway')
        : null;
      if (!destination) return;

      let url: string;
      if (venueCoordinates) {
        // Directions from venue to vendor
        const origin = `${venueCoordinates.lat},${venueCoordinates.lng}`;
        url =
          Platform.OS === 'ios'
            ? `maps://app?saddr=${origin}&daddr=${destination}`
            : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      } else {
        // Just show vendor location
        url =
          Platform.OS === 'ios'
            ? `maps://app?daddr=${destination}`
            : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
      }

      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        const fallback = `https://www.google.com/maps/search/?api=1&query=${destination}`;
        Linking.openURL(fallback).catch(() => {});
      });
    },
    [venueCoordinates]
  );

  /**
   * Open vendor location on a map
   */
  const openVendorOnMap = useCallback((vendor: VendorWithLocation) => {
    if (!vendor.location) return;
    const query = encodeURIComponent(vendor.location + ', Norway');
    const url =
      Platform.OS === 'ios'
        ? `maps://app?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${query}`
      ).catch(() => {});
    });
  }, []);

  /**
   * Get formatted travel badge text for a vendor
   * Returns "15 min • 12 km" or null if not calculated
   */
  const getTravelBadge = useCallback(
    (vendorId: string): string | null => {
      const info = vendorTravelMap[vendorId];
      if (!info?.travel) return null;
      const { drivingMinutes, roadDistanceKm } = info.travel;
      const mins = Math.round(drivingMinutes);
      const km = Math.round(roadDistanceKm);
      if (mins < 60) {
        return `${mins} min • ${km} km`;
      }
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining > 0
        ? `${hours}t ${remaining}m • ${km} km`
        : `${hours}t • ${km} km`;
    },
    [vendorTravelMap]
  );

  /**
   * Get travel info for a specific vendor
   */
  const getVendorTravel = useCallback(
    (vendorId: string): VendorTravelInfo | null => {
      return vendorTravelMap[vendorId] || null;
    },
    [vendorTravelMap]
  );

  /**
   * Sort vendors by distance from venue (closest first)
   */
  const sortByDistance = useCallback(
    <T extends { id: string }>(vendors: T[]): T[] => {
      return [...vendors].sort((a, b) => {
        const travelA = vendorTravelMap[a.id]?.travel;
        const travelB = vendorTravelMap[b.id]?.travel;
        if (!travelA && !travelB) return 0;
        if (!travelA) return 1;
        if (!travelB) return -1;
        return travelA.roadDistanceKm - travelB.roadDistanceKm;
      });
    },
    [vendorTravelMap]
  );

  return {
    venueCoordinates,
    venueName,
    isLoadingVenue,
    vendorTravelMap,
    calculateVendorTravel,
    calculateBatchTravel,
    openDirections,
    openVendorOnMap,
    getTravelBadge,
    getVendorTravel,
    sortByDistance,
    geocodeVendorLocation,
    coupleId,
  };
}
