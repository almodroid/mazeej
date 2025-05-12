import axios from 'axios';
import type { Express, Request, Response } from 'express';
import { storage } from '../storage';

// PayTabs configuration
const PAYTABS_PROFILE_ID = process.env.PAYTABS_PROFILE_ID || 'your_profile_id';
const PAYTABS_SERVER_KEY = process.env.PAYTABS_SERVER_KEY || 'your_server_key';
const PAYTABS_BASE_URL = 'https://secure.paytabs.sa/';
const PAYTABS_CHECKOUT_URL = `${PAYTABS_BASE_URL}payment/request`;

// PayTabs API endpoints
const paytabsRoutes = (app: Express) => {
  // Create a checkout session with PayTabs
  app.post('/api/payments/paytabs/checkout', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { proposalId, projectId, amount } = req.body;

      if (!proposalId || !projectId || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Get the proposal and project details
      const proposal = await storage.getProposalById(parseInt(proposalId));
      const project = await storage.getProjectById(parseInt(projectId));

      if (!proposal || !project) {
        return res.status(404).json({ message: 'Proposal or project not found' });
      }

      // Verify that the user is the project owner
      if (project.clientId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to make this payment' });
      }

      // Verify that the proposal is for this project
      if (proposal.projectId !== project.id) {
        return res.status(400).json({ message: 'Proposal does not match project' });
      }

      // Calculate total amount including platform fee
      const platformFee = amount * 0.05; // 5% platform fee
      const totalAmount = amount + platformFee;

      // Create a unique reference for this transaction
      const reference = `PROP-${proposalId}-${Date.now()}`;

      // Get user details for the payment
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create PayTabs payment request
      const paymentRequest = {
        profile_id: PAYTABS_PROFILE_ID,
        tran_type: 'sale',
        tran_class: 'ecom',
        cart_id: reference,
        cart_description: `Payment for project: ${project.title}`,
        cart_currency: 'SAR',
        cart_amount: totalAmount.toFixed(2),
        callback: `${req.protocol}://${req.get('host')}/api/payments/paytabs/callback`,
        return: `${req.protocol}://${req.get('host')}/payment-result?reference=${reference}`,
        hide_shipping: true,
        customer_details: {
          name: user.fullName || user.username,
          email: user.email,
          phone: user.phone || '',
          street1: 'Address',
          city: 'City',
          state: 'State',
          country: 'SA',
          zip: '00000'
        },
        shipping_details: {
          name: user.fullName || user.username,
          email: user.email,
          phone: user.phone || '',
          street1: 'Address',
          city: 'City',
          state: 'State',
          country: 'SA',
          zip: '00000'
        },
        user_defined: {
          udf1: proposalId.toString(),
          udf2: projectId.toString(),
          udf3: req.user.id.toString()
        }
      };

      // Call PayTabs API to create payment page
      const response = await axios.post(PAYTABS_CHECKOUT_URL, paymentRequest, {
        headers: {
          'Authorization': PAYTABS_SERVER_KEY,
          'Content-Type': 'application/json'
        }
      });

      // Store payment information in database as pending
      await storage.createPayment({
        userId: req.user.id,
        amount: totalAmount,
        status: 'pending',
        type: 'project_payment',
        projectId: project.id,
        description: `Payment for proposal #${proposalId} on project: ${project.title}`
      });

      // Return the redirect URL to the client
      return res.json({
        redirectUrl: response.data.redirect_url,
        reference: reference
      });
    } catch (error) {
      console.error('PayTabs checkout error:', error);
      return res.status(500).json({
        message: 'Failed to process payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PayTabs callback endpoint
  app.post('/api/payments/paytabs/callback', async (req: Request, res: Response) => {
    try {
      const { tran_ref, cart_id, payment_result } = req.body;

      // Verify the payment with PayTabs
      const verifyResponse = await axios.post(
        `${PAYTABS_BASE_URL}payment/query`,
        { tran_ref },
        {
          headers: {
            'Authorization': PAYTABS_SERVER_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const paymentData = verifyResponse.data;
      const isSuccessful = paymentData.payment_result?.response_status === 'A';

      // Extract the proposal and project IDs from the cart_id
      const proposalIdMatch = cart_id.match(/PROP-(\d+)-/);
      if (!proposalIdMatch) {
        return res.status(400).json({ message: 'Invalid transaction reference' });
      }

      const proposalId = parseInt(proposalIdMatch[1]);
      const proposal = await storage.getProposalById(proposalId);

      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }

      // Get the project
      const project = await storage.getProjectById(proposal.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Update payment status in database
      const payments = await storage.getAllPayments();
      const pendingPayment = payments.find(p => 
        p.type === 'project_payment' && 
        p.projectId === project.id && 
        p.status === 'pending'
      );

      if (pendingPayment) {
        // Update the payment status
        await storage.updatePaymentStatus(
          pendingPayment.id, 
          isSuccessful ? 'completed' : 'failed'
        );

        // If payment is successful, update the proposal status to accepted
        if (isSuccessful) {
          await storage.updateProposalStatus(proposalId, 'accepted');
          
          // Update project status to in_progress
          await storage.updateProjectStatus(proposal.projectId, 'in_progress');
          
          // Create a transaction for the freelancer
          await storage.createTransaction({
            paymentId: pendingPayment.id,
            userId: proposal.freelancerId,
            amount: proposal.price,
            type: 'payment',
            status: 'completed',
            description: `Payment for accepted proposal on project: ${project.title}`
          });
          
          // Create a transaction for the platform fee
          const platformFee = proposal.price * 0.05;
          await storage.createTransaction({
            paymentId: pendingPayment.id,
            userId: 1, // Admin/platform user ID
            amount: platformFee,
            type: 'fee',
            status: 'completed',
            description: `Platform fee for project: ${project.title}`
          });
          
          // Send notification to the freelancer
          await storage.createNotification({
            userId: proposal.freelancerId,
            title: 'Your proposal has been accepted and paid',
            content: `Your proposal for project "${project.title}" has been accepted and payment has been processed. You can now start working on the project.`,
            type: 'proposal',
            relatedId: proposal.id
          });
        }
      }

      // Return a response to PayTabs
      return res.json({ status: 'success' });
    } catch (error) {
      console.error('PayTabs callback error:', error);
      return res.status(500).json({
        message: 'Failed to process payment callback',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Payment result page redirect endpoint
  app.get('/api/payments/paytabs/status', async (req: Request, res: Response) => {
    try {
      const { reference } = req.query;
      
      if (!reference) {
        return res.status(400).json({ message: 'Missing transaction reference' });
      }
      
      // Extract the proposal ID from the reference
      const proposalIdMatch = String(reference).match(/PROP-(\d+)-/);
      if (!proposalIdMatch) {
        return res.status(400).json({ message: 'Invalid transaction reference' });
      }
      
      const proposalId = parseInt(proposalIdMatch[1]);
      const proposal = await storage.getProposalById(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      
      // Return the current status
      return res.json({
        proposalId,
        status: proposal.status,
        projectId: proposal.projectId
      });
    } catch (error) {
      console.error('Payment status check error:', error);
      return res.status(500).json({
        message: 'Failed to check payment status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
};

export default paytabsRoutes;