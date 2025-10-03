import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, json, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with enhanced profile information
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  usernameIdx: index("username_idx").on(table.username),
  emailIdx: index("email_idx").on(table.email),
}));

// Photos table with comprehensive metadata
export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  imageData: text("image_data").notNull(), // Base64 encoded image
  originalImageData: text("original_image_data"), // Original unedited image
  filter: text("filter").default("none"),
  adjustments: json("adjustments").$type<{
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
    blur?: number;
    sepia?: number;
    grayscale?: number;
    invert?: number;
  }>(),
  textOverlays: json("text_overlays").$type<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    rotation: number;
    shadow: boolean;
    outline: boolean;
  }>>(),
  emojis: json("emojis").$type<Array<{
    id: string;
    emoji: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>>(),
  templateId: varchar("template_id").references(() => templates.id),
  frameId: varchar("frame_id").references(() => frames.id),
  isPublic: boolean("is_public").default(false),
  shareCode: varchar("share_code").unique(),
  title: text("title"),
  description: text("description"),
  tags: json("tags").$type<string[]>(),
  exportSettings: json("export_settings").$type<{
    format: "png" | "jpg" | "webp";
    quality: number;
    watermark: boolean;
  }>(),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("photos_user_id_idx").on(table.userId),
  shareCodeIdx: index("photos_share_code_idx").on(table.shareCode),
  isPublicIdx: index("photos_is_public_idx").on(table.isPublic),
  createdAtIdx: index("photos_created_at_idx").on(table.createdAt),
  // Composite indexes for common queries
  publicCreatedAtIdx: index("photos_public_created_at_idx").on(table.isPublic, table.createdAt),
  userCreatedAtIdx: index("photos_user_created_at_idx").on(table.userId, table.createdAt),
}));

// Photo likes
export const photoLikes = pgTable("photo_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  photoId: varchar("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  photoUserIdx: index("photo_likes_photo_user_idx").on(table.photoId, table.userId),
  photoIdIdx: index("photo_likes_photo_id_idx").on(table.photoId),
  uniquePhotoUserLike: unique("unique_photo_user_like").on(table.photoId, table.userId),
}));

// Photo comments
export const photoComments = pgTable("photo_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  photoId: varchar("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  photoIdIdx: index("photo_comments_photo_id_idx").on(table.photoId),
  createdAtIdx: index("photo_comments_created_at_idx").on(table.createdAt),
}));

// User favorites (bookmarked photos)
export const userFavorites = pgTable("user_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  photoId: varchar("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userPhotoIdx: index("user_favorites_user_photo_idx").on(table.userId, table.photoId),
  uniqueUserPhotoFavorite: unique("unique_user_photo_favorite").on(table.userId, table.photoId),
}));

// Photo templates
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "birthday", "wedding", "travel", etc.
  thumbnailUrl: text("thumbnail_url"),
  config: json("config").$type<{
    backgroundColor?: string;
    backgroundImage?: string;
    textElements?: Array<{
      text: string;
      x: number;
      y: number;
      fontSize: number;
      fontFamily: string;
      color: string;
    }>;
    decorativeElements?: Array<{
      type: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
    }>;
  }>(),
  isPremium: boolean("is_premium").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("templates_category_idx").on(table.category),
  activeIdx: index("templates_active_idx").on(table.isActive),
}));

// Photo frames
export const frames = pgTable("frames", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "classic", "modern", "vintage", etc.
  thumbnailUrl: text("thumbnail_url"),
  frameImageUrl: text("frame_image_url"), // URL to frame overlay image
  config: json("config").$type<{
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    shadowConfig?: {
      enabled: boolean;
      blur: number;
      color: string;
      offsetX: number;
      offsetY: number;
    };
    // Multi-photo layout configuration
    layoutType?: "single" | "couples" | "friends"; // New layout types
    photoSlots?: Array<{
      id: string;
      x: number; // Position within frame (percentage)
      y: number;
      width: number; // Size within frame (percentage)
      height: number;
      rotation?: number;
      borderRadius?: number;
    }>;
    backgroundStyle?: {
      color?: string;
      gradient?: string;
      pattern?: string;
    };
  }>(),
  isPremium: boolean("is_premium").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("frames_category_idx").on(table.category),
  activeIdx: index("frames_active_idx").on(table.isActive),
}));

