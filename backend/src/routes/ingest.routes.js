import express from 'express';
import multer from 'multer';
import * as ingestController from '../controllers/ingest.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

// Multer in-memory storage setup with 5MB file size limit
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/netflix', verifyToken, upload.single('file'), ingestController.netflixIngest);
router.post('/netflix/sync', verifyToken, ingestController.netflixSync);
router.post('/youtube', verifyToken, ingestController.youtubeIngest);
router.get('/search', verifyToken, ingestController.searchContent);
router.post('/mark-watched', verifyToken, ingestController.markAsWatched);

export default router;
