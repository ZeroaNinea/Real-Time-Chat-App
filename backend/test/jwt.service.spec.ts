import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';

// Temporarily override the real keys during test.
const keysDir = path.join(__dirname, '../fixtures/keys');
const privateKey = fs.readFileSync(
  path.join(keysDir, 'test-key.private.pem'),
  'utf-8'
);
const publicKey = fs.readFileSync(
  path.join(keysDir, 'test-key.public.pem'),
  'utf-8'
);
const keyMapPath = path.join(keysDir, 'key-map.json');

// Mock `jwt.service.ts` dependencies.
const keyMap = {
  'test-key': publicKey,
};
fs.writeFileSync(keyMapPath, JSON.stringify(keyMap));

process.env.TEST_KEY_DIR = keysDir; // Optional for flexible paths

// Load service *after* mocking to inject test keys
const { signToken, verifyToken } = require('../../src/services/jwt.service');

describe('JWT Service', () => {
  const payload = { userId: 'test-user' };

  it('should sign and verify a JWT correctly', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).to.equal('test-user');
  });

  it('should throw if token is malformed', () => {
    expect(() => verifyToken('not-a-real-token')).to.throw();
  });

  it('should throw if kid is missing', () => {
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      // no keyid
      expiresIn: '1h',
    });

    expect(() => verifyToken(token)).to.throw('Token missing key ID (kid).');
  });

  it('should throw if public key not found for kid', () => {
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: 'unknown-key',
      expiresIn: '1h',
    });

    expect(() => verifyToken(token)).to.throw(
      'Public key not found for kid: unknown-key'
    );
  });
});
