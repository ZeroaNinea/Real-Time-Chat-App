// import { expect } from 'chai';
// import sinon from 'sinon';
// import mongoose from 'mongoose';
// import * as envTs from '../src/config/env';
// import * as dbModule from '../src/config/db';
// import { MongoMemoryServer } from 'mongodb-memory-server';

// const env = envTs.getEnv();

// describe('Database Connection', () => {
//   let connectStub: sinon.SinonStub;
//   let disconnectStub: sinon.SinonStub;

//   beforeEach(() => {
//     connectStub = sinon.stub(mongoose, 'connect').resolves(mongoose);
//     disconnectStub = sinon.stub(mongoose, 'disconnect').resolves();
//   });

//   afterEach(() => {
//     sinon.restore();
//   });

//   // it('should connect to memory server in test environment', async () => {
//   //   process.env.NODE_ENV = 'test';
//   //   delete require.cache[require.resolve('../src/config/env')];
//   //   const db = await import('../src/config/db');
//   //   await db.connectToDatabase();
//   //   expect(connectStub.calledOnce).to.be.true;

//   //   // process.exit();
//   // });

//   it('should connect to real DB in non-test environment', async () => {
//     process.env.NODE_ENV = 'development';
//     let mongoUrl = envTs.buildMongoUrl();
//     mongoUrl = 'mongodb://fake:uri';
//     await dbModule.connectToDatabase();
//     expect(connectStub.calledWith('mongodb://fake:uri')).to.be.true;
//   });

//   it('should disconnect and stop memory server if used', async () => {
//     process.env.NODE_ENV = 'test';
//     const db = await import('../src/config/db');
//     await db.connectToDatabase();
//     await db.disconnectDatabase();
//     expect(disconnectStub.calledOnce).to.be.true;
//   });
// });
