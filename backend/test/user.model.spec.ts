import { expect } from 'chai';
import bcrypt from 'bcrypt';
import { User } from '../src/models/user.model';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';

describe('User Model', () => {
  before(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await disconnectDatabase();
  });

  it('should hash the password before saving', async () => {
    const rawPassword = 'imgay';
    const user = new User({
      username: 'imgay',
      email: 'imgay@gmail.com',
      password: rawPassword,
    });

    await user.save();

    expect(user.password).to.not.equal(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, user.password);
    expect(isMatch).to.be.true;
  });

  it('should compare passwords correctly', async () => {
    const rawPassword = 'compare-me';
    const user = new User({
      username: 'imgay',
      email: 'imgay@gmail.com',
      password: rawPassword,
    });

    await user.save();

    const isMatch = await user.comparePassword(rawPassword);
    expect(isMatch).to.be.true;

    const isWrong = await user.comparePassword('wrong-password');
    expect(isWrong).to.be.false;
  });

  it('should throw if password is not provided in comparePassword', async () => {
    const user = new User({
      username: 'thrower',
      email: 'throw@example.com',
      password: '123456',
    });

    await user.save();

    try {
      await user.comparePassword('');
    } catch (err: unknown) {
      const message = (err as Error).message;
      expect(message).to.equal('Password is required.');
    }
  });
});
