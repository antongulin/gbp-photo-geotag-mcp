/**
 * GPS coordinates with optional altitude
 */
export interface GpsCoordinates {
    latitude: number;
    longitude: number;
    altitude?: number;
}

/**
 * Structured location data from geocoding
 */
export interface LocationData {
    coordinates: GpsCoordinates;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    sublocation?: string;
}

/**
 * Business information for photo metadata
 */
export interface BusinessInfo {
    name: string;
    copyright?: string;
    website?: string;
    keywords?: string[];
}

/**
 * Complete geotag data to write to photo
 */
export interface GeotagData {
    location: LocationData;
    business?: BusinessInfo;
    dateTime?: string;
}

/**
 * Result from ExifTool operations
 */
export interface ExifToolResult {
    success: boolean;
    message: string;
    filePath: string;
    backupPath?: string;
}

/**
 * Nominatim geocoding response
 */
export interface NominatimResponse {
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

/**
 * SEO-optimized filename components
 */
export interface SeoFilenameComponents {
    businessName?: string;
    service?: string;
    city?: string;
    state?: string;
    suffix?: string;
}
