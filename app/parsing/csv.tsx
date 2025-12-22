import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
// TYPES & INTERFACES
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
  confidence: 'high' | 'low';
  affectsBudget: boolean;
}

interface CategorySummary {
  category: string;
  count: number;
  total: number;
  type: 'expense' | 'income' | 'mixed';
  affectsBudget: boolean;
}

interface MonthGroup {
  month: string;
  transactions: ParsedTransaction[];
}

// ============================================================================
// AVAILABLE CATEGORIES (for dropdown selection)
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

// ============================================================================
// CATEGORY DETECTION ENGINE
// ============================================================================

const CATEGORY_RULES = {
  income: [
    'salary', 'credited', 'credit', 'income', 'refund', 'cashback',
    'reimbursement', 'incentive', 'bonus', 'stipend', 'interest'
  ],
  transfers: [
    'transfer', 'sent', 'paid to', 'upi', 'imps', 'neft', 'rtgs',
    'gpay', 'phonepe', 'paytm', 'p2p', 'peer', 'friend'
  ],
  subscriptions: [
    'netflix', 'prime', 'amazon prime', 'hotstar', 'disney', 'spotify',
    'youtube', 'google', 'apple', 'icloud', 'playstore', 'subscription',
    'renewal', 'monthly', 'yearly'
  ],
  rent: [
    'rent', 'housing', 'society', 'maintenance', 'apartment', 'flat',
    'pg', 'hostel'
  ],
  utilities: [
    'electricity', 'water', 'gas', 'broadband', 'internet', 'wifi',
    'recharge', 'mobile', 'bill', 'postpaid', 'prepaid'
  ],
  healthcare: [
    'hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'chemist',
    'medicine', 'lab', 'diagnostic', 'dental', 'health'
  ],
  education: [
    'school', 'college', 'university', 'tuition', 'coaching', 'course',
    'training', 'exam', 'udemy', 'coursera', 'byjus', 'unacademy'
  ],
  travel: [
    'flight', 'airline', 'airways', 'hotel', 'resort', 'stay', 'booking',
    'makemytrip', 'yatra', 'goibibo', 'oyo', 'airbnb', 'expedia', 'trivago'
  ],
  transport: [
    'uber', 'ola', 'rapido', 'cab', 'taxi', 'auto', 'metro', 'bus',
    'train', 'irctc', 'fuel', 'petrol', 'diesel', 'gas', 'parking', 'toll'
  ],
  groceries: [
    'grocery', 'supermarket', 'supermart', 'mart', 'store', 'kirana',
    'ration', 'provision', 'reliance', 'dmart', 'bigbazaar', 'more', 'spar'
  ],
  food: [
    'restaurant', 'restro', 'cafe', 'cafeteria', 'dhaba', 'dhabha',
    'food', 'eatery', 'bistro', 'kitchen', 'bar', 'pub', 'bakery',
    'pizza', 'burger', 'sandwich', 'biryani', 'dosa', 'idli', 'momo',
    'boba', 'bubble', 'tea', 'coffee', 'swiggy', 'zomato', 'ubereats',
    'foodpanda', 'dineout'
  ],
  shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'snapdeal',
    'shopping', 'fashion', 'clothes', 'footwear', 'sneakers', 'shoes',
    'apparel', 'lifestyle'
  ],
  gifts: [
    'gift', 'present', 'donation', 'charity', 'contribution'
  ],
};

function detectCategory(merchantName: string): { category: string; confidence: 'high' | 'low' } {
  const lowerMerchant = merchantName.toLowerCase().trim();
  const categoryKeys = Object.keys(CATEGORY_RULES) as Array<keyof typeof CATEGORY_RULES>;
  
  for (const categoryKey of categoryKeys) {
    const keywords = CATEGORY_RULES[categoryKey];
    for (const keyword of keywords) {
      if (lowerMerchant.includes(keyword)) {
        const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        return { category: categoryName, confidence: 'high' };
      }
    }
  }
  
  return { category: 'Uncategorized', confidence: 'low' };
}

function shouldAffectBudget(category: string, type: 'expense' | 'income'): boolean {
  if (type === 'income') return false;
  if (category === 'Transfers') return false;
  return true;
}

// ============================================================================
// CSV PARSING LOGIC
// ============================================================================

