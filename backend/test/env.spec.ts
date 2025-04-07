import { expect } from 'chai';

describe('Environment Variables', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load default values from .env', async () => {
    process.env.DIALECT = 'mongodb';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '27017';
    process.env.DB_NAME = 'test_db';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'development';

    delete require.cache[require.resolve('../src/config/env')];
    const envTs = await import('../src/config/env');

    const env = envTs.getEnv();

    expect(env.DIALECT).to.equal('mongodb');
    expect(env.DB_PORT).to.equal(27017);
    expect(envTs.buildMongoUrl()).to.equal(
      'mongodb://testuser:testpass@localhost:27017/test_db?authSource=admin'
    );
    expect(env.PORT).to.equal(4000);
  });

  it('should fallback to default PORT if not provided', async () => {
    delete process.env.PORT;
    process.env.DIALECT = 'mongodb';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '27017';
    process.env.DB_NAME = 'test_db';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';

    delete require.cache[require.resolve('../src/config/env')];
    const envTs = await import('../src/config/env');
    const env = envTs.getEnv();

    expect(env.PORT).to.equal(3000);
  });
});
