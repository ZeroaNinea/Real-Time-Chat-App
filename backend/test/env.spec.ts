import { expect } from 'chai';

describe('Environment Variables', () => {
  it('should load environment variables from .env file', async () => {
    // Backup and mock environment
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

    // Restore
    process.env = originalEnv;
  });
});
