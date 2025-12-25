// app/parsing/csv-confirm.tsx
// File 3: Success screen (NO FIRESTORE WRITES HERE - JUST UI)

import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CSVConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const transactionCount = params.transactionCount ? parseInt(params.transactionCount as string) : 0;
  const success = params.success === 'true';
  
  if (!success) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Import Failed</Text>
          <Text style={styles.errorSubtitle}>
            Something went wrong during the import process
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Import Successful!</Text>
        <Text style={styles.successSubtitle}>
          {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} imported and budgets updated
        </Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✓ Transactions saved to Firestore
          </Text>
          <Text style={styles.infoText}>
            ✓ Budget calculations updated
          </Text>
          <Text style={styles.infoText}>
            ✓ Bank balance recalculated
          </Text>
          <Text style={styles.infoText}>
            ✓ Savings adjusted if needed
          </Text>
        </View>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/analytics')}
          >
            <Text style={styles.secondaryButtonText}>View Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    fontSize: 100,
    marginBottom: 20,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    color: '#8E8E93',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  
  infoBox: {
    backgroundColor: '#1C1C1E',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 40,
  },
  infoText: {
    color: '#30D158',
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
  },
  
  buttonGroup: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 100,
    marginBottom: 20,
  },
  errorTitle: {
    color: '#FF3B30',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: '#8E8E93',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});