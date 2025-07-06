import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { rotateKeys } from '../src/cryptography/rsa-keys-rotation';

describe('rotateKeys()', () => {
  let existsSyncStub: sinon.SinonStub;
  let mkdirSyncStub: sinon.SinonStub;
  let readFileSyncStub: sinon.SinonStub;
  let writeFileSyncStub: sinon.SinonStub;
  let unlinkSyncStub: sinon.SinonStub;
  let generateKeyPairSyncStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;

  const keyMapPath = path.join(
    __dirname,
    '../src/utils/cryptography/../keys/key-map.json'
  );

  beforeEach(() => {
    existsSyncStub = sinon.stub(fs, 'existsSync');
    mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    readFileSyncStub = sinon.stub(fs, 'readFileSync');
    writeFileSyncStub = sinon.stub(fs, 'writeFileSync');
    unlinkSyncStub = sinon.stub(fs, 'unlinkSync');
    generateKeyPairSyncStub = sinon.stub(crypto, 'generateKeyPairSync');
    consoleLogStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should generate initial key if keys dir and key map are missing', () => {
    existsSyncStub.returns(false);

    generateKeyPairSyncStub.returns({
      publicKey: 'public-key',
      privateKey: 'private-key',
    });

    rotateKeys();

    expect(mkdirSyncStub.calledOnce).to.be.true;
    expect(writeFileSyncStub.callCount).to.be.gte(3); // Private, public, `keyMap`.
    expect(consoleLogStub.calledWithMatch(/Generated key pair/)).to.be.true;
  });

  it('should not rotate if latest key is still valid', () => {
    existsSyncStub.withArgs(sinon.match(keyMapPath)).returns(true);
    existsSyncStub.returns(true);
    readFileSyncStub.returns(
      JSON.stringify({
        '2099-12-31': 'dummy-key',
      })
    );

    rotateKeys();

    expect(consoleLogStub.calledWithMatch(/No rotation needed/)).to.be.true;
    expect(writeFileSyncStub.notCalled).to.be.true;
  });

  it('should rotate if the latest key is expired', () => {
    const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const formatted = yesterday.toISOString().split('T')[0];

    existsSyncStub.returns(true);
    readFileSyncStub.returns(
      JSON.stringify({
        [formatted]: 'expired-key',
      })
    );

    generateKeyPairSyncStub.returns({
      publicKey: 'public-key',
      privateKey: 'private-key',
    });

    rotateKeys();

    expect(writeFileSyncStub.callCount).to.be.gte(3);
    expect(consoleLogStub.calledWithMatch(/Generated key pair/)).to.be.true;
  });

  it('should remove oldest keys if more than 3 exist', () => {
    const keyMap = {
      '2024-04-01': 'key1',
      '2024-04-02': 'key2',
      '2024-04-03': 'key3',
      '2024-04-04': 'key4',
    };

    existsSyncStub.returns(true);
    readFileSyncStub.returns(JSON.stringify(keyMap));

    generateKeyPairSyncStub.returns({
      publicKey: 'public-key',
      privateKey: 'private-key',
    });

    rotateKeys();

    expect(unlinkSyncStub.callCount).to.be.gte(2); // Private and public keys.
    expect(consoleLogStub.calledWithMatch(/Key map updated/)).to.be.true;
  });

  it('should handle missing key map and still generate new key', () => {
    existsSyncStub.callsFake((path) => {
      if (typeof path === 'string' && path.includes('key-map.json'))
        return false;
      return true;
    });

    generateKeyPairSyncStub.returns({
      publicKey: 'public-key',
      privateKey: 'private-key',
    });

    rotateKeys();

    expect(writeFileSyncStub.callCount).to.be.gte(3);
    expect(consoleLogStub.calledWithMatch(/Generated key pair/)).to.be.true;
  });
});
