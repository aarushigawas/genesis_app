// contexts/OnboardingContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';

type OnboardingData = {
  monthlyIncome: number | null;
  categories: string[];
  monthlyBudget: number | null;
  notificationPreference: 'overspend' | 'weekly' | 'daily' | 'never' | null;
  spendingPersonality: 'impulsive' | 'balanced' | 'planner' | null;
};

type OnboardingContextType = {
  data: OnboardingData;
  updateIncome: (income: number) => void;
  updateCategories: (categories: string[]) => void;
  updateBudget: (budget: number) => void;
  updateNotificationPreference: (preference: 'overspend' | 'weekly' | 'daily' | 'never') => void;
  updateSpendingPersonality: (personality: 'impulsive' | 'balanced' | 'planner') => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialData: OnboardingData = {
  monthlyIncome: null,
  categories: [],
  monthlyBudget: null,
  notificationPreference: null,
  spendingPersonality: null,
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateIncome = (income: number) => {
    setData(prev => ({ ...prev, monthlyIncome: income }));
  };

  const updateCategories = (categories: string[]) => {
    setData(prev => ({ ...prev, categories }));
  };

  const updateBudget = (budget: number) => {
    setData(prev => ({ ...prev, monthlyBudget: budget }));
  };

  const updateNotificationPreference = (preference: 'overspend' | 'weekly' | 'daily' | 'never') => {
    setData(prev => ({ ...prev, notificationPreference: preference }));
  };

  const updateSpendingPersonality = (personality: 'impulsive' | 'balanced' | 'planner') => {
    setData(prev => ({ ...prev, spendingPersonality: personality }));
  };

  const resetOnboarding = () => {
    setData(initialData);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateIncome,
        updateCategories,
        updateBudget,
        updateNotificationPreference,
        updateSpendingPersonality,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};