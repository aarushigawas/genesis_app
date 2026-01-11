import { setCategoryRules, updateCategoryLimit } from '../src2/firebase/categoryRules';
import { rebalanceBudgets } from './rebalanceBudgets';

export async function setCategoryLimit(
  userId: string,
  month: string,
  category: string,
  value: number,
  existingLimits: Record<string, number>,
  totalBudget: number,
  shouldRebalance: boolean
) {
  if (!shouldRebalance) {
    return updateCategoryLimit(userId, month, category, value);
  }

  const newLimits = rebalanceBudgets(
    totalBudget,
    existingLimits,
    category,
    value
  );

  return setCategoryRules(userId, month, {
    limits: newLimits,
    autoRebalance: true,
  });
}
