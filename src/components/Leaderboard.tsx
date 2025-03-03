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

// Static leaderboard data with the specified names
const staticLeaderboardData: Record<string, LeaderboardEntry[]> = {
  daily: [
    { rank: 1, username: 'ImTheDEV', wins: 41, losses: 19, totalBets: 60, profit: 2450.75 },
    { rank: 2, username: 'QvixyX', wins: 32, losses: 15, totalBets: 47, profit: 1875.50 },
    { rank: 3, username: 'epeooi', wins: 28, losses: 22, totalBets: 50, profit: 1250.25 },
    { rank: 4, username: 'romaniii', wins: 25, losses: 20, totalBets: 45, profit: 980.80 }
  ],
  weekly: [
    { rank: 1, username: 'ImTheDEV', wins: 187, losses: 93, totalBets: 280, profit: 12450.75 },
    { rank: 2, username: 'QvixyX', wins: 165, losses: 85, totalBets: 250, profit: 9875.50 },
    { rank: 3, username: 'romaniii', wins: 142, losses: 108, totalBets: 250, profit: 7250.25 },
    { rank: 4, username: 'epeooi', wins: 130, losses: 110, totalBets: 240, profit: 5980.80 }
  ],
  allTime: [
    { rank: 1, username: 'ImTheDEV', wins: 1241, losses: 759, totalBets: 2000, profit: 87450.75 },
    { rank: 2, username: 'romaniii', wins: 1050, losses: 850, totalBets: 1900, profit: 65875.50 },
    { rank: 3, username: 'QvixyX', wins: 980, losses: 820, totalBets: 1800, profit: 52250.25 },
    { rank: 4, username: 'epeooi', wins: 870, losses: 730, totalBets: 1600, profit: 41980.80 }
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
            
            // Calculate new profit based on win/loss ratio
            const profitIncrement = winIncrement * (50 + Math.random() * 20) - lossIncrement * (40 + Math.random() * 15);
            
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
    <div className="rounded-lg border border-gray-800 bg-black">
      <div className="border-b border-gray-800 p-2">
        <h3 className="text-sm font-bold text-white">Leaderboard</h3>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 py-1.5 text-xs font-medium ${
            activeTab === 'daily' 
              ? 'border-b-2 border-cyan-500 text-cyan-400' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('daily')}
        >
          Daily
        </button>
        <button
          className={`flex-1 py-1.5 text-xs font-medium ${
            activeTab === 'weekly' 
              ? 'border-b-2 border-cyan-500 text-cyan-400' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly
        </button>
        <button
          className={`flex-1 py-1.5 text-xs font-medium ${
            activeTab === 'allTime' 
              ? 'border-b-2 border-cyan-500 text-cyan-400' 
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('allTime')}
        >
          All Time
        </button>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 border-b border-gray-800 px-2 py-1.5 text-xs font-medium text-gray-400">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Player</div>
        <div className="col-span-2 text-center">W/L</div>
        <div className="col-span-2 text-center">Bets</div>
        <div className="col-span-3 text-right">Profit</div>
      </div>
      
      {/* Table Body */}
      <div className="max-h-[200px] overflow-y-auto">
        {leaderboardData[activeTab].map((entry) => (
          <div 
            key={entry.rank} 
            className="grid grid-cols-12 border-b border-gray-800 px-2 py-1.5 text-xs hover:bg-gray-900"
          >
            <div className="col-span-1 font-medium text-gray-500">{entry.rank}</div>
            <div className="col-span-4 font-medium text-white">{entry.username}</div>
            <div className="col-span-2 text-center">
              <span className="text-green-400">{entry.wins}</span>
              <span className="text-gray-500">/</span>
              <span className="text-red-400">{entry.losses}</span>
            </div>
            <div className="col-span-2 text-center text-gray-400">{entry.totalBets}</div>
            <div className="col-span-3 text-right font-mono font-medium text-green-400">
              +{entry.profit.toFixed(2)} SOL
            </div>
          </div>
        ))}
      </div>
      
      {/* View All Link */}
      <div className="border-t border-gray-800 p-2 text-center">
        <button className="text-xs text-cyan-400 hover:text-cyan-300">
          View Full Leaderboard
        </button>
      </div>
    </div>
  );
}; 