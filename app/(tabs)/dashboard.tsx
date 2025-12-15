// app/(tabs)/dashboard.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
    ActivityIndicator,
} from 'react-native';
import { Circle, Defs, Path, RadialGradient, Stop, Svg, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from "../../src2/firebase/config";
import { doc, getDoc } from "firebase/firestore";

const { width, height } = Dimensions.get('window');

const expenses = [
  { id: "1", title: "Swiggy", amount: 320, category: "Food", date: "2025-04-12" },
  { id: "2", title: "Uber", amount: 180, category: "Travel", date: "2025-04-11" },
  { id: "3", title: "Electricity Bill", amount: 950, category: "Bills", date: "2025-04-10" },
  { id: "4", title: "Zomato", amount: 410, category: "Food", date: "2025-04-09" },
  { id: "5", title: "Netflix", amount: 499, category: "Bills", date: "2025-04-08" },
];

// ============== STAR BACKGROUND ==============
const DreamyStarBackground = () => {
  const [stars, setStars] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

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

  const handleTouch = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const nearby = stars.filter(star => {
      const distance = Math.sqrt(Math.pow(star.x - locationX, 2) + Math.pow(star.y - locationY, 2));
      return distance < 180;
    });

    setConnections(nearby.map(star => ({
      x1: locationX, y1: locationY, x2: star.x, y2: star.y, id: Math.random(),
    })));

    setTimeout(() => setConnections([]), 1200);
  };

  return (
    <View style={StyleSheet.absoluteFill} onTouchStart={handleTouch} pointerEvents="box-none">
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

        {connections.map((conn) => (
          <Path key={`line-${conn.id}`} d={`M ${conn.x1} ${conn.y1} L ${conn.x2} ${conn.y2}`} stroke="#E8B4F8" strokeWidth="2" opacity="0.6" />
        ))}
      </Svg>
    </View>
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
        <Animated.Image
          key={flower.id}
          source={require('../../assets/images/flower_money.png')}
          style={{
            position: 'absolute',
            left: flower.x,
            top: flower.y,
            width: flower.size,
            height: flower.size,
            opacity: flower.baseOpacity,
            transform: [{ rotate: `${flower.rotation}deg` }],
          }}
        />
      ))}
    </View>
  );
};

// ============== ANIMATED CARD ==============
const AnimatedCard = ({ children, style, onPress }: any) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
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

// ============== CIRCULAR PROGRESS ==============
const CircularProgress = ({ spent, budget }: any) => {
  const { theme, isDark } = useTheme();
  const percentage = Math.min((spent / budget) * 100, 100);
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  const gradientColors = isDark 
    ? ['#E8B4F8', '#D4A4F8', '#B4A4F8']
    : ['#D4A5A5', '#C49A9A', '#B48A8A'];

  return (
    <View style={styles.circularContainer}>
      <Svg width={140} height={140}>
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.9" />
            <Stop offset="50%" stopColor={gradientColors[1]} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={gradientColors[2]} stopOpacity="0.9" />
          </SvgLinearGradient>
        </Defs>
        
        <Circle cx="70" cy="70" r={radius} stroke={theme.cardBorder} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx="70" cy="70" r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </Svg>
      
      <View style={styles.circularText}>
        <Text style={[styles.circularAmount, { color: theme.primaryText }]}>₹{spent}</Text>
        <Text style={[styles.circularLabel, { color: theme.secondaryText }]}>spent</Text>
      </View>
    </View>
  );
};

// ============== ANIMATED BUTTON ==============
const AnimatedButton = ({ icon, text, colors, onPress }: any) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true, friction: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={styles.actionButton}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient colors={colors} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.actionIcon}>{icon}</Text>
          <Text style={[styles.actionText, { color: theme.primaryText }]}>{text}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
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

