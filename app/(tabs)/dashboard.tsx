// app/(tabs)/dashboard.tsx - COMPLETE WITH REAL FIRESTORE DATA

import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Circle, Defs, Stop, Svg, RadialGradient as SvgRadialGradient } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from '../../src2/firebase/config';

const { width, height } = Dimensions.get('window');

// ============== INTERFACES ==============

interface SavingPurpose {
  text: string;
  type: string;
}

interface SavingDuration {
  unit: string;
  value: number;
}

interface UserData {
  name?: string;
  monthlyIncome?: number;
  monthlyBudget?: number;
  savingPercentage?: number;
  hasSavingGoal?: boolean;
  categories?: string[];
  savingPurpose?: SavingPurpose | null;
  savingDuration?: SavingDuration | null;
  notificationPreference?: string;
}

interface Transaction {
  id: string;
  uid: string;
  amount: number;
  merchantName: string;
  category: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  affectsBudget: boolean;
  source: string;
  month: string;
  year: number;
  confidence?: number;
  rawText?: string;
}

interface CategorySpending {
  name: string;
  amount: number;
  percentage: number;
  transactions: number;
  icon: string;
}

// ============== STAR BACKGROUND (DARK MODE) ==============

const DreamyStarBackground = () => {
  const [stars, setStars] = useState<any[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 0.5,
      baseOpacity: Math.random() * 0.6 + 0.2,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
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
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgRadialGradient id="starGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0%" stopColor="#E8B4F8" stopOpacity="1" />
            <Stop offset="40%" stopColor="#D4A4F8" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#E8B4F8" stopOpacity="0" />
          </SvgRadialGradient>
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
    </View>
  );
};

// ============== FLOATING FLOWERS (LIGHT MODE) ==============

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
        <View
          key={flower.id}
          style={{
            position: 'absolute',
            left: flower.x,
            top: flower.y,
            width: flower.size,
            height: flower.size,
            opacity: flower.baseOpacity,
            transform: [{ rotate: `${flower.rotation}deg` }],
          }}
        >
          <Text style={{ fontSize: flower.size }}>🌸</Text>
        </View>
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
    transactions: useRef(new Animated.Value(1)).current,
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: '🏠', route: '/(tabs)/dashboard' },
    { id: 'transactions', label: 'Transactions', icon: '💳', route: '/(tabs)/transactions' },
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

// ============== MAIN DASHBOARD COMPONENT ==============

export default function Dashboard() {
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // Fetch data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedMonth])
  );

  const fetchData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      const uid = currentUser.uid;

      // Fetch user data from both collections
      const [userDocSnap, onboardingDocSnap] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDoc(doc(db, "userOnboardingData", uid))
      ]);

      const mergedData: UserData = {
        ...(userDocSnap.exists() ? userDocSnap.data() : {}),
        ...(onboardingDocSnap.exists() ? onboardingDocSnap.data() : {})
      };

      setUserData(mergedData);

      // Fetch transactions for selected month
      const transactionsRef = collection(db, "transactions", uid, "items");
      const q = query(transactionsRef, where("month", "==", selectedMonth));
      
      const querySnapshot = await getDocs(q);
      const fetchedTransactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });

      // Sort by date descending
      fetchedTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Calculate spending statistics
  const calculateStats = () => {
    const budgetAffectingTransactions = transactions.filter(t => t.affectsBudget);
    const totalSpent = budgetAffectingTransactions.reduce((sum, t) => {
      return t.type === 'expense' ? sum + t.amount : sum;
    }, 0);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransfers = transactions
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalSpent, totalIncome, totalTransfers };
  };

  const { totalSpent, totalIncome, totalTransfers } = calculateStats();

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={theme.background}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={theme.backgroundLocations}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent[0]} />
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
            Loading your data...
          </Text>
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
      
      {isDark ? <DreamyStarBackground /> : <FloatingFlowers />}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent[0]}
          />
        }
      >
        {/* Header with Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.secondaryText }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: theme.primaryText }]}>
              {userData?.name || 'Welcome'}
            </Text>
          </View>
        </View>

        {/* Month Selector */}
        <MonthSelector 
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        {/* 1. Quote Box */}
        <QuoteBox savingPurpose={userData?.savingPurpose} />

        {/* 2. Airplane Progress */}
        <AirplaneProgress 
          savingPercentage={userData?.savingPercentage}
          monthlyBudget={userData?.monthlyBudget}
          savingDuration={userData?.savingDuration}
          totalSpent={totalSpent}
        />

        {/* 3. Circular Progress + Categories */}
        <ProgressWithCategories 
          savingPercentage={userData?.savingPercentage}
          monthlyBudget={userData?.monthlyBudget}
          savingDuration={userData?.savingDuration}
          categories={userData?.categories || []}
          transactions={transactions}
        />

        {/* 4. Month Progress + Calendar */}
        <MonthCalendarSection 
          savingDuration={userData?.savingDuration}
          monthlyBudget={userData?.monthlyBudget}
          totalSpent={totalSpent}
          selectedMonth={selectedMonth}
        />

        {/* 5. SMS and CSV Import */}
        <ImportBoxes />

        {/* 6. Categories Breakdown */}
        <CategoriesBreakdown 
          categories={userData?.categories || []} 
          transactions={transactions}
          monthlyBudget={userData?.monthlyBudget}
        />

        {/* 7. Recent Transactions */}
        <RecentTransactionsSection transactions={transactions} />

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeTab="dashboard" />
    </View>
  );
}

