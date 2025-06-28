import { pgTable, text, serial, integer, boolean, pgEnum, timestamp, json, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import settings schema
import { settings, siteSettings, insertSettingSchema, insertSiteSettingsSchema } from "./schema-settings";

// Import plans schema
import { plans, userPlans, insertPlanSchema, insertUserPlanSchema } from "./schema-plans";

// Re-export settings schema
export { settings, siteSettings, insertSettingSchema, insertSiteSettingsSchema };

// Re-export plans schema
export { plans, userPlans, insertPlanSchema, insertUserPlanSchema };

// User role enum
export const userRoleEnum = pgEnum('user_role', ['client', 'freelancer', 'admin']);

// Freelancer level enum
export const freelancerLevelEnum = pgEnum('freelancer_level', ['beginner', 'intermediate', 'advanced']);

// Freelancer type enum
export const freelancerTypeEnum = pgEnum('freelancer_type', ['content_creator', 'expert']);

// Project status enum
export const projectStatusEnum = pgEnum('project_status', ['pending', 'open', 'in_progress', 'completed', 'cancelled']);

// Project type enum
export const projectTypeEnum = pgEnum('project_type', ['standard', 'consultation', 'mentoring']);

// Proposal status enum
export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'accepted', 'rejected']);

// Verification status enum
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['completed', 'pending', 'failed']);

// Payment type enum
export const paymentTypeEnum = pgEnum('payment_type', ['deposit', 'withdrawal', 'project_payment', 'plan_payment']);

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['fee', 'payment', 'refund']);

// Payout account type enum
export const payoutAccountTypeEnum = pgEnum('payout_account_type', ['bank_account', 'paypal']);

// Withdrawal request status enum
export const withdrawalRequestStatusEnum = pgEnum('withdrawal_request_status', ['pending', 'approved', 'rejected', 'completed']);

// Badge type enum
export const badgeTypeEnum = pgEnum('badge_type', ['plan', 'custom']);

// Difficulty level enum
export const difficultyLevelEnum = pgEnum('difficulty_level', ['beginner', 'intermediate', 'advanced']);

// Exercise status enum
export const exerciseStatusEnum = pgEnum('exercise_status', ['in_progress', 'submitted', 'approved', 'rejected']);

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
  phoneVerified: boolean("phone_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  isBlocked: boolean("is_blocked").default(false),
  freelancerLevel: freelancerLevelEnum("freelancer_level"),
  freelancerType: freelancerTypeEnum("freelancer_type"),
  hourlyRate: integer("hourly_rate"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  freelancerCount: integer("freelancer_count").default(0),
  translations: jsonb("translations")
});

// Skills table
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  locationBased: boolean("location_based").default(false),
  translations: jsonb("translations")
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
  clientId: integer("client_id").notNull().references(() => users.id),
  freelancerId: integer("freelancer_id").references(() => users.id),
  budget: integer("budget").notNull(),
  status: projectStatusEnum("status").default('pending'),
  category: integer("category_id").notNull().references(() => categories.id),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  projectType: projectTypeEnum("project_type").default('standard'),
  hourlyRate: integer("hourly_rate"),
  estimatedHours: integer("estimated_hours"),
  consultationDate: timestamp("consultation_date"),
  consultationStartTime: text("consultation_start_time"),
  consultationEndTime: text("consultation_end_time"),
  timeZone: text("time_zone"),
  featuredImage: text("featured_image"),
  city: text("city"),
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
  supervisedBy: integer("supervised_by").references(() => users.id),
  isFlagged: boolean("is_flagged").default(false),
  supervisorNotes: text("supervisor_notes"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
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

// Portfolio table
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  link: text("link"),
  date: timestamp("date"),
  imageId: integer("image_id").references(() => files.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio Project interface
export interface PortfolioProject {
  id: number;
  userId: number;
  title: string;
  description: string;
  link?: string;
  date?: Date;
  imageId?: number;
  image?: string;
  createdAt: Date;
}

// Payout Accounts table
export const payoutAccounts = pgTable("payout_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: payoutAccountTypeEnum("type").notNull(),
  name: text("name").notNull(),
  accountDetails: json("account_details").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric("amount").notNull(),
  status: paymentStatusEnum("status").notNull(),
  type: paymentTypeEnum("type").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'set null' }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User balance table for tracking earnings and withdrawals
export const userBalances = pgTable("user_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalEarnings: numeric("total_earnings").notNull().default('0'),
  pendingWithdrawals: numeric("pending_withdrawals").notNull().default('0'),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric("amount").notNull(),
  type: transactionTypeEnum("type").notNull(),
  status: paymentStatusEnum("status").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// Withdrawal Requests table
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  accountDetails: json("account_details").notNull(),
  status: withdrawalRequestStatusEnum("status").default('pending'),
  notes: text("notes"),
  adminId: integer("admin_id").references(() => users.id),
  paymentId: integer("payment_id").references(() => payments.id),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// Pages table
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  content: text("content").notNull(),
  contentAr: text("content_ar"),
  metaDescription: text("meta_description"),
  metaDescriptionAr: text("meta_description_ar"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  thumbnail: text("thumbnail"),
});

// Badges table
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color").notNull(),
  type: badgeTypeEnum("type").notNull().default('custom'),
  planKey: text("plan_key"), // For plan-based badges
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  translations: jsonb("translations")
});

