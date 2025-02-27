'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { ChatBox } from '@/components/ChatBox';
import { Leaderboard } from '@/components/Leaderboard';
import { tokenService } from '@/services/tokenService';
import { useBattle } from '@/contexts/BattleContext';
import type { Fighter } from '@/contexts/BattleContext';
import type { BattleState } from '@/contexts/BattleContext';
import { BattleGame } from '@/components/game/BattleGame';
import Image from 'next/image';

interface FighterModalProps {
  fighter: Fighter | null;
  isOpen: boolean;
  onClose: () => void;
  battleState: BattleState;
}

const FighterModal = ({ fighter, isOpen, onClose, battleState }: FighterModalProps) => {
  if (!isOpen || !fighter) return null;

  const fallbackImage = fighter.symbol === 'ATM' ? '/FALLBACKS/atm.webp' : '/FALLBACKS/woke.webp';
  const imageToUse = !battleState?.currentBattle ? fallbackImage : (fighter.imageUri || fallbackImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg rounded-lg border border-gray-800 bg-gray-950 p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={imageToUse}
              alt={fighter.name} 
              className="h-8 w-8 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-bold text-white">{fighter.name}</h3>
              <p className="text-sm text-gray-400">{fighter.symbol}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Token Analysis */}
        <div className="space-y-4">
          {/* Market Stats */}
          <div className="rounded-lg border border-gray-800 bg-black/50 p-3">
            <h4 className="mb-2 text-sm font-medium text-gray-400">Market Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Market Cap</p>
                <p className="font-mono text-white">${tokenService.formatNumber(fighter.marketCap || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">24h Volume</p>
                <p className="font-mono text-white">${tokenService.formatNumber(fighter.volume || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-mono text-white">${fighter.price?.toFixed(8) || '0.00000000'}</p>
              </div>
            </div>
          </div>

          {/* Token Info */}
          <div className="rounded-lg border border-gray-800 bg-black/50 p-3">
            <h4 className="mb-2 text-sm font-medium text-gray-400">Token Info</h4>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Contract Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-white truncate">{fighter.contractAddress}</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(fighter.contractAddress)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Network</p>
                <p className="text-white">Solana</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BattlePage() {
  const router = useRouter();
  const { username, isGuest, solBalance } = useUser();
  const { battleState, placeBet, calculatePotentialPayout } = useBattle();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor battle state changes
  useEffect(() => {
    console.log('Battle state updated:', battleState);
    if (battleState?.fighters?.current?.player1 && battleState?.fighters?.current?.player2) {
      setIsLoading(false);
    }
  }, [battleState]);

  // Redirect if no username
  useEffect(() => {
    if (!username) {
      router.push('/');
    }
  }, [username, router]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (battleState?.fighters?.current?.player1 && battleState?.fighters?.current?.player2 && battleState.currentBattle > 0) {
      const unsubscribe = tokenService.onPoolData((data) => {
        console.log('Received pool data update:', data);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [battleState?.currentBattle]);

  // Helper function to get fighter image
  const getFighterImage = (fighter: Fighter | null, index: number): string => {
    if (!fighter) return index === 1 ? '/FALLBACKS/atm.webp' : '/FALLBACKS/woke.webp';
    
    // For first match (currentBattle === 0), always use fallbacks
    if (!battleState?.currentBattle) {
      return index === 1 ? '/FALLBACKS/atm.webp' : '/FALLBACKS/woke.webp';
    }
    
    // After first match, try to use imageUri
    return fighter.imageUri || (index === 1 ? '/FALLBACKS/atm.webp' : '/FALLBACKS/woke.webp');
  };

  const handleQuickBet = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handlePlayerSelect = (player: number) => {
    setSelectedPlayer(player);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const handlePlaceBet = () => {
    const amount = selectedAmount || Number(customAmount);
    if (amount && selectedPlayer && amount <= solBalance && !battleState.betsLocked) {
      placeBet(amount, selectedPlayer as 1 | 2);
      setSelectedAmount(null);
      setSelectedPlayer(null);
      setCustomAmount('');
    }
  };

  const handleViewProfile = (fighter: Fighter | null) => {
    if (fighter) {
      setSelectedFighter(fighter);
      setIsModalOpen(true);
    }
  };

  const getPhaseDisplay = () => {
    switch (battleState.phase) {
      case 'BETTING':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            BETS OPEN ({battleState.timeRemaining}s)
          </div>
        );
      case 'BATTLE':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
            BATTLE IN PROGRESS - Round {battleState.currentRound}/3 ({battleState.timeRemaining}s)
          </div>
        );
      case 'PAYOUT':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
            PAYOUT PHASE ({battleState.timeRemaining}s)
          </div>
        );
    }
  };

  const getWinChance = (player: number) => {
    const { player1Pool, player2Pool, totalPool } = battleState;
    if (totalPool === 0) return 50;
    return player === 1 
      ? (player1Pool / totalPool) * 100 
      : (player2Pool / totalPool) * 100;
  };

  // Add a function to display battle outcome
  const renderBattleOutcome = () => {
    if (battleState.phase !== 'PAYOUT' || !battleState.battleOutcome) return null;
    
    const winner = battleState.battleOutcome.winner;
    const winnerFighter = winner === 1 
      ? battleState.fighters.current.player1 
      : battleState.fighters.current.player2;
    
    if (!winnerFighter) return null;

    const winnerImage = getFighterImage(winnerFighter, winner);

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 rounded-lg">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Battle Completed!</h3>
          
          <div className="mb-4">
            <div className="text-lg text-cyan-400 font-medium">Winner</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <img 
                src={winnerImage}
                alt={winnerFighter.name} 
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="text-xl font-bold text-white">{winnerFighter.name}</span>
              <span className="text-gray-400">({winnerFighter.symbol})</span>
            </div>
          </div>
          
          <div className="text-lg text-green-400 font-medium">
            Total Payout: {battleState.battleOutcome.winningAmount.toFixed(2)} SOL
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            Next battle starting in {battleState.timeRemaining} seconds...
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black p-6">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-500 mx-auto"></div>
            <p className="text-white text-lg">Loading battle arena...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-6">
      {/* Header with Phase Display */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <span className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-2.5 py-0.5 text-sm text-white">
            {username} {isGuest && <span className="text-xs opacity-70">(Guest)</span>}
          </span>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="h-16 w-48 relative">
            <Image
              src="/images/png-clipart-logo-draftkings-brand-font-white-king-of-spades-white-text.png"
              alt="Salty Sol Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-end gap-4">
          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a 
              href="https://x.com/BetSaltySol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href="https://t.me/betsaltysol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
          {getPhaseDisplay()}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Balance:</span>
            <span className="font-mono text-lg text-white">{solBalance.toFixed(2)} SOL</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Battle Arena */}
        <div className="col-span-8">
          {/* Battle Arena Card */}
          <div className="container-card mb-4 rounded-lg overflow-hidden">
            <div className="header-section flex-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">Current Battle</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
                  LIVE
                </span>
                <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-gray-400">
                  {Math.floor(battleState.timeRemaining / 60)}:{(battleState.timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Battle Content */}
            <div className="p-3">
              {/* Players Info */}
              <div className="mb-3 grid grid-cols-2 gap-3">
                {[
                  { fighter: battleState.fighters.current.player1, index: 1 },
                  { fighter: battleState.fighters.current.player2, index: 2 }
                ].map(({ fighter, index }) => (
                  <div key={index} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                    {fighter ? (
                      <>
                        <div className="mb-2 flex items-center gap-2">
                          <img 
                            src={getFighterImage(fighter, index)}
                            alt={fighter.name} 
                            className="h-6 w-6 rounded-full object-cover"
                          />
                          <button 
                            onClick={() => fighter.contractAddress && navigator.clipboard.writeText(fighter.contractAddress)}
                            className="text-base font-bold text-white hover:text-cyan-400 transition-colors"
                          >
                            {fighter.name}
                            <span className="text-sm font-normal text-gray-500 ml-1">
                              ({fighter.symbol})
                            </span>
                          </button>
                        </div>
                        <div className="space-y-1.5 text-sm text-gray-400">
                          <div className="flex justify-between">
                            <span>Win Chance</span>
                            <span className="text-green-400">
                              {getWinChance(index).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Market Cap</span>
                            <span className="text-white">
                              ${tokenService.formatNumber(fighter.marketCap || 0)}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleViewProfile(fighter)}
                            className="w-full mt-1 flex items-center justify-center gap-1 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-xs text-cyan-400 hover:bg-gray-800 hover:text-cyan-300 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            View Fighter Profile
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-24">
                        <div className="animate-pulse text-gray-500">Loading fighter data...</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Battle Arena - Phaser Game Container */}
              <div 
                id="game-container"
                className="relative w-full aspect-[16/9] rounded-lg overflow-hidden"
                style={{
                  minHeight: '400px',
                  maxHeight: '600px'
                }}
              >
                {/* Battle outcome overlay */}
                {renderBattleOutcome()}
                
                {/* Phaser Game */}
                <BattleGame />
              </div>
            </div>

            {/* Battle Controls */}
            <div className="flex items-center justify-between border-t border-gray-800 p-3">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-0.5 text-sm font-medium text-white hover:bg-gray-700">
                  Details
                </button>
                <button className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-0.5 text-sm font-medium text-white hover:bg-gray-700">
                  Share
                </button>
              </div>
              <button className="flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-0.5 text-sm font-medium text-white hover:opacity-90">
                Place Bet
              </button>
            </div>
          </div>

          {/* Pool Distribution and Leaderboard */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pool Distribution */}
            <div className="container-card">
              <div className="header-section flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white">Pool Distribution</h3>
                </div>
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-gray-400">Live</span>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-400">Total Pool</span>
                    <span className="font-mono text-xl font-bold text-white">{battleState.totalPool.toFixed(2)} SOL</span>
                  </div>
                  
                  {/* Player 1 Pool */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <button 
                          onClick={() => battleState.fighters.current.player1?.contractAddress && 
                            navigator.clipboard.writeText(battleState.fighters.current.player1.contractAddress)}
                          className="text-sm text-gray-400 hover:text-cyan-400 transition-colors text-left"
                        >
                          {battleState.fighters.current.player1?.name || 'Loading...'}
                          <span className="text-xs text-gray-500 ml-1">
                            ({battleState.fighters.current.player1?.symbol || '...'})
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-white">{battleState.player1Pool.toFixed(2)} SOL</span>
                        <span className="text-xs text-cyan-400">
                          ({battleState.totalPool > 0 ? ((battleState.player1Pool / battleState.totalPool) * 100).toFixed(1) : '50'}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ 
                          width: battleState.totalPool > 0 
                            ? `${(battleState.player1Pool / battleState.totalPool) * 100}%` 
                            : '50%' 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Player 2 Pool */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <button 
                          onClick={() => battleState.fighters.current.player2?.contractAddress && 
                            navigator.clipboard.writeText(battleState.fighters.current.player2.contractAddress)}
                          className="text-sm text-gray-400 hover:text-cyan-400 transition-colors text-left"
                        >
                          {battleState.fighters.current.player2?.name || 'Loading...'}
                          <span className="text-xs text-gray-500 ml-1">
                            ({battleState.fighters.current.player2?.symbol || '...'})
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-white">{battleState.player2Pool.toFixed(2)} SOL</span>
                        <span className="text-xs text-cyan-400">
                          ({battleState.totalPool > 0 ? ((battleState.player2Pool / battleState.totalPool) * 100).toFixed(1) : '50'}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                        style={{ 
                          width: battleState.totalPool > 0 
                            ? `${(battleState.player2Pool / battleState.totalPool) * 100}%` 
                            : '50%' 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="container-card">
              <Leaderboard />
            </div>
          </div>
        </div>

        {/* Right Column - Betting Panel and Chat */}
        <div className="col-span-4 space-y-4">
          {/* Betting Panel */}
          <div className="container-card">
            <div className="header-section">
              <h3 className="text-base font-bold text-white">
                {battleState.phase === 'BETTING' ? 'Place Your Bet' : 'Betting Closed'}
              </h3>
            </div>
            {isGuest && (
              <div className="bg-blue-900/20 border border-blue-800 p-2.5 text-sm text-blue-400">
                You're in guest mode. Your bets are for fun only.
              </div>
            )}
            <div className="p-4 space-y-4">
              {/* Player Selection */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { coin: battleState.fighters.current.player1, player: 1 },
                  { coin: battleState.fighters.current.player2, player: 2 }
                ].map(({ coin, player }) => (
                  <button
                    key={player}
                    onClick={() => handlePlayerSelect(player)}
                    disabled={battleState.phase !== 'BETTING'}
                    className={`w-full px-3 py-1.5 rounded border ${
                      selectedPlayer === player
                        ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400'
                        : 'bg-gray-900 hover:bg-gray-800 border-gray-800 text-white'
                    } ${battleState.phase !== 'BETTING' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{coin?.name || 'TBD'}</span>
                      <span className="text-xs text-gray-500">
                        {coin?.symbol || '...'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Bet Amount Input */}
              <div className="relative">
                <input
                  type="number"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  disabled={battleState.phase !== 'BETTING'}
                  placeholder="Enter amount"
                  className="w-full bg-gray-900/50 border border-gray-800 rounded px-3 py-1.5 text-center text-white placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">SOL</span>
              </div>

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[0.25, 0.5, 1, 2].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickBet(amount)}
                    disabled={battleState.phase !== 'BETTING'}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-2 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +{amount}
                  </button>
                ))}
              </div>

              {/* Potential Payout */}
              {selectedPlayer && (selectedAmount || customAmount) && (
                <div className="bg-gray-900/50 border border-gray-800 rounded p-2 text-center">
                  <div className="text-sm text-gray-400">Potential Payout</div>
                  <div className="text-lg font-mono text-green-400">
                    {calculatePotentialPayout(
                      selectedAmount || Number(customAmount), 
                      selectedPlayer as 1 | 2
                    ).toFixed(2)} SOL
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedPlayer === 1 ? 
                      `${battleState.fighters.current.player1?.name || 'Player 1'}` : 
                      `${battleState.fighters.current.player2?.name || 'Player 2'}`} Win Chance: 
                    {getWinChance(selectedPlayer).toFixed(1)}%
                  </div>
                </div>
              )}

              {/* Place Bet Button */}
              <button
                onClick={handlePlaceBet}
                disabled={
                  battleState.phase !== 'BETTING' ||
                  !selectedPlayer ||
                  (!selectedAmount && !customAmount) ||
                  (selectedAmount || Number(customAmount)) > solBalance
                }
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white py-1.5 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {battleState.phase === 'BETTING' ? 'Place Bet' : 'Betting Closed'}
              </button>

              {/* Balance */}
              <div className="text-center text-sm">
                <span className="text-gray-400">Balance: </span>
                <span className="text-white font-medium">{solBalance.toFixed(2)} SOL</span>
              </div>
            </div>
          </div>

          {/* Chat Box */}
          <div className="flex-1 h-[calc(100vh-500px)]">
            <ChatBox />
          </div>
        </div>
      </div>
      {/* Modal */}
      <FighterModal
        fighter={selectedFighter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        battleState={battleState}
      />
    </main>
  );
} 