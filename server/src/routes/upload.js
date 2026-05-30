import { Router } from 'express';
import multer from 'multer';
import { join, extname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { requireAdmin } from '../auth/admin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../../uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

const router = Router();
router.use(requireAdmin);

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
