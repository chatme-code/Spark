import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  type: 'topup' | 'withdraw' | 'spent' | 'earned';
  amount: number;
  description: string;
  createdAt: string;
}

interface WalletContextType {
  coins: number;
  transactions: Transaction[];
  topUp: (amount: number, description: string) => Promise<void>;
  earn: (amount: number, description: string) => Promise<void>;
  spend: (amount: number, description: string) => Promise<boolean>;
  withdraw: (amount: number, description: string) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | null>(null);
const WALLET_KEY = '@spark_wallet';
const TRANSACTIONS_KEY = '@spark_transactions';
const INITIAL_COINS = 200;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const [coinsData, txData] = await Promise.all([
        AsyncStorage.getItem(WALLET_KEY),
        AsyncStorage.getItem(TRANSACTIONS_KEY),
      ]);
      if (coinsData !== null) setCoins(parseInt(coinsData));
      if (txData) setTransactions(JSON.parse(txData));
    } catch {}
  };

  const saveWallet = async (newCoins: number, newTxs: Transaction[]) => {
    await AsyncStorage.setItem(WALLET_KEY, newCoins.toString());
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTxs));
  };

  const addTransaction = (
    type: Transaction['type'],
    amount: number,
    description: string,
    currentTxs: Transaction[]
  ): Transaction[] => {
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      type,
      amount,
      description,
      createdAt: new Date().toISOString(),
    };
    return [tx, ...currentTxs];
  };

  const topUp = async (amount: number, description: string) => {
    const newCoins = coins + amount;
    const newTxs = addTransaction('topup', amount, description, transactions);
    setCoins(newCoins);
    setTransactions(newTxs);
    await saveWallet(newCoins, newTxs);
  };

  const earn = async (amount: number, description: string) => {
    const newCoins = coins + amount;
    const newTxs = addTransaction('earned', amount, description, transactions);
    setCoins(newCoins);
    setTransactions(newTxs);
    await saveWallet(newCoins, newTxs);
  };

  const spend = async (amount: number, description: string): Promise<boolean> => {
    if (coins < amount) return false;
    const newCoins = coins - amount;
    const newTxs = addTransaction('spent', amount, description, transactions);
    setCoins(newCoins);
    setTransactions(newTxs);
    await saveWallet(newCoins, newTxs);
    return true;
  };

  const withdraw = async (amount: number, description: string): Promise<boolean> => {
    if (coins < amount) return false;
    const newCoins = coins - amount;
    const newTxs = addTransaction('withdraw', amount, description, transactions);
    setCoins(newCoins);
    setTransactions(newTxs);
    await saveWallet(newCoins, newTxs);
    return true;
  };

  return (
    <WalletContext.Provider value={{ coins, transactions, topUp, earn, spend, withdraw }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
