import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows Node.js querySrv ECONNREFUSED issues with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fallback if custom DNS fails
}

let isDbConnected = false;

export const getDbStatus = () => {
  return isDbConnected && mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
};

const connectDB = async (retries = 3) => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('CRITICAL ERROR: MONGO_URI is missing from environment variables!');
    isDbConnected = false;
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        dbName: 'edunexus',
      });
      isDbConnected = true;
      console.log(`[DATABASE] MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
      
      // Safely drop old unique email index if present to support 2-3 accounts per email
      try {
        await mongoose.connection.collection('users').dropIndex('email_1');
      } catch (e) {
        // Index does not exist or already dropped
      }
      
      return;
    } catch (error) {
      isDbConnected = false;
      console.error(`[DATABASE ERROR] Attempt ${attempt} failed to connect to MongoDB: ${error.message}`);
      if (attempt < retries) {
        console.log(`[DATABASE] Retrying connection in 2 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.error(`[DATABASE ERROR] Could not connect to MongoDB after ${retries} attempts.`);
      }
    }
  }
};

export default connectDB;
