import multer from 'multer';
import path from 'path';
import fs from 'fs';

const chatThumbnailPath = path.join(__dirname, '../../uploads/chat-thumbnails');

if (!fs.existsSync(chatThumbnailPath)) {
  fs.mkdirSync(chatThumbnailPath, { recursive: true });
}

const chatThumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, chatThumbnailPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chat-${Date.now()}${ext}`);
  },
});

export const uploadChatThumbnail = multer({
  storage: chatThumbnailStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
}).single('thumbnail');
