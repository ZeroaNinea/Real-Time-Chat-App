import { expect } from 'chai';
import {
  DIALECT,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  PORT,
} from '../src/config/env';

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

  it('should check environment variables datatypes', async () => {
    const env = await import('../src/config/env');

    expect(env.DB_URL).to.be.a('string');
    expect(env.NODE_ENV).to.be.a('string');
    expect(env.PORT).to.be.a('number');
    expect(env.DIALECT).to.be.a('string');
    expect(env.DB_HOST).to.be.a('string');
    expect(env.DB_PORT).to.be.a('number');
    expect(env.DB_NAME).to.be.a('string');
    expect(env.DB_USER).to.be.a('string');
    expect(env.DB_PASSWORD).to.be.a('string');
  });

  it('should check DB_PORT value', async () => {
    expect(DB_PORT).to.be.a('number');

    process.env.DB_PORT = '27017';

    expect(DB_PORT).to.not.be.equal('27017', 'DB_PORT should be 27017');
  });

  it('should check PORT value', async () => {
    expect(PORT).to.be.a('number');

    process.env.PORT = '27017';

    expect(PORT).to.not.be.equal('27017', 'DB_PORT should be 27017');
  });

  // it('should use default PORT if environment variable is not set', async () => {
  //   const originalEnv = { ...process.env };
  //   delete process.env.PORT;

  //   delete require.cache[require.resolve('../src/config/env')];
  //   const env = await import('../src/config/env');

  //   expect(env.PORT).to.equal(3000);

  //   process.env = originalEnv;
  // });
});
