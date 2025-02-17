import React, { useState, useEffect } from 'react';
import { subscribeToRecentBetsHistory } from '../services/firebase';

interface BetHistoryRecord {
  user: string;
  username: string;
  amount: number;
  player: 'player1' | 'player2';
  timestamp: any;
}

export default function RecentBets() {
  const [bets, setBets] = useState<BetHistoryRecord[]>([]);

  useEffect(() => {
    // Subscribe to recent bets
    const unsubscribe = subscribeToRecentBetsHistory(5, (recentBets) => {
      setBets(recentBets);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="recent-bets fixed right-4 top-24 bg-black/80 p-4 rounded-lg border border-[#00FFA3]/30 max-w-sm">
      <h3 className="text-[#00FFA3] text-sm font-bold mb-2">Recent Bets</h3>
      <div className="space-y-2">
        {bets.map((bet, index) => (
          <div 
            key={`${bet.timestamp}-${index}`}
            className="bet-entry text-sm text-white/90 fade-out"
          >
            <span className="text-[#00FFA3]">{bet.username}</span> bet{' '}
            <span className="text-[#00FFA3]">{bet.amount} SOL</span> on{' '}
            <span className={bet.player === 'player1' ? 'text-[#00FFA3]' : 'text-[#03E1FF]'}>
              {bet.player === 'player1' ? 'Player 1' : 'Player 2'}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .bet-entry {
          opacity: 1;
          transition: opacity 1s ease-in-out;
        }

        .bet-entry.fade-out {
          animation: fadeOut 5s forwards;
        }

        @keyframes fadeOut {
          0% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
} 