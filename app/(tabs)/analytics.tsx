// app/(tabs)/analytics.tsx
// ENHANCED with month-wise analytics, motivational confetti, and savings journey

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { auth, db } from '../../src2/firebase/config';

const { width, height } = Dimensions.get('window');

// ============== TYPES ==============
interface MonthData {
  month: string;
  monthLabel: string;
  startingBudget: number;
  totalExpenses: number;
  budgetImpactExpenses: number;
  newBudget: number;
  savingsReduction: number;
  categories: Record<string, number>;
  totalIncome: number;
  isWithinBudget: boolean;
  savingsAffected: boolean;
}

interface UserData {
  monthlyIncome: number;
  monthlyBudget: number;
  currentBankBalance: number;
  savingAmount: number;
  savingDuration: number;
  onboardingMonth?: string;
}

// ============== STAR BACKGROUND ==============
const StarBackground = () => {
  const [stars, setStars] = useState<any[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 150 }, (_, i) => ({
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
        <Circle
          key={star.id}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="url(#starGlow)"
          opacity={star.opacity || star.baseOpacity}
        />
      ))}
    </Svg>
  );
};

// ============== FLOATING FLOWERS ==============
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
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 1 + 0.5,
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
          opacity: flower.baseOpacity + Math.sin(animationRef * flower.pulseSpeed + flower.pulsePhase) * 0.15,
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
        <Animated.Image
          key={flower.id}
          source={require('../../assets/images/flower_money.png')}
          style={{
            position: 'absolute',
            left: flower.x,
            top: flower.y,
            width: flower.size,
            height: flower.size,
            opacity: flower.opacity || flower.baseOpacity,
            transform: [{ rotate: `${flower.rotation}deg` }],
          }}
        />
      ))}
    </View>
  );
};

