import { expect } from 'chai';

import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { NODE_ENV } from '../src/config/env';

describe('Test Database Connection', () => {
  before(async () => {
    await connectToDatabase();
  });

  it('NODE_ENV should be test', () => {
    expect(NODE_ENV).to.equal('test');
  });

  after(async () => {
    await disconnectDatabase();
  });
});
