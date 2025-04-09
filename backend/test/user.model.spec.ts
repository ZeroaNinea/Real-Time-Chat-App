import { expect } from 'chai';
import mongoose from 'mongoose';
import { User } from '../src/models/user.model';
import bcrypt from 'bcrypt';

describe('User Model', () => {
  before(async (done) => {
    await mongoose.connect('mongodb://localhost:27017/test-db');

    done();
  });

  after(async (done) => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();

    done();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('should hash the password before saving', async (done) => {
    const rawPassword = 'my-secret';
    const user = new User({
      username: 'heghine',
      email: 'heghine@example.com',
      password: rawPassword,
    });

    await user.save();

    expect(user.password).to.not.equal(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, user.password);
    expect(isMatch).to.be.true;

    done();
  });

  it('should compare passwords correctly', async () => {
    const rawPassword = 'compare-me';
    const user = new User({
      username: 'zeroa',
      email: 'zeroa@example.com',
      password: rawPassword,
    });

    await user.save();

    const isMatch = await user.comparePassword(rawPassword);
    expect(isMatch).to.be.true;

    const isWrong = await user.comparePassword('wrong-password');
    expect(isWrong).to.be.false;
  });

  it('should throw if password is not provided in comparePassword', async (done) => {
    const user = new User({
      username: 'thrower',
      email: 'throw@example.com',
      password: '123456',
    });

    await user.save();

    try {
      await user.comparePassword('');
    } catch (err: unknown) {
      expect(err).to.equal('Password is required.');
    }

    done();
  });
});
