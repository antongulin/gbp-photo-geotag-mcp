import { z } from "zod";
import { nominatimService } from "../services/nominatim.js";
import { LocationData } from "../types.js";

/**
 * Schema for geocode_address tool parameters
 */
export const geocodeAddressSchema = z.object({
    address: z.string().describe("The street address to geocode (e.g., '123 Main St, Seattle, WA')"),
});

export type GeocodeAddressParams = z.infer<typeof geocodeAddressSchema>;

/**
 * Convert a street address to GPS coordinates and structured location data
 */
export async function geocodeAddress(params: GeocodeAddressParams): Promise<{
    success: boolean;
    message: string;
    location?: LocationData;
}> {
    try {
        const location = await nominatimService.geocode(params.address);

        if (!location) {
            return {
                success: false,
                message: `Could not find location for address: ${params.address}`,
            };
        }

        return {
            success: true,
            message: "Address geocoded successfully",
            location,
        };
    } catch (error) {
        return {
            success: false,
            message: `Geocoding error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Schema for reverse_geocode tool parameters
 */
export const reverseGeocodeSchema = z.object({
    latitude: z.number().describe("GPS latitude in decimal degrees"),
    longitude: z.number().describe("GPS longitude in decimal degrees"),
});

export type ReverseGeocodeParams = z.infer<typeof reverseGeocodeSchema>;

/**
 * Convert GPS coordinates to a street address
 */
export async function reverseGeocode(params: ReverseGeocodeParams): Promise<{
    success: boolean;
    message: string;
    location?: LocationData;
}> {
    try {
        const location = await nominatimService.reverseGeocode(params.latitude, params.longitude);

        if (!location) {
            return {
                success: false,
                message: `Could not reverse geocode coordinates: ${params.latitude}, ${params.longitude}`,
            };
        }

        return {
            success: true,
            message: "Coordinates reverse geocoded successfully",
            location,
        };
    } catch (error) {
        return {
            success: false,
            message: `Reverse geocoding error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}
