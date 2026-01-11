export function checkBudgetExceeded(
  spent: number,
  limit?: number
) {
  if (limit == null) return false;
  return spent > limit;
}
