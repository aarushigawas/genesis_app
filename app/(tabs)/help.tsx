// app/help.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    Platform,
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
            backgroundColor: 'rgba(255, 192, 203, 0.3)',
            borderRadius: flower.size / 2,
          }}
        />
      ))}
    </View>
  );
};

// FAQ Item Component
const FAQItem = ({ question, answer, theme, isDark }: any) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.faqCard, { 
        backgroundColor: theme.cardBackground, 
        borderColor: theme.cardBorder 
      }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.9}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: theme.primaryText }]}>{question}</Text>
        <Text style={[styles.faqIcon, { color: theme.secondaryText }]}>
          {expanded ? '−' : '+'}
        </Text>
      </View>
      {expanded && (
        <Text style={[styles.faqAnswer, { color: theme.secondaryText }]}>
          {answer}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default function Help() {
  const { theme, isDark } = useTheme();

  const faqs = [
    {
      question: 'How do I track my expenses?',
      answer: 'Go to the Dashboard and tap the "+" button to add a new expense. Select a category, enter the amount, and add any notes. Your expense will be automatically tracked and reflected in your analytics.',
    },
    {
      question: 'Can I edit my budget after onboarding?',
      answer: 'Yes! Go to Settings and tap on any financial value (Monthly Income, Budget, Savings, etc.) to edit them. Your changes will be saved immediately.',
    },
    {
      question: 'How are my savings calculated?',
      answer: 'Your savings are calculated based on the savings style you chose during onboarding (Hardcore, Medium, or Minimal). You can change this anytime in Settings.',
    },
    {
      question: 'What happens if I overspend?',
      answer: 'If you exceed your monthly budget, you\'ll receive a notification (if enabled). The app will show your overspending in red on the Dashboard and Analytics screens.',
    },
    {
      question: 'Is my financial data secure?',
      answer: 'Yes! All your data is encrypted and stored securely in Firebase. We use industry-standard security practices and never share your information with third parties.',
    },
    {
      question: 'Can I export my spending data?',
      answer: 'Yes, go to Privacy & Security and tap "Export Data" to receive a copy of all your financial records via email.',
    },
  ];

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@yourapp.com?subject=Support Request');
  };

  const handleChatSupport = () => {
    Alert.alert('Live Chat', 'Live chat support coming soon!');
  };

  const handleDocumentation = () => {
    Alert.alert('Documentation', 'User guide coming soon!');
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
          <Text style={[styles.pageTitle, { color: theme.primaryText }]}>Help & Support</Text>
          <Text style={[styles.pageSubtitle, { color: theme.secondaryText }]}>
            We're here to help you
          </Text>
        </View>

        {/* Contact Support Section */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>CONTACT SUPPORT</Text>
        
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={handleEmailSupport}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)' }]}>
              <Text style={styles.icon}>📧</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Email Support</Text>
              <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
                Get help via email
              </Text>
            </View>
            <Text style={[styles.arrow, { color: theme.secondaryText }]}>›</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={handleChatSupport}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)' }]}>
              <Text style={styles.icon}>💬</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Live Chat</Text>
              <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
                Chat with our support team
              </Text>
            </View>
            <Text style={[styles.arrow, { color: theme.secondaryText }]}>›</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={handleDocumentation}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)' }]}>
              <Text style={styles.icon}>📚</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Documentation</Text>
              <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
                Browse user guides and tutorials
              </Text>
            </View>
            <Text style={[styles.arrow, { color: theme.secondaryText }]}>›</Text>
          </View>
        </TouchableOpacity>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>FREQUENTLY ASKED QUESTIONS</Text>
        
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            theme={theme}
            isDark={isDark}
          />
        ))}

        {/* App Info */}
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>APP INFORMATION</Text>
        
        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>Version</Text>
            <Text style={[styles.infoValue, { color: theme.primaryText }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>Build</Text>
            <Text style={[styles.infoValue, { color: theme.primaryText }]}>2024.01</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>Platform</Text>
            <Text style={[styles.infoValue, { color: theme.primaryText }]}>
              {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
            </Text>
          </View>
        </View>

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
  faqCard: {
    borderRadius: 24,
    padding: 20,
marginBottom: 12,
borderWidth: 1.5,
},
faqHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
faqQuestion: { fontSize: 16, fontWeight: '600', flex: 1, paddingRight: 12 },
faqIcon: { fontSize: 24, fontWeight: '300' },
faqAnswer: { fontSize: 14, fontWeight: '400', marginTop: 12, lineHeight: 20 },
infoCard: {
borderRadius: 24,
padding: 24,
marginBottom: 16,
borderWidth: 1.5,
},
infoRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
paddingVertical: 8,
},
infoLabel: { fontSize: 14, fontWeight: '500' },
infoValue: { fontSize: 14, fontWeight: '600' },
divider: { height: 1, marginVertical: 8 },
});