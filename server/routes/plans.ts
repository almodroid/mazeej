import { Router } from "express";
import { db } from "../db";
import { plans, userPlans, payments, transactions, notifications } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import axios from 'axios';
import { isAuthenticated } from "./auth";

const router = Router();

// Get public plans
router.get("/", async (req, res) => {
  try {
    const plansData = await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.priceValue);
    res.json(plansData);
  } catch (error) {
    console.error("Error fetching public plans:", error);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Create checkout session for a plan subscription
router.post("/subscribe", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get the plan details
    const [plan] = await db.select().from(plans).where(eq(plans.id, parseInt(planId)));

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Create a unique reference for this transaction
    const reference = `PLAN-${planId}-${Date.now()}`;

    // Get user details for the payment
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // PayTabs configuration
    const PAYTABS_PROFILE_ID = process.env.PAYTABS_PROFILE_ID || 'your_profile_id';
    const PAYTABS_SERVER_KEY = process.env.PAYTABS_SERVER_KEY || 'your_server_key';
    const PAYTABS_BASE_URL = 'https://secure.paytabs.sa/';
    const PAYTABS_CHECKOUT_URL = `${PAYTABS_BASE_URL}payment/request`;

    // Get server and client URLs from environment variables
    const SERVER_URL = process.env.SERVER_URL || 'http://192.168.100.17:3000';
    const CLIENT_URL = process.env.CLIENT_URL || 'http://192.168.100.17:3000';

    // Create PayTabs payment request
    const paymentRequest = {
      profile_id: PAYTABS_PROFILE_ID,
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: reference,
      cart_description: `Subscription for ${plan.title} plan`,
      cart_currency: 'SAR',
      cart_amount: plan.priceValue.toFixed(2),
      callback: `${SERVER_URL}/api/plans/callback`,
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
        udf1: planId.toString(),
        udf2: user.id.toString()
      }
    };

    // Call PayTabs API to create payment page
    const response = await axios.post(PAYTABS_CHECKOUT_URL, paymentRequest, {
      headers: {
        'Authorization': PAYTABS_SERVER_KEY,
        'Content-Type': 'application/json'
      }
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
router.post("/callback", async (req, res) => {
  try {
    const { tran_ref, cart_id, payment_result } = req.body;

    console.log('[Plans] Received callback:', {
      tran_ref,
      cart_id,
      payment_result
    });

    // PayTabs configuration
    const PAYTABS_PROFILE_ID = process.env.PAYTABS_PROFILE_ID || 'your_profile_id';
    const PAYTABS_SERVER_KEY = process.env.PAYTABS_SERVER_KEY || 'your_server_key';
    const PAYTABS_BASE_URL = 'https://secure.paytabs.sa/';

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

    console.log('[Plans] Payment verification result:', {
      isSuccessful,
      responseStatus: paymentData.payment_result?.response_status,
      cartId: cart_id,
      paymentData: paymentData
    });

    // Extract the plan ID and user ID from the cart_id
    const planIdMatch = cart_id.match(/PLAN-(\d+)-/);
    if (!planIdMatch) {
      console.log('[Plans] Invalid transaction reference:', cart_id);
      return res.status(400).json({ message: 'Invalid transaction reference' });
    }

    const planId = parseInt(planIdMatch[1]);
    const userId = parseInt(paymentData.user_defined?.udf2);

    if (!planId || !userId) {
      console.log('[Plans] Missing plan or user ID:', { planId, userId });
      return res.status(400).json({ message: 'Missing plan or user ID' });
    }

    // Get the plan
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!plan) {
      console.log('[Plans] Plan not found:', planId);
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (isSuccessful) {
      console.log('[Plans] Payment successful, creating subscription:', {
        userId,
        planId,
        planTitle: plan.title
      });

      // Calculate subscription end date (1 month from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      try {
        // Create user plan subscription
        const [subscription] = await db.insert(userPlans).values({
          userId: userId,
          planId: planId,
          startDate,
          endDate,
          isActive: true
        }).returning();

        console.log('[Plans] Subscription created successfully:', {
          subscriptionId: subscription.id,
          userId,
          planId,
          startDate,
          endDate
        });

        // Create payment record
        const [payment] = await db.insert(payments).values({
          userId: userId,
          amount: plan.priceValue.toString(),
          status: 'completed',
          type: 'plan_payment',
          description: `Payment for ${plan.title} subscription`
        }).returning();

        console.log('[Plans] Payment record created:', {
          paymentId: payment.id,
          amount: payment.amount,
          status: payment.status
        });

        // Create transaction for the platform fee (5% of plan price)
        const platformFee = plan.priceValue * 0.05;
        const [platformTransaction] = await db.insert(transactions).values({
          paymentId: payment.id,
          userId: 1, // Admin/platform user ID
          amount: platformFee.toString(),
          type: 'fee',
          status: 'completed',
          description: `Platform fee for ${plan.title} subscription`
        }).returning();

        console.log('[Plans] Platform fee transaction created:', {
          transactionId: platformTransaction.id,
          amount: platformFee
        });

        // Create transaction for the freelancer (95% of plan price)
        const freelancerAmount = plan.priceValue - platformFee;
        const [freelancerTransaction] = await db.insert(transactions).values({
          paymentId: payment.id,
          userId: userId,
          amount: freelancerAmount.toString(),
          type: 'payment',
          status: 'completed',
          description: `Payment for ${plan.title} subscription`
        }).returning();

        console.log('[Plans] Freelancer transaction created:', {
          transactionId: freelancerTransaction.id,
          amount: freelancerAmount
        });

        // Create notification for the user
        await db.insert(notifications).values({
          userId: userId,
          title: 'Subscription Activated',
          content: `Your ${plan.title} subscription has been successfully activated. You can now access all plan features.`,
          type: 'payment',
          isRead: false
        });

        console.log('[Plans] Notification created for user:', userId);

      } catch (error) {
        console.error('[Plans] Failed to process successful payment:', error);
        return res.status(500).json({
          message: 'Failed to process successful payment',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      console.log('[Plans] Payment failed:', {
        userId,
        planId,
        responseStatus: paymentData.payment_result?.response_status
      });

      // Create failed payment record
      try {
        await db.insert(payments).values({
          userId: userId,
          amount: plan.priceValue.toString(),
          status: 'failed',
          type: 'plan_payment',
          description: `Failed payment for ${plan.title} subscription`
        });
      } catch (error) {
        console.error('[Plans] Failed to create failed payment record:', error);
      }
    }

    // Return a response to PayTabs
    return res.json({ status: 'success' });
  } catch (error) {
    console.error('[Plans] PayTabs callback error:', error);
    return res.status(500).json({
      message: 'Failed to process payment callback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Payment status check endpoint
router.get("/payment-status", async (req, res) => {
  try {
    const { reference } = req.query;
    
    console.log('[Plans] Checking payment status:', {
      reference,
      userId: req.user?.id,
      isAuthenticated: req.isAuthenticated()
    });
    
    if (!reference) {
      console.log('[Plans] Missing transaction reference');
      return res.status(400).json({ message: 'Missing transaction reference' });
    }
    
    // Extract the plan ID from the reference
    const planIdMatch = String(reference).match(/PLAN-(\d+)-/);
    if (!planIdMatch) {
      console.log('[Plans] Invalid transaction reference:', reference);
      return res.status(400).json({ message: 'Invalid transaction reference' });
    }
    
    const planId = parseInt(planIdMatch[1]);
    
    // Get the plan
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!plan) {
      console.log('[Plans] Plan not found:', planId);
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check if the user has a subscription for this plan
    if (req.isAuthenticated()) {
      // Check for active subscription
      const [userPlan] = await db
        .select()
        .from(userPlans)
        .where(
          and(
            eq(userPlans.userId, req.user.id),
            eq(userPlans.planId, planId),
            eq(userPlans.isActive, true)
          )
        );
      
      console.log('[Plans] Checking subscription status:', {
        userId: req.user.id,
        planId,
        hasSubscription: !!userPlan,
        planTitle: plan.title,
        subscription: userPlan ? {
          id: userPlan.id,
          startDate: userPlan.startDate,
          endDate: userPlan.endDate,
          isActive: userPlan.isActive
        } : null
      });

      if (userPlan) {
        return res.json({
          success: true,
          planId,
          subscribed: true,
          planTitle: plan.title,
          subscriptionEndDate: userPlan.endDate
        });
      }
    }
    
    return res.json({
      success: false,
      planId,
      subscribed: false,
      status: 'not_found',
      message: 'No active subscription found'
    });
  } catch (error) {
    console.error('[Plans] Payment status check error:', error);
    return res.status(500).json({
      message: 'Failed to check payment status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Assign free plan to user
router.post("/assign-free", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get the plan details to ensure it exists and is the free wamd plan
    const [plan] = await db.select().from(plans).where(eq(plans.id, parseInt(planId)));

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Verify this is actually a free plan (priceValue should be 0)
    if (plan.priceValue !== 0) {
      return res.status(400).json({ message: 'Cannot assign non-free plan without payment' });
    }

    // Calculate subscription end date (1 month from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create user plan subscription
    await db.insert(userPlans).values({
      userId: req.user.id,
      planId: parseInt(planId),
      startDate,
      endDate,
      isActive: true
    });

    return res.json({
      success: true,
      planId,
      subscribed: true,
      planTitle: plan.title
    });
  } catch (error) {
    console.error('Error assigning free plan:', error);
    return res.status(500).json({
      message: 'Failed to assign free plan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's current active plan
router.get("/user-current-plan", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get user's active plan subscription
    const [userPlanData] = await db
      .select({
        userPlan: userPlans,
        plan: plans
      })
      .from(userPlans)
      .where(
        and(
          eq(userPlans.userId, req.user.id),
          eq(userPlans.isActive, true)
        )
      )
      .innerJoin(plans, eq(userPlans.planId, plans.id))
      .orderBy(userPlans.endDate);

    if (!userPlanData) {
      return res.json({
        hasPlan: false
      });
    }
    
    // Calculate days remaining until expiration
    const now = new Date();
    // Ensure endDate is not null before creating Date object
    const endDate = userPlanData.userPlan.endDate ? new Date(userPlanData.userPlan.endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days if no end date
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;
    const isExpiringSoon = !isExpired && daysRemaining <= 7;
    
    return res.json({
      hasPlan: true,
      plan: userPlanData.plan,
      subscription: {
        ...userPlanData.userPlan,
        daysRemaining,
        isExpired,
        isExpiringSoon
      }
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return res.status(500).json({
      message: 'Failed to fetch user plan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 