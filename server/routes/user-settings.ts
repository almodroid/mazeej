import { Router } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { json } from "express";
import { isAuthenticated } from "./auth";

const router = Router();
router.use(json());

// GET /api/users/settings
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.settings || {});
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ error: "Failed to fetch user settings" });
  }
});

// PUT /api/users/settings
router.put("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const settings = req.body;
    await db.update(users).set({ settings }).where(eq(users.id, userId));
    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ error: "Failed to update user settings" });
  }
});

export default router; 