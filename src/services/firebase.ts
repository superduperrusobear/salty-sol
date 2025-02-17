import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  signInAnonymously,
  onAuthStateChanged,
  Auth,
  User 
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  off,
  serverTimestamp,
  query,
  limitToLast,
  update,
  get,
  orderByChild,
  Database
} from 'firebase/database';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Your web app's Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Only initialize analytics on the client side
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Export Firebase instances
export { app, auth, db };

console.log('📝 Firebase config loaded:', {
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL,
  authDomain: firebaseConfig.authDomain
});

// Set persistence to LOCAL (this will persist the auth state across page refreshes)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('🔐 Firebase auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('❌ Error setting auth persistence:', error);
  });

// Initialize database only after authentication
const initializeAfterAuth = async () => {
  // Wait for auth to be ready
  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      unsubscribe();
      if (user) {
        console.log('👤 User is authenticated:', user.uid);
      } else {
        console.log('👤 No user authenticated, creating anonymous session');
        signInAnonymously(auth).catch((error: unknown) => {
          console.error('❌ Anonymous auth failed:', error);
        });
      }
      resolve();
    });
  });

  // Now proceed with database initialization
  console.log('🔄 Starting database structure initialization...');
  try {
    const rootRef = ref(db);
    
    // Initial data structure
    const initialData = {
      users: {
        _initialized: {
          timestamp: serverTimestamp(),
          status: 'active'
        }
      },
      chat: {
        messages: {
          _initialized: {
            timestamp: serverTimestamp(),
            message: 'Chat system initialized',
            userId: 'system',
            username: 'System'
          }
        }
      },
      currentMatch: {
        status: 'betting_open',
        startTime: serverTimestamp(),
        bettingPool: {
          player1: 0,
          player2: 0,
          totalPool: 0
        }
      }
    };

    // Try to write the initial data
    console.log('📝 Writing initial database structure...');
    await set(rootRef, initialData);
    console.log('✅ Initial database structure created successfully');

    // Test database access
    await testDatabaseAccess();

  } catch (error: unknown) {
    console.error('❌ Error in database initialization:', error);
    // Try writing nodes individually
    try {
      console.log('🔄 Attempting individual node creation...');
      const nodes = ['users', 'chat/messages', 'currentMatch'];
      
      for (const nodePath of nodes) {
        const nodeRef = ref(db, nodePath);
        await set(nodeRef, {
          _initialized: {
            timestamp: serverTimestamp(),
            status: 'active'
          }
        });
        console.log(`✅ Created node: ${nodePath}`);
      }
    } catch (retryError: unknown) {
      console.error('❌ Failed to create individual nodes:', retryError);
    }
  }
};

// Start initialization process
console.log('🚀 Starting Firebase initialization...');
initializeAfterAuth().catch((error: unknown) => {
  console.error('❌ Firebase initialization failed:', error);
});

// Test database access function
const testDatabaseAccess = async () => {
  console.log('🔄 Testing database access...');
  try {
    // Test write
    const testRef = ref(db, 'connectionTest');
    await set(testRef, {
      timestamp: serverTimestamp(),
      message: 'Testing connection',
      userId: auth.currentUser?.uid || 'anonymous'
    });
    console.log('✅ Write test successful');

    // Test read
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      console.log('✅ Read test successful');
      // Clean up test data
      await set(testRef, null);
      console.log('✅ Cleanup successful');
    }

    return true;
  } catch (error: unknown) {
    console.error('❌ Database access test failed:', error);
    throw error;
  }
};

// Test database connection immediately
const testRef = ref(db, '.info/connected');
onValue(testRef, (snapshot) => {
  if (snapshot.val() === true) {
    console.log('✅ Successfully connected to Firebase at:', firebaseConfig.databaseURL);
    console.log('🔑 Auth state:', auth.currentUser?.uid || 'No user authenticated');
  } else {
    console.error('❌ Failed to connect to Firebase Database');
    console.error('Current database reference:', testRef.toString());
  }
}, (error) => {
  console.error('🚫 Firebase connection error:', error);
});

