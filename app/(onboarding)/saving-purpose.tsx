// app/(onboarding)/saving-purpose.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PURPOSES = [
  { value: 'emergency', label: '🛡️ Emergency fund', description: 'Building a safety net' },
  { value: 'travel', label: '✈️ Travel', description: 'Exploring the world' },
  { value: 'education', label: '📚 Education', description: 'Investing in learning' },
  { value: 'gadget', label: '📱 Gadget / Tech', description: 'Latest devices' },
  { value: 'home', label: '🏠 Home', description: 'House or apartment' },
  { value: 'special', label: '✨ Something special', description: 'A special purchase' },
  { value: 'just-saving', label: '💰 Just saving', description: 'Building wealth' },
];

export default function SavingPurposeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { updateSavingPurpose } = useOnboarding();
  
  const [selected, setSelected] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const handlePurposeSelect = (value: string) => {
    setSelected(value);
    setShowCustomInput(false);
    setCustomText('');
  };

  const handleCustomSelect = () => {
    setSelected('custom');
    setShowCustomInput(true);
  };

  const handleNext = () => {
    if (!selected) {
      if (Platform.OS === 'web') {
        alert('Please select what you\'re saving for');
      } else {
        Alert.alert('Select Purpose', 'Please select what you\'re saving for');
      }
      return;
    }

    if (selected === 'custom' && !customText.trim()) {
      if (Platform.OS === 'web') {
        alert('Please tell us what you\'re saving for');
      } else {
        Alert.alert('Missing Input', 'Please tell us what you\'re saving for');
      }
      return;
    }

    // FIXED: Always send a valid string for text, never undefined
    let purposeText: string;
    
    if (selected === 'custom') {
      purposeText = customText.trim();
    } else {
      // Find the label for the selected preset purpose
      const selectedPurpose = PURPOSES.find(p => p.value === selected);
      purposeText = selectedPurpose ? selectedPurpose.label : selected;
    }

    updateSavingPurpose({
      type: selected,
      text: purposeText, // Always a string, never undefined
    });
    
    router.push('/(onboarding)/saving-duration');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          What are you saving for?
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          This helps us keep you motivated
        </Text>

        <View style={styles.purposesContainer}>
          {PURPOSES.map((purpose) => {
            const isSelected = selected === purpose.value;
            return (
              <TouchableOpacity
                key={purpose.value}
                style={[
                  styles.purposeCard,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                      : theme.cardBackground,
                    borderColor: isSelected
                      ? (isDark ? '#B4A4F8' : '#D4A5A5')
                      : theme.cardBorder,
                  },
                ]}
                onPress={() => handlePurposeSelect(purpose.value)}
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
                  <View style={styles.textContainer}>
                    <Text style={[styles.purposeLabel, { color: theme.primaryText }]}>
                      {purpose.label}
                    </Text>
                    <Text style={[styles.purposeDescription, { color: theme.secondaryText }]}>
                      {purpose.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Something else option */}
          <TouchableOpacity
            style={[
              styles.purposeCard,
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
              <View style={styles.textContainer}>
                <Text style={[styles.purposeLabel, { color: theme.primaryText }]}>
                  📝 Something else
                </Text>
                <Text style={[styles.purposeDescription, { color: theme.secondaryText }]}>
                  Tell us what you're saving for
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Custom input */}
        {showCustomInput && (
          <View style={[styles.customInputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <TextInput
              style={[styles.customInput, { color: theme.primaryText }]}
              value={customText}
              onChangeText={setCustomText}
              placeholder="What are you saving for?"
              placeholderTextColor={theme.inputPlaceholder}
              autoFocus={Platform.OS !== 'web'}
              maxLength={50}
              multiline
            />
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
  purposesContainer: {
    gap: 16,
  },
  purposeCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
  },
  radioContainer: {
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
  purposeLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  purposeDescription: {
    fontSize: 14,
  },
  customInputWrapper: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginTop: 16,
  },
  customInput: {
    fontSize: 16,
    minHeight: 60,
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