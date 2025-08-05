import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/app';
import { server } from '../src/server';
import { disconnectDatabase } from '../src/config/db';
import sinon, { SinonSpy } from 'sinon';
import { User } from '../src/models/user.model';
import { asyncRoute } from '../src/controllers/auth.controller';
import { Request, Response, NextFunction } from 'express';

// describe('Test App Router', () => {
//   // it('should test registration, login, account and delete routes', async () => {
//   //   // Register a user.
//   //   const registerRes = await request(app)
//   //     .post('/auth/register')
//   //     .send({
//   //       username: 'imgay',
//   //       email: 'imgay@gmail.com',
//   //       password: 'imgay',
//   //     })
//   //     .set('Content-Type', 'application/json')
//   //     .set('Accept', 'application/json');

//   //   expect(registerRes.status).to.equal(201);
//   //   expect(registerRes.body.message).to.equal('User registered successfully!');

//   //   // Checik if the user already exists.
//   //   const registerUserExistsRes = await request(app)
//   //     .post('/auth/register')
//   //     .send({
//   //       username: 'imgay',
//   //       email: 'imgay@gmail.com',
//   //       password: 'imgay',
//   //     })
//   //     .set('Content-Type', 'application/json')
//   //     .set('Accept', 'application/json');

//   //   expect(registerUserExistsRes.status).to.equal(400);
//   //   expect(registerUserExistsRes.text).to.equal('Username already exists.');

//   //   // Provoke an error.
//   //   const registerStatus500Res = await request(app)
//   //     .post('/auth/register')
//   //     .send({
//   //       username: "Bohahahahah! I'm an evil hacker!",
//   //       email: () => {
//   //         console.log('Evil hacker function! >:(');
//   //       },
//   //       password: 'hacker_password',
//   //     })
//   //     .set('Content-Type', 'application/json')
//   //     .set('Accept', 'application/json');

//   //   expect(registerStatus500Res.status).to.equal(500);
//   //   expect(registerStatus500Res.body.error).to.equal(
//   //     'Server error during registration.'
//   //   );

//   //   // Login the user.
//   //   const loginRes = await request(app)
//   //     .post('/auth/login')
//   //     .send({
//   //       username: 'imgay',
//   //       password: 'imgay',
//   //     })
//   //     .set('Content-Type', 'application/json')
//   //     .set('Accept', 'application/json');

//   //   expect(loginRes.status).to.equal(200);
//   //   expect(loginRes.body.message).to.equal('Login successful!');

//   //   // Provoke an invalid login or password error.
//   //   const loginStatus401Res = await request(app)
//   //     .post('/auth/login')
//   //     .send({
//   //       username: 'imgay',
//   //       password: 'wrong_password',
//   //     })
//   //     .set('Content-Type', 'application/json')
//   //     .set('Accept', 'application/json');

//   //   expect(loginStatus401Res.status).to.equal(401);
//   //   expect(loginStatus401Res.body.message).to.equal(
//   //     'Invalid username or password.'
//   //   );

//   //   // Provoke an internal server error on login.
//   //   const findOneStub = sinon
//   //     .stub(User, 'findOne')
//   //     .rejects('Simulated internal server error');

//   //   const loginStatus500Res = await request(app)
//   //     .post('/auth/login')
//   //     .send({ username: 'test', password: 'test' });

//   //   expect(loginStatus500Res.status).to.equal(500);
//   //   expect(loginStatus500Res.body.error).to.equal('Server error during login.');

//   //   findOneStub.restore();

//   //   // Visit the account route without the access token.
//   //   const accountStatus401Res = await request(app).get('/auth/account');
//   //   expect(accountStatus401Res.status).to.equal(401);
//   //   expect(accountStatus401Res.body.message).to.equal(
//   //     'Access denied. No headers provided.'
//   //   );

//   //   // Visit the account route with the access token.
//   //   const accountStatus200Res = await request(app)
//   //     .get('/auth/account')
//   //     .set('Authorization', `Bearer ${loginRes.body.token}`);

//   //   expect(accountStatus200Res.status).to.equal(200);
//   //   expect(accountStatus200Res.text).to.equal('account');

//   //   // Provoke an internal server error on account deletion.
//   //   const deleteOneStub = sinon
//   //     .stub(User, 'deleteOne')
//   //     .rejects('Simulated internal server error');

