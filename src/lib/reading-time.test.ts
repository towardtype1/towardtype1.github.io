import { describe, expect, it } from 'vitest';
import { readingTime } from './reading-time';

describe('readingTime', () => {
  it('rounds up at 220 words per minute', () => {
    expect(readingTime('word '.repeat(221))).toBe(2);
  });

  it('never reports less than 1 minute', () => {
    expect(readingTime('short post')).toBe(1);
    expect(readingTime('')).toBe(1);
  });

  it('ignores extra whitespace', () => {
    expect(readingTime('  one   two\n\nthree  ')).toBe(1);
  });
});
