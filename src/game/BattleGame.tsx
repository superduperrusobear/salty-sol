import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { MoonArenaScene } from './scenes/MoonArenaScene';
import { ArenaConfig } from './managers/SceneManager';
import { useUser } from '../contexts/UserContext';
import {
  updateCurrentBattlePool,
  recordBet,
  updateBattleStage,
  handleBattleResult,
  subscribeToCurrentBattle,
  subscribeToRecentBets
} from '../services/firebase';
import { FighterManager } from './managers/FighterManager';

type BattleStage = 'betting' | 'fighting' | 'payout' | 'transitioning';

interface BettingState {
  player1Bets: number;
  player2Bets: number;
  totalBets: number;
  lastWinner: string | null;
  lastPayout: number | null;
  recentBets: BetRecord[];
  pool: {
    player1Total: number;
    player2Total: number;
    totalBets: number;
  };
}

interface BetRecord {
  playerId: 'player1' | 'player2';
  amount: number;
  username: string;
  timestamp: number;
}

interface SimulatedBet {
  playerId: 'player1' | 'player2';
  amount: number;
  username: string;
  timestamp: number;
}

type AnyBet = BetRecord | SimulatedBet;

interface BattleResult {
  winner: 'player1' | 'player2';
  totalPool: number;
  payoutMultiplier: number;
  winningBets: number;
}

interface FirebaseBet {
  playerId: 'player1' | 'player2';
  amount: string | number;
  userAddress: string;
  timestamp: number;
}

interface PlayerImageData {
  imageUrl: string;
  imageKey: string;
  name?: string;
}