function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const transactions: ParsedTransaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const columns = parseCSVLine(line);
    
    if (columns.length < 3) continue;
    
    const transaction = extractTransactionFromColumns(columns);
    if (transaction) {
      transactions.push(transaction);
    }
  }
  
  return transactions;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function extractTransactionFromColumns(columns: string[]): ParsedTransaction | null {
  try {
    let dateStr = '';
    let merchantName = '';
    let debit = 0;
    let credit = 0;
    
    if (isValidDate(columns[0])) {
      dateStr = columns[0];
      merchantName = columns[1] || 'Unknown';
      
      for (let i = 2; i < columns.length; i++) {
        const val = parseAmount(columns[i]);
        if (val > 0) {
          if (i === 2 || columns[i].includes('-')) {
            debit = val;
          } else {
            credit = val;
          }
        }
      }
    }
    
    if (!dateStr && columns.length > 1 && isValidDate(columns[1])) {
      dateStr = columns[1];
      merchantName = columns[0] || 'Unknown';
      
      for (let i = 2; i < columns.length; i++) {
        const val = parseAmount(columns[i]);
        if (val > 0) {
          if (i === 2) debit = val;
          else credit = val;
        }
      }
    }
    
    if (!dateStr || (debit === 0 && credit === 0)) {
      return null;
    }
    
    const parsedDate = parseDate(dateStr);
    if (!parsedDate) return null;
    
    const isIncome = credit > 0;
    const amount = isIncome ? credit : debit;
    
    const { category, confidence } = detectCategory(merchantName);
    
    let type: 'expense' | 'income' = isIncome ? 'income' : 'expense';
    if (category === 'Income') {
      type = 'income';
    }
    
    const affectsBudget = shouldAffectBudget(category, type);
    
    const date = parsedDate.toISOString();
    const month = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
    const year = parsedDate.getFullYear();
    
    return {
      amount,
      type,
      date,
      month,
      year,
      merchantName: merchantName.substring(0, 100),
      category,
      source: 'csv',
      confidence,
      affectsBudget,
    };
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return null;
  }
}

function isValidDate(str: string): boolean {
  if (!str) return false;
  
  const datePatterns = [
    /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/,
    /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/,
    /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/,
  ];
  
  return datePatterns.some(pattern => pattern.test(str.trim()));
}

function parseDate(str: string): Date | null {
  try {
    const cleaned = str.trim();
    
    let match = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = parseInt(match[3]);
      return new Date(year, month, day);
    }
    
    match = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      return new Date(year, month, day);
    }
    
    const monthMap: { [key: string]: number } = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    
    match = cleaned.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/i);
    if (match) {
      const day = parseInt(match[1]);
      const monthStr = match[2].toLowerCase();
      const year = parseInt(match[3]);
      const month = monthMap[monthStr];
      
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
    
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch {
    return null;
  }
}

function parseAmount(str: string): number {
  if (!str) return 0;
  
  const cleaned = str.replace(/[₹$,\s]/g, '').trim();
  const isNegative = cleaned.startsWith('-') || cleaned.startsWith('(');
  const numberStr = cleaned.replace(/[()-]/g, '');
  
  const amount = parseFloat(numberStr);
  return isNaN(amount) ? 0 : Math.abs(amount);
}

function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `${timestamp}_${randomStr}`;
}

// ============================================================================
// FIRESTORE OPERATIONS
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
    } catch (error) {
      console.error('Failed to save transaction:', error);
      failed++;
    }
  }
  
  return { success, failed };
}

// ============================================================================
// CALCULATE CATEGORY SUMMARIES (for circle cards)
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

