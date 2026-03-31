import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db, isFirebaseConfigured } from '../../../database/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import toast from 'react-hot-toast';
import {
  clearStoredDemoUser,
  createDemoUser,
  getStoredDemoUser,
  setStoredDemoUser,
} from '../lib/demoStorage';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signupWithEmail: (_email: string, _pass: string) => Promise<void>;
  loginWithEmail: (_email: string, _pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      const demoUser = getStoredDemoUser();
      setCurrentUser((demoUser as User) || null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const saveUserToDb = async (user: User) => {
    if (!user || !db || !isFirebaseConfigured) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Eco Explorer',
          photoURL: user.photoURL || '',
          impactScore: 0,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error saving user to DB:', err);
    }
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider || !isFirebaseConfigured) {
      const demoUser = createDemoUser();
      setStoredDemoUser(demoUser);
      setCurrentUser(demoUser as User);
      toast.success('Demo mode enabled');
      return;
    }

    try {
      const res = await signInWithPopup(auth, googleProvider);
      await saveUserToDb(res.user);
      toast.success('Successfully logged in with Google!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (!auth || !isFirebaseConfigured) {
      const demoUser = createDemoUser(email, email.split('@')[0] || 'Demo Explorer');
      setStoredDemoUser(demoUser);
      setCurrentUser(demoUser as User);
      toast.success('Demo account created');
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await saveUserToDb(res.user);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth || !isFirebaseConfigured) {
      const demoUser = createDemoUser(email, email.split('@')[0] || 'Demo Explorer');
      setStoredDemoUser(demoUser);
      setCurrentUser(demoUser as User);
      toast.success('Signed in using demo mode');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth || !isFirebaseConfigured) {
      clearStoredDemoUser();
      setCurrentUser(null);
      toast.success('Exited demo mode');
      return;
    }

    try {
      await firebaseSignOut(auth);
      toast.success('Successfully logged out');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signOut,
    signupWithEmail,
    loginWithEmail,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
