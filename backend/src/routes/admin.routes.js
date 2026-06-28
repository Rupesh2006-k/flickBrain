import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/role.middleware.js';

const router = express.Router();

// Lock down all admin routes under token verification and role assertion
router.use(verifyToken, isAdmin);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/plan', adminController.updateUserPlan);
router.delete('/users/:id', adminController.softDeleteUser);
router.get('/stats', adminController.getStats);

export default router;
