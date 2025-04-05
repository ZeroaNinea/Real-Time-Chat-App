import { expect } from 'chai';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';

describe('test', () => {
  before(async () => {
    await connectToDatabase();
  });

  after(async () => {
    await disconnectDatabase();
  });
});
