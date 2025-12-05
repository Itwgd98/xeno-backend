import express from 'express';
import { getOrders, getOrderById } from '../controllers/orderController.js';
import authMiddleware from '../middleware/auth.js';
import tenantMiddleware from '../middleware/tenant.js';

const router = express.Router();

// All order routes protected - check JWT first, then fallback to tenant header
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);

export default router;
