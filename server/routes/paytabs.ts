import axios from 'axios';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { storage } from '../storage';
import { db } from "../db";
import { settings } from "@shared/schema";
import { eq } from "drizzle-orm";

// PayTabs configuration
const PAYTABS_PROFILE_ID = process.env.PAYTABS_PROFILE_ID;
const PAYTABS_SERVER_KEY = process.env.PAYTABS_SERVER_KEY;
const PAYTABS_CLIENT_KEY = process.env.PAYTABS_CLIENT_KEY;
const PAYTABS_BASE_URL = process.env.PAYTABS_BASE_URL || 'https://secure.paytabs.sa/';
const PAYTABS_CHECKOUT_URL = `${PAYTABS_BASE_URL}payment/request`;

// Get server and client URLs from environment variables
const SERVER_URL = process.env.SERVER_URL || 'http://192.168.100.17:3000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://192.168.100.17:3000';

// Temporary logging to verify environment variables
console.log('[PayTabs] Configuration loaded:', {
  hasProfileId: !!PAYTABS_PROFILE_ID,
  hasServerKey: !!PAYTABS_SERVER_KEY,
  hasClientKey: !!PAYTABS_CLIENT_KEY,
  baseUrl: PAYTABS_BASE_URL,
  serverUrl: SERVER_URL,
  clientUrl: CLIENT_URL
});

const router = Router();

// Helper function to get platform fee
async function getPlatformFee() {
  const feeSetting = await db.select().from(settings).where(eq(settings.key, "platformFee")).limit(1);
  return feeSetting.length > 0 ? Number(feeSetting[0].value) : 5; // Default to 5% if not set
}

// Create a checkout session with PayTabs
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    // Validate PayTabs configuration
    if (!PAYTABS_PROFILE_ID || !PAYTABS_SERVER_KEY) {
      console.error('[PayTabs] Missing required configuration', {
        hasProfileId: !!PAYTABS_PROFILE_ID,
        hasServerKey: !!PAYTABS_SERVER_KEY
      });
      return res.status(500).json({ 
        message: 'Payment gateway configuration error',
        error: 'Missing required PayTabs configuration'
      });
    }

    console.log('[PayTabs] Starting checkout process', {
      proposalId: req.body.proposalId,
      projectId: req.body.projectId,
      amount: req.body.amount,
      headers: req.headers,
      user: req.user
    });

    if (!req.isAuthenticated()) {
      console.log('[PayTabs] Authentication failed');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { proposalId, projectId, amount } = req.body;

    if (!proposalId || !projectId || !amount) {
      console.log('[PayTabs] Missing required fields', { proposalId, projectId, amount });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get the proposal and project details
    console.log('[PayTabs] Fetching proposal and project details');
    const proposal = await storage.getProposalById(parseInt(proposalId));
    const project = await storage.getProjectById(parseInt(projectId));

    console.log('[PayTabs] Retrieved data:', {
      proposal: proposal ? { id: proposal.id, status: proposal.status } : null,
      project: project ? { id: project.id, title: project.title } : null
    });

    if (!proposal || !project) {
      console.log('[PayTabs] Proposal or project not found', { proposalId, projectId });
      return res.status(404).json({ message: 'Proposal or project not found' });
    }

    // Verify that the user is the project owner
    if (project.clientId !== req.user.id && req.user.role !== 'admin') {
      console.log('[PayTabs] Unauthorized access attempt', { 
        userId: req.user.id, 
        projectClientId: project.clientId,
        userRole: req.user.role
      });
      return res.status(403).json({ message: 'Not authorized to make this payment' });
    }

    // Verify that the proposal is for this project
    if (proposal.projectId !== project.id) {
      console.log('[PayTabs] Proposal project mismatch', { 
        proposalProjectId: proposal.projectId, 
        projectId: project.id 
      });
      return res.status(400).json({ message: 'Proposal does not match project' });
    }

    // Calculate total amount including platform fee
    const platformFee = await getPlatformFee();
    const feeAmount = amount * (platformFee / 100);
    const totalAmount = amount + feeAmount;

    // Create a unique reference for this transaction
    const reference = `PROP-${proposalId}-${Date.now()}`;

    // Get user details for the payment
    console.log('[PayTabs] Fetching user details', { userId: req.user.id });
    const user = await storage.getUser(req.user.id);
    if (!user) {
      console.log('[PayTabs] User not found', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[PayTabs] Creating payment request', {
      reference,
      totalAmount,
      userId: req.user.id,
      profileId: PAYTABS_PROFILE_ID,
      serverKey: PAYTABS_SERVER_KEY ? 'present' : 'missing'
    });

    // Create PayTabs payment request
    const paymentRequest = {
      profile_id: PAYTABS_PROFILE_ID,
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: reference,
      cart_description: `Payment for project: ${project.title}`,
      cart_currency: 'SAR',
      cart_amount: totalAmount.toFixed(2),
      callback: `${SERVER_URL}/api/payments/paytabs/callback`,
      return: `${CLIENT_URL}/payment-result?reference=${reference}`,
      hide_shipping: true,
      customer_details: {
        name: user.fullName || user.username,
        email: user.email,
        phone: user.phone || '',
        street1: 'Address',
        city: user.city || 'Riyadh',
        state: 'State',
        country: 'SA',
        zip: '00000'
      },
      shipping_details: {
        name: user.fullName || user.username,
        email: user.email,
        phone: user.phone || '',
        street1: 'Address',
        city: user.city || 'Riyadh',
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
    console.log('[PayTabs] Sending request to PayTabs API', {
      url: PAYTABS_CHECKOUT_URL,
      requestBody: {
        ...paymentRequest,
        profile_id: '***',
        customer_details: { ...paymentRequest.customer_details, email: '***' }
      }
    });

    try {
      const response = await axios.post(PAYTABS_CHECKOUT_URL, paymentRequest, {
        headers: {
          'Authorization': PAYTABS_SERVER_KEY,
          'Content-Type': 'application/json'
        }
      });

      console.log('[PayTabs] PayTabs API response received', {
        status: response.status,
        hasRedirectUrl: !!response.data.redirect_url,
        responseData: response.data
      });

      // Validate PayTabs response
      if (!response.data.redirect_url) {
        console.error('[PayTabs] Invalid PayTabs response', response.data);
        return res.status(500).json({
          message: 'Invalid response from payment gateway',
          error: 'Missing redirect URL in response'
        });
      }

      // Store payment information in database as pending
      console.log('[PayTabs] Creating pending payment record');
      try {
        await storage.createPayment({
          userId: req.user.id,
          amount: totalAmount,
          status: 'pending',
          type: 'project_payment',
          projectId: project.id,
          description: `Payment for proposal #${proposalId} on project: ${project.title}`
        });
      } catch (dbError: any) {
        console.error('[PayTabs] Failed to create payment record:', dbError);
        return res.status(500).json({
          message: 'Failed to create payment record',
          error: dbError.message
        });
      }

      // Return the redirect URL to the client
      return res.json({
        redirectUrl: response.data.redirect_url,
        reference: reference
      });
    } catch (apiError: any) {
      console.error('[PayTabs] PayTabs API error:', {
        message: apiError?.message,
        response: apiError?.response?.data,
        status: apiError?.response?.status,
        headers: apiError?.response?.headers
      });
      
      // Return a more specific error message based on the API error
      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Unknown error';
      return res.status(500).json({
        message: 'Payment gateway error',
        error: errorMessage,
        details: apiError?.response?.data || null
      });
    }
  } catch (error: any) {
    console.error('[PayTabs] Checkout error:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response?.data,
      status: error?.response?.status
    });
    return res.status(500).json({
      message: 'Failed to process payment',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error?.response?.data || null
    });
  }
});

