// Capture-lead edge function: persists pre-auth lead data so a user never
// re-enters their identity after clicking the magic link. Public endpoint.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).transform((v) => v.toLowerCase()),
  mobile: z.string().trim().regex(/^\+?[0-9 \-]{7,20}$/),
  company: z.string().trim().min(2).max(160),
  designation: z.string().trim().min(2).max(120),
  redirect_path: z.string().trim().max(255).optional(),
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PENDING_PROFILE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json(400, { error: "invalid_json" });
  }
  if (!parsed.success) return json(400, { error: "validation", details: parsed.error.flatten() });

  const lead = parsed.data;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // If an existing verified profile owns this email with a different name, reject.
  const { data: existing } = await admin
    .from("profiles")
    .select("user_id, full_name, verified_at")
    .ilike("email", lead.email)
    .maybeSingle();
  if (existing?.verified_at && existing.full_name.toLowerCase() !== lead.full_name.toLowerCase()) {
    return json(409, { error: "identity_locked", message: "This email is already linked to a different verified profile." });
  }

  // Persist a CRM lead so the team can follow up regardless of magic-link conversion.
  await admin.from("dslr_leads").insert({
    name: lead.full_name,
    role: lead.designation,
    email: lead.email,
    phone: lead.mobile,
    message: `Company: ${lead.company}`,
    status: "diagnostic_start",
  } as any);

  // Stash identity in app_settings keyed by lowercase email so the post-magic-link
  // hydration step can copy it into the user's profiles row (RLS-safe).
  const stashKey = `pending_profile:${lead.email}`;
  await admin
    .from("app_settings")
    .upsert({ key: stashKey, value: lead as any }, { onConflict: "key" });

  // Opportunistic TTL cleanup: purge stale pending_profile rows (>7 days old)
  // so user PII does not accumulate indefinitely in app_settings.
  const ttlCutoff = new Date(Date.now() - PENDING_PROFILE_TTL_MS).toISOString();
  try {
    await admin
      .from("app_settings")
      .delete()
      .like("key", "pending_profile:%")
      .lt("updated_at", ttlCutoff);
  } catch (cleanupErr) {
    console.error("pending_profile cleanup failed", cleanupErr);
  }

  return json(200, { ok: true });
});
