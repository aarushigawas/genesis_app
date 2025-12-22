// app/(tabs)/dashboard.tsx - FIXED VERSION

import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import {
    Circle,
    Defs,
    Path,
    RadialGradient,
    Stop,
    Svg,
    LinearGradient as SvgLinearGradient,
} from 'react-native-svg';

import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from '../../src2/firebase/config';

const { width, height } = Dimensions.get('window');

const expenses = [
  { id: "1", title: "Swiggy", amount: 320, category: "Food", date: "2025-04-12" },
  { id: "2", title: "Uber", amount: 180, category: "Transport", date: "2025-04-11" },
  { id: "3", title: "Electricity Bill", amount: 950, category: "Utilities", date: "2025-04-10" },
  { id: "4", title: "Zomato", amount: 410, category: "Food", date: "2025-04-09" },
  { id: "5", title: "Netflix", amount: 499, category: "Subscriptions", date: "2025-04-08" },
];

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
  savingAmount?: number;
  savingPercentage?: number;
  hasSavingGoal?: boolean;
  categories?: string[];
  savingPurpose?: SavingPurpose | null;
  savingDuration?: SavingDuration | null;
  notificationPreference?: string;
}

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
        <Image
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

// ============== MAIN DASHBOARD COMPONENT ==============
export default function Dashboard() {
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      const uid = currentUser.uid;

      const [userDocSnap, onboardingDocSnap] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDoc(doc(db, "userOnboardingData", uid))
      ]);

      const mergedData: UserData = {
        ...(userDocSnap.exists() ? userDocSnap.data() : {}),
        ...(onboardingDocSnap.exists() ? onboardingDocSnap.data() : {})
      };

      setUserData(mergedData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const userCategories = userData?.categories || [];
  const savingPurpose = userData?.savingPurpose;
  const savingDuration = userData?.savingDuration;

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
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.secondaryText }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: theme.primaryText }]}>
              {userData?.name || 'Welcome'}
            </Text>
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

        {/* 1. Motivational Slogan */}
        <MotivationalSlogan savingPurpose={savingPurpose} />

        {/* 2. Plane Journey Path */}
        <PlaneJourneyPath 
          savingAmount={userData?.savingAmount}
          monthlyBudget={userData?.monthlyBudget}
          savingDuration={savingDuration}
        />

        {/* 3. Progress Ring + Line Graph */}
        <ProgressRingWithGraph 
          savingAmount={userData?.savingAmount}
          monthlyBudget={userData?.monthlyBudget}
          savingDuration={savingDuration}
        />

        {/* 4. SMS + Bank Statement Action Boxes */}
        <ActionBoxes />

        {/* 5. Today Status Card */}
        <TodayStatusCard 
          savingAmount={userData?.savingAmount}
          monthlyBudget={userData?.monthlyBudget}
          savingDuration={savingDuration}
        />

        {/* 6. Categories */}
        <CategoriesSection categories={userCategories} expenses={expenses} />

        {/* 7. Recent Transactions */}
        <RecentTransactions expenses={expenses} />

        {/* 8. Bottom Emerging Card */}
        <BottomEmergingCard 
          savingAmount={userData?.savingAmount}
          monthlyBudget={userData?.monthlyBudget}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomTabBar activeTab="dashboard" />
    </View>
  );
}

