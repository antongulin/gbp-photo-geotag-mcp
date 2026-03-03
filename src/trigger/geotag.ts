import { task, logger } from "@trigger.dev/sdk";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ─── Helper: Execute ExifTool command ────────────────────────────────────────

async function execExiftool(
  args: string[]
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("exiftool", args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => (stdout += data.toString()));
    proc.stderr.on("data", (data) => (stderr += data.toString()));
    proc.on("close", (code) => resolve({ stdout, stderr, code: code ?? 0 }));
    proc.on("error", (error) => reject(error));
  });
}

// ─── Helper: Download image from URL to temp file ────────────────────────────

async function downloadImage(
  url: string,
  filename?: string
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = path.extname(filename || new URL(url).pathname) || ".jpg";
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `geotag-${Date.now()}${ext}`);
  fs.writeFileSync(tmpFile, buffer);

  return tmpFile;
}

// ─── Helper: Save base64 image to temp file ──────────────────────────────────

function saveBase64Image(
  base64: string,
  filename?: string
): string {
  const buffer = Buffer.from(base64, "base64");
  const ext = filename ? path.extname(filename) : ".jpg";
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `geotag-${Date.now()}${ext}`);
  fs.writeFileSync(tmpFile, buffer);
  return tmpFile;
}

// ─── Helper: Nominatim geocoding ─────────────────────────────────────────────

interface LocationData {
  coordinates: { latitude: number; longitude: number; altitude?: number };
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  sublocation?: string;
}

async function geocode(address: string): Promise<LocationData | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    addressdetails: "1",
    limit: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { "User-Agent": "gbp-photo-geotag-mcp/1.0 (trigger.dev)" } }
  );

  if (!response.ok) return null;

  const results = (await response.json()) as any[];
  if (results.length === 0) return null;

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

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<LocationData | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: "json",
    addressdetails: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    { headers: { "User-Agent": "gbp-photo-geotag-mcp/1.0 (trigger.dev)" } }
  );

  if (!response.ok) return null;

  const result = (await response.json()) as any;
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

// ─── geotag-photo task ───────────────────────────────────────────────────────

