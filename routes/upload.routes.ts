import { Router } from 'express';
import { uploadImageHandler } from '../controllers/upload.controller';
import { uploadSingle } from '../middlewares/upload';

const router = Router();

router.post('/image', uploadSingle('file'), uploadImageHandler);

export default router;
