import { expect } from 'chai';
import sinon from 'sinon';
import * as ioredis from 'ioredis';

import { redis, redisClient } from '../src/config/redis';

describe('redis.ts', () => {
  let onStub: sinon.SinonStub;
  let duplicateStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    onStub = sinon.stub();
    duplicateStub = sinon.stub().returns({ on: onStub });
    sinon.stub(ioredis, 'Redis').callsFake((): any => ({
      duplicate: duplicateStub,
    }));

    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should attach an error listener to redisClient', () => {
    delete require.cache[require.resolve('./redis')];
    require('./redis');

    expect(duplicateStub.calledOnce).to.be.true;
    expect(onStub.calledOnce).to.be.true;
    expect(onStub.firstCall.args[0]).to.equal('error');
    expect(onStub.firstCall.args[1]).to.be.a('function');
  });

  it('should log error when error event is triggered', () => {
    delete require.cache[require.resolve('./redis')];
    const { redisClient } = require('./redis');

    const handler = onStub.firstCall.args[1];
    handler(new Error('boom'));

    expect(consoleErrorStub.calledWithMatch('❌')).to.be.true;
  });
});
