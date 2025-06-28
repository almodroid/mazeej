import { db } from '../db';
import { aiExerciseSettings, exercises, skills, categories } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface GenerateExerciseParams {
  skillId: number;
  categoryId: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  freelancerLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface GeneratedExercise {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  requirements: string[];
  requirementsAr: string[];
  deliverables: string[];
  deliverablesAr: string[];
  estimatedHours: number;
  budget: number;
}

export class AIExerciseService {
  private async getAISettings() {
    const [settings] = await db
      .select()
      .from(aiExerciseSettings)
      .where(eq(aiExerciseSettings.isActive, true))
      .limit(1);

    if (!settings) {
      throw new Error('AI exercise settings not configured');
    }

    return settings;
  }

  private async generateWithOpenAI(prompt: string, settings: any): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.modelName,
          messages: [
            {
              role: 'system',
              content: settings.systemPrompt,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: settings.maxTokens,
          temperature: parseFloat(settings.temperature.toString()),
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to generate exercise with AI');
    }
  }

  private async generateWithAnthropic(prompt: string, settings: any): Promise<string> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.modelName,
          max_tokens: settings.maxTokens,
          messages: [
            {
              role: 'user',
              content: `${settings.systemPrompt}\n\n${prompt}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0]?.text || '';
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw new Error('Failed to generate exercise with AI');
    }
  }

  private async generateWithOpenRouter(prompt: string, settings: any): Promise<string> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
          'HTTP-Referer': 'https://mazeej.com', // Replace with your actual domain
          'X-Title': 'Mazeej Exercise Generator', // Replace with your app name
        },
        body: JSON.stringify({
          model: settings.modelName,
          messages: [
            {
              role: 'system',
              content: settings.systemPrompt,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: settings.maxTokens,
          temperature: parseFloat(settings.temperature.toString()),
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw new Error('Failed to generate exercise with AI');
    }
  }

  private async generateExerciseContent(params: GenerateExerciseParams): Promise<string> {
    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, params.skillId))
      .limit(1);

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, params.categoryId))
      .limit(1);

    if (!skill || !category) {
      throw new Error('Skill or category not found');
    }

    const prompt = `
Generate a realistic freelance project exercise for skill development.

Skill: ${skill.name} (${skill.nameAr || skill.name})
Category: ${category.name} (${category.nameAr || category.name})
Difficulty Level: ${params.difficulty}
Freelancer Level: ${params.freelancerLevel || 'beginner'}

Please generate a complete project brief in the following JSON format:
{
  "title": "Project title in English",
  "titleAr": "Project title in Arabic",
  "description": "Detailed project description in English",
  "descriptionAr": "Detailed project description in Arabic",
  "requirements": ["requirement 1", "requirement 2", "requirement 3"],
  "requirementsAr": ["requirement 1 in Arabic", "requirement 2 in Arabic", "requirement 3 in Arabic"],
  "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"],
  "deliverablesAr": ["deliverable 1 in Arabic", "deliverable 2 in Arabic", "deliverable 3 in Arabic"],
  "estimatedHours": 4,
  "budget": 150
}

Make the project realistic and appropriate for the skill level. The budget should be reasonable for the difficulty level and estimated hours.
`;

    const settings = await this.getAISettings();

    let aiResponse: string;
    if (settings.apiProvider === 'anthropic') {
      aiResponse = await this.generateWithAnthropic(prompt, settings);
    } else if (settings.apiProvider === 'openrouter') {
      aiResponse = await this.generateWithOpenRouter(prompt, settings);
    } else {
      aiResponse = await this.generateWithOpenAI(prompt, settings);
    }

    return aiResponse;
  }

  private parseAIResponse(response: string): GeneratedExercise {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        title: parsed.title || 'Generated Exercise',
        titleAr: parsed.titleAr || parsed.title || 'تمرين مُنشأ',
        description: parsed.description || 'Generated exercise description',
        descriptionAr: parsed.descriptionAr || parsed.description || 'وصف التمرين المُنشأ',
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        requirementsAr: Array.isArray(parsed.requirementsAr) ? parsed.requirementsAr : [],
        deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
        deliverablesAr: Array.isArray(parsed.deliverablesAr) ? parsed.deliverablesAr : [],
        estimatedHours: parsed.estimatedHours || 2,
        budget: parsed.budget || 50,
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return a fallback exercise
      return {
        title: 'Generated Exercise',
        titleAr: 'تمرين مُنشأ',
        description: 'This is a generated exercise for skill development.',
        descriptionAr: 'هذا تمرين مُنشأ لتطوير المهارات.',
        requirements: ['Complete the project requirements', 'Follow best practices', 'Submit on time'],
        requirementsAr: ['إكمال متطلبات المشروع', 'اتباع أفضل الممارسات', 'التسليم في الوقت المحدد'],
        deliverables: ['Source code', 'Documentation', 'Demo'],
        deliverablesAr: ['الكود المصدري', 'التوثيق', 'عرض توضيحي'],
        estimatedHours: 2,
        budget: 50,
      };
    }
  }

  async generateExercise(params: GenerateExerciseParams): Promise<GeneratedExercise> {
    try {
      const aiResponse = await this.generateExerciseContent(params);
      const exercise = this.parseAIResponse(aiResponse);
      
      // Save the generated exercise to the database
      const [savedExercise] = await db.insert(exercises).values({
        title: exercise.title,
        titleAr: exercise.titleAr,
        description: exercise.description,
        descriptionAr: exercise.descriptionAr,
        categoryId: params.categoryId,
        skillId: params.skillId,
        difficulty: params.difficulty,
        estimatedHours: exercise.estimatedHours,
        budget: exercise.budget,
        requirements: exercise.requirements,
        requirementsAr: exercise.requirementsAr,
        deliverables: exercise.deliverables,
        deliverablesAr: exercise.deliverablesAr,
        aiGenerated: true,
        aiPrompt: `Generated for skill: ${params.skillId}, category: ${params.categoryId}, difficulty: ${params.difficulty}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log('Generated exercise saved with ID:', savedExercise.id);
      
      return exercise;
    } catch (error) {
      console.error('Error generating exercise:', error);
      throw error;
    }
  }

  async generateMultipleExercises(
    params: GenerateExerciseParams,
    count: number = 1
  ): Promise<GeneratedExercise[]> {
    const exercises: GeneratedExercise[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const exercise = await this.generateExercise(params);
        exercises.push(exercise);
        
        // Add a small delay between requests to avoid rate limiting
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error generating exercise ${i + 1}:`, error);
        // Continue with other exercises even if one fails
      }
    }
    
    return exercises;
  }
}

export const aiExerciseService = new AIExerciseService(); 