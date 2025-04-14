import { users, categories, skills, userSkills, projects, projectSkills, proposals, messages, reviews, files, payments, notifications, verificationRequests, transactions } from "@shared/schema";
import type { User, Category, Skill, Project, Proposal, Message, Review, File, Payment, Notification, VerificationRequest, InsertUser, InsertCategory, InsertSkill, InsertProject, InsertProposal, InsertReview, InsertFile, InsertMessage, InsertNotification, InsertVerificationRequest } from "@shared/schema";
import type { Store as SessionStore } from "express-session";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, or, desc, asc, inArray, SQL } from "drizzle-orm";
import { pool } from "./db";
import { IStorage, PaymentData, CreatePaymentParams, CreateTransactionParams, Transaction } from "./storage";

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
        status: 'pending'
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
        await this.createCategory(category);
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
      description: payment.description ?? undefined
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
      description: payment.description ?? undefined
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
      username: row.username,
      amount: Number(row.payment.amount),
      projectId: row.payment.projectId ?? undefined,
      description: row.payment.description ?? undefined
    }));
  }

  async getUserPayments(userId: number): Promise<PaymentData[]> {
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId));
    
    return userPayments.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
      projectId: payment.projectId ?? undefined,
      description: payment.description ?? undefined
    }));
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
      description: transaction.description ?? undefined
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
      username: row.username,
      amount: Number(row.transaction.amount),
      description: row.transaction.description ?? undefined
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
      description: transaction.description ?? undefined
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
}