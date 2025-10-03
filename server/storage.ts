import { 
  users, photos, photoLikes, photoComments, userFavorites, templates, frames, userSessions,
  type User, type InsertUser, type Photo, type InsertPhoto, type PhotoWithDetails,
  type PhotoLike, type InsertPhotoLike, type PhotoComment, type InsertPhotoComment, 
  type PhotoCommentWithUser, type UserFavorite, type InsertUserFavorite,
  type Template, type InsertTemplate, type Frame, type InsertFrame,
  type UserSession, type UserProfile, type SafeUser, type SafeUserProfile
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Enhanced storage interface with all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUserProfile(id: string): Promise<SafeUserProfile | undefined>;
  
  // Photo operations
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  getPhoto(id: string): Promise<PhotoWithDetails | undefined>;
  getPhotosByUser(userId: string, limit?: number, offset?: number): Promise<PhotoWithDetails[]>;
  getPublicPhotos(limit?: number, offset?: number): Promise<PhotoWithDetails[]>;
  updatePhoto(id: string, updates: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: string, userId: string): Promise<boolean>;
  getPhotoByShareCode(shareCode: string): Promise<PhotoWithDetails | undefined>;
  generateShareCode(photoId: string): Promise<string>;
  
  // Photo interaction operations
  likePhoto(photoLike: InsertPhotoLike): Promise<PhotoLike | undefined>;
  unlikePhoto(photoId: string, userId: string): Promise<boolean>;
  addComment(comment: InsertPhotoComment): Promise<PhotoCommentWithUser | undefined>;
  getPhotoComments(photoId: string, limit?: number, offset?: number): Promise<PhotoCommentWithUser[]>;
  deleteComment(commentId: string, userId: string): Promise<boolean>;
  favoritePhoto(favorite: InsertUserFavorite): Promise<UserFavorite | undefined>;
  unfavoritePhoto(photoId: string, userId: string): Promise<boolean>;
  getUserFavorites(userId: string, limit?: number, offset?: number): Promise<PhotoWithDetails[]>;
  
  // Template operations
  getTemplates(category?: string): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  
  // Frame operations
  getFrames(category?: string): Promise<Frame[]>;
  getFrame(id: string): Promise<Frame | undefined>;
  createFrame(frame: InsertFrame): Promise<Frame>;
  
  // Authentication
  authenticateUser(username: string, password: string): Promise<User | null>;
  
  // Session operations
  createSession(userId: string, expiresAt: Date): Promise<UserSession>;
  getSession(sessionToken: string): Promise<UserSession | undefined>;
  deleteSession(sessionToken: string): Promise<boolean>;
  cleanupExpiredSessions(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword
      })
      .returning();
    return user;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return null;
    
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    // Hash password if it's being updated
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserProfile(id: string): Promise<SafeUserProfile | undefined> {
    const [userResult] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        bio: users.bio,
        profilePicture: users.profilePicture,
        isPublic: users.isPublic,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        photosCount: count(photos.id)
      })
      .from(users)
      .leftJoin(photos, eq(users.id, photos.userId))
      .where(eq(users.id, id))
      .groupBy(users.id);
    
    return userResult as SafeUserProfile || undefined;
  }

  // Photo operations
  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const maxAttempts = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shareCode = this.generateUniqueShareCode();
      
      try {
        const [newPhoto] = await db
          .insert(photos)
          .values({ 
            ...photo, 
            shareCode
          } as any)
          .returning();
        return newPhoto;
      } catch (error: any) {
        // If it's a unique constraint violation on shareCode, retry
        if (error?.constraint_name === 'photos_share_code_unique' || 
            error?.code === '23505' && error?.detail?.includes('share_code')) {
          continue; // Try again with new shareCode
        }
        // For any other error, rethrow
        throw error;
      }
    }
    
    throw new Error('Failed to generate unique share code after maximum attempts');
  }

  async getPhoto(id: string): Promise<PhotoWithDetails | undefined> {
    const [photoResult] = await db
      .select({
        id: photos.id,
        userId: photos.userId,
        imageData: photos.imageData,
        originalImageData: photos.originalImageData,
        filter: photos.filter,
        adjustments: photos.adjustments,
        textOverlays: photos.textOverlays,
        emojis: photos.emojis,
        templateId: photos.templateId,
        frameId: photos.frameId,
        isPublic: photos.isPublic,
        shareCode: photos.shareCode,
        title: photos.title,
        description: photos.description,
        tags: photos.tags,
        exportSettings: photos.exportSettings,
        viewCount: photos.viewCount,
        createdAt: photos.createdAt,
        updatedAt: photos.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture
        },
        likesCount: count(photoLikes.id),
        commentsCount: count(photoComments.id)
      })
      .from(photos)
      .leftJoin(users, eq(photos.userId, users.id))
      .leftJoin(photoLikes, eq(photos.id, photoLikes.photoId))
      .leftJoin(photoComments, eq(photos.id, photoComments.photoId))
      .where(eq(photos.id, id))
      .groupBy(photos.id, users.id);

    return photoResult as PhotoWithDetails || undefined;
  }

  async getPhotosByUser(userId: string, limit = 20, offset = 0): Promise<PhotoWithDetails[]> {
    const photoResults = await db
      .select({
        id: photos.id,
        userId: photos.userId,
        imageData: photos.imageData,
        originalImageData: photos.originalImageData,
        filter: photos.filter,
        adjustments: photos.adjustments,
        textOverlays: photos.textOverlays,
        emojis: photos.emojis,
        templateId: photos.templateId,
        frameId: photos.frameId,
        isPublic: photos.isPublic,
        shareCode: photos.shareCode,
        title: photos.title,
        description: photos.description,
        tags: photos.tags,
        exportSettings: photos.exportSettings,
        viewCount: photos.viewCount,
        createdAt: photos.createdAt,
        updatedAt: photos.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture
        },
        likesCount: count(photoLikes.id),
        commentsCount: count(photoComments.id)
      })
      .from(photos)
      .leftJoin(users, eq(photos.userId, users.id))
      .leftJoin(photoLikes, eq(photos.id, photoLikes.photoId))
      .leftJoin(photoComments, eq(photos.id, photoComments.photoId))
      .where(eq(photos.userId, userId))
      .groupBy(photos.id, users.id)
      .orderBy(desc(photos.createdAt))
      .limit(limit)
      .offset(offset);

    return photoResults as PhotoWithDetails[];
  }

  async getPublicPhotos(limit = 20, offset = 0): Promise<PhotoWithDetails[]> {
    const photoResults = await db
      .select({
        id: photos.id,
        userId: photos.userId,
        imageData: photos.imageData,
        originalImageData: photos.originalImageData,
        filter: photos.filter,
        adjustments: photos.adjustments,
        textOverlays: photos.textOverlays,
        emojis: photos.emojis,
        templateId: photos.templateId,
        frameId: photos.frameId,
        isPublic: photos.isPublic,
        shareCode: photos.shareCode,
        title: photos.title,
        description: photos.description,
        tags: photos.tags,
        exportSettings: photos.exportSettings,
        viewCount: photos.viewCount,
        createdAt: photos.createdAt,
        updatedAt: photos.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture
        },
        likesCount: count(photoLikes.id),
        commentsCount: count(photoComments.id)
      })
      .from(photos)
      .leftJoin(users, eq(photos.userId, users.id))
      .leftJoin(photoLikes, eq(photos.id, photoLikes.photoId))
      .leftJoin(photoComments, eq(photos.id, photoComments.photoId))
      .where(eq(photos.isPublic, true))
      .groupBy(photos.id, users.id)
      .orderBy(desc(photos.createdAt))
      .limit(limit)
      .offset(offset);

    return photoResults as PhotoWithDetails[];
  }

  async updatePhoto(id: string, updates: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const [photo] = await db
      .update(photos)
      .set({ 
        ...updates, 
        updatedAt: new Date()
      } as any)
      .where(eq(photos.id, id))
      .returning();
    return photo || undefined;
  }

  async deletePhoto(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(photos)
      .where(and(eq(photos.id, id), eq(photos.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getPhotoByShareCode(shareCode: string): Promise<PhotoWithDetails | undefined> {
    const [photoResult] = await db
      .select({
        id: photos.id,
        userId: photos.userId,
        imageData: photos.imageData,
        originalImageData: photos.originalImageData,
        filter: photos.filter,
        adjustments: photos.adjustments,
        textOverlays: photos.textOverlays,
        emojis: photos.emojis,
        templateId: photos.templateId,
        frameId: photos.frameId,
        isPublic: photos.isPublic,
        shareCode: photos.shareCode,
        title: photos.title,
        description: photos.description,
        tags: photos.tags,
        exportSettings: photos.exportSettings,
        viewCount: photos.viewCount,
        createdAt: photos.createdAt,
        updatedAt: photos.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture
        },
        likesCount: count(photoLikes.id),
        commentsCount: count(photoComments.id)
      })
      .from(photos)
      .leftJoin(users, eq(photos.userId, users.id))
      .leftJoin(photoLikes, eq(photos.id, photoLikes.photoId))
      .leftJoin(photoComments, eq(photos.id, photoComments.photoId))
      .where(eq(photos.shareCode, shareCode))
      .groupBy(photos.id, users.id);

    if (photoResult) {
      // Increment view count
      await db
        .update(photos)
        .set({ viewCount: sql`${photos.viewCount} + 1` })
        .where(eq(photos.shareCode, shareCode));
    }

    return photoResult as PhotoWithDetails || undefined;
  }

  async generateShareCode(photoId: string): Promise<string> {
    const maxAttempts = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shareCode = this.generateUniqueShareCode();
      
      try {
        await db
          .update(photos)
          .set({ shareCode })
          .where(eq(photos.id, photoId));
        return shareCode;
      } catch (error: any) {
        // If it's a unique constraint violation on shareCode, retry
        if (error?.constraint_name === 'photos_share_code_unique' || 
            error?.code === '23505' && error?.detail?.includes('share_code')) {
          continue; // Try again with new shareCode
        }
        // For any other error, rethrow
        throw error;
      }
    }
    
    throw new Error('Failed to generate unique share code after maximum attempts');
  }

  // Photo interaction operations
  async likePhoto(photoLike: InsertPhotoLike): Promise<PhotoLike | undefined> {
    try {
      const [like] = await db
        .insert(photoLikes)
        .values(photoLike)
        .onConflictDoNothing()
        .returning();
      return like;
    } catch (error) {
      // Handle any other database errors
      console.error('Error liking photo:', error);
      return undefined;
    }
  }

  async unlikePhoto(photoId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(photoLikes)
      .where(and(eq(photoLikes.photoId, photoId), eq(photoLikes.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async addComment(comment: InsertPhotoComment): Promise<PhotoCommentWithUser | undefined> {
    const [newComment] = await db
      .insert(photoComments)
      .values(comment)
      .returning();
    
    if (newComment) {
      const [commentWithUser] = await db
        .select({
          id: photoComments.id,
          photoId: photoComments.photoId,
          userId: photoComments.userId,
          comment: photoComments.comment,
          createdAt: photoComments.createdAt,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            profilePicture: users.profilePicture
          }
        })
        .from(photoComments)
        .leftJoin(users, eq(photoComments.userId, users.id))
        .where(eq(photoComments.id, newComment.id));
      
      return commentWithUser as PhotoCommentWithUser;
    }
    return undefined;
  }

  async getPhotoComments(photoId: string, limit = 20, offset = 0): Promise<PhotoCommentWithUser[]> {
    const comments = await db
      .select({
        id: photoComments.id,
        photoId: photoComments.photoId,
        userId: photoComments.userId,
        comment: photoComments.comment,
        createdAt: photoComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture
        }
      })
      .from(photoComments)
      .leftJoin(users, eq(photoComments.userId, users.id))
      .where(eq(photoComments.photoId, photoId))
      .orderBy(desc(photoComments.createdAt))
      .limit(limit)
      .offset(offset);

    return comments as PhotoCommentWithUser[];
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(photoComments)
      .where(and(eq(photoComments.id, commentId), eq(photoComments.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async favoritePhoto(favorite: InsertUserFavorite): Promise<UserFavorite | undefined> {
    try {
      const [newFavorite] = await db
        .insert(userFavorites)
        .values(favorite)
        .onConflictDoNothing()
        .returning();
      return newFavorite;
    } catch (error) {
      // Handle any other database errors
      console.error('Error favoriting photo:', error);
      return undefined;
    }
  }

  async unfavoritePhoto(photoId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(userFavorites)
      .where(and(eq(userFavorites.photoId, photoId), eq(userFavorites.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserFavorites(userId: string, limit = 20, offset = 0): Promise<PhotoWithDetails[]> {
    const favoritePhotos = await db
      .select({
        id: photos.id,
        userId: photos.userId,
        imageData: photos.imageData,
        originalImageData: photos.originalImageData,
        filter: photos.filter,
        adjustments: photos.adjustments,
        textOverlays: photos.textOverlays,
        emojis: photos.emojis,
        templateId: photos.templateId,
        frameId: photos.frameId,
        isPublic: photos.isPublic,
        shareCode: photos.shareCode,
        title: photos.title,
        description: photos.description,
        tags: photos.tags,
        exportSettings: photos.exportSettings,
        viewCount: photos.viewCount,
        createdAt: photos.createdAt,
        updatedAt: photos.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          profilePicture: users.profilePicture
        },
        likesCount: count(photoLikes.id),
        commentsCount: count(photoComments.id)
      })
      .from(userFavorites)
      .leftJoin(photos, eq(userFavorites.photoId, photos.id))
      .leftJoin(users, eq(photos.userId, users.id))
      .leftJoin(photoLikes, eq(photos.id, photoLikes.photoId))
      .leftJoin(photoComments, eq(photos.id, photoComments.photoId))
      .where(eq(userFavorites.userId, userId))
      .groupBy(photos.id, users.id, userFavorites.id)
      .orderBy(desc(userFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    return favoritePhotos as PhotoWithDetails[];
  }

  // Template operations
  async getTemplates(category?: string): Promise<Template[]> {
    let query = db.select().from(templates).where(eq(templates.isActive, true));
    
    if (category) {
      query = db.select().from(templates).where(and(eq(templates.isActive, true), eq(templates.category, category)));
    }
    
    return await query.orderBy(templates.name);
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db
      .insert(templates)
      .values(template as any)
      .returning();
    return newTemplate;
  }

  // Frame operations
  async getFrames(category?: string): Promise<Frame[]> {
    let query = db.select().from(frames).where(eq(frames.isActive, true));
    
    if (category) {
      query = db.select().from(frames).where(and(eq(frames.isActive, true), eq(frames.category, category)));
    }
    
    return await query.orderBy(frames.name);
  }

  async getFrame(id: string): Promise<Frame | undefined> {
    const [frame] = await db.select().from(frames).where(eq(frames.id, id));
    return frame || undefined;
  }

  async createFrame(frame: InsertFrame): Promise<Frame> {
    const [newFrame] = await db
      .insert(frames)
      .values(frame as any)
      .returning();
    return newFrame;
  }

  // Session operations
  async createSession(userId: string, expiresAt: Date): Promise<UserSession> {
    // Generate cryptographically secure session token (32 bytes)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    const [session] = await db
      .insert(userSessions)
      .values({ userId, sessionToken, expiresAt })
      .returning();
    return session;
  }

  async getSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.sessionToken, sessionToken),
        sql`${userSessions.expiresAt} > NOW()`
      ));
    return session || undefined;
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    const result = await db
      .delete(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
    return (result.rowCount ?? 0) > 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await db
      .delete(userSessions)
      .where(sql`${userSessions.expiresAt} <= NOW()`);
    return result.rowCount ?? 0;
  }

  // Helper methods
  private generateUniqueShareCode(): string {
    // Generate 6-byte random string and encode as base64url for shorter codes
    return crypto.randomBytes(6).toString('base64url').substring(0, 8).toUpperCase();
  }
}

export const storage = new DatabaseStorage();