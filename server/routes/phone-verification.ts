import express from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Phone verification endpoint
router.post('/phone-verification', async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Format the phone number to ensure it's in the correct format
    let formattedPhone = phone.replace(/\D/g, "");
    
    // If it starts with 0, remove it
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Ensure it has the Saudi Arabia country code
    if (!formattedPhone.startsWith("966")) {
      formattedPhone = "966" + formattedPhone;
    }

    // Update user record with verified phone
    await db.update(users)
      .set({ 
        phone: formattedPhone,
        phoneVerified: true
      })
      .where(eq(users.id, userId));

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Phone number verified successfully' 
    });
  } catch (error) {
    console.error('Error in phone verification:', error);
    return res.status(500).json({ 
      message: 'Failed to verify phone number',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
