import { users, categories, skills, userSkills, projects,portfolios, projectSkills, proposals, messages, reviews, files, payments, notifications, verificationRequests, transactions, withdrawalRequests, payoutAccounts, userBalances } from "@shared/schema";
import type { User, Category, Skill, Project, Proposal, Message, Review, File, Payment, Notification, VerificationRequest, InsertUser, InsertCategory, InsertSkill, InsertProject, InsertProposal, InsertReview, InsertFile, InsertMessage, InsertNotification, InsertVerificationRequest } from "@shared/schema";
import type { Store as SessionStore } from "express-session";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, or, desc, asc, inArray, SQL, not, ne, ilike, between, like } from "drizzle-orm";
import { pool } from "./db";
import { IStorage, PaymentData, CreatePaymentParams, CreateTransactionParams, Transaction, WithdrawalRequestData, CreateWithdrawalRequestParams, UpdateWithdrawalRequestStatusParams } from "./storage";
import { 
  pgEnum, 
  pgTable,
  serial,
  integer,
  timestamp,
  text,
  varchar,
  boolean,
  json,
  numeric
} from 'drizzle-orm/pg-core';
import { customAlphabet } from 'nanoid';
import { isAuthenticated } from './routes/auth';
import express from 'express';
import multer from 'multer';
import { count, avg, sum, getTableColumns, SQLWrapper } from 'drizzle-orm';
import path from 'path'; // Add this line
import * as mime from 'mime-types'; // Add this line
import fs from 'fs'; // Add this line

