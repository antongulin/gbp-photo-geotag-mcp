import type { Context, Config } from "@netlify/functions";

/**
 * API endpoint for geotagging photos.
 * Receives image + metadata, calls Trigger.dev task, returns processed image.
 */

const TRIGGER_API_URL = "https://api.trigger.dev";
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_SECONDS = 25; // Netlify function timeout safety

async function triggerTask(apiKey, taskId, payload) {
  const response = await fetch(`${TRIGGER_API_URL}/api/v1/tasks/${taskId}/trigger`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });
  if (!response.ok) throw new Error(`Trigger error: ${response.status}`);
  const data = await response.json();
  return data.id;
}

async function waitForRun(apiKey, runId) {
  const deadline = Date.now() + MAX_POLL_SECONDS * 1000;
  while (Date.now() < deadline) {
    const response = await fetch(`${TRIGGER_API_URL}/api/v1/runs/${runId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) throw new Error(`Poll error: ${response.status}`);
    const run = await response.json();
    if (run.status === "COMPLETED") return run.output;
    if (["FAILED", "CRASHED", "SYSTEM_FAILURE", "CANCELED", "TIMED_OUT", "EXPIRED"].includes(run.status)) {
      throw new Error(run.error?.message || `Task failed: ${run.status}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Task timed out");
}

export default async (req: Request, context: Context) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const apiKey = Netlify.env.get("TRIGGER_SECRET_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...payload } = body;

    let taskId: string;
    switch (action) {
      case "geotag":
        taskId = "geotag-photo";
        break;
      case "geocode":
        taskId = "geocode-address";
        break;
      case "reverse-geocode":
        taskId = "reverse-geocode";
        break;
      case "seo-filename":
        taskId = "generate-seo-filename";
        break;
      case "read-geotag":
        taskId = "read-geotag";
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const runId = await triggerTask(apiKey, taskId, payload);
    const result = await waitForRun(apiKey, runId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/geotag",
};
