
// app/privacy.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';


const { width, height } = Dimensions.get('window');

// ============== STAR BACKGROUND ==============
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

// ============== FLOATING FLOWERS ==============
const FloatingFlowers = () => {
  const [flowers, setFlowers] = useState<any[]>([]);

  useEffect(() => {
    const newFlowers = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 30 + 20,
      rotation: Math.random() * 360,
      baseOpacity: Math.random() * 0.25 + 0.1,
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
        <View
          key={flower.id}
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

export default function Privacy() {
  const { theme, isDark } = useTheme();

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password reset link will be sent to your email',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Link', 
          onPress: () => Alert.alert('Success', 'Password reset link sent to your email')
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported and sent to your email',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => Alert.alert('Success', 'Data export initiated')
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmation Required', 'Please contact support to delete your account');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />
      
      <LinearGradient
        colors={theme.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={theme.backgroundLocations}
      />
      
      {isDark ? <StarBackground /> : <FloatingFlowers />}

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: theme.primaryText }]}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.primaryText }]}>Privacy & Security</Text>
          <Text style={[styles.pageSubtitle, { color: theme.secondaryText }]}>
            Manage your account security and data
          </Text>
        </View>

        {/* Security Section */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>SECURITY</Text>
        
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={handleChangePassword}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)' }]}>
              <Text style={styles.icon}>🔑</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Change Password</Text>
              <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
                Update your account password
              </Text>
            </View>
            <Text style={[styles.arrow, { color: theme.secondaryText }]}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Data & Privacy Section */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>DATA & PRIVACY</Text>
        
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={handleExportData}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)' }]}>
              <Text style={styles.icon}>📦</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Export Data</Text>
              <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
                Download a copy of your data
              </Text>
            </View>
            <Text style={[styles.arrow, { color: theme.secondaryText }]}>›</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)' }]}>
              <Text style={styles.icon}>🛡️</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Data Encryption</Text>
              <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
                Your data is encrypted end-to-end
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.15)' }]}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: '#FF6B6B' }]}>DANGER ZONE</Text>
        
        <TouchableOpacity
          style={[styles.card, { backgroundColor: 'rgba(255, 107, 107, 0.1)', borderColor: '#FF6B6B' }]}
          onPress={handleDeleteAccount}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
              <Text style={styles.icon}>⚠️</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: '#FF6B6B' }]}>Delete Account</Text>
              <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
                Permanently delete your account and data
              </Text>
            </View>
            <Text style={[styles.arrow, { color: '#FF6B6B' }]}>›</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  backButtonText: { fontSize: 18, fontWeight: '600' },
  header: { marginBottom: 32 },
  pageTitle: { fontSize: 42, fontWeight: '200', letterSpacing: 0.8, marginBottom: 8 },
  pageSubtitle: { fontSize: 16, fontWeight: '400' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: { fontSize: 24 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardDescription: { fontSize: 13, fontWeight: '400' },
  arrow: { fontSize: 24, fontWeight: '300', marginLeft: 12 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

