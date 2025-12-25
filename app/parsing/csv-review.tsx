// app/parsing/csv-review.tsx
// File 2: Review, categorize, and WRITE TO FIRESTORE

import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
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

interface ParsedTransaction {
  amount: number;
  type: 'expense' | 'income';
  date: string;
  month: string;
  year: number;
  merchantName: string;
  category: string;
  source: 'csv';
  confidence: 'high' | 'low';
  affectsBudget: boolean;
}

interface MonthGroup {
  month: string;
  monthLabel: string;
  transactions: ParsedTransaction[];
}

// ============================================================================
// AVAILABLE CATEGORIES
// ============================================================================

const AVAILABLE_CATEGORIES = [
  'Food',
  'Shopping',
  'Groceries',
  'Rent',
  'Travel',
  'Transport',
  'Utilities',
  'Subscriptions',
  'Healthcare',
  'Education',
  'Transfers',
  'Income',
  'Gifts',
  'Other',
];

function shouldAffectBudget(category: string, type: 'expense' | 'income'): boolean {
  if (type === 'income') return false;
  if (category === 'Transfers' || category === 'Income') return false;
  return true;
}

// ============================================================================
// GENERATE TRANSACTION ID
// ============================================================================

function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `${timestamp}_${randomStr}`;
}

// ============================================================================
// CHECK FOR DUPLICATE TRANSACTIONS
// ============================================================================

