'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Guides() {
  const router = useRouter();
  const [activeGuide, setActiveGuide] = useState('beginner');

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#0a0b0f] p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex items-center">
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

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
            Guides
          </h1>

          <div className="mb-8 border-b border-gray-800">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveGuide('beginner')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeGuide === 'beginner'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Beginner's Guide
              </button>
              <button
                onClick={() => setActiveGuide('betting')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeGuide === 'betting'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Betting Strategies
              </button>
              <button
                onClick={() => setActiveGuide('advanced')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeGuide === 'advanced'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Advanced Tips
              </button>
            </div>
          </div>

          <div className="text-gray-300">
            {activeGuide === 'beginner' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Beginner's Guide to Salty Sol</h2>
                
                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Getting Started</h3>
                  <p className="mb-4">
                    Welcome to Salty Sol! This guide will help you get started with our crypto battle platform. 
                    If you're new to crypto betting, don't worry - we'll walk you through everything you need to know.
                  </p>
                  <p>
                    The basic concept is simple: two crypto tokens battle against each other, and you bet on which one will win.
                    The odds are determined by the total amount bet on each token, and winners share the pot.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Creating Your Account</h3>
                  <p className="mb-4">
                    To get started, you can either create an account or continue as a guest. Creating an account allows you to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>Track your betting history</li>
                    <li>Appear on the leaderboard</li>
                    <li>Participate in special events</li>
                    <li>Chat with other players</li>
                  </ul>
                  <p>
                    To create an account, simply enter a username on the home page and click "Enter Battle Arena".
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Your First Bet</h3>
                  <p className="mb-4">
                    Once you're in the Battle Arena, you'll see the current battle displayed in the center. 
                    To place a bet:
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Select which fighter you want to bet on</li>
                    <li>Enter your bet amount or use the quick bet buttons</li>
                    <li>Review the potential payout</li>
                    <li>Click "Place Bet" to confirm</li>
                  </ol>
                </section>
              </div>
            )}

            {activeGuide === 'betting' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Betting Strategies</h2>
                
                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Understanding the Odds</h3>
                  <p className="mb-4">
                    In Salty Sol, the odds are determined by the total amount bet on each fighter. 
                    The less money bet on a fighter, the higher the potential payout if that fighter wins.
                  </p>
                  <p>
                    This creates an interesting dynamic where you need to balance the likelihood of winning with the potential payout.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Value Betting</h3>
                  <p className="mb-4">
                    Value betting is about finding opportunities where the potential payout is higher than it should be based on the actual chances of winning.
                  </p>
                  <p>
                    Look for fighters that you believe have a better chance of winning than what the current betting pool suggests.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Bankroll Management</h3>
                  <p className="mb-4">
                    One of the most important aspects of successful betting is managing your bankroll effectively.
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Never bet more than you can afford to lose</li>
                    <li>Consider betting a consistent percentage of your bankroll (e.g., 5-10%)</li>
                    <li>Avoid chasing losses with larger bets</li>
                    <li>Take profits regularly</li>
                  </ul>
                </section>
              </div>
            )}

            {activeGuide === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white mb-4">Advanced Tips & Tricks</h2>
                
                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Timing Your Bets</h3>
                  <p className="mb-4">
                    The timing of your bets can significantly impact your potential returns. 
                    Betting early gives you more time to assess the odds, but betting later gives you more information about the betting pool.
                  </p>
                  <p>
                    Consider waiting until just before the betting phase ends to place your bets, as this gives you the most information about the current odds.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Reading the Chat</h3>
                  <p className="mb-4">
                    The live chat can provide valuable insights into what other players are thinking. 
                    Pay attention to which fighters are being discussed and what strategies other players are using.
                  </p>
                  <p>
                    However, be cautious of misinformation or attempts to manipulate the betting pool.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-medium text-cyan-400 mb-3">Pattern Recognition</h3>
                  <p className="mb-4">
                    Over time, you may notice patterns in how battles play out. Some fighters might perform better in certain arenas or against specific opponents.
                  </p>
                  <p>
                    Keep track of your observations and use them to inform your future bets. The more data you collect, the better your predictions will become.
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 