export default function CSVImportScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [otherMonthsGroups, setOtherMonthsGroups] = useState<MonthGroup[]>([]);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // ============================================================================
  // RECALCULATE SUMMARIES whenever transactions change
  // ============================================================================
  
  useEffect(() => {
    if (transactions.length > 0) {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const currentMonthTxns = transactions.filter(t => t.month === currentMonth);
      const summaries = calculateCategorySummaries(currentMonthTxns);
      setCategorySummaries(summaries);
    }
  }, [transactions]);
  
  // ============================================================================
  // FILE IMPORT HANDLER
  // ============================================================================
  
  const handleImport = async () => {
    try {
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setLoading(false);
        return;
      }
      
      const file = result.assets[0];
      if (!file) {
        setLoading(false);
        return;
      }
      
      if (file.mimeType?.includes('pdf') || file.name.endsWith('.pdf')) {
        Alert.alert(
          'PDF Support',
          'PDF import currently works on web only. Please upload a CSV file on mobile, or use the web version for PDF imports.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      setParsing(true);
      
      const fileUri = file.uri;
      const response = await fetch(fileUri);
      const content = await response.text();
      
      let parsedTransactions: ParsedTransaction[] = [];
      parsedTransactions = parseCSV(content);
      
      if (parsedTransactions.length === 0) {
        Alert.alert('No Transactions', 'Could not find any valid transactions in the file.');
        setParsing(false);
        setLoading(false);
        return;
      }
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      const otherMonthTxns = parsedTransactions.filter(t => t.month !== currentMonth);
      
      const monthGroups: { [key: string]: ParsedTransaction[] } = {};
      otherMonthTxns.forEach(txn => {
        if (!monthGroups[txn.month]) {
          monthGroups[txn.month] = [];
        }
        monthGroups[txn.month].push(txn);
      });
      
      const otherGroups: MonthGroup[] = Object.keys(monthGroups)
        .sort()
        .reverse()
        .map(month => ({
          month,
          transactions: monthGroups[month],
        }));
      
      setTransactions(parsedTransactions);
      setOtherMonthsGroups(otherGroups);
      
      setParsing(false);
      setLoading(false);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import file. Please try again.');
      setParsing(false);
      setLoading(false);
    }
  };
  
  // ============================================================================
  // CATEGORY CHANGE HANDLER
  // ============================================================================
  
  const handleCategorySelect = (index: number, newCategory: string) => {
    const updated = [...transactions];
    updated[index].category = newCategory;
    updated[index].confidence = 'high';
    updated[index].affectsBudget = shouldAffectBudget(newCategory, updated[index].type);
    
    setTransactions(updated);
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
  
  // ============================================================================
  // SAVE HANDLER - FIXED VERSION
  // ============================================================================
  
  const handleSave = async () => {
    if (hasUncategorized) {
      Alert.alert(
        'Categorization Required',
        `${uncategorizedCount} transaction${uncategorizedCount !== 1 ? 's' : ''} need${uncategorizedCount === 1 ? 's' : ''} categorization before import. Please review and assign categories.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      // Save transactions to Firebase FIRST
      const result = await saveTransactionsToFirestore(transactions);
      
      // Stop loading BEFORE navigation
      setLoading(false);
      
      if (result.failed > 0) {
        Alert.alert(
          'Partial Import',
          `${result.success} succeeded, ${result.failed} failed. Review and try again?`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Navigate to budget decision screen with success flag
      router.push({
        pathname: '/parsing/csv-imports',
        params: {
          transactions: JSON.stringify(transactions),
          importSuccess: 'true',
          transactionCount: transactions.length.toString(),
        },
      });
      
    } catch (error) {
      setLoading(false);
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save transactions. Please try again.');
    }
  };
  
  // ============================================================================
  // RENDER: Empty State
  // ============================================================================
  
  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Import Bank Statement</Text>
        </View>
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Import CSV or PDF</Text>
          <Text style={styles.emptySubtitle}>
            Upload your bank statement to automatically import transactions
          </Text>
          
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.importButtonText}>Choose File</Text>
            )}
          </TouchableOpacity>
          
          {parsing && (
            <View style={styles.parsingIndicator}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.parsingText}>Parsing transactions...</Text>
            </View>
          )}
          
          <Text style={styles.supportNote}>
            📱 Mobile: CSV only | 💻 Web: CSV & PDF
          </Text>
        </View>
      </View>
    );
  }
  
  // ============================================================================
  // RENDER: Review State
  // ============================================================================
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review & Confirm</Text>
        <Text style={styles.subtitle}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        
        {categorySummaries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Summary</Text>
            <Text style={styles.sectionSubtitle}>
              Current month breakdown
            </Text>
            
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
        )}
        
        {otherMonthsGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Previous Months</Text>
            <Text style={styles.warningText}>
              Found {otherMonthsGroups.reduce((sum, g) => sum + g.transactions.length, 0)} transactions
              from {otherMonthsGroups.length} other month(s). These will be added to their respective months.
            </Text>
            
            {otherMonthsGroups.map((group, idx) => (
              <View key={idx} style={styles.monthGroup}>
                <Text style={styles.monthLabel}>
                  {new Date(group.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <Text style={styles.monthCount}>{group.transactions.length} transactions</Text>
              </View>
            ))}
          </View>
        )}
        
        {hasUncategorized && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Action Required</Text>
            <Text style={styles.warningText}>
              {uncategorizedCount} transaction{uncategorizedCount !== 1 ? 's' : ''} need{uncategorizedCount === 1 ? 's' : ''} categorization.
              Please select a category for each below.
            </Text>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Transactions</Text>
          
          {transactions.map((txn, idx) => {
            const isUncategorized = txn.confidence === 'low' || txn.category === 'Uncategorized';
            const isEditing = editingIndex === idx;
            
            return (
              <View
                key={idx}
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
                      onPress={() => setEditingIndex(idx)}
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
                          onPress={() => handleCategorySelect(idx, cat)}
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
      </ScrollView>
      
      <View style={styles.footer}>
        {hasUncategorized && (
          <View style={styles.validationWarning}>
            <Text style={styles.validationWarningText}>
              ⚠️ {uncategorizedCount} transaction{uncategorizedCount !== 1 ? 's' : ''} need categorization
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            hasUncategorized && styles.saveButtonDisabled,
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
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    marginTop: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  parsingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  parsingText: {
    color: '#666',
    marginLeft: 10,
  },
  supportNote: {
    color: '#666',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 20,
  },
  
  circleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'flex-start',
  },
  circleCard: {
    width: '47%',
    marginBottom: 10,
  },
  circle: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    minHeight: 140,
    justifyContent: 'center',
  },
  circleIncome: {
    borderColor: '#34c759',
    backgroundColor: '#0d1f14',
  },
  circleExpense: {
    borderColor: '#ff3b30',
    backgroundColor: '#1f0d0d',
  },
  circleTransfer: {
    borderColor: '#ff9500',
    backgroundColor: '#1f1709',
  },
  circleCategoryName: {
    color: '#999',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  circleAmount: {
    color: '#ff3b30',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  circleAmountIncome: {
    color: '#34c759',
  },
  circleCount: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  noBudgetImpact: {
    color: '#ff9500',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
  },
  
  monthGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  monthLabel: {
    color: '#fff',
    fontSize: 16,
  },
  monthCount: {
    color: '#999',
    fontSize: 14,
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
  
  transactionCard: {
    backgroundColor: '#1a1a1a',
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
    borderTopColor: '#222',
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