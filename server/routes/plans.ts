import { Router } from "express";
import { db } from "../db";
import { plans, userPlans } from "@shared/schema-plans";
import { eq, and } from "drizzle-orm";
import axios from 'axios';

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

    // Create PayTabs payment request
    const paymentRequest = {
      profile_id: PAYTABS_PROFILE_ID,
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: reference,
      cart_description: `Subscription for ${plan.title} plan`,
      cart_currency: 'SAR',
      cart_amount: plan.priceValue.toFixed(2),
      callback: `${req.protocol}://${req.get('host')}/api/plans/callback`,
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

    // Extract the plan ID and user ID from the cart_id
    const planIdMatch = cart_id.match(/PLAN-(\d+)-/);
    if (!planIdMatch) {
      return res.status(400).json({ message: 'Invalid transaction reference' });
    }

    const planId = parseInt(planIdMatch[1]);
    const userId = parseInt(paymentData.user_defined?.udf2);

    if (!planId || !userId) {
      return res.status(400).json({ message: 'Missing plan or user ID' });
    }

    // Get the plan
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (isSuccessful) {
      // Calculate subscription end date (1 month from now)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Create user plan subscription
      await db.insert(userPlans).values({
        userId: userId,
        planId: planId,
        startDate,
        endDate,
        isActive: true
      });

      // Create a payment record
      // Note: This would be integrated with your payments table if you have one
      console.log(`Payment successful for user ${userId}, plan ${planId}`);
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

// Payment status check endpoint
router.get("/payment-status", async (req, res) => {
  try {
    const { reference } = req.query;
    
    if (!reference) {
      return res.status(400).json({ message: 'Missing transaction reference' });
    }
    
    // Extract the plan ID from the reference
    const planIdMatch = String(reference).match(/PLAN-(\d+)-/);
    if (!planIdMatch) {
      return res.status(400).json({ message: 'Invalid transaction reference' });
    }
    
    const planId = parseInt(planIdMatch[1]);
    
    // Get the plan
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check if the user has a subscription for this plan
    if (req.isAuthenticated()) {
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
      
      if (userPlan) {
        return res.json({
          success: true,
          planId,
          subscribed: true,
          planTitle: plan.title
        });
      }
    }
    
    return res.json({
      success: false,
      planId,
      subscribed: false
    });
  } catch (error) {
    console.error('Payment status check error:', error);
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