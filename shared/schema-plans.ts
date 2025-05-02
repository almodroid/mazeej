import { pgTable, text, serial, integer, boolean, pgEnum, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
})

// Plans table
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  price: text("price").notNull(),
  priceNote: text("price_note"),
  priceValue: integer("price_value").notNull(),
  description: text("description").notNull(),
  color: text("color").notNull(),
  badge: text("badge").notNull(),
  buttonColor: text("button_color").notNull(),
  bestFor: text("best_for").notNull(),
  features: jsonb("features").notNull(),
  maxProjects: integer("max_projects").default(0),
  maxProposals: integer("max_proposals").default(0),
  maxWithdrawals: integer("max_withdrawals").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  translations: jsonb("translations")
});

// Create Zod schema for plan insertion
export const insertPlanSchema = createInsertSchema(plans, {
  features: z.array(z.string()),
  translations: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});

// Plan interface
export interface Plan {
  id: number;
  key: string;
  title: string;
  price: string;
  priceNote?: string;
  priceValue: number;
  description: string;
  color: string;
  badge: string;
  buttonColor: string;
  bestFor: string;
  features: string[];
  maxProjects: number;
  maxProposals: number;
  maxWithdrawals: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations?: Record<string, Record<string, string>>;
}

// User Plans table (for tracking user subscriptions)
export const userPlans = pgTable("user_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: integer("plan_id").notNull().references(() => plans.id),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create Zod schema for user plan insertion
export const insertUserPlanSchema = createInsertSchema(userPlans);

// User Plan interface
export interface UserPlan {
  id: number;
  userId: number;
  planId: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}