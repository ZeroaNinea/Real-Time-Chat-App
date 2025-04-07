import mongoose from 'mongoose';
import env from './env';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export const connectToDatabase = async () => {
  try {
    if (env.NODE_ENV === 'test') {
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri(), {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(' ✅ In-memory MongoDB connected!');
    } else {
      const uri = `mongodb://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}?authSource=admin`;
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(' ✅ MongoDB connected!');
    }
  } catch (err) {
    console.error(' ❌ MongoDB connection error:', err);
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  } catch (err) {
    console.error(' ❌ MongoDB disconnection error:', err);
  }
};

export default mongoose;
