import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// const uploadPath = path.join(__dirname, '../../uploads/avatars');
// const uploadPath = path.join(__dirname, '../../tmp/avatars');

// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `${req.user?._id}-${Date.now()}${ext}`);
//   },
// });

const storage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit.
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
}).single('avatar');
