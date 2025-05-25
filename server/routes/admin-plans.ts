import { Router } from "express";
import { db } from "../db";
import { plans } from "@shared/schema";
import { eq } from "drizzle-orm";
import { json } from "express";
import { insertPlanSchema } from "@shared/schema-plans";
import { isAuthenticated, isAdmin } from "./auth";

const router = Router();

// Use JSON middleware
router.use(json());

// Get all plans
router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    console.log('[Admin Plans] Fetching all plans...');
    const plansData = await db.select().from(plans).orderBy(plans.id);
    console.log('[Admin Plans] Found plans:', plansData);
    res.json(plansData);
  } catch (error) {
    console.error("[Admin Plans] Error fetching plans:", error);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// Get a single plan by ID
router.get("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const planData = await db.select().from(plans).where(eq(plans.id, parseInt(id)));
    
    if (planData.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    
    res.json(planData[0]);
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});

// Create a new plan
router.post("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Validate the request body
    const validatedData = insertPlanSchema.parse(req.body);
    
    // Insert the new plan
    const result = await db.insert(plans).values({
      key: validatedData.key,
      title: validatedData.title,
      price: validatedData.price,
      priceNote: validatedData.priceNote,
      priceValue: validatedData.priceValue,
      description: validatedData.description,
      color: validatedData.color,
      badge: validatedData.badge,
      buttonColor: validatedData.buttonColor,
      bestFor: validatedData.bestFor,
      features: validatedData.features,
      maxProjects: validatedData.maxProjects,
      maxProposals: validatedData.maxProposals,
      maxWithdrawals: validatedData.maxWithdrawals,
      isActive: validatedData.isActive,
      translations: validatedData.translations,
    }).returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(400).json({ error: "Failed to create plan", details: error });
  }
});

// Update a plan
router.put("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate the request body
    const validatedData = insertPlanSchema.parse(req.body);
    
    // Update the plan
    const result = await db.update(plans)
      .set({
        key: validatedData.key,
        title: validatedData.title,
        price: validatedData.price,
        priceNote: validatedData.priceNote,
        priceValue: validatedData.priceValue,
        description: validatedData.description,
        color: validatedData.color,
        badge: validatedData.badge,
        buttonColor: validatedData.buttonColor,
        bestFor: validatedData.bestFor,
        features: validatedData.features,
        maxProjects: validatedData.maxProjects,
        maxProposals: validatedData.maxProposals,
        maxWithdrawals: validatedData.maxWithdrawals,
        isActive: validatedData.isActive,
        translations: validatedData.translations,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, parseInt(id)))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(400).json({ error: "Failed to update plan", details: error });
  }
});

// Delete a plan
router.delete("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the plan
    const result = await db.delete(plans)
      .where(eq(plans.id, parseInt(id)))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

export default router;