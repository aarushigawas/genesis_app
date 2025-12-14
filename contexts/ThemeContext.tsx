// contexts/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Theme = {
  // Background
  background: readonly [string, string, string, string];
  backgroundLocations: readonly [number, number, number, number];
  
  // Cards & Surfaces
  cardBackground: string;
  cardBorder: string;
  cardBorderFocused: string;
  
  // Text
  primaryText: string;
  secondaryText: string;
  tertiaryText: string;
  
  // Accent Colors
  accent: readonly [string, string, string];
  accentBorder: string;
  
  // Input
  inputBackground: string;
  inputBorder: string;
  inputBorderFocused: string;
  inputPlaceholder: string;
  
  // Button
  buttonPrimary: readonly [string, string, string];
  buttonSecondary: string;
  buttonSecondaryBorder: string;
  
  // Special
  errorColor: string;
  successColor: string;
  shadow: string;
  
  // Status bar
  statusBarStyle: 'light-content' | 'dark-content';
};

export const lightTheme: Theme = {
  // Warm beige to soft peach gradient
  background: ['#F5EBE0', '#FADADD', '#F5EBE0', '#FFF5E1'],
  backgroundLocations: [0, 0.3, 0.7, 1],
  
  // Cards
  cardBackground: 'rgba(255, 250, 245, 0.85)',
  cardBorder: 'rgba(210, 180, 160, 0.3)',
  cardBorderFocused: 'rgba(200, 150, 140, 0.5)',
  
  // Text
  primaryText: '#3C2A21',
  secondaryText: '#8B6F5C',
  tertiaryText: '#B4978A',
  
  // Accent - dusty rose to muted brown
  accent: ['#D4A5A5', '#C49A9A', '#B48A8A'],
  accentBorder: 'rgba(200, 150, 150, 0.4)',
  
  // Input
  inputBackground: 'rgba(255, 250, 245, 0.8)',
  inputBorder: 'rgba(210, 180, 160, 0.3)',
  inputBorderFocused: 'rgba(200, 150, 140, 0.6)',
  inputPlaceholder: '#B4978A',
  
  // Button
  buttonPrimary: ['#D4A5A5', '#C49A9A', '#B48A8A'],
  buttonSecondary: 'rgba(255, 250, 245, 0.7)',
  buttonSecondaryBorder: 'rgba(200, 150, 150, 0.4)',
  
  // Special
  errorColor: '#D4756F',
  successColor: '#A5C9A5',
  shadow: 'rgba(60, 42, 33, 0.15)',
  
  statusBarStyle: 'dark-content',
};

export const darkTheme: Theme = {
  // Original dark cosmic theme
  background: ['#1A1428', '#2D1B3D', '#1A1428', '#2D1B3D'],
  backgroundLocations: [0, 0.3, 0.7, 1],
  
  // Cards
  cardBackground: 'rgba(45, 38, 64, 0.5)',
  cardBorder: 'rgba(184, 164, 232, 0.2)',
  cardBorderFocused: 'rgba(232, 180, 248, 0.6)',
  
  // Text
  primaryText: '#FFFFFF',
  secondaryText: '#B8A4E8',
  tertiaryText: '#8B7AA8',
  
  // Accent
  accent: ['#B4A4F8', '#9B8AE8', '#8B7AD8'],
  accentBorder: 'rgba(184, 164, 232, 0.4)',
  
  // Input
  inputBackground: 'rgba(45, 38, 64, 0.6)',
  inputBorder: 'rgba(184, 164, 232, 0.2)',
  inputBorderFocused: 'rgba(232, 180, 248, 0.6)',
  inputPlaceholder: '#766B8E',
  
  // Button
  buttonPrimary: ['#B4A4F8', '#9B8AE8', '#8B7AD8'],
  buttonSecondary: 'rgba(45, 38, 64, 0.5)',
  buttonSecondaryBorder: 'rgba(184, 164, 232, 0.4)',
  
  // Special
  errorColor: '#FF6B6B',
  successColor: '#B4F8D4',
  shadow: '#E8B4F8',
  
  statusBarStyle: 'light-content',
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  
  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);
  
  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };
  
  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
      console.log('Theme saved:', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };
  
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};