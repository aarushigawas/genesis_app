// logic/budget/savingTips.ts
interface Tip {
  tip: string;
  reason: string;
}

export function generateSavingTips(
  category: string,
  spent: number,
  limit: number
): Tip[] {
  const tips: Tip[] = [];

  if (limit > 0 && spent > limit) {
    tips.push({
      tip: `Reduce spending in ${category}`,
      reason: `You exceeded your ${category} budget by ₹${(spent - limit).toFixed(0)}.`,
    });
  }

  if (spent > limit * 0.8) {
    tips.push({
      tip: `Be cautious in ${category}`,
      reason: `You’ve already used over 80% of your ${category} budget.`,
    });
  }

  return tips;
}
