// app/(tabs)/dashboard.tsx
import { LinearGradient } from 'expo-linear-gradient';
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
import { Circle, Defs, Path, RadialGradient, Stop, Svg, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// MOCK DATA
const user = {
  name: "Aaru",
  monthlyBudget: 8000,
};

const expenses = [
  { id: "1", title: "Swiggy", amount: 320, category: "Food", date: "2025-04-12" },
  { id: "2", title: "Uber", amount: 180, category: "Travel", date: "2025-04-11" },
  { id: "3", title: "Electricity Bill", amount: 950, category: "Bills", date: "2025-04-10" },
  { id: "4", title: "Zomato", amount: 410, category: "Food", date: "2025-04-09" },
  { id: "5", title: "Netflix", amount: 499, category: "Bills", date: "2025-04-08" },
  { id: "6", title: "Bus Pass", amount: 300, category: "Travel", date: "2025-04-07" },
];

const categories = [
  { name: "Food", color: "#E8B4F8" },
  { name: "Travel", color: "#B4A4F8" },
  { name: "Bills", color: "#D4B4F8" },
];

// ============== ANIMATED STAR BACKGROUND ==============
const DreamyStarBackground = () => {
  const [stars, setStars] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const animationRef = useRef<number>(0);

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

    // Animate stars continuously
    const animate = () => {
      animationRef.current += 0.016;
      setStars(prevStars => 
        prevStars.map(star => ({
          ...star,
          x: (star.x + star.speedX + width) % width,
          y: (star.y + star.speedY + height) % height,
          opacity: star.baseOpacity + Math.sin(animationRef.current * star.pulseSpeed + star.pulsePhase) * 0.3,
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
      const distance = Math.sqrt(
        Math.pow(star.x - locationX, 2) + Math.pow(star.y - locationY, 2)
      );
      return distance < 180;
    });

    setConnections(nearby.map(star => ({
      x1: locationX,
      y1: locationY,
      x2: star.x,
      y2: star.y,
      id: Math.random(),
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
          <Circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill="url(#starGlow)"
            opacity={star.opacity || star.baseOpacity}
          />
        ))}

        {connections.map((conn) => (
          <Path
            key={`line-${conn.id}`}
            d={`M ${conn.x1} ${conn.y1} L ${conn.x2} ${conn.y2}`}
            stroke="#E8B4F8"
            strokeWidth="2"
            opacity="0.6"
          />
        ))}
      </Svg>
    </View>
  );
};

// ============== ANIMATED CARD WITH HOVER ==============
const AnimatedCard = ({ children, style, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(184, 164, 232, 0.2)', 'rgba(232, 180, 248, 0.6)'],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[
        styles.glassCard, 
        style, 
        { 
          transform: [{ scale: scaleAnim }],
          borderColor: borderColor,
        }
      ]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ============== CIRCULAR PROGRESS ==============
const CircularProgress = ({ spent, budget }: any) => {
  const percentage = Math.min((spent / budget) * 100, 100);
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  return (
    <View style={styles.circularContainer}>
      <Svg width={140} height={140}>
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E8B4F8" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#D4A4F8" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#B4A4F8" stopOpacity="0.9" />
          </SvgLinearGradient>
          <RadialGradient id="glowEffect" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0%" stopColor="#E8B4F8" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#E8B4F8" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        
        <Circle cx="70" cy="70" r={radius + 12} fill="url(#glowEffect)" />
        
        <Circle
          cx="70"
          cy="70"
          r={radius}
          stroke="rgba(184, 164, 232, 0.25)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        <Circle
          cx="70"
          cy="70"
          r={radius}
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
        <Text style={styles.circularAmount}>₹{spent}</Text>
        <Text style={styles.circularLabel}>spent</Text>
      </View>
    </View>
  );
};

// ============== ANIMATED BUTTON ==============
const AnimatedButton = ({ icon, text, colors, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elevationAnim = useRef(new Animated.Value(5)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.93,
        useNativeDriver: true,
        friction: 4,
      }),
      Animated.timing(elevationAnim, {
        toValue: 12,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
      Animated.timing(elevationAnim, {
        toValue: 5,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.actionButton}
    >
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }],
        elevation: elevationAnim,
      }}>
        <LinearGradient
          colors={colors}
          style={styles.actionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.actionIcon}>{icon}</Text>
          <Text style={styles.actionText}>{text}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ============== MAIN DASHBOARD ==============
export default function Dashboard() {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = user.monthlyBudget - totalSpent;
  const isOverBudget = remaining < 0;

  const categoryData = categories.map(cat => ({
    ...cat,
    amount: expenses
      .filter(exp => exp.category === cat.name)
      .reduce((sum, exp) => sum + exp.amount, 0),
  }));

  const recentExpenses = expenses.slice(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1428" />
      
      <LinearGradient
        colors={['#1A1428', '#2D1B3D', '#1A1428', '#2D1B3D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.3, 0.7, 1]}
      />
      
      <DreamyStarBackground />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Evening</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <LinearGradient
            colors={['rgba(184, 164, 232, 0.25)', 'rgba(232, 180, 248, 0.18)']}
            style={styles.moonIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={{ fontSize: 26 }}>🌙</Text>
          </LinearGradient>
        </View>

        {/* CIRCULAR SUMMARY */}
        <AnimatedCard style={styles.summaryCard}>
          <CircularProgress spent={totalSpent} budget={user.monthlyBudget} />
          
          <View style={styles.budgetInfo}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Budget</Text>
              <Text style={styles.budgetValue}>₹{user.monthlyBudget}</Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: isOverBudget ? '#FFB4B4' : '#B4F8D4' }]}>
                {isOverBudget ? 'Over' : 'Remaining'}
              </Text>
              <Text style={[styles.budgetValue, { color: isOverBudget ? '#FFB4B4' : '#B4F8D4' }]}>
                ₹{Math.abs(remaining)}
              </Text>
            </View>
          </View>
        </AnimatedCard>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          
          {categoryData.map((cat, index) => {
            const percentage = totalSpent > 0 ? ((cat.amount / totalSpent) * 100).toFixed(0) : 0;
            return (
              <AnimatedCard key={index} style={styles.categoryCard}>
                <View style={styles.categoryRow}>
                  <LinearGradient
                    colors={[cat.color, cat.color + 'AA']}
                    style={styles.categoryDot}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={styles.categoryValue}>₹{cat.amount}</Text>
                  <Text style={styles.categoryPercent}>{percentage}%</Text>
                </View>
              </AnimatedCard>
            );
          })}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.actionsRow}>
          <AnimatedButton 
            icon="➕" 
            text="Add" 
            colors={['#B4A4F8', '#9B8AE8', '#8B7AD8']}
            onPress={() => {}}
          />
          <AnimatedButton 
            icon="📊" 
            text="Stats" 
            colors={['#E8B4F8', '#D8A4F8', '#C894E8']}
            onPress={() => {}}
          />
        </View>

        {/* RECENT TRANSACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          
          <AnimatedCard>
            {recentExpenses.map((expense, idx) => {
              const category = categories.find(cat => cat.name === expense.category);
              const icon = expense.category === 'Food' ? '🍔' : 
                          expense.category === 'Travel' ? '🚗' : '💡';

              return (
                <View
                  key={expense.id}
                  style={[
                    styles.transactionItem,
                    idx !== recentExpenses.length - 1 && styles.transactionBorder
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
                    <Text style={styles.transactionTitle}>{expense.title}</Text>
                    <Text style={styles.transactionDate}>{expense.date}</Text>
                  </View>
                  <Text style={styles.transactionAmount}>₹{expense.amount}</Text>
                </View>
              );
            })}
          </AnimatedCard>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============== STYLES ==============
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  greeting: {
    fontSize: 12,
    color: '#B8A4E8',
    marginBottom: 6,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '400',
  },
  userName: {
    fontSize: 38,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  moonIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(45, 38, 64, 0.5)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 164, 232, 0.2)',
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  circularText: {
    position: 'absolute',
    alignItems: 'center',
  },
  circularAmount: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  circularLabel: {
    fontSize: 11,
    color: '#B8A4E8',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  budgetInfo: {
    width: '100%',
    gap: 14,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 13,
    color: '#B8A4E8',
    letterSpacing: 0.8,
    fontWeight: '400',
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
    letterSpacing: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  categoryName: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.4,
    fontWeight: '500',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categoryPercent: {
    fontSize: 11,
    color: '#B8A4E8',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#E8B4F8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  actionGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 164, 232, 0.12)',
  },
  transactionIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: '#B8A4E8',
    fontWeight: '400',
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFB4B4',
  },
});