import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { DB_URL, NODE_ENV } from './env';

if (NODE_ENV === 'test') {
  MongoMemoryServer.create().then((mongoServer) => {
    const TEST_DB_URL = mongoServer.getUri();

    mongoose
      .connect(TEST_DB_URL, {
        serverSelectionTimeoutMS: 5000,
      })
      .then(() =>
        console.log(' ✅ MongoDB Memory Server successfully connected! 🎉 ')
      )
      .catch((err) =>
        console.error(' ❌ MongoDB Memory Server connection error:', err)
      );
  });
} else {
  mongoose
    .connect(DB_URL, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log(' ✅ MongoDB successfully connected! 🎉 '))
    .catch((err) => console.error(' ❌ MongoDB connection error:', err));
}

export default mongoose;
