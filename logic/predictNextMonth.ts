export function predictNextMonth(
  pastMonthsTotals: number[],
  monthlyBudget: number,
  monthlySavings: number
) {
  const predictedSpend =
    pastMonthsTotals.length === 0
      ? 0
      : pastMonthsTotals.reduce((a, b) => a + b, 0) /
        pastMonthsTotals.length;

  const predictedSavings = monthlyBudget - predictedSpend;

  return {
    predictedSpend,
    predictedSavings,
    willMeetSavingsGoal: predictedSavings >= monthlySavings,
  };
}
