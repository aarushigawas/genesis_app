import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
  source: 'csv' | 'pdf';
  affectsBudget: boolean;
}

interface CategorySummary {
  category: string;
  count: number;
  total: number;
  type: 'expense' | 'income' | 'mixed';
  affectsBudget: boolean;
}

// ============================================================================
// CALCULATE CATEGORY SUMMARIES
// ============================================================================

function calculateCategorySummaries(transactions: ParsedTransaction[]): CategorySummary[] {
  const categoryMap: { [key: string]: CategorySummary } = {};
  
  transactions.forEach(txn => {
    if (!categoryMap[txn.category]) {
      categoryMap[txn.category] = {
        category: txn.category,
        count: 0,
        total: 0,
        type: txn.type,
        affectsBudget: txn.affectsBudget,
      };
    }
    
    categoryMap[txn.category].count++;
    categoryMap[txn.category].total += txn.amount;
    
    if (categoryMap[txn.category].type !== txn.type) {
      categoryMap[txn.category].type = 'mixed';
    }
  });
  
  return Object.values(categoryMap).sort((a, b) => b.total - a.total);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CSVImportsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get month from params or default to current month
  const selectedMonth = (params.month as string) || new Date().toISOString().slice(0, 7);
  
  // State
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [budgetAffectingExpenses, setBudgetAffectingExpenses] = useState(0);
  
  // Budget from Firebase
  const [currentBudget, setCurrentBudget] = useState<number>(0);
  const [newBudget, setNewBudget] = useState<number | null>(null);
  
  // UI state
  const [userChoice, setUserChoice] = useState<'yes' | 'no' | null>(null);
  const [showCalculations, setShowCalculations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [calculationHeight] = useState(new Animated.Value(0));
  
  // ============================================================================
  // FETCH TRANSACTIONS FROM FIRESTORE
  // ============================================================================
  
  useEffect(() => {
    fetchTransactionsFromFirestore();
  }, [selectedMonth]);
  
  const fetchTransactionsFromFirestore = async () => {
    try {
      setLoading(true);
      
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view transactions.');
        router.replace('/(tabs)');
        return;
      }
      
      console.log('🔍 Fetching transactions for month:', selectedMonth);
      console.log('🔍 User ID:', user.uid);
      
      // Fetch transactions for selected month
      const itemsRef = collection(db, 'transactions', user.uid, 'items');
      const q = query(itemsRef, where('month', '==', selectedMonth));
      
      const querySnapshot = await getDocs(q);
      const fetchedTransactions: ParsedTransaction[] = [];
      
      console.log('📦 Documents found:', querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Transaction:', data);
        
        fetchedTransactions.push({
          amount: data.amount || 0,
          type: data.type || 'expense',
          date: data.date || new Date().toISOString(),
          month: data.month || selectedMonth,
          year: data.year || new Date().getFullYear(),
          merchantName: data.merchantName || 'Unknown',
          category: data.category || 'Other',
          source: data.source || 'csv',
          affectsBudget: data.affectsBudget !== undefined ? data.affectsBudget : true,
        });
      });
      
      console.log('✅ Fetched transactions:', fetchedTransactions.length);
      
      if (fetchedTransactions.length === 0) {
        Alert.alert(
          'No Transactions',
          `No transactions found for ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. They may have been saved to a different month.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
        setLoading(false);
        return;
      }
      
      setTransactions(fetchedTransactions);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
      setLoading(false);
    }
  };
  
  // ============================================================================
  // FETCH CURRENT BUDGET FROM FIREBASE
  // ============================================================================
  
  useEffect(() => {
    fetchCurrentBudget();
  }, []);
  
  const fetchCurrentBudget = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const userDocRef = doc(db, 'userOnboardingData', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCurrentBudget(data.monthlyBudget || 0);
      } else {
        setCurrentBudget(50000); // Fallback
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
      setCurrentBudget(50000); // Fallback
    }
  };
  
  // ============================================================================
  // CALCULATE TOTALS FROM TRANSACTIONS STATE
  // ============================================================================
  
  useEffect(() => {
    if (transactions.length === 0) return;
    
    let income = 0;
    let expenses = 0;
    let budgetExpenses = 0;
    
    transactions.forEach(txn => {
      if (txn.type === 'income') {
        income += txn.amount;
      } else if (txn.type === 'expense') {
        expenses += txn.amount;
        if (txn.affectsBudget) {
          budgetExpenses += txn.amount;
        }
      }
    });
    
    setTotalIncome(income);
    setTotalExpenses(expenses);
    setBudgetAffectingExpenses(budgetExpenses);
    
    // Calculate category summaries
    const summaries = calculateCategorySummaries(transactions);
    setCategorySummaries(summaries);
    
  }, [transactions]);
  
  // ============================================================================
  // CALCULATE NEW BUDGET
  // ============================================================================
  
  useEffect(() => {
    if (currentBudget !== null && userChoice === 'yes') {
      // Formula: newBudget = currentBudget + totalIncome - budgetAffectingExpenses
      const calculated = currentBudget + totalIncome - budgetAffectingExpenses;
      setNewBudget(calculated);
    }
  }, [currentBudget, userChoice, totalIncome, budgetAffectingExpenses]);
  
  // ============================================================================
  // HANDLE USER CHOICE: YES (Add to Budget)
  // ============================================================================
  
  const handleYes = () => {
    setUserChoice('yes');
    setShowCalculations(true);
    
    Animated.timing(calculationHeight, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };
  
  // ============================================================================
  // HANDLE USER CHOICE: NO (Don't Add to Budget)
  // ============================================================================
  
  const handleNo = () => {
    setUserChoice('no');
    
    Alert.alert(
      'Import Complete',
      `${transactions.length} transactions imported without budget update.`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };
  
  // ============================================================================
  // HANDLE FINAL CONFIRMATION
  // ============================================================================
  
  const handleConfirm = async () => {
    if (!newBudget) return;
    
    try {
      setSaving(true);
      
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      // Update budget in Firebase
      const userDocRef = doc(db, 'userOnboardingData', user.uid);
      await setDoc(userDocRef, {
        monthlyBudget: newBudget,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      setSaving(false);
      
      Alert.alert(
        'Success',
        `Budget updated from ₹${currentBudget.toLocaleString('en-IN')} to ₹${newBudget.toLocaleString('en-IN')}`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      setSaving(false);
      console.error('Budget update error:', error);
      Alert.alert('Error', 'Failed to update budget. Please try again.');
    }
  };
  
  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Import Summary</Text>
          <Text style={styles.headerSubtitle}>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        
        {/* Category Summary Circles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown by Category</Text>
          
          <View style={styles.circleGrid}>
            {categorySummaries.map((summary, idx) => (
                <View key={idx} style={styles.circleCard}>
                  <View style={[
                    styles.circle,
                    summary.type === 'income' && styles.circleIncome,
                    summary.type === 'expense' && styles.circleExpense,
                    !summary.affectsBudget && styles.circleTransfer,
                  ]}>
                    <Text style={styles.circleCategoryName}>
                      {summary.category.toUpperCase()}
                    </Text>
                    <Text style={[
                      styles.circleAmount,
                      summary.type === 'income' && styles.circleAmountIncome,
                    ]}>
                      ₹{summary.total.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.circleCount}>
                      {summary.count} txn{summary.count !== 1 ? 's' : ''}
                    </Text>
                    {!summary.affectsBudget && (
                      <Text style={styles.noBudgetImpact}>No budget impact</Text>
                    )}
                  </View>
                </View>
              ))}
          </View>
        </View>
        
        {/* Budget Impact Question */}
        {userChoice === null && (
          <View style={styles.section}>
            <View style={styles.questionCard}>
              <Text style={styles.questionTitle}>
                💰 Update Your Budget?
              </Text>
              <Text style={styles.questionSubtitle}>
                Should we add these transactions to your monthly budget calculation?
              </Text>
              
              <View style={styles.impactSummary}>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Current Budget:</Text>
                  <Text style={styles.impactValueNeutral}>
                    ₹{currentBudget.toLocaleString('en-IN')}
                  </Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Income Detected:</Text>
                  <Text style={styles.impactValueIncome}>
                    +₹{totalIncome.toLocaleString('en-IN')}
                  </Text>
                </View>
                
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Total Expenses:</Text>
                  <Text style={styles.impactValueExpense}>
                    -₹{totalExpenses.toLocaleString('en-IN')}
                  </Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabelBold}>Budget Impact:</Text>
                  <Text style={styles.impactValueExpenseBold}>
                    -₹{budgetAffectingExpenses.toLocaleString('en-IN')}
                  </Text>
                </View>
                
                <Text style={styles.budgetNote}>
                  (Excludes Income & Transfers)
                </Text>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.choiceButton, styles.choiceButtonYes]}
                  onPress={handleYes}
                >
                  <Text style={styles.choiceButtonText}>✅ Yes, update budget</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.choiceButton, styles.choiceButtonNo]}
                  onPress={handleNo}
                >
                  <Text style={styles.choiceButtonText}>❌ No, just import</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        {/* Calculation Reveal */}
        {showCalculations && userChoice === 'yes' && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: calculationHeight,
                transform: [{
                  translateY: calculationHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.calculationCard}>
              <Text style={styles.calculationTitle}>📊 Budget Calculation</Text>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Original Budget:</Text>
                <Text style={styles.calculationValue}>
                  ₹{currentBudget?.toLocaleString('en-IN') || '0'}
                </Text>
              </View>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>+ Income:</Text>
                <Text style={styles.calculationValueIncome}>
                  +₹{totalIncome.toLocaleString('en-IN')}
                </Text>
              </View>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>- Expenses:</Text>
                <Text style={styles.calculationValueExpense}>
                  -₹{budgetAffectingExpenses.toLocaleString('en-IN')}
                </Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabelFinal}>New Budget:</Text>
                <Text style={styles.calculationValueFinal}>
                  ₹{newBudget?.toLocaleString('en-IN') || '0'}
                </Text>
              </View>
              
              <Text style={styles.formulaText}>
                {currentBudget} + {totalIncome} - {budgetAffectingExpenses} = {newBudget}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Final Confirmation Button */}
      {userChoice === 'yes' && showCalculations && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>
                ✨ Confirm & Update Budget
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
  },
  
  // Header
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '400',
  },
  
  // Sections
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  
  // Category Circles
  circleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  circleCard: {
    width: '47%',
  },
  circle: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2C2C2E',
    minHeight: 130,
    justifyContent: 'center',
  },
  circleIncome: {
    borderColor: '#30D158',
    backgroundColor: '#0D2818',
  },
  circleExpense: {
    borderColor: '#FF3B30',
    backgroundColor: '#2A1414',
  },
  circleTransfer: {
    borderColor: '#FF9500',
    backgroundColor: '#1F1709',
  },
  circleCategoryName: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  circleAmount: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  circleAmountIncome: {
    color: '#30D158',
  },
  circleCount: {
    color: '#636366',
    fontSize: 13,
    marginTop: 4,
  },
  noBudgetImpact: {
    color: '#FF9500',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
  },
  
  // Question Card
  questionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  questionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  questionSubtitle: {
    color: '#8E8E93',
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 21,
  },
  impactSummary: {
    marginBottom: 25,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  impactLabel: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '400',
  },
  impactLabelBold: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  impactValueNeutral: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  impactValueIncome: {
    color: '#30D158',
    fontSize: 17,
    fontWeight: '700',
  },
  impactValueExpense: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '700',
  },
  impactValueExpenseBold: {
    color: '#FF3B30',
    fontSize: 19,
    fontWeight: '700',
  },
  budgetNote: {
    color: '#636366',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 16,
  },
  buttonContainer: {
    gap: 14,
  },
  choiceButton: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  choiceButtonYes: {
    backgroundColor: '#30D158',
  },
  choiceButtonNo: {
    backgroundColor: '#FF3B30',
  },
  choiceButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  
  // Calculation Card
  calculationCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 25,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  calculationTitle: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calculationLabel: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '400',
  },
  calculationValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  calculationValueIncome: {
    color: '#30D158',
    fontSize: 17,
    fontWeight: '700',
  },
  calculationValueExpense: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '700',
  },
  calculationLabelFinal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  calculationValueFinal: {
    color: '#007AFF',
    fontSize: 24,
    fontWeight: '700',
  },
  formulaText: {
    color: '#636366',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
    backgroundColor: '#0A0A0A',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});