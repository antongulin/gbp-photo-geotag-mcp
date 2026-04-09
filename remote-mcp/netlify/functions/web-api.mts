import type { Context, Config } from "@netlify/functions";

/**
 * Public web-app proxy for /api/geotag.
 *
 * Intended to be called ONLY from the web UI bundled in public/.
 * Unlike /api/geotag (which requires x-api-key), this endpoint is
 * unauthenticated but restricted by an Origin/Referer allowlist so
 * casual scripted abuse can't consume Trigger.dev quota through it.
 *
 * Origin can be spoofed by non-browser clients — if abuse becomes a
 * real problem, add per-IP rate limiting via Netlify Blobs here.
 */

const TRIGGER_API_URL = "https://api.trigger.dev";
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_SECONDS = 25;

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

    // Retry on transient errors:
    // - 404: eventual-consistency window right after run creation
    // - 5xx: Trigger.dev upstream transient failure
    if (response.status === 404 || response.status >= 500) {
      await response.body?.cancel();
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    // Any other non-2xx is a real error (auth, bad request, etc.)
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Poll error: ${response.status}`);
    }
    const run = await response.json();
    if (run.status === "COMPLETED") return run.output;
    if (["FAILED", "CRASHED", "SYSTEM_FAILURE", "CANCELED", "TIMED_OUT", "EXPIRED"].includes(run.status)) {
      throw new Error(run.error?.message || `Task failed: ${run.status}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Task timed out");
}

/**
 * Build the set of allowed origins. Pulls from ALLOWED_ORIGINS env var
 * (comma-separated) if set, otherwise falls back to Netlify's built-in
 * URL / DEPLOY_PRIME_URL / DEPLOY_URL so deploy previews Just Work.
 */
function getAllowedOrigins(): string[] {
  const explicit = Netlify.env.get("ALLOWED_ORIGINS");
  if (explicit) {
    return explicit.split(",").map((o) => o.trim()).filter(Boolean);
  }
  const netlifyOrigins = [
    Netlify.env.get("URL"),
    Netlify.env.get("DEPLOY_PRIME_URL"),
    Netlify.env.get("DEPLOY_URL"),
  ].filter((o): o is string => !!o);
  return netlifyOrigins;
}

function isAllowedOrigin(req: Request): boolean {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return false;

  // Prefer Origin header (set on all cross-origin and same-origin POSTs
  // by modern browsers). Fall back to Referer for older/edge clients.
  const origin = req.headers.get("origin");
  if (origin && allowed.includes(origin)) return true;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowed.includes(refererOrigin)) return true;
    } catch {
      // Malformed referer — fall through to reject
    }
  }

  return false;
}

export default async (req: Request, context: Context) => {
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

  // Origin check — reject if the request doesn't come from our own web UI.
  // Spoofable by non-browser clients; this is a casual-abuse deterrent, not
  // a security boundary. /api/geotag (with x-api-key) is the real API surface.
  if (!isAllowedOrigin(req)) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const apiKey = Netlify.env.get("TRIGGER_SECRET_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing Trigger.dev key" }),
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
  path: "/api/web-geotag",
};
