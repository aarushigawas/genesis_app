// ==========================================
// FILE 1: app/(onboarding)/budget.tsx
// ==========================================
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BudgetScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { data, updateBudget } = useOnboarding();
  
  const [budget, setBudget] = useState('');

  const handleSuggest = () => {
    if (data.monthlyIncome) {
      const suggested = Math.floor(data.monthlyIncome * 0.5);
      setBudget(suggested.toString());
    }
  };

  const handleNext = () => {
    const budgetNum = parseInt(budget) || 0;
    
    if (budgetNum === 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid budget amount');
      return;
    }
    
    if (data.monthlyIncome && budgetNum > data.monthlyIncome) {
      Alert.alert('Budget Exceeds Income', 'Your budget cannot be more than your monthly income');
      return;
    }
    
    updateBudget(budgetNum);
    router.push('/(onboarding)/notifications');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          Set a monthly spending limit
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.currency, { color: theme.primaryText }]}>₹</Text>
          <TextInput
            style={[
              styles.budgetInput,
              {
                color: theme.primaryText,
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              },
            ]}
            value={budget}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, '');
              setBudget(num);
            }}
            placeholder="Enter amount"
            placeholderTextColor={theme.inputPlaceholder}
            keyboardType="numeric"
            maxLength={8}
          />
        </View>

        {data.monthlyIncome && (
          <TouchableOpacity
            style={[
              styles.suggestButton,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
              },
            ]}
            onPress={handleSuggest}
          >
            <Text style={[styles.suggestText, { color: theme.secondaryText }]}>
              Suggest one for me (50%)
            </Text>
          </TouchableOpacity>
        )}

        {data.monthlyIncome && (
          <Text style={[styles.hint, { color: theme.tertiaryText }]}>
            Your monthly income: ₹{data.monthlyIncome.toLocaleString('en-IN')}
          </Text>
        )}
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
    marginBottom: 60,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  currency: {
    fontSize: 32,
    fontWeight: '600',
    marginRight: 12,
  },
  budgetInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  suggestButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestText: {
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
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
