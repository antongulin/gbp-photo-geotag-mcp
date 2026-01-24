import { spawn } from "child_process";
import { GeotagData, ExifToolResult } from "../types.js";

/**
 * ExifTool service for reading and writing photo metadata
 */
export class ExifToolService {
    private exiftoolPath: string;

    constructor(exiftoolPath: string = "exiftool") {
        this.exiftoolPath = exiftoolPath;
    }

    /**
     * Check if ExifTool is available on the system
     */
    async isAvailable(): Promise<boolean> {
        return new Promise((resolve) => {
            const proc = spawn(this.exiftoolPath, ["-ver"]);
            proc.on("close", (code) => resolve(code === 0));
            proc.on("error", () => resolve(false));
        });
    }

    /**
     * Execute an ExifTool command and return the output
     */
    private async execute(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
        return new Promise((resolve, reject) => {
            const proc = spawn(this.exiftoolPath, args);
            let stdout = "";
            let stderr = "";

            proc.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            proc.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            proc.on("close", (code) => {
                resolve({ stdout, stderr, code: code ?? 0 });
            });

            proc.on("error", (error) => {
                reject(error);
            });
        });
    }

    /**
     * Read all metadata from a file
     */
    async readMetadata(filePath: string): Promise<Record<string, unknown>> {
        const result = await this.execute(["-json", "-a", "-G", filePath]);
        if (result.code !== 0) {
            throw new Error(`ExifTool error: ${result.stderr}`);
        }
        const parsed = JSON.parse(result.stdout);
        return parsed[0] || {};
    }

    /**
     * Read GPS coordinates from a file
     */
    async readGpsCoordinates(filePath: string): Promise<{ latitude: number; longitude: number } | null> {
        const result = await this.execute(["-json", "-GPSLatitude", "-GPSLongitude", "-n", filePath]);
        if (result.code !== 0) {
            return null;
        }
        const parsed = JSON.parse(result.stdout);
        const data = parsed[0];
        if (data?.GPSLatitude && data?.GPSLongitude) {
            return {
                latitude: data.GPSLatitude,
                longitude: data.GPSLongitude,
            };
        }
        return null;
    }

    /**
     * Write geotag metadata to a file
     */
    async writeGeotag(filePath: string, data: GeotagData, overwriteOriginal: boolean = false): Promise<ExifToolResult> {
        const args: string[] = [];

        // GPS coordinates
        const { latitude, longitude, altitude } = data.location.coordinates;
        args.push(`-GPSLatitude=${Math.abs(latitude)}`);
        args.push(`-GPSLatitudeRef=${latitude >= 0 ? "N" : "S"}`);
        args.push(`-GPSLongitude=${Math.abs(longitude)}`);
        args.push(`-GPSLongitudeRef=${longitude >= 0 ? "E" : "W"}`);
        if (altitude !== undefined) {
            args.push(`-GPSAltitude=${Math.abs(altitude)}`);
            args.push(`-GPSAltitudeRef=${altitude >= 0 ? 0 : 1}`);
        }

        // IPTC Location fields
        if (data.location.city) {
            args.push(`-IPTC:City=${data.location.city}`);
            args.push(`-XMP:City=${data.location.city}`);
        }
        if (data.location.state) {
            args.push(`-IPTC:Province-State=${data.location.state}`);
            args.push(`-XMP:State=${data.location.state}`);
        }
        if (data.location.country) {
            args.push(`-IPTC:Country-PrimaryLocationName=${data.location.country}`);
            args.push(`-XMP:Country=${data.location.country}`);
        }
        if (data.location.sublocation) {
            args.push(`-IPTC:Sub-location=${data.location.sublocation}`);
            args.push(`-XMP:Location=${data.location.sublocation}`);
        }

        // Business info
        if (data.business) {
            if (data.business.name) {
                args.push(`-IPTC:By-line=${data.business.name}`);
                args.push(`-XMP:Creator=${data.business.name}`);
                args.push(`-EXIF:Artist=${data.business.name}`);
            }
            if (data.business.copyright) {
                args.push(`-IPTC:CopyrightNotice=${data.business.copyright}`);
                args.push(`-XMP:Rights=${data.business.copyright}`);
                args.push(`-EXIF:Copyright=${data.business.copyright}`);
            }
            if (data.business.keywords && data.business.keywords.length > 0) {
                const keywordStr = data.business.keywords.join(", ");
                args.push(`-IPTC:Keywords=${keywordStr}`);
                args.push(`-XMP:Subject=${keywordStr}`);
            }
        }

        // Add overwrite flag if requested
        if (overwriteOriginal) {
            args.push("-overwrite_original");
        }

        // Add the file path
        args.push(filePath);

        const result = await this.execute(args);

        if (result.code !== 0 || result.stderr.includes("Error")) {
            return {
                success: false,
                message: result.stderr || "Unknown error occurred",
                filePath,
            };
        }

        return {
            success: true,
            message: "Geotag metadata written successfully",
            filePath,
            backupPath: overwriteOriginal ? undefined : `${filePath}_original`,
        };
    }

    /**
     * Remove GPS and location metadata from a file
     */
    async removeLocationMetadata(filePath: string, overwriteOriginal: boolean = false): Promise<ExifToolResult> {
        const args = [
            "-GPS*=",
            "-IPTC:City=",
            "-IPTC:Province-State=",
            "-IPTC:Country-PrimaryLocationName=",
            "-IPTC:Sub-location=",
            "-XMP:City=",
            "-XMP:State=",
            "-XMP:Country=",
            "-XMP:Location=",
        ];

        if (overwriteOriginal) {
            args.push("-overwrite_original");
        }

        args.push(filePath);

        const result = await this.execute(args);

        return {
            success: result.code === 0,
            message: result.code === 0 ? "Location metadata removed successfully" : result.stderr,
            filePath,
        };
    }
}

export const exifToolService = new ExifToolService();
