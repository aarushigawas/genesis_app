// src2/firebase/categoryMemory.ts

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Normalize merchant names so they match reliably
export function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 🔍 Check if user already taught a category
export async function getRememberedCategory(
  merchantName: string
): Promise<{ category: string; confidence: 'high' } | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const merchantKey = normalizeMerchant(merchantName);

  const ref = doc(
    db,
    'userCategoryRules',
    user.uid,
    'rules',
    merchantKey
  );

  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    category: data.category,
    confidence: 'high',
  };
}

// 💾 Save user's manual choice
export async function rememberCategory(
  merchantName: string,
  category: string,
  source: 'csv' | 'sms'
) {
  const user = auth.currentUser;
  if (!user) return;

  const merchantKey = normalizeMerchant(merchantName);

  const ref = doc(
    db,
    'userCategoryRules',
    user.uid,
    'rules',
    merchantKey
  );

  await setDoc(
    ref,
    {
      merchantKey,
      originalName: merchantName,
      category,
      source,
      confidence: 'high',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
