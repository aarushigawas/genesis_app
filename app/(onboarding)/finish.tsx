// app/(onboarding)/finish.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../src2/firebase/config';

export default function FinishScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { data, resetOnboarding } = useOnboarding();
  
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');

  useEffect(() => {
    saveToFirestore();
  }, []);

  const saveToFirestore = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        setStatus('error');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      
      await setDoc(userRef, {
        monthlyIncome: data.monthlyIncome,
        categories: data.categories,
        monthlyBudget: data.monthlyBudget,
        notificationPreference: data.notificationPreference,
        spendingPersonality: data.spendingPersonality,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setStatus('success');
      
      // Reset onboarding state
      resetOnboarding();
      
      // Navigate to dashboard after a brief delay
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setStatus('error');
      
      // Still navigate even on error, but after longer delay
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'saving' && (
          <>
            <ActivityIndicator
              size="large"
              color={isDark ? '#B4A4F8' : '#D4A5A5'}
              style={styles.loader}
            />
            <Text style={[styles.title, { color: theme.primaryText }]}>
              Setting up your profile...
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              This will only take a moment
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View
              style={[
                styles.checkmark,
                { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' },
              ]}
            >
              <Text style={[styles.checkmarkText, { color: isDark ? '#1A1428' : '#3C2A21' }]}>
                ✓
              </Text>
            </View>
            <Text style={[styles.title, { color: theme.primaryText }]}>
              All set!
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Welcome to your personalized dashboard
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={[styles.title, { color: theme.errorColor }]}>
              Something went wrong
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Don't worry, we'll take you to your dashboard
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginBottom: 32,
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  checkmarkText: {
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});