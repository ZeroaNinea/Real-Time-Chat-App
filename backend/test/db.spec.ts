import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

describe('Database Connection', () => {
  let connectStub: sinon.SinonStub;
  let disconnectStub: sinon.SinonStub;
  let mongoMemoryStub: any;
  let dbModule: any;

  const originalEnv = process.env;

  beforeEach(() => {
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
  });

  afterEach(() => {
    sinon.restore();
    process.env = originalEnv;
  });

  it('connects to external MongoDB with mongodb:// dialect', async () => {
    dbModule = proxyquire('../src/config/db', {
      mongoose: {
        connect: connectStub,
        disconnect: disconnectStub,
        default: {},
      },
      './env': {
        default: {
          NODE_ENV: 'production',
          DIALECT: 'mongodb',
          DB_USER: 'admin',
          DB_PASSWORD: 'adminpass',
          DB_HOST: 'localhost',
          DB_PORT: 27018,
          DB_NAME: 'production_db',
        },
      },
      'mongodb-memory-server': {
        MongoMemoryServer: mongoMemoryStub,
      },
    });

    const expectedUri =
      'mongodb://admin:adminpass@localhost:27018/production_db?authSource=admin';

    await dbModule.connectToDatabase();
    expect(connectStub.calledOnceWith(expectedUri)).to.be.true;
    expect(mongoMemoryStub.create.called).to.be.false;
  });

  it('connects to external MongoDB with mongodb+srv:// dialect', async () => {
    dbModule = proxyquire('../src/config/db', {
      mongoose: {
        connect: connectStub,
        disconnect: disconnectStub,
        default: {},
      },
      './env': {
        default: {
          NODE_ENV: 'production',
          DIALECT: 'mongodb+srv',
          DB_USER: 'atlasuser',
          DB_PASSWORD: 'atlaspass',
          DB_HOST: 'cluster0.example.mongodb.net',
          DB_PORT: 27018,
          DB_NAME: 'atlas_db',
        },
      },
      'mongodb-memory-server': {
        MongoMemoryServer: mongoMemoryStub,
      },
    });

    const expectedUri =
      'mongodb+srv://atlasuser:atlaspass@cluster0.example.mongodb.net/atlas_db?retryWrites=true&w=majority&appName=Cluster0';

    await dbModule.connectToDatabase();
    expect(connectStub.calledOnceWith(expectedUri)).to.be.true;
    expect(mongoMemoryStub.create.called).to.be.false;
  });

  // it('disconnects from database and stops in-memory server', async () => {
  //   const stopStub = sinon.stub().resolves();
  //   const mockMemoryServer = {
  //     getUri: () => 'mongodb://localhost:27017',
  //     stop: stopStub,
  //   };

  //   // Set up with known mongoServer instance.
  //   mongoMemoryStub.create.resolves(mockMemoryServer);
  //   dbModule = proxyquire('../src/config/db', {
  //     mongoose: {
  //       connect: connectStub,
  //       disconnect: disconnectStub,
  //       default: {},
  //     },
  //     './env': {
  //       default: {
  //         NODE_ENV: 'test',
  //         DB_USER: '',
  //         DB_PASSWORD: '',
  //         DB_HOST: '',
  //         DB_PORT: 27017,
  //         DB_NAME: '',
  //       },
  //     },
  //     'mongodb-memory-server': {
  //       MongoMemoryServer: mongoMemoryStub,
  //     },
  //   });

  //   await dbModule.connectToDatabase();
  //   await dbModule.disconnectDatabase();

  //   expect(disconnectStub.calledOnce).to.be.true;
  //   expect(stopStub.calledOnce).to.be.true;
  // });

  it('handles connection error gracefully', async () => {
    const errorStub = sinon.stub(console, 'error');
    connectStub.rejects(new Error('Connection failed'));

    await dbModule.connectToDatabase();
    expect(errorStub.calledOnce).to.be.true;
    expect(errorStub.args[0][0]).to.include('MongoDB connection error');
  });

  it('handles disconnection error gracefully', async () => {
    const errorStub = sinon.stub(console, 'error');
    disconnectStub.rejects(new Error('Disconnect failed'));

    await dbModule.disconnectDatabase();
    expect(errorStub.calledOnce).to.be.true;
    expect(errorStub.args[0][0]).to.include('MongoDB disconnection error');
  });
});
