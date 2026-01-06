// app/parsing/sms.tsx - COMPLETE REBUILD matching CSV architecture
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, db } from '../../src2/firebase/config';

// ============================================================================
// TYPES
// ============================================================================

interface ParsedTransaction {
  amount: number;
  type: 'expense' | 'income';
  date: string; // ISO string
  month: string; // YYYY-MM
  year: number;
  merchantName: string;
  category: string;
  affectsBudget: boolean;
  confidence: number;
  rawText: string;
  source: 'sms';
}

interface MonthGroup {
  month: string;
  monthLabel: string;
  transactions: ParsedTransaction[];
  totalExpenses: number;
  totalIncome: number;
  budgetImpactExpenses: number;
  categories: Record<string, number>;
}

// ============================================================================
// SMS PARSING ENGINE - ENHANCED FOR FEDERAL BANK & UPI
// ============================================================================

function parseSMS(smsText: string): ParsedTransaction[] {
  const lines = smsText.split('\n').filter(line => line.trim());
  const transactions: ParsedTransaction[] = [];
  
  for (const line of lines) {
    const transaction = parseSingleSMS(line);
    if (transaction) {
      transactions.push(transaction);
    }
  }
  
  return transactions;
}

function parseSingleSMS(text: string): ParsedTransaction | null {
  try {
    // ========================================================================
    // AMOUNT EXTRACTION - Support multiple formats
    // ========================================================================
    // Patterns:
    // - Rs 372.00
    // - Rs. 372.00
    // - INR 372.00
    // - ₹372.00
    // - Rs372.00 (no space)
    const amountMatch = text.match(/(?:Rs\.?\s*|INR\s*|₹\s*)([\d,]+\.?\d*)/i);
    if (!amountMatch) return null;
    
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(amount) || amount === 0) return null;
    
    // ========================================================================
    // TYPE DETECTION - Enhanced for UPI
    // ========================================================================
    const lowerText = text.toLowerCase();
    
    // UPI sent = expense
    const isUpiSent = /sent via upi|upi.*sent|paid via upi/i.test(text);
    
    // Standard credit keywords
    const isCredit = /credited|credit|received|deposited|refund|cashback/i.test(text);
    
    // Standard debit keywords
    const isDebit = /debited|debit|paid|withdrawn|spent|purchase/i.test(text);
    
    // Determine type
    let type: 'expense' | 'income';
    if (isUpiSent) {
      type = 'expense';
    } else if (isCredit) {
      type = 'income';
    } else if (isDebit) {
      type = 'expense';
    } else {
      // Default to expense if unclear
      type = 'expense';
    }
    
    // ========================================================================
    // MERCHANT EXTRACTION - Multiple patterns
    // ========================================================================
    let merchantName = 'Unknown';
    
    // Pattern 1: "to MERCHANT" (Federal Bank UPI format)
    // Example: "to SWIGGY.Ref" or "to Ravi Medical -Federal"
    const toPattern = /to\s+([A-Za-z0-9\s&.\-]+?)(?:\.Ref|\s+-Federal|\s+on|\s+at|$)/i;
    const toMatch = text.match(toPattern);
    if (toMatch) {
      merchantName = toMatch[1].trim();
    } else {
      // Pattern 2: "at MERCHANT"
      const atPattern = /(?:at|from)\s+([A-Za-z0-9\s&.\-]+?)(?:\s+on|\s+\d|$)/i;
      const atMatch = text.match(atPattern);
      if (atMatch) {
        merchantName = atMatch[1].trim();
      }
    }
    
    // Clean merchant name
    merchantName = merchantName
      .replace(/\s+/g, ' ')
      .substring(0, 100)
      .trim();
    
    if (merchantName === '' || merchantName.length < 2) {
      merchantName = 'Unknown';
    }
    
    // ========================================================================
    // DATE EXTRACTION
    // ========================================================================
    // Pattern: DD-MM-YYYY or DD/MM/YYYY
    const dateMatch = text.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    let date = new Date();
    
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1; // 0-indexed
      const year = parseInt(dateMatch[3]);
      date = new Date(year, month, day);
      
      // Validate date
      if (isNaN(date.getTime())) {
        date = new Date(); // fallback to today
      }
    }
    // If no date found, use current date
    
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const year = date.getFullYear();
    
    // ========================================================================
    // CATEGORY DETECTION & BUDGET IMPACT
    // ========================================================================
    const { category, confidence } = detectCategory(merchantName, text);
    const affectsBudget = shouldAffectBudget(category, type);
    
    return {
      amount,
      type,
      date: date.toISOString(),
      month,
      year,
      merchantName,
      category,
      affectsBudget,
      confidence,
      rawText: text.substring(0, 500),
      source: 'sms',
    };
  } catch (error) {
    console.error('Error parsing SMS:', error);
    return null;
  }
}

