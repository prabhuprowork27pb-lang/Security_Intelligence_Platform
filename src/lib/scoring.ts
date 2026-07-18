// SIP Score Band Model
// Defines the 4-band scoring system for security assessments

export interface ScoreBand {
  id: 'vulnerable' | 'emerging' | 'effective' | 'proactive' | 'unknown';
  label: string;
  min: number;
  max: number;
  color: string;
  textColor: string;
  description: string;
}

export const SAASS_SCORE_BANDS: ScoreBand[] = [
  {
    id: 'vulnerable',
    label: 'Ad Hoc',
    min: 0,
    max: 40,
    color: '#D72638',
    textColor: '#FFFFFF',
    description: 'Significant security gaps requiring immediate attention'
  },
  {
    id: 'emerging',
    label: 'Developing',
    min: 41,
    max: 70,
    color: '#F4A261',
    textColor: '#0D162A',
    description: 'Basic controls in place but significant improvements needed'
  },
  {
    id: 'effective',
    label: 'Managed',
    min: 71,
    max: 85,
    color: '#2A9D8F',
    textColor: '#FFFFFF',
    description: 'Well-established security practices with room for optimization'
  },
  {
    id: 'proactive',
    label: 'Resilient',
    min: 86,
    max: 100,
    color: '#2B9348',
    textColor: '#FFFFFF',
    description: 'Industry-leading security posture with continuous improvement'
  }
];

const UNKNOWN_BAND: ScoreBand = {
  id: 'unknown',
  label: 'UNKNOWN',
  min: -1,
  max: -1,
  color: '#95A5A6',
  textColor: '#FFFFFF',
  description: 'Score not available or out of range'
};

/**
 * Get the score band for a given numeric score (0-100)
 * Returns null for null/undefined scores, UNKNOWN band for invalid scores
 */
export function getScoreBand(score: number | null | undefined): ScoreBand | null {
  if (score === null || score === undefined) {
    return null;
  }
  
  if (typeof score !== 'number' || isNaN(score)) {
    return UNKNOWN_BAND;
  }
  
  // Clamp to 0-100 range for matching
  const clampedScore = Math.max(0, Math.min(100, score));
  
  for (const band of SAASS_SCORE_BANDS) {
    if (clampedScore >= band.min && clampedScore <= band.max) {
      return band;
    }
  }
  
  // Fallback for out-of-range values
  return UNKNOWN_BAND;
}

/**
 * Get label and color for a score - convenience function
 */
export function scoreToLabelAndColor(score: number | null | undefined): {
  label: string;
  color: string;
  textColor: string;
  bandId: string;
} {
  const band = getScoreBand(score);
  
  if (!band) {
    return {
      label: '-',
      color: '#F7F8F9',
      textColor: '#6B7280',
      bandId: 'neutral'
    };
  }
  
  return {
    label: band.label,
    color: band.color,
    textColor: band.textColor,
    bandId: band.id
  };
}

/**
 * Get CSS class name for a band
 */
export function getBandClassName(score: number | null | undefined): string {
  const band = getScoreBand(score);
  if (!band) return '';
  return `saass-badge--${band.id}`;
}

/**
 * Get heatmap cell color for a score
 */
export function getHeatmapColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return 'var(--saass-bg)';
  }
  
  const band = getScoreBand(score);
  if (!band || band.id === 'unknown') {
    return 'var(--saass-bg)';
  }
  
  return `var(--saass-${band.id})`;
}

/**
 * Get heatmap cell text color for a score
 */
export function getHeatmapTextColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return 'var(--saass-muted)';
  }
  
  const band = getScoreBand(score);
  if (!band) {
    return '#6B7280';
  }
  
  return band.textColor;
}
