import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertPhotoSchema, insertPhotoLikeSchema, 
  insertPhotoCommentSchema, insertUserFavoriteSchema,
  type SafeUser, type SafeUserProfile
} from "@shared/schema";
import { z } from "zod";

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

async function authenticateUser(req: AuthenticatedRequest, res: Response, next: Function) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionToken;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const session = await storage.getSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Return safe user without password
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      profilePicture: user.profilePicture,
      isPublic: user.isPublic,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const user = await storage.createUser(validatedData);
      
      // Create session (30 days)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const session = await storage.createSession(user.id, expiresAt);
      
      // Set session cookie
      res.cookie('sessionToken', session.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Return safe user data
      const safeUser: SafeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isPublic: user.isPublic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({ user: safeUser, sessionToken: session.sessionToken });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Create session (30 days)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const session = await storage.createSession(user.id, expiresAt);
      
      // Set session cookie
      res.cookie('sessionToken', session.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Return safe user data
      const safeUser: SafeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isPublic: user.isPublic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({ user: safeUser, sessionToken: session.sessionToken });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionToken;
      
      if (sessionToken) {
        await storage.deleteSession(sessionToken);
      }
      
      res.clearCookie('sessionToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Get current user
  app.get('/api/auth/me', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // User profile routes
  app.get('/api/users/:id/profile', async (req: Request, res: Response) => {
    try {
      const profile = await storage.getUserProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  app.put('/api/users/profile', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updateData = z.object({
        displayName: z.string().optional(),
        bio: z.string().optional(),
        profilePicture: z.string().optional(),
        isPublic: z.boolean().optional()
      }).parse(req.body);

      const updatedUser = await storage.updateUser(req.user!.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return safe user data
      const safeUser: SafeUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        profilePicture: updatedUser.profilePicture,
        isPublic: updatedUser.isPublic,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

      res.json({ user: safeUser });
    } catch (error) {
      console.error('Update profile error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Photo routes
  app.post('/api/photos', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = insertPhotoSchema.parse(req.body);
      const photoData = { ...validatedData, userId: req.user!.id };
      
      const photo = await storage.createPhoto(photoData);
      
      res.json({ photo });
    } catch (error) {
      console.error('Create photo error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid photo data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create photo' });
    }
  });

  app.get('/api/photos/public', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      
      const photos = await storage.getPublicPhotos(limit, offset);
      
      res.json({ photos });
    } catch (error) {
      console.error('Get public photos error:', error);
      res.status(500).json({ error: 'Failed to get public photos' });
    }
  });

  app.get('/api/photos/:id', async (req: Request, res: Response) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      res.json({ photo });
    } catch (error) {
      console.error('Get photo error:', error);
      res.status(500).json({ error: 'Failed to get photo' });
    }
  });

  app.get('/api/users/:userId/photos', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      
      const photos = await storage.getPhotosByUser(req.params.userId, limit, offset);
      
      res.json({ photos });
    } catch (error) {
      console.error('Get user photos error:', error);
      res.status(500).json({ error: 'Failed to get user photos' });
    }
  });

  app.put('/api/photos/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updateData = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
        tags: z.array(z.string()).optional()
      }).parse(req.body);

      // Check ownership
      const existingPhoto = await storage.getPhoto(req.params.id);
      if (!existingPhoto || existingPhoto.userId !== req.user!.id) {
        return res.status(404).json({ error: 'Photo not found or access denied' });
      }

      const updatedPhoto = await storage.updatePhoto(req.params.id, updateData);
      
      res.json({ photo: updatedPhoto });
    } catch (error) {
      console.error('Update photo error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid photo data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update photo' });
    }
  });

  app.delete('/api/photos/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.deletePhoto(req.params.id, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ error: 'Photo not found or access denied' });
      }
      
      res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({ error: 'Failed to delete photo' });
    }
  });

  app.get('/api/photos/share/:shareCode', async (req: Request, res: Response) => {
    try {
      const photo = await storage.getPhotoByShareCode(req.params.shareCode);
      
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      res.json({ photo });
    } catch (error) {
      console.error('Get shared photo error:', error);
      res.status(500).json({ error: 'Failed to get shared photo' });
    }
  });

  // Photo interaction routes
  app.post('/api/photos/:id/like', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const photoLike = { photoId: req.params.id, userId: req.user!.id };
      
      const like = await storage.likePhoto(photoLike);
      
      if (!like) {
        return res.status(400).json({ error: 'Already liked or photo not found' });
      }
      
      res.json({ like });
    } catch (error) {
      console.error('Like photo error:', error);
      res.status(500).json({ error: 'Failed to like photo' });
    }
  });

  app.delete('/api/photos/:id/like', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.unlikePhoto(req.params.id, req.user!.id);
      
      res.json({ success });
    } catch (error) {
      console.error('Unlike photo error:', error);
      res.status(500).json({ error: 'Failed to unlike photo' });
    }
  });

  app.post('/api/photos/:id/comments', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = insertPhotoCommentSchema.parse({ ...req.body, photoId: req.params.id });
      const commentData = { ...validatedData, userId: req.user!.id };
      
      const comment = await storage.addComment(commentData);
      
      if (!comment) {
        return res.status(400).json({ error: 'Failed to add comment' });
      }
      
      res.json({ comment });
    } catch (error) {
      console.error('Add comment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid comment data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  app.get('/api/photos/:id/comments', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      
      const comments = await storage.getPhotoComments(req.params.id, limit, offset);
      
      res.json({ comments });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Failed to get comments' });
    }
  });

  app.delete('/api/comments/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.deleteComment(req.params.id, req.user!.id);
      
      if (!success) {
        return res.status(404).json({ error: 'Comment not found or access denied' });
      }
      
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  app.post('/api/photos/:id/favorite', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const favorite = { photoId: req.params.id, userId: req.user!.id };
      
      const newFavorite = await storage.favoritePhoto(favorite);
      
      if (!newFavorite) {
        return res.status(400).json({ error: 'Already favorited or photo not found' });
      }
      
      res.json({ favorite: newFavorite });
    } catch (error) {
      console.error('Favorite photo error:', error);
      res.status(500).json({ error: 'Failed to favorite photo' });
    }
  });

  app.delete('/api/photos/:id/favorite', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.unfavoritePhoto(req.params.id, req.user!.id);
      
      res.json({ success });
    } catch (error) {
      console.error('Unfavorite photo error:', error);
      res.status(500).json({ error: 'Failed to unfavorite photo' });
    }
  });

  app.get('/api/users/:userId/favorites', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      
      const photos = await storage.getUserFavorites(req.params.userId, limit, offset);
      
      res.json({ photos });
    } catch (error) {
      console.error('Get user favorites error:', error);
      res.status(500).json({ error: 'Failed to get user favorites' });
    }
  });

  // Template and Frame routes
  app.get('/api/templates', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const templates = await storage.getTemplates(category);
      
      res.json({ templates });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  });

  app.get('/api/frames', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const frames = await storage.getFrames(category);
      
      res.json({ frames });
    } catch (error) {
      console.error('Get frames error:', error);
      res.status(500).json({ error: 'Failed to get frames' });
    }
  });

  // Initialize multi-photo photobooth frames if they don't exist
  const initializePhotoboothFrames = async () => {
    try {
      const existingFrames = await storage.getFrames('photobooth');
      if (existingFrames.length === 0) {
        // Create couples frame (2 photos)
        await storage.createFrame({
          name: "Couples Photobooth",
          description: "Perfect for couples - side by side photo layout",
          category: "photobooth",
          config: {
            layoutType: "couples",
            borderStyle: "solid",
            borderWidth: 15,
            borderColor: "#ffffff",
            borderRadius: 10,
            backgroundStyle: {
              gradient: "linear-gradient(45deg, #ff6b9d, #c44569)"
            },
            photoSlots: [
              {
                id: "left",
                x: 5,
                y: 15,
                width: 40,
                height: 70,
                borderRadius: 8
              },
              {
                id: "right", 
                x: 55,
                y: 15,
                width: 40,
                height: 70,
                borderRadius: 8
              }
            ]
          },
          isPremium: false,
          isActive: true
        });

        // Create friends frame (3 photos)
        await storage.createFrame({
          name: "Friends Photobooth",
          description: "Perfect for friends - triple photo strip layout",
          category: "photobooth", 
          config: {
            layoutType: "friends",
            borderStyle: "solid",
            borderWidth: 12,
            borderColor: "#ffffff",
            borderRadius: 15,
            backgroundStyle: {
              gradient: "linear-gradient(135deg, #667eea, #764ba2)"
            },
            photoSlots: [
              {
                id: "top",
                x: 20,
                y: 8,
                width: 60,
                height: 25,
                borderRadius: 10
              },
              {
                id: "middle",
                x: 20,
                y: 37.5,
                width: 60,
                height: 25,
                borderRadius: 10
              },
              {
                id: "bottom",
                x: 20,
                y: 67,
                width: 60,
                height: 25,
                borderRadius: 10
              }
            ]
          },
          isPremium: false,
          isActive: true
        });

        console.log('Multi-photo photobooth frames initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing photobooth frames:', error);
    }
  };

  // Initialize frames on server start
  initializePhotoboothFrames();

  const httpServer = createServer(app);

  return httpServer;
}
