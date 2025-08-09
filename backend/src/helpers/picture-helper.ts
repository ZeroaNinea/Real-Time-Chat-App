import path from 'path';
import fs from 'fs';

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

export default { deleteAvatarFile };
