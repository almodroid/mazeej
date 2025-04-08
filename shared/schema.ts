import { pgTable, text, serial, integer, boolean, pgEnum, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export const userRoleEnum = pgEnum('user_role', ['client', 'freelancer', 'admin']);

// Freelancer level enum
export const freelancerLevelEnum = pgEnum('freelancer_level', ['beginner', 'intermediate', 'advanced']);

// Freelancer type enum
export const freelancerTypeEnum = pgEnum('freelancer_type', ['content_creator', 'expert']);

// Project status enum
export const projectStatusEnum = pgEnum('project_status', ['open', 'in_progress', 'completed', 'cancelled']);

// Proposal status enum
export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'accepted', 'rejected']);

// Verification status enum
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);

// Assessment status enum
export const assessmentStatusEnum = pgEnum('assessment_status', ['in_progress', 'completed', 'failed']);

// Assessment type enum
export const assessmentTypeEnum = pgEnum('assessment_type', ['multiple_choice', 'coding', 'text_response']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  role: userRoleEnum("role").notNull().default('client'),
  country: text("country"),
  city: text("city"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  freelancerLevel: freelancerLevelEnum("freelancer_level"),
  freelancerType: freelancerTypeEnum("freelancer_type"),
  hourlyRate: integer("hourly_rate"),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  freelancerCount: integer("freelancer_count").default(0),
});

// Skills table
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull(),
});

// User Skills table (Many to Many)
export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skillId: integer("skill_id").notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  clientId: integer("client_id").notNull(),
  budget: integer("budget").notNull(),
  status: projectStatusEnum("status").default('open'),
  category: integer("category_id").notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Skills table (Many to Many)
export const projectSkills = pgTable("project_skills", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  skillId: integer("skill_id").notNull(),
});

// Proposals table
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  freelancerId: integer("freelancer_id").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  deliveryTime: integer("delivery_time").notNull(), // In days
  status: proposalStatusEnum("status").default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  reviewerId: integer("reviewer_id").notNull(),
  revieweeId: integer("reviewee_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  clientId: integer("client_id").notNull(),
  freelancerId: integer("freelancer_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  transactionId: text("transaction_id"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notificationTypes = pgEnum('notification_type', [
  'message', 'proposal', 'project_update', 'payment', 'review', 'admin', 'verification',
  'verification_request', 'verification_update', 'admin_alert'
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: notificationTypes("type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Verification Requests table
export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),  // ID, passport, certificate, etc.
  documentUrl: text("document_url").notNull(),
  additionalInfo: text("additional_info"),
  status: verificationStatusEnum("status").default('pending'),
  reviewerId: integer("reviewer_id").references(() => users.id),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// Skill Assessments table
export const skillAssessments = pgTable("skill_assessments", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  durationMinutes: integer("duration_minutes").notNull(),
  passingScore: integer("passing_score").notNull(), // percentage 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  isActive: boolean("is_active").default(true),
  aiModel: text("ai_model").notNull(), // AI model used for assessment
});

// Assessment Questions table
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => skillAssessments.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  type: assessmentTypeEnum("type").notNull(),
  options: jsonb("options"), // For multiple choice questions - array of option objects
  correctAnswer: text("correct_answer"), // For multiple choice or text response
  scoreWeight: integer("score_weight").default(1), // Weight of this question in scoring
  codeTemplate: text("code_template"), // For coding questions - starter code
  testCases: jsonb("test_cases"), // For coding questions - test cases to run
  evaluationCriteria: jsonb("evaluation_criteria"), // For AI evaluation
  aiPrompt: text("ai_prompt"), // Prompt to send to AI for evaluation
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Assessment Attempts table
export const userAssessments = pgTable("user_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assessmentId: integer("assessment_id").notNull().references(() => skillAssessments.id, { onDelete: "cascade" }),
  status: assessmentStatusEnum("status").default('in_progress'),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  score: integer("score"), // Final percentage score 0-100
  timeSpentSeconds: integer("time_spent_seconds"), 
  aiEvaluation: jsonb("ai_evaluation"), // AI-generated evaluation of performance
  skillLevel: text("skill_level"), // Awarded skill level (beginner, intermediate, advanced)
  certificateUrl: text("certificate_url"), // URL to certificate if passed
});

// User Question Responses table
export const userResponses = pgTable("user_responses", {
  id: serial("id").primaryKey(),
  userAssessmentId: integer("user_assessment_id").notNull().references(() => userAssessments.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => assessmentQuestions.id, { onDelete: "cascade" }),
  response: text("response").notNull(), // User's response to the question
  isCorrect: boolean("is_correct"), // Whether the response was correct
  score: integer("score"), // Score for this response (considering weight)
  aiEvaluation: text("ai_evaluation"), // AI evaluation of response
  feedback: text("feedback"), // Feedback on response
  responseTime: integer("response_time"), // Time taken to respond in seconds
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, isVerified: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, status: true, clientId: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, status: true, freelancerId: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, reviewerId: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, uploadedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, isRead: true, senderId: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });
export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  submittedAt: true,
  status: true,
  reviewerId: true,
  reviewNotes: true,
  reviewedAt: true
});

export const insertSkillAssessmentSchema = createInsertSchema(skillAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true
});

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  id: true,
  createdAt: true
});

export const insertUserAssessmentSchema = createInsertSchema(userAssessments).omit({
  id: true,
  status: true,
  startedAt: true,
  completedAt: true,
  score: true,
  timeSpentSeconds: true,
  aiEvaluation: true,
  skillLevel: true,
  certificateUrl: true
});