async function checkDuplicates(
  transactions: ParsedTransaction[]
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    // Check only a sample to avoid too many reads
    const sampleSize = Math.min(3, transactions.length);
    const sample = transactions.slice(0, sampleSize);
    
    for (const txn of sample) {
      const q = query(
        collection(db, 'transactions', user.uid, 'items'),
        where('date', '==', txn.date),
        where('amount', '==', txn.amount),
        where('merchantName', '==', txn.merchantName)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return true; // Found duplicate
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return false;
  }
}

// ============================================================================
// FIREBASE WRITE FUNCTION - WRITES TO transactions/<uid>/items/<id>
// ============================================================================

async function saveTransactionsToFirestore(
  transactions: ParsedTransaction[]
): Promise<{ success: number; failed: number }> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  let success = 0;
  let failed = 0;
  
  for (const transaction of transactions) {
    try {
      const transactionId = generateTransactionId();
      const transactionRef = doc(db, 'transactions', user.uid, 'items', transactionId);
      
      const firestoreData = {
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        month: transaction.month,
        year: transaction.year,
        merchantName: transaction.merchantName,
        category: transaction.category,
        source: transaction.source,
        affectsBudget: transaction.affectsBudget,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(transactionRef, firestoreData);
      success++;
      console.log(`✅ Saved transaction ${transactionId}`);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      failed++;
    }
  }
  
  return { success, failed };
}

// ============================================================================
// GROUP TRANSACTIONS BY MONTH
// ============================================================================

function groupTransactionsByMonth(transactions: ParsedTransaction[]): MonthGroup[] {
  const monthMap: Record<string, ParsedTransaction[]> = {};
  
  transactions.forEach(txn => {
    if (!monthMap[txn.month]) {
      monthMap[txn.month] = [];
    }
    monthMap[txn.month].push(txn);
  });
  
  const groups: MonthGroup[] = Object.entries(monthMap)
    .sort((a, b) => b[0].localeCompare(a[0])) // Sort newest first
    .map(([month, txns]) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const monthLabel = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      return {
        month,
        monthLabel,
        transactions: txns,
      };
    });
  
  return groups;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CSVReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  
  // ============================================================================
  // PARSE PARAMS ON MOUNT
  // ============================================================================
  
  useEffect(() => {
    if (params.transactions) {
      try {
        const parsed: ParsedTransaction[] = JSON.parse(params.transactions as string);
        setTransactions(parsed);
        
        const groups = groupTransactionsByMonth(parsed);
        setMonthGroups(groups);
      } catch (error) {
        console.error('Failed to parse transactions:', error);
        Alert.alert('Error', 'Failed to load transactions');
        router.back();
      }
    }
  }, [params.transactions]);
  
  // ============================================================================
  // CATEGORY SELECTION HANDLER
  // ============================================================================
  
  const handleCategorySelect = (index: number, newCategory: string) => {
    const updated = [...transactions];
    updated[index].category = newCategory;
    updated[index].confidence = 'high';
    updated[index].affectsBudget = shouldAffectBudget(newCategory, updated[index].type);
    
    setTransactions(updated);
    
    // Update month groups
    const groups = groupTransactionsByMonth(updated);
    setMonthGroups(groups);
    
    setEditingIndex(null);
  };
  
  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  const hasUncategorized = transactions.some(
    t => t.confidence === 'low' || t.category === 'Uncategorized'
  );
  
  const uncategorizedCount = transactions.filter(
    t => t.confidence === 'low' || t.category === 'Uncategorized'
  ).length;
  
  const currentMonth = new Date().toISOString().substring(0, 7);
  const hasMultipleMonths = monthGroups.length > 1;
  const hasOtherMonths = monthGroups.some(g => g.month !== currentMonth);
  
  // ============================================================================
  // SAVE HANDLER - WRITES TO FIRESTORE
  // ============================================================================
  
  const handleSave = async () => {
    if (hasUncategorized) {
      Alert.alert(
        'Categorization Required',
        `${uncategorizedCount} transaction${uncategorizedCount !== 1 ? 's' : ''} need${uncategorizedCount === 1 ? 's' : ''} categorization before import.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      // Check for duplicates
      const hasDuplicates = await checkDuplicates(transactions);
      
      if (hasDuplicates) {
        setLoading(false);
        Alert.alert(
          'Duplicate Transactions Detected',
          'Some transactions already exist in your account. Do you want to add them again?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {},
            },
            {
              text: 'Add Anyway',
              onPress: async () => {
                setLoading(true);
                await proceedWithSave();
              },
            },
          ]
        );
        return;
      }
      
      await proceedWithSave();
      
    } catch (error) {
      setLoading(false);
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save transactions. Please try again.');
    }
  };
  
  const proceedWithSave = async () => {
    try {
      // WRITE TO FIRESTORE: transactions/<uid>/items/<transactionId>
      const result = await saveTransactionsToFirestore(transactions);
      
      setLoading(false);
      
      if (result.failed > 0) {
        Alert.alert(
          'Partial Import',
          `${result.success} succeeded, ${result.failed} failed.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log(`✅ Successfully saved ${result.success} transactions to Firestore`);
      
      // Navigate to csv-imports screen (this will handle budget updates)
      router.push({
        pathname: '/parsing/csv-imports',
        params: {
          transactionCount: transactions.length.toString(),
          hasOtherMonths: hasOtherMonths.toString(),
        },
      });
      
    } catch (error) {
      setLoading(false);
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save transactions.');
    }
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Transactions</Text>
        <Text style={styles.subtitle}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} • {monthGroups.length} month{monthGroups.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        
        {hasUncategorized && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Action Required</Text>
            <Text style={styles.warningText}>
              {uncategorizedCount} transaction{uncategorizedCount !== 1 ? 's' : ''} need categorization.
            </Text>
          </View>
        )}
        
        {hasMultipleMonths && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Transactions from {monthGroups.length} different months detected. Each month will be processed separately.
            </Text>
          </View>
        )}
        
        {monthGroups.map((group, groupIdx) => {
          const isCurrentMonth = group.month === currentMonth;
          
          return (
            <View key={group.month} style={styles.section}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{group.monthLabel}</Text>
                {isCurrentMonth && (
                  <View style={styles.currentMonthBadge}>
                    <Text style={styles.currentMonthText}>Current</Text>
                  </View>
                )}
                <Text style={styles.monthCount}>
                  {group.transactions.length} transaction{group.transactions.length !== 1 ? 's' : ''}
                </Text>
              </View>
              
              {group.transactions.map((txn) => {
                const globalIndex = transactions.findIndex(
                  t => t.date === txn.date && t.amount === txn.amount && t.merchantName === txn.merchantName
                );
                const isUncategorized = txn.confidence === 'low' || txn.category === 'Uncategorized';
                const isEditing = editingIndex === globalIndex;
                
                return (
                  <View
                    key={globalIndex}
                    style={[
                      styles.transactionCard,
                      isUncategorized && styles.transactionCardUncategorized,
                    ]}
                  >
                    <View style={styles.transactionHeader}>
                      <Text style={styles.merchantName} numberOfLines={1}>
                        {txn.merchantName}
                      </Text>
                      <Text style={[
                        styles.amount,
                        txn.type === 'income' && styles.amountIncome,
                      ]}>
                        {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.transactionDetails}>
                      <Text style={styles.date}>
                        {new Date(txn.date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    
                    {isUncategorized && !isEditing && (
                      <View style={styles.categorizationPrompt}>
                        <Text style={styles.promptText}>
                          ❓ Where should this go?
                        </Text>
                        <TouchableOpacity
                          style={styles.selectCategoryButton}
                          onPress={() => setEditingIndex(globalIndex)}
                        >
                          <Text style={styles.selectCategoryButtonText}>
                            Select Category
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {isEditing && (
                      <View style={styles.categorySelector}>
                        <Text style={styles.categoryPromptTitle}>
                          Select a category:
                        </Text>
                        <View style={styles.categoryGrid}>
                          {AVAILABLE_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                              key={cat}
                              style={styles.categoryOption}
                              onPress={() => handleCategorySelect(globalIndex, cat)}
                            >
                              <Text style={styles.categoryOptionText}>{cat}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => setEditingIndex(null)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {!isUncategorized && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{txn.category}</Text>
                        {!txn.affectsBudget && (
                          <Text style={styles.noBudgetTag}>No budget impact</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
      
      <View style={styles.footer}>
        {hasUncategorized && (
          <View style={styles.validationWarning}>
            <Text style={styles.validationWarningText}>
              ⚠️ {uncategorizedCount} need categorization
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            (hasUncategorized || loading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={loading || hasUncategorized}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              Import {transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}
            </Text>
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
  
  content: {
    flex: 1,
  },
  
  warningBox: {
    backgroundColor: '#2a1f1f',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  warningTitle: {
    color: '#ff9500',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  warningText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  
  infoBox: {
    backgroundColor: '#1f2a2a',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    color: '#007AFF',
    fontSize: 14,
    lineHeight: 20,
  },
  
  section: {
    padding: 20,
    paddingTop: 0,
  },
  monthHeader: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },
  currentMonthBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  currentMonthText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  monthCount: {
    color: '#8E8E93',
    fontSize: 14,
  },
  
  transactionCard: {
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  transactionCardUncategorized: {
    borderWidth: 2,
    borderColor: '#ff9500',
    backgroundColor: '#1f1709',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchantName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  amount: {
    color: '#ff3b30',
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountIncome: {
    color: '#34c759',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    color: '#666',
    fontSize: 14,
  },
  
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  categoryText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noBudgetTag: {
    color: '#34c759',
    fontSize: 11,
    backgroundColor: '#0d1f14',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  
  categorizationPrompt: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  promptText: {
    color: '#ff9500',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  selectCategoryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectCategoryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  
  categorySelector: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  categoryPromptTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryOption: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  categoryOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  validationWarning: {
    backgroundColor: '#2a1f1f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  validationWarningText: {
    color: '#ff9500',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#34c759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#2a2a2a',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});