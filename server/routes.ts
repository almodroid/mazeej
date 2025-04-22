import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./routes/auth";
import adminSettingsRoutes from "./routes/admin-settings";
import phoneVerificationRoutes from "./routes/phone-verification";

import { insertProjectSchema, insertProposalSchema, insertReviewSchema, insertNotificationSchema, insertVerificationRequestSchema } from "@shared/schema";
import { generateZoomToken, createZoomMeeting, type ZoomMeetingOptions } from "./routes/zoom";
import { z } from "zod";
import fs from "fs";
import crypto from "crypto";
import { eq, and, or, desc } from "drizzle-orm";
import { useTranslation } from "react-i18next";   
import { t } from "i18next";


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
  
  // Setup admin settings routes
  app.use('/api/admin', adminSettingsRoutes);
  
  // Setup phone verification routes
  app.use('/api', phoneVerificationRoutes);

  // Create HTTP server
  const httpServer = createServer(app);
  


  // Portfolio API Routes
  app.get('/api/portfolio/:id?', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to access portfolio' });
    }
    
    try {
      const freelancerId = req.params.id ? parseInt(req.params.id) : req.user.id;
      
      if (isNaN(freelancerId)) {
        return res.status(400).json({ message: 'Invalid freelancer ID' });
      }
      
      // Only allow freelancers to view their own portfolio unless they're clients
      if (req.user.role === 'freelancer' && freelancerId !== req.user.id) {
        return res.status(403).json({ message: 'You can only view your own portfolio' });
      }
      
      const portfolio = await storage.getPortfolioProjects(freelancerId);
      res.json(portfolio);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio projects' });
    }
  });

  app.post('/api/portfolio', upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can add portfolio projects' });
    }
    
    try {
      const { title, description, link, date } = req.body;
      const image = req.file;
      
      if (!title || !description || !date) {
        return res.status(400).json({ message: 'Title, description and date are required' });
      }
      
      const project = await storage.createPortfolioProject({
        freelancerId: req.user.id,
        title,
        description,
        link,
        date,
        imagePath: image ? `/uploads/${image.filename}` : null
      });
      
      res.status(201).json(project);
    } catch (error) {
      console.error('Error adding portfolio project:', error);
      res.status(500).json({ message: 'Failed to add portfolio project' });
    }
  });
  
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
      
      // Create the message with valid properties
      // Note: isRead is handled by the storage layer and defaults to false
      const message = await storage.createMessage({
        receiverId: receiverIdNum,
        content: content.trim()
      }, userId);
      
      // Create a notification for the receiver
      await storage.createNotification({
        userId: receiverIdNum,
        type: 'message',
        title: `New message from ${req.user.fullName || req.user.username}`,
        content: content.length > 30 ? content.substring(0, 30) + '...' : content,
        relatedId: message.id
      });
      
      // Emit a WebSocket event to notify connected clients
      if (req.app.get('wss')) {
        const wss = req.app.get('wss');
        // Use proper typing for WebSocket clients
        wss.clients.forEach((client: any) => {
          if (client.userId === receiverIdNum && client.readyState === 1) { // WebSocket.OPEN = 1
            client.send(JSON.stringify({
              type: 'newMessage',
              message
            }));
          }
        });
      }
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });
  
  // Send a media message
  app.post('/api/messages/media', upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to send messages' });
    }
    
    try {
      const userId = req.user.id;
      const { receiverId, caption } = req.body;
      
      if (!receiverId || !req.file) {
        return res.status(400).json({ message: 'Receiver ID and file are required' });
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
      
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Determine media type
      let mediaType = 'document';
      if (req.file.mimetype.startsWith('image/')) {
        mediaType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        mediaType = 'video';
      }
      
      // Create file entry
      const fileData = {
        userId: userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
      
      const savedFile = await storage.uploadFile(fileData);
      
      // Create the message
      const message = await storage.createMessage({
        receiverId: receiverIdNum,
        content: caption || 'Sent a file',
        mediaUrl: `/uploads/${req.file.filename}`,
        mediaType: mediaType
      }, userId);
      
      // Create a notification for the receiver
      await storage.createNotification({
        userId: receiverIdNum,
        type: 'message',
        title: `New ${mediaType} from ${req.user.fullName || req.user.username}`,
        content: caption || `Sent a ${mediaType}`,
        relatedId: message.id
      });
      
      // Emit a WebSocket event to notify connected clients
      if (req.app.get('wss')) {
        const wss = req.app.get('wss');
        wss.clients.forEach((client: any) => {
          if (client.userId === receiverIdNum && client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'newMessage',
              message
            }));
          }
        });
      }
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error('Error sending media message:', error);
      res.status(500).json({ message: 'Failed to send media message' });
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

  // Categories with Skills
  app.get('/api/categories-with-skills', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      
      // For each category, fetch its skills
      const categoriesWithSkills = await Promise.all(
        categories.map(async (category) => {
          const skills = await storage.getSkillsByCategory(category.id);
          return {
            ...category,
            skills
          };
        })
      );
      
      res.json(categoriesWithSkills);
    } catch (error: any) {
      console.error('Error fetching categories with skills:', error);
      res.status(500).json({ message: 'Failed to fetch categories with skills' });
    }
  });

  // Skills routes
  app.get('/api/skills', async (req, res) => {
    try {
      const skills = await storage.getSkills();
      res.json(skills);
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ message: 'Failed to fetch skills' });
    }
  });

  app.post('/api/skills', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const { name, categoryId, translations } = req.body;
      
      if (!categoryId) {
        return res.status(400).json({ message: 'Category ID is required' });
      }

      // Ensure at least one translation is provided
      if (translations && !Object.values(translations).some((val: any) => val && val.trim && val.trim())) {
        return res.status(400).json({ message: 'At least one translation is required' });
      }

      // Get the category to validate it exists
      const category = await storage.getCategory(parseInt(categoryId));
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Set the name based on available translations (prefer Arabic as default)
      const skillName = translations.ar?.trim() || translations.en?.trim() || '';
      
      const newSkill = await storage.createSkill({
        name: skillName, 
        categoryId: parseInt(categoryId),
        translations
      });

      res.status(201).json(newSkill);
    } catch (error) {
      console.error('Error creating skill:', error);
      res.status(500).json({ message: 'Failed to create skill' });
    }
  });

  app.put('/api/skills/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const skillId = parseInt(req.params.id);
      
      if (isNaN(skillId)) {
        return res.status(400).json({ message: 'Invalid skill ID' });
      }

      const { name, categoryId, translations } = req.body;
      
      // Ensure at least one translation is provided
      if (translations && !Object.values(translations).some((val: any) => val && val.trim && val.trim())) {
        return res.status(400).json({ message: 'At least one translation is required' });
      }

      // Get the skill to ensure it exists
      const skill = await storage.getSkill(skillId);
      if (!skill) {
        return res.status(404).json({ message: 'Skill not found' });
      }

      // Set the name based on available translations (prefer Arabic as default)
      const skillName = translations?.ar?.trim() || translations?.en?.trim() || name || skill.name;
      
      const updatedSkill = await storage.updateSkill(skillId, {
        name: skillName,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        translations
      });

      res.json(updatedSkill);
    } catch (error) {
      console.error('Error updating skill:', error);
      res.status(500).json({ message: 'Failed to update skill' });
    }
  });

  app.delete('/api/skills/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const skillId = parseInt(req.params.id);
      
      if (isNaN(skillId)) {
        return res.status(400).json({ message: 'Invalid skill ID' });
      }

      // First check if the skill has any user skills associated with it
      const skillInUse = await storage.isSkillInUse(skillId);
      
      if (skillInUse) {
        return res.status(400).json({ 
          message: 'Cannot delete skill that is in use by users or projects'
        });
      }

      const deleted = await storage.deleteSkill(skillId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Skill not found' });
      }

      res.json({ message: 'Skill deleted successfully' });
    } catch (error) {
      console.error('Error deleting skill:', error);
      res.status(500).json({ message: 'Failed to delete skill' });
    }
  });

  // Update category routes to support translations
  app.post('/api/categories', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const { name, icon, translations } = req.body;
      
      // Ensure at least one translation is provided
      if (translations && !Object.values(translations).some((val: any) => val && val.trim && val.trim())) {
        return res.status(400).json({ message: 'At least one translation is required' });
      }

      // Set the name based on available translations (prefer Arabic as default)
      const categoryName = translations?.ar?.trim() || translations?.en?.trim() || name || '';
      
      if (!categoryName) {
        return res.status(400).json({ message: 'Category name is required' });
      }

      const newCategory = await storage.createCategory({
        name: categoryName,
        icon: icon || 'default-icon',
        translations
      });

      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      const { name, icon, translations } = req.body;
      
      // Get the category to ensure it exists
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Set the name based on available translations (prefer Arabic as default)
      const categoryName = translations?.ar?.trim() || translations?.en?.trim() || name || category.name;
      
      const updatedCategory = await storage.updateCategory(categoryId, {
        name: categoryName,
        icon,
        translations
      });

      res.json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const categoryId = parseInt(req.params.id);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      // Check if the category has any skills
      const categorySkills = await storage.getSkillsByCategory(categoryId);
      
      if (categorySkills.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete category that has skills. Delete the skills first.' 
        });
      }

      const deleted = await storage.deleteCategory(categoryId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
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

  // Consultation Projects for mentors (expert freelancers)
  app.get('/api/projects/consultation/mentor', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Get all projects
      const projects = await storage.getProjects();
      
      // Filter to only consultation type projects where this freelancer is involved
      const freelancerProjects = projects.filter((project: any) => {
        return (project.projectType === 'consultation' || project.projectType === 'mentoring') &&
               project.freelancerId === req.user.id;
      });
      
      res.json(freelancerProjects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch consultation projects' });
    }
  });

  // Consultation Projects for clients (or beginner freelancers seeking consultation)
  app.get('/api/projects/consultation/client', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Get all consultation projects created by this user
      const projects = await storage.getProjectsByClient(req.user.id);
      
      // Filter to only consultation or mentoring type
      const consultationProjects = projects.filter((project: any) => 
        project.projectType === 'consultation' || project.projectType === 'mentoring'
      );
      
      res.json(consultationProjects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch client consultation projects' });
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
      if (!req.isAuthenticated()) {
        return res.status(403).json({ message: 'Authentication required' });
      }

      const projectData = req.body;
      const isConsultationProject = projectData.projectType === 'consultation' || projectData.projectType === 'mentoring';
      
      // Check if user can create this type of project
      // - Clients can create any project type
      // - Beginner freelancers can create consultation projects
      if (req.user?.role === 'client') {
        // Clients can create any type of project
      } else if (req.user?.role === 'freelancer' && 
                req.user?.freelancerLevel === 'beginner' && 
                isConsultationProject) {
        // Beginner freelancers can create consultation projects
      } else {
        return res.status(403).json({ 
          message: 'Only clients can create regular projects. Beginner freelancers can only create consultation projects.' 
        });
      }

      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData, req.user!.id);
      return res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      return res.status(500).json({ message: 'Failed to create project' });
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

      // Phone uniqueness check
      if (updateData.phone) {
        // Normalize phone if needed (same as registration/verification)
        let formattedPhone = updateData.phone.replace(/\D/g, "");
        if (formattedPhone.startsWith("0")) {
          formattedPhone = formattedPhone.substring(1);
        }
        if (!formattedPhone.startsWith("966")) {
          formattedPhone = "966" + formattedPhone;
        }
        updateData.phone = formattedPhone;

        // Check if another user has this phone
        const allUsers = await storage.getAllUsers();
        const phoneTaken = allUsers.some(
          (u: any) => u.phone === formattedPhone && u.id !== req.user.id
        );
        if (phoneTaken) {
          return res.status(400).json({ message: t('errors.phoneExists') });
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
      const { generateZoomToken } = await import('./routes/zoom');
      
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
      res.status(500).json({ message: 'Failed to generate Zoom token', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Serve attached assets directly
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

  // Admin routes
  app.get('/api/users', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // Get all users - we need to implement this method in the storage class
      const allUsers = await storage.getAllUsers();
      
      // Set proper content type
      res.setHeader('Content-Type', 'application/json');
      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin user creation endpoint
  app.post('/api/users', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { username, email, password, fullName, role } = req.body;
      
      // Validate required fields
      if (!username || !email || !password || !fullName || !role) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user
      const newUser = await storage.createUser({
        username,
        email,
        fullName,
        password: hashedPassword,
        role,
        confirmPassword: password, // This field is just for validation, not stored
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Set proper content type and return the created user
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin delete user endpoint
  app.delete('/api/users/:id', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const userId = parseInt(req.params.id);
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Prevent deleting admin users
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin users cannot be deleted' });
      }
      
      // Delete the user
      const success = await storage.deleteUser(userId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin update user status endpoint (block/unblock)
  app.patch('/api/users/:id/status', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const userId = parseInt(req.params.id);
      const { blocked } = req.body;
      
      if (typeof blocked !== 'boolean') {
        return res.status(400).json({ message: 'Blocked status must be a boolean' });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Prevent blocking admin users
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin users cannot be blocked' });
      }
      
      // Update the user's blocked status
      const updatedUser = await storage.updateUser(userId, { isBlocked: blocked });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user status' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Verification Routes
  // Submit a verification request (for freelancers)
  app.post('/api/verification-requests', upload.single('document'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Only freelancers can submit verification requests
      if (req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Only freelancers can submit verification requests' });
      }

      // Check if user is already verified
      if (req.user.isVerified) {
        return res.status(400).json({ message: 'User is already verified' });
      }

      // Check if the user has a pending verification request
      const existingRequests = await storage.getVerificationRequestsForUser(req.user.id);
      const pendingRequest = existingRequests.find(request => request.status === 'pending');
      
      if (pendingRequest) {
        return res.status(400).json({ 
          message: 'You already have a pending verification request',
          request: pendingRequest
        });
      }

      // Handle file upload
      if (!req.file) {
        return res.status(400).json({ message: 'Document file is required' });
      }

      // Save file record
      const file = await storage.uploadFile({
        userId: req.user.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      });

      // Create verification request
      const requestData = {
        userId: req.user.id,
        documentType: req.body.documentType,
        documentUrl: `/uploads/${file.filename}`,
        additionalInfo: req.body.additionalInfo
      };

      const validatedData = insertVerificationRequestSchema.parse(requestData);
      const verificationRequest = await storage.createVerificationRequest(validatedData);

      // Create a notification for the user
      await storage.createNotification({
        userId: req.user.id,
        title: 'تم استلام طلب التحقق',
        content: 'تم استلام طلب التحقق الخاص بك وسيتم مراجعته قريبًا',
        type: 'verification_request'
      });

      // Notify admins about the new verification request
      const adminUsers = Array.from((await storage.getFreelancers())).filter(user => user.role === 'admin');
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: 'طلب تحقق جديد',
          content: `قام ${req.user.fullName} بتقديم طلب تحقق جديد`,
          type: 'admin_alert',
          relatedId: verificationRequest.id
        });
      }

      res.status(201).json(verificationRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating verification request:', error);
      res.status(500).json({ message: 'Failed to create verification request', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin - Get all verification requests
  app.get('/api/verification-requests', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const rawStatus = req.query.status as string | undefined;
      // Validate and convert the status to the expected type
      let status: "pending" | "approved" | "rejected" | undefined = undefined;
      
      if (rawStatus) {
        if (["pending", "approved", "rejected"].includes(rawStatus)) {
          status = rawStatus as "pending" | "approved" | "rejected";
        } else {
          return res.status(400).json({ message: 'Invalid status parameter' });
        }
      }
      
      const requests = await storage.getVerificationRequests(status);
      
      // Enrich requests with user information
      const enrichedRequests = await Promise.all(requests.map(async (request) => {
        const user = await storage.getUser(request.userId);
        return {
          ...request,
          user: user ? { 
            id: user.id, 
            fullName: user.fullName, 
            username: user.username,
            email: user.email,
            profileImage: user.profileImage
          } : null
        };
      }));

      res.json(enrichedRequests);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      res.status(500).json({ message: 'Failed to fetch verification requests', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get user's verification requests (for freelancers)
  app.get('/api/my-verification-requests', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const requests = await storage.getVerificationRequestsForUser(req.user.id);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching user verification requests:', error);
      res.status(500).json({ message: 'Failed to fetch verification requests', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get a specific verification request
  app.get('/api/verification-requests/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const requestId = parseInt(req.params.id);
      const request = await storage.getVerificationRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: 'Verification request not found' });
      }

      // Only admins or the request owner can view it
      if (req.user.role !== 'admin' && request.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this verification request' });
      }

      // If admin is viewing, include user details
      if (req.user.role === 'admin') {
        const user = await storage.getUser(request.userId);
        return res.json({
          ...request,
          user: user ? { 
            id: user.id, 
            fullName: user.fullName, 
            username: user.username,
            email: user.email,
            profileImage: user.profileImage
          } : null
        });
      }

      res.json(request);
    } catch (error) {
      console.error('Error fetching verification request:', error);
      res.status(500).json({ message: 'Failed to fetch verification request', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update verification request status (for admin)
  app.patch('/api/verification-requests/:id/status', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can update verification request status' });
      }

      const requestId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      
      // Validate status
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected"' });
      }
      
      // Get the verification request
      const request = await storage.getVerificationRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Verification request not found' });
      }
      
      // Update the status
      const updatedRequest = await storage.updateVerificationRequestStatus(
        requestId, 
        status, 
        req.user.id, 
        reviewNotes
      );
      
      if (!updatedRequest) {
        return res.status(500).json({ message: 'Failed to update verification request' });
      }

      // Create a notification for the user
      const notificationTitle = status === 'approved' 
        ? 'تم الموافقة على طلب التحقق' 
        : 'تم رفض طلب التحقق';
      
      const notificationContent = status === 'approved'
        ? 'تهانينا! تم الموافقة على طلب التحقق الخاص بك. الآن يمكنك الاستفادة من مميزات المستخدمين المتحقق منهم.'
        : `تم رفض طلب التحقق الخاص بك. ${reviewNotes ? `السبب: ${reviewNotes}` : 'يرجى التواصل مع الدعم لمزيد من المعلومات.'}`;
      
      await storage.createNotification({
        userId: request.userId,
        title: notificationTitle,
        content: notificationContent,
        type: 'verification_update',
        relatedId: request.id
      });

      // If approved, update the user mail settings here (would require SendGrid)
      // This part would require the SendGrid API key, so we'll comment it for now
      // if (status === 'approved') {
      //   const user = await storage.getUser(request.userId);
      //   if (user && user.email) {
      //     try {
      //       // Send verification confirmation email 
      //       // Implementation would go here
      //     } catch (emailError) {
      //       console.error('Error sending verification email:', emailError);
      //     }
      //   }
      // }

      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating verification request:', error);
      res.status(500).json({ message: 'Failed to update verification request', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Video Call Routes
  // Store active meetings in memory
  const activeVideoMeetings = new Map<string, {
    meetingId: string;
    hostId: number;
    participants: number[];
    createdAt: Date;
  }>();

  // Generate a video call token
  app.post('/api/video/token', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const targetUserId = req.body.targetUserId;
      
      if (!targetUserId) {
        return res.status(400).json({ message: 'Target user ID is required' });
      }
      
      // Generate a meeting ID (either new or existing)
      let meetingId: string;
      
      // Check if these users already have an active meeting
      const existingMeeting = Array.from(activeVideoMeetings.values()).find(meeting => 
        (meeting.hostId === userId && meeting.participants.includes(targetUserId)) ||
        (meeting.hostId === targetUserId && meeting.participants.includes(userId))
      );
      
      if (existingMeeting) {
        // Use existing meeting
        meetingId = existingMeeting.meetingId;
      } else {
        // Create a new meeting ID
        meetingId = crypto.randomUUID();
        
        // Store the new meeting
        activeVideoMeetings.set(meetingId, {
          meetingId,
          hostId: userId,
          participants: [targetUserId],
          createdAt: new Date()
        });
        
        // Create notification for target user
        const targetUser = await storage.getUser(targetUserId);
        if (targetUser) {
          await storage.createNotification({
            userId: targetUserId,
            title: 'دعوة مكالمة فيديو',
            content: `${req.user.fullName || req.user.username} يدعوك إلى مكالمة فيديو`,
            type: 'message',
            relatedId: userId
          });
        }
      }
      
      // Generate a Zoom token
      const token = generateZoomToken(userId.toString());
      
      res.json({ token, meetingId });
    } catch (error: any) {
      console.error('Error generating video token:', error);
      res.status(500).json({ message: 'Failed to generate video token', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Create a Zoom meeting
  app.post('/api/video/meetings', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { topic, participantIds } = req.body;
      
      if (!topic || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: 'Topic and participant IDs are required' });
      }
      
      // Create a Zoom meeting
      const meetingOptions: ZoomMeetingOptions = {
        topic,
        type: 1, // Instant meeting (1=instant, 2=scheduled, 3=recurring no fixed time, 8=recurring fixed time)
        duration: 60, // 60 minutes
        timezone: 'UTC',
        password: crypto.randomBytes(3).toString('hex').toUpperCase(),
        agenda: `Meeting between ${req.user.fullName || req.user.username} and invited participants`
      };
      
      // Create the meeting via Zoom API
      const meeting = await createZoomMeeting(meetingOptions);
      
      // Store meeting information
      const meetingId = meeting.id;
      activeVideoMeetings.set(meetingId, {
        meetingId,
        hostId: req.user.id,
        participants: participantIds,
        createdAt: new Date()
      });
      
      // Create notifications for all participants
      for (const participantId of participantIds) {
        const participant = await storage.getUser(participantId);
        if (participant) {
          await storage.createNotification({
            userId: participantId,
            title: 'دعوة مكالمة فيديو',
            content: `${req.user.fullName || req.user.username} دعاك إلى مكالمة فيديو بعنوان: ${topic}`,
            type: 'message',
            relatedId: req.user.id
          });
        }
      }
      
      res.json({
        meetingId,
        joinUrl: meeting.join_url,
        hostUrl: meeting.start_url
      });
    } catch (error: any) {
      console.error('Error creating Zoom meeting:', error);
      res.status(500).json({ message: 'Failed to create meeting', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Cleanup old meetings (run every hour)
  setInterval(() => {
    const now = new Date();
    // Convert entries to array and then iterate
    Array.from(activeVideoMeetings.entries()).forEach(([id, meeting]) => {
      // Remove meetings older than 24 hours
      const meetingAge = now.getTime() - meeting.createdAt.getTime();
      if (meetingAge > 24 * 60 * 60 * 1000) {
        activeVideoMeetings.delete(id);
      }
    });
  }, 60 * 60 * 1000);

  // Add endpoint to get current user's proposals
  app.get('/api/proposals/my', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Only freelancers can have proposals
      if (req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Only freelancers can view their proposals' });
      }
      
      const proposals = await storage.getProposalsByFreelancer(req.user.id);
      res.json(proposals);
    } catch (error: any) {
      console.error('Error fetching user proposals:', error);
      res.status(500).json({ message: 'Failed to fetch proposals' });
    }
  });

  // Get all payments (admin only)
  app.get('/api/payments', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // Get all payments with user information joined
      const payments = await storage.getAllPayments();
      
      // Return the payments
      return res.json(payments);
    } catch (error) {
      console.error('Error getting payments:', error);
      return res.status(500).json({ message: 'Failed to get payments' });
    }
  });

  // Create a new payment (admin only)
  app.post('/api/payments', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const { userId, amount, type, projectId, status, description } = req.body;
      
      // Validate required fields
      if (!userId || !amount || !type || !status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Validate amount is positive
      if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
      }
      
      // Validate user exists
      const userExists = await storage.getUser(parseInt(userId));
      if (!userExists) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If project payment, validate project exists
      if (type === 'project_payment' && projectId) {
        const projectExists = await storage.getProjects(parseInt(projectId));
        if (!projectExists) {
          return res.status(404).json({ message: 'Project not found' });
        }
      }
      
      // Create the payment
      const payment = await storage.createPayment({
        userId: parseInt(userId),
        amount,
        type,
        projectId: projectId ? parseInt(projectId) : undefined,
        status,
        description,
      });
      
      // If payment is completed, create a transaction record for platform fee
      if (status === 'completed' && payment) {
        const platformFee = amount * 0.05; // 5% platform fee
        
        await storage.createTransaction({
          paymentId: payment.id,
          userId: parseInt(userId),
          amount: platformFee,
          type: 'fee',
          status: 'completed',
          description: `Platform fee for payment #${payment.id}`,
        });
      }
      
      return res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      return res.status(500).json({ message: 'Failed to create payment' });
    }
  });

  // Delete a payment (admin only)
  app.delete('/api/payments/:id', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const paymentId = parseInt(req.params.id);
      
      // Check if payment exists
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Delete associated transactions first
      await storage.deleteTransactionsByPaymentId(paymentId);
      
      // Delete the payment
      const success = await storage.deletePayment(paymentId);
      
      if (success) {
        return res.status(200).json({ message: 'Payment deleted successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to delete payment' });
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      return res.status(500).json({ message: 'Failed to delete payment' });
    }
  });

  // Get all transactions (admin only)
  app.get('/api/transactions', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // Get all transactions with user information joined
      const transactions = await storage.getAllTransactions();
      
      // Return the transactions
      return res.json(transactions);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return res.status(500).json({ message: 'Failed to get transactions' });
    }
  });

  app.patch('/api/projects/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can edit projects' });
      }

      const projectId = parseInt(req.params.id);
      const { title, description, budget, category } = req.body;
      
      // Get the project to make sure it exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Update project
      const updatedProject = await storage.updateProject(projectId, {
        title,
        description,
        budget,
        category
      });
      
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update project' });
    }
  });

  // Add file upload endpoints
  // Get project files
  app.get('/api/projects/:id/files', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const files = await storage.getFilesByProject(projectId);
      res.json(files);
    } catch (error: any) {
      console.error('Error fetching project files:', error);
      res.status(500).json({ message: 'Failed to fetch project files' });
    }
  });

  // Upload project files
  app.post('/api/projects/:id/files', upload.array('files'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const projectId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if user is project owner or admin
      if (project.clientId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You do not have permission to upload files to this project' });
      }

      const uploadedFiles = req.files as Express.Multer.File[];
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const savedFiles = [];
      for (const file of uploadedFiles) {
        const fileData = {
          userId,
          projectId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        };

        const savedFile = await storage.uploadFile(fileData);
        savedFiles.push(savedFile);
      }

      res.status(201).json(savedFiles);
    } catch (error: any) {
      console.error('Error uploading project files:', error);
      res.status(500).json({ message: 'Failed to upload files', error: error.message });
    }
  });

  // Get file for download
  app.get('/api/files/:id/download', async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      const filePath = path.join(process.cwd(), 'uploads', file.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on server' });
      }
      
      res.download(filePath, file.originalName);
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
      const file = await storage.getFileById(fileId);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Check if user is file owner or admin
      if (file.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You do not have permission to delete this file' });
      }
      
      // Get the project to check permissions
      if (file.projectId) {
        const project = await storage.getProjectById(file.projectId);
        // Only allow project owner or admin to delete project files
        if (project && project.clientId !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'You do not have permission to delete this file' });
        }
      }
      
      // Delete the file from storage
      const filePath = path.join(process.cwd(), 'uploads', file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Remove from database
      await storage.deleteFile(fileId);
      
      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  });

  // Message supervision endpoints
  app.get('/api/admin/conversations', async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  app.get('/api/admin/conversations/:conversationId/messages', async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.patch('/api/admin/messages/:messageId/flag', async (req, res) => {
    try {
      const { messageId } = req.params;
      const { isFlagged } = req.body;
      await storage.updateMessageFlag(parseInt(messageId), isFlagged);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update message flag' });
    }
  });

  app.patch('/api/admin/messages/:messageId/supervise', async (req, res) => {
    try {
      const { messageId } = req.params;
      const { supervisorNotes, supervisedBy } = req.body;
      await storage.updateMessageSupervision(parseInt(messageId), supervisorNotes, supervisedBy);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update message supervision' });
    }
  });

  // Get freelancer earnings
  app.get('/api/earnings', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to view earnings' });
    }
    
    try {
      const userId = req.user.id;
      
      // Get all accepted proposals for this freelancer
      const proposals = await storage.getProposalsByFreelancer(userId);
      const acceptedProposals = proposals.filter(p => p.status === 'accepted');
      
      // Calculate total earnings
      const total = acceptedProposals.reduce((sum, proposal) => sum + proposal.price, 0);
      
      // Calculate pending earnings (projects still in progress)
      // First get all related projects
      const projectIds = acceptedProposals.map(p => p.projectId);
      const projects = await Promise.all(projectIds.map(id => storage.getProjectById(id)));
      
      // Now filter for in-progress projects and calculate pending earnings
      const pendingProposals = acceptedProposals.filter(proposal => 
        projects.some(p => p && p.id === proposal.projectId && p.status === 'in_progress')
      );
      const pending = pendingProposals.reduce((sum, proposal) => sum + proposal.price, 0);
      
      // Get recent transactions
      const recentTransactions = await storage.getUserTransactions(userId);
      const lastFiveTransactions = recentTransactions.slice(0, 5);
      
      res.json({
        total,
        pending,
        available: total - pending,
        recentTransactions: lastFiveTransactions
      });
    } catch (error: any) {
      console.error('Error fetching earnings:', error);
      res.status(500).json({ message: 'Failed to fetch earnings data' });
    }
  });

  // Reviews API Routes
  
  // Submit a review
  app.post('/api/reviews', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to submit reviews' });
    }

    try {
      const userId = req.user.id;
      const { projectId, revieweeId, rating, comment } = req.body;
      
      console.log("Review submission received:", { projectId, revieweeId, rating, comment });
      
      // Validate required fields
      if (!projectId || !revieweeId || !rating) {
        return res.status(400).json({ 
          message: 'Project ID, reviewee ID, and rating are required',
          received: { projectId, revieweeId, rating, comment }
        });
      }
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Verify the user is related to this project (as client or freelancer)
      const isClient = project.clientId === userId;
      
      // For now, only clients can leave reviews
      if (!isClient) {
        return res.status(403).json({ message: 'Only clients can submit reviews for now' });
      }
      
      // Create the review
      const review = await storage.createReview({
        projectId,
        revieweeId,
        rating,
        comment: comment || ""
      }, userId);
      
      // Create a notification for the reviewee
      await storage.createNotification({
        userId: revieweeId,
        type: 'review',
        title: 'New Review Received',
        content: `You have received a ${rating}-star review for project "${project.title}"`,
        relatedId: review.id
      });
      
      res.status(201).json(review);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      res.status(500).json({ message: 'Failed to submit review', error: error.message });
    }
  });
  
  // Get reviews for a project
  app.get('/api/projects/:projectId/reviews', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // Check if project exists
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Get reviews for the project
      const reviews = await storage.getProjectReviews(projectId);
      
      res.json(reviews);
    } catch (error: any) {
      console.error('Error fetching project reviews:', error);
      res.status(500).json({ message: 'Failed to fetch project reviews' });
    }
  });
  
  // Get reviews given by the authenticated user
  app.get('/api/users/reviews/given', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to access your reviews' });
    }

    try {
      const userId = req.user.id;
      
      // Get reviews given by this user
      const reviewsData = await storage.getReviewsByReviewer(userId);
      
      // Fetch associated project and user data to enrich the response
      const enrichedReviews = await Promise.all(reviewsData.map(async (review) => {
        const project = await storage.getProjectById(review.projectId);
        const freelancer = await storage.getUser(review.revieweeId);
        
        return {
          ...review,
          projectTitle: project ? project.title : 'Unknown Project',
          freelancerId: review.revieweeId,
          freelancerName: freelancer ? freelancer.fullName : 'Unknown User',
          freelancerAvatar: freelancer ? freelancer.profileImage : undefined
        };
      }));
      
      res.json(enrichedReviews);
    } catch (error: any) {
      console.error('Error fetching reviews given:', error);
      res.status(500).json({ message: 'Failed to fetch reviews given' });
    }
  });
  
  // Get reviews received by the authenticated user
  app.get('/api/users/reviews/received', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'You must be logged in to access your reviews' });
    }

    try {
      const userId = req.user.id;
      
      // Get reviews received by this user
      const reviewsData = await storage.getReviewsByUser(userId);
      
      // Fetch associated project and user data to enrich the response
      const enrichedReviews = await Promise.all(reviewsData.map(async (review) => {
        const project = await storage.getProjectById(review.projectId);
        const reviewer = await storage.getUser(review.reviewerId);
        
        return {
          ...review,
          projectTitle: project ? project.title : 'Unknown Project',
          reviewerId: review.reviewerId,
          reviewerName: reviewer ? reviewer.fullName : 'Unknown User',
          reviewerAvatar: reviewer ? reviewer.profileImage : undefined
        };
      }));
      
      res.json(enrichedReviews);
    } catch (error: any) {
      console.error('Error fetching reviews received:', error);
      res.status(500).json({ message: 'Failed to fetch reviews received' });
    }
  });

  // Get user's earnings information
  app.get('/api/earnings', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Freelancer access required' });
      }
      
      const userId = req.user.id;
      
      // Get user balance using the new balance system
      const balanceData = await storage.getUserBalance(userId);
      
      // Get all payments for the user to display transaction history
      const payments = await storage.getUserPayments(userId);
      
      // Calculate this month's earnings
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const thisMonth = payments
        .filter(p => p.status === 'completed' && new Date(p.createdAt) >= firstDayOfMonth)
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Format periods data for the UI
      const periods = payments.map(payment => ({
        id: payment.id.toString(),
        amount: Number(payment.amount),
        date: payment.createdAt,
        status: payment.status,
        projectTitle: payment.projectTitle || 'Direct Payment',
        clientName: payment.clientName || 'Platform'
      }));
      
      // Log the data for debugging
      console.log(`User ${userId} balance data:`, balanceData);

      // Calculate available balance
      const available = balanceData.totalEarnings - balanceData.pendingWithdrawals;
      
      return res.json({
        total: balanceData.totalEarnings,
        pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
        thisMonth,
        available,
        pendingWithdrawals: balanceData.pendingWithdrawals,
        periods
      });
    } catch (error) {
      console.error('Error getting earnings:', error);
      return res.status(500).json({ message: 'Failed to get earnings' });
    }
  });

  // Get all withdrawal requests (admin only)
  app.get('/api/withdrawal-requests', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // Get all withdrawal requests with user information joined
      const withdrawalRequests = await storage.getAllWithdrawalRequests();
      
      // Return the withdrawal requests
      return res.json(withdrawalRequests);
    } catch (error) {
      console.error('Error getting withdrawal requests:', error);
      return res.status(500).json({ message: 'Failed to get withdrawal requests' });
    }
  });

  // Get user's withdrawal requests (for the logged-in user)
  app.get('/api/withdrawal-requests/my', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      
      // Get all withdrawal requests for the user
      const withdrawalRequests = await storage.getUserWithdrawalRequests(userId);
      
      return res.json(withdrawalRequests);
    } catch (error) {
      console.error('Error getting user withdrawal requests:', error);
      return res.status(500).json({ message: 'Failed to get withdrawal requests' });
    }
  });

  // Create a new withdrawal request (only for freelancers)
  app.post('/api/withdrawal-requests', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Freelancer access required' });
      }
      
      const { amount, paymentMethod, accountDetails, notes } = req.body;
      
      // Validate required fields
      if (!amount || !paymentMethod || !accountDetails) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Validate amount is positive and meets minimum withdrawal amount
      if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be positive' });
      }

      if (amount < 100) {
        return res.status(400).json({ message: 'Minimum withdrawal amount is 100' });
      }
      
      // Get user balance using the new balance system
      const balance = await storage.getUserBalance(req.user.id);
      
      // Calculate available balance
      const available = balance.totalEarnings - balance.pendingWithdrawals;
      
      console.log(`User ${req.user.id} withdrawal request:`, { 
        requestedAmount: amount,
        totalEarnings: balance.totalEarnings,
        pendingWithdrawals: balance.pendingWithdrawals,
        available
      });
      
      // Check if user has sufficient available balance
      if (amount > available) {
        return res.status(400).json({ 
          message: 'Insufficient funds',
          available,
          totalEarnings: balance.totalEarnings,
          pendingWithdrawals: balance.pendingWithdrawals
        });
      }
      
      // Create the withdrawal request
      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId: req.user.id,
        amount,
        paymentMethod,
        accountDetails,
        notes
      });
      
      // Update the user's pending withdrawals
      await storage.updateUserPendingWithdrawals(req.user.id, amount);
      
      // Create a notification for the admin
      await storage.createNotification({
        userId: req.user.id,
        title: 'New Withdrawal Request',
        content: `A new withdrawal request for ${amount} has been submitted by ${req.user.username}.`,
        type: 'payment'
      });
      
      return res.status(201).json(withdrawalRequest);
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      return res.status(500).json({ message: 'Failed to create withdrawal request' });
    }
  });

  // Update a withdrawal request status (admin only)
  app.patch('/api/withdrawal-requests/:id/status', async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const withdrawalId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      // Check if withdrawal request exists
      const withdrawalRequest = await storage.getWithdrawalRequest(withdrawalId);
      if (!withdrawalRequest) {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }
      
      // Validate status
      if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // Previous status for comparison
      const previousStatus = withdrawalRequest.status;
      
      // Update the status
      const updatedRequest = await storage.updateWithdrawalRequestStatus(withdrawalId, {
        status,
        notes,
        adminId: req.user.id,
        processedAt: new Date()
      });
      
      // Update user balance based on status transition
      const userId = withdrawalRequest.userId;
      const amount = Number(withdrawalRequest.amount);
      
      // If the request is moving from pending/approved to rejected/completed
      // we need to remove it from pending withdrawals
      if (
        (previousStatus === 'pending' || previousStatus === 'approved') && 
        (status === 'rejected' || status === 'completed')
      ) {
        await storage.updateUserPendingWithdrawals(userId, -amount);
      }
      
      // If the request is moving from rejected/completed to pending/approved
      // we need to add it back to pending withdrawals
      if (
        (previousStatus === 'rejected' || previousStatus === 'completed') && 
        (status === 'pending' || status === 'approved')
      ) {
        await storage.updateUserPendingWithdrawals(userId, amount);
      }
      
      // If status is "completed", create a payment record and update total earnings
      if (status === 'completed') {
        const payment = await storage.createPayment({
          userId: withdrawalRequest.userId,
          amount: Number(withdrawalRequest.amount),
          type: 'withdrawal',
          status: 'completed',
          description: `Withdrawal request #${withdrawalId} completed`
        });
        
        // Update the withdrawal request with payment ID
        if (payment) {
          await storage.updateWithdrawalRequestPayment(withdrawalId, payment.id);
          
          // Create a transaction for tracking
          await storage.createTransaction({
            paymentId: payment.id,
            userId: withdrawalRequest.userId,
            amount: Number(withdrawalRequest.amount),
            type: 'payment',
            status: 'completed',
            description: `Withdrawal payment for request #${withdrawalId}`
          });
          
          // Update user's total earnings to reflect the completed withdrawal
          await storage.calculateUserBalance(withdrawalRequest.userId);
          
          // Notify the user
          await storage.createNotification({
            userId: withdrawalRequest.userId,
            title: 'Withdrawal Completed',
            content: `Your withdrawal request for ${withdrawalRequest.amount} has been completed.`,
            type: 'payment',
            relatedId: withdrawalId
          });
        }
      } else if (status === 'rejected') {
        // Notify the user
        await storage.createNotification({
          userId: withdrawalRequest.userId,
          title: 'Withdrawal Request Rejected',
          content: `Your withdrawal request for ${withdrawalRequest.amount} has been rejected. Reason: ${notes || 'No reason provided.'}`,
          type: 'payment',
          relatedId: withdrawalId
        });
      } else if (status === 'approved') {
        // Notify the user
        await storage.createNotification({
          userId: withdrawalRequest.userId,
          title: 'Withdrawal Request Approved',
          content: `Your withdrawal request for ${withdrawalRequest.amount} has been approved and is being processed.`,
          type: 'payment',
          relatedId: withdrawalId
        });
      }
      
      return res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating withdrawal request:', error);
      return res.status(500).json({ message: 'Failed to update withdrawal request' });
    }
  });

  // Get all transactions for the current user
  app.get('/api/users/transactions', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      
      // Get all transactions for the user
      const transactions = await storage.getUserTransactions(userId);
      
      return res.json(transactions);
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return res.status(500).json({ message: 'Failed to get user transactions' });
    }
  });

  // User Profile Get Route
  app.get('/api/users/profile', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  // Get user skills
  app.get('/api/users/:id/skills', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const skills = await storage.getUserSkills(userId);
      res.json(skills);
    } catch (error) {
      console.error('Error fetching user skills:', error);
      res.status(500).json({ message: 'Failed to fetch user skills', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Add skill to user
  app.post('/api/users/:id/skills', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Only allow users to add skills to their own profile (or admins)
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const { skillId } = req.body;
      
      if (!skillId || isNaN(parseInt(skillId.toString()))) {
        return res.status(400).json({ message: 'Invalid skill ID' });
      }
      
      const skillIdNum = parseInt(skillId.toString());
      
      // Check if the skill exists
      const skillExists = await storage.getSkills().then(skills => 
        skills.some(skill => skill.id === skillIdNum)
      );
      
      if (!skillExists) {
        return res.status(404).json({ message: 'Skill not found' });
      }
      
      // Add the skill
      await storage.addUserSkill(userId, skillIdNum);
      
      res.status(201).json({ message: 'Skill added successfully' });
    } catch (error) {
      console.error('Error adding user skill:', error);
      res.status(500).json({ message: 'Failed to add skill', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Remove skill from user
  app.delete('/api/users/:userId/skills/:skillId', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = parseInt(req.params.userId);
      const skillId = parseInt(req.params.skillId);
      
      if (isNaN(userId) || isNaN(skillId)) {
        return res.status(400).json({ message: 'Invalid user ID or skill ID' });
      }
      
      // Only allow users to remove skills from their own profile (or admins)
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      // Find the userSkill entry to remove
      const userSkills = await storage.getUserSkills(userId);
      const skillExists = userSkills.some(skill => skill.id === skillId);
      
      if (!skillExists) {
        return res.status(404).json({ message: 'User does not have this skill' });
      }
      
      // Remove the skill
      const removed = await storage.removeUserSkill(userId, skillId);
      
      if (!removed) {
        return res.status(500).json({ message: 'Failed to remove skill' });
      }
      
      res.json({ message: 'Skill removed successfully' });
    } catch (error: any) {
      console.error('Error removing user skill:', error);
      res.status(500).json({ message: 'Failed to remove skill', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update withdrawal request status
  app.put('/api/withdrawal-requests/:id/status', async (req, res) => {
    // ... existing code ...
  });

  // Payout Accounts API
  app.get('/api/payout-accounts', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const accounts = await storage.getPayoutAccounts(userId);
      
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching payout accounts:', error);
      res.status(500).json({ message: 'Failed to fetch payout accounts' });
    }
  });

  app.post('/api/payout-accounts', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const { type, name, accountDetails, isDefault } = req.body;
      
      if (!type || !accountDetails) {
        return res.status(400).json({ message: 'Type and account details are required' });
      }

      const account = await storage.createPayoutAccount(userId, {
        type,
        name: name || 'My Payout Account', // Provide a default name if not specified
        accountDetails,
        isDefault: isDefault ?? false
      });
      
      res.status(201).json(account);
    } catch (error) {
      console.error('Error creating payout account:', error);
      res.status(500).json({ message: 'Failed to create payout account' });
    }
  });

  app.get('/api/payout-accounts/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const accountId = parseInt(req.params.id);
      
      if (isNaN(accountId)) {
        return res.status(400).json({ message: 'Invalid account ID' });
      }

      const account = await storage.getPayoutAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      // Ensure the account belongs to the authenticated user
      if (account.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to access this account' });
      }
      
      res.json(account);
    } catch (error) {
      console.error('Error fetching payout account:', error);
      res.status(500).json({ message: 'Failed to fetch payout account' });
    }
  });

  app.put('/api/payout-accounts/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const accountId = parseInt(req.params.id);
      
      if (isNaN(accountId)) {
        return res.status(400).json({ message: 'Invalid account ID' });
      }

      const account = await storage.getPayoutAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      // Ensure the account belongs to the authenticated user
      if (account.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this account' });
      }

      const { name, accountDetails, isDefault } = req.body;
      const updatedAccount = await storage.updatePayoutAccount(accountId, {
        name,
        accountDetails,
        isDefault
      });
      
      res.json(updatedAccount);
    } catch (error) {
      console.error('Error updating payout account:', error);
      res.status(500).json({ message: 'Failed to update payout account' });
    }
  });

  app.delete('/api/payout-accounts/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.user.id;
      const accountId = parseInt(req.params.id);
      
      if (isNaN(accountId)) {
        return res.status(400).json({ message: 'Invalid account ID' });
      }

      const account = await storage.getPayoutAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      
      // Ensure the account belongs to the authenticated user
      if (account.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this account' });
      }

      const deleted = await storage.deletePayoutAccount(accountId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete account' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting payout account:', error);
      res.status(500).json({ message: 'Failed to delete payout account' });
    }
  });

  // Upload file route
  app.post('/api/upload', upload.single('file'), (req, res) => {
    // ... existing code ...
  });

  // USER TESTING ONLY - debug route to generate test earnings
  app.post('/api/debug/generate-earnings', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Debug routes not available in production' });
      }
      
      const userId = req.user.id;
      const { amount = 1000 } = req.body;
      
      // Create a test payment for the user
      const payment = await storage.createPayment({
        userId,
        amount: Number(amount),
        type: 'project_payment',
        status: 'completed',
        description: 'Test payment for development'
      });
      
      return res.status(201).json({
        message: 'Test earnings generated successfully',
        payment
      });
    } catch (error) {
      console.error('Error generating test earnings:', error);
      return res.status(500).json({ message: 'Failed to generate test earnings' });
    }
  });

  // --- Consultation Specific Routes ---

  // GET: Beginner Freelancer's Consultations (Requests they made)
  app.get('/api/projects/consultation/beginner', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'freelancer' || req.user.freelancerLevel !== 'beginner') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    try {
      const userId = req.user.id;
      const projects = await storage.getProjectsByClient(userId);
      const consultationProjects = projects.filter((project: any) => 
        project.projectType === 'consultation' || project.projectType === 'mentoring'
      );
      // Enrich with freelancer (expert) details
      const enrichedProjects = await Promise.all(consultationProjects.map(async (p) => {
        const expert = p.freelancerId ? await storage.getUser(p.freelancerId) : null;
        const { password, ...expertWithoutPassword } = expert || {};
        return { ...p, freelancer: expertWithoutPassword };
      }));
      res.json(enrichedProjects);
    } catch (error) {
      console.error('Error fetching beginner consultations:', error);
      res.status(500).json({ message: 'Failed to fetch consultations' });
    }
  });

  // GET: Expert Freelancer's Pending Consultation Requests (Requests for them)
  app.get('/api/projects/consultation/requests', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'freelancer' || req.user.freelancerType !== 'expert') {
      return res.status(403).json({ message: 'Only expert freelancers can view requests' });
    }
    try {
      const expertId = req.user.id;
      // Fetch projects where status is pending and type is consultation/mentoring
      // AND freelancerId matches the logged-in expert
      const pendingRequests = await storage.getPendingConsultationsForExpert(expertId);
      
      // Enrich with client (beginner freelancer) details
      const enrichedRequests = await Promise.all(pendingRequests.map(async (p) => {
        const client = await storage.getUser(p.clientId);
        const { password, ...clientWithoutPassword } = client || {};
        return { ...p, client: clientWithoutPassword };
      }));
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error('Error fetching consultation requests:', error);
      res.status(500).json({ message: 'Failed to fetch consultation requests' });
    }
  });

  // PATCH: Expert accepts a consultation request
  app.patch('/api/projects/:id/accept', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'freelancer' || req.user.freelancerType !== 'expert') {
      return res.status(403).json({ message: 'Only expert freelancers can accept requests' });
    }
    try {
      const projectId = parseInt(req.params.id);
      const expertId = req.user.id;
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Verify the project is pending and assigned to this expert
      if (project.status !== 'pending' || project.freelancerId !== expertId) {
        return res.status(400).json({ message: 'Cannot accept this consultation request' });
      }
      
      // Update status to 'in_progress'
      const updatedProject = await storage.updateProjectStatus(projectId, 'in_progress');
      
      // Notify beginner freelancer
      await storage.createNotification({
        userId: project.clientId,
        type: 'project_update',
        title: t('notification.consultationAcceptedTitle'),
        content: t('notification.consultationAcceptedContent', { expertName: req.user.fullName, title: project.title }),
        relatedId: projectId
      });

      res.json(updatedProject);
    } catch (error) {
      console.error('Error accepting consultation request:', error);
      res.status(500).json({ message: 'Failed to accept request' });
    }
  });

  // PATCH: Expert rejects a consultation request
  app.patch('/api/projects/:id/reject', async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'freelancer' || req.user.freelancerType !== 'expert') {
      return res.status(403).json({ message: 'Only expert freelancers can reject requests' });
    }
    try {
      const projectId = parseInt(req.params.id);
      const expertId = req.user.id;
      
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Verify the project is pending and assigned to this expert
      if (project.status !== 'pending' || project.freelancerId !== expertId) {
        return res.status(400).json({ message: 'Cannot reject this consultation request' });
      }
      
      // Update status to 'cancelled'
      const updatedProject = await storage.updateProjectStatus(projectId, 'cancelled');

      // Notify beginner freelancer
      await storage.createNotification({
        userId: project.clientId,
        type: 'project_update',
        title: t('notification.consultationRejectedTitle'),
        content: t('notification.consultationRejectedContent', { expertName: req.user.fullName, title: project.title }),
        relatedId: projectId
      });

      res.json(updatedProject);
    } catch (error) {
      console.error('Error rejecting consultation request:', error);
      res.status(500).json({ message: 'Failed to reject request' });
    }
  });

  // Modify the existing POST /api/projects route
  app.post('/api/projects', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(403).json({ message: 'Authentication required' });
      }

      const projectData = req.body;
      const isConsultationProject = projectData.projectType === 'consultation' || projectData.projectType === 'mentoring';
      
      // Authorization check (same as before)
      if (req.user?.role === 'client') {
        // Clients can create any type of project
      } else if (req.user?.role === 'freelancer' && 
                 req.user?.freelancerLevel === 'beginner' && 
                 isConsultationProject) {
        // Beginner freelancers can create consultation projects
      } else {
        return res.status(403).json({ 
          message: 'User role does not permit creating this project type.' 
        });
      }

      // Add freelancerId to the validation data (if it's a consultation)
      // The frontend (consultation-form) should be sending this
      const validatedData = insertProjectSchema.parse(req.body);
      
      // Determine initial status
      const initialStatus = isConsultationProject ? 'pending' : 'open';

      const project = await storage.createProject(
        { ...validatedData, status: initialStatus }, // Pass initial status
        req.user!.id  
      );

      // If consultation, notify the expert
      if (isConsultationProject && project.freelancerId) {
         await storage.createNotification({
           userId: project.freelancerId,
           type: 'project_update', // Or a new 'consultation_request' type?
           title: t('notification.newConsultationRequestTitle'),
           content: t('notification.newConsultationRequestContent', { beginnerName: req.user.fullName, title: project.title }),
           relatedId: project.id
         });
      }

      return res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error("Error creating project:", error);
      return res.status(500).json({ message: 'Failed to create project' });
    }
  });

  return httpServer;
}
