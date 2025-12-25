// app/parsing/csv-imports.tsx
// UPDATED: Shows "CSV amount / Total amount" in category circles

import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../src2/firebase/config';

// ============================================================================
// TYPES
// ============================================================================

interface FirestoreTransaction {
  amount: number;
  type: 'expense' | 'income';
  date: string;
  month: string;
  year: number;
  merchantName: string;
  category: string;
  affectsBudget: boolean;
  createdAt?: any; // Firestore Timestamp
}

interface CategorySummary {
  category: string;
  spent: number;
  total: number;
  csvAmount: number; // NEW: Amount from this CSV import only
}

interface MonthSummary {
  month: string;
  monthLabel: string;
  transactions: FirestoreTransaction[];
  totalIncome: number;
  totalExpenses: number;
  budgetImpactExpenses: number;
  categorySummaries: CategorySummary[];
}

interface UserOnboardingData {
  monthlyIncome: number;
  monthlyBudget: number;
  currentBankBalance: number;
  savingAmount: number;
  savingDuration: number;
}

// ============================================================================
// CATEGORY COLORS
// ============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6B6B',
  Shopping: '#4ECDC4',
  Groceries: '#95E1D3',
  Rent: '#F38181',
  Travel: '#AA96DA',
  Transport: '#FCBAD3',
  Utilities: '#FFD3B6',
  Subscriptions: '#A8D8EA',
  Healthcare: '#FF8B94',
  Education: '#FFD3B6',
  Transfers: '#DCEDC1',
  Income: '#30D158',
  Gifts: '#FFA8A8',
  Other: '#8E8E93',
};

// ============================================================================
// READ TRANSACTIONS FROM FIRESTORE
// ============================================================================

async function readTransactionsFromFirestore(): Promise<FirestoreTransaction[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  try {
    const transactionsRef = collection(db, 'transactions', user.uid, 'items');
    const snapshot = await getDocs(transactionsRef);
    
    const transactions: FirestoreTransaction[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        amount: data.amount,
        type: data.type,
        date: data.date,
        month: data.month,
        year: data.year,
        merchantName: data.merchantName,
        category: data.category,
        affectsBudget: data.affectsBudget,
        createdAt: data.createdAt, // Include timestamp
      });
    });
    
    console.log(`✅ Read ${transactions.length} transactions from Firestore`);
    return transactions;
  } catch (error) {
    console.error('Error reading transactions:', error);
    throw error;
  }
}

// ============================================================================
// READ USER ONBOARDING DATA
// ============================================================================

async function readUserOnboardingData(): Promise<UserOnboardingData> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  try {
    const userRef = doc(db, 'userOnboardingData', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User onboarding data not found');
    }
    
    const data = userSnap.data();
    return {
      monthlyIncome: data.monthlyIncome || 0,
      monthlyBudget: data.monthlyBudget || 0,
      currentBankBalance: data.currentBankBalance || 0,
      savingAmount: data.savingAmount || 0,
      savingDuration: data.savingDuration || 0,
    };
  } catch (error) {
    console.error('Error reading user data:', error);
    throw error;
  }
}

// ============================================================================
// CALCULATE MONTH SUMMARIES - UPDATED TO SPLIT CSV vs TOTAL AMOUNTS
// ============================================================================

