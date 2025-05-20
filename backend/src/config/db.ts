import mongoose from 'mongoose';
import config from './env';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export const connectToDatabase = async () => {
  try {
    if (config.NODE_ENV === 'test') {
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri(), {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(' ✅ In-memory MongoDB connected!');
    } else {
      const uri = `${config.DIALECT}://${config.DB_USER}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}?authSource=admin`;
      // const uri = `mongodb+srv://ZeroaNinea:${config.DB_PASSWORD}@cluster0.bfcqxxl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