// Verify database connection and auth state
const connectedRef = ref(db, '.info/connected');
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log('🟢 Connected to Firebase Database');
    console.log('👤 Current auth state:', auth.currentUser?.uid);
    
    // Only initialize if we have an authenticated user
    if (auth.currentUser) {
      // Verify user data exists
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      get(userRef).then(snapshot => {
        if (snapshot.exists()) {
          console.log('✅ User data found:', snapshot.val().username);
        } else {
          console.log('❌ No user data found for:', auth.currentUser?.uid);
        }
      });
    } else {
      console.log('No authenticated user - skipping database initialization');
    }
  } else {
    console.log('🔴 Not connected to Firebase Database');
  }
});

// Initialize required database structure
const initializeDatabase = async () => {
  // Define updates object outside try block
  const updates: { [key: string]: any } = {
    'users': {
      '_initialized': {
        timestamp: serverTimestamp(),
        status: 'active',
        description: 'User profiles with balances and betting history'
      }
    },
    'usernames': {
      '_initialized': {
        timestamp: serverTimestamp(),
        status: 'active',
        description: 'Username reservations and stats'
      }
    },
    'chat': {
      '_initialized': {
        timestamp: serverTimestamp(),
        status: 'active',
        description: 'Live chat messages and user interactions'
      },
      'messages': {
        '_initialized': {
          timestamp: serverTimestamp(),
          description: 'Live chat message history'
        }
      }
    },
    'currentMatch': {
      status: 'betting_open',
      startTime: serverTimestamp(),
      endTime: null,
      player1: {
        symbol: 'BONK',
        marketCap: 0,
        priceChange24h: 0,
        lastUpdated: null
      },
      player2: {
        symbol: 'WEN',
        marketCap: 0,
        priceChange24h: 0,
        lastUpdated: null
      },
      bettingPool: {
        player1: 0,
        player2: 0,
        totalPool: 0,
        houseFee: 0.1 // 10% house fee
      },
      bets: {
        '_initialized': {
          timestamp: serverTimestamp(),
          description: 'Active bets for current match'
        }
      }
    },
    'matchHistory': {
      '_initialized': {
        timestamp: serverTimestamp(),
        status: 'active',
        description: 'Historical match results and payouts'
      }
    }
  };

  try {
    console.log('Starting database initialization...');
    
    // First, clean up any old nodes
    const oldNodes = ['currentBattle', 'battleHistory', 'recentBets'];
    for (const node of oldNodes) {
      console.log(`Cleaning up old node: ${node}`);
      await set(ref(db, node), null);
    }
    
    // Force update all nodes
    console.log('Creating database structure...');
    await update(ref(db), updates);
    console.log('Database structure created');

    // Verify nodes were created
    const verifyNodes = async () => {
      const nodes = ['users', 'usernames', 'currentMatch', 'matchHistory'];
      for (const node of nodes) {
        const nodeRef = ref(db, node);
        const snapshot = await get(nodeRef);
        if (!snapshot.exists()) {
          console.error(`Node ${node} was not created properly`);
          // Try to create it again
          await set(nodeRef, updates[node]);
        } else {
          console.log(`Node ${node} verified`);
        }
      }
    };

    await verifyNodes();
    console.log('All nodes verified');
    
    // Verify existing usernames
    await verifyUsernameRecords();
  } catch (error) {
    console.error('Error initializing database:', error);
    // Try one more time after a short delay
    setTimeout(async () => {
      try {
        console.log('Retrying database initialization...');
        await update(ref(db), updates);
        console.log('Database initialization retry successful');
      } catch (retryError) {
        console.error('Database initialization retry failed:', retryError);
      }
    }, 2000);
  }
};

// Add username verification
const verifyUsernameRecords = async () => {
  try {
    console.log('Starting username verification...');
    
    // First ensure the usernames node exists
    const usernamesRef = ref(db, 'usernames');
    await set(usernamesRef, {
      '_initialized': {
        timestamp: serverTimestamp(),
        status: 'active'
      }
    });
    
    const usersRef = ref(db, 'users');
    const [usersSnapshot, usernamesSnapshot] = await Promise.all([
      get(usersRef),
      get(usernamesRef)
    ]);
    
    const users = usersSnapshot.val() || {};
    const usernames = usernamesSnapshot.val() || {};
    
    console.log('Current users:', Object.keys(users));
    console.log('Current usernames:', Object.keys(usernames));
    
    // Check each user has a corresponding username record
    for (const [userId, userData] of Object.entries(users)) {
      if (userId === '_initialized') continue;
      
      const user = userData as UserProfile;
      if (!usernames[user.username] || usernames[user.username].userId !== userId) {
        console.log(`Creating username record for ${user.username}`);
        await set(ref(db, `usernames/${user.username}`), {
          userId,
          createdAt: user.createdAt,
          totalBets: user.totalBets || 0,
          wins: user.wins || 0,
          lastUpdated: serverTimestamp()
        });
      }
    }
    
    console.log('Username records verified and updated');
  } catch (error) {
    console.error('Error verifying username records:', error);
  }
};

