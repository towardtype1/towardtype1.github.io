import { ENERGY_DATA } from '../data/energy';

const YEAR_SECONDS = 365.25 * 24 * 3600;
const YEAR_MS = YEAR_SECONDS * 1000;

export function currentPowerWatts(now: Date): number {
  const baseWatts = (ENERGY_DATA.annualEJ * 1e18) / YEAR_SECONDS;
  const years = (now.getTime() - ENERGY_DATA.dataYearMidUtc) / YEAR_MS;
  return baseWatts * Math.pow(1 + ENERGY_DATA.growthPerYear, years);
}

export function joulesToday(now: Date): number {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return (currentPowerWatts(now) * (now.getTime() - midnight.getTime())) / 1000;
}

export function kardashev(watts: number): number {
  return (Math.log10(watts) - 6) / 10;
}
