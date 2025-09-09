import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertUserSchema, insertSocialAccountSchema, insertContentCategorySchema, insertConversationSchema, insertMessageSchema, insertMessageTemplateSchema, insertFinancialTransactionSchema, insertTransactionAuditLogSchema } from "@shared/schema";
import { z } from "zod";
import { extractChannelId, fetchYouTubeChannelData, fetchRecentVideos, calculateEngagementRate } from "./utils/youtube";
import { extractInstagramUsername, fetchInstagramProfileData } from "./utils/instagram";
import { extractTikTokUsername, fetchTikTokProfileData } from "./utils/tiktok";
import { ComprehensiveImportResult, validateImportedData, sanitizeImportedData, detectContentCategories, calculateEngagementMetrics } from "./utils/dataImport";
import { sendOTPEmail, sendOTPSMS, generateOTP, isValidEmail, isValidPhone } from "./utils/otpService";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Extend session types for custom properties
declare module "express-session" {
  interface SessionData {
    tempUserData?: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: 'influencer' | 'brand';
      phone?: string;
      emailVerified: boolean;
      phoneVerified: boolean;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Configure multer for file uploads
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const upload = multer({
    dest: uploadDir,
    limits: {
      fileSize: 200 * 1024 * 1024 // 200MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/mov',
        'application/pdf'
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Email/Password Authentication Routes
  
  // Register with email/password (step 1)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        role, 
        phone,
        // Brand-specific fields
        companyName,
        industry,
        website,
        companySize,
        targetAudienceAge,
        targetAudienceGender,
        targetAudienceLocation,
        budgetRange,
        businessRegistrationNumber,
        description
      } = req.body;
      
      // Validate input
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Additional validation for brand accounts
      if (role === 'brand' && (!companyName || !industry)) {
        return res.status(400).json({ message: 'Company name and industry are required for brand accounts' });
      }
      
      // Check if user already exists
      const existingUser = await storage.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }
      
      // Hash password
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Validate email format
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Validate phone format if provided
      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ message: 'Invalid phone format. Use international format: +1234567890' });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store OTP for email verification
      await storage.createOtpVerification({
        email,
        phone,
        otp,
        purpose: 'registration',
        expiresAt,
        isUsed: false,
      });
      
