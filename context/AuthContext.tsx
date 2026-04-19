import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Lifestyle {
  smoking?: string;
  drinking?: string;
  workout?: string;
  education?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  lookingFor: string;
  bio: string;
  photos: string[];
  interests: string[];
  location: string;
  verified: boolean;
  kycDone: boolean;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetGender?: string;
  maxDistance?: number;
  lifestyle?: Lifestyle;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  completeKyc: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = '@spark_auth_user';
const AUTH_USERS_KEY = '@spark_auth_users';

interface StoredAccount {
  user: UserProfile;
  password: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (u: UserProfile) => {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  };

  const loadAccounts = async () => {
    const stored = await AsyncStorage.getItem(AUTH_USERS_KEY);
    return stored ? (JSON.parse(stored) as StoredAccount[]) : [];
  };

  const saveAccounts = async (accounts: StoredAccount[]) => {
    await AsyncStorage.setItem(AUTH_USERS_KEY, JSON.stringify(accounts));
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = await loadAccounts();
    const account = accounts.find((item) => item.user.email.toLowerCase() === normalizedEmail);

    if (account) {
      if (account.password !== password) {
        throw new Error('Incorrect password');
      }
      await saveUser(account.user);
      return;
    }

    const stored = await AsyncStorage.getItem(AUTH_KEY);
    if (stored) {
      const u = JSON.parse(stored) as UserProfile;
      if (u.email.toLowerCase() === normalizedEmail) {
        setUser(u);
        return;
      }
    }

    throw new Error('Account not found. Please create an account first.');
  };

  const register = async (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = await loadAccounts();
    const exists = accounts.some((item) => item.user.email.toLowerCase() === normalizedEmail);

    if (exists) {
      throw new Error('An account with this email already exists');
    }

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      email: normalizedEmail,
      age: 25,
      gender: '',
      lookingFor: '',
      bio: '',
      photos: [],
      interests: [],
      location: 'New York',
      verified: false,
      kycDone: false,
    };
    await saveAccounts([...accounts, { user: newUser, password }]);
    await saveUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    await saveUser(updated);
  };

  const completeKyc = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data, kycDone: true };
    const accounts = await loadAccounts();
    const updatedAccounts = accounts.map((acc) =>
      acc.user.id === user.id ? { ...acc, user: updated } : acc
    );
    await saveAccounts(updatedAccounts);
    await saveUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, completeKyc }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
