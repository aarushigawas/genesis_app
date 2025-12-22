// app/(tabs)/analytics.tsx
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
} from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

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

export default function Analytics() {
  const { theme, isDark, toggleTheme } = useTheme();

  const monthlyData = [
    { month: 'Jan', amount: 6500 },
    { month: 'Feb', amount: 7200 },
    { month: 'Mar', amount: 5800 },
    { month: 'Apr', amount: 8300 },
  ];

  const maxAmount = Math.max(...monthlyData.map(d => d.amount));

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
            Your spending insights
          </Text>
        </View>
        <AnimatedCard
  style={{ marginBottom: 20 }}
>
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


        <AnimatedCard>
          <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Monthly Spending</Text>
          <View style={styles.chartContainer}>
            {monthlyData.map((data, index) => {
              const barHeight = (data.amount / maxAmount) * 150;
              return (
                <View key={index} style={styles.barContainer}>
                  <LinearGradient
                    colors={theme.accent}
                    style={[styles.bar, { height: barHeight }]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                  />
                  <Text style={[styles.barAmount, { color: theme.secondaryText }]}>₹{data.amount}</Text>
                  <Text style={[styles.barLabel, { color: theme.secondaryText }]}>{data.month}</Text>
                </View>
              );
            })}
          </View>
        </AnimatedCard>

        <AnimatedCard>
          <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Top Categories</Text>
          {[
            { name: 'Food', amount: 2400, percentage: 45 },
            { name: 'Bills', amount: 1850, percentage: 35 },
            { name: 'Travel', amount: 1050, percentage: 20 },
          ].map((cat, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: theme.primaryText }]}>{cat.name}</Text>
                <Text style={[styles.categoryAmount, { color: theme.secondaryText }]}>₹{cat.amount}</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.cardBorder }]}>
                <LinearGradient
                  colors={theme.accent}
                  style={[styles.progressFill, { width: `${cat.percentage}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          ))}
        </AnimatedCard>

        <AnimatedCard>
          <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent[0] }]}>₹5,300</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Avg Monthly</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent[1] }]}>₹950</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Largest</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent[2] }]}>42</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Transactions</Text>
            </View>
          </View>
        </AnimatedCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomTabBar activeTab="analytics" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 200, paddingTop: 10 },
  barContainer: { alignItems: 'center', flex: 1 },
  bar: { width: 40, borderRadius: 8, marginBottom: 8 },
  barAmount: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  barLabel: { fontSize: 12, fontWeight: '500' },
  categoryItem: { marginBottom: 20 },
  categoryInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryName: { fontSize: 16, fontWeight: '600' },
  categoryAmount: { fontSize: 16, fontWeight: '500' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  statLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8 },
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