import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Defs, Path, Stop, Svg, G as SvgG, RadialGradient as SvgRadialGradient } from 'react-native-svg';
import { useTheme } from '../../../contexts/ThemeContext';

interface SavingDuration {
  unit: string;
  value: number;
}

interface AirplaneProgressProps {
  savingPercentage?: number;
  monthlyBudget?: number;
  savingDuration?: SavingDuration | null;
  totalSpent: number;
}

const AirplaneProgress: React.FC<AirplaneProgressProps> = ({
  savingPercentage,
  monthlyBudget,
  savingDuration,
  totalSpent
}) => {
  const { theme } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const planePosition = useRef(new Animated.Value(0)).current;
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (savingPercentage !== undefined) {
      const targetProgress = Math.min(Math.max(savingPercentage / 100, 0), 1);
      
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.spring(progress, {
            toValue: targetProgress,
            useNativeDriver: false,
            friction: 5,
          }),
          Animated.spring(planePosition, {
            toValue: targetProgress,
            useNativeDriver: false,
            friction: 5,
          })
        ])
      ]).start();
    }
  }, [savingPercentage]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0]
  });

  const planeRotation = planePosition.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '15deg', '0deg', '-15deg', '0deg']
  }) as unknown as number;

  const remainingBudget = monthlyBudget ? monthlyBudget - totalSpent : 0;
  const budgetPercentage = monthlyBudget ? (totalSpent / monthlyBudget) * 100 : 0;
  const isOverBudget = budgetPercentage > 100;

  const handlePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setTooltipPosition({ x: locationX, y: locationY });
    setTooltipText(`$${remainingBudget.toFixed(2)} left this month`);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.8} 
        style={styles.touchable}
        onPress={handlePress}
      >
        <Svg height="200" width="200" viewBox="0 0 200 200" style={styles.svg}>
          <Defs>
            <SvgRadialGradient id="progressGradient" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={theme.accent[0]} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={theme.accent[1]} stopOpacity="0.4" />
            </SvgRadialGradient>
          </Defs>
          
          {/* Background circle */}
          <Circle
            cx="100"
            cy="100"
            r={radius}
            stroke={theme.cardBorder}
            strokeWidth="10"
            fill="transparent"
            strokeLinecap="round"
          />
          
          {/* Progress circle */}
          <AnimatedCircle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            originX="100"
            originY="100"
          />
          
          {/* Airplane */}
          <SvgG rotation={planeRotation} originX={100} originY={100}>
            <Svg x="70" y="70" width="60" height="60" viewBox="0 0 24 24">
              <Path
                d="M22 16.21v-1.895L14 8V4a2 2 0 0 0-4 0v2.3l-4 3.2v.5l-4.17-2.8a1 1 0 0 0-1.66.75v9.2a1 1 0 0 0 1.66.75L8 15.5v.5l-4 3.2V21l6-2 5 2 5-2v-1.8l-4-3.2v-.5l4-3.2z"
                fill={theme.accent[0]}
              />
            </Svg>
          </SvgG>
        </Svg>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.primaryText }]}>
            {savingPercentage || 0}%
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            of monthly goal
          </Text>
        </View>
        
        {showTooltip && (
          <View 
            style={[
              styles.tooltip, 
              { 
                left: tooltipPosition.x - 100, 
                top: tooltipPosition.y - 40,
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder
              }
            ]}
          >
            <Text style={[styles.tooltipText, { color: theme.primaryText }]}>{tooltipText}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.budgetInfo}>
        <View style={styles.budgetRow}>
          <View style={[styles.budgetDot, { backgroundColor: theme.accent[0] }]} />
          <Text style={[styles.budgetLabel, { color: theme.secondaryText }]}>Spent:</Text>
          <Text style={[styles.budgetAmount, { color: theme.primaryText }]}>
            ${totalSpent.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.budgetRow}>
          <View style={[styles.budgetDot, { backgroundColor: theme.cardBorder }]} />
          <Text style={[styles.budgetLabel, { color: theme.secondaryText }]}>Remaining:</Text>
          <Text style={[
            styles.budgetAmount, 
            { 
              color: isOverBudget ? '#ff3b30' : theme.primaryText,
              fontWeight: isOverBudget ? 'bold' : 'normal'
            }
          ]}>
            {isOverBudget ? '-' : ''}${Math.abs(remainingBudget).toFixed(2)}
            {isOverBudget ? ' over' : ' left'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  touchable: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  tooltip: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 12,
  },
  budgetInfo: {
    width: '100%',
    marginTop: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  budgetLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 'auto',
  },
});

export default AirplaneProgress;
