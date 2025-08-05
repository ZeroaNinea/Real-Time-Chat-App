import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/app';

import { corsOriginValidator } from '../src/helpers/cors-config';

describe('Test CORS Middleware', () => {
  it('should allow allowed origins', () => {
    corsOriginValidator('http://localhost:4200', (err, allow) => {
      expect(err).to.be.null;
      expect(allow).to.be.true;
    });

    corsOriginValidator(undefined, (err, allow) => {
      expect(err).to.be.null;
      expect(allow).to.be.true;
    });
  });

  it('should reject disallowed origins', () => {
    corsOriginValidator('http://malicious.com', (err, allow) => {
      expect(err).to.be.an('error');
      expect(err!.message).to.equal('Not allowed by CORS');
      expect(allow).to.be.undefined;
    });
  });

  it('should allow requests with no origin (like curl)', async () => {
    const res = await request(app).get('/api/healthcheck');
    expect(res.status).to.not.equal(500);
  });
});
