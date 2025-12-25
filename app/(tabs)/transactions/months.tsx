// app/transactions/months.tsx
// Timeline-style monthly transaction view - FINAL STANDALONE FILE

import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { auth, db } from '../../../src2/firebase/config';

const { width } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface MonthData {
  month: string;
  monthLabel: string;
  year: number;
  monthName: string;
  startingBudget: number;
  totalExpenses: number;
  budgetImpactExpenses: number;
  newBudget: number;
  savingsReduction: number;
  totalIncome: number;
  categories: Record<string, number>;
}

// ============================================================================
// TIMELINE DECORATIONS
// ============================================================================

const PulseDot = ({ delay = 0 }: { delay?: number }) => {
  const [scale] = useState(new Animated.Value(1));
  const [opacity] = useState(new Animated.Value(1));
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.pulseDot,
        { transform: [{ scale }], opacity }
      ]}
    />
  );
};

// ============================================================================
// FLOATING STARS
// ============================================================================

const FloatingStar = ({ 
  left, 
  top, 
  delay = 0,
  size = 16
}: { 
  left: number; 
  top: number; 
  delay?: number;
  size?: number;
}) => {
  const [translateY] = useState(new Animated.Value(0));
  const [rotate] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(translateY, {
            toValue: -15,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);
  
  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  return (
    <Animated.Text 
      style={[
        styles.floatingStar, 
        { 
          left, 
          top, 
          fontSize: size,
          transform: [{ translateY }, { rotate: rotateInterpolate }] 
        }
      ]}
    >
      ⭐
    </Animated.Text>
  );
};

// ============================================================================
// FETCH MONTH DATA
// ============================================================================

async function fetchMonthlyData(): Promise<MonthData[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  try {
    const monthsRef = collection(db, 'userBudgets', user.uid, 'months');
    const snapshot = await getDocs(monthsRef);
    
    const months: MonthData[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const monthId = doc.id; // YYYY-MM
      const [year, monthNum] = monthId.split('-');
      
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const monthLabel = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      months.push({
        month: monthId,
        monthLabel,
        year: parseInt(year),
        monthName,
        startingBudget: data.startingBudget || 0,
        totalExpenses: data.totalExpenses || 0,
        budgetImpactExpenses: data.budgetImpactExpenses || 0,
        newBudget: data.newBudget || 0,
        savingsReduction: data.savingsReduction || 0,
        totalIncome: data.totalIncome || 0,
        categories: data.categories || {},
      });
    });
    
    // Sort by month (newest first)
    months.sort((a, b) => b.month.localeCompare(a.month));
    
    return months;
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    throw error;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function MonthsScreen() {
  const router = useRouter();
  
  
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState<MonthData[]>([]);
  const [slideAnims] = useState(() => 
    Array(12).fill(0).map(() => new Animated.Value(-50))
  );
  const [opacityAnims] = useState(() => 
    Array(12).fill(0).map(() => new Animated.Value(0))
  );
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMonthlyData();
      setMonths(data);
      setLoading(false);
      
      // Animate timeline items in
      data.forEach((_, index) => {
        Animated.parallel([
          Animated.timing(slideAnims[index], {
            toValue: 0,
            duration: 600,
            delay: index * 150,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnims[index], {
            toValue: 1,
            duration: 600,
            delay: index * 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };
  
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  const getHealthColor = (newBudget: number, startingBudget: number) => {
    const percentage = (newBudget / startingBudget) * 100;
    if (percentage > 50) return '#30D158';
    if (percentage > 20) return '#FF9500';
    return '#FF3B30';
  };
  
  const getHealthEmoji = (newBudget: number, startingBudget: number) => {
    const percentage = (newBudget / startingBudget) * 100;
    if (percentage > 50) return '🌟';
    if (percentage > 20) return '⚡';
    return '🔥';
  };
  
  const { theme, isDark } = useTheme();

  const bgColor = isDark ? '#0A0A0A' : '#F5F5F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const textSecondary = isDark ? '#8E8E93' : '#6E6E73';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const timelineColor = isDark ? '#2C2C2E' : '#D1D1D6';
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={textPrimary} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            Loading timeline...
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Background Stars */}
      <FloatingStar left={30} top={120} delay={0} size={20} />
      <FloatingStar left={width - 50} top={180} delay={400} size={16} />
      <FloatingStar left={60} top={350} delay={800} size={18} />
      <FloatingStar left={width - 70} top={450} delay={1200} size={14} />
      <FloatingStar left={width / 2 - 20} top={250} delay={600} size={22} />
      <FloatingStar left={100} top={600} delay={1000} size={16} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: textPrimary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: textPrimary }]}>Monthly Timeline</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Your financial story, month by month
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {months.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No Timeline Yet</Text>
            <Text style={[styles.emptyDescription, { color: textSecondary }]}>
              Your monthly journey will appear here as you track expenses
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {/* Timeline Line */}
            <View style={[styles.timelineLine, { backgroundColor: timelineColor }]} />
            
            {months.map((monthData, index) => {
              const isCurrentMonth = monthData.month === currentMonth;
              const healthColor = getHealthColor(monthData.newBudget, monthData.startingBudget);
              const healthEmoji = getHealthEmoji(monthData.newBudget, monthData.startingBudget);
              
              const budgetPercentage = monthData.startingBudget > 0
                ? ((monthData.newBudget / monthData.startingBudget) * 100)
                : 0;
              
              const topCategory = Object.entries(monthData.categories)
                .sort((a, b) => b[1] - a[1])[0];
              
              const isLeft = index % 2 === 0;
              
              return (
                <Animated.View
                  key={monthData.month}
                  style={[
                    styles.timelineItem,
                    isLeft ? styles.timelineItemLeft : styles.timelineItemRight,
                    {
                      transform: [{ translateX: slideAnims[index] }],
                      opacity: opacityAnims[index],
                    },
                  ]}
                >
                  {/* Timeline Dot */}
                  <View style={styles.timelineDotContainer}>
                    <View style={[
                      styles.timelineDot, 
                      { 
                        backgroundColor: healthColor,
                        borderColor: bgColor,
                      }
                    ]}>
                      <Text style={styles.timelineDotText}>{healthEmoji}</Text>
                    </View>
                    {isCurrentMonth && <PulseDot delay={0} />}
                  </View>
                  
                  {/* Month Card */}
                  <View
                    style={[
                      styles.monthCard,
                      { backgroundColor: cardBg, borderColor: borderColor },
                      isCurrentMonth && { borderColor: '#30D158', borderWidth: 2 },
                    ]}
                  >
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={[styles.monthText, { color: textPrimary }]}>
                          {monthData.monthName}
                        </Text>
                        <Text style={[styles.yearText, { color: textSecondary }]}>
                          {monthData.year}
                        </Text>
                      </View>
                      
                      {isCurrentMonth && (
                        <View style={styles.liveBadge}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>LIVE</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Budget Bar */}
                    <View style={styles.budgetBar}>
                      <View style={[styles.budgetBarBg, { backgroundColor: borderColor }]}>
                        <View 
                          style={[
                            styles.budgetBarFill,
                            { 
                              width: `${Math.max(0, Math.min(100, budgetPercentage))}%`,
                              backgroundColor: healthColor,
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.budgetPercentageText, { color: textSecondary }]}>
                        {budgetPercentage.toFixed(0)}% left
                      </Text>
                    </View>
                    
                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                      <View style={[styles.statBox, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }]}>
                        <Text style={[styles.statLabel, { color: textSecondary }]}>Budget</Text>
                        <Text style={[styles.statValue, { color: healthColor }]}>
                          ₹{monthData.newBudget.toFixed(0)}
                        </Text>
                      </View>
                      
                      <View style={[styles.statBox, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }]}>
                        <Text style={[styles.statLabel, { color: textSecondary }]}>Spent</Text>
                        <Text style={[styles.statValue, { color: textPrimary }]}>
                          ₹{monthData.budgetImpactExpenses.toFixed(0)}
                        </Text>
                      </View>
                      
                      {monthData.totalIncome > 0 && (
                        <View style={[styles.statBox, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }]}>
                          <Text style={[styles.statLabel, { color: textSecondary }]}>Income</Text>
                          <Text style={[styles.statValue, { color: '#30D158' }]}>
                            ₹{monthData.totalIncome.toFixed(0)}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Top Category */}
                    {topCategory && (
                      <View style={[styles.topCategoryRow, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }]}>
                        <Text style={[styles.topCategoryLabel, { color: textSecondary }]}>
                          Top: {topCategory[0]}
                        </Text>
                        <Text style={[styles.topCategoryAmount, { color: textPrimary }]}>
                          ₹{topCategory[1].toFixed(0)}
                        </Text>
                      </View>
                    )}
                    
                    {/* Warning if over budget */}
                    {monthData.newBudget < 0 && (
                      <View style={styles.warningTag}>
                        <Text style={styles.warningTagText}>
                          🔴 Over by ₹{Math.abs(monthData.newBudget).toFixed(0)}
                        </Text>
                      </View>
                    )}
                    
                    {/* Savings Reduction */}
                    {monthData.savingsReduction > 0 && (
                      <View style={styles.savingsTag}>
                        <Text style={styles.savingsTagText}>
                          💰 Savings used: ₹{monthData.savingsReduction.toFixed(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
            
            {/* Timeline End */}
            <View style={styles.timelineEnd}>
              <Text style={[styles.timelineEndText, { color: textSecondary }]}>
                🎯 Journey Start
              </Text>
            </View>
          </View>
        )}
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Decorations
  floatingStar: {
    position: 'absolute',
    opacity: 0.7,
    zIndex: 1,
  },
  pulseDot: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#30D158',
    opacity: 0.3,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  
  // Header
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
  },
  
  // Scroll
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  
  // Timeline
  timeline: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
  },
  
  // Timeline Item
  timelineItem: {
    position: 'relative',
    marginBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineItemLeft: {
    paddingRight: '52%',
  },
  timelineItemRight: {
    paddingLeft: '52%',
    flexDirection: 'row-reverse',
  },
  
  // Timeline Dot
  timelineDotContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -20,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    zIndex: 2,
  },
  timelineDotText: {
    fontSize: 18,
  },
  
  // Month Card
  monthCard: {
    borderRadius: 16,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1f14',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  liveText: {
    color: '#30D158',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Budget Bar
  budgetBar: {
    marginBottom: 16,
  },
  budgetBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Top Category
  topCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  topCategoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  topCategoryAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Warning Tag
  warningTag: {
    backgroundColor: '#2a1f1f',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  warningTagText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Savings Tag
  savingsTag: {
    backgroundColor: '#1f2a2a',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  savingsTagText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Timeline End
  timelineEnd: {
    alignItems: 'center',
    paddingTop: 20,
  },
  timelineEndText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Bottom Spacer
  bottomSpacer: {
    height: 60,
  },
});