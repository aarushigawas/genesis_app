// app/auth/forgot_password_login.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
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

export default function ForgotPasswordScreen() {
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState<'method' | 'input' | 'otp'>('method');
  const [method, setMethod] = useState<'email' | 'phone' | null>(null);
  const [credential, setCredential] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

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

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const selectMethod = (selectedMethod: 'email' | 'phone') => {
    setMethod(selectedMethod);
    setStep('input');
  };

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTP = async () => {
    if (!credential.trim()) {
      Alert.alert("Missing Input", `Please enter your ${method}`);
      return;
    }

    if (method === 'email' && !validateEmail(credential.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (method === 'phone' && !validatePhoneNumber(credential.trim())) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const newOtp = generateOTP();
      setGeneratedOtp(newOtp);

      // Store OTP in Firestore
      const otpData = {
        [method as string]: credential.trim(),
        otp: newOtp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        type: 'password_reset'
      };

      await addDoc(collection(db, "otps"), otpData);

      // In production, send OTP via email/SMS service
      console.log(`OTP sent to ${credential}: ${newOtp}`);
      
      Alert.alert(
        "OTP Sent",
        `A 6-digit OTP has been sent to your ${method}. (Dev: ${newOtp})`
      );

      setStep('otp');
      setTimer(60); // 60 seconds timer
      setCanResend(false);
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setTimer(60);
    await sendOTP();
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert("Missing OTP", "Please enter the OTP");
      return;
    }

    if (otp.trim().length !== 6) {
      Alert.alert("Invalid OTP", "OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      // Query Firestore for the OTP
      const otpsRef = collection(db, "otps");
      const q = query(
        otpsRef,
        where(method as string, "==", credential.trim()),
        where("otp", "==", otp.trim()),
        where("type", "==", "password_reset")
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        Alert.alert("Invalid OTP", "The OTP you entered is incorrect");
        return;
      }

      // Check if OTP is expired
      const otpDoc = querySnapshot.docs[0];
      const otpData = otpDoc.data();
      const expiresAt = otpData.expiresAt.toDate();
      
      if (new Date() > expiresAt) {
        Alert.alert("OTP Expired", "This OTP has expired. Please request a new one.");
        await deleteDoc(doc(db, "otps", otpDoc.id));
        return;
      }

      // OTP verified successfully - delete OTP and redirect to password change
      await deleteDoc(doc(db, "otps", otpDoc.id));
      
      // Redirect to password change screen
      router.push({
        pathname: "/auth/password_change",
        params: {
          credential: credential.trim(),
          method: method as string
        }
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp') {
      setStep('input');
      setOtp("");
      setTimer(0);
      setCanResend(false);
    } else if (step === 'input') {
      setStep('method');
      setCredential("");
      setMethod(null);
    } else {
      router.back();
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
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: theme.accent[0] }]}>
                ← Back
              </Text>
            </TouchableOpacity>

            <View style={styles.leftSection}>
              <Text style={[styles.title, { color: theme.primaryText }]}>
                {step === 'method' ? 'Forgot Password?' : step === 'input' ? 'Enter Details' : 'Verify OTP'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                {step === 'method' 
                  ? 'Choose how you want to receive your OTP' 
                  : step === 'input'
                  ? `Enter your ${method} to receive OTP`
                  : 'Enter the 6-digit code sent to you'}
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

            {step === 'method' && (
              <View style={styles.methodContainer}>
                <TouchableOpacity
                  style={[styles.methodButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                  onPress={() => selectMethod('email')}
                >
                  <Text style={[styles.methodButtonText, { color: theme.primaryText }]}>
                    📧 Receive OTP via Email
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.methodButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                  onPress={() => selectMethod('phone')}
                >
                  <Text style={[styles.methodButtonText, { color: theme.primaryText }]}>
                    📱 Receive OTP via Phone
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'input' && (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.secondaryText }]}>
                    {method === 'email' ? 'Email Address' : 'Phone Number'}
                  </Text>
                  <Animated.View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: focusedField === 'credential' ? theme.inputBorderFocused : theme.inputBorder,
                      },
                    ]}
                  >
                    <TextInput
                      placeholder={method === 'email' ? 'your@email.com' : '9876543210'}
                      placeholderTextColor={theme.inputPlaceholder}
                      autoCapitalize="none"
                      keyboardType={method === 'email' ? 'email-address' : 'numeric'}
                      value={credential}
                      onChangeText={setCredential}
                      onFocus={() => setFocusedField('credential')}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.input, { color: theme.primaryText }]}
                      editable={!loading}
                      maxLength={method === 'phone' ? 10 : undefined}
                    />
                  </Animated.View>
                </View>

                <AnimatedButton
                  title={loading ? "Sending OTP..." : "Send OTP"}
                  isPrimary={true}
                  onPress={sendOTP}
                  disabled={loading}
                />
              </View>
            )}

            {step === 'otp' && (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.secondaryText }]}>
                    Enter OTP
                  </Text>
                  <Animated.View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: focusedField === 'otp' ? theme.inputBorderFocused : theme.inputBorder,
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="123456"
                      placeholderTextColor={theme.inputPlaceholder}
                      keyboardType="numeric"
                      value={otp}
                      onChangeText={setOtp}
                      onFocus={() => setFocusedField('otp')}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.input, { color: theme.primaryText, letterSpacing: 8, textAlign: 'center' }]}
                      editable={!loading}
                      maxLength={6}
                    />
                  </Animated.View>
                </View>

                <View style={styles.timerContainer}>
                  {timer > 0 ? (
                    <Text style={[styles.timerText, { color: theme.secondaryText }]}>
                      Resend OTP in {timer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={resendOTP} disabled={!canResend || loading}>
                      <Text style={[styles.resendText, { color: canResend ? theme.accent[0] : theme.tertiaryText }]}>
                        Resend OTP
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <AnimatedButton
                  title={loading ? "Verifying..." : "Verify OTP"}
                  isPrimary={true}
                  onPress={verifyOTP}
                  disabled={loading}
                />
              </View>
            )}
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
  backButton: { marginBottom: 20 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  leftSection: { marginBottom: 30 },
  title: { fontSize: 48, fontWeight: '300', marginBottom: 16, letterSpacing: 1 },
  subtitle: { fontSize: 16, marginBottom: 12, fontWeight: '500', letterSpacing: 0.3 },
  rightSection: { justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  imageContainer: { width: '100%', alignItems: 'center' },
  illustration: { width: 280, height: 280 },
  methodContainer: { width: '100%', gap: 16 },
  methodButton: { paddingVertical: 20, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  methodButtonText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  form: { width: "100%", gap: 20 },
  inputContainer: { marginBottom: 0 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 10, letterSpacing: 0.5 },
  inputWrapper: { borderRadius: 14, borderWidth: 1.5 },
  input: { padding: 18, fontSize: 16 },
  timerContainer: { alignItems: 'center', marginVertical: 8 },
  timerText: { fontSize: 14, fontWeight: '500' },
  resendText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  primaryButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  primaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  secondaryButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', borderWidth: 2 },
  secondaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
});