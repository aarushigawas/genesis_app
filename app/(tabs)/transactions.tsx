// app/(tabs)/transactions.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * NOTE:
 * This screen is only an ENTRY POINT.
 * Actual parsing happens in /parsing/*
 */

export default function TransactionsTab() {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={theme.background}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={theme.backgroundLocations}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          Add Transactions
        </Text>

        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          Import or add your expenses
        </Text>

        {/* Paste SMS */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/parsing/sms')}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(232, 180, 248, 0.25)', 'rgba(180, 164, 248, 0.15)']
                : ['rgba(212, 165, 165, 0.30)', 'rgba(196, 154, 154, 0.18)']
            }
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.emoji}>💬</Text>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>
              Paste SMS
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.secondaryText }]}>
              Copy & paste bank messages
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* CSV / PDF */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/parsing/csv')}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(232, 180, 248, 0.25)', 'rgba(180, 164, 248, 0.15)']
                : ['rgba(212, 165, 165, 0.30)', 'rgba(196, 154, 154, 0.18)']
            }
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.emoji}>🏦</Text>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>
              Bank Statement
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.secondaryText }]}>
              Upload CSV or PDF
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="transactions" />
    </View>
  );
}

/* =======================
   BOTTOM TAB BAR
   (same structure as dashboard, simplified)
======================= */

const BottomTabBar = ({ activeTab }: { activeTab: string }) => {
  const { theme } = useTheme();

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: '🏠', route: '/(tabs)/dashboard' },
    { id: 'transactions', label: 'Add', icon: '➕', route: '/(tabs)/transactions' },
    { id: 'analytics', label: 'Analytics', icon: '📈', route: '/(tabs)/analytics' },
    { id: 'profile', label: 'Profile', icon: '👤', route: '/(tabs)/profile' },
  ];

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.cardBorder,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => router.push(tab.route as any)}
            style={styles.tabButton}
          >
            <Text style={{ fontSize: 22 }}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? theme.accent[0] : theme.secondaryText },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 32,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
