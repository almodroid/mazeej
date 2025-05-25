import { db } from '../db';
import { evaluationQuestions } from '@shared/schema';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

const questions = [
  // Consulting and Business
  {
    categoryId: 6, // Assuming this is the ID for Consulting and Business
    skillId: 8, // Business Strategy
    question: "What is the primary purpose of a SWOT analysis?",
    options: [
      "To identify internal strengths and weaknesses, and external opportunities and threats",
      "To calculate financial ratios",
      "To determine employee salaries",
      "To create marketing campaigns"
    ],
    correctAnswer: 0,
    difficulty: "intermediate" as DifficultyLevel
  },
  {
    categoryId: 6,
    skillId: 8,
    question: "Which of the following is NOT a key component of a business plan?",
    options: [
      "Executive Summary",
      "Employee Vacation Schedule",
      "Market Analysis",
      "Financial Projections"
    ],
    correctAnswer: 1,
    difficulty: "beginner" as DifficultyLevel
  },

  // Audio and Visual
  {
    categoryId: 5,
    skillId: 7, // Video Production
    question: "What is the rule of thirds in video composition?",
    options: [
      "A rule about audio levels",
      "A composition guideline that divides the frame into nine equal parts",
      "A rule about video length",
      "A rule about camera movement"
    ],
    correctAnswer: 1,
    difficulty: "beginner" as DifficultyLevel
  },
  {
    categoryId: 5,
    skillId: 7,
    question: "Which of these is NOT a standard video resolution?",
    options: [
      "1080p",
      "4K",
      "720p",
      "900p"
    ],
    correctAnswer: 3,
    difficulty: "intermediate" as DifficultyLevel
  },

  // Writing and Translation
  {
    categoryId: 4,
    skillId: 5, // Content Writing
    question: "What is the purpose of a style guide in writing?",
    options: [
      "To limit creativity",
      "To ensure consistency in writing style and formatting",
      "To increase word count",
      "To reduce editing time"
    ],
    correctAnswer: 1,
    difficulty: "beginner" as DifficultyLevel
  },
  {
    categoryId: 4,
    skillId: 6,
    question: "Which of these is NOT a common writing style?",
    options: [
      "APA",
      "MLA",
      "Chicago",
      "NATO"
    ],
    correctAnswer: 3,
    difficulty: "intermediate" as DifficultyLevel
  },

  // Marketing and Sales
  {
    categoryId: 3,
    skillId: 2, // Digital Marketing
    question: "What is the primary goal of SEO?",
    options: [
      "To increase social media followers",
      "To improve website visibility in search engines",
      "To create email campaigns",
      "To design logos"
    ],
    correctAnswer: 1,
    difficulty: "beginner" as DifficultyLevel
  },
  {
    categoryId: 3,
    skillId: 2,
    question: "Which metric is most important for measuring email campaign success?",
    options: [
      "Number of emails sent",
      "Open rate and click-through rate",
      "Email size",
      "Number of recipients"
    ],
    correctAnswer: 1,
    difficulty: "intermediate" as DifficultyLevel
  },

  // Design and Arts
  {
    categoryId: 2,
    skillId: 4, // Graphic Design
    question: "What is the purpose of a color wheel in design?",
    options: [
      "To measure design size",
      "To organize design elements",
      "To show relationships between colors and create harmonious combinations",
      "To calculate design costs"
    ],
    correctAnswer: 2,
    difficulty: "beginner" as DifficultyLevel
  },
  {
    categoryId: 2,
    skillId: 4,
    question: "Which of these is NOT a principle of design?",
    options: [
      "Balance",
      "Contrast",
      "Typography",
      "Alignment"
    ],
    correctAnswer: 2,
    difficulty: "intermediate" as DifficultyLevel
  },

  // Programming and Development
  {
    categoryId: 1,
    skillId: 1, // Web Development
    question: "What is the purpose of CSS?",
    options: [
      "To create database structures",
      "To style and layout web pages",
      "To handle server-side logic",
      "To manage user authentication"
    ],
    correctAnswer: 1,
    difficulty: "beginner" as DifficultyLevel
  },
  {
    categoryId: 1,
    skillId: 3,
    question: "Which of these is NOT a JavaScript framework?",
    options: [
      "React",
      "Angular",
      "Django",
      "Vue"
    ],
    correctAnswer: 2,
    difficulty: "intermediate" as DifficultyLevel
  }
];

async function seedQuestions() {
  try {
    // Insert all questions
    for (const question of questions) {
      await db.insert(evaluationQuestions).values({
        ...question,
        points: question.difficulty === 'advanced' ? 3 : 
                question.difficulty === 'intermediate' ? 2 : 1
      });
    }
    console.log('Successfully seeded evaluation questions');
  } catch (error) {
    console.error('Error seeding questions:', error);
  }
}

seedQuestions();
