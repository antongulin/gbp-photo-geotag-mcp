import { task, logger } from "@trigger.dev/sdk";

/**
 * Nominatim geocoding service (OpenStreetMap)
 * Free, no API key required
 * Rate limit: 1 request per second per ToS
 */
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "gbp-photo-geotag-mcp/1.0 (trigger.dev)";

interface LocationData {
  coordinates: { latitude: number; longitude: number; altitude?: number };
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  sublocation?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// ─── geocode-address ─────────────────────────────────────────────────────────

export const geocodeAddress = task({
  id: "geocode-address",
  retry: { maxAttempts: 2 },
  run: async (payload: { address: string }) => {
    logger.info("Geocoding address", { address: payload.address });

    const params = new URLSearchParams({
      q: payload.address,
      format: "json",
      addressdetails: "1",
      limit: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const results = (await response.json()) as NominatimResponse[];

    if (results.length === 0) {
      return {
        success: false,
        message: `Could not find location for address: ${payload.address}`,
      };
    }

    const result = results[0];
    const addr = result.address || {};

    const location: LocationData = {
      coordinates: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      },
      address: result.display_name,
      city: addr.city || addr.town || addr.village,
      state: addr.state,
      country: addr.country,
      postalCode: addr.postcode,
      sublocation: addr.suburb || addr.road,
    };

    logger.info("Geocoding successful", {
      lat: location.coordinates.latitude,
      lng: location.coordinates.longitude,
    });

    return {
      success: true,
      message: "Address geocoded successfully",
      location,
    };
  },
});

// ─── reverse-geocode ─────────────────────────────────────────────────────────

export const reverseGeocode = task({
  id: "reverse-geocode",
  retry: { maxAttempts: 2 },
  run: async (payload: { latitude: number; longitude: number }) => {
    logger.info("Reverse geocoding coordinates", {
      lat: payload.latitude,
      lng: payload.longitude,
    });

    const params = new URLSearchParams({
      lat: payload.latitude.toString(),
      lon: payload.longitude.toString(),
      format: "json",
      addressdetails: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const result = (await response.json()) as NominatimResponse;
    const addr = result.address || {};

    const location: LocationData = {
      coordinates: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      },
      address: result.display_name,
      city: addr.city || addr.town || addr.village,
      state: addr.state,
      country: addr.country,
      postalCode: addr.postcode,
      sublocation: addr.suburb || addr.road,
    };

    logger.info("Reverse geocoding successful", {
      address: location.address,
    });

    return {
      success: true,
      message: "Coordinates reverse geocoded successfully",
      location,
    };
  },
});
