// import mongoose from 'mongoose';
// import { MongoMemoryServer } from 'mongodb-memory-server';
// import { getEnv, buildMongoUrl } from './env';

// let mongoServer: MongoMemoryServer | null = null;

// export const connectToDatabase = async (
//   overrideEnv?: Partial<ReturnType<typeof getEnv>>
// ) => {
//   const env = { ...getEnv(), ...overrideEnv };

//   try {
//     if (env.NODE_ENV === 'test') {
//       mongoServer = await MongoMemoryServer.create();
//       const uri = mongoServer.getUri();
//       await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
//       console.log(' ✅ In-memory MongoDB connected!');
//     } else {
//       const url = buildMongoUrl(env);
//       await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 });
//       console.log(' ✅ MongoDB connected!');
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
import { buildMongoUrl, getEnv } from './env';

let memoryServer: any;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const env = getEnv();
  if (env.NODE_ENV === 'test') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    return mongoose.connect(uri);
  }

  return mongoose.connect(buildMongoUrl());
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
