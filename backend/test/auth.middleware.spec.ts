import { expect } from 'chai';
import sinon from 'sinon';
import { authMiddleware } from '../src/auth/auth.middleware';
import { jwtService } from '../src/auth/jwt.service';
import { redisClient } from '../src/config/redis';
import { User } from '../src/models/user.model';

describe('authMiddleware', () => {
  let req: any, res: any, next: sinon.SinonSpy;

  beforeEach(() => {
    req = { header: () => null };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };
    next = sinon.spy();
  });

  it('should deny access if no Authorization header', () => {
    authMiddleware(req, res, next);

    expect(res.status.calledWith(401)).to.be.true;
    expect(
      res.json.calledWith({ message: 'Access denied. No headers provided.' })
    ).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it('should deny access if token is missing from header', () => {
    req.header = () => 'Bearer';
    authMiddleware(req, res, next);

    expect(res.status.calledWith(401)).to.be.true;
    expect(
      res.json.calledWith({ message: 'Access denied. No token provided.' })
    ).to.be.true;
  });

  it('should deny access if token is invalid', () => {
    req.header = () => 'Bearer fake-token';
    sinon.stub(jwtService, 'verifyToken').throws(new Error('Invalid token'));

    authMiddleware(req, res, next);

    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledWith({ message: 'Invalid token.' })).to.be.true;

    (jwtService.verifyToken as sinon.SinonStub).restore();
  });

  // it('should attach user and call next on valid token', () => {
  //   req.header = () => 'Bearer valid-token';
  //   const fakeUser = { userId: 'test' };
  //   const stub = sinon.stub(jwtService, 'verifyToken').returns(fakeUser);

  //   authMiddleware(req, res, next);

  //   expect(req.user).to.deep.equal(fakeUser);
  //   expect(next.calledOnce).to.be.true;

  //   // (jwtService.verifyToken as sinon.SinonStub).restore();
  //   stub.restore();
  // });

  it('should deny access if token is expired/revoked in redis', async () => {
    req.header = () => 'Bearer valid-token';
    const jwtStub = sinon
      .stub(jwtService, 'verifyToken')
      .returns({ id: 'user123' });

    const redisStub = sinon.stub(redisClient, 'exists').resolves(0);

    await authMiddleware(req, res, next);

    expect(res.status.calledWith(401)).to.be.true;
    expect(res.json.calledWith({ message: 'Token expired or revoked.' })).to.be
      .true;
    expect(next.notCalled).to.be.true;

    redisStub.restore();
    jwtStub.restore();
  });

  it('should deny access if user is not found in db', async () => {
    req.header = () => 'Bearer valid-token';
    const jwtStub = sinon
      .stub(jwtService, 'verifyToken')
      .returns({ id: 'user123' });

    const redisStub = sinon.stub(redisClient, 'exists').resolves(1);
    const userStub = sinon.stub(User, 'findById').resolves(null);

    await authMiddleware(req, res, next);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'User not found' })).to.be.true;
    expect(next.notCalled).to.be.true;

    redisStub.restore();
    jwtStub.restore();
    userStub.restore();
  });
});

// import { expect } from 'chai';
// import sinon from 'sinon';
// import { authMiddleware } from '../src/auth/auth.middleware';
// import jwtService from '../src/auth/jwt.service';
// import { redisClient } from '../src/config/redis';
// import { User } from '../src/models/user.model';

// describe('authMiddleware', () => {
//   let req: any, res: any, next: sinon.SinonSpy;

//   beforeEach(() => {
//     req = { header: () => null };
//     res = {
//       status: sinon.stub().returnsThis(),
//       json: sinon.stub(),
//     };
//     next = sinon.spy();
//   });

//   afterEach(() => {
//     sinon.restore();
//   });

//   it('should deny access if no Authorization header', async () => {
//     await authMiddleware(req, res, next);

//     expect(res.status.calledWith(401)).to.be.true;
//     expect(
//       res.json.calledWith({ message: 'Access denied. No headers provided.' })
//     ).to.be.true;
//     expect(next.notCalled).to.be.true;
//   });

//   it('should deny access if token is missing from header', async () => {
//     req.header = () => 'Bearer';
//     await authMiddleware(req, res, next);

//     expect(res.status.calledWith(401)).to.be.true;
//     expect(
//       res.json.calledWith({ message: 'Access denied. No token provided.' })
//     ).to.be.true;
//   });

//   it('should deny access if token is invalid', async () => {
//     req.header = () => 'Bearer fake-token';
//     sinon.stub(jwtService, 'verifyToken').throws(new Error('Invalid token'));

//     await authMiddleware(req, res, next);

//     expect(res.status.calledWith(401)).to.be.true;
//     expect(res.json.calledWith({ message: 'Invalid token.' })).to.be.true;
//   });

//   it('should deny access if token is expired/revoked in redis', async () => {
//     req.header = () => 'Bearer valid-token';
//     sinon.stub(jwtService, 'verifyToken').returns({ id: 'user123' });

//     sinon.stub(redisClient, 'exists').resolves(0);

//     await authMiddleware(req, res, next);

//     expect(res.status.calledWith(401)).to.be.true;
//     expect(res.json.calledWith({ message: 'Token expired or revoked.' })).to.be
//       .true;
//     expect(next.notCalled).to.be.true;
//   });

//   it('should deny access if user is not found in db', async () => {
//     req.header = () => 'Bearer valid-token';
//     sinon.stub(jwtService, 'verifyToken').returns({ id: 'user123' });

//     sinon.stub(redisClient, 'exists').resolves(1);
//     sinon.stub(User, 'findById').resolves(null);

//     await authMiddleware(req, res, next);

//     expect(res.status.calledWith(404)).to.be.true;
//     expect(res.json.calledWith({ message: 'User not found' })).to.be.true;
//     expect(next.notCalled).to.be.true;
//   });

//   it('should attach user and call next on valid token', async () => {
//     req.header = () => 'Bearer valid-token';
//     sinon.stub(jwtService, 'verifyToken').returns({ id: 'user123' });

//     sinon.stub(redisClient, 'exists').resolves(1);
//     const fakeUser = { _id: 'user123', name: 'Alice' };
//     sinon.stub(User, 'findById').resolves(fakeUser);

//     await authMiddleware(req, res, next);

//     expect(req.user).to.deep.equal(fakeUser);
//     expect(next.calledOnce).to.be.true;
//   });
// });
