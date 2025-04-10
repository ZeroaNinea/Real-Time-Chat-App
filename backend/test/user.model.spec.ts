// import { expect } from 'chai';
// import mongoose from 'mongoose';
// import request from 'supertest';
// import bcrypt from 'bcrypt';

// import { User } from '../src/models/user.model';
// import { app } from '../src/app';
// import { connectToDatabase, disconnectDatabase } from '../src/config/db';
// import { server } from '../src/server';

// describe('User Model', () => {
//   before(async (done) => {
//     // await mongoose.connect('mongodb://localhost:27017/test-db');
//     await connectToDatabase();
//   });

//   beforeEach(async () => {
//     const registerRes = await request(app)
//       .post('/auth/register')
//       .send({
//         username: 'imgay',
//         email: 'imgay@gmail.com',
//         password: 'imgay',
//       })
//       .set('Content-Type', 'application/json')
//       .set('Accept', 'application/json');

//     expect(registerRes.status).to.equal(201);
//     expect(registerRes.body.message).to.equal('User registered successfully!');
//   });

//   // after(async (done) => {
//   //   await mongoose.connection.dropDatabase();
//   //   await mongoose.disconnect();

//   //   done();
//   // });

//   afterEach(async () => {
//     await User.deleteMany({});
//   });

//   it('should hash the password before saving', async () => {
//     const rawPassword = 'imgay';
//     const user = new User({
//       username: 'imgay',
//       email: 'imgay@gmail.com',
//       password: rawPassword,
//     });

//     await user.save();

//     expect(user.password).to.not.equal(rawPassword);
//     const isMatch = await bcrypt.compare(rawPassword, user.password);
//     expect(isMatch).to.be.true;
//   });

//   // it('should compare passwords correctly', async (done) => {
//   //   const rawPassword = 'compare-me';
//   //   const user = new User({
//   //     username: 'imgay',
//   //     email: 'imgay@gmail.com',
//   //     password: rawPassword,
//   //   });

//   //   await user.save();

//   //   const isMatch = await user.comparePassword(rawPassword);
//   //   expect(isMatch).to.be.true;

//   //   const isWrong = await user.comparePassword('wrong-password');
//   //   expect(isWrong).to.be.false;

//   //   done();
//   // });

//   // it('should throw if password is not provided in comparePassword', async (done) => {
//   //   const user = new User({
//   //     username: 'thrower',
//   //     email: 'throw@example.com',
//   //     password: '123456',
//   //   });

//   //   await user.save();

//   //   try {
//   //     await user.comparePassword('');
//   //   } catch (err: unknown) {
//   //     expect(err).to.equal('Password is required.');
//   //   }

//   //   done();
//   // });

//   after(async () => {
//     await mongoose.connection.dropDatabase();
//     await mongoose.disconnect();
//     server.close(async () => {
//       console.log('Server and database connections closed.');
//     });
//   });
// });
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
