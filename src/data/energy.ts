// World primary energy consumption. Bump once a year when the new
// Energy Institute Statistical Review is published (each June).
export const ENERGY_DATA = {
  annualEJ: 592, // 2024, Energy Institute Statistical Review of World Energy 2025
  dataYearMidUtc: Date.UTC(2024, 6, 2),
  growthPerYear: 0.02,
  sourceLabel:
    'Est. by extrapolation from Energy Institute Statistical Review 2025 (592 EJ, 2024) at +2%/yr',
} as const;
