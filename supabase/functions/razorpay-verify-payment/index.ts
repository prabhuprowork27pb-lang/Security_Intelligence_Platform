import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount_inr: number;
  assessment_id?: string | null;
}

async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Razorpay not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userRes.user;

    const body = (await req.json()) as VerifyBody;
    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing payment params" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC signature
    const expected = await hmacSha256Hex(
      RAZORPAY_KEY_SECRET,
      `${body.razorpay_order_id}|${body.razorpay_payment_id}`,
    );
    if (expected !== body.razorpay_signature) {
      return new Response(JSON.stringify({ error: "Signature mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: fetch the authoritative amount from Razorpay — never trust the client.
    const rzpAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(body.razorpay_order_id)}`, {
      headers: { Authorization: `Basic ${rzpAuth}` },
    });
    const order = await orderRes.json();
    if (!orderRes.ok || !order?.amount) {
      console.error("Razorpay order lookup failed", order);
      return new Response(JSON.stringify({ error: "Order lookup failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.status !== "paid") {
      return new Response(JSON.stringify({ error: "Order not paid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate the order amount matches our server-side expected price.
    const { data: pricingRow } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "pricing")
      .maybeSingle();
    const pricing = (pricingRow?.value ?? {}) as { assessment_price_inr?: number };
    const expectedInr = Math.round(Number(pricing.assessment_price_inr ?? 4999));
    const paidInr = Math.round(Number(order.amount) / 100);
    if (paidInr < expectedInr) {
      console.error("Underpayment detected", { paidInr, expectedInr, order_id: body.razorpay_order_id });
      return new Response(JSON.stringify({ error: "Amount mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const amount = paidInr;

    const { error: payErr } = await admin.from("payments").insert({
      user_id: user.id,
      assessment_id: body.assessment_id ?? null,
      amount_inr: amount,
      currency: "INR",
      provider: "razorpay",
      provider_ref: body.razorpay_payment_id,
      status: "succeeded",
    });
    if (payErr) {
      console.error("payment insert failed", payErr);
      return new Response(JSON.stringify({ error: "Could not record payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.assessment_id) {
      const { data: updated, error: aErr } = await admin
        .from("assessments")
        .update({ paid: true })
        .eq("id", body.assessment_id)
        .eq("user_id", user.id)
        .select("id");
      if (aErr) console.error("assessment update failed", aErr);
      if (!updated || updated.length === 0) {
        console.warn("ownership mismatch: payment verified but assessment_id does not belong to paying user", {
          user_id: user.id,
          assessment_id: body.assessment_id,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("razorpay-verify-payment error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
