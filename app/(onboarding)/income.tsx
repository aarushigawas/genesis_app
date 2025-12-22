// app/(onboarding)/income.tsx
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function IncomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { updateIncome } = useOnboarding();
  
  const [income, setIncome] = useState(50000);
  const [bankBalance, setBankBalance] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorDisplay, setCalculatorDisplay] = useState('0');

  const handleNext = () => {
    updateIncome(income, bankBalance);
    router.push('/(onboarding)/budget');
  };

  // Calculator functions
  const handleCalculatorPress = (value: string) => {
    if (value === 'C') {
      setCalculatorDisplay('0');
    } else if (value === '←') {
      setCalculatorDisplay(prev => {
        const newDisplay = prev.slice(0, -1);
        return newDisplay === '' ? '0' : newDisplay;
      });
    } else if (value === '=') {
      try {
        const result = eval(calculatorDisplay);
        setCalculatorDisplay(result.toString());
        setBankBalance(Math.round(result));
      } catch {
        setCalculatorDisplay('Error');
      }
    } else {
      setCalculatorDisplay(prev => {
        if (prev === '0' && value !== '.') {
          return value;
        }
        return prev + value;
      });
    }
  };

  const applyCalculatorValue = () => {
    try {
      const value = parseFloat(calculatorDisplay) || 0;
      setBankBalance(Math.round(value));
      setShowCalculator(false);
      setCalculatorDisplay('0');
    } catch {
      setBankBalance(0);
      setShowCalculator(false);
    }
  };

  const calculatorButtons = [
    ['7', '8', '9', '←'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['C', '0', '.', '='],
  ];

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.primaryText }]}>
            Financial Overview
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Help us understand your current situation
          </Text>

          {/* Monthly Income Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.primaryText }]}>
              Monthly Income
            </Text>
            <View style={styles.previewContainer}>
              <Text style={[styles.currency, { color: theme.primaryText }]}>₹</Text>
              <TextInput
                style={[styles.incomeInput, { color: theme.primaryText, borderBottomColor: theme.inputBorderFocused }]}
                value={income.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                  setIncome(num);
                }}
                keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                inputMode={Platform.OS === 'web' ? 'numeric' : undefined}
                maxLength={8}
              />
            </View>

            {Platform.OS === 'web' ? (
              <View style={styles.webSliderContainer}>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="1000"
                  value={income}
                  onChange={(e) => setIncome(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    height: '40px',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: `linear-gradient(to right, ${isDark ? '#B4A4F8' : '#D4A5A5'} 0%, ${isDark ? '#B4A4F8' : '#D4A5A5'} ${(income / 500000) * 100}%, ${theme.cardBorder} ${(income / 500000) * 100}%, ${theme.cardBorder} 100%)`,
                    outline: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  } as any}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${isDark ? '#E8B4F8' : '#C49A9A'};
                    cursor: pointer;
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${isDark ? '#E8B4F8' : '#C49A9A'};
                    cursor: pointer;
                    border: none;
                  }
                `}</style>
              </View>
            ) : (
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={500000}
                step={1000}
                value={income}
                onValueChange={setIncome}
                minimumTrackTintColor={isDark ? '#B4A4F8' : '#D4A5A5'}
                maximumTrackTintColor={theme.cardBorder}
                thumbTintColor={isDark ? '#E8B4F8' : '#C49A9A'}
              />
            )}

            <View style={styles.rangeLabels}>
              <Text style={[styles.rangeText, { color: theme.tertiaryText }]}>₹0</Text>
              <Text style={[styles.rangeText, { color: theme.tertiaryText }]}>₹5L</Text>
            </View>
          </View>

          {/* Bank Balance Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.primaryText }]}>
              Current Bank Balance
            </Text>
            <Text style={[styles.sectionHint, { color: theme.tertiaryText }]}>
              How much money do you have right now?
            </Text>

            <View style={styles.balanceContainer}>
              <View style={styles.balanceDisplay}>
                <Text style={[styles.currency, { color: theme.primaryText }]}>₹</Text>
                <TextInput
                  style={[styles.balanceInput, { color: theme.primaryText, borderBottomColor: theme.inputBorderFocused }]}
                  value={bankBalance.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                    setBankBalance(num);
                  }}
                  keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                  inputMode={Platform.OS === 'web' ? 'numeric' : undefined}
                  maxLength={10}
                />
              </View>

              <TouchableOpacity
                style={[styles.calculatorButton, { 
                  backgroundColor: isDark ? '#2A2438' : '#F5E6E6',
                  borderColor: isDark ? '#B4A4F8' : '#D4A5A5'
                }]}
                onPress={() => setShowCalculator(!showCalculator)}
              >
                <Text style={[styles.calculatorButtonText, { color: theme.primaryText }]}>
                  🧮 Calculator
                </Text>
              </TouchableOpacity>
            </View>

            {/* Calculator */}
            {showCalculator && (
              <View style={[styles.calculator, { 
                backgroundColor: isDark ? '#1A1428' : '#FFF8F8',
                borderColor: isDark ? '#B4A4F8' : '#D4A5A5'
              }]}>
                <View style={[styles.calculatorDisplay, { 
                  backgroundColor: isDark ? '#2A2438' : '#F5E6E6'
                }]}>
                  <Text style={[styles.calculatorDisplayText, { color: theme.primaryText }]}>
                    {calculatorDisplay}
                  </Text>
                </View>

                <View style={styles.calculatorGrid}>
                  {calculatorButtons.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.calculatorRow}>
                      {row.map((button) => (
                        <TouchableOpacity
                          key={button}
                          style={[styles.calcButton, {
                            backgroundColor: isDark ? '#2A2438' : '#F5E6E6',
                          }]}
                          onPress={() => handleCalculatorPress(button)}
                        >
                          <Text style={[styles.calcButtonText, { 
                            color: button === '=' ? (isDark ? '#B4A4F8' : '#D4A5A5') : theme.primaryText,
                            fontWeight: button === '=' ? '700' : '600'
                          }]}>
                            {button}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.applyButton, { 
                    backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5'
                  }]}
                  onPress={applyCalculatorValue}
                >
                  <Text style={[styles.applyButtonText, { 
                    color: isDark ? '#1A1428' : '#3C2A21'
                  }]}>
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDark ? '#B4A4F8' : '#D4A5A5' }]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#1A1428' : '#3C2A21' }]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  section: {
    marginBottom: 50,
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    marginBottom: 20,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  currency: {
    fontSize: 48,
    fontWeight: '600',
    marginRight: 8,
  },
  incomeInput: {
    fontSize: 48,
    fontWeight: '600',
    borderBottomWidth: 2,
    minWidth: 200,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  webSliderContainer: {
    width: '100%',
    height: 40,
    marginVertical: 0,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeText: {
    fontSize: 14,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  balanceInput: {
    fontSize: 40,
    fontWeight: '600',
    borderBottomWidth: 2,
    minWidth: 200,
    textAlign: 'center',
  },
  calculatorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  calculatorButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calculator: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  calculatorDisplay: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  calculatorDisplayText: {
    fontSize: 32,
    fontWeight: '600',
  },
  calculatorGrid: {
    gap: 12,
  },
  calculatorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  calcButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  applyButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});