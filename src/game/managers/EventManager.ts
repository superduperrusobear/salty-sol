import Phaser from 'phaser';

export type BattleEvent = 
  | 'battleStart' 
  | 'battleEnd' 
  | 'bettingStart' 
  | 'bettingEnd' 
  | 'fightStart' 
  | 'fightEnd' 
  | 'damage' 
  | 'payout'
  | 'newBet'
  | 'roundComplete'
  | 'stageChange'
  | 'timeUpdate'
  | 'arenaChange';

export type BattleStage = 'betting' | 'fighting' | 'payout' | 'transitioning';

export interface BattleState {
  stage: BattleStage;
  timeRemaining: number;
  roundNumber: number;
  player1: {
    health: number;
    totalBets: number;
    odds: number;
  };
  player2: {
    health: number;
    totalBets: number;
    odds: number;
  };
  totalPool: number;
}

export class EventManager {
  private static instance: EventManager;
  private scene: Phaser.Scene;
  private emitter: Phaser.Events.EventEmitter;
  private battleState: BattleState;
  private battleTimer: Phaser.Time.TimerEvent | null = null;
  private isActive: boolean = false;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.emitter = new Phaser.Events.EventEmitter();
    
    // Initialize battle state
    this.battleState = {
      stage: 'betting',
      timeRemaining: 13000,
      roundNumber: 1,
      player1: {
        health: 100,
        totalBets: 0,
        odds: 0.5
      },
      player2: {
        health: 100,
        totalBets: 0,
        odds: 0.5
      },
      totalPool: 0
    };

