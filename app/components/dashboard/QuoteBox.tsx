import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface SavingPurpose {
  text: string;
  type: string;
}

interface QuoteBoxProps {
  savingPurpose?: SavingPurpose | null;
}

const QuoteBox: React.FC<QuoteBoxProps> = ({ savingPurpose }) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const quotes = {
    travel: {
      text: "Every journey begins with a single step, and every adventure starts with a dream.",
      author: "- Unknown"
    },
    education: {
      text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
      author: "- Malcolm X"
    },
    home: {
      text: "Home is where our story begins. Every brick you lay is a word in your family's story.",
      author: "- Unknown"
    },
    default: {
      text: "A goal without a plan is just a wish.",
      author: "- Antoine de Saint-Exupéry"
    }
  };

  const getQuote = () => {
    if (!savingPurpose) return quotes.default;
    return quotes[savingPurpose.type as keyof typeof quotes] || quotes.default;
  };

  const quote = getQuote();

  return (
    <Animated.View 
      style={[
        styles.quoteBox, 
        { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={[styles.quoteText, { color: theme.primaryText }]}>{quote.text}</Text>
      <Text style={[styles.quoteAuthor, { color: theme.secondaryText }]}>{quote.author}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  quoteBox: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 14,
    textAlign: 'right',
    fontStyle: 'italic',
  },
});

export default QuoteBox;
