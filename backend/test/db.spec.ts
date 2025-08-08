import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import { connectToDatabase } from './helpers/connect-disconnect-db';

describe('Database Connection', () => {
  let connectStub!: sinon.SinonStub;
  let disconnectStub!: sinon.SinonStub;
  let mongoMemoryStub: any;
  let dbModule: any;

  const originalEnv = process.env;

  beforeEach(() => {
    const connection = connectToDatabase(
      connectStub,
      disconnectStub,
      mongoMemoryStub,
      dbModule
    );

    connectStub = connection.connectStub;
    disconnectStub = connection.disconnectStub;
    mongoMemoryStub = connection.mongoMemoryStub;
    dbModule = connection.dbModule;
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

  it('disconnects from database and stops in-memory server', async () => {
    const stopStub = sinon.stub().resolves();
    const mockMemoryServer = {
      getUri: () => 'mongodb://localhost:27017/in-memory-test',
      stop: stopStub,
    };

    mongoMemoryStub.create.resolves(mockMemoryServer);

    await dbModule.connectToDatabase();
    await dbModule.disconnectDatabase();

    expect(disconnectStub.calledOnce).to.be.true;
  });

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
