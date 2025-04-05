import { expect } from 'chai';
import mongoose from 'mongoose';
import sinon from 'sinon';

import mongoServer, {
  connectToDatabase,
  disconnectDatabase,
} from '../src/config/db';
import { NODE_ENV } from '../src/config/env';

describe('Database Connection', () => {
  before(async () => {
    if (NODE_ENV === 'test') {
      // await connectToDatabase();
    }
  });

  // afterEach(async () => {
  //   // Clean up the database after each test.
  //   if (NODE_ENV === 'test') {
  //     const collections = mongoose.connection.collections;
  //     for (const key in collections) {
  //       await collections[key].deleteMany({});
  //     }
  //   }
  // });

  it('should connect to the in-memory MongoDB instance', async () => {
    await connectToDatabase();
    const connectionState = mongoose.connection.readyState;
    // 1 = connected
    expect(connectionState).to.equal(1, 'Mongoose should be connected');

    await disconnectDatabase();
  });

  it('should connect to real MongoDB when NODE_ENV is not "test"', async () => {
    // await disconnectDatabase();

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    await connectToDatabase();
    expect(mongoose.connection.readyState).to.equal(
      1,
      'Mongoose should be connected'
    );

    await disconnectDatabase();
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle connection errors', async () => {
    const connectStub = sinon
      .stub(mongoose, 'connect')
      .rejects(new Error('Fake connect error'));

    try {
      await connectToDatabase();
    } catch (err: any) {
      expect(err.message).to.equal('Fake connect error');
    }

    connectStub.restore();
  });

  it('should handle disconnection errors', async () => {
    const disconnectStub = sinon
      .stub(mongoose, 'disconnect')
      .rejects(new Error('Fake disconnect error'));

    try {
      await disconnectDatabase();
    } catch (err: any) {
      expect(err.message).to.equal('Fake disconnect error');
    }

    disconnectStub.restore();
  });

  // it('should connect to the in-memory MongoDB instance', async () => {
  //   process.env.NODE_ENV = 'test';

  //   // Re-import the db file so NODE_ENV === 'test' gets used at runtime.
  //   const { connectToDatabase, disconnectDatabase } = await import(
  //     '../src/config/db'
  //   );
  //   await connectToDatabase();

  //   const connectionState = (await import('mongoose')).default.connection
  //     .readyState;
  //   expect(connectionState).to.equal(1, 'Mongoose should be connected');

  //   await disconnectDatabase();
  // });

  after(async () => {
    await disconnectDatabase();
    const connectionState = mongoose.connection.readyState;
    // 0 = disconnected
    expect(connectionState).to.equal(0, 'Mongoose should be disconnected');
  });
});
