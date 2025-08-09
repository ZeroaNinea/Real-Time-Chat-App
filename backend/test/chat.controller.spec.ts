import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import fs from 'fs';

import { app } from '../src/app';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/user.model';

describe('Auth Controller', () => {
  before(async () => {
    await connectToDatabase();
  });

  after(async () => {
    await User.deleteMany({});
    await disconnectDatabase();
  });
});
