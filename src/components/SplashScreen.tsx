'use client';

import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { serverTimestamp, set, ref } from 'firebase/database';

interface SplashScreenProps {
  onComplete: (username: string) => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    console.log('Starting user registration...');

    try {
      // Basic validation
      if (!username.trim()) {
        throw new Error('Username is required');
      }
      if (username.length < 3 || username.length > 20) {
        throw new Error('Username must be between 3 and 20 characters');
      }

      // Sign in anonymously first
      const { user: authUser } = await signInAnonymously(auth);
      console.log('User signed in:', authUser.uid);

      // Create user profile
      const userProfile = {
        username: username.trim(),
        createdAt: new Date().toISOString(),
        totalBets: 0,
        totalWins: 0,
        solBalance: 100,
        lastUpdated: serverTimestamp()
      };

      // Create user data first
      await set(ref(db, `users/${authUser.uid}`), userProfile);
      console.log('User profile created');

      await set(ref(db, `usernames/${username.trim()}`), {
        userId: authUser.uid,
        createdAt: userProfile.createdAt,
        totalBets: 0,
        totalWins: 0,
        lastUpdated: serverTimestamp()
      });
      console.log('Username record created');

      // Initialize game data
      try {
        await set(ref(db, 'chat/messages/_initialized'), {
          timestamp: serverTimestamp(),
          description: 'Chat initialized'
        });
        console.log('Chat initialized');

        await set(ref(db, 'currentMatch'), {
          status: 'betting_open',
          startTime: serverTimestamp(),
          endTime: null,
          player1: {
            symbol: 'BONK',
            marketCap: 0,
            priceChange24h: 0,
            lastUpdated: null
          },
          player2: {
            symbol: 'WEN',
            marketCap: 0,
            priceChange24h: 0,
            lastUpdated: null
          },
          bettingPool: {
            player1: 0,
            player2: 0,
            totalPool: 0,
            houseFee: 0.1
          }
        });
        console.log('Current match initialized');

        await Promise.all([
          set(ref(db, 'matchHistory/_initialized'), {
            timestamp: serverTimestamp(),
            status: 'active'
          }),
          set(ref(db, 'betsHistory/_initialized'), {
            timestamp: serverTimestamp(),
            status: 'active'
          })
        ]);
        console.log('History nodes initialized');
      } catch (error) {
        console.warn('Game data initialization failed, but user was created:', error);
        // Don't throw here - we can still proceed if game data init fails
      }

      console.log('Registration complete');
      onComplete(username);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="bg-black/80 p-8 rounded-lg border-2 border-[#00FFA3] shadow-lg shadow-[#00FFA3]/20 max-w-md w-full mx-4">
        <h1 className="text-[#00FFA3] text-3xl font-bold text-center mb-8">
          Welcome to Salty Sol
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="username" 
              className="block text-[#00FFA3] text-sm font-medium mb-2"
            >
              Choose your display name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border-2 border-[#00FFA3]/50 rounded-lg 
                       text-white placeholder-gray-400 focus:outline-none focus:border-[#00FFA3]
                       transition-colors"
              placeholder="Enter your display name"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-[#00FFA3] text-black font-bold rounded-lg
                     hover:bg-[#00FFA3]/90 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting up...' : 'Enter Arena'}
          </button>
        </form>

        <p className="mt-4 text-gray-400 text-sm text-center">
          By entering, you agree to our terms and conditions
        </p>
      </div>
    </div>
  );
} 