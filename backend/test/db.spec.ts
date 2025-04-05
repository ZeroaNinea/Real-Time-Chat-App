import { expect } from 'chai';
import mongoose from 'mongoose';
import sinon from 'sinon';

import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { NODE_ENV } from '../src/config/env';

describe('Database Connection', () => {
  before(async () => {
    await connectToDatabase();
  });

  it('should connect to the in-memory MongoDB instance', () => {
    const connectionState = mongoose.connection.readyState;
    // 1 = connected
    expect(connectionState).to.equal(1, 'Mongoose should be connected');
  });

  it('should connect to real MongoDB when NODE_ENV is not "test"', async () => {
    const originalEnv = NODE_ENV;
    process.env.NODE_ENV = 'production';

    expect(mongoose.connection.readyState).to.equal(
      1,
      'Mongoose should be connected'
    );

    await mongoose.disconnect();
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle connection errors', async () => {
    const connectStub = sinon
      .stub(mongoose, 'connect')
      .rejects(new Error('Fake connect error'));

    await connectToDatabase();

    connectStub.restore();
  });

  it('should handle disconnection errors', async () => {
    const disconnectStub = sinon
      .stub(mongoose, 'disconnect')
      .rejects(new Error('Fake disconnect error'));

    await disconnectDatabase();

    disconnectStub.restore();
  });

  after(async () => {
    await disconnectDatabase();
    const connectionState = mongoose.connection.readyState;
    // 0 = disconnected
    expect(connectionState).to.equal(0, 'Mongoose should be disconnected');
  });
});