const PostgresSessionStore = connectPg(session);

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Seed initial categories
    this.seedCategories();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // In a real app, you might want to use transactions
      // Delete associated data first to maintain referential integrity
      
      // Delete user skills
      await db
        .delete(userSkills)
        .where(eq(userSkills.userId, id));
      
      // Delete user proposals
      await db
        .delete(proposals)
        .where(eq(proposals.freelancerId, id));
      
      // Delete reviews by and for this user
      await db
        .delete(reviews)
        .where(
          or(
            eq(reviews.reviewerId, id),
            eq(reviews.revieweeId, id)
          )
        );
      
      // Delete user files
      await db
        .delete(files)
        .where(eq(files.userId, id));
      
      // Delete user notifications
      await db
        .delete(notifications)
        .where(eq(notifications.userId, id));
      
      // Delete user's projects
      await db
        .delete(projects)
        .where(eq(projects.clientId, id));
      
      // Finally delete the user
      const result = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async getFreelancers(limit?: number): Promise<User[]> {
    let query = db
      .select()
      .from(users)
      .where(eq(users.role, 'freelancer'));
    
    const result = await query;
    
    if (limit) {
      return result.slice(0, limit);
    }
    
    return result;
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    // Get all users
    const allUsers = await db.select().from(users);
    
    // Remove password field for security
    return allUsers.map(({ password, ...user }) => user);
  }

  async getFreelancersByCategory(categoryId: number, limit?: number): Promise<User[]> {
    // Find skills in this category
    const categorySkills = await db
      .select()
      .from(skills)
      .where(eq(skills.categoryId, categoryId));
    
    // Find users with these skills
    const skillIds = categorySkills.map(skill => skill.id);
    
    let freelancers: User[] = [];
    
    if (skillIds.length > 0) {
      // Find all user skills with these skill ids
      const userWithSkills = await db
        .select()
        .from(userSkills)
        .where(inArray(userSkills.skillId, skillIds));
      
      const userIds = userWithSkills.map(us => us.userId);
      
      if (userIds.length > 0) {
        // Get freelancers with these skills
        const query = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.role, 'freelancer'),
              inArray(users.id, userIds)
            )
          );
        
        freelancers = query;
        
        if (limit && freelancers.length > limit) {
          freelancers = freelancers.slice(0, limit);
        }
      }
    }
    
    return freelancers;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const results = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    
    return results.length > 0 ? results[0] : undefined;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.getCategoryById(id);
  }

  async createCategory(category: InsertCategory & { translations?: Record<string, string> }): Promise<Category> {
    // Set name based on translations (prefer Arabic)
    let name = category.name;
    if (category.translations) {
      name = category.translations.ar || category.translations.en || category.name;
    }

    const result = await db
      .insert(categories)
      .values({
        name,
        icon: category.icon || 'default-icon',
        freelancerCount: category.freelancerCount || 0,
        translations: category.translations
      })
      .returning();
    
    return result[0];
  }

  async updateCategory(id: number, categoryData: Partial<Category & { translations?: Record<string, string> }>): Promise<Category | undefined> {
    // Set name based on translations (prefer Arabic)
    let name = categoryData.name;
    if (categoryData.translations) {
      name = categoryData.translations.ar || categoryData.translations.en || categoryData.name || undefined;
    }

    const updateData: Partial<Category> = {
      ...categoryData
    };

    if (name) {
      updateData.name = name;
    }

    const result = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // First check if the category has any skills
    const categorySkills = await this.getSkillsByCategory(id);
    if (categorySkills.length > 0) {
      return false;
    }

    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Skill operations
  async getSkills(): Promise<Skill[]> {
    return await db.select().from(skills);
  }

  async getSkillsByCategory(categoryId: number): Promise<Skill[]> {
    return await db
      .select()
      .from(skills)
      .where(eq(skills.categoryId, categoryId));
  }

  async getSkill(id: number): Promise<Skill | undefined> {
    const results = await db
      .select()
      .from(skills)
      .where(eq(skills.id, id));
    
    return results.length > 0 ? results[0] : undefined;
  }

  async createSkill(skillData: Partial<InsertSkill> & { translations?: Record<string, string> }): Promise<Skill> {
    // Set name based on translations (prefer Arabic)
    let name = skillData.name || '';
    if (skillData.translations) {
      name = skillData.translations.ar || skillData.translations.en || name;
    }

    const result = await db
      .insert(skills)
      .values({
        name,
        categoryId: skillData.categoryId!,
        translations: skillData.translations
      })
      .returning();
    
    return result[0];
  }

  async updateSkill(id: number, skillData: Partial<Skill & { translations?: Record<string, string> }>): Promise<Skill | undefined> {
    // Set name based on translations (prefer Arabic)
    let name = skillData.name;
    if (skillData.translations) {
      name = skillData.translations.ar || skillData.translations.en || skillData.name || undefined;
    }

    const updateData: Partial<Skill> = {
      ...skillData
    };

    if (name) {
      updateData.name = name;
    }

    const result = await db
      .update(skills)
      .set(updateData)
      .where(eq(skills.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteSkill(id: number): Promise<boolean> {
    // Delete the skill
    const result = await db
      .delete(skills)
      .where(eq(skills.id, id))
      .returning();
    
    return result.length > 0;
  }

  async isSkillInUse(skillId: number): Promise<boolean> {
    // Check if any user has this skill
    const userSkillsResult = await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.skillId, skillId));

    if (userSkillsResult.length > 0) {
      return true;
    }

    // Check if any project requires this skill
    const projectSkillsResult = await db
      .select()
      .from(projectSkills)
      .where(eq(projectSkills.skillId, skillId));

    return projectSkillsResult.length > 0;
  }

  async getUserSkills(userId: number): Promise<Skill[]> {
    const userSkillsResult = await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, userId));
    
    const skillIds = userSkillsResult.map(us => us.skillId);
    
    if (skillIds.length === 0) return [];
    
    return await db
      .select()
      .from(skills)
      .where(inArray(skills.id, skillIds));
  }

  async addUserSkill(userId: number, skillId: number): Promise<void> {
    await db
      .insert(userSkills)
      .values({ userId, skillId });
  }

  async removeUserSkill(userId: number, skillId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userSkills)
        .where(
          and(
            eq(userSkills.userId, userId),
            eq(userSkills.skillId, skillId)
          )
        ).returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error removing user skill:", error);
      return false;
    }
  }

  // Project operations
  async getProjects(limit?: number): Promise<Project[]> {
    const result = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
    
    if (limit) {
      return result.slice(0, limit);
    }
    
    return result;
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, clientId))
      .orderBy(desc(projects.createdAt));
  }

  async getPendingConsultationsForExpert(expertId: number): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.freelancerId, expertId),
          eq(projects.status, 'pending'),
          or(
            eq(projects.projectType, 'consultation'),
            eq(projects.projectType, 'mentoring')
          )
        )
      )
      .orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject, clientId: number): Promise<Project> {
    // Determine initial status based on project type
    const initialStatus = 
      project.projectType === 'consultation' || project.projectType === 'mentoring'
        ? 'pending' 
        : 'open';

    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        clientId,
        status: initialStatus, // Use the determined initial status
        // Ensure freelancerId is included if provided
        freelancerId: project.freelancerId,
      })
      .returning();
    return newProject;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ status: status as Project['status'] })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const allowedUpdates = {
      title: data.title,
      description: data.description,
      budget: data.budget,
      category: data.category
    };
    
    const [updatedProject] = await db
      .update(projects)
      .set(allowedUpdates)
      .where(eq(projects.id, id))
      .returning();
      
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      // Delete related data first
      // Delete project skills
      await db
        .delete(projectSkills)
        .where(eq(projectSkills.projectId, id));

      // Delete proposals for this project
      await db
        .delete(proposals)
        .where(eq(proposals.projectId, id));

      // Delete reviews for this project
      await db
        .delete(reviews)
        .where(eq(reviews.projectId, id));

      // Delete project files
      await db
        .delete(files)
        .where(eq(files.projectId, id));

      // Finally delete the project
      const result = await db
        .delete(projects)
        .where(eq(projects.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Proposal operations
  async getProposalById(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, id));
    return proposal;
  }

  async getProposalsByProject(projectId: number): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.projectId, projectId))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.freelancerId, freelancerId))
      .orderBy(desc(proposals.createdAt));
  }

  async createProposal(proposal: InsertProposal, freelancerId: number): Promise<Proposal> {
    const [newProposal] = await db
      .insert(proposals)
      .values({
        ...proposal,
        freelancerId,
        status: 'pending'
      })
      .returning();
    return newProposal;
  }

  async updateProposalStatus(id: number, status: string): Promise<Proposal | undefined> {
    await db
      .update(proposals)
      .set({ status: status as "pending" | "accepted" | "rejected" | null })
      .where(eq(proposals.id, id));
    return this.getProposalById(id);
  }

  async updateProposal(id: number, data: Partial<Proposal>): Promise<Proposal | undefined> {
    // Get current proposal
    const proposal = await this.getProposalById(id);
    if (!proposal) return undefined;
    
    // Only allow updating these fields
    const allowedUpdates = {
      description: data.description,
      price: data.price,
      deliveryTime: data.deliveryTime
    };
    
    await db
      .update(proposals)
      .set(allowedUpdates)
      .where(eq(proposals.id, id));
    
    return this.getProposalById(id);
  }

  async deleteProposal(id: number): Promise<boolean> {
    const result = await db
      .delete(proposals)
      .where(eq(proposals.id, id));
    
    return !!result;
  }

  async getProposalsByProjectId(projectId: number): Promise<Proposal[]> {
    // This is an alias for getProposalsByProject to maintain API compatibility
    return this.getProposalsByProject(projectId);
  }

  // Message operations
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, senderId),
            eq(messages.receiverId, receiverId)
          ),
          and(
            eq(messages.senderId, receiverId),
            eq(messages.receiverId, senderId)
          )
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage, senderId: number): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        senderId,
        isRead: false
      })
      .returning();
    return newMessage;
  }
  
  async getAllUserMessages(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  // Review operations
  async getReviewsByUser(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  // Get reviews given by a user (as reviewer)
  async getReviewsByReviewer(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.reviewerId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  // Get all reviews for a specific project
  async getProjectReviews(projectId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.projectId, projectId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview, reviewerId: number): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({
        ...review,
        reviewerId
      })
      .returning();
    return newReview;
  }

  // File operations
  async uploadFile(file: InsertFile): Promise<File> {
    const [newFile] = await db
      .insert(files)
      .values(file)
      .returning();
    return newFile;
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.uploadedAt));
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(desc(files.uploadedAt));
  }

  async getFileById(id: number): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id));
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db
      .delete(files)
      .where(eq(files.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Notification operations
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        isRead: false
      })
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      await db
        .delete(notifications)
        .where(eq(notifications.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Portfolio operations
  async createPortfolioProject(
    project: {
      freelancerId: number;
      title: string;
      description: string;
      link?: string;
      date?: string;
      imagePath?: string | null;
    }
  ): Promise<{
    id: number;
    title: string;
    description: string;
    link: string | null;
    date: Date | null;
    image: File | null;
  }> {
    let imageId: number | null = null;
    
    if (project.imagePath) {
      const fileData = {
        userId: project.freelancerId,
        filename: path.basename(project.imagePath),
        originalName: path.basename(project.imagePath),
        mimeType: mime.lookup(project.imagePath) || 'application/octet-stream',
        size: fs.statSync(path.join(process.cwd(), project.imagePath)).size
      };
      
      const savedFile = await this.uploadFile(fileData);
      imageId = savedFile.id;
    }
    
    const [portfolio] = await db
      .insert(portfolios)
      .values({
        userId: project.freelancerId,
        title: project.title,
        description: project.description,
        link: project.link || null,
        date: project.date ? new Date(project.date) : null,
        imageId
      })
      .returning();

    let image = null;
    if (portfolio.imageId) {
      image = await this.getFileById(portfolio.imageId);
    }

    return {
      id: portfolio.id,
      title: portfolio.title,
      description: portfolio.description,
      link: portfolio.link,
      date: portfolio.date,
      image
    };
  }

  async getPortfolioProjects(userId: number): Promise<Array<{
    id: number;
    title: string;
    description: string;
    link: string | null;
    date: Date | null;
    image: File | null;
  }>> {
    const portfolioItems = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));

    const portfolioWithImages = await Promise.all(
      portfolioItems.map(async (item) => {
        let image = null;
        if (item.imageId) {
          image = await this.getFileById(item.imageId);
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          link: item.link,
          date: item.date,
          image
        };
      })
    );

    return portfolioWithImages;
  }

  // Verification operations
  async getVerificationRequests(status?: "pending" | "approved" | "rejected"): Promise<VerificationRequest[]> {
    const query = db.select().from(verificationRequests);
    
    if (status) {
      const filtered = query.where(eq(verificationRequests.status, status));
      return await filtered.orderBy(desc(verificationRequests.submittedAt));
    }
    
    // Sort by submission date, newest first
    return await query.orderBy(desc(verificationRequests.submittedAt));
  }

  async getVerificationRequestsForUser(userId: number): Promise<VerificationRequest[]> {
    const requests = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, userId))
      .orderBy(desc(verificationRequests.submittedAt));
    
    return requests;
  }

  async getVerificationRequestById(id: number): Promise<VerificationRequest | undefined> {
    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, id));
    
    return request || undefined;
  }

  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const [newRequest] = await db
      .insert(verificationRequests)
      .values(request)
      .returning();
    
    return newRequest;
  }

  async updateVerificationRequestStatus(
    id: number, 
    status: string, 
    reviewerId: number, 
    reviewNotes?: string
  ): Promise<VerificationRequest | undefined> {
    const now = new Date();
    
    const [updatedRequest] = await db
      .update(verificationRequests)
      .set({
        status: status as any,
        reviewerId,
        reviewNotes: reviewNotes || null,
        reviewedAt: now,
      })
      .where(eq(verificationRequests.id, id))
      .returning();
    
    if (!updatedRequest) return undefined;
    
    // If approved, update the user's verification status
    if (status === 'approved') {
      await db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.id, updatedRequest.userId));
    }
    
    return updatedRequest;
  }

  async getVerificationRequestsByStatus(status: "pending" | "approved" | "rejected"): Promise<VerificationRequest[]> {
    return await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.status, status));
  }

  // Seed categories
  private async seedCategories() {
    const existingCategories = await this.getCategories();
    
    if (existingCategories.length === 0) {
      const categories: InsertCategory[] = [
        { name: "برمجة وتطوير", icon: "laptop-code", freelancerCount: 2500 },
        { name: "تصميم وفنون", icon: "paint-brush", freelancerCount: 1800 },
        { name: "تسويق ومبيعات", icon: "bullhorn", freelancerCount: 1200 },
        { name: "كتابة وترجمة", icon: "pen", freelancerCount: 950 },
        { name: "صوتيات ومرئيات", icon: "video", freelancerCount: 750 },
        { name: "استشارات وأعمال", icon: "chart-line", freelancerCount: 680 }
      ];
      
      for (const category of categories) {
        await this.createCategory(category as InsertCategory & { translations?: Record<string, string> });
      }
    }
  }

  // Payment operations
  async getPayment(id: number): Promise<PaymentData | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    
    if (!payment) return undefined;
    // Convert amount from string to number and null to undefined
    return {
      ...payment,
      amount: Number(payment.amount),
      projectId: payment.projectId ?? undefined,
      description: payment.description ?? undefined,
      createdAt: payment.createdAt.toISOString()
    };
  }

  async createPayment(paymentData: CreatePaymentParams): Promise<PaymentData> {
    // Convert number to string for database
    const dbPaymentData = {
      ...paymentData,
      amount: String(paymentData.amount)
    };
    
    const [payment] = await db
      .insert(payments)
      .values(dbPaymentData)
      .returning();
    
    // Convert back to number for return and null to undefined
    return {
      ...payment,
      amount: Number(payment.amount),
      projectId: payment.projectId ?? undefined,
      description: payment.description ?? undefined,
      createdAt: payment.createdAt.toISOString()
    };
  }

  async getAllPayments(): Promise<PaymentData[]> {
    const result = await db
      .select({
        payment: payments,
        username: users.username
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id));
    
    return result.map(row => ({
      ...row.payment,
      username: row.username ?? undefined,
      amount: Number(row.payment.amount),
      projectId: row.payment.projectId ?? undefined,
      description: row.payment.description ?? undefined,
      createdAt: row.payment.createdAt.toISOString()
    }));
  }

  async getUserPayments(userId: number): Promise<PaymentData[]> {
    console.log(`Getting payments for user ${userId}`);
    try {
      const results = await db
        .select({
          id: payments.id,
          userId: payments.userId,
          amount: payments.amount,
          status: payments.status,
          type: payments.type,
          projectId: payments.projectId,
          description: payments.description,
          createdAt: payments.createdAt
        })
        .from(payments)
        .where(eq(payments.userId, userId));
      
      console.log(`Found ${results.length} payments for user ${userId}`);
      
      // Join with projects if projectId is present
      const enhancedResults = await Promise.all(results.map(async (payment) => {
        let projectTitle = '';
        let clientName = '';
        
        if (payment.projectId) {
          const projectResults = await db
            .select({
              title: projects.title,
              clientId: projects.clientId
            })
            .from(projects)
            .where(eq(projects.id, payment.projectId));
          
          if (projectResults.length > 0) {
            projectTitle = projectResults[0].title;
            
            if (projectResults[0].clientId) {
              const clientResults = await db
                .select({
                  username: users.username,
                  fullName: users.fullName
                })
                .from(users)
                .where(eq(users.id, projectResults[0].clientId));
              
              if (clientResults.length > 0) {
                clientName = clientResults[0].fullName || clientResults[0].username;
              }
            }
          }
        }
        
        return {
          ...payment,
          amount: Number(payment.amount),
          projectId: payment.projectId ?? undefined,
          description: payment.description ?? undefined,
          createdAt: payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt,
          projectTitle,
          clientName
        };
      }));
      
      return enhancedResults;
    } catch (error) {
      console.error('Error in getUserPayments:', error);
      return [];
    }
  }

  async deletePayment(id: number): Promise<boolean> {
    try {
      await db
        .delete(payments)
        .where(eq(payments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting payment:", error);
      return false;
    }
  }

  // Transaction operations
  async createTransaction(transactionData: CreateTransactionParams): Promise<Transaction> {
    // Convert number to string for database
    const dbTransactionData = {
      ...transactionData,
      amount: String(transactionData.amount)
    };
    
    const [transaction] = await db
      .insert(transactions)
      .values(dbTransactionData)
      .returning();
    
    // Convert back to number for return and null to undefined
    return {
      ...transaction,
      amount: Number(transaction.amount),
      description: transaction.description ?? undefined,
      createdAt: transaction.createdAt.toISOString()
    };
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const result = await db
      .select({
        transaction: transactions,
        username: users.username
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id));
    
    return result.map(row => ({
      ...row.transaction,
      username: row.username ?? undefined,
      amount: Number(row.transaction.amount),
      description: row.transaction.description ?? undefined,
      createdAt: row.transaction.createdAt.toISOString()
    }));
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
    
    return userTransactions.map(transaction => ({
      ...transaction,
      amount: Number(transaction.amount),
      description: transaction.description ?? undefined,
      createdAt: transaction.createdAt.toISOString()
    }));
  }

  async deleteTransactionsByPaymentId(paymentId: number): Promise<boolean> {
    try {
      await db
        .delete(transactions)
        .where(eq(transactions.paymentId, paymentId));
      return true;
    } catch (error) {
      console.error("Error deleting transactions:", error);
      return false;
    }
  }

  // Message supervision methods
  async getAllConversations(): Promise<any[]> {
    // Get all unique conversation pairs
    const conversations = await db
      .select({
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
        isFlagged: messages.isFlagged,
        supervisedBy: messages.supervisedBy,
        supervisorNotes: messages.supervisorNotes
      })
      .from(messages)
      .orderBy(desc(messages.createdAt));

    // Group by conversation pairs
    const conversationMap = new Map<string, {
      id: string;
      participants: number[];
      lastMessage: string;
      lastMessageTime: Date | null;
      isFlagged: boolean | null;
      supervisedBy: number | null;
      supervisorNotes: string | null;
    }>();

    conversations.forEach(msg => {
      const key = [msg.senderId, msg.receiverId].sort().join('-');
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          id: key,
          participants: [msg.senderId, msg.receiverId],
          lastMessage: msg.lastMessage,
          lastMessageTime: msg.lastMessageTime,
          isFlagged: msg.isFlagged,
          supervisedBy: msg.supervisedBy,
          supervisorNotes: msg.supervisorNotes
        });
      }
    });

    // Get user details for participants
    const allUserIds = new Set<number>();
    conversationMap.forEach(conv => {
      conv.participants.forEach(id => allUserIds.add(id));
    });

    const userDetails = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImage: users.profileImage,
        role: users.role
      })
      .from(users)
      .where(inArray(users.id, Array.from(allUserIds)));

    // Map user details to conversations
    return Array.from(conversationMap.values()).map(conv => ({
      ...conv,
      participants: conv.participants.map(id => 
        userDetails.find(u => u.id === id)
      )
    }));
  }

  async getMessagesByConversation(conversationId: string): Promise<any[]> {
    const [userId1, userId2] = conversationId.split('-').map(Number);
    
    return await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        createdAt: messages.createdAt,
        isRead: messages.isRead,
        isFlagged: messages.isFlagged,
        supervisedBy: messages.supervisedBy,
        supervisorNotes: messages.supervisorNotes
      })
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async updateMessageFlag(messageId: number, isFlagged: boolean): Promise<void> {
    await db
      .update(messages)
      .set({ isFlagged })
      .where(eq(messages.id, messageId));
  }

  async updateMessageSupervision(
    messageId: number, 
    supervisorNotes: string, 
    supervisedBy: number
  ): Promise<void> {
    await db
      .update(messages)
      .set({ 
        supervisorNotes,
        supervisedBy,
        isFlagged: true // Automatically flag when supervised
      })
      .where(eq(messages.id, messageId));
  }

  // Withdrawal request methods
  async getAllWithdrawalRequests(): Promise<WithdrawalRequestData[]> {
    try {
      const result = await db.query.withdrawalRequests.findMany({
        orderBy: [desc(withdrawalRequests.requestedAt)],
        with: {
          user: true,
          admin: true
        }
      });

      return result.map(wr => ({
        id: wr.id,
        userId: wr.userId,
        username: wr.user?.username,
        amount: Number(wr.amount),
        paymentMethod: wr.paymentMethod,
        accountDetails: wr.accountDetails,
        status: wr.status || 'pending',
        notes: wr.notes || undefined,
        adminId: wr.adminId || undefined,
        adminUsername: wr.admin?.username,
        paymentId: wr.paymentId || undefined,
        requestedAt: wr.requestedAt.toISOString(),
        processedAt: wr.processedAt ? wr.processedAt.toISOString() : undefined
      }));
    } catch (error) {
      console.error('Error in getAllWithdrawalRequests:', error);
      return [];
    }
  }

  async getUserWithdrawalRequests(userId: number): Promise<WithdrawalRequestData[]> {
    try {
      const result = await db.query.withdrawalRequests.findMany({
        where: eq(withdrawalRequests.userId, userId),
        orderBy: [desc(withdrawalRequests.requestedAt)],
        with: {
          admin: true
        }
      });

      return result.map(wr => ({
        id: wr.id,
        userId: wr.userId,
        amount: Number(wr.amount),
        paymentMethod: wr.paymentMethod,
        accountDetails: wr.accountDetails,
        status: wr.status || 'pending',
        notes: wr.notes || undefined,
        adminId: wr.adminId || undefined,
        adminUsername: wr.admin?.username,
        paymentId: wr.paymentId || undefined,
        requestedAt: wr.requestedAt.toISOString(),
        processedAt: wr.processedAt ? wr.processedAt.toISOString() : undefined
      }));
    } catch (error) {
      console.error('Error in getUserWithdrawalRequests:', error);
      return [];
    }
  }

  async getWithdrawalRequest(id: number): Promise<WithdrawalRequestData | null> {
    try {
      const result = await db.query.withdrawalRequests.findFirst({
        where: eq(withdrawalRequests.id, id),
        with: {
          user: true,
          admin: true
        }
      });

      if (!result) return null;

      return {
        id: result.id,
        userId: result.userId,
        username: result.user?.username,
        amount: Number(result.amount),
        paymentMethod: result.paymentMethod,
        accountDetails: result.accountDetails,
        status: result.status || 'pending',
        notes: result.notes || undefined,
        adminId: result.adminId || undefined,
        adminUsername: result.admin?.username,
        paymentId: result.paymentId || undefined,
        requestedAt: result.requestedAt.toISOString(),
        processedAt: result.processedAt ? result.processedAt.toISOString() : undefined
      };
    } catch (error) {
      console.error('Error in getWithdrawalRequest:', error);
      return null;
    }
  }

  async createWithdrawalRequest(params: CreateWithdrawalRequestParams): Promise<WithdrawalRequestData | null> {
    try {
      const [result] = await db.insert(withdrawalRequests).values({
        userId: params.userId,
        amount: String(params.amount),
        paymentMethod: params.paymentMethod,
        accountDetails: params.accountDetails,
        notes: params.notes,
        status: 'pending',
        requestedAt: new Date()
      }).returning();

      if (!result) return null;

      return {
        id: result.id,
        userId: result.userId,
        amount: Number(result.amount),
        paymentMethod: result.paymentMethod,
        accountDetails: result.accountDetails,
        status: result.status || 'pending',
        notes: result.notes || undefined,
        requestedAt: result.requestedAt.toISOString()
      };
    } catch (error) {
      console.error('Error in createWithdrawalRequest:', error);
      return null;
    }
  }

  async updateWithdrawalRequestStatus(id: number, params: UpdateWithdrawalRequestStatusParams): Promise<WithdrawalRequestData | null> {
    try {
      const [result] = await db.update(withdrawalRequests)
        .set({
          status: params.status,
          notes: params.notes,
          adminId: params.adminId,
          processedAt: params.processedAt
        })
        .where(eq(withdrawalRequests.id, id))
        .returning();

      if (!result) return null;

      return {
        id: result.id,
        userId: result.userId,
        amount: Number(result.amount),
        paymentMethod: result.paymentMethod,
        accountDetails: result.accountDetails,
        status: result.status || 'pending',
        notes: result.notes || undefined,
        adminId: result.adminId || undefined,
        paymentId: result.paymentId || undefined,
        requestedAt: result.requestedAt.toISOString(),
        processedAt: result.processedAt ? result.processedAt.toISOString() : undefined
      };
    } catch (error) {
      console.error('Error in updateWithdrawalRequestStatus:', error);
      return null;
    }
  }

  async updateWithdrawalRequestPayment(id: number, paymentId: number): Promise<boolean> {
    try {
      await db.update(withdrawalRequests)
        .set({ paymentId })
        .where(eq(withdrawalRequests.id, id));
      return true;
    } catch (error) {
      console.error('Error in updateWithdrawalRequestPayment:', error);
      return false;
    }
  }

  // Payout account operations
  async getPayoutAccounts(userId: number): Promise<any[]> {
    const payoutAccountsResult = await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.userId, userId))
      .orderBy(desc(payoutAccounts.createdAt));
    
    return payoutAccountsResult;
  }

  async getPayoutAccount(id: number): Promise<any | undefined> {
    const results = await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.id, id));
    
    return results.length > 0 ? results[0] : undefined;
  }

  async createPayoutAccount(userId: number, data: { type: string; name: string; accountDetails: any; isDefault: boolean }): Promise<any> {
    // If this is set as default, unset any existing default
    if (data.isDefault) {
      await db
        .update(payoutAccounts)
        .set({ isDefault: false })
        .where(and(
          eq(payoutAccounts.userId, userId),
          eq(payoutAccounts.isDefault, true)
        ));
    }
    
    // If no preference is set and this is the first account, make it default
    if (data.isDefault === undefined) {
      const existingAccounts = await this.getPayoutAccounts(userId);
      data.isDefault = existingAccounts.length === 0;
    }
    
    const result = await db
      .insert(payoutAccounts)
      .values({
        userId,
        type: data.type as any,
        name: data.name,
        accountDetails: data.accountDetails,
        isDefault: data.isDefault
      })
      .returning();
    
    return result[0];
  }

  async updatePayoutAccount(id: number, data: { name?: string; accountDetails?: any; isDefault?: boolean }): Promise<any | undefined> {
    const account = await this.getPayoutAccount(id);
    
    if (!account) {
      return undefined;
    }
    
    // If setting this as default, unset any existing default
    if (data.isDefault) {
      await db
        .update(payoutAccounts)
        .set({ isDefault: false })
        .where(and(
          eq(payoutAccounts.userId, account.userId),
          eq(payoutAccounts.isDefault, true),
          ne(payoutAccounts.id, id)
        ));
    }
    
    const result = await db
      .update(payoutAccounts)
      .set({
        name: data.name,
        accountDetails: data.accountDetails,
        isDefault: data.isDefault
      })
      .where(eq(payoutAccounts.id, id))
      .returning();
    
    return result[0];
  }

  async deletePayoutAccount(id: number): Promise<boolean> {
    const account = await this.getPayoutAccount(id);
    
    if (!account) {
      return false;
    }
    
    const result = await db
      .delete(payoutAccounts)
      .where(eq(payoutAccounts.id, id));
    
    // If this was the default account and there are other accounts, make another one default
    if (account.isDefault) {
      const otherAccounts = await db
        .select()
        .from(payoutAccounts)
        .where(eq(payoutAccounts.userId, account.userId))
        .limit(1);
      
      if (otherAccounts.length > 0) {
        await db
          .update(payoutAccounts)
          .set({ isDefault: true })
          .where(eq(payoutAccounts.id, otherAccounts[0].id));
      }
    }
    
    return true;
  }

  // User balance operations
  async getUserBalance(userId: number): Promise<{ totalEarnings: number; pendingWithdrawals: number }> {
    try {
      const results = await db
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, userId));

      if (results.length === 0) {
        // No balance record found, return default values
        return {
          totalEarnings: 0,
          pendingWithdrawals: 0
        };
      }

      const balance = results[0];
      
      // Parse string values to numbers
      return {
        totalEarnings: parseFloat(balance.totalEarnings || '0'),
        pendingWithdrawals: parseFloat(balance.pendingWithdrawals || '0')
      };
    } catch (error) {
      console.error('Error getting user balance:', error);
      return {
        totalEarnings: 0,
        pendingWithdrawals: 0
      };
    }
  }
  
  async calculateUserBalance(userId: number): Promise<{ totalEarnings: number; pendingWithdrawals: number; }> {
    try {
      // Calculate total earnings from payments
      const payments = await this.getUserPayments(userId);
      
      // Separate completed payments into earnings and withdrawals
      const earnings = payments
        .filter(p => p.status === 'completed' && p.type !== 'withdrawal')
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Withdrawals are negative earnings
      const withdrawals = payments
        .filter(p => p.status === 'completed' && p.type === 'withdrawal')
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Net earnings are earnings minus withdrawals
      const totalEarnings = earnings - withdrawals;
      
      // Calculate pending withdrawals
      const pendingWithdrawals = await this.getUserWithdrawalRequests(userId);
      const pendingWithdrawalTotal = pendingWithdrawals
        .filter(wr => wr.status === 'pending' || wr.status === 'approved')
        .reduce((sum, wr) => sum + Number(wr.amount), 0);
      
      // Update or create the user balance record
      await this.updateUserBalance(userId, totalEarnings, pendingWithdrawalTotal);
      
      return {
        totalEarnings,
        pendingWithdrawals: pendingWithdrawalTotal,
      };
    } catch (error) {
      console.error('Error in calculateUserBalance:', error);
      return { totalEarnings: 0, pendingWithdrawals: 0 };
    }
  }
  
  async updateUserBalance(userId: number, totalEarnings: number, pendingWithdrawals: number): Promise<void> {
    try {
      // First check if the user already has a balance record
      const balanceResults = await db
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, userId));
      
      if (balanceResults.length > 0) {
        // Update existing record
        await db.update(userBalances)
          .set({
            totalEarnings: String(totalEarnings),
            pendingWithdrawals: String(pendingWithdrawals),
            lastUpdated: new Date()
          })
          .where(eq(userBalances.userId, userId));
      } else {
        // Create new record
        await db.insert(userBalances).values({
          userId,
          totalEarnings: String(totalEarnings),
          pendingWithdrawals: String(pendingWithdrawals),
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating user balance:', error);
    }
  }
  
  // Update the total earnings when a payment is created/updated
  async updateUserEarnings(userId: number, amountDelta: number): Promise<void> {
    try {
      // Get current balance
      const balance = await this.getUserBalance(userId);
      
      // Update with new total
      await this.updateUserBalance(
        userId, 
        balance.totalEarnings + amountDelta,
        balance.pendingWithdrawals
      );
    } catch (error) {
      console.error('Error in updateUserEarnings:', error);
    }
  }
  
  // Update pending withdrawals when a withdrawal request is created/updated
  async updateUserPendingWithdrawals(userId: number, amountDelta: number): Promise<void> {
    try {
      // Get current balance
      const balance = await this.getUserBalance(userId);
      
      // Update with new total
      const newPendingAmount = balance.pendingWithdrawals + amountDelta;
      // Don't allow negative pending withdrawals
      const finalPendingAmount = Math.max(0, newPendingAmount);
      
      await this.updateUserBalance(
        userId, 
        balance.totalEarnings,
        finalPendingAmount
      );
    } catch (error) {
      console.error('Error in updateUserPendingWithdrawals:', error);
    }
  }

  // Create a withdrawal request
}