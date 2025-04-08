import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebSocketServer } from "./chat";
import { insertProjectSchema, insertProposalSchema, insertReviewSchema } from "@shared/schema";
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

  return httpServer;
}
