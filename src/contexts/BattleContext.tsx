'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { tokenService } from '@/services/tokenService';
import { db } from '@/config/firebase';
import { ref, set, onValue, update, get } from 'firebase/database';

export interface Fighter {
  name: string;
  symbol: string;
  contractAddress: string;
  marketCap?: number;
  volume?: number;
  price?: number;
  imageUri?: string;
}

interface Bet {
  username: string;
  amount: number;
  player: 1 | 2;
  timestamp: number;
}

export interface BattleState {
  phase: 'BETTING' | 'BATTLE' | 'PAYOUT';
  timeRemaining: number;
  currentRound: number;
  betsLocked: boolean;
  totalPool: number;
  player1Pool: number;
  player2Pool: number;
  currentBattle: number;
  fighters: {
    current: {
      player1: Fighter | null;
      player2: Fighter | null;
    };
    next: {
      player1: Fighter | null;
      player2: Fighter | null;
    };
  };
  battleOutcome: {
    winner: 1 | 2;
    winningAmount: number;
  } | null;
  bets: Bet[];
  fakeGamblers: {
    usernames: string[];
    activeBets: Bet[];
  };
}

interface BattleContextType {
  battleState: BattleState;
  placeBet: (amount: number, player: 1 | 2) => void;
  calculatePotentialPayout: (amount: number, player: 1 | 2) => number;
  getUserBet: (username: string) => Bet | null;
  resetBattle: () => void;
  setWinner: (winner: 1 | 2) => void;
  fetchNextFighters: () => Promise<{ player1: Fighter | null; player2: Fighter | null }>;
}

// List of fake gambler usernames
const FAKE_GAMBLER_USERNAMES = [
  'Pl0xRift', 'Z0mb1Xx', 'QvixyX', 'WubD0nk', 'FuzzEgg',
  'Sn1zzyQ', 'VxzyDub', 'KriptZx', 'Fl1x0r', 'J3gXyW0',
  'Ploxify', 'XymonX', 'Yh3qJax', 'Bl4stZy', 'Zipt0nQ',
  'QuivzLx', 'Tazzy27', 'Vexblip', 'Fw3bbZy', 'Pyr3oTz'
];

const initialBattleState: BattleState = {
  phase: 'BETTING',
  timeRemaining: 20,
  currentRound: 1,
  betsLocked: false,
  totalPool: 0,
  player1Pool: 0,
  player2Pool: 0,
  currentBattle: 0,
  fighters: {
    current: { player1: null, player2: null },
    next: { player1: null, player2: null }
  },
  battleOutcome: null,
  bets: [],
  fakeGamblers: {
    usernames: FAKE_GAMBLER_USERNAMES,
    activeBets: []
  }
};

