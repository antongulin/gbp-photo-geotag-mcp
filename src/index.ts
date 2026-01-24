#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { addGeotag, addGeotagSchema } from "./tools/geotag.js";
import { geocodeAddress, geocodeAddressSchema, reverseGeocode, reverseGeocodeSchema } from "./tools/geocode.js";
import { renameForSeo, renameForSeoSchema } from "./tools/rename.js";
import { batchGeotag, batchGeotagSchema } from "./tools/batch.js";
import { exifToolService } from "./services/exiftool.js";

/**
 * GBP Photo Geotag MCP Server
 * 
 * An MCP server for adding geolocation metadata to photos,
 * optimized for Google Business Profile SEO.
 * 
 * Created by Boost Business AI - https://boostbusiness.ai
 */

const server = new Server(
    {
        name: "gbp-photo-geotag-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Tool definitions for the MCP server
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "add_geotag",
                description: "Add GPS coordinates and location metadata to a photo for Google Business Profile SEO. Automatically geocodes addresses to GPS coordinates and adds EXIF, IPTC, and XMP location data.",
                inputSchema: {
                    type: "object",
                    properties: {
                        file_path: { type: "string", description: "Absolute path to the image file" },
                        address: { type: "string", description: "Street address to geocode (e.g., '123 Main St, Seattle, WA')" },
                        latitude: { type: "number", description: "GPS latitude in decimal degrees (optional if address provided)" },
                        longitude: { type: "number", description: "GPS longitude in decimal degrees (optional if address provided)" },
                        city: { type: "string", description: "City name (auto-filled from address if not specified)" },
                        state: { type: "string", description: "State/Province name" },
                        country: { type: "string", description: "Country name" },
                        business_name: { type: "string", description: "Business name for Artist/Creator metadata" },
                        copyright: { type: "string", description: "Copyright notice (e.g., '© 2025 Your Business')" },
                        keywords: { type: "array", items: { type: "string" }, description: "SEO keywords" },
                        overwrite_original: { type: "boolean", description: "Overwrite original file instead of creating backup" },
                    },
                    required: ["file_path"],
                },
            },
            {
                name: "geocode_address",
                description: "Convert a street address to GPS coordinates using OpenStreetMap. Returns latitude, longitude, and structured location data (city, state, country).",
                inputSchema: {
                    type: "object",
                    properties: {
                        address: { type: "string", description: "Street address to geocode" },
                    },
                    required: ["address"],
                },
            },
            {
                name: "reverse_geocode",
                description: "Convert GPS coordinates to a street address and location data.",
                inputSchema: {
                    type: "object",
                    properties: {
                        latitude: { type: "number", description: "GPS latitude in decimal degrees" },
                        longitude: { type: "number", description: "GPS longitude in decimal degrees" },
                    },
                    required: ["latitude", "longitude"],
                },
            },
            {
                name: "rename_for_seo",
                description: "Rename an image file using SEO best practices (business-name-service-city-state.jpg format). Uses lowercase, hyphens, no special characters.",
                inputSchema: {
                    type: "object",
                    properties: {
                        file_path: { type: "string", description: "Absolute path to the image file" },
                        business_name: { type: "string", description: "Business name" },
                        service: { type: "string", description: "Service or product type" },
                        city: { type: "string", description: "City name" },
                        state: { type: "string", description: "State abbreviation" },
                        suffix: { type: "string", description: "Optional suffix (number or descriptor)" },
                        dry_run: { type: "boolean", description: "Preview new filename without renaming" },
                    },
                    required: ["file_path"],
                },
            },
            {
                name: "batch_geotag",
                description: "Add geotag metadata to all photos in a directory. Supports recursive processing and file extension filtering.",
                inputSchema: {
                    type: "object",
                    properties: {
                        directory: { type: "string", description: "Absolute path to directory containing images" },
                        address: { type: "string", description: "Street address to geocode" },
                        latitude: { type: "number", description: "GPS latitude (optional if address provided)" },
                        longitude: { type: "number", description: "GPS longitude (optional if address provided)" },
                        city: { type: "string", description: "City name" },
                        state: { type: "string", description: "State/Province" },
                        country: { type: "string", description: "Country name" },
                        business_name: { type: "string", description: "Business name for metadata" },
                        copyright: { type: "string", description: "Copyright notice" },
                        keywords: { type: "array", items: { type: "string" }, description: "SEO keywords" },
                        extensions: { type: "array", items: { type: "string" }, description: "File extensions to process" },
                        overwrite_original: { type: "boolean", description: "Overwrite original files" },
                        recursive: { type: "boolean", description: "Process subdirectories" },
                    },
                    required: ["directory"],
                },
            },
            {
                name: "read_geotag",
                description: "Read existing GPS and location metadata from a photo.",
                inputSchema: {
                    type: "object",
                    properties: {
                        file_path: { type: "string", description: "Absolute path to the image file" },
                    },
                    required: ["file_path"],
                },
            },
        ],
    };
});

/**
 * Tool call handler
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "add_geotag": {
                const params = addGeotagSchema.parse(args);
                const result = await addGeotag(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }

            case "geocode_address": {
                const params = geocodeAddressSchema.parse(args);
                const result = await geocodeAddress(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }

            case "reverse_geocode": {
                const params = reverseGeocodeSchema.parse(args);
                const result = await reverseGeocode(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }

            case "rename_for_seo": {
                const params = renameForSeoSchema.parse(args);
                const result = await renameForSeo(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }

            case "batch_geotag": {
                const params = batchGeotagSchema.parse(args);
                const result = await batchGeotag(params);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }

            case "read_geotag": {
                const filePath = (args as { file_path: string }).file_path;
                const metadata = await exifToolService.readMetadata(filePath);

                // Extract location-related fields
                const locationFields: Record<string, unknown> = {};
                const locationKeys = [
                    "GPSLatitude", "GPSLongitude", "GPSAltitude",
                    "GPSLatitudeRef", "GPSLongitudeRef", "GPSAltitudeRef",
                    "City", "State", "Country", "Location", "Sub-location",
                    "Province-State", "Country-PrimaryLocationName",
                    "Artist", "Creator", "Copyright", "Rights", "Keywords", "Subject"
                ];

                for (const [key, value] of Object.entries(metadata)) {
                    const shortKey = key.split(":").pop() || key;
                    if (locationKeys.some(lk => shortKey.includes(lk) || lk.includes(shortKey))) {
                        locationFields[key] = value;
                    }
                }

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Location metadata read successfully",
                            file_path: filePath,
                            metadata: locationFields,
                        }, null, 2),
                    }],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
            isError: true,
        };
    }
});

/**
 * Start the MCP server
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("GBP Photo Geotag MCP server started");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
