import { Router } from 'express';
import { createOrder, updateStatus, verify } from '../controllers/paymentController';
import { requireUser } from '../middleware/auth';

const router = Router();

// All payment actions are made by the signed-in customer who owns the order.
router.post('/orders', requireUser, createOrder);
router.post('/verify', requireUser, verify);
router.post('/status', requireUser, updateStatus);

export { router as paymentRoutes };