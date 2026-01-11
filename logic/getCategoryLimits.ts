// logic/getCategoryLimits.ts
import { getCategoryRules } from '../src2/firebase/categoryRules';

export interface CategoryLimits {
  limits: Record<string, number>;
  autoRebalance?: boolean;
}

/**
 * Fetch category limits for a given user + month.
 * This is READ-ONLY and safe to call from UI.
 */
export async function getCategoryLimits(
  userId: string,
  month: string
): Promise<CategoryLimits | null> {
  const data = await getCategoryRules(userId, month);

  if (!data || !data.limits) {
    return null;
  }

  return {
    limits: data.limits as Record<string, number>,
    autoRebalance: data.autoRebalance ?? false,
  };
}
