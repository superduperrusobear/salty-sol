import { db } from '@/config/firebase';
import { ref, set, get } from 'firebase/database';

export interface UserData {
  username: string;
  isGuest: boolean;
  createdAt: number;
  online?: boolean;
  lastSeen?: number;
}

export const userService = {
  // Store user data in RTDB
  async storeUserData(username: string, isGuest: boolean): Promise<void> {
    try {
      const userRef = ref(db, `users/${username}`);
      const userData: UserData = {
        username,
        isGuest,
        createdAt: Date.now(),
        online: true,
        lastSeen: Date.now()
      };
      
      await set(userRef, userData);
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  },

  // Check if username exists
  async checkUsername(username: string): Promise<boolean> {
    try {
      const userRef = ref(db, `users/${username}`);
      const snapshot = await get(userRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }
}; 