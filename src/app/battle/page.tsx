'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  EllipsisHorizontalIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  WalletIcon,
  TrophyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { 
  subscribeToCurrentBattle,
  subscribeToRecentBets,
  subscribeToBattleHistory,
  subscribeToUserProfile
} from '@/services/firebase';
import { useUser } from '@/contexts/UserContext';
import ChatBox from '@/components/ChatBox';
import { FighterManager } from '@/game/managers/FighterManager';

const BattleGame = dynamic(() => import('@/game/BattleGame'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-2xl font-bold text-white">Loading Battle Arena...</div>
    </div>
  )
});

interface BattleData {
  pool: {
    player1Total: number;
    player2Total: number;
    totalBets: number;
  };
  stage: string;
  fighters?: {
    player1: {
      name: string;
      symbol: string;
      marketCap?: number;
      holders?: number;
      buys24h?: number;
      sells24h?: number;
      createdDays?: number;
    };
    player2: {
      name: string;
      symbol: string;
      marketCap?: number;
      holders?: number;
      buys24h?: number;
      sells24h?: number;
      createdDays?: number;
    };
  };
}

interface BetRecord {
  username: string;
  amount: number;
  player: 'player1' | 'player2';
  timestamp: number;
}

interface BattleHistoryRecord {
  id: string;
  winner: 'player1' | 'player2';
  totalPool: number;
  timestamp: number;
}

interface SimulatedBet {
  username: string;
  amount: number;
  player: 'player1' | 'player2';
  timestamp: number;
}

// Add constants at the top after imports
const CONSTANTS = {
  BETTING_PHASE_DURATION: 45000, // 45 seconds for betting
  FIGHT_PHASE_DURATION: 10000,
  PAYOUT_PHASE_DURATION: 5000,
  MIN_BET_AMOUNT: 1,
  MAX_BET_AMOUNT: 100,
  HOUSE_FEE_PERCENTAGE: 10,
  SIMULATED_BETS_INTERVAL: 5000, // Generate bets every 5 seconds
  MAX_RECENT_BETS: 10,
  PAYOUT_MULTIPLIER: 0.9, // 90% of pool goes to winners
  INITIAL_SIMULATED_BETS: 5 // Number of simulated bets to generate at start
} as const;

