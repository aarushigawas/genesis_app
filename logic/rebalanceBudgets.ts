export function rebalanceBudgets(
  totalBudget: number,
  limits: Record<string, number>,
  lockedCategory: string,
  lockedValue: number
) {
  const remaining = totalBudget - lockedValue;
  const others = Object.keys(limits).filter(c => c !== lockedCategory);

  if (remaining <= 0 || others.length === 0) return limits;

  const perCategory = remaining / others.length;

  const newLimits: Record<string, number> = {
    ...limits,
    [lockedCategory]: lockedValue,
  };

  others.forEach(cat => {
    newLimits[cat] = Math.max(0, perCategory);
  });

  return newLimits;
}
