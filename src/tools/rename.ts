import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { SeoFilenameComponents } from "../types.js";

/**
 * Schema for rename_for_seo tool parameters
 */
export const renameForSeoSchema = z.object({
    file_path: z.string().describe("Absolute path to the image file"),
    business_name: z.string().optional().describe("Business name (e.g., 'Acme Plumbing')"),
    service: z.string().optional().describe("Service or product type (e.g., 'kitchen-remodel')"),
    city: z.string().optional().describe("City name"),
    state: z.string().optional().describe("State abbreviation (e.g., 'WA')"),
    suffix: z.string().optional().describe("Optional suffix number or descriptor"),
    dry_run: z.boolean().optional().default(false).describe("Preview the new filename without renaming"),
});

export type RenameForSeoParams = z.infer<typeof renameForSeoSchema>;

/**
 * Convert a string to SEO-friendly format
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Collapse multiple hyphens
 */
function toSeoSlug(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
        .replace(/\s+/g, "-") // Spaces to hyphens
        .replace(/-+/g, "-") // Collapse multiple hyphens
        .replace(/^-|-$/g, ""); // Trim hyphens from ends
}

/**
 * Build an SEO-optimized filename from components
 */
function buildSeoFilename(components: SeoFilenameComponents, extension: string): string {
    const parts: string[] = [];

    if (components.businessName) {
        parts.push(toSeoSlug(components.businessName));
    }
    if (components.service) {
        parts.push(toSeoSlug(components.service));
    }
    if (components.city) {
        parts.push(toSeoSlug(components.city));
    }
    if (components.state) {
        parts.push(toSeoSlug(components.state));
    }
    if (components.suffix) {
        parts.push(toSeoSlug(components.suffix));
    }

    // If no parts provided, use a timestamp
    if (parts.length === 0) {
        parts.push(`image-${Date.now()}`);
    }

    return `${parts.join("-")}${extension}`;
}

/**
 * Rename a file using SEO best practices
 */
export async function renameForSeo(params: RenameForSeoParams): Promise<{
    success: boolean;
    message: string;
    originalPath: string;
    newPath?: string;
    newFilename?: string;
}> {
    const originalPath = params.file_path;

    // Check if file exists
    if (!fs.existsSync(originalPath)) {
        return {
            success: false,
            message: `File not found: ${originalPath}`,
            originalPath,
        };
    }

    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath).toLowerCase();

    // Build the new filename
    const newFilename = buildSeoFilename(
        {
            businessName: params.business_name,
            service: params.service,
            city: params.city,
            state: params.state,
            suffix: params.suffix,
        },
        ext
    );

    const newPath = path.join(dir, newFilename);

    // Check if new path already exists
    if (fs.existsSync(newPath) && newPath !== originalPath) {
        // Add a number suffix to make it unique
        let counter = 1;
        let uniquePath = newPath;
        while (fs.existsSync(uniquePath)) {
            const baseName = newFilename.replace(ext, "");
            uniquePath = path.join(dir, `${baseName}-${counter}${ext}`);
            counter++;
        }
        const uniqueFilename = path.basename(uniquePath);

        if (params.dry_run) {
            return {
                success: true,
                message: `[DRY RUN] Would rename to: ${uniqueFilename} (added number to avoid conflict)`,
                originalPath,
                newPath: uniquePath,
                newFilename: uniqueFilename,
            };
        }

        fs.renameSync(originalPath, uniquePath);
        return {
            success: true,
            message: `File renamed successfully (added number to avoid conflict)`,
            originalPath,
            newPath: uniquePath,
            newFilename: uniqueFilename,
        };
    }

    if (params.dry_run) {
        return {
            success: true,
            message: `[DRY RUN] Would rename to: ${newFilename}`,
            originalPath,
            newPath,
            newFilename,
        };
    }

    // Perform the rename
    fs.renameSync(originalPath, newPath);

    return {
        success: true,
        message: "File renamed successfully for SEO",
        originalPath,
        newPath,
        newFilename,
    };
}
