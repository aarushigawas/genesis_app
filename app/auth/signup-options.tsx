// app/auth/signup-options.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
//import GoogleAuth from '../../components/firebase-auth/google-auth.tsx  →  google-auth.disabled';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from "../../src2/firebase/config";

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

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

const FloatingFlowers = () => {
  const [flowers, setFlowers] = useState<any[]>([]);

  useEffect(() => {
    const newFlowers = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 30 + 20,
      rotation: Math.random() * 360,
      baseOpacity: Math.random() * 0.3 + 0.15,
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

const AnimatedButton = ({ title, onPress, isPrimary, disabled, icon }: any) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  };

  const disabledColors: readonly [string, string, string] = ['#6B5B88', '#5B4B78', '#4B3B68'];

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {isPrimary ? (
          <LinearGradient
            colors={disabled ? disabledColors : theme.buttonPrimary}
            style={styles.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
            <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>
              {title}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.buttonSecondary,
                borderColor: theme.buttonSecondaryBorder,
              },
            ]}
          >
            {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
            <Text style={[styles.secondaryButtonText, { color: theme.accent[0] }]}>
              {title}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function SignUpOptionsScreen() {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
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

  const handleGoogleSignInSuccess = async (idToken: string, accessToken: string) => {
    try {
      setLoading(true);
      
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || '',
          googleId: user.uid,
          photoURL: user.photoURL || '',
          authProvider: 'google',
          createdAt: serverTimestamp(),
          isProfileComplete: false,
        });
        
        if (!user.phoneNumber) {
          router.replace({
            pathname: '/auth/complete-profile',
            params: {
              userId: user.uid,
              email: user.email || '',
              name: user.displayName || '',
            }
          });
        } else {
          await setDoc(userDocRef, {
            phoneNumber: user.phoneNumber,
            isProfileComplete: true,
          }, { merge: true });
          
          router.replace('/(tabs)/dashboard');
        }
      } else {
        const userData = userDoc.data();
        if (!userData.phoneNumber) {
          router.replace({
            pathname: '/auth/complete-profile',
            params: {
              userId: user.uid,
              email: user.email || '',
              name: user.displayName || '',
            }
          });
        } else {
          router.replace('/(tabs)/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'An error occurred during Google sign-in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInError = (error: any) => {
    console.error('Google Auth Error:', error);
    Alert.alert('Authentication Error', error.message || 'Failed to authenticate with Google. Please try again.');
  };

  const handleManualSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={[...theme.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[...theme.backgroundLocations]}
      />
      
      {isDark ? <StarBackground /> : <FloatingFlowers />}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.leftSection}>
          <Text style={[styles.title, { color: theme.primaryText }]}>Sign Up</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Choose your signup method
          </Text>
          <Text style={[styles.description, { color: theme.tertiaryText }]}>
            Create an account to start tracking your expenses and achieve your financial goals
          </Text>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.imageContainer}>
            <Image
              source={
                isDark
                  ? require('../../assets/images/jarmoney.png')
                  : require('../../assets/images/piggy_sleep_money.png')
              }
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
           
          {/*
          <GoogleAuth
            onSuccess={handleGoogleSignInSuccess}
            onError={handleGoogleSignInError}
            disabled={loading}
          />
*/}

          
          
          
          
          <AnimatedButton
            title="Sign up with Email"
            isPrimary={true}
            onPress={handleManualSignup}
            disabled={loading}
            icon="✉️"
          />
          
          <TouchableOpacity 
            onPress={() => router.push('/auth/login-options')}
            disabled={loading}
          >
            <Text style={[styles.footerText, { color: theme.secondaryText }]}>
              Already have an account?{' '}
              <Text style={[styles.link, { color: theme.accent[0] }]}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 60, paddingBottom: 40 },
  leftSection: { marginBottom: 30 },
  title: { fontSize: 58, fontWeight: '300', marginBottom: 16, letterSpacing: 1 },
  subtitle: { fontSize: 18, marginBottom: 12, fontWeight: '500', letterSpacing: 0.3 },
  description: { fontSize: 14, lineHeight: 22, maxWidth: '90%', fontWeight: '400' },
  rightSection: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  imageContainer: { width: '100%', alignItems: 'center' },
  illustration: { width: 300, height: 300 },
  buttonContainer: { width: '100%', gap: 16 },
  primaryButton: { 
    paddingVertical: 18, 
    paddingHorizontal: 40, 
    borderRadius: 16, 
    alignItems: 'center', 
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 8, 
    elevation: 6 
  },
  primaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  secondaryButton: { 
    paddingVertical: 18, 
    paddingHorizontal: 40, 
    borderRadius: 16, 
    alignItems: 'center', 
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2 
  },
  secondaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  buttonIcon: { fontSize: 24 },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 8 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    opacity: 0.3 
  },
  dividerText: { 
    marginHorizontal: 16, 
    fontSize: 14, 
    fontWeight: '600',
    opacity: 0.6 
  },
  footerText: { fontSize: 14, textAlign: 'center' },
  link: { fontWeight: "700" },
});