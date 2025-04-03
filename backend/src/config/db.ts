import mongoose from 'mongoose';
import { DB_URL } from './env';

mongoose
  .connect(DB_URL, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log(' ✅ MongoDB successfully connected! 🎉 '))
  .catch((err) => console.error(' ❌ MongoDB connection error:', err));

export default mongoose;
