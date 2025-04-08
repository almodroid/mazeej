import { users, categories, skills, userSkills, projects, projectSkills, proposals, messages, reviews, files, payments, notifications, verificationRequests, skillAssessments, assessmentQuestions, userAssessments, userResponses } from "@shared/schema";
import type { User, Category, Skill, Project, Proposal, Message, Review, File, Payment, Notification, VerificationRequest, InsertUser, InsertCategory, InsertSkill, InsertProject, InsertProposal, InsertReview, InsertFile, InsertMessage, InsertNotification, InsertVerificationRequest, SkillAssessment, AssessmentQuestion, UserAssessment, UserResponse, InsertSkillAssessment, InsertAssessmentQuestion, InsertUserAssessment, InsertUserResponse } from "@shared/schema";
import type { Store as SessionStore } from "express-session";
import session from "express-session";
import createMemoryStore from "memorystore";
import { DatabaseStorage } from "./db-storage";

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getFreelancers(limit?: number): Promise<User[]>;
  getFreelancersByCategory(categoryId: number, limit?: number): Promise<User[]>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Skill operations
  getSkills(): Promise<Skill[]>;
  getSkillsByCategory(categoryId: number): Promise<Skill[]>;
  getUserSkills(userId: number): Promise<Skill[]>;
  addUserSkill(userId: number, skillId: number): Promise<void>;
  
  // Project operations
  getProjects(limit?: number): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  createProject(project: InsertProject, clientId: number): Promise<Project>;
  updateProjectStatus(id: number, status: string): Promise<Project | undefined>;
  
  // Proposal operations
  getProposalById(id: number): Promise<Proposal | undefined>;
  getProposalsByProject(projectId: number): Promise<Proposal[]>;
  getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal, freelancerId: number): Promise<Proposal>;
  updateProposalStatus(id: number, status: string): Promise<Proposal | undefined>;
  
  // Message operations
  getMessages(senderId: number, receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage, senderId: number): Promise<Message>;
  
  // Review operations
  getReviewsByUser(userId: number): Promise<Review[]>;
  createReview(review: InsertReview, reviewerId: number): Promise<Review>;
  
  // File operations
  uploadFile(file: InsertFile): Promise<File>;
  getFilesByUser(userId: number): Promise<File[]>;
  getFilesByProject(projectId: number): Promise<File[]>;
  
  // Notification operations
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Verification operations
  getVerificationRequests(status?: string): Promise<VerificationRequest[]>;
  getVerificationRequestsForUser(userId: number): Promise<VerificationRequest[]>;
  getVerificationRequestById(id: number): Promise<VerificationRequest | undefined>;
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  updateVerificationRequestStatus(id: number, status: string, reviewerId: number, reviewNotes?: string): Promise<VerificationRequest | undefined>;
  
  // Skill Assessment operations
  getSkillAssessments(skillId?: number): Promise<SkillAssessment[]>;
  getSkillAssessmentById(id: number): Promise<SkillAssessment | undefined>;
  createSkillAssessment(assessment: InsertSkillAssessment): Promise<SkillAssessment>;
  updateSkillAssessment(id: number, assessment: Partial<SkillAssessment>): Promise<SkillAssessment | undefined>;
  
  // Assessment Question operations
  getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]>;
  getAssessmentQuestionById(id: number): Promise<AssessmentQuestion | undefined>;
  createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion>;
  updateAssessmentQuestion(id: number, question: Partial<AssessmentQuestion>): Promise<AssessmentQuestion | undefined>;
  
  // User Assessment operations
  getUserAssessments(userId: number): Promise<UserAssessment[]>;
  getUserAssessmentById(id: number): Promise<UserAssessment | undefined>;
  createUserAssessment(assessment: InsertUserAssessment): Promise<UserAssessment>;
  updateUserAssessment(id: number, assessment: Partial<UserAssessment>): Promise<UserAssessment | undefined>;
  completeUserAssessment(id: number, score: number, skillLevel: string, timeSpentSeconds: number, aiEvaluation?: any): Promise<UserAssessment | undefined>;
  
  // User Response operations
  getUserResponses(userAssessmentId: number): Promise<UserResponse[]>;
  createUserResponse(response: InsertUserResponse): Promise<UserResponse>;
  updateUserResponseEvaluation(id: number, isCorrect: boolean, score: number, feedback?: string, aiEvaluation?: string): Promise<UserResponse | undefined>;
  
  // Session store
  sessionStore: SessionStore;
}

