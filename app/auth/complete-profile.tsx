// app/auth/complete-profile.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from "expo-router";
import { doc, updateDoc } from 'firebase/firestore';
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

export default function CompleteProfileScreen() {
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams();
  const { userId, email, name } = params;
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
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

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\d{7,15}$/;
    return phoneRegex.test(phone);
  };

  const handleComplete = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Missing Phone Number", "Please enter your phone number to continue");
      return;
    }

    if (!validatePhoneNumber(phoneNumber.trim())) {
      Alert.alert("Invalid Phone Number", "Please enter a valid phone number (7-15 digits)");
      return;
    }

    setLoading(true);
    try {
      // Update user document with phone number
      const userDocRef = doc(db, 'users', userId as string);
      await updateDoc(userDocRef, {
        phoneNumber: phoneNumber.trim(),
        countryCode: countryCode,
        profileCompleted: true,
        updatedAt: new Date(),
      });

      // Navigate to dashboard
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      console.error('Profile Update Error:', error);
      Alert.alert(
        'Update Failed',
        'Failed to update your profile. Please try again.'
      );
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
              <Text style={[styles.title, { color: theme.primaryText }]}>Complete Profile</Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                One more step to get started
              </Text>
              <Text style={[styles.description, { color: theme.tertiaryText }]}>
                We couldn't find a phone number linked to your Google account. Please add one to secure your account and continue.
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

            <View style={styles.infoCard}>
              <Text style={[styles.infoTitle, { color: theme.primaryText }]}>
                Account Information
              </Text>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.tertiaryText }]}>Name:</Text>
                <Text style={[styles.infoValue, { color: theme.secondaryText }]}>{name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.tertiaryText }]}>Email:</Text>
                <Text style={[styles.infoValue, { color: theme.secondaryText }]}>{email}</Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.secondaryText }]}>Phone Number *</Text>
                <View style={styles.phoneContainer}>
                  <Animated.View
                    style={[
                      styles.countryCodeWrapper,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: focusedField === 'countryCode' ? theme.inputBorderFocused : theme.inputBorder,
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="+91"
                      placeholderTextColor={theme.inputPlaceholder}
                      value={countryCode}
                      onChangeText={setCountryCode}
                      onFocus={() => setFocusedField('countryCode')}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.countryCodeInput, { color: theme.primaryText }]}
                      keyboardType="phone-pad"
                      editable={!loading}
                    />
                  </Animated.View>
                  <Animated.View
                    style={[
                      styles.phoneInputWrapper,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: focusedField === 'phone' ? theme.inputBorderFocused : theme.inputBorder,
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="9876543210"
                      placeholderTextColor={theme.inputPlaceholder}
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.input, { color: theme.primaryText }]}
                      editable={!loading}
                    />
                  </Animated.View>
                </View>
                <Text style={[styles.hintText, { color: theme.tertiaryText }]}>
                  Required for account security, alerts, and verification
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <AnimatedButton
                title={loading ? "Saving..." : "Continue"}
                isPrimary={true}
                onPress={handleComplete}
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
  subtitle: { fontSize: 18, marginBottom: 12, fontWeight: '500', letterSpacing: 0.3 },
  description: { fontSize: 14, lineHeight: 22, maxWidth: '90%', fontWeight: '400' },
  rightSection: { justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  imageContainer: { width: '100%', alignItems: 'center' },
  illustration: { width: 250, height: 250 },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  form: { width: "100%", marginBottom: 20 },
  inputContainer: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 10, letterSpacing: 0.5 },
  phoneContainer: { flexDirection: 'row', gap: 10 },
  countryCodeWrapper: { borderRadius: 14, borderWidth: 1.5, width: 85 },
  countryCodeInput: { padding: 18, fontSize: 16, textAlign: 'center' },
  phoneInputWrapper: { flex: 1, borderRadius: 14, borderWidth: 1.5 },
  input: { padding: 18, fontSize: 16 },
  hintText: { fontSize: 11, marginTop: 6, marginLeft: 4, fontWeight: "400" },
  buttonContainer: { width: '100%', gap: 16 },
  primaryButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  primaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  secondaryButton: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', borderWidth: 2 },
  secondaryButtonText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
});