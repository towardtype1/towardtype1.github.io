import { describe, expect, it } from 'vitest';
import { TYPE1_WATTS, currentPowerWatts, joulesToday, kardashev, progressToType1 } from './energy';
import { ENERGY_DATA } from '../data/energy';

const YEAR_SECONDS = 365.25 * 24 * 3600;
const baseWatts = (ENERGY_DATA.annualEJ * 1e18) / YEAR_SECONDS;

describe('currentPowerWatts', () => {
  it('equals the base rate at the data-year midpoint', () => {
    expect(currentPowerWatts(new Date(ENERGY_DATA.dataYearMidUtc))).toBeCloseTo(baseWatts, 0);
  });

  it('compounds growth one year later', () => {
    const oneYearLater = new Date(ENERGY_DATA.dataYearMidUtc + YEAR_SECONDS * 1000);
    expect(currentPowerWatts(oneYearLater) / baseWatts).toBeCloseTo(
      1 + ENERGY_DATA.growthPerYear,
      6,
    );
  });

  it('discounts growth for dates before the data year', () => {
    const oneYearEarlier = new Date(ENERGY_DATA.dataYearMidUtc - YEAR_SECONDS * 1000);
    expect(currentPowerWatts(oneYearEarlier) / baseWatts).toBeCloseTo(
      1 / (1 + ENERGY_DATA.growthPerYear),
      6,
    );
  });
});

describe('joulesToday', () => {
  it('is zero at local midnight', () => {
    expect(joulesToday(new Date(2026, 6, 4, 0, 0, 0, 0))).toBe(0);
  });

  it('equals power times seconds elapsed since local midnight', () => {
    const noon = new Date(2026, 6, 4, 12, 0, 0, 0);
    expect(joulesToday(noon)).toBeCloseTo(currentPowerWatts(noon) * 12 * 3600, -9);
  });
});

describe('kardashev', () => {
  it('is 1 at the Type 1 threshold', () => {
    expect(kardashev(1e16)).toBe(1);
  });

  it('matches the hello-world essay value for 2e13 W', () => {
    expect(kardashev(2e13)).toBeCloseTo(0.7301, 4);
  });
});

describe('progressToType1', () => {
  it('is 1 at the Type 1 threshold', () => {
    expect(progressToType1(TYPE1_WATTS)).toBe(1);
  });

  it('is 0.002 at the hello-world essay power', () => {
    expect(progressToType1(2e13)).toBe(0.002);
  });
});
