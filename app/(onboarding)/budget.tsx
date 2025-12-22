// app/(onboarding)/budget.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type SavingStyle = 'hardcore' | 'medium' | 'minimal' | 'custom';

export default function BudgetScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { data, updateBudget } = useOnboarding();
  
  const [step, setStep] = useState<'goal' | 'style'>('goal');
  const [hasSavingGoal, setHasSavingGoal] = useState<boolean | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<SavingStyle | null>(null);
  const [customPercentage, setCustomPercentage] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const income = data.monthlyIncome || 0;

  // Calculate values based on style
  const getStyleValues = (style: SavingStyle) => {
    if (style === 'hardcore') return { percentage: 65, amount: Math.floor(income * 0.65) };
    if (style === 'medium') return { percentage: 42.5, amount: Math.floor(income * 0.425) };
    if (style === 'minimal') return { percentage: 20, amount: Math.floor(income * 0.2) };
    return { percentage: 0, amount: 0 };
  };

  // Calculate preview for custom input
  const getCustomPreview = () => {
    if (customPercentage) {
      const pct = parseFloat(customPercentage) || 0;
      const saving = Math.floor(income * (pct / 100));
      const spending = income - saving;
      return { saving, spending, percentage: pct };
    }
    if (customAmount) {
      const saving = parseInt(customAmount) || 0;
      const spending = income - saving;
      const pct = income > 0 ? (saving / income) * 100 : 0;
      return { saving, spending, percentage: pct };
    }
    return { saving: 0, spending: income, percentage: 0 };
  };

  const handleGoalAnswer = (answer: boolean) => {
    setHasSavingGoal(answer);
    if (answer) {
      setStep('style');
    } else {
      // If no saving goal, skip to next screen with default values
      const budget = income; // They can spend all
      updateBudget({
        hasSavingGoal: false,
        monthlyBudget: budget,
        savingAmount: 0,
        savingPercentage: 0,
      });
      router.push('/(onboarding)/saving-purpose');
    }
  };

  const handleStyleSelect = (style: SavingStyle) => {
    setSelectedStyle(style);
    setCustomPercentage('');
    setCustomAmount('');
  };

  const handleNext = () => {
    if (!hasSavingGoal) return;
    
    let savingAmount = 0;
    let savingPercentage = 0;
    let monthlyBudget = income;

    if (selectedStyle === 'custom') {
      const preview = getCustomPreview();
      if (preview.saving === 0) {
        Alert.alert('Invalid Input', 'Please enter a savings amount or percentage');
        return;
      }
      if (preview.saving > income) {
        Alert.alert('Invalid Amount', 'Savings cannot exceed your income');
        return;
      }
      savingAmount = preview.saving;
      savingPercentage = preview.percentage;
      monthlyBudget = preview.spending;
    } else if (selectedStyle) {
      const values = getStyleValues(selectedStyle);
      savingAmount = values.amount;
      savingPercentage = values.percentage;
      monthlyBudget = income - savingAmount;
    } else {
      Alert.alert('Select an Option', 'Please select a savings style');
      return;
    }

    updateBudget({
      hasSavingGoal: true,
      monthlyBudget,
      savingAmount,
      savingPercentage,
    });
    
    router.push('/(onboarding)/categories');
  };

  const renderPreview = () => {
    let savingAmount = 0;
    let spendingAmount = income;
    
    if (selectedStyle === 'custom') {
      const preview = getCustomPreview();
      savingAmount = preview.saving;
      spendingAmount = preview.spending;
    } else if (selectedStyle) {
      const values = getStyleValues(selectedStyle);
      savingAmount = values.amount;
      spendingAmount = income - savingAmount;
    }

    return (
      <View style={[styles.previewCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
        <Text style={[styles.previewTitle, { color: theme.secondaryText }]}>Your Monthly Plan</Text>
        <View style={styles.previewRow}>
          <Text style={[styles.previewLabel, { color: theme.tertiaryText }]}>You'll spend:</Text>
          <Text style={[styles.previewValue, { color: theme.primaryText }]}>₹{spendingAmount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={[styles.previewLabel, { color: theme.tertiaryText }]}>You'll save:</Text>
          <Text style={[styles.previewValue, { color: isDark ? '#B4A4F8' : '#D4A5A5' }]}>
            ₹{savingAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    );
  };

  if (step === 'goal') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.primaryText }]}>
            Do you have a savings goal?
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.goalCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={() => handleGoalAnswer(true)}
            >
              <Text style={[styles.goalCardTitle, { color: theme.primaryText }]}>✓ Yes</Text>
              <Text style={[styles.goalCardSubtitle, { color: theme.secondaryText }]}>
                I want to save towards something
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.goalCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={() => handleGoalAnswer(false)}
            >
              <Text style={[styles.goalCardTitle, { color: theme.primaryText }]}>✗ No</Text>
              <Text style={[styles.goalCardSubtitle, { color: theme.secondaryText }]}>
                I'll just track my spending
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          Choose your savings style
        </Text>

        <View style={styles.stylesContainer}>
          <TouchableOpacity
            style={[
              styles.styleCard,
              {
                backgroundColor: selectedStyle === 'hardcore'
                  ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                  : theme.cardBackground,
                borderColor: selectedStyle === 'hardcore'
                  ? (isDark ? '#B4A4F8' : '#D4A5A5')
                  : theme.cardBorder,
              },
            ]}
            onPress={() => handleStyleSelect('hardcore')}
          >
            <Text style={[styles.styleTitle, { color: theme.primaryText }]}>🔥 Hardcore</Text>
            <Text style={[styles.stylePercentage, { color: theme.secondaryText }]}>60-70% savings</Text>
            <Text style={[styles.styleAmount, { color: theme.tertiaryText }]}>
              Save ₹{getStyleValues('hardcore').amount.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.styleCard,
              {
                backgroundColor: selectedStyle === 'medium'
                  ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                  : theme.cardBackground,
                borderColor: selectedStyle === 'medium'
                  ? (isDark ? '#B4A4F8' : '#D4A5A5')
                  : theme.cardBorder,
              },
            ]}
            onPress={() => handleStyleSelect('medium')}
          >
            <Text style={[styles.styleTitle, { color: theme.primaryText }]}>⚡ Medium</Text>
            <Text style={[styles.stylePercentage, { color: theme.secondaryText }]}>40-45% savings</Text>
            <Text style={[styles.styleAmount, { color: theme.tertiaryText }]}>
              Save ₹{getStyleValues('medium').amount.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.styleCard,
              {
                backgroundColor: selectedStyle === 'minimal'
                  ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                  : theme.cardBackground,
                borderColor: selectedStyle === 'minimal'
                  ? (isDark ? '#B4A4F8' : '#D4A5A5')
                  : theme.cardBorder,
              },
            ]}
            onPress={() => handleStyleSelect('minimal')}
          >
            <Text style={[styles.styleTitle, { color: theme.primaryText }]}>💧 Minimal</Text>
            <Text style={[styles.stylePercentage, { color: theme.secondaryText }]}>~20% savings</Text>
            <Text style={[styles.styleAmount, { color: theme.tertiaryText }]}>
              Save ₹{getStyleValues('minimal').amount.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.styleCard,
              {
                backgroundColor: selectedStyle === 'custom'
                  ? (isDark ? 'rgba(184, 164, 248, 0.2)' : 'rgba(212, 165, 165, 0.2)')
                  : theme.cardBackground,
                borderColor: selectedStyle === 'custom'
                  ? (isDark ? '#B4A4F8' : '#D4A5A5')
                  : theme.cardBorder,
              },
            ]}
            onPress={() => handleStyleSelect('custom')}
          >
            <Text style={[styles.styleTitle, { color: theme.primaryText }]}>✏️ Set my own</Text>
            <Text style={[styles.stylePercentage, { color: theme.secondaryText }]}>Custom savings</Text>
          </TouchableOpacity>
        </View>

        {selectedStyle === 'custom' && (
          <View style={styles.customInputContainer}>
            <View style={styles.customInputRow}>
              <View style={styles.customInputField}>
                <Text style={[styles.customLabel, { color: theme.secondaryText }]}>Percentage</Text>
                <View style={[styles.customInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <TextInput
                    style={[styles.customInputText, { color: theme.primaryText }]}
                    value={customPercentage}
                    onChangeText={(text) => {
                      setCustomPercentage(text.replace(/[^0-9.]/g, ''));
                      setCustomAmount('');
                    }}
                    placeholder="0"
                    placeholderTextColor={theme.inputPlaceholder}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <Text style={[styles.customUnit, { color: theme.secondaryText }]}>%</Text>
                </View>
              </View>

              <Text style={[styles.customOr, { color: theme.tertiaryText }]}>OR</Text>

              <View style={styles.customInputField}>
                <Text style={[styles.customLabel, { color: theme.secondaryText }]}>Amount</Text>
                <View style={[styles.customInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <Text style={[styles.customUnit, { color: theme.secondaryText }]}>₹</Text>
                  <TextInput
                    style={[styles.customInputText, { color: theme.primaryText }]}
                    value={customAmount}
                    onChangeText={(text) => {
                      setCustomAmount(text.replace(/[^0-9]/g, ''));
                      setCustomPercentage('');
                    }}
                    placeholder="0"
                    placeholderTextColor={theme.inputPlaceholder}
                    keyboardType="numeric"
                    maxLength={8}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {selectedStyle && renderPreview()}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: selectedStyle
              ? (isDark ? '#B4A4F8' : '#D4A5A5')
              : theme.cardBorder,
          },
        ]}
        onPress={handleNext}
        disabled={!selectedStyle}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: selectedStyle
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  goalCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
  },
  goalCardTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalCardSubtitle: {
    fontSize: 16,
  },
  stylesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  styleCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
  },
  styleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  stylePercentage: {
    fontSize: 16,
    marginBottom: 4,
  },
  styleAmount: {
    fontSize: 14,
  },
  customInputContainer: {
    marginBottom: 24,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  customInputField: {
    flex: 1,
  },
  customLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
  },
  customInputText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 12,
  },
  customUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  customOr: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 16,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '600',
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