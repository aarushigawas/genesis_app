// app/(tabs)/settings.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from "../../src2/firebase/config";

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  'Food',
  'Transport',
  'Rent',
  'Subscriptions',
  'Groceries',
  'Family',
  'Utilities',
  'Fashion',
  'Healthcare',
  'Pets',
  'Sneakers',
  'Gifts',
];

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

// ============== BOTTOM TAB BAR ==============
const BottomTabBar = ({ activeTab }: { activeTab: string }) => {
  const { theme } = useTheme();
  const scaleAnims = {
    dashboard: useRef(new Animated.Value(1)).current,
    analytics: useRef(new Animated.Value(1)).current,
    settings: useRef(new Animated.Value(1)).current,
    profile: useRef(new Animated.Value(1)).current,
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: '🏠', route: '/(tabs)/dashboard' },
    { id: 'analytics', label: 'Analytics', icon: '📈', route: '/(tabs)/analytics' },
    { id: 'settings', label: 'Settings', icon: '⚙️', route: '/(tabs)/settings' },
    { id: 'profile', label: 'Profile', icon: '👤', route: '/(tabs)/profile' },
  ];

  const handlePressIn = (tabId: string) => {
    Animated.spring(scaleAnims[tabId as keyof typeof scaleAnims], {
      toValue: 0.85,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  const handlePressOut = (tabId: string) => {
    Animated.spring(scaleAnims[tabId as keyof typeof scaleAnims], {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.cardBackground, borderTopColor: theme.cardBorder }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={1}
            onPressIn={() => handlePressIn(tab.id)}
            onPressOut={() => handlePressOut(tab.id)}
            onPress={() => router.push(tab.route as any)}
            style={styles.tabButton}
          >
            <Animated.View
              style={[
                styles.tabContent,
                { transform: [{ scale: scaleAnims[tab.id as keyof typeof scaleAnims] }] },
              ]}
            >
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.accent[0] }]} />
              )}
              <Text style={[styles.tabIcon, { fontSize: 24 }]}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.accent[0] : theme.secondaryText },
                ]}
              >
                {tab.label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============== ANIMATED CARD ==============
const AnimatedCard = ({ children, style }: any) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[
        styles.glassCard, 
        style, 
        { 
          transform: [{ scale: scaleAnim }],
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        }
      ]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function Settings() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  
  // Edit states
  const [editedBudget, setEditedBudget] = useState('');
  const [editedNotification, setEditedNotification] = useState<string>('');
  const [editedCategories, setEditedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setEditedBudget(data.monthlyBudget?.toString() || '');
          setEditedNotification(data.notificationPreference || 'never');
          setEditedCategories(data.categories || []);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const budgetNum = parseInt(editedBudget) || 0;
      if (budgetNum === 0) {
        Alert.alert('Invalid Budget', 'Please enter a valid budget amount');
        return;
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        monthlyBudget: budgetNum,
        updatedAt: new Date().toISOString(),
      });

      setUserData({ ...userData, monthlyBudget: budgetNum });
      setBudgetModalVisible(false);
      Alert.alert('Success', 'Budget updated successfully');
    } catch (error) {
      console.error("Error updating budget:", error);
      Alert.alert('Error', 'Failed to update budget');
    }
  };

  const updateNotificationPreference = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateDoc(doc(db, "users", currentUser.uid), {
        notificationPreference: editedNotification,
        updatedAt: new Date().toISOString(),
      });

      setUserData({ ...userData, notificationPreference: editedNotification });
      setNotificationModalVisible(false);
      Alert.alert('Success', 'Notification preference updated');
    } catch (error) {
      console.error("Error updating notification:", error);
      Alert.alert('Error', 'Failed to update notification preference');
    }
  };

  const updateCategories = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      if (editedCategories.length === 0) {
        Alert.alert('Error', 'Please select at least one category');
        return;
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        categories: editedCategories,
        updatedAt: new Date().toISOString(),
      });

      setUserData({ ...userData, categories: editedCategories });
      setCategoriesModalVisible(false);
      Alert.alert('Success', 'Categories updated successfully');
    } catch (error) {
      console.error("Error updating categories:", error);
      Alert.alert('Error', 'Failed to update categories');
    }
  };

  const toggleCategory = (category: string) => {
    if (editedCategories.includes(category)) {
      setEditedCategories(editedCategories.filter(c => c !== category));
    } else {
      setEditedCategories([...editedCategories, category]);
    }
  };

  const notificationOptions = [
    { value: 'overspend', label: 'When I overspend' },
    { value: 'weekly', label: 'Weekly summaries' },
    { value: 'daily', label: 'Daily insights' },
    { value: 'never', label: 'Never' },
  ];

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

      <TouchableOpacity 
        style={styles.themeToggle}
        onPress={toggleTheme}
      >
        <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.primaryText }]}>Settings</Text>
          <Text style={[styles.pageSubtitle, { color: theme.secondaryText }]}>
            Customize your experience
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>APPEARANCE</Text>
        <AnimatedCard>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.cardBorder, true: theme.accent[0] }}
              thumbColor={theme.primaryText}
            />
          </View>
        </AnimatedCard>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>BUDGET & SPENDING</Text>
        <AnimatedCard>
          <TouchableOpacity style={styles.settingRow} onPress={() => setBudgetModalVisible(true)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Monthly Budget</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                ₹{userData?.monthlyBudget || 0}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          
          <TouchableOpacity style={styles.settingRow} onPress={() => setCategoriesModalVisible(true)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Spending Categories</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                {userData?.categories?.length || 0} categories selected
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>NOTIFICATIONS</Text>
        <AnimatedCard>
          <TouchableOpacity style={styles.settingRow} onPress={() => setNotificationModalVisible(true)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Notification Preferences</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                {notificationOptions.find(o => o.value === userData?.notificationPreference)?.label || 'Never'}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>ACCOUNT</Text>
        <AnimatedCard>
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Change Password</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                Update your account password
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Currency</Text>
              <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
                INR (₹)
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>ABOUT</Text>
        <AnimatedCard>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Version</Text>
            <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>1.0.0</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Privacy Policy</Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.primaryText }]}>Terms of Service</Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.secondaryText }}>›</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Budget Edit Modal */}
      <Modal visible={budgetModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Edit Monthly Budget</Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.currency, { color: theme.primaryText }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: theme.primaryText, borderColor: theme.inputBorder }]}
                value={editedBudget}
                onChangeText={setEditedBudget}
                keyboardType="numeric"
                placeholder="Enter budget"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.cardBorder }]}
                onPress={() => setBudgetModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.secondaryText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' }]}
                onPress={updateBudget}
              >
                <Text style={[styles.modalButtonText, { color: isDark ? '#1A1428' : '#3C2A21' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Preference Modal */}
      <Modal visible={notificationModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Notification Preferences</Text>
            {notificationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: editedNotification === option.value
                      ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                      : 'transparent',
                    borderColor: editedNotification === option.value
                      ? (isDark ? '#B4A4F8' : '#D4A5A5')
                      : theme.cardBorder,
                  },
                ]}
                onPress={() => setEditedNotification(option.value)}
              >
                <Text style={[styles.optionText, { color: theme.primaryText }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.cardBorder }]}
                onPress={() => setNotificationModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.secondaryText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' }]}
                onPress={updateNotificationPreference}
              >
                <Text style={[styles.modalButtonText, { color: isDark ? '#1A1428' : '#3C2A21' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Categories Modal */}
      <Modal visible={categoriesModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Edit Categories</Text>
              <View style={styles.pillsContainer}>
                {CATEGORIES.map((category) => {
                  const isSelected = editedCategories.includes(category);
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(184, 164, 248, 0.3)' : 'rgba(212, 165, 165, 0.3)')
                            : theme.cardBackground,
                          borderColor: isSelected
                            ? (isDark ? '#B4A4F8' : '#D4A5A5')
                            : theme.cardBorder,
                        },
                      ]}
                      onPress={() => toggleCategory(category)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: isSelected ? theme.primaryText : theme.secondaryText,
                            fontWeight: isSelected ? '600' : '500',
                          },
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.cardBorder }]}
                  onPress={() => setCategoriesModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' }]}
                  onPress={updateCategories}
                >
                  <Text style={[styles.modalButtonText, { color: isDark ? '#1A1428' : '#3C2A21' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <BottomTabBar activeTab="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  tabButton: { flex: 1, alignItems: 'center' },
  tabContent: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  activeIndicator: { 
    position: 'absolute',
    top: -8,
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  tabIcon: { marginBottom: 4 },
  tabLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100, paddingTop: 60 },
  header: { marginBottom: 24 },
  pageTitle: { fontSize: 42, fontWeight: '200', letterSpacing: 0.8, marginBottom: 8 },
  pageSubtitle: { fontSize: 16, fontWeight: '400' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12, marginTop: 8 },
  glassCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1.5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDescription: { fontSize: 13, fontWeight: '400' },
  divider: { height: 1, marginVertical: 16 },
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
  themeToggleIcon: { fontSize: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1.5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
 inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  pillText: {
    fontSize: 14,
  },
});