export default function BattlePage() {
  const { user, placeBet, handleWin } = useUser();
  const [currentBattle, setCurrentBattle] = useState<BattleData>({
    pool: {
      player1Total: 0,
      player2Total: 0,
      totalBets: 0
    },
    stage: 'betting'
  });
  const [recentBets, setRecentBets] = useState<BetRecord[]>([]);
  const [battleHistory, setBattleHistory] = useState<BattleHistoryRecord[]>([]);
  const [player1Amount, setPlayer1Amount] = useState('');
  const [player2Amount, setPlayer2Amount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [simulatedBets, setSimulatedBets] = useState<SimulatedBet[]>([]);
  const [showCopiedTooltip1, setShowCopiedTooltip1] = useState(false);
  const [showCopiedTooltip2, setShowCopiedTooltip2] = useState(false);
  const [player1Token, setPlayer1Token] = useState('$PEPE');
  const [player2Token, setPlayer2Token] = useState('$WIF');
  const [player1Image, setPlayer1Image] = useState<string | null>(null);
  const [player2Image, setPlayer2Image] = useState<string | null>(null);
  const [currentFighters, setCurrentFighters] = useState({
    player1: { name: '', image: '', marketCap: 0, holders: 0, buys24h: 0, sells24h: 0, createdDays: 0 },
    player2: { name: '', image: '', marketCap: 0, holders: 0, buys24h: 0, sells24h: 0, createdDays: 0 }
  });

  // Add ref for tracking current battle state
  const battleStateRef = useRef(currentBattle);
  const fighterManager = useRef(new FighterManager());

  // Update ref whenever currentBattle changes
  useEffect(() => {
    battleStateRef.current = currentBattle;
  }, [currentBattle]);

  // Add predefined fight sequence
  const fights = [
    { player1: 'BATCAT', player2: 'EAGLE' },
    { player1: 'EBICHU', player2: 'DUKO' },
    { player1: 'VIGI', player2: 'GWR' },
    { player1: 'COKE', player2: 'ANGLERFISH' },
    { player1: 'PINION', player2: 'TRUMP' }
  ];
  const [currentFightIndex, setCurrentFightIndex] = useState(0);

  useEffect(() => {
    // Set initial fighters
    const currentFight = fights[currentFightIndex];
    setCurrentFighters({
      player1: {
        name: currentFight.player1,
        image: `/images/P1/${currentFight.player1.toLowerCase()}.png`,
        marketCap: 0,
        holders: 0,
        buys24h: 0,
        sells24h: 0,
        createdDays: 0
      },
      player2: {
        name: currentFight.player2,
        image: `/images/P2/${currentFight.player2.toLowerCase()}.png`,
        marketCap: 0,
        holders: 0,
        buys24h: 0,
        sells24h: 0,
        createdDays: 0
      }
    });
  }, [currentFightIndex]);

  // Subscribe only to betting pool data from Firebase
  useEffect(() => {
    const unsubscribeBattle = subscribeToCurrentBattle((data) => {
      if (data) {
        setCurrentBattle(prev => ({
          ...prev,
          pool: {
            player1Total: data.bettingPool?.player1 || 0,
            player2Total: data.bettingPool?.player2 || 0,
            totalBets: data.bettingPool?.totalPool || 0
          },
          stage: data.status || 'betting'
        }));

        // If battle ended, progress to next fight
        if (data.status === 'payout') {
          setTimeout(() => {
            setCurrentFightIndex(prevIndex => {
              const nextIndex = prevIndex + 1;
              return nextIndex < fights.length ? nextIndex : 0;
            });
          }, 5000);
        }
      }
    });

    // Subscribe to recent bets
    const unsubscribeBets = subscribeToRecentBets(5, (bets) => {
      if (bets) {
        console.log('Received bets data:', bets);
        const formattedBets = Object.values(bets).map((bet: any) => ({
          username: bet.username || 'Anonymous',
          amount: Number(bet.amount),
          player: bet.playerId,
          timestamp: bet.timestamp
        })).sort((a, b) => b.timestamp - a.timestamp);
        setRecentBets(formattedBets);
      }
    });

    // Subscribe to battle history
    const unsubscribeHistory = subscribeToBattleHistory(5, (history) => {
      if (history) {
        const formattedHistory = Object.entries(history).map(([id, data]: [string, any]) => ({
          id,
          winner: data.winner,
          totalPool: data.totalPool,
          timestamp: data.timestamp
        })).sort((a, b) => b.timestamp - a.timestamp);
        setBattleHistory(formattedHistory);
      }
    });

    return () => {
      unsubscribeBattle();
      unsubscribeBets();
      unsubscribeHistory();
    };
  }, []);

  // Calculate pool percentages
  const totalPool = currentBattle?.pool?.totalBets || 0;
  const player1Percentage = totalPool > 0 
    ? (currentBattle?.pool?.player1Total || 0) / totalPool * 100 
    : 0;
  const player2Percentage = totalPool > 0 
    ? (currentBattle?.pool?.player2Total || 0) / totalPool * 100 
    : 0;

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Format SOL amount
  const formatSOL = (amount: number) => {
    return amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Modify handleBet function to include simulated bets in pool calculations
  const handleBet = async (playerId: 'player1' | 'player2', amount: string) => {
    if (!user) {
      setError('Please wait for the game to load');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const betAmount = parseFloat(amount);
      
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error('Please enter a valid bet amount');
      }

      await placeBet(playerId, betAmount);

      // Update the current battle pool including simulated bets
      setCurrentBattle(prev => {
        const currentPool = prev.pool || { player1Total: 0, player2Total: 0, totalBets: 0 };
        const updatedPool = {
          ...currentPool,
          [playerId === 'player1' ? 'player1Total' : 'player2Total']: 
            (currentPool[playerId === 'player1' ? 'player1Total' : 'player2Total'] || 0) + betAmount,
          totalBets: (currentPool.totalBets || 0) + betAmount
        };

        return {
          ...prev,
          pool: updatedPool
        };
      });

      // Add to recent bets
      const newBet = {
        username: user.username,
        amount: betAmount,
        player: playerId,
        timestamp: Date.now()
      };
      setRecentBets(prev => [newBet, ...prev]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10));

      // Reset input
      if (playerId === 'player1') {
        setPlayer1Amount('');
      } else {
        setPlayer2Amount('');
      }
    } catch (err: any) {
      console.error('Error placing bet:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBet = (playerId: 'player1' | 'player2', amount: number) => {
    if (playerId === 'player1') {
      setPlayer1Amount(amount.toString());
    } else {
      setPlayer2Amount(amount.toString());
    }
  };

  // Add handleConnect function
  const handleConnect = async () => {
    try {
      // Sign in anonymously if not already signed in
      if (!user) {
        const { signInAnonymously } = await import('firebase/auth');
        const { auth } = await import('@/services/firebase');
        await signInAnonymously(auth);
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
    }
  };

  // Add utility function for error handling
  const handleError = (error: any, customMessage: string) => {
    console.error(customMessage, error);
    const errorMessage = error?.message || customMessage;
    return errorMessage;
  };

  const copyToClipboard = async (text: string, isPlayer1: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isPlayer1) {
        setShowCopiedTooltip1(true);
        setTimeout(() => setShowCopiedTooltip1(false), 2000);
      } else {
        setShowCopiedTooltip2(true);
        setTimeout(() => setShowCopiedTooltip2(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Add helper function for number formatting
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-white/10">
        <div className="max-w-[2400px] mx-auto flex items-center px-8 py-6 relative">
          {/* Left side - Balance */}
          <div className="flex items-center space-x-3 text-white bg-black/40 px-8 py-4 rounded-xl border border-white/10">
            <TrophyIcon className="w-7 h-7 text-[#00FFA3]" />
            <span className="font-bold text-2xl">{user?.solBalance.toFixed(2)} SOL</span>
          </div>

          {/* Centered Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="relative h-24 w-80 block transition-transform hover:scale-105">
              <Image
                src="/images/DraftKings-logo-font.png"
                alt="Salty Sol"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </Link>
          </div>

          {/* Right side - Username */}
          <div className="ml-auto">
            <div className="flex items-center space-x-3 text-white bg-black/40 px-6 py-3 rounded-xl border border-white/10">
              <UserGroupIcon className="w-6 h-6 text-[#00FFA3]" />
              <span className="font-bold text-lg">{user?.username || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Now with 3 columns */}
      <div className="flex flex-1">
        {/* Left Side - Betting Pool Info */}
        <div className="w-[400px] bg-black border-r border-white/10 flex flex-col">
          {/* Pool Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-black to-black/40">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#FFD700]/10 rounded-lg">
                  <TrophyIcon className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-xl">Current Pool</h2>
                  <p className="text-white/60 text-sm">Round #420</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[#00FFA3] font-bold text-2xl">
                  {formatSOL(totalPool)} SOL
                </span>
                <p className="text-white/60 text-sm">Total Prize</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="text-center">
                <span className="text-white/60 text-sm">Total Bets</span>
                <p className="text-white font-bold text-lg">{recentBets.length}</p>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="text-center">
                <span className="text-white/60 text-sm">Time Left</span>
                <p className="text-white font-bold text-lg">02:45</p>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="text-center">
                <span className="text-white/60 text-sm">Round</span>
                <p className="text-white font-bold text-lg">#420</p>
              </div>
            </div>
          </div>

          {/* Recent Bets */}
          <div className="flex-grow overflow-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <UserGroupIcon className="w-5 h-5 text-[#00FFA3]" />
                  </div>
                  <h3 className="font-bold text-white">Recent Bets</h3>
                </div>
                <button className="text-[#00FFA3] text-sm hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentBets.map((bet, index) => (
                  <div 
                    key={`${bet.timestamp}-${index}`}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-transparent rounded-xl hover:from-white/10 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFA3] to-[#03E1FF] p-[2px]">
                        <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                          <span className="text-[#00FFA3] font-bold">
                            {(bet.username || 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-white font-medium group-hover:text-[#00FFA3] transition-colors">
                          {bet.username}
                        </div>
                        <div className="text-white/60 text-sm flex items-center space-x-1">
                          <span>Bet on</span>
                          <span className={bet.player === 'player1' ? 'text-[#00FFA3]' : 'text-[#03E1FF]'}>
                            Player {bet.player === 'player1' ? '1' : '2'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00FFA3] font-bold">+{formatSOL(bet.amount)} SOL</div>
                      <div className="text-white/40 text-sm">{formatTimeAgo(bet.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pool Distribution */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <svg className="w-5 h-5 text-[#00FFA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white">Pool Distribution</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">Player 1 Pool</span>
                    <span className="text-[#00FFA3]">
                      {formatSOL(currentBattle?.pool?.player1Total || 0)} SOL
                    </span>
                  </div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden p-[2px]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${player1Percentage}%` }}
                    >
                      <div className="w-full h-full bg-[rgba(255,255,255,0.2)]"></div>
                    </div>
                  </div>
                  <div className="mt-1 text-right text-white/60 text-sm">
                    {player1Percentage.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">Player 2 Pool</span>
                    <span className="text-[#03E1FF]">
                      {formatSOL(currentBattle?.pool?.player2Total || 0)} SOL
                    </span>
                  </div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden p-[2px]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#03E1FF] to-[#00FFA3] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${player2Percentage}%` }}
                    >
                      <div className="w-full h-full bg-[rgba(255,255,255,0.2)]"></div>
                    </div>
                  </div>
                  <div className="mt-1 text-right text-white/60 text-sm">
                    {player2Percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Main Content */}
        <div className="flex-grow bg-black">
          {/* Battle Arena */}
          <div className="relative h-full flex flex-col">
            <div className="flex-grow bg-black relative">
              <BattleGame />
              
              {/* Live Indicator Overlay */}
              <div className="absolute top-4 left-4 z-10">
                <div className="flex items-center space-x-2 bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-white font-medium text-sm">LIVE</span>
                </div>
              </div>

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black to-transparent p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="text-white hover:text-[#00FFA3] transition-colors">
                      <PlayIcon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center space-x-2">
                      <SpeakerWaveIcon className="w-6 h-6 text-white" />
                      <div className="w-20 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-[#00FFA3] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="text-white hover:text-[#00FFA3] transition-colors">
                      <Cog6ToothIcon className="w-6 h-6" />
                    </button>
                    <button className="text-white hover:text-[#00FFA3] transition-colors">
                      <ArrowsPointingOutIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Battle Info */}
            <div className="p-8 bg-black border-t border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                    <Image
                      src="/images/s.png"
                      alt="Streamer Profile"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Current Battle #420</h1>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center text-white">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        LIVE
                      </span>
                      <span className="text-white/60">1,234 watching</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <ShareIcon className="w-5 h-5 text-white" />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <EllipsisHorizontalIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Battle Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-black border border-white/10 p-6 rounded-xl">
                  <div className="text-center">
                    <div className="text-center">
                      <div className="relative inline-flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                          <div className="w-full h-full flex items-center justify-center">
                            {currentFighters.player1.image ? (
                              <Image
                                src={currentFighters.player1.image}
                                alt={currentFighters.player1.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white/30 text-xs">No Image</span>
                            )}
                          </div>
                        </div>
                        <div 
                          onClick={() => copyToClipboard('0x1234567890abcdef1234567890abcdef12345678', true)}
                          className="text-2xl font-bold text-white mb-4 flex items-center justify-center space-x-2 cursor-pointer group"
                        >
                          <span>${currentFighters.player1.name || 'Unknown'}</span>
                          <svg 
                            className="w-5 h-5 text-white/40 group-hover:text-[#00FFA3] transition-colors" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                          {showCopiedTooltip1 && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs py-1 px-2 rounded">
                              Copied!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <div className="text-white/60 mb-0.5">Total Bets</div>
                        <div className="text-white font-bold">
                          {formatSOL(currentBattle?.pool?.player1Total || 0)} SOL
                        </div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <div className="text-white/60 mb-0.5">Win Chance</div>
                        <div className="text-[#00FFA3] font-bold">
                          {totalPool > 0 
                            ? ((currentBattle?.pool?.player1Total || 0) / totalPool * 100).toFixed(1)
                            : '50.0'}%
                        </div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <div className="text-white/60 mb-0.5 flex items-center justify-between">
                          <span>Market Cap</span>
                          <span className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-0.5"></span>
                            <span className="text-xs text-red-500">LIVE</span>
                          </span>
                        </div>
                        <div className="text-white font-bold">${formatNumber(currentFighters.player1.marketCap)}</div>
                        <div className="text-xs text-white/40 mt-0.5">Created {currentFighters.player1.createdDays} days ago</div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg col-span-3">
                        <div className="text-white/60 mb-1.5 flex items-center justify-between">
                          <span>Holders</span>
                          <span className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-0.5"></span>
                            <span className="text-xs text-red-500">LIVE</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <div className="text-white font-bold">{formatNumber(currentFighters.player1.holders)}</div>
                            <div className="text-xs text-white/40">Total Holders</div>
                          </div>
                          <div>
                            <div className="text-[#00FFA3] font-bold">+{currentFighters.player1.buys24h}</div>
                            <div className="text-xs text-white/40">Buys (24h)</div>
                          </div>
                          <div>
                            <div className="text-red-500 font-bold">-{currentFighters.player1.sells24h}</div>
                            <div className="text-xs text-white/40">Sells (24h)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                        <span>Betting Amount</span>
                        <span>Balance: {user?.solBalance?.toFixed(2) || '0.00'} SOL</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number"
                          value={player1Amount}
                          onChange={(e) => setPlayer1Amount(e.target.value)}
                          placeholder="Enter amount"
                          min="1"
                          className="w-full px-4 py-2 bg-black/50 border-2 border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFA3] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">SOL</span>
                      </div>
                      {/* Add potential winnings */}
                      {player1Amount && (
                        <div className="mt-2 text-sm text-[#00FFA3]">
                          Potential Win: {formatSOL(Number(player1Amount) * 2)} SOL
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <button onClick={() => handleQuickBet('player1', 10)} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                        +10
                      </button>
                      <button onClick={() => handleQuickBet('player1', 50)} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                        +50
                      </button>
                      <button onClick={() => handleQuickBet('player1', 100)} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                        +100
                      </button>
                    </div>
                    <button 
                      onClick={() => handleBet('player1', player1Amount)}
                      disabled={isLoading || !player1Amount || !user}
                      className="w-full py-3 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-bold hover:from-[#00FFA3]/90 hover:to-[#03E1FF]/90 transition-all duration-200 rounded-xl border-2 border-transparent hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Placing Bet...' : 'Place Bet'}
                    </button>
                  </div>
                </div>
                <div className="bg-black border border-white/10 p-6 rounded-xl">
                  <div className="text-center">
                    <div className="text-center">
                      <div className="relative inline-flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                          <div className="w-full h-full flex items-center justify-center">
                            {currentFighters.player2.image ? (
                              <Image
                                src={currentFighters.player2.image}
                                alt={currentFighters.player2.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white/30 text-xs">No Image</span>
                            )}
                          </div>
                        </div>
                        <div 
                          onClick={() => copyToClipboard('0xabcdef1234567890abcdef1234567890abcdef12', false)}
                          className="text-2xl font-bold text-white mb-4 flex items-center justify-center space-x-2 cursor-pointer group"
                        >
                          <span>${currentFighters.player2.name || 'Unknown'}</span>
                          <svg 
                            className="w-5 h-5 text-white/40 group-hover:text-[#00FFA3] transition-colors" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                          {showCopiedTooltip2 && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs py-1 px-2 rounded">
                              Copied!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <div className="text-white/60 mb-0.5">Total Bets</div>
                        <div className="text-white font-bold">
                          {formatSOL(currentBattle?.pool?.player2Total || 0)} SOL
                        </div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <div className="text-white/60 mb-0.5">Win Chance</div>
                        <div className="text-[#00FFA3] font-bold">
                          {totalPool > 0 
                            ? ((currentBattle?.pool?.player2Total || 0) / totalPool * 100).toFixed(1)
                            : '50.0'}%
                        </div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <div className="text-white/60 mb-0.5 flex items-center justify-between">
                          <span>Market Cap</span>
                          <span className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-0.5"></span>
                            <span className="text-xs text-red-500">LIVE</span>
                          </span>
                        </div>
                        <div className="text-white font-bold">${formatNumber(currentFighters.player2.marketCap)}</div>
                        <div className="text-xs text-white/40 mt-0.5">Created {currentFighters.player2.createdDays} days ago</div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg col-span-3">
                        <div className="text-white/60 mb-1.5 flex items-center justify-between">
                          <span>Holders</span>
                          <span className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-0.5"></span>
                            <span className="text-xs text-red-500">LIVE</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <div className="text-white font-bold">{formatNumber(currentFighters.player2.holders)}</div>
                            <div className="text-xs text-white/40">Total Holders</div>
                          </div>
                          <div>
                            <div className="text-[#00FFA3] font-bold">+{currentFighters.player2.buys24h}</div>
                            <div className="text-xs text-white/40">Buys (24h)</div>
                          </div>
                          <div>
                            <div className="text-red-500 font-bold">-{currentFighters.player2.sells24h}</div>
                            <div className="text-xs text-white/40">Sells (24h)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                        <span>Betting Amount</span>
                        <span>Balance: {user?.solBalance?.toFixed(2) || '0.00'} SOL</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number"
                          value={player2Amount}
                          onChange={(e) => setPlayer2Amount(e.target.value)}
                          placeholder="Enter amount"
                          min="1"
                          className="w-full px-4 py-2 bg-black/50 border-2 border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00FFA3] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">SOL</span>
                      </div>
                      {/* Add potential winnings */}
                      {player2Amount && (
                        <div className="mt-2 text-sm text-[#00FFA3]">
                          Potential Win: {formatSOL(Number(player2Amount) * 2)} SOL
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <button onClick={() => handleQuickBet('player2', 10)} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                        +10
                      </button>
                      <button onClick={() => handleQuickBet('player2', 50)} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                        +50
                      </button>
                      <button onClick={() => handleQuickBet('player2', 100)} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                        +100
                      </button>
                    </div>
                    <button 
                      onClick={() => handleBet('player2', player2Amount)}
                      disabled={isLoading || !player2Amount || !user}
                      className="w-full py-3 bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] text-black font-bold hover:from-[#00FFA3]/90 hover:to-[#03E1FF]/90 transition-all duration-200 rounded-xl border-2 border-transparent hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Placing Bet...' : 'Place Bet'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Live Chat */}
        <div className="w-[400px] bg-black border-l border-white/10">
          <ChatBox />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
} 