// Memory Storage Implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private skills: Map<number, Skill>;
  private userSkills: Map<number, { userId: number; skillId: number }>;
  private projects: Map<number, Project>;
  private projectSkills: Map<number, { projectId: number; skillId: number }>;
  private proposals: Map<number, Proposal>;
  private messages: Map<number, Message>;
  private reviews: Map<number, Review>;
  private files: Map<number, File>;
  private payments: Map<number, Payment>;
  private notifications: Map<number, Notification>;
  private verificationRequests: Map<number, VerificationRequest>;
  private skillAssessments: Map<number, SkillAssessment>;
  private assessmentQuestions: Map<number, AssessmentQuestion>;
  private userAssessments: Map<number, UserAssessment>;
  private userResponses: Map<number, UserResponse>;
  
  // Counters for generating IDs
  private userId: number = 1;
  private categoryId: number = 1;
  private skillId: number = 1;
  private userSkillId: number = 1;
  private projectId: number = 1;
  private projectSkillId: number = 1;
  private proposalId: number = 1;
  private messageId: number = 1;
  private reviewId: number = 1;
  private fileId: number = 1;
  private paymentId: number = 1;
  private notificationId: number = 1;
  private verificationRequestId: number = 1;
  private skillAssessmentId: number = 1;
  private assessmentQuestionId: number = 1;
  private userAssessmentId: number = 1;
  private userResponseId: number = 1;
  
  // Session store
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.skills = new Map();
    this.userSkills = new Map();
    this.projects = new Map();
    this.projectSkills = new Map();
    this.proposals = new Map();
    this.messages = new Map();
    this.reviews = new Map();
    this.files = new Map();
    this.payments = new Map();
    this.notifications = new Map();
    this.verificationRequests = new Map();
    this.skillAssessments = new Map();
    this.assessmentQuestions = new Map();
    this.userAssessments = new Map();
    this.userResponses = new Map();
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Seed initial categories
    this.seedCategories();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    
    // Ensure required fields are provided
    if (!insertUser.username || !insertUser.password || !insertUser.email || 
        !insertUser.fullName || !insertUser.role) {
      throw new Error('Missing required user fields');
    }
    
    // Handle nullable fields
    const bio = insertUser.bio === undefined ? null : insertUser.bio;
    const profileImage = insertUser.profileImage === undefined ? null : insertUser.profileImage;
    const country = insertUser.country === undefined ? null : insertUser.country;
    const city = insertUser.city === undefined ? null : insertUser.city;
    const phone = insertUser.phone === undefined ? null : insertUser.phone;
    const freelancerLevel = insertUser.freelancerLevel === undefined ? null : insertUser.freelancerLevel;
    const freelancerType = insertUser.freelancerType === undefined ? null : insertUser.freelancerType;
    const hourlyRate = insertUser.hourlyRate === undefined ? null : insertUser.hourlyRate;
    
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      fullName: insertUser.fullName,
      role: insertUser.role,
      bio,
      profileImage,
      country,
      city,
      phone,
      createdAt: now,
      isVerified: false,
      freelancerLevel,
      freelancerType,
      hourlyRate,
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getFreelancers(limit?: number): Promise<User[]> {
    const freelancers = Array.from(this.users.values()).filter(
      (user) => user.role === 'freelancer'
    );
    
    if (limit) {
      return freelancers.slice(0, limit);
    }
    return freelancers;
  }

  async getFreelancersByCategory(categoryId: number, limit?: number): Promise<User[]> {
    // Get all user skills for this category
    const categorySkills = Array.from(this.skills.values()).filter(
      (skill) => skill.categoryId === categoryId
    ).map(skill => skill.id);
    
    // Find users with these skills
    const userSkillEntries = Array.from(this.userSkills.values());
    const userIdsWithSkill = new Set<number>();
    
    userSkillEntries.forEach(entry => {
      if (categorySkills.includes(entry.skillId)) {
        userIdsWithSkill.add(entry.userId);
      }
    });
    
    // Get freelancers with these skills
    const freelancers = Array.from(this.users.values()).filter(
      (user) => user.role === 'freelancer' && userIdsWithSkill.has(user.id)
    );
    
    if (limit) {
      return freelancers.slice(0, limit);
    }
    return freelancers;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const freelancerCount = category.freelancerCount === undefined ? null : category.freelancerCount;
    
    const newCategory: Category = { 
      id, 
      name: category.name,
      icon: category.icon,
      freelancerCount
    };
    
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Skill operations
  async getSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }

  async getSkillsByCategory(categoryId: number): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(
      (skill) => skill.categoryId === categoryId
    );
  }

  async getUserSkills(userId: number): Promise<Skill[]> {
    const userSkillEntries = Array.from(this.userSkills.values()).filter(
      (entry) => entry.userId === userId
    );
    
    return userSkillEntries.map(entry => {
      const skill = this.skills.get(entry.skillId);
      if (!skill) throw new Error(`Skill with ID ${entry.skillId} not found`);
      return skill;
    });
  }

  async addUserSkill(userId: number, skillId: number): Promise<void> {
    const id = this.userSkillId++;
    this.userSkills.set(id, { userId, skillId });
  }

  // Project operations
  async getProjects(limit?: number): Promise<Project[]> {
    const allProjects = Array.from(this.projects.values());
    if (limit) {
      return allProjects.slice(0, limit);
    }
    return allProjects;
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientId === clientId
    );
  }

  async createProject(project: InsertProject, clientId: number): Promise<Project> {
    const id = this.projectId++;
    const now = new Date();
    const deadline = project.deadline === undefined ? null : project.deadline;
    
    const newProject: Project = {
      id,
      title: project.title,
      description: project.description,
      clientId,
      budget: project.budget,
      category: project.category,
      deadline,
      status: 'open',
      createdAt: now,
    };
    
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProjectStatus(id: number, status: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, status: status as any };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Proposal operations
  async getProposalById(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByProject(projectId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.projectId === projectId
    );
  }

  async getProposalsByFreelancer(freelancerId: number): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(
      (proposal) => proposal.freelancerId === freelancerId
    );
  }

  async createProposal(proposal: InsertProposal, freelancerId: number): Promise<Proposal> {
    const id = this.proposalId++;
    const now = new Date();
    const newProposal: Proposal = {
      ...proposal,
      id,
      freelancerId,
      status: 'pending',
      createdAt: now,
    };
    this.proposals.set(id, newProposal);
    return newProposal;
  }

  async updateProposalStatus(id: number, status: string): Promise<Proposal | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;
    
    const updatedProposal = { ...proposal, status: status as any };
    this.proposals.set(id, updatedProposal);
    return updatedProposal;
  }

  // Message operations
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === senderId && message.receiverId === receiverId) ||
        (message.senderId === receiverId && message.receiverId === senderId)
    ).sort((a, b) => {
      // Handle potential null values
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeA - timeB;
    });
  }

  async createMessage(message: InsertMessage, senderId: number): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    const newMessage: Message = {
      ...message,
      id,
      senderId,
      isRead: false,
      createdAt: now,
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  // Review operations
  async getReviewsByUser(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.revieweeId === userId
    );
  }

  async createReview(review: InsertReview, reviewerId: number): Promise<Review> {
    const id = this.reviewId++;
    const now = new Date();
    const comment = review.comment === undefined ? null : review.comment;
    
    const newReview: Review = {
      id,
      projectId: review.projectId,
      reviewerId,
      revieweeId: review.revieweeId,
      rating: review.rating,
      comment,
      createdAt: now,
    };
    
    this.reviews.set(id, newReview);
    return newReview;
  }

  // File operations
  async uploadFile(file: InsertFile): Promise<File> {
    const id = this.fileId++;
    const now = new Date();
    const projectId = file.projectId === undefined ? null : file.projectId;
    
    const newFile: File = {
      id,
      userId: file.userId,
      projectId,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: now,
    };
    
    this.files.set(id, newFile);
    return newFile;
  }

  async getFilesByUser(userId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId
    );
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.projectId === projectId
    );
  }

  // Notification operations
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => {
        // Sort by creation time, newest first
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const now = new Date();
    const relatedId = notification.relatedId === undefined ? null : notification.relatedId;

    const newNotification: Notification = {
      id,
      userId: notification.userId,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      isRead: false,
      relatedId,
      createdAt: now,
    };
    
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Verification operations
  async getVerificationRequests(status?: string): Promise<VerificationRequest[]> {
    let requests = Array.from(this.verificationRequests.values());
    
    if (status) {
      requests = requests.filter(request => request.status === status);
    }
    
    // Sort by submission date, newest first
    return requests.sort((a, b) => {
      const timeA = a.submittedAt ? a.submittedAt.getTime() : 0;
      const timeB = b.submittedAt ? b.submittedAt.getTime() : 0;
      return timeB - timeA;
    });
  }

  async getVerificationRequestsForUser(userId: number): Promise<VerificationRequest[]> {
    return Array.from(this.verificationRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => {
        const timeA = a.submittedAt ? a.submittedAt.getTime() : 0;
        const timeB = b.submittedAt ? b.submittedAt.getTime() : 0;
        return timeB - timeA;
      });
  }

  async getVerificationRequestById(id: number): Promise<VerificationRequest | undefined> {
    return this.verificationRequests.get(id);
  }

  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const id = this.verificationRequestId++;
    const now = new Date();
    const additionalInfo = request.additionalInfo === undefined ? null : request.additionalInfo;
    
    const newRequest: VerificationRequest = {
      id,
      userId: request.userId,
      documentType: request.documentType,
      documentUrl: request.documentUrl,
      additionalInfo,
      status: 'pending',
      reviewerId: null,
      reviewNotes: null,
      submittedAt: now,
      reviewedAt: null,
    };
    
    this.verificationRequests.set(id, newRequest);
    return newRequest;
  }

  async updateVerificationRequestStatus(
    id: number, 
    status: string, 
    reviewerId: number, 
    reviewNotes?: string
  ): Promise<VerificationRequest | undefined> {
    const request = this.verificationRequests.get(id);
    if (!request) return undefined;
    
    const now = new Date();
    const notes = reviewNotes === undefined ? null : reviewNotes;
    
    const updatedRequest: VerificationRequest = {
      ...request,
      status: status as any,
      reviewerId,
      reviewNotes: notes,
      reviewedAt: now,
    };
    
    this.verificationRequests.set(id, updatedRequest);
    
    // If approved, update the user's verification status
    if (status === 'approved') {
      const user = this.users.get(request.userId);
      if (user) {
        this.updateUser(user.id, { isVerified: true });
      }
    }
    
    return updatedRequest;
  }

  // Skill Assessment operations
  async getSkillAssessments(skillId?: number): Promise<SkillAssessment[]> {
    let assessments = Array.from(this.skillAssessments.values());
    
    if (skillId) {
      assessments = assessments.filter(assessment => assessment.skillId === skillId);
    }
    
    return assessments;
  }

  async getSkillAssessmentById(id: number): Promise<SkillAssessment | undefined> {
    return this.skillAssessments.get(id);
  }

  async createSkillAssessment(assessment: InsertSkillAssessment): Promise<SkillAssessment> {
    const id = this.skillAssessmentId++;
    const now = new Date();
    
    const newAssessment: SkillAssessment = {
      id,
      skillId: assessment.skillId,
      title: assessment.title,
      description: assessment.description,
      difficulty: assessment.difficulty,
      durationMinutes: assessment.durationMinutes,
      passingScore: assessment.passingScore,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      aiModel: assessment.aiModel,
    };
    
    this.skillAssessments.set(id, newAssessment);
    return newAssessment;
  }

  async updateSkillAssessment(id: number, assessment: Partial<SkillAssessment>): Promise<SkillAssessment | undefined> {
    const existingAssessment = this.skillAssessments.get(id);
    if (!existingAssessment) return undefined;
    
    const now = new Date();
    const updatedAssessment = { 
      ...existingAssessment, 
      ...assessment,
      updatedAt: now 
    };
    
    this.skillAssessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  // Assessment Question operations
  async getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]> {
    return Array.from(this.assessmentQuestions.values())
      .filter(question => question.assessmentId === assessmentId);
  }

  async getAssessmentQuestionById(id: number): Promise<AssessmentQuestion | undefined> {
    return this.assessmentQuestions.get(id);
  }

  async createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const id = this.assessmentQuestionId++;
    const now = new Date();
    
    const options = question.options === undefined ? null : question.options;
    const correctAnswer = question.correctAnswer === undefined ? null : question.correctAnswer;
    const codeTemplate = question.codeTemplate === undefined ? null : question.codeTemplate;
    const scoreWeight = question.scoreWeight === undefined ? null : question.scoreWeight;
    const testCases = question.testCases === undefined ? null : question.testCases;
    const evaluationCriteria = question.evaluationCriteria === undefined ? null : question.evaluationCriteria;
    const aiPrompt = question.aiPrompt === undefined ? null : question.aiPrompt;
    
    const newQuestion: AssessmentQuestion = {
      id,
      assessmentId: question.assessmentId,
      question: question.question,
      type: question.type,
      options,
      correctAnswer,
      scoreWeight,
      codeTemplate,
      testCases,
      evaluationCriteria,
      aiPrompt,
      createdAt: now,
    };
    
    this.assessmentQuestions.set(id, newQuestion);
    return newQuestion;
  }

  async updateAssessmentQuestion(id: number, question: Partial<AssessmentQuestion>): Promise<AssessmentQuestion | undefined> {
    const existingQuestion = this.assessmentQuestions.get(id);
    if (!existingQuestion) return undefined;
    
    const now = new Date();
    const updatedQuestion = { 
      ...existingQuestion, 
      ...question,
      updatedAt: now 
    };
    
    this.assessmentQuestions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  // User Assessment operations
  async getUserAssessments(userId: number): Promise<UserAssessment[]> {
    return Array.from(this.userAssessments.values())
      .filter(assessment => assessment.userId === userId)
      .sort((a, b) => {
        const timeA = a.startedAt ? a.startedAt.getTime() : 0;
        const timeB = b.startedAt ? b.startedAt.getTime() : 0;
        return timeB - timeA; // Sort by start time, newest first
      });
  }

  async getUserAssessmentById(id: number): Promise<UserAssessment | undefined> {
    return this.userAssessments.get(id);
  }

  async createUserAssessment(assessment: InsertUserAssessment): Promise<UserAssessment> {
    const id = this.userAssessmentId++;
    const now = new Date();
    
    const newAssessment: UserAssessment = {
      id,
      userId: assessment.userId,
      assessmentId: assessment.assessmentId,
      status: 'in_progress',
      score: null,
      skillLevel: null,
      startedAt: now,
      completedAt: null,
      timeSpentSeconds: null,
      aiEvaluation: null,
      certificateUrl: null,
    };
    
    this.userAssessments.set(id, newAssessment);
    return newAssessment;
  }

  async updateUserAssessment(id: number, assessment: Partial<UserAssessment>): Promise<UserAssessment | undefined> {
    const existingAssessment = this.userAssessments.get(id);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment = { ...existingAssessment, ...assessment };
    this.userAssessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  async completeUserAssessment(id: number, score: number, skillLevel: string, timeSpentSeconds: number, aiEvaluation?: any): Promise<UserAssessment | undefined> {
    const assessment = this.userAssessments.get(id);
    if (!assessment) return undefined;
    
    const now = new Date();
    const updatedAssessment: UserAssessment = {
      ...assessment,
      status: 'completed',
      score,
      skillLevel: skillLevel as any,
      completedAt: now,
      timeSpentSeconds,
      aiEvaluation: aiEvaluation || null,
      certificateUrl: score >= 70 ? `/certificates/${assessment.id}.pdf` : null
    };
    
    this.userAssessments.set(id, updatedAssessment);
    
    // If user passed the assessment, add the skill to their profile
    if (score >= 70) { // Arbitrary passing threshold
      const skillAssessment = this.skillAssessments.get(assessment.assessmentId);
      if (skillAssessment) {
        // Check if user already has this skill
        const userSkills = await this.getUserSkills(assessment.userId);
        const hasSkill = userSkills.some(skill => skill.id === skillAssessment.skillId);
        
        if (!hasSkill) {
          await this.addUserSkill(assessment.userId, skillAssessment.skillId);
          
          // Create a notification that the user has earned a new skill
          const skill = this.skills.get(skillAssessment.skillId);
          if (skill) {
            await this.createNotification({
              userId: assessment.userId,
              title: "مهارة جديدة",
              content: `لقد اكتسبت مهارة جديدة: ${skill.name}`,
              type: 'admin' as any, // Using admin type as placeholder for achievement
              relatedId: skill.id
            });
          }
        }
      }
    }
    
    return updatedAssessment;
  }

  // User Response operations
  async getUserResponses(userAssessmentId: number): Promise<UserResponse[]> {
    return Array.from(this.userResponses.values())
      .filter(response => response.userAssessmentId === userAssessmentId);
  }

  async createUserResponse(response: InsertUserResponse): Promise<UserResponse> {
    const id = this.userResponseId++;
    const now = new Date();
    
    const newResponse: UserResponse = {
      id,
      userAssessmentId: response.userAssessmentId,
      questionId: response.questionId,
      response: response.response,
      responseTime: response.responseTime || null,
      submittedAt: now,
      isCorrect: null,
      score: null,
      feedback: null,
      aiEvaluation: null,
    };
    
    this.userResponses.set(id, newResponse);
    return newResponse;
  }

  async updateUserResponseEvaluation(id: number, isCorrect: boolean, score: number, feedback?: string, aiEvaluation?: string): Promise<UserResponse | undefined> {
    const response = this.userResponses.get(id);
    if (!response) return undefined;
    
    const feedbackText = feedback === undefined ? null : feedback;
    const aiEval = aiEvaluation === undefined ? null : aiEvaluation;
    
    const updatedResponse: UserResponse = {
      ...response,
      isCorrect,
      score,
      feedback: feedbackText,
      aiEvaluation: aiEval,
    };
    
    this.userResponses.set(id, updatedResponse);
    return updatedResponse;
  }

  // Seed categories
  private seedCategories() {
    const categories: InsertCategory[] = [
      { name: "برمجة وتطوير", icon: "laptop-code", freelancerCount: 2500 },
      { name: "تصميم وفنون", icon: "paint-brush", freelancerCount: 1800 },
      { name: "تسويق ومبيعات", icon: "bullhorn", freelancerCount: 1200 },
      { name: "كتابة وترجمة", icon: "pen", freelancerCount: 950 },
      { name: "صوتيات ومرئيات", icon: "video", freelancerCount: 750 },
      { name: "استشارات وأعمال", icon: "chart-line", freelancerCount: 680 }
    ];
    
    categories.forEach(category => {
      this.createCategory(category);
    });
  }
}

// Use the DatabaseStorage implementation since we have a database
export const storage = new DatabaseStorage();