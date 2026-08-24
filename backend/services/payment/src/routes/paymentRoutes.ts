import { Router } from 'express';
import { createOrder, updateStatus, verify } from '../controllers/paymentController';

const router = Router();

router.post('/orders', createOrder);
router.post('/verify', verify);
router.post('/status', updateStatus);

export { router as paymentRoutes };