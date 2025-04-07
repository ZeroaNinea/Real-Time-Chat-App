// import mongoose from 'mongoose';
// import { MongoMemoryServer } from 'mongodb-memory-server';
// import { DB_URL, NODE_ENV } from './env';

// let mongoServer: MongoMemoryServer | null = null;

// export const connectToDatabase = async () => {
//   try {
//     if (NODE_ENV === 'test') {
//       mongoServer = await MongoMemoryServer.create();
//       const uri = mongoServer.getUri();
//       await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
//       console.log(' ✅ MongoDB Memory Server successfully connected! 🎉 ');
//     } else {
//       await mongoose.connect(DB_URL, { serverSelectionTimeoutMS: 5000 });
//       console.log(' ✅ MongoDB successfully connected! 🎉 ');
//     }
//   } catch (err) {
//     console.error(' ❌ MongoDB connection error:', err);
//   }
// };

// export const disconnectDatabase = async () => {
//   try {
//     await mongoose.disconnect();
//     if (mongoServer) {
//       await mongoServer.stop();
//     }
//   } catch (err) {
//     console.error(' ❌ MongoDB disconnection error:', err);
//   }
// };

// export default mongoose;
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getEnv, buildMongoUrl } from './env';

let mongoServer: MongoMemoryServer | null = null;

export const connectToDatabase = async (
  overrideEnv?: Partial<ReturnType<typeof getEnv>>
) => {
  const env = { ...getEnv(), ...overrideEnv };

  try {
    if (env.NODE_ENV === 'test') {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(' ✅ In-memory MongoDB connected!');
    } else {
      const url = buildMongoUrl(env);
      await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 });
      console.log(' ✅ MongoDB connected!');
    }
  } catch (err) {
    console.error(' ❌ MongoDB connection error:', err);
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    console.error(' ❌ MongoDB disconnection error:', err);
  }
};

export default mongoose;