const BattleContext = createContext<BattleContextType>({
  battleState: initialBattleState,
  placeBet: () => {},
  calculatePotentialPayout: () => 0,
  getUserBet: () => null,
  resetBattle: () => {},
  setWinner: () => {},
  fetchNextFighters: async () => ({ player1: null, player2: null }),
});

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const { username, setSolBalance, solBalance } = useUser();
  const [battleState, setBattleState] = useState<BattleState>(initialBattleState);
  const [isInitialized, setIsInitialized] = useState(false);
  const payoutProcessed = React.useRef(false);

  // Handle payouts when battle ends
  useEffect(() => {
    if (!battleState.battleOutcome || battleState.phase !== 'PAYOUT') {
      // Reset the ref when not in payout phase
      payoutProcessed.current = false;
      return;
    }

    if (!payoutProcessed.current) {
      const winner = battleState.battleOutcome.winner;
      const winningAmount = battleState.battleOutcome.winningAmount;
      
      const winningBets = battleState.bets.filter(bet => bet.player === winner);
      const totalWinningBets = winningBets.reduce((sum, bet) => sum + bet.amount, 0);

      // Process user's payout if they won
      const userBet = winningBets.find(bet => bet.username === username);
      if (userBet) {
        const userShare = (userBet.amount / totalWinningBets) * winningAmount;
        setSolBalance(solBalance + userShare);
        payoutProcessed.current = true;
      }
    }
  }, [battleState.battleOutcome, battleState.phase, username, battleState.bets, solBalance]);

  // Battle phase management
  useEffect(() => {
    if (!isInitialized) return;

    let timer: NodeJS.Timeout;
    const updateBattle = () => {
      setBattleState(prevState => {
        const currentState = JSON.parse(JSON.stringify(prevState)); // Deep copy to prevent mutation

        // Decrement timer
        if (currentState.timeRemaining > 0) {
          currentState.timeRemaining -= 1;
          return currentState;
        }

        // Phase transitions
        switch (currentState.phase) {
          case 'BETTING':
            return {
              ...currentState,
              phase: 'BATTLE',
              timeRemaining: 30,
              betsLocked: true
            };

          case 'BATTLE':
            if (currentState.currentRound < 3) {
              return {
                ...currentState,
                currentRound: currentState.currentRound + 1,
                timeRemaining: 30
              };
            } else {
              const player1 = currentState.fighters.current.player1;
              const player2 = currentState.fighters.current.player2;
              
              if (!player1 || !player2) return currentState;
              
              // Calculate scores based on market cap and volume
              const p1Score = (player1.marketCap || 0) + (player1.volume || 0);
              const p2Score = (player2.marketCap || 0) + (player2.volume || 0);
              const winner = p1Score > p2Score ? 1 : 2;
              
              return {
                ...currentState,
                phase: 'PAYOUT',
                timeRemaining: 10,
                battleOutcome: {
                  winner,
                  winningAmount: currentState.totalPool
                }
              };
            }

          case 'PAYOUT':
            // Reset state but keep next fighters if available
            const nextState = {
              ...initialBattleState,
              currentBattle: currentState.currentBattle + 1,
              fighters: {
                current: currentState.fighters.next,
                next: { player1: null, player2: null }
              }
            };

            // If this was the first battle (using mock tokens), force fetch new fighters
            if (currentState.currentBattle === 0) {
              fetchNextFighters().then(fighters => {
                if (fighters.player1 && fighters.player2) {
                  setBattleState(state => ({
                    ...state,
                    fighters: {
                      current: fighters,
                      next: { player1: null, player2: null }
                    }
                  }));
                }
              });
            }

            return nextState;

          default:
            return currentState;
        }
      });
    };

    timer = setInterval(updateBattle, 1000);
    return () => clearInterval(timer);
  }, [isInitialized]); // Only depend on isInitialized

  // Fetch next fighters during betting phase
  useEffect(() => {
    const fetchFighters = async () => {
      if (battleState.phase === 'BETTING' && !battleState.fighters.next.player1) {
        const nextFighters = await fetchNextFighters();
        if (nextFighters.player1 && nextFighters.player2) {
          setBattleState(prevState => ({
            ...prevState,
            fighters: {
              ...prevState.fighters,
              next: nextFighters
            }
          }));
        }
      }
    };

    fetchFighters();
  }, [battleState.phase, battleState.fighters.next]);

  // Update fighter metadata periodically
  useEffect(() => {
    if (!isInitialized || battleState.currentBattle === 0) return;

    const updateFighterMetadata = async () => {
      const tokens = await tokenService.getTrendingTokens();
      const currentFighters = battleState.fighters.current;
      
      if (!currentFighters.player1 || !currentFighters.player2) return;

      // Find updated metadata for current fighters
      const updatedPlayer1 = tokens.find(t => t.mint === currentFighters.player1?.contractAddress);
      const updatedPlayer2 = tokens.find(t => t.mint === currentFighters.player2?.contractAddress);

      if (updatedPlayer1 || updatedPlayer2) {
        setBattleState(prevState => ({
          ...prevState,
          fighters: {
            ...prevState.fighters,
            current: {
              player1: updatedPlayer1 ? {
                ...prevState.fighters.current.player1!,
                marketCap: updatedPlayer1.marketCap?.usd,
                volume: updatedPlayer1.volume,
                price: updatedPlayer1.price
              } : prevState.fighters.current.player1,
              player2: updatedPlayer2 ? {
                ...prevState.fighters.current.player2!,
                marketCap: updatedPlayer2.marketCap?.usd,
                volume: updatedPlayer2.volume,
                price: updatedPlayer2.price
              } : prevState.fighters.current.player2
            }
          }
        }));
      }
    };

    // Update metadata every minute
    const interval = setInterval(updateFighterMetadata, 60 * 1000);
    return () => clearInterval(interval);
  }, [isInitialized, battleState.currentBattle]);

  // Add fake bets during betting phase with memoized callback
  const addFakeBet = React.useCallback(() => {
    if (Math.random() > 0.3) return; // 30% chance to add fake bet

    setBattleState(prevState => {
      if (prevState.phase !== 'BETTING' || prevState.betsLocked) return prevState;

      const fakeGamblers = prevState.fakeGamblers.usernames.filter(
        name => !prevState.bets.some(bet => bet.username === name)
      );

      if (fakeGamblers.length === 0) return prevState;

      const gambler = fakeGamblers[Math.floor(Math.random() * fakeGamblers.length)];
      const player = Math.random() < 0.5 ? 1 : 2;
      const amount = Math.floor(Math.random() * 1000) + 100;

      const bet: Bet = {
        username: gambler,
        amount,
        player,
        timestamp: Date.now()
      };

      return {
        ...prevState,
        [`player${player}Pool`]: prevState[`player${player}Pool`] + amount,
        totalPool: prevState.totalPool + amount,
        bets: [...prevState.bets, bet]
      };
    });
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(addFakeBet, 2000);
    return () => clearInterval(interval);
  }, [isInitialized, addFakeBet]);

  // Initialize battle state and fetch first fighters
  useEffect(() => {
    const initializeBattle = async () => {
      console.log('Initializing battle state');
      const fighters = await fetchNextFighters();
      if (fighters.player1 && fighters.player2) {
        setBattleState({
          ...initialBattleState,
          fighters: {
            current: fighters,
            next: { player1: null, player2: null }
          }
        });
      }
      setIsInitialized(true);
    };

    initializeBattle();
  }, []);

  // Simplified bet placement
  const placeBet = async (amount: number, player: 1 | 2) => {
    if (!username || battleState.betsLocked || amount > solBalance) return;

    const bet: Bet = {
      username,
      amount,
      player,
      timestamp: Date.now()
    };

    // Update local state first
    setBattleState(prevState => ({
      ...prevState,
      [`player${player}Pool`]: prevState[`player${player}Pool`] + amount,
      totalPool: prevState.totalPool + amount,
      bets: [...prevState.bets, bet]
    }));

    setSolBalance(solBalance - amount);

    // Store bet data in Firebase for analytics
    try {
      // Use a more structured path and include user info
      const betId = `${Date.now()}_${username}`;
      const betRef = ref(db, `bets/${betId}`);
      
      // Attempt to store the bet
      await set(betRef, {
        ...bet,
        // Add additional metadata
        createdAt: Date.now(),
        battleNumber: battleState.currentBattle
      }).catch(error => {
        if (error.code === 'PERMISSION_DENIED') {
          console.warn('Analytics storage failed - permission denied. This is non-critical.');
          // The bet is still valid locally, just not stored for analytics
        } else {
          throw error; // Re-throw other errors
        }
      });
    } catch (error) {
      console.error('Error storing bet data:', error);
      // Don't revert the local bet - it's still valid even if analytics fails
    }
  };

  const calculatePotentialPayout = (amount: number, player: 1 | 2): number => {
    const { totalPool, player1Pool, player2Pool } = battleState;
    if (totalPool === 0) return amount * 2;

    const playerPool = player === 1 ? player1Pool : player2Pool;
    return (amount * totalPool) / (playerPool + amount);
  };

  const getUserBet = (username: string): Bet | null => {
    return battleState.bets.find(bet => bet.username === username) || null;
  };

  const resetBattle = async () => {
    const battleRef = ref(db, 'battles/current');
    const fighters = await fetchNextFighters();
    
    if (fighters.player1 && fighters.player2) {
      const newState = {
        ...initialBattleState,
        fighters: {
          current: fighters,
          next: { player1: null, player2: null }
        }
      };
      
      await set(battleRef, newState);
    }
  };

  const setWinner = async (winner: 1 | 2) => {
    const battleRef = ref(db, 'battles/current');
    await update(battleRef, {
      battleOutcome: {
        winner,
        winningAmount: battleState.totalPool
      }
    });
  };

  const fetchNextFighters = async () => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log('Fetching trending tokens...');
        const trendingTokens = await tokenService.getTrendingTokens();
        
        if (!trendingTokens || trendingTokens.length < 2) {
          console.error('Not enough trending tokens available, retrying...');
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Get unused token pair
        const { token1, token2 } = tokenService.getUnusedTokenPair(trendingTokens);

        console.log('Selected fighters:', token1, token2);

        const player1: Fighter = {
          name: token1.name || 'Unknown Token',
          symbol: token1.symbol || 'UNKNOWN',
          contractAddress: token1.mint,
          marketCap: token1.marketCap?.usd,
          volume: token1.volume,
          price: token1.price,
          imageUri: token1.image
        };

        const player2: Fighter = {
          name: token2.name || 'Unknown Token',
          symbol: token2.symbol || 'UNKNOWN',
          contractAddress: token2.mint,
          marketCap: token2.marketCap?.usd,
          volume: token2.volume,
          price: token2.price,
          imageUri: token2.image
        };

        return { player1, player2 };
      } catch (error) {
        console.error('Error fetching fighters:', error);
        retryCount++;
      }
    }

    return { player1: null, player2: null };
  };

  return (
    <BattleContext.Provider value={{
      battleState,
      placeBet,
      calculatePotentialPayout,
      getUserBet,
      resetBattle,
      setWinner,
      fetchNextFighters
    }}>
      {children}
    </BattleContext.Provider>
  );
}

export const useBattle = () => useContext(BattleContext); 