// User sessions for authentication
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionTokenIdx: index("user_sessions_token_idx").on(table.sessionToken),
  userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
}));

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  photos: many(photos),
  photoLikes: many(photoLikes),
  photoComments: many(photoComments),
  favorites: many(userFavorites),
  sessions: many(userSessions),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [photos.templateId],
    references: [templates.id],
  }),
  frame: one(frames, {
    fields: [photos.frameId],
    references: [frames.id],
  }),
  likes: many(photoLikes),
  comments: many(photoComments),
  favorites: many(userFavorites),
}));

export const photoLikesRelations = relations(photoLikes, ({ one }) => ({
  photo: one(photos, {
    fields: [photoLikes.photoId],
    references: [photos.id],
  }),
  user: one(users, {
    fields: [photoLikes.userId],
    references: [users.id],
  }),
}));

export const photoCommentsRelations = relations(photoComments, ({ one }) => ({
  photo: one(photos, {
    fields: [photoComments.photoId],
    references: [photos.id],
  }),
  user: one(users, {
    fields: [photoComments.userId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  photo: one(photos, {
    fields: [userFavorites.photoId],
    references: [photos.id],
  }),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  photos: many(photos),
}));

export const framesRelations = relations(frames, ({ many }) => ({
  photos: many(photos),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// Create insert and select schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
  bio: true,
  profilePicture: true,
  isPublic: true,
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  imageData: true,
  originalImageData: true,
  filter: true,
  adjustments: true,
  textOverlays: true,
  emojis: true,
  templateId: true,
  frameId: true,
  isPublic: true,
  title: true,
  description: true,
  tags: true,
  exportSettings: true,
});

export const insertPhotoLikeSchema = createInsertSchema(photoLikes).pick({
  photoId: true,
});

export const insertPhotoCommentSchema = createInsertSchema(photoComments).pick({
  photoId: true,
  comment: true,
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).pick({
  photoId: true,
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  description: true,
  category: true,
  thumbnailUrl: true,
  config: true,
  isPremium: true,
  isActive: true,
});

export const insertFrameSchema = createInsertSchema(frames).pick({
  name: true,
  description: true,
  category: true,
  thumbnailUrl: true,
  frameImageUrl: true,
  config: true,
  isPremium: true,
  isActive: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema> & { userId: string };
export type Photo = typeof photos.$inferSelect;
export type InsertPhotoLike = z.infer<typeof insertPhotoLikeSchema> & { userId: string };
export type PhotoLike = typeof photoLikes.$inferSelect;
export type InsertPhotoComment = z.infer<typeof insertPhotoCommentSchema> & { userId: string };
export type PhotoComment = typeof photoComments.$inferSelect;
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema> & { userId: string };
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertFrame = z.infer<typeof insertFrameSchema>;
export type Frame = typeof frames.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;

// Extended types with relations for API responses
export type PhotoWithDetails = Photo & {
  user: Pick<User, "id" | "username" | "displayName" | "profilePicture">;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser?: boolean;
  isFavoritedByCurrentUser?: boolean;
  template?: Template;
  frame?: Frame;
};

export type PhotoCommentWithUser = PhotoComment & {
  user: Pick<User, "id" | "username" | "displayName" | "profilePicture">;
};

// Safe user types that exclude password
export type SafeUser = Omit<User, "password">;
export type SafeUserProfile = Omit<User, "password"> & {
  photosCount: number;
  followersCount?: number;
  followingCount?: number;
};

export type UserProfile = User & {
  photosCount: number;
  followersCount?: number;
  followingCount?: number;
};