'use client';

import { useRouter } from 'next/navigation';

export default function Documentation() {
  const router = useRouter();

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
            Documentation
          </h1>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Getting Started</h2>
              <p className="mb-4">
                Welcome to Salty Sol, the premier crypto battle platform. This documentation will help you understand how to use our platform effectively.
              </p>
              <p>
                Salty Sol allows you to bet on crypto battles between different tokens. The battles are visualized in our arena, and you can place bets on which token you think will win.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">How to Place Bets</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>Create an account or continue as a guest</li>
                <li>Navigate to the Battle Arena</li>
                <li>Select a fighter to bet on</li>
                <li>Enter your bet amount</li>
                <li>Click "Place Bet" to confirm</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Battle Mechanics</h2>
              <p className="mb-4">
                Each battle consists of three phases:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><span className="text-green-400 font-medium">Betting Phase:</span> Place your bets on your chosen fighter</li>
                <li><span className="text-red-400 font-medium">Battle Phase:</span> Watch the fighters battle it out in the arena</li>
                <li><span className="text-yellow-400 font-medium">Payout Phase:</span> Winners receive their payouts based on the betting pool</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
} 