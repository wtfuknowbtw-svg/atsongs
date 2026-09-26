import multer from 'multer';
import { config } from '../config';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedFormats = config.upload.allowedFormats;
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (fileExtension && allowedFormats.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File format not allowed. Allowed formats: ${allowedFormats.join(', ')}`));
    }
  },
});

export const uploadMiddleware = upload.single('file');
