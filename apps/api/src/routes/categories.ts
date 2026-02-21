import type { FastifyInstance } from 'fastify';
import { allowedCategories } from '../domain/constants.js';

const labels: Record<(typeof allowedCategories)[number], string> = {
  ELECTRONICS: 'Electronics',
  HOME_APPLIANCES: 'Home Appliances',
  SPORTS_EQUIPMENT: 'Sports Equipment'
};

export async function registerCategoriesRoute(app: FastifyInstance): Promise<void> {
  app.get('/api/categories', async () => {
    return {
      categories: allowedCategories.map((id) => ({ id, label: labels[id] }))
    };
  });
}
