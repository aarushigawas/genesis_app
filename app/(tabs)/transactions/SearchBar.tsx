// app/(tabs)/transactions/SearchBar.tsx
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { theme } = useTheme();

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
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={[
          styles.input,
          { color: theme.primaryText },
        ]}
        placeholder="Search by merchant or category..."
        placeholderTextColor={theme.secondaryText}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});