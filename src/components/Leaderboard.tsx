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

export const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'allTime'>('daily');
  const { battleState } = useBattle();
  const [leaderboardData, setLeaderboardData] = useState<Record<string, LeaderboardEntry[]>>({
    daily: [],
    weekly: [],
    allTime: []
  });
  
  // Generate leaderboard data from fake gamblers
  useEffect(() => {
    // Generate random stats for each fake gambler
    const generateLeaderboardData = () => {
      const fakeGamblerUsernames = battleState.fakeGamblers.usernames;
      
      // Create entries with random stats
      const entries = fakeGamblerUsernames.map((username, index) => {
        // Generate random stats that look realistic
        const totalBets = Math.floor(Math.random() * 50) + 10;
        const winRate = Math.random() * 0.3 + 0.4; // Win rate between 40% and 70%
        const wins = Math.floor(totalBets * winRate);
        const losses = totalBets - wins;
        
        // Generate profit based on bet size and win rate
        // Higher ranked players have higher profits
        const baseProfit = (20 - index) * 100; // Higher rank = higher base profit
        const randomFactor = Math.random() * 0.5 + 0.75; // Random factor between 0.75 and 1.25
        const profit = baseProfit * randomFactor;
        
        return {
          username,
          wins,
          losses,
          totalBets,
          profit
        };
      });
      
      // Sort by profit and assign ranks
      const sortedEntries = entries.sort((a, b) => b.profit - a.profit)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
      
      // Take top 10 for each time period
      const dailyEntries = sortedEntries.slice(0, 10);
      
      // Weekly has slightly different stats
      const weeklyEntries = sortedEntries.map(entry => ({
        ...entry,
        wins: entry.wins * 5 + Math.floor(Math.random() * 10),
        losses: entry.losses * 5 + Math.floor(Math.random() * 10),
        totalBets: entry.totalBets * 5 + Math.floor(Math.random() * 20),
        profit: entry.profit * 4 + Math.random() * 1000
      })).sort((a, b) => b.profit - a.profit)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        })).slice(0, 10);
      
      // All time has much higher stats
      const allTimeEntries = sortedEntries.map(entry => ({
        ...entry,
        wins: entry.wins * 25 + Math.floor(Math.random() * 50),
        losses: entry.losses * 25 + Math.floor(Math.random() * 50),
        totalBets: entry.totalBets * 25 + Math.floor(Math.random() * 100),
        profit: entry.profit * 20 + Math.random() * 5000
      })).sort((a, b) => b.profit - a.profit)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        })).slice(0, 10);
      
      return {
        daily: dailyEntries,
        weekly: weeklyEntries,
        allTime: allTimeEntries
      };
    };
    
    setLeaderboardData(generateLeaderboardData());
  }, [battleState.fakeGamblers.usernames]);

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