// ============== MOTIVATIONAL SLOGAN CARD ==============
const MotivationalSlogan = ({ savingPurpose }: { savingPurpose?: SavingPurpose | null }) => {
  const { theme, isDark } = useTheme();
  const swayAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const getQuote = () => {
    // Handle savingPurpose as object with type property
    const purposeType = savingPurpose?.type?.toLowerCase() || '';
    
    if (purposeType.includes('travel')) {
      return { text: "Every rupee saved is a step towards freedom", icon: "✈️" };
    } else if (purposeType.includes('emergency')) {
      return { text: "Building your safety net, one day at a time", icon: "🛡️" };
    } else if (purposeType.includes('education')) {
      return { text: "Invest in yourself, the returns are infinite", icon: "📚" };
    } else {
      return { text: "Your future self will thank you for today", icon: "🌟" };
    }
  };

  const quote = getQuote();

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(swayAnim, { toValue: -8, duration: 150, useNativeDriver: true }),
      Animated.timing(swayAnim, { toValue: 8, duration: 150, useNativeDriver: true }),
      Animated.timing(swayAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <Animated.View style={{ transform: [{ translateX: swayAnim }] }}>
          <LinearGradient
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.25)', 'rgba(180, 164, 248, 0.15)']
              : ['rgba(212, 165, 165, 0.30)', 'rgba(196, 154, 154, 0.18)']
            }
            style={styles.sloganCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.sloganIconContainer, { 
              backgroundColor: isDark ? 'rgba(232, 180, 248, 0.3)' : 'rgba(212, 165, 165, 0.35)' 
            }]}>
              <Text style={styles.sloganIcon}>{quote.icon}</Text>
            </View>
            <Text style={[styles.sloganText, { color: theme.primaryText }]}>
              {quote.text}
            </Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============== PLANE JOURNEY PATH ==============
const PlaneJourneyPath = ({ 
  savingAmount, 
  monthlyBudget, 
  savingDuration 
}: { 
  savingAmount?: number; 
  monthlyBudget?: number; 
  savingDuration?: SavingDuration | null; 
}) => {
  const { theme, isDark } = useTheme();
  const planeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(planeAnim, {
      toValue: 1,
      duration: 2000,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const calculateMonthsToGoal = () => {
    if (!savingAmount || !monthlyBudget || savingAmount <= 0) {
      return null;
    }
    
    const monthlySaving = monthlyBudget * (savingAmount / 100);
    
    // Handle savingDuration as object
    let durationInMonths = 6; // default
    if (savingDuration) {
      const value = savingDuration.value || 1;
      const unit = savingDuration.unit || 'years';
      
      if (unit === 'years') {
        durationInMonths = value * 12;
      } else if (unit === 'months') {
        durationInMonths = value;
      }
    }
    
    const targetAmount = durationInMonths * monthlySaving;
    const monthsNeeded = Math.ceil(targetAmount / monthlySaving);
    return monthsNeeded;
  };

  const monthsToGoal = calculateMonthsToGoal();
  const planePosition = planeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - 100],
  });

  return (
    <Animated.View
      style={[
        styles.journeyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.pathWrapper}>
        <Svg width={width - 48} height={80}>
          <Defs>
            <SvgLinearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={isDark ? "#E8B4F8" : "#D4A5A5"} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={isDark ? "#B4A4F8" : "#B48A8A"} stopOpacity="0.8" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d={`M 20 40 Q ${(width - 48) / 2} 10, ${width - 68} 40`}
            stroke="url(#pathGradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8,8"
          />
        </Svg>
        
        <Animated.View style={[
          styles.planeIcon,
          { transform: [{ translateX: planePosition }] }
        ]}>
          <Text style={styles.planeEmoji}>✈️</Text>
        </Animated.View>
      </View>
      
      <Text style={[styles.journeyText, { color: theme.secondaryText }]}>
        {monthsToGoal 
          ? `If you continue this way, you'll reach your destination in ${monthsToGoal} month${monthsToGoal !== 1 ? 's' : ''}`
          : "Set your savings to see your journey timeline"}
      </Text>
    </Animated.View>
  );
};

