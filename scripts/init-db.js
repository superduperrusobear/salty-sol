const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Get the absolute path to the service account key
const serviceAccountPath = path.resolve(__dirname, '../saltysol-81f2a-firebase-adminsdk-fbsvc-2c6aa0d122.json');

// Check if the file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key file not found at:', serviceAccountPath);
  process.exit(1);
}

console.log('📝 Found service account key at:', serviceAccountPath);

// Load the service account key
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
  console.log('✅ Successfully loaded service account key');
} catch (error) {
  console.error('❌ Error loading service account key:', error);
  process.exit(1);
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://saltysol-81f2a-default-rtdb.firebaseio.com"
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  process.exit(1);
}

const db = admin.database();

async function initializeDatabase() {
  try {
    console.log('🔄 Starting database initialization...');
    
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
    console.log('📝 Writing initial database structure...');
    await db.ref('/').set(initialData);
    console.log('✅ Database structure initialized successfully');
    
    // Test write access
    console.log('🔄 Testing database access...');
    await db.ref('test').set({
      timestamp: admin.database.ServerValue.TIMESTAMP,
      message: 'Initialization test successful'
    });
    console.log('✅ Write access verified');
    
    // Verify the data was written
    console.log('🔄 Verifying database structure...');
    const snapshot = await db.ref('/').once('value');
    const data = snapshot.val();
    
    if (data && data.users && data.chat && data.currentMatch) {
      console.log('✅ Database structure verification successful');
      console.log('📊 Current database structure:', Object.keys(data));
    } else {
      throw new Error('Database structure verification failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in database initialization:', error);
    process.exit(1);
  }
}

// Run initialization
console.log('🚀 Starting database initialization script...');
initializeDatabase(); 