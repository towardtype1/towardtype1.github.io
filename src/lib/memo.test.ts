import { describe, expect, it } from 'vitest';
import { memoNumbers } from './memo';

describe('memoNumbers', () => {
  it('numbers essays in date order within a year, zero-padded', () => {
    const memos = memoNumbers([
      { id: 'second', date: new Date('2026-08-01') },
      { id: 'first', date: new Date('2026-07-04') },
    ]);
    expect(memos.get('first')).toBe('TT1-2026-001');
    expect(memos.get('second')).toBe('TT1-2026-002');
  });

  it('restarts numbering each year', () => {
    const memos = memoNumbers([
      { id: 'old', date: new Date('2026-12-31') },
      { id: 'new', date: new Date('2027-01-01') },
    ]);
    expect(memos.get('old')).toBe('TT1-2026-001');
    expect(memos.get('new')).toBe('TT1-2027-001');
  });

  it('breaks same-date ties deterministically by id', () => {
    const memos = memoNumbers([
      { id: 'b-post', date: new Date('2026-07-04') },
      { id: 'a-post', date: new Date('2026-07-04') },
    ]);
    expect(memos.get('a-post')).toBe('TT1-2026-001');
    expect(memos.get('b-post')).toBe('TT1-2026-002');
  });
});
