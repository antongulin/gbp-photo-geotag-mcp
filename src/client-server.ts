#!/usr/bin/env node

/**
 * GBP Photo Geotag — Client MCP Server
 *
 * A standalone MCP server that exposes only the geotag tools to clients.
 * It calls the Trigger.dev REST API under the hood, so clients never
 * get access to the full Trigger.dev dashboard or other projects.
 *
 * Usage in MCP config:
 * {
 *   "mcpServers": {
 *     "gbp-photo-geotag": {
 *       "command": "node",
 *       "args": ["/path/to/gbp-photo-geotag-mcp/dist/client-server.js"],
 *       "env": {
 *         "GBP_GEOTAG_API_KEY": "your-api-key-here"
 *       }
 *     }
 *   }
 * }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ─── Configuration ──────────────────────────────────────────────────────────

const TRIGGER_API_URL = "https://api.trigger.dev";
const API_KEY = process.env.GBP_GEOTAG_API_KEY || "";
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_SECONDS = 120;

if (!API_KEY) {
  console.error(
    "Error: GBP_GEOTAG_API_KEY environment variable is required.\n" +
      "Set it in your MCP config or export it in your shell."
  );
  process.exit(1);
}

// ─── Trigger.dev REST API helpers ───────────────────────────────────────────

async function triggerTask(
  taskId: string,
  payload: Record<string, unknown>
): Promise<string> {
  const response = await fetch(
    `${TRIGGER_API_URL}/api/v1/tasks/${taskId}/trigger`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to trigger task ${taskId}: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

async function waitForRun(runId: string): Promise<{
  status: string;
  output?: unknown;
  error?: string;
}> {
  const deadline = Date.now() + MAX_POLL_SECONDS * 1000;

  while (Date.now() < deadline) {
    const response = await fetch(
      `${TRIGGER_API_URL}/api/v1/runs/${runId}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get run ${runId}: ${response.status}`);
    }

    const run = (await response.json()) as {
      status: string;
      output?: unknown;
      error?: { message?: string };
    };

    if (run.status === "COMPLETED") {
      return { status: "COMPLETED", output: run.output };
    }

    if (
      run.status === "FAILED" ||
      run.status === "CRASHED" ||
      run.status === "SYSTEM_FAILURE" ||
      run.status === "CANCELED" ||
      run.status === "TIMED_OUT" ||
      run.status === "EXPIRED"
    ) {
      return {
        status: run.status,
        error: run.error?.message || `Task ended with status: ${run.status}`,
      };
    }

    // Still running — wait and poll again
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return { status: "TIMEOUT", error: "Task did not complete within timeout" };
}

async function triggerAndWait(
  taskId: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const runId = await triggerTask(taskId, payload);
  const result = await waitForRun(runId);

  if (result.status === "COMPLETED") {
    return result.output;
  }

  throw new Error(result.error || `Task failed with status: ${result.status}`);
}

// ─── MCP Server Setup ──────────────────────────────────────────────────────

const server = new Server(
  {
    name: "gbp-photo-geotag",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── Tool definitions ──────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "geocode_address",
        description:
          "Convert a street address to GPS coordinates using OpenStreetMap. Returns latitude, longitude, and structured location data (city, state, country).",
        inputSchema: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description:
                "The street address to geocode (e.g., '123 Main St, Seattle, WA')",
            },
          },
          required: ["address"],
        },
      },
      {
        name: "reverse_geocode",
        description:
          "Convert GPS coordinates (latitude, longitude) to a street address and structured location data.",
        inputSchema: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "GPS latitude in decimal degrees",
            },
            longitude: {
              type: "number",
              description: "GPS longitude in decimal degrees",
            },
          },
          required: ["latitude", "longitude"],
        },
      },
      {
        name: "geotag_photo",
        description:
          "Add GPS coordinates and location metadata (EXIF, IPTC, XMP) to a photo. Provide an image URL and either an address or latitude/longitude coordinates. Returns the processed image as base64.",
        inputSchema: {
          type: "object",
          properties: {
            image_url: {
              type: "string",
              description: "URL of the image to process",
            },
            filename: {
              type: "string",
              description:
                "Optional original filename (used to preserve file extension)",
            },
            address: {
              type: "string",
              description:
                "Street address to geocode (optional if lat/lng provided)",
            },
            latitude: {
              type: "number",
              description: "GPS latitude in decimal degrees",
            },
            longitude: {
              type: "number",
              description: "GPS longitude in decimal degrees",
            },
            city: { type: "string", description: "City name" },
            state: { type: "string", description: "State/Province" },
            country: { type: "string", description: "Country name" },
            business_name: {
              type: "string",
              description: "Business name for Artist/Creator field",
            },
            copyright: {
              type: "string",
              description: "Copyright notice",
            },
            keywords: {
              type: "array",
              items: { type: "string" },
              description: "SEO keywords for the image",
            },
          },
          required: ["image_url"],
        },
      },
      {
        name: "generate_seo_filename",
        description:
          "Generate an SEO-optimized filename from business/location info. Format: business-name-service-city-state.jpg",
        inputSchema: {
          type: "object",
          properties: {
            original_filename: {
              type: "string",
              description:
                "Original filename (used to detect file extension)",
            },
            business_name: {
              type: "string",
              description: "Business name (e.g., 'Acme Plumbing')",
            },
            service: {
              type: "string",
              description:
                "Service or product type (e.g., 'kitchen-remodel')",
            },
            city: { type: "string", description: "City name" },
            state: {
              type: "string",
              description: "State abbreviation (e.g., 'WA')",
            },
            suffix: {
              type: "string",
              description: "Optional suffix number or descriptor",
            },
          },
        },
      },
      {
        name: "read_geotag",
        description:
          "Read existing GPS and location metadata from a photo. Provide the image URL and get back all location-related EXIF, IPTC, and XMP metadata.",
        inputSchema: {
          type: "object",
          properties: {
            image_url: {
              type: "string",
              description: "URL of the image to read metadata from",
            },
            filename: {
              type: "string",
              description: "Optional original filename",
            },
          },
          required: ["image_url"],
        },
      },
    ],
  };
});

// ─── Tool call handler ──────────────────────────────────────────────────────

// Map MCP tool names → Trigger.dev task IDs
const TOOL_TO_TASK: Record<string, string> = {
  geocode_address: "geocode-address",
  reverse_geocode: "reverse-geocode",
  geotag_photo: "geotag-photo",
  generate_seo_filename: "generate-seo-filename",
  read_geotag: "read-geotag",
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const taskId = TOOL_TO_TASK[name];
  if (!taskId) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: `Unknown tool: ${name}` }),
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await triggerAndWait(taskId, (args || {}) as Record<string, unknown>);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : "Unknown error",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// ─── Start ──────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
