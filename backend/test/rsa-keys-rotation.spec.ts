import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import * as crypto from 'crypto';

import { rotateKeys } from '../cryptography/rsa-keys-rotation';

describe('rotateKeys', () => {
  const fakeDir = path.join(__dirname, '../keys');
  const fakeMapPath = path.join(fakeDir, 'key-map.json');

  let existsSyncStub: sinon.SinonStub;
  let mkdirSyncStub: sinon.SinonStub;
  let readFileSyncStub: sinon.SinonStub;
  let writeFileSyncStub: sinon.SinonStub;
  let unlinkSyncStub: sinon.SinonStub;
  let generateKeyPairSyncStub: sinon.SinonStub;

  beforeEach(() => {
    existsSyncStub = sinon.stub(fs, 'existsSync');
    mkdirSyncStub = sinon.stub(fs, 'mkdirSync');
    readFileSyncStub = sinon.stub(fs, 'readFileSync');
    writeFileSyncStub = sinon.stub(fs, 'writeFileSync');
    unlinkSyncStub = sinon.stub(fs, 'unlinkSync');
    generateKeyPairSyncStub = sinon.stub(crypto, 'generateKeyPairSync');

    // Default: directory and key-map exist.
    existsSyncStub.withArgs(fakeDir).returns(true);
    existsSyncStub.withArgs(fakeMapPath).returns(true);
    readFileSyncStub.withArgs(fakeMapPath).returns('{}');

    generateKeyPairSyncStub.returns({
      publicKey: 'fake-public',
      privateKey: 'fake-private',
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create keys directory if it does not exist', () => {
    existsSyncStub.withArgs(fakeDir).returns(false);

    rotateKeys();

    expect(mkdirSyncStub.calledWith(fakeDir, { recursive: true })).to.be.true;
  });

  it('should generate new keys and update key map if rotation is needed', () => {
    // Simulate last key was 2 days ago.
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    readFileSyncStub.withArgs(fakeMapPath).returns(
      JSON.stringify({
        [twoDaysAgo]: 'old-public-key',
      })
    );

    rotateKeys();

    // Check key files are written.
    expect(
      writeFileSyncStub.calledWithMatch(
        sinon.match(/\.private\.pem$/),
        'fake-private'
      )
    ).to.be.true;
    expect(
      writeFileSyncStub.calledWithMatch(
        sinon.match(/\.public\.pem$/),
        'fake-public'
      )
    ).to.be.true;

    // Check key map updated.
    const keyMapWrite = writeFileSyncStub
      .getCalls()
      .find((c) => c.args[0].endsWith('key-map.json'));

    expect(keyMapWrite).to.exist;
    const keyMap = JSON.parse(keyMapWrite?.args[1]);
    expect(Object.values(keyMap)).to.include('fake-public');
  });

  it('should skip rotation if the last key is too recent', () => {
    const today = new Date().toISOString().split('T')[0];

    readFileSyncStub.withArgs(fakeMapPath).returns(
      JSON.stringify({
        [today]: 'existing-public-key',
      })
    );

    rotateKeys();

    expect(generateKeyPairSyncStub.notCalled).to.be.true;
  });
});