export const geotagPhoto = task({
  id: "geotag-photo",
  retry: { maxAttempts: 2 },
  run: async (payload: {
    /** URL of the image to process */
    image_url?: string;
    /** Base64-encoded image data (alternative to image_url) */
    image_base64?: string;
    /** Optional original filename (used to preserve extension) */
    filename?: string;
    /** Street address to geocode (optional if lat/lng provided) */
    address?: string;
    /** GPS latitude in decimal degrees */
    latitude?: number;
    /** GPS longitude in decimal degrees */
    longitude?: number;
    /** City name */
    city?: string;
    /** State/Province */
    state?: string;
    /** Country name */
    country?: string;
    /** Business name for Artist/Creator field */
    business_name?: string;
    /** Copyright notice */
    copyright?: string;
    /** SEO keywords */
    keywords?: string[];
  }) => {
    logger.info("Processing geotag-photo", {
      image_url: payload.image_url,
      has_base64: !!payload.image_base64,
      address: payload.address,
    });

    // Validate: need either image_url or image_base64
    if (!payload.image_url && !payload.image_base64) {
      return {
        success: false,
        message: "Either 'image_url' or 'image_base64' must be provided",
      };
    }

    // 1. Resolve location
    let location: LocationData;

    if (payload.address) {
      const geocoded = await geocode(payload.address);
      if (!geocoded) {
        return {
          success: false,
          message: `Could not geocode address: ${payload.address}`,
        };
      }
      location = {
        ...geocoded,
        city: payload.city || geocoded.city,
        state: payload.state || geocoded.state,
        country: payload.country || geocoded.country,
      };
    } else if (
      payload.latitude !== undefined &&
      payload.longitude !== undefined
    ) {
      const reverseGeocoded = await reverseGeocode(
        payload.latitude,
        payload.longitude
      );
      location = {
        coordinates: {
          latitude: payload.latitude,
          longitude: payload.longitude,
        },
        city: payload.city || reverseGeocoded?.city,
        state: payload.state || reverseGeocoded?.state,
        country: payload.country || reverseGeocoded?.country,
        address: reverseGeocoded?.address,
        sublocation: reverseGeocoded?.sublocation,
      };
    } else {
      return {
        success: false,
        message:
          "Either 'address' or both 'latitude' and 'longitude' must be provided",
      };
    }

    // 2. Get the image (from URL or base64)
    const tmpFile = payload.image_base64
      ? saveBase64Image(payload.image_base64, payload.filename)
      : await downloadImage(payload.image_url!, payload.filename);
    logger.info("Image saved to temp file", { tmpFile });

    try {
      // 3. Build ExifTool args
      const args: string[] = [];
      const { latitude, longitude } = location.coordinates;

      args.push(`-GPSLatitude=${Math.abs(latitude)}`);
      args.push(`-GPSLatitudeRef=${latitude >= 0 ? "N" : "S"}`);
      args.push(`-GPSLongitude=${Math.abs(longitude)}`);
      args.push(`-GPSLongitudeRef=${longitude >= 0 ? "E" : "W"}`);

      if (location.city) {
        args.push(`-IPTC:City=${location.city}`);
        args.push(`-XMP:City=${location.city}`);
      }
      if (location.state) {
        args.push(`-IPTC:Province-State=${location.state}`);
        args.push(`-XMP:State=${location.state}`);
      }
      if (location.country) {
        args.push(`-IPTC:Country-PrimaryLocationName=${location.country}`);
        args.push(`-XMP:Country=${location.country}`);
      }
      if (location.sublocation) {
        args.push(`-IPTC:Sub-location=${location.sublocation}`);
        args.push(`-XMP:Location=${location.sublocation}`);
      }

      if (payload.business_name) {
        args.push(`-IPTC:By-line=${payload.business_name}`);
        args.push(`-XMP:Creator=${payload.business_name}`);
        args.push(`-EXIF:Artist=${payload.business_name}`);

        const copyrightNotice =
          payload.copyright ||
          `© ${new Date().getFullYear()} ${payload.business_name}`;
        args.push(`-IPTC:CopyrightNotice=${copyrightNotice}`);
        args.push(`-XMP:Rights=${copyrightNotice}`);
        args.push(`-EXIF:Copyright=${copyrightNotice}`);
      }

      if (payload.keywords && payload.keywords.length > 0) {
        const keywordStr = payload.keywords.join(", ");
        args.push(`-IPTC:Keywords=${keywordStr}`);
        args.push(`-XMP:Subject=${keywordStr}`);
      }

      args.push("-overwrite_original");
      args.push(tmpFile);

      // 4. Execute ExifTool
      const result = await execExiftool(args);
      logger.info("ExifTool result", {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
      });

      if (result.code !== 0 || result.stderr.includes("Error")) {
        return {
          success: false,
          message: `ExifTool error: ${result.stderr}`,
        };
      }

      // 5. Read the processed image and return as base64
      const processedBuffer = fs.readFileSync(tmpFile);
      const base64Image = processedBuffer.toString("base64");
      const ext = path.extname(tmpFile).replace(".", "");
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

      return {
        success: true,
        message: "Photo geotagged successfully",
        location,
        processed_image: {
          base64: base64Image,
          mime_type: mimeType,
          size_bytes: processedBuffer.length,
        },
      };
    } finally {
      // Clean up temp file
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  },
});

// ─── read-geotag task ────────────────────────────────────────────────────────

export const readGeotag = task({
  id: "read-geotag",
  retry: { maxAttempts: 2 },
  run: async (payload: {
    /** URL of the image to read metadata from */
    image_url?: string;
    /** Base64-encoded image data (alternative to image_url) */
    image_base64?: string;
    /** Optional original filename */
    filename?: string;
  }) => {
    logger.info("Reading geotag from image", {
      image_url: payload.image_url,
      has_base64: !!payload.image_base64,
    });

    if (!payload.image_url && !payload.image_base64) {
      return {
        success: false,
        message: "Either 'image_url' or 'image_base64' must be provided",
      };
    }

    // 1. Get the image (from URL or base64)
    const tmpFile = payload.image_base64
      ? saveBase64Image(payload.image_base64, payload.filename)
      : await downloadImage(payload.image_url!, payload.filename);

    try {
      // 2. Read metadata with ExifTool
      const result = await execExiftool(["-json", "-a", "-G", tmpFile]);

      if (result.code !== 0) {
        return {
          success: false,
          message: `ExifTool error: ${result.stderr}`,
        };
      }

      const allMetadata = JSON.parse(result.stdout);
      const metadata = allMetadata[0] || {};

      // 3. Extract location-related fields
      const locationFields: Record<string, unknown> = {};
      const locationKeys = [
        "GPS",
        "City",
        "State",
        "Country",
        "Location",
        "Province",
        "Sub-location",
        "Artist",
        "Creator",
        "Copyright",
        "By-line",
        "Keywords",
        "Subject",
        "Rights",
      ];

      for (const [key, value] of Object.entries(metadata)) {
        if (locationKeys.some((lk) => key.includes(lk))) {
          locationFields[key] = value;
        }
      }

      logger.info("Metadata read successfully", {
        fieldCount: Object.keys(locationFields).length,
      });

      return {
        success: true,
        message: "Location metadata read successfully",
        metadata: locationFields,
        all_metadata: metadata,
      };
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  },
});
