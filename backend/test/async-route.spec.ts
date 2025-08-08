import { expect } from 'chai';
import sinon from 'sinon';
import { asyncRoute } from '../src/helpers/async-route';

describe('asyncRoute', () => {
  it('should call the wrapped function and pass req/res/next', async () => {
    const fn = sinon.stub().resolves('done');
    const req = {} as any;
    const res = {} as any;
    const next = sinon.spy();

    await asyncRoute(fn)(req, res, next);

    expect(fn.calledOnce).to.be.true;
    expect(fn.calledWith(req, res, next)).to.be.true;
    expect(next.called).to.be.false;
  });

  it('should catch errors and call next with the error', async () => {
    const testError = new Error('boom');
    const fn = sinon.stub().rejects(testError);
    const req = {} as any;
    const res = {} as any;
    const next = sinon.spy();

    await asyncRoute(fn)(req, res, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.equal(testError);
  });

  it('should log error message if error is an instance of Error', async () => {
    const testError = new Error('log me');
    const fn = sinon.stub().rejects(testError);
    const req = {} as any;
    const res = {} as any;
    const next = sinon.spy();

    const consoleStub = sinon.stub(console, 'error');

    await asyncRoute(fn)(req, res, next);

    expect(consoleStub.calledOnce).to.be.true;
    expect(consoleStub.firstCall.args[0]).to.equal('Error in route:');
    expect(consoleStub.firstCall.args[1]).to.equal('log me');

    consoleStub.restore();
  });
});
