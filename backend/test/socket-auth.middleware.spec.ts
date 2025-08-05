import { socketAuthMiddleware } from '../src/middleware/socket-auth.middleware';
import { Socket } from 'socket.io';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { expect } from 'chai';
import * as userService from '../src/services/user.service';

describe('socketAuthMiddleware', () => {
  const mockSocket = {
    handshake: { auth: {} },
    data: {},
  } as unknown as Socket;

  const next = sinon.spy();

  afterEach(() => {
    sinon.restore();
    next.resetHistory();
  });

  it('should call next with error if no token provided', async () => {
    mockSocket.handshake.auth.token = undefined;

    await socketAuthMiddleware(mockSocket, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.equal('Authentication error');
  });

  it('should call next with error if no kid in token', async () => {
    mockSocket.handshake.auth.token = 'dummy';

    sinon.stub(jwt, 'decode').returns({ header: {} });
    await socketAuthMiddleware(mockSocket, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.equal('Invalid token');
  });

  it('should call next with error if public key is missing', async () => {
    mockSocket.handshake.auth.token = 'dummy';

    sinon.stub(jwt, 'decode').returns({ header: { kid: 'abc' } });
    sinon.stub(fs, 'readFileSync').returns('{}');

    await socketAuthMiddleware(mockSocket, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.equal('Unknown key ID: abc');
  });

  it('should call next with error if no userId in payload', async () => {
    mockSocket.handshake.auth.token = 'dummy';

    sinon.stub(jwt, 'decode').returns({ header: { kid: 'abc' } });
    sinon
      .stub(fs, 'readFileSync')
      .returns(JSON.stringify({ abc: 'publicKey' }));
    sinon.stub(jwt, 'verify').returns();

    await socketAuthMiddleware(mockSocket, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.equal(
      'Token missing subject/user ID'
    );
  });

  it('should call next with error if user not found', async () => {
    mockSocket.handshake.auth.token = 'dummy';

    sinon.stub(jwt, 'decode').returns({ header: { kid: 'abc' } });
    sinon
      .stub(fs, 'readFileSync')
      .returns(JSON.stringify({ abc: 'publicKey' }));
    sinon.stub(jwt, 'verify').returns();
    sinon.stub(userService, 'findUserById').resolves(null);

    await socketAuthMiddleware(mockSocket, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0].message).to.equal('User not found');
  });

  it('should attach user to socket and call next()', async () => {
    mockSocket.handshake.auth.token = 'dummy';

    sinon.stub(jwt, 'decode').returns({ header: { kid: 'abc' } });
    sinon
      .stub(fs, 'readFileSync')
      .returns(JSON.stringify({ abc: 'publicKey' }));
    sinon.stub(jwt, 'verify').returns();
    sinon
      .stub(userService, 'findUserById')
      .resolves({ _id: '123', username: 'testuser' });

    await socketAuthMiddleware(mockSocket, next);

    expect(mockSocket.data.user).to.deep.equal({
      _id: '123',
      username: 'testuser',
    });
    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.be.undefined;
  });
});
