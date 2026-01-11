// app/(tabs)/settings.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from "../../src2/firebase/config";

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
    transactions: useRef(new Animated.Value(1)).current,
    budgetpredictions: useRef(new Animated.Value(1)).current,
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: '🏠', route: '/(tabs)/dashboard' },
    { id: 'transactions', label: 'Transactions', icon: '💳', route: '/(tabs)/transactions' },
    { id: 'analytics', label: 'Analytics', icon: '📈', route: '/(tabs)/analytics' },
    { id: 'settings', label: 'Settings', icon: '⚙️', route: '/(tabs)/settings' },
    { id: 'profile', label: 'Profile', icon: '👤', route: '/(tabs)/profile' },
    { id: 'budgetpredictions', label: 'Predictions', icon: '🔮', route: '/(tabs)/budgetpredictions' },
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
    <TouchableOpacity 
      activeOpacity={onPress ? 0.9 : 1} 
      onPressIn={onPress ? handlePressIn : undefined} 
      onPressOut={onPress ? handlePressOut : undefined}
      onPress={onPress}
      disabled={!onPress}
    >
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

export default function Settings() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch onboarding data from userOnboardingData collection
  const fetchOnboardingData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const onboardingDoc = await getDoc(doc(db, "userOnboardingData", currentUser.uid));
        if (onboardingDoc.exists()) {
          const data = onboardingDoc.data();
          setOnboardingData(data);
          console.log('✅ Fetched onboarding data:', data);
        } else {
          console.log('⚠️ No onboarding data found');
          setOnboardingData(null);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchOnboardingData();
  }, []);

  // Refresh data when screen comes into focus (after returning from edit screens)
  useFocusEffect(
    useCallback(() => {
      fetchOnboardingData();
    }, [])
  );

  // Helper function to format saving purpose
  const formatSavingPurpose = () => {
    if (!onboardingData?.savingPurpose) return 'Not set';
    const purpose = onboardingData.savingPurpose;
    return purpose.text || purpose.type || 'Not set';
  };

  // Helper function to format saving duration
  const formatSavingDuration = () => {
    if (!onboardingData?.savingDuration) return 'Not set';
    const duration = onboardingData.savingDuration;
    return `${duration.value} ${duration.unit}`;
  };

  // Helper function to format notification preference
  const formatNotificationPreference = () => {
    const notificationOptions = [
      { value: 'overspend', label: 'When I overspend' },
      { value: 'weekly', label: 'Weekly summaries' },
      { value: 'daily', label: 'Daily insights' },
      { value: 'never', label: 'Never' },
    ];
    
    const pref = onboardingData?.notificationPreference || 'never';
    return notificationOptions.find(o => o.value === pref)?.label || 'Never';
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[styles.loadingText, { color: theme.primaryText }]}>Loading...</Text>
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

      <TouchableOpacity 
        style={styles.themeToggle}
        onPress={toggleTheme}
      >
        <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.primaryText }]}>Settings</Text>
          <Text style={[styles.pageSubtitle, { color: theme.secondaryText }]}>
            Customize your financial profile
          </Text>
        </View>

        {/* APPEARANCE SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>APPEARANCE</Text>
        <AnimatedCard>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.cardBorder, true: theme.accent[0] }}
              thumbColor={theme.primaryText}
            />
          </View>
        </AnimatedCard>

        {/* FINANCIAL PROFILE SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>FINANCIAL PROFILE</Text>
        <AnimatedCard>
          {/* Monthly Income */}
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => router.push('/(onboarding)/income?editMode=true')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Monthly Income</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                ₹{onboardingData?.monthlyIncome?.toLocaleString('en-IN') || '0'}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          {/* Current Bank Balance */}
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => router.push('/(onboarding)/income?editMode=true')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Current Bank Balance</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                ₹{onboardingData?.currentBankBalance?.toLocaleString('en-IN') || '0'}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          {/* Monthly Budget */}
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => router.push('/(onboarding)/budget?editMode=true')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Monthly Budget</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                ₹{onboardingData?.monthlyBudget?.toLocaleString('en-IN') || '0'}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          {/* Saving Amount */}
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => router.push('/(onboarding)/budget?editMode=true')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Monthly Savings</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                ₹{onboardingData?.savingAmount?.toLocaleString('en-IN') || '0'} ({onboardingData?.savingPercentage?.toFixed(1) || '0'}%)
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* SAVINGS GOALS SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>SAVINGS GOALS</Text>
        <AnimatedCard>
          {/* Saving Purpose */}
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => router.push('/(onboarding)/saving-purpose?editMode=true')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Saving Purpose</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                {formatSavingPurpose()}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          {/* Saving Duration */}
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => router.push('/(onboarding)/saving-duration?editMode=true')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Saving Duration</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                {formatSavingDuration()}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* NOTIFICATIONS SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>NOTIFICATIONS</Text>
        <AnimatedCard>
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => router.push('/(onboarding)/notifications?editMode=true')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Notification Preferences</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                {formatNotificationPreference()}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* ACCOUNT SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>ACCOUNT</Text>
        <AnimatedCard>
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Change Password</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                Update your account password
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Currency</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                INR (₹)
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* ABOUT SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>ABOUT</Text>
        <AnimatedCard>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Version</Text>
            <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>1.0.0</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Privacy Policy</Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Terms of Service</Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomTabBar activeTab="settings" />
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
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12, marginTop: 8 },
  glassCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1.5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDescription: { fontSize: 13, fontWeight: '400' },
  divider: { height: 1, marginVertical: 16 },
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
  themeToggleIcon: { fontSize: 24 },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
});