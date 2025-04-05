import { expect } from 'chai';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';

describe('Database Connection', () => {
  before(async () => {
    await connectToDatabase();
  });

  it('should connect to the in-memory MongoDB instance', () => {
    const connectionState = mongoose.connection.readyState;
    // 1 = connected
    expect(connectionState).to.equal(1, 'Mongoose should be connected');
  });

  after(async () => {
    await disconnectDatabase();
    const connectionState = mongoose.connection.readyState;
    // 0 = disconnected
    expect(connectionState).to.equal(0, 'Mongoose should be disconnected');
  });
});
