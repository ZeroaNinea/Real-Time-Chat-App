import { expect } from 'chai';

describe('Environment Variables', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load default values when environment variables are missing', async () => {
    delete process.env.DIALECT;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.NODE_ENV;
    delete process.env.PORT;

    delete require.cache[require.resolve('../src/config/env')];
    const envTs = await import('../src/config/env');
    const env = envTs.getEnv();

    expect(env.DIALECT).to.equal('mongodb');
    expect(env.DB_HOST).to.equal('localhost');
    expect(env.DB_PORT).to.equal(27017);
    expect(env.DB_NAME).to.equal('default_db');
    expect(env.DB_USER).to.equal('');
    expect(env.DB_PASSWORD).to.equal('');
    expect(env.NODE_ENV).to.equal('development');
    expect(env.PORT).to.equal(3000);
  });

  it('should load custom values from environment variables', async () => {
    process.env.DIALECT = 'postgres';
    process.env.DB_HOST = 'customhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'custom_db';
    process.env.DB_USER = 'custom_user';
    process.env.DB_PASSWORD = 'custom_password';
    process.env.NODE_ENV = 'production';
    process.env.PORT = '8080';

    delete require.cache[require.resolve('../src/config/env')];
    const envTs = await import('../src/config/env');
    const env = envTs.getEnv();

    expect(env.DIALECT).to.equal('postgres');
    expect(env.DB_HOST).to.equal('customhost');
    expect(env.DB_PORT).to.equal(5432);
    expect(env.DB_NAME).to.equal('custom_db');
    expect(env.DB_USER).to.equal('custom_user');
    expect(env.DB_PASSWORD).to.equal('custom_password');
    expect(env.NODE_ENV).to.equal('production');
    expect(env.PORT).to.equal(8080);
  });

  it('should fallback to default PORT if not provided', async () => {
    delete process.env.PORT;

    delete require.cache[require.resolve('../src/config/env')];
    const envTs = await import('../src/config/env');
    const env = envTs.getEnv();

    expect(env.PORT).to.equal(3000);
  });

  it('should handle missing NODE_ENV and default to "development"', async () => {
    delete process.env.NODE_ENV;

    delete require.cache[require.resolve('../src/config/env')];
    const envTs = await import('../src/config/env');
    const env = envTs.getEnv();

    expect(env.NODE_ENV).to.equal('development');
  });
});
