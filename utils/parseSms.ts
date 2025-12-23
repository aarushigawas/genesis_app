// utils/parseSms.ts

import { categorizeTransaction } from './categorizeTransaction';
import { extractDateFromSMS } from './dateHelpers';

export interface ParsedTransaction {
  amount: number;
  merchantName: string;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  affectsBudget: boolean;
  confidence: number;
  rawText: string;
  date: string;
  month: string;
  year: number;
  source: string;
}

export const parseSMS = (text: string, uid: string): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];
  
  // Split by newlines and filter empty lines
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip very short lines
    if (trimmedLine.length < 10) continue;

    const lowerLine = trimmedLine.toLowerCase();
    
    // Extract amount
    // Pattern 1: Rs. 1234.56 or Rs.1234.56 or Rs 1234.56
    // Pattern 2: ₹1234.56 or ₹ 1234.56
    // Pattern 3: INR 1234.56
    const amountPatterns = [
      /(?:rs\.?|₹|inr)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /(\d+(?:,\d+)*(?:\.\d{2})?)\s*(?:rs\.?|₹|inr)/i
    ];

    let amountMatch = null;
    for (const pattern of amountPatterns) {
      amountMatch = trimmedLine.match(pattern);
      if (amountMatch) break;
    }

    if (!amountMatch) continue;

    const amountStr = amountMatch[1].replace(/,/g, '');
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) continue;

    // Extract merchant name
    let merchantName = 'Unknown';
    
    // Try to find merchant after "at", "to", "from"
    const merchantPatterns = [
      /(?:at|to|from)\s+([A-Z][A-Za-z0-9\s\-\.&]+?)(?:\s+on|\s+dated|\s+for|\.|\s+A\/c|\s+via|$)/i,
      /(?:paid to|sent to)\s+([A-Z][A-Za-z0-9\s\-\.&]+?)(?:\s+on|\s+via|$)/i
    ];

    for (const pattern of merchantPatterns) {
      const merchantMatch = trimmedLine.match(pattern);
      if (merchantMatch) {
        merchantName = merchantMatch[1].trim();
        // Clean up merchant name
        merchantName = merchantName.replace(/\s+/g, ' ');
        break;
      }
    }

    // If no merchant found, try to extract first capitalized word after amount
    if (merchantName === 'Unknown') {
      const afterAmount = trimmedLine.substring(trimmedLine.indexOf(amountMatch[0]) + amountMatch[0].length);
      const capitalizedMatch = afterAmount.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      if (capitalizedMatch) {
        merchantName = capitalizedMatch[1].trim();
      }
    }

    // Extract date
    const dateInfo = extractDateFromSMS(trimmedLine);

    // Categorize transaction
    const categorization = categorizeTransaction(trimmedLine);

    // Determine if it's income or expense
    let transactionType = categorization.type;
    
    // Override based on keywords in SMS
    if (lowerLine.includes('credited') || lowerLine.includes('received') || lowerLine.includes('refund')) {
      transactionType = 'income';
    } else if (lowerLine.includes('debited') || lowerLine.includes('paid') || lowerLine.includes('sent')) {
      if (categorization.type === 'transfer') {
        transactionType = 'transfer';
      } else {
        transactionType = 'expense';
      }
    }

    transactions.push({
      amount,
      merchantName,
      category: categorization.category,
      type: transactionType,
      affectsBudget: categorization.affectsBudget,
      confidence: categorization.confidence,
      rawText: trimmedLine,
      date: dateInfo.date,
      month: dateInfo.month,
      year: dateInfo.year,
      source: 'sms'
    });
  }

  return transactions;
};

export const calculateConfidence = (transaction: ParsedTransaction): number => {
  let confidence = transaction.confidence;

  // Boost confidence if merchant name is not "Unknown"
  if (transaction.merchantName !== 'Unknown') {
    confidence += 0.1;
  }

  // Boost confidence if date was successfully extracted
  const dateInfo = extractDateFromSMS(transaction.rawText);
  if (dateInfo.success) {
    confidence += 0.05;
  }

  // Cap at 0.95
  return Math.min(confidence, 0.95);
};