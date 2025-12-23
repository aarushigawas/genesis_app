// utils/categorizeTransaction.ts

export interface CategoryConfig {
  keywords: string[];
  type: 'income' | 'expense' | 'transfer';
  affectsBudget: boolean;
}

export const CATEGORY_KEYWORDS: Record<string, CategoryConfig> = {
  Income: {
    keywords: [
      'salary', 'credited', 'credit', 'income', 'refund', 'cashback', 
      'reimbursement', 'incentive', 'bonus', 'stipend', 'interest', 
      'dividend', 'payment received'
    ],
    type: 'income',
    affectsBudget: false
  },
  Transfer: {
    keywords: [
      'transfer', 'sent', 'paid to', 'upi', 'imps', 'neft', 'rtgs', 
      'gpay', 'phonepe', 'paytm', 'p2p', 'peer', 'friend', 'beneficiary'
    ],
    type: 'transfer',
    affectsBudget: false
  },
  Subscriptions: {
    keywords: [
      'netflix', 'prime', 'amazon prime', 'hotstar', 'disney', 'spotify', 
      'youtube', 'google', 'apple', 'icloud', 'playstore', 'subscription', 
      'renewal', 'monthly', 'yearly', 'plan'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Rent: {
    keywords: [
      'rent', 'housing', 'society', 'maintenance', 'apartment', 'flat', 
      'pg', 'hostel', 'lease'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Utilities: {
    keywords: [
      'electricity', 'water', 'gas', 'broadband', 'internet', 'wifi', 
      'recharge', 'mobile', 'bill', 'postpaid', 'prepaid', 'telecom'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Healthcare: {
    keywords: [
      'hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'chemist', 
      'medicine', 'lab', 'diagnostic', 'dental', 'health', 'apollo', 
      'fortis', 'max', 'medanta'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Education: {
    keywords: [
      'school', 'college', 'university', 'tuition', 'coaching', 'course', 
      'training', 'exam', 'udemy', 'coursera', 'byjus', 'unacademy', 
      'fee', 'admission'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Travel: {
    keywords: [
      'flight', 'airline', 'airways', 'hotel', 'resort', 'stay', 'booking', 
      'makemytrip', 'yatra', 'goibibo', 'oyo', 'airbnb', 'expedia', 
      'trivago', 'cleartrip', 'indigo', 'spicejet', 'vistara'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Transport: {
    keywords: [
      'uber', 'ola', 'rapido', 'cab', 'taxi', 'auto', 'metro', 'bus', 
      'train', 'irctc', 'fuel', 'petrol', 'diesel', 'gas', 'parking', 
      'toll', 'fastag'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Groceries: {
    keywords: [
      'grocery', 'supermarket', 'supermart', 'mart', 'store', 'kirana', 
      'ration', 'provision', 'reliance', 'dmart', 'bigbazaar', 'more', 
      'spar', 'fresh', 'vegetables', 'fruits'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Food: {
    keywords: [
      'restaurant', 'restro', 'cafe', 'cafeteria', 'dhaba', 'dhabha', 
      'food', 'eatery', 'bistro', 'kitchen', 'bar', 'pub', 'bakery', 
      'pizza', 'burger', 'sandwich', 'biryani', 'dosa', 'idli', 'momo', 
      'boba', 'bubble', 'tea', 'coffee', 'swiggy', 'zomato', 'ubereats', 
      'foodpanda', 'dineout', 'dominos', 'mcd', 'kfc', 'subway'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Shopping: {
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'snapdeal', 
      'shopping', 'fashion', 'clothes', 'footwear', 'sneakers', 'shoes', 
      'apparel', 'lifestyle', 'mall', 'store'
    ],
    type: 'expense',
    affectsBudget: true
  },
  Gifts: {
    keywords: [
      'gift', 'present', 'donation', 'charity', 'contribution', 'ngo'
    ],
    type: 'expense',
    affectsBudget: true
  }
};

export interface CategorizationResult {
  category: string;
  type: 'income' | 'expense' | 'transfer';
  affectsBudget: boolean;
  confidence: number;
  matchedKeywords: string[];
}

export const categorizeTransaction = (text: string): CategorizationResult => {
  const lowerText = text.toLowerCase();
  
  let bestMatch: CategorizationResult = {
    category: 'Shopping',
    type: 'expense',
    affectsBudget: true,
    confidence: 0.3,
    matchedKeywords: []
  };

  let maxMatches = 0;

  for (const [categoryName, config] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchedKeywords = config.keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > maxMatches) {
      maxMatches = matchedKeywords.length;
      
      // Calculate confidence based on number of keyword matches
      let confidence = 0.5 + (matchedKeywords.length * 0.15);
      confidence = Math.min(confidence, 0.95); // Cap at 0.95

      bestMatch = {
        category: categoryName,
        type: config.type,
        affectsBudget: config.affectsBudget,
        confidence,
        matchedKeywords
      };
    }
  }

  // If we found strong matches, return that
  if (maxMatches > 0) {
    return bestMatch;
  }

  // Fallback: check for debit/credit keywords to determine type
  if (lowerText.includes('credited') || lowerText.includes('credit')) {
    return {
      category: 'Income',
      type: 'income',
      affectsBudget: false,
      confidence: 0.6,
      matchedKeywords: ['credit']
    };
  }

  if (lowerText.includes('debited') || lowerText.includes('debit')) {
    return {
      category: 'Shopping',
      type: 'expense',
      affectsBudget: true,
      confidence: 0.4,
      matchedKeywords: ['debit']
    };
  }

  // Default to expense with low confidence
  return bestMatch;
};