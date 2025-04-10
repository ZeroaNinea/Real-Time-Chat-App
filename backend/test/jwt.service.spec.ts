import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

describe('JWT Service', () => {
  const fakeKeyMap = { 'test-key': 'test-public-key' };
  const payload = { userId: 'test-user' };
  const privateKey = 'FAKE_PRIVATE_KEY';

  const fsStub = {
    readFileSync: sinon.stub(),
  };

  fsStub.readFileSync
    .withArgs(sinon.match(/key-map\.json/))
    .returns(JSON.stringify(fakeKeyMap));
  fsStub.readFileSync
    .withArgs(sinon.match(/test-key\.private\.pem/))
    .returns(privateKey);

  const jwtStub = {
    sign: sinon.stub().returns('FAKE_TOKEN'),
    verify: sinon.stub().returns(payload),
    decode: sinon.stub().returns({ header: { kid: 'test-key' } }),
  };

  const { signToken, verifyToken } = proxyquire('../src/auth/jwt.service', {
    fs: fsStub,
    jsonwebtoken: jwtStub,
  });

  it('should sign and verify token', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).to.deep.equal(payload);
  });

  it('should throw if token is malformed', () => {
    jwtStub.verify.throws(new Error('jwt malformed'));
    expect(() => verifyToken('not-a-real-token')).to.throw('jwt malformed');
  });

  it('should throw if kid is missing', () => {
    jwtStub.decode.returns({ header: {} });
    expect(() => verifyToken('not-a-real-token')).to.throw(
      'Token missing key ID (kid).'
    );
  });

  it('should throw if public key not found for kid', () => {
    jwtStub.decode.returns({ header: { kid: 'unknown-key' } });
    expect(() => verifyToken('not-a-real-token')).to.throw(
      'Public key not found for kid: unknown-key'
    );
  });
});