// User Badges table (Many to Many)
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: 'cascade' }),
  assignedBy: integer("assigned_by").references(() => users.id), // Admin who assigned the badge
  assignedAt: timestamp("assigned_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  isActive: boolean("is_active").default(true),
});

// Testimonials table
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  contentAr: text("content_ar"), // Arabic translation
  authorName: text("author_name").notNull(),
  authorNameAr: text("author_name_ar"), // Arabic translation
  authorTitle: text("author_title").notNull(),
  authorTitleAr: text("author_title_ar"), // Arabic translation
  authorAvatar: text("author_avatar"),
  rating: integer("rating").notNull().default(5),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0), // For ordering testimonials
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exercise Portal Tables
export const exerciseCategories = pgTable("exercise_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"), // Arabic translation
  description: text("description"),
  descriptionAr: text("description_ar"), // Arabic translation
  icon: text("icon"),
  color: text("color").default("#3B82F6"),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar"), // Arabic translation
  description: text("description").notNull(),
  descriptionAr: text("description_ar"), // Arabic translation
  categoryId: integer("category_id").notNull().references(() => exerciseCategories.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  difficulty: difficultyLevelEnum("difficulty").notNull().default('beginner'),
  estimatedHours: integer("estimated_hours").notNull().default(2),
  budget: integer("budget").notNull().default(50), // Fake budget for realism
  requirements: json("requirements").notNull(), // Array of requirements
  requirementsAr: json("requirements_ar"), // Arabic requirements
  deliverables: json("deliverables").notNull(), // Array of deliverables
  deliverablesAr: json("deliverables_ar"), // Arabic deliverables
  aiGenerated: boolean("ai_generated").default(false),
  aiPrompt: text("ai_prompt"), // The prompt used to generate this exercise
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exerciseSubmissions = pgTable("exercise_submissions", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  freelancerId: integer("freelancer_id").notNull().references(() => users.id),
  status: exerciseStatusEnum("status").default('in_progress'),
  submissionText: text("submission_text"),
  submissionFiles: json("submission_files"), // Array of file URLs
  aiFeedback: text("ai_feedback"), // AI-generated feedback
  aiScore: integer("ai_score"), // AI score out of 100
  adminFeedback: text("admin_feedback"),
  adminScore: integer("admin_score"), // Admin score out of 100
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exerciseProgress = pgTable("exercise_progress", {
  id: serial("id").primaryKey(),
  freelancerId: integer("freelancer_id").notNull().references(() => users.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  exercisesCompleted: integer("exercises_completed").notNull().default(0),
  totalScore: integer("total_score").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
  currentLevel: difficultyLevelEnum("current_level").notNull().default('beginner'),
  lastExerciseAt: timestamp("last_exercise_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiExerciseSettings = pgTable("ai_exercise_settings", {
  id: serial("id").primaryKey(),
  apiKey: text("api_key"), // AI API key (encrypted)
  apiProvider: text("api_provider").notNull().default('openai'), // openai, anthropic, etc.
  modelName: text("model_name").notNull().default('gpt-4'),
  maxTokens: integer("max_tokens").notNull().default(2000),
  temperature: numeric("temperature").notNull().default('0.7'),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true, clientId: true })
  .extend({
    deadline: z.string().nullable().transform(val => val ? new Date(val) : null),
    projectType: z.enum(['standard', 'consultation', 'mentoring']).default('standard'),
    freelancerId: z.number().optional(),
    hourlyRate: z.number().optional(),
    estimatedHours: z.number().optional(),
    consultationDate: z.string().nullable().transform(val => val ? new Date(val) : null),
    consultationStartTime: z.string().optional(),
    consultationEndTime: z.string().optional(),
    timeZone: z.string().optional(),
    city: z.string().optional(),
  });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, status: true, freelancerId: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, reviewerId: true });
export const insertFileSchema = createInsertSchema(files).omit({ id: true, uploadedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, isRead: true, senderId: true, supervisedBy: true, isFlagged: true, supervisorNotes: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });
export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  submittedAt: true,
  status: true,
  reviewerId: true,
  reviewNotes: true,
  reviewedAt: true
});
export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  requestedAt: true,
  status: true,
  adminId: true,
  paymentId: true,
  processedAt: true
});
export const insertPageSchema = createInsertSchema(pages)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    thumbnail: z.string().optional(),
  });

