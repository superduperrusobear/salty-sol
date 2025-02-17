import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import battleReducer from './slices/battleSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    battle: battleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 