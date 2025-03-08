'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Referrals() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referralCode.trim()) {
      setError('Please enter a referral code');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    // Simulate API call to validate referral code
    setTimeout(() => {
      // Always show that the referral code is invalid
      setError('Invalid referral code. Please check and try again.');
      setIsSubmitting(false);
    }, 1500);
  };

  const redirectToDocs = () => {
    window.open('https://docs.saltysol.xyz/', '_blank');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#0a0b0f] p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Enter Referral Code
            </h1>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Exclusive Benefits
            </div>
          </div>

          <div className="space-y-8 text-gray-300">
            <section>
              <p className="text-gray-400 mb-6">
                Enter a referral code you've received to unlock exclusive benefits on Salty Sol. 
                Using a referral code gives you access to reduced fees and special promotions.
              </p>
              
              <form onSubmit={handleReferralSubmit} className="mb-8">
                <div className="mb-4">
                  <label htmlFor="referralCode" className="block text-sm font-medium text-gray-300 mb-2">
                    Referral Code
                  </label>
                  <input
                    type="text"
                    id="referralCode"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter your referral code (e.g., SALTY123)"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Apply Referral Code'
                  )}
                </button>
              </form>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Referral Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5 backdrop-blur-sm">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Tiered Bonuses</h3>
                  <p className="text-gray-400">
                    The more referrals you bring, the higher your reward multiplier.
                  </p>
                </div>
                
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5 backdrop-blur-sm">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Instant Payouts</h3>
                  <p className="text-gray-400">
                    No waiting periods—referral earnings are automatically distributed.
                  </p>
                </div>
                
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-5 backdrop-blur-sm">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Referee Discounts</h3>
                  <p className="text-gray-400">
                    Users signing up through a referral get reduced betting fees.
                  </p>
                </div>
              </div>
            </section>

            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/50 rounded-lg p-6 mt-8">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Want to learn more?</h3>
                  <p className="text-gray-300 mb-4">
                    For complete details about our referral program, including tier requirements, payout structures, and special promotions, visit our documentation.
                  </p>
                  <button 
                    onClick={redirectToDocs}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded transition-colors inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Documentation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 