export const insertBadgeSchema = createInsertSchema(badges)
  .omit({ id: true, createdAt: true })
  .extend({
    translations: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  });

export const insertUserBadgeSchema = createInsertSchema(userBadges)
  .omit({ id: true, assignedAt: true })
  .extend({
    expiresAt: z.string().nullable().transform(val => val ? new Date(val) : null),
  });

export const insertTestimonialSchema = createInsertSchema(testimonials)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    contentAr: z.string().optional(),
    authorNameAr: z.string().optional(),
    authorTitleAr: z.string().optional(),
    authorAvatar: z.string().optional(),
    rating: z.number().min(1).max(5).default(5),
    order: z.number().default(0),
  });

export const insertExerciseCategorySchema = createInsertSchema(exerciseCategories)
  .omit({ id: true, createdAt: true })
  .extend({
    nameAr: z.string().optional(),
    descriptionAr: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().default("#3B82F6"),
    order: z.number().default(0),
  });

export const insertExerciseSchema = createInsertSchema(exercises)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    titleAr: z.string().optional(),
    descriptionAr: z.string().optional(),
    requirementsAr: z.array(z.string()).optional(),
    deliverablesAr: z.array(z.string()).optional(),
    aiPrompt: z.string().optional(),
    order: z.number().default(0),
  });

export const insertExerciseSubmissionSchema = createInsertSchema(exerciseSubmissions)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    submissionFiles: z.array(z.string()).optional(),
    aiFeedback: z.string().optional(),
    aiScore: z.number().min(0).max(100).optional(),
    adminFeedback: z.string().optional(),
    adminScore: z.number().min(0).max(100).optional(),
  });

export const insertExerciseProgressSchema = createInsertSchema(exerciseProgress)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertAiExerciseSettingsSchema = createInsertSchema(aiExerciseSettings)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    apiKey: z.string().optional(),
    temperature: z.number().min(0).max(2).default(0.7),
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

export type Review = typeof reviews.$inferSelect & {
  reviewer: {
    id: number;
    fullName: string;
    username: string;
    profileImage?: string;
  };
};
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

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;

