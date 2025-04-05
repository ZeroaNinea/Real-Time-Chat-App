import { expect } from 'chai';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';

describe('Test Database Connection', () => {
  before(async () => {
    await connectToDatabase();
  });

  it('NODE_ENV should be test', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

  after(async () => {
    await disconnectDatabase();
  });
});
