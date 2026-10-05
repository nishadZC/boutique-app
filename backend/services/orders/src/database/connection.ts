import { createDatabase } from '@boutique/shared';

export const { connectDB, query, getPool } = createDatabase({ defaultDatabase: 'orders_db', label: 'orders service' });
