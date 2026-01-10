import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');
const STAR_COUNT = 60; // abundance 🌌

export default function StarBackground() {
  const stars = useRef(
    Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      drift: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random()),
    }))
  ).current;

  useEffect(() => {
    stars.forEach((star, i) => {
      // vertical drift
      Animated.loop(
        Animated.timing(star.drift, {
          toValue: -50,
          duration: 18000 + i * 300,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // soft twinkle
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: 1,
            duration: 4000 + i * 50,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: 0.3,
            duration: 4000 + i * 50,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <>
      {stars.map((star, index) => (
        <Animated.View
          key={index}
          style={[
            styles.star,
            {
              left: star.x,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
              transform: [{ translateY: star.drift }],
            },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
