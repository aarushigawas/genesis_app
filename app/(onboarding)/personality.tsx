// FILE 3: app/(onboarding)/personality.tsx
// ==========================================
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../src2/firebase/config';

type Personality = 'impulsive' | 'balanced' | 'planner';

const PERSONALITIES: { value: Personality; label: string; description: string }[] = [
  {
    value: 'impulsive',
    label: 'Impulsive',
    description: 'Spontaneous spender who enjoys living in the moment',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Moderate planner who balances spending and saving',
  },
  {
    value: 'planner',
    label: 'Planner',
    description: 'Strict budgeter who carefully tracks every expense',
  },
];

export default function PersonalityScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { updateSpendingPersonality } = useOnboarding();
  
  const [selected, setSelected] = useState<Personality | null>(null);

  const handleFinish = async () => {
    if (!selected) return;
    updateSpendingPersonality(selected);
    
    // Mark onboarding as complete in Firestore
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          onboardingComplete: true,
          isProfileComplete: true
        });
        console.log('Onboarding marked as complete');
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }
    
    // Navigate to dashboard
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          Spending Personality
        </Text>

        <View style={styles.cardsContainer}>
          {PERSONALITIES.map((personality) => {
            const isSelected = selected === personality.value;
            return (
              <TouchableOpacity
                key={personality.value}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                      : theme.cardBackground,
                    borderColor: isSelected
                      ? (isDark ? '#B4A4F8' : '#D4A5A5')
                      : theme.cardBorder,
                  },
                ]}
                onPress={() => setSelected(personality.value)}
              >
                <Text
                  style={[
                    styles.cardLabel,
                    {
                      color: theme.primaryText,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {personality.label}
                </Text>
                <Text style={[styles.cardDescription, { color: theme.secondaryText }]}>
                  {personality.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: selected
              ? (isDark ? '#B4A4F8' : '#D4A5A5')
              : theme.cardBorder,
          },
        ]}
        onPress={handleFinish}
        disabled={!selected}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: selected
                ? (isDark ? '#1A1428' : '#3C2A21')
                : theme.tertiaryText,
            },
          ]}
        >
          Finish
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 40,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
  },
  cardLabel: {
    fontSize: 22,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});