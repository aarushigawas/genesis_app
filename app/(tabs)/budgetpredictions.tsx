// app/(tabs)/budgetpredictions.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';

import { Platform } from 'react-native';

const useNativeDriver = Platform.OS !== 'web';

import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { getCategoryInsights } from '../../logic/categoryInsights';
import { checkBudgetExceeded } from '../../logic/checkBudgetExceeded';
import { getConfidenceScore } from '../../logic/confidenceScore';
import { predictCategorySpend } from '../../logic/predictCategorySpend';
import { predictNextMonth } from '../../logic/predictNextMonth';
import { predictRemainingMonth } from '../../logic/predictRemainingMonth';
import { generateSavingTips } from '../../logic/savingTips';
import { auth, db } from '../../src2/firebase/config';

const { width, height } = Dimensions.get('window');

// Types
interface MonthData {
  month: string;
  totalExpenses: number;
  budgetImpactExpenses: number;
  startingBudget: number;
  newBudget: number;
  categories: Record<string, number>;
}

interface UserData {
  monthlyIncome: number;
  monthlyBudget: number;
  savingPercentage: number;
  categories: string[];
}

interface CategoryPrediction {
  category: string;
  spentSoFar: number;
  predictedTotal: number;
  limit?: number;
  willExceed: boolean;
}

// Star Background
const StarBackground = () => {
  const [stars, setStars] = useState<any[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 0.5,
      baseOpacity: Math.random() * 0.6 + 0.2,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 2 + 1,
    }));
    
    setStars(newStars);

    let animationRef = 0;
    const animate = () => {
      animationRef += 0.016;
      setStars(prevStars => 
        prevStars.map(star => ({
          ...star,
          x: (star.x + star.speedX + width) % width,
          y: (star.y + star.speedY + height) % height,
          opacity: star.baseOpacity + Math.sin(animationRef * star.pulseSpeed + star.pulsePhase) * 0.3,
        }))
      );
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="starGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0%" stopColor="#E8B4F8" stopOpacity="1" />
          <Stop offset="40%" stopColor="#D4A4F8" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#E8B4F8" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {stars.map((star) => (
        <Circle key={star.id} cx={star.x} cy={star.y} r={star.size} fill="url(#starGlow)" opacity={star.opacity || star.baseOpacity} />
      ))}
    </Svg>
  );
};

// Floating Flowers
const FloatingFlowers = () => {
  const [flowers, setFlowers] = useState<any[]>([]);

  useEffect(() => {
    const newFlowers = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 30 + 20,
      rotation: Math.random() * 360,
      baseOpacity: Math.random() * 0.25 + 0.1,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    }));
    
    setFlowers(newFlowers);

    let animationRef = 0;
    const animate = () => {
      animationRef += 0.008;
      setFlowers(prevFlowers => 
        prevFlowers.map(flower => ({
          ...flower,
          x: (flower.x + flower.speedX + width) % width,
          y: (flower.y + flower.speedY + height) % height,
          rotation: (flower.rotation + flower.rotationSpeed) % 360,
        }))
      );
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {flowers.map((flower) => (
        <View key={flower.id} style={{ position: 'absolute', left: flower.x, top: flower.y, width: flower.size, height: flower.size, opacity: flower.baseOpacity, transform: [{ rotate: `${flower.rotation}deg` }] }}>
          <Text style={{ fontSize: flower.size }}>🌸</Text>
        </View>
      ))}
    </View>
  );
};

