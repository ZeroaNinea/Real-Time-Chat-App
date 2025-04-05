import { expect } from 'chai';

import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { DB_URL, NODE_ENV } from '../src/config/env';

describe('Test Database Connection', () => {
  before(async () => {
    await connectToDatabase();
  });

  it('NODE_ENV should be "test"', () => {
    expect(NODE_ENV).to.equal('test');
  });

  it('DB_URL should be defined and equal to correct value', () => {
    expect(DB_URL).to.be.a('string');
  });

  after(async () => {
    await disconnectDatabase();
  });
});
