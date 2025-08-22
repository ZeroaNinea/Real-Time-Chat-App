import { expect } from 'chai';
import sinon from 'sinon';
import * as chatService from '../src/services/chat.service';
import { Chat } from '../src/models/chat.model';
import { Channel } from '../src/models/channel.model';

describe('chat.service.addChannelService', () => {
  let chatFindByIdStub: sinon.SinonStub;
  let channelFindOneStub: sinon.SinonStub;
  let channelCreateStub: sinon.SinonStub;

  beforeEach(() => {
    chatFindByIdStub = sinon.stub(Chat, 'findById');
    channelFindOneStub = sinon.stub(Channel, 'findOne').returns({
      sort: () => ({ select: () => null }),
    } as any);
    channelCreateStub = sinon
      .stub(Channel, 'create')
      .resolves({ _id: 'chan1' });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should throw if chat is not found', async () => {
    chatFindByIdStub.resolves(null);

    try {
      await chatService.addChannelService('chat1', 'general', 'user1');
      expect.fail('Expected error not thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Chat not found');
    }
  });

  it('should throw if user is not admin/owner and lacks canCreateChannels', async () => {
    chatFindByIdStub.resolves({
      _id: 'chat1',
      members: [
        {
          user: { equals: (id: string) => id === 'user1' },
          roles: ['Moderator'], // not admin/owner
        },
      ],
      roles: [
        { name: 'Moderator', permissions: [] }, // no "canCreateChannels"
      ],
    });

    try {
      await chatService.addChannelService('chat1', 'general', 'user1');
      expect.fail('Expected error not thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Only admins or owner can add channels');
    }
  });

  it('should create channel if user has permission', async () => {
    chatFindByIdStub.resolves({
      _id: 'chat1',
      members: [
        {
          user: { equals: (id: string) => id === 'user1' },
          roles: ['Moderator'],
        },
      ],
      roles: [{ name: 'Moderator', permissions: ['canCreateChannels'] }],
    });

    const result = await chatService.addChannelService(
      'chat1',
      'general',
      'user1'
    );

    expect(channelCreateStub.calledOnce).to.be.true;
    expect(result).to.have.property('_id', 'chan1');
  });
});
