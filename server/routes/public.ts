import { Express } from 'express';
import { db } from '../db';
import { pages, testimonials } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';

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

  // Get active testimonials
  app.get('/api/testimonials', async (req, res) => {
    try {
      const activeTestimonials = await db
        .select()
        .from(testimonials)
        .where(and(eq(testimonials.isActive, true)))
        .orderBy(asc(testimonials.order))
        .limit(6); // Limit to 6 testimonials for the home page
      
      res.json(activeTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
  });
} 