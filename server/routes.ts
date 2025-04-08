import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { setupWebSocketServer } from "./chat";
import { insertProjectSchema, insertProposalSchema, insertReviewSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export function registerRoutes(app: Express): Server {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for chat
  setupWebSocketServer(httpServer);
  
  // Update freelancer profile images with Saudi profile images
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
    } catch (error) {
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
    } catch (error) {
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
          }
        }
      }
      
      res.json(updatedProposal);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update proposal status' });
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

  // File Upload Route
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const fileData = {
        userId: req.user.id,
        projectId: req.body.projectId ? parseInt(req.body.projectId) : null,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
      
      const savedFile = await storage.uploadFile(fileData);
      res.status(201).json(savedFile);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // User Profile Update Route
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
      
      // Filter out only allowed fields
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
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
    } catch (error) {
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Notification Routes
  // Contacts API for the chat system
  app.get('/api/contacts', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Get all users except the current user as potential contacts
      const freelancers = await storage.getFreelancers();
      const contacts = freelancers
        .filter(user => user.id !== req.user?.id)
        .map(({ password, ...rest }) => {
          // Add some mock data for demo purposes
          return {
            ...rest,
            isOnline: Math.random() > 0.5, // Random online status
            lastSeen: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)), // Random last seen in last 24 hours
            unreadCount: Math.floor(Math.random() * 5), // Random unread count between 0-4
            lastMessage: Math.random() > 0.3 ? {
              content: 'This is a sample message from the contact.',
              timestamp: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000))
            } : null
          };
        });
      
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  app.get('/api/notifications', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Admin can create notifications for any user
      if (req.user.role !== 'admin' && req.body.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to create notifications for other users' });
      }

      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const notificationId = parseInt(req.params.id);
      
      // Get the notification to check ownership
      const notifications = await storage.getUserNotifications(req.user.id);
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      // Check if this notification belongs to the current user
      if (notification.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this notification' });
      }

      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const notificationId = parseInt(req.params.id);
      
      // Get the notification to check ownership
      const notifications = await storage.getUserNotifications(req.user.id);
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      // Check if this notification belongs to the current user
      if (notification.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this notification' });
      }

      const success = await storage.deleteNotification(notificationId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: 'Notification not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });

  // Zoom video call routes
  // Endpoint to check if required secrets are available
  app.post('/api/check-secrets', async (req, res) => {
    try {
      const { secretKeys } = req.body;
      
      if (!Array.isArray(secretKeys) || secretKeys.length === 0) {
        return res.status(400).json({ message: 'secretKeys must be a non-empty array' });
      }
      
      // Check if all required secrets are available
      const missingSecrets = secretKeys.filter(key => !process.env[key]);
      const hasSecrets = missingSecrets.length === 0;
      
      res.json({ 
        hasSecrets,
        missingSecrets: hasSecrets ? [] : missingSecrets
      });
    } catch (error: any) {
      console.error('Error checking secrets:', error);
      res.status(500).json({ message: 'Failed to check secrets', error: error.message });
    }
  });
  
  app.post('/api/zoom/token', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { receiverId } = req.body;
      
      if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required' });
      }
      
      // Check if ZOOM credentials are configured
      if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
        return res.status(503).json({ 
          message: 'Zoom SDK is not configured', 
          missingKeys: ['ZOOM_SDK_KEY', 'ZOOM_SDK_SECRET']
        });
      }
      
      // Import here to avoid errors if the ZOOM credentials are not set
      const { generateZoomToken } = await import('./zoom');
      
      // Generate a token with the user's ID
      const token = generateZoomToken(req.user.id.toString());
      
      res.json({ 
        token,
        sdkKey: process.env.ZOOM_SDK_KEY,
        userId: req.user.id,
        userName: req.user.fullName || req.user.username,
        // For simplicity, we'll use a combination of both user IDs as the meeting ID
        // In a real app, you might want to store meetings in the database
        meetingId: `${Math.min(req.user.id, receiverId)}-${Math.max(req.user.id, receiverId)}`
      });
    } catch (error) {
      console.error('Error generating Zoom token:', error);
      res.status(500).json({ message: 'Failed to generate Zoom token', error: error.message });
    }
  });

  // Serve attached assets directly
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

  return httpServer;
}
