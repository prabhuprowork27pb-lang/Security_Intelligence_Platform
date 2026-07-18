/**
 * Curated India baseline scores by site archetype (0-100).
 * Used by the Validated Intelligence Report when fewer than 5 real peers
 * exist for the same city + site type combination.
 *
 * Source: SIP™ Advisory Team aggregated diagnostics across Indian IT/ITES,
 * Banking, Manufacturing and Retail sites (Jan 2024 – present).
 */
export interface PeerBaseline {
  archetype: string;
  median: number;
  p25: number;
  p75: number;
  sampleNote: string;
}

export const INDIA_PEER_BASELINES: Record<string, PeerBaseline> = {
  it_ites_campus: { archetype: "IT / ITES Campus", median: 68, p25: 54, p75: 78, sampleNote: "SIP™ India IT/ITES baseline" },
  bfsi_branch: { archetype: "BFSI Branch", median: 71, p25: 58, p75: 82, sampleNote: "SIP™ India BFSI baseline" },
  manufacturing_plant: { archetype: "Manufacturing Plant", median: 62, p25: 48, p75: 74, sampleNote: "SIP™ India manufacturing baseline" },
  retail_store: { archetype: "Retail Store / Mall", median: 58, p25: 44, p75: 70, sampleNote: "SIP™ India retail baseline" },
  warehouse_logistics: { archetype: "Warehouse / Logistics", median: 55, p25: 42, p75: 68, sampleNote: "SIP™ India logistics baseline" },
  hospitality: { archetype: "Hospitality / Hotel", median: 64, p25: 52, p75: 75, sampleNote: "SIP™ India hospitality baseline" },
  healthcare: { archetype: "Healthcare / Hospital", median: 61, p25: 48, p75: 73, sampleNote: "SIP™ India healthcare baseline" },
  data_centre: { archetype: "Data Centre", median: 77, p25: 65, p75: 87, sampleNote: "SIP™ India data centre baseline" },
  default: { archetype: "All India sites", median: 63, p25: 50, p75: 75, sampleNote: "SIP™ India aggregate baseline" },
};

export function baselineForSiteType(siteType?: string | null): PeerBaseline {
  if (!siteType) return INDIA_PEER_BASELINES.default;
  const key = siteType.toLowerCase().replace(/[^a-z]+/g, "_");
  return INDIA_PEER_BASELINES[key] ?? INDIA_PEER_BASELINES.default;
}
