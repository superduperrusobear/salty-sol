'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '@/services/userService';

export interface UserContextType {
  username: string | null;
  isGuest: boolean;
  solBalance: number;
  login: (username: string, asGuest?: boolean) => Promise<void>;
  logout: () => void;
  setUsername: (username: string | null) => void;
  setIsGuest: (isGuest: boolean) => void;
  setSolBalance: (balance: number) => void;
}

const UserContext = createContext<UserContextType>({
  username: null,
  isGuest: false,
  solBalance: 0,
  login: async () => {},
  logout: () => {},
  setUsername: () => {},
  setIsGuest: () => {},
  setSolBalance: () => {}
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('salty_sol_username');
    }
    return null;
  });
  
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('salty_sol_isGuest') === 'true';
    }
    return false;
  });
  
  const [solBalance, setSolBalance] = useState(0);

  // Custom setUsername function that also updates localStorage
  const setUsername = (newUsername: string | null) => {
    setUsernameState(newUsername);
    
    if (typeof window !== 'undefined') {
      if (newUsername) {
        localStorage.setItem('salty_sol_username', newUsername);
      } else {
        localStorage.removeItem('salty_sol_username');
      }
    }
  };

  const login = async (newUsername: string, asGuest: boolean = false) => {
    try {
      setUsername(newUsername);
      setIsGuest(asGuest);
      setSolBalance(5); // Set initial balance to 5 SOL for all users
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('salty_sol_isGuest', String(asGuest));
      }

      await userService.storeUserData(newUsername, asGuest);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    setUsername(null);
    setIsGuest(false);
    setSolBalance(0);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('salty_sol_username');
      localStorage.removeItem('salty_sol_isGuest');
    }
  };

  // Load initial balance if user is logged in
  useEffect(() => {
    if (username) {
      setSolBalance(5); // Set initial balance to 5 SOL
    }
  }, [username]);

  return (
    <UserContext.Provider value={{ 
      username, 
      isGuest, 
      solBalance,
      login,
      logout,
      setUsername, 
      setIsGuest,
      setSolBalance
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 