// ============== MAIN DASHBOARD ==============
export default function Dashboard() {
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyBudget = userData?.monthlyBudget || 0;
  const remaining = monthlyBudget - totalSpent;
  const isOverBudget = remaining < 0;

  const categories = [
    { name: "Food", color: isDark ? "#E8B4F8" : "#D4A5A5" },
    { name: "Travel", color: isDark ? "#B4A4F8" : "#C49A9A" },
    { name: "Bills", color: isDark ? "#D4B4F8" : "#B48A8A" },
  ];

  const categoryData = categories.map(cat => ({
    ...cat,
    amount: expenses.filter(exp => exp.category === cat.name).reduce((sum, exp) => sum + exp.amount, 0),
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

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
        </View>
      </View>
    );
  }

  console.log("User Data:", userData); // Debug log to check if data is loading

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.secondaryText }]}>{getGreeting()}</Text>
            {userData?.name ? (
              <Text style={[styles.userName, { color: theme.primaryText }]}>{userData.name}</Text>
            ) : (
              <Text style={[styles.userName, { color: theme.primaryText }]}>Welcome</Text>
            )}
          </View>
          <LinearGradient
            colors={[theme.cardBorder, theme.cardBackground]}
            style={styles.moonIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={{ fontSize: 26 }}>{isDark ? '🌙' : '☀️'}</Text>
          </LinearGradient>
        </View>

        <AnimatedCard style={styles.summaryCard}>
          <CircularProgress spent={totalSpent} budget={monthlyBudget} />
          
          <View style={styles.budgetInfo}>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: theme.secondaryText }]}>Budget</Text>
              <Text style={[styles.budgetValue, { color: theme.primaryText }]}>₹{monthlyBudget}</Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: isOverBudget ? '#D4756F' : '#A5C9A5' }]}>
                {isOverBudget ? 'Over' : 'Remaining'}
              </Text>
              <Text style={[styles.budgetValue, { color: isOverBudget ? '#D4756F' : '#A5C9A5' }]}>
                ₹{Math.abs(remaining)}
              </Text>
            </View>
          </View>
        </AnimatedCard>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Categories</Text>
          
          {categoryData.map((cat, index) => {
            const percentage = totalSpent > 0 ? ((cat.amount / totalSpent) * 100).toFixed(0) : 0;
            return (
              <AnimatedCard key={index} style={styles.categoryCard}>
                <View style={styles.categoryRow}>
                  <LinearGradient colors={[cat.color, cat.color + 'AA']} style={styles.categoryDot} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <Text style={[styles.categoryName, { color: theme.primaryText }]}>{cat.name}</Text>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={[styles.categoryValue, { color: theme.primaryText }]}>₹{cat.amount}</Text>
                  <Text style={[styles.categoryPercent, { color: theme.secondaryText }]}>{percentage}%</Text>
                </View>
              </AnimatedCard>
            );
          })}
        </View>

        <View style={styles.actionsRow}>
          <AnimatedButton icon="➕" text="Add" colors={theme.accent} onPress={() => {}} />
          <AnimatedButton icon="📊" text="Stats" colors={theme.buttonPrimary} onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Recent</Text>
          
          <AnimatedCard>
            {expenses.slice(0, 5).map((expense, idx) => {
              const category = categories.find(cat => cat.name === expense.category);
              const icon = expense.category === 'Food' ? '🍔' : expense.category === 'Travel' ? '🚗' : '💡';

              return (
                <View
                  key={expense.id}
                  style={[
                    styles.transactionItem,
                    idx !== 4 && [styles.transactionBorder, { borderBottomColor: theme.cardBorder }]
                  ]}
                >
                  <LinearGradient
                    colors={[category!.color + '35', category!.color + '18']}
                    style={styles.transactionIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                  </LinearGradient>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionTitle, { color: theme.primaryText }]}>{expense.title}</Text>
                    <Text style={[styles.transactionDate, { color: theme.secondaryText }]}>{expense.date}</Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: theme.errorColor }]}>₹{expense.amount}</Text>
                </View>
              );
            })}
          </AnimatedCard>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomTabBar activeTab="dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 20 },
  greeting: { fontSize: 12, marginBottom: 6, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '400' },
  userName: { fontSize: 38, fontWeight: '200', letterSpacing: 0.8 },
  moonIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  glassCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1.5 },
  summaryCard: { alignItems: 'center', paddingVertical: 32, marginBottom: 24 },
  circularContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  circularText: { position: 'absolute', alignItems: 'center' },
  circularAmount: { fontSize: 30, fontWeight: '700', marginBottom: 4 },
  circularLabel: { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '500' },
  budgetInfo: { width: '100%', gap: 14 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontSize: 13, letterSpacing: 0.8, fontWeight: '400' },
  budgetValue: { fontSize: 22, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, letterSpacing: 1 },
  categoryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryDot: { width: 13, height: 13, borderRadius: 7 },
  categoryName: { fontSize: 16, letterSpacing: 0.4, fontWeight: '500' },
  categoryAmount: { alignItems: 'flex-end' },
  categoryValue: { fontSize: 19, fontWeight: '700', marginBottom: 2 },
  categoryPercent: { fontSize: 11, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, borderRadius: 18, overflow: 'hidden', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  actionGradient: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { fontSize: 30, marginBottom: 8 },
  actionText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.8 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  transactionBorder: { borderBottomWidth: 1 },
  transactionIcon: { width: 46, height: 46, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  transactionDetails: { flex: 1 },
  transactionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  transactionDate: { fontSize: 11, fontWeight: '400' },
  transactionAmount: { fontSize: 17, fontWeight: '700' },
});