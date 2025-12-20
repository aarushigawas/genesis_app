// app/(onboarding)/_layout.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

export default function OnboardingLayout() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={Array.isArray(theme.background) ? theme.background : ['#ffffff', '#f0f0f0']}
        locations={Array.isArray(theme.backgroundLocations) ? theme.backgroundLocations : [0, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {isDark ? <StarBackground /> : <FlowerBackground />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </>
  );
}

// Star animation for dark mode
function StarBackground() {
  const star1 = useRef(new Animated.Value(0)).current;
  const star2 = useRef(new Animated.Value(0)).current;
  const star3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createStarAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createStarAnimation(star1, 3000);
    const anim2 = createStarAnimation(star2, 4000);
    const anim3 = createStarAnimation(star3, 5000);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const opacity1 = star1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const opacity2 = star2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  const opacity3 = star3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <>
      <Animated.View style={[styles.star, { top: '15%', left: '20%', opacity: opacity1 }]} />
      <Animated.View style={[styles.star, { top: '40%', right: '15%', opacity: opacity2 }]} />
      <Animated.View style={[styles.star, { bottom: '25%', left: '30%', opacity: opacity3 }]} />
      <Animated.View style={[styles.star, { top: '60%', right: '40%', opacity: opacity1 }]} />
      <Animated.View style={[styles.star, { bottom: '40%', right: '25%', opacity: opacity2 }]} />
    </>
  );
}

// Flower animation for light mode
function FlowerBackground() {
  const flower1 = useRef(new Animated.Value(0)).current;
  const flower2 = useRef(new Animated.Value(0)).current;
  const flower3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createFlowerAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createFlowerAnimation(flower1, 4000);
    const anim2 = createFlowerAnimation(flower2, 5000);
    const anim3 = createFlowerAnimation(flower3, 6000);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const opacity1 = flower1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  const opacity2 = flower2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.5],
  });

  const opacity3 = flower3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.7],
  });

  return (
    <>
      <Animated.View style={[styles.flower, { top: '10%', right: '10%', opacity: opacity1 }]} />
      <Animated.View style={[styles.flower, { top: '45%', left: '10%', opacity: opacity2 }]} />
      <Animated.View style={[styles.flower, { bottom: '20%', right: '20%', opacity: opacity3 }]} />
      <Animated.View style={[styles.flower, { top: '65%', right: '35%', opacity: opacity1 }]} />
      <Animated.View style={[styles.flower, { bottom: '45%', left: '25%', opacity: opacity2 }]} />
    </>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8B4F8',
  },
  flower: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4A5A5',
  },
});