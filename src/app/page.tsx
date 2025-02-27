'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import toast from 'react-hot-toast';
import { default as NextImage } from 'next/image';

export default function Home() {
  const [username, setUsername] = useState('');
  const { login } = useUser();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent, asGuest: boolean = false) => {
    e.preventDefault();
    
    if (!asGuest && (!username || username.trim().length < 3)) {
      toast.error('Username must be at least 3 characters long!');
      return;
    }

    const finalUsername = asGuest ? `Guest_${Math.random().toString(36).slice(2, 8)}` : username;
    login(finalUsername, asGuest);
    toast.success(`Welcome ${finalUsername}!`);
    router.push('/battle');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-black to-[#0a0b0f]">
      <div className="container max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4 relative h-40">
            <NextImage
              src="/images/png-clipart-logo-draftkings-brand-font-white-king-of-spades-white-text.png"
              alt="Salty Sol Logo"
              width={300}
              height={160}
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Welcome to Salty Sol
          </h1>
          <p className="text-gray-400 text-lg">
            Experience the thrill of crypto battles
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                minLength={3}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Enter Battle Arena
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={(e) => handleLogin(e, true)}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Continue as Guest
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            By entering, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </main>
  );
} 