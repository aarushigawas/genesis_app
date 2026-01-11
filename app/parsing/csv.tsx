// app/parsing/csv.tsx
// File 1: CSV Import - Parse, Review, Categorize, and WRITE TO FIRESTORE

import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import React, { useState } from 'react';
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
// CATEGORY MEMORY FUNCTIONS
// ============================================================================

function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getRememberedCategory(
  merchantName: string
): Promise<{ category: string; confidence: 'high' } | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const merchantKey = normalizeMerchant(merchantName);
    const ref = doc(db, 'userCategoryRules', user.uid, 'rules', merchantKey);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      category: data.category,
      confidence: 'high',
    };
  } catch (error) {
    console.error('Error fetching remembered category:', error);
    return null;
  }
}

async function rememberCategory(
  merchantName: string,
  category: string,
  source: 'csv' | 'sms'
) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const merchantKey = normalizeMerchant(merchantName);
    const ref = doc(db, 'userCategoryRules', user.uid, 'rules', merchantKey);

    await setDoc(
      ref,
      {
        merchantKey,
        originalName: merchantName,
        category,
        source,
        confidence: 'high',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving category memory:', error);
  }
}

// ============================================================================
// AVAILABLE CATEGORIES
// ============================================================================

const AVAILABLE_CATEGORIES = [
  'Food', 'Shopping', 'Groceries', 'Rent', 'Travel', 'Transport',
  'Utilities', 'Subscriptions', 'Healthcare', 'Education',
  'Transfers', 'Income', 'Gifts', 'Other',
];

// ============================================================================
// CATEGORY DETECTION ENGINE
// ============================================================================

const CATEGORY_RULES: Record<string, string[]> = {
  income: ['salary', 'credited', 'credit', 'income', 'refund', 'cashback', 'reimbursement', 'incentive', 'bonus', 'stipend', 'interest'],
  transfers: ['transfer', 'sent', 'paid to', 'upi', 'imps', 'neft', 'rtgs', 'gpay', 'phonepe', 'paytm', 'p2p', 'peer', 'friend'],
  subscriptions: ['netflix', 'prime', 'amazon prime', 'hotstar', 'disney', 'spotify', 'youtube', 'google', 'apple', 'icloud', 'playstore', 'subscription', 'renewal', 'monthly', 'yearly'],
  rent: ['rent', 'housing', 'society', 'maintenance', 'apartment', 'flat', 'pg', 'hostel'],
  utilities: ['electricity', 'water', 'gas', 'broadband', 'internet', 'wifi', 'recharge', 'mobile', 'bill', 'postpaid', 'prepaid'],
  healthcare: ['hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'chemist', 'medicine', 'lab', 'diagnostic', 'dental', 'health'],
  education: ['school', 'college', 'university', 'tuition', 'coaching', 'course', 'training', 'exam', 'udemy', 'coursera', 'byjus', 'unacademy'],
  travel: ['flight', 'airline', 'airways', 'hotel', 'resort', 'stay', 'booking', 'makemytrip', 'yatra', 'goibibo', 'oyo', 'airbnb', 'expedia', 'trivago'],
  transport: ['uber', 'ola', 'rapido', 'cab', 'taxi', 'auto', 'metro', 'bus', 'train', 'irctc', 'fuel', 'petrol', 'diesel', 'gas', 'parking', 'toll'],
  groceries: ['grocery', 'supermarket', 'supermart', 'mart', 'store', 'kirana', 'ration', 'provision', 'reliance', 'dmart', 'bigbazaar', 'more', 'spar'],
  food: ['restaurant', 'restro', 'cafe', 'cafeteria', 'dhaba', 'dhabha', 'food', 'eatery', 'bistro', 'kitchen', 'bar', 'pub', 'bakery', 'pizza', 'burger', 'sandwich', 'biryani', 'dosa', 'idli', 'momo', 'boba', 'bubble', 'tea', 'coffee', 'swiggy', 'zomato', 'ubereats', 'foodpanda', 'dineout'],
  shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'snapdeal', 'shopping', 'fashion', 'clothes', 'footwear', 'sneakers', 'shoes', 'apparel', 'lifestyle'],
  gifts: ['gift', 'present', 'donation', 'charity', 'contribution'],
};

function detectCategoryFromKeywords(merchantName: string): { category: string; confidence: 'high' | 'low' } {
  const lowerMerchant = merchantName.toLowerCase().trim();
  
  for (const [categoryKey, keywords] of Object.entries(CATEGORY_RULES)) {
    for (const keyword of keywords) {
      if (lowerMerchant.includes(keyword)) {
        const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        return { category: categoryName, confidence: 'high' };
      }
    }
  }
  
  return { category: 'Uncategorized', confidence: 'low' };
}