// ============== HELPER FUNCTION ==============

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ============== MONTH SELECTOR ==============

const MonthSelector = ({ selectedMonth, onMonthChange }: { 
  selectedMonth: string; 
  onMonthChange: (month: string) => void;
}) => {
  const { theme, isDark } = useTheme();
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [year, month] = selectedMonth.split('-');
  const monthIndex = parseInt(month) - 1;
  const monthName = months[monthIndex];

  const changeMonth = (direction: 'prev' | 'next') => {
    const date = new Date(parseInt(year), monthIndex, 1);
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonth);
  };

  return (
    <View style={styles.monthSelectorContainer}>
      <TouchableOpacity
        onPress={() => changeMonth('prev')}
        style={[styles.monthArrow, { backgroundColor: isDark ? 'rgba(232, 180, 248, 0.15)' : 'rgba(212, 165, 165, 0.2)' }]}
      >
        <Text style={[styles.monthArrowText, { color: theme.accent[0] }]}>←</Text>
      </TouchableOpacity>

      <View style={[styles.monthDisplay, { backgroundColor: isDark ? 'rgba(232, 180, 248, 0.2)' : 'rgba(212, 165, 165, 0.25)' }]}>
        <Text style={[styles.monthText, { color: theme.primaryText }]}>
          {monthName} {year}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => changeMonth('next')}
        style={[styles.monthArrow, { backgroundColor: isDark ? 'rgba(232, 180, 248, 0.15)' : 'rgba(212, 165, 165, 0.2)' }]}
      >
        <Text style={[styles.monthArrowText, { color: theme.accent[0] }]}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============== 1. QUOTE BOX ==============

