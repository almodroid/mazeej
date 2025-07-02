import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// إعداد مجلد الحفظ
const uploadDir = path.join(process.cwd(), 'uploads', 'projects');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// إعداد multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'featured-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// رفع صورة المشروع المميزة
router.post('/api/projects/:id/featured-image', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/projects/${req.file.filename}`;
  res.json({ url: fileUrl });
});

export default router; 