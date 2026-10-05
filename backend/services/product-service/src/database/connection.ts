import { createDatabase } from '@boutique/shared';

export const { connectDB, query, getPool } = createDatabase({ defaultDatabase: 'products_db', label: 'product service' });