function calculateMonthSummaries(
  transactions: FirestoreTransaction[]
): MonthSummary[] {
  const monthMap: Record<string, FirestoreTransaction[]> = {};
  
  transactions.forEach(txn => {
    if (!monthMap[txn.month]) {
      monthMap[txn.month] = [];
    }
    monthMap[txn.month].push(txn);
  });
  
  const summaries: MonthSummary[] = [];
  
  // Calculate cutoff time: 5 minutes ago
  const cutoffTime = Date.now() - (5 * 60 * 1000);
  
  Object.entries(monthMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([month, txns]) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const monthLabel = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      const totalIncome = txns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = txns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const budgetImpactExpenses = txns
        .filter(t => t.type === 'expense' && t.affectsBudget)
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate category summaries with CSV-only amounts
      const categoryMap: Record<string, { total: number; csv: number }> = {};
      
      txns.forEach(txn => {
        if (txn.type === 'expense') {
          if (!categoryMap[txn.category]) {
            categoryMap[txn.category] = { total: 0, csv: 0 };
          }
          
          // Add to total
          categoryMap[txn.category].total += txn.amount;
          
          // Check if this is from recent CSV import (created in last 5 minutes)
          const isNewCSV = txn.createdAt && 
            txn.createdAt.toMillis && 
            txn.createdAt.toMillis() > cutoffTime;
          
          if (isNewCSV) {
            categoryMap[txn.category].csv += txn.amount;
          }
        }
      });
      
      const categorySummaries: CategorySummary[] = Object.entries(categoryMap)
        .map(([category, amounts]) => ({
          category,
          spent: amounts.total,
          total: amounts.total,
          csvAmount: amounts.csv, // NEW: Amount from CSV import
        }))
        .sort((a, b) => b.spent - a.spent);
      
      summaries.push({
        month,
        monthLabel,
        transactions: txns,
        totalIncome,
        totalExpenses,
        budgetImpactExpenses,
        categorySummaries,
      });
    });
  
  return summaries;
}

// ============================================================================
// WRITE TO USER BUDGETS - SEPARATE FUNCTION FOR EACH MONTH
// ============================================================================

