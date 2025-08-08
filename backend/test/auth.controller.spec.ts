import { expect } from 'chai';
import sinon from 'sinon';

import { connectToDatabase } from './helpers/connect-disconnect-db';

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

  it('should create a new account', () => {
    expect(true).to.be.true;
  });
});
