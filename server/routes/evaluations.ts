import { Express, Request } from 'express';
import { db } from '../db';
import { evaluationQuestions, evaluationResults, users } from '@shared/schema';
import { and, eq, inArray, desc } from 'drizzle-orm';
import { isAuthenticated } from './auth';

export function registerEvaluationRoutes(app: Express) {
  // Get evaluation questions
  app.get('/api/evaluation/questions', isAuthenticated, async (req, res) => {
    try {
      const { categoryIds, skillIds } = req.query;
      
      if (!categoryIds || !skillIds) {
        return res.status(400).json({ message: 'Category IDs and Skill IDs are required' });
      }

      // Convert query params to arrays of numbers
      const categoryIdsArray = (categoryIds as string).split(',').map(Number);
      const skillIdsArray = (skillIds as string).split(',').map(Number);
      
      // Get questions from database based on categories and skills
      const questions = await db
        .select()
        .from(evaluationQuestions)
        .where(
          and(
            inArray(evaluationQuestions.categoryId, categoryIdsArray),
            inArray(evaluationQuestions.skillId, skillIdsArray)
          )
        );
      
      // Randomize questions
      const randomizedQuestions = questions
        .sort(() => Math.random() - 0.5)
        .slice(0, 10); // Limit to 10 questions
      
      res.json(randomizedQuestions);
    } catch (error) {
      console.error('Error fetching evaluation questions:', error);
      res.status(500).json({ message: 'Failed to fetch evaluation questions' });
    }
  });

  // Submit evaluation results
  app.post('/api/evaluation/submit', isAuthenticated, async (req, res) => {
    try {
      const { userId, categoryId, skillId, answers } = req.body;
      
      if (!userId || !categoryId || !skillId || !answers) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Calculate score
      const questions = await db
        .select()
        .from(evaluationQuestions)
        .where(
          and(
            eq(evaluationQuestions.categoryId, categoryId),
            eq(evaluationQuestions.skillId, skillId)
          )
        );
      
      let correctAnswers = 0;
      answers.forEach((answer: { questionId: number; selectedAnswer: number }) => {
        const question = questions.find(q => q.id === answer.questionId);
        if (question && question.correctAnswer === answer.selectedAnswer) {
          correctAnswers++;
        }
      });
      
      const score = (correctAnswers / questions.length) * 100;

      // Determine level based on score
      let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
      if (score >= 80) {
        level = 'advanced';
      } else if (score >= 60) {
        level = 'intermediate';
      }

      // Save results
      await db.insert(evaluationResults).values({
        freelancerId: userId,
        categoryId,
        skillId,
        score,
        level
      });

      // Update user's level
      await db
        .update(users)
        .set({ freelancerLevel: level })
        .where(eq(users.id, userId));
      
      res.json({ score, level });
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      res.status(500).json({ error: 'Failed to submit evaluation' });
    }
  });

  // Get evaluation history for a freelancer
  app.get('/api/evaluation/history', isAuthenticated, async (req, res) => {
    try {
      const results = await db
        .select()
        .from(evaluationResults)
        .where(eq(evaluationResults.freelancerId, (req as Request & { user: { id: number } }).user.id))
        .orderBy(desc(evaluationResults.completedAt));

      res.json(results);
    } catch (error) {
      console.error('Error fetching evaluation history:', error);
      res.status(500).json({ message: 'Failed to fetch evaluation history' });
    }
  });
}