    // Set up automatic stage transitions
    this.setupStageTransitions();
  }

  public static getInstance(scene: Phaser.Scene): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager(scene);
    }
    return EventManager.instance;
  }

  private setupStageTransitions() {
    // Listen for stage changes
    this.on('stageChange', (newStage: BattleStage) => {
      console.log('Stage changing to:', newStage);
      this.battleState.stage = newStage;
      
      // Clear any existing timer
      if (this.battleTimer) {
        this.battleTimer.destroy();
        this.battleTimer = null;
      }
      
      // Set up the timer for the new stage
      switch (newStage) {
        case 'betting':
          this.battleState.timeRemaining = 13000;
          this.emit('bettingStart', this.battleState);
          this.startTimer(13000, () => {
            console.log('Betting phase ended, transitioning to fighting');
            this.emit('stageChange', 'fighting');
          });
          break;
        
        case 'fighting':
          this.battleState.timeRemaining = 65000;
          this.emit('fightStart', this.battleState);
          this.startTimer(65000, () => {
            const winner = this.battleState.player1.health >= this.battleState.player2.health ? 'player1' : 'player2';
            this.endFight(winner);
          });
          break;
        
        case 'payout':
          this.battleState.timeRemaining = 5000;
          this.startTimer(5000, () => {
            console.log('Payout phase ended, transitioning to next round');
            this.emit('stageChange', 'transitioning');
          });
          break;
        
        case 'transitioning':
          this.battleState.timeRemaining = 3000;
          this.startTimer(3000, () => {
            console.log('Starting new round');
            this.startNewRound();
          });
          break;
      }
    });
  }

  private startTimer(duration: number, callback: () => void) {
    console.log(`Starting timer for ${duration}ms`);
    if (this.battleTimer) {
      this.battleTimer.destroy();
    }
    
    this.battleTimer = this.scene.time.addEvent({
      delay: duration,
      callback: () => {
        console.log(`Timer completed after ${duration}ms`);
        callback();
      },
      callbackScope: this
    });
  }

  public startBattleCycle() {
    if (this.isActive) return;
    console.log('Starting battle cycle');
    this.isActive = true;
    
    // Reset battle state
    this.battleState = {
      stage: 'betting',
      timeRemaining: 13000,
      roundNumber: 1,
      player1: {
        health: 100,
        totalBets: 0,
        odds: 0.5
      },
      player2: {
        health: 100,
        totalBets: 0,
        odds: 0.5
      },
      totalPool: 0
    };

    // Start with betting phase
    console.log('Emitting initial stageChange to betting');
    this.emit('stageChange', 'betting');
  }

  public stopBattleCycle() {
    this.isActive = false;
    if (this.battleTimer) {
      this.battleTimer.destroy();
      this.battleTimer = null;
    }
  }

  public startNewRound() {
    if (!this.isActive) return;
    console.log('Starting new round');
    
    // Reset battle state for new round
    this.battleState.player1.health = 100;
    this.battleState.player2.health = 100;
    this.battleState.player1.totalBets = 0;
    this.battleState.player2.totalBets = 0;
    this.battleState.totalPool = 0;
    this.battleState.roundNumber++;
    
    // Calculate parimutuel odds
    this.updateOdds();
    
    // Start betting phase
    this.emit('stageChange', 'betting');
  }

  public placeBet(playerId: 'player1' | 'player2', amount: number) {
    if (this.battleState.stage !== 'betting') {
      throw new Error('Cannot place bets outside betting phase');
    }

    // Update betting state
    this.battleState[playerId].totalBets += amount;
    this.battleState.totalPool += amount;

    // Recalculate parimutuel odds
    this.updateOdds();

    // Emit bet event with updated odds
    this.emit('newBet', {
      playerId,
      amount,
      totalBets: this.battleState[playerId].totalBets,
      odds: this.battleState[playerId].odds,
      potentialPayout: this.calculatePotentialPayout(playerId, amount),
      totalPool: this.battleState.totalPool
    });
  }

  private calculatePotentialPayout(playerId: 'player1' | 'player2', betAmount: number): number {
    // In parimutuel betting, payout = (total pool * 0.9) * (your bet / winner pool)
    const totalPool = this.battleState.totalPool;
    const playerPool = this.battleState[playerId].totalBets;
    
    if (playerPool === 0) return 0;
    
    // Calculate potential payout if this player wins
    const payoutPool = totalPool * 0.9; // 90% of total pool (10% house fee)
    return (payoutPool * (betAmount / playerPool));
  }

  public applyDamage(targetId: 'player1' | 'player2', amount: number) {
    if (this.battleState.stage !== 'fighting') return;

    const target = this.battleState[targetId];
    target.health = Math.max(0, target.health - amount);

    this.emit('damage', {
      targetId,
      damage: amount,
      remainingHealth: target.health
    });

    // Check if fight should end
    if (target.health <= 0) {
      const winner = targetId === 'player1' ? 'player2' : 'player1';
      this.endFight(winner);
    }
  }

  private updateOdds() {
    const totalPool = this.battleState.totalPool;
    
    if (totalPool === 0) {
      // Even odds when no bets placed
      this.battleState.player1.odds = 0.5;
      this.battleState.player2.odds = 0.5;
      return;
    }

    // In parimutuel betting, odds are based on proportion of total pool
    this.battleState.player1.odds = this.battleState.player1.totalBets / totalPool;
    this.battleState.player2.odds = this.battleState.player2.totalBets / totalPool;
  }

  private endFight(winnerId: 'player1' | 'player2') {
    const winnerBets = this.battleState[winnerId].totalBets;
    const payout = this.calculatePayout(winnerBets);

    this.emit('fightEnd', {
      winner: winnerId,
      payout,
      totalPool: this.battleState.totalPool,
      payoutPerBet: winnerBets > 0 ? payout / winnerBets : 0,
      finalState: this.battleState
    });

    this.emit('stageChange', 'payout');
  }

  private calculatePayout(winnerBets: number): number {
    if (winnerBets === 0) return 0;
    // Parimutuel payout calculation
    return this.battleState.totalPool * 0.9; // 90% of total pool
  }

  public getBattleState(): BattleState {
    return { ...this.battleState };
  }

  public on(event: BattleEvent, fn: (...args: any[]) => void, context?: any) {
    this.emitter.on(event, fn, context);
  }

  public once(event: BattleEvent, fn: (...args: any[]) => void, context?: any) {
    this.emitter.once(event, fn, context);
  }

  public emit(event: BattleEvent, ...args: any[]) {
    this.emitter.emit(event, ...args);
  }

  public off(event: BattleEvent, fn?: (...args: any[]) => void, context?: any, once?: boolean) {
    this.emitter.off(event, fn, context, once);
  }

  public removeAllListeners(event?: BattleEvent) {
    this.emitter.removeAllListeners(event);
  }

  public updateTimeRemaining(delta: number) {
    if (!this.isActive) return;
    
    // Convert delta to milliseconds (Phaser provides delta in ms)
    this.battleState.timeRemaining = Math.max(0, this.battleState.timeRemaining - delta);
    
    // Emit time update event for UI
    this.emit('timeUpdate', {
      stage: this.battleState.stage,
      timeRemaining: this.battleState.timeRemaining
    });

    // Debug log every second
    if (Math.floor(this.battleState.timeRemaining / 1000) !== Math.floor((this.battleState.timeRemaining + delta) / 1000)) {
      console.log(`Time remaining in ${this.battleState.stage} phase: ${Math.ceil(this.battleState.timeRemaining / 1000)}s`);
    }
  }
} 