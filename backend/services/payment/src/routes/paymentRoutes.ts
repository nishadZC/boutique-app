import { Router } from 'express';
import { createOrder, refund, updateStatus, verify } from '../controllers/paymentController';
import { requireAdmin, requireUser } from '../middleware/auth';

const router = Router();

// Checkout actions are made by the signed-in customer who owns the order.
router.post('/orders', requireUser, createOrder);
router.post('/verify', requireUser, verify);
router.post('/status', requireUser, updateStatus);

// Refunds are issued by an admin approving a cancellation or return.
router.post('/admin/orders/:id/refund', requireAdmin, refund);

export { router as paymentRoutes };