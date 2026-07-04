// Global AI compute stock. Bump AI_FLOPS_BASE, ANCHOR_YEAR, and
// GROWTH_FACTOR_PER_YEAR when Epoch AI publishes updated estimates.
const AI_FLOPS_BASE = 1.5e22; // FLOP/s, ~15M H100-equivalents installed (Epoch AI, Jan 2026) at ~1e15 FLOP/s dense FP16 per H100
const ANCHOR_YEAR = 2026;
const GROWTH_FACTOR_PER_YEAR = 3.3; // Epoch AI: aggregate AI compute stock growth since 2022
const FRONTIER_FLOP_PER_JOULE = 1.4e12; // NVIDIA H100 dense FP16 (Epoch AI); keep the caption's ¹² superscript in sync

export const COMPUTE_DATA = {
  aiFlopsBase: AI_FLOPS_BASE,
  anchorUtc: Date.UTC(ANCHOR_YEAR, 6, 2), // July 2 (month is 0-indexed)
  growthFactorPerYear: GROWTH_FACTOR_PER_YEAR,
  frontierFlopPerJoule: FRONTIER_FLOP_PER_JOULE,
  sourceLabel: `Est. global AI compute stock per Epoch AI (${ANCHOR_YEAR}) at ~${GROWTH_FACTOR_PER_YEAR}x/yr · Type 1 budget = 10¹⁶ W at frontier efficiency ~10¹² FLOP/J`,
} as const;
