import { pgTable, text, serial, integer, boolean, pgEnum, timestamp, json, numeric, jsonb } from "drizzle-orm/pg-core";
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
export const paymentTypeEnum = pgEnum('payment_type', ['deposit', 'withdrawal', 'project_payment']);

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['fee', 'payment', 'refund']);

// Payout account type enum
export const payoutAccountTypeEnum = pgEnum('payout_account_type', ['bank_account', 'paypal']);

// Withdrawal request status enum
export const withdrawalRequestStatusEnum = pgEnum('withdrawal_request_status', ['pending', 'approved', 'rejected', 'completed']);

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
  isBlocked: boolean("is_blocked").default(false),
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
  translations: jsonb("translations")
});

// Skills table
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull(),
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
  status: projectStatusEnum("status").default('open'),
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
  .omit({ id: true, createdAt: true, status: true, clientId: true })
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

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;

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
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  skills: many(skills, { relationName: "category_skills" }),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  category: one(categories, { relationName: "category_skills", fields: [skills.categoryId], references: [categories.id] }),
  users: many(userSkills, { relationName: "skill_users" }),
  projects: many(projectSkills, { relationName: "skill_projects" }),
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
