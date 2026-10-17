// delete-account — permanently deletes the calling user and all their data.
//
// The caller must send their own session JWT (`Authorization: Bearer <access_token>`).
// We verify it, then delete the auth user with the service/secret key, which only exists here on
// the server. Every app table references auth.users with ON DELETE CASCADE, so all rows go too.
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function serverKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  // Newer projects expose secret keys as JSON: {"default": "sb_secret_..."}
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    const parsed = JSON.parse(keys) as Record<string, string>;
    const first = parsed.default ?? Object.values(parsed)[0];
    if (first) return first;
  }
  throw new Error("No server key available");
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { error: "Not signed in" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serverKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) return json(401, { error: "Invalid or expired session" });

  const { error: delError } = await admin.auth.admin.deleteUser(data.user.id);
  if (delError) return json(500, { error: "Could not delete account" });

  return json(200, { deleted: true });
});