export const insertUserResponseSchema = createInsertSchema(userResponses).omit({
  id: true,
  isCorrect: true,
  score: true,
  aiEvaluation: true,
  feedback: true,
  submittedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = Pick<InsertUser, "username" | "password">;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Payment = typeof payments.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;

export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertSkillAssessment = z.infer<typeof insertSkillAssessmentSchema>;

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;

export type UserAssessment = typeof userAssessments.$inferSelect;
export type InsertUserAssessment = z.infer<typeof insertUserAssessmentSchema>;

export type UserResponse = typeof userResponses.$inferSelect;
export type InsertUserResponse = z.infer<typeof insertUserResponseSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects, { relationName: "user_projects" }),
  skills: many(userSkills, { relationName: "user_skills" }),
  sentMessages: many(messages, { relationName: "user_sent_messages" }),
  receivedMessages: many(messages, { relationName: "user_received_messages" }),
  proposals: many(proposals, { relationName: "user_proposals" }),
  reviews: many(reviews, { relationName: "user_reviews" }),
  files: many(files, { relationName: "user_files" }),
  notifications: many(notifications),
  verificationRequests: many(verificationRequests, { relationName: "user_verification_requests" }),
  reviewedVerifications: many(verificationRequests, { relationName: "reviewer_verification_requests" }),
  assessments: many(userAssessments, { relationName: "user_assessments" }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  skills: many(skills, { relationName: "category_skills" }),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  category: one(categories, { relationName: "category_skills", fields: [skills.categoryId], references: [categories.id] }),
  users: many(userSkills, { relationName: "skill_users" }),
  projects: many(projectSkills, { relationName: "skill_projects" }),
  assessments: many(skillAssessments, { relationName: "skill_assessments" }),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, { relationName: "user_skills", fields: [userSkills.userId], references: [users.id] }),
  skill: one(skills, { relationName: "skill_users", fields: [userSkills.skillId], references: [skills.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(users, { relationName: "user_projects", fields: [projects.clientId], references: [users.id] }),
  skills: many(projectSkills, { relationName: "project_skills" }),
  proposals: many(proposals, { relationName: "project_proposals" }),
  reviews: many(reviews, { relationName: "project_reviews" }),
  files: many(files, { relationName: "project_files" }),
  payments: many(payments, { relationName: "project_payments" }),
}));

export const projectSkillsRelations = relations(projectSkills, ({ one }) => ({
  project: one(projects, { relationName: "project_skills", fields: [projectSkills.projectId], references: [projects.id] }),
  skill: one(skills, { relationName: "skill_projects", fields: [projectSkills.skillId], references: [skills.id] }),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  project: one(projects, { relationName: "project_proposals", fields: [proposals.projectId], references: [projects.id] }),
  freelancer: one(users, { relationName: "user_proposals", fields: [proposals.freelancerId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { relationName: "user_sent_messages", fields: [messages.senderId], references: [users.id] }),
  receiver: one(users, { relationName: "user_received_messages", fields: [messages.receiverId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, { relationName: "project_reviews", fields: [reviews.projectId], references: [projects.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id] }),
  reviewee: one(users, { relationName: "user_reviews", fields: [reviews.revieweeId], references: [users.id] }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  user: one(users, { relationName: "user_files", fields: [files.userId], references: [users.id] }),
  project: one(projects, { relationName: "project_files", fields: [files.projectId], references: [projects.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  project: one(projects, { relationName: "project_payments", fields: [payments.projectId], references: [projects.id] }),
  client: one(users, { fields: [payments.clientId], references: [users.id] }),
  freelancer: one(users, { fields: [payments.freelancerId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  user: one(users, {
    relationName: "user_verification_requests",
    fields: [verificationRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    relationName: "reviewer_verification_requests",
    fields: [verificationRequests.reviewerId],
    references: [users.id],
  }),
}));

export const skillAssessmentsRelations = relations(skillAssessments, ({ one, many }) => ({
  skill: one(skills, { relationName: "skill_assessments", fields: [skillAssessments.skillId], references: [skills.id] }),
  questions: many(assessmentQuestions, { relationName: "assessment_questions" }),
  userAttempts: many(userAssessments, { relationName: "assessment_attempts" }),
}));

export const assessmentQuestionsRelations = relations(assessmentQuestions, ({ one, many }) => ({
  assessment: one(skillAssessments, { relationName: "assessment_questions", fields: [assessmentQuestions.assessmentId], references: [skillAssessments.id] }),
  userResponses: many(userResponses, { relationName: "question_responses" }),
}));

export const userAssessmentsRelations = relations(userAssessments, ({ one, many }) => ({
  user: one(users, { relationName: "user_assessments", fields: [userAssessments.userId], references: [users.id] }),
  assessment: one(skillAssessments, { relationName: "assessment_attempts", fields: [userAssessments.assessmentId], references: [skillAssessments.id] }),
  responses: many(userResponses, { relationName: "assessment_responses" }),
}));

export const userResponsesRelations = relations(userResponses, ({ one }) => ({
  userAssessment: one(userAssessments, { relationName: "assessment_responses", fields: [userResponses.userAssessmentId], references: [userAssessments.id] }),
  question: one(assessmentQuestions, { relationName: "question_responses", fields: [userResponses.questionId], references: [assessmentQuestions.id] }),
}));
