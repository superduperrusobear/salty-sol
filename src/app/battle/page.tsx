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

// Constants
const SOL_TO_USDT_RATE = 139.09;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm md:max-w-lg rounded-lg border border-gray-800 bg-gray-950 p-3 md:p-4">
        {/* Header */}
        <div className="mb-3 md:mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={imageToUse}
              alt={fighter.name} 
              className="h-6 w-6 md:h-8 md:w-8 rounded-full object-cover"
            />
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">{fighter.name}</h3>
              <p className="text-xs md:text-sm text-gray-400">{fighter.symbol}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Token Analysis */}
        <div className="space-y-3 md:space-y-4">
          {/* Market Stats */}
          <div className="rounded-lg border border-gray-800 bg-black/50 p-2 md:p-3">
            <h4 className="mb-2 text-xs md:text-sm font-medium text-gray-400">Market Stats</h4>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div>
                <p className="text-xs text-gray-500">Market Cap</p>
                <p className="font-mono text-xs md:text-sm text-white">${tokenService.formatNumber(fighter.marketCap || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">24h Volume</p>
                <p className="font-mono text-xs md:text-sm text-white">${tokenService.formatNumber(fighter.volume || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-mono text-xs md:text-sm text-white">${fighter.price?.toFixed(8) || '0.00000000'}</p>
              </div>
            </div>
          </div>

          {/* Token Info */}
          <div className="rounded-lg border border-gray-800 bg-black/50 p-2 md:p-3">
            <h4 className="mb-2 text-xs md:text-sm font-medium text-gray-400">Token Info</h4>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Contract Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs md:text-sm text-white truncate">{fighter.contractAddress}</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(fighter.contractAddress)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor">
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
  const { battleState, placeBet, calculatePotentialPayout, getUserBet } = useBattle();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWinNotification, setShowWinNotification] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [battleOutcomeViewed, setBattleOutcomeViewed] = useState(false);
  const [showDemoMessage, setShowDemoMessage] = useState(false);

  // Monitor battle state changes
  useEffect(() => {
    console.log('Battle state updated:', battleState);
    if (battleState?.fighters?.current?.player1 && battleState?.fighters?.current?.player2) {
      setIsLoading(false);
    }
  }, [battleState]);

  // Monitor for wins
  useEffect(() => {
    if (battleState.phase === 'PAYOUT' && battleState.battleOutcome) {
      const winner = battleState.battleOutcome.winner;
      const userBet = getUserBet(username || '');
      
      if (userBet && userBet.player === winner) {
        // User won!
        const winningBets = battleState.bets.filter(bet => bet.player === winner);
        const totalWinningBetsAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
        const userWinningBets = winningBets.filter(bet => bet.username === username);
        
        if (userWinningBets.length > 0) {
          const userTotalBetAmount = userWinningBets.reduce((sum, bet) => sum + bet.amount, 0);
          const userSharePercentage = userTotalBetAmount / totalWinningBetsAmount;
          const userPayout = battleState.totalPool * userSharePercentage;
          
          setWinAmount(userPayout);
          setShowWinNotification(true);
          
          // Hide notification after 5 seconds
          setTimeout(() => {
            setShowWinNotification(false);
          }, 5000);
        }
      }
    }
  }, [battleState.phase, battleState.battleOutcome, battleState.bets, battleState.totalPool, username, getUserBet]);

  // Debug bet button state
  useEffect(() => {
    const buttonDisabled = 
      battleState.phase !== 'BETTING' ||
      !selectedPlayer ||
      (!selectedAmount && !customAmount) ||
      (selectedAmount || Number(customAmount)) > solBalance;
    
    console.log('Bet button state:', {
      disabled: buttonDisabled,
      phase: battleState.phase,
      selectedPlayer,
      selectedAmount,
      customAmount,
      solBalance,
      conditions: {
        isBettingPhase: battleState.phase === 'BETTING',
        hasSelectedPlayer: !!selectedPlayer,
        hasAmount: !!(selectedAmount || customAmount),
        sufficientBalance: !((selectedAmount || Number(customAmount)) > solBalance)
      }
    });
  }, [battleState.phase, selectedPlayer, selectedAmount, customAmount, solBalance]);

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
      
      return () => unsubscribe();
    }
  }, [battleState?.fighters?.current?.player1, battleState?.fighters?.current?.player2, battleState.currentBattle]);

  // Reset battleOutcomeViewed when a new battle starts
  useEffect(() => {
    if (battleState.phase === 'BETTING') {
      setBattleOutcomeViewed(false);
    }
  }, [battleState.phase, battleState.currentBattle]);

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
    console.log('Quick bet selected:', amount);
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handlePlayerSelect = (player: number) => {
    console.log('Player selected:', player);
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
    // Parse the amount properly
    const amount = selectedAmount !== null ? selectedAmount : (customAmount ? parseFloat(customAmount) : 0);
    
    console.log('Attempting to place bet:', { 
      amount, 
      selectedPlayer, 
      solBalance, 
      betsLocked: battleState.betsLocked,
      phase: battleState.phase,
      conditions: {
        hasAmount: amount > 0,
        hasPlayer: selectedPlayer === 1 || selectedPlayer === 2,
        sufficientBalance: amount <= solBalance,
        betsNotLocked: !battleState.betsLocked,
        isBettingPhase: battleState.phase === 'BETTING'
      }
    });
    
    // Validate all conditions explicitly
    if (amount <= 0) {
      console.log('Bet failed: Invalid amount');
      return;
    }
    
    if (selectedPlayer !== 1 && selectedPlayer !== 2) {
      console.log('Bet failed: Invalid player selection');
      return;
    }
    
    if (amount > solBalance) {
      console.log('Bet failed: Insufficient balance');
      return;
    }
    
    if (battleState.betsLocked) {
      console.log('Bet failed: Betting is locked');
      return;
    }
    
    if (battleState.phase !== 'BETTING') {
      console.log('Bet failed: Not in betting phase');
      return;
    }
    
    // All conditions met, place the bet
    console.log('Placing bet:', { amount, player: selectedPlayer });
    placeBet(amount, selectedPlayer as 1 | 2);
    
    // Reset state after placing bet
    setSelectedAmount(null);
    setSelectedPlayer(null);
    setCustomAmount('');
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
    if (battleState.phase !== 'PAYOUT' || !battleState.battleOutcome || battleOutcomeViewed) return null;
    
    const winner = battleState.battleOutcome.winner;
    const winnerSymbol = winner === 1 
      ? battleState.fighters.current.player1?.symbol 
      : battleState.fighters.current.player2?.symbol;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
        <div className="text-center">
          <div className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4">
            {winnerSymbol} WINS!
          </div>
          <div className="text-base md:text-xl text-green-400 font-medium">
            Payout: {battleState.battleOutcome.winningAmount.toFixed(2)} SOL
          </div>
          <div className="mt-4 md:mt-6">
            <button 
              onClick={() => setBattleOutcomeViewed(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm md:text-base font-medium hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle demo feature click
  const handleDemoFeatureClick = () => {
    setShowDemoMessage(true);
    setTimeout(() => {
      setShowDemoMessage(false);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 md:p-6">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-500 mx-auto"></div>
            <p className="text-white text-lg">Loading battle arena...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      {/* Demo Message */}
      {showDemoMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-cyan-400 text-white px-4 py-2 rounded-lg shadow-glow animate-bounce-once">
          You are currently experiencing the demo version. Feature not available.
        </div>
      )}
      
      {/* Win Notification */}
      {showWinNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowWinNotification(false)} />
          <div className="relative bg-gradient-to-b from-gray-900 to-black border border-green-500 rounded-lg p-3 md:p-6 max-w-xs md:max-w-sm mx-auto text-center transform animate-bounce-once">
            <button 
              onClick={() => setShowWinNotification(false)}
              className="absolute top-1 right-1 md:top-2 md:right-2 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-12 md:w-12 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-base md:text-lg font-bold text-white">You Won!</div>
                <div className="text-sm md:text-base">+{winAmount.toFixed(2)} SOL (${(winAmount * SOL_TO_USDT_RATE).toFixed(2)} USDT)</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="mb-2 md:mb-4 flex flex-col md:flex-row md:items-center md:justify-between bg-black">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center">
          {/* Logo */}
          <div className="h-12 md:h-14 lg:h-16 w-28 md:w-36 lg:w-40 relative">
            <Image
              src="/images/png-clipart-logo-draftkings-brand-font-white-king-of-spades-white-text.png"
              alt="Salty Sol Logo"
              fill
              className="object-contain"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 md:gap-4 lg:gap-6 ml-4 md:ml-8 overflow-x-auto whitespace-nowrap">
            <button 
              onClick={handleDemoFeatureClick}
              className="text-white hover:text-cyan-400 transition-colors text-xs md:text-sm font-medium"
            >
              Referrals
            </button>
            <button 
              onClick={handleDemoFeatureClick}
              className="text-white hover:text-cyan-400 transition-colors text-xs md:text-sm font-medium"
            >
              Portfolio
            </button>
            <button 
              onClick={handleDemoFeatureClick}
              className="text-white hover:text-cyan-400 transition-colors text-xs md:text-sm font-medium"
            >
              Rewards
            </button>
            <button 
              onClick={handleDemoFeatureClick}
              className="text-white hover:text-cyan-400 transition-colors text-xs md:text-sm font-medium"
            >
              Upcoming
            </button>
            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent hover:from-blue-500 hover:to-cyan-300 transition-colors text-xs md:text-sm font-medium"
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* Right side - Wallet and Profile */}
        <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-0">
          {/* Deposit Button */}
          <button 
            onClick={handleDemoFeatureClick}
            className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Deposit
          </button>
          
          {/* Wallet Button */}
          <button 
            onClick={handleDemoFeatureClick}
            className="w-fit min-w-max bg-gray-800/50 flex flex-row h-[28px] md:h-[32px] px-[12px] md:px-[16px] py-[6px] md:py-[8px] gap-[8px] md:gap-[12px] justify-center items-center rounded-full hover:bg-gray-700/50 transition-colors"
          >
            {/* Wallet Icon */}
            <i className="text-[16px] md:text-[18px] flex items-center">
              <Image
                src="/images/wallet.svg"
                alt="Wallet"
                width={16}
                height={16}
                className="text-white flex-shrink-0 brightness-0 invert"
              />
            </i>

            {/* SOL Balance */}
            <div className="flex flex-shrink-0 whitespace-nowrap flex-row gap-[4px] md:gap-[8px] justify-start items-center min-w-[60px] md:min-w-[80px]">
              <Image
                src="/images/solana-sol-logo.png"
                alt="SOL"
                width={14}
                height={14}
                className="text-white flex-shrink-0"
              />
              <span className="text-[12px] md:text-[14px] font-semibold">{solBalance.toFixed(2)}</span>
            </div>

            {/* Divider */}
            <div className="hidden md:block flex-shrink-0 w-[1px] h-[14px] bg-gray-700"></div>

            {/* USDC Balance */}
            <div className="hidden md:flex flex-shrink-0 whitespace-nowrap flex-row gap-[8px] justify-start items-center min-w-[90px]">
              <Image
                src="/images/825.png"
                alt="USDC"
                width={18}
                height={18}
                className="text-white flex-shrink-0"
              />
              <span className="text-[14px] font-semibold">{(solBalance * SOL_TO_USDT_RATE).toFixed(2)}</span>
            </div>

            {/* Dropdown Arrow */}
            <i className="hidden md:flex text-[18px] items-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </i>
          </button>

          {/* Profile Icon */}
          <button 
            onClick={handleDemoFeatureClick}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 text-gray-400">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83zM12 6c-1.94 0-3.5 1.56-3.5 3.5S10.06 13 12 13s3.5-1.56 3.5-3.5S13.94 6 12 6zm0 5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11 12 11z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-2 md:gap-3 lg:gap-4">
        {/* Left Column - Battle Arena */}
        <div className="col-span-12 lg:col-span-9">
          {/* Battle Arena Card */}
          <div className="container-card mb-2 md:mb-3 lg:mb-4 rounded-lg overflow-hidden border-0">
            <div className="header-section flex-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">Battle Arena</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-gray-400">
                  {Math.floor(battleState.timeRemaining / 60)}:{(battleState.timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Battle Content */}
            <div className="p-2 md:p-3">
              {/* Battle Arena - Phaser Game Container */}
              <div 
                id="game-container"
                className="relative w-full rounded-lg overflow-hidden mb-2 md:mb-3 lg:mb-4"
                style={{
                  minHeight: '500px',
                  maxHeight: '700px',
                  height: '100%',
                  aspectRatio: '16/10',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Battle outcome overlay */}
                {renderBattleOutcome()}
                
                {/* Phaser Game */}
                <BattleGame className="flex-grow" />
              </div>

              {/* Combined Fighter Info and Betting Panel */}
              <div className="w-full bg-black rounded-lg overflow-hidden">
                {/* Header - Simplified */}
                <div className="bg-black p-3 flex justify-end border-b border-gray-900">
                  <span className="text-xs text-gray-400">
                    {Math.floor(battleState.timeRemaining / 60)}:{(battleState.timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Status Banner */}
                  {battleState.phase !== 'BETTING' && (
                    <div className="text-center text-xs text-red-400 p-2 mb-3">
                      BETTING CLOSED
                    </div>
                  )}
                  
                  {/* Fighter Selection */}
                  <div className="grid grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-4">
                    {/* Fighter 1 */}
                    <button
                      onClick={() => handlePlayerSelect(1)}
                      disabled={battleState.phase !== 'BETTING'}
                      className={`bg-black rounded-lg p-2 md:p-3 ${
                        selectedPlayer === 1
                          ? 'ring-1 ring-blue-500'
                          : 'border border-gray-900'
                      } ${battleState.phase !== 'BETTING' ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-black overflow-hidden flex-shrink-0 border border-gray-800">
                          <img 
                            src={getFighterImage(battleState.fighters.current.player1, 1)}
                            alt={battleState.fighters.current.player1?.name || 'Fighter 1'} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-xs md:text-sm font-medium text-white">
                            {battleState.fighters.current.player1?.symbol || 'P1'}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{battleState.player1Pool.toFixed(2)} SOL</span>
                            <span className="text-xs text-green-400">{getWinChance(1).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </button>
                    
                    {/* Fighter 2 */}
                    <button
                      onClick={() => handlePlayerSelect(2)}
                      disabled={battleState.phase !== 'BETTING'}
                      className={`bg-black rounded-lg p-2 md:p-3 ${
                        selectedPlayer === 2
                          ? 'ring-1 ring-blue-500'
                          : 'border border-gray-900'
                      } ${battleState.phase !== 'BETTING' ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-black overflow-hidden flex-shrink-0 border border-gray-800">
                          <img 
                            src={getFighterImage(battleState.fighters.current.player2, 2)}
                            alt={battleState.fighters.current.player2?.name || 'Fighter 2'} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-xs md:text-sm font-medium text-white">
                            {battleState.fighters.current.player2?.symbol || 'P2'}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{battleState.player2Pool.toFixed(2)} SOL</span>
                            <span className="text-xs text-green-400">{getWinChance(2).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Betting Controls */}
                  <div className="bg-black border border-gray-900 rounded-lg p-2 md:p-3 mb-2 md:mb-3">
                    <div className="flex justify-between items-center mb-2 md:mb-3">
                      <span className="text-xs text-white">Amount</span>
                      <span className="text-xs text-gray-500">Balance: {solBalance.toFixed(2)} SOL</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1 md:gap-2 mb-2 md:mb-3">
                      {/* Quick Bet Buttons */}
                      {[0.25, 0.5, 1, 2].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => handleQuickBet(amount)}
                          disabled={battleState.phase !== 'BETTING'}
                          className={`bg-black border ${
                            selectedAmount === amount ? 'border-blue-500 text-blue-400' : 'border-gray-800 text-gray-400'
                          } py-1 text-xs rounded disabled:opacity-50`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-5 gap-1 md:gap-2 mb-2 md:mb-3">
                      {/* Custom Amount Input */}
                      <div className="relative col-span-3">
                        <input
                          type="number"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          disabled={battleState.phase !== 'BETTING'}
                          placeholder="Enter amount"
                          className="w-full bg-black border border-gray-800 rounded py-1 md:py-1.5 px-2 md:px-3 text-xs md:text-sm text-white placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                        />
                        <span className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">SOL</span>
                      </div>
                      
                      {/* Place Bet Button */}
                      <button
                        onClick={handlePlaceBet}
                        disabled={
                          battleState.phase !== 'BETTING' ||
                          (selectedPlayer !== 1 && selectedPlayer !== 2) ||
                          (!selectedAmount && (!customAmount || parseFloat(customAmount) <= 0)) ||
                          (selectedAmount || (customAmount ? parseFloat(customAmount) : 0)) > solBalance
                        }
                        className="col-span-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 text-white py-1 md:py-1.5 rounded text-xs md:text-sm disabled:opacity-50 disabled:bg-gray-800"
                      >
                        {battleState.phase === 'BETTING' ? 'Place Bet' : 'Betting Closed'}
                      </button>
                    </div>
                    
                    {/* Potential Payout - Only show when both player and amount are selected */}
                    {selectedPlayer && (selectedAmount || customAmount) && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Potential Payout:</span>
                        <span className="text-green-400 font-medium">
                          {calculatePotentialPayout(
                            selectedAmount || Number(customAmount), 
                            selectedPlayer as 1 | 2
                          ).toFixed(2)} SOL
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Guest Mode Notice - Move to bottom */}
                  {isGuest && (
                    <div className="text-xs text-blue-400 text-center">
                      You're in guest mode. Your bets are for fun only.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="col-span-12 lg:col-span-3">
          {/* Distribution Pool - Small Version */}
          <div className="mb-1 bg-black border border-gray-800 p-2">
            <div className="text-xs font-medium text-white mb-2">Distribution Pool</div>
            <div className="space-y-2">
              {/* Player 1 Pool */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm">
                    <span className="text-blue-400 font-medium">{battleState.fighters.current.player1?.symbol || 'P1'}:</span>
                    <span className="text-white ml-1">{battleState.player1Pool.toFixed(2)} SOL</span>
                  </div>
                  <span className="text-xs text-cyan-400 font-medium">
                    {battleState.totalPool > 0 ? ((battleState.player1Pool / battleState.totalPool) * 100).toFixed(1) : '50'}%
                  </span>
                </div>
                <div className="h-1 bg-gray-900">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                    style={{ 
                      width: battleState.totalPool > 0 
                        ? `${(battleState.player1Pool / battleState.totalPool) * 100}%` 
                        : '50%' 
                    }}
                  ></div>
                </div>
              </div>

              {/* Player 2 Pool */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm">
                    <span className="text-purple-400 font-medium">{battleState.fighters.current.player2?.symbol || 'P2'}:</span>
                    <span className="text-white ml-1">{battleState.player2Pool.toFixed(2)} SOL</span>
                  </div>
                  <span className="text-xs text-cyan-400 font-medium">
                    {battleState.totalPool > 0 ? ((battleState.player2Pool / battleState.totalPool) * 100).toFixed(1) : '50'}%
                  </span>
                </div>
                <div className="h-1 bg-gray-900">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
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
          
          {/* Chat Box */}
          <div className="h-[400px] md:h-[500px] lg:h-[550px] border border-gray-800">
            <ChatBox />
          </div>

          {/* Demo Version Footer */}
          <div className="mt-2 bg-black border border-gray-800 p-4 md:p-6 text-center h-[300px] md:h-[350px] lg:h-[400px] flex flex-col justify-between">
            <div>
              <div className="flex justify-center mb-6">
                <Image
                  src="/images/s.png"
                  alt="Salty Sol"
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
              <div className="text-lg font-medium mb-4 animate-pulse">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  CURRENTLY EXPERIENCING DEMO VERSION
                </span>
              </div>
              <div className="text-base text-gray-400 mb-6">
                Sign up for PRIVATE ACCESS
              </div>
              <button 
                onClick={() => router.push('/signup')}
                className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-all rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              >
                Click Here
              </button>
            </div>
            <div className="text-sm text-gray-600">
              © 2025 Salty Sol. All rights reserved.
            </div>
          </div>
        </div>

        {/* Hidden Elements */}
        <div className="hidden">
          {/* Pool Distribution and Leaderboard */}
          <div className="grid grid-cols-2 gap-4">
            {/* Pool Distribution */}
            <div className="container-card">
              <div className="header-section flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 002-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
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
                          ({battleState.totalPool > 0 ? ((battleState.player1Pool / battleState.totalPool) * 100).toFixed(1) : '50'}%
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

          {/* Betting Panel */}
          <div className={battleState.phase === 'BETTING' ? "betting-box" : "container-card"}>
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
                  className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-1.5 text-center text-white placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
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
                  (selectedPlayer !== 1 && selectedPlayer !== 2) ||
                  (!selectedAmount && (!customAmount || parseFloat(customAmount) <= 0)) ||
                  (selectedAmount || (customAmount ? parseFloat(customAmount) : 0)) > solBalance
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
        </div>
      </div>
      {/* Modal */}
      <FighterModal
        fighter={selectedFighter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        battleState={battleState}
      />

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsLeaderboardOpen(false)} />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl rounded-lg border border-gray-800 bg-black overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.3)]">
            {/* Reflective header with gradient */}
            <div className="bg-gradient-to-r from-blue-900/40 to-black p-4 flex items-center justify-between border-b border-gray-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Top Performers
              </h2>
              <button 
                onClick={() => setIsLeaderboardOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Leaderboard Component */}
            <Leaderboard />
          </div>
        </div>
      )}
    </div>
  );
} 