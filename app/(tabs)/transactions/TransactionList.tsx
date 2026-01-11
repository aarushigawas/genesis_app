// app/(tabs)/transactions/TransactionList.tsx
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { auth, db } from '../../../src2/firebase/config';
import TransactionRow from './TransactionRow';

interface Transaction {
  id: string;
  merchantName: string;
  category: string;
  amount: number;
  date: string;
  month: string;
  year: number;
  source?: string;
  type?: string;
  affectsBudget?: boolean;
  createdAt?: any;
}

interface TransactionListProps {
  selectedMonth: string;
  searchQuery: string;
}

export default function TransactionList({
  selectedMonth,
  searchQuery,
}: TransactionListProps) {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const transactionsRef = collection(
        db,
        'transactions',
        userId,
        'items'
      );
      const q = query(transactionsRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      const fetchedTransactions: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Transaction, 'id'>),
      }));

      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesMonth =
      selectedMonth === 'ALL' || txn.month === selectedMonth;

    const matchesSearch =
      !searchQuery ||
      txn.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMonth && matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.accent[0]} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
          Loading transactions...
        </Text>
      </View>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={[styles.emptyText, { color: theme.primaryText }]}>
          No transactions found
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
          {searchQuery
            ? 'Try a different search'
            : 'Add transactions to get started'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {filteredTransactions.map((item) => (
        <TransactionRow
          key={item.id}
          transaction={item}
          onDelete={fetchTransactions}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
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
  },
});