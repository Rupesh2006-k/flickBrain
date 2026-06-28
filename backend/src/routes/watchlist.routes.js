import express from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, watchlistController.getWatchlist);
router.post('/', verifyToken, watchlistController.addToWatchlist);
router.patch('/:id', verifyToken, watchlistController.markAsWatched);
router.delete('/:id', verifyToken, watchlistController.removeFromWatchlist);

export default router;
