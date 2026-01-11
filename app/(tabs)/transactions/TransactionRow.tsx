// app/(tabs)/transactions/TransactionRow.tsx
import {
    deleteDoc,
    doc,
    getDoc,
    increment,
    updateDoc,
} from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { auth, db } from '../../../src2/firebase/config';

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
}

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: () => void;
}

export default function TransactionRow({
  transaction,
  onDelete,
}: TransactionRowProps) {
  const { theme } = useTheme();
  const [deleting, setDeleting] = useState<boolean>(false);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this transaction from ${transaction.merchantName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              await deleteDoc(
                doc(db, 'transactions', userId, 'items', transaction.id)
              );

              if (transaction.affectsBudget !== false) {
                const budgetRef = doc(
                  db,
                  'userBudgets',
                  userId,
                  'months',
                  transaction.month
                );

                const budgetSnap = await getDoc(budgetRef);
                if (budgetSnap.exists()) {
                  const categoryField = `categories.${transaction.category}`;
                  await updateDoc(budgetRef, {
                    totalExpenses: increment(-transaction.amount),
                    [categoryField]: increment(-transaction.amount),
                  });
                }
              }

              onDelete();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.categoryEmoji}>
            {getCategoryEmoji(transaction.category)}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text
            style={[styles.merchantName, { color: theme.primaryText }]}
            numberOfLines={1}
          >
            {transaction.merchantName || 'Unknown Merchant'}
          </Text>
          <Text style={[styles.category, { color: theme.secondaryText }]}>
            {transaction.category} • {formattedDate}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: theme.primaryText }]}>
          ₹{transaction.amount.toFixed(2)}
        </Text>

        {deleting ? (
          <ActivityIndicator
            size="small"
            color={theme.accent[0]}
            style={styles.deleteButton}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getCategoryEmoji(category: string): string {
  const categoryMap: Record<string, string> = {
    Food: '🍔',
    Shopping: '🛍️',
    Transport: '🚗',
    Entertainment: '🎬',
    Bills: '📄',
    Health: '🏥',
    Education: '📚',
    Travel: '✈️',
    Rent: '🏠',
    Transfers: '💸',
    Investment: '📈',
    Other: '📦',
  };
  return categoryMap[category] || '💰';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(180, 164, 248, 0.15)',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  infoSection: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
});