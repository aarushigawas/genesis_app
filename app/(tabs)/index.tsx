// app/(tabs)/index.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ============== ANIMATED STAR BACKGROUND ==============
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

// ============== FLOATING ELEMENTS ==============
const FloatingIcon = ({ emoji, delay, style }: any) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -15,
              duration: 2500,
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(translateX, {
              toValue: 10,
              duration: 2500,
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: 1200,
              useNativeDriver: true,
              delay,
            }),
            Animated.timing(rotate, {
              toValue: 1,
              duration: 2500,
              useNativeDriver: true,
              delay,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    ).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <Text style={styles.floatingIcon}>{emoji}</Text>
    </Animated.View>
  );
};

// ============== ANIMATED BUTTON ==============
const AnimatedButton = ({ title, onPress, isPrimary }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {isPrimary ? (
          <LinearGradient
            colors={['#B4A4F8', '#9B8AE8', '#8B7AD8']}
            style={styles.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.primaryButtonText}>{title}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{title}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      
      <StarBackground />

      {/* Floating decorative icons */}
      <FloatingIcon emoji="💰" delay={0} style={styles.floatingIcon1} />
      <FloatingIcon emoji="📊" delay={600} style={styles.floatingIcon2} />
      <FloatingIcon emoji="💳" delay={1200} style={styles.floatingIcon3} />
      <FloatingIcon emoji="🎯" delay={1800} style={styles.floatingIcon4} />
      <FloatingIcon emoji="💸" delay={2400} style={styles.floatingIcon5} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Left side - Text */}
        <View style={styles.leftSection}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Track your expenses effortlessly</Text>
          <Text style={styles.description}>
            Manage your budget, visualize spending, and achieve your financial goals
          </Text>
        </View>

        {/* Right side - Illustration */}
        <View style={styles.rightSection}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/money_plant.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Buttons at bottom */}
        <View style={styles.buttonContainer}>
          <AnimatedButton
            title="Log In"
            isPrimary={false}
            onPress={() => router.push('/auth/login')}
          />
          <AnimatedButton
            title="Sign Up"
            isPrimary={true}
            onPress={() => router.push('/auth/signup')}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  leftSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 58,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#B8A4E8',
    marginBottom: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: '#8B7AA8',
    lineHeight: 22,
    maxWidth: '90%',
    fontWeight: '400',
  },
  rightSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  illustration: {
    width: 300,
    height: 300,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#E8B4F8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(184, 164, 232, 0.4)',
    backgroundColor: 'rgba(45, 38, 64, 0.5)',
  },
  secondaryButtonText: {
    color: '#E8B4F8',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  floatingIcon: {
    fontSize: 36,
  },
  floatingIcon1: {
    position: 'absolute',
    top: '12%',
    left: '8%',
  },
  floatingIcon2: {
    position: 'absolute',
    top: '18%',
    right: '12%',
  },
  floatingIcon3: {
    position: 'absolute',
    top: '35%',
    left: '15%',
  },
  floatingIcon4: {
    position: 'absolute',
    bottom: '35%',
    right: '10%',
  },
  floatingIcon5: {
    position: 'absolute',
    bottom: '25%',
    left: '12%',
  },
});