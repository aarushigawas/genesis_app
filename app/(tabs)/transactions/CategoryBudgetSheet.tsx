// app/(tabs)/transactions/CategoryBudgetSheet.tsx
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getCategoryLimits } from '../../../logic/getCategoryLimits';
import { setCategoryRules } from '../../../src2/firebase/categoryRules';
import { auth, db } from '../../../src2/firebase/config';

interface CategoryBudgetSheetProps {
  visible: boolean;
  initialMonth: string;
  onClose: () => void;
}

interface CategorySpending {
  [category: string]: number;
}

const MONTHS = [
  { id: '01', label: 'Jan' },
  { id: '02', label: 'Feb' },
  { id: '03', label: 'Mar' },
  { id: '04', label: 'Apr' },
  { id: '05', label: 'May' },
  { id: '06', label: 'Jun' },
  { id: '07', label: 'Jul' },
  { id: '08', label: 'Aug' },
  { id: '09', label: 'Sep' },
  { id: '10', label: 'Oct' },
  { id: '11', label: 'Nov' },
  { id: '12', label: 'Dec' },
];

const YEARS = ['2025', '2024', '2023', '2022'];

export default function CategoryBudgetSheet({
  visible,
  initialMonth,
  onClose,
}: CategoryBudgetSheetProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [yearPickerVisible, setYearPickerVisible] = useState<boolean>(false);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [categorySpending, setCategorySpending] = useState<CategorySpending>({});
  const [existingLimits, setExistingLimits] = useState<Record<string, number>>({});
  const [editedLimits, setEditedLimits] = useState<Record<string, string>>({});

  const currentYear = selectedMonth.split('-')[0];
  const currentMonthPart = selectedMonth.split('-')[1];

  useEffect(() => {
    if (visible && selectedMonth) {
      loadBudgetData();
    }
  }, [visible, selectedMonth]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const monthBudgetRef = doc(db, 'userBudgets', userId, 'months', selectedMonth);
      const monthSnap = await getDoc(monthBudgetRef);
      
      if (!monthSnap.exists()) {
        setMonthlyBudget(0);
        setCategorySpending({});
        setExistingLimits({});
        setEditedLimits({});
        setLoading(false);
        return;
      }

      const budgetData = monthSnap.data();
      const budget = budgetData.newBudget || budgetData.startingBudget || 0;
      setMonthlyBudget(budget);

      const categories = budgetData.categories || {};
      setCategorySpending(categories);

      const limitsData = await getCategoryLimits(userId, selectedMonth);
      if (limitsData && limitsData.limits) {
        setExistingLimits(limitsData.limits);
        const edited: Record<string, string> = {};
        Object.keys(categories).forEach((cat) => {
          edited[cat] = limitsData.limits[cat]?.toString() || '';
        });
        setEditedLimits(edited);
      } else {
        setExistingLimits({});
        const edited: Record<string, string> = {};
        Object.keys(categories).forEach((cat) => {
          edited[cat] = '';
        });
        setEditedLimits(edited);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthSelect = (monthId: string) => {
    setSelectedMonth(`${currentYear}-${monthId}`);
  };

  const handleYearSelect = (year: string) => {
    setYearPickerVisible(false);
    setSelectedMonth(`${year}-${currentMonthPart}`);
  };

  const calculateRemainingBudget = (): number => {
    let allocated = 0;
    Object.keys(editedLimits).forEach((cat) => {
      const value = parseFloat(editedLimits[cat]);
      if (!isNaN(value) && value > 0) {
        allocated += value;
      }
    });
    return monthlyBudget - allocated;
  };

  const getUnassignedCategories = (): string[] => {
    return Object.keys(categorySpending).filter((cat) => {
      const value = editedLimits[cat];
      return !value || value.trim() === '' || parseFloat(value) === 0;
    });
  };

  const distributeRemainingBudget = (
    unassignedCategories: string[],
    remainingBudget: number
  ): Record<string, number> => {
    const distribution: Record<string, number> = {};
    
    const totalSpending = unassignedCategories.reduce(
      (sum, cat) => sum + (categorySpending[cat] || 0),
      0
    );

    if (totalSpending === 0) {
      const perCategory = remainingBudget / unassignedCategories.length;
      unassignedCategories.forEach((cat) => {
        distribution[cat] = Math.max(0, perCategory);
      });
    } else {
      unassignedCategories.forEach((cat) => {
        const spending = categorySpending[cat] || 0;
        const proportion = spending / totalSpending;
        distribution[cat] = Math.max(0, remainingBudget * proportion);
      });
    }

    return distribution;
  };

  const handleSave = async () => {
    try {
      const unassigned = getUnassignedCategories();
      const remaining = calculateRemainingBudget();

      const finalLimits: Record<string, number> = {};
      Object.keys(editedLimits).forEach((cat) => {
        const value = parseFloat(editedLimits[cat]);
        if (!isNaN(value) && value > 0) {
          finalLimits[cat] = value;
        }
      });

      if (unassigned.length > 0 && remaining > 0) {
        Alert.alert(
          'Incomplete Budget Allocation',
          `You haven't assigned budgets to ${unassigned.length} ${
            unassigned.length === 1 ? 'category' : 'categories'
          }.\n\nWould you like us to automatically distribute the remaining ₹${remaining.toFixed(
            2
          )} based on your current spending pattern?`,
          [
            {
              text: 'No, Save As Is',
              style: 'cancel',
              onPress: () => saveLimits(finalLimits),
            },
            {
              text: 'Yes, Auto-Distribute',
              onPress: async () => {
  const distribution = distributeRemainingBudget(unassigned, remaining);
  const completeLimits = { ...finalLimits, ...distribution };
  await saveLimits(completeLimits);
},

            },
          ]
        );
      } else {
        saveLimits(finalLimits);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      Alert.alert('Error', 'Failed to process budget allocation');
    }
  };

  const saveLimits = async (limits: Record<string, number>) => {
  try {
    setSaving(true);

    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        'Session error',
        'User not authenticated. Please reopen the app.'
      );
      setSaving(false);
      return;
    }

    const userId = user.uid;


      await setCategoryRules(userId, selectedMonth, {
        limits,
        autoRebalance: false,
      });

      Alert.alert(
        'Success',
        'Category budgets have been updated successfully!',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error saving limits:', error);
      Alert.alert('Error', 'Failed to save category budgets');
    } finally {
      setSaving(false);
    }
  };

  const categories = Object.keys(categorySpending);
  const remaining = calculateRemainingBudget();
  const totalAllocated = monthlyBudget - remaining;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.primaryText }]}>
              Manage Category Budgets
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent[0]} />
              <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
                Loading budget data...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.monthSelector}>
                <View style={styles.selectorHeader}>
                  <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>
                    Select Month & Year
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setYearPickerVisible(true)}
                    style={[
                      styles.yearIndicator,
                      { backgroundColor: theme.accent[0] }
                    ]}
                  >
                    <Text style={styles.yearText}>{currentYear.slice(2)}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.monthScrollContent}
                >
                  {MONTHS.map((month) => {
                    const isSelected = currentMonthPart === month.id;
                    return (
                      <TouchableOpacity
                        key={month.id}
                        activeOpacity={0.7}
                        onPress={() => handleMonthSelect(month.id)}
                        style={[
                          styles.monthTab,
                          {
                            backgroundColor: isSelected
                              ? theme.accent[0]
                              : 'rgba(180, 164, 248, 0.1)',
                            borderColor: isSelected
                              ? theme.accent[0]
                              : theme.cardBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthTabText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.primaryText,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}
                        >
                          {month.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.budgetSummary}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                    Monthly Budget
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.primaryText }]}>
                    ₹{monthlyBudget.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                    Allocated
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: totalAllocated > monthlyBudget ? '#FF6B6B' : theme.accent[0] },
                    ]}
                  >
                    ₹{totalAllocated.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                    Remaining
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: remaining < 0 ? '#FF6B6B' : '#4CAF50' },
                    ]}
                  >
                    ₹{remaining.toFixed(2)}
                  </Text>
                </View>
              </View>

              {categories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>📊</Text>
                  <Text style={[styles.emptyText, { color: theme.primaryText }]}>
                    No transactions for this month
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
                    Add transactions to set category budgets
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>
                    Allocate Budget by Category
                  </Text>
                  {categories.map((category) => {
                    const spent = categorySpending[category] || 0;
                    const limit = parseFloat(editedLimits[category]) || 0;
                    const isOverspent = limit > 0 && spent > limit;

                    return (
                      <View
                        key={category}
                        style={[
                          styles.categoryRow,
                          { borderColor: theme.cardBorder },
                        ]}
                      >
                        <View style={styles.categoryHeader}>
                          <Text
                            style={[
                              styles.categoryName,
                              { color: theme.primaryText },
                            ]}
                          >
                            {category}
                          </Text>
                          <Text
                            style={[
                              styles.categorySpent,
                              {
                                color: isOverspent
                                  ? '#FF6B6B'
                                  : theme.secondaryText,
                              },
                            ]}
                          >
                            Spent: ₹{spent.toFixed(2)}
                            {isOverspent && ' ⚠️'}
                          </Text>
                        </View>

                        <View style={styles.inputRow}>
                          <Text
                            style={[
                              styles.currencySymbol,
                              { color: theme.primaryText },
                            ]}
                          >
                            ₹
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                color: theme.primaryText,
                                borderColor: isOverspent
                                  ? '#FF6B6B'
                                  : theme.cardBorder,
                              },
                            ]}
                            value={editedLimits[category]}
                            onChangeText={(text) =>
                              setEditedLimits((prev) => ({
                                ...prev,
                                [category]: text,
                              }))
                            }
                            keyboardType="numeric"
                            placeholder="Set limit"
                            placeholderTextColor={theme.secondaryText}
                          />
                        </View>
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleSave}
                    disabled={saving}
                    style={[
                      styles.saveButton,
                      { backgroundColor: theme.accent[0] },
                    ]}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Budget Allocation</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      <Modal
        visible={yearPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setYearPickerVisible(false)}
          style={styles.yearModalOverlay}
        >
          <View
            style={[
              styles.yearPickerContainer,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }
            ]}
          >
            <Text style={[styles.yearPickerTitle, { color: theme.primaryText }]}>
              Select Year
            </Text>
            {YEARS.map((year) => (
              <TouchableOpacity
                key={year}
                activeOpacity={0.7}
                onPress={() => handleYearSelect(year)}
                style={[
                  styles.yearOption,
                  {
                    backgroundColor: year === currentYear
                      ? theme.accent[0]
                      : 'transparent',
                  }
                ]}
              >
                <Text
                  style={[
                    styles.yearOptionText,
                    {
                      color: year === currentYear ? '#FFFFFF' : theme.primaryText,
                      fontWeight: year === currentYear ? '700' : '600',
                    }
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  scrollView: {
    paddingHorizontal: 24,
  },
  monthSelector: {
    marginBottom: 24,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  monthScrollContent: {
    paddingRight: 16,
  },
  monthTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1.5,
  },
  monthTabText: {
    fontSize: 13,
  },
  budgetSummary: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(180, 164, 248, 0.12)',
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  categorySpent: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  yearModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearPickerContainer: {
    width: 200,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
  },
  yearPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  yearOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  yearOptionText: {
    fontSize: 15,
  },
});