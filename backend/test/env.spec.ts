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
});
