import { users, categories, skills, userSkills, projects, projectSkills, proposals, messages, reviews, files, payments, notifications } from "@shared/schema";
import type { User, Category, Skill, Project, Proposal, Message, Review, File, Payment, Notification, InsertUser, InsertCategory, InsertSkill, InsertProject, InsertProposal, InsertReview, InsertFile, InsertMessage, InsertNotification } from "@shared/schema";
import type { Store as SessionStore } from "express-session";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, or, desc, asc, inArray, SQL } from "drizzle-orm";
import { pool } from "./db";
import { IStorage } from "./storage";

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
      .where(eq(users.username, username.toLowerCase()));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
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
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
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

  async createProject(project: InsertProject, clientId: number): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        clientId,
        status: 'open'
      })
      .returning();
    return newProject;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ status: status as any })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
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
    const [updatedProposal] = await db
      .update(proposals)
      .set({ status: status as any })
      .where(eq(proposals.id, id))
      .returning();
    return updatedProposal;
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

  // Review operations
  async getReviewsByUser(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.revieweeId, userId))
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
        await this.createCategory(category);
      }
    }
  }
}