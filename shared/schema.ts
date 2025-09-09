import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  numeric,
  decimal,
  bigint,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with social profile support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For email/password authentication
  phone: varchar("phone"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location"), // Geographic location for influencers
  role: varchar("role").notNull(), // 'influencer' or 'brand'
  themePreference: varchar("theme_preference").default('rich-gradient'), // 'rich-gradient', 'minimal-light', 'warm-sunset', 'light-purple'
  isVerified: boolean("is_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brand profiles table for additional brand-specific information
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: varchar("company_name").notNull(),
  industry: varchar("industry").notNull(),
  website: varchar("website"),
  companySize: varchar("company_size"), // 'startup', 'small', 'medium', 'large', 'enterprise'
  targetAudienceAge: varchar("target_audience_age"), // '13-17', '18-24', '25-34', '35-44', '45-54', '55+'
  targetAudienceGender: varchar("target_audience_gender"), // 'male', 'female', 'all'
  targetAudienceLocation: varchar("target_audience_location"),
  budgetRange: varchar("budget_range"), // '\u20b980K-\u20b94L', '\u20b94L-\u20b98L', '\u20b98L-\u20b920L', '\u20b920L-\u20b940L', '\u20b940L+'
  campaignTypes: text("campaign_types").array(), // ['product_placement', 'sponsored_posts', 'brand_ambassador', 'events']
  businessRegistrationNumber: varchar("business_registration_number"), // GSTIN for India, EIN for US
  businessVerified: boolean("business_verified").default(false),
  domainVerified: boolean("domain_verified").default(false),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  preferredCurrency: varchar("preferred_currency").default('INR'), // 'INR', 'USD', 'GBP', 'EUR'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brand campaigns table
export const brandCampaigns = pgTable("brand_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  description: text("description"),
  campaignType: varchar("campaign_type").notNull(), // 'product_placement', 'sponsored_posts', 'brand_ambassador'
  status: varchar("status").notNull().default('draft'), // 'draft', 'active', 'paused', 'completed', 'cancelled', 'archived'
  
  // Campaign Visual Assets
  thumbnailUrl: varchar("thumbnail_url"), // Primary campaign thumbnail/hero image
  additionalAssets: text("additional_assets").array(), // Supporting images, brand assets, product photos
  
  // Public Information (Visible to all influencers during bidding)
  generalStartDate: varchar("general_start_date"), // e.g., "Early September" 
  generalEndDate: varchar("general_end_date"), // e.g., "Late September"
  targetAudienceDemographics: text("target_audience_demographics"), // Age, gender, location
  targetAudienceInterests: text("target_audience_interests"), // Beauty, lifestyle, etc.
  targetAudienceLocation: varchar("target_audience_location"), // Geographic targeting
  targetAudienceSize: varchar("target_audience_size"), // e.g., "100K-500K followers"
  contentType: varchar("content_type"), // Posts, stories, reels, etc.
  minimumPosts: integer("minimum_posts").default(1),
  contentGuidelines: text("content_guidelines"),
  requiredHashtags: text("required_hashtags").array(),
  submissionDeadline: timestamp("submission_deadline"),
  paymentModel: varchar("payment_model"), // 'flat_fee', 'cpa', 'hybrid'
  paymentTermsGeneral: varchar("payment_terms_general"), // 'competitive_rate', 'upon_completion'
  campaignGoal: varchar("campaign_goal"), // 'brand_awareness', 'sales', 'engagement'
  
  // Campaign Visibility and Assignment
  visibilityType: varchar("visibility_type").default('public'), // 'public', 'invitation_only', 'hybrid'
  
  // Campaign Priority and Urgency (Public Information)
  priority: varchar("priority").default('medium'), // 'low', 'medium', 'high', 'urgent'
  urgencyReason: text("urgency_reason"), // Optional explanation for urgent campaigns
  
  // Private Information (Visible only to approved influencers)
  exactStartDate: timestamp("exact_start_date"),
  exactEndDate: timestamp("exact_end_date"),
  budgetMin: numeric("budget_min", { precision: 10, scale: 2 }),
  budgetMax: numeric("budget_max", { precision: 10, scale: 2 }),
  paymentTermsDetailed: text("payment_terms_detailed"), // e.g., "50% upfront, 50% on completion"
  targetReach: integer("target_reach"),
  targetEngagement: varchar("target_engagement"),
  kpiMetrics: text("kpi_metrics").array(), // ['reach', 'conversions', 'engagement_rate']
  competitorBenchmarks: text("competitor_benchmarks"),
  
  // Enhanced Content Brief Section
  briefOverview: text("brief_overview"), // Comprehensive campaign overview
  brandVoice: text("brand_voice"), // Brand voice and tone guidelines
  keyMessages: text("key_messages").array(), // Key talking points
  contentDosAndDonts: jsonb("content_dos_and_donts"), // {"dos": [...], "donts": [...]}
  moodBoardUrls: text("mood_board_urls").array(), // Visual inspiration references
  exampleContentUrls: text("example_content_urls").array(), // Example posts/videos
  
  // Detailed Payment Structure
  paymentStructure: jsonb("payment_structure"), // {"upfront": 50, "completion": 50, "bonus": 0}
  ratesByPlatform: jsonb("rates_by_platform"), // {"instagram_post": 500, "tiktok_video": 300}
  paymentTimeline: text("payment_timeline"), // "Within 7 days of deliverable approval"
  bonusStructure: jsonb("bonus_structure"), // Performance-based bonuses
  
  // Content Specifications
  platformRequirements: jsonb("platform_requirements"), // Detailed specs per platform
  contentFormats: text("content_formats").array(), // ['post', 'story', 'reel', 'video']
  videoSpecs: jsonb("video_specs"), // {"duration": "30-60s", "resolution": "1080p", "aspect_ratio": "9:16"}
  imageSpecs: jsonb("image_specs"), // {"resolution": "1080x1080", "format": "JPG/PNG"}
  captionRequirements: text("caption_requirements"), // Caption style and length
  
  // Enhanced Target Audience
  audiencePersonas: jsonb("audience_personas"), // Detailed persona descriptions
  audienceInsights: jsonb("audience_insights"), // Demographic and psychographic data
  competitorAnalysis: jsonb("competitor_analysis"), // Competitive landscape info
  
  // Legacy fields for backward compatibility
  budget: numeric("budget", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  actualReach: integer("actual_reach"),
  actualEngagement: varchar("actual_engagement"),
  requirements: text("requirements"),
  deliverables: text("deliverables").array(),
  platforms: varchar("platforms").array(), // ['instagram', 'tiktok', 'youtube']
  targetAudience: text("target_audience"), // Target audience description
  minimumInfluencers: integer("minimum_influencers").default(1),
  budgetRange: varchar("budget_range"), // Budget range for the campaign
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign milestones for tracking lifecycle progress
export const campaignMilestones = pgTable("campaign_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  milestoneType: varchar("milestone_type").notNull(), // 'launched', 'first_application', 'all_approved', 'content_submitted', 'payment_processed', 'completed'
  status: varchar("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'skipped'
  expectedDate: timestamp("expected_date"),
  completedDate: timestamp("completed_date"),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional milestone data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign activity log for comprehensive audit trail
export const campaignActivityLog = pgTable("campaign_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: varchar("activity_type").notNull(), // 'status_change', 'proposal_received', 'content_approved', 'payment_made', 'message_sent'
  activityDescription: text("activity_description").notNull(),
  previousState: jsonb("previous_state"), // State before the activity
  newState: jsonb("new_state"), // State after the activity
  metadata: jsonb("metadata"), // Additional context data
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign notifications for automated messaging
export const campaignNotifications = pgTable("campaign_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificationType: varchar("notification_type").notNull(), // 'status_change', 'deadline_reminder', 'payment_due', 'content_approved', 'milestone_reached'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  priority: varchar("priority").notNull().default('normal'), // 'low', 'normal', 'high', 'urgent'
  channel: varchar("channel").notNull().default('in_app'), // 'in_app', 'email', 'sms', 'chat'
  status: varchar("status").notNull().default('pending'), // 'pending', 'sent', 'delivered', 'read', 'failed'
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  retryCount: integer("retry_count").default(0),
  metadata: jsonb("metadata"), // Additional notification data
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign automation rules for smart lifecycle management
export const campaignAutomationRules = pgTable("campaign_automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  ruleType: varchar("rule_type").notNull(), // 'auto_complete', 'deadline_reminder', 'payment_trigger', 'status_update'
  triggerCondition: varchar("trigger_condition").notNull(), // 'date_reached', 'status_changed', 'metric_threshold', 'manual'
  triggerValue: text("trigger_value"), // Condition value (date, status, number)
  actionType: varchar("action_type").notNull(), // 'change_status', 'send_notification', 'process_payment', 'generate_report'
  actionParameters: jsonb("action_parameters"), // Parameters for the action
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign invitations for targeted influencer assignment
export const campaignInvitations = pgTable("campaign_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status").notNull().default('pending'), // 'pending', 'accepted', 'declined', 'expired'
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"), // Invitation expiry date
  personalMessage: text("personal_message"), // Custom message from brand to influencer
  compensationOffer: varchar("compensation_offer"), // Specific offer for this influencer
  metadata: jsonb("metadata"), // Additional invitation data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proposal Milestones - Track individual tasks within influencer proposals  
export const proposalMilestones = pgTable("proposal_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().references(() => campaignProposals.id, { onDelete: 'cascade' }),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Milestone details
  title: varchar("title").notNull(), // "Script Writing", "Filming", "Editing", "Posting"
  description: text("description"),
  status: varchar("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'skipped'
  type: varchar("type").notNull(), // 'script_writing', 'filming', 'editing', 'posting', 'review', 'revision'
  order: integer("order").notNull().default(0), // Order of milestones
  
  // Time tracking
  estimatedHours: decimal("estimated_hours", { precision: 4, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 4, scale: 2 }),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Deadline tracking
  dueDate: timestamp("due_date"),
  isUrgent: boolean("is_urgent").default(false), // Auto-calculated if < 2 days
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time Tracking Sessions - Track actual work time
export const timeTrackingSessions = pgTable("time_tracking_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  milestoneId: varchar("milestone_id").references(() => proposalMilestones.id, { onDelete: 'cascade' }),
  proposalId: varchar("proposal_id").notNull().references(() => campaignProposals.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Session details
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  description: text("description"), // What was worked on
  
  // Session metadata
  isActive: boolean("is_active").default(false), // Currently running
  pausedAt: timestamp("paused_at"),
  resumedAt: timestamp("resumed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign Progress Stages - Overall campaign workflow tracking
export const campaignProgressStages = pgTable("campaign_progress_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().references(() => campaignProposals.id, { onDelete: 'cascade' }),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  
  // Progress stages (0-100%)
  contentCreationProgress: integer("content_creation_progress").default(0),
  submissionProgress: integer("submission_progress").default(0),
  reviewProgress: integer("review_progress").default(0),
  approvalProgress: integer("approval_progress").default(0),
  paymentProgress: integer("payment_progress").default(0),
  
  // Current active stage
  currentStage: varchar("current_stage").default('content_creation'), // 'content_creation', 'submission', 'review', 'approval', 'payment', 'completed'
  overallProgress: integer("overall_progress").default(0), // 0-100%
  
  // Timeline tracking
  contentCreationStarted: timestamp("content_creation_started"),
  contentCreationCompleted: timestamp("content_creation_completed"),
  submissionCompleted: timestamp("submission_completed"),
  reviewStarted: timestamp("review_started"),
  reviewCompleted: timestamp("review_completed"),
  approvalCompleted: timestamp("approval_completed"),
  paymentCompleted: timestamp("payment_completed"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign proposals table - for influencers to apply to campaigns
export const campaignProposals = pgTable("campaign_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status").notNull().default('pending'), // 'pending', 'approved', 'rejected', 'withdrawn' - approval status only
  paymentStatus: varchar("payment_status"), // 'upfront_payment_pending', 'work_in_progress', 'deliverables_submitted', 'completion_payment_pending', 'completed', 'paid' - payment workflow status
  proposalText: text("proposal_text"), // Influencer's pitch/proposal
  proposedDeliverables: text("proposed_deliverables").array(),
  proposedTimeline: text("proposed_timeline"),
  proposedCompensation: varchar("proposed_compensation"),
  portfolioLinks: text("portfolio_links").array(),
  additionalNotes: text("additional_notes"),
  brandFeedback: text("brand_feedback"), // Brand's response to the proposal
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  workStartedAt: timestamp("work_started_at"), // When upfront payment was received
  deliverablesSubmittedAt: timestamp("deliverables_submitted_at"),
  completedAt: timestamp("completed_at"), // When final payment was processed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign content submissions - for approved influencers to submit content
export const campaignContent = pgTable("campaign_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().references(() => campaignProposals.id, { onDelete: 'cascade' }),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentType: varchar("content_type").notNull(), // 'post', 'story', 'reel', 'video', 'blog'
  title: varchar("title").notNull(),
  description: text("description"),
  contentUrl: varchar("content_url"), // Link to the content/post
  previewUrl: varchar("preview_url"), // Preview image/video URL
  livePostUrl: varchar("live_post_url"), // URL of the published post on social media
  platform: varchar("platform").notNull(),
  status: varchar("status").notNull().default('draft'), // 'draft', 'submitted', 'approved', 'rejected', 'live'
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  publishedAt: timestamp("published_at"),
  brandFeedback: text("brand_feedback"),
  revisionNotes: text("revision_notes"),
  performanceMetrics: jsonb("performance_metrics"), // Views, likes, comments, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media accounts linked to users
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar("platform").notNull(), // 'instagram', 'tiktok', 'youtube', 'facebook', 'google'
  platformUserId: varchar("platform_user_id").notNull(),
  username: varchar("username"),
  displayName: varchar("display_name"),
  profileUrl: varchar("profile_url"),
  followerCount: integer("follower_count"),
  followingCount: integer("following_count"),
  postCount: integer("post_count"),
  engagementRate: varchar("engagement_rate"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isConnected: boolean("is_connected").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content categories for influencers
export const contentCategories = pgTable("content_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar("category").notNull(), // 'fashion', 'beauty', 'tech', 'fitness', etc.
  isAutoDetected: boolean("is_auto_detected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance milestones for tracking achievements
export const performanceMilestones = pgTable("performance_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  milestoneType: varchar("milestone_type").notNull(), // 'followers', 'engagement', 'views', 'collaborations'
  threshold: integer("threshold").notNull(), // The numeric threshold achieved
  platform: varchar("platform"), // Optional platform-specific milestone
  achievedAt: timestamp("achieved_at").notNull().defaultNow(),
  isViewed: boolean("is_viewed").default(false), // Track if user has seen the celebration
  isCelebrated: boolean("is_celebrated").default(false), // Track if milestone was celebrated
  celebrationShown: boolean("celebration_shown").default(false), // Track if celebration modal was shown
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio content samples from social media
export const portfolioContent = pgTable("portfolio_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  description: text("description"),
  url: varchar("url").notNull(), // Link to the original content
  thumbnailUrl: varchar("thumbnail_url"),
  platform: varchar("platform").notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  publishedAt: timestamp("published_at"),
  engagementRate: numeric("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  isTopPerformer: boolean("is_top_performer").default(false),
  categories: text("categories").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audience demographics data
export const audienceDemographics = pgTable("audience_demographics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  socialAccountId: varchar("social_account_id").notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  platform: varchar("platform").notNull(),
  ageGroup: varchar("age_group"), // '18-24', '25-34', '35-44', '45-54', '55+'
  agePercentage: integer("age_percentage"),
  gender: varchar("gender"), // 'male', 'female', 'other'
  genderPercentage: integer("gender_percentage"),
  topCountry: varchar("top_country"),
  countryPercentage: integer("country_percentage"),
  topCity: varchar("top_city"),
  cityPercentage: integer("city_percentage"),
  primaryLanguage: varchar("primary_language"),
  languagePercentage: integer("language_percentage"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance metrics over time
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  socialAccountId: varchar("social_account_id").notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  platform: varchar("platform").notNull(),
  date: timestamp("date").notNull(),
  followerCount: integer("follower_count"),
  engagementRate: varchar("engagement_rate"),
  reach: integer("reach"),
  impressions: integer("impressions"),
  profileViews: integer("profile_views"),
  websiteClicks: integer("website_clicks"),
  postsPublished: integer("posts_published"),
  avgLikes: integer("avg_likes"),
  avgComments: integer("avg_comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content trend predictions and insights
export const trendPredictions = pgTable("trend_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar("platform").notNull(),
  trendType: varchar("trend_type").notNull(), // 'hashtag', 'topic', 'content_type', 'posting_time'
  keyword: varchar("keyword"), // hashtag or topic keyword
  currentVolume: integer("current_volume"), // current search/usage volume
  predictedVolume: integer("predicted_volume"), // predicted volume in next period
  growthRate: numeric("growth_rate", { precision: 5, scale: 2 }), // percentage growth rate
  trendScore: integer("trend_score"), // 0-100 trend strength score
  confidence: numeric("confidence", { precision: 3, scale: 2 }), // 0-1 prediction confidence
  timeframe: varchar("timeframe"), // 'daily', 'weekly', 'monthly'
  peakPrediction: timestamp("peak_prediction"), // when trend is expected to peak
  recommendedAction: text("recommended_action"), // suggested action for influencer
  contentSuggestions: text("content_suggestions").array().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trend analytics and historical data
export const trendAnalytics = pgTable("trend_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar("platform").notNull(),
  analysisDate: timestamp("analysis_date").notNull().defaultNow(),
  topHashtags: text("top_hashtags").array().default([]),
  emergingTopics: text("emerging_topics").array().default([]),
  optimalPostTimes: text("optimal_post_times").array().default([]),
  contentTypePerformance: text("content_type_performance").array().default([]),
  audienceGrowthTrends: text("audience_growth_trends").array().default([]),
  engagementTrends: text("engagement_trends").array().default([]),
  competitorInsights: text("competitor_insights").array().default([]),
  seasonalPatterns: text("seasonal_patterns").array().default([]),
  predictedViral: text("predicted_viral").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Brand testimonials table for storing feedback from brand partners
export const brandTestimonials = pgTable("brand_testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  brandName: varchar("brand_name").notNull(),
  brandManagerName: varchar("brand_manager_name").notNull(),
  brandManagerTitle: varchar("brand_manager_title"),
  testimonialText: text("testimonial_text").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull(), // 0.0 to 5.0
  campaignRoi: varchar("campaign_roi"), // e.g., "+340%"
  conversionRate: varchar("conversion_rate"), // e.g., "12.8%"
  brandAwareness: varchar("brand_awareness"), // e.g., "+285%"
  salesImpact: varchar("sales_impact"), // e.g., "+420%"
  campaignType: varchar("campaign_type"), // e.g., "Campaign ROI", "Conversion Rate"
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Brand collaborations table for storing partnership details
export const brandCollaborations = pgTable("brand_collaborations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  brandName: varchar("brand_name").notNull(),
  brandLogo: varchar("brand_logo"), // URL to brand logo
  campaignName: varchar("campaign_name").notNull(),
  campaignType: varchar("campaign_type"), // e.g., "Skincare Campaign", "Fashion Campaign"
  status: varchar("status").notNull(), // 'completed', 'ongoing', 'upcoming'
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  posts: integer("posts").default(0),
  stories: integer("stories").default(0),
  reels: integer("reels").default(0),
  totalReach: integer("total_reach"),
  totalEngagement: integer("total_engagement"),
  compensationType: varchar("compensation_type"), // 'paid', 'product', 'commission', 'hybrid'
  compensationAmount: varchar("compensation_amount"),
  contractUrl: varchar("contract_url"),
  performanceNotes: text("performance_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media connection achievements and badges
export const connectionAchievements = pgTable("connection_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementType: varchar("achievement_type").notNull(), // 'first_connection', 'multi_platform', 'streak', 'verification'
  platform: varchar("platform"), // Optional platform-specific achievement
  level: integer("level").default(1), // Achievement level (Bronze=1, Silver=2, Gold=3, Diamond=4)
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  badgeIcon: varchar("badge_icon"), // Icon identifier
  badgeColor: varchar("badge_color"), // Color theme
  pointsEarned: integer("points_earned").default(0),
  isUnlocked: boolean("is_unlocked").default(true),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  isViewed: boolean("is_viewed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social media connection streaks and activity tracking
export const connectionActivity = pgTable("connection_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: varchar("activity_type").notNull(), // 'connection', 'data_import', 'profile_update', 'verification'
  platform: varchar("platform"), // Which platform was involved
  activityDate: timestamp("activity_date").notNull().defaultNow(),
  pointsEarned: integer("points_earned").default(0),
  streakDay: integer("streak_day").default(1), // Current day in streak
  metadata: jsonb("metadata"), // Additional activity data
  createdAt: timestamp("created_at").defaultNow(),
});

// User gamification profile for tracking overall progress
export const gamificationProfile = pgTable("gamification_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalPoints: integer("total_points").default(0),
  currentLevel: integer("current_level").default(1),
  connectionStreak: integer("connection_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  platformsConnected: integer("platforms_connected").default(0),
  verifiedPlatforms: integer("verified_platforms").default(0),
  totalConnections: integer("total_connections").default(0),
  achievementCount: integer("achievement_count").default(0),
  rank: varchar("rank").default('Newcomer'), // 'Newcomer', 'Rising', 'Established', 'Elite', 'Legendary'
  nextLevelPoints: integer("next_level_points").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily/weekly challenges table
export const dailyChallenges = pgTable("daily_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeType: varchar("challenge_type").notNull(), // 'daily', 'weekly', 'special'
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // 'connection', 'engagement', 'profile', 'streak'
  targetValue: integer("target_value").notNull(), // What needs to be achieved
  currentProgress: integer("current_progress").default(0),
  pointsReward: integer("points_reward").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  icon: varchar("icon").default('target'),
  color: varchar("color").default('blue'),
  createdAt: timestamp("created_at").defaultNow(),
});

// User challenge participation tracking
export const userChallengeProgress = pgTable("user_challenge_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: varchar("challenge_id").notNull().references(() => dailyChallenges.id, { onDelete: 'cascade' }),
  startedAt: timestamp("started_at").defaultNow(),
  progress: integer("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  pointsEarned: integer("points_earned").default(0),
  metadata: jsonb("metadata"), // Additional progress tracking data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial transactions table for comprehensive payment tracking
export const financialTransactions = pgTable("financial_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").unique().notNull(), // Unique transaction identifier (e.g., TXN-2025-001)
  campaignId: varchar("campaign_id").references(() => brandCampaigns.id, { onDelete: 'set null' }),
  proposalId: varchar("proposal_id").references(() => campaignProposals.id, { onDelete: 'set null' }),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Transaction type and status
  transactionType: varchar("transaction_type").notNull(), // 'upfront_payment', 'completion_payment', 'bonus_payment', 'refund', 'chargeback'
  status: varchar("status").notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed'
  
  // Payment amounts breakdown
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(), // Total payment before fees
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }).default('0.00'), // Platform commission (5-10%)
  processingFee: numeric("processing_fee", { precision: 10, scale: 2 }).default('0.00'), // Payment processor fee
  taxes: numeric("taxes", { precision: 10, scale: 2 }).default('0.00'), // Applicable taxes
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(), // Final amount to influencer
  
  // Payment method and processor details
  paymentMethod: varchar("payment_method").notNull(), // 'stripe', 'paypal', 'bank_transfer', 'razorpay', 'wise'
  processorTransactionId: varchar("processor_transaction_id"), // External payment processor reference
  processorReferenceNumber: varchar("processor_reference_number"), // Additional processor reference
  paymentMethodDetails: jsonb("payment_method_details"), // Card last 4 digits, bank name, etc.
  
  // Currency and international handling
  currency: varchar("currency").notNull().default('INR'), // ISO 4217 currency code
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 6 }), // If currency conversion applied
  originalCurrency: varchar("original_currency"), // Original currency before conversion
  originalAmount: numeric("original_amount", { precision: 10, scale: 2 }), // Amount in original currency
  
  // Timestamps with timezone support
  initiatedAt: timestamp("initiated_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  
  // Additional transaction metadata
  description: text("description"), // Human-readable transaction description
  internalNotes: text("internal_notes"), // Internal platform notes for audit
  failureReason: text("failure_reason"), // Reason for failed transactions
  disputeReason: text("dispute_reason"), // Dispute details if applicable
  metadata: jsonb("metadata"), // Additional flexible data storage
  
  // Audit and compliance fields
  ipAddress: varchar("ip_address"), // IP address when transaction initiated
  userAgent: text("user_agent"), // Browser/device info for audit trail
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Transaction audit log for complete financial trail
export const transactionAuditLog = pgTable("transaction_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => financialTransactions.transactionId, { onDelete: 'cascade' }),
  
  // Audit event details - Enhanced with comprehensive event types
  eventType: varchar("event_type").notNull(), // 'created', 'status_changed', 'amount_updated', 'refunded', 'disputed', 'fee_calculated', 'auto_processed', 'manual_override', 'failed_attempt'
  previousStatus: varchar("previous_status"), // Status before the change
  newStatus: varchar("new_status"), // Status after the change
  changedBy: varchar("changed_by").references(() => users.id), // User who made the change
  changeReason: text("change_reason"), // Reason for the change
  
  // Enhanced event metadata
  eventData: jsonb("event_data"), // Detailed event information
  systemGenerated: boolean("system_generated").default(false), // True for automated changes
  adminAction: boolean("admin_action").default(false), // True for admin overrides/manual adjustments
  failureDetails: jsonb("failure_details"), // Detailed failure information for failed attempts
  
  // Network and security context
  ipAddress: varchar("ip_address"), // IP address when event occurred
  userAgent: text("user_agent"), // Browser/device info for audit trail
  
  // Timestamp with timezone
  eventTimestamp: timestamp("event_timestamp", { withTimezone: true }).notNull().defaultNow(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Comprehensive financial activity log for all money-related actions
export const financialActivityLog = pgTable("financial_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Activity classification
  activityType: varchar("activity_type").notNull(), // 'user_action', 'system_action', 'admin_action', 'transaction', 'approval', 'dispute'
  actionCategory: varchar("action_category").notNull(), // 'payment', 'refund', 'adjustment', 'fee_calculation', 'proposal_approval', 'dispute_resolution', 'manual_override'
  
  // Related entities
  userId: varchar("user_id").references(() => users.id), // User who performed/triggered the action
  transactionId: varchar("transaction_id").references(() => financialTransactions.transactionId), // Related transaction if any
  campaignId: varchar("campaign_id").references(() => brandCampaigns.id), // Related campaign if any
  proposalId: varchar("proposal_id").references(() => campaignProposals.id), // Related proposal if any
  
  // Action details
  action: varchar("action").notNull(), // Specific action taken
  description: text("description").notNull(), // Human-readable description of the action
  previousValue: text("previous_value"), // Previous value before change
  newValue: text("new_value"), // New value after change
  
  // Financial impact
  amountAffected: numeric("amount_affected", { precision: 10, scale: 2 }), // Amount involved in the action
  currency: varchar("currency").default('INR'), // Currency for the amount
  feeCalculation: jsonb("fee_calculation"), // Details of any fee calculations
  
  // Action context
  status: varchar("status").notNull().default('completed'), // 'completed', 'failed', 'pending', 'cancelled'
  success: boolean("success").default(true), // Whether the action was successful
  errorCode: varchar("error_code"), // Error code if action failed
  errorMessage: text("error_message"), // Error message if action failed
  retryCount: integer("retry_count").default(0), // Number of retry attempts
  
  // System context
  systemGenerated: boolean("system_generated").default(false), // True for automated system actions
  adminAction: boolean("admin_action").default(false), // True for admin actions
  adminUserId: varchar("admin_user_id").references(() => users.id), // Admin user if admin action
  apiEndpoint: varchar("api_endpoint"), // API endpoint that triggered the action
  
  // Security and audit context
  ipAddress: varchar("ip_address"), // IP address when action occurred
  userAgent: text("user_agent"), // Browser/device info
  sessionId: varchar("session_id"), // Session ID for traceability
  correlationId: varchar("correlation_id"), // For tracking related actions
  
  // Additional metadata
  metadata: jsonb("metadata"), // Additional flexible data storage
  tags: text("tags").array().default([]), // Tags for categorization and filtering
  
  // Timestamps with timezone
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Financial dispute log for dispute tracking
export const financialDisputeLog = pgTable("financial_dispute_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Dispute details
  disputeId: varchar("dispute_id").unique().notNull(), // Unique dispute identifier
  transactionId: varchar("transaction_id").notNull().references(() => financialTransactions.transactionId),
  
  // Parties involved
  initiatedBy: varchar("initiated_by").notNull().references(() => users.id), // User who initiated dispute
  respondentId: varchar("respondent_id").notNull().references(() => users.id), // Other party in dispute
  adminAssigned: varchar("admin_assigned").references(() => users.id), // Admin handling the dispute
  
  // Dispute classification
  disputeType: varchar("dispute_type").notNull(), // 'payment_not_received', 'service_not_delivered', 'quality_issue', 'amount_discrepancy', 'unauthorized_charge'
  disputeCategory: varchar("dispute_category").notNull(), // 'billing', 'service', 'delivery', 'refund', 'chargeback'
  severity: varchar("severity").notNull().default('medium'), // 'low', 'medium', 'high', 'critical'
  status: varchar("status").notNull().default('open'), // 'open', 'investigating', 'resolved', 'closed', 'escalated'
  
  // Dispute content
  title: varchar("title").notNull(), // Brief dispute title
  description: text("description").notNull(), // Detailed dispute description
  evidence: jsonb("evidence"), // Evidence provided (files, screenshots, etc.)
  timeline: jsonb("timeline"), // Timeline of events related to dispute
  
  // Financial details
  disputedAmount: numeric("disputed_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('INR'),
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }), // Amount refunded if resolved
  adjustmentAmount: numeric("adjustment_amount", { precision: 10, scale: 2 }), // Any adjustment made
  
  // Resolution details
  resolution: text("resolution"), // How the dispute was resolved
  resolutionNotes: text("resolution_notes"), // Internal notes about resolution
  resolvedBy: varchar("resolved_by").references(() => users.id), // Who resolved the dispute
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  
  // Communication log
  communications: jsonb("communications").default([]), // Log of all communications
  lastActivity: timestamp("last_activity", { withTimezone: true }).defaultNow(),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Payment summaries and reporting aggregates
export const paymentSummaries = pgTable("payment_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userType: varchar("user_type").notNull(), // 'brand' or 'influencer'
  
  // Time period for summary
  periodType: varchar("period_type").notNull(), // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  
  // Financial summary data
  totalTransactions: integer("total_transactions").default(0),
  totalGrossAmount: numeric("total_gross_amount", { precision: 10, scale: 2 }).default('0.00'),
  totalNetAmount: numeric("total_net_amount", { precision: 10, scale: 2 }).default('0.00'),
  totalFees: numeric("total_fees", { precision: 10, scale: 2 }).default('0.00'),
  totalRefunds: numeric("total_refunds", { precision: 10, scale: 2 }).default('0.00'),
  
  // Transaction breakdown by type
  upfrontPayments: numeric("upfront_payments", { precision: 10, scale: 2 }).default('0.00'),
  completionPayments: numeric("completion_payments", { precision: 10, scale: 2 }).default('0.00'),
  bonusPayments: numeric("bonus_payments", { precision: 10, scale: 2 }).default('0.00'),
  
  // Campaign-related metrics
  activeCampaigns: integer("active_campaigns").default(0),
  completedCampaigns: integer("completed_campaigns").default(0),
  avgTransactionAmount: numeric("avg_transaction_amount", { precision: 10, scale: 2 }).default('0.00'),
  
  // Performance indicators
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default('0.00'), // Percentage of successful transactions
  avgProcessingTime: integer("avg_processing_time").default(0), // Average processing time in seconds
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Invoices table for automated invoice generation
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(), // Human-readable invoice number (e.g., "INV-2025-001")
  
  // Campaign and user references
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  proposalId: varchar("proposal_id").references(() => campaignProposals.id, { onDelete: 'set null' }),
  
  // Invoice status and type
  status: varchar("status").notNull().default('draft'), // 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  invoiceType: varchar("invoice_type").notNull().default('campaign'), // 'campaign', 'milestone', 'bonus', 'refund'
  
  // Financial details
  subtotalAmount: numeric("subtotal_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default('0.00'),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('INR'),
  
  // Tax information
  taxRegion: varchar("tax_region"), // 'US', 'EU', 'UK', 'CA', etc.
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default('0.0000'), // Tax rate as decimal (e.g., 0.0825 for 8.25%)
  taxType: varchar("tax_type"), // 'VAT', 'GST', 'Sales Tax', 'None'
  taxRegistrationNumber: varchar("tax_registration_number"), // Business tax ID
  
  // Payment details
  paymentTerms: varchar("payment_terms").notNull().default('net_30'), // 'immediate', 'net_15', 'net_30', 'net_60'
  paymentDueDate: timestamp("payment_due_date", { withTimezone: true }),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default('0.00'),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paymentMethod: varchar("payment_method"), // 'razorpay', 'stripe', 'bank_transfer', 'check'
  
  // Invoice dates
  issueDate: timestamp("issue_date", { withTimezone: true }).defaultNow(),
  sentDate: timestamp("sent_date", { withTimezone: true }),
  
  // Document information
  pdfPath: varchar("pdf_path"), // Path to generated PDF file
  pdfGenerated: boolean("pdf_generated").default(false),
  pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }),
  
  // Invoice notes and terms
  notes: text("notes"), // Internal notes
  termsAndConditions: text("terms_and_conditions"), // Invoice terms
  footerText: text("footer_text"), // Additional footer information
  
  // Billing addresses (stored as JSON for flexibility)
  brandBillingAddress: jsonb("brand_billing_address"), // Brand's billing address
  influencerBillingAddress: jsonb("influencer_billing_address"), // Influencer's billing address
  
  // System tracking
  generatedAutomatically: boolean("generated_automatically").default(true),
  generatedBy: varchar("generated_by").references(() => users.id), // User who manually generated (if not automatic)
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Invoice items table for detailed line items
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  
  // Item details
  itemType: varchar("item_type").notNull(), // 'deliverable', 'milestone', 'bonus', 'fee', 'discount', 'tax'
  description: text("description").notNull(), // Description of the item
  deliverableId: varchar("deliverable_id"), // Reference to specific deliverable if applicable
  
  // Quantity and pricing
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  
  // Tax information for this item
  taxable: boolean("taxable").default(true),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default('0.0000'),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default('0.00'),
  
  // Item metadata
  metadata: jsonb("metadata"), // Additional item data (platform metrics, performance data, etc.)
  sortOrder: integer("sort_order").default(0), // For ordering items on invoice
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Tax calculations table for complex tax scenarios
export const invoiceTaxCalculations = pgTable("invoice_tax_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  
  // Tax jurisdiction details
  taxJurisdiction: varchar("tax_jurisdiction").notNull(), // 'federal', 'state', 'provincial', 'municipal', 'vat'
  taxRegion: varchar("tax_region").notNull(), // Country/state/province code
  taxName: varchar("tax_name").notNull(), // Display name (e.g., "California Sales Tax", "UK VAT")
  
  // Tax calculation
  taxableAmount: numeric("taxable_amount", { precision: 10, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Tax configuration
  taxType: varchar("tax_type").notNull(), // 'vat', 'gst', 'sales_tax', 'income_tax', 'service_tax'
  compoundTax: boolean("compound_tax").default(false), // Whether this tax compounds on other taxes
  taxRegistrationRequired: boolean("tax_registration_required").default(false),
  
  // Exemptions and special cases
  exemptionReason: varchar("exemption_reason"), // If tax is exempted
  exemptionCertificate: varchar("exemption_certificate"), // Reference to exemption document
  reverseCharge: boolean("reverse_charge").default(false), // For VAT reverse charge scenarios
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Payment milestones table for milestone-based payment schedules
export const paymentMilestones = pgTable("payment_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  
  // Milestone details
  milestoneNumber: integer("milestone_number").notNull(), // 1, 2, 3, etc.
  description: text("description").notNull(), // 'Upfront Payment', 'Content Delivery', 'Campaign Completion'
  milestoneType: varchar("milestone_type").notNull(), // 'upfront', 'content_delivery', 'completion', 'performance_bonus'
  
  // Payment amounts
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }), // Percentage of total invoice (e.g., 50.00 for 50%)
  
  // Status and dates
  status: varchar("status").notNull().default('pending'), // 'pending', 'ready', 'paid', 'overdue', 'cancelled'
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidDate: timestamp("paid_date", { withTimezone: true }),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default('0.00'),
  
  // Conditions for payment
  triggerCondition: varchar("trigger_condition"), // 'campaign_approval', 'content_submission', 'performance_target_met'
  conditionMet: boolean("condition_met").default(false),
  conditionMetDate: timestamp("condition_met_date", { withTimezone: true }),
  
  // Payment processing
  paymentMethod: varchar("payment_method"), // 'razorpay', 'stripe', 'bank_transfer'
  paymentTransactionId: varchar("payment_transaction_id"), // Reference to payment processor
  paymentReference: varchar("payment_reference"), // Internal payment reference
  
  // Notes and requirements
  requirements: text("requirements"), // What needs to be completed for this milestone
  notes: text("notes"), // Additional notes about this milestone
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Financial statements for monthly/quarterly reporting
export const financialStatements = pgTable("financial_statements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userType: varchar("user_type").notNull(), // 'brand', 'influencer', 'platform'
  
  // Statement period
  statementType: varchar("statement_type").notNull(), // 'monthly', 'quarterly', 'yearly', 'custom'
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  statementDate: timestamp("statement_date", { withTimezone: true }).defaultNow(),
  
  // Income Statement (GAAP-compliant structure)
  // Revenue Section
  grossRevenue: numeric("gross_revenue", { precision: 10, scale: 2 }).default('0.00'),
  revenueDeductions: numeric("revenue_deductions", { precision: 10, scale: 2 }).default('0.00'),
  netRevenue: numeric("net_revenue", { precision: 10, scale: 2 }).default('0.00'),
  
  // Cost of Goods/Services Sold
  costOfServices: numeric("cost_of_services", { precision: 10, scale: 2 }).default('0.00'),
  grossProfit: numeric("gross_profit", { precision: 10, scale: 2 }).default('0.00'),
  
  // Operating Expenses
  operatingExpenses: numeric("operating_expenses", { precision: 10, scale: 2 }).default('0.00'),
  platformFees: numeric("platform_fees", { precision: 10, scale: 2 }).default('0.00'),
  marketingExpenses: numeric("marketing_expenses", { precision: 10, scale: 2 }).default('0.00'),
  administrativeExpenses: numeric("administrative_expenses", { precision: 10, scale: 2 }).default('0.00'),
  
  // Operating Income (EBIT)
  operatingIncome: numeric("operating_income", { precision: 10, scale: 2 }).default('0.00'),
  
  // Other Income/Expenses
  interestIncome: numeric("interest_income", { precision: 10, scale: 2 }).default('0.00'),
  interestExpense: numeric("interest_expense", { precision: 10, scale: 2 }).default('0.00'),
  otherIncome: numeric("other_income", { precision: 10, scale: 2 }).default('0.00'),
  
  // Pre-tax and Net Income
  incomeBeforeTax: numeric("income_before_tax", { precision: 10, scale: 2 }).default('0.00'),
  taxExpense: numeric("tax_expense", { precision: 10, scale: 2 }).default('0.00'),
  netIncome: numeric("net_income", { precision: 10, scale: 2 }).default('0.00'),
  
  // Balance Sheet Data
  // Current Assets
  cashAndEquivalents: numeric("cash_and_equivalents", { precision: 10, scale: 2 }).default('0.00'),
  accountsReceivable: numeric("accounts_receivable", { precision: 10, scale: 2 }).default('0.00'),
  prepaidExpenses: numeric("prepaid_expenses", { precision: 10, scale: 2 }).default('0.00'),
  currentAssets: numeric("current_assets", { precision: 10, scale: 2 }).default('0.00'),
  
  // Non-current Assets
  fixedAssets: numeric("fixed_assets", { precision: 10, scale: 2 }).default('0.00'),
  intangibleAssets: numeric("intangible_assets", { precision: 10, scale: 2 }).default('0.00'),
  totalAssets: numeric("total_assets", { precision: 10, scale: 2 }).default('0.00'),
  
  // Current Liabilities
  accountsPayable: numeric("accounts_payable", { precision: 10, scale: 2 }).default('0.00'),
  accruedExpenses: numeric("accrued_expenses", { precision: 10, scale: 2 }).default('0.00'),
  currentLiabilities: numeric("current_liabilities", { precision: 10, scale: 2 }).default('0.00'),
  
  // Non-current Liabilities
  longTermDebt: numeric("long_term_debt", { precision: 10, scale: 2 }).default('0.00'),
  totalLiabilities: numeric("total_liabilities", { precision: 10, scale: 2 }).default('0.00'),
  
  // Equity
  retainedEarnings: numeric("retained_earnings", { precision: 10, scale: 2 }).default('0.00'),
  totalEquity: numeric("total_equity", { precision: 10, scale: 2 }).default('0.00'),
  
  // Cash Flow Statement
  operatingCashFlow: numeric("operating_cash_flow", { precision: 10, scale: 2 }).default('0.00'),
  investingCashFlow: numeric("investing_cash_flow", { precision: 10, scale: 2 }).default('0.00'),
  financingCashFlow: numeric("financing_cash_flow", { precision: 10, scale: 2 }).default('0.00'),
  netCashFlow: numeric("net_cash_flow", { precision: 10, scale: 2 }).default('0.00'),
  
  // Financial Ratios (Industry Standard KPIs)
  grossProfitMargin: numeric("gross_profit_margin", { precision: 5, scale: 2 }).default('0.00'),
  operatingMargin: numeric("operating_margin", { precision: 5, scale: 2 }).default('0.00'),
  netProfitMargin: numeric("net_profit_margin", { precision: 5, scale: 2 }).default('0.00'),
  returnOnAssets: numeric("return_on_assets", { precision: 5, scale: 2 }).default('0.00'),
  returnOnEquity: numeric("return_on_equity", { precision: 5, scale: 2 }).default('0.00'),
  currentRatio: numeric("current_ratio", { precision: 5, scale: 2 }).default('0.00'),
  debtToEquityRatio: numeric("debt_to_equity_ratio", { precision: 5, scale: 2 }).default('0.00'),
  
  // Legacy fields for backward compatibility
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).default('0.00'),
  totalExpenses: numeric("total_expenses", { precision: 10, scale: 2 }).default('0.00'),
  taxesPaid: numeric("taxes_paid", { precision: 10, scale: 2 }).default('0.00'),
  
  // Transaction metrics
  totalTransactions: integer("total_transactions").default(0),
  successfulTransactions: integer("successful_transactions").default(0),
  failedTransactions: integer("failed_transactions").default(0),
  refundedTransactions: integer("refunded_transactions").default(0),
  
  // Campaign-specific metrics (for brands)
  activeCampaigns: integer("active_campaigns").default(0),
  completedCampaigns: integer("completed_campaigns").default(0),
  campaignROI: numeric("campaign_roi", { precision: 5, scale: 2 }).default('0.00'), // Return on Investment percentage
  avgCampaignCost: numeric("avg_campaign_cost", { precision: 10, scale: 2 }).default('0.00'),
  
  // Influencer-specific metrics
  collaborationsCompleted: integer("collaborations_completed").default(0),
  avgEarningsPerCampaign: numeric("avg_earnings_per_campaign", { precision: 10, scale: 2 }).default('0.00'),
  topPerformingCategories: text("top_performing_categories").array().default([]),
  
  // Status and metadata (Enhanced for compliance)
  status: varchar("status").notNull().default('draft'), // 'draft', 'final', 'sent', 'archived'
  currency: varchar("currency").notNull().default('INR'),
  accountingMethod: varchar("accounting_method").default('accrual'), // 'accrual', 'cash'
  reportingStandard: varchar("reporting_standard").default('GAAP'), // 'GAAP', 'IFRS'
  notes: text("notes"),
  auditorNotes: text("auditor_notes"),
  disclaimers: text("disclaimers"),
  generatedBy: varchar("generated_by"), // 'system', 'manual', 'admin'
  reviewedBy: varchar("reviewed_by"), // User ID of reviewer
  approvedBy: varchar("approved_by"), // User ID of approver
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Campaign P&L reports for detailed profit/loss analysis
export const campaignProfitLossReports = pgTable("campaign_profit_loss_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Report period
  reportPeriod: varchar("report_period").notNull(), // 'campaign_total', 'monthly', 'quarterly'
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  
  // Revenue breakdown
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).default('0.00'),
  directSales: numeric("direct_sales", { precision: 10, scale: 2 }).default('0.00'), // Sales attributed to campaign
  brandLift: numeric("brand_lift", { precision: 10, scale: 2 }).default('0.00'), // Brand awareness value
  
  // Cost breakdown
  totalCosts: numeric("total_costs", { precision: 10, scale: 2 }).default('0.00'),
  influencerPayments: numeric("influencer_payments", { precision: 10, scale: 2 }).default('0.00'),
  platformFees: numeric("platform_fees", { precision: 10, scale: 2 }).default('0.00'),
  productionCosts: numeric("production_costs", { precision: 10, scale: 2 }).default('0.00'), // Content creation costs
  advertisingSpend: numeric("advertising_spend", { precision: 10, scale: 2 }).default('0.00'), // Paid promotion costs
  
  // Performance metrics
  grossProfit: numeric("gross_profit", { precision: 10, scale: 2 }).default('0.00'),
  netProfit: numeric("net_profit", { precision: 10, scale: 2 }).default('0.00'),
  profitMargin: numeric("profit_margin", { precision: 5, scale: 2 }).default('0.00'), // Percentage
  roi: numeric("roi", { precision: 5, scale: 2 }).default('0.00'), // Return on Investment percentage
  
  // Campaign performance data
  totalReach: bigint("total_reach", { mode: 'number' }).default(0),
  totalEngagements: bigint("total_engagements", { mode: 'number' }).default(0),
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 4 }).default('0.0000'),
  costPerAcquisition: numeric("cost_per_acquisition", { precision: 10, scale: 2 }).default('0.00'),
  lifetimeValue: numeric("lifetime_value", { precision: 10, scale: 2 }).default('0.00'),
  
  // Breakdown by deliverable
  deliverableBreakdown: jsonb("deliverable_breakdown"), // Detailed cost/performance per deliverable
  influencerBreakdown: jsonb("influencer_breakdown"), // Performance per influencer
  
  // Report metadata
  status: varchar("status").notNull().default('draft'), // 'draft', 'final', 'archived'
  currency: varchar("currency").notNull().default('INR'),
  reportNotes: text("report_notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Platform revenue reports for admin-level analytics
export const platformRevenueReports = pgTable("platform_revenue_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Report period
  reportType: varchar("report_type").notNull(), // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  
  // Revenue streams
  totalPlatformRevenue: numeric("total_platform_revenue", { precision: 10, scale: 2 }).default('0.00'),
  transactionFees: numeric("transaction_fees", { precision: 10, scale: 2 }).default('0.00'),
  subscriptionRevenue: numeric("subscription_revenue", { precision: 10, scale: 2 }).default('0.00'),
  premiumFeatures: numeric("premium_features", { precision: 10, scale: 2 }).default('0.00'),
  advertisingRevenue: numeric("advertising_revenue", { precision: 10, scale: 2 }).default('0.00'),
  
  // Fee breakdown by percentage
  standardFeeRate: numeric("standard_fee_rate", { precision: 5, scale: 4 }).default('0.0500'), // 5% default
  premiumFeeRate: numeric("premium_fee_rate", { precision: 5, scale: 4 }).default('0.0300'), // 3% for premium users
  
  // Transaction volume
  totalTransactionVolume: numeric("total_transaction_volume", { precision: 12, scale: 2 }).default('0.00'),
  totalTransactions: integer("total_transactions").default(0),
  avgTransactionSize: numeric("avg_transaction_size", { precision: 10, scale: 2 }).default('0.00'),
  
  // User metrics
  activeBrands: integer("active_brands").default(0),
  activeInfluencers: integer("active_influencers").default(0),
  newSignups: integer("new_signups").default(0),
  churnedUsers: integer("churned_users").default(0),
  
  // Campaign metrics
  totalCampaigns: integer("total_campaigns").default(0),
  activeCampaigns: integer("active_campaigns").default(0),
  completedCampaigns: integer("completed_campaigns").default(0),
  avgCampaignValue: numeric("avg_campaign_value", { precision: 10, scale: 2 }).default('0.00'),
  
  // Geographic breakdown
  revenueByRegion: jsonb("revenue_by_region"), // Revenue breakdown by geographic region
  topMarkets: text("top_markets").array().default([]), // Top performing markets
  
  // Growth metrics
  revenueGrowthRate: numeric("revenue_growth_rate", { precision: 5, scale: 2 }).default('0.00'), // Month-over-month growth
  userGrowthRate: numeric("user_growth_rate", { precision: 5, scale: 2 }).default('0.00'),
  transactionGrowthRate: numeric("transaction_growth_rate", { precision: 5, scale: 2 }).default('0.00'),
  
  // Operational costs (for net profit calculation)
  operationalCosts: numeric("operational_costs", { precision: 10, scale: 2 }).default('0.00'),
  marketingCosts: numeric("marketing_costs", { precision: 10, scale: 2 }).default('0.00'),
  supportCosts: numeric("support_costs", { precision: 10, scale: 2 }).default('0.00'),
  
  // Report metadata
  status: varchar("status").notNull().default('draft'), // 'draft', 'final', 'published'
  currency: varchar("currency").notNull().default('INR'),
  generatedBy: varchar("generated_by").references(() => users.id), // Admin who generated the report
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Report templates for customizable financial reports
export const reportTemplates = pgTable("report_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template information
  templateName: varchar("template_name").notNull(),
  templateType: varchar("template_type").notNull(), // 'statement', 'pnl', 'platform', 'earnings', 'custom'
  description: text("description"),
  
  // Template configuration
  reportFrequency: varchar("report_frequency").notNull(), // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  autoGenerate: boolean("auto_generate").default(false), // Whether to auto-generate reports
  emailRecipients: text("email_recipients").array().default([]), // Email addresses to send reports to
  
  // Template structure
  includedMetrics: jsonb("included_metrics"), // Which metrics to include in the report
  customFields: jsonb("custom_fields"), // Additional custom fields
  chartConfigurations: jsonb("chart_configurations"), // Chart and visualization settings
  exportFormats: text("export_formats").array().default(['pdf']), // Available export formats
  
  // Access control
  isPublic: boolean("is_public").default(false), // Whether template is available to all users
  createdBy: varchar("created_by").notNull().references(() => users.id),
  userType: varchar("user_type").notNull(), // 'brand', 'influencer', 'admin'
  
  // Template metadata
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Campaign Q&A system for pre-application questions
export const campaignQA = pgTable("campaign_qa", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Question and answer content
  question: text("question").notNull(),
  answer: text("answer"),
  status: varchar("status").notNull().default('pending'), // 'pending', 'answered', 'dismissed'
  
  // Question categorization
  category: varchar("category"), // 'content_requirements', 'payment', 'timeline', 'deliverables', 'other'
  isPublic: boolean("is_public").default(false), // Whether answer should be visible to other influencers
  
  // Response tracking
  answeredAt: timestamp("answered_at"),
  answeredBy: varchar("answered_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign messaging system for approved collaborations
export const campaignMessages = pgTable("campaign_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  proposalId: varchar("proposal_id").references(() => campaignProposals.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Message content
  messageType: varchar("message_type").notNull().default('text'), // 'text', 'file', 'image', 'approval_request', 'revision_request'
  content: text("content").notNull(),
  attachments: text("attachments").array().default([]), // File URLs
  
  // Message context
  messageContext: varchar("message_context"), // 'general', 'content_submission', 'revision', 'payment', 'milestone'
  relatedContentId: varchar("related_content_id"), // Reference to specific content being discussed
  
  // Message status
  status: varchar("status").notNull().default('sent'), // 'sent', 'delivered', 'read', 'edited', 'deleted'
  readAt: timestamp("read_at"),
  editedAt: timestamp("edited_at"),
  
  // Threading
  threadId: varchar("thread_id"), // For grouping related messages
  replyToId: varchar("reply_to_id"), // For message threading
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time campaign performance tracking
export const campaignPerformanceMetrics = pgTable("campaign_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  proposalId: varchar("proposal_id").references(() => campaignProposals.id, { onDelete: 'cascade' }),
  contentId: varchar("content_id").references(() => campaignContent.id, { onDelete: 'cascade' }),
  
  // Performance data
  platform: varchar("platform").notNull(), // 'instagram', 'tiktok', 'youtube', 'facebook'
  contentType: varchar("content_type").notNull(), // 'post', 'story', 'reel', 'video'
  
  // Engagement metrics
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  saves: integer("saves").default(0),
  clicks: integer("clicks").default(0),
  
  // Reach metrics
  reach: integer("reach").default(0),
  impressions: integer("impressions").default(0),
  uniqueViews: integer("unique_views").default(0),
  
  // Conversion metrics
  websiteVisits: integer("website_visits").default(0),
  conversions: integer("conversions").default(0),
  revenue: numeric("revenue", { precision: 10, scale: 2 }).default('0.00'),
  
  // Calculated metrics
  engagementRate: numeric("engagement_rate", { precision: 5, scale: 2 }).default('0.00'),
  clickThroughRate: numeric("click_through_rate", { precision: 5, scale: 2 }).default('0.00'),
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }).default('0.00'),
  costPerEngagement: numeric("cost_per_engagement", { precision: 8, scale: 2 }).default('0.00'),
  returnOnAdSpend: numeric("return_on_ad_spend", { precision: 8, scale: 2 }).default('0.00'),
  
  // Time tracking
  lastUpdated: timestamp("last_updated").defaultNow(),
  dataSource: varchar("data_source"), // 'manual', 'api', 'imported'
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations table for organizing message threads
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  campaignId: varchar("campaign_id").references(() => brandCampaigns.id, { onDelete: 'set null' }), // Optional campaign context
  subject: varchar("subject"), // Conversation subject/title
  status: varchar("status").notNull().default('active'), // 'active', 'archived', 'resolved'
  priority: varchar("priority").notNull().default('normal'), // 'low', 'normal', 'high', 'urgent'
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  brandLastReadAt: timestamp("brand_last_read_at"),
  influencerLastReadAt: timestamp("influencer_last_read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table for storing individual messages
export const messages: any = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  messageType: varchar("message_type").notNull().default('text'), // 'text', 'image', 'file', 'system', 'template'
  content: text("content").notNull(),
  attachments: text("attachments").array().default([]), // Array of file URLs
  metadata: jsonb("metadata"), // Additional message data (file sizes, types, etc.)
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  replyToId: varchar("reply_to_id").references((): any => messages.id), // For threaded replies
  deliveryStatus: varchar("delivery_status").notNull().default('sent'), // 'sent', 'delivered', 'read', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message templates for quick responses
export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(), // 'greeting', 'proposal', 'follow_up', 'negotiation', 'completion'
  isDefault: boolean("is_default").default(false), // System default templates
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication activity log for tracking interactions
export const communicationActivity = pgTable("communication_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  activityType: varchar("activity_type").notNull(), // 'message_sent', 'file_shared', 'status_changed', 'priority_changed'
  activityData: jsonb("activity_data"), // Additional activity context
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversation participants for group conversations (future feature)
export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role").notNull().default('participant'), // 'admin', 'moderator', 'participant'
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentCategorySchema = createInsertSchema(contentCategories).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioContentSchema = createInsertSchema(portfolioContent).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceMilestoneSchema = createInsertSchema(performanceMilestones).omit({
  id: true,
  achievedAt: true,
  createdAt: true,
});

export const insertAudienceDemographicsSchema = createInsertSchema(audienceDemographics).omit({
  id: true,
  updatedAt: true,
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertTrendPredictionSchema = createInsertSchema(trendPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrendAnalyticsSchema = createInsertSchema(trendAnalytics).omit({
  id: true,
  analysisDate: true,
  createdAt: true,
});

export const insertBrandTestimonialSchema = createInsertSchema(brandTestimonials).omit({
  id: true,
  createdAt: true,
});

export const insertBrandCollaborationSchema = createInsertSchema(brandCollaborations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Payment settings for brands
export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  razorpayKeyId: varchar("razorpay_key_id"),
  razorpayKeySecret: varchar("razorpay_key_secret"),
  defaultCurrency: varchar("default_currency").default('INR'),
  autoPaymentEnabled: boolean("auto_payment_enabled").default(false),
  paymentTerms: integer("payment_terms").default(7), // Days after campaign completion
  businessName: varchar("business_name"),
  gstNumber: varchar("gst_number"),
  panNumber: varchar("pan_number"),
  bankAccountNumber: varchar("bank_account_number"),
  bankIfscCode: varchar("bank_ifsc_code"),
  bankAccountName: varchar("bank_account_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign payments table
export const campaignPayments = pgTable("campaign_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => brandCampaigns.id, { onDelete: 'cascade' }),
  proposalId: varchar("proposal_id").notNull().references(() => campaignProposals.id, { onDelete: 'cascade' }),
  influencerId: varchar("influencer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  brandId: varchar("brand_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  paymentType: varchar("payment_type").notNull().default('upfront'), // 'upfront', 'completion', 'full', 'bonus'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default('INR'),
  status: varchar("status").notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  paymentMethod: varchar("payment_method").default('razorpay'),
  razorpayOrderId: varchar("razorpay_order_id"),
  razorpayPaymentId: varchar("razorpay_payment_id"),
  failureReason: text("failure_reason"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment transactions table for detailed tracking
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: varchar("payment_id").notNull().references(() => campaignPayments.id, { onDelete: 'cascade' }),
  transactionType: varchar("transaction_type").notNull(), // 'payment', 'refund', 'adjustment'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  razorpayTransactionId: varchar("razorpay_transaction_id"),
  gatewayResponse: jsonb("gateway_response"),
  status: varchar("status").notNull(), // 'success', 'failed', 'pending'
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignPaymentSchema = createInsertSchema(campaignPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandCampaignSchema = createInsertSchema(brandCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignProposalSchema = createInsertSchema(campaignProposals).omit({
  id: true,
  approvedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignContentSchema = createInsertSchema(campaignContent).omit({
  id: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Extended schemas for brand registration
export const brandRegistrationSchema = insertUserSchema.extend({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  companySize: z.string().optional(),
  targetAudienceAge: z.string().optional(),
  targetAudienceGender: z.string().optional(),
  targetAudienceLocation: z.string().optional(),
  budgetRange: z.string().optional(),
  campaignTypes: z.array(z.string()).optional(),
  businessRegistrationNumber: z.string().optional(),
  description: z.string().optional(),
});

// OTP verification table for email/phone verification
export const otpVerification = pgTable("otp_verification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  phone: varchar("phone"),
  otp: varchar("otp").notNull(),
  purpose: varchar("purpose").notNull(), // 'registration', 'login', 'password_reset'
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerification).omit({
  id: true,
  createdAt: true,
});

export const insertConnectionAchievementSchema = createInsertSchema(connectionAchievements).omit({
  id: true,
  unlockedAt: true,
  createdAt: true,
});

export const insertConnectionActivitySchema = createInsertSchema(connectionActivity).omit({
  id: true,
  activityDate: true,
  createdAt: true,
});

export const insertGamificationProfileSchema = createInsertSchema(gamificationProfile).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertUserChallengeProgressSchema = createInsertSchema(userChallengeProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Financial transaction types and schemas
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TransactionAuditLog = typeof transactionAuditLog.$inferSelect;
export type InsertTransactionAuditLog = z.infer<typeof insertTransactionAuditLogSchema>;
export const insertTransactionAuditLogSchema = createInsertSchema(transactionAuditLog).omit({
  id: true,
  createdAt: true,
});

export type PaymentSummary = typeof paymentSummaries.$inferSelect;
export type InsertPaymentSummary = z.infer<typeof insertPaymentSummarySchema>;
export const insertPaymentSummarySchema = createInsertSchema(paymentSummaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Invoice types and schemas
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InvoiceTaxCalculation = typeof invoiceTaxCalculations.$inferSelect;
export type InsertInvoiceTaxCalculation = z.infer<typeof insertInvoiceTaxCalculationSchema>;
export const insertInvoiceTaxCalculationSchema = createInsertSchema(invoiceTaxCalculations).omit({
  id: true,
  createdAt: true,
});

export type PaymentMilestone = typeof paymentMilestones.$inferSelect;
export type InsertPaymentMilestone = z.infer<typeof insertPaymentMilestoneSchema>;
export const insertPaymentMilestoneSchema = createInsertSchema(paymentMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Financial activity log types and schemas
export type FinancialActivityLog = typeof financialActivityLog.$inferSelect;
export type InsertFinancialActivityLog = z.infer<typeof insertFinancialActivityLogSchema>;
export const insertFinancialActivityLogSchema = createInsertSchema(financialActivityLog).omit({
  id: true,
  createdAt: true,
});

// Financial dispute log types and schemas
export type FinancialDisputeLog = typeof financialDisputeLog.$inferSelect;
export type InsertFinancialDisputeLog = z.infer<typeof insertFinancialDisputeLogSchema>;
export const insertFinancialDisputeLogSchema = createInsertSchema(financialDisputeLog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type ContentCategory = typeof contentCategories.$inferSelect;
export type InsertContentCategory = z.infer<typeof insertContentCategorySchema>;
export type PortfolioContent = typeof portfolioContent.$inferSelect;
export type InsertPortfolioContent = z.infer<typeof insertPortfolioContentSchema>;
export type PerformanceMilestone = typeof performanceMilestones.$inferSelect;
export type InsertPerformanceMilestone = z.infer<typeof insertPerformanceMilestoneSchema>;
export type AudienceDemographics = typeof audienceDemographics.$inferSelect;
export type InsertAudienceDemographics = z.infer<typeof insertAudienceDemographicsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type TrendPrediction = typeof trendPredictions.$inferSelect;
export type InsertTrendPrediction = z.infer<typeof insertTrendPredictionSchema>;
export type TrendAnalytics = typeof trendAnalytics.$inferSelect;
export type InsertTrendAnalytics = z.infer<typeof insertTrendAnalyticsSchema>;
export type BrandTestimonial = typeof brandTestimonials.$inferSelect;
export type InsertBrandTestimonial = z.infer<typeof insertBrandTestimonialSchema>;
export type BrandCollaboration = typeof brandCollaborations.$inferSelect;
export type InsertBrandCollaboration = z.infer<typeof insertBrandCollaborationSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type CampaignPayment = typeof campaignPayments.$inferSelect;
export type InsertCampaignPayment = z.infer<typeof insertCampaignPaymentSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type BrandCampaign = typeof brandCampaigns.$inferSelect;
export type InsertBrandCampaign = z.infer<typeof insertBrandCampaignSchema>;
export type CampaignProposal = typeof campaignProposals.$inferSelect;
export type InsertCampaignProposal = z.infer<typeof insertCampaignProposalSchema>;
export type CampaignContent = typeof campaignContent.$inferSelect;
export type InsertCampaignContent = z.infer<typeof insertCampaignContentSchema>;
export type BrandRegistration = z.infer<typeof brandRegistrationSchema>;
export type OtpVerification = typeof otpVerification.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type ConnectionAchievement = typeof connectionAchievements.$inferSelect;
export type InsertConnectionAchievement = z.infer<typeof insertConnectionAchievementSchema>;
export type ConnectionActivity = typeof connectionActivity.$inferSelect;
export type InsertConnectionActivity = z.infer<typeof insertConnectionActivitySchema>;
export type GamificationProfile = typeof gamificationProfile.$inferSelect;
export type InsertGamificationProfile = z.infer<typeof insertGamificationProfileSchema>;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type UserChallengeProgress = typeof userChallengeProgress.$inferSelect;
export type InsertUserChallengeProgress = z.infer<typeof insertUserChallengeProgressSchema>;

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationActivitySchema = createInsertSchema(communicationActivity).omit({
  id: true,
  createdAt: true,
});

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  joinedAt: true,
});

// Communication system types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type CommunicationActivity = typeof communicationActivity.$inferSelect;
export type InsertCommunicationActivity = z.infer<typeof insertCommunicationActivitySchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;

// Campaign enhancement insert schemas
export const insertCampaignQASchema = createInsertSchema(campaignQA).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignMessageSchema = createInsertSchema(campaignMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignPerformanceMetricsSchema = createInsertSchema(campaignPerformanceMetrics).omit({
  id: true,
  createdAt: true,
});

// Campaign enhancement types
export type CampaignQA = typeof campaignQA.$inferSelect;
export type InsertCampaignQA = z.infer<typeof insertCampaignQASchema>;
export type CampaignMessage = typeof campaignMessages.$inferSelect;
export type InsertCampaignMessage = z.infer<typeof insertCampaignMessageSchema>;
export type CampaignPerformanceMetrics = typeof campaignPerformanceMetrics.$inferSelect;
export type InsertCampaignPerformanceMetrics = z.infer<typeof insertCampaignPerformanceMetricsSchema>;

// Audit logging table for tracking sensitive operations
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  action: varchar("action").notNull(),
  resource: varchar("resource"), // e.g., 'content', 'campaign', 'user'
  resourceId: varchar("resource_id"), // ID of the affected resource
  details: jsonb("details"), // Additional context data
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull().default(false),
  errorMessage: text("error_message"),
  duration: integer("duration"), // Operation duration in milliseconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Financial reporting system Zod schemas
export const insertFinancialStatementSchema = createInsertSchema(financialStatements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignProfitLossReportSchema = createInsertSchema(campaignProfitLossReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformRevenueReportSchema = createInsertSchema(platformRevenueReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsed: true,
});

// Financial reporting system types
export type FinancialStatement = typeof financialStatements.$inferSelect;
export type InsertFinancialStatement = z.infer<typeof insertFinancialStatementSchema>;
export type CampaignProfitLossReport = typeof campaignProfitLossReports.$inferSelect;
export type InsertCampaignProfitLossReport = z.infer<typeof insertCampaignProfitLossReportSchema>;
export type PlatformRevenueReport = typeof platformRevenueReports.$inferSelect;
export type InsertPlatformRevenueReport = z.infer<typeof insertPlatformRevenueReportSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;

// Campaign lifecycle management schemas
export const insertCampaignMilestoneSchema = createInsertSchema(campaignMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProposalMilestoneSchema = createInsertSchema(proposalMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeTrackingSessionSchema = createInsertSchema(timeTrackingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignProgressStageSchema = createInsertSchema(campaignProgressStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignActivityLogSchema = createInsertSchema(campaignActivityLog).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignNotificationSchema = createInsertSchema(campaignNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignAutomationRuleSchema = createInsertSchema(campaignAutomationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Campaign lifecycle types
export type CampaignMilestone = typeof campaignMilestones.$inferSelect;
export type InsertCampaignMilestone = z.infer<typeof insertCampaignMilestoneSchema>;
export type ProposalMilestone = typeof proposalMilestones.$inferSelect;
export type InsertProposalMilestone = z.infer<typeof insertProposalMilestoneSchema>;
export type TimeTrackingSession = typeof timeTrackingSessions.$inferSelect;
export type InsertTimeTrackingSession = z.infer<typeof insertTimeTrackingSessionSchema>;
export type CampaignProgressStage = typeof campaignProgressStages.$inferSelect;
export type InsertCampaignProgressStage = z.infer<typeof insertCampaignProgressStageSchema>;
export type CampaignActivityLog = typeof campaignActivityLog.$inferSelect;
export type InsertCampaignActivityLog = z.infer<typeof insertCampaignActivityLogSchema>;
export type CampaignNotification = typeof campaignNotifications.$inferSelect;
export type InsertCampaignNotification = z.infer<typeof insertCampaignNotificationSchema>;
export type CampaignAutomationRule = typeof campaignAutomationRules.$inferSelect;
export type InsertCampaignAutomationRule = z.infer<typeof insertCampaignAutomationRuleSchema>;