// Animated Card
const AnimatedCard = ({ children, style }: any) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start()}
    >
      <Animated.View style={[styles.glassCard, style, { transform: [{ scale: scaleAnim }], backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Main Component
export default function BudgetPredictions() {
  const { theme, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>({});
  const [currentMonthData, setCurrentMonthData] = useState<MonthData | null>(null);
  const [categoryPredictions, setCategoryPredictions] = useState<CategoryPrediction[]>([]);
  const [savingTips, setSavingTips] = useState<any[]>([]);

  useEffect(() => {
    loadPredictionData();
  }, []);

  const loadPredictionData = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'userOnboardingData', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData({
          monthlyIncome: data.monthlyIncome || 0,
          monthlyBudget: data.monthlyBudget || 0,
          savingPercentage: data.savingPercentage || 0,
          categories: data.categories || [],
        });
      }

      const monthsRef = collection(db, 'userBudgets', user.uid, 'months');
      const monthsSnap = await getDocs(monthsRef);

      const months: MonthData[] = [];
      monthsSnap.forEach((doc) => {
        const data = doc.data();
        months.push({
          month: doc.id,
          totalExpenses: data.totalExpenses || 0,
          budgetImpactExpenses: data.budgetImpactExpenses || 0,
          startingBudget: data.startingBudget || 0,
          newBudget: data.newBudget || 0,
          categories: data.categories || {},
        });
      });

      months.sort((a, b) => b.month.localeCompare(a.month));
      setMonthsData(months);

      const currentMonth = new Date().toISOString().substring(0, 7);
      const currentData = months.find((m) => m.month === currentMonth);
      setCurrentMonthData(currentData || null);

      const rulesRef = doc(db, 'userCategoryRules', user.uid, 'months', currentMonth);
      const rulesSnap = await getDoc(rulesRef);

      if (rulesSnap.exists()) {
        const data = rulesSnap.data();
        setCategoryLimits(data.limits || {});
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading prediction data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData && currentMonthData) {
      calculatePredictions();
      generateTipsData();
    }
  }, [userData, currentMonthData, categoryLimits]);

  const calculatePredictions = () => {
    if (!currentMonthData) return;

    const now = new Date();
    const daysElapsed = now.getDate();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const predictions: CategoryPrediction[] = [];

    Object.entries(currentMonthData.categories).forEach(([category, spent]) => {
      const predicted = predictCategorySpend(spent, daysElapsed, totalDays);
      const limit = categoryLimits[category];
      const willExceed = limit ? checkBudgetExceeded(predicted, limit) : false;

      predictions.push({ category, spentSoFar: spent, predictedTotal: predicted, limit, willExceed });
    });

    predictions.sort((a, b) => b.predictedTotal - a.predictedTotal);
    setCategoryPredictions(predictions);
  };

  const generateTipsData = () => {
    if (!currentMonthData) return;

    const tips: any[] = [];

    Object.entries(currentMonthData.categories).forEach(([category, spent]) => {
      const limit = categoryLimits[category];
      if (limit) {
        const categoryTips = generateSavingTips(category, spent, limit);
        tips.push(...categoryTips.map((t) => ({ ...t, category })));
      }
    });

    if (monthsData.length >= 2) {
      const current = currentMonthData.categories;
      const previous = monthsData[1].categories;
      const insights = getCategoryInsights(current, previous);

      insights.forEach((insight) => {
        if (insight.changeType === 'increased' && insight.percentChange > 20) {
          tips.push({
            tip: `${insight.category} spending increased significantly`,
            reason: `Up ${insight.percentChange.toFixed(0)}% from last month.`,
            category: insight.category,
          });
        }
      });
    }

    setSavingTips(tips.slice(0, 5));
  };

  const getRemainingMonthPrediction = () => {
    if (!currentMonthData || !userData) return null;

    const now = new Date();
    const daysElapsed = now.getDate();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    return predictRemainingMonth(currentMonthData.budgetImpactExpenses, userData.monthlyBudget, daysElapsed, totalDays);
  };

  const getNextMonthPrediction = () => {
    if (!monthsData.length || !userData) return null;

    const pastTotals = monthsData.slice(0, 6).map((m) => m.budgetImpactExpenses);
    const monthlySavings = (userData.monthlyBudget * userData.savingPercentage) / 100;

    return predictNextMonth(pastTotals, userData.monthlyBudget, monthlySavings);
  };

  const remainingPrediction = getRemainingMonthPrediction();
  const nextMonthPrediction = getNextMonthPrediction();
  const confidence = getConfidenceScore(monthsData.length);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <LinearGradient colors={theme.background} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} locations={theme.backgroundLocations} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent[0]} />
          <Text style={[styles.loadingText, { color: theme.primaryText }]}>Analyzing your spending patterns...</Text>
        </View>
      </View>
    );
  }

  if (!userData || !currentMonthData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <LinearGradient colors={theme.background} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} locations={theme.backgroundLocations} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.emptyTitle, { color: theme.primaryText }]}>Not Enough Data Yet</Text>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Track your spending for a month to see predictions</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <LinearGradient colors={theme.background} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} locations={theme.backgroundLocations} />
      {isDark ? <StarBackground /> : <FloatingFlowers />}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.primaryText }]}>Budget Predictions</Text>
          <Text style={[styles.pageSubtitle, { color: theme.secondaryText }]}>Stay in control of your money</Text>
        </View>

        {remainingPrediction && (
          <AnimatedCard style={{ marginBottom: 20 }}>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>📅 Rest of This Month</Text>
            <View style={styles.predictionMainRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.predictionLabel, { color: theme.secondaryText }]}>At your current pace</Text>
                <Text style={[styles.predictionValue, { color: theme.primaryText }]}>₹{remainingPrediction.predictedSpend.toFixed(0)}</Text>
                <Text style={[styles.predictionSubtext, { color: theme.secondaryText }]}>estimated total spend</Text>
              </View>
              {remainingPrediction.willExceed && (
                <View style={styles.warningBadge}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                </View>
              )}
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Budget Remaining</Text>
              <Text style={[styles.summaryValue, { color: remainingPrediction.remainingBudget >= 0 ? '#30D158' : '#FF3B30' }]}>
                ₹{Math.abs(remainingPrediction.remainingBudget).toFixed(0)}
              </Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={[styles.insightText, { color: theme.primaryText }]}>
                {remainingPrediction.willExceed
                  ? '⚠️ You are likely to overspend. Consider slowing down.'
                  : '✅ You are on track to stay within budget!'}
              </Text>
            </View>
          </AnimatedCard>
        )}

        {nextMonthPrediction && (
          <AnimatedCard style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.cardTitle, { color: theme.primaryText, marginBottom: 0 }]}>🔮 Next Month</Text>
              <View style={[styles.confidenceBadge, { backgroundColor: confidence === 'high' ? '#30D158' : confidence === 'medium' ? '#FFD93D' : '#FF6B6B' }]}>
                <Text style={styles.confidenceBadgeText}>{confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low'} Confidence</Text>
              </View>
            </View>
            <Text style={[styles.confidenceExplanation, { color: theme.secondaryText }]}>
              {confidence === 'high' ? 'Based on 6+ months of data' : confidence === 'medium' ? 'Based on 3-5 months of data' : 'Limited data available'}
            </Text>
            <View style={styles.predictionRow}>
              <Text style={[styles.predictionLabel, { color: theme.secondaryText }]}>Expected Spending</Text>
              <Text style={[styles.predictionValue, { color: theme.primaryText }]}>₹{nextMonthPrediction.predictedSpend.toFixed(0)}</Text>
            </View>
            <View style={styles.predictionRow}>
              <Text style={[styles.predictionLabel, { color: theme.secondaryText }]}>Expected Savings</Text>
              <Text style={[styles.predictionValue, { color: nextMonthPrediction.predictedSavings >= 0 ? '#30D158' : '#FF3B30' }]}>
                ₹{Math.abs(nextMonthPrediction.predictedSavings).toFixed(0)}
              </Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={[styles.insightText, { color: theme.primaryText }]}>
                {nextMonthPrediction.willMeetSavingsGoal
                  ? '💚 Your savings goal looks realistic.'
                  : '⚠️ Savings goal might be difficult. Consider adjusting.'}
              </Text>
            </View>
          </AnimatedCard>
        )}

        {categoryPredictions.length > 0 && (
          <AnimatedCard style={{ marginBottom: 20 }}>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>📊 Category Forecasts</Text>
            {categoryPredictions.slice(0, 6).map((pred, index) => (
              <View key={index} style={[styles.categoryRow, index !== 0 && styles.categoryRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.categoryName, { color: theme.primaryText }]}>{pred.category}</Text>
                  <View style={styles.categoryAmounts}>
                    <Text style={[styles.categoryAmount, { color: theme.secondaryText }]}>₹{pred.spentSoFar.toFixed(0)} spent</Text>
                    <Text style={[styles.categoryAmount, { color: theme.secondaryText }]}> → </Text>
                    <Text style={[styles.categoryAmount, { color: pred.willExceed ? '#FF3B30' : theme.primaryText }]}>
                      ₹{pred.predictedTotal.toFixed(0)} predicted
                    </Text>
                  </View>
                  {pred.limit && <Text style={[styles.categoryLimit, { color: theme.tertiaryText }]}>Limit: ₹{pred.limit.toFixed(0)}</Text>}
                </View>
                {pred.willExceed && (
                  <View style={styles.exceedIcon}>
                    <Text>⚠️</Text>
                  </View>
                )}
              </View>
            ))}
          </AnimatedCard>
        )}

        {monthsData.length >= 2 && (
          <AnimatedCard style={{ marginBottom: 20 }}>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>💡 Spending Insights</Text>
            {(() => {
              const current = currentMonthData.categories;
              const previous = monthsData[1].categories;
              const insights = getCategoryInsights(current, previous);

              return insights.slice(0, 4).map((insight, index) => (
                <View key={index} style={[styles.insightRow, index !== 0 && styles.insightRowBorder]}>
                  <Text style={styles.insightEmoji}>
                    {insight.changeType === 'increased' ? '📈' : insight.changeType === 'decreased' ? '📉' : '➖'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insightTitle, { color: theme.primaryText }]}>{insight.category}</Text>
                    <Text style={[styles.insightDescription, { color: theme.secondaryText }]}>
                      {insight.changeType === 'increased'
                        ? `Up ${insight.percentChange.toFixed(0)}% from last month`
                        : insight.changeType === 'decreased'
                        ? `Down ${Math.abs(insight.percentChange).toFixed(0)}% from last month`
                        : 'Spending is stable'}
                    </Text>
                  </View>
                </View>
              ));
            })()}
          </AnimatedCard>
        )}

        {savingTips.length > 0 && (
          <AnimatedCard style={{ marginBottom: 20 }}>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>💰 Money-Saving Tips</Text>
            {savingTips.map((tip, index) => (
              <View key={index} style={[styles.tipRow, index !== 0 && styles.tipRowBorder]}>
                <Text style={styles.tipEmoji}>💡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipTitle, { color: theme.primaryText }]}>{tip.tip}</Text>
                  <Text style={[styles.tipReason, { color: theme.secondaryText }]}>{tip.reason}</Text>
                </View>
              </View>
            ))}
          </AnimatedCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontWeight: '500', marginTop: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100, paddingTop: 60 },
  header: { marginBottom: 24 },
  pageTitle: { fontSize: 42, fontWeight: '200', letterSpacing: 0.8, marginBottom: 8 },
  pageSubtitle: { fontSize: 16, fontWeight: '400' },
  glassCard: { borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1.5 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, letterSpacing: 0.5 },
  predictionMainRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  predictionLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  predictionValue: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  predictionSubtext: { fontSize: 13, fontWeight: '500' },
  warningBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 59, 48, 0.15)', justifyContent: 'center', alignItems: 'center' },
  warningIcon: { fontSize: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summaryLabel: { fontSize: 15, fontWeight: '500' },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  insightBox: { marginTop: 16, padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12 },
  insightText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  confidenceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  confidenceBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  confidenceExplanation: { fontSize: 13, marginBottom: 20 },
  predictionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryRow: { paddingVertical: 16 },
  categoryRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  categoryName: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  categoryAmounts: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  categoryAmount: { fontSize: 13, fontWeight: '500' },
  categoryLimit: { fontSize: 12, fontWeight: '500' },
  exceedIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 59, 48, 0.15)', justifyContent: 'center', alignItems: 'center' },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  insightRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  insightEmoji: { fontSize: 24, marginRight: 12 },
  insightTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  insightDescription: { fontSize: 13, lineHeight: 18 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  tipRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  tipEmoji: { fontSize: 24, marginRight: 12 },
  tipTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tipReason: { fontSize: 13, lineHeight: 18 },
});