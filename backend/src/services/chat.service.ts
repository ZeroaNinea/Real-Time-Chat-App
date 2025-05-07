import { Chat } from '../models/chat.model';
import { Channel } from '../models/channel.model';
import { Member } from '../../types/member.aliase';

export async function addChannelService(
  chatId: string,
  channelName: string,
  userId: string
) {
  console.log('addChannelService called with', { chatId, channelName, userId });
  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error('Chat not found');

  const member = chat.members.find((m: Member) => m.user.equals(userId));
  const isAdminOrOwner = member?.roles.some((r: string) =>
    ['Owner', 'Admin'].includes(r)
  );

  if (!isAdminOrOwner) {
    throw new Error('Only admins or owner can add channels');
  }

  const channel = await Channel.create({ chatId: chat._id, name: channelName });
  return channel;
}
