'use client';

import React, { FormEvent, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { WalletIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');

  const handleSignIn = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Sign in clicked');
    if (username) {
      console.log('Navigating to /battle');
      try {
        await router.push('/battle');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } else {
      console.log('Please enter a username');
    }
  };

  const handleGuestAccess = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Guest access clicked');
    try {
      await router.push('/battle');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleFormSubmit} className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl p-12 bg-black/80 backdrop-blur-sm border-2 border-white rounded-2xl"
      >
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6 relative h-48">
            <Image
              src="/images/png-clipart-logo-draftkings-brand-font-white-king-of-spades-white-text.png"
              alt="Salty Sol Logo"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <p className="text-white text-lg">Experience the thrill of crypto betting, risk-free</p>
        </div>

        <div className="space-y-16">
          {/* Username Input Section */}
          <div>
            <label htmlFor="username" className="block text-white/80 text-sm font-medium mb-3">
              CHOOSE YOUR USERNAME
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-black border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[#00FFA3] transition-colors text-lg shadow-inner"
            />
          </div>
          
          {/* Battle Arena Button */}
          <div>
            <Link href="/battle" passHref>
              <button 
                type="button"
                onClick={handleSignIn}
                className="w-full py-6 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-bold hover:from-[#00FFA3]/90 hover:to-[#03E1FF]/90 transition-all duration-200 text-xl tracking-wide border-2 border-transparent hover:border-white rounded-xl shadow-xl hover:shadow-[#00FFA3]/20"
              >
                Enter Battle Arena
              </button>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-6 bg-black text-white">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <button 
              type="button"
              className="w-full py-4 border-2 border-white text-white font-semibold hover:bg-white/5 transition-all duration-200 flex items-center justify-center rounded-xl"
            >
              <WalletIcon className="w-5 h-5 mr-2" />
              Connect Wallet
            </button>
            
            <Link href="/battle" passHref>
              <button 
                type="button"
                onClick={handleGuestAccess}
                className="w-full py-4 border-2 border-white text-white font-semibold hover:bg-white/5 transition-all duration-200 rounded-xl"
              >
                Continue as Guest
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="mb-2 text-white">Start with 1000 SOL tokens</p>
          <p className="text-white font-bold tracking-[0.15em] text-lg">IN SOL WE TRUST</p>
        </div>
      </motion.div>
    </form>
  );
} 