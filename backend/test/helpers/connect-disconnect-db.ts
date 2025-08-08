import sinon from 'sinon';
import proxyquire from 'proxyquire';

export function connectToDatabase() {
  let connectStub: sinon.SinonStub;
  let disconnectStub: sinon.SinonStub;
  let mongoMemoryStub: any;
  let dbModule: any;

  const originalEnv = process.env;

  process.env = { ...originalEnv };
  connectStub = sinon.stub().resolves();
  disconnectStub = sinon.stub().resolves();

  // Stub MongoMemoryServer.
  const mockUri = 'mongodb://localhost:27017/in-memory-test';
  mongoMemoryStub = {
    create: sinon.stub().resolves({
      getUri: () => mockUri,
      stop: sinon.stub().resolves(),
    }),
  };

  dbModule = proxyquire('../src/config/db', {
    mongoose: {
      connect: connectStub,
      disconnect: disconnectStub,
      default: {}, // export default mongoose.
    },
    './env': {
      default: {
        NODE_ENV: 'test',
        DB_USER: 'user',
        DB_PASSWORD: 'pass',
        DB_HOST: 'host',
        DB_PORT: 1234,
        DB_NAME: 'db',
      },
    },
    'mongodb-memory-server': {
      MongoMemoryServer: mongoMemoryStub,
    },
  });
}
