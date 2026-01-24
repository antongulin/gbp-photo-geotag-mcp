import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { addGeotag, AddGeotagParams } from "./geotag.js";

/**
 * Schema for batch_geotag tool parameters
 */
export const batchGeotagSchema = z.object({
    directory: z.string().describe("Absolute path to directory containing images"),
    address: z.string().optional().describe("Street address to geocode (optional if lat/lng provided)"),
    latitude: z.number().optional().describe("GPS latitude in decimal degrees"),
    longitude: z.number().optional().describe("GPS longitude in decimal degrees"),
    city: z.string().optional().describe("City name (optional, auto-filled from address)"),
    state: z.string().optional().describe("State/Province (optional, auto-filled from address)"),
    country: z.string().optional().describe("Country name (optional, auto-filled from address)"),
    business_name: z.string().optional().describe("Business name for Artist/Creator field"),
    copyright: z.string().optional().describe("Copyright notice"),
    keywords: z.array(z.string()).optional().describe("SEO keywords for the images"),
    extensions: z.array(z.string()).optional().default([".jpg", ".jpeg", ".png", ".tiff", ".heic"])
        .describe("File extensions to process"),
    overwrite_original: z.boolean().optional().default(false).describe("Overwrite original files"),
    recursive: z.boolean().optional().default(false).describe("Process subdirectories"),
});

export type BatchGeotagParams = z.infer<typeof batchGeotagSchema>;

/**
 * Supported image extensions
 */
const DEFAULT_EXTENSIONS = [".jpg", ".jpeg", ".png", ".tiff", ".tif", ".heic", ".webp"];

/**
 * Get all image files in a directory
 */
function getImageFiles(dir: string, extensions: string[], recursive: boolean): string[] {
    const files: string[] = [];
    const normalizedExtensions = extensions.map((e) => e.toLowerCase().replace(/^\./, "."));

    function walkDir(currentDir: string) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory() && recursive) {
                walkDir(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (normalizedExtensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }

    walkDir(dir);
    return files;
}

/**
 * Batch geotag multiple photos in a directory
 */
export async function batchGeotag(params: BatchGeotagParams): Promise<{
    success: boolean;
    message: string;
    totalFiles: number;
    successCount: number;
    failedCount: number;
    results: Array<{ file: string; success: boolean; message: string }>;
}> {
    // Check if directory exists
    if (!fs.existsSync(params.directory)) {
        return {
            success: false,
            message: `Directory not found: ${params.directory}`,
            totalFiles: 0,
            successCount: 0,
            failedCount: 0,
            results: [],
        };
    }

    // Validate that we have location data
    if (!params.address && (params.latitude === undefined || params.longitude === undefined)) {
        return {
            success: false,
            message: "Either 'address' or both 'latitude' and 'longitude' must be provided",
            totalFiles: 0,
            successCount: 0,
            failedCount: 0,
            results: [],
        };
    }

    // Get all image files
    const extensions = params.extensions || DEFAULT_EXTENSIONS;
    const files = getImageFiles(params.directory, extensions, params.recursive ?? false);

    if (files.length === 0) {
        return {
            success: true,
            message: `No image files found in ${params.directory}`,
            totalFiles: 0,
            successCount: 0,
            failedCount: 0,
            results: [],
        };
    }

    const results: Array<{ file: string; success: boolean; message: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    // Process each file
    for (const file of files) {
        const geotagParams: AddGeotagParams = {
            file_path: file,
            address: params.address,
            latitude: params.latitude,
            longitude: params.longitude,
            city: params.city,
            state: params.state,
            country: params.country,
            business_name: params.business_name,
            copyright: params.copyright,
            keywords: params.keywords,
            overwrite_original: params.overwrite_original,
        };

        const result = await addGeotag(geotagParams);

        results.push({
            file: path.basename(file),
            success: result.success,
            message: result.message,
        });

        if (result.success) {
            successCount++;
        } else {
            failedCount++;
        }
    }

    return {
        success: failedCount === 0,
        message: `Processed ${files.length} files: ${successCount} successful, ${failedCount} failed`,
        totalFiles: files.length,
        successCount,
        failedCount,
        results,
    };
}
