import { storage } from '../db-storage';
import { Badge, UserBadge } from '../../shared/schema';

export class BadgeService {
  /**
   * Assign plan-based badge to user when they subscribe to a plan
   */
  static async assignPlanBadge(userId: number, planKey: string): Promise<UserBadge | null> {
    try {
      // Get the badge for this plan
      const badge = await storage.getBadgeByPlanKey(planKey);
      if (!badge) {
        console.log(`No badge found for plan: ${planKey}`);
        return null;
      }

      // Check if user already has this badge
      const existingUserBadges = await storage.getUserBadges(userId);
      const hasPlanBadge = existingUserBadges.some(ub => ub.badge.planKey === planKey);
      
      if (hasPlanBadge) {
        console.log(`User ${userId} already has badge for plan: ${planKey}`);
        return null;
      }

      // Assign the badge
      const userBadge = await storage.assignBadgeToUser(userId, badge.id);
      console.log(`Assigned badge "${badge.name}" to user ${userId} for plan ${planKey}`);
      
      return userBadge;
    } catch (error) {
      console.error('Error assigning plan badge:', error);
      return null;
    }
  }

  /**
   * Remove plan-based badge when user's subscription expires
   */
  static async removePlanBadge(userId: number, planKey: string): Promise<boolean> {
    try {
      // Get the badge for this plan
      const badge = await storage.getBadgeByPlanKey(planKey);
      if (!badge) {
        console.log(`No badge found for plan: ${planKey}`);
        return false;
      }

      // Remove the badge
      const success = await storage.removeBadgeFromUser(userId, badge.id);
      if (success) {
        console.log(`Removed badge "${badge.name}" from user ${userId} for expired plan ${planKey}`);
      }
      
      return success;
    } catch (error) {
      console.error('Error removing plan badge:', error);
      return false;
    }
  }

  /**
   * Get all active badges for a user (including plan-based and custom)
   */
  static async getUserActiveBadges(userId: number): Promise<UserBadge[]> {
    try {
      return await storage.getActiveUserBadges(userId);
    } catch (error) {
      console.error('Error getting user active badges:', error);
      return [];
    }
  }

  /**
   * Check if user has a specific badge
   */
  static async userHasBadge(userId: number, badgeName: string): Promise<boolean> {
    try {
      const userBadges = await storage.getActiveUserBadges(userId);
      return userBadges.some(ub => ub.badge.name === badgeName);
    } catch (error) {
      console.error('Error checking if user has badge:', error);
      return false;
    }
  }

  /**
   * Get plan-based badge for a user
   */
  static async getUserPlanBadge(userId: number): Promise<UserBadge | null> {
    try {
      const userBadges = await storage.getActiveUserBadges(userId);
      return userBadges.find(ub => ub.badge.type === 'plan') || null;
    } catch (error) {
      console.error('Error getting user plan badge:', error);
      return null;
    }
  }

  /**
   * Get custom badges for a user
   */
  static async getUserCustomBadges(userId: number): Promise<UserBadge[]> {
    try {
      const userBadges = await storage.getActiveUserBadges(userId);
      return userBadges.filter(ub => ub.badge.type === 'custom');
    } catch (error) {
      console.error('Error getting user custom badges:', error);
      return [];
    }
  }
} 