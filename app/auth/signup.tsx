// app/auth/signup.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from "../../src2/firebase/config";

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

const AnimatedButton = ({ title, onPress, isPrimary, disabled }: any) => {
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
            <Text style={[styles.secondaryButtonText, { color: theme.accent[0] }]}>
              {title}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function SignUpScreen() {
  const { theme, isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 6) errors.push("at least 6 characters");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("one number");
    return errors;
  };

  const signup = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address");
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (!password) {
      Alert.alert("Missing Password", "Please enter a password");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      Alert.alert("Weak Password", `Your password must contain ${passwordErrors.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        email: email.trim(),
        createdAt: new Date().toISOString(),
      });

      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      console.log("Signup error:", err.code, err.message);
      
      const errorCode = err.code;
      
      if (errorCode === "auth/email-already-in-use") {
        Alert.alert(
          "Account Already Exists",
          "An account with this email already exists. Would you like to log in instead?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Log In", onPress: () => router.push("/auth/login") }
          ]
        );
      } else if (errorCode === "auth/invalid-email") {
        Alert.alert("Invalid Email", "Please enter a valid email address");
      } else if (errorCode === "auth/operation-not-allowed") {
        Alert.alert("Service Unavailable", "Email/password sign up is currently unavailable. Please try again later.");
      } else if (errorCode === "auth/weak-password") {
        Alert.alert("Weak Password", "Please choose a stronger password with at least 6 characters, including uppercase, lowercase, and numbers.");
      } else if (errorCode === "auth/network-request-failed") {
        Alert.alert("Network Error", "Please check your internet connection and try again.");
      } else {
        Alert.alert("Sign Up Failed", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                Track your expenses effortlessly
              </Text>
              <Text style={[styles.description, { color: theme.tertiaryText }]}>
                Manage your budget, visualize spending, and achieve your financial goals
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

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.secondaryText }]}>Email</Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: focusedField === 'email' ? theme.inputBorderFocused : theme.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    placeholder="your@email.com"
                    placeholderTextColor={theme.inputPlaceholder}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.input, { color: theme.primaryText }]}
                    editable={!loading}
                  />
                </Animated.View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.secondaryText }]}>Password</Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: focusedField === 'password' ? theme.inputBorderFocused : theme.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={theme.inputPlaceholder}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.input, { color: theme.primaryText }]}
                    editable={!loading}
                  />
                </Animated.View>
                <Text style={[styles.hintText, { color: theme.tertiaryText }]}>
                  Must be 6+ characters with uppercase, lowercase, and number
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <AnimatedButton
                title={loading ? "Creating Account..." : "Sign Up"}
                isPrimary={true}
                onPress={signup}
                disabled={loading}
              />
              <TouchableOpacity 
                onPress={() => router.push("/auth/login")}
                disabled={loading}
              >
                <Text style={[styles.footerText, { color: theme.secondaryText }]}>
                  Already have an account?{' '}
                  <Text style={[styles.link, { color: theme.accent[0] }]}>Log In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { paddingHorizontal: 32, paddingTop: 60, paddingBottom: 40 },
  leftSection: { marginBottom: 30 },
  title: { fontSize: 58, fontWeight: '300', marginBottom: 16, letterSpacing: 1 },
  subtitle: { fontSize: 18, marginBottom: 12, fontWeight: '500', letterSpacing: 0.3 },
  description: { fontSize: 14, lineHeight: 22, maxWidth: '90%', fontWeight: '400' },
  rightSection: { justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  imageContainer: { width: '100%', alignItems: 'center' },
  illustration: { width: 300, height: 300 },
  form: { width: "100%", marginBottom: 20 },
  inputContainer: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 10, letterSpacing: 0.5 },
  inputWrapper: { borderRadius: 14, borderWidth: 1.5 },
  input: { padding: 18, fontSize: 16 },
  hintText: { fontSize: 11, marginTop: 6, marginLeft: 4, fontWeight: "400" },
  buttonContainer: { width: '100%', gap: 16 },
  primaryButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  primaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  secondaryButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', borderWidth: 2 },
  secondaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  footerText: { fontSize: 14, textAlign: 'center' },
  link: { fontWeight: "700" },
});