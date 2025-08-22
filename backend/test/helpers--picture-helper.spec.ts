import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import pictureHelper from '../src/helpers/picture-helper';

describe('picture-helper', () => {
  describe('deleteThumbnailFile', () => {
    let existsStub: sinon.SinonStub;
    let unlinkStub: sinon.SinonStub;

    beforeEach(() => {
      existsStub = sinon.stub(fs, 'existsSync').returns(true);
      unlinkStub = sinon.stub(fs, 'unlinkSync');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return immediately if no thumbnail is set', () => {
      const chat: any = { thumbnail: null };

      const result = pictureHelper.deleteThumbnailFile(chat);

      expect(result).to.be.undefined; // function just exits
      expect(existsStub.notCalled).to.be.true;
      expect(unlinkStub.notCalled).to.be.true;
    });

    it('should delete file if thumbnail exists and file is present', () => {
      const chat: any = { thumbnail: 'thumb.png' };

      pictureHelper.deleteThumbnailFile(chat);

      expect(existsStub.calledOnce).to.be.true;
      expect(unlinkStub.calledOnce).to.be.true;
    });

    it('should not delete file if thumbnail exists but file is missing', () => {
      existsStub.returns(false);
      const chat: any = { thumbnail: 'thumb.png' };

      pictureHelper.deleteThumbnailFile(chat);

      expect(existsStub.calledOnce).to.be.true;
      expect(unlinkStub.notCalled).to.be.true;
    });
  });
});
