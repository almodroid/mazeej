import { apiRequest } from "@/lib/queryClient";

export interface EvaluationQuestion {
  id: number;
  categoryId: number;
  skillId: number;
  question: string;
  questionAr?: string;
  options: string[];
  optionsAr?: string[];
  correctAnswer: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const evaluationService = {
  async getQuestions(categoryIds: number[], skillIds: number[]): Promise<EvaluationQuestion[]> {
    const queryParams = new URLSearchParams({
      categoryIds: categoryIds.join(','),
      skillIds: skillIds.join(',')
    });
    
    const response = await apiRequest('GET', `/api/evaluation/questions?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch evaluation questions');
    }
    return response.json();
  },

  async submitEvaluation(userId: number, results: {
    categoryId: number;
    skillId: number;
    answers: { questionId: number; selectedAnswer: number }[];
  }): Promise<{ score: number; level: string }> {
    const response = await apiRequest('POST', '/api/evaluation/submit', {
      ...results,
      userId
    });
    if (!response.ok) {
      throw new Error('Failed to submit evaluation');
    }
    return response.json();
  }
}; 