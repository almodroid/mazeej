import { Express } from 'express';
import { db } from '../db';
import { evaluationQuestions, users, projects, categories, payments, pages, insertPageSchema, skills, plans, badges, userBadges, testimonials, insertTestimonialSchema } from '@shared/schema';
import { and, eq, sql, count, sum, desc, gte, lte, asc, like } from 'drizzle-orm';
import { isAuthenticated, isAdmin } from './auth';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { z } from 'zod';

export function registerAdminRoutes(app: Express) {
  // Get all questions with optional category and skill filters
  app.get('/api/admin/questions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { categoryId, skillId } = req.query;
      
      const conditions = [];
      if (categoryId) {
        conditions.push(eq(evaluationQuestions.categoryId, Number(categoryId)));
      }
      if (skillId) {
        conditions.push(eq(evaluationQuestions.skillId, Number(skillId)));
      }
      
      const questions = await db
        .select()
        .from(evaluationQuestions)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      console.log('Fetched questions:', questions); // Add logging to debug
      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ message: 'Failed to fetch questions' });
    }
  });

  // Add a new question
  app.post('/api/admin/questions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { categoryId, skillId, question, questionAr, options, optionsAr, correctAnswer, difficulty } = req.body;
      
      if (!categoryId || !skillId || !question || !options || correctAnswer === undefined || !difficulty) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const points = difficulty === 'advanced' ? 3 : difficulty === 'intermediate' ? 2 : 1;
      
      const [newQuestion] = await db.insert(evaluationQuestions).values({
        categoryId,
        skillId,
        question,
        questionAr,
        options,
        optionsAr,
        correctAnswer,
        difficulty,
        points
      }).returning();

      res.status(201).json(newQuestion);
    } catch (error) {
      console.error('Error adding question:', error);
      res.status(500).json({ message: 'Failed to add question' });
    }
  });

  // Update a question
  app.put('/api/admin/questions/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { categoryId, skillId, question, questionAr, options, optionsAr, correctAnswer, difficulty } = req.body;
      
      if (!categoryId || !skillId || !question || !options || correctAnswer === undefined || !difficulty) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const points = difficulty === 'advanced' ? 3 : difficulty === 'intermediate' ? 2 : 1;
      
      const [updatedQuestion] = await db
        .update(evaluationQuestions)
        .set({
          categoryId,
          skillId,
          question,
          questionAr,
          options,
          optionsAr,
          correctAnswer,
          difficulty,
          points
        })
        .where(eq(evaluationQuestions.id, Number(id)))
        .returning();

      if (!updatedQuestion) {
        return res.status(404).json({ message: 'Question not found' });
      }

      res.json(updatedQuestion);
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ message: 'Failed to update question' });
    }
  });

  // Delete a question
  app.delete('/api/admin/questions/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [deletedQuestion] = await db
        .delete(evaluationQuestions)
        .where(eq(evaluationQuestions.id, Number(id)))
        .returning();

      if (!deletedQuestion) {
        return res.status(404).json({ message: 'Question not found' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ message: 'Failed to delete question' });
    }
  });

  // Get dashboard statistics
  app.get('/api/admin/dashboard/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get current date and calculate date ranges
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);
      const startOfLastMonth = startOfMonth(subMonths(now, 1));
      const endOfLastMonth = endOfMonth(subMonths(now, 1));

      // Get total users and new users this month
      const [totalUsers, newUsersThisMonth] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() })
          .from(users)
          .where(
            and(
              gte(users.createdAt, startOfCurrentMonth),
              lte(users.createdAt, endOfCurrentMonth)
            )
          )
      ]);

      // Get total projects and new projects this month
      const [totalProjects, newProjectsThisMonth] = await Promise.all([
        db.select({ count: count() }).from(projects),
        db.select({ count: count() })
          .from(projects)
          .where(
            and(
              gte(projects.createdAt, startOfCurrentMonth),
              lte(projects.createdAt, endOfCurrentMonth)
            )
          )
      ]);

      // Get total categories
      const totalCategories = await db.select({ count: count() }).from(categories);

      // Calculate earnings
      const [currentMonthEarnings, lastMonthEarnings] = await Promise.all([
        db.select({ total: sum(payments.amount) })
          .from(payments)
          .where(
            and(
              gte(payments.createdAt, startOfCurrentMonth),
              lte(payments.createdAt, endOfCurrentMonth)
            )
          ),
        db.select({ total: sum(payments.amount) })
          .from(payments)
          .where(
            and(
              gte(payments.createdAt, startOfLastMonth),
              lte(payments.createdAt, endOfLastMonth)
            )
          )
      ]);

      // Calculate growth percentages
      const userGrowth = totalUsers[0].count > 0 
        ? ((newUsersThisMonth[0].count / totalUsers[0].count) * 100).toFixed(1)
        : 0;
      
      const projectGrowth = totalProjects[0].count > 0
        ? ((newProjectsThisMonth[0].count / totalProjects[0].count) * 100).toFixed(1)
        : 0;

      const currentMonthTotal = Number(currentMonthEarnings[0].total) || 0;
      const lastMonthTotal = Number(lastMonthEarnings[0].total) || 0;
      const earningsGrowth = lastMonthTotal > 0
        ? (((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)
        : 0;

      res.json({
        users: {
          total: totalUsers[0].count,
          newThisMonth: newUsersThisMonth[0].count,
          growth: userGrowth
        },
        projects: {
          total: totalProjects[0].count,
          newThisMonth: newProjectsThisMonth[0].count,
          growth: projectGrowth
        },
        categories: {
          total: totalCategories[0].count
        },
        earnings: {
          currentMonth: currentMonthEarnings[0].total || 0,
          lastMonth: lastMonthEarnings[0].total || 0,
          growth: earningsGrowth
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
  });

  // Get monthly revenue data
  app.get('/api/admin/dashboard/revenue', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { months = 12 } = req.query;
      const startDate = subMonths(new Date(), Number(months) - 1);
      
      const monthlyRevenue = await db
        .select({
          month: sql<string>`to_char(${payments.createdAt}, 'Mon')`,
          revenue: sum(payments.amount)
        })
        .from(payments)
        .where(gte(payments.createdAt, startDate))
        .groupBy(sql`to_char(${payments.createdAt}, 'Mon')`)
        .orderBy(sql`to_char(${payments.createdAt}, 'Mon')`);

      res.json(monthlyRevenue);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      res.status(500).json({ message: 'Failed to fetch revenue data' });
    }
  });

  // Get project status distribution
  app.get('/api/admin/dashboard/project-status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const statusDistribution = await db
        .select({
          status: projects.status,
          count: count()
        })
        .from(projects)
        .groupBy(projects.status);

      res.json(statusDistribution);
    } catch (error) {
      console.error('Error fetching project status:', error);
      res.status(500).json({ message: 'Failed to fetch project status' });
    }
  });

  // Get user registration data
  app.get('/api/admin/dashboard/user-registration', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { weeks = 8 } = req.query;
      const startDate = subMonths(new Date(), 2); // Last 2 months for weekly data
      
      const weeklyRegistrations = await db
        .select({
          week: sql<string>`to_char(${users.createdAt}, 'WW')`,
          users: count()
        })
        .from(users)
        .where(gte(users.createdAt, startDate))
        .groupBy(sql`to_char(${users.createdAt}, 'WW')`)
        .orderBy(sql`to_char(${users.createdAt}, 'WW')`)
        .limit(Number(weeks));

      res.json(weeklyRegistrations);
    } catch (error) {
      console.error('Error fetching user registration data:', error);
      res.status(500).json({ message: 'Failed to fetch user registration data' });
    }
  });

  // Get all pages
  app.get('/api/admin/pages', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allPages = await db.select().from(pages);
      res.json(allPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
      res.status(500).json({ error: 'Failed to fetch pages' });
    }
  });

  // Create a new page
  app.post('/api/admin/pages', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertPageSchema.parse(req.body);
      const [newPage] = await db.insert(pages).values(validatedData).returning();
      res.status(201).json(newPage);
    } catch (error) {
      console.error('Error creating page:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create page' });
      }
    }
  });

  // Update a page
  app.put('/api/admin/pages/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPageSchema.parse(req.body);
      const [updatedPage] = await db
        .update(pages)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(pages.id, parseInt(id)))
        .returning();
      
      if (!updatedPage) {
        return res.status(404).json({ error: 'Page not found' });
      }
      
      res.json(updatedPage);
    } catch (error) {
      console.error('Error updating page:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update page' });
      }
    }
  });

  // Delete a page
  app.delete('/api/admin/pages/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const [deletedPage] = await db
        .delete(pages)
        .where(eq(pages.id, parseInt(id)))
        .returning();
      
      if (!deletedPage) {
        return res.status(404).json({ error: 'Page not found' });
      }
      
      res.json(deletedPage);
    } catch (error) {
      console.error('Error deleting page:', error);
      res.status(500).json({ error: 'Failed to delete page' });
    }
  });

  // Get all badges
  app.get('/api/admin/badges', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allBadges = await db.select().from(badges).orderBy(asc(badges.name));
      res.json(allBadges);
    } catch (error) {
      console.error('Error fetching badges:', error);
      res.status(500).json({ error: 'Failed to fetch badges' });
    }
  });

  // Create a new badge
  app.post('/api/admin/badges', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, description, icon, color, type, planKey, translations } = req.body;
      
      const newBadge = await db.insert(badges).values({
        name,
        description,
        icon,
        color,
        type,
        planKey,
        translations,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      res.status(201).json(newBadge[0]);
    } catch (error) {
      console.error('Error creating badge:', error);
      res.status(500).json({ error: 'Failed to create badge' });
    }
  });

  // Update a badge
  app.put('/api/admin/badges/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, icon, color, translations } = req.body;
      
      const updatedBadge = await db.update(badges).set({
        name,
        description,
        icon,
        color,
        translations,
        updatedAt: new Date()
      }).where(eq(badges.id, parseInt(id))).returning();
      
      if (updatedBadge.length === 0) {
        return res.status(404).json({ error: 'Badge not found' });
      }
      
      res.json(updatedBadge[0]);
    } catch (error) {
      console.error('Error updating badge:', error);
      res.status(500).json({ error: 'Failed to update badge' });
    }
  });

  // Delete a badge
  app.delete('/api/admin/badges/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if badge is assigned to any users
      const assignedBadges = await db.select().from(userBadges).where(eq(userBadges.badgeId, parseInt(id)));
      
      if (assignedBadges.length > 0) {
        return res.status(400).json({ error: 'Cannot delete badge that is assigned to users' });
      }
      
      await db.delete(badges).where(eq(badges.id, parseInt(id)));
      res.json({ message: 'Badge deleted successfully' });
    } catch (error) {
      console.error('Error deleting badge:', error);
      res.status(500).json({ error: 'Failed to delete badge' });
    }
  });

  // Get all freelancers for badge assignment
  app.get('/api/admin/freelancers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const freelancers = await db.select({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        role: users.role
      }).from(users).where(eq(users.role, 'freelancer')).orderBy(asc(users.fullName));
      
      res.json(freelancers);
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      res.status(500).json({ error: 'Failed to fetch freelancers' });
    }
  });

  // Assign badge to user
  app.post('/api/admin/users/:userId/badges', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { badgeId, expiresAt } = req.body;
      
      // Check if user already has this badge
      const existingBadge = await db.select().from(userBadges).where(
        and(
          eq(userBadges.userId, parseInt(userId)),
          eq(userBadges.badgeId, badgeId)
        )
      );
      
      if (existingBadge.length > 0) {
        return res.status(400).json({ error: 'User already has this badge' });
      }
      
      const newUserBadge = await db.insert(userBadges).values({
        userId: parseInt(userId),
        badgeId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        assignedAt: new Date()
      }).returning();
      
      res.status(201).json(newUserBadge[0]);
    } catch (error) {
      console.error('Error assigning badge:', error);
      res.status(500).json({ error: 'Failed to assign badge' });
    }
  });

  // Remove badge from user
  app.delete('/api/admin/users/:userId/badges/:badgeId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId, badgeId } = req.params;
      
      await db.delete(userBadges).where(
        and(
          eq(userBadges.userId, parseInt(userId)),
          eq(userBadges.badgeId, parseInt(badgeId))
        )
      );
      
      res.json({ message: 'Badge removed successfully' });
    } catch (error) {
      console.error('Error removing badge:', error);
      res.status(500).json({ error: 'Failed to remove badge' });
    }
  });

  // Get all testimonials
  app.get('/api/admin/testimonials', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allTestimonials = await db.select().from(testimonials).orderBy(asc(testimonials.order));
      res.json(allTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
  });

  // Create a new testimonial
  app.post('/api/admin/testimonials', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertTestimonialSchema.parse(req.body);
      const [newTestimonial] = await db.insert(testimonials).values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      res.status(201).json(newTestimonial);
    } catch (error) {
      console.error('Error creating testimonial:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create testimonial' });
      }
    }
  });

  // Update a testimonial
  app.put('/api/admin/testimonials/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTestimonialSchema.parse(req.body);
      const [updatedTestimonial] = await db
        .update(testimonials)
        .set({ ...validatedData, updatedAt: new Date() })
        .where(eq(testimonials.id, parseInt(id)))
        .returning();
      
      if (!updatedTestimonial) {
        return res.status(404).json({ error: 'Testimonial not found' });
      }
      
      res.json(updatedTestimonial);
    } catch (error) {
      console.error('Error updating testimonial:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update testimonial' });
      }
    }
  });

  // Delete a testimonial
  app.delete('/api/admin/testimonials/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const [deletedTestimonial] = await db
        .delete(testimonials)
        .where(eq(testimonials.id, parseInt(id)))
        .returning();
      
      if (!deletedTestimonial) {
        return res.status(404).json({ error: 'Testimonial not found' });
      }
      
      res.json(deletedTestimonial);
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      res.status(500).json({ error: 'Failed to delete testimonial' });
    }
  });

  // Toggle testimonial active status
  app.patch('/api/admin/testimonials/:id/toggle', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const [updatedTestimonial] = await db
        .update(testimonials)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(testimonials.id, parseInt(id)))
        .returning();
      
      if (!updatedTestimonial) {
        return res.status(404).json({ error: 'Testimonial not found' });
      }
      
      res.json(updatedTestimonial);
    } catch (error) {
      console.error('Error toggling testimonial status:', error);
      res.status(500).json({ error: 'Failed to toggle testimonial status' });
    }
  });

  // Reorder testimonials
  app.patch('/api/admin/testimonials/:id/reorder', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { direction } = req.body;
      
      const currentTestimonial = await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.id, parseInt(id)))
        .limit(1);
      
      if (!currentTestimonial[0]) {
        return res.status(404).json({ error: 'Testimonial not found' });
      }
      
      const currentOrder = currentTestimonial[0].order;
      let newOrder;
      
      if (direction === 'up' && currentOrder > 0) {
        newOrder = currentOrder - 1;
        // Swap with the testimonial above
        const aboveTestimonial = await db
          .select()
          .from(testimonials)
          .where(eq(testimonials.order, newOrder))
          .limit(1);
        
        if (aboveTestimonial[0]) {
          await db
            .update(testimonials)
            .set({ order: currentOrder, updatedAt: new Date() })
            .where(eq(testimonials.id, aboveTestimonial[0].id));
        }
      } else if (direction === 'down') {
        newOrder = currentOrder + 1;
        // Swap with the testimonial below
        const belowTestimonial = await db
          .select()
          .from(testimonials)
          .where(eq(testimonials.order, newOrder))
          .limit(1);
        
        if (belowTestimonial[0]) {
          await db
            .update(testimonials)
            .set({ order: currentOrder, updatedAt: new Date() })
            .where(eq(testimonials.id, belowTestimonial[0].id));
        }
      } else {
        return res.status(400).json({ error: 'Invalid direction or cannot move further' });
      }
      
      const [updatedTestimonial] = await db
        .update(testimonials)
        .set({ order: newOrder, updatedAt: new Date() })
        .where(eq(testimonials.id, parseInt(id)))
        .returning();
      
      res.json(updatedTestimonial);
    } catch (error) {
      console.error('Error reordering testimonial:', error);
      res.status(500).json({ error: 'Failed to reorder testimonial' });
    }
  });
} 