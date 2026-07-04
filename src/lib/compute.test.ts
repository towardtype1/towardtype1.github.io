import { describe, expect, it } from 'vitest';
import { COMPUTE_DATA } from '../data/compute';
import {
  brainParityFlops,
  computeProgress,
  currentAiFlops,
  flopToday,
  parityEtaYear,
  sciParts,
} from './compute';

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

describe('brainParityFlops', () => {
  it('is the population times per-brain compute', () => {
    expect(brainParityFlops()).toBe(COMPUTE_DATA.flopsPerBrain * COMPUTE_DATA.population);
  });
});

describe('currentAiFlops', () => {
  it('equals the base at the anchor date', () => {
    expect(currentAiFlops(new Date(COMPUTE_DATA.anchorUtc)) / COMPUTE_DATA.aiFlopsBase).toBeCloseTo(1, 9);
  });

  it('multiplies by the growth factor after one year', () => {
    const oneYearLater = new Date(COMPUTE_DATA.anchorUtc + YEAR_MS);
    expect(currentAiFlops(oneYearLater) / COMPUTE_DATA.aiFlopsBase).toBeCloseTo(
      COMPUTE_DATA.growthFactorPerYear,
      6,
    );
  });
});

describe('flopToday', () => {
  it('is zero at local midnight', () => {
    expect(flopToday(new Date(2026, 6, 4, 0, 0, 0, 0))).toBe(0);
  });
});

describe('computeProgress', () => {
  it('is 1 at brain parity', () => {
    expect(computeProgress(brainParityFlops())).toBe(1);
  });
});

describe('parityEtaYear', () => {
  it('projects the crossing year from the constants', () => {
    const years =
      Math.log(brainParityFlops() / COMPUTE_DATA.aiFlopsBase) /
      Math.log(COMPUTE_DATA.growthFactorPerYear);
    const expected = Math.round(new Date(COMPUTE_DATA.anchorUtc).getUTCFullYear() + years);
    expect(parityEtaYear()).toBe(expected);
  });

  it('lands in a plausible window', () => {
    expect(parityEtaYear()).toBeGreaterThan(2026);
    expect(parityEtaYear()).toBeLessThan(2100);
  });
});

describe('sciParts', () => {
  it('splits a value into mantissa and exponent', () => {
    expect(sciParts(4.32e26)).toEqual({ mantissa: '4.32000', exponent: 26 });
  });

  it('guards values below 1', () => {
    expect(sciParts(0)).toEqual({ mantissa: '0.00000', exponent: 25 });
  });

  it('renormalizes when rounding pushes the mantissa to 10', () => {
    expect(sciParts(9.999999e26)).toEqual({ mantissa: '1.00000', exponent: 27 });
  });
});
