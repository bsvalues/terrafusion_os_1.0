import { eq } from "drizzle-orm";
import { db } from "../db";
import { generateRandomToken } from "../lib/utils";
import { propertyShareLinks, properties, users } from "@shared/schema";
import type { PropertyShareLink, InsertPropertyShareLink } from "@shared/schema";

export class PropertyShareService {
  /**
   * Create a new property share link
   * @param shareData The data for the new share link
   * @returns The created share link
   */
  async createShareLink(
    shareData: Omit<InsertPropertyShareLink, "token">
  ): Promise<PropertyShareLink> {
    // Generate a unique token
    const token = await this.generateUniqueToken();

    // Insert the share link
    const [shareLink] = await db
      .insert(propertyShareLinks)
      .values({
        ...shareData,
        token,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return shareLink;
  }

  /**
   * Get a share link by its token
   * @param token The share token
   * @returns The share link or undefined if not found
   */
  async getShareLinkByToken(token: string): Promise<PropertyShareLink | undefined> {
    const [shareLink] = await db
      .select()
      .from(propertyShareLinks)
      .where(eq(propertyShareLinks.token, token));

    return shareLink;
  }

  /**
   * Get all share links for a property
   * @param propertyId The property ID
   * @returns Array of share links
   */
  async getShareLinksByPropertyId(propertyId: number): Promise<PropertyShareLink[]> {
    const shareLinks = await db
      .select()
      .from(propertyShareLinks)
      .where(eq(propertyShareLinks.propertyId, propertyId))
      .orderBy(propertyShareLinks.createdAt);

    return shareLinks;
  }

  /**
   * Get all share links created by a user
   * @param userId The user ID
   * @returns Array of share links
   */
  async getShareLinksByUserId(userId: number): Promise<PropertyShareLink[]> {
    const shareLinks = await db
      .select()
      .from(propertyShareLinks)
      .where(eq(propertyShareLinks.userId, userId))
      .orderBy(propertyShareLinks.createdAt);

    return shareLinks;
  }

  /**
   * Get a valid share link by token
   * This checks if the link is active, not expired, and has not exceeded view limit
   * @param token The share token
   * @returns The share link or undefined if not found or invalid
   */
  async getValidShareLink(token: string): Promise<PropertyShareLink | undefined> {
    const shareLink = await this.getShareLinkByToken(token);

    if (!shareLink) return undefined;

    // Check if active
    if (!shareLink.isActive) return undefined;

    // Check expiration
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      // Link has expired, mark as inactive
      await this.deactivateShareLink(shareLink.id);
      return undefined;
    }

    // Check view limit
    if (shareLink.viewsLimit && shareLink.viewCount >= shareLink.viewsLimit) {
      // View limit reached, mark as inactive
      await this.deactivateShareLink(shareLink.id);
      return undefined;
    }

    return shareLink;
  }

  /**
   * Increment the view count for a share link
   * @param id The share link ID
   * @returns The updated share link
   */
  async incrementViewCount(id: number): Promise<PropertyShareLink | undefined> {
    const [shareLink] = await db
      .select()
      .from(propertyShareLinks)
      .where(eq(propertyShareLinks.id, id));

    if (!shareLink) return undefined;

    const [updatedShareLink] = await db
      .update(propertyShareLinks)
      .set({
        viewCount: shareLink.viewCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(propertyShareLinks.id, id))
      .returning();

    return updatedShareLink;
  }

  /**
   * Deactivate a share link
   * @param id The share link ID
   * @returns The updated share link
   */
  async deactivateShareLink(id: number): Promise<PropertyShareLink | undefined> {
    const [updatedShareLink] = await db
      .update(propertyShareLinks)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(propertyShareLinks.id, id))
      .returning();

    return updatedShareLink;
  }

  /**
   * Delete a share link
   * @param id The share link ID
   * @returns true if successful, false otherwise
   */
  async deleteShareLink(id: number): Promise<boolean> {
    const result = await db.delete(propertyShareLinks).where(eq(propertyShareLinks.id, id));

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get property information and creator information for a share link
   * @param token The share token
   * @returns Object with property and creator information if the share link is valid
   */
  async getPropertyByShareToken(token: string): Promise<
    | {
        property: any;
        creator: any;
        shareLink: PropertyShareLink;
      }
    | undefined
  > {
    const shareLink = await this.getValidShareLink(token);

    if (!shareLink) return undefined;

    // Increment view count
    await this.incrementViewCount(shareLink.id);

    // Get property information
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, shareLink.propertyId));

    if (!property) return undefined;

    // Get creator information
    const [creator] = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, shareLink.userId));

    return { property, creator, shareLink };
  }

  /**
   * Generate a unique token for share links
   * @returns A unique token
   */
  private async generateUniqueToken(): Promise<string> {
    let token: string;
    let isUnique = false;

    // Generate tokens until we find a unique one
    while (!isUnique) {
      token = generateRandomToken(12);

      const [existingLink] = await db
        .select()
        .from(propertyShareLinks)
        .where(eq(propertyShareLinks.token, token));

      if (!existingLink) {
        isUnique = true;
      }
    }

    return token!;
  }
}

// Export a singleton instance
export const propertyShareService = new PropertyShareService();
