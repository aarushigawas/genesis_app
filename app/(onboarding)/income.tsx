// app/(onboarding)/income.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function IncomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { updateIncome } = useOnboarding();
  
  const [income, setIncome] = useState(50000);

  const handleNext = () => {
    updateIncome(income);
    router.push('/(onboarding)/categories');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          What's your monthly income?
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          This helps us personalize your budget
        </Text>

        <View style={styles.previewContainer}>
          <Text style={[styles.currency, { color: theme.primaryText }]}>₹</Text>
          <TextInput
            style={[styles.incomeInput, { color: theme.primaryText, borderBottomColor: theme.inputBorderFocused }]}
            value={income.toString()}
            onChangeText={(text) => {
              const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
              setIncome(num);
            }}
            keyboardType="numeric"
            maxLength={8}
          />
        </View>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={500000}
          step={1000}
          value={income}
          onValueChange={setIncome}
          minimumTrackTintColor={isDark ? '#B4A4F8' : '#D4A5A5'}
          maximumTrackTintColor={theme.cardBorder}
          thumbTintColor={isDark ? '#E8B4F8' : '#C49A9A'}
        />

        <View style={styles.rangeLabels}>
          <Text style={[styles.rangeText, { color: theme.tertiaryText }]}>₹0</Text>
          <Text style={[styles.rangeText, { color: theme.tertiaryText }]}>₹5L</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' }]}
        onPress={handleNext}
      >
        <Text style={[styles.buttonText, { color: isDark ? '#1A1428' : '#3C2A21' }]}>
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 60,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  currency: {
    fontSize: 48,
    fontWeight: '600',
    marginRight: 8,
  },
  incomeInput: {
    fontSize: 48,
    fontWeight: '600',
    borderBottomWidth: 2,
    minWidth: 200,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeText: {
    fontSize: 14,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});