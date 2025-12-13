// app/auth/login.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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
import { auth } from "../../src2/firebase/config";

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

// ============== ANIMATED BUTTON ==============
const AnimatedButton = ({ title, onPress, isPrimary, disabled }: any) => {
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
            colors={disabled ? ['#6B5B88', '#5B4B78', '#4B3B68'] : ['#B4A4F8', '#9B8AE8', '#8B7AD8']}
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

export default function LoginScreen() {
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

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const login = async () => {
    // Basic validation
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address");
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (!password) {
      Alert.alert("Missing Password", "Please enter your password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      console.log("Login error:", err.code, err.message);
      
      // Handle Firebase errors with Alert
      const errorCode = err.code;
      
      if (errorCode === "auth/user-not-found" || errorCode === "auth/invalid-credential") {
        Alert.alert(
          "Account Not Found",
          "No account exists with this email. Would you like to sign up?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Up", onPress: () => router.push("/auth/signup") }
          ]
        );
      } else if (errorCode === "auth/wrong-password") {
        Alert.alert(
          "Incorrect Password",
          "The password you entered is incorrect. Please try again."
        );
      } else if (errorCode === "auth/invalid-email") {
        Alert.alert(
          "Invalid Email",
          "Please enter a valid email address"
        );
      } else if (errorCode === "auth/user-disabled") {
        Alert.alert(
          "Account Disabled",
          "This account has been disabled. Please contact support."
        );
      } else if (errorCode === "auth/too-many-requests") {
        Alert.alert(
          "Too Many Attempts",
          "Too many failed login attempts. Please try again later or reset your password."
        );
      } else if (errorCode === "auth/network-request-failed") {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again."
        );
      } else {
        // Catch-all for any other errors including auth/invalid-credential
        Alert.alert(
          "Login Failed",
          "Email or password is incorrect. If you don't have an account, please sign up.",
          [
            { text: "OK", style: "cancel" },
            { text: "Sign Up", onPress: () => router.push("/auth/signup") }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1428" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#1A1428', '#2D1B3D', '#1A1428', '#2D1B3D']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.3, 0.7, 1]}
      />
      
      <StarBackground />

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
            {/* Left side - Text */}
            <View style={styles.leftSection}>
              <Text style={styles.title}>Log In</Text>
              <Text style={styles.subtitle}>Track your expenses effortlessly</Text>
              <Text style={styles.description}>
                Manage your budget, visualize spending, and achieve your financial goals
              </Text>
            </View>

            {/* Right side - Illustration */}
            <View style={styles.rightSection}>
              <View style={styles.imageContainer}>
                <Image
                  source={require('../../assets/images/handmoney.png')}
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    placeholder="your@email.com"
                    placeholderTextColor="#766B8E"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.input}
                    editable={!loading}
                  />
                </Animated.View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#766B8E"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.input}
                    editable={!loading}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <AnimatedButton
                title={loading ? "Signing in..." : "Sign In"}
                isPrimary={true}
                onPress={login}
                disabled={loading}
              />
              <TouchableOpacity 
                onPress={() => router.push("/auth/signup")}
                disabled={loading}
              >
                <Text style={styles.footerText}>
                  Don't have an account? <Text style={styles.link}>Sign Up</Text>
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
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  leftSection: {
    marginBottom: 30,
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
  form: {
    width: "100%",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B8A4E8",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    backgroundColor: "rgba(45, 38, 64, 0.6)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(184, 164, 232, 0.2)",
  },
  inputWrapperFocused: {
    borderColor: "rgba(232, 180, 248, 0.6)",
    backgroundColor: "rgba(45, 38, 64, 0.8)",
  },
  input: {
    padding: 18,
    fontSize: 16,
    color: "#ffffff",
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
  footerText: {
    color: "#B8A4E8",
    fontSize: 14,
    textAlign: 'center',
  },
  link: {
    color: "#E8B4F8",
    fontWeight: "700",
  },
});