const QuoteBox = ({ savingPurpose }: { savingPurpose?: SavingPurpose | null }) => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getQuote = () => {
    const purposeType = savingPurpose?.type?.toLowerCase() || '';
    
    if (purposeType.includes('travel')) {
      return "Every rupee saved is a step towards freedom";
    } else if (purposeType.includes('emergency')) {
      return "Building your safety net, one day at a time";
    } else if (purposeType.includes('education')) {
      return "Invest in yourself, the returns are infinite";
    } else {
      return "Everyday you reach closer to your goal";
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <LinearGradient
        colors={isDark 
          ? ['rgba(232, 180, 248, 0.25)', 'rgba(180, 164, 248, 0.15)']
          : ['rgba(212, 165, 165, 0.30)', 'rgba(196, 154, 154, 0.18)']
        }
        style={styles.quoteBox}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.quoteLeft}>
          <Text style={{ fontSize: 80 }}>😊</Text>
        </View>
        <View style={styles.quoteRight}>
          <Text style={[styles.quoteText, { color: theme.primaryText }]}>
            {getQuote()}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ============== 2. AIRPLANE PROGRESS ==============

const AirplaneProgress = ({ 
  savingPercentage, 
  monthlyBudget, 
  savingDuration,
  totalSpent
}: { 
  savingPercentage?: number; 
  monthlyBudget?: number; 
  savingDuration?: SavingDuration | null;
  totalSpent: number;
}) => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const planeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(planeAnim, {
      toValue: 1,
      duration: 2000,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, [totalSpent]);

  const calculateProgress = () => {
    if (!savingPercentage || !monthlyBudget || !savingDuration) {
      return 0;
    }
    
    const clampedPercentage = Math.max(0, Math.min(100, savingPercentage));
    const monthlySavingAmount = (monthlyBudget * clampedPercentage) / 100;
    
    const value = savingDuration.value || 1;
    const unit = savingDuration.unit || 'years';
    const durationInMonths = unit === 'years' ? value * 12 : value;
    
    const targetAmount = durationInMonths * monthlySavingAmount;
    const currentSaved = Math.max(0, (monthlyBudget - totalSpent));
    
    return targetAmount > 0 ? Math.min((currentSaved / targetAmount) * 100, 100) : 0;
  };

  const progress = calculateProgress();
  const planePosition = planeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (width - 80) * (progress / 100)],
  });

  const clampedPercentage = Math.max(0, Math.min(100, savingPercentage || 0));
  const currentSaved = Math.max(0, (monthlyBudget || 0) - totalSpent);
  const remaining = (monthlyBudget || 0) - totalSpent;
  const isOverBudget = remaining < 0;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <LinearGradient
        colors={isDark 
          ? ['rgba(232, 180, 248, 0.2)', 'rgba(180, 164, 248, 0.1)']
          : ['rgba(212, 165, 165, 0.25)', 'rgba(196, 154, 154, 0.12)']
        }
        style={styles.airplaneBox}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.sectionTitle, { color: theme.primaryText, marginBottom: 16 }]}>
          Your Journey
        </Text>
        
        <View style={styles.pathWrapper}>
          <View style={styles.pathLine} />
          <Animated.View style={[
            styles.planeIcon,
            { transform: [{ translateX: planePosition }] }
          ]}>
            <Text style={styles.planeEmoji}>✈️</Text>
          </Animated.View>
        </View>

        <Text style={[styles.progressText, { color: theme.secondaryText }]}>
          You are {progress.toFixed(0)}% close to your destination
        </Text>

        <View style={styles.budgetInfo}>
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: theme.secondaryText }]}>
              Monthly Budget:
            </Text>
            <Text style={[styles.budgetValue, { color: theme.primaryText }]}>
              ₹{monthlyBudget || 0}
            </Text>
          </View>
          
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: theme.secondaryText }]}>
              Total Spent:
            </Text>
            <Text style={[styles.budgetValue, { color: '#F44336' }]}>
              ₹{Math.floor(totalSpent)}
            </Text>
          </View>

          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: theme.secondaryText }]}>
              Amount Saved:
            </Text>
            <Text style={[styles.budgetValue, { color: '#4CAF50' }]}>
              ₹{Math.floor(currentSaved)}
            </Text>
          </View>

          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: theme.secondaryText }]}>
              {isOverBudget ? 'Over Budget:' : 'Remaining:'}
            </Text>
            <Text style={[styles.budgetValue, { color: isOverBudget ? '#F44336' : '#4CAF50' }]}>
              {isOverBudget ? '-' : ''}₹{Math.abs(Math.floor(remaining))}
            </Text>
          </View>
        </View>

        {isOverBudget && (
          <View style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.15)' }]}>
            <Text style={[styles.warningText, { color: '#F44336' }]}>
              ⚠️ You've exceeded your budget this month
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// ============== 3. CIRCULAR PROGRESS + CATEGORIES ==============

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressWithCategories = ({ 
  savingPercentage, 
  monthlyBudget,
  savingDuration,
  categories,
  transactions
}: { 
  savingPercentage?: number; 
  monthlyBudget?: number;
  savingDuration?: SavingDuration | null;
  categories: string[];
  transactions: Transaction[];
}) => {
  const { theme, isDark } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        delay: 600,
        useNativeDriver: false,
      }),
    ]).start();
  }, [transactions]);

  const clampedPercentage = Math.max(0, Math.min(100, savingPercentage || 0));
  const monthlySavingAmount = monthlyBudget ? (monthlyBudget * clampedPercentage) / 100 : 0;
  
  let durationInMonths = 6;
  if (savingDuration) {
    const value = savingDuration.value || 1;
    const unit = savingDuration.unit || 'years';
    durationInMonths = unit === 'years' ? value * 12 : value;
  }
  
  const goalAmount = durationInMonths * monthlySavingAmount;
  const totalSpent = transactions.filter(t => t.affectsBudget && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentSaved = Math.max(0, (monthlyBudget || 0) - totalSpent);
  const percentage = goalAmount > 0 ? Math.min((currentSaved / goalAmount) * 100, 100) : 0;

  const progressRadius = 65;
  const progressStrokeWidth = 10;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const animatedProgress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [progressCircumference, progressCircumference - (percentage / 100) * progressCircumference],
  });

  // Calculate category spending
  const categorySpending = new Map<string, { amount: number; count: number }>();
  transactions.filter(t => t.affectsBudget && t.type === 'expense').forEach(t => {
    const current = categorySpending.get(t.category) || { amount: 0, count: 0 };
    categorySpending.set(t.category, {
      amount: current.amount + t.amount,
      count: current.count + 1
    });
  });

  const totalSpending = Array.from(categorySpending.values()).reduce((sum, cat) => sum + cat.amount, 0);

  const categoryData = categories.map((cat) => {
    const data = categorySpending.get(cat) || { amount: 0, count: 0 };
    return {
      name: cat,
      percentage: totalSpending > 0 ? (data.amount / totalSpending) * 100 : 0,
      icon: getCategoryIcon(cat)
    };
  }).filter(cat => cat.percentage > 0);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <LinearGradient
        colors={isDark 
          ? ['rgba(232, 180, 248, 0.2)', 'rgba(180, 164, 248, 0.1)']
          : ['rgba(212, 165, 165, 0.25)', 'rgba(196, 154, 154, 0.12)']
        }
        style={styles.progressCategoriesBox}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.sectionTitle, { color: theme.primaryText, marginBottom: 20 }]}>
          Savings Progress
        </Text>

        <View style={styles.circularSection}>
          <Svg width={150} height={150}>
            <Circle
              cx="75"
              cy="75"
              r={progressRadius}
              stroke={theme.cardBorder}
              strokeWidth={progressStrokeWidth}
              fill="none"
            />
            <AnimatedCircle
              cx="75"
              cy="75"
              r={progressRadius}
              stroke={isDark ? "#E8B4F8" : "#D4A5A5"}
              strokeWidth={progressStrokeWidth}
              fill="none"
              strokeDasharray={progressCircumference}
              strokeDashoffset={animatedProgress}
              strokeLinecap="round"
              transform="rotate(-90 75 75)"
            />
          </Svg>
          
          <View style={styles.circularTextContainer}>
            <Text style={[styles.savedAmount, { color: theme.primaryText }]}>
              ₹{Math.floor(currentSaved)}
            </Text>
            <Text style={[styles.savedLabel, { color: theme.secondaryText }]}>
              saved
            </Text>
            <Text style={[styles.goalAmount, { color: theme.secondaryText }]}>
              of ₹{Math.floor(goalAmount)}
            </Text>
          </View>
        </View>

        {categoryData.length > 0 && (
          <View>
            <Text style={[styles.categoriesTitle, { color: theme.primaryText }]}>
              Spending by Category
            </Text>

            {categoryData.map((cat, idx) => (
              <View key={idx} style={styles.categoryRow}>
                <View style={styles.categoryIcon}>
                  <Text>{cat.icon}</Text>
                </View>
                <View style={styles.categoryRowContent}>
                  <Text style={[styles.categoryName, { color: theme.primaryText }]}>
                    {cat.name}
                  </Text>
                  <View style={styles.categoryBarContainer}>
                    <View style={[styles.categoryBarBg, { backgroundColor: theme.cardBorder }]}>
                      <View 
                        style={[
                          styles.categoryBarFill, 
                          { 
                            width: `${cat.percentage}%`,
                            backgroundColor: isDark ? '#E8B4F8' : '#D4A5A5'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                  <Text style={[styles.categoryPercent, { color: theme.secondaryText }]}>
                    {cat.percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// Helper function for category icons
const getCategoryIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    Food: '🍔',
    Transport: '🚗',
    Rent: '🏠',
    Subscriptions: '📺',
    Groceries: '🛒',
    Family: '👨‍👩‍👧‍👦',
    Utilities: '💡',
    Fashion: '👗',
    Healthcare: '⚕️',
    Pets: '🐾',
    Sneakers: '👟',
    Gifts: '🎁',
    Shopping: '🛍️',
    Education: '🎓',
    Travel: '✈️',
  };
  return icons[category] || '💰';
};

// ============== 4. MONTH PROGRESS + CALENDAR ==============

const MonthCalendarSection = ({ 
  savingDuration,
  monthlyBudget,
  totalSpent,
  selectedMonth
}: { 
  savingDuration?: SavingDuration | null;
  monthlyBudget?: number;
  totalSpent: number;
  selectedMonth: string;
}) => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const [year, month] = selectedMonth.split('-');
  const currentDate = new Date();
  const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const isCurrentMonth = selectedMonth === getCurrentMonth();
  
  const currentDay = isCurrentMonth ? currentDate.getDate() : 1;
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const daysLeft = isCurrentMonth ? daysInMonth - currentDay : daysInMonth;

  let totalMonths = 6;
  if (savingDuration) {
    const value = savingDuration.value || 1;
    const unit = savingDuration.unit || 'years';
    totalMonths = unit === 'years' ? value * 12 : value;
  }

  const remaining = (monthlyBudget || 0) - totalSpent;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.monthCalendarContainer}>
        {/* Left: Month Progress */}
        <LinearGradient
          colors={isDark 
            ? ['rgba(232, 180, 248, 0.22)', 'rgba(180, 164, 248, 0.12)']
            : ['rgba(212, 165, 165, 0.28)', 'rgba(196, 154, 154, 0.15)']
          }
          style={styles.monthBox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.monthTitle, { color: theme.primaryText }]}>
            Month {Math.min(parseInt(month), totalMonths)} of {totalMonths}
          </Text>
          <View style={styles.monthStats}>
            <Text style={[styles.monthLabel, { color: theme.secondaryText }]}>
              Budget:
            </Text>
            <Text style={[styles.monthValue, { color: theme.primaryText }]}>
              ₹{monthlyBudget || 0}
            </Text>
          </View>
          <View style={styles.monthStats}>
            <Text style={[styles.monthLabel, { color: theme.secondaryText }]}>
              Spent:
            </Text>
            <Text style={[styles.monthValue, { color: '#F44336' }]}>
              ₹{Math.floor(totalSpent)}
            </Text>
          </View>
          <View style={styles.monthStats}>
            <Text style={[styles.monthLabel, { color: theme.secondaryText }]}>
              Remaining:
            </Text>
            <Text style={[styles.monthValue, { color: remaining >= 0 ? '#4CAF50' : '#F44336' }]}>
              ₹{Math.floor(remaining)}
            </Text>
          </View>
        </LinearGradient>

        {/* Right: Calendar */}
        <LinearGradient
          colors={isDark 
            ? ['rgba(232, 180, 248, 0.22)', 'rgba(180, 164, 248, 0.12)']
            : ['rgba(212, 165, 165, 0.28)', 'rgba(196, 154, 154, 0.15)']
          }
          style={styles.calendarBox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.calendarEmoji}>📅</Text>
          <Text style={[styles.calendarDate, { color: theme.primaryText }]}>
            Day {currentDay}
          </Text>
          <Text style={[styles.calendarDaysLeft, { color: theme.secondaryText }]}>
            {daysLeft} days left
          </Text>
          <Text style={[styles.calendarSubtext, { color: theme.secondaryText }]}>
            this month
          </Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// ============== 5. SMS AND CSV IMPORT BOXES ==============

const ImportBoxes = () => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={[styles.sectionTitle, { color: theme.primaryText, marginBottom: 12 }]}>
        Import Transactions
      </Text>
      
      <View style={styles.importContainer}>
        {/* SMS Import */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/parsing/sms' as any)}
          style={styles.importBoxWrapper}
        >
          <LinearGradient
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.25)', 'rgba(180, 164, 248, 0.15)']
              : ['rgba(212, 165, 165, 0.30)', 'rgba(196, 154, 154, 0.18)']
            }
            style={styles.importBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.importEmoji}>💬</Text>
            <Text style={[styles.importTitle, { color: theme.primaryText }]}>
              Copy Paste SMS
            </Text>
            <Text style={[styles.importSubtitle, { color: theme.secondaryText }]}>
              Import from messages
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* CSV Import */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/parsing/csv' as any)}
          style={styles.importBoxWrapper}
        >
          <LinearGradient
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.25)', 'rgba(180, 164, 248, 0.15)']
              : ['rgba(212, 165, 165, 0.30)', 'rgba(196, 154, 154, 0.18)']
            }
            style={styles.importBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.importEmoji}>🏦</Text>
            <Text style={[styles.importTitle, { color: theme.primaryText }]}>
              Bank Statement
            </Text>
            <Text style={[styles.importSubtitle, { color: theme.secondaryText }]}>
              Upload PDF/CSV
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ============== 6. CATEGORIES BREAKDOWN ==============

const CategoriesBreakdown = ({ 
  categories, 
  transactions,
  monthlyBudget
}: { 
  categories: string[]; 
  transactions: Transaction[];
  monthlyBudget?: number;
}) => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Calculate category spending
  const categorySpending = new Map<string, { amount: number; count: number }>();
  transactions.filter(t => t.affectsBudget && t.type === 'expense').forEach(t => {
    const current = categorySpending.get(t.category) || { amount: 0, count: 0 };
    categorySpending.set(t.category, {
      amount: current.amount + t.amount,
      count: current.count + 1
    });
  });

  const categoryData: CategorySpending[] = categories.map((cat) => {
    const data = categorySpending.get(cat) || { amount: 0, count: 0 };
    return {
      name: cat,
      amount: data.amount,
      percentage: monthlyBudget ? (data.amount / monthlyBudget) * 100 : 0,
      transactions: data.count,
      icon: getCategoryIcon(cat)
    };
  }).filter(cat => cat.amount > 0);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={[styles.sectionTitle, { color: theme.primaryText, marginBottom: 12 }]}>
        Category Breakdown
      </Text>

      {categoryData.length === 0 ? (
        <LinearGradient
          colors={isDark 
            ? ['rgba(232, 180, 248, 0.15)', 'rgba(180, 164, 248, 0.08)']
            : ['rgba(212, 165, 165, 0.2)', 'rgba(196, 154, 154, 0.1)']
          }
          style={styles.emptyStateBox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
            No spending data yet. Import transactions to see breakdown.
          </Text>
        </LinearGradient>
      ) : (
        categoryData.map((cat, index) => (
          <LinearGradient
            key={index}
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.18)', 'rgba(180, 164, 248, 0.1)']
              : ['rgba(212, 165, 165, 0.22)', 'rgba(196, 154, 154, 0.12)']
            }
            style={styles.categoryBreakdownCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.categoryBreakdownHeader}>
              <View style={styles.categoryBreakdownLeft}>
                <View style={[styles.categoryBreakdownIcon, { 
                  backgroundColor: isDark ? 'rgba(232, 180, 248, 0.3)' : 'rgba(212, 165, 165, 0.35)' 
                }]}>
                  <Text style={styles.categoryBreakdownEmoji}>{cat.icon}</Text>
                </View>
                <View>
                  <Text style={[styles.categoryBreakdownName, { color: theme.primaryText }]}>
                    {cat.name}
                  </Text>
                  <Text style={[styles.categoryBreakdownTransactions, { color: theme.secondaryText }]}>
                    {cat.transactions} transaction{cat.transactions !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              
              <View style={styles.categoryBreakdownRight}>
                <Text style={[styles.categoryBreakdownAmount, { color: theme.primaryText }]}>
                  ₹{Math.floor(cat.amount)}
                </Text>
                <Text style={[styles.categoryBreakdownPercent, { color: theme.secondaryText }]}>
                  {cat.percentage.toFixed(1)}% of budget
                </Text>
              </View>
            </View>

            <View style={styles.categoryBreakdownBar}>
              <View style={[styles.categoryBreakdownBarBg, { backgroundColor: theme.cardBorder }]}>
                <View 
                  style={[
                    styles.categoryBreakdownBarFill, 
                    { 
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: isDark ? '#E8B4F8' : '#D4A5A5'
                    }
                  ]} 
                />
              </View>
            </View>
          </LinearGradient>
        ))
      )}
    </Animated.View>
  );
};