// Test write function
const testDatabaseWrite = async () => {
  try {
    // Test general connection
    const testRef = ref(db, 'connectionTest');
    console.log('🔄 Attempting test write to:', testRef.toString());
    await set(testRef, {
      timestamp: serverTimestamp(),
      status: 'Testing connection',
      testId: Math.random().toString(36).substring(7)
    });
    console.log('✅ Firebase write test successful');
    // Clean up test data
    await set(testRef, null);
  } catch (error) {
    console.error('❌ Firebase write test failed:', error);
    console.error('Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      serverResponse: (error as any)?.serverResponse
    });
  }
};

// Run test write after a short delay
setTimeout(() => {
  console.log('🔄 Running database write test...');
  testDatabaseWrite();
}, 2000);

// User Profile Management
interface UserProfile {
  username: string;
  solBalance: number;
  totalBets: number;
  wins: number;
  losses: number;
  createdAt: number;
}

interface UsernameRecord {
  userId: string;
  createdAt: any;
  totalBets?: number;
  totalWins?: number;
  lastBet?: any;
}

// Modify the connection handler to initialize database
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log('🟢 Connected to Firebase Database');
    console.log('👤 Current auth state:', auth.currentUser?.uid);
    
    // Only initialize if we have an authenticated user
    if (auth.currentUser) {
      // Verify user data exists
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      get(userRef).then(snapshot => {
        if (snapshot.exists()) {
          console.log('✅ User data found:', snapshot.val().username);
        } else {
          console.log('❌ No user data found for:', auth.currentUser?.uid);
        }
      });
    } else {
      console.log('No authenticated user - skipping database initialization');
    }
  } else {
    console.log('🔴 Not connected to Firebase Database');
  }
});

