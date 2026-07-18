import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden — admin only" }, 403);

    const { action, email, user_id } = await req.json().catch(() => ({}));

    if (action === "list") {
      const { data: rows, error } = await admin
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "beta_tester")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);

      const result = [];
      for (const r of rows ?? []) {
        const { data: u } = await admin.auth.admin.getUserById(r.user_id);
        result.push({
          user_id: r.user_id,
          email: u?.user?.email ?? "(unknown)",
          created_at: r.created_at,
        });
      }
      return json({ testers: result });
    }

    if (action === "grant") {
      if (!email || typeof email !== "string") return json({ error: "Email required" }, 400);
      const target = email.trim().toLowerCase();

      // Find user by email (paginate auth users)
      let foundId: string | null = null;
      let page = 1;
      while (page < 20) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) return json({ error: error.message }, 500);
        const match = data.users.find((u) => u.email?.toLowerCase() === target);
        if (match) { foundId = match.id; break; }
        if (data.users.length < 1000) break;
        page++;
      }

      let invited = false;
      if (!foundId) {
        // No account yet — send a Supabase invite, then attach the role
        const origin = req.headers.get("origin") ?? "https://www.securityintelplatform.com";
        const { data: invData, error: invErr } = await admin.auth.admin.inviteUserByEmail(target, {
          redirectTo: `${origin}/auth`,
        });
        if (invErr || !invData?.user) {
          // Edge case: invite says user already registered — re-lookup once
          const { data: lookup } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const match = lookup?.users.find((u) => u.email?.toLowerCase() === target);
          if (!match) return json({ error: invErr?.message ?? "Could not send invite" }, 500);
          foundId = match.id;
        } else {
          foundId = invData.user.id;
          invited = true;
        }
      }

      const { error: insErr } = await admin
        .from("user_roles")
        .insert({ user_id: foundId, role: "beta_tester" });
      if (insErr && !insErr.message.includes("duplicate")) {
        return json({ error: insErr.message }, 500);
      }
      return json({ ok: true, invited, user_id: foundId, email: target }, invited ? 201 : 200);
    }

    if (action === "revoke") {
      if (!user_id) return json({ error: "user_id required" }, 400);
      const { error } = await admin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "beta_tester");
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
