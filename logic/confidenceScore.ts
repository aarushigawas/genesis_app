// logic/budget/confidenceScore.ts
export function getConfidenceScore(sampleSize: number) {
  if (sampleSize >= 6) return 'high';
  if (sampleSize >= 3) return 'medium';
  return 'low';
}
