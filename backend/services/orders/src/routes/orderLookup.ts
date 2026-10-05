// Order-id checks and lookups shared by the public, admin and internal routes.
import Joi from 'joi';
import { query } from '../database/connection';
import { getOrderItems, withProducts } from '../services/orderService';

const guid = Joi.string().guid();

export const orderNotFound = (res: any) => res.status(404).json({ success: false, error: 'Order not found' });

// Route middleware: 404 for an :id that is not a UUID, before any database work.
export const requireOrderId = (req: any, res: any, next: any) =>
  (guid.validate(req.params.id).error ? orderNotFound(res) : next());

export const findOrder = async (id: string): Promise<any | undefined> =>
  (await query('SELECT * FROM orders WHERE id = $1', [id])).rows[0];

export const itemsWithProducts = async (orderId: string) =>
  withProducts((await getOrderItems([orderId])).get(orderId) ?? []);
