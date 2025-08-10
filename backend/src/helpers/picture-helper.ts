import path from 'path';
import fs from 'fs';
import { Chat } from '../models/chat.model';

const deleteAvatarFile = async (user: any) => {
  if (user.avatar) {
    const fullPath = path.join(__dirname, '../../', user.avatar);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath); // Delete the avatar file.
    }
    user.avatar = '';
    await user.save();
  }
};

const deleteThumbnailFile = (chat: typeof Chat.prototype) => {
  if (!chat.thumbnail) return;

  const fullPath = path.join(
    __dirname,
    '../../uploads/chat-thumbnails',
    chat.thumbnail
  );
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

export default { deleteAvatarFile, deleteThumbnailFile };
