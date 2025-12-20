// app/(onboarding)/categories.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function CategoriesScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { updateCategories } = useOnboarding();
  
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      setSelected(selected.filter(c => c !== category));
    } else {
      setSelected([...selected, category]);
    }
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    updateCategories(selected);
    router.push('/(onboarding)/budget');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          What categories do you spend on?
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          Pick at least one
        </Text>

        <View style={styles.pillsContainer}>
          {CATEGORIES.map((category) => {
            const isSelected = selected.includes(category);
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
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: selected.length > 0
              ? (isDark ? '#B4A4F8' : '#D4A5A5')
              : theme.cardBorder,
          },
        ]}
        onPress={handleNext}
        disabled={selected.length === 0}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: selected.length > 0
                ? (isDark ? '#1A1428' : '#3C2A21')
                : theme.tertiaryText,
            },
          ]}
        >
          Next
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
  },
  pillText: {
    fontSize: 16,
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