import { db } from '../../server/db';
import { users, incomes, valuations } from '@shared/schema';

/**
 * Helper to clean up database tables between tests
 */
export const cleanupDatabase = async () => {
  // Clean tables in order to handle foreign key constraints
  await db.delete(valuations);
  await db.delete(incomes);
  await db.delete(users);
};