// ============== CIRCULAR PROGRESS + LINE GRAPH CARD ==============
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRingWithGraph = ({ 
  savingAmount, 
  monthlyBudget,
  savingDuration 
}: { 
  savingAmount?: number; 
  monthlyBudget?: number;
  savingDuration?: SavingDuration | null;
}) => {
  const { theme, isDark } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      delay: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  const monthlySaving = (monthlyBudget || 0) * ((savingAmount || 0) / 100);
  
  // Handle savingDuration as object
  let durationInMonths = 6; // default
  if (savingDuration) {
    const value = savingDuration.value || 1;
    const unit = savingDuration.unit || 'years';
    
    if (unit === 'years') {
      durationInMonths = value * 12;
    } else if (unit === 'months') {
      durationInMonths = value;
    }
  }
  
  const goalAmount = durationInMonths * monthlySaving;
  const currentSaved = monthlySaving * 1;
  const percentage = goalAmount > 0 ? Math.min((currentSaved / goalAmount) * 100, 100) : 0;

  const radius = 65;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference - (percentage / 100) * circumference],
  });

  const graphData = [
    { month: 'Jan', amount: monthlySaving * 0.8 },
    { month: 'Feb', amount: monthlySaving * 0.9 },
    { month: 'Mar', amount: monthlySaving * 1.0 },
    { month: 'Apr', amount: monthlySaving * 1.1 },
    { month: 'May', amount: monthlySaving * 0.95 },
    { month: 'Jun', amount: monthlySaving * 1.05 },
  ];

  const maxAmount = Math.max(...graphData.map(d => d.amount));
  const graphWidth = width - 88;
  const graphHeight = 100;

  const pathData = graphData.map((d, i) => {
    const x = (i / (graphData.length - 1)) * graphWidth;
    const y = graphHeight - (d.amount / maxAmount) * graphHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <LinearGradient
        colors={isDark 
          ? ['rgba(232, 180, 248, 0.2)', 'rgba(180, 164, 248, 0.1)']
          : ['rgba(212, 165, 165, 0.25)', 'rgba(196, 154, 154, 0.12)']
        }
        style={styles.progressGraphCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.circularSection}>
          <Svg width={150} height={150}>
            <Defs>
              <SvgLinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={isDark ? "#E8B4F8" : "#D4A5A5"} stopOpacity="1" />
                <Stop offset="100%" stopColor={isDark ? "#B4A4F8" : "#B48A8A"} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            
            <Circle
              cx="75"
              cy="75"
              r={radius}
              stroke={theme.cardBorder}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedCircle
              cx="75"
              cy="75"
              r={radius}
              stroke="url(#ringGradient)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
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

        <View style={styles.graphSection}>
          <Text style={[styles.graphTitle, { color: theme.primaryText }]}>
            Monthly Trend
          </Text>
          <Svg width={graphWidth} height={graphHeight} style={styles.lineGraph}>
            <Defs>
              <SvgLinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={isDark ? "#E8B4F8" : "#D4A5A5"} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={isDark ? "#B4A4F8" : "#B48A8A"} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d={pathData}
              stroke="url(#lineGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ============== SMS + BANK STATEMENT ACTION BOXES ==============
const ActionBoxes = () => {
  const { theme, isDark } = useTheme();
  const leftBoxAnim = useRef(new Animated.Value(0)).current;
  const rightBoxAnim = useRef(new Animated.Value(0)).current;
  const leftSlideAnim = useRef(new Animated.Value(-30)).current;
  const rightSlideAnim = useRef(new Animated.Value(30)).current;
  const leftScaleAnim = useRef(new Animated.Value(0.9)).current;
  const rightScaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(leftBoxAnim, {
        toValue: 1,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(leftSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.spring(leftScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(rightBoxAnim, {
        toValue: 1,
        duration: 600,
        delay: 700,
        useNativeDriver: true,
      }),
      Animated.timing(rightSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 700,
        useNativeDriver: true,
      }),
      Animated.spring(rightScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <View style={styles.actionBoxesContainer}>
      <Animated.View
        style={[
          styles.actionBoxWrapper,
          {
            opacity: leftBoxAnim,
            transform: [
              { translateX: leftSlideAnim },
              { scale: leftScaleAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/sms-import' as any)}
        >
          <LinearGradient
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.22)', 'rgba(180, 164, 248, 0.12)']
              : ['rgba(212, 165, 165, 0.28)', 'rgba(196, 154, 154, 0.15)']
            }
            style={styles.actionBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.actionBoxIcon, { 
              backgroundColor: isDark ? 'rgba(232, 180, 248, 0.3)' : 'rgba(212, 165, 165, 0.35)' 
            }]}>
              <Text style={styles.actionBoxEmoji}>💬</Text>
            </View>
            <View style={styles.actionBoxContent}>
              <Text style={[styles.actionBoxTitle, { color: theme.primaryText }]}>
                Import from SMS
              </Text>
              <Text style={[styles.actionBoxSubtitle, { color: theme.secondaryText }]}>
                Auto-detect expenses
              </Text>
            </View>
            <View style={[styles.plusIcon, { 
              backgroundColor: isDark ? '#E8B4F8' : '#D4A5A5' 
            }]}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.actionBoxWrapper,
          {
            opacity: rightBoxAnim,
            transform: [
              { translateX: rightSlideAnim },
              { scale: rightScaleAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/bank-upload' as any)}
        >
          <LinearGradient
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.22)', 'rgba(180, 164, 248, 0.12)']
              : ['rgba(212, 165, 165, 0.28)', 'rgba(196, 154, 154, 0.15)']
            }
            style={styles.actionBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.actionBoxIcon, { 
              backgroundColor: isDark ? 'rgba(232, 180, 248, 0.3)' : 'rgba(212, 165, 165, 0.35)' 
            }]}>
              <Text style={styles.actionBoxEmoji}>🏦</Text>
            </View>
            <View style={styles.actionBoxContent}>
              <Text style={[styles.actionBoxTitle, { color: theme.primaryText }]}>
                Bank Statement
              </Text>
              <Text style={[styles.actionBoxSubtitle, { color: theme.secondaryText }]}>
                Upload PDF/CSV
              </Text>
            </View>
            <View style={[styles.plusIcon, { 
              backgroundColor: isDark ? '#E8B4F8' : '#D4A5A5' 
            }]}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ============== TODAY STATUS / CALENDAR CARD ==============
const TodayStatusCard = ({ 
  savingAmount, 
  monthlyBudget,
  savingDuration 
}: { 
  savingAmount?: number; 
  monthlyBudget?: number;
  savingDuration?: SavingDuration | null;
}) => {
  const { theme, isDark } = useTheme();
  const [todaySaved] = useState(Math.floor(Math.random() * 500) + 100);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const currentMonth = new Date().getMonth() + 1;
  
  // Handle savingDuration as object
  let totalMonths = 6; // default
  if (savingDuration) {
    const value = savingDuration.value || 1;
    const unit = savingDuration.unit || 'years';
    
    if (unit === 'years') {
      totalMonths = value * 12;
    } else if (unit === 'months') {
      totalMonths = value;
    }
  }
  
  const monthProgress = Math.min(currentMonth, totalMonths);
  
  const getMotivationalMessage = () => {
    if (monthProgress === 1) return "Great start! You've begun your journey";
    if (monthProgress === 2) return "Consistency is key, keep going";
    if (monthProgress === 3) return "Halfway there, stay focused";
    if (monthProgress === 4) return "Your discipline is showing";
    if (monthProgress === 5) return "Final stretch, don't give up now";
    if (monthProgress >= 6) return "Goal achieved! Time to celebrate";
    return "Every day brings you closer";
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
          ? ['rgba(232, 180, 248, 0.2)', 'rgba(180, 164, 248, 0.1)']
          : ['rgba(212, 165, 165, 0.25)', 'rgba(196, 154, 154, 0.12)']
        }
        style={styles.todayCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.todayHeader}>
          <View>
            <Text style={[styles.todayTitle, { color: theme.primaryText }]}>
              Today's Progress
            </Text>
            <Text style={[styles.todayAmount, { color: isDark ? '#E8B4F8' : '#D4A5A5' }]}>
              ₹{todaySaved} saved
            </Text>
          </View>
          <View style={[styles.monthBadge, { 
            backgroundColor: isDark ? 'rgba(232, 180, 248, 0.25)' : 'rgba(212, 165, 165, 0.3)' 
          }]}>
            <Text style={[styles.monthBadgeText, { color: theme.primaryText }]}>
              Month {monthProgress}/{totalMonths}
            </Text>
          </View>
        </View>
        
        <View style={styles.motivationContainer}>
          <Text style={[styles.motivationText, { color: theme.secondaryText }]}>
            {getMotivationalMessage()}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ============== CATEGORIES ==============
const CategoriesSection = ({ 
  categories, 
  expenses 
}: { 
  categories: string[]; 
  expenses: any[];
}) => {
  const { theme, isDark } = useTheme();
  
  const categoryIcons: { [key: string]: string } = {
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
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryData = categories.map((catName) => {
    const amount = expenses
      .filter(exp => exp.category === catName)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
      name: catName,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      icon: categoryIcons[catName] || '💰',
    };
  }).filter(cat => cat.amount > 0);

  if (categoryData.length === 0) {
    const EmptyState = () => {
      const emptyFadeAnim = useRef(new Animated.Value(0)).current;
      const emptySlideAnim = useRef(new Animated.Value(10)).current;

      useEffect(() => {
        Animated.parallel([
          Animated.timing(emptyFadeAnim, {
            toValue: 1,
            duration: 400,
            delay: 900,
            useNativeDriver: true,
          }),
          Animated.timing(emptySlideAnim, {
            toValue: 0,
            duration: 400,
            delay: 900,
            useNativeDriver: true,
          }),
        ]).start();
      }, []);

      return (
        <Animated.View
          style={{
            opacity: emptyFadeAnim,
            transform: [{ translateY: emptySlideAnim }],
          }}
        >
          <LinearGradient
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.15)', 'rgba(180, 164, 248, 0.08)']
              : ['rgba(212, 165, 165, 0.2)', 'rgba(196, 154, 154, 0.1)']
            }
            style={styles.emptyStateCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
              No expenses yet in your selected categories
            </Text>
          </LinearGradient>
        </Animated.View>
      );
    };

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>
          Categories
        </Text>
        <EmptyState />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>
        Categories
      </Text>
      
      {categoryData.map((cat, index) => {
        const CategoryCard = () => {
          const fadeAnim = useRef(new Animated.Value(0)).current;
          const slideAnim = useRef(new Animated.Value(-20)).current;
          const scaleAnim = useRef(new Animated.Value(0.95)).current;

          useEffect(() => {
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 900 + index * 100,
                useNativeDriver: true,
              }),
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: 900 + index * 100,
                useNativeDriver: true,
              }),
              Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                delay: 900 + index * 100,
                useNativeDriver: true,
              }),
            ]).start();
          }, []);

          return (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  { translateX: slideAnim },
                  { scale: scaleAnim },
                ],
              }}
            >
              <TouchableOpacity activeOpacity={0.85}>
                <LinearGradient
                  colors={isDark 
                    ? ['rgba(232, 180, 248, 0.18)', 'rgba(180, 164, 248, 0.1)']
                    : ['rgba(212, 165, 165, 0.22)', 'rgba(196, 154, 154, 0.12)']
                  }
                  style={styles.categoryCardNew}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIconCircle, { 
                      backgroundColor: isDark ? 'rgba(232, 180, 248, 0.3)' : 'rgba(212, 165, 165, 0.35)' 
                    }]}>
                      <Text style={styles.categoryIconText}>{cat.icon}</Text>
                    </View>
                    <View>
                      <Text style={[styles.categoryNameNew, { color: theme.primaryText }]}>
                        {cat.name}
                      </Text>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarBg, { backgroundColor: theme.cardBorder }]}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${cat.percentage}%`,
                                backgroundColor: isDark ? '#E8B4F8' : '#D4A5A5'
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.categoryRight}>
                    <Text style={[styles.categoryAmountNew, { color: theme.primaryText }]}>
                      ₹{cat.amount}
                    </Text>
                    <Text style={[styles.categoryPercentNew, { color: theme.secondaryText }]}>
                      {cat.percentage.toFixed(0)}%
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          );
        };

        return <CategoryCard key={cat.name} />;
      })}
    </View>
  );
};

// ============== RECENT TRANSACTIONS ==============
const RecentTransactions = ({ expenses }: { expenses: any[] }) => {
  const { theme, isDark } = useTheme();
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const categoryIcons: { [key: string]: string } = {
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
  };

  if (expenses.length === 0) {
    const EmptyTransactions = () => {
      const emptyFadeAnim = useRef(new Animated.Value(0)).current;
      const emptySlideAnim = useRef(new Animated.Value(10)).current;

      useEffect(() => {
        Animated.parallel([
          Animated.timing(emptyFadeAnim, {
            toValue: 1,
            duration: 400,
            delay: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(emptySlideAnim, {
            toValue: 0,
            duration: 400,
            delay: 1200,
            useNativeDriver: true,
          }),
        ]).start();
      }, []);

      return (
        <Animated.View
          style={{
            opacity: emptyFadeAnim,
            transform: [{ translateY: emptySlideAnim }],
          }}
        >
          <LinearGradient
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.15)', 'rgba(180, 164, 248, 0.08)']
              : ['rgba(212, 165, 165, 0.2)', 'rgba(196, 154, 154, 0.1)']
            }
            style={styles.emptyStateCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
              No transactions yet. Start tracking your expenses!
            </Text>
          </LinearGradient>
        </Animated.View>
      );
    };

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>
          Recent Transactions
        </Text>
        <EmptyTransactions />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>
        Recent Transactions
      </Text>
      
      <Animated.View
        style={{
          opacity: cardFadeAnim,
          transform: [{ scale: cardScaleAnim }],
        }}
      >
        <LinearGradient
          colors={isDark 
            ? ['rgba(232, 180, 248, 0.18)', 'rgba(180, 164, 248, 0.1)']
            : ['rgba(212, 165, 165, 0.22)', 'rgba(196, 154, 154, 0.12)']
          }
          style={styles.transactionsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {expenses.slice(0, 5).map((expense, idx) => {
            const TransactionItem = () => {
              const itemFadeAnim = useRef(new Animated.Value(0)).current;
              const itemSlideAnim = useRef(new Animated.Value(-15)).current;

              useEffect(() => {
                Animated.parallel([
                  Animated.timing(itemFadeAnim, {
                    toValue: 1,
                    duration: 300,
                    delay: 1300 + idx * 80,
                    useNativeDriver: true,
                  }),
                  Animated.timing(itemSlideAnim, {
                    toValue: 0,
                    duration: 300,
                    delay: 1300 + idx * 80,
                    useNativeDriver: true,
                  }),
                ]).start();
              }, []);

              const icon = categoryIcons[expense.category] || '💰';

              return (
                <Animated.View
                  style={{
                    opacity: itemFadeAnim,
                    transform: [{ translateX: itemSlideAnim }],
                  }}
                >
                  <TouchableOpacity activeOpacity={0.85}>
                    <View
                      style={[
                        styles.transactionItemNew,
                        idx !== 4 && [styles.transactionBorderNew, { borderBottomColor: theme.cardBorder }]
                      ]}
                    >
                      <View style={[styles.transactionIconNew, { 
                        backgroundColor: isDark ? 'rgba(232, 180, 248, 0.25)' : 'rgba(212, 165, 165, 0.3)' 
                      }]}>
                        <Text style={styles.transactionIconEmoji}>{icon}</Text>
                      </View>
                      
                      <View style={styles.transactionDetailsNew}>
                        <Text style={[styles.transactionTitleNew, { color: theme.primaryText }]}>
                          {expense.title}
                        </Text>
                        <Text style={[styles.transactionDateNew, { color: theme.secondaryText }]}>
                          {expense.date}
                        </Text>
                      </View>
                      
                      <View style={styles.transactionAmountContainer}>
                        <Text style={[styles.transactionAmountNew, { color: '#D4756F' }]}>
                          -₹{expense.amount}
                        </Text>
                        <View style={[styles.categoryBadge, { 
                          backgroundColor: isDark ? 'rgba(232, 180, 248, 0.2)' : 'rgba(212, 165, 165, 0.25)' 
                        }]}>
                          <Text style={[styles.categoryBadgeText, { color: theme.secondaryText }]}>
                            {expense.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            };

            return <TransactionItem key={expense.id} />;
          })}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ============== BOTTOM EMERGING CARD ==============
const BottomEmergingCard = ({ 
  savingAmount, 
  monthlyBudget 
}: { 
  savingAmount?: number; 
  monthlyBudget?: number;
}) => {
  const { theme, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 1600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 9,
        delay: 1600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const monthlySaving = (monthlyBudget || 0) * ((savingAmount || 0) / 100);
  
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, friction: 6 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.emergingCardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={isDark 
              ? ['rgba(232, 180, 248, 0.3)', 'rgba(180, 164, 248, 0.18)']
              : ['rgba(212, 165, 165, 0.35)', 'rgba(196, 154, 154, 0.2)']
            }
            style={styles.emergingCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.emergingContent}>
              <View style={[styles.emergingIcon, { 
                backgroundColor: isDark ? 'rgba(232, 180, 248, 0.4)' : 'rgba(212, 165, 165, 0.45)' 
              }]}>
                <Text style={styles.emergingIconText}>🎯</Text>
              </View>
              <View style={styles.emergingTextContainer}>
                <Text style={[styles.emergingTitle, { color: theme.primaryText }]}>
                  Saving Goal Progress
                </Text>
                <Text style={[styles.emergingSubtitle, { color: theme.secondaryText }]}>
                  Your future self will thank you
                </Text>
              </View>
              <View style={styles.emergingAmount}>
                <Text style={[styles.emergingAmountText, { color: isDark ? '#E8B4F8' : '#D4A5A5' }]}>
                  ₹{Math.floor(monthlySaving)}
                </Text>
                <Text style={[styles.emergingAmountLabel, { color: theme.secondaryText }]}>
                  /month
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
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

// ============== STYLES ==============
const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 100 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24, 
    marginTop: 20 
  },
  greeting: { 
    fontSize: 12, 
    marginBottom: 6, 
    letterSpacing: 1.2, 
    textTransform: 'uppercase', 
    fontWeight: '400' 
  },
  userName: { 
    fontSize: 38, 
    fontWeight: '200', 
    letterSpacing: 0.8 
  },
  moonIcon: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // Slogan Card
  sloganCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  sloganIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  sloganIcon: {
    fontSize: 32,
  },
  sloganText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 28,
  },

  // Journey Path
  journeyContainer: {
    marginBottom: 24,
  },
  pathWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  planeIcon: {
    position: 'absolute',
    top: 22,
    left: 0,
  },
  planeEmoji: {
    fontSize: 28,
  },
  journeyText: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // Progress Ring + Graph Card
  progressGraphCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  circularSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  circularTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -75 }],
    width: 150,
    height: 150,
  },
  savedAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  savedLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  goalAmount: {
    fontSize: 13,
    fontWeight: '500',
  },
  graphSection: {
    marginTop: 8,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  lineGraph: {
    marginTop: 8,
  },

  // Action Boxes
  actionBoxesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBoxWrapper: {
    flex: 1,
  },
  actionBox: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  actionBoxIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBoxEmoji: {
    fontSize: 24,
  },
  actionBoxContent: {
    marginBottom: 8,
  },
  actionBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  actionBoxSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  plusIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // Today Status Card
  todayCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  todayAmount: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  monthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  motivationContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 20,
  },

  // Categories
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.8,
  },
  categoryCardNew: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 22,
  },
  categoryNameNew: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  progressBarContainer: {
    width: 120,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmountNew: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  categoryPercentNew: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 22,
  },

  // Transactions
  transactionsCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  transactionItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  transactionBorderNew: {
    borderBottomWidth: 1,
  },
  transactionIconNew: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionIconEmoji: {
    fontSize: 24,
  },
  transactionDetailsNew: {
    flex: 1,
  },
  transactionTitleNew: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  transactionDateNew: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmountNew: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Bottom Emerging Card
  emergingCardContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  emergingCard: {
    borderRadius: 26,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  emergingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emergingIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergingIconText: {
    fontSize: 28,
  },
  emergingTextContainer: {
    flex: 1,
  },
  emergingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  emergingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  emergingAmount: {
    alignItems: 'flex-end',
  },
  emergingAmountText: {
    fontSize: 22,
    fontWeight: '800',
  },
  emergingAmountLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Tab Bar
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
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});