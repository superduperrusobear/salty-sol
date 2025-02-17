import * as admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import path from 'path';

// Initialize Firebase Admin
try {
  // Check if app is already initialized
  admin.app();
} catch {
  // Initialize the app if it's not already initialized
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './serviceAccountKey.json';
  const serviceAccount = require(path.resolve(process.cwd(), serviceAccountPath));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

// Get database instance
const adminDb = getDatabase();

// Function to initialize database structure
export const initializeDatabaseStructure = async () => {
  try {
    console.log('Starting database initialization with admin privileges...');
    
    const initialData = {
      users: {
        _initialized: {
          timestamp: admin.database.ServerValue.TIMESTAMP,
          status: 'active'
        }
      },
      chat: {
        messages: {
          _initialized: {
            timestamp: admin.database.ServerValue.TIMESTAMP,
            message: 'Chat system initialized',
            userId: 'system',
            username: 'System'
          }
        }
      },
      currentMatch: {
        status: 'betting_open',
        startTime: admin.database.ServerValue.TIMESTAMP,
        bettingPool: {
          player1: 0,
          player2: 0,
          totalPool: 0
        }
      }
    };

    // Write initial data
    await adminDb.ref('/').set(initialData);
    console.log('✅ Database structure initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Function to verify database rules
export const verifyDatabaseRules = async () => {
  try {
    // Test write access
    await adminDb.ref('test').set({
      timestamp: admin.database.ServerValue.TIMESTAMP,
      message: 'Admin connection test'
    });
    
    console.log('✅ Database rules verification successful');
    return true;
  } catch (error) {
    console.error('❌ Database rules verification failed:', error);
    throw error;
  }
};

export { admin, adminDb }; 