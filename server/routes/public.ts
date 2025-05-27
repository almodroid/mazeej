import { Express } from 'express';
import { db } from '../db';
import { pages } from '@shared/schema';
import { eq } from 'drizzle-orm';

export function registerPublicRoutes(app: Express) {
  // Get a page by slug
  app.get('/api/pages/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const [page] = await db
        .select()
        .from(pages)
        .where(eq(pages.slug, slug));

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (!page.isPublished) {
        return res.status(404).json({ error: 'Page not found' });
      }

      res.json(page);
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ error: 'Failed to fetch page' });
    }
  });
} 