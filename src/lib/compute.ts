import { COMPUTE_DATA } from '../data/compute';

const YEAR_SECONDS = 365.25 * 24 * 3600;
const YEAR_MS = YEAR_SECONDS * 1000;

export function brainParityFlops(): number {
  return COMPUTE_DATA.flopsPerBrain * COMPUTE_DATA.population;
}

export function currentAiFlops(now: Date): number {
  const years = (now.getTime() - COMPUTE_DATA.anchorUtc) / YEAR_MS;
  return COMPUTE_DATA.aiFlopsBase * Math.pow(COMPUTE_DATA.growthFactorPerYear, years);
}

export function flopToday(now: Date): number {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return (currentAiFlops(now) * (now.getTime() - midnight.getTime())) / 1000;
}

export function computeProgress(flops: number): number {
  return flops / brainParityFlops();
}

export function parityEtaYear(): number {
  const years =
    Math.log(brainParityFlops() / COMPUTE_DATA.aiFlopsBase) /
    Math.log(COMPUTE_DATA.growthFactorPerYear);
  return Math.round(new Date(COMPUTE_DATA.anchorUtc).getUTCFullYear() + years);
}

export function sciParts(value: number): { mantissa: string; exponent: number } {
  if (value < 1) return { mantissa: '0.00000', exponent: 25 };
  let exponent = Math.floor(Math.log10(value));
  let mantissa = (value / Math.pow(10, exponent)).toFixed(5);
  if (mantissa === '10.00000') {
    exponent += 1;
    mantissa = '1.00000';
  }
  return { mantissa, exponent };
}
