import { z } from "zod";
import { exifToolService } from "../services/exiftool.js";
import { nominatimService } from "../services/nominatim.js";
import { GeotagData, LocationData } from "../types.js";

/**
 * Schema for add_geotag tool parameters
 */
export const addGeotagSchema = z.object({
    file_path: z.string().describe("Absolute path to the image file"),
    address: z.string().optional().describe("Street address to geocode (optional if lat/lng provided)"),
    latitude: z.number().optional().describe("GPS latitude in decimal degrees"),
    longitude: z.number().optional().describe("GPS longitude in decimal degrees"),
    city: z.string().optional().describe("City name (optional, auto-filled from address)"),
    state: z.string().optional().describe("State/Province (optional, auto-filled from address)"),
    country: z.string().optional().describe("Country name (optional, auto-filled from address)"),
    business_name: z.string().optional().describe("Business name for Artist/Creator field"),
    copyright: z.string().optional().describe("Copyright notice (e.g., '© 2025 Business Name')"),
    keywords: z.array(z.string()).optional().describe("SEO keywords for the image"),
    overwrite_original: z.boolean().optional().default(false).describe("Overwrite original file (default: creates backup)"),
});

export type AddGeotagParams = z.infer<typeof addGeotagSchema>;

/**
 * Add geotag and location metadata to a photo
 */
export async function addGeotag(params: AddGeotagParams): Promise<{
    success: boolean;
    message: string;
    location?: LocationData;
    filePath: string;
}> {
    // Check if ExifTool is available
    const exifAvailable = await exifToolService.isAvailable();
    if (!exifAvailable) {
        return {
            success: false,
            message: "ExifTool is not installed. Please install it with: brew install exiftool",
            filePath: params.file_path,
        };
    }

    let location: LocationData;

    // Get location data from address or coordinates
    if (params.address) {
        const geocoded = await nominatimService.geocode(params.address);
        if (!geocoded) {
            return {
                success: false,
                message: `Could not geocode address: ${params.address}`,
                filePath: params.file_path,
            };
        }
        location = {
            ...geocoded,
            // Override with user-provided values if specified
            city: params.city || geocoded.city,
            state: params.state || geocoded.state,
            country: params.country || geocoded.country,
        };
    } else if (params.latitude !== undefined && params.longitude !== undefined) {
        // Use provided coordinates, optionally reverse geocode for address data
        const reverseGeocoded = await nominatimService.reverseGeocode(params.latitude, params.longitude);
        location = {
            coordinates: {
                latitude: params.latitude,
                longitude: params.longitude,
            },
            city: params.city || reverseGeocoded?.city,
            state: params.state || reverseGeocoded?.state,
            country: params.country || reverseGeocoded?.country,
            address: reverseGeocoded?.address,
            sublocation: reverseGeocoded?.sublocation,
        };
    } else {
        return {
            success: false,
            message: "Either 'address' or both 'latitude' and 'longitude' must be provided",
            filePath: params.file_path,
        };
    }

    // Build geotag data
    const geotagData: GeotagData = {
        location,
        business: params.business_name
            ? {
                name: params.business_name,
                copyright: params.copyright || `© ${new Date().getFullYear()} ${params.business_name}`,
                keywords: params.keywords,
            }
            : undefined,
    };

    // Write metadata
    const result = await exifToolService.writeGeotag(
        params.file_path,
        geotagData,
        params.overwrite_original
    );

    return {
        success: result.success,
        message: result.message,
        location,
        filePath: params.file_path,
    };
}
