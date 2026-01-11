// logic/budget/predictMonthlySpend.ts
export function predictMonthlySpend(monthTotals: number[]) {
  if (monthTotals.length === 0) return 0;
  return (
    monthTotals.reduce((a, b) => a + b, 0) / monthTotals.length
  );
}