//   //   const deleteStatus500Res = await request(app)
//   //     .delete('/auth/delete-account')
//   //     .send({
//   //       username: 'imgay',
//   //       email: 'imgay@gmail.com',
//   //       password: 'imgay',
//   //     })
//   //     .set('Content-Type', 'application/json')
//   //     .set('Accept', 'application/json')
//   //     .set('Authorization', `Bearer ${loginRes.body.token}`);

//   //   expect(deleteStatus500Res.status).to.equal(500);
//   //   expect(deleteStatus500Res.body.error).to.equal(
//   //     'Server error during account deletion.'
//   //   );

//   //   deleteOneStub.restore();

//   //   // Delete account.
//   //   const deleteStatus200Res = await request(app)
//   //     .delete('/auth/delete-account')
//   //     .send({
//   //       username: 'imgay',
//   //       email: 'imgay@gmail.com',
//   //       password: 'imgay',
//   //     })
//   //     .set('Content-Type', 'application/json')
//   //     .set('Accept', 'application/json')
//   //     .set('Authorization', `Bearer ${loginRes.body.token}`);

//   //   expect(deleteStatus200Res.status).to.equal(200);
//   //   expect(deleteStatus200Res.body.message).to.equal(
//   //     'Account deleted successfully!'
//   //   );

//   //   // Check if the password is wrong during account deletion.
//   //   const res8 = await request(app)
//   //     .delete('/auth/delete-account')
//   //     .send({
//   //       username: 'imgay',
//   //       email: 'imgay@gmail.com',
//   //       password: 'wrong_password',
//   //     })
//   //     .set('Content-Type', 'application/json')
//   //     .set('Accept', 'application/json')
//   //     .set('Authorization', `Bearer ${loginRes.body.token}`);

//   //   expect(res8.status).to.equal(401);
//   //   expect(res8.body.message).to.equal('Invalid username or password.');
//   // });

//   it('should handle errors thrown by the wrapped function', async () => {
//     // Mock request, response, and next.
//     const req = {} as Request;
//     const res = {} as Response;
//     const next = sinon.spy() as SinonSpy & NextFunction; // Cast next as a Sinon spy.

//     // Mock function that throws an error.
//     const mockFn = sinon.stub().rejects(new Error('Test error'));

//     // Wrap the mock function with asyncRoute.
//     const wrappedRoute = asyncRoute(mockFn);

//     // Call the wrapped route.
//     await wrappedRoute(req, res, next);

//     // Assert that the error was passed to next.
//     expect(next.calledOnce).to.be.true;
//     expect(next.args[0][0]).to.be.an.instanceOf(Error);
//     expect(next.args[0][0].message).to.equal('Test error');
//   });

//   it('should log the error if it is an instance of Error', async () => {
//     // Mock request, response, and next.
//     const req = {} as Request;
//     const res = {} as Response;
//     const next = sinon.spy() as SinonSpy & NextFunction; // Cast next as a Sinon spy.

//     // Mock console.error.
//     const consoleErrorStub = sinon.stub(console, 'error');

//     // Mock function that throws an error.
//     const mockFn = sinon.stub().rejects(new Error('Test error'));

//     // Wrap the mock function with asyncRoute.
//     const wrappedRoute = asyncRoute(mockFn);

//     // Call the wrapped route.
//     await wrappedRoute(req, res, next);

//     // Assert that console.error was called.
//     expect(consoleErrorStub.calledOnce).to.be.true;
//     expect(consoleErrorStub.args[0][0]).to.equal('Error in route:');
//     expect(consoleErrorStub.args[0][1]).to.equal('Test error');

//     // Restore console.error.
//     consoleErrorStub.restore();
//   });

//   after(async () => {
//     await disconnectDatabase();
//     server.close(async () => {
//       console.log('Server and database connections closed.');
//     });
//   });
// });

describe('Test CORS Middleware', () => {
  it('should allow request from allowed origin', async () => {
    const res = await request(app)
      .get('/api/healthcheck')
      .set('Origin', 'http://localhost:4200');

    expect(res.headers['access-control-allow-origin']).to.equal(
      'http://localhost:4200'
    );
    expect(res.status).to.not.equal(500);
  });

  it('should reject request from disallowed origin', async () => {
    const res = await request(app)
      .get('/api/healthcheck')
      .set('Origin', 'http://malicious-site.com');

    expect(res.status).to.not.equal(500);
    expect(res.headers['access-control-allow-origin']).to.be.undefined;
  });

  it('should allow requests with no origin (like curl)', async () => {
    const res = await request(app).get('/api/healthcheck');
    expect(res.status).to.not.equal(500);
  });
});
