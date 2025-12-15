// app/auth/password_change.tsx
import CryptoJS from 'crypto-js';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from "expo-router";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
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
import { db } from "../../src2/firebase/config";

const { width, height } = Dimensions.get('window');

// Password hashing function using SHA-256
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

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

export default function PasswordChangeScreen() {
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const credential = params.credential as string;
  const method = params.method as string;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [foundUserId, setFoundUserId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Check if we have userId OR credential+method
    if (!userId && (!credential || !method)) {
      Alert.alert("Error", "Invalid session. Please try again.", [
        { text: "OK", onPress: () => router.replace("/auth/login-options") }
      ]);
      return;
    }

    // If credential and method provided (from forgot password), find the user
    if (credential && method && !userId) {
      findUserByCredential();
    }

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

  const findUserByCredential = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where(method, "==", credential));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setFoundUserId(userDoc.id);
      } else {
        Alert.alert("Error", "User not found. Please try again.", [
          { text: "OK", onPress: () => router.replace("/auth/login-options") }
        ]);
      }
    } catch (error) {
      console.error("Error finding user:", error);
      Alert.alert("Error", "Failed to verify user. Please try again.", [
        { text: "OK", onPress: () => router.replace("/auth/login-options") }
      ]);
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing Input", "Please fill in all fields");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert("Invalid Password", passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }

    // Determine which user ID to use
    const targetUserId = userId || foundUserId;
    
    if (!targetUserId) {
      Alert.alert("Error", "Unable to identify user. Please try again.");
      return;
    }

    setLoading(true);
    try {
      // Hash the new password
      const hashedPassword = hashPassword(newPassword);

      // Update ONLY Firestore - this is the source of truth for passwords
      const userDocRef = doc(db, "users", targetUserId);
      await updateDoc(userDocRef, {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
      });

      console.log("Password updated successfully in Firestore for user:", targetUserId);

      Alert.alert(
        "Password Changed Successfully! 🎉",
        "Redirecting to login...",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth/login")
          }
        ]
      );
      
      // Auto redirect after 2 seconds if user doesn't click OK
      setTimeout(() => {
        router.replace("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Failed to change password. Please try again.");
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
              <Text style={[styles.title, { color: theme.primaryText }]}>
                Reset Password
              </Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                Create a strong new password for your account
              </Text>
            </View>

            <View style={styles.rightSection}>
              <View style={styles.imageContainer}>
                <Image
                  source={
                    isDark
                      ? require('../../assets/images/handmoney.png')
                      : require('../../assets/images/piggy_money.png')
                  }
                  style={styles.illustration}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.secondaryText }]}>
                  New Password
                </Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: focusedField === 'newPassword' ? theme.inputBorderFocused : theme.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    placeholder="Enter new password"
                    placeholderTextColor={theme.inputPlaceholder}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    onFocus={() => setFocusedField('newPassword')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.input, { color: theme.primaryText }]}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.secondaryText }]}>
                  Confirm Password
                </Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: focusedField === 'confirmPassword' ? theme.inputBorderFocused : theme.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.inputPlaceholder}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.input, { color: theme.primaryText }]}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <View style={styles.passwordRequirements}>
                <Text style={[styles.requirementsTitle, { color: theme.secondaryText }]}>
                  Password must contain:
                </Text>
                <Text style={[styles.requirementText, { color: theme.tertiaryText }]}>
                  • At least 6 characters
                </Text>
                <Text style={[styles.requirementText, { color: theme.tertiaryText }]}>
                  • One uppercase letter (A-Z)
                </Text>
                <Text style={[styles.requirementText, { color: theme.tertiaryText }]}>
                  • One lowercase letter (a-z)
                </Text>
                <Text style={[styles.requirementText, { color: theme.tertiaryText }]}>
                  • One number (0-9)
                </Text>
              </View>

              <AnimatedButton
                title={loading ? "Changing Password..." : "Reset Password"}
                isPrimary={true}
                onPress={handleChangePassword}
                disabled={loading}
              />
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
  title: { fontSize: 48, fontWeight: '300', marginBottom: 16, letterSpacing: 1 },
  subtitle: { fontSize: 16, marginBottom: 12, fontWeight: '500', letterSpacing: 0.3 },
  rightSection: { justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  imageContainer: { width: '100%', alignItems: 'center' },
  illustration: { width: 280, height: 280 },
  form: { width: "100%", gap: 20 },
  inputContainer: { marginBottom: 0 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 10, letterSpacing: 0.5 },
  inputWrapper: { borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, padding: 18, fontSize: 16 },
  eyeIcon: { paddingHorizontal: 16 },
  passwordRequirements: { marginTop: 8, marginBottom: 8 },
  requirementsTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  requirementText: { fontSize: 12, marginBottom: 4, marginLeft: 8 },
  primaryButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  primaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  secondaryButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', borderWidth: 2 },
  secondaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
});