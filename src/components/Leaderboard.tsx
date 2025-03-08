'use client';

import { useState, useEffect } from 'react';
import { useBattle } from '@/contexts/BattleContext';

type LeaderboardEntry = {
  rank: number;
  username: string;
  wins: number;
  losses: number;
  totalBets: number;
  profit: number;
};

// Static leaderboard data with adjusted profit values based on specified ceilings
const staticLeaderboardData: Record<string, LeaderboardEntry[]> = {
  daily: [
    { rank: 1, username: 'ImTheDEV', wins: 41, losses: 19, totalBets: 60, profit: 26.00 },
    { rank: 2, username: 'QvixyX', wins: 32, losses: 15, totalBets: 47, profit: 22.50 },
    { rank: 3, username: 'epeooi', wins: 28, losses: 22, totalBets: 50, profit: 18.25 },
    { rank: 4, username: 'romaniii', wins: 25, losses: 20, totalBets: 45, profit: 15.80 },
    { rank: 5, username: 'Pl0xRift', wins: 22, losses: 18, totalBets: 40, profit: 12.45 },
    { rank: 6, username: 'Z0mb1Xx', wins: 20, losses: 15, totalBets: 35, profit: 9.20 },
    { rank: 7, username: 'WubD0nk', wins: 18, losses: 17, totalBets: 35, profit: 7.75 },
    { rank: 8, username: 'FuzzEgg', wins: 15, losses: 15, totalBets: 30, profit: 5.30 }
  ],
  weekly: [
    { rank: 1, username: 'ImTheDEV', wins: 187, losses: 93, totalBets: 280, profit: 132.00 },
    { rank: 2, username: 'QvixyX', wins: 165, losses: 85, totalBets: 250, profit: 115.50 },
    { rank: 3, username: 'romaniii', wins: 142, losses: 108, totalBets: 250, profit: 98.25 },
    { rank: 4, username: 'epeooi', wins: 130, losses: 110, totalBets: 240, profit: 82.80 },
    { rank: 5, username: 'Sn1zzyQ', wins: 125, losses: 95, totalBets: 220, profit: 68.65 },
    { rank: 6, username: 'VxzyDub', wins: 115, losses: 85, totalBets: 200, profit: 54.30 },
    { rank: 7, username: 'KriptZx', wins: 105, losses: 95, totalBets: 200, profit: 42.75 },
    { rank: 8, username: 'Fl1x0r', wins: 95, losses: 85, totalBets: 180, profit: 32.40 }
  ],
  allTime: [
    { rank: 1, username: 'ImTheDEV', wins: 1241, losses: 759, totalBets: 2000, profit: 220.00 },
    { rank: 2, username: 'romaniii', wins: 1050, losses: 850, totalBets: 1900, profit: 192.50 },
    { rank: 3, username: 'QvixyX', wins: 980, losses: 820, totalBets: 1800, profit: 168.25 },
    { rank: 4, username: 'epeooi', wins: 870, losses: 730, totalBets: 1600, profit: 142.80 },
    { rank: 5, username: 'J3gXyW0', wins: 820, losses: 680, totalBets: 1500, profit: 118.65 },
    { rank: 6, username: 'Ploxify', wins: 780, losses: 620, totalBets: 1400, profit: 96.30 },
    { rank: 7, username: 'XymonX', wins: 740, losses: 660, totalBets: 1400, profit: 78.75 },
    { rank: 8, username: 'Yh3qJax', wins: 700, losses: 600, totalBets: 1300, profit: 62.40 }
  ]
};

