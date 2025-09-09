import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_GOOGLE_CLIENT_SECRET || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "influencer-hub-secret";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth credentials not found. Social login will not work.");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'influencer-hub-session', // Custom session name to avoid conflicts
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax', // Better security and session isolation
    },
  });
}

// Dynamic session middleware that creates role-specific sessions
export function getDynamicSession() {
  return (req: any, res: any, next: any) => {
    // Check if there's a role preference in the request
    const roleHint = req.query.role || req.body.role || req.headers['x-user-role'];
    
    if (roleHint && (roleHint === 'influencer' || roleHint === 'brand')) {
      // Create role-specific session
      const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
      const pgStore = connectPg(session);
      const sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        ttl: sessionTtl,
        tableName: "sessions",
      });
      
      const roleSession = session({
        secret: SESSION_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        name: `hub-${roleHint}-session`, // Role-specific session name
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: sessionTtl,
          sameSite: 'lax',
        },
      });
      
      return roleSession(req, res, next);
    }
    
    // Fallback to default session
    const defaultSession = getSession();
    return defaultSession(req, res, next);
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    // Get the base URL for OAuth callback
    let baseURL;
    if (process.env.REPLIT_DOMAINS) {
      const domain = process.env.REPLIT_DOMAINS.split(',')[0].trim();
      baseURL = domain.startsWith('http') ? domain : `https://${domain}`;
    } else {
      baseURL = 'http://localhost:5000';
    }
    
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${baseURL}/api/auth/google/callback`,
      scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
        
        if (!user) {
          // Create new user
          user = await storage.upsertUser({
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value || '',
            role: 'influencer', // Default role, can be changed later
          });
        }

        // Create or update Google social account
        const existingAccount = await storage.getSocialAccount(user.id, 'google');
        if (existingAccount) {
          await storage.updateSocialAccount(existingAccount.id, {
            accessToken,
            refreshToken,
            tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour
            isConnected: true,
          });
        } else {
          await storage.createSocialAccount({
            userId: user.id,
            platform: 'google',
            platformUserId: profile.id,
            username: profile.emails?.[0]?.value || '',
            displayName: profile.displayName || '',
            profileUrl: profile.profileUrl || '',
            accessToken,
            refreshToken,
            tokenExpiresAt: new Date(Date.now() + 3600000),
            isConnected: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }));
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Failed to deserialize user out of session:", error);
      done(null, false);
    }
  });

  // Auth routes
  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ['profile', 'email']
  }));

  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