// PayTabs callback endpoint
router.post('/callback', async (req: Request, res: Response) => {
  try {
    console.log('[PayTabs] Received callback', req.body);
    const { tran_ref, cart_id, payment_result } = req.body;

    // Verify the payment with PayTabs
    console.log('[PayTabs] Verifying payment with PayTabs', { tran_ref });
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
    console.log('[PayTabs] Payment verification result', { 
      isSuccessful, 
      responseStatus: paymentData.payment_result?.response_status 
    });

    // Extract the proposal and project IDs from the cart_id
    const proposalIdMatch = cart_id.match(/PROP-(\d+)-/);
    if (!proposalIdMatch) {
      console.log('[PayTabs] Invalid transaction reference', { cart_id });
      return res.status(400).json({ message: 'Invalid transaction reference' });
    }

    const proposalId = parseInt(proposalIdMatch[1]);
    const proposal = await storage.getProposalById(proposalId);

    if (!proposal) {
      console.log('[PayTabs] Proposal not found', { proposalId });
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Get the project
    const project = await storage.getProjectById(proposal.projectId);
    if (!project) {
      console.log('[PayTabs] Project not found', { projectId: proposal.projectId });
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
      console.log('[PayTabs] Updating payment status', { 
        paymentId: pendingPayment.id, 
        newStatus: isSuccessful ? 'completed' : 'failed' 
      });

      // Update the payment status
      await storage.updatePaymentStatus(
        pendingPayment.id, 
        isSuccessful ? 'completed' : 'failed'
      );

      // If payment is successful, update the proposal status to accepted
      if (isSuccessful) {
        console.log('[PayTabs] Payment successful, updating related records');
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
        const platformFee = await getPlatformFee();
        const feeAmount = proposal.price * (platformFee / 100);
        await storage.createTransaction({
          paymentId: pendingPayment.id,
          userId: 1, // Admin/platform user ID
          amount: feeAmount,
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
    console.error('[PayTabs] Callback error:', error);
    return res.status(500).json({
      message: 'Failed to process payment callback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Payment result page redirect endpoint
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { reference } = req.query;
    console.log('[PayTabs] Checking payment status', { reference });
    
    if (!reference) {
      console.log('[PayTabs] Missing transaction reference');
      return res.status(400).json({ message: 'Missing transaction reference' });
    }
    
    // Extract the proposal ID from the reference
    const proposalIdMatch = String(reference).match(/PROP-(\d+)-/);
    if (!proposalIdMatch) {
      console.log('[PayTabs] Invalid transaction reference', { reference });
      return res.status(400).json({ message: 'Invalid transaction reference' });
    }
    
    const proposalId = parseInt(proposalIdMatch[1]);
    const proposal = await storage.getProposalById(proposalId);
    
    if (!proposal) {
      console.log('[PayTabs] Proposal not found', { proposalId });
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    console.log('[PayTabs] Payment status retrieved', {
      proposalId,
      status: proposal.status,
      projectId: proposal.projectId
    });

    // Return the current status
    return res.json({
      proposalId,
      status: proposal.status,
      projectId: proposal.projectId
    });
  } catch (error) {
    console.error('[PayTabs] Status check error:', error);
    return res.status(500).json({
      message: 'Failed to check payment status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;