import express from 'express';
import request from 'supertest';
import fs from 'fs';
import sinon from 'sinon';

import { uploadChatThumbnail } from '../src/middleware/thumbnail-upload';

describe('Chat Thumbnail Upload Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();

    app.post('/upload-thumbnail', (req, res) => {
      uploadChatThumbnail(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        res.status(200).json({ message: 'Thumbnail upload success' });
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should create the chat-thumbnails directory if missing', () => {
    const existsStub = sinon.stub(fs, 'existsSync').returns(false);
    const mkdirStub = sinon.stub(fs, 'mkdirSync');

    delete require.cache[require.resolve('../src/middleware/thumbnail-upload')];
    require('../src/middleware/thumbnail-upload');

    sinon.assert.calledOnce(mkdirStub);
    sinon.assert.calledWithMatch(mkdirStub, sinon.match.string, {
      recursive: true,
    });

    existsStub.restore();
    mkdirStub.restore();
  });

  it('should upload a chat thumbnail successfully', async () => {
    await request(app)
      .post('/upload-thumbnail')
      .attach('thumbnail', Buffer.from('fake image'), {
        filename: 'test.png',
        contentType: 'image/png',
      })
      .expect(200)
      .expect((res) => {
        if (res.body.message !== 'Thumbnail upload success') {
          throw new Error('Unexpected success message');
        }
      });
  });

  it('should reject non-image files', async () => {
    await request(app)
      .post('/upload-thumbnail')
      .attach('thumbnail', Buffer.from('not an image'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .expect(400)
      .expect((res) => {
        if (res.body.message !== 'Only image files are allowed') {
          throw new Error('Unexpected error message');
        }
      });
  });

  it('should reject files exceeding size limit', async () => {
    const bigBuffer = Buffer.alloc(3 * 1024 * 1024); // 3 MB
    await request(app)
      .post('/upload-thumbnail')
      .attach('thumbnail', bigBuffer, {
        filename: 'big.png',
        contentType: 'image/png',
      })
      .expect(400)
      .expect((res) => {
        if (!res.body.message.includes('File too large')) {
          throw new Error('Expected file size limit error');
        }
      });
  });
});
