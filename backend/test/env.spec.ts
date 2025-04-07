import { expect } from 'chai';
import * as sinon from 'sinon';
import * as dotenv from 'dotenv';

// Mock dotenv to prevent it from loading the .env file
sinon.stub(dotenv, 'config').callsFake(() => ({}));

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

    // Clear the require cache for env.ts
    delete require.cache[require.resolve('../src/config/env')];

    // Reload the env.ts file
    const config = require('../src/config/env').default;

    // Assert default values
    expect(config.DIALECT).to.equal('mongodb');
    expect(config.DB_HOST).to.equal('localhost');
    expect(config.DB_PORT).to.equal(27017);
    expect(config.DB_NAME).to.equal('default_db');
    expect(config.DB_USER).to.equal('');
    expect(config.DB_PASSWORD).to.equal('');
    expect(config.NODE_ENV).to.equal('development');
    expect(config.PORT).to.equal(3000);
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

    // Clear the require cache for env.ts
    delete require.cache[require.resolve('../src/config/env')];

    // Reload the env.ts file
    const config = require('../src/config/env').default;

    // Assert custom values
    expect(config.DIALECT).to.equal('postgres');
    expect(config.DB_HOST).to.equal('customhost');
    expect(config.DB_PORT).to.equal(5432);
    expect(config.DB_NAME).to.equal('custom_db');
    expect(config.DB_USER).to.equal('custom_user');
    expect(config.DB_PASSWORD).to.equal('custom_pass');
    expect(config.NODE_ENV).to.equal('production');
    expect(config.PORT).to.equal(8080);
  });
});
