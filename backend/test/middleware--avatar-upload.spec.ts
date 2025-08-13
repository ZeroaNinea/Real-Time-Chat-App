import express from 'express';
import request from 'supertest';
import fs from 'fs';
import sinon from 'sinon';

import { uploadAvatar } from '../src/middleware/avatar-upload';

describe('Avatar Upload Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();

    app.post('/upload', (req, res) => {
      uploadAvatar(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        res.status(200).json({ message: 'Upload success' });
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create the uploads directory if missing', () => {
    const existsStub = sinon.stub(fs, 'existsSync').returns(false);
    const mkdirStub = sinon.stub(fs, 'mkdirSync');

    delete require.cache[require.resolve('../src/middleware/avatar-upload')];
    require('../src/middleware/avatar-upload');

    sinon.assert.calledOnce(mkdirStub);
    sinon.assert.calledWithMatch(mkdirStub, sinon.match.string, {
      recursive: true,
    });

    existsStub.restore();
    mkdirStub.restore();
  });

  it('should upload an image successfully', async () => {
    await request(app)
      .post('/upload')
      .attach('avatar', Buffer.from('fake image'), {
        filename: 'test.png',
        contentType: 'image/png',
      })
      .expect(200)
      .expect((res) => {
        if (res.body.message !== 'Upload success')
          throw new Error('Unexpected message');
      });
  });

  it('should reject non-image files', async () => {
    await request(app)
      .post('/upload')
      .attach('avatar', Buffer.from('not an image'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .expect(400)
      .expect((res) => {
        if (res.body.message !== 'Only image files are allowed')
          throw new Error('Unexpected error message');
      });
  });

  it('should reject files exceeding size limit', async () => {
    const bigBuffer = Buffer.alloc(3 * 1024 * 1024);
    await request(app)
      .post('/upload')
      .attach('avatar', bigBuffer, {
        filename: 'big.png',
        contentType: 'image/png',
      })
      .expect(400)
      .expect((res) => {
        if (!res.body.message.includes('File too large'))
          throw new Error('Expected size limit error');
      });
  });
});
