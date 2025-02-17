import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  uid: string | null;
  balance: number;
  username: string | null;
  isAuthenticated: boolean;
  currentBets: {
    battleId: string;
    amount: number;
    contestant: string;
  }[];
}

const initialState: UserState = {
  uid: null,
  balance: 1000, // Starting balance for new users
  username: null,
  isAuthenticated: false,
  currentBets: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ uid: string; username: string }>) => {
      state.uid = action.payload.uid;
      state.username = action.payload.username;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.uid = null;
      state.username = null;
      state.isAuthenticated = false;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    placeBet: (state, action: PayloadAction<{ battleId: string; amount: number; contestant: string }>) => {
      state.currentBets.push(action.payload);
      state.balance -= action.payload.amount;
    },
    clearBets: (state) => {
      state.currentBets = [];
    },
  },
});

export const { setUser, logout, updateBalance, placeBet, clearBets } = userSlice.actions;
export default userSlice.reducer; 