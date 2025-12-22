// contexts/OnboardingContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';

type OnboardingData = {
  monthlyIncome: number | null;
  currentBankBalance: number | null; // NEW: Bank balance field

  hasSavingGoal: boolean | null;
  monthlyBudget: number | null;
  savingAmount: number | null;
  savingPercentage: number | null;

 

  savingPurpose: {
    type: string;
    text?: string;
  } | null;

  savingDuration: {
    value: number;
    unit: 'months' | 'years';
  } | null;

  notificationPreference: 'overspend' | 'weekly' | 'daily' | 'never' | null;
};

type OnboardingContextType = {
  data: OnboardingData;
  updateIncome: (income: number, bankBalance: number) => void; // UPDATED: Now accepts bankBalance
  updateBudget: (data: {
    hasSavingGoal: boolean;
    monthlyBudget: number;
    savingAmount: number;
    savingPercentage: number;
  }) => void;
  
  updateSavingPurpose: (data: {
    type: string;
    text?: string;
  }) => void;
  updateSavingDuration: (data: {
    value: number;
    unit: 'months' | 'years';
  }) => void;
  updateNotificationPreference: (preference: 'overspend' | 'weekly' | 'daily' | 'never') => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialData: OnboardingData = {
  monthlyIncome: null,
  currentBankBalance: null, // NEW: Initialize bank balance
  hasSavingGoal: null,
  monthlyBudget: null,
  savingAmount: null,
  savingPercentage: null,
 
  savingPurpose: null,
  savingDuration: null,
  notificationPreference: null,
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateIncome = (income: number, bankBalance: number) => {
    setData(prev => ({ 
      ...prev, 
      monthlyIncome: income,
      currentBankBalance: bankBalance // NEW: Set bank balance
    }));
  };

  const updateBudget = (budgetData: {
    hasSavingGoal: boolean;
    monthlyBudget: number;
    savingAmount: number;
    savingPercentage: number;
  }) => {
    setData(prev => ({
      ...prev,
      hasSavingGoal: budgetData.hasSavingGoal,
      monthlyBudget: budgetData.monthlyBudget,
      savingAmount: budgetData.savingAmount,
      savingPercentage: budgetData.savingPercentage,
    }));
  };

  

  const updateSavingPurpose = (purposeData: {
    type: string;
    text?: string;
  }) => {
    setData(prev => ({ ...prev, savingPurpose: purposeData }));
  };

  const updateSavingDuration = (durationData: {
    value: number;
    unit: 'months' | 'years';
  }) => {
    setData(prev => ({ ...prev, savingDuration: durationData }));
  };

  const updateNotificationPreference = (preference: 'overspend' | 'weekly' | 'daily' | 'never') => {
    setData(prev => ({ ...prev, notificationPreference: preference }));
  };

  const resetOnboarding = () => {
    setData(initialData);
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateIncome,
        updateBudget,
        updateSavingPurpose,
        updateSavingDuration,
        updateNotificationPreference,
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