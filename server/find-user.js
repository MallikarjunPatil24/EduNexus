import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const user = await User.findOne({ email: 'mallikarjunpatilmallu5@gmail.com' });
    console.log('User found:', user);
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
};

run();
