import express from 'express';
import * as recommendController from '../controllers/recommend.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, recommendController.getRecommendations);
router.post('/dismiss/:id', verifyToken, recommendController.dismissRecommendation);
router.post('/rate/:id', verifyToken, recommendController.rateContent);

export default router;
