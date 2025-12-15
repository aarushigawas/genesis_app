// app/auth/verification_signup.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
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

export default function VerificationSignUpScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const params = useLocalSearchParams();
  
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendTimer, setResendTimer] = useState(60); // 60 seconds countdown
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [generatedEmailOTP, setGeneratedEmailOTP] = useState("");
  const [generatedPhoneOTP, setGeneratedPhoneOTP] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Extract user data from params
  const userData = {
    name: params.name as string,
    username: params.username as string,
    email: params.email as string,
    phoneNumber: params.phoneNumber as string,
    countryCode: params.countryCode as string,
    password: params.password as string,
  };

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

    // Send OTP on component mount
    sendOTP();
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [resendTimer]);

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  };

  const sendOTP = async () => {
    setLoading(true);
    try {
      // Generate OTPs
      const emailCode = generateOTP();
      const phoneCode = generateOTP();
      
      setGeneratedEmailOTP(emailCode);
      setGeneratedPhoneOTP(phoneCode);

      // Store OTPs in Firestore with expiration time (5 minutes)
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 5);

      await addDoc(collection(db, "verification_codes"), {
        email: userData.email,
        phoneNumber: `${userData.countryCode}${userData.phoneNumber}`,
        emailOTP: emailCode,
        phoneOTP: phoneCode,
        createdAt: serverTimestamp(),
        expiresAt: expirationTime,
        verified: false,
      });

      // In production, you would:
      // 1. Send email OTP using a service like SendGrid, AWS SES, or Firebase Functions
      // 2. Send SMS OTP using Twilio, AWS SNS, or similar service
      
      console.log("Email OTP:", emailCode);
      console.log("Phone OTP:", phoneCode);
      
      Alert.alert(
        "OTP Sent Successfully! 📧📱",
        `For testing:\nEmail OTP: ${emailCode}\nPhone OTP: ${phoneCode}\n\nIn production, these will be sent to your email and phone.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = () => {
    setResendTimer(60);
    setResendDisabled(true);
    setEmailOTP("");
    setPhoneOTP("");
    sendOTP();
  };

  const verifyAndSignup = async () => {
    if (!emailOTP.trim() || !phoneOTP.trim()) {
      Alert.alert("Missing OTP", "Please enter both email and phone OTP codes");
      return;
    }

    if (emailOTP.trim() !== generatedEmailOTP) {
      Alert.alert("Invalid Email OTP", "The email OTP you entered is incorrect");
      return;
    }

    if (phoneOTP.trim() !== generatedPhoneOTP) {
      Alert.alert("Invalid Phone OTP", "The phone OTP you entered is incorrect");
      return;
    }

    setLoading(true);
    try {
      // Create Firebase Auth account
      const userCred = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      const uid = userCred.user.uid;

      // Save user data to Firestore
      await setDoc(doc(db, "users", uid), {
        uid: uid,
        authProvider: "password",
        name: userData.name,
        username: userData.username,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        countryCode: userData.countryCode,
        isProfileComplete: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Successfully Signed Up! 🎉",
        "Your account has been created and verified. Please log in to continue.",
        [
          { 
            text: "Go to Login", 
            onPress: () => router.replace("/auth/login")
          }
        ]
      );
    } catch (err: any) {
      console.log("Signup error:", err.code, err.message);
      
      const errorCode = err.code;
      
      if (errorCode === "auth/email-already-in-use") {
        Alert.alert(
          "Account Already Exists",
          "An account with this email already exists. Would you like to log in instead?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Log In", onPress: () => router.replace("/auth/login") }
          ]
        );
      } else if (errorCode === "auth/network-request-failed") {
        Alert.alert("Network Error", "Please check your internet connection and try again.");
      } else {
        Alert.alert("Sign Up Failed", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  const maskPhone = (phone: string, countryCode: string) => {
    const lastDigits = phone.slice(-2);
    return `${countryCode} ***${lastDigits}`;
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

      {/* Theme Toggle Button */}
      <TouchableOpacity 
        style={styles.themeToggle}
        onPress={toggleTheme}
      >
        <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

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
            <View style={styles.headerSection}>
              <Text style={[styles.title, { color: theme.primaryText }]}>Verify Your Account</Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                We've sent verification codes to secure your account
              </Text>
            </View>

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

            <View style={styles.infoBox}>
              <Text style={[styles.infoText, { color: theme.secondaryText }]}>
                📧 Email: {maskEmail(userData.email)}
              </Text>
              <Text style={[styles.infoText, { color: theme.secondaryText }]}>
                📱 Phone: {maskPhone(userData.phoneNumber, userData.countryCode)}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.secondaryText }]}>Email OTP</Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: focusedField === 'emailOTP' ? theme.inputBorderFocused : theme.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={theme.inputPlaceholder}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={emailOTP}
                    onChangeText={setEmailOTP}
                    onFocus={() => setFocusedField('emailOTP')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.input, styles.otpInput, { color: theme.primaryText }]}
                    editable={!loading}
                  />
                </Animated.View>
                <Text style={[styles.hintText, { color: theme.tertiaryText }]}>
                  Check your email inbox and spam folder
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.secondaryText }]}>Phone OTP</Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: focusedField === 'phoneOTP' ? theme.inputBorderFocused : theme.inputBorder,
                    },
                  ]}
                >
                  <TextInput
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={theme.inputPlaceholder}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={phoneOTP}
                    onChangeText={setPhoneOTP}
                    onFocus={() => setFocusedField('phoneOTP')}
                    onBlur={() => setFocusedField(null)}
                    style={[styles.input, styles.otpInput, { color: theme.primaryText }]}
                    editable={!loading}
                  />
                </Animated.View>
                <Text style={[styles.hintText, { color: theme.tertiaryText }]}>
                  SMS sent to your phone number
                </Text>
              </View>
            </View>

            <View style={styles.resendContainer}>
              <TouchableOpacity 
                onPress={resendOTP}
                disabled={resendDisabled || loading}
              >
                <Text 
                  style={[
                    styles.resendText, 
                    { 
                      color: resendDisabled ? theme.tertiaryText : theme.accent[0],
                      opacity: resendDisabled ? 0.5 : 1,
                    }
                  ]}
                >
                  {resendDisabled 
                    ? `Resend code in ${resendTimer}s` 
                    : "Resend verification codes"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <AnimatedButton
                title={loading ? "Verifying..." : "Verify & Sign Up"}
                isPrimary={true}
                onPress={verifyAndSignup}
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
  content: { paddingHorizontal: 32, paddingTop: 80, paddingBottom: 40 },
  headerSection: { marginBottom: 30 },
  title: { fontSize: 42, fontWeight: '300', marginBottom: 16, letterSpacing: 1 },
  subtitle: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0.3 },
  imageContainer: { alignItems: 'center', marginBottom: 30 },
  illustration: { width: 200, height: 200 },
  infoBox: { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoText: { fontSize: 14, marginBottom: 8, fontWeight: '500', letterSpacing: 0.3 },
  form: { width: "100%", marginBottom: 20 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 10, letterSpacing: 0.5 },
  inputWrapper: { borderRadius: 14, borderWidth: 1.5 },
  input: { padding: 18, fontSize: 16 },
  otpInput: { textAlign: 'center', fontSize: 24, fontWeight: '600', letterSpacing: 8 },
  hintText: { fontSize: 11, marginTop: 8, marginLeft: 4, fontWeight: "400", textAlign: 'center' },
  resendContainer: { alignItems: 'center', marginBottom: 24 },
  resendText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  buttonContainer: { width: '100%', gap: 16 },
  primaryButton: { 
    paddingVertical: 18, 
    paddingHorizontal: 40, 
    borderRadius: 16, 
    alignItems: 'center', 
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
    borderWidth: 2 
  },
  secondaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
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
  themeToggleIcon: {
    fontSize: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
  },
});