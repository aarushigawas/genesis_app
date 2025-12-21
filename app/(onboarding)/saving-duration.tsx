// app/(onboarding)/saving-duration.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PRESET_DURATIONS = [
  { value: 3, unit: 'months', label: '3 months' },
  { value: 6, unit: 'months', label: '6 months' },
  { value: 1, unit: 'year', label: '1 year' },
  { value: 1, unit: 'more', label: 'More than a year' },
];

export default function SavingDurationScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { updateSavingDuration } = useOnboarding();
  
  const [selected, setSelected] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<'months' | 'years'>('months');

  const handlePresetSelect = (value: number, unit: string) => {
    setSelected(`${value}-${unit}`);
    setShowCustomInput(false);
    setCustomValue('');
  };

  const handleCustomSelect = () => {
    setSelected('custom');
    setShowCustomInput(true);
  };

  const handleNext = () => {
    if (!selected) {
      Alert.alert('Select Duration', 'Please select how long you want this program to run');
      return;
    }

    if (selected === 'custom') {
      const num = parseInt(customValue) || 0;
      if (num === 0) {
        Alert.alert('Invalid Duration', 'Please enter a valid duration');
        return;
      }
      updateSavingDuration({ value: num, unit: customUnit });
    } else {
      const [value, unit] = selected.split('-');
      // Handle "more than a year" case - treat it as 2 years
      if (unit === 'more') {
        updateSavingDuration({ value: 2, unit: 'years' });
      } else if (unit === 'year') {
        updateSavingDuration({ value: parseInt(value), unit: 'years' });
      } else {
        updateSavingDuration({ value: parseInt(value), unit: unit as 'months' | 'years' });
      }
    }
    
    router.push('/(onboarding)/notifications');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          How long do you want this program to run?
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          Set your savings timeline
        </Text>

        <View style={styles.durationsContainer}>
          {PRESET_DURATIONS.map((duration) => {
            const isSelected = selected === `${duration.value}-${duration.unit}`;
            return (
              <TouchableOpacity
                key={duration.label}
                style={[
                  styles.durationCard,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                      : theme.cardBackground,
                    borderColor: isSelected
                      ? (isDark ? '#B4A4F8' : '#D4A5A5')
                      : theme.cardBorder,
                  },
                ]}
                onPress={() => handlePresetSelect(duration.value, duration.unit)}
              >
                <View style={styles.radioContainer}>
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
                  <Text style={[styles.durationLabel, { color: theme.primaryText }]}>
                    {duration.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Custom option */}
          <TouchableOpacity
            style={[
              styles.durationCard,
              {
                backgroundColor: selected === 'custom'
                  ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                  : theme.cardBackground,
                borderColor: selected === 'custom'
                  ? (isDark ? '#B4A4F8' : '#D4A5A5')
                  : theme.cardBorder,
              },
            ]}
            onPress={handleCustomSelect}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected === 'custom'
                      ? (isDark ? '#B4A4F8' : '#D4A5A5')
                      : theme.cardBorder,
                  },
                ]}
              >
                {selected === 'custom' && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.durationLabel, { color: theme.primaryText }]}>
                Custom duration
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Custom input */}
        {showCustomInput && (
          <View style={styles.customInputContainer}>
            <View style={styles.customInputRow}>
              <View style={[styles.customInputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.customInput, { color: theme.primaryText }]}
                  value={customValue}
                  onChangeText={(text) => setCustomValue(text.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={theme.inputPlaceholder}
                  keyboardType="numeric"
                  maxLength={3}
                  autoFocus
                />
              </View>

              <View style={styles.unitButtons}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    {
                      backgroundColor: customUnit === 'months'
                        ? (isDark ? '#B4A4F8' : '#D4A5A5')
                        : theme.cardBackground,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() => setCustomUnit('months')}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      {
                        color: customUnit === 'months'
                          ? (isDark ? '#1A1428' : '#3C2A21')
                          : theme.secondaryText,
                      },
                    ]}
                  >
                    Months
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    {
                      backgroundColor: customUnit === 'years'
                        ? (isDark ? '#B4A4F8' : '#D4A5A5')
                        : theme.cardBackground,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() => setCustomUnit('years')}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      {
                        color: customUnit === 'years'
                          ? (isDark ? '#1A1428' : '#3C2A21')
                          : theme.secondaryText,
                      },
                    ]}
                  >
                    Years
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  durationsContainer: {
    gap: 16,
  },
  durationCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  durationLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  customInputContainer: {
    marginTop: 24,
  },
  customInputRow: {
    gap: 16,
  },
  customInputWrapper: {
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 20,
  },
  customInput: {
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: 16,
    textAlign: 'center',
  },
  unitButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: '600',
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