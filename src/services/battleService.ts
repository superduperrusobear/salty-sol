import { rtdb } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

export interface BattleData {
  bettingPool: {
    player1: number;
    player2: number;
    totalPool: number;
  };
  status: string;
}

export interface BetData {
  username: string;
  amount: number;
  playerId: 'player1' | 'player2';
  timestamp: number;
}

export interface BattleHistoryData {
  winner: 'player1' | 'player2';
  totalPool: number;
  timestamp: number;
}

export const battleService = {
  // Subscribe to current battle
  subscribeToCurrentBattle(callback: (data: BattleData | null) => void) {
    const battleRef = ref(rtdb, 'currentMatch');
    onValue(battleRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(battleRef);
  },

  // Subscribe to recent bets
  subscribeToRecentBets(limit: number, callback: (data: Record<string, BetData> | null) => void) {
    const betsRef = ref(rtdb, 'bets');
    onValue(betsRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(betsRef);
  },

  // Subscribe to battle history
  subscribeToBattleHistory(limit: number, callback: (data: Record<string, BattleHistoryData> | null) => void) {
    const historyRef = ref(rtdb, 'battleHistory');
    onValue(historyRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(historyRef);
  }
}; 