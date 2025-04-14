import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { setupWebSocketServer } from "./chat";
import { insertProjectSchema, insertProposalSchema, insertReviewSchema, insertNotificationSchema, insertVerificationRequestSchema } from "@shared/schema";
import { generateZoomToken, createZoomMeeting, type ZoomMeetingOptions } from "./zoom";
import { z } from "zod";
import fs from "fs";
import crypto from "crypto";
import { eq, and, or, desc } from "drizzle-orm";

// Define upload directories
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'documents');
const PROJECT_FILES_DIR = path.join(UPLOADS_DIR, 'projects');

// Ensure directories exist
[UPLOADS_DIR, AVATARS_DIR, DOCUMENTS_DIR, PROJECT_FILES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const createMulterStorage = (destination: string) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destination);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
};

// Multer instances
const avatarUpload = multer({
  storage: createMulterStorage(AVATARS_DIR),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for avatars
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

const documentUpload = multer({
  storage: createMulterStorage(DOCUMENTS_DIR),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for documents
});

const projectFileUpload = multer({
  storage: createMulterStorage(PROJECT_FILES_DIR),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for project files
});

// Generic file upload (deprecated or for other types)
const genericUpload = multer({
  storage: createMulterStorage(UPLOADS_DIR),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export function registerRoutes(app: Express): Server {
  // Serve uploaded files statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for chat
  setupWebSocketServer(httpServer);
  
  // Messages API Routes
  
  // Get user conversations
  app.get('/api/conversations', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to access conversations' });
    }
    
    try {
      const userId = req.user.id;
      
      // Get all messages for this user using the storage API
      const userMessages = await storage.getAllUserMessages(userId);
      
      if (!userMessages || userMessages.length === 0) {
        return res.json([]);
      }
      
      // Extract unique conversation partners
      const conversationPartners = new Set<number>();
      userMessages.forEach(msg => {
        if (msg.senderId === userId) {
          conversationPartners.add(msg.receiverId);
        } else {
          conversationPartners.add(msg.senderId);
        }
      });
      
      // Get conversation data for each partner
      const conversations = [];
      for (const partnerId of Array.from(conversationPartners)) {
        // Get the latest message for this conversation
        const latestMessage = userMessages.find(msg => 
          (msg.senderId === userId && msg.receiverId === partnerId) || 
          (msg.senderId === partnerId && msg.receiverId === userId)
        );
        
        if (!latestMessage) continue;
        
        // Count unread messages in this conversation
        const unreadCount = userMessages.filter(msg => 
          msg.senderId === partnerId && 
          msg.receiverId === userId && 
          msg.isRead === false
        ).length;
        
        // Get the partner's user details
        const partner = await storage.getUser(partnerId);
        if (!partner) continue;
        
        const { password, ...partnerWithoutPassword } = partner;
        
        conversations.push({
          id: `conv-${userId}-${partnerId}`,
          participantId: partnerId,
          participantName: partner.fullName || partner.username,
          participantAvatar: partner.profileImage || "",
          lastMessage: latestMessage.content,
          timestamp: latestMessage.createdAt,
          unreadCount: unreadCount,
          participant: partnerWithoutPassword
        });
      }
      
      // Sort conversations by timestamp (most recent first)
      conversations.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      
      res.json(conversations);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Get messages between two users
  app.get('/api/messages/:partnerId', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to access messages' });
    }
    
    try {
      const userId = req.user.id;
      const partnerId = parseInt(req.params.partnerId);
      
      if (isNaN(partnerId)) {
        return res.status(400).json({ message: 'Invalid partner ID' });
      }
      
      // Get messages between users
      const messages = await storage.getMessages(userId, partnerId);
      
      // Mark received messages as read
      if (messages.length > 0) {
        // Get IDs of unread messages
        const unreadMessageIds = messages
          .filter(msg => msg.senderId === partnerId && msg.isRead === false)
          .map(msg => msg.id);
          
        if (unreadMessageIds.length > 0) {
          // Mark messages as read
          for (const msgId of unreadMessageIds) {
            await storage.markMessageAsRead(msgId);
          }
        }
      }
      
      res.json(messages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Send a message
  app.post('/api/messages', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to send messages' });
    }
    
    try {
      const userId = req.user.id;
      const { receiverId, content } = req.body;
      
      if (!receiverId || !content?.trim()) {
        return res.status(400).json({ message: 'Receiver ID and content are required' });
      }
      
      // Validate receiverId is a number
      const receiverIdNum = parseInt(receiverId);
      if (isNaN(receiverIdNum)) {
        return res.status(400).json({ message: 'Invalid receiver ID' });
      }
      
      // Validate receiver exists
      const receiver = await storage.getUser(receiverIdNum);
      if (!receiver) {
        return res.status(404).json({ message: 'Receiver not found' });
      }
      
      // Create the message
      const message = await storage.createMessage({
        receiverId: receiverIdNum,
        content: content.trim()
      }, userId);
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });
  
  // Get user by ID
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Ensure profileImage path starts with /uploads/avatars if it exists
      if (user.profileImage && !user.profileImage.startsWith('/uploads/avatars/')) {
        // Attempt to correct path (assuming it might be just filename or old path)
        const filename = path.basename(user.profileImage);
        user.profileImage = `/uploads/avatars/${filename}`;
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });
  
  // Update Saudi freelancer profile images with Saudi profile images
  app.post('/api/update-saudi-profile-images', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can update profile images' });
      }
      
      // Saudi profile images from attached assets
      const saudiProfileImages = [
        'attached_assets/IMG_2279.jpeg',
        'attached_assets/IMG_2280.jpeg',
        'attached_assets/IMG_2283.jpeg',
        'attached_assets/IMG_2285.jpeg', 
        'attached_assets/IMG_2287.jpeg',
        'attached_assets/IMG_2288.jpeg',
        'attached_assets/IMG_2289.jpeg',
        'attached_assets/IMG_2290.jpeg',
        'attached_assets/IMG_0724.jpeg',
        'attached_assets/IMG_0726.jpeg'
      ];
      
      // Get all freelancers
      const freelancers = await storage.getFreelancers();
      const updatedFreelancers = [];
      
      // Update each freelancer with a random Saudi profile image
      for (let i = 0; i < freelancers.length; i++) {
        const freelancer = freelancers[i];
        const randomImageIndex = Math.floor(Math.random() * saudiProfileImages.length);
        const profileImage = saudiProfileImages[randomImageIndex];
        
        const updatedFreelancer = await storage.updateUser(freelancer.id, { profileImage });
        if (updatedFreelancer) {
          const { password, ...freelancerWithoutPassword } = updatedFreelancer;
          updatedFreelancers.push(freelancerWithoutPassword);
        }
      }
      
      res.status(200).json({ 
        message: 'Saudi profile images updated successfully', 
        count: updatedFreelancers.length,
        updatedFreelancers 
      });
    } catch (error: any) {
      console.error('Error updating Saudi profile images:', error);
      res.status(500).json({ message: 'Failed to update profile images', error: error.message });
    }
  });
  
  // Create test accounts route - for development only
  app.post('/api/create-test-accounts', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create test accounts' });
      }
      // Check if users already exist to avoid duplicates
      const adminExists = await storage.getUserByEmail('almodroid@gmail.com');
      const clientExists = await storage.getUserByEmail('client@example.com');
      const contentCreatorExists = await storage.getUserByEmail('creator@example.com');
      const expertExists = await storage.getUserByEmail('expert@example.com');
      
      const results = [];
      
      // Create admin user if it doesn't exist
      if (!adminExists) {
        const adminUser = await storage.createUser({
          username: 'almodroid',
          password: await hashPassword('123456'),
          email: 'almodroid@gmail.com',
          fullName: 'Admin User',
          role: 'admin',
          bio: 'مدير منصة مع صلاحيات كاملة للنظام',
          country: 'Saudi Arabia',
          city: 'Riyadh',
          profileImage: 'attached_assets/IMG_2290.jpeg',
          confirmPassword: '123456'
        });
        const { password, ...adminWithoutPassword } = adminUser;
        results.push({ type: 'admin', user: adminWithoutPassword });
      } else {
        results.push({ type: 'admin', message: 'Admin user already exists' });
      }
      
      // Create client user if it doesn't exist
      if (!clientExists) {
        const clientUser = await storage.createUser({
          username: 'client',
          password: await hashPassword('123456'),
          email: 'client@example.com',
          fullName: 'عبدالله العتيبي',
          role: 'client',
          bio: 'صاحب أعمال يبحث عن مستقلين موهوبين لتنفيذ مشاريع متنوعة',
          country: 'Saudi Arabia',
          city: 'Riyadh',
          profileImage: 'attached_assets/IMG_2283.jpeg',
          confirmPassword: '123456'
        });
        const { password, ...clientWithoutPassword } = clientUser;
        results.push({ type: 'client', user: clientWithoutPassword });
      } else {
        results.push({ type: 'client', message: 'Client user already exists' });
      }
      
      // Create content creator user if it doesn't exist
      if (!contentCreatorExists) {
        const creatorUser = await storage.createUser({
          username: 'creator',
          password: await hashPassword('123456'),
          email: 'creator@example.com',
          fullName: 'محمد الشمري',
          role: 'freelancer',
          bio: 'خبير في إنشاء المحتوى الرقمي والتصميم البصري',
          freelancerType: 'content_creator',
          freelancerLevel: 'intermediate',
          hourlyRate: 50,
          country: 'Saudi Arabia',
          city: 'Riyadh',
          profileImage: 'attached_assets/IMG_2279.jpeg',
          confirmPassword: '123456'
        });
        const { password, ...creatorWithoutPassword } = creatorUser;
        results.push({ type: 'content_creator', user: creatorWithoutPassword });
      } else {
        results.push({ type: 'content_creator', message: 'Content creator already exists' });
      }
      
      // Create expert user if it doesn't exist
      if (!expertExists) {
        const expertUser = await storage.createUser({
          username: 'expert',
          password: await hashPassword('123456'),
          email: 'expert@example.com',
          fullName: 'سامي الفيصل',
          role: 'freelancer',
          bio: 'خبير استشاري مع أكثر من 10 سنوات خبرة في مجال تطوير الأعمال والبرمجة',
          freelancerType: 'expert',
          freelancerLevel: 'advanced',
          hourlyRate: 100,
          country: 'Saudi Arabia',
          city: 'Jeddah',
          profileImage: 'attached_assets/IMG_2280.jpeg',
          confirmPassword: '123456'
        });
        const { password, ...expertWithoutPassword } = expertUser;
        results.push({ type: 'expert', user: expertWithoutPassword });
      } else {
        results.push({ type: 'expert', message: 'Expert user already exists' });
      }
      
      res.status(201).json({ message: 'Test accounts created successfully', results });
    } catch (error: any) {
      console.error('Error creating test accounts:', error);
      res.status(500).json({ message: 'Failed to create test accounts', error: error.message });
    }
  });

  // Categories Routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Freelancers Routes
  app.get('/api/freelancers', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      let freelancers;
      if (categoryId) {
        freelancers = await storage.getFreelancersByCategory(categoryId, limit);
      } else {
        freelancers = await storage.getFreelancers(limit);
      }
      
      // Remove passwords from response
      const sanitizedFreelancers = freelancers.map(({ password, ...rest }) => rest);
      res.json(sanitizedFreelancers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch freelancers' });
    }
  });

  // Projects Routes
  app.get('/api/projects', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const projects = await storage.getProjects(limit);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  app.post('/api/projects', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'client') {
        return res.status(403).json({ message: 'Only clients can create projects' });
      }

      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData, req.user.id);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create project' });
    }
  });

  app.patch('/api/projects/:id/status', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const projectId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // Get the project
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check authorization
      if (project.clientId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      const updatedProject = await storage.updateProjectStatus(projectId, status);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update project status' });
    }
  });

  // Proposals Routes
  app.get('/api/projects/:id/proposals', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const projectId = parseInt(req.params.id);
      
      // Get the project
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check authorization (only project owner or admin can see proposals)
      if (project.clientId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view these proposals' });
      }
      
      const proposals = await storage.getProposalsByProject(projectId);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch proposals' });
    }
  });

  app.post('/api/projects/:id/proposals', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Only freelancers can submit proposals' });
      }

      const projectId = parseInt(req.params.id);
      
      // Check if the project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Validate proposal data
      const validatedData = insertProposalSchema.parse({
        ...req.body,
        projectId
      });
      
      // Create the proposal
      const proposal = await storage.createProposal(validatedData, req.user.id);
      
      // Send notification to the project owner
      try {
        const freelancer = await storage.getUser(req.user.id);
        if (freelancer) {
          await storage.createNotification({
            userId: project.clientId,
            title: 'عرض جديد على مشروعك',
            content: `تلقى مشروعك "${project.title}" عرضًا جديدًا من ${freelancer.fullName || freelancer.username}`,
            type: 'proposal',
            relatedId: proposal.id
          });
        }
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
      
      res.status(201).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create proposal' });
    }
  });

  app.patch('/api/proposals/:id/status', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const proposalId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // Get the proposal
      const proposal = await storage.getProposalById(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      
      // Get the project to check ownership
      const project = await storage.getProjectById(proposal.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check authorization (only project owner can update proposal status)
      if (project.clientId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this proposal' });
      }
      
      const updatedProposal = await storage.updateProposalStatus(proposalId, status);
      
      // If accepting a proposal, update project status to in_progress
      if (status === 'accepted') {
        await storage.updateProjectStatus(proposal.projectId, 'in_progress');
        
        // Reject all other proposals for this project
        const otherProposals = await storage.getProposalsByProject(proposal.projectId);
        for (const otherProposal of otherProposals) {
          if (otherProposal.id !== proposalId && otherProposal.status === 'pending') {
            await storage.updateProposalStatus(otherProposal.id, 'rejected');
            
            // Send rejection notification to freelancer
            await storage.createNotification({
              userId: otherProposal.freelancerId,
              title: 'تم رفض عرضك',
              content: `تم رفض عرضك للمشروع "${project.title}"`,
              type: 'proposal',
              relatedId: project.id
            });
          }
        }
        
        // Send acceptance notification to the freelancer
        await storage.createNotification({
          userId: proposal.freelancerId,
          title: 'تم قبول عرضك!',
          content: `تم قبول عرضك للمشروع "${project.title}". يمكنك الآن التواصل مع العميل.`,
          type: 'proposal',
          relatedId: project.id
        });
        
        // Add a chat notification so the client and freelancer can start chatting
        const client = await storage.getUser(project.clientId);
        const freelancer = await storage.getUser(proposal.freelancerId);
        
        if (client && freelancer) {
          // Notify client about chat availability
          await storage.createNotification({
            userId: client.id,
            title: 'يمكنك البدء بالمحادثة',
            content: `يمكنك الآن التواصل مع ${freelancer.fullName || freelancer.username} لمناقشة تفاصيل المشروع "${project.title}"`,
            type: 'message',
            relatedId: freelancer.id
          });
        }
      } else if (status === 'rejected') {
        // Send rejection notification to freelancer
        await storage.createNotification({
          userId: proposal.freelancerId,
          title: 'تم رفض عرضك',
          content: `تم رفض عرضك للمشروع "${project.title}"`,
          type: 'proposal',
          relatedId: project.id
        });
      }
      
      res.json(updatedProposal);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update proposal status' });
    }
  });

  // Update a proposal (PUT /api/proposals/:id)
  app.put('/api/proposals/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const proposalId = parseInt(req.params.id);
      
      // Get the proposal
      const proposal = await storage.getProposalById(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      
      // Check if the user is the owner of the proposal
      if (proposal.freelancerId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this proposal' });
      }
      
      // Check if the proposal is not in 'pending' status
      if (proposal.status !== 'pending') {
        return res.status(400).json({ message: 'Can only edit pending proposals' });
      }
      
      // Update the proposal
      const updatedProposal = await storage.updateProposal(proposalId, req.body);
      res.json(updatedProposal);
    } catch (error: any) {
      console.error('Error updating proposal:', error);
      res.status(500).json({ message: 'Failed to update proposal' });
    }
  });

  // Delete a proposal (DELETE /api/proposals/:id)
  app.delete('/api/proposals/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const proposalId = parseInt(req.params.id);
      
      // Get the proposal
      const proposal = await storage.getProposalById(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      
      // Check if the user is the owner of the proposal
      if (proposal.freelancerId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this proposal' });
      }
      
      // Check if the proposal is not in 'pending' status
      if (proposal.status !== 'pending') {
        return res.status(400).json({ message: 'Can only delete pending proposals' });
      }
      
      // Delete the proposal
      const deleted = await storage.deleteProposal(proposalId);
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: 'Failed to delete proposal' });
      }
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      res.status(500).json({ message: 'Failed to delete proposal' });
    }
  });

  // Reviews Routes
  app.post('/api/projects/:id/reviews', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const projectId = parseInt(req.params.id);
      
      // Check if the project exists and is completed
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.status !== 'completed') {
        return res.status(400).json({ message: 'Can only review completed projects' });
      }
      
      // Check if user is related to this project
      if (project.clientId !== req.user.id && req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Not authorized to review this project' });
      }
      
      // Find the accepted proposal to get the freelancer ID
      const proposals = await storage.getProposalsByProject(projectId);
      const acceptedProposal = proposals.find(p => p.status === 'accepted');
      
      if (!acceptedProposal) {
        return res.status(400).json({ message: 'No accepted proposal found for this project' });
      }
      
      // Determine reviewee (if client is reviewing, reviewee is freelancer and vice versa)
      let revieweeId;
      if (req.user.id === project.clientId) {
        revieweeId = acceptedProposal.freelancerId;
      } else if (req.user.id === acceptedProposal.freelancerId) {
        revieweeId = project.clientId;
      } else {
        return res.status(403).json({ message: 'Not authorized to review this project' });
      }
      
      // Validate review data
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        projectId,
        revieweeId
      });
      
      // Create the review
      const review = await storage.createReview(validatedData, req.user.id);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create review' });
    }
  });

  app.get('/api/users/:id/reviews', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  });

  // --- File Upload Routes ---

  // Upload Avatar Route
  app.post('/api/upload/avatar', avatarUpload.single('avatar'), async (req, res) => {
    try {
      console.log('Avatar upload request received');
      
      if (!req.isAuthenticated()) {
        console.log('Authentication check failed');
        return res.status(401).json({ message: 'Authentication required' });
      }

      console.log('Authentication successful, user:', req.user.id);

      if (!req.file) {
        console.log('No file uploaded or file rejected by multer');
        return res.status(400).json({ message: 'No avatar file uploaded or file type not allowed' });
      }
      
      console.log('File uploaded successfully:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      // Verify the file was actually saved
      const fullPath = path.join(AVATARS_DIR, req.file.filename);
      if (!fs.existsSync(fullPath)) {
        console.error(`File was not saved properly. Path does not exist: ${fullPath}`);
        return res.status(500).json({ message: 'File upload failed - file not saved' });
      }
      
      console.log(`File exists at ${fullPath}`);
      
      // Return the path to the uploaded avatar
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      console.log(`Returning avatar path: ${avatarPath}`);
      
      // Save the file metadata to the database
      try {
        const fileData = {
          userId: req.user.id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        };
        
        // Only call storage.uploadFile if it exists and we need to track files in the DB
        if (typeof storage.uploadFile === 'function') {
          const savedFile = await storage.uploadFile(fileData);
          console.log('File metadata saved to database');
        }
      } catch (dbError) {
        // Log the error but continue - we don't want to fail the upload if DB save fails
        console.error('Error saving file metadata to database:', dbError);
      }
      
      // Return success response
      res.status(201).json({ filePath: avatarPath });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      
      if (error instanceof multer.MulterError) {
        console.error('Multer error:', error.code, error.field);
        return res.status(400).json({ message: `Multer error: ${error.message}`, code: error.code });
      } else if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: error.message });
      }
      
      // For any other errors
      console.error('Unexpected error during avatar upload:', error);
      res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
    }
  });

  // Upload Verification Document Route (Uses documentUpload middleware)
  app.post('/api/verification-requests', documentUpload.single('document'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        // Delete uploaded file if authentication fails
        if (req.file) fs.unlinkSync(req.file.path); 
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // ... (rest of verification request logic) ...

      // Handle file upload - use the correct path
      if (!req.file) {
        return res.status(400).json({ message: 'Document file is required' });
      }
      const documentUrl = `/uploads/documents/${req.file.filename}`;

      // Save file record (optional, if you need metadata in db)
      // const file = await storage.uploadFile({ ... });

      // Create verification request
      const requestData = {
        userId: req.user.id,
        documentType: req.body.documentType,
        documentUrl: documentUrl, // Use the correct path
        additionalInfo: req.body.additionalInfo
      };

      // ... (rest of the function, validation, saving, notifications) ...
      const validatedData = insertVerificationRequestSchema.parse(requestData);
      const verificationRequest = await storage.createVerificationRequest(validatedData);

      // ... (notifications) ...

      res.status(201).json(verificationRequest);
    } catch (error: any) {
      // Delete uploaded file if validation or other errors occur
      if (req.file) fs.unlinkSync(req.file.path); 
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating verification request:', error);
      res.status(500).json({ message: 'Failed to create verification request', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Upload Project Files Route (Uses projectFileUpload middleware)
  app.post('/api/projects/:id/files', projectFileUpload.array('files'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        // Delete uploaded files if auth fails
        if (req.files) (req.files as Express.Multer.File[]).forEach(f => fs.unlinkSync(f.path));
        return res.status(401).json({ message: 'Authentication required' });
      }

      const projectId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // ... (project and permission checks) ...

      const uploadedFiles = req.files as Express.Multer.File[];
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const savedFiles = [];
      for (const file of uploadedFiles) {
        const filePath = `/uploads/projects/${file.filename}`; 
        const fileData = {
          userId,
          projectId,
          filename: file.filename, // Store just the filename
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          filePath: filePath // Store the full path for easy retrieval
        };

        // Assuming storage.uploadFile saves this data to DB
        const savedFile = await storage.uploadFile(fileData); 
        savedFiles.push({ ...savedFile, url: filePath }); // Return URL too
      }

      res.status(201).json(savedFiles);
    } catch (error: any) {
      // Delete uploaded files on error
      if (req.files) (req.files as Express.Multer.File[]).forEach(f => fs.unlinkSync(f.path));
      console.error('Error uploading project files:', error);
      res.status(500).json({ message: 'Failed to upload files', error: error.message });
    }
  });
  
  // Generic File Upload Route (Consider removing or restricting)
  // Keep the old /api/upload for now, but maybe phase it out
  app.post('/api/upload', genericUpload.single('file'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
         if (req.file) fs.unlinkSync(req.file.path);
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Save metadata (adjust path as needed)
      const filePath = `/uploads/${req.file.filename}`;
      const fileData = {
        userId: req.user.id,
        projectId: req.body.projectId ? parseInt(req.body.projectId) : null,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filePath: filePath
      };
      
      // const savedFile = await storage.uploadFile(fileData);
      // For now, just return the path
      res.status(201).json({ filePath: filePath /*, file: savedFile */ });
    } catch (error: any) {
       if (req.file) fs.unlinkSync(req.file.path);
       console.error('Error uploading generic file:', error);
       res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // User Profile Update Route - Accepts profileImage path
  app.patch('/api/users/profile', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Fields that are allowed to be updated
      const allowedFields = [
        'fullName', 'bio', 'profileImage', 'country', 'city', 
        'phone', 'hourlyRate', 'freelancerLevel', 'freelancerType'
      ];
      
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field === 'profileImage' && req.body[field] && !req.body[field].startsWith('/uploads/avatars/')) {
            console.warn(`Invalid profile image path received: ${req.body[field]}`);
            continue;
          }
          updateData[field] = req.body[field];
        }
      }
      
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
  });
  
   // Get file for download
   app.get('/api/files/:id/download', async (req, res) => {
     try {
       // Optional: Add auth check if files aren't public
       // if (!req.isAuthenticated()) { 
       //   return res.status(401).json({ message: 'Authentication required' });
       // }
       
       const fileId = parseInt(req.params.id);
       const file = await storage.getFileById(fileId); // Fetch the file record
       
       // Check if file record and filename exist
       if (!file || !file.filename) { 
         return res.status(404).json({ message: 'File record not found or filename missing' });
       }
       
       // Determine the correct directory based on file context (improved logic)
       let fileDir = UPLOADS_DIR; // Default to base uploads directory
       if (file.projectId) {
         fileDir = PROJECT_FILES_DIR; // Assume project files are in projects dir
       } else if (file.mimeType?.startsWith('image/')) {
         // Check if it *might* be an avatar (heuristic, better if DB stores type)
         const isPotentiallyAvatar = !file.projectId; // Simplistic check
         if (isPotentiallyAvatar) {
           fileDir = AVATARS_DIR;
         }
       } else if (file.mimeType?.startsWith('application/')) { 
         // Might be a verification document (heuristic)
         const isPotentiallyDoc = !file.projectId; 
         if (isPotentiallyDoc) {
            fileDir = DOCUMENTS_DIR;
         }
       }
       // A more robust solution stores the intended directory or type in the File DB record.
       
       const primaryPath = path.join(fileDir, file.filename);
       let fullPath = primaryPath;
       
       if (!fs.existsSync(fullPath)) {
         // Fallback check in default uploads dir if not found in guessed/specific dir
         const fallbackPath = path.join(UPLOADS_DIR, file.filename);
         if (fs.existsSync(fallbackPath)) {
             console.warn(`File ${file.filename} found in fallback directory ${UPLOADS_DIR}, downloading from there.`);
             fullPath = fallbackPath; // Use fallback path
         } else {
             console.error(`File not found on server at primary path: ${primaryPath} or fallback path: ${fallbackPath} (DB filename: ${file.filename})`);
        return res.status(404).json({ message: 'File not found on server' });
         }
      }
      
       // Download the file using the determined fullPath
       res.download(fullPath, file.originalName || file.filename);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      res.status(500).json({ message: 'Failed to download file' });
    }
  });

  // Delete file
  app.delete('/api/files/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const fileId = parseInt(req.params.id);
       const file = await storage.getFileById(fileId); // Fetch file record
       
       // Check if file record and filename exist
       if (!file || !file.filename) { 
         return res.status(404).json({ message: 'File record not found' });
       }
       
       // ... (Permission checks using file.userId, req.user.id, file.projectId etc.) ...
        let canDelete = false;
        if (file.userId === req.user.id || req.user.role === 'admin') {
          canDelete = true;
        } else if (file.projectId) {
          const project = await storage.getProjectById(file.projectId);
          if (project && project.clientId === req.user.id) {
            canDelete = true; // Allow project owner to delete project files
          }
        }
        
        if (!canDelete) {
        return res.status(403).json({ message: 'You do not have permission to delete this file' });
      }
      
       // Determine directory and construct potential paths (similar to download)
       let fileDir = UPLOADS_DIR; // Default
      if (file.projectId) {
         fileDir = PROJECT_FILES_DIR;
       } else if (file.mimeType?.startsWith('image/')) {
         const isPotentiallyAvatar = !file.projectId;
         if (isPotentiallyAvatar) fileDir = AVATARS_DIR;
       } else if (file.mimeType?.startsWith('application/')) {
         const isPotentiallyDoc = !file.projectId;
         if (isPotentiallyDoc) fileDir = DOCUMENTS_DIR;
       }
       
       const primaryPath = path.join(fileDir, file.filename);
       const fallbackPath = path.join(UPLOADS_DIR, file.filename);

       // Delete the physical file (try primary path, then fallback)
       let deletedPhysically = false;
       if (fs.existsSync(primaryPath)) {
         fs.unlinkSync(primaryPath);
         deletedPhysically = true;
         console.log(`Deleted file at: ${primaryPath}`);
       } else if (fs.existsSync(fallbackPath)) {
         // Only delete from fallback if it wasn't the same as primary
         if (primaryPath !== fallbackPath) {
           fs.unlinkSync(fallbackPath);
           deletedPhysically = true;
           console.log(`Deleted file at fallback path: ${fallbackPath}`);
         }
       }
       
       if (!deletedPhysically) {
         console.warn(`File not found for physical deletion at path: ${primaryPath} or ${fallbackPath} (DB filename: ${file.filename}). Proceeding with DB deletion.`);
       }
       
       // Remove from database regardless of physical file presence
      await storage.deleteFile(fileId);
      
       res.json({ message: 'File delete processed successfully' }); // Changed message slightly
    } catch (error: any) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  });

  // ... (rest of existing routes: notifications, zoom, admin, verification, video call, proposals/my, payments, transactions etc.) ...

  return httpServer;
}

// Helper function to ensure upload directory exists
function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
