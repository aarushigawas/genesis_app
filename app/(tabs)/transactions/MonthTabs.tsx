// app/(tabs)/transactions/MonthTabs.tsx
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface MonthTabsProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const MONTHS = [
  { id: '01', label: 'Jan' },
  { id: '02', label: 'Feb' },
  { id: '03', label: 'Mar' },
  { id: '04', label: 'Apr' },
  { id: '05', label: 'May' },
  { id: '06', label: 'Jun' },
  { id: '07', label: 'Jul' },
  { id: '08', label: 'Aug' },
  { id: '09', label: 'Sep' },
  { id: '10', label: 'Oct' },
  { id: '11', label: 'Nov' },
  { id: '12', label: 'Dec' },
];

const YEARS = ['2025', '2024', '2023', '2022'];

export default function MonthTabs({ selectedMonth, onMonthChange }: MonthTabsProps) {
  const { theme } = useTheme();
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const currentYear = selectedMonth === 'ALL' 
    ? new Date().getFullYear().toString() 
    : selectedMonth.split('-')[0];

  const handleMonthSelect = (monthId: string) => {
    if (monthId === 'ALL') {
      onMonthChange('ALL');
    } else {
      onMonthChange(`${currentYear}-${monthId}`);
    }
  };

  const handleYearSelect = (year: string) => {
    setYearPickerVisible(false);
    if (selectedMonth === 'ALL') {
      onMonthChange(`${year}-${new Date().getMonth() + 1 < 10 ? '0' : ''}${new Date().getMonth() + 1}`);
    } else {
      const currentMonthPart = selectedMonth.split('-')[1];
      onMonthChange(`${year}-${currentMonthPart}`);
    }
  };

  const selectedMonthPart = selectedMonth === 'ALL' ? 'ALL' : selectedMonth.split('-')[1];

  return (
    <>
      <View style={styles.container}>
        <View style={styles.yearIndicatorContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setYearPickerVisible(true)}
            style={[
              styles.yearIndicator,
              { backgroundColor: theme.accent[0] }
            ]}
          >
            <Text style={styles.yearText}>{currentYear.slice(2)}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onMonthChange('ALL')}
            style={[
              styles.tab,
              {
                backgroundColor: selectedMonth === 'ALL'
                  ? theme.accent[0]
                  : theme.cardBackground,
                borderColor: selectedMonth === 'ALL'
                  ? theme.accent[0]
                  : theme.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedMonth === 'ALL' ? '#FFFFFF' : theme.primaryText,
                  fontWeight: selectedMonth === 'ALL' ? '700' : '600',
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {MONTHS.map((month) => {
            const isSelected = selectedMonthPart === month.id && selectedMonth !== 'ALL';
            return (
              <TouchableOpacity
                key={month.id}
                activeOpacity={0.7}
                onPress={() => handleMonthSelect(month.id)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isSelected
                      ? theme.accent[0]
                      : theme.cardBackground,
                    borderColor: isSelected
                      ? theme.accent[0]
                      : theme.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.primaryText,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {month.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Modal
        visible={yearPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setYearPickerVisible(false)}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.yearPickerContainer,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }
            ]}
          >
            <Text style={[styles.yearPickerTitle, { color: theme.primaryText }]}>
              Select Year
            </Text>
            {YEARS.map((year) => (
              <TouchableOpacity
                key={year}
                activeOpacity={0.7}
                onPress={() => handleYearSelect(year)}
                style={[
                  styles.yearOption,
                  {
                    backgroundColor: year === currentYear
                      ? theme.accent[0]
                      : 'transparent',
                  }
                ]}
              >
                <Text
                  style={[
                    styles.yearOptionText,
                    {
                      color: year === currentYear ? '#FFFFFF' : theme.primaryText,
                      fontWeight: year === currentYear ? '700' : '600',
                    }
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearIndicatorContainer: {
    marginRight: 12,
  },
  yearIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingRight: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearPickerContainer: {
    width: 200,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
  },
  yearPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  yearOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  yearOptionText: {
    fontSize: 15,
  },
});