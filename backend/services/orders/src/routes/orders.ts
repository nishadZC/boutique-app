import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import { Order, CreateOrderRequest, Address, ServiceResponse } from '../types';
import { boutiqueTotalOrders, boutiqueTotalRevenue } from '../metrics';

const router = express.Router();
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/', async (req, res) => {
  try {
    let extractedUserId: string | null = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.userId) extractedUserId = decoded.userId;
      } catch (e) {
        // If it's not a JWT, it might just be the raw UUID (as per demo auth)
        if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(token)) {
          extractedUserId = token;
        } else {
          console.error('Failed to parse token in orders post', e);
        }
      }
    }
    
    if (!req.body.userId && !extractedUserId) {
      // Fallback to a valid dummy UUID if none provided, to avoid Postgres type errors
      extractedUserId = '00000000-0000-0000-0000-000000000000';
    }
    
    // Use decoded userId, or fallback to request body / demo
    const { items, shippingAddress, userId = extractedUserId } = req.body as CreateOrderRequest & { userId?: string };

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const productResponse = await axios.get(`${PRODUCTS_SERVICE_URL}/${item.productId}`);
      const product = productResponse.data.data;

      totalAmount += product.price * item.quantity;

      orderItems.push({
        product_id: item.productId,
        quantity: item.quantity,
        price: product.price
      });
    }

    const result = await query(`
      INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [userId, totalAmount, 'pending', JSON.stringify(shippingAddress), 'pending']);

    const order = result.rows[0];

    const insertedItems: any[] = [];
    for (const item of orderItems) {
      const itemResult = await query(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [order.id, item.product_id, item.quantity, item.price]);
      insertedItems.push({ ...item, id: itemResult.rows[0].id });
    }

    boutiqueTotalOrders.inc(1); // Increment Prometheus metric
    boutiqueTotalRevenue.inc(totalAmount); // Add order total to Revenue metric

    const response: ServiceResponse<Order> = {
      success: true,
      data: {
        id: order.id,
        userId: order.user_id,
        items: insertedItems.map(item => ({
          id: item.id,
          orderId: order.id,
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: order.total_amount,
        status: order.status,
        shippingAddress: shippingAddress,
        paymentStatus: order.payment_status,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

router.get('/my-orders', async (req, res) => {
  try {
    let extractedUserId: string | null = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.userId) extractedUserId = decoded.userId;
      } catch (e) {
        // If it's not a JWT, it might just be the raw UUID (as per demo auth)
        if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(token)) {
          extractedUserId = token;
        } else {
          console.error('Failed to parse token in orders get', e);
        }
      }
    }
    
    if (!req.query.userId && !extractedUserId) {
       extractedUserId = '00000000-0000-0000-0000-000000000000';
    }
    
    const userId = req.query.userId as string || extractedUserId;

    const result = await query(`
      SELECT o.*,
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', oi.id,
                 'productId', oi.product_id,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id, o.user_id, o.total_amount, o.status, o.shipping_address, o.payment_status, o.created_at, o.updated_at
      ORDER BY o.created_at DESC
    `, [userId]);

    const ordersWithProducts = await Promise.all(result.rows.map(async (order: any) => {
      // If there are no items (JSON_AGG can return [null]), handle it
      let items = order.items || [];
      if (items.length === 1 && items[0].id === null) items = [];

      const itemsWithProducts = await Promise.all(items.map(async (item: any) => {
        try {
          const productResponse = await axios.get(`${PRODUCTS_SERVICE_URL}/${item.productId}`);
          const productData = productResponse.data.data;
          return {
            ...item,
            product: {
              ...productData,
              imageUrl: productData.image_url || '/product-images/placeholder.jpg'
            }
          };
        } catch (error) {
          console.error(`Failed to fetch product ${item.productId} for order ${order.id}`);
          return {
            ...item,
            product: { name: 'Unknown Product', imageUrl: '', price: item.price }
          };
        }
      }));

      let parsedAddress = order.shipping_address;
      if (typeof parsedAddress === 'string' && parsedAddress.trim().startsWith('{')) {
        try { parsedAddress = JSON.parse(parsedAddress); } catch (e) { /* ignore */ }
      }

      return {
        id: order.id,
        userId: order.user_id,
        status: order.status,
        shippingAddress: parsedAddress,
        paymentStatus: order.payment_status,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: itemsWithProducts
      };
    }));

    const response: ServiceResponse<Order[]> = {
      success: true,
      data: ordersWithProducts
    };

    res.json(response);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    await query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);

    const response: ServiceResponse<Order> = {
      success: true,
      data: result.rows[0]
    };

    res.json(response);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

export { router as orderRoutes };
