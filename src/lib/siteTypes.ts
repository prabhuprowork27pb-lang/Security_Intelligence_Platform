/**
 * Shared canonical lists for site type, Indian states, and industries used
 * across DiagnosticStart, SiteForm, OrganisationForm, and the admin views.
 * "other" is always the last value — when selected, the calling form should
 * capture a free-text describer (site_type_custom / industry_custom).
 */
export const SITE_TYPES = [
  { value: "it_ites", label: "IT / ITES Office" },
  { value: "gcc", label: "Global Capability Centre (GCC)" },
  { value: "bpo", label: "BPO / Contact Centre" },
  { value: "bfsi", label: "BFSI — Banking, Financial Services & Insurance" },
  { value: "corporate_hq", label: "Corporate Headquarters / Enterprise Campus" },
  { value: "manufacturing", label: "Manufacturing / Industrial Facility" },
  { value: "pharma_rd", label: "Pharmaceutical R&D / Life Sciences" },
  { value: "logistics", label: "Logistics / Warehousing & Distribution" },
  { value: "hospital", label: "Hospital / Healthcare Facility" },
  { value: "retail_mall", label: "Retail / Shopping Mall" },
  { value: "hotel", label: "Hotel / Hospitality" },
  { value: "coworking", label: "Co-working / Flexible Office Space" },
  { value: "education", label: "Educational Institution" },
  { value: "government_psu", label: "Government / PSU Office" },
  { value: "residential", label: "Residential — Gated Community" },
  { value: "data_centre", label: "Data Centre" },
  { value: "other", label: "Other — please specify" },
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu", "Delhi (NCT)",
  "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
  "Outside India",
] as const;

export const INDUSTRIES = [
  { value: "it_ites", label: "IT / ITES" },
  { value: "gcc", label: "Global Capability Centres (GCC)" },
  { value: "bfsi", label: "Banking, Financial Services & Insurance" },
  { value: "manufacturing", label: "Manufacturing & Engineering" },
  { value: "pharma", label: "Pharmaceutical & Life Sciences" },
  { value: "logistics", label: "Logistics & Supply Chain" },
  { value: "healthcare", label: "Healthcare & Hospitals" },
  { value: "retail", label: "Retail & Consumer" },
  { value: "hospitality", label: "Hotel & Hospitality" },
  { value: "realestate", label: "Real Estate & Facilities Management" },
  { value: "education", label: "Education & Research" },
  { value: "government", label: "Government & Public Sector" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "media_tech", label: "Media & Technology" },
  { value: "startup", label: "Startup / Early-Stage Company" },
  { value: "conglomerate", label: "Diversified Conglomerate" },
  { value: "other", label: "Other — please specify" },
] as const;

export const isOtherValue = (v?: string | null) =>
  typeof v === "string" && v.trim().toLowerCase() === "other";
