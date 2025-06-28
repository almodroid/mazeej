import express from 'express';
import { db } from '../db';
import { 
  exercises, 
  exerciseCategories, 
  exerciseSubmissions, 
  exerciseProgress,
  aiExerciseSettings,
  skills,
  categories,
  users
} from '@shared/schema';
import { eq, and, desc, asc, like, inArray } from 'drizzle-orm';
import { aiExerciseService } from '../services/ai-exercise-service';
import { isAuthenticated, isAdmin } from './auth';

const router = express.Router();

// ===== ADMIN ROUTES =====

// Get all exercise categories
router.get('/admin/categories', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(exerciseCategories)
      .orderBy(asc(exerciseCategories.order), asc(exerciseCategories.name));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching exercise categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create exercise category
router.post('/admin/categories', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, nameAr, description, descriptionAr, icon, color, order } = req.body;

    const [category] = await db.insert(exerciseCategories).values({
      name,
      nameAr,
      description,
      descriptionAr,
      icon,
      color: color || '#3B82F6',
      order: order || 0,
      isActive: true,
      createdAt: new Date(),
    }).returning();

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating exercise category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update exercise category
router.put('/admin/categories/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameAr, description, descriptionAr, icon, color, order, isActive } = req.body;

    const [category] = await db
      .update(exerciseCategories)
      .set({
        name,
        nameAr,
        description,
        descriptionAr,
        icon,
        color,
        order,
        isActive,
      })
      .where(eq(exerciseCategories.id, parseInt(id)))
      .returning();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating exercise category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete exercise category
router.delete('/admin/categories/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has exercises
    const exercisesCount = await db
      .select({ count: exercises.id })
      .from(exercises)
      .where(eq(exercises.categoryId, parseInt(id)))
      .limit(1);

    if (exercisesCount.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing exercises' });
    }

    await db.delete(exerciseCategories).where(eq(exerciseCategories.id, parseInt(id)));

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get all exercises with filters
router.get('/admin/exercises', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { 
      categoryId, 
      skillId, 
      difficulty, 
      isActive, 
      aiGenerated,
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const whereConditions = [];
    
    if (categoryId) whereConditions.push(eq(exercises.categoryId, parseInt(categoryId as string)));
    if (skillId) whereConditions.push(eq(exercises.skillId, parseInt(skillId as string)));
    if (difficulty) whereConditions.push(eq(exercises.difficulty, difficulty as 'beginner' | 'intermediate' | 'advanced'));
    if (isActive !== undefined) whereConditions.push(eq(exercises.isActive, isActive === 'true'));
    if (aiGenerated !== undefined) whereConditions.push(eq(exercises.aiGenerated, aiGenerated === 'true'));

    const exercisesList = await db
      .select({
        id: exercises.id,
        title: exercises.title,
        titleAr: exercises.titleAr,
        description: exercises.description,
        categoryId: exercises.categoryId,
        skillId: exercises.skillId,
        difficulty: exercises.difficulty,
        estimatedHours: exercises.estimatedHours,
        budget: exercises.budget,
        aiGenerated: exercises.aiGenerated,
        isActive: exercises.isActive,
        order: exercises.order,
        createdAt: exercises.createdAt,
        category: {
          id: exerciseCategories.id,
          name: exerciseCategories.name,
          nameAr: exerciseCategories.nameAr,
        },
        skill: {
          id: skills.id,
          name: skills.name,
        },
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .leftJoin(skills, eq(exercises.skillId, skills.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(exercises.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);

    const total = await db
      .select({ count: exercises.id })
      .from(exercises)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    res.json({
      exercises: exercisesList,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: total.length,
        pages: Math.ceil(total.length / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Create exercise
router.post('/admin/exercises', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const {
      title,
      titleAr,
      description,
      descriptionAr,
      categoryId,
      skillId,
      difficulty,
      estimatedHours,
      budget,
      requirements,
      requirementsAr,
      deliverables,
      deliverablesAr,
      order,
    } = req.body;

    const [exercise] = await db.insert(exercises).values({
      title,
      titleAr,
      description,
      descriptionAr,
      categoryId,
      skillId,
      difficulty,
      estimatedHours,
      budget,
      requirements,
      requirementsAr,
      deliverables,
      deliverablesAr,
      aiGenerated: false,
      isActive: true,
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    res.status(201).json(exercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// Update exercise
router.put('/admin/exercises/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      titleAr,
      description,
      descriptionAr,
      categoryId,
      skillId,
      difficulty,
      estimatedHours,
      budget,
      requirements,
      requirementsAr,
      deliverables,
      deliverablesAr,
      isActive,
      order,
    } = req.body;

    const [exercise] = await db
      .update(exercises)
      .set({
        title,
        titleAr,
        description,
        descriptionAr,
        categoryId,
        skillId,
        difficulty,
        estimatedHours,
        budget,
        requirements,
        requirementsAr,
        deliverables,
        deliverablesAr,
        isActive,
        order,
        updatedAt: new Date(),
      })
      .where(eq(exercises.id, parseInt(id)))
      .returning();

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
});

// Delete exercise
router.delete('/admin/exercises/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if exercise has submissions
    const submissionsCount = await db
      .select({ count: exerciseSubmissions.id })
      .from(exerciseSubmissions)
      .where(eq(exerciseSubmissions.exerciseId, parseInt(id)))
      .limit(1);

    if (submissionsCount.length > 0) {
      return res.status(400).json({ error: 'Cannot delete exercise with existing submissions' });
    }

    await db.delete(exercises).where(eq(exercises.id, parseInt(id)));

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

// Generate exercise with AI
router.post('/admin/exercises/generate', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { skillId, categoryId, difficulty, freelancerLevel, count = 1 } = req.body;

    if (!skillId || !categoryId || !difficulty) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const exercises = await aiExerciseService.generateMultipleExercises(
      { skillId, categoryId, difficulty, freelancerLevel },
      count
    );

    res.json({ exercises, message: `Generated ${exercises.length} exercise(s)` });
  } catch (error) {
    console.error('Error generating exercises:', error);
    res.status(500).json({ error: 'Failed to generate exercises' });
  }
});

// Get AI settings
router.get('/admin/ai-settings', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [settings] = await db
      .select()
      .from(aiExerciseSettings)
      .where(eq(aiExerciseSettings.isActive, true))
      .limit(1);

    res.json(settings || {});
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    res.status(500).json({ error: 'Failed to fetch AI settings' });
  }
});

// Update AI settings
router.put('/admin/ai-settings', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const {
      apiKey,
      apiProvider,
      modelName,
      maxTokens,
      temperature,
      systemPrompt,
      isActive,
    } = req.body;

    // Check if settings exist
    const [existingSettings] = await db
      .select()
      .from(aiExerciseSettings)
      .limit(1);

    let settings;
    if (existingSettings) {
      [settings] = await db
        .update(aiExerciseSettings)
        .set({
          apiKey,
          apiProvider,
          modelName,
          maxTokens,
          temperature,
          systemPrompt,
          isActive,
          updatedAt: new Date(),
        })
        .returning();
    } else {
      [settings] = await db.insert(aiExerciseSettings).values({
        apiKey,
        apiProvider,
        modelName,
        maxTokens,
        temperature,
        systemPrompt,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error updating AI settings:', error);
    res.status(500).json({ error: 'Failed to update AI settings' });
  }
});

// Get exercise submissions
router.get('/admin/submissions', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { status, exerciseId, freelancerId, page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const whereConditions = [];
    
    if (status) whereConditions.push(eq(exerciseSubmissions.status, status as 'in_progress' | 'submitted' | 'approved' | 'rejected'));
    if (exerciseId) whereConditions.push(eq(exerciseSubmissions.exerciseId, parseInt(exerciseId as string)));
    if (freelancerId) whereConditions.push(eq(exerciseSubmissions.freelancerId, parseInt(freelancerId as string)));

    const submissions = await db
      .select({
        id: exerciseSubmissions.id,
        status: exerciseSubmissions.status,
        submissionText: exerciseSubmissions.submissionText,
        submissionFiles: exerciseSubmissions.submissionFiles,
        aiFeedback: exerciseSubmissions.aiFeedback,
        aiScore: exerciseSubmissions.aiScore,
        adminFeedback: exerciseSubmissions.adminFeedback,
        adminScore: exerciseSubmissions.adminScore,
        startedAt: exerciseSubmissions.startedAt,
        submittedAt: exerciseSubmissions.submittedAt,
        reviewedAt: exerciseSubmissions.reviewedAt,
        exercise: {
          id: exercises.id,
          title: exercises.title,
          titleAr: exercises.titleAr,
          difficulty: exercises.difficulty,
        },
        freelancer: {
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          profileImage: users.profileImage,
        },
      })
      .from(exerciseSubmissions)
      .leftJoin(exercises, eq(exerciseSubmissions.exerciseId, exercises.id))
      .leftJoin(users, eq(exerciseSubmissions.freelancerId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(exerciseSubmissions.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);

    const total = await db
      .select({ count: exerciseSubmissions.id })
      .from(exerciseSubmissions)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    res.json({
      submissions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: total.length,
        pages: Math.ceil(total.length / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Review submission
router.put('/admin/submissions/:id/review', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminFeedback, adminScore, status } = req.body;

    const [submission] = await db
      .update(exerciseSubmissions)
      .set({
        adminFeedback,
        adminScore,
        status,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(exerciseSubmissions.id, parseInt(id)))
      .returning();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ error: 'Failed to review submission' });
  }
});

// ===== PUBLIC ROUTES =====

// Get active exercise categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(exerciseCategories)
      .where(eq(exerciseCategories.isActive, true))
      .orderBy(asc(exerciseCategories.order), asc(exerciseCategories.name));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching exercise categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get exercises for freelancers
router.get('/exercises', isAuthenticated, async (req, res) => {
  try {
    const { 
      categoryId, 
      skillId, 
      difficulty, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const whereConditions = [eq(exercises.isActive, true)];
    
    if (categoryId) whereConditions.push(eq(exercises.categoryId, parseInt(categoryId as string)));
    if (skillId) whereConditions.push(eq(exercises.skillId, parseInt(skillId as string)));
    if (difficulty) whereConditions.push(eq(exercises.difficulty, difficulty as 'beginner' | 'intermediate' | 'advanced'));

    const exercisesList = await db
      .select({
        id: exercises.id,
        title: exercises.title,
        titleAr: exercises.titleAr,
        description: exercises.description,
        descriptionAr: exercises.descriptionAr,
        categoryId: exercises.categoryId,
        skillId: exercises.skillId,
        difficulty: exercises.difficulty,
        estimatedHours: exercises.estimatedHours,
        budget: exercises.budget,
        requirements: exercises.requirements,
        requirementsAr: exercises.requirementsAr,
        deliverables: exercises.deliverables,
        deliverablesAr: exercises.deliverablesAr,
        createdAt: exercises.createdAt,
        category: {
          id: exerciseCategories.id,
          name: exerciseCategories.name,
          nameAr: exerciseCategories.nameAr,
        },
        skill: {
          id: skills.id,
          name: skills.name,
        },
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .leftJoin(skills, eq(exercises.skillId, skills.id))
      .where(and(...whereConditions))
      .orderBy(asc(exercises.order), desc(exercises.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);

    const total = await db
      .select({ count: exercises.id })
      .from(exercises)
      .where(and(...whereConditions));

    res.json({
      exercises: exercisesList,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: total.length,
        pages: Math.ceil(total.length / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get exercise details
router.get('/exercises/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const [exercise] = await db
      .select({
        id: exercises.id,
        title: exercises.title,
        titleAr: exercises.titleAr,
        description: exercises.description,
        descriptionAr: exercises.descriptionAr,
        categoryId: exercises.categoryId,
        skillId: exercises.skillId,
        difficulty: exercises.difficulty,
        estimatedHours: exercises.estimatedHours,
        budget: exercises.budget,
        requirements: exercises.requirements,
        requirementsAr: exercises.requirementsAr,
        deliverables: exercises.deliverables,
        deliverablesAr: exercises.deliverablesAr,
        createdAt: exercises.createdAt,
        category: {
          id: exerciseCategories.id,
          name: exerciseCategories.name,
          nameAr: exerciseCategories.nameAr,
        },
        skill: {
          id: skills.id,
          name: skills.name,
        },
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .leftJoin(skills, eq(exercises.skillId, skills.id))
      .where(and(eq(exercises.id, parseInt(id)), eq(exercises.isActive, true)))
      .limit(1);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// Start exercise
router.post('/exercises/:id/start', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if exercise exists and is active
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(and(eq(exercises.id, parseInt(id)), eq(exercises.isActive, true)))
      .limit(1);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Check if user already has a submission for this exercise
    const [existingSubmission] = await db
      .select()
      .from(exerciseSubmissions)
      .where(and(
        eq(exerciseSubmissions.exerciseId, parseInt(id)),
        eq(exerciseSubmissions.freelancerId, userId)
      ))
      .limit(1);

    if (existingSubmission) {
      return res.json(existingSubmission);
    }

    // Create new submission
    const [submission] = await db.insert(exerciseSubmissions).values({
      exerciseId: parseInt(id),
      freelancerId: userId,
      status: 'in_progress',
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error starting exercise:', error);
    res.status(500).json({ error: 'Failed to start exercise' });
  }
});

// Submit exercise
router.put('/exercises/:id/submit', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionText, submissionFiles } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [submission] = await db
      .update(exerciseSubmissions)
      .set({
        submissionText,
        submissionFiles,
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(exerciseSubmissions.exerciseId, parseInt(id)),
        eq(exerciseSubmissions.freelancerId, userId)
      ))
      .returning();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error submitting exercise:', error);
    res.status(500).json({ error: 'Failed to submit exercise' });
  }
});

// Get user's exercise submissions
router.get('/submissions', isAuthenticated, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const whereConditions = [eq(exerciseSubmissions.freelancerId, userId)];
    
    if (status) whereConditions.push(eq(exerciseSubmissions.status, status as 'in_progress' | 'submitted' | 'approved' | 'rejected'));

    const submissions = await db
      .select({
        id: exerciseSubmissions.id,
        status: exerciseSubmissions.status,
        submissionText: exerciseSubmissions.submissionText,
        submissionFiles: exerciseSubmissions.submissionFiles,
        aiFeedback: exerciseSubmissions.aiFeedback,
        aiScore: exerciseSubmissions.aiScore,
        adminFeedback: exerciseSubmissions.adminFeedback,
        adminScore: exerciseSubmissions.adminScore,
        startedAt: exerciseSubmissions.startedAt,
        submittedAt: exerciseSubmissions.submittedAt,
        reviewedAt: exerciseSubmissions.reviewedAt,
        exercise: {
          id: exercises.id,
          title: exercises.title,
          titleAr: exercises.titleAr,
          difficulty: exercises.difficulty,
        },
      })
      .from(exerciseSubmissions)
      .leftJoin(exercises, eq(exerciseSubmissions.exerciseId, exercises.id))
      .where(and(...whereConditions))
      .orderBy(desc(exerciseSubmissions.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);

    const total = await db
      .select({ count: exerciseSubmissions.id })
      .from(exerciseSubmissions)
      .where(and(...whereConditions));

    res.json({
      submissions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: total.length,
        pages: Math.ceil(total.length / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get user's exercise progress
router.get('/progress', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const progress = await db
      .select({
        id: exerciseProgress.id,
        skillId: exerciseProgress.skillId,
        exercisesCompleted: exerciseProgress.exercisesCompleted,
        totalScore: exerciseProgress.totalScore,
        averageScore: exerciseProgress.averageScore,
        currentLevel: exerciseProgress.currentLevel,
        lastExerciseAt: exerciseProgress.lastExerciseAt,
        skill: {
          id: skills.id,
          name: skills.name,
        },
      })
      .from(exerciseProgress)
      .leftJoin(skills, eq(exerciseProgress.skillId, skills.id))
      .where(eq(exerciseProgress.freelancerId, userId))
      .orderBy(desc(exerciseProgress.lastExerciseAt));

    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router; 