export default function BattleGame() {
  const { user, handleWin } = useUser();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MoonArenaScene | null>(null);
  const fighterManagerRef = useRef<FighterManager>(new FighterManager());
  const unsubscribeRefs = useRef<{ battle?: () => void; bets?: () => void }>({});
  const [currentStage, setCurrentStage] = useState<BattleStage>('betting');
  const [currentArena, setCurrentArena] = useState<ArenaConfig | null>(null);
  const [bettingState, setBettingState] = useState<BettingState>({
    player1Bets: 0,
    player2Bets: 0,
    totalBets: 0,
    lastWinner: null,
    lastPayout: null,
    recentBets: [],
    pool: {
      player1Total: 0,
      player2Total: 0,
      totalBets: 0
    }
  });
  const [simulatedBets, setSimulatedBets] = useState<SimulatedBet[]>([]);
  const [lastBattleResult, setLastBattleResult] = useState<BattleResult | null>(null);

  // Add a ref to track current fight number
  const currentFightRef = useRef(0);
  const fights = [
    {
      player1: { address: '4MpXgiYj9nEvN1xZYZ4qgB6zq5r2JMRy54WaQu5fpump' }, // BATCAT
      player2: { address: 'GnQUsLcyZ3NXUAPXymWoefMYfCwmJazBVkko4vb7pump' }  // EAGLE
    },
    {
      player1: { address: 'DpXJitV8bZrRCg6mWhsqqv43Epd7oYKyBM5SXStCTRXm' }, // EBICHU
      player2: { address: 'HLptm5e6rTgh4EKgDpYFrnRHbjpkMyVdEeREEa2G7rf9' }  // DUKO
    },
    {
      player1: { address: 'HeBCP2imwM8vosBqU5PBvm1PamCzWj2ch9ZhVrsLpump' }, // VIGI
      player2: { address: 'ETdqLnxH2DNnXxA8gx4JpCKtvHqzHBbPjFQYqtGvpump' }  // GWR
    },
    {
      player1: { address: '2DJAyCbx9HkHiPsyJdZmgio9Pu9p1w6jujXDo5h4pump' }, // COKE
      player2: { address: 'DjgujfEv2u2qz7PNuS6Ct7bctnxPFihfWE2zBpKZpump' }  // ANGLERFISH
    },
    {
      player1: { address: 'DjgujfEv2u2qz7PNuS6Ct7bctnxPFihfWE2zBpKZpump' }, // PINION
      player2: { address: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN' }  // TRUMP
    }
  ];

  // Method to place a bet
  const placeBet = async (playerId: 'player1' | 'player2', amount: number) => {
    try {
      setBettingState(prev => {
        const totalSimulated = simulatedBets.reduce((sum, bet) => 
          bet.playerId === playerId ? sum + bet.amount : sum, 0
        );

        const betAmount = amount + totalSimulated;
        const newPool = {
          ...prev.pool,
          [`${playerId}Total`]: (prev.pool?.[`${playerId}Total`] || 0) + betAmount,
          totalBets: (prev.pool?.totalBets || 0) + betAmount
        };

        const newState = {
          ...prev,
          [playerId === 'player1' ? 'player1Bets' : 'player2Bets']: 
            prev[playerId === 'player1' ? 'player1Bets' : 'player2Bets'] + betAmount,
          totalBets: prev.totalBets + betAmount,
          pool: newPool
        };

        if (sceneRef.current) {
          sceneRef.current.updateBettingAmounts(
            newState.player1Bets,
            newState.player2Bets
          );
        }

        updateCurrentBattlePool(newPool.player1Total, newPool.player2Total);
        return newState;
      });

      await recordBet(playerId, amount, user?.username || 'Anonymous');
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  const handlePayout = async (winner: string, amount: number) => {
    try {
      const winningBets = winner === 'player1' ? bettingState.player1Bets : bettingState.player2Bets;

      setBettingState(prev => ({
        ...prev,
        lastWinner: winner,
        lastPayout: amount,
        player1Bets: 0,
        player2Bets: 0,
        totalBets: 0,
        pool: {
          player1Total: 0,
          player2Total: 0,
          totalBets: 0
        }
      }));

      await handleBattleResult(winner as 'player1' | 'player2', bettingState.totalBets, winningBets);
    } catch (error) {
      console.error('Error handling payout:', error);
    }
  };

  const generateSimulatedBets = useCallback(() => {
    const numBets = Math.floor(Math.random() * 5) + 4; // 4-8 bets per interval
    const newBets: SimulatedBet[] = [];
    
    const randomNames = [
      'WhaleKing', 'MoonLord', 'DiamondChad', 'SolWhale', 
      'CryptoGod', 'BullKing', 'DegenLord', 'StarWhale',
      'LunarWhale', 'BetKing', 'TokenLord', 'DegenGod',
      'SolanaWhale', 'PumpLord', 'BetGod', 'WealthKing',
      'RichKing', 'SolMaster', 'CryptoBoss', 'MemeKing',
      'BetcoinLord', 'RichChad', 'WhaleBoss', 'SolanaGod',
      'TokenKing', 'CryptoLord', 'BetWhale', 'RichWhale',
      'MoonGod', 'BullWhale', 'ChadKing', 'DegenKing',
      'PumpKing', 'SolLord', 'WhaleGod', 'CryptoWhale',
      'BetMaster', 'RichGod', 'ChadWhale', 'MemeWhale',
      'WhaleLord', 'SolBoss', 'CryptoKing', 'BetGod',
      'TokenWhale', 'MoonWhale', 'DegenWhale', 'BullGod'
    ];
    
    for (let i = 0; i < numBets; i++) {
      // Bias towards the underdog to make it more interesting
      const poolRatio = bettingState.pool.player1Total / (bettingState.pool.totalBets || 1);
      const playerId = Math.random() > poolRatio ? 'player1' : 'player2';
      
      // Generate random bet amount between 100-2000 SOL with some whales making huge bets
      let amount;
      const betType = Math.random();
      if (betType > 0.95) { // 5% chance for mega whale bet
        amount = Math.floor(Math.random() * 1500) + 500; // 500-2000 SOL
      } else if (betType > 0.8) { // 15% chance for whale bet
        amount = Math.floor(Math.random() * 900) + 100; // 100-1000 SOL
      } else if (betType > 0.5) { // 30% chance for large bet
        amount = Math.floor(Math.random() * 400) + 100; // 100-500 SOL
      } else { // 50% chance for normal bet
        amount = Math.floor(Math.random() * 200) + 100; // 100-300 SOL
      }
      
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      
      newBets.push({
        playerId,
        amount,
        username: `${randomName}${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now()
      });
    }

    // Update simulated bets state
    setSimulatedBets(prev => [...prev, ...newBets]);
    
    // Update betting state with new bets
    setBettingState(prev => {
      const player1Total = newBets.reduce((sum, bet) => 
        bet.playerId === 'player1' ? sum + bet.amount : sum, prev.pool.player1Total
      );
      const player2Total = newBets.reduce((sum, bet) => 
        bet.playerId === 'player2' ? sum + bet.amount : sum, prev.pool.player2Total
      );
      const totalBets = player1Total + player2Total;

      const newState = {
        ...prev,
        pool: {
          player1Total,
          player2Total,
          totalBets
        },
        recentBets: [...newBets.map(bet => ({
          ...bet,
          timestamp: Date.now()
        })), ...prev.recentBets].slice(0, 10)
      };

      // Update the scene with new betting amounts
      if (sceneRef.current) {
        sceneRef.current.updateBettingAmounts(player1Total, player2Total);
      }

      // Update Firebase
      updateCurrentBattlePool(player1Total, player2Total);

      return newState;
    });
  }, [bettingState.pool]);

  const calculatePayouts = useCallback((winner: 'player1' | 'player2', totalPool: number) => {
    // Only calculate payouts at the end of the second round
    const winningBets = [...simulatedBets, ...bettingState.recentBets] as AnyBet[];
    
    const totalWinningBets = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    if (totalWinningBets === 0) return;

    // Calculate payout multiplier (90% of pool goes to winners)
    const payoutPool = totalPool * 0.9;
    const payoutMultiplier = payoutPool / totalWinningBets;

    // Set battle result for UI display
    setLastBattleResult({
      winner,
      totalPool,
      payoutMultiplier,
      winningBets: totalWinningBets
    });

    // Handle payouts for the actual user
    const userBet = winningBets.find(bet => bet.username === user?.username);
    if (userBet) {
      const userPayout = userBet.amount * payoutMultiplier;
      handleWin(winner, userPayout);
    }

    // Clear the battle result after 3 seconds (reduced from 8)
    setTimeout(() => {
      setLastBattleResult(null);
    }, 3000);
  }, [simulatedBets, bettingState.recentBets, user, handleWin]);

  // Method to handle API updates for player images
  const handlePlayerImageUpdate = useCallback((playerId: 'player1' | 'player2', imageData: PlayerImageData) => {
    if (sceneRef.current) {
      sceneRef.current.updatePlayerImageFromAPI(playerId, imageData);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: '#000000',
      scene: MoonArenaScene,
      scale: { 
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH, 
        width: 1280, 
        height: 720 
      },
      physics: { 
        default: 'arcade', 
        arcade: { 
          gravity: { x: 0, y: 0 }, 
          debug: false 
        } 
      },
      render: { antialias: true },
      autoFocus: false
    };

    try {
      gameRef.current = new Phaser.Game(config);

      const setupSceneListener = () => {
        if (!gameRef.current) return;

        const scene = gameRef.current.scene.getScene('MoonArenaScene') as MoonArenaScene;
        if (scene) {
          sceneRef.current = scene;

          scene.events.on('stageChange', (stage: BattleStage) => {
            console.log('Stage changed to:', stage);
            if (stage) {
              setCurrentStage(stage);
              updateBattleStage(stage).catch(console.error);
              
              // Clear simulated bets when transitioning to fighting
              if (stage === 'fighting') {
                setSimulatedBets([]);
              }
              // Generate new simulated bets when entering betting phase
              else if (stage === 'betting') {
                generateSimulatedBets();
              }
            }
          });

          scene.events.on('fightEnd', (data: { winner: 'player1' | 'player2', totalPool: number }) => {
            console.log('Fight ended:', data);
            setCurrentStage('payout');
            
            // Get the total pool and winning side's pool
            const winningPool = data.winner === 'player1' ? bettingState.pool.player1Total : bettingState.pool.player2Total;
            const userBetAmount = data.winner === 'player1' ? bettingState.player1Bets : bettingState.player2Bets;
            
            if (userBetAmount > 0) {
              // Calculate payout based on pool ratio
              const payoutRatio = data.totalPool / winningPool;
              const userPayout = userBetAmount * payoutRatio;
              
              console.log('Processing payout:', {
                totalPool: data.totalPool,
                winningPool,
                userBetAmount,
                payoutRatio,
                userPayout
              });
              
              // Process the payout
              handleWin(data.winner, userPayout);
              
              // Show payout in UI
              setLastBattleResult({
                winner: data.winner,
                totalPool: data.totalPool,
                payoutMultiplier: payoutRatio,
                winningBets: winningPool
              });
            }
            
            // Clear simulated bets
            setSimulatedBets([]);
            
            // Clear the battle result after 3 seconds
            setTimeout(() => {
              setLastBattleResult(null);
            }, 3000);
          });

          // Simplify bet reimbursement to just return the bet amount
          scene.events.on('betReimbursement', () => {
            const player1Amount = bettingState.player1Bets;
            const player2Amount = bettingState.player2Bets;
            
            // Return whichever amount was bet
            const refundAmount = player1Amount || player2Amount;
            
            if (refundAmount > 0) {
              console.log('Reimbursing bets:', {
                player1Amount,
                player2Amount,
                refundAmount
              });
              
              // Return the exact bet amount
              handleWin('player1', refundAmount);
              
              // Show reimbursement in UI
              setLastBattleResult({
                winner: player1Amount > 0 ? 'player1' : 'player2',
                totalPool: refundAmount,
                payoutMultiplier: 1,
                winningBets: refundAmount
              });
            }
          });

          scene.events.on('arenaChange', (arena: ArenaConfig) => setCurrentArena(arena));

          // Update UI display for payouts
          scene.events.on('payout', (data: { winner: string; payout: number }) => {
            console.log('Processing payout:', data);
            handlePayout(data.winner, data.payout);
            
            // Show payout in UI
            setLastBattleResult({
              winner: data.winner as 'player1' | 'player2',
              totalPool: data.payout,
              payoutMultiplier: data.payout / (data.winner === 'player1' ? bettingState.player1Bets : bettingState.player2Bets),
              winningBets: data.winner === 'player1' ? bettingState.player1Bets : bettingState.player2Bets
            });
            
            // Clear the payout display after 2 seconds
            setTimeout(() => {
              setLastBattleResult(null);
            }, 2000);
          });

          scene.updateBettingAmounts(bettingState.player1Bets, bettingState.player2Bets);
        } else {
          setTimeout(setupSceneListener, 100);
        }
      };

      setupSceneListener();

      const handleResize = () => gameRef.current?.scale.refresh();
      window.addEventListener('resize', handleResize);

      // Only subscribe to bets, not battle data
      unsubscribeRefs.current.bets = subscribeToRecentBets(10, (bets: Record<string, FirebaseBet>) => {
        if (bets) {
          setBettingState(prev => ({
            ...prev,
            recentBets: Object.values(bets)
              .map(bet => ({
                playerId: bet.playerId,
                amount: Number(bet.amount),
                username: bet.userAddress,
                timestamp: bet.timestamp
              }))
              .sort((a, b) => b.timestamp - a.timestamp)
          }));
        }
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        unsubscribeRefs.current.bets?.();
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
        sceneRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, []);

  // Update the betting interval useEffect
  useEffect(() => {
    let bettingInterval: NodeJS.Timeout;

    if (currentStage === 'betting') {
      // Initial burst of bets (more aggressive)
      for (let i = 0; i < 5; i++) { // Increased from 3 to 5
        generateSimulatedBets();
      }

      // Generate new bets every 0.5-1.5 seconds (faster)
      bettingInterval = setInterval(() => {
        generateSimulatedBets();
      }, Math.random() * 1000 + 500);
    }

    return () => {
      if (bettingInterval) {
        clearInterval(bettingInterval);
      }
    };
  }, [currentStage, generateSimulatedBets]);

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      <div ref={containerRef} className="relative w-full aspect-video bg-black min-h-[360px] max-h-[1080px] overflow-hidden"></div>
      {lastBattleResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black/90 p-8 rounded-xl border-2 border-[#00FFA3] text-white text-center max-w-md w-full mx-4 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6">Battle Results</h2>
            <div className="space-y-4">
              <div className="text-[#00FFA3] text-2xl mb-4 font-bold">
                {lastBattleResult.winner === 'player1' ? 'Player 1' : 'Player 2'} Wins!
              </div>
              <div className="space-y-2 text-lg">
                <p className="flex justify-between items-center">
                  <span className="text-white/60">Total Pool:</span>
                  <span className="text-white font-bold">{lastBattleResult.totalPool.toFixed(2)} SOL</span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="text-white/60">Payout Multiplier:</span>
                  <span className="text-[#00FFA3] font-bold">{lastBattleResult.payoutMultiplier.toFixed(2)}x</span>
                </p>
                <p className="flex justify-between items-center">
                  <span className="text-white/60">Winning Bets:</span>
                  <span className="text-white font-bold">{lastBattleResult.winningBets.toFixed(2)} SOL</span>
                </p>
              </div>
              <div className="mt-6 text-sm text-white/40">
                Next battle starting soon...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