export const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'allTime'>('daily');
  const [leaderboardData, setLeaderboardData] = useState<Record<string, LeaderboardEntry[]>>(staticLeaderboardData);
  
  // Simulate gradual updates to the leaderboard data
  useEffect(() => {
    // Update leaderboard data every 30 seconds with small increments
    const interval = setInterval(() => {
      setLeaderboardData(prevData => {
        const newData = { ...prevData };
        
        // Update each time period with small increments
        Object.keys(newData).forEach(period => {
          newData[period as keyof typeof newData] = newData[period as keyof typeof newData].map(entry => {
            // Small random increments to wins and losses
            const winIncrement = Math.random() > 0.7 ? 1 : 0;
            const lossIncrement = Math.random() > 0.7 ? 1 : 0;
            
            const wins = entry.wins + winIncrement;
            const losses = entry.losses + lossIncrement;
            const totalBets = wins + losses;
            
            // Calculate new profit based on win/loss ratio (scaled amounts)
            let profitIncrement = 0;
            if (period === 'daily') {
              profitIncrement = winIncrement * (0.5 + Math.random() * 0.2) - lossIncrement * (0.4 + Math.random() * 0.15);
            } else if (period === 'weekly') {
              profitIncrement = winIncrement * (1.2 + Math.random() * 0.5) - lossIncrement * (1.0 + Math.random() * 0.3);
            } else { // allTime
              profitIncrement = winIncrement * (1.8 + Math.random() * 0.7) - lossIncrement * (1.5 + Math.random() * 0.5);
            }
            
            return {
              ...entry,
              wins,
              losses,
              totalBets,
              profit: entry.profit + profitIncrement
            };
          });
        });
        
        return newData;
      });
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg bg-black overflow-hidden">
      {/* Tabs with glass effect */}
      <div className="flex border-b border-gray-800 bg-gradient-to-r from-blue-900/10 to-black">
        <button
          className={`flex-1 py-1 md:py-2 text-xs font-medium transition-all ${
            activeTab === 'daily' 
              ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-900/20' 
              : 'text-gray-400 hover:text-white hover:bg-blue-900/10'
          }`}
          onClick={() => setActiveTab('daily')}
        >
          Daily
        </button>
        <button
          className={`flex-1 py-1 md:py-2 text-xs font-medium transition-all ${
            activeTab === 'weekly' 
              ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-900/20' 
              : 'text-gray-400 hover:text-white hover:bg-blue-900/10'
          }`}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly
        </button>
        <button
          className={`flex-1 py-1 md:py-2 text-xs font-medium transition-all ${
            activeTab === 'allTime' 
              ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-900/20' 
              : 'text-gray-400 hover:text-white hover:bg-blue-900/10'
          }`}
          onClick={() => setActiveTab('allTime')}
        >
          All Time
        </button>
      </div>
      
      {/* Table Header with glass effect */}
      <div className="grid grid-cols-12 border-b border-gray-800 px-2 md:px-3 py-1 md:py-2 text-xs font-medium text-gray-400 bg-gradient-to-r from-blue-900/5 to-black">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Player</div>
        <div className="col-span-2 text-center">W/L</div>
        <div className="col-span-2 text-center">Bets</div>
        <div className="col-span-3 text-right">Profit</div>
      </div>
      
      {/* Table Body with hover effects */}
      <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-black">
        {leaderboardData[activeTab].map((entry, index) => (
          <div 
            key={entry.rank} 
            className={`grid grid-cols-12 border-b border-gray-800 px-2 md:px-3 py-1 md:py-2 text-xs transition-colors ${
              index % 2 === 0 ? 'bg-black' : 'bg-gray-900/30'
            } hover:bg-blue-900/20`}
          >
            {/* Rank with medal for top 3 */}
            <div className="col-span-1 font-medium flex items-center">
              {entry.rank <= 3 ? (
                <span className={`flex items-center justify-center w-4 md:w-5 h-4 md:h-5 rounded-full ${
                  entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                  entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                  'bg-amber-700/20 text-amber-700'
                }`}>
                  {entry.rank}
                </span>
              ) : (
                <span className="text-gray-500">{entry.rank}</span>
              )}
            </div>
            
            {/* Username */}
            <div className="col-span-4 font-medium text-white">{entry.username}</div>
            
            {/* Win/Loss record */}
            <div className="col-span-2 text-center">
              <span className="text-green-400">{entry.wins}</span>
              <span className="text-gray-500">/</span>
              <span className="text-red-400">{entry.losses}</span>
            </div>
            
            {/* Total bets */}
            <div className="col-span-2 text-center text-gray-400">{entry.totalBets}</div>
            
            {/* Profit with gradient text for top performers */}
            <div className={`col-span-3 text-right font-mono text-xs md:text-sm font-medium ${
              entry.rank <= 3 
                ? 'bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent' 
                : 'text-green-400'
            }`}>
              +{entry.profit.toFixed(2)} SOL
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer with reflective effect */}
      <div className="border-t border-gray-800 p-2 md:p-3 text-center bg-gradient-to-r from-black to-blue-900/20">
        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-medium">
            Displaying Elite Performers • Private Access Only
          </span>
        </div>
      </div>
    </div>
  );
}; 