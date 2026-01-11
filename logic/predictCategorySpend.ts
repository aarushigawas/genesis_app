// logic/budget/predictCategorySpend.ts
export function predictCategorySpend(
  spentSoFar: number,
  daysElapsed: number,
  totalDays: number
) {
  if (daysElapsed === 0) return 0;
  return (spentSoFar / daysElapsed) * totalDays;
}
