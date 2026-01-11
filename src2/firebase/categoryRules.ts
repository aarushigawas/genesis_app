// src2/firebase/categoryRules.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export async function getCategoryRules(
  userId: string,
  month: string
) {
  const ref = doc(db, 'userCategoryRules', userId, 'months', month);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function setCategoryRules(
  userId: string,
  month: string,
  data: {
    limits: Record<string, number>;
    autoRebalance?: boolean;
  }
) {
  const ref = doc(db, 'userCategoryRules', userId, 'months', month);
  await setDoc(ref, data, { merge: true });
}

export async function updateCategoryLimit(
  userId: string,
  month: string,
  category: string,
  value: number
) {
  const ref = doc(db, 'userCategoryRules', userId, 'months', month);
  await updateDoc(ref, {
    [`limits.${category}`]: value,
  });
}
