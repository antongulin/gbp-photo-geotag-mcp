import { task, logger } from "@trigger.dev/sdk";

/**
 * Generate an SEO-optimized filename from business/location info.
 * Pure string manipulation — no file system access needed.
 */

function toSeoSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const generateSeoFilename = task({
  id: "generate-seo-filename",
  run: async (payload: {
    original_filename?: string;
    business_name?: string;
    service?: string;
    city?: string;
    state?: string;
    suffix?: string;
  }) => {
    logger.info("Generating SEO filename", payload);

    const parts: string[] = [];

    if (payload.business_name) parts.push(toSeoSlug(payload.business_name));
    if (payload.service) parts.push(toSeoSlug(payload.service));
    if (payload.city) parts.push(toSeoSlug(payload.city));
    if (payload.state) parts.push(toSeoSlug(payload.state));
    if (payload.suffix) parts.push(toSeoSlug(payload.suffix));

    if (parts.length === 0) {
      parts.push(`image-${Date.now()}`);
    }

    // Determine extension from original filename, default to .jpg
    let extension = ".jpg";
    if (payload.original_filename) {
      const match = payload.original_filename.match(/\.[a-zA-Z0-9]+$/);
      if (match) extension = match[0].toLowerCase();
    }

    const newFilename = `${parts.join("-")}${extension}`;

    logger.info("Generated filename", { newFilename });

    return {
      success: true,
      message: "SEO filename generated successfully",
      original_filename: payload.original_filename || null,
      new_filename: newFilename,
      slug_parts: parts,
    };
  },
});
