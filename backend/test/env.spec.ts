import { expect } from 'chai';

describe('Environment Variables', () => {
  it('should load environment variables from .env file', async () => {
    // Backup and mock environment.
    const originalEnv = { ...process.env };
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '27017';
    process.env.DB_NAME = 'testdb';
    process.env.DIALECT = 'mongodb';
    process.env.NODE_ENV = 'test';
    process.env.PORT = '4000';

    delete require.cache[require.resolve('../src/config/env')];
    const env = await import('../src/config/env');

    expect(env.DB_URL).to.include('testuser');
    expect(env.NODE_ENV).to.equal('test');
    expect(env.PORT).to.equal(4000);
    expect(env.DIALECT).to.equal('mongodb');
    expect(env.DB_HOST).to.equal('localhost');
    expect(env.DB_PORT).to.equal(27017);
    expect(env.DB_NAME).to.equal('testdb');
    expect(env.DB_USER).to.equal('testuser');
    expect(env.DB_PASSWORD).to.equal('testpass');

    expect(env.DB_URL).to.equal(
      'mongodb://testuser:testpass@localhost:27017/testdb?authSource=admin'
    );

    // Restore.
    process.env = originalEnv;
  });

  it('should fallback to default port when PORT is not set', async () => {
    const originalEnv = { ...process.env };
    delete process.env.PORT;

    delete require.cache[require.resolve('../src/config/env')];
    const env = await import('../src/config/env');

    expect(env.PORT).to.equal(3000);

    process.env = originalEnv;
  });

  it('should throw when required environment variables are missing', async () => {
    const originalEnv = { ...process.env };

    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;

    try {
      delete require.cache[require.resolve('../src/config/env')];
      await import('../src/config/env');
      throw new Error('Expected import to fail but it succeeded');
    } catch (err) {
      expect(err).to.exist;
    } finally {
      process.env = originalEnv;
    }
  });
});