// ============================================================================
// CATEGORY DETECTION - Same as CSV
// ============================================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['zomato', 'swiggy', 'restaurant', 'cafe', 'food', 'pizza', 'burger', 'mcdonald', 'kfc', 'domino'],
  Transport: ['uber', 'ola', 'rapido', 'cab', 'taxi', 'metro', 'fuel', 'petrol', 'diesel', 'hp petrol', 'indian oil'],
  Groceries: ['dmart', 'bigbazaar', 'reliance fresh', 'grocery', 'supermarket', 'more', 'spencer'],
  Rent: ['rent', 'housing', 'society', 'maintenance', 'apartment'],
  Utilities: ['electricity', 'water', 'gas', 'broadband', 'mobile', 'recharge', 'jio', 'airtel', 'vi'],
  Subscriptions: ['netflix', 'prime', 'spotify', 'youtube', 'subscription', 'amazon prime'],
  Healthcare: ['hospital', 'clinic', 'pharmacy', 'medical', 'apollo', 'fortis', 'max'],
  Education: ['school', 'college', 'tuition', 'course', 'udemy', 'coursera'],
  Travel: ['flight', 'hotel', 'booking', 'makemytrip', 'goibibo', 'yatra'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'shopping', 'ajio', 'meesho'],
  Transfers: ['transfer', 'upi', 'gpay', 'phonepe', 'paytm', 'neft', 'imps', 'rtgs'],
  Income: ['salary', 'credited', 'refund', 'cashback', 'interest'],
};