// ============== 7. RECENT TRANSACTIONS ==============

const RecentTransactionsSection = ({ transactions }: { transactions: Transaction[] }) => {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get latest 5 transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text style={[styles.sectionTitle, { color: theme.primaryText, marginBottom: 12 }]}>
        Recent Transactions
      </Text>

      <LinearGradient
        colors={isDark 
          ? ['rgba(232, 180, 248, 0.18)', 'rgba(180, 164, 248, 0.1)']
          : ['rgba(212, 165, 165, 0.22)', 'rgba(196, 154, 154, 0.12)']
        }
        style={styles.transactionsCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {recentTransactions.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { color: theme.secondaryText }]}>
              No transactions yet. Import SMS or bank statements to see your spending.
            </Text>
          </View>
        ) : (
          recentTransactions.map((transaction, index) => (
            <View 
              key={transaction.id} 
              style={[
                styles.transactionItem,
                index !== recentTransactions.length - 1 && styles.transactionBorder
              ]}
            >
              <View style={[styles.transactionIcon, { 
                backgroundColor: isDark ? 'rgba(232, 180, 248, 0.25)' : 'rgba(212, 165, 165, 0.3)' 
              }]}>
                <Text style={styles.transactionIconEmoji}>
                  {getCategoryIcon(transaction.category)}
                </Text>
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={[styles.transactionTitle, { color: theme.primaryText }]}>
                  {transaction.merchantName}
                </Text>
                <Text style={[styles.transactionDate, { color: theme.secondaryText }]}>
                  {new Date(transaction.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              
              <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { 
                  color: transaction.type === 'income' ? '#4CAF50' : '#F44336' 
                }]}>
                  {transaction.type === 'income' ? '+' : '-'}₹{Math.floor(transaction.amount)}
                </Text>
                <View style={[styles.transactionBadge, { 
                  backgroundColor: isDark ? 'rgba(232, 180, 248, 0.2)' : 'rgba(212, 165, 165, 0.25)' 
                }]}>
                  <Text style={[styles.transactionBadgeText, { color: theme.secondaryText }]}>
                    {transaction.category}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// ============== STYLES ==============

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  userName: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 24,
  },
  // Month Selector Styles
  monthSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  monthArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthArrowText: {
    fontSize: 20,
    fontWeight: '700',
  },
  monthDisplay: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
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
  tabButton: { 
    flex: 1, 
    alignItems: 'center' 
  },
  tabContent: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative' 
  },
  activeIndicator: { 
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  tabIcon: { 
    marginBottom: 4 
  },
  tabLabel: { 
    fontSize: 11, 
    fontWeight: '600', 
    letterSpacing: 0.2 
  },
  quoteBox: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  quoteLeft: {
    marginRight: 20,
  },
  quoteRight: {
    flex: 1,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 26,
  },
  airplaneBox: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  pathWrapper: {
    position: 'relative',
    height: 60,
    marginBottom: 16,
  },
  pathLine: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  planeIcon: {
    position: 'absolute',
    top: 16,
    left: 0,
  },
  planeEmoji: {
    fontSize: 28,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  budgetInfo: {
    marginTop: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  progressCategoriesBox: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  circularSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  circularTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  savedAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  savedLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  goalAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    width: 80,
    letterSpacing: 0.3,
  },
  categoryBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  categoryBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
  monthCalendarContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  monthBox: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  calendarBox: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  calendarEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  calendarDate: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  calendarDaysLeft: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  calendarSubtext: {
    fontSize: 12,
    fontWeight: '600',
  },
  importContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  importBoxWrapper: {
    flex: 1,
  },
  importBox: {
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  importEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  importTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  importSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  emptyStateBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  categoryBreakdownCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  categoryBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBreakdownIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBreakdownEmoji: {
    fontSize: 22,
  },
  categoryBreakdownName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  categoryBreakdownTransactions: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  categoryBreakdownRight: {
    alignItems: 'flex-end',
  },
  categoryBreakdownAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  categoryBreakdownPercent: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryBreakdownBar: {
    marginTop: 4,
  },
  categoryBreakdownBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBreakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  transactionsCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconEmoji: {
    fontSize: 22,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  transactionDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  transactionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  transactionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  noDataContainer: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
});