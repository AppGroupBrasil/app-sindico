import { Router, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Garantir que diretórios existam
['avatars', 'documentos', 'fotos', 'qrcodes'].forEach(dir => {
  const p = path.join(UPLOADS_DIR, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();
router.use(authMiddleware);

// POST /api/upload/image
router.post('/image', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }

  const ALLOWED_FOLDERS = ['fotos', 'avatars', 'documentos', 'qrcodes'];
  let subfolder = (req.body.folder as string) || 'fotos';
  if (!ALLOWED_FOLDERS.includes(subfolder)) subfolder = 'fotos';
  const dir = path.join(UPLOADS_DIR, subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const filepath = path.join(dir, filename);

  await sharp(req.file.buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath);

  const url = `/uploads/${subfolder}/${filename}`;
  res.json({ url });
});

// POST /api/upload/avatar
router.post('/avatar', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }

  const filename = `${req.user!.id}.webp`;
  const filepath = path.join(UPLOADS_DIR, 'avatars', filename);

  await sharp(req.file.buffer)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(filepath);

  const url = `/uploads/avatars/${filename}`;
  res.json({ url });
});

// POST /api/upload/document
router.post('/document', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }

  const ALLOWED_EXTS: Record<string, string> = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const ext = ALLOWED_EXTS[req.file.mimetype] || '.pdf';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filepath = path.join(UPLOADS_DIR, 'documentos', filename);

  fs.writeFileSync(filepath, req.file.buffer);

  const url = `/uploads/documentos/${filename}`;
  res.json({ url });
});

export default router;
