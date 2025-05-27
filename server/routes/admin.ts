import { Express } from 'express';
import { db } from '../db';
import { evaluationQuestions, users, projects, categories, payments, pages, insertPageSchema } from '@shared/schema';
import { and, eq, sql, count, sum, desc, gte, lte } from 'drizzle-orm';
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
} 