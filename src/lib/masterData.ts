/**
 * Canonical enterprise master data for Industry and Site Type.
 * Used everywhere a respondent picks one of these values so the data
 * remains comparable across the platform and admin views.
 *
 * "Other" is the LAST option in every list. When selected, the calling
 * form MUST capture a free-text value into the matching `*_other` column
 * (industry_other on profiles, site_type_other on sites) for periodic
 * administrator review. The canonical column continues to store the
 * literal string "Other" so reporting groupings stay stable.
 */
export const INDUSTRIES = [
  "Manufacturing",
  "IT / ITES",
  "BFSI",
  "Healthcare",
  "Retail",
  "Infrastructure",
  "Education",
  "Hospitality",
  "Logistics",
  "Government / PSU",
  "Other",
] as const;

export const SITE_TYPES = [
  "Corporate Office",
  "IT / ITES Centre",
  "Global Capability Centre (GCC)",
  "BFSI Back-Office",
  "Manufacturing Facility",
  "Warehouse / Logistics Hub",
  "Retail / Hospitality Site",
  "Healthcare Facility",
  "Data Centre",
  "Educational Campus",
  "Other",
] as const;

export const OTHER_VALUE = "Other";
export const OTHER_MAX_LEN = 80;

export const isOther = (v?: string | null) =>
  typeof v === "string" && v.trim().toLowerCase() === "other";

export type Industry = (typeof INDUSTRIES)[number];
export type SiteType = (typeof SITE_TYPES)[number];
