// app/(onboarding)/categories.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      setSelected(selected.filter(c => c !== category));
    } else {
      setSelected([...selected, category]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customCategory.trim();
    if (!trimmed) {
      Alert.alert('Invalid Category', 'Please enter a category name');
      return;
    }
    if (selected.includes(trimmed) || CATEGORIES.includes(trimmed)) {
      Alert.alert('Duplicate Category', 'This category already exists');
      return;
    }
    setSelected([...selected, trimmed]);
    setCustomCategory('');
    setShowCustomInput(false);
  };

  const handleNext = () => {
    if (selected.length === 0) {
      Alert.alert('Select Categories', 'Please select at least one category');
      return;
    }
    updateCategories(selected);
    router.push('/(onboarding)/saving-purpose');
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

          {/* Custom categories */}
          {selected.filter(cat => !CATEGORIES.includes(cat)).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.pill,
                {
                  backgroundColor: isDark ? 'rgba(184, 164, 248, 0.3)' : 'rgba(212, 165, 165, 0.3)',
                  borderColor: isDark ? '#B4A4F8' : '#D4A5A5',
                },
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: theme.primaryText,
                    fontWeight: '600',
                  },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Add custom category button */}
          {!showCustomInput && (
            <TouchableOpacity
              style={[
                styles.pill,
                styles.addPill,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderStyle: 'dashed',
                },
              ]}
              onPress={() => setShowCustomInput(true)}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: theme.secondaryText,
                    fontWeight: '500',
                  },
                ]}
              >
                ➕ Add your own
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom category input */}
        {showCustomInput && (
          <View style={styles.customInputContainer}>
            <View style={[styles.customInputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
              <TextInput
                style={[styles.customInput, { color: theme.primaryText }]}
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Enter category name"
                placeholderTextColor={theme.inputPlaceholder}
                autoFocus
                maxLength={20}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' }]}
                onPress={handleAddCustom}
              >
                <Text style={[styles.addButtonText, { color: isDark ? '#1A1428' : '#3C2A21' }]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCustomInput(false);
                setCustomCategory('');
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.secondaryText }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  addPill: {
    borderWidth: 2,
  },
  pillText: {
    fontSize: 16,
  },
  customInputContainer: {
    marginTop: 24,
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
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