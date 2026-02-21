import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import { v4 as uuidv4 } from 'uuid';

export const INITIAL_BALANCE = 0;

export interface AppUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  balance: number;
}

// Helper functions for card generation
const generateCardNumber = (): string => {
  return '4' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
};

const generateExpiryDate = (): string => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 5);
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
};

const generateCVV = (): string => {
  return String(Math.floor(Math.random() * 9000) + 1000).slice(0, 3);
};

export const isAuthenticated = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(!!user);
    });
  });
};

export const getCurrentUserId = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user?.uid || null);
    });
  });
};

export const getUserById = async (userId: string): Promise<AppUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('User not found');
      return null;
    }
    return userDoc.data() as AppUser;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    // Create user in Firebase Auth (handles email uniqueness automatically)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Create user document in Firestore
    const newUser: AppUser = {
      id: userId,
      name,
      email,
      createdAt: new Date().toISOString(),
      cardNumber: generateCardNumber(),
      expiryDate: generateExpiryDate(),
      cvv: generateCVV(),
      balance: INITIAL_BALANCE,
    };

    await setDoc(doc(db, 'users', userId), newUser);
    return { success: true, userId };
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific Firebase Auth error codes
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Email already in use' };
    }
    // You can add more specific error handling if needed (e.g., weak password)
    return { success: false, error: error.message || 'Registration failed' };
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, userId: userCredential.user.uid };
  } catch (error: any) {
    return { success: false, error: 'Invalid email or password' };
  }
};

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
  status?:  'pending' | 'failed';
}

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

export const initAuth = () => {
  // Initialize auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User authenticated:', user.uid);
    }
  });
};