import { Express } from 'express';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists in the root of the project
const uploadDir = path.join(__dirname, '../../uploads/pages');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

export function registerUploadRoutes(app: Express) {
  // Serve static files from the uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Endpoint for uploading page thumbnails
  app.post('/api/uploads/pages/thumbnail', upload.single('thumbnail'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the public URL of the uploaded file
    const fileUrl = `/uploads/pages/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
} 