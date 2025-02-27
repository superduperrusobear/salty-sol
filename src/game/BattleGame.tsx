import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { MoonArenaScene } from './scenes/MoonArenaScene';
import { useUser } from '../contexts/UserContext';
import {
  updateCurrentBattlePool,
  recordBet,
  updateBattleStage,
  handleBattleResult,
  subscribeToCurrentBattle,
  subscribeToRecentBets
} from '../services/firebase';

type BattleStage = 'betting' | 'fighting' | 'payout';

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

interface BattleResult {
  winner: 'player1' | 'player2';
  totalPool: number;
  payoutMultiplier: number;
  winningBets: number;
}

export default function BattleGame() {
  const { user, handleWin } = useUser();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MoonArenaScene | null>(null);
  const unsubscribeRefs = useRef<{ battle?: () => void; bets?: () => void }>({});
  const [currentStage, setCurrentStage] = useState<BattleStage>('betting');
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
  const [lastBattleResult, setLastBattleResult] = useState<BattleResult | null>(null);

  // Method to place a bet
  const placeBet = async (playerId: 'player1' | 'player2', amount: number) => {
    try {
      setBettingState(prev => {
        const newPool = {
          ...prev.pool,
          [`${playerId}Total`]: (prev.pool?.[`${playerId}Total`] || 0) + amount,
          totalBets: (prev.pool?.totalBets || 0) + amount
        };

        const newState = {
          ...prev,
          [playerId === 'player1' ? 'player1Bets' : 'player2Bets']: 
            prev[playerId === 'player1' ? 'player1Bets' : 'player2Bets'] + amount,
          totalBets: prev.totalBets + amount,
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
            }
          });

          scene.events.on('battleEnd', (data: { winner: 'player1' | 'player2', totalPool: number }) => {
            console.log('Battle ended:', data);
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
            
            // Clear the battle result after 3 seconds
            setTimeout(() => {
              setLastBattleResult(null);
            }, 3000);
          });
        } else {
          setTimeout(setupSceneListener, 100);
        }
      };

      setupSceneListener();

      const handleResize = () => gameRef.current?.scale.refresh();
      window.addEventListener('resize', handleResize);

      // Subscribe to bets
      unsubscribeRefs.current.bets = subscribeToRecentBets(10, (bets: Record<string, any>) => {
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