export type Page = typeof pages.$inferSelect & {
  thumbnail?: string;
};
export type InsertPage = z.infer<typeof insertPageSchema>;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
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
  withdrawalRequests: many(withdrawalRequests, { relationName: "user_withdrawal_requests" }),
  payoutAccounts: many(payoutAccounts, { relationName: "user_payout_accounts" }),
  balance: one(userBalances, { fields: [users.id], references: [userBalances.userId] }),
  exerciseSubmissions: many(exerciseSubmissions, { relationName: "freelancer_submissions" }),
  exerciseProgress: many(exerciseProgress, { relationName: "freelancer_progress" }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  skills: many(skills, { relationName: "category_skills" }),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  category: one(categories, { relationName: "category_skills", fields: [skills.categoryId], references: [categories.id] }),
  users: many(userSkills, { relationName: "skill_users" }),
  projects: many(projectSkills, { relationName: "skill_projects" }),
  exercises: many(exercises, { relationName: "skill_exercises" }),
  progress: many(exerciseProgress, { relationName: "skill_progress" }),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, { relationName: "user_skills", fields: [userSkills.userId], references: [users.id] }),
  skill: one(skills, { relationName: "skill_users", fields: [userSkills.skillId], references: [skills.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(users, { relationName: "client_projects", fields: [projects.clientId], references: [users.id] }),
  freelancer: one(users, { relationName: "freelancer_projects", fields: [projects.freelancerId], references: [users.id] }),
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

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  project: one(projects, { relationName: "project_payments", fields: [payments.projectId], references: [projects.id] }),
  client: one(users, { fields: [payments.userId], references: [users.id] }),
  transactions: many(transactions, { relationName: "payment_transactions" }),
  withdrawalRequests: many(withdrawalRequests, { relationName: "payment_withdrawal_requests" }),
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

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  user: one(users, {
    relationName: "user_withdrawal_requests",
    fields: [withdrawalRequests.userId],
    references: [users.id],
  }),
  payment: one(payments, { relationName: "payment_withdrawal_requests", fields: [withdrawalRequests.paymentId], references: [payments.id] }),
  admin: one(users, { relationName: "withdrawal_requests_admin", fields: [withdrawalRequests.adminId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  payment: one(payments, { relationName: "payment_transactions", fields: [transactions.paymentId], references: [payments.id] }),
}));

// Add balance relations
export const userBalancesRelations = relations(userBalances, ({ one }) => ({
  user: one(users, { fields: [userBalances.userId], references: [users.id] }),
}));

// Add these tables to shared/schema.ts
export const evaluationQuestions = pgTable("evaluation_questions", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  question: text("question").notNull(),
  questionAr: text("question_ar"), // Arabic translation of the question
  options: json("options").notNull(), // Array of strings
  optionsAr: json("options_ar"), // Array of Arabic translations for options
  correctAnswer: integer("correct_answer").notNull(),
  difficulty: difficultyLevelEnum("difficulty").notNull(),
  points: integer("points").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const evaluationResults = pgTable("evaluation_results", {
  id: serial("id").primaryKey(),
  freelancerId: integer("freelancer_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  score: integer("score").notNull(),
  level: difficultyLevelEnum("level").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Add relations
export const evaluationQuestionsRelations = relations(evaluationQuestions, ({ one }) => ({
  category: one(categories, {
    fields: [evaluationQuestions.categoryId],
    references: [categories.id],
  }),
  skill: one(skills, {
    fields: [evaluationQuestions.skillId],
    references: [skills.id],
  }),
}));

export const evaluationResultsRelations = relations(evaluationResults, ({ one }) => ({
  freelancer: one(users, {
    fields: [evaluationResults.freelancerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [evaluationResults.categoryId],
    references: [categories.id],
  }),
  skill: one(skills, {
    fields: [evaluationResults.skillId],
    references: [skills.id],
  }),
}));

// Add relations
export const pagesRelations = relations(pages, ({}) => ({}));

// Testimonials relations
export const testimonialsRelations = relations(testimonials, ({}) => ({}));

// Exercise relations
export const exerciseCategoriesRelations = relations(exerciseCategories, ({ many }) => ({
  exercises: many(exercises, { relationName: "category_exercises" }),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  category: one(exerciseCategories, { 
    relationName: "category_exercises", 
    fields: [exercises.categoryId], 
    references: [exerciseCategories.id] 
  }),
  skill: one(skills, { 
    relationName: "skill_exercises", 
    fields: [exercises.skillId], 
    references: [skills.id] 
  }),
  submissions: many(exerciseSubmissions, { relationName: "exercise_submissions" }),
}));

export const exerciseSubmissionsRelations = relations(exerciseSubmissions, ({ one }) => ({
  exercise: one(exercises, { 
    relationName: "exercise_submissions", 
    fields: [exerciseSubmissions.exerciseId], 
    references: [exercises.id] 
  }),
  freelancer: one(users, { 
    relationName: "freelancer_submissions", 
    fields: [exerciseSubmissions.freelancerId], 
    references: [users.id] 
  }),
}));

export const exerciseProgressRelations = relations(exerciseProgress, ({ one }) => ({
  freelancer: one(users, { 
    relationName: "freelancer_progress", 
    fields: [exerciseProgress.freelancerId], 
    references: [users.id] 
  }),
  skill: one(skills, { 
    relationName: "skill_progress", 
    fields: [exerciseProgress.skillId], 
    references: [skills.id] 
  }),
}));

// Badge types
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

// User Badge types
export type UserBadge = typeof userBadges.$inferSelect & {
  badge: Badge;
  assignedByUser?: {
    id: number;
    fullName: string;
    username: string;
  };
};
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

// Testimonial types
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

// Exercise types
export type ExerciseCategory = typeof exerciseCategories.$inferSelect;
export type InsertExerciseCategory = z.infer<typeof insertExerciseCategorySchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type ExerciseSubmission = typeof exerciseSubmissions.$inferSelect;
export type InsertExerciseSubmission = z.infer<typeof insertExerciseSubmissionSchema>;

export type ExerciseProgress = typeof exerciseProgress.$inferSelect;
export type InsertExerciseProgress = z.infer<typeof insertExerciseProgressSchema>;

export type AiExerciseSettings = typeof aiExerciseSettings.$inferSelect;
export type InsertAiExerciseSettings = z.infer<typeof insertAiExerciseSettingsSchema>;
