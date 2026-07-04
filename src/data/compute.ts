// Global AI compute stock. Bump AI_FLOPS_BASE, ANCHOR_YEAR, and
// GROWTH_FACTOR_PER_YEAR when Epoch AI publishes updated estimates.
// Bump POPULATION when it drifts meaningfully.
const AI_FLOPS_BASE = 1.5e22; // FLOP/s, global AI compute stock in ANCHOR_YEAR (Epoch AI, ~15M H100e, dense FP16 basis)
const ANCHOR_YEAR = 2026;
const GROWTH_FACTOR_PER_YEAR = 3.3;
const FLOPS_PER_BRAIN = 1e15; // Carlsmith (Open Philanthropy, 2020) median estimate
const POPULATION = 8.2e9; // world population, 2026

const SUP_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n: number) => String(n).split('').map((d) => SUP_DIGITS[Number(d)]).join('');
const BRAIN_EXP = Math.floor(Math.log10(FLOPS_PER_BRAIN));

export const COMPUTE_DATA = {
  aiFlopsBase: AI_FLOPS_BASE,
  anchorUtc: Date.UTC(ANCHOR_YEAR, 6, 2), // July 2 (month is 0-indexed)
  growthFactorPerYear: GROWTH_FACTOR_PER_YEAR,
  flopsPerBrain: FLOPS_PER_BRAIN,
  population: POPULATION,
  sourceLabel: `Est. global AI compute stock per Epoch AI (${ANCHOR_YEAR}) at ~${GROWTH_FACTOR_PER_YEAR}x/yr · brain ≈ 10${sup(BRAIN_EXP)} FLOP/s (Carlsmith 2020) × ${(POPULATION / 1e9).toFixed(1)}B people`,
} as const;
