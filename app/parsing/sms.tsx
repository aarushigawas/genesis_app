// app/parsing/sms.tsx - COMPLETE WITH FIRESTORE
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
import { ParsedTransaction, calculateConfidence, parseSMS } from '../../utils/parseSms';

export default function SMSParser() {
  const { theme, isDark } = useTheme();
  const [smsText, setSmsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // ============== PREVIEW TRANSACTIONS ==============
  const handlePreview = () => {
    if (!smsText.trim()) {
      Alert.alert('Error', 'Please paste some SMS text first');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const parsed = parseSMS(smsText, currentUser.uid);

      if (parsed.length === 0) {
        Alert.alert(
          'No Transactions Found',
          'Could not parse any transactions from the SMS text. Please check the format.\n\nTip: Make sure the SMS contains amount in format like "Rs. 500" or "₹500"'
        );
        return;
      }

      // Calculate confidence for each transaction
      const parsedWithConfidence = parsed.map(t => ({
        ...t,
        confidence: calculateConfidence(t)
      }));

      setParsedTransactions(parsedWithConfidence);
      setShowPreview(true);
    } catch (error) {
      console.error('Parsing error:', error);
      Alert.alert('Error', 'Failed to parse SMS. Please try again.');
    }
  };

  // ============== SAVE TO FIRESTORE ==============
  const saveTransactions = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser?.uid) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      if (parsedTransactions.length === 0) {
        Alert.alert('Error', 'No transactions to save. Please preview first.');
        return;
      }

      // Reference to transactions collection
      const transactionsRef = collection(db, 'transactions', currentUser.uid, 'items');

      // Prepare batch save
      const savePromises = parsedTransactions.map(async (transaction) => {
        const transactionData = {
          uid: currentUser.uid,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          merchantName: transaction.merchantName,
          affectsBudget: transaction.affectsBudget,
          confidence: transaction.confidence,
          rawText: transaction.rawText,
          source: transaction.source,
          date: transaction.date,
          month: transaction.month,
          year: transaction.year,
          createdAt: serverTimestamp()
        };

        return addDoc(transactionsRef, transactionData);
      });

      await Promise.all(savePromises);

      Alert.alert(
        'Success! 🎉',
        `${parsedTransactions.length} transaction${parsedTransactions.length > 1 ? 's' : ''} saved successfully!`,
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
              setShowPreview(false);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error saving transactions:', error);
      Alert.alert('Error', 'Failed to save transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============== GET CATEGORY ICON ==============
  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      Income: '💰',
      Transfer: '↔️',
      Food: '🍔',
      Transport: '🚗',
      Rent: '🏠',
      Subscriptions: '📺',
      Groceries: '🛒',
      Utilities: '💡',
      Healthcare: '⚕️',
      Education: '🎓',
      Travel: '✈️',
      Shopping: '🛍️',
      Gifts: '🎁',
    };
    return icons[category] || '💳';
  };

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
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={[styles.backText, { color: theme.accent[0] }]}>← Back</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.primaryText }]}>
              Import from SMS
            </Text>

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
                5. Review and confirm{'\n'}
                6. Tap "Save to Firestore"
              </Text>
            </LinearGradient>

            {/* Example SMS */}
            <LinearGradient
              colors={isDark
                ? ['rgba(180, 164, 248, 0.12)', 'rgba(232, 180, 248, 0.06)']
                : ['rgba(196, 154, 154, 0.15)', 'rgba(212, 165, 165, 0.08)']
              }
              style={styles.exampleBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.exampleTitle, { color: theme.primaryText }]}>
                💡 Example SMS format:
              </Text>
              <Text style={[styles.exampleText, { color: theme.secondaryText }]}>
                Rs. 380 debited from A/c at Zomato on 27-11-2024{'\n'}
                {'\n'}
                Your A/c credited with Rs. 5000 on 15-12-2024{'\n'}
                {'\n'}
                INR 1250.50 paid to Swiggy on 23-12-2025
              </Text>
            </LinearGradient>

            {/* Input Area */}
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
                  setShowPreview(false); // Reset preview when text changes
                }}
                textAlignVertical="top"
              />
            </View>

            {/* Preview Button */}
            <TouchableOpacity
              onPress={handlePreview}
              style={[styles.previewButton, {
                backgroundColor: theme.cardBackground,
                borderColor: theme.accent[0],
                opacity: !smsText.trim() ? 0.5 : 1
              }]}
              disabled={!smsText.trim()}
            >
              <Text style={[styles.previewButtonText, { color: theme.accent[0] }]}>
                🔍 Preview Transactions
              </Text>
            </TouchableOpacity>

            {/* Preview Parsed Transactions */}
            {showPreview && parsedTransactions.length > 0 && (
              <View style={styles.previewContainer}>
                <Text style={[styles.previewTitle, { color: theme.primaryText }]}>
                  Found {parsedTransactions.length} transaction{parsedTransactions.length > 1 ? 's' : ''}:
                </Text>

                {parsedTransactions.map((t, idx) => (
                  <LinearGradient
                    key={idx}
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
                        <Text style={styles.categoryIcon}>{getCategoryIcon(t.category)}</Text>
                        <View>
                          <Text style={[styles.previewMerchant, { color: theme.primaryText }]}>
                            {t.merchantName}
                          </Text>
                          <Text style={[styles.previewCategory, { color: theme.secondaryText }]}>
                            {t.category} • {t.type}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.previewRight}>
                        <Text style={[styles.previewAmount, {
                          color: t.type === 'income' ? '#4CAF50' : '#F44336'
                        }]}>
                          {t.type === 'income' ? '+' : '-'}₹{Math.floor(t.amount)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.previewFooter}>
                      <Text style={[styles.previewDate, { color: theme.secondaryText }]}>
                        📅 {new Date(t.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                      <View style={[styles.confidenceBadge, {
                        backgroundColor: t.confidence >= 0.7
                          ? 'rgba(76, 175, 80, 0.2)'
                          : t.confidence >= 0.5
                          ? 'rgba(255, 193, 7, 0.2)'
                          : 'rgba(244, 67, 54, 0.2)'
                      }]}>
                        <Text style={[styles.confidenceText, {
                          color: t.confidence >= 0.7
                            ? '#4CAF50'
                            : t.confidence >= 0.5
                            ? '#FFC107'
                            : '#F44336'
                        }]}>
                          {Math.round(t.confidence * 100)}% confident
                        </Text>
                      </View>
                    </View>

                    {t.affectsBudget && (
                      <View style={[styles.budgetBadge, {
                        backgroundColor: isDark
                          ? 'rgba(232, 180, 248, 0.15)'
                          : 'rgba(212, 165, 165, 0.2)'
                      }]}>
                        <Text style={[styles.budgetBadgeText, { color: theme.accent[0] }]}>
                          💰 Affects Budget
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                ))}

                {/* Save Button */}
                <TouchableOpacity
                  onPress={saveTransactions}
                  style={[styles.saveButton, {
                    backgroundColor: theme.accent[0],
                    opacity: loading ? 0.7 : 1
                  }]}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.saveButtonText}>
                        💾 Save {parsedTransactions.length} Transaction{parsedTransactions.length > 1 ? 's' : ''} to Firestore
                      </Text>
                    </>
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

// ============== STYLES ==============
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionsBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  instructionsText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  exampleBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  exampleText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    minHeight: 180,
  },
  textInput: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  previewButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 20,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  previewContainer: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.4,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  previewMerchant: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  previewCategory: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  previewRight: {
    alignItems: 'flex-end',
  },
  previewAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  budgetBadge: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  budgetBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  saveButton: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});