function detectCategory(merchant: string, text: string): { category: string; confidence: number } {
  const combined = `${merchant} ${text}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        return { category, confidence: 0.8 };
      }
    }
  }
  
  return { category: 'Other', confidence: 0.5 };
}

function shouldAffectBudget(category: string, type: 'expense' | 'income'): boolean {
  // Income never affects budget
  if (type === 'income') return false;
  
  // Transfers don't affect budget (money moving between accounts)
  if (category === 'Transfers' || category === 'Income') return false;
  
  // All other expenses affect budget
  return true;
}

// ============================================================================
// GROUP BY MONTH
// ============================================================================

function groupByMonth(transactions: ParsedTransaction[]): MonthGroup[] {
  const monthMap: Record<string, ParsedTransaction[]> = {};
  
  transactions.forEach(txn => {
    if (!monthMap[txn.month]) {
      monthMap[txn.month] = [];
    }
    monthMap[txn.month].push(txn);
  });
  
  const groups: MonthGroup[] = [];
  
  for (const [month, txns] of Object.entries(monthMap)) {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let budgetImpactExpenses = 0;
    const categories: Record<string, number> = {};
    
    txns.forEach(txn => {
      if (txn.type === 'income') {
        totalIncome += txn.amount;
      } else {
        totalExpenses += txn.amount;
        if (txn.affectsBudget) {
          budgetImpactExpenses += txn.amount;
          categories[txn.category] = (categories[txn.category] || 0) + txn.amount;
        }
      }
    });
    
    groups.push({
      month,
      monthLabel,
      transactions: txns,
      totalIncome,
      totalExpenses,
      budgetImpactExpenses,
      categories,
    });
  }
  
  return groups.sort((a, b) => b.month.localeCompare(a.month));
}

// ============================================================================
// FIRESTORE WRITES - MATCHES CSV EXACTLY + MIRRORS TO TRANSACTIONS
// ============================================================================

async function saveToFirestore(
  parsedTransactions: ParsedTransaction[],
  monthGroups: MonthGroup[]
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  const uid = user.uid;
  
  // Get user's monthly budget
  const userRef = doc(db, 'userOnboardingData', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    throw new Error('User onboarding data not found');
  }
  
  const userData = userSnap.data();
  const monthlyBudget = userData.monthlyBudget || 0;
  
  // ========================================================================
  // STEP 1: Update userBudgets (CRITICAL - drives dashboard/analytics)
  // ========================================================================
  
  for (const group of monthGroups) {
    await runTransaction(db, async (transaction) => {
      const monthRef = doc(db, 'userBudgets', uid, 'months', group.month);
      const monthSnap = await transaction.get(monthRef);
      
      let startingBudget = monthlyBudget;
      let existingBudgetImpact = 0;
      let existingCategories: Record<string, number> = {};
      let existingTotalIncome = 0;
      
      if (monthSnap.exists()) {
        const existing = monthSnap.data();
        startingBudget = existing.startingBudget || monthlyBudget;
        existingBudgetImpact = existing.budgetImpactExpenses || 0;
        existingCategories = existing.categories || {};
        existingTotalIncome = existing.totalIncome || 0;
      }
      
      // Merge categories (add new expenses to existing)
      const updatedCategories = { ...existingCategories };
      for (const [cat, amount] of Object.entries(group.categories)) {
        updatedCategories[cat] = (updatedCategories[cat] || 0) + amount;
      }
      
      // Calculate new totals
      const newBudgetImpactExpenses = existingBudgetImpact + group.budgetImpactExpenses;
      const newTotalIncome = existingTotalIncome + group.totalIncome;
      const totalExpenses = Object.values(updatedCategories).reduce((sum, val) => sum + val, 0);
      const newBudget = startingBudget - totalExpenses;
      const savingsReduction = newBudget < 0 ? Math.abs(newBudget) : 0;
      
      // Write to userBudgets
      transaction.set(monthRef, {
        month: group.month,
        startingBudget,
        totalExpenses,
        budgetImpactExpenses: newBudgetImpactExpenses,
        newBudget,
        savingsReduction,
        categories: updatedCategories,
        totalIncome: newTotalIncome,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    
    console.log(`✅ Updated userBudgets for ${group.month}`);
  }
  
  // ========================================================================
  // STEP 2: Mirror to transactions collection (for display only)
  // ========================================================================
  
  const transactionsRef = collection(db, 'transactions', uid, 'items');
  const batchId = `sms_${Date.now()}`;
  
  for (const txn of parsedTransactions) {
    await addDoc(transactionsRef, {
      uid,
      amount: txn.amount,
      merchantName: txn.merchantName,
      category: txn.category,
      date: txn.date,
      type: txn.type,
      affectsBudget: txn.affectsBudget,
      source: 'sms',
      month: txn.month,
      year: txn.year,
      confidence: txn.confidence,
      rawText: txn.rawText,
      importBatchId: batchId,
      appliedAt: serverTimestamp(),
      appliedToBudget: true,
      appliedToBank: false,
    });
  }
  
  console.log(`✅ Mirrored ${parsedTransactions.length} transactions to transactions collection`);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SMSParser() {
  const { theme, isDark } = useTheme();
  const [smsText, setSmsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);

  // ========================================================================
  // PREVIEW
  // ========================================================================

  const handlePreview = () => {
    if (!smsText.trim()) {
      Alert.alert('Error', 'Please paste some SMS text first');
      return;
    }

    const parsed = parseSMS(smsText);

    if (parsed.length === 0) {
      Alert.alert(
        'No Transactions Found', 
        'Could not parse any transactions from the SMS text.\n\nSupported formats:\n• Rs 372.00 sent via UPI to SWIGGY\n• Rs. 500 debited from account\n• INR 1000 credited to account'
      );
      return;
    }

    const groups = groupByMonth(parsed);
    setParsedTransactions(parsed);
    setMonthGroups(groups);
    setShowPreview(true);
  };

  // ========================================================================
  // SAVE - Matches CSV flow exactly
  // ========================================================================

  const handleSave = async () => {
    try {
      setLoading(true);

      await saveToFirestore(parsedTransactions, monthGroups);

      Alert.alert(
        'Success! 🎉',
        `${parsedTransactions.length} transaction${parsedTransactions.length > 1 ? 's' : ''} imported successfully!\n\nYour budgets have been updated.`,
        [
          {
            text: 'View Dashboard',
            onPress: () => router.push('/(tabs)/dashboard')
          },
          {
            text: 'Add More',
            style: 'cancel',
            onPress: () => {
              setSmsText('');
              setParsedTransactions([]);
              setMonthGroups([]);
              setShowPreview(false);
            }
          }
        ]
      );

      setLoading(false);
    } catch (error: any) {
      console.error('Error saving:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to save transactions. Please try again.'
      );
      setLoading(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={theme.statusBarStyle} />

      <LinearGradient
        colors={theme.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={theme.backgroundLocations}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={[styles.backText, { color: theme.accent[0] }]}>← Back</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.primaryText }]}>Import from SMS</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Paste your bank SMS messages below
            </Text>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Instructions */}
            <LinearGradient
              colors={isDark
                ? ['rgba(232, 180, 248, 0.15)', 'rgba(180, 164, 248, 0.08)']
                : ['rgba(212, 165, 165, 0.2)', 'rgba(196, 154, 154, 0.1)']
              }
              style={styles.instructionsBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.instructionsTitle, { color: theme.primaryText }]}>
                📱 How to import:
              </Text>
              <Text style={[styles.instructionsText, { color: theme.secondaryText }]}>
                1. Open your SMS app{'\n'}
                2. Find bank transaction messages{'\n'}
                3. Copy and paste them below{'\n'}
                4. Tap "Preview Transactions"{'\n'}
                5. Review and confirm
              </Text>
              <View style={[styles.formatBox, { 
                backgroundColor: isDark ? 'rgba(232, 180, 248, 0.1)' : 'rgba(212, 165, 165, 0.15)' 
              }]}>
                <Text style={[styles.formatTitle, { color: theme.primaryText }]}>
                  ✓ Supported formats:
                </Text>
                <Text style={[styles.formatText, { color: theme.secondaryText }]}>
                  • Rs 372.00 sent via UPI to SWIGGY{'\n'}
                  • Rs. 500 debited from account{'\n'}
                  • INR 1000 credited to account
                </Text>
              </View>
            </LinearGradient>

            {/* Input */}
            <View style={[styles.inputContainer, {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderColor: theme.cardBorder
            }]}>
              <TextInput
                style={[styles.textInput, { color: theme.primaryText }]}
                placeholder="Paste SMS messages here..."
                placeholderTextColor={theme.secondaryText}
                multiline
                value={smsText}
                onChangeText={(text) => {
                  setSmsText(text);
                  setShowPreview(false);
                }}
                textAlignVertical="top"
              />
            </View>

            {/* Preview Button */}
            <TouchableOpacity
              onPress={handlePreview}
              style={[styles.previewButton, {
                backgroundColor: theme.accent[0],
                opacity: !smsText.trim() ? 0.5 : 1
              }]}
              disabled={!smsText.trim()}
            >
              <Text style={styles.previewButtonText}>🔍 Preview Transactions</Text>
            </TouchableOpacity>

            {/* Preview */}
            {showPreview && monthGroups.length > 0 && (
              <View style={styles.previewContainer}>
                <LinearGradient
                  colors={isDark
                    ? ['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.08)']
                    : ['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.1)']
                  }
                  style={styles.successBanner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.successIcon}>✅</Text>
                  <View style={styles.successTextContainer}>
                    <Text style={[styles.successTitle, { color: theme.primaryText }]}>
                      Found {parsedTransactions.length} transaction{parsedTransactions.length > 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.successSubtitle, { color: theme.secondaryText }]}>
                      Across {monthGroups.length} month{monthGroups.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </LinearGradient>

                {monthGroups.map((group, idx) => (
                  <View key={idx} style={styles.monthGroup}>
                    <View style={[styles.monthHeader, {
                      backgroundColor: isDark ? 'rgba(232, 180, 248, 0.15)' : 'rgba(212, 165, 165, 0.2)'
                    }]}>
                      <Text style={[styles.monthLabel, { color: theme.primaryText }]}>
                        📅 {group.monthLabel}
                      </Text>
                      <Text style={[styles.monthCount, { color: theme.secondaryText }]}>
                        {group.transactions.length} transaction{group.transactions.length > 1 ? 's' : ''}
                      </Text>
                    </View>

                    {group.transactions.map((txn, txnIdx) => (
                      <LinearGradient
                        key={txnIdx}
                        colors={isDark
                          ? ['rgba(232, 180, 248, 0.12)', 'rgba(180, 164, 248, 0.06)']
                          : ['rgba(212, 165, 165, 0.18)', 'rgba(196, 154, 154, 0.09)']
                        }
                        style={styles.previewCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.previewHeader}>
                          <View style={styles.previewLeft}>
                            <Text style={[styles.previewMerchant, { color: theme.primaryText }]}>
                              {txn.merchantName}
                            </Text>
                            <Text style={[styles.previewCategory, { color: theme.secondaryText }]}>
                              {txn.category} • {new Date(txn.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </Text>
                          </View>
                          
                          <Text style={[styles.previewAmount, {
                            color: txn.type === 'income' ? '#4CAF50' : '#F44336'
                          }]}>
                            {txn.type === 'income' ? '+' : '-'}₹{Math.floor(txn.amount)}
                          </Text>
                        </View>

                        <View style={styles.previewBadges}>
                          {txn.affectsBudget && (
                            <View style={[styles.badge, {
                              backgroundColor: isDark ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.2)'
                            }]}>
                              <Text style={[styles.badgeText, { color: '#F44336' }]}>
                                💰 Affects Budget
                              </Text>
                            </View>
                          )}
                          <View style={[styles.badge, {
                            backgroundColor: isDark ? 'rgba(232, 180, 248, 0.15)' : 'rgba(212, 165, 165, 0.2)'
                          }]}>
                            <Text style={[styles.badgeText, { color: theme.secondaryText }]}>
                              {txn.type === 'income' ? '📥 Income' : '📤 Expense'}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    ))}

                    {/* Month Summary */}
                    <View style={[styles.monthSummary, {
                      backgroundColor: isDark ? 'rgba(232, 180, 248, 0.1)' : 'rgba(212, 165, 165, 0.15)'
                    }]}>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                          Total Expenses:
                        </Text>
                        <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                          ₹{group.totalExpenses.toFixed(0)}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                          Budget Impact:
                        </Text>
                        <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
                          ₹{group.budgetImpactExpenses.toFixed(0)}
                        </Text>
                      </View>
                      {group.totalIncome > 0 && (
                        <View style={styles.summaryRow}>
                          <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                            Total Income:
                          </Text>
                          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                            ₹{group.totalIncome.toFixed(0)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveButton, {
                    backgroundColor: theme.accent[0],
                    opacity: loading ? 0.7 : 1
                  }]}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      💾 Confirm & Import
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  instructionsBox: { 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  instructionsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  instructionsText: { fontSize: 13, fontWeight: '500', lineHeight: 22, marginBottom: 12 },
  formatBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputContainer: { 
    borderRadius: 16, 
    borderWidth: 2, 
    padding: 16, 
    marginBottom: 16, 
    minHeight: 200 
  },
  textInput: { 
    fontSize: 14, 
    fontWeight: '500', 
    lineHeight: 20, 
    flex: 1 
  },
  previewButton: { 
    borderRadius: 14, 
    padding: 16, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  previewButtonText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#fff' 
  },
  previewContainer: { marginBottom: 20 },
  successBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  successIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  successSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthGroup: { marginBottom: 24 },
  monthHeader: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthLabel: { 
    fontSize: 16, 
    fontWeight: '700' 
  },
  monthCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewCard: { 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  previewHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12 
  },
  previewLeft: {
    flex: 1,
    marginRight: 12,
  },
  previewMerchant: { 
    fontSize: 16, 
    fontWeight: '700',
    marginBottom: 4,
  },
  previewAmount: { 
    fontSize: 20, 
    fontWeight: '800' 
  },
  previewCategory: { 
    fontSize: 12, 
    fontWeight: '600' 
  },
  previewBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 10 
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '700' 
  },
  monthSummary: { 
    padding: 14, 
    borderRadius: 12, 
    marginTop: 8 
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  saveButton: { 
    borderRadius: 14, 
    padding: 18, 
    alignItems: 'center', 
    marginTop: 8 
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '800' 
  },
});