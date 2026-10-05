import { createDatabase } from '@boutique/shared';

export const { connectDB, query, getPool } = createDatabase({ defaultDatabase: 'boutique_auth' });
