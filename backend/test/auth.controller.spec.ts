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

  it('should create a new account', async (done) => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        email: 'newuser@email.com',
        password: '123',
      })
      .then((res) => {
        expect(res.status).to.equal(201);
        expect(res.body.message).to.equal('User registered successfully!');

        done();
      });
  });

  it('should fail to create a new account', async (done) => {
    await request(app)
      .post('/api/auth/register')
      .send({})
      .then((res) => {
        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal('Username already exists.');
        done();
      });
  });
});
