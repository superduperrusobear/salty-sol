'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  user: {
    username: string;
    solBalance: number;
    totalBets: number;
    totalWins: number;
  } | null;
  isLoading: boolean;
  refreshUser: () => void;
  placeBet: (playerId: 'player1' | 'player2', amount: number) => Promise<void>;
  handleWin: (playerId: 'player1' | 'player2', amount: number) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  refreshUser: () => {},
  placeBet: async () => {},
  handleWin: () => {}
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user on mount
  useEffect(() => {
    // Try to get existing user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Create new user with starting balance
      const newUser = {
        username: `Player${Math.floor(Math.random() * 9999)}`,
        solBalance: 1000,
        totalBets: 0,
        totalWins: 0
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    }
    setIsLoading(false);
  }, []);

  const saveUser = (userData: UserContextType['user']) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const refreshUser = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  };

  const placeBet = async (playerId: 'player1' | 'player2', amount: number) => {
    if (!user) throw new Error('No user found');
    if (amount > user.solBalance) throw new Error('Insufficient balance');
    if (amount < 1) throw new Error('Minimum bet is 1 SOL');
    if (amount > 100) throw new Error('Maximum bet is 100 SOL');

    const updatedUser = {
      ...user,
      solBalance: user.solBalance - amount,
      totalBets: user.totalBets + 1
    };
    
    saveUser(updatedUser);
    return Promise.resolve();
  };

  const handleWin = (playerId: 'player1' | 'player2', amount: number) => {
    if (!user) return;

    console.log('Processing win:', {
      username: user.username,
      currentBalance: user.solBalance,
      winAmount: amount,
      newBalance: user.solBalance + amount
    });

    const updatedUser = {
      ...user,
      solBalance: user.solBalance + amount,
      totalWins: user.totalWins + 1
    };
    
    // Save immediately
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Reset balance if it gets too low
  useEffect(() => {
    if (user && user.solBalance < 1) {
      const updatedUser = {
        ...user,
        solBalance: 1000,
        totalBets: 0,
        totalWins: 0
      };
      saveUser(updatedUser);
    }
  }, [user?.solBalance]);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser, placeBet, handleWin }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 