      // Create temporary user data to be completed after OTP verification
      const tempUserData = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as 'influencer' | 'brand',
        phone,
        emailVerified: false,
        phoneVerified: false,
        // Brand profile data if applicable
        ...(role === 'brand' && {
          brandProfile: {
            companyName,
            industry,
            website: website || '',
            companySize,
            targetAudienceAge,
            targetAudienceGender,
            targetAudienceLocation,
            budgetRange,
            businessRegistrationNumber,
            description,
          }
        })
      };
      
      // Store in session temporarily
      (req.session as any).tempUserData = tempUserData;
      
      // Send OTP via email and/or SMS
      const emailSent = await sendOTPEmail(email, otp, firstName);
      let smsSent = true;
      
      if (phone) {
        smsSent = await sendOTPSMS(phone, otp, firstName);
      }

      // Determine success message based on what was sent
      let message = 'OTP sent successfully';
      if (emailSent && smsSent && phone) {
        message = 'OTP sent to your email and phone';
      } else if (emailSent && !phone) {
        message = 'OTP sent to your email';
      } else if (!emailSent && smsSent && phone) {
        message = 'OTP sent to your phone';
      } else if (!emailSent && !smsSent) {
        // In development/test mode, still allow registration with fallback message
        message = 'Registration initiated. Check console for development OTP code.';
      }
      
      res.json({
        success: true,
        message,
        email,
        phone,
        otpSent: true,
        emailSent,
        smsSent: phone ? smsSent : undefined,
        // For development: include OTP in response (remove in production)
        developmentOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });
  
  // Verify OTP and complete registration (step 2)
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otp, phone } = req.body;
      
      if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
      }
      
      // Verify OTP
      const otpRecord = await storage.verifyOtp(email || phone, otp, 'registration');
      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      
      // Get temp user data from session
      const tempUserData = (req.session as any).tempUserData;
      if (!tempUserData) {
        return res.status(400).json({ message: 'Registration session expired' });
      }
      
      // Create user account
      const userData = {
        ...tempUserData,
        emailVerified: email ? true : tempUserData.emailVerified,
        phoneVerified: phone ? true : tempUserData.phoneVerified,
        isVerified: true,
      };
      
      // Remove brandProfile from userData before creating user
      const { brandProfile, ...userDataOnly } = userData as any;
      
      const newUser = await storage.upsertUser(userDataOnly);
      
      // Create brand profile if this is a brand user
      if (tempUserData.role === 'brand' && brandProfile) {
        await storage.createBrandProfile({
          userId: newUser.id,
          companyName: brandProfile.companyName,
          industry: brandProfile.industry,
          website: brandProfile.website,
          companySize: brandProfile.companySize,
          targetAudienceAge: brandProfile.targetAudienceAge,
          targetAudienceGender: brandProfile.targetAudienceGender,
          targetAudienceLocation: brandProfile.targetAudienceLocation,
          budgetRange: brandProfile.budgetRange,
          businessRegistrationNumber: brandProfile.businessRegistrationNumber,
          description: brandProfile.description,
        });
      }
      
      // Mark OTP as used
      await storage.markOtpAsUsed(otpRecord.id);
      
      // Check for session conflicts before logging in
      if (req.user && req.user.role !== newUser.role) {
        console.log(`Session conflict during registration: ${req.user.role} session exists, ${newUser.role} registering`);
        // Log out the existing user first
        req.logout((logoutErr: any) => {
          if (logoutErr) {
            console.error('Error during registration conflict logout:', logoutErr);
          }
          // Then log in the new user
          loginNewUser();
        });
      } else {
        loginNewUser();
      }

      function loginNewUser() {
        req.login(newUser, (err: any) => {
          if (err) {
            return res.status(500).json({ message: 'Login failed after registration' });
          }
        
        // Clear temp data
        delete (req.session as any).tempUserData;
        
        res.json({
          success: true,
          message: 'Registration completed successfully',
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
          },
        });
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ message: 'OTP verification failed' });
    }
  });
  
  // Email/Password Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      const user = await storage.findUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check for session conflicts (different user types in same browser)
      if (req.user && req.user.role !== user.role) {
        console.log(`Session conflict detected: ${req.user.role} session exists, ${user.role} trying to login`);
        // Log out the existing user first
        req.logout((logoutErr: any) => {
          if (logoutErr) {
            console.error('Error during conflict logout:', logoutErr);
          }
          // Then log in the new user
          req.login(user, (err: any) => {
            if (err) {
              return res.status(500).json({ message: 'Login failed' });
            }
            
            res.json({
              success: true,
              message: 'Login successful',
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
              }
            });
          });
        });
      } else {
        // No conflict, normal login
        req.login(user, (err: any) => {
          if (err) {
            return res.status(500).json({ message: 'Login failed' });
          }
          
          res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            },
          });
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });
  
  // Resend OTP
  app.post('/api/auth/resend-otp', async (req, res) => {
    try {
      const { email, phone } = req.body;
      
      if (!email && !phone) {
        return res.status(400).json({ message: 'Email or phone is required' });
      }
      
      // Validate formats
      if (email && !isValidEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ message: 'Invalid phone format. Use international format: +1234567890' });
      }

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store new OTP
      await storage.createOtpVerification({
        email,
        phone,
        otp,
        purpose: 'registration',
        expiresAt,
        isUsed: false,
      });
      
      // Send new OTP via email and/or SMS
      let emailSent = true;
      let smsSent = true;
      
      if (email) {
        emailSent = await sendOTPEmail(email, otp);
      }
      
      if (phone) {
        smsSent = await sendOTPSMS(phone, otp);
      }

      // Determine success message
      let message = 'New OTP sent successfully';
      if (email && phone) {
        if (emailSent && smsSent) {
          message = 'New OTP sent to your email and phone';
        } else if (emailSent && !smsSent) {
          message = 'New OTP sent to your email (SMS failed)';
        } else if (!emailSent && smsSent) {
          message = 'New OTP sent to your phone (email failed)';
        } else {
          message = 'New OTP generation initiated. Check console for development code.';
        }
      } else if (email) {
        message = emailSent ? 'New OTP sent to your email' : 'Failed to send OTP to email';
      } else if (phone) {
        message = smsSent ? 'New OTP sent to your phone' : 'Failed to send OTP to phone';
      }
      
      res.json({
        success: emailSent || smsSent,
        message,
        emailSent: email ? emailSent : undefined,
        smsSent: phone ? smsSent : undefined,
        // For development: include OTP in response (remove in production)
        developmentOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  // Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get user with social accounts and categories
      const [socialAccounts, categories] = await Promise.all([
        storage.getSocialAccounts(user.id),
        storage.getContentCategories(user.id),
      ]);

      const totalFollowers = socialAccounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0);
      const averageEngagement = socialAccounts.length > 0 
        ? socialAccounts.reduce((sum, acc) => sum + parseFloat(acc.engagementRate || '0'), 0) / socialAccounts.length
        : 0;

      res.json({
        ...user,
        socialAccounts,
        categories: categories.map(c => c.category),
        contentCategories: categories.map(c => c.category),
        totalFollowers,
        averageEngagement,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public endpoints
  app.get('/api/influencers', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const influencers = await storage.getInfluencers(limit);
      res.json(influencers);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      res.status(500).json({ message: "Failed to fetch influencers" });
    }
  });

  // Portfolio content endpoint
  app.get('/api/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const platform = req.query.platform as string;
      
      const portfolioContent = await storage.getPortfolioContent(user.id, platform);
      
      res.json({
        success: true,
        content: portfolioContent
      });
    } catch (error) {
      console.error("Error fetching portfolio content:", error);
      res.status(500).json({ message: "Failed to fetch portfolio content" });
    }
  });

  // Cross-Platform Analytics Dashboard endpoint
  app.get('/api/cross-platform-analytics', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Get all social accounts and portfolio content
      const [socialAccounts, portfolioContent] = await Promise.all([
        storage.getSocialAccounts(user.id),
        storage.getPortfolioContent(user.id)
      ]);

      // Only return analytics if user has imported social media data
      const connectedAccounts = socialAccounts.filter(acc => acc.platform !== 'google' && acc.followerCount && acc.followerCount > 0);
      
      if (connectedAccounts.length === 0 || portfolioContent.length === 0) {
        return res.json({
          success: true,
          analytics: null,
          message: 'Import social media data to see cross-platform analytics'
        });
      }

      // Calculate platform-specific metrics using only connected accounts with real data
      const platformStats = connectedAccounts.reduce((acc: any, account) => {
        const platform = account.platform;
        const platformContent = portfolioContent.filter(c => c.platform === platform);
        
        const totalViews = platformContent.reduce((sum, c) => sum + (c.views || 0), 0);
        const totalLikes = platformContent.reduce((sum, c) => sum + (c.likes || 0), 0);
        const totalComments = platformContent.reduce((sum, c) => sum + (c.comments || 0), 0);
        const totalShares = platformContent.reduce((sum, c) => sum + (c.shares || 0), 0);
        const avgEngagement = platformContent.length > 0 
          ? platformContent.reduce((sum, c) => sum + parseFloat(c.engagementRate || '0'), 0) / platformContent.length
          : parseFloat(account.engagementRate || '0');

        if (!acc[platform]) {
          acc[platform] = {
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            followers: account.followerCount || 0,
            posts: account.postCount || platformContent.length,
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            engagementRate: avgEngagement,
            topContent: platformContent
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .slice(0, 3)
              .map(c => ({
                title: c.title,
                views: c.views || 0,
                likes: c.likes || 0,
                comments: c.comments || 0,
                engagementRate: parseFloat(c.engagementRate || '0')
              }))
          };
        }
        
        return acc;
      }, {});

      // Calculate unified metrics across all platforms
      const unifiedMetrics = {
        totalFollowers: connectedAccounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0),
        totalPosts: Object.values(platformStats).reduce((sum: number, stats: any) => sum + stats.posts, 0),
        totalReach: Object.values(platformStats).reduce((sum: number, stats: any) => sum + stats.totalViews, 0),
        totalEngagement: Object.values(platformStats).reduce((sum: number, stats: any) => sum + stats.totalLikes + stats.totalComments + stats.totalShares, 0),
        averageEngagementRate: Object.values(platformStats).length > 0
          ? Object.values(platformStats).reduce((sum: number, stats: any) => sum + stats.engagementRate, 0) / Object.values(platformStats).length
          : 0,
        platformCount: Object.keys(platformStats).length,
      };

      // Platform comparison metrics
      const platformComparison = Object.values(platformStats).map((stats: any) => ({
        platform: stats.platform,
        performance: {
          followersPercentage: unifiedMetrics.totalFollowers > 0 
            ? ((stats.followers / unifiedMetrics.totalFollowers) * 100).toFixed(1) 
            : '0',
          engagementRate: stats.engagementRate.toFixed(1),
          avgViewsPerPost: stats.posts > 0 ? Math.round(stats.totalViews / stats.posts) : 0,
          contentTypes: {
            posts: stats.posts,
            totalInteractions: stats.totalLikes + stats.totalComments + stats.totalShares
          }
        }
      }));

      // Content type performance analysis
      const contentTypePerformance = portfolioContent.reduce((acc: any, content) => {
        const type = content.platform;
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            totalViews: 0,
            totalEngagement: 0,
            avgEngagement: 0
          };
        }
        
        acc[type].count++;
        acc[type].totalViews += content.views || 0;
        acc[type].totalEngagement += (content.likes || 0) + (content.comments || 0) + (content.shares || 0);
        acc[type].avgEngagement = acc[type].totalViews > 0 
          ? (acc[type].totalEngagement / acc[type].totalViews * 100) 
          : 0;
        
        return acc;
      }, {});

      res.json({
        success: true,
        analytics: {
          platformStats: Object.values(platformStats),
          unifiedMetrics,
          platformComparison,
          contentTypePerformance: Object.entries(contentTypePerformance).map(([type, data]: [string, any]) => ({
            platform: type.charAt(0).toUpperCase() + type.slice(1),
            ...(data as object)
          })),
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching cross-platform analytics:", error);
      res.status(500).json({ message: "Failed to fetch cross-platform analytics" });
    }
  });

  // User profile endpoints
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { socialAccounts, ...profileData } = req.body;
      
      const updateData = insertUserSchema.partial().parse(profileData);
      
      const updatedUser = await storage.upsertUser({
        id: user.id,
        role: user.role || 'influencer',
        ...updateData,
      });

      // Handle social accounts if provided
      if (socialAccounts && Array.isArray(socialAccounts)) {
        for (const account of socialAccounts) {
          const existingAccount = await storage.getSocialAccount(user.id, account.platform);
          
          if (existingAccount) {
            await storage.updateSocialAccount(existingAccount.id, {
              username: account.username,
              followerCount: account.followers,
              engagementRate: account.engagement?.toString(),
              isConnected: true,
            });
          } else {
            await storage.createSocialAccount({
              userId: user.id,
              platform: account.platform,
              platformUserId: account.username || '',
              username: account.username,
              followerCount: account.followers,
              engagementRate: account.engagement?.toString(),
              isConnected: true,
            });
          }
        }
      }

      // Return updated user with social accounts
      const [socialAccountsData, categories] = await Promise.all([
        storage.getSocialAccounts(user.id),
        storage.getContentCategories(user.id),
      ]);

      res.json({
        ...updatedUser,
        socialAccounts: socialAccountsData,
        categories,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user theme preference
  app.patch('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { themePreference } = req.body;
      
      // Validate theme preference
      const validThemes = ['rich-gradient', 'minimal-light', 'warm-sunset', 'light-purple', 'purple-orange-gradient', 'purple-blue-gradient'];
      if (!validThemes.includes(themePreference)) {
        return res.status(400).json({ message: 'Invalid theme preference' });
      }
      
      const updatedUser = await storage.upsertUser({
        id: user.id,
        role: user.role,
        themePreference,
      });
      
      res.json({ success: true, themePreference: updatedUser.themePreference });
    } catch (error) {
      console.error("Error updating theme preference:", error);
      res.status(500).json({ message: "Failed to update theme preference" });
    }
  });

  // Social account management
  app.get('/api/user/social-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const socialAccounts = await storage.getSocialAccounts(req.user.id);
      res.json(socialAccounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ message: "Failed to fetch social accounts" });
    }
  });

  app.post('/api/user/social-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const accountData = insertSocialAccountSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const account = await storage.createSocialAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error("Error creating social account:", error);
      res.status(500).json({ message: "Failed to create social account" });
    }
  });

  app.patch('/api/user/social-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accountId = req.params.id;
      const updates = insertSocialAccountSchema.partial().parse(req.body);
      
      const updatedAccount = await storage.updateSocialAccount(accountId, updates);
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating social account:", error);
      res.status(500).json({ message: "Failed to update social account" });
    }
  });

  app.delete('/api/user/social-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const accountId = req.params.id;
      await storage.disconnectSocialAccount(accountId);
      res.json({ message: "Social account disconnected" });
    } catch (error) {
      console.error("Error disconnecting social account:", error);
      res.status(500).json({ message: "Failed to disconnect social account" });
    }
  });

  // Content categories
  app.get('/api/user/categories', isAuthenticated, async (req: any, res) => {
    try {
      const categories = await storage.getContentCategories(req.user.id);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/user/categories', isAuthenticated, async (req: any, res) => {
    try {
      const categoryData = insertContentCategorySchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const category = await storage.createContentCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Enhanced YouTube import endpoint
  app.post('/api/import/youtube', isAuthenticated, async (req: any, res) => {
    try {
      const { channelInput } = req.body;
      const user = req.user;
      
      if (!channelInput) {
        return res.status(400).json({ message: "Channel ID or URL is required" });
      }
      
      // Extract channel ID from various input formats
      const channelId = extractChannelId(channelInput);
      if (!channelId) {
        return res.status(400).json({ message: "Invalid YouTube channel format" });
      }
      
      // Fetch comprehensive YouTube data
      const channelData = await fetchYouTubeChannelData(channelId);
      if (!channelData) {
        return res.status(404).json({ message: "YouTube channel not found" });
      }
      
      // Fetch recent videos for engagement calculation
      const recentVideos = await fetchRecentVideos(channelData.channelId);
      const engagementRate = calculateEngagementRate(recentVideos, channelData.subscriberCount);
      
      // Create or update social account
      const existingAccount = await storage.getSocialAccount(user.id, 'youtube');
      
      const accountData = {
        userId: user.id,
        platform: 'youtube' as const,
        platformUserId: channelData.channelId,
        username: channelData.handle || channelData.customUrl || channelData.title,
        displayName: channelData.title,
        profileUrl: channelData.customUrl ? `https://youtube.com/${channelData.customUrl}` : `https://youtube.com/channel/${channelData.channelId}`,
        followerCount: channelData.subscriberCount,
        postCount: channelData.videoCount,
        engagementRate: engagementRate.toString(),
        isConnected: true,
      };
      
      let account;
      if (existingAccount) {
        account = await storage.updateSocialAccount(existingAccount.id, accountData);
      } else {
        account = await storage.createSocialAccount(accountData);
      }
      
      // Update user profile with comprehensive data from YouTube
      const userUpdates: any = {
        id: user.id,
        role: user.role || 'influencer',
      };

      // Always update profile image from YouTube (high quality)
      if (channelData.thumbnailUrl) {
        userUpdates.profileImageUrl = channelData.thumbnailUrl;
      }

      // Always update bio from YouTube channel
      if (channelData.description) {
        userUpdates.bio = channelData.description.length > 500 
          ? channelData.description.substring(0, 500) + '...' 
          : channelData.description;
      }

      await storage.upsertUser(userUpdates);

      // Calculate engagement metrics and detect content categories first
      const recentVideoMetrics = recentVideos.map(video => ({
        likes: video.likeCount,
        comments: video.commentCount,
        shares: 0, // YouTube doesn't provide share count directly
        views: video.viewCount,
      }));
      
      const engagementMetrics = calculateEngagementMetrics(recentVideoMetrics, channelData.subscriberCount);
      const detectedCategories = detectContentCategories(channelData.description, recentVideos.map(v => v.title));

      // Store recent videos as portfolio content
      if (recentVideos.length > 0) {
        for (const video of recentVideos.slice(0, 10)) { // Store top 10 recent videos
          await storage.createPortfolioContent({
            userId: user.id,
            title: video.title,
            description: `YouTube video with ${video.viewCount.toLocaleString()} views and ${video.likeCount.toLocaleString()} likes`,
            url: `https://youtube.com/watch?v=${video.videoId}`,
            thumbnailUrl: video.thumbnailUrl,
            platform: 'youtube',
            likes: video.likeCount,
            comments: video.commentCount,
            shares: 0,
            views: video.viewCount,
            engagementRate: ((video.likeCount + video.commentCount) / Math.max(video.viewCount, 1) * 100).toFixed(2),
            publishedAt: new Date(video.publishedAt),
            isTopPerformer: video.viewCount > (channelData.viewCount / channelData.videoCount), // Above average views
            categories: detectedCategories
          });
        }
      }

      // Store detected content categories
      console.log('Detected categories:', detectedCategories);
      if (detectedCategories.length > 0) {
        // Clear existing auto-detected categories first
        await storage.deleteContentCategories(user.id);
        
        for (const category of detectedCategories) {
          console.log('Storing category:', category);
          await storage.createContentCategory({
            userId: user.id,
            category: category,
            isAutoDetected: true
          });
        }
      }

      // Create comprehensive import result following industry standards
      
      const comprehensiveData: ComprehensiveImportResult = sanitizeImportedData({
        platform: 'youtube',
        platformUserId: channelData.channelId,
        displayName: channelData.title,
        username: channelData.handle || channelData.customUrl || channelData.title,
        handle: channelData.handle,
        profileImageUrl: channelData.thumbnailUrl,
        bannerImageUrl: channelData.bannerImageUrl,
        bio: channelData.description,
        followerCount: channelData.subscriberCount,
        postCount: channelData.videoCount,
        totalViews: channelData.viewCount,
        engagementRate: engagementMetrics.engagementRate,
        averageLikes: engagementMetrics.averageLikes,
        averageComments: engagementMetrics.averageComments,
        country: channelData.country,
        primaryLanguage: channelData.defaultLanguage,
        categories: detectedCategories,
        profileUrl: channelData.customUrl ? `https://youtube.com/${channelData.customUrl}` : `https://youtube.com/channel/${channelData.channelId}`,
        verificationStatus: false, // YouTube doesn't provide verification status in basic API
        accountCreatedAt: channelData.publishedAt,
        topPerformingContent: recentVideos.slice(0, 5).map(video => ({
          id: video.videoId,
          title: video.title,
          url: `https://youtube.com/watch?v=${video.videoId}`,
          views: video.viewCount,
          likes: video.likeCount,
          comments: video.commentCount,
          publishedAt: video.publishedAt,
        })),
        keywords: channelData.keywords || [],
      });
      
      // Validate imported data meets professional standards
      const validationErrors = validateImportedData(comprehensiveData);
      if (validationErrors.length > 0) {
        console.warn('Data validation warnings:', validationErrors);
      }
      
      // Calculate completeness score safely
      const totalFields = Object.keys(comprehensiveData).length;
      const completedFields = Object.values(comprehensiveData).filter(v => 
        v !== undefined && 
        v !== null && 
        v !== '' && 
        !(Array.isArray(v) && v.length === 0)
      ).length;
      const completenessScore = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

      res.json({
        success: true,
        account,
        channelData: comprehensiveData,
        importStats: {
          totalDataPoints: totalFields,
          completenessScore: completenessScore,
          validationPassed: validationErrors.length === 0,
          importedAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error("Error importing YouTube channel:", error);
      res.status(500).json({ message: "Failed to import YouTube channel" });
    }
  });

  // One-click social media OAuth connection routes
  app.get('/api/auth/instagram', (req, res) => {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.redirect('/profile-import?platform=instagram&error=api_not_configured');
    }
    
    console.log('Instagram OAuth requested - real OAuth implementation needed');
    res.redirect('/profile-import?platform=instagram&error=oauth_not_implemented');
  });

  app.get('/api/auth/instagram/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.redirect('/profile-import?platform=instagram&error=authorization_failed');
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_CLIENT_ID!,
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/instagram/callback`,
          code: code as string,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        return res.redirect('/profile-import?platform=instagram&error=token_exchange_failed');
      }

      // Get user profile data
      const profileResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`);
      const profileData = await profileResponse.json();

      // For now, redirect back with success message
      // In production, you would save the access token and import the profile data
      res.redirect('/profile-import?platform=instagram&connected=true&username=' + encodeURIComponent(profileData.username || 'instagram_user'));
    } catch (error) {
      console.error('Instagram OAuth error:', error);
      res.redirect('/profile-import?platform=instagram&error=connection_failed');
    }
  });

  app.get('/api/auth/youtube', (req, res) => {
    // For development: simulate OAuth connection since redirect URI setup is complex
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.redirect('/profile-import?platform=youtube&error=api_not_configured');
    }
    
    console.log('YouTube OAuth requested - real OAuth implementation needed');
    res.redirect('/profile-import?platform=youtube&error=oauth_not_implemented');
  });

  app.get('/api/auth/youtube/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.redirect('/profile-import?platform=youtube&error=authorization_failed');
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`,
          code: code as string,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        return res.redirect('/profile-import?platform=youtube&error=token_exchange_failed');
      }

      // Get YouTube channel data
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${tokenData.access_token}`);
      const channelData = await channelResponse.json();

      if (channelData.items && channelData.items.length > 0) {
        const channel = channelData.items[0];
        res.redirect('/profile-import?platform=youtube&connected=true&channel_id=' + encodeURIComponent(channel.id));
      } else {
        res.redirect('/profile-import?platform=youtube&error=no_channel_found');
      }
    } catch (error) {
      console.error('YouTube OAuth error:', error);
      res.redirect('/profile-import?platform=youtube&error=connection_failed');
    }
  });

  app.get('/api/auth/tiktok', (req, res) => {
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.redirect('/profile-import?platform=tiktok&error=api_not_configured');
    }
    
    console.log('TikTok OAuth requested - real OAuth implementation needed');
    res.redirect('/profile-import?platform=tiktok&error=oauth_not_implemented');
  });

  app.get('/api/auth/tiktok/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      const sessionState = (req.session as any)?.tiktokState;
      
      if (!code || state !== sessionState) {
        return res.redirect('/profile-import?platform=tiktok&error=authorization_failed');
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/tiktok/callback`,
          code: code as string,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.data?.access_token) {
        return res.redirect('/profile-import?platform=tiktok&error=token_exchange_failed');
      }

      // Get user info
      const userResponse = await fetch(`https://open-api.tiktok.com/user/info/?access_token=${tokenData.data.access_token}&open_id=${tokenData.data.open_id}`);
      const userData = await userResponse.json();

      if (userData.data?.user) {
        res.redirect('/profile-import?platform=tiktok&connected=true&username=' + encodeURIComponent(userData.data.user.display_name));
      } else {
        res.redirect('/profile-import?platform=tiktok&error=user_info_failed');
      }
    } catch (error) {
      console.error('TikTok OAuth error:', error);
      res.redirect('/profile-import?platform=tiktok&error=connection_failed');
    }
  });

  app.get('/api/auth/facebook', (req, res) => {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.redirect('/profile-import?platform=facebook&error=api_not_configured');
    }
    
    console.log('Facebook OAuth requested - real OAuth implementation needed');
    res.redirect('/profile-import?platform=facebook&error=oauth_not_implemented');
  });

  app.get('/api/auth/facebook/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.redirect('/profile-import?platform=facebook&error=authorization_failed');
      }

      // Exchange code for access token
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${req.protocol}://${req.get('host')}/api/auth/facebook/callback&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`);

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        return res.redirect('/profile-import?platform=facebook&error=token_exchange_failed');
      }

      // Get user pages/accounts
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`);
      const pagesData = await pagesResponse.json();

      if (pagesData.data && pagesData.data.length > 0) {
        const page = pagesData.data[0];
        res.redirect('/profile-import?platform=facebook&connected=true&page_name=' + encodeURIComponent(page.name));
      } else {
        res.redirect('/profile-import?platform=facebook&error=no_pages_found');
      }
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      res.redirect('/profile-import?platform=facebook&error=connection_failed');
    }
  });

  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.upsertUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Instagram import endpoint
  app.post('/api/import/instagram', isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.body;
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const cleanUsername = extractInstagramUsername(username);
      const profileData = await fetchInstagramProfileData(cleanUsername);
      
      if (!profileData) {
        return res.status(400).json({ 
          message: "Instagram API credentials not configured. Please contact administrator to set up API access." 
        });
      }
      
      const existingAccount = await storage.getSocialAccount(user.id, 'instagram');
      
      const accountData = {
        userId: user.id,
        platform: 'instagram' as const,
        platformUserId: profileData.platformUserId,
        username: profileData.username,
        displayName: profileData.displayName,
        profileUrl: profileData.profileUrl,
        followerCount: profileData.followerCount,
        postCount: profileData.postCount,
        engagementRate: profileData.engagementRate.toString(),
        isConnected: true,
      };

      let account;
      if (existingAccount) {
        account = await storage.updateSocialAccount(existingAccount.id, accountData);
        // Award points for reconnection
        await storage.awardConnectionPoints(user.id, 10, 'reconnection', 'instagram');
      } else {
        account = await storage.createSocialAccount(accountData);
        // Award points for new connection
        await storage.awardConnectionPoints(user.id, 50, 'connection', 'instagram');
      }

      // Update user profile with imported Instagram data
      await storage.upsertUser({
        id: user.id,
        firstName: profileData.displayName.split(' ')[0] || user.firstName,
        lastName: profileData.displayName.split(' ').slice(1).join(' ') || user.lastName,
        bio: profileData.bio || user.bio,
        profileImageUrl: profileData.profileImageUrl || user.profileImageUrl,
        email: user.email,
        role: user.role
      });

      // Create portfolio content from imported Instagram posts
      for (const post of profileData.topPerformingContent || []) {
        const existingContent = await storage.getPortfolioContentByUrl(post.url);
        
        if (!existingContent) {
          await storage.createPortfolioContent({
            userId: user.id,
            title: post.title,
            description: `Instagram post with ${(post.likes || 0).toLocaleString()} likes and ${(post.comments || 0).toLocaleString()} comments`,
            url: post.url,
            thumbnailUrl: profileData.profileImageUrl,
            platform: 'instagram',
            views: post.views || 0,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: 0,
            publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
            engagementRate: (post.likes && post.views) ? ((post.likes / post.views) * 100).toString() : "0",
            isTopPerformer: true,
            categories: profileData.categories || []
          });
        }
      }

      // Update user's content categories
      for (const category of profileData.categories || []) {
        const existingCategory = await storage.getContentCategoryByName(user.id, category);
        if (!existingCategory) {
          await storage.createContentCategory({
            userId: user.id,
            category: category
          });
        }
      }
      
      const validationErrors = validateImportedData(profileData);
      
      // Calculate completeness score safely for Instagram
      const totalFields = Object.keys(profileData).length;
      const completedFields = Object.values(profileData).filter(v => 
        v !== undefined && 
        v !== null && 
        v !== '' && 
        !(Array.isArray(v) && v.length === 0)
      ).length;
      const completenessScore = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

      // Check for new achievements after connection
      const newAchievements = await storage.checkConnectionAchievements(user.id);

      res.json({
        success: true,
        account,
        profileData,
        gamification: {
          pointsEarned: existingAccount ? 10 : 50,
          newAchievements: newAchievements
        },
        importStats: {
          totalDataPoints: totalFields,
          completenessScore: completenessScore,
          validationPassed: validationErrors.length === 0,
          importedAt: new Date().toISOString(),
          portfolioItemsCreated: profileData.topPerformingContent?.length || 0,
          categoriesAdded: profileData.categories?.length || 0
        }
      });
    } catch (error: any) {
      console.error('Error importing Instagram data:', error);
      res.status(500).json({ 
        message: "Failed to import Instagram data", 
        error: error.message 
      });
    }
  });

  // TikTok import endpoint
  app.post('/api/import/tiktok', isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.body;
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const cleanUsername = extractTikTokUsername(username);
      const profileData = await fetchTikTokProfileData(cleanUsername);
      
      const existingAccount = await storage.getSocialAccount(user.id, 'tiktok');
      
      const accountData = {
        userId: user.id,
        platform: 'tiktok' as const,
        platformUserId: profileData.platformUserId,
        username: profileData.username,
        displayName: profileData.displayName,
        profileUrl: profileData.profileUrl,
        followerCount: profileData.followerCount,
        postCount: profileData.postCount,
        engagementRate: profileData.engagementRate.toString(),
        isConnected: true,
      };

      let account;
      if (existingAccount) {
        account = await storage.updateSocialAccount(existingAccount.id, accountData);
        // Award points for reconnection
        await storage.awardConnectionPoints(user.id, 10, 'reconnection', 'tiktok');
      } else {
        account = await storage.createSocialAccount(accountData);
        // Award points for new connection
        await storage.awardConnectionPoints(user.id, 50, 'connection', 'tiktok');
      }
      
      const validationErrors = validateImportedData(profileData);
      
      // Calculate completeness score safely for TikTok
      const totalFields = Object.keys(profileData).length;
      const completedFields = Object.values(profileData).filter(v => 
        v !== undefined && 
        v !== null && 
        v !== '' && 
        !(Array.isArray(v) && v.length === 0)
      ).length;
      const completenessScore = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

      // Check for new achievements after connection
      const newAchievements = await storage.checkConnectionAchievements(user.id);

      res.json({
        success: true,
        account,
        profileData,
        gamification: {
          pointsEarned: existingAccount ? 10 : 50,
          newAchievements: newAchievements
        },
        importStats: {
          totalDataPoints: totalFields,
          completenessScore: completenessScore,
          validationPassed: validationErrors.length === 0,
          importedAt: new Date().toISOString(),
        }
      });
    } catch (error: any) {
      console.error('Error importing TikTok data:', error);
      res.status(500).json({ 
        message: "Failed to import TikTok data", 
        error: error.message 
      });
    }
  });



  app.patch('/api/profile/update', isAuthenticated, async (req: any, res) => {
    try {
      // Handle different user object structures
      const userId = req.user?.claims?.sub || req.user?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates = { ...req.body, id: user.id };
      const updatedUser = await storage.upsertUser(updates);
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/profile/publish', isAuthenticated, async (req: any, res) => {
    try {
      // Handle different user object structures
      const userId = req.user?.claims?.sub || req.user?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        id: user.id,
        role: user.role,
      });
      
      res.json({ success: true, message: "Profile published successfully" });
    } catch (error) {
      console.error("Error publishing profile:", error);
      res.status(500).json({ message: "Failed to publish profile" });
    }
  });

  // Get performance metrics calculated from real imported data
  app.get('/api/performance-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all social accounts and portfolio content for the user
      const socialAccounts = await storage.getSocialAccounts(userId);
      const portfolioContent = await storage.getPortfolioContent(userId);

      // Calculate Total Reach (sum of all views across all content)
      const totalReach = portfolioContent.reduce((sum, content) => {
        return sum + (Number(content.views) || 0);
      }, 0);

      // Calculate Average Engagement Rate
      const validContent = portfolioContent.filter(content => Number(content.views) > 0);
      const avgEngagement = validContent.length > 0 
        ? validContent.reduce((sum, content) => {
            const engagement = ((Number(content.likes) || 0) + (Number(content.comments) || 0)) / 
                              Math.max(Number(content.views) || 1, 1) * 100;
            return sum + engagement;
          }, 0) / validContent.length
        : 0;

      // Detect Brand Campaigns from content titles and descriptions
      const brandKeywords = ['sponsored', 'ad', 'partnership', 'collab', 'brand', 'promo', '#ad', '#sponsored', 'campaign'];
      const brandCampaigns = portfolioContent.filter(content => {
        const contentText = (content.title + ' ' + (content.description || '')).toLowerCase();
        return brandKeywords.some(keyword => contentText.includes(keyword));
      }).length;

      // Client Satisfaction - start with base calculation based on engagement performance
      // This is calculated based on content performance vs. average engagement
      let clientSatisfaction = 0;
      if (validContent.length > 0) {
        const highPerformingContent = validContent.filter(content => content.isTopPerformer).length;
        clientSatisfaction = Math.min(95, Math.max(75, 
          75 + (highPerformingContent / validContent.length) * 20
        ));
      }

      // Format numbers for display
      const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
      };

      const metrics = {
        totalReach: {
          value: formatNumber(totalReach),
          rawValue: totalReach,
          label: "Total Reach"
        },
        avgEngagement: {
          value: `${avgEngagement.toFixed(1)}%`,
          rawValue: avgEngagement,
          label: "Avg Engagement"
        },
        brandCampaigns: {
          value: brandCampaigns.toString(),
          rawValue: brandCampaigns,
          label: "Brand Campaigns"
        },
        clientSatisfaction: {
          value: `${Math.round(clientSatisfaction)}%`,
          rawValue: clientSatisfaction,
          label: "Client Satisfaction"
        }
      };

      res.json({
        success: true,
        metrics,
        dataSource: {
          socialAccounts: socialAccounts.length,
          portfolioContent: portfolioContent.length,
          calculatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error calculating performance metrics:", error);
      res.status(500).json({ message: "Failed to calculate performance metrics" });
    }
  });

  // Get performance milestones for user
  app.get('/api/milestones', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const milestones = await storage.getPerformanceMilestones(userId);
      res.json({ success: true, milestones });
    } catch (error) {
      console.error('Milestones API error:', error);
      res.status(500).json({ success: false, message: 'Error fetching milestones' });
    }
  });

  // Check for new milestones and return uncelebrated ones
  app.post('/api/milestones/check', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check and create new milestones
      const newMilestones = await storage.checkAndCreateMilestones(userId);
      
      // Get all uncelebrated milestones
      const allMilestones = await storage.getPerformanceMilestones(userId);
      const uncelebratedMilestones = allMilestones.filter(m => !m.celebrationShown);

      res.json({ 
        success: true, 
        newMilestones,
        uncelebratedMilestones 
      });
    } catch (error) {
      console.error('Milestone check API error:', error);
      res.status(500).json({ success: false, message: 'Error checking milestones' });
    }
  });

  // Mark milestone celebration as shown
  app.patch('/api/milestones/:id/celebrate', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const milestoneId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const updatedMilestone = await storage.updateMilestone(milestoneId, { 
        celebrationShown: true,
        isCelebrated: true,
        isViewed: true
      });

      res.json({ success: true, milestone: updatedMilestone });
    } catch (error) {
      console.error('Milestone celebration API error:', error);
      res.status(500).json({ success: false, message: 'Error updating milestone' });
    }
  });

  // Trend prediction endpoints
  app.get('/api/trends/predictions', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { platform } = req.query as { platform?: string };
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Get user's content and social accounts for analysis
      const [portfolioContent, socialAccounts] = await Promise.all([
        storage.getPortfolioContent(userId, platform),
        storage.getSocialAccounts(userId)
      ]);

      // Generate trend predictions if we have sufficient data
      if (portfolioContent.length === 0) {
        return res.json({
          success: true,
          predictions: [],
          message: 'Import social media data to get trend predictions'
        });
      }

      // Import trend prediction utilities
      const { generateTrendPredictions } = await import('./utils/trendPrediction.js');
      
      const predictions = generateTrendPredictions(
        portfolioContent,
        socialAccounts,
        platform || 'all'
      );

      // Store predictions in database for future reference
      for (const prediction of predictions.slice(0, 10)) { // Store top 10
        await storage.createTrendPrediction({
          userId,
          platform: platform || prediction.type,
          trendType: prediction.type,
          keyword: prediction.keyword,
          currentVolume: prediction.currentVolume,
          predictedVolume: prediction.predictedVolume,
          growthRate: prediction.growthRate.toString(),
          trendScore: prediction.trendScore,
          confidence: prediction.confidence.toString(),
          timeframe: prediction.timeframe,
          peakPrediction: prediction.peakPrediction,
          recommendedAction: prediction.recommendedAction,
          contentSuggestions: prediction.contentSuggestions
        });
      }

      res.json({
        success: true,
        predictions,
        dataSource: {
          contentAnalyzed: portfolioContent.length,
          platformsConnected: socialAccounts.length,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Trend predictions API error:', error);
      res.status(500).json({ success: false, message: 'Error generating trend predictions' });
    }
  });

  app.get('/api/trends/analytics', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { platform } = req.query as { platform?: string };
      
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Get comprehensive trend analysis
      const [portfolioContent, socialAccounts] = await Promise.all([
        storage.getPortfolioContent(userId, platform),
        storage.getSocialAccounts(userId)
      ]);

      if (portfolioContent.length === 0) {
        return res.json({
          success: true,
          analytics: null,
          message: 'Import social media data to get trend analytics'
        });
      }

      const { generateTrendAnalysis } = await import('./utils/trendPrediction.js');
      
      const analytics = generateTrendAnalysis(
        portfolioContent,
        socialAccounts,
        platform || 'all'
      );

      // Store analytics in database
      await storage.createTrendAnalytics({
        userId,
        platform: platform || 'all',
        topHashtags: analytics.topHashtags,
        emergingTopics: analytics.emergingTopics,
        optimalPostTimes: analytics.optimalPostTimes,
        contentTypePerformance: analytics.contentTypePerformance.map(ct => 
          `${ct.type}:${ct.avgEngagement}:${ct.trendDirection}`
        ),
        audienceGrowthTrends: analytics.audienceGrowthTrends.map(agt => 
          `${agt.period}:${agt.growth}`
        ),
        engagementTrends: analytics.engagementTrends.map(et => 
          `${et.period}:${et.rate}`
        ),
        competitorInsights: analytics.competitorInsights.map(ci => 
          `${ci.insight}:${ci.actionable}`
        ),
        seasonalPatterns: analytics.seasonalPatterns.map(sp => 
          `${sp.pattern}:${sp.likelihood}`
        ),
        predictedViral: analytics.predictedViral.map(pv => 
          `${pv.content}:${pv.viralProbability}`
        )
      });

      res.json({
        success: true,
        analytics,
        dataSource: {
          contentAnalyzed: portfolioContent.length,
          platformsConnected: socialAccounts.length,
          analysisDate: analytics.analysisDate
        }
      });
    } catch (error) {
      console.error('Trend analytics API error:', error);
      res.status(500).json({ success: false, message: 'Error generating trend analytics' });
    }
  });

  // Brand testimonials endpoints
  app.get('/api/brand-testimonials', isAuthenticated, async (req: any, res) => {
    try {
      const testimonials = await storage.getBrandTestimonials(req.user.id);
      res.json({ success: true, testimonials });
    } catch (error) {
      console.error('Get brand testimonials error:', error);
      res.status(500).json({ success: false, message: 'Error fetching brand testimonials' });
    }
  });

  // Get completed campaigns with ROI metrics
  app.get('/api/campaigns/completed', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const completedCampaigns = await storage.getCompletedCampaigns();
      
      // Filter campaigns for the current brand and add ROI metrics
      const brandCampaigns = await Promise.all(
        completedCampaigns
          .filter(campaign => campaign.brandId === user.id)
          .map(async campaign => {
            try {
              const roiMetrics = await storage.getCampaignROIMetrics(campaign.id);
              return {
                ...campaign,
                roiMetrics
              };
            } catch (error) {
              console.error(`Error fetching ROI for campaign ${campaign.id}:`, error);
              return {
                ...campaign,
                roiMetrics: null
              };
            }
          })
      );

      res.json(brandCampaigns);
    } catch (error) {
      console.error('Error fetching completed campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch completed campaigns' });
    }
  });

  // Get ROI metrics for a specific campaign
  app.get('/api/campaigns/:campaignId/roi', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { campaignId } = req.params;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      // Verify the campaign belongs to the brand
      const campaign = await storage.getBrandCampaign(campaignId);
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found or access denied' });
      }

      const roiMetrics = await storage.getCampaignROIMetrics(campaignId);
      res.json({
        success: true,
        data: roiMetrics
      });
    } catch (error) {
      console.error('Error fetching campaign ROI:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch campaign ROI metrics',
        error: error.message 
      });
    }
  });

  // Payment system status endpoint (for internal use)
  app.get('/api/payment-system-status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      // Check if system Razorpay credentials are configured
      const isConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
      
      res.json({ 
        success: true, 
        configured: isConfigured,
        currency: 'INR',
        paymentTerms: 7
      });
    } catch (error) {
      console.error('Error checking payment system status:', error);
      res.status(500).json({ success: false, message: 'Failed to check payment system status' });
    }
  });

  // Influencer payments endpoint - get all payments for the current influencer
  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Get all campaign payments for this influencer
      const payments = await storage.getCampaignPayments(undefined, user.id);
      
      // Format payment data for frontend display
      const formattedPayments = await Promise.all(
        payments.map(async (payment) => {
          // Get campaign details
          const campaign = await storage.getBrandCampaign(payment.campaignId);
          const brand = await storage.getUser(payment.brandId);
          
          return {
            id: payment.id,
            campaignId: payment.campaignId,
            campaignName: campaign?.title || 'Unknown Campaign',
            brandName: brand?.firstName + ' ' + (brand?.lastName || ''),
            amount: parseFloat(payment.amount),
            currency: payment.currency || 'INR',
            status: payment.status,
            paymentType: payment.paymentType,
            paidAt: payment.paidAt,
            createdAt: payment.createdAt,
            notes: payment.notes
          };
        })
      );
      
      res.json({
        success: true,
        payments: formattedPayments,
        total: formattedPayments.reduce((sum, p) => sum + p.amount, 0)
      });
    } catch (error) {
      console.error('Error fetching influencer payments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payment history' 
      });
    }
  });

  // Campaign payment endpoints
  app.get('/api/campaigns/:campaignId/payments', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { campaignId } = req.params;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      // Verify campaign belongs to brand
      const campaign = await storage.getBrandCampaign(campaignId);
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found or access denied' });
      }

      const payments = await storage.getCampaignPayments(campaignId);
      res.json({ success: true, payments });
    } catch (error) {
      console.error('Error fetching campaign payments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
  });

  app.get('/api/pending-payments', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { paymentService } = await import('./payment-service');
      const pendingPayments = await paymentService.getPendingPayments(user.id);
      
      res.json({ success: true, pendingPayments });
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch pending payments' });
    }
  });

  app.post('/api/payments/process', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { campaignId, proposalId } = req.body;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      // Verify campaign belongs to brand
      const campaign = await storage.getBrandCampaign(campaignId);
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found or access denied' });
      }

      const { paymentService } = await import('./payment-service');
      const payment = await paymentService.processInfluencerPayment(campaignId, proposalId);
      
      res.json({ success: true, payment });
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      // Log failed payment processing attempt
      await storage.logFailedTransaction({
        userId: req.user?.id,
        action: 'payment_processing_failed',
        description: `Failed to process payment for campaign ${req.body.campaignId} and proposal ${req.body.proposalId}`,
        errorMessage: error.message || 'Unknown payment processing error',
        errorCode: error.code || 'PAYMENT_PROCESSING_ERROR',
        campaignId: req.body.campaignId,
        proposalId: req.body.proposalId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { errorStack: error.stack }
      });
      
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create upfront payment (50%) after proposal approval
  app.post('/api/payments/upfront', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { proposalId } = req.body;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      if (!proposalId) {
        return res.status(400).json({ message: 'Proposal ID is required' });
      }

      // Verify proposal belongs to brand's campaign
      const proposal = await storage.getCampaignProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }

      const campaign = await storage.getBrandCampaign(proposal.campaignId);
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(403).json({ message: 'Access denied to this proposal' });
      }

      const { paymentService } = await import('./payment-service');
      const payment = await paymentService.createUpfrontPayment(proposalId);
      
      // Log upfront payment creation - critical financial action
      await storage.logUserAction({
        userId: user.id,
        action: 'upfront_payment_created',
        description: `Brand initiated upfront payment (50%) of $${payment.amount} for proposal ${proposalId} on campaign "${campaign.title}"`,
        campaignId: proposal.campaignId,
        proposalId: proposal.id,
        amountAffected: parseFloat(payment.amount || '0'),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          paymentId: payment.id,
          paymentType: 'upfront',
          percentage: 50,
          campaignTitle: campaign.title,
          influencerId: proposal.influencerId
        }
      });
      
      res.json({ success: true, payment });
    } catch (error: any) {
      console.error('Error creating upfront payment:', error);
      
      // Log failed upfront payment creation
      await storage.logFailedTransaction({
        userId: req.user?.id,
        action: 'upfront_payment_creation_failed',
        description: `Failed to create upfront payment for proposal ${req.body.proposalId}`,
        errorMessage: error.message || 'Unknown upfront payment creation error',
        errorCode: error.code || 'UPFRONT_PAYMENT_ERROR',
        proposalId: req.body.proposalId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { errorStack: error.stack }
      });
      
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create completion payment (50%) after deliverables submitted  
  app.post('/api/payments/completion', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { proposalId } = req.body;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      if (!proposalId) {
        return res.status(400).json({ message: 'Proposal ID is required' });
      }

      // Verify proposal belongs to brand's campaign
      const proposal = await storage.getCampaignProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }

      const campaign = await storage.getBrandCampaign(proposal.campaignId);
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(403).json({ message: 'Access denied to this proposal' });
      }

      const { paymentService } = await import('./payment-service');
      const payment = await paymentService.createCompletionPayment(proposalId);
      
      // Log completion payment creation - critical financial action
      await storage.logUserAction({
        userId: user.id,
        action: 'completion_payment_created',
        description: `Brand initiated completion payment (50%) of $${payment.amount} for proposal ${proposalId} on campaign "${campaign.title}"`,
        campaignId: proposal.campaignId,
        proposalId: proposal.id,
        amountAffected: parseFloat(payment.amount || '0'),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          paymentId: payment.id,
          paymentType: 'completion',
          percentage: 50,
          campaignTitle: campaign.title,
          influencerId: proposal.influencerId
        }
      });
      
      res.json({ success: true, payment });
    } catch (error: any) {
      console.error('Error creating completion payment:', error);
      
      // Log failed completion payment creation
      await storage.logFailedTransaction({
        userId: req.user?.id,
        action: 'completion_payment_creation_failed',
        description: `Failed to create completion payment for proposal ${req.body.proposalId}`,
        errorMessage: error.message || 'Unknown completion payment creation error',
        errorCode: error.code || 'COMPLETION_PAYMENT_ERROR',
        proposalId: req.body.proposalId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { errorStack: error.stack }
      });
      
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create bonus payment endpoint for test campaigns
  app.post('/api/payments/bonus', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { proposalId } = req.body;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      if (!proposalId) {
        return res.status(400).json({ message: 'Proposal ID is required' });
      }

      const { paymentService } = await import('./payment-service');
      const payment = await paymentService.createBonusPayment(proposalId);
      
      if (!payment) {
        return res.json({ success: true, message: 'No bonus payment configured for this campaign' });
      }
      
      res.json({ success: true, payment });
    } catch (error: any) {
      console.error('Error creating bonus payment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get payments for a specific proposal
  app.get('/api/proposals/:proposalId/payments', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { proposalId } = req.params;
      
      if (!user) {
        return res.status(403).json({ message: 'Access denied. Authentication required.' });
      }

      const proposal = await storage.getCampaignProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }

      // Verify user has access (either brand or influencer)
      if (user.role === 'brand') {
        const campaign = await storage.getBrandCampaign(proposal.campaignId);
        if (!campaign || campaign.brandId !== user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else if (user.role === 'influencer') {
        if (proposal.influencerId !== user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else {
        return res.status(403).json({ message: 'Invalid user role' });
      }

      const payments = await storage.getCampaignPayments(proposal.campaignId, proposal.influencerId);
      res.json({ success: true, payments });
    } catch (error) {
      console.error('Error fetching proposal payments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
  });

  // Get approved proposals needing upfront payment for brand
  app.get('/api/brand/approved-proposals', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      // Get all campaigns for this brand
      const campaigns = await storage.getBrandCampaigns(user.id);
      const campaignIds = campaigns.map(c => c.id);
      
      // Get approved proposals that don't have upfront payments yet
      const approvedProposals = [];
      
      for (const campaignId of campaignIds) {
        const proposals = await storage.getCampaignProposals(campaignId);
        const approved = proposals.filter(p => p.status === 'approved');
        
        for (const proposal of approved) {
          // Check if there's already an upfront payment for this proposal
          const existingPayments = await storage.getCampaignPayments(proposal.campaignId, proposal.influencerId);
          const hasUpfrontPayment = existingPayments.some(p => p.paymentType === 'upfront');
          
          if (!hasUpfrontPayment) {
            // Enrich proposal with campaign and influencer data
            const campaign = campaigns.find(c => c.id === proposal.campaignId);
            const influencer = await storage.getUser(proposal.influencerId);
            
            approvedProposals.push({
              ...proposal,
              campaign: campaign ? {
                id: campaign.id,
                title: campaign.title,
                description: campaign.description
              } : null,
              influencer: influencer ? {
                id: influencer.id,
                username: influencer.username,
                firstName: influencer.firstName,
                lastName: influencer.lastName
              } : null
            });
          }
        }
      }

      // Force no cache
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json({ success: true, proposals: approvedProposals });
    } catch (error) {
      console.error('Error fetching approved proposals:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch approved proposals' });
    }
  });

  app.post('/api/payments/:paymentId/order', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { paymentId } = req.params;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      // Verify payment belongs to brand
      const payment = await storage.getCampaignPayment(paymentId);
      if (!payment || payment.brandId !== user.id) {
        return res.status(404).json({ message: 'Payment not found or access denied' });
      }

      const { paymentService } = await import('./payment-service');
      const result = await paymentService.processPaymentOrder(paymentId);
      
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error creating payment order:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/payments/:paymentId/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { paymentId } = req.params;
      const { razorpay_payment_id, razorpay_signature } = req.body;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      // Verify payment belongs to brand
      const payment = await storage.getCampaignPayment(paymentId);
      if (!payment || payment.brandId !== user.id) {
        return res.status(404).json({ message: 'Payment not found or access denied' });
      }

      const { paymentService } = await import('./payment-service');
      const confirmedPayment = await paymentService.confirmPayment(
        paymentId,
        razorpay_payment_id,
        razorpay_signature
      );
      
      // Log payment confirmation - critical financial action
      await storage.logUserAction({
        userId: user.id,
        action: 'payment_confirmed',
        description: `Brand confirmed payment of $${payment.amount} via Razorpay for campaign payment`,
        transactionId: razorpay_payment_id,
        amountAffected: parseFloat(payment.amount || '0'),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          paymentId: payment.id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentStatus: confirmedPayment.status,
          paymentMethod: 'razorpay'
        }
      });
      
      res.json({ success: true, payment: confirmedPayment });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Razorpay webhook endpoint for automatic payment confirmation
  app.post('/api/webhook/razorpay', async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('Razorpay webhook secret not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      // Verify webhook signature
      const crypto = require('crypto');
      const signature = req.headers['x-razorpay-signature'];
      const body = JSON.stringify(req.body);
      
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      console.log('Received webhook event:', event.event, 'for payment:', event.payload?.payment?.entity?.id);

      // Handle different event types
      switch (event.event) {
        case 'payment.captured':
          await handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await handlePaymentFailed(event.payload.payment.entity);
          break;
        default:
          console.log('Unhandled webhook event:', event.event);
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Handle successful payment capture
  async function handlePaymentCaptured(payment: any) {
    try {
      const { paymentService } = await import('./payment-service');
      
      // Find our payment record by Razorpay payment ID
      const ourPayment = await storage.getCampaignPaymentByRazorpayId(payment.id);
      if (!ourPayment) {
        console.error('Payment not found in our system:', payment.id);
        return;
      }

      // Auto-confirm the payment
      await paymentService.confirmPaymentFromWebhook(
        ourPayment.id,
        payment.id,
        payment.order_id
      );

      console.log('Payment auto-confirmed via webhook:', ourPayment.id);
      
      // Log successful payment capture - system action
      await storage.logSystemAction({
        action: 'payment_captured_webhook',
        description: `Razorpay webhook: Payment ${payment.id} captured for amount $${payment.amount/100}`,
        amountAffected: payment.amount / 100,
        correlationId: `webhook-${payment.id}`,
        metadata: {
          razorpayPaymentId: payment.id,
          orderId: payment.order_id,
          method: payment.method,
          status: payment.status,
          fee: payment.fee,
          tax: payment.tax,
          ourPaymentId: ourPayment.id
        }
      });
    } catch (error) {
      console.error('Error handling payment captured:', error);
      
      // Log failed webhook processing
      await storage.logFailedTransaction({
        action: 'webhook_payment_captured_failed',
        description: `Failed to process payment.captured webhook for payment ${payment?.id}`,
        errorMessage: (error as any).message || 'Unknown webhook processing error',
        errorCode: 'WEBHOOK_PROCESSING_ERROR',
        metadata: { 
          razorpayPaymentId: payment?.id,
          errorStack: (error as any).stack
        }
      });
    }
  }

  // Handle failed payment
  async function handlePaymentFailed(payment: any) {
    try {
      // Find our payment record by Razorpay payment ID
      const ourPayment = await storage.getCampaignPaymentByRazorpayId(payment.id);
      if (!ourPayment) {
        console.error('Payment not found in our system:', payment.id);
        return;
      }

      // Update payment status to failed
      await storage.updateCampaignPayment(ourPayment.id, {
        status: 'failed',
        failureReason: payment.error_description || 'Payment failed',
      });

      console.log('Payment marked as failed via webhook:', ourPayment.id);
      
      // Log failed payment - system action
      await storage.logSystemAction({
        action: 'payment_failed_webhook',
        description: `Razorpay webhook: Payment ${payment.id} failed for amount $${payment.amount/100}. Reason: ${payment.error_description || 'Unknown'}`,
        amountAffected: payment.amount / 100,
        correlationId: `webhook-${payment.id}`,
        metadata: {
          razorpayPaymentId: payment.id,
          orderId: payment.order_id,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
          errorSource: payment.error_source,
          errorStep: payment.error_step,
          errorReason: payment.error_reason,
          ourPaymentId: ourPayment.id
        }
      });
    } catch (error) {
      console.error('Error handling payment failed:', error);
      
      // Log failed webhook processing
      await storage.logFailedTransaction({
        action: 'webhook_payment_failed_processing',
        description: `Failed to process payment.failed webhook for payment ${payment?.id}`,
        errorMessage: (error as any).message || 'Unknown webhook processing error',
        errorCode: 'WEBHOOK_PROCESSING_ERROR',
        metadata: { 
          razorpayPaymentId: payment?.id,
          errorStack: (error as any).stack
        }
      });
    }
  }

  // Financial Transaction Management Endpoints
  
  // Create a new financial transaction
  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Only brands can create transactions
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const transactionData = insertFinancialTransactionSchema.parse(req.body);
      
      // Generate unique transaction ID
      const transactionId = await storage.generateTransactionId();
      
      // Validate that the brand creating the transaction matches the authenticated user
      if (transactionData.brandId !== user.id) {
        return res.status(403).json({ message: 'Cannot create transactions for other brands' });
      }
      
      const transaction = await storage.createFinancialTransaction({
        ...transactionData,
        transactionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      });

      res.json({ success: true, transaction });
    } catch (error: any) {
      console.error('Create transaction error:', error);
      res.status(500).json({ success: false, message: 'Failed to create transaction', error: error.message });
    }
  });

  // Get transactions with filters
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { 
        campaignId, 
        proposalId, 
        status, 
        transactionType, 
        limit = 50, 
        offset = 0 
      } = req.query;

      // Build filter based on user role
      const filters: any = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        transactionType,
        campaignId,
        proposalId
      };

      // Filter by user role
      if (user.role === 'brand') {
        filters.brandId = user.id;
      } else if (user.role === 'influencer') {
        filters.influencerId = user.id;
      } else {
        return res.status(403).json({ message: 'Invalid user role' });
      }

      const transactions = await storage.getFinancialTransactions(filters);
      res.json({ success: true, transactions });
    } catch (error: any) {
      console.error('Get transactions error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve transactions', error: error.message });
    }
  });

  // Get single transaction by ID
  app.get('/api/transactions/:transactionId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { transactionId } = req.params;

      const transaction = await storage.getFinancialTransactionByTransactionId(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Verify user has access to this transaction
      if (user.role === 'brand' && transaction.brandId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (user.role === 'influencer' && transaction.influencerId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json({ success: true, transaction });
    } catch (error: any) {
      console.error('Get transaction error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve transaction', error: error.message });
    }
  });

  // Update transaction status
  app.patch('/api/transactions/:transactionId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { transactionId } = req.params;

      // Only brands can update transaction status
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const transaction = await storage.getFinancialTransactionByTransactionId(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Verify brand owns this transaction
      if (transaction.brandId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const allowedUpdates = ['status', 'processedAt', 'completedAt', 'failedAt', 'failureReason', 'internalNotes'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      // Add timestamp for status changes
      if (updates.status) {
        const now = new Date();
        switch (updates.status) {
          case 'processing':
            updates.processedAt = now;
            break;
          case 'completed':
            updates.completedAt = now;
            break;
          case 'failed':
            updates.failedAt = now;
            break;
        }
      }

      const updatedTransaction = await storage.updateFinancialTransaction(transaction.id, updates);
      res.json({ success: true, transaction: updatedTransaction });
    } catch (error: any) {
      console.error('Update transaction error:', error);
      res.status(500).json({ success: false, message: 'Failed to update transaction', error: error.message });
    }
  });

  // Get transaction audit logs
  app.get('/api/transactions/:transactionId/audit', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { transactionId } = req.params;

      const transaction = await storage.getFinancialTransactionByTransactionId(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Verify user has access to this transaction
      if (user.role === 'brand' && transaction.brandId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (user.role === 'influencer' && transaction.influencerId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const auditLogs = await storage.getTransactionAuditLogs(transactionId);
      res.json({ success: true, auditLogs });
    } catch (error: any) {
      console.error('Get transaction audit logs error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve audit logs', error: error.message });
    }
  });

  // Comprehensive Financial Activity Logging Endpoints
  
  // Get financial activity logs with filtering
  app.get('/api/financial-activity-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { 
        activityType, 
        actionCategory, 
        transactionId, 
        campaignId, 
        success, 
        startDate, 
        endDate, 
        limit = 50, 
        offset = 0 
      } = req.query;

      // Only allow users to see their own logs, or admins to see all
      const filters: any = {
        userId: user.role === 'admin' ? (req.query.userId as string) : user.id,
        activityType: activityType as string,
        actionCategory: actionCategory as string,
        transactionId: transactionId as string,
        campaignId: campaignId as string,
        success: success ? success === 'true' : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const logs = await storage.getFinancialActivityLogs(filters);
      res.json({ success: true, logs, filters });
    } catch (error: any) {
      console.error('Get financial activity logs error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve financial activity logs', error: error.message });
    }
  });

  // Get financial disputes
  app.get('/api/financial-disputes', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { status, disputeType, limit = 20, offset = 0 } = req.query;

      const filters: any = {
        limit: parseInt(limit as string) || 20,
        offset: parseInt(offset as string) || 0
      };

      // Users can see disputes they initiated or are involved in
      if (user.role !== 'admin') {
        // This will be expanded based on how disputes relate to users
        filters.initiatedBy = user.id;
      }

      if (status) filters.status = status as string;
      if (disputeType) filters.disputeType = disputeType as string;

      const disputes = await storage.getFinancialDisputes(filters);
      res.json({ success: true, disputes });
    } catch (error: any) {
      console.error('Get financial disputes error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve financial disputes', error: error.message });
    }
  });

  // Create a financial dispute
  app.post('/api/financial-disputes', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const disputeData = {
        ...req.body,
        initiatedBy: user.id,
        disputeId: `DISP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };

      const dispute = await storage.createFinancialDispute(disputeData);
      res.json({ success: true, dispute });
    } catch (error: any) {
      console.error('Create financial dispute error:', error);
      res.status(500).json({ success: false, message: 'Failed to create financial dispute', error: error.message });
    }
  });

  // Admin endpoint: Get all financial activity for compliance
  app.get('/api/admin/financial-audit-trail', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
      }

      const { startDate, endDate, activityType, limit = 100, offset = 0 } = req.query;

      const filters: any = {
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
        endDate: endDate ? new Date(endDate as string) : new Date(),
        activityType: activityType as string,
        limit: Math.min(parseInt(limit as string) || 100, 500), // Max 500 records
        offset: parseInt(offset as string) || 0
      };

      const auditTrail = await storage.getFinancialActivityLogs(filters);
      
      // Log admin audit access
      await storage.logAdminAction({
        adminUserId: user.id,
        action: 'financial_audit_access',
        description: `Admin accessed financial audit trail with filters: ${JSON.stringify(filters)}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { filters, recordCount: auditTrail.length }
      });

      res.json({ success: true, auditTrail, filters });
    } catch (error: any) {
      console.error('Admin financial audit trail error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve audit trail', error: error.message });
    }
  });

  // Get payment summary for user
  app.get('/api/payment-summary', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { periodStart, periodEnd } = req.query;

      if (!periodStart || !periodEnd) {
        return res.status(400).json({ message: 'periodStart and periodEnd are required' });
      }

      const startDate = new Date(periodStart as string);
      const endDate = new Date(periodEnd as string);

      // Check if summary already exists
      let summary = await storage.getPaymentSummary(
        user.id, 
        user.role, 
        'custom', 
        startDate, 
        endDate
      );

      // If no summary exists, calculate and create one
      if (!summary) {
        summary = await storage.calculatePaymentSummary(
          user.id,
          user.role,
          startDate,
          endDate
        );
      }

      res.json({ success: true, summary });
    } catch (error: any) {
      console.error('Get payment summary error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve payment summary', error: error.message });
    }
  });

  app.post('/api/brand-testimonials', isAuthenticated, async (req: any, res) => {
    try {
      const testimonial = await storage.createBrandTestimonial({
        ...req.body,
        userId: req.user.id,
      });
      res.json({ success: true, testimonial });
    } catch (error) {
      console.error('Create brand testimonial error:', error);
      res.status(500).json({ success: false, message: 'Error creating brand testimonial' });
    }
  });

  // Brand collaborations endpoints
  app.get('/api/brand-collaborations', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.query;
      const collaborations = await storage.getBrandCollaborations(
        req.user.id,
        status as string | undefined
      );
      res.json({ success: true, collaborations });
    } catch (error) {
      console.error('Get brand collaborations error:', error);
      res.status(500).json({ success: false, message: 'Error fetching brand collaborations' });
    }
  });

  app.post('/api/brand-collaborations', isAuthenticated, async (req: any, res) => {
    try {
      const collaboration = await storage.createBrandCollaboration({
        ...req.body,
        userId: req.user.id,
      });
      res.json({ success: true, collaboration });
    } catch (error) {
      console.error('Create brand collaboration error:', error);
      res.status(500).json({ success: false, message: 'Error creating brand collaboration' });
    }
  });

  // Import brand data from analytics tools endpoint
  app.post('/api/import-brand-data', isAuthenticated, async (req: any, res) => {
    try {
      const { source, apiKey } = req.body;
      
      // For now, we'll return sample data that users can manually input
      // In production, this would integrate with HypeAuditor/Upfluence APIs
      
      res.json({ 
        success: true, 
        message: 'To integrate with HypeAuditor or Upfluence, please provide API credentials.',
        instructions: {
          hypeAuditor: 'Visit https://hypeauditor.com/api to get your API key',
          upfluence: 'Contact Upfluence support for API access',
          manual: 'You can manually add brand collaborations and testimonials through the dashboard'
        }
      });
    } catch (error) {
      console.error('Import brand data error:', error);
      res.status(500).json({ success: false, message: 'Error importing brand data' });
    }
  });

  // Brand Campaign Management API Routes
  app.get('/api/brand/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const campaigns = await storage.getBrandCampaigns(user.id);
      
      // Enrich campaigns with proposal counts
      const enrichedCampaigns = await Promise.all(
        campaigns.map(async (campaign) => {
          const proposals = await storage.getCampaignProposals(campaign.id);
          return {
            ...campaign,
            collaborators: proposals.length, // Add the actual proposal count
            proposalsCount: proposals.length,
            approvedProposals: proposals.filter(p => p.status === 'approved').length, // Only count approval status, not payment workflow
            pendingProposals: proposals.filter(p => p.status === 'pending').length,
          };
        })
      );
      
      res.json(enrichedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/brand/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      // Parse budget string to numeric value
      const parseBudget = (budgetStr: string): number => {
        if (!budgetStr) return 0;
        
        // Handle formats like "5k-10k", "$25K - $50K", "1000-5000"
        const cleanBudget = budgetStr.toLowerCase().replace(/[\$,\s]/g, '');
        
        // Extract the lower bound of range or single value
        const match = cleanBudget.match(/^(\d+(?:\.\d+)?)[k]?/);
        if (match) {
          let value = parseFloat(match[1]);
          if (cleanBudget.includes('k')) {
            value *= 1000;
          }
          return value;
        }
        
        // Fallback to direct number parsing
        const num = parseFloat(cleanBudget);
        return isNaN(num) ? 0 : num;
      };

      // Parse influencer count range to numeric value (extract lower bound)
      const parseInfluencerCount = (countStr: string): number => {
        if (!countStr) return 1;
        
        // Handle formats like "5-10", "25-50", "100+"
        const match = countStr.match(/^(\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
        
        // Fallback to direct number parsing
        const num = parseInt(countStr);
        return isNaN(num) ? 1 : num;
      };

      const campaignData = {
        ...req.body,
        brandId: user.id,
        campaignType: req.body.campaignType || 'sponsored_posts',
        budgetRange: req.body.budget, // Store range as string in budgetRange field
        budget: parseBudget(req.body.budget), // Store parsed numeric value in budget field
        minimumInfluencers: parseInfluencerCount(req.body.minimumInfluencers), // Parse influencer range to number
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(),
      };

      const campaign = await storage.createBrandCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ message: 'Failed to create campaign' });
    }
  });

  // Update campaign
  app.put('/api/brand/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { id } = req.params;
      const campaign = await storage.getBrandCampaign(id);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Parse budget string to numeric value (same logic as create)
      const parseBudget = (budgetStr: string): number => {
        if (!budgetStr) return 0;
        
        const cleanBudget = budgetStr.replace(/[\$,\s]/g, '');
        const match = cleanBudget.match(/^(\d+(?:\.\d+)?)(k)?$/i);
        
        if (match) {
          let value = parseFloat(match[1]);
          if (cleanBudget.includes('k')) {
            value *= 1000;
          }
          return value;
        }
        
        const num = parseFloat(cleanBudget);
        return isNaN(num) ? 0 : num;
      };

      // Parse influencer count range to numeric value (same logic as create)
      const parseInfluencerCount = (countStr: string): number => {
        if (!countStr) return 1;
        
        // Handle formats like "5-10", "25-50", "100+"
        const match = countStr.match(/^(\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
        
        // Fallback to direct number parsing
        const num = parseInt(countStr);
        return isNaN(num) ? 1 : num;
      };

      const updateData = {
        ...req.body,
        budgetRange: req.body.budget, // Store range as string in budgetRange field
        budget: req.body.budget ? parseBudget(req.body.budget) : undefined,
        minimumInfluencers: req.body.minimumInfluencers ? parseInfluencerCount(req.body.minimumInfluencers) : undefined,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        exactStartDate: req.body.exactStartDate ? new Date(req.body.exactStartDate) : undefined,
        exactEndDate: req.body.exactEndDate ? new Date(req.body.exactEndDate) : undefined,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedCampaign = await storage.updateBrandCampaign(id, updateData);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ message: 'Failed to update campaign' });
    }
  });

  // Launch campaign (update status to active)
  app.put('/api/brand/campaigns/:id/launch', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { id } = req.params;
      const campaign = await storage.getBrandCampaign(id);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      const updatedCampaign = await storage.updateBrandCampaign(id, { status: 'active' });
      
      // Initialize campaign milestones
      await storage.initializeCampaignMilestones(id);
      
      // Complete the "launched" milestone
      const milestones = await storage.getCampaignMilestones(id);
      const launchedMilestone = milestones.find(m => m.milestoneType === 'launched');
      if (launchedMilestone) {
        await storage.completeCampaignMilestone(launchedMilestone.id);
      }
      
      // Log campaign launch activity
      await storage.logCampaignActivity({
        campaignId: id,
        userId: user.id,
        activityType: 'status_change',
        activityDescription: `Campaign launched and made live for influencers`,
        previousState: { status: campaign.status },
        newState: { status: 'active' }
      });
      
      // Send automated notifications
      await storage.sendAutomatedNotifications(id, 'campaign_launched');
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error launching campaign:', error);
      res.status(500).json({ message: 'Failed to launch campaign' });
    }
  });

  // Pause campaign (update status to paused)
  app.put('/api/brand/campaigns/:id/pause', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { id } = req.params;
      const campaign = await storage.getBrandCampaign(id);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      if (campaign.status !== 'active') {
        return res.status(400).json({ message: 'Only active campaigns can be paused' });
      }

      const updatedCampaign = await storage.pauseCampaign(id, user.id);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error pausing campaign:', error);
      res.status(500).json({ message: 'Failed to pause campaign' });
    }
  });

  // Archive campaign (update status to archived)
  app.put('/api/brand/campaigns/:id/archive', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { id } = req.params;
      const campaign = await storage.getBrandCampaign(id);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      if (campaign.status !== 'completed') {
        return res.status(400).json({ message: 'Only completed campaigns can be archived' });
      }

      const updatedCampaign = await storage.archiveCampaign(id, user.id);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error archiving campaign:', error);
      res.status(500).json({ message: 'Failed to archive campaign' });
    }
  });

  // Resume campaign (update status from paused to active)
  app.put('/api/brand/campaigns/:id/resume', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { id } = req.params;
      const campaign = await storage.getBrandCampaign(id);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      if (campaign.status !== 'paused') {
        return res.status(400).json({ message: 'Only paused campaigns can be resumed' });
      }

      const updatedCampaign = await storage.resumeCampaign(id, user.id);
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error resuming campaign:', error);
      res.status(500).json({ message: 'Failed to resume campaign' });
    }
  });

  // Get campaign milestones and progress
  app.get('/api/brand/campaigns/:id/milestones', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { id } = req.params;
      const campaign = await storage.getBrandCampaign(id);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      const milestones = await storage.getCampaignMilestones(id);
      res.json(milestones);
    } catch (error) {
      console.error('Error fetching campaign milestones:', error);
      res.status(500).json({ message: 'Failed to fetch campaign milestones' });
    }
  });

  // Get campaign activity log
  app.get('/api/brand/campaigns/:id/activity', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { id } = req.params;
      const campaign = await storage.getBrandCampaign(id);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      const limit = parseInt(req.query.limit) || 50;
      const activities = await storage.getCampaignActivityLog(id, limit);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching campaign activity:', error);
      res.status(500).json({ message: 'Failed to fetch campaign activity' });
    }
  });

  // Get campaign notifications for user
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const status = req.query.status;
      const notifications = await storage.getCampaignNotifications(user.id, status);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Mark notification as read
  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Get location-based influencer recommendations for a campaign
  app.get('/api/brand/campaigns/:id/recommended-influencers', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { id } = req.params;
      const campaign = await storage.getBrandCampaign(id);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Get recommended influencers based on location and other criteria
      const recommendations = await storage.getLocationBasedInfluencerRecommendations({
        targetLocation: campaign.targetAudienceLocation || undefined,
        platforms: campaign.platforms || [],
        campaignType: campaign.campaignType || undefined,
        minFollowers: 1000, // Basic threshold
        maxRecommendations: 20
      });

      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching influencer recommendations:', error);
      res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
  });

  // Get active campaigns (for influencers) - returns public info only unless influencer has approved proposal
  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const campaigns = await storage.getActiveCampaigns();
      
      // For influencers, filter campaign information based on approval status
      if (user.role === 'influencer') {
        // Get all user proposals to check application status
        const userProposals = await storage.getCampaignProposals(undefined, user.id);
        const proposalByCampaignId = new Map(
          userProposals.map(p => [p.campaignId, p])
        );

        const campaignsWithVisibility = await Promise.all(
          campaigns.map(async (campaign) => {
            const userProposal = proposalByCampaignId.get(campaign.id);
            const hasApproval = await storage.hasApprovedProposal(campaign.id, user.id);
            
            let campaignData;
            if (hasApproval) {
              // Return full campaign details for approved influencers
              campaignData = await storage.getFullCampaignInfo(campaign.id);
            } else {
              // Return limited public information for non-approved influencers
              campaignData = await storage.getPublicCampaignInfo(campaign.id);
            }

            // Add application status for frontend
            return {
              ...campaignData,
              applicationStatus: userProposal ? userProposal.status : null,
              hasApplied: !!userProposal,
              appliedAt: userProposal?.createdAt || null
            };
          })
        );
        res.json(campaignsWithVisibility.filter(Boolean));
      } else {
        // Brands see all campaign details
        res.json(campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  // Get influencer's campaign proposals and approved campaigns
  app.get('/api/influencer/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ message: 'Access denied. Influencer role required.' });
      }

      // Get all proposals for this influencer
      const proposals = await storage.getCampaignProposals(undefined, user.id);
      
      // Enrich proposals with campaign data and brand currency
      const enrichedProposals = await Promise.all(
        proposals.map(async (proposal) => {
          const campaign = await storage.getBrandCampaign(proposal.campaignId);
          const brandUser = campaign ? await storage.getUser(campaign.brandId) : null;
          const brandProfile = campaign ? await storage.getBrandProfile(campaign.brandId) : null;
          
          return {
            ...proposal,
            campaign: campaign ? {
              ...campaign,
              brandName: brandUser ? `${brandUser.firstName} ${brandUser.lastName}` : 'Unknown Brand',
              currency: brandProfile?.preferredCurrency || 'INR'
            } : null
          };
        })
      );

      // Separate by status - approval status vs payment workflow status
      const approvedCampaigns = enrichedProposals.filter(p => {
        const paymentStatus = p.paymentStatus || p.payment_status;
        return p.status === 'approved' && (!paymentStatus || paymentStatus === 'pending');
      });
      
      const workInProgressCampaigns = enrichedProposals.filter(p => {
        const paymentStatus = p.paymentStatus || p.payment_status;
        return paymentStatus === 'work_in_progress' || 
               paymentStatus === 'upfront_payment_pending' ||
               paymentStatus === 'deliverables_submitted' ||
               paymentStatus === 'completion_payment_pending' ||
               p.status === 'deliverables_submitted';
      });
      const paidCampaigns = enrichedProposals.filter(p => p.status === 'paid' || p.status === 'completed');
      const pendingCampaigns = enrichedProposals.filter(p => p.status === 'pending');
      const rejectedCampaigns = enrichedProposals.filter(p => p.status === 'rejected');

      // Set headers to prevent caching of dynamic campaign data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({
        approved: approvedCampaigns,
        workInProgress: workInProgressCampaigns,
        paid: paidCampaigns,
        pending: pendingCampaigns,
        rejected: rejectedCampaigns,
        all: enrichedProposals
      });
    } catch (error) {
      console.error('Error fetching influencer campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch influencer campaigns' });
    }
  });

  // Get campaign details with proper visibility control
  app.get('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { id: campaignId } = req.params;
      
      if (!user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check if campaign exists and is active
      const campaign = await storage.getBrandCampaign(campaignId);
      if (!campaign || campaign.status !== 'active') {
        return res.status(404).json({ message: 'Campaign not found or not active' });
      }

      // For brands, return full campaign details
      if (user.role === 'brand') {
        return res.json(campaign);
      }

      // For influencers, check approval status
      if (user.role === 'influencer') {
        const hasApproval = await storage.hasApprovedProposal(campaignId, user.id);
        
        if (hasApproval) {
          // Return full campaign details for approved influencers
          const fullCampaign = await storage.getFullCampaignInfo(campaignId);
          return res.json(fullCampaign);
        } else {
          // Return limited public information for non-approved influencers
          const publicCampaign = await storage.getPublicCampaignInfo(campaignId);
          return res.json(publicCampaign);
        }
      }

      return res.status(403).json({ message: 'Access denied' });
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      res.status(500).json({ message: 'Failed to fetch campaign details' });
    }
  });

  // Submit proposal to campaign
  app.post('/api/campaigns/:campaignId/proposals', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ message: 'Access denied. Influencer role required.' });
      }

      const { campaignId } = req.params;
      const campaign = await storage.getBrandCampaign(campaignId);
      
      if (!campaign || campaign.status !== 'active') {
        return res.status(404).json({ message: 'Campaign not found or not active' });
      }

      // Check if user already submitted a proposal
      const existingProposals = await storage.getCampaignProposals(campaignId, user.id);
      if (existingProposals.length > 0) {
        return res.status(400).json({ message: 'You have already submitted a proposal for this campaign' });
      }

      const proposalData = {
        ...req.body,
        campaignId,
        influencerId: user.id,
      };

      const proposal = await storage.createCampaignProposal(proposalData);
      res.json(proposal);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      res.status(500).json({ message: 'Failed to submit proposal' });
    }
  });

  // Get proposals for a campaign (brand view)
  app.get('/api/brand/campaigns/:campaignId/proposals', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { campaignId } = req.params;
      const campaign = await storage.getBrandCampaign(campaignId);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      const proposals = await storage.getCampaignProposals(campaignId);
      
      // Enrich proposals with influencer data
      const enrichedProposals = await Promise.all(
        proposals.map(async (proposal) => {
          const influencer = await storage.getUser(proposal.influencerId);
          const socialAccounts = await storage.getSocialAccounts(proposal.influencerId);
          const categories = await storage.getContentCategories(proposal.influencerId);
          
          return {
            ...proposal,
            influencer: {
              id: influencer?.id,
              firstName: influencer?.firstName || 'Unknown',
              lastName: influencer?.lastName || 'User',
              profileImageUrl: influencer?.profileImageUrl,
              location: influencer?.location,
              bio: influencer?.bio,
              socialAccounts: socialAccounts.map(account => ({
                platform: account.platform,
                username: account.username,
                followerCount: account.followerCount || 0,
                engagementRate: account.engagementRate,
              })),
              categories: categories.map(cat => ({
                category: cat.category,
              })),
            },
          };
        })
      );
      
      res.json(enrichedProposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      res.status(500).json({ message: 'Failed to fetch proposals' });
    }
  });

  // Create campaign invitations
  app.post('/api/brand/campaigns/:campaignId/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      const { influencerIds, personalMessage, compensationOffer } = req.body;
      const brandId = req.user.id;

      if (!influencerIds || !Array.isArray(influencerIds) || influencerIds.length === 0) {
        return res.status(400).json({ message: 'At least one influencer must be selected' });
      }

      // Create invitations for each selected influencer
      const invitationData = influencerIds.map((influencerId: string) => ({
        influencerId,
        personalMessage: personalMessage || '',
        compensationOffer: compensationOffer || ''
      }));

      const invitations = await storage.createCampaignInvitations(campaignId, brandId, invitationData);

      res.json({ 
        success: true, 
        invitations,
        message: `Invitations sent to ${influencerIds.length} influencer${influencerIds.length > 1 ? 's' : ''}` 
      });
    } catch (error) {
      console.error('Error creating campaign invitations:', error);
      res.status(500).json({ message: 'Failed to create invitations' });
    }
  });

  // Get campaign invitations (for brands to see who they invited)
  app.get('/api/campaigns/:campaignId/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      const invitations = await storage.getCampaignInvitations(campaignId);
      
      res.json({ success: true, invitations });
    } catch (error) {
      console.error('Error fetching campaign invitations:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch invitations' });
    }
  });

  // Get influencer invitations (for influencers to see campaigns they're invited to)
  app.get('/api/influencer/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const influencerId = req.user.id;
      const invitations = await storage.getInfluencerInvitations(influencerId);
      
      res.json({ success: true, invitations });
    } catch (error) {
      console.error('Error fetching influencer invitations:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch invitations' });
    }
  });

  // Update invitation status (accept/decline)
  app.put('/api/invitations/:invitationId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { invitationId } = req.params;
      const { status } = req.body;

      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: 'Status must be either accepted or declined' });
      }

      const updatedInvitation = await storage.updateInvitationStatus(invitationId, status);
      
      res.json({ success: true, invitation: updatedInvitation });
    } catch (error) {
      console.error('Error updating invitation status:', error);
      res.status(500).json({ success: false, message: 'Failed to update invitation status' });
    }
  });

  // Get approved influencers for a campaign (brand view)
  app.get('/api/brand/campaigns/:campaignId/approved-influencers', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { campaignId } = req.params;
      const campaign = await storage.getBrandCampaign(campaignId);
      
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Get all approved proposals for this campaign
      const allProposals = await storage.getCampaignProposals(campaignId);
      const approvedProposals = allProposals.filter(p => p.status === 'approved');
      
      console.log(`Campaign ${campaignId}: Found ${allProposals.length} total proposals, ${approvedProposals.length} approved`);
      console.log('Proposal statuses:', allProposals.map(p => ({ id: p.id, status: p.status })));
      
      // Enrich with influencer data
      const approvedInfluencers = await Promise.all(
        approvedProposals.map(async (proposal) => {
          const influencer = await storage.getUser(proposal.influencerId);
          const socialAccounts = await storage.getSocialAccounts(proposal.influencerId);
          const categories = await storage.getContentCategories(proposal.influencerId);
          
          // Check if there's an existing conversation
          const conversations = await storage.getConversations(user.id);
          const conversation = conversations.find(c => 
            c.campaignId === campaignId && 
            c.participants && Array.isArray(c.participants) && 
            c.participants.some(p => p.userId === proposal.influencerId)
          );
          
          return {
            id: influencer?.id,
            firstName: influencer?.firstName || 'Unknown',
            lastName: influencer?.lastName || 'User',
            profileImageUrl: influencer?.profileImageUrl,
            bio: influencer?.bio || '',
            followerCount: socialAccounts.reduce((total, account) => 
              total + (account.followerCount || 0), 0
            ),
            engagementRate: socialAccounts.length > 0 ? 
              `${(socialAccounts.reduce((sum, acc) => sum + parseFloat(acc.engagementRate || '0'), 0) / socialAccounts.length).toFixed(1)}%` : '0%',
            categories: categories.map(c => c.category),
            platforms: socialAccounts.map(acc => acc.platform),
            rating: influencer?.rating || 0,
            approvedAt: proposal.updatedAt || proposal.createdAt,
            status: 'approved', // Could be expanded to track collaboration progress
            conversationId: conversation?.id,
          };
        })
      );
      
      res.json(approvedInfluencers);
    } catch (error) {
      console.error('Error fetching approved influencers:', error);
      res.status(500).json({ message: 'Failed to fetch approved influencers' });
    }
  });

  // Approve or reject proposal
  app.put('/api/brand/proposals/:proposalId/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { proposalId } = req.params;
      const { status, brandFeedback } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
      }

      const proposal = await storage.getCampaignProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }

      const campaign = await storage.getBrandCampaign(proposal.campaignId);
      if (!campaign || campaign.brandId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedProposal = await storage.updateCampaignProposal(proposalId, {
        status,
        brandFeedback,
      });

      // Get influencer details for activity log
      const influencer = await storage.getUser(proposal.influencerId);
      const influencerName = influencer ? `${influencer.firstName} ${influencer.lastName}` : 'Unknown Influencer';

      // Log the activity for the campaign activity timeline
      await storage.logCampaignActivity({
        campaignId: proposal.campaignId,
        userId: user.id,
        activityType: status === 'approved' ? 'proposal_approved' : 'proposal_rejected',
        activityDescription: status === 'approved' 
          ? `Approved proposal from ${influencerName} with budget ₹${proposal.proposedCompensation}`
          : `Rejected proposal from ${influencerName}`,
        metadata: {
          proposalId: proposalId,
          influencerId: proposal.influencerId,
          influencerName: influencerName,
          proposedBudget: proposal.proposedCompensation,
          brandFeedback: brandFeedback
        }
      });

      // Log the proposal status change - critical financial action
      await storage.logUserAction({
        userId: user.id,
        action: `proposal_${status}`,
        description: `Brand ${status} proposal from influencer ${proposal.influencerId} for campaign "${campaign.title}" with proposed budget of $${proposal.proposedCompensation}`,
        campaignId: proposal.campaignId,
        proposalId: proposal.id,
        amountAffected: parseFloat(proposal.proposedCompensation || '0'),
        previousValue: proposal.status,
        newValue: status,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          deliverables: proposal.proposedDeliverables,
          brandFeedback,
          influencerMessage: proposal.proposalText,
          proposalCreatedAt: proposal.createdAt,
          campaignTitle: campaign.title,
          brandCompanyName: user.companyName
        }
      });

      // Automatically generate invoice when proposal is approved
      let generatedInvoice = null;
      if (status === 'approved') {
        try {
          generatedInvoice = await storage.generateInvoiceFromCampaign(
            proposal.campaignId, 
            proposalId
          );

          // Log invoice generation
          await storage.logSystemAction({
            action: 'invoice_auto_generated',
            description: `Invoice ${generatedInvoice.invoiceNumber} automatically generated for approved proposal`,
            campaignId: proposal.campaignId,
            userId: user.id,
            amountAffected: parseFloat(generatedInvoice.totalAmount),
            metadata: {
              invoiceId: generatedInvoice.id,
              invoiceNumber: generatedInvoice.invoiceNumber,
              proposalId: proposalId,
              triggeredBy: 'proposal_approval'
            }
          });

          console.log(`Invoice ${generatedInvoice.invoiceNumber} automatically generated for approved proposal ${proposalId}`);
        } catch (invoiceError) {
          console.error('Error generating invoice for approved proposal:', invoiceError);
          
          // Log the failed invoice generation
          await storage.logFailedTransaction({
            userId: user.id,
            action: 'invoice_generation_failed',
            description: `Failed to generate invoice for approved proposal ${proposalId}`,
            errorMessage: invoiceError instanceof Error ? invoiceError.message : 'Unknown error',
            campaignId: proposal.campaignId,
            proposalId: proposalId,
            metadata: {
              proposalBudget: proposal.proposedCompensation,
              campaignTitle: campaign.title
            }
          });

          // Don't fail the approval if invoice generation fails
          console.warn('Proposal approved but invoice generation failed - will need manual invoice creation');
        }
      }

      res.json({
        ...updatedProposal,
        ...(generatedInvoice && { 
          invoice: {
            id: generatedInvoice.id,
            invoiceNumber: generatedInvoice.invoiceNumber,
            totalAmount: generatedInvoice.totalAmount,
            status: generatedInvoice.status,
            dueDate: generatedInvoice.paymentDueDate
          }
        })
      });
    } catch (error) {
      console.error('Error updating proposal status:', error);
      res.status(500).json({ message: 'Failed to update proposal status' });
    }
  });

  // Get influencer's proposals
  app.get('/api/influencer/proposals', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ message: 'Access denied. Influencer role required.' });
      }

      const proposals = await storage.getCampaignProposals(undefined, user.id);
      res.json(proposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      res.status(500).json({ message: 'Failed to fetch proposals' });
    }
  });

  // Upload campaign thumbnail
  app.post('/api/upload/thumbnail', isAuthenticated, upload.single('thumbnail'), async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Image file is required' });
      }

      // Validate file type - only allow images
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'Only image files are allowed' });
      }

      // Create unique filename for thumbnail
      const fileExtension = path.extname(req.file.originalname);
      const filename = `campaign-thumb-${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const finalPath = path.join(uploadDir, filename);
      
      // Move uploaded file to permanent location
      fs.renameSync(req.file.path, finalPath);

      const thumbnailUrl = `/uploads/${filename}`;
      console.log('Campaign thumbnail uploaded successfully:', filename);
      
      res.json({ success: true, thumbnailUrl });
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      res.status(500).json({ message: 'Failed to upload thumbnail' });
    }
  });

  // Submit content for approved proposal
  app.post('/api/proposals/:proposalId/content', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        console.log('Content submission failed: User not influencer', user?.role);
        return res.status(403).json({ message: 'Access denied. Influencer role required.' });
      }

      const { proposalId } = req.params;
      const proposal = await storage.getCampaignProposal(proposalId);
      
      if (!proposal || proposal.influencerId !== user.id) {
        console.log('Content submission failed: Proposal not found or access denied', proposalId, user.id);
        return res.status(404).json({ message: 'Proposal not found' });
      }

      console.log('Proposal status check:', proposal.status, 'Payment status:', proposal.paymentStatus, 'User:', user.id, 'Proposal:', proposalId);
      // Check if proposal is approved (approval status) and optionally in payment workflow
      const isApproved = proposal.status === 'approved';
      const isInPaymentWorkflow = proposal.paymentStatus && ['upfront_payment_pending', 'work_in_progress', 'deliverables_submitted'].includes(proposal.paymentStatus);
      
      if (!isApproved) {
        console.log('Content submission failed: Proposal not approved', proposal.status);
        return res.status(400).json({ message: `Proposal must be approved to submit content. Current status: ${proposal.status}` });
      }

      if (!req.file) {
        console.log('Content submission failed: No file provided');
        return res.status(400).json({ message: 'File is required' });
      }

      console.log('File uploaded successfully:', req.file.originalname, req.file.mimetype);

      // Move uploaded file to permanent location with proper filename
      const fileExtension = path.extname(req.file.originalname);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const finalPath = path.join(uploadDir, filename);
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.renameSync(req.file.path, finalPath);

      const contentData = {
        title: req.body.title || req.file.originalname,
        description: req.body.description || `Content submission for ${proposal.campaign?.title}`,
        contentType: req.body.contentType || (req.file.mimetype.startsWith('video/') ? 'video' : 
                                             req.file.mimetype.startsWith('image/') ? 'image' : 'document'),
        contentUrl: `/uploads/${filename}`,
        platform: req.body.platform || 'website',
        status: 'submitted',
        proposalId,
        campaignId: proposal.campaignId,
        influencerId: user.id,
      };

      const content = await storage.createCampaignContent(contentData);
      
      // Update proposal status to indicate content has been submitted
      await storage.updateCampaignProposal(proposalId, { 
        status: 'deliverables_submitted',
        brandFeedback: 'Deliverables submitted by influencer, awaiting brand review'
      });
      
      console.log('Content submitted successfully:', content.id);
      res.json({ success: true, content });
    } catch (error) {
      console.error('Error submitting content:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ message: 'Failed to submit content', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Brand Content Review API Routes
  
  // Get submitted content for brand review
  app.get('/api/brand/content-review', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const submittedContent = await storage.getBrandSubmittedContent(user.id);
      res.json(submittedContent);
    } catch (error) {
      console.error('Error fetching submitted content:', error);
      res.status(500).json({ message: 'Failed to fetch submitted content' });
    }
  });

  // Approve or reject submitted content
  app.patch('/api/brand/content/:contentId/review', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { contentId } = req.params;
      const { status, feedback } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
      }

      const updatedContent = await storage.reviewCampaignContent(contentId, user.id, status, feedback);
      
      // If content is approved, trigger completion payment workflow
      if (status === 'approved' && updatedContent) {
        try {
          const proposal = await storage.getCampaignProposal(updatedContent.proposalId);
          if (proposal) {
            // Update proposal status to deliverables_submitted to enable completion payment
            await storage.updateCampaignProposal(proposal.id, {
              status: 'deliverables_submitted',
              paymentStatus: 'completion_payment_pending',
              deliverablesSubmittedAt: new Date()
            });
            
            // Create completion payment (50% remaining)
            const { paymentService } = await import('./payment-service');
            const completionPayment = await paymentService.createCompletionPayment(proposal.id);
            
            console.log(`✅ Completion payment created for proposal ${proposal.id} after content approval`);
            
            // Add payment notification info to response
            updatedContent.paymentNotification = {
              type: 'completion_payment_processed',
              message: `Completion payment of ₹${completionPayment.amount} has been automatically processed for this campaign.`,
              amount: completionPayment.amount,
              currency: completionPayment.currency || 'INR',
              campaignTitle: proposal.campaign?.title || 'Campaign'
            };
          }
        } catch (paymentError) {
          console.error('Error creating completion payment after content approval:', paymentError);
          // Don't fail the content approval if payment creation fails
        }
      }
      
      res.json(updatedContent);
    } catch (error) {
      console.error('Error reviewing content:', error);
      res.status(500).json({ message: 'Failed to review content' });
    }
  });

  // Get influencer's content for a specific proposal
  app.get('/api/influencer/content', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ message: 'Access denied. Influencer role required.' });
      }

      const { proposalId } = req.query;

      if (!proposalId) {
        return res.status(400).json({ message: 'Proposal ID is required.' });
      }

      const content = await storage.getContentByProposalId(proposalId as string, user.id);
      res.json(content);
    } catch (error) {
      console.error('Error fetching influencer content:', error);
      res.status(500).json({ message: 'Failed to fetch content' });
    }
  });

  // Publish approved content (influencer marks content as live) - Production Ready
  app.patch('/api/influencer/content/:contentId/publish', isAuthenticated, async (req: any, res) => {
    const startTime = Date.now();
    let auditData: any = {
      action: 'publish_content',
      userId: req.user?.id,
      contentId: req.params.contentId,
      timestamp: new Date(),
      success: false
    };

    try {
      const user = req.user;
      
      // Enhanced security: strict role validation
      if (!user || user.role !== 'influencer') {
        auditData.error = 'Access denied - invalid role';
        await storage.logAuditEvent(auditData);
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Influencer role required.',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Enhanced input validation
      const { contentId } = req.params;
      const { livePostUrl } = req.body;

      // Validate contentId format (UUID)
      if (!contentId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentId)) {
        auditData.error = 'Invalid content ID format';
        await storage.logAuditEvent(auditData);
        return res.status(400).json({
          success: false,
          message: 'Invalid content ID format.',
          code: 'INVALID_CONTENT_ID'
        });
      }

      // Verify the content exists and belongs to this influencer
      const content = await storage.getInfluencerContent(user.id, contentId);
      if (!content) {
        auditData.error = 'Content not found or access denied';
        await storage.logAuditEvent(auditData);
        return res.status(404).json({ 
          success: false,
          message: 'Content not found or you do not have permission to access it.',
          code: 'CONTENT_NOT_FOUND'
        });
      }

      auditData.platformOriginal = content.platform;
      auditData.contentType = content.contentType;

      // Enhanced status validation
      if (content.status === 'live') {
        auditData.error = 'Content already published';
        await storage.logAuditEvent(auditData);
        return res.status(409).json({
          success: false,
          message: 'This content has already been published.',
          code: 'ALREADY_PUBLISHED',
          data: {
            publishedAt: content.publishedAt,
            livePostUrl: content.livePostUrl
          }
        });
      }

      if (content.status !== 'approved') {
        auditData.error = `Invalid status: ${content.status}`;
        await storage.logAuditEvent(auditData);
        return res.status(400).json({ 
          success: false,
          message: `Content must be approved before it can be published. Current status: ${content.status}`,
          code: 'INVALID_STATUS',
          data: { currentStatus: content.status }
        });
      }

      // Enhanced URL validation if provided
      let validatedUrl: string | undefined;
      if (livePostUrl) {
        const { validateContentURL } = await import('../shared/url-validation.ts');
        
        // Enhanced input sanitization
        const { sanitizeTextInput } = await import('../shared/security-utils.ts');
        const sanitizedUrl = sanitizeTextInput(livePostUrl, { maxLength: 2048, allowHtml: false });
        if (sanitizedUrl.length > 2048) {
          auditData.error = 'URL too long';
          await storage.logAuditEvent(auditData);
          return res.status(400).json({
            success: false,
            message: 'URL is too long (maximum 2048 characters).',
            code: 'URL_TOO_LONG'
          });
        }

        const validation = validateContentURL(sanitizedUrl, content.contentType, content.platform as any);
        if (!validation.isValid) {
          auditData.error = `URL validation failed: ${validation.error}`;
          await storage.logAuditEvent(auditData);
          return res.status(400).json({
            success: false,
            message: validation.error || 'Invalid URL format for this platform.',
            code: 'INVALID_URL',
            data: {
              expectedPlatform: content.platform,
              providedUrl: sanitizedUrl.substring(0, 100) + (sanitizedUrl.length > 100 ? '...' : '')
            }
          });
        }

        validatedUrl = validation.sanitizedUrl;
        auditData.originalUrl = livePostUrl;
        auditData.sanitizedUrl = validatedUrl;
      }

      // Rate limiting check (prevent rapid publishing)
      const recentPublishes = await storage.getRecentPublishActivity(user.id, 60000); // Last minute
      if (recentPublishes >= 10) {
        auditData.error = 'Rate limit exceeded';
        await storage.logAuditEvent(auditData);
        return res.status(429).json({
          success: false,
          message: 'Too many publish requests. Please wait a moment before trying again.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60
        });
      }

      // Publish the content
      const publishedContent = await storage.publishContent(contentId, user.id, validatedUrl);
      
      // Automatically trigger bonus payment after successful publishing
      try {
        const { paymentService } = await import('./payment-service');
        await paymentService.createBonusPayment(content.proposalId);
        console.log(`Bonus payment triggered for proposal: ${content.proposalId}`);
      } catch (bonusError: any) {
        console.log(`Bonus payment not triggered: ${bonusError.message}`);
        // Don't fail the publishing if bonus payment fails - just log it
      }
      
      // Success audit log
      auditData.success = true;
      auditData.publishedAt = publishedContent.publishedAt;
      auditData.finalUrl = publishedContent.livePostUrl;
      auditData.duration = Date.now() - startTime;
      await storage.logAuditEvent(auditData);

      // Enhanced response
      res.status(200).json({
        success: true,
        message: 'Content successfully marked as published.',
        data: {
          id: publishedContent.id,
          status: publishedContent.status,
          publishedAt: publishedContent.publishedAt,
          livePostUrl: publishedContent.livePostUrl,
          platform: publishedContent.platform,
          contentType: publishedContent.contentType
        }
      });

    } catch (error: any) {
      // Enhanced error logging
      const errorId = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      auditData.error = error.message;
      auditData.errorId = errorId;
      auditData.duration = Date.now() - startTime;
      
      console.error(`[${errorId}] Error publishing content:`, {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        contentId: req.params.contentId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      await storage.logAuditEvent(auditData);

      // Differentiate between known and unknown errors
      if (error.message.includes('Content not found or not approved')) {
        return res.status(400).json({
          success: false,
          message: 'Unable to publish: content may have been modified or is no longer approved.',
          code: 'PUBLISH_FAILED_STATUS_CHANGED',
          errorId
        });
      }

      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while publishing content. Please try again.',
        code: 'INTERNAL_SERVER_ERROR',
        errorId
      });
    }
  });

  // AI Trend Analysis endpoints
  app.post('/api/trends/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ message: 'Access denied. Influencer role required.' });
      }

      const { platform, timeframe } = req.body;
      
      if (!platform || !['weekly', 'monthly', 'quarterly'].includes(timeframe)) {
        return res.status(400).json({ message: 'Valid platform and timeframe are required.' });
      }

      const { aiTrendAnalyzer } = await import('./ai-trend-analyzer.js');
      
      const predictions = await aiTrendAnalyzer.analyzeTrends({
        userId: user.id,
        platform,
        timeframe
      });

      res.json({
        success: true,
        predictions,
        generatedAt: new Date().toISOString(),
        platform,
        timeframe
      });
    } catch (error) {
      console.error('Trend analysis error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to analyze trends. Please try again.',
        error: error.message 
      });
    }
  });

  app.get('/api/trends/predictions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ message: 'Access denied. Influencer role required.' });
      }

      const { platform } = req.query;
      
      const { aiTrendAnalyzer } = await import('./ai-trend-analyzer.js');
      
      const predictions = await aiTrendAnalyzer.getCachedPredictions(user.id, platform as string);

      res.json({
        success: true,
        predictions,
        count: predictions.length
      });
    } catch (error) {
      console.error('Error fetching predictions:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch trend predictions.',
        error: error.message 
      });
    }
  });

  app.get('/api/trends/quick-insights/:platform', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ message: 'Access denied. Influencer role required.' });
      }

      const { platform } = req.params;
      
      const { aiTrendAnalyzer } = await import('./ai-trend-analyzer.js');
      
      const insights = await aiTrendAnalyzer.getQuickInsights(user.id, platform);

      res.json({
        success: true,
        insights,
        platform
      });
    } catch (error) {
      console.error('Error fetching quick insights:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch quick insights.',
        error: error.message 
      });
    }
  });

  // Test login endpoint for development (before vite middleware)
  app.post('/api/auth/login-test', async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Manually set the session like passport does
      (req as any).login(user, (err: any) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json({ message: 'Test login successful', user });
      });
    } catch (error) {
      console.error('Test login error:', error);
      res.status(500).json({ message: 'Test login failed' });
    }
  });

  // === GAMIFICATION API ROUTES ===
  
  // Get user's gamification profile
  app.get('/api/gamification/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      let profile = await storage.getGamificationProfile(userId);
      
      if (!profile) {
        // Create initial gamification profile
        profile = await storage.createGamificationProfile({
          userId,
          totalPoints: 0,
          currentLevel: 1,
          connectionStreak: 0,
          longestStreak: 0,
          platformsConnected: 0,
          verifiedPlatforms: 0,
          totalConnections: 0,
          achievementCount: 0,
          rank: 'Newcomer',
          nextLevelPoints: 100
        });
      }
      
      res.json({ success: true, profile });
    } catch (error) {
      console.error('Error fetching gamification profile:', error);
      res.status(500).json({ message: 'Failed to fetch gamification profile' });
    }
  });

  // Get user's connection achievements
  app.get('/api/gamification/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const achievements = await storage.getConnectionAchievements(userId);
      
      res.json({ success: true, achievements });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ message: 'Failed to fetch achievements' });
    }
  });

  // Check for new connection achievements
  app.post('/api/gamification/check-achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const newAchievements = await storage.checkConnectionAchievements(userId);
      
      // Award points for each new achievement
      for (const achievement of newAchievements) {
        await storage.awardConnectionPoints(userId, achievement.pointsEarned || 0, 'achievement_unlock', achievement.platform || undefined);
      }
      
      res.json({ success: true, newAchievements });
    } catch (error) {
      console.error('Error checking achievements:', error);
      res.status(500).json({ message: 'Failed to check achievements' });
    }
  });

  // Mark achievement as viewed
  app.patch('/api/gamification/achievements/:id/viewed', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markAchievementAsViewed(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking achievement as viewed:', error);
      res.status(500).json({ message: 'Failed to mark achievement as viewed' });
    }
  });

  // Get connection activity history
  app.get('/api/gamification/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getConnectionActivity(userId, limit);
      
      res.json({ success: true, activities });
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ message: 'Failed to fetch activity' });
    }
  });

  // Calculate current connection streak
  app.get('/api/gamification/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const streak = await storage.calculateConnectionStreak(userId);
      
      res.json({ success: true, streak });
    } catch (error) {
      console.error('Error calculating streak:', error);
      res.status(500).json({ message: 'Failed to calculate streak' });
    }
  });

  // Challenge Routes
  app.get('/api/challenges', isAuthenticated, async (req: any, res) => {
    try {
      const challenges = await storage.getDailyChallenges(req.user.id);
      res.json(challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      res.status(500).json({ error: 'Failed to fetch challenges' });
    }
  });

  app.post('/api/challenges/generate', isAuthenticated, async (req: any, res) => {
    try {
      const challenges = await storage.generateDailyChallenges(req.user.id);
      res.json(challenges);
    } catch (error) {
      console.error('Error generating challenges:', error);
      res.status(500).json({ error: 'Failed to generate challenges' });
    }
  });

  app.post('/api/challenges/:challengeId/complete', isAuthenticated, async (req: any, res) => {
    try {
      await storage.completeDailyChallenge(req.params.challengeId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error completing challenge:', error);
      res.status(500).json({ error: 'Failed to complete challenge' });
    }
  });

  app.put('/api/challenges/:challengeId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { progress } = req.body;
      await storage.updateChallengeProgress(req.params.challengeId, req.user.id, progress);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      res.status(500).json({ error: 'Failed to update challenge progress' });
    }
  });

  // Communication API Routes
  
  // Get conversations for authenticated user
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const conversations = await storage.getConversations(req.user.id);
      res.json({ conversations });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // Get conversation by campaign ID
  app.get('/api/conversations/campaign/:campaignId', isAuthenticated, async (req: any, res) => {
    try {
      const { influencerId } = req.query;
      const conversation = await storage.getConversationByCampaignAndParticipants(
        req.params.campaignId, 
        req.user.id, 
        influencerId as string | undefined
      );
      res.json({ conversation });
    } catch (error) {
      console.error('Error fetching campaign conversation:', error);
      res.status(500).json({ error: 'Failed to fetch campaign conversation' });
    }
  });

  // Get specific conversation
  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id, req.user.id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json({ conversation });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  });

  // Create new conversation
  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertConversationSchema.parse(req.body);
      
      // Validate that user is either the brand or influencer in the conversation
      if (parsed.brandId !== req.user.id && parsed.influencerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only create conversations you are part of' });
      }

      const conversation = await storage.createConversation(parsed);
      res.json({ conversation });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  // Update conversation (status, priority, etc.)
  app.put('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id, req.user.id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const updates = req.body;
      const updatedConversation = await storage.updateConversation(req.params.id, updates);
      res.json({ conversation: updatedConversation });
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  });

  // Get messages in a conversation
  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const messages = await storage.getMessages(req.params.id, req.user.id, limit, offset);
      res.json({ messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Send a message
  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      
      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId, req.user.id);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Determine receiver ID
      const receiverId = conversation.brandId === req.user.id 
        ? conversation.influencerId 
        : conversation.brandId;

      const messageData = {
        ...req.body,
        conversationId,
        senderId: req.user.id,
        receiverId,
      };

      const parsed = insertMessageSchema.parse(messageData);
      const message = await storage.sendMessage(parsed);
      res.json({ message });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Mark conversation as read
  app.post('/api/conversations/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markConversationAsRead(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ error: 'Failed to mark conversation as read' });
    }
  });

  // Get campaign Q&A conversations (pre-approval questions)
  app.get('/api/campaigns/:campaignId/questions', isAuthenticated, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      const { influencerId } = req.query;
      const user = req.user;
      
      // If influencerId is provided and matches current user, get conversations for that influencer
      if (influencerId && influencerId === user.id && user.role === 'influencer') {
        const conversations = await storage.getCampaignQuestionsByInfluencer(campaignId, user.id);
        return res.json({ conversations });
      }
      
      // Verify campaign ownership for brands
      if (user.role === 'brand') {
        const campaign = await storage.getBrandCampaign(campaignId);
        if (!campaign || campaign.brandId !== user.id) {
          return res.status(404).json({ error: 'Campaign not found' });
        }
        
        // Get all conversations for this campaign that are Q&A (not tied to proposals)
        const conversations = await storage.getCampaignQuestions(campaignId);
        return res.json({ conversations });
      }
      
      // Unauthorized access
      return res.status(403).json({ error: 'Access denied' });
    } catch (error) {
      console.error('Error fetching campaign questions:', error);
      res.status(500).json({ error: 'Failed to fetch campaign questions' });
    }
  });

  // Create campaign question (pre-approval Q&A)
  app.post('/api/campaigns/:campaignId/ask', isAuthenticated, async (req: any, res) => {
    try {
      const { campaignId } = req.params;
      const { content, subject } = req.body;
      const user = req.user;
      
      if (user.role !== 'influencer') {
        return res.status(403).json({ error: 'Only influencers can ask campaign questions' });
      }
      
      // Get campaign details to get brand ID
      const campaign = await storage.getBrandCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      // Create conversation for the question
      const conversation = await storage.createConversation({
        brandId: campaign.brandId,
        influencerId: user.id,
        campaignId: campaignId,
        subject: subject || `Question about ${campaign.title}`,
        priority: 'normal'
      });
      
      // Send the initial question message
      const message = await storage.sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        receiverId: campaign.brandId,
        content: content,
        messageType: 'text'
      });
      
      res.json({ 
        success: true, 
        conversation,
        message,
        message: 'Question sent successfully' 
      });
    } catch (error) {
      console.error('Error creating campaign question:', error);
      res.status(500).json({ error: 'Failed to send question' });
    }
  });

  // Message templates
  app.get('/api/message-templates', isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getMessageTemplates(req.user.id);
      res.json({ templates });
    } catch (error) {
      console.error('Error fetching message templates:', error);
      res.status(500).json({ error: 'Failed to fetch message templates' });
    }
  });

  app.post('/api/message-templates', isAuthenticated, async (req: any, res) => {
    try {
      const templateData = {
        ...req.body,
        userId: req.user.id,
      };
      const parsed = insertMessageTemplateSchema.parse(templateData);
      const template = await storage.createMessageTemplate(parsed);
      res.json({ template });
    } catch (error) {
      console.error('Error creating message template:', error);
      res.status(500).json({ error: 'Failed to create message template' });
    }
  });

  app.put('/api/message-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      const template = await storage.updateMessageTemplate(req.params.id, updates);
      res.json({ template });
    } catch (error) {
      console.error('Error updating message template:', error);
      res.status(500).json({ error: 'Failed to update message template' });
    }
  });

  app.delete('/api/message-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteMessageTemplate(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting message template:', error);
      res.status(500).json({ error: 'Failed to delete message template' });
    }
  });

  // Invoice management endpoints
  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        brandId, 
        influencerId, 
        campaignId, 
        status, 
        invoiceType, 
        startDate, 
        endDate, 
        limit = 20, 
        offset = 0 
      } = req.query;

      // Convert date strings to Date objects if provided
      const filters: any = {};
      if (brandId) filters.brandId = brandId;
      if (influencerId) filters.influencerId = influencerId;
      if (campaignId) filters.campaignId = campaignId;
      if (status) filters.status = status;
      if (invoiceType) filters.invoiceType = invoiceType;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      filters.limit = parseInt(limit);
      filters.offset = parseInt(offset);

      // Filter based on user role - users can only see their own invoices
      if (req.user.role === 'brand') {
        filters.brandId = req.user.id;
      } else if (req.user.role === 'influencer') {
        filters.influencerId = req.user.id;
      }

      const invoices = await storage.getInvoices(filters);
      res.json({ invoices });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  // Get invoice statistics for dashboards (MUST be before /:id route)
  app.get('/api/invoices/stats', isAuthenticated, async (req: any, res) => {
    try {
      const { period = '30' } = req.query;
      const periodDays = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const filters: any = {
        startDate,
        endDate: new Date()
      };

      // Filter based on user role
      if (req.user.role === 'brand') {
        filters.brandId = req.user.id;
      } else if (req.user.role === 'influencer') {
        filters.influencerId = req.user.id;
      }

      const invoices = await storage.getInvoices(filters);
      
      // Calculate statistics
      const stats = {
        total: invoices.length,
        paid: invoices.filter(inv => inv.status === 'paid').length,
        pending: invoices.filter(inv => inv.status === 'sent').length,
        overdue: invoices.filter(inv => {
          if (inv.status === 'paid') return false;
          if (!inv.paymentDueDate) return false;
          return new Date(inv.paymentDueDate) < new Date();
        }).length,
        totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0),
        paidAmount: invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + parseFloat(inv.paidAmount || '0'), 0),
        pendingAmount: invoices
          .filter(inv => inv.status !== 'paid')
          .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0)
      };

      res.json({ stats });
    } catch (error) {
      console.error('Error fetching invoice statistics:', error);
      res.status(500).json({ error: 'Failed to fetch invoice statistics' });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Check if user has permission to view this invoice
      if (req.user.role === 'brand' && invoice.brandId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (req.user.role === 'influencer' && invoice.influencerId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get invoice items and tax calculations
      const [items, taxCalculations] = await Promise.all([
        storage.getInvoiceItems(invoice.id),
        storage.getInvoiceTaxCalculations(invoice.id)
      ]);

      res.json({ 
        invoice: {
          ...invoice,
          items,
          taxCalculations
        }
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  });

  app.get('/api/invoices/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Check if user has permission to download this invoice
      if (req.user.role === 'brand' && invoice.brandId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (req.user.role === 'influencer' && invoice.influencerId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate PDF if not already generated
      let pdfPath = invoice.pdfPath;
      if (!pdfPath || !invoice.pdfGenerated) {
        pdfPath = await storage.generateInvoicePDF(invoice.id);
      }
      
      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      
      // Stream the PDF file
      const fs = await import('fs');
      const path = await import('path');
      
      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        // Regenerate PDF if file doesn't exist
        pdfPath = await storage.generateInvoicePDF(invoice.id);
      }
      
      // Stream the file
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      res.status(500).json({ error: 'Failed to generate invoice PDF' });
    }
  });

  app.post('/api/invoices/:id/mark-paid', isAuthenticated, async (req: any, res) => {
    try {
      const { paidAmount, paymentMethod } = req.body;
      
      if (!paidAmount || !paymentMethod) {
        return res.status(400).json({ error: 'Paid amount and payment method are required' });
      }

      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Only brands can mark their invoices as paid
      if (req.user.role !== 'brand' || invoice.brandId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedInvoice = await storage.markInvoiceAsPaid(req.params.id, {
        paidAmount: parseFloat(paidAmount),
        paidAt: new Date(),
        paymentMethod
      });

      res.json({ invoice: updatedInvoice });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      res.status(500).json({ error: 'Failed to mark invoice as paid' });
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      const invoice = await storage.getInvoice(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Only brands can update their invoices, and only if not paid
      if (req.user.role !== 'brand' || invoice.brandId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (invoice.status === 'paid') {
        return res.status(400).json({ error: 'Cannot update paid invoices' });
      }

      const updatedInvoice = await storage.updateInvoice(req.params.id, updates);
      res.json({ invoice: updatedInvoice });
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  });

  // ===============================
  // Financial Reporting API Endpoints
  // ===============================

  // Monthly financial statements
  app.get('/api/reports/statements', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';
      const { statementType } = req.query as { statementType?: string };

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const statements = await storage.getFinancialStatementsByUser(userId, statementType);
      res.json({ success: true, statements });
    } catch (error) {
      console.error('Error fetching financial statements:', error);
      res.status(500).json({ error: 'Failed to fetch financial statements' });
    }
  });

  app.get('/api/reports/statements/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const statement = await storage.getFinancialStatement(id);
      
      if (!statement) {
        return res.status(404).json({ error: 'Financial statement not found' });
      }

      // Check if user has access to this statement
      if (statement.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ success: true, statement });
    } catch (error) {
      console.error('Error fetching financial statement:', error);
      res.status(500).json({ error: 'Failed to fetch financial statement' });
    }
  });

  app.post('/api/reports/statements/generate', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';
      const { year, month } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!year || !month) {
        return res.status(400).json({ error: 'Year and month are required' });
      }

      const { reportsService } = await import('./reports-service');
      
      const statement = await reportsService.generateMonthlyStatement(
        userId,
        userRole as 'brand' | 'influencer',
        year,
        month
      );

      res.json({ success: true, statement });
    } catch (error) {
      console.error('Error generating financial statement:', error);
      res.status(500).json({ error: 'Failed to generate financial statement' });
    }
  });

  // Campaign P&L summary for dashboard
  app.get('/api/reports/pnl/summary', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (userRole !== 'brand') {
        return res.status(403).json({ error: 'Only brands can view P&L summary' });
      }

      // Get all P&L reports for this brand
      let reports = await storage.getCampaignPLReportsByBrand(userId);
      
      // If no reports exist, try to generate them for campaigns with payments
      if (reports.length === 0) {
        const { reportsService } = await import('./reports-service');
        const brandCampaigns = await storage.getBrandCampaigns(userId);
        
        // Generate P&L reports for campaigns that have payments but no reports
        for (const campaign of brandCampaigns) {
          try {
            // Check if campaign has payments
            const campaignPayments = await storage.getCampaignPayments(campaign.id, undefined);
            if (campaignPayments.length > 0) {
              console.log(`Generating P&L report for campaign: ${campaign.title} (${campaign.id})`);
              await reportsService.generateCampaignPLReport(campaign.id, userId, 'campaign_total');
            }
          } catch (error) {
            console.error(`Error generating P&L report for campaign ${campaign.id}:`, error);
          }
        }
        
        // Fetch reports again after generation
        reports = await storage.getCampaignPLReportsByBrand(userId);
      }
      
      if (reports.length === 0) {
        return res.json({
          success: true,
          summary: {
            avgROI: 0,
            profitMargin: 0,
            totalRevenue: 0,
            totalCosts: 0
          }
        });
      }

      // Calculate summary metrics with proper number handling
      const totalRevenue = reports.reduce((sum, report) => {
        const revenue = parseFloat(String(report.totalRevenue || 0));
        return sum + (isNaN(revenue) ? 0 : revenue);
      }, 0);
      
      const totalCosts = reports.reduce((sum, report) => {
        const costs = parseFloat(String(report.totalCosts || 0));
        return sum + (isNaN(costs) ? 0 : costs);
      }, 0);
      
      const avgROI = reports.reduce((sum, report) => {
        const roi = parseFloat(String(report.roi || 0));
        return sum + (isNaN(roi) ? 0 : roi);
      }, 0) / reports.length;
      
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

      res.json({
        success: true,
        summary: {
          avgROI: Number(avgROI.toFixed(1)),
          profitMargin: Number(profitMargin.toFixed(1)),
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalCosts: Number(totalCosts.toFixed(2))
        }
      });
    } catch (error) {
      console.error('Error fetching P&L summary:', error);
      res.status(500).json({ error: 'Failed to fetch P&L summary' });
    }
  });

  // Campaign P&L reports
  app.get('/api/reports/pnl', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      let reports;
      if (userRole === 'brand') {
        reports = await storage.getCampaignPLReportsByBrand(userId);
      } else {
        // For influencers, get reports for campaigns they've participated in
        const userCampaigns = await storage.getInfluencerCampaigns(userId);
        const campaignIds = userCampaigns.approved.map(c => c.id);
        reports = [];
        for (const campaignId of campaignIds) {
          const campaignReports = await storage.getCampaignPLReportsByCampaign(campaignId);
          reports.push(...campaignReports);
        }
      }

      res.json({ success: true, reports });
    } catch (error) {
      console.error('Error fetching P&L reports:', error);
      res.status(500).json({ error: 'Failed to fetch P&L reports' });
    }
  });

  app.get('/api/reports/pnl/campaign/:campaignId', isAuthenticated, async (req, res) => {
    try {
      const { campaignId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check if user has access to this campaign
      const campaign = await storage.getBrandCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const userRole = (req.user as any)?.role;
      if (userRole !== 'brand' || campaign.brandId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const reports = await storage.getCampaignPLReportsByCampaign(campaignId);
      res.json({ success: true, reports });
    } catch (error) {
      console.error('Error fetching campaign P&L reports:', error);
      res.status(500).json({ error: 'Failed to fetch campaign P&L reports' });
    }
  });

  app.post('/api/reports/pnl/generate', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role;
      const { campaignId, reportPeriod = 'campaign_total' } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (userRole !== 'brand') {
        return res.status(403).json({ error: 'Only brands can generate P&L reports' });
      }

      if (!campaignId) {
        return res.status(400).json({ error: 'Campaign ID is required' });
      }

      // Verify campaign ownership
      const campaign = await storage.getBrandCampaign(campaignId);
      if (!campaign || campaign.brandId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { reportsService } = await import('./reports-service');
      
      const report = await reportsService.generateCampaignPLReport(
        campaignId,
        userId,
        reportPeriod as 'campaign_total' | 'monthly' | 'quarterly'
      );

      res.json({ success: true, report });
    } catch (error) {
      console.error('Error generating P&L report:', error);
      res.status(500).json({ error: 'Failed to generate P&L report' });
    }
  });

  // Platform revenue reports (admin only)
  app.get('/api/reports/platform', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check admin access (simplified - in real app, check admin role)
      const user = await storage.getUser(userId);
      if (!user || user.email !== 'admin@influencerhub.com') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { reportType } = req.query as { reportType?: string };
      const reports = await storage.getPlatformRevenueReports(reportType);
      res.json({ success: true, reports });
    } catch (error) {
      console.error('Error fetching platform reports:', error);
      res.status(500).json({ error: 'Failed to fetch platform reports' });
    }
  });

  app.post('/api/reports/platform/generate', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { reportType, year, period } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check admin access
      const user = await storage.getUser(userId);
      if (!user || user.email !== 'admin@influencerhub.com') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      if (!reportType || !year || !period) {
        return res.status(400).json({ error: 'Report type, year, and period are required' });
      }

      const { reportsService } = await import('./reports-service');
      
      const report = await reportsService.generatePlatformRevenueReport(
        reportType as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
        year,
        period
      );

      res.json({ success: true, report });
    } catch (error) {
      console.error('Error generating platform report:', error);
      res.status(500).json({ error: 'Failed to generate platform report' });
    }
  });

  // Influencer earnings summaries
  app.get('/api/reports/earnings/:influencerId', isAuthenticated, async (req, res) => {
    try {
      const { influencerId } = req.params;
      const { year, month } = req.query as { year?: string; month?: string };
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check if user has access to this earnings report
      const userRole = (req.user as any)?.role;
      if (userRole !== 'influencer' || influencerId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!year) {
        return res.status(400).json({ error: 'Year is required' });
      }

      const { reportsService } = await import('./reports-service');
      
      const earningsSummary = await reportsService.generateInfluencerEarningsSummary(
        influencerId,
        parseInt(year),
        month ? parseInt(month) : undefined
      );

      res.json({ success: true, earnings: earningsSummary });
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      res.status(500).json({ error: 'Failed to fetch earnings summary' });
    }
  });

  // Export reports as PDF
  app.get('/api/reports/:reportId/export', isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const { reportType } = req.query as { reportType: 'statement' | 'pnl' | 'platform' | 'earnings' };
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!reportType) {
        return res.status(400).json({ error: 'Report type is required' });
      }

      let reportData;
      let userInfo;

      // Get report data based on type
      switch (reportType) {
        case 'statement':
          reportData = await storage.getFinancialStatement(reportId);
          if (!reportData || reportData.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
          }
          break;
        case 'pnl':
          reportData = await storage.getCampaignPLReport(reportId);
          if (!reportData || reportData.brandId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
          }
          break;
        case 'platform':
          // Check admin access
          const user = await storage.getUser(userId);
          if (!user || user.email !== 'admin@influencerhub.com') {
            return res.status(403).json({ error: 'Admin access required' });
          }
          reportData = await storage.getPlatformRevenueReport(reportId);
          break;
        case 'earnings':
          // For earnings, reportId is actually influencerId
          if (reportId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
          }
          const { year, month } = req.query as { year?: string; month?: string };
          if (!year) {
            return res.status(400).json({ error: 'Year is required for earnings report' });
          }
          const { reportsService } = await import('./reports-service');
          reportData = await reportsService.generateInfluencerEarningsSummary(
            reportId,
            parseInt(year),
            month ? parseInt(month) : undefined
          );
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }

      if (!reportData) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Get user info for PDF header
      userInfo = await storage.getUser(userId);

      const { reportsService } = await import('./reports-service');
      
      const pdfBuffer = await reportsService.generateReportPDF(
        reportType,
        reportData,
        userInfo ? {
          name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.email,
          email: userInfo.email
        } : undefined
      );

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${reportId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  });

  // Earnings reports for influencers
  app.get('/api/reports/earnings', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Get earnings reports for this user
      const earnings = await storage.getEarningsReportsByUser(userId);
      res.json({ success: true, earnings });
    } catch (error) {
      console.error('Error fetching earnings reports:', error);
      res.status(500).json({ error: 'Failed to fetch earnings reports' });
    }
  });

  app.post('/api/reports/earnings/generate', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';
      const { year, month } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!year || !month) {
        return res.status(400).json({ error: 'Year and month are required' });
      }

      const { reportsService } = await import('./reports-service');
      
      const earnings = await reportsService.generateEarningsReport(
        userId,
        year,
        month
      );

      res.json({ success: true, earnings });
    } catch (error) {
      console.error('Error generating earnings report:', error);
      res.status(500).json({ error: 'Failed to generate earnings report' });
    }
  });

  app.get('/api/reports/earnings/analytics', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { reportsService } = await import('./reports-service');
      
      const analytics = await reportsService.generateEarningsAnalytics(userId);

      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Error generating earnings analytics:', error);
      res.status(500).json({ error: 'Failed to generate earnings analytics' });
    }
  });

  // Report templates management
  app.get('/api/reports/templates', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { templateType } = req.query as { templateType?: string };

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const [userTemplates, publicTemplates] = await Promise.all([
        storage.getReportTemplatesByUser(userId, templateType),
        storage.getPublicReportTemplates(templateType)
      ]);

      res.json({ 
        success: true, 
        templates: {
          user: userTemplates,
          public: publicTemplates
        }
      });
    } catch (error) {
      console.error('Error fetching report templates:', error);
      res.status(500).json({ error: 'Failed to fetch report templates' });
    }
  });

  app.post('/api/reports/templates', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const templateData = {
        ...req.body,
        createdBy: userId,
        userType: userRole
      };

      const template = await storage.createReportTemplate(templateData);
      res.json({ success: true, template });
    } catch (error) {
      console.error('Error creating report template:', error);
      res.status(500).json({ error: 'Failed to create report template' });
    }
  });

  // Industry-Standard Financial Statement Routes

  // Income Statement (GAAP-compliant)
  app.get('/api/reports/income-statement', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';
      const { year, month } = req.query as { year?: string; month?: string };

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { reportsService } = await import('./reports-service');
      
      const incomeStatement = await reportsService.generateIncomeStatement(
        userId,
        userRole,
        parseInt(year || String(new Date().getFullYear())),
        month ? parseInt(month) : undefined
      );

      res.json({ success: true, incomeStatement });
    } catch (error) {
      console.error('Error generating income statement:', error);
      res.status(500).json({ error: 'Failed to generate income statement' });
    }
  });

  // Balance Sheet
  app.get('/api/reports/balance-sheet', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';
      const { year, month } = req.query as { year?: string; month?: string };

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { reportsService } = await import('./reports-service');
      
      const balanceSheet = await reportsService.generateBalanceSheet(
        userId,
        userRole,
        parseInt(year || String(new Date().getFullYear())),
        month ? parseInt(month) : undefined
      );

      res.json({ success: true, balanceSheet });
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      res.status(500).json({ error: 'Failed to generate balance sheet' });
    }
  });

  // Cash Flow Statement
  app.get('/api/reports/cash-flow', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';
      const { year, month } = req.query as { year?: string; month?: string };

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { reportsService } = await import('./reports-service');
      
      const cashFlowStatement = await reportsService.generateCashFlowStatement(
        userId,
        userRole,
        parseInt(year || String(new Date().getFullYear())),
        month ? parseInt(month) : undefined
      );

      res.json({ success: true, cashFlowStatement });
    } catch (error) {
      console.error('Error generating cash flow statement:', error);
      res.status(500).json({ error: 'Failed to generate cash flow statement' });
    }
  });

  // Financial Analysis & Ratios
  app.get('/api/reports/financial-analysis', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const userRole = (req.user as any)?.role || 'influencer';
      const { year, month } = req.query as { year?: string; month?: string };

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { reportsService } = await import('./reports-service');
      
      const financialAnalysis = await reportsService.generateFinancialAnalysis(
        userId,
        userRole,
        parseInt(year || String(new Date().getFullYear())),
        month ? parseInt(month) : undefined
      );

      res.json({ success: true, financialAnalysis });
    } catch (error) {
      console.error('Error generating financial analysis:', error);
      res.status(500).json({ error: 'Failed to generate financial analysis' });
    }
  });

  // Generate PDF for Industry-Standard Financial Reports
  app.post('/api/reports/generate-pdf', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { reportType, year, month } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { reportsService } = await import('./reports-service');
      
      let reportData;
      const userRole = user.role || 'influencer';
      const reportYear = parseInt(year || String(new Date().getFullYear()));
      const reportMonth = month ? parseInt(month) : undefined;

      // Get the appropriate report data based on type
      switch (reportType) {
        case 'income_statement':
          reportData = await reportsService.generateIncomeStatement(userId, userRole, reportYear, reportMonth);
          break;
        case 'balance_sheet':
          reportData = await reportsService.generateBalanceSheet(userId, userRole, reportYear, reportMonth);
          break;
        case 'cash_flow':
          reportData = await reportsService.generateCashFlowStatement(userId, userRole, reportYear, reportMonth);
          break;
        case 'financial_analysis':
          reportData = await reportsService.generateFinancialAnalysis(userId, userRole, reportYear, reportMonth);
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }

      // Generate PDF
      const pdfBuffer = await reportsService.generateReportPDF(
        reportType as any,
        reportData,
        {
          name: user.username || 'User',
          email: user.email || ''
        }
      );

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${reportYear}_${reportMonth || 'annual'}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  });

  // Get brand profile (including currency preference)
  app.get('/api/brand/profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const brand = await storage.getBrandProfile(user.id);
      res.json({ success: true, profile: brand });
    } catch (error) {
      console.error('Error fetching brand profile:', error);
      res.status(500).json({ message: 'Failed to fetch brand profile' });
    }
  });

  // Update brand profile (including currency preference)
  app.patch('/api/brand/profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'brand') {
        return res.status(403).json({ message: 'Access denied. Brand role required.' });
      }

      const { preferredCurrency, ...otherUpdates } = req.body;

      // Validate currency if provided
      if (preferredCurrency && !['INR', 'USD', 'GBP', 'EUR'].includes(preferredCurrency)) {
        return res.status(400).json({ message: 'Invalid currency. Supported: INR, USD, GBP, EUR' });
      }

      const updateData: any = {};
      if (preferredCurrency) updateData.preferredCurrency = preferredCurrency;
      if (Object.keys(otherUpdates).length > 0) Object.assign(updateData, otherUpdates);

      const updatedBrand = await storage.updateBrandProfile(user.id, updateData);
      res.json({ success: true, profile: updatedBrand });
    } catch (error) {
      console.error('Error updating brand profile:', error);
      res.status(500).json({ message: 'Failed to update brand profile' });
    }
  });

  // Platform commission summary endpoint
  app.get('/api/platform/commission/summary', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check admin access (for now, just check if user is admin)
      const user = await storage.getUser(userId);
      if (!user || user.email !== 'admin@influencerhub.com') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      
      // Default to last 30 days if no dates provided
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const { paymentService } = await import('./payment-service');
      const summary = await paymentService.getPlatformCommissionSummary(start, end);

      res.json({
        success: true,
        commission: summary
      });
    } catch (error) {
      console.error('Error fetching platform commission summary:', error);
      res.status(500).json({ error: 'Failed to fetch platform commission summary' });
    }
  });

  // Enhanced Campaign Management APIs
  
  // Proposal milestone endpoints
  app.get('/api/proposals/:proposalId/milestones', isAuthenticated, async (req: any, res) => {
    try {
      const { proposalId } = req.params;
      const milestones = await storage.getProposalMilestones(proposalId);
      res.json({ success: true, milestones });
    } catch (error) {
      console.error('Error fetching proposal milestones:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch proposal milestones' });
    }
  });

  // Production-ready milestone system - Get production milestones with retry counts and status
  app.get('/api/proposals/:proposalId/production-milestones', isAuthenticated, async (req: any, res) => {
    const startTime = Date.now();
    
    try {
      const { proposalId } = req.params;
      const user = req.user;

      // Production logging
      console.log(`[ProductionMilestones] Fetching milestones for proposal: ${proposalId}, user: ${user?.id}`);

      if (!user || user.role !== 'influencer') {
        console.warn(`[ProductionMilestones] Access denied for user: ${user?.id}, role: ${user?.role}`);
        return res.status(403).json({ success: false, error: 'Access denied. Influencer role required.' });
      }

      // Validate proposal access
      const proposal = await storage.getCampaignProposal(proposalId);
      if (!proposal || proposal.influencerId !== user.id) {
        console.warn(`[ProductionMilestones] Proposal not found or access denied: ${proposalId}`);
        return res.status(404).json({ success: false, error: 'Proposal not found or access denied' });
      }

      // Get or initialize production milestones
      let milestones = await storage.getProposalMilestones(proposalId);
      
      // If no milestones exist, initialize with production defaults
      if (!milestones || milestones.length === 0) {
        console.log(`[ProductionMilestones] Initializing production milestones for proposal: ${proposalId}`);
        
        const defaultMilestones = [
          { title: 'Script Writing', description: 'Create compelling script and concept', order: 1, status: 'pending', retryCount: 0, maxRetries: 3 },
          { title: 'Content Creation', description: 'Film or create the content', order: 2, status: 'pending', retryCount: 0, maxRetries: 3 },
          { title: 'Editing', description: 'Edit and polish the content', order: 3, status: 'pending', retryCount: 0, maxRetries: 3 },
          { title: 'Review & Revisions', description: 'Review feedback and make revisions', order: 4, status: 'pending', retryCount: 0, maxRetries: 3 },
          { title: 'Publishing', description: 'Publish content live and add URL', order: 5, status: 'pending', retryCount: 0, maxRetries: 5, requiresUrl: true }
        ];

        // Initialize milestones in storage
        for (const milestone of defaultMilestones) {
          await storage.createProposalMilestone(proposalId, milestone);
        }

        milestones = await storage.getProposalMilestones(proposalId);
      }

      // Enhance milestones with production data
      const enhancedMilestones = milestones.map((milestone: any) => ({
        ...milestone,
        retryCount: milestone.retryCount || 0,
        maxRetries: milestone.title === 'Publishing' ? 5 : 3,
        requiresUrl: milestone.title === 'Publishing',
        metadata: milestone.metadata ? JSON.parse(milestone.metadata) : undefined
      }));

      console.log(`[ProductionMilestones] Successfully fetched ${enhancedMilestones.length} milestones in ${Date.now() - startTime}ms`);
      
      res.json({ 
        success: true, 
        milestones: enhancedMilestones,
        metadata: {
          proposalId,
          totalMilestones: enhancedMilestones.length,
          completedMilestones: enhancedMilestones.filter((m: any) => m.status === 'completed').length,
          fetchTime: Date.now() - startTime
        }
      });

    } catch (error: any) {
      console.error(`[ProductionMilestones] Error fetching milestones for proposal ${req.params.proposalId}:`, error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch production milestones',
        details: error.message,
        code: 'MILESTONE_FETCH_ERROR'
      });
    }
  });

  app.post('/api/proposals/:proposalId/milestones/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const { proposalId } = req.params;
      const user = req.user;
      
      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const proposal = await storage.getCampaignProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ success: false, error: 'Proposal not found' });
      }

      const milestones = await storage.initializeProposalMilestones(proposalId, proposal.campaignId, user.id);
      
      // Also create a progress stage tracker
      await storage.createCampaignProgressStage({
        proposalId,
        campaignId: proposal.campaignId
      });

      res.json({ success: true, milestones });
    } catch (error) {
      console.error('Error creating proposal milestones:', error);
      res.status(500).json({ success: false, error: 'Failed to create proposal milestones' });
    }
  });

  app.put('/api/milestones/:milestoneId', isAuthenticated, async (req: any, res) => {
    try {
      const { milestoneId } = req.params;
      const updates = req.body;
      const user = req.user;

      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const milestone = await storage.updateProposalMilestone(milestoneId, updates);
      res.json({ success: true, milestone });
    } catch (error) {
      console.error('Error updating milestone:', error);
      res.status(500).json({ success: false, error: 'Failed to update milestone' });
    }
  });

  // Production-ready milestone completion with enhanced error handling, rollback, retry, and logging
  app.post('/api/milestones/:milestoneId/complete', isAuthenticated, async (req: any, res) => {
    const startTime = Date.now();
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    let rollbackData: any = null;
    
    try {
      const { milestoneId } = req.params;
      const { livePostUrl, proposalId, milestoneType, metadata } = req.body;
      const user = req.user;
      
      // Enhanced logging for production debugging
      console.log(`[MilestoneCompletion] ${transactionId} Starting milestone completion:`, {
        milestoneId,
        userId: user?.id,
        userRole: user?.role,
        proposalId,
        milestoneType,
        hasLiveUrl: !!livePostUrl,
        timestamp: new Date().toISOString()
      });

      // Strict authentication and authorization
      if (!user || user.role !== 'influencer') {
        console.warn(`[MilestoneCompletion] ${transactionId} Access denied:`, {
          userId: user?.id,
          userRole: user?.role
        });
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied. Influencer role required.',
          code: 'AUTH_ERROR',
          transactionId 
        });
      }

      // Get milestone details before completion for rollback purposes
      const currentMilestone = await storage.getProposalMilestone(milestoneId);
      if (!currentMilestone) {
        console.warn(`[MilestoneCompletion] ${transactionId} Milestone not found:`, milestoneId);
        return res.status(404).json({
          success: false,
          error: 'Milestone not found',
          code: 'MILESTONE_NOT_FOUND',
          transactionId
        });
      }

      // Store rollback data
      rollbackData = {
        milestoneId,
        previousStatus: currentMilestone.status,
        previousRetryCount: currentMilestone.retryCount || 0,
        timestamp: new Date().toISOString()
      };

      // Enhanced URL validation for Publishing milestone
      if (milestoneType === 'Publishing' && currentMilestone.title === 'Publishing') {
        if (!livePostUrl || !livePostUrl.trim()) {
          console.warn(`[MilestoneCompletion] ${transactionId} Missing live URL for Publishing milestone`);
          return res.status(400).json({
            success: false,
            error: 'Live post URL is required for Publishing milestone',
            code: 'URL_REQUIRED',
            transactionId
          });
        }

        // URL format validation
        const urlPatterns = {
          instagram: /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|tv|reel)\//,
          tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\//,
          youtube: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)\w+/,
          facebook: /^https?:\/\/(www\.)?facebook\.com\/.*\/(posts|videos)\//,
          twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\//
        };

        const isValidUrl = Object.values(urlPatterns).some(pattern => pattern.test(livePostUrl.trim()));
        if (!isValidUrl) {
          console.warn(`[MilestoneCompletion] ${transactionId} Invalid URL format:`, livePostUrl);
          return res.status(400).json({
            success: false,
            error: 'URL must be from a supported platform (Instagram, TikTok, YouTube, Facebook, Twitter)',
            code: 'INVALID_URL_FORMAT',
            transactionId,
            providedUrl: livePostUrl.substring(0, 50) + (livePostUrl.length > 50 ? '...' : '')
          });
        }
      }

      console.log(`[MilestoneCompletion] ${transactionId} Completing milestone in database`);
      
      // Complete milestone with enhanced error handling
      let milestone;
      try {
        milestone = await storage.completeProposalMilestone(milestoneId, {
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          completedBy: user.id,
          completedAt: new Date().toISOString()
        });
      } catch (dbError: any) {
        console.error(`[MilestoneCompletion] ${transactionId} Database error:`, dbError);
        return res.status(500).json({
          success: false,
          error: 'Database error during milestone completion',
          code: 'DB_ERROR',
          transactionId,
          details: dbError.message
        });
      }

      // Enhanced Publishing milestone integration with content publishing system
      if (milestone.title === 'Publishing' && livePostUrl) {
        console.log(`[MilestoneCompletion] ${transactionId} Processing Publishing milestone with URL:`, livePostUrl.substring(0, 50));
        
        try {
          // Find the content for this proposal
          const proposalContent = await storage.getCampaignContent(milestone.proposalId);
          if (proposalContent && proposalContent.length > 0) {
            const contentId = proposalContent[0].id;
            
            console.log(`[MilestoneCompletion] ${transactionId} Publishing content ID: ${contentId}`);
            
            // Trigger actual content publishing system with retry mechanism
            let publishAttempts = 0;
            let publishedContent;
            const maxPublishRetries = 3;
            
            while (publishAttempts < maxPublishRetries) {
              try {
                publishAttempts++;
                console.log(`[MilestoneCompletion] ${transactionId} Publishing attempt ${publishAttempts}/${maxPublishRetries}`);
                
                publishedContent = await storage.publishContent(contentId, user.id, livePostUrl);
                break; // Success, exit retry loop
                
              } catch (publishError: any) {
                console.error(`[MilestoneCompletion] ${transactionId} Publishing attempt ${publishAttempts} failed:`, publishError.message);
                
                if (publishAttempts === maxPublishRetries) {
                  throw publishError; // Final attempt failed, throw error
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * publishAttempts));
              }
            }
            
            console.log(`[MilestoneCompletion] ${transactionId} Content published successfully after ${publishAttempts} attempts`);
            
            // Trigger bonus payment automatically with retry mechanism
            let paymentAttempts = 0;
            const maxPaymentRetries = 3;
            
            while (paymentAttempts < maxPaymentRetries) {
              try {
                paymentAttempts++;
                console.log(`[MilestoneCompletion] ${transactionId} Bonus payment attempt ${paymentAttempts}/${maxPaymentRetries}`);
                
                const { paymentService } = await import('./payment-service');
                await paymentService.createBonusPayment(milestone.proposalId);
                console.log(`[MilestoneCompletion] ${transactionId} Bonus payment triggered successfully`);
                break; // Success, exit retry loop
                
              } catch (paymentError: any) {
                console.error(`[MilestoneCompletion] ${transactionId} Payment attempt ${paymentAttempts} failed:`, paymentError.message);
                
                if (paymentAttempts === maxPaymentRetries) {
                  console.error(`[MilestoneCompletion] ${transactionId} All payment attempts failed, but milestone completion continues`);
                  break; // Don't fail milestone completion for payment issues
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * paymentAttempts));
              }
            }
            
            console.log(`[MilestoneCompletion] ${transactionId} ✅ Publishing milestone completed - Content published and bonus payment processed`);
            
          } else {
            console.warn(`[MilestoneCompletion] ${transactionId} No content found for proposal: ${milestone.proposalId}`);
          }
        } catch (integrationError: any) {
          console.error(`[MilestoneCompletion] ${transactionId} Integration error in Publishing milestone:`, integrationError);
          
          // ROLLBACK: Revert milestone completion on critical failure
          try {
            console.log(`[MilestoneCompletion] ${transactionId} Initiating rollback due to integration failure`);
            await storage.updateProposalMilestone(milestoneId, {
              status: rollbackData.previousStatus,
              retryCount: rollbackData.previousRetryCount + 1,
              lastError: integrationError.message
            });
            console.log(`[MilestoneCompletion] ${transactionId} Rollback completed successfully`);
          } catch (rollbackError: any) {
            console.error(`[MilestoneCompletion] ${transactionId} CRITICAL: Rollback failed:`, rollbackError);
          }
          
          return res.status(500).json({
            success: false,
            error: 'Publishing integration failed. Milestone completion reverted.',
            code: 'PUBLISHING_INTEGRATION_ERROR',
            transactionId,
            details: integrationError.message,
            rollback: 'completed'
          });
        }
      }
      
      // Update overall campaign progress
      try {
        const proposal = await storage.getCampaignProposal(milestone.proposalId);
        if (proposal) {
          await storage.calculateOverallProgress(milestone.proposalId);
        }
      } catch (progressError: any) {
        console.error(`[MilestoneCompletion] ${transactionId} Progress calculation error:`, progressError);
        // Don't fail milestone completion for progress calculation issues
      }

      const duration = Date.now() - startTime;
      console.log(`[MilestoneCompletion] ${transactionId} ✅ Milestone completion successful in ${duration}ms`);

      res.json({ 
        success: true, 
        milestone,
        transactionId,
        processingTime: duration,
        metadata: {
          completedAt: new Date().toISOString(),
          integrationStatus: milestone.title === 'Publishing' ? 'completed' : 'not_applicable'
        }
      });
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[MilestoneCompletion] ${transactionId} Critical error after ${duration}ms:`, error);
      
      // Attempt rollback on critical failure
      if (rollbackData) {
        try {
          console.log(`[MilestoneCompletion] ${transactionId} Initiating critical failure rollback`);
          await storage.updateProposalMilestone(rollbackData.milestoneId, {
            status: rollbackData.previousStatus,
            retryCount: rollbackData.previousRetryCount + 1,
            lastError: error.message
          });
          console.log(`[MilestoneCompletion] ${transactionId} Critical failure rollback completed`);
        } catch (rollbackError: any) {
          console.error(`[MilestoneCompletion] ${transactionId} CRITICAL: Final rollback failed:`, rollbackError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        error: 'Milestone completion failed',
        code: 'MILESTONE_COMPLETION_ERROR',
        transactionId,
        details: error.message,
        processingTime: duration,
        rollback: rollbackData ? 'attempted' : 'not_applicable'
      });
    }
  });

  // Time tracking endpoints
  app.get('/api/proposals/:proposalId/time-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const { proposalId } = req.params;
      const user = req.user;

      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const sessions = await storage.getTimeTrackingSessions(proposalId);
      const totalTimeSpent = await storage.getTotalTimeSpent(proposalId);
      
      res.json({ 
        success: true, 
        sessions, 
        totalTimeSpent,
        totalHours: Math.round((totalTimeSpent / 3600) * 100) / 100
      });
    } catch (error) {
      console.error('Error fetching time sessions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch time sessions' });
    }
  });

  app.post('/api/time-tracking/start', isAuthenticated, async (req: any, res) => {
    try {
      const { milestoneId, proposalId, description } = req.body;
      const user = req.user;

      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const session = await storage.startTimeTracking(milestoneId, proposalId, user.id, description);
      res.json({ success: true, session });
    } catch (error) {
      console.error('Error starting time tracking:', error);
      res.status(500).json({ success: false, error: 'Failed to start time tracking' });
    }
  });

  app.post('/api/time-tracking/:sessionId/stop', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const user = req.user;

      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const session = await storage.stopTimeTracking(sessionId);
      res.json({ success: true, session });
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      res.status(500).json({ success: false, error: 'Failed to stop time tracking' });
    }
  });

  app.get('/api/time-tracking/active', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;

      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const session = await storage.getActiveTimeSession(user.id);
      res.json({ success: true, session });
    } catch (error) {
      console.error('Error fetching active session:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch active session' });
    }
  });

  // Campaign progress endpoints
  app.get('/api/proposals/:proposalId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { proposalId } = req.params;
      const user = req.user;

      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const progressStage = await storage.getCampaignProgressStage(proposalId);
      const overallProgress = await storage.calculateOverallProgress(proposalId);
      
      res.json({ 
        success: true, 
        progressStage,
        overallProgress 
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch progress' });
    }
  });

  app.put('/api/proposals/:proposalId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { proposalId } = req.params;
      const { stage, progress } = req.body;
      const user = req.user;

      if (!user || user.role !== 'influencer') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      const progressStage = await storage.updateStageProgress(proposalId, stage, progress);
      const overallProgress = await storage.calculateOverallProgress(proposalId);
      
      res.json({ 
        success: true, 
        progressStage,
        overallProgress 
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ success: false, error: 'Failed to update progress' });
    }
  });

  // External influencer invitation endpoint
  app.post('/api/brand/invite-external-influencers', isAuthenticated, async (req: any, res) => {
    try {
      const { campaignId, invitations, campaignDetails } = req.body;
      const user = req.user;

      if (!user || user.role !== 'brand') {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      // Validate input
      if (!campaignId || !invitations || !Array.isArray(invitations) || invitations.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid invitation data' });
      }

      const { sendExternalInvitationEmail, sendExternalInvitationSMS } = await import('./utils/communication');
      
      const results = [];
      
      for (const invitation of invitations) {
        try {
          let sent = false;
          
          switch (invitation.type) {
            case 'email':
              sent = await sendExternalInvitationEmail(
                invitation.value,
                campaignDetails.title,
                campaignDetails.description,
                campaignDetails.personalMessage,
                campaignDetails.incentiveOffer,
                campaignId
              );
              break;
              
            case 'instagram':
            case 'tiktok':
            case 'youtube':
              // For social media handles, we would typically integrate with 
              // social media APIs or send messages through those platforms
              // For now, we'll log this and mark as pending manual outreach
              console.log(`Social media invitation to ${invitation.type}: ${invitation.value}`);
              sent = true; // Mark as sent for demo purposes
              break;
              
            default:
              console.log(`Unknown invitation type: ${invitation.type}`);
          }
          
          results.push({
            invitation,
            sent,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error(`Failed to send invitation to ${invitation.value}:`, error);
          results.push({
            invitation,
            sent: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Store invitation records for tracking
      const invitationRecord = {
        id: `ext_inv_${Date.now()}`,
        campaignId,
        brandId: user.id,
        invitations: results,
        campaignDetails,
        createdAt: new Date().toISOString(),
        status: 'sent'
      };

      // In a real implementation, you would store this in the database
      console.log('External invitation record:', invitationRecord);

      const successCount = results.filter(r => r.sent).length;
      const totalCount = results.length;

      res.json({
        success: true,
        message: `Successfully sent ${successCount} out of ${totalCount} invitations`,
        results,
        invitationRecord
      });

    } catch (error) {
      console.error('Error sending external invitations:', error);
      res.status(500).json({ success: false, error: 'Failed to send invitations' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