async function detectCategory(merchantName: string): Promise<{ category: string; confidence: 'high' | 'low' }> {
  const remembered = await getRememberedCategory(merchantName);
  if (remembered) {
    return remembered;
  }
  
  return detectCategoryFromKeywords(merchantName);
}

function shouldAffectBudget(category: string, type: 'expense' | 'income'): boolean {
  if (type === 'income') return false;
  if (category === 'Transfers' || category === 'Income') return false;
  return true;
}

// ============================================================================
// CSV PARSING
// ============================================================================

async function parseCSV(content: string): Promise<ParsedTransaction[]> {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const transactions: ParsedTransaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const columns = parseCSVLine(line);
    
    if (columns.length < 3) continue;
    
    const transaction = await extractTransactionFromColumns(columns);
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

async function extractTransactionFromColumns(columns: string[]): Promise<ParsedTransaction | null> {
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
    } else if (columns.length > 1 && isValidDate(columns[1])) {
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
    
    const { category, confidence } = await detectCategory(merchantName);
    
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
    
    const monthMap: Record<string, number> = {
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
  const numberStr = cleaned.replace(/[()-]/g, '');
  
  const amount = parseFloat(numberStr);
  return isNaN(amount) ? 0 : Math.abs(amount);
}

// ============================================================================
// FIREBASE FUNCTIONS
// ============================================================================

function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `${timestamp}_${randomStr}`;
}

async function checkDuplicates(transactions: ParsedTransaction[]): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
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
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return false;
  }
}

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
// UTILITY FUNCTIONS
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
    .sort((a, b) => b[0].localeCompare(a[0]))
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
// MAIN COMPONENT
// ============================================================================

export default function CSVImportScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  // ============================================================================
  // FILE IMPORT
  // ============================================================================
  
  const handleImport = async () => {
    try {
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values'],
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
      
      setParsing(true);
      
      const fileUri = file.uri;
      const response = await fetch(fileUri);
      const content = await response.text();
      
      const parsedTransactions = await parseCSV(content);
      
      if (parsedTransactions.length === 0) {
        Alert.alert('No Transactions', 'Could not find any valid transactions in the file.');
        setParsing(false);
        setLoading(false);
        return;
      }
      
      console.log(`✅ Parsed ${parsedTransactions.length} transactions`);
      
      setTransactions(parsedTransactions);
      const groups = groupTransactionsByMonth(parsedTransactions);
      setMonthGroups(groups);
      
      setParsing(false);
      setLoading(false);
      setShowReview(true);
      
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import file. Please try again.');
      setParsing(false);
      setLoading(false);
    }
  };
  
  // ============================================================================
  // CATEGORY SELECTION
  // ============================================================================
  
  const handleCategorySelect = async (index: number, newCategory: string) => {
    const updated = [...transactions];
    const transaction = updated[index];
    
    transaction.category = newCategory;
    transaction.confidence = 'high';
    transaction.affectsBudget = shouldAffectBudget(newCategory, transaction.type);
    
    await rememberCategory(transaction.merchantName, newCategory, 'csv');
    
    setTransactions(updated);
    
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
  
  const hasMultipleMonths = monthGroups.length > 1;
  const hasOtherMonths = monthGroups.some(g => g.month !== currentMonth);
  
  // ============================================================================
  // SAVE TO FIRESTORE
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
    
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to import transactions.');
      return;
    }
    
    try {
      setLoading(true);
      
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
      console.log('💾 Starting Firestore write...');
      
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
      
      router.push('/parsing/csv-imports');
      
    } catch (error) {
      setLoading(false);
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save transactions.');
    }
  };
  
  // ============================================================================
  // RENDER: EMPTY STATE
  // ============================================================================
  
  if (!showReview) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Import Bank Statement</Text>
          <Text style={styles.subtitle}>
            Upload your CSV file to automatically categorize transactions
          </Text>
        </View>
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Select CSV File</Text>
          <Text style={styles.emptyDescription}>
            Choose a bank statement CSV file to import transactions
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
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.parsingText}>Parsing transactions...</Text>
            </View>
          )}
        </View>
      </View>
    );
  }
  
  // ============================================================================
  // RENDER: REVIEW STATE
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
        
        {monthGroups.map((group) => {
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
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyDescription: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  parsingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  parsingText: {
    color: '#8E8E93',
    marginLeft: 10,
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