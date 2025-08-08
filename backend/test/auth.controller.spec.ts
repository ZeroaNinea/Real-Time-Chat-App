import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import { connectToDatabase } from './helpers/connect-disconnect-db';
import { app } from '../src/app';

describe('Auth Controller', () => {
  let connectStub!: sinon.SinonStub;
  let disconnectStub!: sinon.SinonStub;
  let mongoMemoryStub: any;
  let dbModule: any;

  const originalEnv = process.env;

  beforeEach(() => {
    const connection = connectToDatabase(
      connectStub,
      disconnectStub,
      mongoMemoryStub,
      dbModule
    );

    connectStub = connection.connectStub;
    disconnectStub = connection.disconnectStub;
    mongoMemoryStub = connection.mongoMemoryStub;
    dbModule = connection.dbModule;
  });

  afterEach(() => {
    sinon.restore();
    process.env = originalEnv;
  });

  it('should create a new account', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: '123',
    });

    expect(res.status).to.equal(201);
  });
});
