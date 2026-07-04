// World primary energy consumption. Bump ANNUAL_EJ, REVIEW_YEAR, DATA_YEAR,
// and GROWTH_PER_YEAR once a year when the new Energy Institute Statistical
// Review is published (each June).
const ANNUAL_EJ = 592; // world primary energy in DATA_YEAR
const REVIEW_YEAR = 2025;
const DATA_YEAR = 2024;
const GROWTH_PER_YEAR = 0.02;

export const ENERGY_DATA = {
  annualEJ: ANNUAL_EJ,
  dataYearMidUtc: Date.UTC(DATA_YEAR, 6, 2), // July 2 (month is 0-indexed)
  growthPerYear: GROWTH_PER_YEAR,
  sourceLabel: `Est. by extrapolation from Energy Institute Statistical Review ${REVIEW_YEAR} (${ANNUAL_EJ} EJ, ${DATA_YEAR}) at +${GROWTH_PER_YEAR * 100}%/yr`,
} as const;
