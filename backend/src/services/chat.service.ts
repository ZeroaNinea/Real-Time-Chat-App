import { Chat } from '../models/chat.model';
import { Channel } from '../models/channel.model';
import { Member } from '../../types/member.alias';
import { Role } from '../../types/role.alias';

export async function addChannelService(
  chatId: string,
  channelName: string,
  userId: string
) {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error('Chat not found');

  const member = chat.members.find((m: Member) => m.user.equals(userId));
  const isAdminOrOwner = member?.roles.some((r: string) =>
    ['Owner', 'Admin'].includes(r)
  );

  const currentUserPermissions = member?.roles.map((role: string) => {
    const permissions =
      chat.roles.find((r: Role) => r.name === role)?.permissions || [];

    return [...new Set(permissions)];
  });

  if (
    !isAdminOrOwner &&
    !currentUserPermissions?.flat().includes('canCreateChannels')
  ) {
    throw new Error('Only admins or owner can add channels');
  }

  const maxChannel = await Channel.findOne({ chatId })
    .sort('-order')
    .select('order');

  const nextOrder = maxChannel ? maxChannel.order + 1 : 0;

  const channel = await Channel.create({
    chatId: chat._id,
    order: nextOrder,
    name: channelName,
  });
  return channel;
}