// Modify updateUserProfile to be more robust
export const updateUserProfile = async (userId: string, profile: UserProfile) => {
  console.log('Starting updateUserProfile:', { userId, profile });
  
  if (!profile.username || profile.username.trim().length === 0) {
    throw new Error('Username cannot be empty');
  }
  
  // First check if username is taken
  const usernamesRef = ref(db, 'usernames');
  const snapshot = await get(usernamesRef);
  const usernames = snapshot.val() || {};
  
  console.log('Current usernames:', usernames);
  
  // If username is taken by someone else
  if (usernames[profile.username] && usernames[profile.username].userId !== userId) {
    console.error('Username taken:', profile.username);
    throw new Error('Username is already taken');
  }
  
  try {
    // Create the updates object for atomic update
    const updates: { [key: string]: any } = {};
    
    // Update user profile
    updates[`users/${userId}`] = {
      ...profile,
      lastUpdated: serverTimestamp()
    };
    
    // Create/update username record with additional metadata
    updates[`usernames/${profile.username}`] = {
      userId,
      createdAt: profile.createdAt,
      totalBets: profile.totalBets || 0,
      wins: profile.wins || 0,
      lastUpdated: serverTimestamp()
    };
    
    // Perform atomic update
    await update(ref(db), updates);
    
    console.log('Profile and username updated successfully:', profile.username);
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

// Update username stats when bet is placed
const updateUsernameStats = async (username: string, won: boolean = false) => {
  const usernameRef = ref(db, `usernames/${username}`);
  const snapshot = await get(usernameRef);
  const userData = snapshot.val();
  
  if (userData) {
    await update(usernameRef, {
      totalBets: (userData.totalBets || 0) + 1,
      wins: won ? (userData.wins || 0) + 1 : (userData.wins || 0),
      lastBet: serverTimestamp()
    });
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);
  return snapshot.val();
};

// Battle Management
export const updateCurrentBattlePool = async (player1Total: number, player2Total: number) => {
  const totalBets = player1Total + player2Total;
  await set(ref(db, 'currentBattle/pool'), {
    player1Total,
    player2Total,
    totalBets
  });
};

// Update user balance in Firebase
export const updateUserBalance = async (userId: string, newBalance: number) => {
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, {
    solBalance: newBalance,
    lastUpdated: serverTimestamp()
  });
};

// Modify recordBet to update username stats
export const recordBet = async (playerId: 'player1' | 'player2', amount: number, userAddress: string) => {
  console.log('Recording bet:', { playerId, amount, userAddress });
  
  // Get user data
  const userRef = ref(db, `users/${userAddress}`);
  const userSnapshot = await get(userRef);
  const userData = userSnapshot.val();
  
  if (!userData) {
    throw new Error('User not found');
  }

  try {
    // Create atomic updates
    const updates: { [key: string]: any } = {};
    
    // Add bet to current match
    const betRef = push(ref(db, 'currentMatch/bets')).key;
    updates[`currentMatch/bets/${betRef}`] = {
      playerId,
      amount,
      userAddress,
      username: userData.username,
      timestamp: serverTimestamp()
    };
    
    // Update betting pool
    updates[`currentMatch/bettingPool/${playerId}`] = serverTimestamp();
    updates[`currentMatch/bettingPool/totalPool`] = serverTimestamp();
    
    // Update user stats
    updates[`users/${userAddress}/totalBets`] = (userData.totalBets || 0) + 1;
    updates[`users/${userAddress}/solBalance`] = (userData.solBalance || 0) - amount;
    updates[`users/${userAddress}/lastBetTimestamp`] = serverTimestamp();
    
    // Perform atomic update
    console.log('Performing atomic update with:', updates);
    await update(ref(db), updates);
    console.log('Bet recorded successfully');
    
  } catch (error) {
    console.error('Error recording bet:', error);
    throw error;
  }
};

export const updateBattleStage = async (stage: string) => {
  await set(ref(db, 'currentBattle/stage'), stage);
};

// Modify handleBattleResult to update username stats for winners
export const handleBattleResult = async (
  winner: 'player1' | 'player2',
  totalPool: number,
  winningBets: number
) => {
  // Calculate payout (90% of pool to winners, 10% house fee)
  const payoutPool = totalPool * 0.9;
  const payoutMultiplier = payoutPool / winningBets;

  // Get all bets for this battle
  const betsRef = ref(db, 'currentBattle/recentBets');
  const betsSnapshot = await get(betsRef);
  const bets = betsSnapshot.val() || {};

  // Process payouts for winning bets
  for (const [betId, bet] of Object.entries(bets)) {
    const betData = bet as any;
    if (betData.playerId === winner) {
      const userRef = ref(db, `users/${betData.userAddress}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();

      if (userData) {
        const payout = betData.amount * payoutMultiplier;
        await update(userRef, {
          solBalance: (userData.solBalance || 0) + payout,
          wins: (userData.wins || 0) + 1,
          lastPayout: payout,
          lastPayoutTimestamp: serverTimestamp()
        });

        // Update username stats for winner
        await updateUsernameStats(userData.username, true);
      }
    }
  }

  // Record battle result
  const resultRef = push(ref(db, 'battleHistory'));
  await set(resultRef, {
    winner,
    totalPool,
    payoutPool,
    payoutMultiplier,
    timestamp: serverTimestamp()
  });

  // Reset current battle
  await set(ref(db, 'currentBattle/pool'), {
    player1Total: 0,
    player2Total: 0,
    totalBets: 0
  });
};

// Chat Functions
export const subscribeToChatMessages = (limit: number, callback: (messages: any[]) => void) => {
  const messagesRef = ref(db, 'chat/messages');
  const messagesQuery = query(
    messagesRef,
    orderByChild('timestamp'),
    limitToLast(limit)
  );

  onValue(messagesQuery, (snapshot) => {
    const messages: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    callback(messages);
  });

  return () => off(messagesRef);
};

export const sendChatMessage = async (message: string, username: string) => {
  if (!message.trim() || !username.trim()) {
    throw new Error('Message and username are required');
  }

  const messagesRef = ref(db, 'chat/messages');
  const newMessageRef = push(messagesRef);

  const messageData = {
    username: username.trim(),
    message: message.trim(),
    timestamp: serverTimestamp()
  };

  try {
    await set(newMessageRef, messageData);
    return messageData;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Listeners
export const subscribeToCurrentBattle = (callback: (data: any) => void): (() => void) => {
  console.log('🔄 Setting up current match subscription...');
  const matchRef = ref(db, 'currentMatch');
  console.log('📍 Listening at path:', matchRef.toString());
  
  const unsubscribe = onValue(matchRef, (snapshot) => {
    if (snapshot.exists()) {
      console.log('✅ Received current match data:', snapshot.val());
      callback(snapshot.val());
    } else {
      console.log('⚠️ No data at currentMatch path');
      callback(null);
    }
  }, (error) => {
    console.error('❌ Error in current match subscription:', error);
  });

  return () => {
    console.log('🔄 Unsubscribing from current match');
    unsubscribe();
  };
};

export const subscribeToRecentBets = (limit: number, callback: (bets: any) => void): (() => void) => {
  console.log('🔄 Setting up recent bets subscription with limit:', limit);
  const betsRef = query(
    ref(db, 'currentMatch/bets'),
    limitToLast(limit)
  );
  console.log('📍 Listening at path:', betsRef.toString());
  
  const unsubscribe = onValue(betsRef, (snapshot) => {
    if (snapshot.exists()) {
      const bets = snapshot.val();
      console.log('✅ Received bets data:', bets);
      callback(bets);
    } else {
      console.log('⚠️ No bets data available');
      callback(null);
    }
  }, (error) => {
    console.error('❌ Error in recent bets subscription:', error);
  });

  return () => {
    console.log('🔄 Unsubscribing from recent bets');
    unsubscribe();
  };
};

export const subscribeToBattleHistory = (limit: number, callback: (data: any) => void) => {
  console.log('Setting up match history subscription');
  const historyQuery = query(ref(db, 'matchHistory'), limitToLast(limit));
  onValue(historyQuery, (snapshot) => {
    console.log('Received match history update:', snapshot.val());
    callback(snapshot.val());
  }, (error) => {
    console.error('Error in match history subscription:', error);
  });
  return () => off(historyQuery);
};

// Add user-specific subscriptions
export const subscribeToUserProfile = (userId: string, callback: (data: UserProfile | null) => void) => {
  const userRef = ref(db, `users/${userId}`);
  onValue(userRef, (snapshot) => {
    callback(snapshot.val());
  });
  return () => off(userRef);
};

// Add leaderboard functionality
export const getTopPlayers = async (limit: number = 10) => {
  const usersRef = ref(db, 'users');
  const topUsersQuery = query(usersRef, limitToLast(limit));
  const snapshot = await get(topUsersQuery);
  return snapshot.val();
};

// Add interface for bet history
interface BetHistoryRecord {
  user: string;
  username: string;
  amount: number;
  player: 'player1' | 'player2';
  timestamp: any;
}

// Modify placeBet to include history logging
export const placeBet = async (userId: string, player: 'player1' | 'player2', amount: number) => {
  // Get current match status
  const matchRef = ref(db, 'currentMatch');
  const matchSnapshot = await get(matchRef);
  const match = matchSnapshot.val();

  if (match.status !== 'betting_open') {
    throw new Error('Betting is closed for this match');
  }

  // Get user data
  const userRef = ref(db, `users/${userId}`);
  const userSnapshot = await get(userRef);
  const userData = userSnapshot.val();

  if (!userData) {
    throw new Error('User not found');
  }

  if (userData.solBalance < amount) {
    throw new Error('Insufficient balance');
  }

  // Create atomic updates
  const updates: { [key: string]: any } = {};

  // Update user balance
  updates[`users/${userId}/solBalance`] = userData.solBalance - amount;
  updates[`users/${userId}/totalBets`] = (userData.totalBets || 0) + 1;

  // Record bet in current match
  const betRef = push(ref(db, 'currentMatch/bets')).key;
  updates[`currentMatch/bets/${betRef}`] = {
    userId,
    username: userData.username,
    player,
    amount,
    timestamp: serverTimestamp()
  };

  // Update betting pool
  updates[`currentMatch/bettingPool/${player}`] = match.bettingPool[player] + amount;
  updates[`currentMatch/bettingPool/totalPool`] = match.bettingPool.totalPool + amount;

  // Log bet in history
  const historyRef = push(ref(db, 'betsHistory')).key;
  updates[`betsHistory/${historyRef}`] = {
    user: userId,
    username: userData.username,
    amount,
    player,
    timestamp: serverTimestamp()
  };

  // Perform atomic update
  await update(ref(db), updates);
};

// Add function to subscribe to recent bets
export const subscribeToRecentBetsHistory = (limit: number, callback: (bets: BetHistoryRecord[]) => void) => {
  const betsQuery = query(
    ref(db, 'betsHistory'),
    limitToLast(limit)
  );

  onValue(betsQuery, (snapshot) => {
    if (snapshot.exists()) {
      const bets = Object.values(snapshot.val() as { [key: string]: BetHistoryRecord })
        .sort((a, b) => b.timestamp - a.timestamp);
      callback(bets);
    } else {
      callback([]);
    }
  });

  return () => off(betsQuery);
};

// Add function to clean up old bets (call this periodically)
export const cleanupOldBets = async (maxAgeMinutes: number = 10) => {
  const betsRef = ref(db, 'betsHistory');
  const snapshot = await get(betsRef);
  
  if (snapshot.exists()) {
    const now = Date.now();
    const cutoff = now - (maxAgeMinutes * 60 * 1000);
    
    const updates: { [key: string]: null } = {};
    snapshot.forEach((child) => {
      if (child.val().timestamp < cutoff) {
        updates[child.key as string] = null;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(ref(db, 'betsHistory'), updates);
    }
  }
};

export const lockBets = async () => {
  await update(ref(db, 'currentMatch'), {
    status: 'locked',
    endTime: serverTimestamp()
  });
};

// Add interface for bet record
interface BetRecord {
  userId: string;
  username: string;
  player: 'player1' | 'player2';
  amount: number;
  timestamp: any;
}

export const determineWinner = async (winner: 'player1' | 'player2') => {
  const matchRef = ref(db, 'currentMatch');
  const matchSnapshot = await get(matchRef);
  const match = matchSnapshot.val();

  if (match.status !== 'locked') {
    throw new Error('Match must be locked before determining winner');
  }

  const { bettingPool, bets } = match;
  const totalPool = bettingPool.totalPool;
  const winningPool = bettingPool[winner];
  const payoutMultiplier = totalPool / winningPool;

  // Process payouts
  const updates: { [key: string]: any } = {};

  // Record match in history
  const historyRef = push(ref(db, 'matchHistory')).key;
  updates[`matchHistory/${historyRef}`] = {
    ...match,
    winner,
    payoutMultiplier,
    resolvedAt: serverTimestamp()
  };

  // Process winner payouts
  for (const [betId, bet] of Object.entries(bets)) {
    const betRecord = bet as BetRecord;
    if (betRecord.player === winner) {
      const winnings = betRecord.amount * payoutMultiplier;
      updates[`users/${betRecord.userId}/solBalance`] = serverTimestamp();
      updates[`users/${betRecord.userId}/wins`] = serverTimestamp();
      updates[`users/${betRecord.userId}/lastWin`] = {
        matchId: historyRef,
        amount: winnings,
        timestamp: serverTimestamp()
      };
    }
  }

  // Reset current match
  updates['currentMatch'] = {
    status: 'betting_open',
    player1: {
      symbol: 'BONK', // This will be replaced with API data
      marketCap: 0,
      totalBets: 0
    },
    player2: {
      symbol: 'WEN', // This will be replaced with API data
      marketCap: 0,
      totalBets: 0
    },
    bettingPool: {
      player1: 0,
      player2: 0,
      totalPool: 0
    },
    bets: {},
    startTime: serverTimestamp(),
    endTime: null
  };

  await update(ref(db), updates);
};

// Add these interfaces for chat
interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: any;
  userLevel?: number;
  totalBets?: number;
}

// Add chat moderation functions
export const deleteMessage = async (messageId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to moderate chat');

  // Check if user is a moderator
  const userRef = ref(db, `users/${user.uid}`);
  const userSnapshot = await get(userRef);
  const userData = userSnapshot.val();

  if (!userData?.isModerator) throw new Error('Unauthorized');

  await set(ref(db, `chat/${messageId}`), null);
};

export const muteUser = async (userId: string, durationMinutes: number) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to moderate chat');

  // Check if user is a moderator
  const userRef = ref(db, `users/${user.uid}`);
  const userSnapshot = await get(userRef);
  const userData = userSnapshot.val();

  if (!userData?.isModerator) throw new Error('Unauthorized');

  await set(ref(db, `mutedUsers/${userId}`), {
    mutedUntil: Date.now() + (durationMinutes * 60 * 1000),
    mutedBy: user.uid,
    timestamp: serverTimestamp()
  });
};

// Fight System
interface Fight {
  id: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'in_progress' | 'completed';
  winner?: 'player1' | 'player2';
  player1: {
    name: string;
    odds: number;
  };
  player2: {
    name: string;
    odds: number;
  };
  seed: number;
}

const FIGHT_DURATION = 30000; // 30 seconds
const NEXT_FIGHT_DELAY = 10000; // 10 seconds

// Get the current server time offset
let serverTimeOffset = 0;
const timeRef = ref(db, '.info/serverTimeOffset');
onValue(timeRef, (snapshot) => {
  serverTimeOffset = snapshot.val() || 0;
});

// Get the current server time
const getServerTime = () => Date.now() + serverTimeOffset;

// Start a new fight
export const startNewFight = async () => {
  const fighters = [
    { name: 'BONK', odds: 1.5 },
    { name: 'WEN', odds: 2.0 },
    { name: 'MYRO', odds: 1.8 },
    { name: 'SAMO', odds: 1.7 }
  ];

  // Randomly select two different fighters
  const getRandomFighter = () => fighters[Math.floor(Math.random() * fighters.length)];
  let player1 = getRandomFighter();
  let player2;
  do {
    player2 = getRandomFighter();
  } while (player2.name === player1.name);

  const currentTime = getServerTime();
  const startTime = currentTime + 5000; // Start in 5 seconds
  const endTime = startTime + FIGHT_DURATION;
  
  const fight: Fight = {
    id: push(ref(db, 'fights')).key!,
    startTime,
    endTime,
    status: 'pending',
    player1,
    player2,
    seed: Math.floor(Math.random() * 1000000) // Random seed for fight outcome
  };

  // Store the fight in Firebase
  await set(ref(db, 'currentFight'), fight);
  return fight;
};

// Check if a new fight needs to be started
export const checkAndStartNewFight = async () => {
  const currentFightRef = ref(db, 'currentFight');
  const snapshot = await get(currentFightRef);
  const currentFight = snapshot.val() as Fight | null;
  const currentTime = getServerTime();

  if (!currentFight || 
      currentFight.status === 'completed' && 
      currentTime > currentFight.endTime + NEXT_FIGHT_DELAY) {
    return startNewFight();
  }

  return currentFight;
};

// Subscribe to current fight with automatic status updates
export const subscribeToCurrentFight = (callback: (fight: Fight | null) => void) => {
  const fightRef = ref(db, 'currentFight');
  
  const unsubscribe = onValue(fightRef, (snapshot) => {
    const fight = snapshot.val() as Fight | null;
    if (fight) {
      const currentTime = getServerTime();
      
      // Automatically update fight status based on time
      if (fight.status === 'pending' && currentTime >= fight.startTime) {
        updateFightStatus('in_progress');
      } else if (fight.status === 'in_progress' && currentTime >= fight.endTime) {
        completeFight(fight);
      }
    }
    callback(fight);
  });

  return unsubscribe;
};

// Update fight status
export const updateFightStatus = async (status: 'pending' | 'in_progress' | 'completed') => {
  await update(ref(db, 'currentFight'), { status });
};

// Complete the fight and determine winner
export const completeFight = async (fight: Fight) => {
  if (fight.status === 'completed') return;

  // Use fight seed and end time to determine winner
  const hash = fight.seed * fight.endTime;
  const winner = hash % 2 === 0 ? 'player1' : 'player2';

  const updates: { [key: string]: any } = {
    'currentFight/status': 'completed',
    'currentFight/winner': winner,
    [`fights/${fight.id}`]: {
      ...fight,
      status: 'completed',
      winner
    }
  };

  await update(ref(db), updates);
};

// Get fight history
export const getFightHistory = async (limit: number = 10) => {
  const fightsRef = ref(db, 'fights');
  const fightsQuery = query(
    fightsRef,
    orderByChild('endTime'),
    limitToLast(limit)
  );
  
  const snapshot = await get(fightsQuery);
  return snapshot.val();
}; 