import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('Environment Variables Configuration', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Backup the original environment variables
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    // Restore the original environment variables
    process.env = ORIGINAL_ENV;
  });

  it('should load default values when environment variables are missing', () => {
    // Clear relevant environment variables
    delete process.env.DIALECT;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.NODE_ENV;
    delete process.env.PORT;

    // Mock dotenv to prevent it from loading the .env file
    const env = proxyquire('../src/config/env', {
      dotenv: { config: () => ({}) },
    }).default;

    // Assert default values
    expect(env.DIALECT).to.equal('mongodb');
    expect(env.DB_HOST).to.equal('localhost');
    expect(env.DB_PORT).to.equal(27017);
    expect(env.DB_NAME).to.equal('default_db');
    expect(env.DB_USER).to.equal('');
    expect(env.DB_PASSWORD).to.equal('');
    expect(env.NODE_ENV).to.equal('development');
    expect(env.PORT).to.equal(3000);
  });

  it('should load custom values from environment variables', () => {
    // Set custom environment variables
    process.env.DIALECT = 'postgres';
    process.env.DB_HOST = 'customhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'custom_db';
    process.env.DB_USER = 'custom_user';
    process.env.DB_PASSWORD = 'custom_pass';
    process.env.NODE_ENV = 'production';
    process.env.PORT = '8080';

    // Mock dotenv to prevent it from loading the .env file
    const env = proxyquire('../src/config/env', {
      dotenv: { config: () => ({}) },
    }).default;

    // Assert custom values
    expect(env.DIALECT).to.equal('postgres');
    expect(env.DB_HOST).to.equal('customhost');
    expect(env.DB_PORT).to.equal(5432);
    expect(env.DB_NAME).to.equal('custom_db');
    expect(env.DB_USER).to.equal('custom_user');
    expect(env.DB_PASSWORD).to.equal('custom_pass');
    expect(env.NODE_ENV).to.equal('production');
    expect(env.PORT).to.equal(8080);
  });
});
