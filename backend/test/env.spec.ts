import { expect } from 'chai';
import { buildMongoUrl } from '../src/config/env';

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

  it('should delete environment variables to check their assignment', async () => {
    delete require.cache[require.resolve('../src/config/env')];
    const envTs = await import('../src/config/env');
    let env = envTs.getEnv();

    // delete env.DIALECT;
    // delete process.env.DIALECT;
    // delete process.env.DB_HOST;
    // delete process.env.DB_PORT;
    // delete process.env.DB_NAME;
    // delete process.env.DB_USER;
    // delete process.env.DB_PASSWORD;
    console.log(env.NODE_ENV, '=================');
    delete process.env.NODE_ENV;
    // delete process.env.PORT;
    // delete process.env.DB_URL;

    // console.log(env.DB_PORT, '=================');
    // console.log(env.PORT);
    console.log(env.NODE_ENV);
    // console.log(envTs.buildMongoUrl());

    // expect(env.DIALECT).to.equal('mongodb');
    // expect(env.DB_HOST).to.equal('localhost');
    // expect(env.DB_PORT).to.equal(27017);
    // expect(env.DB_NAME).to.equal('default_db');
    // expect(env.DB_USER).to.equal('');
    // expect(env.DB_PASSWORD).to.equal('');
    // expect(env.NODE_ENV).to.equal('development');
    // expect(env.PORT).to.equal(3000);
    expect(envTs.buildMongoUrl()).to.equal(
      'mongodb://:@localhost:27017/default_db?authSource=admin'
    );
  });

  it('should use DB_URL if provided', async () => {
    process.env.DB_URL = 'mongodb://custom:uri@host:1234/testdb';

    delete require.cache[require.resolve('../src/config/env')];
    const envTs = await import('../src/config/env');

    console.log(envTs.buildMongoUrl(), '===================');

    expect(envTs.buildMongoUrl()).to.equal(
      'mongodb://custom:uri@host:1234/testdb'
    );
  });

  // it('should build Mongo URL from individual env values when DB_URL is not provided', async () => {
  //   delete process.env.DB_URL; // simulate absence of DB_URL
  //   process.env.DB_USER = 'user';
  //   process.env.DB_PASSWORD = 'pass';
  //   process.env.DB_HOST = 'localhost';
  //   process.env.DB_PORT = '27017';
  //   process.env.DB_NAME = 'mydb';

  //   delete require.cache[require.resolve('../src/config/env')];
  //   const envTs = await import('../src/config/env');

  //   expect(envTs.buildMongoUrl()).to.equal(
  //     'mongodb://user:pass@localhost:27017/mydb?authSource=admin'
  //   );
  // });
});
