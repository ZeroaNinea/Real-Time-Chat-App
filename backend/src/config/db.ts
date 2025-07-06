import mongoose from 'mongoose';
import config from './env';

let mongoServer: any = null;

export const connectToDatabase = async () => {
  try {
    if (config.NODE_ENV === 'test') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri(), {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(' ✅ In-memory MongoDB connected!');
    } else {
      const encodedPassword = encodeURIComponent(config.DB_PASSWORD);
      const uri = `${config.DIALECT}://${config.DB_USER}:${encodedPassword}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}?authSource=admin`;
      await mongoose.connect(uri);
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
