export function memoNumbers(entries: { id: string; date: Date }[]): Map<string, string> {
  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.id.localeCompare(b.id),
  );
  const countPerYear = new Map<number, number>();
  const memos = new Map<string, string>();
  for (const entry of sorted) {
    const year = entry.date.getUTCFullYear();
    const n = (countPerYear.get(year) ?? 0) + 1;
    countPerYear.set(year, n);
    memos.set(entry.id, `TT1-${year}-${String(n).padStart(3, '0')}`);
  }
  return memos;
}
