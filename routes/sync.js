import express from 'express';
import { syncNow, getSyncStatus } from '../controllers/syncController.js';
import authMiddleware from '../middleware/auth.js';
import tenantMiddleware from '../middleware/tenant.js';

const router = express.Router();

// Sync routes - protected with JWT or tenant header
router.post('/now', authMiddleware, syncNow);
router.get('/status', authMiddleware, getSyncStatus);

export default router;
