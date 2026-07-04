import { describe, expect, it } from 'vitest';
import { COMPUTE_DATA } from '../data/compute';
import { TYPE1_WATTS } from './energy';
import {
  computeProgress,
  currentAiFlops,
  flopToday,
  sciParts,
  type1ComputeEtaYear,
  type1ComputeFlops,
} from './compute';

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

describe('type1ComputeFlops', () => {
  it('is the Type 1 energy budget at frontier efficiency', () => {
    expect(type1ComputeFlops()).toBe(TYPE1_WATTS * COMPUTE_DATA.frontierFlopPerJoule);
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
  it('is 1 at the Type 1 compute budget', () => {
    expect(computeProgress(type1ComputeFlops())).toBe(1);
  });
});

describe('type1ComputeEtaYear', () => {
  it('projects the crossing year from the constants', () => {
    const years =
      Math.log(type1ComputeFlops() / COMPUTE_DATA.aiFlopsBase) /
      Math.log(COMPUTE_DATA.growthFactorPerYear);
    const expected = Math.round(new Date(COMPUTE_DATA.anchorUtc).getUTCFullYear() + years);
    expect(type1ComputeEtaYear()).toBe(expected);
  });

  it('lands in a plausible window', () => {
    expect(type1ComputeEtaYear()).toBeGreaterThan(2026);
    expect(type1ComputeEtaYear()).toBeLessThan(2100);
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