// ============== CONFETTI ANIMATION ==============
const ConfettiAnimation = () => {
  const [confetti, setConfetti] = useState<any[]>([]);

  useEffect(() => {
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: -20 - Math.random() * 100,
      size: Math.random() * 8 + 4,
      color: ['#FF6B6B', '#4ECDC4', '#95E1D3', '#FFD93D', '#6BCF7F'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 2,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));
    
    setConfetti(pieces);

    let animationRef = 0;
    const animate = () => {
      animationRef += 0.016;
      setConfetti(prevConfetti => 
        prevConfetti.map(piece => {
          let newY = piece.y + piece.speedY;
          let newX = piece.x + piece.speedX;
          
          if (newY > height) {
            newY = -20;
            newX = Math.random() * width;
          }
          
          return {
            ...piece,
            y: newY,
            x: newX,
            rotation: (piece.rotation + piece.rotationSpeed) % 360,
          };
        })
      );
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {confetti.map((piece) => (
        <View
          key={piece.id}
          style={{
            position: 'absolute',
            left: piece.x,
            top: piece.y,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            transform: [{ rotate: `${piece.rotation}deg` }],
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
};

// ============== BOTTOM TAB BAR ==============
const BottomTabBar = ({ activeTab }: { activeTab: string }) => {
  const { theme } = useTheme();
  const scaleAnims = {
    dashboard: useRef(new Animated.Value(1)).current,
    analytics: useRef(new Animated.Value(1)).current,
    settings: useRef(new Animated.Value(1)).current,
    profile: useRef(new Animated.Value(1)).current,
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: '🏠', route: '/(tabs)/dashboard' },
    { id: 'analytics', label: 'Analytics', icon: '📈', route: '/(tabs)/analytics' },
    { id: 'settings', label: 'Settings', icon: '⚙️', route: '/(tabs)/settings' },
    { id: 'profile', label: 'Profile', icon: '👤', route: '/(tabs)/profile' },
  ];

  const handlePressIn = (tabId: string) => {
    Animated.spring(scaleAnims[tabId as keyof typeof scaleAnims], {
      toValue: 0.85,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const handlePressOut = (tabId: string) => {
    Animated.spring(scaleAnims[tabId as keyof typeof scaleAnims], {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.cardBackground, borderTopColor: theme.cardBorder }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={1}
            onPressIn={() => handlePressIn(tab.id)}
            onPressOut={() => handlePressOut(tab.id)}
            onPress={() => router.push(tab.route as any)}
            style={styles.tabButton}
          >
            <Animated.View
              style={[
                styles.tabContent,
                { transform: [{ scale: scaleAnims[tab.id as keyof typeof scaleAnims] }] },
              ]}
            >
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.accent[0] }]} />
              )}
              <Text style={[styles.tabIcon, { fontSize: 24 }]}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.accent[0] : theme.secondaryText },
                ]}
              >
                {tab.label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============== ANIMATED CARD ==============
const AnimatedCard = ({ children, style }: any) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[
        styles.glassCard, 
        style, 
        { 
          transform: [{ scale: scaleAnim }],
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        }
      ]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ============== MAIN COMPONENT ==============
export default function Analytics() {
  const { theme, isDark, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // ============== FETCH DATA ==============
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user data
      const userRef = doc(db, 'userOnboardingData', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData({
          monthlyIncome: data.monthlyIncome || 0,
          monthlyBudget: data.monthlyBudget || 0,
          currentBankBalance: data.currentBankBalance || 0,
          savingAmount: data.savingAmount || 0,
          savingDuration: data.savingDuration || 0,
          onboardingMonth: data.onboardingMonth || new Date().toISOString().substring(0, 7),
        });
      }

      // Fetch all months
      const monthsRef = collection(db, 'userBudgets', user.uid, 'months');
      const monthsSnap = await getDocs(monthsRef);
      
      const months: MonthData[] = [];
      
      monthsSnap.forEach((doc) => {
        const data = doc.data();
        const [year, monthNum] = doc.id.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthLabel = date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });

        months.push({
          month: doc.id,
          monthLabel,
          startingBudget: data.startingBudget || 0,
          totalExpenses: data.totalExpenses || 0,
          budgetImpactExpenses: data.budgetImpactExpenses || 0,
          newBudget: data.newBudget || 0,
          savingsReduction: data.savingsReduction || 0,
          categories: data.categories || {},
          totalIncome: data.totalIncome || 0,
          isWithinBudget: (data.savingsReduction || 0) === 0,
          savingsAffected: (data.savingsReduction || 0) > 0,
        });
      });

      // Sort by date descending
      months.sort((a, b) => b.month.localeCompare(a.month));

      setMonthsData(months);
      
      // Set current month as selected
      const currentMonth = new Date().toISOString().substring(0, 7);
      setSelectedMonth(currentMonth);

      // Check if current month should show confetti
      const currentMonthData = months.find(m => m.month === currentMonth);
      if (currentMonthData && !currentMonthData.savingsAffected) {
        setShowConfetti(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
    }
  };

  // ============== SELECTED MONTH DATA ==============
  const selectedMonthData = monthsData.find(m => m.month === selectedMonth);

  // ============== SAVINGS JOURNEY MONTHS ==============
  const getSavingsJourneyMonths = (): string[] => {
    if (!userData?.onboardingMonth || !userData?.savingDuration) return [];
    
    const months: string[] = [];
    const [startYear, startMonth] = userData.onboardingMonth.split('-').map(Number);
    
    for (let i = 0; i < userData.savingDuration; i++) {
      const date = new Date(startYear, startMonth - 1 + i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
    }
    
    return months;
  };

  const savingsJourneyMonths = getSavingsJourneyMonths();

  // ============== CATEGORY COLORS ==============
  const CATEGORY_COLORS: Record<string, string> = {
    Food: '#FF6B6B',
    Shopping: '#4ECDC4',
    Groceries: '#95E1D3',
    Rent: '#F38181',
    Travel: '#AA96DA',
    Transport: '#FCBAD3',
    Utilities: '#FFD3B6',
    Subscriptions: '#A8D8EA',
    Healthcare: '#FF8B94',
    Education: '#FFD3B6',
    Transfers: '#DCEDC1',
    Income: '#30D158',
    Gifts: '#FFA8A8',
    Other: '#8E8E93',
  };

  // ============== RENDER ==============
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <LinearGradient
          colors={theme.background}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={theme.backgroundLocations}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primaryText }]}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />
      
      <LinearGradient
        colors={theme.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={theme.backgroundLocations}
      />
      
      {isDark ? <StarBackground /> : <FloatingFlowers />}
      {showConfetti && <ConfettiAnimation />}

      {/* Theme Toggle Button */}
      <TouchableOpacity 
        style={styles.themeToggle}
        onPress={toggleTheme}
      >
        <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.primaryText }]}>Analytics</Text>
          <Text style={[styles.pageSubtitle, { color: theme.secondaryText }]}>
            Your financial journey
          </Text>
        </View>

        {/* MONTH SELECTOR */}
        <AnimatedCard style={{ marginBottom: 20 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowMonthDropdown(!showMonthDropdown)}
          >
            <View style={styles.monthSelectorHeader}>
              <View>
                <Text style={[styles.monthSelectorLabel, { color: theme.secondaryText }]}>
                  Selected Month
                </Text>
                <Text style={[styles.monthSelectorValue, { color: theme.primaryText }]}>
                  {selectedMonthData?.monthLabel || 'Select a month'}
                </Text>
              </View>
              <Text style={{ fontSize: 24 }}>{showMonthDropdown ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {showMonthDropdown && (
            <View style={styles.monthDropdown}>
              {monthsData.map((month) => {
                const isSelected = month.month === selectedMonth;
                const isInJourney = savingsJourneyMonths.includes(month.month);
                
                return (
                  <TouchableOpacity
                    key={month.month}
                    style={[
                      styles.monthOption,
                      isSelected && styles.monthOptionSelected,
                      isInJourney && styles.monthOptionJourney,
                      { borderColor: theme.cardBorder },
                    ]}
                    onPress={() => {
                      setSelectedMonth(month.month);
                      setShowMonthDropdown(false);
                      setShowConfetti(!month.savingsAffected);
                    }}
                  >
                    <View style={styles.monthOptionContent}>
                      <Text style={[
                        styles.monthOptionText,
                        { color: theme.primaryText },
                        isSelected && styles.monthOptionTextSelected,
                      ]}>
                        {month.monthLabel}
                      </Text>
                      {isInJourney && (
                        <View style={styles.journeyBadge}>
                          <Text style={styles.journeyBadgeText}>💰 Saving Goal</Text>
                        </View>
                      )}
                    </View>
                    <View style={[
                      styles.monthStatusDot,
                      { backgroundColor: month.savingsAffected ? '#FF3B30' : '#30D158' }
                    ]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </AnimatedCard>

        {/* MOTIVATIONAL MESSAGE */}
        {selectedMonthData && (
          <AnimatedCard style={{ marginBottom: 20 }}>
            {!selectedMonthData.savingsAffected ? (
              <View style={styles.motivationSuccess}>
                <Text style={styles.motivationIcon}>🎉</Text>
                <Text style={[styles.motivationTitle, { color: theme.primaryText }]}>
                  Amazing Work!
                </Text>
                <Text style={[styles.motivationText, { color: theme.secondaryText }]}>
                  You stayed on track this month. Your savings goal is safe 💚
                </Text>
              </View>
            ) : (
              <View style={styles.motivationWarning}>
                <Text style={styles.motivationIcon}>💡</Text>
                <Text style={[styles.motivationTitle, { color: theme.primaryText }]}>
                  Keep Going
                </Text>
                <Text style={[styles.motivationText, { color: theme.secondaryText }]}>
                  This month affected your savings by ₹{selectedMonthData.savingsReduction.toFixed(2)}. 
                  Small adjustments can help you get back on track.
                </Text>
              </View>
            )}
          </AnimatedCard>
        )}

        {/* MONTHLY OVERVIEW CARD */}
        <AnimatedCard style={{ marginBottom: 20 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/transactions/months' as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={[styles.cardTitle, { color: theme.primaryText }]}>
                  Monthly Overview
                </Text>
                <Text style={{ color: theme.secondaryText, fontSize: 14 }}>
                  See all your months, transactions & savings
                </Text>
              </View>
              <Text style={{ fontSize: 28 }}>📅</Text>
            </View>
          </TouchableOpacity>
        </AnimatedCard>

        {/* BUDGET SUMMARY */}
        {selectedMonthData && (
          <AnimatedCard style={{ marginBottom: 20 }}>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Budget Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Starting Budget</Text>
              <Text style={[styles.summaryValue, { color: theme.primaryText }]}>
                ₹{selectedMonthData.startingBudget.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>Total Expenses</Text>
              <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>
                -₹{selectedMonthData.budgetImpactExpenses.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.summaryRowTotal]}>
              <Text style={[styles.summaryLabelBold, { color: theme.primaryText }]}>Remaining Budget</Text>
              <Text style={[
                styles.summaryValueBold,
                { color: selectedMonthData.newBudget >= 0 ? '#30D158' : '#FF3B30' }
              ]}>
                ₹{selectedMonthData.newBudget.toFixed(2)}
              </Text>
            </View>
          </AnimatedCard>
        )}

        {/* CATEGORY BREAKDOWN */}
        {selectedMonthData && Object.keys(selectedMonthData.categories).length > 0 && (
          <AnimatedCard style={{ marginBottom: 20 }}>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Category Breakdown</Text>
            
            <View style={styles.chartContainer}>
              {Object.entries(selectedMonthData.categories)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([category, amount], index) => {
                  const maxAmount = Math.max(...Object.values(selectedMonthData.categories));
                  const barHeight = (amount / maxAmount) * 150;
                  
                  return (
                    <View key={index} style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          { 
                            height: barHeight,
                            backgroundColor: CATEGORY_COLORS[category] || '#8E8E93'
                          }
                        ]}
                      />
                      <Text style={[styles.barAmount, { color: theme.secondaryText }]}>
                        ₹{amount.toFixed(0)}
                      </Text>
                      <Text style={[styles.barLabel, { color: theme.secondaryText }]} numberOfLines={1}>
                        {category}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </AnimatedCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomTabBar activeTab="analytics" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontWeight: '500' },
  tabBar: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  tabButton: { flex: 1, alignItems: 'center' },
  tabContent: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  activeIndicator: { 
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  tabIcon: { marginBottom: 4 },
  tabLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100, paddingTop: 60 },
  header: { marginBottom: 24 },
  pageTitle: { fontSize: 42, fontWeight: '200', letterSpacing: 0.8, marginBottom: 8 },
  pageSubtitle: { fontSize: 16, fontWeight: '400' },
  glassCard: { borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1.5 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, letterSpacing: 0.5 },
  
  // Month Selector
  monthSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthSelectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  monthSelectorValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  monthDropdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  monthOptionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  monthOptionJourney: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFD93D',
  },
  monthOptionContent: {
    flex: 1,
  },
  monthOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthOptionTextSelected: {
    fontWeight: '700',
  },
  journeyBadge: {
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  journeyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD93D',
  },
  monthStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  // Motivation
  motivationSuccess: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  motivationWarning: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  motivationIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryLabelBold: {
    fontSize: 17,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValueBold: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  // Chart
  chartContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'flex-end', 
    height: 200, 
    paddingTop: 10 
  },
  barContainer: { 
    alignItems: 'center', 
    flex: 1,
    marginHorizontal: 4,
  },
  bar: { 
    width: '100%',
    maxWidth: 40,
    borderRadius: 8, 
    marginBottom: 8 
  },
  barAmount: { 
    fontSize: 11, 
    fontWeight: '600', 
    marginBottom: 4 
  },
  barLabel: { 
    fontSize: 10, 
    fontWeight: '500',
    textAlign: 'center',
  },
  
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  themeToggleIcon: {
    fontSize: 24,
  },
});