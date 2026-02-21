import { doc, updateDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from './firebaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  balance: number;
}

export interface Transaction {
  id: string;
  senderId: string;
  receiverName: string;
  receiverAccount: string;
  receiverTransit: string;   // <-- new
  receiverBank: string;      // <-- new
  amount: number;
  date: string;
  type: 'transfer' | 'deposit' | 'withdrawal';
}

// Update user balance
export const updateUser = async (updatedUser: User): Promise<void> => {
  try {
    const { id, ...updateData } = updatedUser;
    await updateDoc(doc(db, 'users', id), updateData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Add transaction
export const addTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    await addDoc(collection(db, 'transactions'), transaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Get user transactions
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('senderId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Transaction);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};