'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import toast from 'react-hot-toast';

export default function Home() {
  const [username, setUsername] = useState('');
  const [currentFeature, setCurrentFeature] = useState(0);
  const { login } = useUser();
  const router = useRouter();

  const features = [
    "Solana-Powered Betting",
    "Live Market-Driven Odds",
    "On-Chain Transparency",
    "Referral Rewards System",
    "Dynamic Betting Pools",
    "Instant Payouts",
    "24/7 Live Betting"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(timer);
  }, []);

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

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black to-[#0a0b0f]">
      {/* Top section with sign up button */}
      <div className="w-full flex justify-end">
        <button
          onClick={() => navigateTo('/signup')}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium hover:opacity-90 transition-opacity shadow-lg"
        >
          Sign Up for Private Access
        </button>
      </div>
      
      {/* Main content */}
      <div className="container max-w-sm md:max-w-lg mx-auto">
        <div className="text-center mb-6 md:mb-10">
          <div className="flex justify-center mb-4 relative h-32 md:h-48">
            <img
              src="/images/png-clipart-logo-draftkings-brand-font-white-king-of-spades-white-text.png"
              alt="Salty Sol Logo"
              className="h-full object-contain"
            />
          </div>
          
          {/* Feature Carousel */}
          <div className="relative h-12 md:h-16 mb-4 md:mb-6">
            {features.map((feature, index) => (
              <div
                key={feature}
                className={`absolute w-full transition-all duration-500 transform ${
                  index === currentFeature
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                      className="text-green-500"
                    />
                  </svg>
                  {feature}
                </h2>
              </div>
            ))}
          </div>

          <p className="text-gray-400 text-base md:text-lg">
            Secure Early Access to Our Private Betting Platform.
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          <form onSubmit={(e) => handleLogin(e)} className="space-y-3 md:space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-900/50 border border-gray-800 rounded-lg text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                minLength={3}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 md:py-3 rounded-lg text-sm md:text-base font-medium hover:opacity-90 transition-opacity"
            >
              Start Demo Mode
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={(e) => handleLogin(e, true)}
              className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="w-full mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-800">
        <div className="container mx-auto max-w-sm md:max-w-lg text-center">
          {/* Guide Links - Single line with icons */}
          <div className="flex justify-center items-center gap-3 md:gap-6 pt-2 flex-wrap">
            <button 
              onClick={() => window.open('https://docs.saltysol.xyz/', '_blank')}
              className="text-blue-400 hover:text-blue-300 underline text-xs md:text-base font-medium flex items-center whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documentation
            </button>
            <button 
              onClick={() => navigateTo('/roadmap')}
              className="text-blue-400 hover:text-blue-300 underline text-xs md:text-base font-medium flex items-center whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Roadmap
            </button>
            <button 
              onClick={() => navigateTo('/faq')}
              className="text-blue-400 hover:text-blue-300 underline text-xs md:text-base font-medium flex items-center whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              FAQ
            </button>
            <button 
              onClick={() => navigateTo('/referrals')}
              className="text-blue-400 hover:text-blue-300 underline text-xs md:text-base font-medium flex items-center whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Referrals
            </button>
          </div>
          
          {/* Copyright notice */}
          <p className="text-center text-xs text-gray-600 mt-4 md:mt-6">
            © 2025 Salty Sol. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
} 