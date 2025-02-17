import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Contestant {
  id: string;
  name: string;
  odds: number;
  totalBets: number;
}

interface Battle {
  id: string;
  status: 'pending' | 'active' | 'completed';
  contestant1: Contestant;
  contestant2: Contestant;
  winner: string | null;
  startTime: number;
  endTime: number | null;
  totalPot: number;
}

interface BattleState {
  currentBattle: Battle | null;
  battleHistory: Battle[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BattleState = {
  currentBattle: null,
  battleHistory: [],
  isLoading: false,
  error: null,
};

const battleSlice = createSlice({
  name: 'battle',
  initialState,
  reducers: {
    setCurrentBattle: (state, action: PayloadAction<Battle>) => {
      state.currentBattle = action.payload;
      state.error = null;
    },
    updateBattleStatus: (state, action: PayloadAction<{ status: Battle['status']; winner?: string }>) => {
      if (state.currentBattle) {
        state.currentBattle.status = action.payload.status;
        if (action.payload.winner) {
          state.currentBattle.winner = action.payload.winner;
          state.currentBattle.endTime = Date.now();
          state.battleHistory.push({ ...state.currentBattle });
        }
      }
    },
    updateBattlePot: (state, action: PayloadAction<{ contestantId: string; amount: number }>) => {
      if (state.currentBattle) {
        const contestant = state.currentBattle.contestant1.id === action.payload.contestantId
          ? 'contestant1'
          : 'contestant2';
        state.currentBattle[contestant].totalBets += action.payload.amount;
        state.currentBattle.totalPot += action.payload.amount;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCurrentBattle,
  updateBattleStatus,
  updateBattlePot,
  setLoading,
  setError,
} = battleSlice.actions;

export default battleSlice.reducer; 