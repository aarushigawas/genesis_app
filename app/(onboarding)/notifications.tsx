// app/(onboarding)/notifications.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NotificationOption = 'overspend' | 'weekly' | 'daily' | 'never';

const OPTIONS: { value: NotificationOption; label: string; description: string }[] = [
  {
    value: 'overspend',
    label: 'When I overspend',
    description: 'Get notified when you exceed your budget',
  },
  {
    value: 'weekly',
    label: 'Weekly summaries',
    description: 'Receive a summary every week',
  },
  {
    value: 'daily',
    label: 'Daily insights',
    description: 'Get daily updates on your spending',
  },
  {
    value: 'never',
    label: 'Never',
    description: 'No notifications',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { updateNotificationPreference } = useOnboarding();
  
  const [selected, setSelected] = useState<NotificationOption | null>(null);

  const handleNext = () => {
    if (!selected) return;
    updateNotificationPreference(selected);
    router.push('/(onboarding)/finish');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          Notification Preferences
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          How often would you like updates?
        </Text>

        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioCard,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                      : theme.cardBackground,
                    borderColor: isSelected
                      ? (isDark ? '#B4A4F8' : '#D4A5A5')
                      : theme.cardBorder,
                  },
                ]}
                onPress={() => setSelected(option.value)}
              >
                <View style={styles.radioCardContent}>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: isSelected
                          ? (isDark ? '#B4A4F8' : '#D4A5A5')
                          : theme.cardBorder,
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.optionLabel, { color: theme.primaryText }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: theme.secondaryText }]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
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
        onPress={handleNext}
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
  optionsContainer: {
    gap: 16,
  },
  radioCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
  },
  radioCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
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