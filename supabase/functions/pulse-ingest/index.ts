// Intelligence Pulse — daily ingestion
// Fetches active RSS/Atom/HTML sources, dedupes, then AI-tags new items.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { XMLParser } from "npm:fast-xml-parser@4.3.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SAASS_DOMAIN_KEYS = [
  "governance", "physical_perimeter", "access_control", "surveillance",
  "incident_response", "bcm_dr", "emergency_mgmt", "personnel_screening",
  "supply_chain", "training_awareness",
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type ParsedItem = { title: string; url: string; summary?: string; published_at?: string };

function pickArr(x: any): any[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function textOf(x: any): string {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object" && "#text" in x) return String(x["#text"] ?? "");
  return String(x);
}

function parseFeed(xml: string): ParsedItem[] {
  let doc: any;
  try { doc = parser.parse(xml); } catch { return []; }
  const items: ParsedItem[] = [];

  // RSS 2.0
  const rssItems = pickArr(doc?.rss?.channel?.item);
  for (const it of rssItems) {
    const title = textOf(it.title).trim();
    const url = textOf(it.link).trim();
    if (!title || !url) continue;
    items.push({
      title,
      url,
      summary: textOf(it.description).slice(0, 2000) || undefined,
      published_at: textOf(it.pubDate) || textOf(it["dc:date"]) || undefined,
    });
  }

  // Atom
  const atomEntries = pickArr(doc?.feed?.entry);
  for (const e of atomEntries) {
    const title = textOf(e.title).trim();
    let url = "";
    const link = e.link;
    if (Array.isArray(link)) url = link.find((l) => l["@_rel"] !== "self")?.["@_href"] ?? link[0]?.["@_href"] ?? "";
    else if (link?.["@_href"]) url = link["@_href"];
    else url = textOf(link);
    if (!title || !url) continue;
    items.push({
      title,
      url,
      summary: (textOf(e.summary) || textOf(e.content)).slice(0, 2000) || undefined,
      published_at: textOf(e.published) || textOf(e.updated) || undefined,
    });
  }

  // RDF / RSS 1.0
  const rdfItems = pickArr(doc?.["rdf:RDF"]?.item);
  for (const it of rdfItems) {
    const title = textOf(it.title).trim();
    const url = textOf(it.link).trim();
    if (!title || !url) continue;
    items.push({
      title, url,
      summary: textOf(it.description).slice(0, 2000) || undefined,
      published_at: textOf(it["dc:date"]) || undefined,
    });
  }

  return items;
}

async function fetchWithTimeout(url: string, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "SIP-IntelligencePulse/1.0 (+https://securityintelplatform.com)" },
    });
  } finally { clearTimeout(t); }
}

async function aiTagBatch(items: Array<{ id: string; title: string; summary?: string }>) {
  const sys = `You are a security-intelligence tagger for SIP™ Intelligence Pulse, focused on physical security, BCM, emergency management, and operational risk for Indian IT/ITES.
For each item, return tags. Be concise. Output STRICT JSON matching the schema. Do not include any prose.
Allowed domain_keys: ${SAASS_DOMAIN_KEYS.join(", ")}.`;

  const userPrompt = `Tag these items. Return JSON: {"items":[{"id":"...","themes":["..."],"severity":1-5,"india_relevance":1-5,"domain_keys":["..."]}]}.\n\n` +
    items.map((i) => `ID: ${i.id}\nTitle: ${i.title}\nSummary: ${(i.summary ?? "").slice(0, 500)}`).join("\n---\n");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI tag failed ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // SECURITY: require either CRON_SECRET shared secret or service-role bearer token.
  const authHeader = req.headers.get("Authorization") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET");
  const expectedCron = cronSecret ? `Bearer ${cronSecret}` : null;
  const serviceRoleBearer = `Bearer ${SERVICE_ROLE}`;
  if (authHeader !== serviceRoleBearer && (!expectedCron || authHeader !== expectedCron)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const summary = { sources_fetched: 0, items_added: 0, items_tagged: 0, errors: [] as string[] };

  // 1. Load active fetchable sources
  const { data: sources, error: sErr } = await sb
    .from("pulse_sources")
    .select("id,name,url,kind")
    .eq("active", true)
    .in("kind", ["rss", "atom", "html"]);

  if (sErr) {
    return new Response(JSON.stringify({ error: sErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Fetch + parse + upsert per source
  for (const src of sources ?? []) {
    summary.sources_fetched++;
    try {
      const r = await fetchWithTimeout(src.url, 10000);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const xml = await r.text();
      const items = parseFeed(xml);

      for (const it of items.slice(0, 50)) {
        const external_id = await sha256(`${it.url}|${it.title}`);
        const published_at = it.published_at ? new Date(it.published_at).toISOString() : null;
        const { error: insErr } = await sb.from("pulse_raw_items").insert({
          source_id: src.id,
          external_id,
          url: it.url,
          title: it.title.slice(0, 1000),
          summary: it.summary?.slice(0, 4000) ?? null,
          published_at,
          status: "new",
        });
        if (!insErr) summary.items_added++;
        // duplicate-key (23505) is expected and silently skipped
      }

      await sb.from("pulse_sources").update({
        last_fetched_at: new Date().toISOString(), last_error: null,
      }).eq("id", src.id);
    } catch (e) {
      const msg = (e as Error).message;
      summary.errors.push(`${src.name}: ${msg}`);
      await sb.from("pulse_sources").update({
        last_fetched_at: new Date().toISOString(), last_error: msg.slice(0, 500),
      }).eq("id", src.id);
    }
  }

  // 3. AI-tag up to 50 new items from last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: newItems } = await sb
    .from("pulse_raw_items")
    .select("id,title,summary")
    .eq("status", "new")
    .gte("fetched_at", since)
    .limit(50);

  if (newItems && newItems.length > 0) {
    try {
      const tagged = await aiTagBatch(newItems);
      for (const t of tagged) {
        if (!t?.id) continue;
        const ai_tags = {
          themes: Array.isArray(t.themes) ? t.themes.slice(0, 8) : [],
          severity: Number(t.severity) || 1,
          india_relevance: Number(t.india_relevance) || 1,
          domain_keys: Array.isArray(t.domain_keys)
            ? t.domain_keys.filter((k: string) => SAASS_DOMAIN_KEYS.includes(k))
            : [],
        };
        const { error } = await sb.from("pulse_raw_items").update({
          ai_tags, ai_tagged_at: new Date().toISOString(), status: "tagged",
        }).eq("id", t.id);
        if (!error) summary.items_tagged++;
      }
    } catch (e) {
      summary.errors.push(`AI tagging: ${(e as Error).message}`);
    }
  }

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
