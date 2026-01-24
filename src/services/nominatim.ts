import { LocationData, NominatimResponse } from "../types.js";

/**
 * Nominatim geocoding service (OpenStreetMap)
 * Free, no API key required
 * Rate limit: 1 request per second per ToS
 */
export class NominatimService {
    private baseUrl = "https://nominatim.openstreetmap.org";
    private userAgent = "gbp-photo-geotag-mcp/1.0";
    private lastRequestTime = 0;

    /**
     * Enforce rate limiting (1 req/sec)
     */
    private async rateLimit(): Promise<void> {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < 1000) {
            await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
        }
        this.lastRequestTime = Date.now();
    }

    /**
     * Geocode an address to GPS coordinates and structured location data
     */
    async geocode(address: string): Promise<LocationData | null> {
        await this.rateLimit();

        const params = new URLSearchParams({
            q: address,
            format: "json",
            addressdetails: "1",
            limit: "1",
        });

        const response = await fetch(`${this.baseUrl}/search?${params}`, {
            headers: {
                "User-Agent": this.userAgent,
            },
        });

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.statusText}`);
        }

        const results = await response.json() as NominatimResponse[];

        if (results.length === 0) {
            return null;
        }

        const result = results[0];
        const addr = result.address || {};

        return {
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
    }

    /**
     * Reverse geocode GPS coordinates to address
     */
    async reverseGeocode(latitude: number, longitude: number): Promise<LocationData | null> {
        await this.rateLimit();

        const params = new URLSearchParams({
            lat: latitude.toString(),
            lon: longitude.toString(),
            format: "json",
            addressdetails: "1",
        });

        const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
            headers: {
                "User-Agent": this.userAgent,
            },
        });

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.statusText}`);
        }

        const result = await response.json() as NominatimResponse;
        const addr = result.address || {};

        return {
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
    }
}

export const nominatimService = new NominatimService();
