import { expect } from 'chai';
import sinon from 'sinon';
import { authMiddleware } from '../src/auth/auth.middleware';
import { jwtService } from '../src/auth/jwt.service';

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
    console.log(JSON.stringify(res.json));
    expect(res.json.calledWith({ message: 'Invalid token.' })).to.be.true;

    (jwtService.verifyToken as sinon.SinonStub).restore();
  });

  // it('should attach user and call next on valid token', () => {
  //   req.header = () => 'Bearer valid-token';
  //   const fakeUser = { userId: 'test' };
  //   sinon.stub(jwtService, 'verifyToken').returns(fakeUser);

  //   authMiddleware(req, res, next);

  //   expect(req.user).to.deep.equal(fakeUser);
  //   expect(next.calledOnce).to.be.true;

  //   (jwtService.verifyToken as sinon.SinonStub).restore();
  // });
});
