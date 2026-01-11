export function predictRemainingMonth(
  spentSoFar: number,
  totalBudget: number,
  daysElapsed: number,
  totalDays: number
) {
  if (daysElapsed === 0) {
    return {
      predictedSpend: spentSoFar,
      willExceed: false,
      remainingBudget: totalBudget - spentSoFar,
    };
  }

  const predictedTotal = (spentSoFar / daysElapsed) * totalDays;
  const remainingBudget = totalBudget - predictedTotal;

  return {
    predictedSpend: predictedTotal,
    willExceed: predictedTotal > totalBudget,
    remainingBudget,
  };
}