async function writeMonthBudgetToFirestore(
  month: string,
  monthData: MonthSummary,
  userData: UserOnboardingData
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  try {
    const monthRef = doc(db, 'userBudgets', user.uid, 'months', month);
    const monthSnap = await getDoc(monthRef);
    
    let startingBudget = userData.monthlyBudget;
    let existingCategoryTotals: Record<string, number> = {};
    
    if (monthSnap.exists()) {
      const existingData = monthSnap.data();
      startingBudget = existingData.startingBudget || userData.monthlyBudget;
      existingCategoryTotals = existingData.categories || {};
    }
    
    // Update category totals
    const updatedCategories: Record<string, number> = { ...existingCategoryTotals };
    monthData.categorySummaries.forEach(cat => {
      if (!updatedCategories[cat.category]) {
        updatedCategories[cat.category] = 0;
      }
      updatedCategories[cat.category] += cat.spent;
    });
    
    const totalExpenses = Object.values(updatedCategories).reduce((sum, val) => sum + val, 0);
    const newBudget = startingBudget - monthData.budgetImpactExpenses;
    
    // Calculate savings reduction if needed
    let savingsReduction = 0;
    if (newBudget < 0) {
      savingsReduction = Math.abs(newBudget);
    }
    
    const budgetData = {
      month,
      startingBudget,
      totalExpenses,
      budgetImpactExpenses: monthData.budgetImpactExpenses,
      newBudget,
      savingsReduction,
      categories: updatedCategories,
      totalIncome: monthData.totalIncome,
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(monthRef, budgetData, { merge: true });
    console.log(`✅ Written budget data for ${month}`);
  } catch (error) {
    console.error(`Error writing budget for ${month}:`, error);
    throw error;
  }
}

// ============================================================================
// UPDATE GLOBAL BANK BALANCE
// ============================================================================

async function updateGlobalBankBalance(
  allTransactions: FirestoreTransaction[],
  currentBalance: number
): Promise<number> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  try {
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const newBalance = currentBalance + totalIncome - totalExpenses;
    
    const userRef = doc(db, 'userOnboardingData', user.uid);
    await updateDoc(userRef, {
      currentBankBalance: newBalance,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ Updated bank balance: ${newBalance}`);
    return newBalance;
  } catch (error) {
    console.error('Error updating bank balance:', error);
    throw error;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CSVImportsScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [monthSummaries, setMonthSummaries] = useState<MonthSummary[]>([]);
  const [userData, setUserData] = useState<UserOnboardingData | null>(null);
  const [currentMonthSummary, setCurrentMonthSummary] = useState<MonthSummary | null>(null);
  const [newBankBalance, setNewBankBalance] = useState(0);
  
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  // ============================================================================
  // LOAD DATA ON MOUNT - NO PARAMS, READ FROM FIRESTORE
  // ============================================================================
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Read user data
      const userDataResult = await readUserOnboardingData();
      setUserData(userDataResult);
      
      // Read transactions from Firestore
      const transactions = await readTransactionsFromFirestore();
      
      if (transactions.length === 0) {
        Alert.alert('No Transactions', 'No transactions found in Firestore.');
        router.back();
        return;
      }
      
      // Calculate summaries per month
      const summaries = calculateMonthSummaries(transactions);
      setMonthSummaries(summaries);
      
      // Find current month summary
      const currentSummary = summaries.find(s => s.month === currentMonth);
      setCurrentMonthSummary(currentSummary || null);
      
      // Calculate new bank balance
      const newBalance = userDataResult.currentBankBalance +
        summaries.reduce((sum, s) => sum + s.totalIncome, 0) -
        summaries.reduce((sum, s) => sum + s.totalExpenses, 0);
      setNewBankBalance(newBalance);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
      setLoading(false);
      router.back();
    }
  };
  
  // ============================================================================
  // APPLY UPDATES
  // ============================================================================
  
  const handleApply = async () => {
    if (!userData) {
      Alert.alert('Error', 'User data not loaded');
      return;
    }
    
    try {
      setApplying(true);
      
      // Write budget data for each month
      for (const monthSummary of monthSummaries) {
        await writeMonthBudgetToFirestore(
          monthSummary.month,
          monthSummary,
          userData
        );
      }
      
      // Update global bank balance
      const allTransactions = monthSummaries.flatMap(s => s.transactions);
      await updateGlobalBankBalance(allTransactions, userData.currentBankBalance);
      
      setApplying(false);
      
      // Navigate to success screen
    router.push({
      pathname: '/parsing/csv-confirm',
      params: {
        transactionCount: allTransactions.length.toString(),
        success: 'true',
    },
});
      
    } catch (error) {
      setApplying(false);
      console.error('Error applying updates:', error);
      Alert.alert('Error', 'Failed to apply updates. Please try again.');
    }
  };
  
  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      </View>
    );
  }
  
  if (!userData || !currentMonthSummary) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No data available</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // ============================================================================
  // CALCULATE CURRENT MONTH VALUES
  // ============================================================================
  
  const newBudget = userData.monthlyBudget - currentMonthSummary.budgetImpactExpenses;
  const savingsReduction = newBudget < 0 ? Math.abs(newBudget) : 0;
  const newSavings = userData.savingAmount - savingsReduction;
  
  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Changes</Text>
        <Text style={styles.subtitle}>
          See how these transactions will update your budget
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        
        {/* Current Month Budget Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {currentMonthSummary.monthLabel} Budget
          </Text>
          
          <View style={styles.budgetCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Starting Budget</Text>
              <Text style={styles.budgetValue}>₹{userData.monthlyBudget.toFixed(2)}</Text>
            </View>
            
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>New Expenses</Text>
              <Text style={[styles.budgetValue, styles.expenseValue]}>
                -₹{currentMonthSummary.budgetImpactExpenses.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabelBold}>Updated Budget</Text>
              <Text style={[
                styles.budgetValueBold,
                newBudget < 0 && styles.negativeValue
              ]}>
                ₹{newBudget.toFixed(2)}
              </Text>
            </View>
            
            {newBudget < 0 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Budget exceeded. ₹{savingsReduction.toFixed(2)} will be deducted from savings.
                </Text>
              </View>
            )}
          </View>
          
          {/* Category breakdown - UPDATED TO SHOW CSV / TOTAL */}
          {currentMonthSummary.categorySummaries.length > 0 && (
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>Spending by Category</Text>
              <View style={styles.categoryGrid}>
                {currentMonthSummary.categorySummaries.map((cat, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.categoryCircle,
                      { backgroundColor: CATEGORY_COLORS[cat.category] || '#8E8E93' }
                    ]}
                  >
                    <Text style={styles.categoryName}>{cat.category.toUpperCase()}</Text>
                    {cat.csvAmount > 0 ? (
                      <Text style={styles.categoryAmount}>
                        ₹{cat.csvAmount.toFixed(0)} / ₹{cat.total.toFixed(0)}
                      </Text>
                    ) : (
                      <Text style={styles.categoryAmount}>₹{cat.total.toFixed(0)}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        
        {/* Savings Update */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings</Text>
          
          <View style={styles.savingsCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Current Savings</Text>
              <Text style={styles.budgetValue}>₹{userData.savingAmount.toFixed(2)}</Text>
            </View>
            
            {savingsReduction > 0 && (
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Reduction</Text>
                <Text style={[styles.budgetValue, styles.expenseValue]}>
                  -₹{savingsReduction.toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabelBold}>Updated Savings</Text>
              <Text style={[
                styles.budgetValueBold,
                newSavings < 0 && styles.negativeValue
              ]}>
                ₹{newSavings.toFixed(2)}
              </Text>
            </View>
            
            {newSavings < 0 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Savings depleted. Consider adding another month or adjusting budget.
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Bank Balance Update */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Balance</Text>
          
          <View style={styles.bankCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Current Balance</Text>
              <Text style={styles.budgetValue}>₹{userData.currentBankBalance.toFixed(2)}</Text>
            </View>
            
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Total Income</Text>
              <Text style={[styles.budgetValue, styles.incomeValue]}>
                +₹{monthSummaries.reduce((sum, s) => sum + s.totalIncome, 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Total Expenses</Text>
              <Text style={[styles.budgetValue, styles.expenseValue]}>
                -₹{monthSummaries.reduce((sum, s) => sum + s.totalExpenses, 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabelBold}>Updated Balance</Text>
              <Text style={styles.budgetValueBold}>₹{newBankBalance.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              💡 Bank balance is affected by ALL transactions (income and expenses) from all months.
            </Text>
          </View>
        </View>
        
        {/* Other Months Info */}
        {monthSummaries.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Months</Text>
            {monthSummaries
              .filter(s => s.month !== currentMonth)
              .map((monthSummary, idx) => (
                <View key={idx} style={styles.otherMonthCard}>
                  <Text style={styles.otherMonthTitle}>{monthSummary.monthLabel}</Text>
                  <Text style={styles.otherMonthText}>
                    {monthSummary.transactions.length} transaction{monthSummary.transactions.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.otherMonthText}>
                    Expenses: ₹{monthSummary.budgetImpactExpenses.toFixed(2)}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
      
      {/* Footer with Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, applying && styles.applyButtonDisabled]}
          onPress={handleApply}
          disabled={applying}
        >
          {applying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applyButtonText}>Apply Updates</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
  },
  
  budgetCard: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  savingsCard: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
  },
  bankCard: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetLabel: {
    color: '#8E8E93',
    fontSize: 16,
  },
  budgetLabelBold: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  budgetValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  budgetValueBold: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  incomeValue: {
    color: '#30D158',
  },
  expenseValue: {
    color: '#FF3B30',
  },
  negativeValue: {
    color: '#FF3B30',
  },
  
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 12,
  },
  
  warningBox: {
    backgroundColor: '#2a1f1f',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    color: '#ff9500',
    fontSize: 14,
    lineHeight: 20,
  },
  
  noteBox: {
    backgroundColor: '#1f2a2a',
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    color: '#007AFF',
    fontSize: 14,
    lineHeight: 20,
  },
  
  categorySection: {
    marginTop: 10,
  },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCircle: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  categoryName: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  categoryAmount: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  
  otherMonthCard: {
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  otherMonthTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  otherMonthText: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  applyButton: {
    backgroundColor: '#30D158',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#2a2a2a',
    opacity: 0.5,
  },
  applyButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
});