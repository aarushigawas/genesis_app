export interface CategoryInsight {
  category: string;
  changeType: 'increased' | 'decreased' | 'stable';
  speed: 'fast' | 'normal';
  percentChange: number;
}

export function getCategoryInsights(
  current: Record<string, number>,
  previous: Record<string, number>
): CategoryInsight[] {
  const insights: CategoryInsight[] = [];

  Object.keys(current).forEach((cat) => {
    const curr = current[cat] || 0;
    const prev = previous[cat] || 0;

    if (prev === 0 && curr === 0) return;

    const change = prev === 0 ? 100 : ((curr - prev) / prev) * 100;

    insights.push({
      category: cat,
      changeType:
        change > 10 ? 'increased' :
        change < -10 ? 'decreased' :
        'stable',
      speed: curr > prev * 1.5 ? 'fast' : 'normal',
      percentChange: change,
    });
  });

  return insights;
}
