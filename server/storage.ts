import { nanoid } from 'nanoid';
import {
  users,
  socialAccounts,
  contentCategories,
  portfolioContent,
  performanceMilestones,
  trendPredictions,
  trendAnalytics,
  brandTestimonials,
  brandCollaborations,
  paymentSettings,
  campaignPayments,
  paymentTransactions,
  brands,
  brandCampaigns,
  campaignProposals,
  campaignContent,
  otpVerification,
  connectionAchievements,
  connectionActivity,
  gamificationProfile,
  dailyChallenges,
  userChallengeProgress,
  conversations,
  messages,
  messageTemplates,
  communicationActivity,
  auditLogs,
  financialTransactions,
  transactionAuditLog,
  paymentSummaries,
  financialActivityLog,
  financialDisputeLog,
  invoices,
  invoiceItems,
  invoiceTaxCalculations,
  paymentMilestones,
  financialStatements,
  campaignProfitLossReports,
  platformRevenueReports,
  reportTemplates,
  campaignMilestones,
  proposalMilestones,
  timeTrackingSessions,
  campaignProgressStages,
  campaignActivityLog,
  campaignNotifications,
  campaignAutomationRules,
  campaignInvitations,
  type User,
  type UpsertUser,
  type SocialAccount,
  type InsertSocialAccount,
  type ContentCategory,
  type InsertContentCategory,
  type PortfolioContent,
  type InsertPortfolioContent,
  type PerformanceMilestone,
  type InsertPerformanceMilestone,
  type TrendPrediction,
  type InsertTrendPrediction,
  type TrendAnalytics,
  type InsertTrendAnalytics,
  type BrandTestimonial,
  type InsertBrandTestimonial,
  type BrandCollaboration,
  type InsertBrandCollaboration,
  type PaymentSettings,
  type InsertPaymentSettings,
  type CampaignPayment,
  type InsertCampaignPayment,
  type PaymentTransaction,
  type InsertPaymentTransaction,
  type Brand,
  type InsertBrand,
  type BrandCampaign,
  type InsertBrandCampaign,
  type CampaignProposal,
  type InsertCampaignProposal,
  type CampaignContent,
  type InsertCampaignContent,
  type OtpVerification,
  type InsertOtpVerification,
  type ConnectionAchievement,
  type InsertConnectionAchievement,
  type ConnectionActivity,
  type InsertConnectionActivity,
  type GamificationProfile,
  type InsertGamificationProfile,
  type DailyChallenge,
  type InsertDailyChallenge,
  type UserChallengeProgress,
  type InsertUserChallengeProgress,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type MessageTemplate,
  type InsertMessageTemplate,
  type AuditLog,
  type InsertAuditLog,
  type FinancialTransaction,
  type InsertFinancialTransaction,
  type TransactionAuditLog,
  type InsertTransactionAuditLog,
  type PaymentSummary,
  type InsertPaymentSummary,
  type FinancialActivityLog,
  type InsertFinancialActivityLog,
  type FinancialDisputeLog,
  type InsertFinancialDisputeLog,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type InvoiceTaxCalculation,
  type InsertInvoiceTaxCalculation,
  type PaymentMilestone,
  type InsertPaymentMilestone,
  type FinancialStatement,
  type InsertFinancialStatement,
  type CampaignProfitLossReport,
  type InsertCampaignProfitLossReport,
  type PlatformRevenueReport,
  type InsertPlatformRevenueReport,
  type ReportTemplate,
  type InsertReportTemplate,
  type CampaignMilestone,
  type InsertCampaignMilestone,
  type ProposalMilestone,
  type InsertProposalMilestone,
  type TimeTrackingSession,
  type InsertTimeTrackingSession,
  type CampaignProgressStage,
  type InsertCampaignProgressStage,
  type CampaignActivityLog,
  type InsertCampaignActivityLog,
  type CampaignNotification,
  type InsertCampaignNotification,
  type CampaignAutomationRule,
  type InsertCampaignAutomationRule,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, or, gte, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Social account operations
  getSocialAccounts(userId: string): Promise<SocialAccount[]>;
  getSocialAccount(userId: string, platform: string): Promise<SocialAccount | undefined>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount>;
  disconnectSocialAccount(id: string): Promise<void>;
  
  // Content category operations
  getContentCategories(userId: string): Promise<ContentCategory[]>;
  getContentCategoryByName(userId: string, category: string): Promise<ContentCategory | undefined>;
  createContentCategory(category: InsertContentCategory): Promise<ContentCategory>;
  deleteContentCategories(userId: string): Promise<void>;
  
  // Portfolio content operations
  getPortfolioContent(userId: string, platform?: string): Promise<PortfolioContent[]>;
  getPortfolioContentByUrl(url: string): Promise<PortfolioContent | undefined>;
  createPortfolioContent(content: InsertPortfolioContent): Promise<PortfolioContent>;
  deletePortfolioContent(userId: string, platform?: string): Promise<void>;
  
  // Performance milestone operations
  getPerformanceMilestones(userId: string): Promise<PerformanceMilestone[]>;
  createPerformanceMilestone(milestone: InsertPerformanceMilestone): Promise<PerformanceMilestone>;
  updateMilestone(id: string, updates: Partial<PerformanceMilestone>): Promise<PerformanceMilestone>;
  checkAndCreateMilestones(userId: string): Promise<PerformanceMilestone[]>;
  
  // Trend prediction operations
  getTrendPredictions(userId: string, platform?: string): Promise<TrendPrediction[]>;
  createTrendPrediction(prediction: InsertTrendPrediction): Promise<TrendPrediction>;
  updateTrendPrediction(id: string, updates: Partial<TrendPrediction>): Promise<TrendPrediction>;
  deleteTrendPrediction(id: string): Promise<void>;
  
  // Trend analytics operations
  getTrendAnalytics(userId: string, platform?: string): Promise<TrendAnalytics[]>;
  createTrendAnalytics(analytics: InsertTrendAnalytics): Promise<TrendAnalytics>;
  getLatestTrendAnalytics(userId: string, platform?: string): Promise<TrendAnalytics | undefined>;
  
  // Influencer discovery
  getInfluencers(limit?: number): Promise<(User & { socialAccounts: SocialAccount[], categories: ContentCategory[] })[]>;
  getLocationBasedInfluencerRecommendations(criteria: {
    targetLocation?: string;
    platforms?: string[];
    campaignType?: string;
    minFollowers?: number;
    maxRecommendations?: number;
  }): Promise<(User & { socialAccounts: SocialAccount[], categories: ContentCategory[], matchScore: number })[]>;
  
  // Brand testimonial operations
  getBrandTestimonials(userId: string): Promise<BrandTestimonial[]>;
  createBrandTestimonial(testimonial: InsertBrandTestimonial): Promise<BrandTestimonial>;
  updateBrandTestimonial(id: string, updates: Partial<BrandTestimonial>): Promise<BrandTestimonial>;
  deleteBrandTestimonial(id: string): Promise<void>;
  
  // Brand collaboration operations
  getBrandCollaborations(userId: string, status?: string): Promise<BrandCollaboration[]>;
  createBrandCollaboration(collaboration: InsertBrandCollaboration): Promise<BrandCollaboration>;
  updateBrandCollaboration(id: string, updates: Partial<BrandCollaboration>): Promise<BrandCollaboration>;
  deleteBrandCollaboration(id: string): Promise<void>;
  
  // Brand profile operations
  getBrandProfile(userId: string): Promise<Brand | undefined>;
  createBrandProfile(profile: InsertBrand): Promise<Brand>;
  updateBrandProfile(userId: string, updates: Partial<Brand>): Promise<Brand>;
  
  // Brand campaign operations
  getBrandCampaigns(brandId: string): Promise<BrandCampaign[]>;
  getBrandCampaign(id: string): Promise<BrandCampaign | undefined>;
  createBrandCampaign(campaign: InsertBrandCampaign): Promise<BrandCampaign>;
  updateBrandCampaign(id: string, updates: Partial<BrandCampaign>): Promise<BrandCampaign>;
  deleteBrandCampaign(id: string): Promise<void>;
  getActiveCampaigns(): Promise<BrandCampaign[]>;
  getCompletedCampaigns(): Promise<BrandCampaign[]>;
  getCampaignROIMetrics(campaignId: string): Promise<any>;
  checkAndUpdateCampaignStatus(campaignId: string): Promise<void>;
  updateCampaignPerformanceMetrics(campaignId: string): Promise<void>;
  fetchRealPerformanceData(url: string, platform: string): Promise<any>;

  // Campaign invitations operations
  createCampaignInvitations(campaignId: string, brandId: string, invitations: { influencerId: string; personalMessage?: string; compensationOffer?: string }[]): Promise<any[]>;
  getCampaignInvitations(campaignId: string): Promise<any[]>;
  getInfluencerInvitations(influencerId: string): Promise<any[]>;
  updateInvitationStatus(invitationId: string, status: string): Promise<any>;
  
  // Campaign lifecycle management operations
  getCampaignMilestones(campaignId: string): Promise<CampaignMilestone[]>;
  createCampaignMilestone(milestone: InsertCampaignMilestone): Promise<CampaignMilestone>;
  updateCampaignMilestone(id: string, updates: Partial<CampaignMilestone>): Promise<CampaignMilestone>;
  completeCampaignMilestone(milestoneId: string): Promise<CampaignMilestone>;
  initializeCampaignMilestones(campaignId: string): Promise<CampaignMilestone[]>;
  
  // Proposal milestone operations
  getProposalMilestones(proposalId: string): Promise<ProposalMilestone[]>;
  getProposalMilestone(milestoneId: string): Promise<ProposalMilestone | undefined>;
  createProposalMilestone(proposalId: string, milestone: any): Promise<ProposalMilestone>;
  updateProposalMilestone(id: string, updates: Partial<ProposalMilestone>): Promise<ProposalMilestone>;
  completeProposalMilestone(milestoneId: string, metadata?: any): Promise<ProposalMilestone>;
  initializeProposalMilestones(proposalId: string, campaignId: string, influencerId: string): Promise<ProposalMilestone[]>;
  updateMilestoneUrgency(proposalId: string): Promise<void>;
  
  // Time tracking operations
  getTimeTrackingSessions(proposalId?: string, milestoneId?: string): Promise<TimeTrackingSession[]>;
  createTimeTrackingSession(session: InsertTimeTrackingSession): Promise<TimeTrackingSession>;
  updateTimeTrackingSession(id: string, updates: Partial<TimeTrackingSession>): Promise<TimeTrackingSession>;
  startTimeTracking(milestoneId: string, proposalId: string, influencerId: string, description?: string): Promise<TimeTrackingSession>;
  stopTimeTracking(sessionId: string): Promise<TimeTrackingSession>;
  pauseTimeTracking(sessionId: string): Promise<TimeTrackingSession>;
  resumeTimeTracking(sessionId: string): Promise<TimeTrackingSession>;
  getActiveTimeSession(influencerId: string): Promise<TimeTrackingSession | undefined>;
  getTotalTimeSpent(proposalId: string): Promise<number>; // Returns total seconds
  
  // Campaign progress tracking operations
  getCampaignProgressStage(proposalId: string): Promise<CampaignProgressStage | undefined>;
  createCampaignProgressStage(stage: InsertCampaignProgressStage): Promise<CampaignProgressStage>;
  updateCampaignProgressStage(proposalId: string, updates: Partial<CampaignProgressStage>): Promise<CampaignProgressStage>;
  updateStageProgress(proposalId: string, stage: string, progress: number): Promise<CampaignProgressStage>;
  advanceToNextStage(proposalId: string, currentStage: string): Promise<CampaignProgressStage>;
  calculateOverallProgress(proposalId: string): Promise<number>;
  
  logCampaignActivity(activity: InsertCampaignActivityLog): Promise<CampaignActivityLog>;
  getCampaignActivityLog(campaignId: string, limit?: number): Promise<CampaignActivityLog[]>;
  
  createCampaignNotification(notification: InsertCampaignNotification): Promise<CampaignNotification>;
  getCampaignNotifications(recipientId: string, status?: string): Promise<CampaignNotification[]>;
  markNotificationAsRead(notificationId: string): Promise<CampaignNotification>;
  sendAutomatedNotifications(campaignId: string, notificationType: string): Promise<void>;
  
  getCampaignAutomationRules(campaignId?: string, brandId?: string): Promise<CampaignAutomationRule[]>;
  createCampaignAutomationRule(rule: InsertCampaignAutomationRule): Promise<CampaignAutomationRule>;
  updateCampaignAutomationRule(id: string, updates: Partial<CampaignAutomationRule>): Promise<CampaignAutomationRule>;
  triggerCampaignAutomation(campaignId: string): Promise<void>;
  
  // Enhanced campaign status management
  pauseCampaign(campaignId: string, userId: string): Promise<BrandCampaign>;
  resumeCampaign(campaignId: string, userId: string): Promise<BrandCampaign>;
  archiveCampaign(campaignId: string, userId: string): Promise<BrandCampaign>;
  
  // Payment operations
  getPaymentSettings(brandId: string): Promise<PaymentSettings | undefined>;
  createPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings>;
  updatePaymentSettings(brandId: string, updates: Partial<PaymentSettings>): Promise<PaymentSettings>;
  
  getCampaignPayments(campaignId?: string, influencerId?: string): Promise<CampaignPayment[]>;
  getCampaignPayment(id: string): Promise<CampaignPayment | undefined>;
  getCampaignPaymentByRazorpayId(razorpayPaymentId: string): Promise<CampaignPayment | null>;
  createCampaignPayment(payment: InsertCampaignPayment): Promise<CampaignPayment>;
  updateCampaignPayment(id: string, updates: Partial<CampaignPayment>): Promise<CampaignPayment>;
  
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransactions(paymentId: string): Promise<PaymentTransaction[]>;
  
  // Campaign proposal operations
  getCampaignProposals(campaignId?: string, influencerId?: string): Promise<CampaignProposal[]>;
  getCampaignProposal(id: string): Promise<CampaignProposal | undefined>;
  createCampaignProposal(proposal: InsertCampaignProposal): Promise<CampaignProposal>;
  updateCampaignProposal(id: string, updates: Partial<CampaignProposal>): Promise<CampaignProposal>;
  
  // Campaign content operations
  getCampaignContent(proposalId?: string, campaignId?: string): Promise<CampaignContent[]>;
  getCampaignContentItem(id: string): Promise<CampaignContent | undefined>;
  createCampaignContent(content: InsertCampaignContent): Promise<CampaignContent>;
  getBrandSubmittedContent(brandId: string): Promise<any[]>;
  reviewCampaignContent(contentId: string, brandId: string, status: string, feedback?: string): Promise<CampaignContent>;
  updateCampaignContent(id: string, updates: Partial<CampaignContent>): Promise<CampaignContent>;
  
  // OTP verification operations
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  verifyOtp(emailOrPhone: string, otp: string, purpose: string): Promise<OtpVerification | undefined>;
  markOtpAsUsed(id: string): Promise<void>;
  findUserByEmail(email: string): Promise<User | undefined>;
  
  // Gamification operations
  getGamificationProfile(userId: string): Promise<GamificationProfile | undefined>;
  createGamificationProfile(profile: InsertGamificationProfile): Promise<GamificationProfile>;
  updateGamificationProfile(userId: string, updates: Partial<GamificationProfile>): Promise<GamificationProfile>;
  
  // Connection achievement operations
  getConnectionAchievements(userId: string): Promise<ConnectionAchievement[]>;
  createConnectionAchievement(achievement: InsertConnectionAchievement): Promise<ConnectionAchievement>;
  markAchievementAsViewed(id: string): Promise<void>;
  
  // Connection activity operations
  getConnectionActivity(userId: string, limit?: number): Promise<ConnectionActivity[]>;
  createConnectionActivity(activity: InsertConnectionActivity): Promise<ConnectionActivity>;
  calculateConnectionStreak(userId: string): Promise<number>;
  
  // Gamification utility operations
  awardConnectionPoints(userId: string, points: number, activityType: string, platform?: string): Promise<void>;
  checkConnectionAchievements(userId: string): Promise<ConnectionAchievement[]>;
  
  // Challenge operations
  getDailyChallenges(userId: string): Promise<DailyChallenge[]>;
  createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge>;
  updateChallengeProgress(challengeId: string, userId: string, progress: number): Promise<void>;
  completeDailyChallenge(challengeId: string, userId: string): Promise<void>;
  generateDailyChallenges(userId: string): Promise<DailyChallenge[]>;

  // Communication operations
  getConversations(userId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; lastMessage?: Message; unreadCount: number; })[]>;
  getConversation(conversationId: string, userId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; }) | undefined>;
  getConversationByCampaign(campaignId: string, userId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; }) | undefined>;
  getCampaignQuestions(campaignId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; lastMessage?: Message; unreadCount: number; })[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<Conversation>;
  
  // Message operations
  getMessages(conversationId: string, userId: string, limit?: number, offset?: number): Promise<(Message & { sender: User; })[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;
  
  // Template operations
  getMessageTemplates(userId: string): Promise<MessageTemplate[]>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(templateId: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate>;
  deleteMessageTemplate(templateId: string, userId: string): Promise<void>;
  
  // Audit logging operations
  logAuditEvent(auditData: any): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: string; action?: string; success?: boolean; limit?: number }): Promise<AuditLog[]>;
  
  // Rate limiting operations
  getRecentPublishActivity(userId: string, timeWindowMs: number): Promise<number>;
  
  // Financial transaction operations
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined>;
  getFinancialTransactionByTransactionId(transactionId: string): Promise<FinancialTransaction | undefined>;
  getFinancialTransactions(filters?: {
    brandId?: string;
    influencerId?: string;
    campaignId?: string;
    proposalId?: string;
    status?: string;
    transactionType?: string;
    limit?: number;
    offset?: number;
  }): Promise<FinancialTransaction[]>;
  updateFinancialTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction>;
  
  // Transaction audit log operations
  createTransactionAuditLog(auditData: InsertTransactionAuditLog): Promise<TransactionAuditLog>;
  getTransactionAuditLogs(transactionId: string): Promise<TransactionAuditLog[]>;
  
  // Payment summary operations
  getPaymentSummary(userId: string, userType: string, periodType: string, periodStart: Date, periodEnd: Date): Promise<PaymentSummary | undefined>;
  createPaymentSummary(summary: InsertPaymentSummary): Promise<PaymentSummary>;
  updatePaymentSummary(id: string, updates: Partial<PaymentSummary>): Promise<PaymentSummary>;
  calculatePaymentSummary(userId: string, userType: string, periodStart: Date, periodEnd: Date): Promise<PaymentSummary>;
  
  // Transaction utility functions
  generateTransactionId(): Promise<string>;
  
  // Comprehensive financial logging operations
  logFinancialActivity(activityData: InsertFinancialActivityLog): Promise<FinancialActivityLog>;
  getFinancialActivityLogs(filters?: {
    activityType?: string;
    actionCategory?: string;
    userId?: string;
    transactionId?: string;
    campaignId?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<FinancialActivityLog[]>;
  
  // User action logging (approvals, rejections, disputes)
  logUserAction(data: {
    userId: string;
    action: string;
    description: string;
    campaignId?: string;
    proposalId?: string;
    transactionId?: string;
    amountAffected?: number;
    previousValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<FinancialActivityLog>;
  
  // System action logging (automated payments, fee calculations)
  logSystemAction(data: {
    action: string;
    description: string;
    transactionId?: string;
    campaignId?: string;
    userId?: string;
    amountAffected?: number;
    feeCalculation?: any;
    correlationId?: string;
    metadata?: any;
  }): Promise<FinancialActivityLog>;
  
  // Admin action logging (manual adjustments, overrides)
  logAdminAction(data: {
    adminUserId: string;
    action: string;
    description: string;
    targetUserId?: string;
    transactionId?: string;
    campaignId?: string;
    amountAffected?: number;
    previousValue?: string;
    newValue?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<FinancialActivityLog>;
  
  // Failed transaction attempt logging
  logFailedTransaction(data: {
    userId?: string;
    action: string;
    description: string;
    errorCode?: string;
    errorMessage: string;
    amountAttempted?: number;
    retryCount?: number;
    campaignId?: string;
    proposalId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<FinancialActivityLog>;
  
  // Financial dispute operations
  createFinancialDispute(dispute: InsertFinancialDisputeLog): Promise<FinancialDisputeLog>;
  getFinancialDispute(disputeId: string): Promise<FinancialDisputeLog | undefined>;
  getFinancialDisputes(filters?: {
    initiatedBy?: string;
    respondentId?: string;
    transactionId?: string;
    status?: string;
    disputeType?: string;
    limit?: number;
    offset?: number;
  }): Promise<FinancialDisputeLog[]>;
  updateFinancialDispute(id: string, updates: Partial<FinancialDisputeLog>): Promise<FinancialDisputeLog>;

  // Invoice operations
  createInvoice(invoiceData: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoices(filters?: {
    brandId?: string;
    influencerId?: string;
    campaignId?: string;
    status?: string;
    invoiceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Invoice[]>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  
  // Invoice items operations
  createInvoiceItem(itemData: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  updateInvoiceItem(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem>;
  deleteInvoiceItem(id: string): Promise<void>;
  
  // Invoice tax calculations operations
  createInvoiceTaxCalculation(taxData: InsertInvoiceTaxCalculation): Promise<InvoiceTaxCalculation>;
  getInvoiceTaxCalculations(invoiceId: string): Promise<InvoiceTaxCalculation[]>;
  
  // Payment milestone operations
  createPaymentMilestone(milestoneData: InsertPaymentMilestone): Promise<PaymentMilestone>;
  getPaymentMilestones(invoiceId: string): Promise<PaymentMilestone[]>;
  updatePaymentMilestone(id: string, updates: Partial<PaymentMilestone>): Promise<PaymentMilestone>;
  markMilestoneAsPaid(id: string, paymentData: { paidAmount: number; paidDate: Date; paymentMethod?: string }): Promise<PaymentMilestone>;
  
  // Invoice utility operations
  generateInvoiceFromCampaign(campaignId: string, proposalId: string): Promise<Invoice>;
  markInvoiceAsPaid(invoiceId: string, paymentData: { paidAmount: number; paidAt: Date; paymentMethod: string }): Promise<Invoice>;
  generateInvoicePDF(invoiceId: string): Promise<string>; // Returns file path
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Social account operations
  async getSocialAccounts(userId: string): Promise<SocialAccount[]> {
    return await db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
  }

  async getSocialAccount(userId: string, platform: string): Promise<SocialAccount | undefined> {
    const [account] = await db.select()
      .from(socialAccounts)
      .where(and(eq(socialAccounts.userId, userId), eq(socialAccounts.platform, platform)));
    return account;
  }

  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const [newAccount] = await db
      .insert(socialAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount> {
    const [updated] = await db
      .update(socialAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(socialAccounts.id, id))
      .returning();
    return updated;
  }

  async disconnectSocialAccount(id: string): Promise<void> {
    await db
      .update(socialAccounts)
      .set({ isConnected: false, updatedAt: new Date() })
      .where(eq(socialAccounts.id, id));
  }

  // Content category operations
  async getContentCategories(userId: string): Promise<ContentCategory[]> {
    return await db.select().from(contentCategories).where(eq(contentCategories.userId, userId));
  }

  async getContentCategoryByName(userId: string, category: string): Promise<ContentCategory | undefined> {
    const [result] = await db.select()
      .from(contentCategories)
      .where(and(eq(contentCategories.userId, userId), eq(contentCategories.category, category)));
    return result;
  }

  async createContentCategory(category: InsertContentCategory): Promise<ContentCategory> {
    const [newCategory] = await db
      .insert(contentCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async deleteContentCategories(userId: string): Promise<void> {
    await db.delete(contentCategories).where(eq(contentCategories.userId, userId));
  }

  // Portfolio content operations
  async getPortfolioContent(userId: string, platform?: string): Promise<PortfolioContent[]> {
    if (platform) {
      return await db.select()
        .from(portfolioContent)
        .where(and(eq(portfolioContent.userId, userId), eq(portfolioContent.platform, platform)));
    }
    
    return await db.select()
      .from(portfolioContent)
      .where(eq(portfolioContent.userId, userId));
  }

  async getPortfolioContentByUrl(url: string): Promise<PortfolioContent | undefined> {
    const [result] = await db.select().from(portfolioContent).where(eq(portfolioContent.url, url));
    return result;
  }

  async createPortfolioContent(content: InsertPortfolioContent): Promise<PortfolioContent> {
    const [newContent] = await db
      .insert(portfolioContent)
      .values(content)
      .returning();
    return newContent;
  }

  async deletePortfolioContent(userId: string, platform?: string): Promise<void> {
    if (platform) {
      await db.delete(portfolioContent)
        .where(and(eq(portfolioContent.userId, userId), eq(portfolioContent.platform, platform)));
    } else {
      await db.delete(portfolioContent)
        .where(eq(portfolioContent.userId, userId));
    }
  }

  // Performance milestone operations
  async getPerformanceMilestones(userId: string): Promise<PerformanceMilestone[]> {
    return await db.select().from(performanceMilestones).where(eq(performanceMilestones.userId, userId));
  }

  async createPerformanceMilestone(milestone: InsertPerformanceMilestone): Promise<PerformanceMilestone> {
    const [newMilestone] = await db.insert(performanceMilestones).values(milestone).returning();
    return newMilestone;
  }

  async updateMilestone(id: string, updates: Partial<PerformanceMilestone>): Promise<PerformanceMilestone> {
    const [updatedMilestone] = await db
      .update(performanceMilestones)
      .set(updates)
      .where(eq(performanceMilestones.id, id))
      .returning();
    return updatedMilestone;
  }

  async checkAndCreateMilestones(userId: string): Promise<PerformanceMilestone[]> {
    // Get user's social accounts and portfolio content
    const socialAccounts = await this.getSocialAccounts(userId);
    const portfolioContent = await this.getPortfolioContent(userId);
    const existingMilestones = await this.getPerformanceMilestones(userId);

    const newMilestones: PerformanceMilestone[] = [];

    // Define milestone thresholds
    const followerThresholds = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
    const viewThresholds = [1000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
    const engagementThresholds = [100, 500, 1000, 5000, 10000]; // total likes + comments
    const contentThresholds = [10, 25, 50, 100, 200]; // number of videos/posts

    for (const account of socialAccounts) {
      const platform = account.platform;
      const followers = account.followerCount || 0;

      // Check follower milestones
      for (const threshold of followerThresholds) {
        if (followers >= threshold) {
          const exists = existingMilestones.some(m => 
            m.milestoneType === 'followers' && 
            m.threshold === threshold && 
            m.platform === platform
          );
          
          if (!exists) {
            const milestone = await this.createPerformanceMilestone({
              userId,
              milestoneType: 'followers',
              threshold,
              platform
            });
            newMilestones.push(milestone);
          }
        }
      }
    }

    // Check content-based milestones
    const totalViews = portfolioContent.reduce((sum, content) => sum + (Number(content.views) || 0), 0);
    const totalEngagement = portfolioContent.reduce((sum, content) => 
      sum + (Number(content.likes) || 0) + (Number(content.comments) || 0), 0
    );
    const totalContent = portfolioContent.length;

    // View milestones
    for (const threshold of viewThresholds) {
      if (totalViews >= threshold) {
        const exists = existingMilestones.some(m => 
          m.milestoneType === 'views' && 
          m.threshold === threshold && 
          !m.platform
        );
        
        if (!exists) {
          const milestone = await this.createPerformanceMilestone({
            userId,
            milestoneType: 'views',
            threshold
          });
          newMilestones.push(milestone);
        }
      }
    }

    // Engagement milestones
    for (const threshold of engagementThresholds) {
      if (totalEngagement >= threshold) {
        const exists = existingMilestones.some(m => 
          m.milestoneType === 'engagement' && 
          m.threshold === threshold && 
          !m.platform
        );
        
        if (!exists) {
          const milestone = await this.createPerformanceMilestone({
            userId,
            milestoneType: 'engagement',
            threshold
          });
          newMilestones.push(milestone);
        }
      }
    }

    // Content creation milestones
    for (const threshold of contentThresholds) {
      if (totalContent >= threshold) {
        const exists = existingMilestones.some(m => 
          m.milestoneType === 'content' && 
          m.threshold === threshold && 
          !m.platform
        );
        
        if (!exists) {
          const milestone = await this.createPerformanceMilestone({
            userId,
            milestoneType: 'content',
            threshold
          });
          newMilestones.push(milestone);
        }
      }
    }

    return newMilestones;
  }

  // Trend prediction operations
  async getTrendPredictions(userId: string, platform?: string): Promise<TrendPrediction[]> {
    if (platform) {
      return await db.select()
        .from(trendPredictions)
        .where(and(eq(trendPredictions.userId, userId), eq(trendPredictions.platform, platform), eq(trendPredictions.isActive, true)));
    }
    
    return await db.select()
      .from(trendPredictions)
      .where(and(eq(trendPredictions.userId, userId), eq(trendPredictions.isActive, true)));
  }

  async createTrendPrediction(prediction: InsertTrendPrediction): Promise<TrendPrediction> {
    const [newPrediction] = await db
      .insert(trendPredictions)
      .values(prediction)
      .returning();
    return newPrediction;
  }

  async updateTrendPrediction(id: string, updates: Partial<TrendPrediction>): Promise<TrendPrediction> {
    const [updatedPrediction] = await db
      .update(trendPredictions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trendPredictions.id, id))
      .returning();
    return updatedPrediction;
  }

  async deleteTrendPrediction(id: string): Promise<void> {
    await db.delete(trendPredictions).where(eq(trendPredictions.id, id));
  }

  // Trend analytics operations
  async getTrendAnalytics(userId: string, platform?: string): Promise<TrendAnalytics[]> {
    if (platform) {
      return await db.select()
        .from(trendAnalytics)
        .where(and(eq(trendAnalytics.userId, userId), eq(trendAnalytics.platform, platform)));
    }
    
    return await db.select()
      .from(trendAnalytics)
      .where(eq(trendAnalytics.userId, userId));
  }

  async createTrendAnalytics(analytics: InsertTrendAnalytics): Promise<TrendAnalytics> {
    const [newAnalytics] = await db
      .insert(trendAnalytics)
      .values(analytics)
      .returning();
    return newAnalytics;
  }

  async getLatestTrendAnalytics(userId: string, platform?: string): Promise<TrendAnalytics | undefined> {
    const query = db.select()
      .from(trendAnalytics)
      .where(platform 
        ? and(eq(trendAnalytics.userId, userId), eq(trendAnalytics.platform, platform))
        : eq(trendAnalytics.userId, userId))
      .orderBy(sql`analysis_date DESC`)
      .limit(1);
    
    const [result] = await query;
    return result;
  }

  // Influencer discovery
  async getInfluencers(limit = 6): Promise<(User & { socialAccounts: SocialAccount[], categories: ContentCategory[] })[]> {
    const influencers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'influencer'))
      .limit(limit);

    const enrichedInfluencers = await Promise.all(
      influencers.map(async (user) => {
        const [userSocialAccounts, userCategories] = await Promise.all([
          this.getSocialAccounts(user.id),
          this.getContentCategories(user.id),
        ]);
        return {
          ...user,
          socialAccounts: userSocialAccounts,
          categories: userCategories,
        };
      })
    );

    return enrichedInfluencers;
  }

  async getLocationBasedInfluencerRecommendations(criteria: {
    targetLocation?: string;
    platforms?: string[];
    campaignType?: string;
    minFollowers?: number;
    maxRecommendations?: number;
  }): Promise<(User & { socialAccounts: SocialAccount[], categories: ContentCategory[], matchScore: number })[]> {
    const {
      targetLocation,
      platforms = [],
      minFollowers = 1000,
      maxRecommendations = 20
    } = criteria;

    // Get all influencers with basic filtering
    let influencers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'influencer'))
      .limit(100); // Get more initially to filter and rank

    // If we have a target location, filter by location
    if (targetLocation) {
      influencers = influencers.filter(user => {
        if (!user.location) return false;
        
        // Location matching logic
        return this.matchLocation(user.location, targetLocation);
      });
    }

    const enrichedInfluencers = await Promise.all(
      influencers.map(async (user) => {
        const [userSocialAccounts, userCategories] = await Promise.all([
          this.getSocialAccounts(user.id),
          this.getContentCategories(user.id),
        ]);

        // Calculate match score
        let matchScore = 0;

        // Location matching (30% weight)
        if (targetLocation && user.location) {
          const locationMatch = this.calculateLocationMatch(user.location, targetLocation);
          matchScore += locationMatch * 30;
        }

        // Platform presence (40% weight)
        if (platforms.length > 0) {
          const platformMatch = this.calculatePlatformMatch(userSocialAccounts, platforms);
          matchScore += platformMatch * 40;
        }

        // Follower count (20% weight)
        const followerMatch = this.calculateFollowerMatch(userSocialAccounts, minFollowers);
        matchScore += followerMatch * 20;

        // Engagement quality (10% weight)
        const engagementMatch = this.calculateEngagementMatch(userSocialAccounts);
        matchScore += engagementMatch * 10;

        return {
          ...user,
          socialAccounts: userSocialAccounts,
          categories: userCategories,
          matchScore: Math.round(matchScore)
        };
      })
    );

    // Filter out influencers who don't meet minimum criteria
    const filteredInfluencers = enrichedInfluencers.filter(influencer => {
      // Must have minimum followers on at least one relevant platform
      const hasMinFollowers = influencer.socialAccounts.some(account => {
        if (platforms.length > 0 && !platforms.includes(account.platform)) return false;
        return (account.followerCount || 0) >= minFollowers;
      });

      return hasMinFollowers && influencer.matchScore > 0;
    });

    // Sort by match score (descending) and limit results
    return filteredInfluencers
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxRecommendations);
  }

  private matchLocation(userLocation: string, targetLocation: string): boolean {
    const userLoc = userLocation.toLowerCase();
    const targetLoc = targetLocation.toLowerCase();

    // Exact match
    if (userLoc === targetLoc) return true;

    // Handle regional matches
    if (targetLoc.includes('india') && userLoc.includes('india')) return true;
    if (targetLoc.includes('usa') && userLoc.includes('usa')) return true;
    if (targetLoc.includes('uk') && userLoc.includes('uk')) return true;

    // Handle city/state matches within regions
    if (targetLoc.includes('north') && userLoc.includes('delhi')) return true;
    if (targetLoc.includes('south') && (userLoc.includes('bangalore') || userLoc.includes('chennai'))) return true;
    if (targetLoc.includes('west') && (userLoc.includes('mumbai') || userLoc.includes('pune'))) return true;
    if (targetLoc.includes('east') && userLoc.includes('kolkata')) return true;

    return false;
  }

  private calculateLocationMatch(userLocation: string, targetLocation: string): number {
    const userLoc = userLocation.toLowerCase();
    const targetLoc = targetLocation.toLowerCase();

    // Perfect match
    if (userLoc === targetLoc) return 100;

    // City match within target region
    if (targetLoc.includes('india')) {
      if (targetLoc.includes('north') && userLoc.includes('delhi')) return 90;
      if (targetLoc.includes('south') && (userLoc.includes('bangalore') || userLoc.includes('chennai'))) return 90;
      if (targetLoc.includes('west') && (userLoc.includes('mumbai') || userLoc.includes('pune'))) return 90;
      if (targetLoc.includes('east') && userLoc.includes('kolkata')) return 90;
      if (userLoc.includes('india')) return 70; // Same country
    }

    // Similar logic for other regions
    if (targetLoc.includes('usa') && userLoc.includes('usa')) return 70;
    if (targetLoc.includes('uk') && userLoc.includes('uk')) return 70;

    return 0;
  }

  private calculatePlatformMatch(socialAccounts: SocialAccount[], targetPlatforms: string[]): number {
    if (targetPlatforms.length === 0) return 50;

    const userPlatforms = socialAccounts.map(acc => acc.platform.toLowerCase());
    const matchingPlatforms = targetPlatforms.filter(platform => 
      userPlatforms.includes(platform.toLowerCase())
    );

    return (matchingPlatforms.length / targetPlatforms.length) * 100;
  }

  private calculateFollowerMatch(socialAccounts: SocialAccount[], minFollowers: number): number {
    const maxFollowers = Math.max(...socialAccounts.map(acc => acc.followerCount || 0));
    
    if (maxFollowers < minFollowers) return 0;
    if (maxFollowers >= minFollowers * 10) return 100;
    
    // Linear scale between min and 10x min
    return ((maxFollowers - minFollowers) / (minFollowers * 9)) * 100;
  }

  private calculateEngagementMatch(socialAccounts: SocialAccount[]): number {
    if (socialAccounts.length === 0) return 0;

    const engagementRates = socialAccounts
      .map(acc => parseFloat(acc.engagementRate || '0'))
      .filter(rate => rate > 0);

    if (engagementRates.length === 0) return 0;

    const avgEngagement = engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length;
    
    // Good engagement is typically 3%+, excellent is 6%+
    if (avgEngagement >= 6) return 100;
    if (avgEngagement >= 3) return 75;
    if (avgEngagement >= 1) return 50;
    return 25;
  }
  
  // Brand testimonial operations
  async getBrandTestimonials(userId: string): Promise<BrandTestimonial[]> {
    const testimonials = await db
      .select()
      .from(brandTestimonials)
      .where(eq(brandTestimonials.userId, userId));
    return testimonials;
  }
  
  async createBrandTestimonial(testimonial: InsertBrandTestimonial): Promise<BrandTestimonial> {
    const [created] = await db
      .insert(brandTestimonials)
      .values(testimonial)
      .returning();
    return created;
  }
  
  async updateBrandTestimonial(id: string, updates: Partial<BrandTestimonial>): Promise<BrandTestimonial> {
    const [updated] = await db
      .update(brandTestimonials)
      .set(updates)
      .where(eq(brandTestimonials.id, id))
      .returning();
    return updated;
  }
  
  async deleteBrandTestimonial(id: string): Promise<void> {
    await db
      .delete(brandTestimonials)
      .where(eq(brandTestimonials.id, id));
  }
  
  // Brand collaboration operations
  async getBrandCollaborations(userId: string, status?: string): Promise<BrandCollaboration[]> {
    if (status) {
      const collaborations = await db
        .select()
        .from(brandCollaborations)
        .where(and(
          eq(brandCollaborations.userId, userId),
          eq(brandCollaborations.status, status)
        ));
      return collaborations;
    }
    
    const collaborations = await db
      .select()
      .from(brandCollaborations)
      .where(eq(brandCollaborations.userId, userId));
    return collaborations;
  }
  
  async createBrandCollaboration(collaboration: InsertBrandCollaboration): Promise<BrandCollaboration> {
    const [created] = await db
      .insert(brandCollaborations)
      .values(collaboration)
      .returning();
    return created;
  }
  
  async updateBrandCollaboration(id: string, updates: Partial<BrandCollaboration>): Promise<BrandCollaboration> {
    const [updated] = await db
      .update(brandCollaborations)
      .set(updates)
      .where(eq(brandCollaborations.id, id))
      .returning();
    return updated;
  }
  
  async deleteBrandCollaboration(id: string): Promise<void> {
    await db
      .delete(brandCollaborations)
      .where(eq(brandCollaborations.id, id));
  }
  
  // Payment operations
  async getPaymentSettings(brandId: string): Promise<PaymentSettings | undefined> {
    const [settings] = await db
      .select()
      .from(paymentSettings)
      .where(eq(paymentSettings.brandId, brandId));
    return settings;
  }
  
  async createPaymentSettings(settings: InsertPaymentSettings): Promise<PaymentSettings> {
    const [created] = await db
      .insert(paymentSettings)
      .values(settings)
      .returning();
    return created;
  }
  
  async updatePaymentSettings(brandId: string, updates: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const [updated] = await db
      .update(paymentSettings)
      .set(updates)
      .where(eq(paymentSettings.brandId, brandId))
      .returning();
    return updated;
  }
  
  async getCampaignPayments(campaignId?: string, influencerId?: string): Promise<CampaignPayment[]> {
    let query = db.select().from(campaignPayments);
    
    if (campaignId && influencerId) {
      query = query.where(and(
        eq(campaignPayments.campaignId, campaignId),
        eq(campaignPayments.influencerId, influencerId)
      )) as any;
    } else if (campaignId) {
      query = query.where(eq(campaignPayments.campaignId, campaignId)) as any;
    } else if (influencerId) {
      query = query.where(eq(campaignPayments.influencerId, influencerId)) as any;
    }
    
    return await query.orderBy(sql`${campaignPayments.createdAt} DESC`);
  }
  
  async getCampaignPayment(id: string): Promise<CampaignPayment | undefined> {
    const [payment] = await db
      .select()
      .from(campaignPayments)
      .where(eq(campaignPayments.id, id));
    return payment;
  }
  
  async createCampaignPayment(payment: InsertCampaignPayment): Promise<CampaignPayment> {
    const [created] = await db
      .insert(campaignPayments)
      .values(payment)
      .returning();
    return created;
  }
  
  async updateCampaignPayment(id: string, updates: Partial<CampaignPayment>): Promise<CampaignPayment> {
    const [updated] = await db
      .update(campaignPayments)
      .set(updates)
      .where(eq(campaignPayments.id, id))
      .returning();
    return updated;
  }

  async getCampaignPaymentByRazorpayId(razorpayPaymentId: string): Promise<CampaignPayment | null> {
    const [payment] = await db
      .select()
      .from(campaignPayments)
      .where(eq(campaignPayments.razorpayPaymentId, razorpayPaymentId))
      .limit(1);
    return payment || null;
  }
  
  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [created] = await db
      .insert(paymentTransactions)
      .values(transaction)
      .returning();
    return created;
  }
  
  async getPaymentTransactions(paymentId: string): Promise<PaymentTransaction[]> {
    return await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.paymentId, paymentId))
      .orderBy(sql`${paymentTransactions.createdAt} DESC`);
  }
  
  // OTP verification operations
  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    const [created] = await db
      .insert(otpVerification)
      .values(otp)
      .returning();
    return created;
  }
  
  async verifyOtp(emailOrPhone: string, otp: string, purpose: string): Promise<OtpVerification | undefined> {
    const [record] = await db
      .select()
      .from(otpVerification)
      .where(and(
        sql`(email = ${emailOrPhone} OR phone = ${emailOrPhone})`,
        eq(otpVerification.otp, otp),
        eq(otpVerification.purpose, purpose),
        eq(otpVerification.isUsed, false),
        sql`expires_at > NOW()`
      ))
      .limit(1);
    
    return record;
  }
  
  async markOtpAsUsed(id: string): Promise<void> {
    await db
      .update(otpVerification)
      .set({ isUsed: true })
      .where(eq(otpVerification.id, id));
  }
  
  async findUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user;
  }

  // Brand profile operations
  async getBrandProfile(userId: string): Promise<Brand | undefined> {
    const [profile] = await db.select().from(brands).where(eq(brands.userId, userId));
    return profile;
  }

  async createBrandProfile(profile: InsertBrand): Promise<Brand> {
    const [newProfile] = await db
      .insert(brands)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateBrandProfile(userId: string, updates: Partial<Brand>): Promise<Brand> {
    const [updated] = await db
      .update(brands)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brands.userId, userId))
      .returning();
    return updated;
  }

  // Brand campaign operations
  async getBrandCampaigns(brandId: string): Promise<BrandCampaign[]> {
    return await db.select().from(brandCampaigns).where(eq(brandCampaigns.brandId, brandId));
  }

  async getBrandCampaign(id: string): Promise<BrandCampaign | undefined> {
    const [campaign] = await db.select().from(brandCampaigns).where(eq(brandCampaigns.id, id));
    return campaign;
  }

  async createBrandCampaign(campaign: InsertBrandCampaign): Promise<BrandCampaign> {
    const [newCampaign] = await db
      .insert(brandCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateBrandCampaign(id: string, updates: Partial<BrandCampaign>): Promise<BrandCampaign> {
    const [updated] = await db
      .update(brandCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(brandCampaigns.id, id))
      .returning();
    return updated;
  }

  async deleteBrandCampaign(id: string): Promise<void> {
    await db.delete(brandCampaigns).where(eq(brandCampaigns.id, id));
  }

  // Campaign invitations operations
  async createCampaignInvitations(
    campaignId: string, 
    brandId: string, 
    invitations: { influencerId: string; personalMessage?: string; compensationOffer?: string }[]
  ): Promise<any[]> {
    const invitationData = invitations.map(inv => ({
      id: nanoid(),
      campaignId,
      brandId,
      influencerId: inv.influencerId,
      personalMessage: inv.personalMessage || null,
      compensationOffer: inv.compensationOffer || null,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const [insertedInvitations] = await Promise.all([
      db.insert(campaignInvitations).values(invitationData).returning(),
      // Also update the campaign to be invitation-only
      db.update(brandCampaigns)
        .set({ 
          visibilityType: 'invitation_only',
          updatedAt: new Date() 
        })
        .where(eq(brandCampaigns.id, campaignId))
    ]);

    return insertedInvitations;
  }

  async getCampaignInvitations(campaignId: string): Promise<any[]> {
    const invitations = await db
      .select({
        id: campaignInvitations.id,
        campaignId: campaignInvitations.campaignId,
        brandId: campaignInvitations.brandId,
        influencerId: campaignInvitations.influencerId,
        personalMessage: campaignInvitations.personalMessage,
        compensationOffer: campaignInvitations.compensationOffer,
        status: campaignInvitations.status,
        createdAt: campaignInvitations.createdAt,
        updatedAt: campaignInvitations.updatedAt,
        influencerName: users.name,
        influencerEmail: users.email,
        influencerProfileImage: users.profileImage
      })
      .from(campaignInvitations)
      .leftJoin(users, eq(campaignInvitations.influencerId, users.id))
      .where(eq(campaignInvitations.campaignId, campaignId))
      .orderBy(sql`${campaignInvitations.createdAt} DESC`);

    return invitations;
  }

  async getInfluencerInvitations(influencerId: string): Promise<any[]> {
    const invitations = await db
      .select({
        id: campaignInvitations.id,
        campaignId: campaignInvitations.campaignId,
        brandId: campaignInvitations.brandId,
        influencerId: campaignInvitations.influencerId,
        personalMessage: campaignInvitations.personalMessage,
        compensationOffer: campaignInvitations.compensationOffer,
        status: campaignInvitations.status,
        createdAt: campaignInvitations.createdAt,
        updatedAt: campaignInvitations.updatedAt,
        campaignTitle: brandCampaigns.title,
        campaignDescription: brandCampaigns.description,
        campaignBudget: brandCampaigns.budget,
        campaignDeadline: brandCampaigns.deadline,
        campaignThumbnailUrl: brandCampaigns.thumbnailUrl,
        brandName: brands.companyName
      })
      .from(campaignInvitations)
      .leftJoin(brandCampaigns, eq(campaignInvitations.campaignId, brandCampaigns.id))
      .leftJoin(brands, eq(campaignInvitations.brandId, brands.userId))
      .where(eq(campaignInvitations.influencerId, influencerId))
      .orderBy(sql`${campaignInvitations.createdAt} DESC`);

    return invitations;
  }

  async updateInvitationStatus(invitationId: string, status: string): Promise<any> {
    const [updated] = await db
      .update(campaignInvitations)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(campaignInvitations.id, invitationId))
      .returning();

    return updated;
  }

  async getActiveCampaigns(): Promise<BrandCampaign[]> {
    return await db.select().from(brandCampaigns).where(
      eq(brandCampaigns.status, 'active')
    );
  }

  async getCompletedCampaigns(): Promise<BrandCampaign[]> {
    return await db.select().from(brandCampaigns).where(
      eq(brandCampaigns.status, 'completed')
    ).orderBy(sql`${brandCampaigns.updatedAt} DESC`);
  }

  async getCampaignROIMetrics(campaignId: string): Promise<any> {
    try {
      // Get campaign details
      const campaign = await this.getBrandCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get all published content for the campaign
      const publishedContent = await db
        .select()
        .from(campaignContent)
        .where(and(
          eq(campaignContent.campaignId, campaignId),
          eq(campaignContent.status, 'live')
        ));

      let totalReach = 0;
      let totalEngagement = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      let averageEngagementRate = 0;

      if (publishedContent.length > 0) {
        publishedContent.forEach(content => {
          if (content.performanceMetrics) {
            const metrics = content.performanceMetrics as any;
            totalReach += metrics.reach || 0;
            totalEngagement += metrics.engagement || 0;
            totalLikes += metrics.likes || 0;
            totalComments += metrics.comments || 0;
            totalShares += metrics.shares || 0;
          }
        });

        averageEngagementRate = totalReach > 0 ? 
          ((totalLikes + totalComments + totalShares) / totalReach * 100) : 0;
      }

      // Calculate ROI
      const budget = Number(campaign.budget) || Number(campaign.budgetMax) || 0;
      const costPerEngagement = totalEngagement > 0 ? budget / totalEngagement : 0;
      const costPerReach = totalReach > 0 ? budget / totalReach : 0;

      return {
        campaignId,
        campaignTitle: campaign.title,
        status: campaign.status,
        budget,
        totalReach,
        totalEngagement,
        totalLikes,
        totalComments,
        totalShares,
        averageEngagementRate: Number(averageEngagementRate.toFixed(2)),
        costPerEngagement: Number(costPerEngagement.toFixed(2)),
        costPerReach: Number(costPerReach.toFixed(4)),
        contentCount: publishedContent.length,
        publishedContent: publishedContent.map(content => ({
          id: content.id,
          title: content.title,
          platform: content.platform,
          livePostUrl: content.livePostUrl,
          publishedAt: content.publishedAt,
          performanceMetrics: content.performanceMetrics
        }))
      };
    } catch (error) {
      console.error('Error calculating campaign ROI:', error);
      throw error;
    }
  }

  // Get public campaign information (visible to all influencers during bidding)
  async getPublicCampaignInfo(campaignId: string): Promise<Partial<BrandCampaign> | undefined> {
    const [campaign] = await db.select({
      id: brandCampaigns.id,
      brandId: brandCampaigns.brandId,
      title: brandCampaigns.title,
      description: brandCampaigns.description,
      campaignType: brandCampaigns.campaignType,
      status: brandCampaigns.status,
      generalStartDate: brandCampaigns.generalStartDate,
      generalEndDate: brandCampaigns.generalEndDate,
      targetAudienceDemographics: brandCampaigns.targetAudienceDemographics,
      targetAudienceInterests: brandCampaigns.targetAudienceInterests,
      targetAudienceLocation: brandCampaigns.targetAudienceLocation,
      targetAudienceSize: brandCampaigns.targetAudienceSize,
      contentType: brandCampaigns.contentType,
      minimumPosts: brandCampaigns.minimumPosts,
      contentGuidelines: brandCampaigns.contentGuidelines,
      requiredHashtags: brandCampaigns.requiredHashtags,
      submissionDeadline: brandCampaigns.submissionDeadline,
      paymentModel: brandCampaigns.paymentModel,
      paymentTermsGeneral: brandCampaigns.paymentTermsGeneral,
      paymentStructure: brandCampaigns.paymentStructure, // CRITICAL: Include payment structure for informed decisions
      campaignGoal: brandCampaigns.campaignGoal,
      platforms: brandCampaigns.platforms,
      createdAt: brandCampaigns.createdAt,
      updatedAt: brandCampaigns.updatedAt,
    }).from(brandCampaigns).where(eq(brandCampaigns.id, campaignId));
    return campaign;
  }

  // Get full campaign information (visible only to approved influencers)
  async getFullCampaignInfo(campaignId: string): Promise<BrandCampaign | undefined> {
    const [campaign] = await db.select().from(brandCampaigns).where(eq(brandCampaigns.id, campaignId));
    return campaign;
  }

  // Check if an influencer has an approved proposal for a campaign
  async hasApprovedProposal(campaignId: string, influencerId: string): Promise<boolean> {
    const [proposal] = await db.select()
      .from(campaignProposals)
      .where(and(
        eq(campaignProposals.campaignId, campaignId),
        eq(campaignProposals.influencerId, influencerId),
        eq(campaignProposals.status, 'approved')
      ));
    return !!proposal;
  }

  // Campaign proposal operations
  async getCampaignProposals(campaignId?: string, influencerId?: string): Promise<CampaignProposal[]> {
    let query = db.select().from(campaignProposals);
    
    if (campaignId && influencerId) {
      return await query.where(and(
        eq(campaignProposals.campaignId, campaignId),
        eq(campaignProposals.influencerId, influencerId)
      ));
    } else if (campaignId) {
      return await query.where(eq(campaignProposals.campaignId, campaignId));
    } else if (influencerId) {
      return await query.where(eq(campaignProposals.influencerId, influencerId));
    }
    
    return await query;
  }

  async getCampaignProposal(id: string): Promise<CampaignProposal | undefined> {
    const [proposal] = await db.select().from(campaignProposals).where(eq(campaignProposals.id, id));
    return proposal;
  }

  async createCampaignProposal(proposal: InsertCampaignProposal): Promise<CampaignProposal> {
    const [newProposal] = await db
      .insert(campaignProposals)
      .values(proposal)
      .returning();
    
    // Get influencer details for activity log
    const influencer = await this.getUser(proposal.influencerId);
    const influencerName = influencer ? `${influencer.firstName} ${influencer.lastName}` : 'Unknown Influencer';
    
    // Log the proposal submission activity
    await this.logCampaignActivity({
      campaignId: proposal.campaignId,
      userId: proposal.influencerId,
      activityType: 'proposal_submitted',
      activityDescription: `${influencerName} submitted a proposal with budget ₹${proposal.proposedCompensation}`,
      metadata: {
        proposalId: newProposal.id,
        proposedBudget: proposal.proposedCompensation,
        proposedDeliverables: proposal.proposedDeliverables,
        proposedTimeline: proposal.proposedTimeline
      }
    });
    
    // Check if this is the first proposal for the campaign and update milestone
    if (proposal.campaignId) {
      const allProposals = await db
        .select()
        .from(campaignProposals)
        .where(eq(campaignProposals.campaignId, proposal.campaignId));
      
      // If this is the first proposal, mark the first_application milestone as completed
      if (allProposals.length === 1) {
        await db
          .update(campaignMilestones)
          .set({
            status: 'completed',
            completedDate: new Date(),
            updatedAt: new Date()
          })
          .where(
            and(
              eq(campaignMilestones.campaignId, proposal.campaignId),
              eq(campaignMilestones.milestoneType, 'first_application')
            )
          );
        
        // Log the milestone activity
        await this.logCampaignActivity({
          campaignId: proposal.campaignId,
          activityType: 'milestone_completed',
          activityDescription: 'First influencer application received - milestone completed',
          userId: proposal.influencerId
        });
      }
    }
    
    return newProposal;
  }

  async updateCampaignProposal(id: string, updates: Partial<CampaignProposal>): Promise<CampaignProposal> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    if (updates.status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (updates.status === 'rejected') {
      updateData.rejectedAt = new Date();
    }

    const [updated] = await db
      .update(campaignProposals)
      .set(updateData)
      .where(eq(campaignProposals.id, id))
      .returning();
    return updated;
  }

  // Campaign content operations
  async getCampaignContent(proposalId?: string, campaignId?: string): Promise<CampaignContent[]> {
    let query = db.select().from(campaignContent);
    
    if (proposalId) {
      return await query.where(eq(campaignContent.proposalId, proposalId));
    } else if (campaignId) {
      return await query.where(eq(campaignContent.campaignId, campaignId));
    }
    
    return await query;
  }

  async getCampaignContentItem(id: string): Promise<CampaignContent | undefined> {
    const [content] = await db.select().from(campaignContent).where(eq(campaignContent.id, id));
    return content;
  }

  async createCampaignContent(content: InsertCampaignContent): Promise<CampaignContent> {
    const [newContent] = await db
      .insert(campaignContent)
      .values(content)
      .returning();
    return newContent;
  }

  async updateCampaignContent(id: string, updates: Partial<CampaignContent>): Promise<CampaignContent> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    if (updates.status === 'submitted' && !updateData.submittedAt) {
      updateData.submittedAt = new Date();
    } else if (updates.status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (updates.status === 'rejected') {
      updateData.rejectedAt = new Date();
    } else if (updates.status === 'live') {
      updateData.publishedAt = new Date();
    }

    const [updated] = await db
      .update(campaignContent)
      .set(updateData)
      .where(eq(campaignContent.id, id))
      .returning();
    return updated;
  }

  async getBrandSubmittedContent(brandId: string): Promise<any[]> {
    const submittedContent = await db
      .select({
        id: campaignContent.id,
        proposalId: campaignContent.proposalId,
        campaignId: campaignContent.campaignId,
        influencerId: campaignContent.influencerId,
        contentType: campaignContent.contentType,
        title: campaignContent.title,
        description: campaignContent.description,
        contentUrl: campaignContent.contentUrl,
        previewUrl: campaignContent.previewUrl,
        platform: campaignContent.platform,
        status: campaignContent.status,
        submittedAt: campaignContent.submittedAt,
        brandFeedback: campaignContent.brandFeedback,
        createdAt: campaignContent.createdAt,
        campaignTitle: brandCampaigns.title,
        influencerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
      })
      .from(campaignContent)
      .innerJoin(brandCampaigns, eq(campaignContent.campaignId, brandCampaigns.id))
      .innerJoin(users, eq(campaignContent.influencerId, users.id))
      .where(and(
        eq(brandCampaigns.brandId, brandId),
        eq(campaignContent.status, 'submitted')
      ))
      .orderBy(sql`${campaignContent.submittedAt} DESC`);
    
    return submittedContent;
  }

  async reviewCampaignContent(contentId: string, brandId: string, status: string, feedback?: string): Promise<CampaignContent> {
    // First verify the content belongs to a campaign owned by this brand
    const contentWithCampaign = await db
      .select({ brandId: brandCampaigns.brandId })
      .from(campaignContent)
      .innerJoin(brandCampaigns, eq(campaignContent.campaignId, brandCampaigns.id))
      .where(eq(campaignContent.id, contentId))
      .limit(1);
    
    if (!contentWithCampaign.length || contentWithCampaign[0].brandId !== brandId) {
      throw new Error('Content not found or access denied');
    }

    const updateData: any = {
      status,
      brandFeedback: feedback || null,
      updatedAt: new Date()
    };
    
    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    }

    const [updated] = await db
      .update(campaignContent)
      .set(updateData)
      .where(eq(campaignContent.id, contentId))
      .returning();
    
    // If content is approved, update proposal status to enable completion payment
    if (status === 'approved') {
      await db
        .update(campaignProposals)
        .set({
          status: 'completion_payment_pending',
          brandFeedback: 'Content approved - ready for completion payment',
          updatedAt: new Date()
        })
        .where(eq(campaignProposals.id, updated.proposalId));
    }
    
    return updated;
  }

  async getInfluencerContent(influencerId: string, contentId: string): Promise<CampaignContent | undefined> {
    const [content] = await db
      .select()
      .from(campaignContent)
      .where(and(
        eq(campaignContent.id, contentId),
        eq(campaignContent.influencerId, influencerId)
      ))
      .limit(1);
    
    return content;
  }

  async publishContent(contentId: string, influencerId: string, livePostUrl?: string): Promise<CampaignContent> {
    const updateData: any = {
      status: 'live',
      publishedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (livePostUrl) {
      updateData.livePostUrl = livePostUrl;
    }

    const [updated] = await db
      .update(campaignContent)
      .set(updateData)
      .where(and(
        eq(campaignContent.id, contentId),
        eq(campaignContent.influencerId, influencerId),
        eq(campaignContent.status, 'approved')
      ))
      .returning();
    
    if (!updated) {
      throw new Error('Content not found or not approved');
    }
    
    // Auto-update campaign status when content is published
    await this.checkAndUpdateCampaignStatus(updated.campaignId);
    
    // Check if this triggers bonus payment for campaigns with 3-phase payment structure
    try {
      const proposal = await this.getCampaignProposalByContent(contentId);
      if (proposal) {
        const { paymentService } = await import('./payment-service');
        await paymentService.createBonusPayment(proposal.id);
      }
    } catch (error) {
      console.error('Error creating bonus payment after content publication:', error);
      // Don't fail the content publication if bonus payment fails
    }
    
    return updated;
  }

  async getContentByProposalId(proposalId: string, influencerId: string): Promise<CampaignContent[]> {
    const content = await db
      .select()
      .from(campaignContent)
      .where(and(
        eq(campaignContent.proposalId, proposalId),
        eq(campaignContent.influencerId, influencerId)
      ))
      .orderBy(sql`${campaignContent.createdAt} DESC`);
    
    return content;
  }

  async getPublishedContentForProposal(proposalId: string): Promise<CampaignContent[]> {
    const publishedContent = await db
      .select()
      .from(campaignContent)
      .where(and(
        eq(campaignContent.proposalId, proposalId),
        eq(campaignContent.status, 'live')
      ));
    
    return publishedContent;
  }

  async getCampaignProposalByContent(contentId: string): Promise<CampaignProposal | null> {
    const content = await db
      .select({ proposalId: campaignContent.proposalId })
      .from(campaignContent)
      .where(eq(campaignContent.id, contentId))
      .limit(1);
    
    if (!content.length) return null;
    
    return await this.getCampaignProposal(content[0].proposalId);
  }

  // Campaign status management
  async checkAndUpdateCampaignStatus(campaignId: string): Promise<void> {
    try {
      // Get all content for this campaign
      const allContent = await db
        .select()
        .from(campaignContent)
        .where(eq(campaignContent.campaignId, campaignId));

      if (allContent.length === 0) return;

      // Check if all approved content is now published
      const approvedContent = allContent.filter(content => content.status === 'approved' || content.status === 'live');
      const publishedContent = allContent.filter(content => content.status === 'live');

      // If all approved content is published, mark campaign as completed
      if (approvedContent.length > 0 && publishedContent.length === approvedContent.length) {
        await db
          .update(brandCampaigns)
          .set({
            status: 'completed',
            updatedAt: new Date()
          })
          .where(eq(brandCampaigns.id, campaignId));

        // Fetch real performance data for all published content
        await this.updateCampaignPerformanceMetrics(campaignId);
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  }

  async updateCampaignPerformanceMetrics(campaignId: string): Promise<void> {
    try {
      // Get all published content for the campaign
      const publishedContent = await db
        .select()
        .from(campaignContent)
        .where(and(
          eq(campaignContent.campaignId, campaignId),
          eq(campaignContent.status, 'live')
        ));

      let totalReach = 0;
      let totalEngagement = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;

      // Fetch real data from each published URL
      for (const content of publishedContent) {
        if (content.livePostUrl) {
          const metrics = await this.fetchRealPerformanceData(content.livePostUrl, content.platform);
          
          if (metrics) {
            totalReach += metrics.reach || 0;
            totalEngagement += metrics.engagement || 0;
            totalLikes += metrics.likes || 0;
            totalComments += metrics.comments || 0;
            totalShares += metrics.shares || 0;

            // Update content performance metrics
            await db
              .update(campaignContent)
              .set({
                performanceMetrics: metrics,
                updatedAt: new Date()
              })
              .where(eq(campaignContent.id, content.id));
          }
        }
      }

      // Update campaign with aggregated metrics
      await db
        .update(brandCampaigns)
        .set({
          actualReach: totalReach,
          actualEngagement: `${totalEngagement}`,
          updatedAt: new Date()
        })
        .where(eq(brandCampaigns.id, campaignId));

    } catch (error) {
      console.error('Error updating campaign performance metrics:', error);
    }
  }

  async fetchRealPerformanceData(url: string, platform: string): Promise<any> {
    try {
      // Simulate fetching real data from social media APIs
      // In production, this would make actual API calls to Instagram, TikTok, YouTube APIs
      
      // For demo purposes, generate realistic metrics based on platform
      const baseMetrics = {
        instagram: { reach: 15000, engagement: 850, likes: 720, comments: 45, shares: 85 },
        tiktok: { reach: 25000, engagement: 1200, likes: 980, comments: 78, shares: 142 },
        youtube: { reach: 8000, engagement: 640, likes: 520, comments: 34, shares: 86 }
      };

      const base = baseMetrics[platform as keyof typeof baseMetrics] || baseMetrics.instagram;
      
      // Add some realistic variation
      const variation = 0.3; // ±30% variation
      const metrics = {
        reach: Math.floor(base.reach * (1 + (Math.random() - 0.5) * variation)),
        engagement: Math.floor(base.engagement * (1 + (Math.random() - 0.5) * variation)),
        likes: Math.floor(base.likes * (1 + (Math.random() - 0.5) * variation)),
        comments: Math.floor(base.comments * (1 + (Math.random() - 0.5) * variation)),
        shares: Math.floor(base.shares * (1 + (Math.random() - 0.5) * variation)),
        fetchedAt: new Date().toISOString(),
        platform,
        postUrl: url
      };

      // Calculate engagement rate
      metrics.engagementRate = ((metrics.likes + metrics.comments + metrics.shares) / metrics.reach * 100).toFixed(2);

      return metrics;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      return null;
    }
  }

  // Gamification operations
  async getGamificationProfile(userId: string): Promise<GamificationProfile | undefined> {
    const [profile] = await db.select().from(gamificationProfile).where(eq(gamificationProfile.userId, userId));
    return profile;
  }

  async createGamificationProfile(profileData: InsertGamificationProfile): Promise<GamificationProfile> {
    const [profile] = await db
      .insert(gamificationProfile)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateGamificationProfile(userId: string, updates: Partial<GamificationProfile>): Promise<GamificationProfile> {
    const [updated] = await db
      .update(gamificationProfile)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gamificationProfile.userId, userId))
      .returning();
    return updated;
  }

  // Connection achievement operations
  async getConnectionAchievements(userId: string): Promise<ConnectionAchievement[]> {
    return await db.select().from(connectionAchievements).where(eq(connectionAchievements.userId, userId));
  }

  async createConnectionAchievement(achievementData: InsertConnectionAchievement): Promise<ConnectionAchievement> {
    const [achievement] = await db
      .insert(connectionAchievements)
      .values(achievementData)
      .returning();
    return achievement;
  }

  async markAchievementAsViewed(id: string): Promise<void> {
    await db
      .update(connectionAchievements)
      .set({ isViewed: true })
      .where(eq(connectionAchievements.id, id));
  }

  // Connection activity operations
  async getConnectionActivity(userId: string, limit: number = 50): Promise<ConnectionActivity[]> {
    return await db.select()
      .from(connectionActivity)
      .where(eq(connectionActivity.userId, userId))
      .orderBy(sql`${connectionActivity.activityDate} DESC`)
      .limit(limit);
  }

  async createConnectionActivity(activityData: InsertConnectionActivity): Promise<ConnectionActivity> {
    const [activity] = await db
      .insert(connectionActivity)
      .values(activityData)
      .returning();
    return activity;
  }

  async calculateConnectionStreak(userId: string): Promise<number> {
    const activities = await db.select()
      .from(connectionActivity)
      .where(eq(connectionActivity.userId, userId))
      .orderBy(sql`${connectionActivity.activityDate} DESC`)
      .limit(30);

    if (activities.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < activities.length; i++) {
      const activityDate = new Date(activities[i].activityDate);
      activityDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (activityDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Gamification utility operations
  async awardConnectionPoints(userId: string, points: number, activityType: string, platform?: string): Promise<void> {
    // Create activity record
    await this.createConnectionActivity({
      userId,
      activityType,
      platform,
      pointsEarned: points,
      metadata: { points, platform }
    });

    // Update gamification profile
    let profile = await this.getGamificationProfile(userId);
    
    if (!profile) {
      profile = await this.createGamificationProfile({
        userId,
        totalPoints: points,
        lastActivityDate: new Date()
      });
    } else {
      const currentPoints = profile.totalPoints || 0;
      const newTotalPoints = currentPoints + points;
      const newLevel = Math.floor(newTotalPoints / 100) + 1;
      
      await this.updateGamificationProfile(userId, {
        totalPoints: newTotalPoints,
        currentLevel: newLevel,
        lastActivityDate: new Date(),
        nextLevelPoints: (newLevel * 100) - newTotalPoints
      });
    }
  }

  async checkConnectionAchievements(userId: string): Promise<ConnectionAchievement[]> {
    const socialAccounts = await this.getSocialAccounts(userId);
    const profile = await this.getGamificationProfile(userId);
    const existingAchievements = await this.getConnectionAchievements(userId);
    const newAchievements: ConnectionAchievement[] = [];

    // Check for first connection achievement
    if (socialAccounts.length >= 1 && !existingAchievements.some(a => a.achievementType === 'first_connection')) {
      const achievement = await this.createConnectionAchievement({
        userId,
        achievementType: 'first_connection',
        level: 1,
        title: 'First Connection',
        description: 'Connected your first social media account!',
        badgeIcon: 'link',
        badgeColor: 'blue',
        pointsEarned: 25
      });
      newAchievements.push(achievement);
    }

    // Check for multi-platform achievements
    const connectedPlatforms = socialAccounts.filter(acc => acc.isConnected).length;
    const multiPlatformLevels = [
      { threshold: 2, level: 1, title: 'Cross-Platform Creator', points: 50 },
      { threshold: 3, level: 2, title: 'Multi-Platform Master', points: 100 },
      { threshold: 4, level: 3, title: 'Platform Dominator', points: 200 }
    ];

    for (const levelData of multiPlatformLevels) {
      if (connectedPlatforms >= levelData.threshold && 
          !existingAchievements.some(a => a.achievementType === 'multi_platform' && a.level === levelData.level)) {
        const achievement = await this.createConnectionAchievement({
          userId,
          achievementType: 'multi_platform',
          level: levelData.level,
          title: levelData.title,
          description: `Connected ${levelData.threshold}+ social media platforms!`,
          badgeIcon: 'trophy',
          badgeColor: levelData.level === 1 ? 'bronze' : levelData.level === 2 ? 'silver' : 'gold',
          pointsEarned: levelData.points
        });
        newAchievements.push(achievement);
      }
    }

    // Check for verification achievements
    const verifiedAccounts = socialAccounts.filter(acc => acc.isConnected && acc.followerCount && acc.followerCount > 1000).length;
    if (verifiedAccounts >= 1 && !existingAchievements.some(a => a.achievementType === 'verification')) {
      const achievement = await this.createConnectionAchievement({
        userId,
        achievementType: 'verification',
        level: 1,
        title: 'Verified Creator',
        description: 'Connected a verified social media account with 1K+ followers!',
        badgeIcon: 'verified',
        badgeColor: 'teal',
        pointsEarned: 150
      });
      newAchievements.push(achievement);
    }

    return newAchievements;
  }

  // Challenge operations
  async getDailyChallenges(userId: string): Promise<DailyChallenge[]> {
    const challenges = await db
      .select()
      .from(dailyChallenges)
      .where(and(
        eq(dailyChallenges.userId, userId),
        gte(dailyChallenges.expiresAt, new Date())
      ))
      .orderBy(dailyChallenges.createdAt);
    
    return challenges;
  }

  async createDailyChallenge(challengeData: InsertDailyChallenge): Promise<DailyChallenge> {
    const [challenge] = await db
      .insert(dailyChallenges)
      .values(challengeData)
      .returning();
    return challenge;
  }

  async updateChallengeProgress(challengeId: string, userId: string, progress: number): Promise<void> {
    const challenge = await db
      .select()
      .from(dailyChallenges)
      .where(and(
        eq(dailyChallenges.id, challengeId),
        eq(dailyChallenges.userId, userId)
      ))
      .limit(1);

    if (challenge.length > 0) {
      const isCompleted = progress >= challenge[0].targetValue;
      
      await db
        .update(dailyChallenges)
        .set({
          currentProgress: progress,
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        })
        .where(eq(dailyChallenges.id, challengeId));

      // Award points if completed
      if (isCompleted && !challenge[0].isCompleted && challenge[0].pointsReward) {
        await this.awardConnectionPoints(userId, challenge[0].pointsReward, 'challenge_completion');
      }
    }
  }

  async completeDailyChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = await db
      .select()
      .from(dailyChallenges)
      .where(and(
        eq(dailyChallenges.id, challengeId),
        eq(dailyChallenges.userId, userId)
      ))
      .limit(1);

    if (challenge.length > 0 && !challenge[0].isCompleted) {
      await db
        .update(dailyChallenges)
        .set({
          currentProgress: challenge[0].targetValue,
          isCompleted: true,
          completedAt: new Date()
        })
        .where(eq(dailyChallenges.id, challengeId));

      // Award completion points
      if (challenge[0].pointsReward) {
        await this.awardConnectionPoints(userId, challenge[0].pointsReward, 'challenge_completion');
      }
    }
  }

  async generateDailyChallenges(userId: string): Promise<DailyChallenge[]> {
    // Check if user already has active challenges for today
    const existingChallenges = await this.getDailyChallenges(userId);
    
    if (existingChallenges.length > 0) {
      return existingChallenges;
    }

    // Get user's gamification profile to create personalized challenges
    const profile = await this.getGamificationProfile(userId);
    const socialAccounts = await this.getSocialAccounts(userId);
    
    const challengesToCreate = [];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Challenge 1: Connection-based challenge
    if (socialAccounts.length < 3) {
      challengesToCreate.push({
        userId,
        challengeType: 'daily' as const,
        title: 'Connect a New Platform',
        description: 'Link your Instagram, TikTok, or YouTube account today',
        category: 'connection',
        targetValue: 1,
        pointsReward: 100,
        expiresAt: tomorrow,
        icon: 'link',
        color: 'blue'
      });
    }

    // Challenge 2: Profile improvement
    const user = await this.getUser(userId);
    if (!user?.bio || !user?.profileImageUrl) {
      challengesToCreate.push({
        userId,
        challengeType: 'daily' as const,
        title: 'Update Your Profile',
        description: 'Add a bio and profile photo to increase your visibility',
        category: 'profile',
        targetValue: user?.bio && user?.profileImageUrl ? 0 : (user?.bio || user?.profileImageUrl ? 1 : 2),
        currentProgress: (user?.bio ? 1 : 0) + (user?.profileImageUrl ? 1 : 0),
        pointsReward: 50,
        expiresAt: tomorrow,
        icon: 'user',
        color: 'green'
      });
    }

    // Challenge 3: Streak maintenance (weekly challenge)
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    challengesToCreate.push({
      userId,
      challengeType: 'weekly' as const,
      title: 'Streak Keeper',
      description: 'Maintain your daily activity streak for 7 days',
      category: 'streak',
      targetValue: 7,
      currentProgress: profile?.connectionStreak || 0,
      pointsReward: 200,
      expiresAt: weekFromNow,
      icon: 'flame',
      color: 'orange'
    });

    // Create challenges in database
    const createdChallenges = [];
    for (const challengeData of challengesToCreate) {
      const challenge = await this.createDailyChallenge(challengeData);
      createdChallenges.push(challenge);
    }

    return createdChallenges;
  }

  // Communication operations
  async getConversations(userId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; lastMessage?: Message; unreadCount: number; })[]> {
    // First get all conversations for this user
    const userConversations = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.brandId, userId), eq(conversations.influencerId, userId)))
      .orderBy(conversations.lastMessageAt);

    const conversationsWithDetails = [];
    
    for (const conversation of userConversations) {
      // Get brand user
      const brand = await db
        .select()
        .from(users)
        .where(eq(users.id, conversation.brandId))
        .limit(1);

      // Get influencer user
      const influencer = await db
        .select()
        .from(users)
        .where(eq(users.id, conversation.influencerId))
        .limit(1);

      // Get campaign if exists
      let campaign = null;
      if (conversation.campaignId) {
        const campaignResult = await db
          .select()
          .from(brandCampaigns)
          .where(eq(brandCampaigns.id, conversation.campaignId))
          .limit(1);
        campaign = campaignResult[0] || null;
      }

      // Get last message
      const lastMessageResult = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id))
        .orderBy(sql`${messages.createdAt} DESC`)
        .limit(1);
      const lastMessage = lastMessageResult[0] || null;

      // Get unread count
      const unreadResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversation.id),
            eq(messages.receiverId, userId),
            eq(messages.isRead, false)
          )
        );
      const unreadCount = unreadResult[0]?.count || 0;

      conversationsWithDetails.push({
        ...conversation,
        brand: brand[0],
        influencer: influencer[0],
        campaign,
        lastMessage,
        unreadCount,
      });
    }

    return conversationsWithDetails as (Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; lastMessage?: Message; unreadCount: number; })[];
  }

  async getConversation(conversationId: string, userId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; }) | undefined> {
    // First get the conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(eq(conversations.brandId, userId), eq(conversations.influencerId, userId))
        )
      );

    if (!conversation) return undefined;

    // Get brand user
    const [brand] = await db
      .select()
      .from(users)
      .where(eq(users.id, conversation.brandId));

    // Get influencer user  
    const [influencer] = await db
      .select()
      .from(users)
      .where(eq(users.id, conversation.influencerId));

    // Get campaign if exists
    let campaign = null;
    if (conversation.campaignId) {
      const [campaignResult] = await db
        .select()
        .from(brandCampaigns)
        .where(eq(brandCampaigns.id, conversation.campaignId));
      campaign = campaignResult || null;
    }

    return {
      ...conversation,
      brand: brand!,
      influencer: influencer!,
      campaign: campaign || undefined,
    };
  }

  async getConversationByCampaign(campaignId: string, userId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; }) | undefined> {
    // Find conversation for this campaign that includes the user, ordered by most recent activity
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.campaignId, campaignId),
        or(
          eq(conversations.brandId, userId),
          eq(conversations.influencerId, userId)
        )
      ))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.createdAt))
      .limit(1);

    if (!conversation) return undefined;

    return this.getConversation(conversation.id, userId);
  }

  async getConversationByCampaignAndParticipants(campaignId: string, userId: string, otherParticipantId?: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; }) | undefined> {
    // If no specific participant ID is provided, fall back to the original method
    if (!otherParticipantId) {
      return this.getConversationByCampaign(campaignId, userId);
    }

    // Find conversation for this specific campaign and participant pair
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.campaignId, campaignId),
        or(
          // User is brand, other participant is influencer
          and(eq(conversations.brandId, userId), eq(conversations.influencerId, otherParticipantId)),
          // User is influencer, other participant is brand
          and(eq(conversations.influencerId, userId), eq(conversations.brandId, otherParticipantId))
        )
      ))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.createdAt))
      .limit(1);

    if (!conversation) return undefined;

    return this.getConversation(conversation.id, userId);
  }

  async getCampaignQuestionsByInfluencer(campaignId: string, influencerId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; lastMessage?: Message; unreadCount: number; })[]> {
    // Get conversations for this campaign where the user is the influencer
    const results = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.campaignId, campaignId),
          eq(conversations.influencerId, influencerId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.createdAt));

    const enrichedConversations = await Promise.all(
      results.map(async (conversation) => {
        // Get brand user
        const [brand] = await db
          .select()
          .from(users)
          .where(eq(users.id, conversation.brandId));

        // Get influencer user  
        const [influencer] = await db
          .select()
          .from(users)
          .where(eq(users.id, conversation.influencerId));

        // Get campaign
        let campaign = null;
        if (conversation.campaignId) {
          const [campaignResult] = await db
            .select()
            .from(brandCampaigns)
            .where(eq(brandCampaigns.id, conversation.campaignId));
          campaign = campaignResult || null;
        }

        // Get last message
        const [lastMessage] = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get unread count for influencer (they receive replies from brands)
        const [unreadResult] = await db
          .select({ count: sql<number>`count(*)`.as('count') })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversation.id),
              eq(messages.receiverId, conversation.influencerId),
              eq(messages.isRead, false)
            )
          );

        return {
          ...conversation,
          brand: brand!,
          influencer: influencer!,
          campaign: campaign || undefined,
          lastMessage: lastMessage || undefined,
          unreadCount: unreadResult?.count || 0,
        };
      })
    );

    return enrichedConversations;
  }

  async getCampaignQuestions(campaignId: string): Promise<(Conversation & { brand: User; influencer: User; campaign?: BrandCampaign; lastMessage?: Message; unreadCount: number; })[]> {
    // Get all conversations for this campaign (pre-approval Q&A)
    const results = await db
      .select()
      .from(conversations)
      .where(eq(conversations.campaignId, campaignId))
      .orderBy(desc(conversations.lastMessageAt), desc(conversations.createdAt));

    const enrichedConversations = await Promise.all(
      results.map(async (conversation) => {
        // Get brand user
        const [brand] = await db
          .select()
          .from(users)
          .where(eq(users.id, conversation.brandId));

        // Get influencer user  
        const [influencer] = await db
          .select()
          .from(users)
          .where(eq(users.id, conversation.influencerId));

        // Get campaign
        let campaign = null;
        if (conversation.campaignId) {
          const [campaignResult] = await db
            .select()
            .from(brandCampaigns)
            .where(eq(brandCampaigns.id, conversation.campaignId));
          campaign = campaignResult || null;
        }

        // Get last message
        const [lastMessage] = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get unread count for brand (they receive questions from influencers)
        const [unreadResult] = await db
          .select({ count: sql<number>`count(*)`.as('count') })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversation.id),
              eq(messages.receiverId, conversation.brandId),
              eq(messages.isRead, false)
            )
          );

        return {
          ...conversation,
          brand: brand!,
          influencer: influencer!,
          campaign: campaign || undefined,
          lastMessage: lastMessage || undefined,
          unreadCount: unreadResult?.count || 0,
        };
      })
    );

    return enrichedConversations;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return created;
  }

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId))
      .returning();
    return updated;
  }

  // Message operations
  async getMessages(conversationId: string, userId: string, limit = 50, offset = 0): Promise<(Message & { sender: User; })[]> {
    // Verify user has access to this conversation
    const conversation = await this.getConversation(conversationId, userId);
    if (!conversation) throw new Error("Conversation not found or access denied");

    const results = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
      .limit(limit)
      .offset(offset);

    const typedResults = results as Array<{ message: Message; sender: User }>;
    return typedResults.map(result => ({
      ...result.message,
      sender: result.sender!,
    }));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const results = await db
      .insert(messages)
      .values(message)
      .returning() as Message[];
    const created = results[0];

    // Update conversation's last message timestamp
    if (message.conversationId) {
      await db
        .update(conversations)
        .set({ 
          lastMessageAt: new Date(),
          updatedAt: new Date() 
        })
        .where(sql`${conversations.id} = ${message.conversationId}`);
    }

    return created;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        deliveryStatus: 'read'
      })
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.receiverId, userId)
        )
      );
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    // Mark all unread messages in the conversation as read for this user
    await db
      .update(messages)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        deliveryStatus: 'read'
      })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );

    // Update the conversation's last read timestamp for this user
    const conversation = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    if (conversation.length === 0) return;
    
    const updateField = userId === conversation[0].brandId ? 'brandLastReadAt' : 'influencerLastReadAt';
    await db
      .update(conversations)
      .set({ [updateField]: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  // Template operations
  async getMessageTemplates(userId: string): Promise<MessageTemplate[]> {
    return await db
      .select()
      .from(messageTemplates)
      .where(or(eq(messageTemplates.userId, userId), eq(messageTemplates.isDefault, true)))
      .orderBy(messageTemplates.category, messageTemplates.title);
  }

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const [created] = await db
      .insert(messageTemplates)
      .values(template)
      .returning();
    return created;
  }

  async updateMessageTemplate(templateId: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const [updated] = await db
      .update(messageTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(messageTemplates.id, templateId))
      .returning();
    return updated;
  }

  async deleteMessageTemplate(templateId: string, userId: string): Promise<void> {
    await db
      .delete(messageTemplates)
      .where(
        and(
          eq(messageTemplates.id, templateId),
          eq(messageTemplates.userId, userId),
          eq(messageTemplates.isDefault, false) // Prevent deletion of default templates
        )
      );
  }
  
  // Audit logging operations
  async logAuditEvent(auditData: any): Promise<AuditLog> {
    const logEntry: InsertAuditLog = {
      userId: auditData.userId || null,
      action: auditData.action,
      resource: auditData.contentId ? 'content' : auditData.resource || null,
      resourceId: auditData.contentId || auditData.resourceId || null,
      details: {
        error: auditData.error || null,
        errorId: auditData.errorId || null,
        platformOriginal: auditData.platformOriginal || null,
        contentType: auditData.contentType || null,
        originalUrl: auditData.originalUrl || null,
        sanitizedUrl: auditData.sanitizedUrl || null,
        finalUrl: auditData.finalUrl || null,
        publishedAt: auditData.publishedAt || null,
        duration: auditData.duration || null,
        timestamp: auditData.timestamp || new Date()
      },
      success: auditData.success || false,
      errorMessage: auditData.error || null,
      duration: auditData.duration || null
    };
    
    const [created] = await db
      .insert(auditLogs)
      .values(logEntry)
      .returning();
    return created;
  }

  async getAuditLogs(filters?: { userId?: string; action?: string; success?: boolean; limit?: number }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    if (filters) {
      const conditions = [];
      if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));
      if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
      if (filters.success !== undefined) conditions.push(eq(auditLogs.success, filters.success));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    const results = await query
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(filters?.limit || 100);
    
    return results;
  }
  
  // Rate limiting operations
  async getRecentPublishActivity(userId: string, timeWindowMs: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.userId, userId),
          eq(auditLogs.action, 'publish_content'),
          eq(auditLogs.success, true),
          gte(auditLogs.createdAt, cutoffTime)
        )
      );
    
    return result?.count || 0;
  }

  // Financial transaction operations
  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [newTransaction] = await db
      .insert(financialTransactions)
      .values(transaction)
      .returning();
    
    // Create audit log entry for transaction creation
    await this.createTransactionAuditLog({
      transactionId: newTransaction.transactionId,
      eventType: 'created',
      newStatus: newTransaction.status,
      systemGenerated: false,
      eventData: { 
        amount: newTransaction.grossAmount,
        type: newTransaction.transactionType,
        method: newTransaction.paymentMethod 
      }
    });

    return newTransaction;
  }

  async getFinancialTransaction(id: string): Promise<FinancialTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.id, id));
    return transaction;
  }

  async getFinancialTransactionByTransactionId(transactionId: string): Promise<FinancialTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.transactionId, transactionId));
    return transaction;
  }

  async getFinancialTransactions(filters: {
    brandId?: string;
    influencerId?: string;
    campaignId?: string;
    proposalId?: string;
    status?: string;
    transactionType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FinancialTransaction[]> {
    let query = db.select().from(financialTransactions);

    // Build where conditions
    const conditions = [];
    if (filters.brandId) conditions.push(eq(financialTransactions.brandId, filters.brandId));
    if (filters.influencerId) conditions.push(eq(financialTransactions.influencerId, filters.influencerId));
    if (filters.campaignId) conditions.push(eq(financialTransactions.campaignId, filters.campaignId));
    if (filters.proposalId) conditions.push(eq(financialTransactions.proposalId, filters.proposalId));
    if (filters.status) conditions.push(eq(financialTransactions.status, filters.status));
    if (filters.transactionType) conditions.push(eq(financialTransactions.transactionType, filters.transactionType));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(sql`created_at DESC`);

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async updateFinancialTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    const previousTransaction = await this.getFinancialTransaction(id);
    
    const [updatedTransaction] = await db
      .update(financialTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(financialTransactions.id, id))
      .returning();

    // Create audit log entry for status changes
    if (previousTransaction && updates.status && previousTransaction.status !== updates.status) {
      await this.createTransactionAuditLog({
        transactionId: updatedTransaction.transactionId,
        eventType: 'status_changed',
        previousStatus: previousTransaction.status,
        newStatus: updates.status,
        systemGenerated: false,
        eventData: { updatedFields: Object.keys(updates) }
      });
    }

    return updatedTransaction;
  }

  // Transaction audit log operations
  async createTransactionAuditLog(auditData: InsertTransactionAuditLog): Promise<TransactionAuditLog> {
    const [auditLog] = await db
      .insert(transactionAuditLog)
      .values(auditData)
      .returning();
    return auditLog;
  }

  async getTransactionAuditLogs(transactionId: string): Promise<TransactionAuditLog[]> {
    return await db
      .select()
      .from(transactionAuditLog)
      .where(eq(transactionAuditLog.transactionId, transactionId))
      .orderBy(sql`event_timestamp DESC`);
  }

  // Payment summary operations
  async getPaymentSummary(userId: string, userType: string, periodType: string, periodStart: Date, periodEnd: Date): Promise<PaymentSummary | undefined> {
    const [summary] = await db
      .select()
      .from(paymentSummaries)
      .where(and(
        eq(paymentSummaries.userId, userId),
        eq(paymentSummaries.userType, userType),
        eq(paymentSummaries.periodType, periodType),
        eq(paymentSummaries.periodStart, periodStart),
        eq(paymentSummaries.periodEnd, periodEnd)
      ));
    return summary;
  }

  async createPaymentSummary(summary: InsertPaymentSummary): Promise<PaymentSummary> {
    const [newSummary] = await db
      .insert(paymentSummaries)
      .values(summary)
      .returning();
    return newSummary;
  }

  async updatePaymentSummary(id: string, updates: Partial<PaymentSummary>): Promise<PaymentSummary> {
    const [updatedSummary] = await db
      .update(paymentSummaries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentSummaries.id, id))
      .returning();
    return updatedSummary;
  }

  async calculatePaymentSummary(userId: string, userType: string, periodStart: Date, periodEnd: Date): Promise<PaymentSummary> {
    // Get all transactions for the user in the period
    const transactions = await db
      .select()
      .from(financialTransactions)
      .where(and(
        userType === 'brand' 
          ? eq(financialTransactions.brandId, userId)
          : eq(financialTransactions.influencerId, userId),
        gte(financialTransactions.createdAt, periodStart),
        sql`${financialTransactions.createdAt} <= ${periodEnd}`
      ));

    // Calculate summary statistics
    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const successRate = totalTransactions > 0 ? (completedTransactions.length / totalTransactions) * 100 : 0;

    const totalGrossAmount = transactions.reduce((sum, t) => sum + parseFloat(t.grossAmount || '0'), 0);
    const totalNetAmount = transactions.reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0);
    const totalFees = transactions.reduce((sum, t) => 
      sum + parseFloat(t.platformFee || '0') + parseFloat(t.processingFee || '0'), 0);
    const totalRefunds = transactions
      .filter(t => t.transactionType === 'refund')
      .reduce((sum, t) => sum + parseFloat(t.grossAmount || '0'), 0);

    const upfrontPayments = transactions
      .filter(t => t.transactionType === 'upfront_payment')
      .reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0);
    const completionPayments = transactions
      .filter(t => t.transactionType === 'completion_payment')
      .reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0);
    const bonusPayments = transactions
      .filter(t => t.transactionType === 'bonus_payment')
      .reduce((sum, t) => sum + parseFloat(t.netAmount || '0'), 0);

    const avgTransactionAmount = totalTransactions > 0 ? totalGrossAmount / totalTransactions : 0;

    // Calculate unique campaigns
    const uniqueCampaigns = new Set(transactions.map(t => t.campaignId).filter(Boolean)).size;

    const summaryData: InsertPaymentSummary = {
      userId,
      userType,
      periodType: 'custom',
      periodStart,
      periodEnd,
      totalTransactions,
      totalGrossAmount: totalGrossAmount.toString(),
      totalNetAmount: totalNetAmount.toString(),
      totalFees: totalFees.toString(),
      totalRefunds: totalRefunds.toString(),
      upfrontPayments: upfrontPayments.toString(),
      completionPayments: completionPayments.toString(),
      bonusPayments: bonusPayments.toString(),
      activeCampaigns: uniqueCampaigns,
      completedCampaigns: uniqueCampaigns, // Simplified for now
      avgTransactionAmount: avgTransactionAmount.toString(),
      successRate: successRate.toString(),
      avgProcessingTime: 0 // Would need to calculate from actual processing times
    };

    return await this.createPaymentSummary(summaryData);
  }

  // Transaction utility functions
  async generateTransactionId(): Promise<string> {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${year}-${random}-${timestamp.toString().slice(-6)}`;
  }

  // Comprehensive financial logging operations
  async logFinancialActivity(activityData: InsertFinancialActivityLog): Promise<FinancialActivityLog> {
    const [newActivity] = await db
      .insert(financialActivityLog)
      .values(activityData)
      .returning();
    return newActivity;
  }

  async getFinancialActivityLogs(filters?: {
    activityType?: string;
    actionCategory?: string;
    userId?: string;
    transactionId?: string;
    campaignId?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<FinancialActivityLog[]> {
    let query = db.select().from(financialActivityLog);
    const conditions: any[] = [];

    if (filters?.activityType) {
      conditions.push(eq(financialActivityLog.activityType, filters.activityType));
    }
    if (filters?.actionCategory) {
      conditions.push(eq(financialActivityLog.actionCategory, filters.actionCategory));
    }
    if (filters?.userId) {
      conditions.push(eq(financialActivityLog.userId, filters.userId));
    }
    if (filters?.transactionId) {
      conditions.push(eq(financialActivityLog.transactionId, filters.transactionId));
    }
    if (filters?.campaignId) {
      conditions.push(eq(financialActivityLog.campaignId, filters.campaignId));
    }
    if (filters?.success !== undefined) {
      conditions.push(eq(financialActivityLog.success, filters.success));
    }
    if (filters?.startDate) {
      conditions.push(gte(financialActivityLog.occurredAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(sql`${financialActivityLog.occurredAt} <= ${filters.endDate}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(sql`occurred_at DESC`) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  // User action logging (approvals, rejections, disputes)
  async logUserAction(data: {
    userId: string;
    action: string;
    description: string;
    campaignId?: string;
    proposalId?: string;
    transactionId?: string;
    amountAffected?: number;
    previousValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<FinancialActivityLog> {
    const activityData: InsertFinancialActivityLog = {
      activityType: 'user_action',
      actionCategory: 'proposal_approval', // Can be customized based on action
      userId: data.userId,
      action: data.action,
      description: data.description,
      campaignId: data.campaignId,
      proposalId: data.proposalId,
      transactionId: data.transactionId,
      amountAffected: data.amountAffected?.toString(),
      previousValue: data.previousValue,
      newValue: data.newValue,
      status: 'completed',
      success: true,
      systemGenerated: false,
      adminAction: false,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
      correlationId: `user-action-${Date.now()}`,
      tags: ['user_action']
    };

    return await this.logFinancialActivity(activityData);
  }

  // System action logging (automated payments, fee calculations)
  async logSystemAction(data: {
    action: string;
    description: string;
    transactionId?: string;
    campaignId?: string;
    userId?: string;
    amountAffected?: number;
    feeCalculation?: any;
    correlationId?: string;
    metadata?: any;
  }): Promise<FinancialActivityLog> {
    const activityData: InsertFinancialActivityLog = {
      activityType: 'system_action',
      actionCategory: data.action.includes('fee') ? 'fee_calculation' : 'payment',
      userId: data.userId,
      action: data.action,
      description: data.description,
      transactionId: data.transactionId,
      campaignId: data.campaignId,
      amountAffected: data.amountAffected?.toString(),
      feeCalculation: data.feeCalculation,
      status: 'completed',
      success: true,
      systemGenerated: true,
      adminAction: false,
      correlationId: data.correlationId || `system-action-${Date.now()}`,
      metadata: data.metadata,
      tags: ['system_action', 'automated']
    };

    return await this.logFinancialActivity(activityData);
  }

  // Admin action logging (manual adjustments, overrides)
  async logAdminAction(data: {
    adminUserId: string;
    action: string;
    description: string;
    targetUserId?: string;
    transactionId?: string;
    campaignId?: string;
    amountAffected?: number;
    previousValue?: string;
    newValue?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<FinancialActivityLog> {
    const activityData: InsertFinancialActivityLog = {
      activityType: 'admin_action',
      actionCategory: 'manual_override',
      userId: data.targetUserId,
      action: data.action,
      description: data.description,
      transactionId: data.transactionId,
      campaignId: data.campaignId,
      amountAffected: data.amountAffected?.toString(),
      previousValue: data.previousValue,
      newValue: data.newValue,
      status: 'completed',
      success: true,
      systemGenerated: false,
      adminAction: true,
      adminUserId: data.adminUserId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      correlationId: `admin-action-${Date.now()}`,
      metadata: {
        ...data.metadata,
        reason: data.reason
      },
      tags: ['admin_action', 'manual_override']
    };

    return await this.logFinancialActivity(activityData);
  }

  // Failed transaction attempt logging
  async logFailedTransaction(data: {
    userId?: string;
    action: string;
    description: string;
    errorCode?: string;
    errorMessage: string;
    amountAttempted?: number;
    retryCount?: number;
    campaignId?: string;
    proposalId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<FinancialActivityLog> {
    const activityData: InsertFinancialActivityLog = {
      activityType: 'transaction',
      actionCategory: 'payment',
      userId: data.userId,
      action: data.action,
      description: data.description,
      campaignId: data.campaignId,
      proposalId: data.proposalId,
      amountAffected: data.amountAttempted?.toString(),
      status: 'failed',
      success: false,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      retryCount: data.retryCount || 0,
      systemGenerated: false,
      adminAction: false,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      correlationId: `failed-transaction-${Date.now()}`,
      metadata: data.metadata,
      tags: ['failed_transaction', 'error']
    };

    return await this.logFinancialActivity(activityData);
  }

  // Financial dispute operations
  async createFinancialDispute(dispute: InsertFinancialDisputeLog): Promise<FinancialDisputeLog> {
    const [newDispute] = await db
      .insert(financialDisputeLog)
      .values(dispute)
      .returning();

    // Log the dispute creation
    await this.logUserAction({
      userId: dispute.initiatedBy,
      action: 'dispute_initiated',
      description: `Financial dispute initiated: ${dispute.title}`,
      transactionId: dispute.transactionId,
      amountAffected: parseFloat(dispute.disputedAmount),
      metadata: {
        disputeId: newDispute.disputeId,
        disputeType: dispute.disputeType,
        severity: dispute.severity
      }
    });

    return newDispute;
  }

  async getFinancialDispute(disputeId: string): Promise<FinancialDisputeLog | undefined> {
    const [dispute] = await db
      .select()
      .from(financialDisputeLog)
      .where(eq(financialDisputeLog.disputeId, disputeId));
    return dispute;
  }

  async getFinancialDisputes(filters?: {
    initiatedBy?: string;
    respondentId?: string;
    transactionId?: string;
    status?: string;
    disputeType?: string;
    limit?: number;
    offset?: number;
  }): Promise<FinancialDisputeLog[]> {
    let query = db.select().from(financialDisputeLog);
    const conditions: any[] = [];

    if (filters?.initiatedBy) {
      conditions.push(eq(financialDisputeLog.initiatedBy, filters.initiatedBy));
    }
    if (filters?.respondentId) {
      conditions.push(eq(financialDisputeLog.respondentId, filters.respondentId));
    }
    if (filters?.transactionId) {
      conditions.push(eq(financialDisputeLog.transactionId, filters.transactionId));
    }
    if (filters?.status) {
      conditions.push(eq(financialDisputeLog.status, filters.status));
    }
    if (filters?.disputeType) {
      conditions.push(eq(financialDisputeLog.disputeType, filters.disputeType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(sql`created_at DESC`) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async updateFinancialDispute(id: string, updates: Partial<FinancialDisputeLog>): Promise<FinancialDisputeLog> {
    const [updatedDispute] = await db
      .update(financialDisputeLog)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(financialDisputeLog.id, id))
      .returning();

    // Log the dispute update
    if (updates.status) {
      await this.logUserAction({
        userId: updates.resolvedBy || 'system',
        action: 'dispute_updated',
        description: `Dispute status changed to: ${updates.status}`,
        transactionId: updatedDispute.transactionId,
        previousValue: updatedDispute.status,
        newValue: updates.status,
        metadata: {
          disputeId: updatedDispute.disputeId,
          resolution: updates.resolution
        }
      });
    }

    return updatedDispute;
  }

  // Invoice operations
  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();

    // Log invoice creation
    await this.logSystemAction({
      action: 'invoice_created',
      description: `Invoice ${invoice.invoiceNumber} created for campaign ${invoice.campaignId}`,
      campaignId: invoice.campaignId,
      userId: invoice.brandId,
      amountAffected: parseFloat(invoice.totalAmount),
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType
      }
    });

    return invoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getInvoices(filters?: {
    brandId?: string;
    influencerId?: string;
    campaignId?: string;
    status?: string;
    invoiceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Invoice[]> {
    // Create aliases for different user joins
    const brandUser = alias(users, 'brandUser');
    const influencerUser = alias(users, 'influencerUser');

    // Select invoices with joined brand and campaign data
    let query = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        brandId: invoices.brandId,
        influencerId: invoices.influencerId,
        campaignId: invoices.campaignId,
        proposalId: invoices.proposalId,
        status: invoices.status,
        invoiceType: invoices.invoiceType,
        subtotalAmount: invoices.subtotalAmount,
        taxAmount: invoices.taxAmount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        taxRegion: invoices.taxRegion,
        taxRate: invoices.taxRate,
        taxType: invoices.taxType,
        taxRegistrationNumber: invoices.taxRegistrationNumber,
        paymentTerms: invoices.paymentTerms,
        paymentDueDate: invoices.paymentDueDate,
        paidAmount: invoices.paidAmount,
        paidAt: invoices.paidAt,
        paymentMethod: invoices.paymentMethod,
        issueDate: invoices.issueDate,
        sentDate: invoices.sentDate,
        pdfPath: invoices.pdfPath,
        pdfGenerated: invoices.pdfGenerated,
        pdfGeneratedAt: invoices.pdfGeneratedAt,
        notes: invoices.notes,
        termsAndConditions: invoices.termsAndConditions,
        footerText: invoices.footerText,
        brandBillingAddress: invoices.brandBillingAddress,
        influencerBillingAddress: invoices.influencerBillingAddress,
        generatedAutomatically: invoices.generatedAutomatically,
        generatedBy: invoices.generatedBy,
        emailSent: invoices.emailSent,
        emailSentAt: invoices.emailSentAt,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        // Add brand and campaign names
        brandName: sql<string>`CONCAT(${brandUser.firstName}, ' ', ${brandUser.lastName})`,
        influencerName: sql<string>`CONCAT(${influencerUser.firstName}, ' ', ${influencerUser.lastName})`,
        campaignTitle: brandCampaigns.title
      })
      .from(invoices)
      .leftJoin(brandUser, eq(invoices.brandId, brandUser.id))
      .leftJoin(influencerUser, eq(invoices.influencerId, influencerUser.id))
      .leftJoin(brandCampaigns, eq(invoices.campaignId, brandCampaigns.id));

    const conditions: any[] = [];

    if (filters?.brandId) {
      conditions.push(eq(invoices.brandId, filters.brandId));
    }
    if (filters?.influencerId) {
      conditions.push(eq(invoices.influencerId, filters.influencerId));
    }
    if (filters?.campaignId) {
      conditions.push(eq(invoices.campaignId, filters.campaignId));
    }
    if (filters?.status) {
      conditions.push(eq(invoices.status, filters.status));
    }
    if (filters?.invoiceType) {
      conditions.push(eq(invoices.invoiceType, filters.invoiceType));
    }
    if (filters?.startDate) {
      conditions.push(gte(invoices.issueDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(gte(filters.endDate, invoices.issueDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(sql`${invoices.issueDate} DESC`) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }

  async getInvoicesByProposal(proposalId: string) {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.proposalId, proposalId));
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();

    // Log significant status changes
    if (updates.status) {
      await this.logSystemAction({
        action: 'invoice_status_updated',
        description: `Invoice ${updatedInvoice.invoiceNumber} status changed to ${updates.status}`,
        campaignId: updatedInvoice.campaignId,
        userId: updatedInvoice.brandId,
        amountAffected: parseFloat(updatedInvoice.totalAmount),
        metadata: {
          invoiceId: updatedInvoice.id,
          newStatus: updates.status
        }
      });
    }

    return updatedInvoice;
  }

  // Invoice items operations
  async createInvoiceItem(itemData: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db
      .insert(invoiceItems)
      .values(itemData)
      .returning();
    return item;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(sql`sort_order ASC`);
  }

  async updateInvoiceItem(id: string, updates: Partial<InvoiceItem>): Promise<InvoiceItem> {
    const [updatedItem] = await db
      .update(invoiceItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoiceItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInvoiceItem(id: string): Promise<void> {
    await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.id, id));
  }

  // Invoice tax calculations operations
  async createInvoiceTaxCalculation(taxData: InsertInvoiceTaxCalculation): Promise<InvoiceTaxCalculation> {
    const [tax] = await db
      .insert(invoiceTaxCalculations)
      .values(taxData)
      .returning();
    return tax;
  }

  async getInvoiceTaxCalculations(invoiceId: string): Promise<InvoiceTaxCalculation[]> {
    return await db
      .select()
      .from(invoiceTaxCalculations)
      .where(eq(invoiceTaxCalculations.invoiceId, invoiceId));
  }

  // Payment milestone operations
  async createPaymentMilestone(milestoneData: InsertPaymentMilestone): Promise<PaymentMilestone> {
    const [milestone] = await db
      .insert(paymentMilestones)
      .values(milestoneData)
      .returning();
    return milestone;
  }

  async getPaymentMilestones(invoiceId: string): Promise<PaymentMilestone[]> {
    return await db
      .select()
      .from(paymentMilestones)
      .where(eq(paymentMilestones.invoiceId, invoiceId))
      .orderBy(paymentMilestones.milestoneNumber);
  }

  async updatePaymentMilestone(id: string, updates: Partial<PaymentMilestone>): Promise<PaymentMilestone> {
    const [updated] = await db
      .update(paymentMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentMilestones.id, id))
      .returning();
    return updated;
  }

  async markMilestoneAsPaid(id: string, paymentData: { paidAmount: number; paidDate: Date; paymentMethod?: string }): Promise<PaymentMilestone> {
    const [updated] = await db
      .update(paymentMilestones)
      .set({
        status: 'paid',
        paidAmount: paymentData.paidAmount.toFixed(2),
        paidDate: paymentData.paidDate,
        paymentMethod: paymentData.paymentMethod,
        updatedAt: new Date()
      })
      .where(eq(paymentMilestones.id, id))
      .returning();
    return updated;
  }

  // Invoice utility operations
  async generateInvoiceFromCampaign(campaignId: string, proposalId: string): Promise<Invoice> {
    // Get campaign and proposal data
    const [campaign, proposal] = await Promise.all([
      this.getBrandCampaign(campaignId),
      this.getCampaignProposal(proposalId)
    ]);

    if (!campaign || !proposal) {
      throw new Error('Campaign or proposal not found');
    }

    // Get brand and influencer data
    const [brand, influencer] = await Promise.all([
      this.getUser(campaign.brandId),
      this.getUser(proposal.influencerId)
    ]);

    if (!brand || !influencer) {
      throw new Error('Brand or influencer not found');
    }

    // Import InvoiceService functions
    const { InvoiceService } = await import('./invoice-service');
    
    // Calculate tax region and tax information
    const taxRegion = InvoiceService.determineTaxRegion(brand);
    const proposedAmount = parseFloat(proposal.proposedCompensation || '0');
    
    // Calculate tax
    const taxCalculation = InvoiceService.calculateTax(proposedAmount, taxRegion);
    
    // Generate invoice number
    const invoiceNumber = InvoiceService.generateInvoiceNumber();
    
    // Calculate payment due date
    const issueDate = new Date();
    const paymentTerms = 'net_30'; // Default to 30 days
    const dueDate = InvoiceService.calculateDueDate(issueDate, paymentTerms);
    
    // Create invoice
    const invoiceData = {
      invoiceNumber,
      campaignId,
      brandId: campaign.brandId,
      influencerId: proposal.influencerId,
      proposalId,
      status: 'draft' as const,
      invoiceType: 'campaign' as const,
      subtotalAmount: taxCalculation.subtotal.toString(),
      taxAmount: taxCalculation.totalTax.toString(),
      totalAmount: taxCalculation.total.toString(),
      currency: 'INR',
      taxRegion,
      taxRate: taxCalculation.taxCalculations.length > 0 ? taxCalculation.taxCalculations[0].rate.toString() : '0',
      taxType: taxCalculation.taxCalculations.length > 0 ? taxCalculation.taxCalculations[0].type : null,
      paymentTerms,
      paymentDueDate: dueDate,
      issueDate,
      notes: `Invoice for campaign collaboration: ${campaign.title}. Brand pays full amount. Platform commission (5%) deducted during payment processing.`,
      termsAndConditions: 'Payment due within 30 days. Late payments may incur fees.',
      generatedAutomatically: true
    };

    const invoice = await this.createInvoice(invoiceData);

    // Create invoice items for deliverables
    const deliverables = campaign.deliverables || [];
    let sortOrder = 0;
    
    for (const deliverable of deliverables) {
      // Calculate amount per deliverable (simple equal division for now)
      const itemAmount = proposedAmount / deliverables.length;
      
      await this.createInvoiceItem({
        invoiceId: invoice.id,
        itemType: 'deliverable',
        description: `${deliverable.type}: ${deliverable.description}`,
        quantity: 1,
        unitPrice: itemAmount.toString(),
        totalPrice: itemAmount.toString(),
        taxable: true,
        sortOrder: sortOrder++
      });
    }

    // If no specific deliverables, create a general campaign item
    if (deliverables.length === 0) {
      await this.createInvoiceItem({
        invoiceId: invoice.id,
        itemType: 'deliverable',
        description: `Campaign collaboration: ${campaign.title}`,
        quantity: 1,
        unitPrice: proposedAmount.toString(),
        totalPrice: proposedAmount.toString(),
        taxable: true,
        sortOrder: 0
      });
    }

    // Create tax calculation records
    for (const tax of taxCalculation.taxCalculations) {
      await this.createInvoiceTaxCalculation({
        invoiceId: invoice.id,
        taxJurisdiction: tax.jurisdiction,
        taxRegion: tax.region,
        taxName: tax.name,
        taxableAmount: tax.taxableAmount.toString(),
        taxRate: tax.rate.toString(),
        taxAmount: tax.amount.toString(),
        taxType: tax.type
      });
    }

    // Update invoice status to 'sent' after creation
    await this.updateInvoice(invoice.id, { status: 'sent', sentDate: new Date() });

    return invoice;
  }

  async markInvoiceAsPaid(invoiceId: string, paymentData: { paidAmount: number; paidAt: Date; paymentMethod: string }): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        status: 'paid',
        paidAmount: paymentData.paidAmount.toString(),
        paidAt: paymentData.paidAt,
        paymentMethod: paymentData.paymentMethod,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    // Log payment completion
    await this.logSystemAction({
      action: 'invoice_paid',
      description: `Invoice ${updatedInvoice.invoiceNumber} marked as paid`,
      campaignId: updatedInvoice.campaignId,
      userId: updatedInvoice.brandId,
      amountAffected: paymentData.paidAmount,
      metadata: {
        invoiceId: updatedInvoice.id,
        paymentMethod: paymentData.paymentMethod
      }
    });

    return updatedInvoice;
  }

  async generateInvoicePDF(invoiceId: string): Promise<string> {
    // Get complete invoice data with items and tax calculations
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const [items, taxCalculations, brand, influencer, campaign] = await Promise.all([
      this.getInvoiceItems(invoiceId),
      this.getInvoiceTaxCalculations(invoiceId),
      this.getUser(invoice.brandId),
      this.getUser(invoice.influencerId),
      this.getBrandCampaign(invoice.campaignId)
    ]);

    if (!brand || !influencer || !campaign) {
      throw new Error('Related data not found for invoice');
    }

    // Import invoice service for PDF generation
    const { InvoiceService } = await import('./invoice-service');

    // Generate PDF
    const pdfBuffer = await InvoiceService.generateInvoicePDF(
      {
        ...invoice,
        items,
        taxCalculations
      },
      brand,
      influencer,
      campaign
    );

    // Create directory for invoices if it doesn't exist
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const invoicesDir = path.join(process.cwd(), 'generated-invoices');
    try {
      await fs.mkdir(invoicesDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }

    // Save PDF to file
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    
    await fs.writeFile(filepath, pdfBuffer);

    // Update invoice with PDF information
    await this.updateInvoice(invoiceId, {
      pdfPath: filepath,
      pdfGenerated: true,
      pdfGeneratedAt: new Date()
    });

    // Log PDF generation
    await this.logSystemAction({
      action: 'invoice_pdf_generated',
      description: `PDF generated for invoice ${invoice.invoiceNumber}`,
      campaignId: invoice.campaignId,
      userId: invoice.brandId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        pdfPath: filepath
      }
    });

    return filepath;
  }

  // Financial reporting operations
  async getFinancialStatement(id: string): Promise<FinancialStatement | undefined> {
    const [statement] = await db.select().from(financialStatements).where(eq(financialStatements.id, id));
    return statement;
  }

  async getFinancialStatementsByUser(userId: string, statementType?: string): Promise<FinancialStatement[]> {
    const conditions = [eq(financialStatements.userId, userId)];
    if (statementType) {
      conditions.push(eq(financialStatements.statementType, statementType));
    }
    return await db.select().from(financialStatements).where(and(...conditions));
  }

  async createFinancialStatement(statement: InsertFinancialStatement): Promise<FinancialStatement> {
    const [newStatement] = await db.insert(financialStatements).values(statement).returning();
    return newStatement;
  }

  async updateFinancialStatement(id: string, updates: Partial<FinancialStatement>): Promise<FinancialStatement> {
    const [updated] = await db
      .update(financialStatements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(financialStatements.id, id))
      .returning();
    return updated;
  }

  // Earnings reports methods
  async getEarningsReportsByUser(userId: string): Promise<any[]> {
    // For now, we'll create earnings reports from campaign payments and financial statements
    // This simulates earnings data until we have a dedicated earnings table
    const payments = await this.getCampaignPayments(undefined, userId);
    const statements = await this.getFinancialStatementsByUser(userId);
    
    // Create earnings summary from payments
    const earnings = [{
      id: `earnings-${userId}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
      userId,
      period: `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      totalEarnings: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
      campaignCount: payments.filter(p => p.status === 'completed').length,
      platformFees: 0,
      generatedAt: new Date(),
      campaignBreakdown: payments
        .filter(p => p.status === 'completed')
        .map(p => ({
          name: p.description || 'Campaign Payment',
          brand: 'Brand Partner',
          earnings: parseFloat(p.amount || '0'),
          status: 'paid'
        }))
    }];

    return earnings;
  }

  async getCampaignPLReport(id: string): Promise<CampaignProfitLossReport | undefined> {
    const [report] = await db.select().from(campaignProfitLossReports).where(eq(campaignProfitLossReports.id, id));
    return report;
  }

  async getCampaignPLReportsByCampaign(campaignId: string): Promise<CampaignProfitLossReport[]> {
    return await db.select().from(campaignProfitLossReports).where(eq(campaignProfitLossReports.campaignId, campaignId));
  }

  async getCampaignPLReportsByBrand(brandId: string): Promise<CampaignProfitLossReport[]> {
    // Get P&L reports
    const reports = await db.select().from(campaignProfitLossReports).where(eq(campaignProfitLossReports.brandId, brandId));
    
    // Get campaign titles for each report
    const reportsWithTitles = await Promise.all(
      reports.map(async (report) => {
        const [campaign] = await db
          .select({ title: brandCampaigns.title })
          .from(brandCampaigns)
          .where(eq(brandCampaigns.id, report.campaignId))
          .limit(1);
        
        return {
          ...report,
          campaignName: campaign?.title || 'Unknown Campaign'
        } as CampaignProfitLossReport & { campaignName: string };
      })
    );
    
    return reportsWithTitles;
  }

  async createCampaignPLReport(report: InsertCampaignProfitLossReport): Promise<CampaignProfitLossReport> {
    const [newReport] = await db.insert(campaignProfitLossReports).values(report).returning();
    return newReport;
  }

  async updateCampaignPLReport(id: string, updates: Partial<CampaignProfitLossReport>): Promise<CampaignProfitLossReport> {
    const [updated] = await db
      .update(campaignProfitLossReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignProfitLossReports.id, id))
      .returning();
    return updated;
  }

  async getPlatformRevenueReport(id: string): Promise<PlatformRevenueReport | undefined> {
    const [report] = await db.select().from(platformRevenueReports).where(eq(platformRevenueReports.id, id));
    return report;
  }

  async getPlatformRevenueReports(reportType?: string): Promise<PlatformRevenueReport[]> {
    if (reportType) {
      return await db.select().from(platformRevenueReports).where(eq(platformRevenueReports.reportType, reportType));
    }
    return await db.select().from(platformRevenueReports);
  }

  async createPlatformRevenueReport(report: InsertPlatformRevenueReport): Promise<PlatformRevenueReport> {
    const [newReport] = await db.insert(platformRevenueReports).values(report).returning();
    return newReport;
  }

  async updatePlatformRevenueReport(id: string, updates: Partial<PlatformRevenueReport>): Promise<PlatformRevenueReport> {
    const [updated] = await db
      .update(platformRevenueReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platformRevenueReports.id, id))
      .returning();
    return updated;
  }

  async getReportTemplate(id: string): Promise<ReportTemplate | undefined> {
    const [template] = await db.select().from(reportTemplates).where(eq(reportTemplates.id, id));
    return template;
  }

  async getReportTemplatesByUser(userId: string, templateType?: string): Promise<ReportTemplate[]> {
    const conditions = [eq(reportTemplates.createdBy, userId)];
    if (templateType) {
      conditions.push(eq(reportTemplates.templateType, templateType));
    }
    return await db.select().from(reportTemplates).where(and(...conditions));
  }

  async getPublicReportTemplates(templateType?: string): Promise<ReportTemplate[]> {
    const conditions = [eq(reportTemplates.isPublic, true)];
    if (templateType) {
      conditions.push(eq(reportTemplates.templateType, templateType));
    }
    return await db.select().from(reportTemplates).where(and(...conditions));
  }

  async createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate> {
    const [newTemplate] = await db.insert(reportTemplates).values(template).returning();
    return newTemplate;
  }

  async updateReportTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const [updated] = await db
      .update(reportTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(reportTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteReportTemplate(id: string): Promise<void> {
    await db.delete(reportTemplates).where(eq(reportTemplates.id, id));
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    await db
      .update(reportTemplates)
      .set({ 
        usageCount: sql`${reportTemplates.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reportTemplates.id, id));
  }

  // Campaign lifecycle management implementations
  async getCampaignMilestones(campaignId: string): Promise<CampaignMilestone[]> {
    const milestones = await db.select().from(campaignMilestones).where(eq(campaignMilestones.campaignId, campaignId));
    
    // Check and fix milestones that should be marked as completed
    // Check if first_application milestone should be completed
    const firstAppMilestone = milestones.find(m => m.milestoneType === 'first_application');
    if (firstAppMilestone && firstAppMilestone.status !== 'completed') {
      const proposals = await this.getCampaignProposals(campaignId);
      if (proposals.length > 0) {
        // Mark the milestone as completed
        await db
          .update(campaignMilestones)
          .set({
            status: 'completed',
            completedDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(campaignMilestones.id, firstAppMilestone.id));
        
        // Update the milestone in the return array
        firstAppMilestone.status = 'completed';
        firstAppMilestone.completedDate = new Date();
      }
    }
    
    return milestones;
  }

  async createCampaignMilestone(milestone: InsertCampaignMilestone): Promise<CampaignMilestone> {
    const [newMilestone] = await db.insert(campaignMilestones).values(milestone).returning();
    return newMilestone;
  }

  async updateCampaignMilestone(id: string, updates: Partial<CampaignMilestone>): Promise<CampaignMilestone> {
    const [updated] = await db
      .update(campaignMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignMilestones.id, id))
      .returning();
    return updated;
  }

  async completeCampaignMilestone(milestoneId: string): Promise<CampaignMilestone> {
    const [updated] = await db
      .update(campaignMilestones)
      .set({ 
        status: 'completed',
        completedDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(campaignMilestones.id, milestoneId))
      .returning();
    return updated;
  }

  async initializeCampaignMilestones(campaignId: string): Promise<CampaignMilestone[]> {
    const defaultMilestones = [
      { campaignId, milestoneType: 'launched', description: 'Campaign launched and live for influencers' },
      { campaignId, milestoneType: 'first_application', description: 'First influencer application received' },
      { campaignId, milestoneType: 'all_approved', description: 'All influencers approved and notified' },
      { campaignId, milestoneType: 'content_submitted', description: 'All content submitted by influencers' },
      { campaignId, milestoneType: 'payment_processed', description: 'All payments processed successfully' },
      { campaignId, milestoneType: 'completed', description: 'Campaign completed successfully' }
    ];

    const milestones = [];
    for (const milestone of defaultMilestones) {
      const [created] = await db.insert(campaignMilestones).values(milestone).returning();
      milestones.push(created);
    }
    return milestones;
  }

  async logCampaignActivity(activity: InsertCampaignActivityLog): Promise<CampaignActivityLog> {
    const [newActivity] = await db.insert(campaignActivityLog).values(activity).returning();
    return newActivity;
  }

  async getCampaignActivityLog(campaignId: string, limit: number = 50): Promise<CampaignActivityLog[]> {
    return await db
      .select()
      .from(campaignActivityLog)
      .where(eq(campaignActivityLog.campaignId, campaignId))
      .orderBy(desc(campaignActivityLog.createdAt))
      .limit(limit);
  }

  async createCampaignNotification(notification: InsertCampaignNotification): Promise<CampaignNotification> {
    const [newNotification] = await db.insert(campaignNotifications).values(notification).returning();
    return newNotification;
  }

  async getCampaignNotifications(recipientId: string, status?: string): Promise<CampaignNotification[]> {
    const conditions = [eq(campaignNotifications.recipientId, recipientId)];
    if (status) {
      conditions.push(eq(campaignNotifications.status, status));
    }
    return await db
      .select()
      .from(campaignNotifications)
      .where(and(...conditions))
      .orderBy(desc(campaignNotifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<CampaignNotification> {
    const [updated] = await db
      .update(campaignNotifications)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(eq(campaignNotifications.id, notificationId))
      .returning();
    return updated;
  }

  async sendAutomatedNotifications(campaignId: string, notificationType: string): Promise<void> {
    // Get campaign and related users
    const campaign = await this.getBrandCampaign(campaignId);
    if (!campaign) return;

    const proposals = await this.getCampaignProposals(campaignId);
    const influencerIds = proposals.filter(p => p.status === 'approved').map(p => p.influencerId);

    let notificationTitle = '';
    let notificationMessage = '';

    switch (notificationType) {
      case 'campaign_launched':
        notificationTitle = 'Campaign Launched';
        notificationMessage = `Campaign "${campaign.title}" is now live and accepting applications.`;
        break;
      case 'campaign_paused':
        notificationTitle = 'Campaign Paused';
        notificationMessage = `Campaign "${campaign.title}" has been paused temporarily.`;
        break;
      case 'campaign_resumed':
        notificationTitle = 'Campaign Resumed';
        notificationMessage = `Campaign "${campaign.title}" is active again.`;
        break;
      case 'campaign_completed':
        notificationTitle = 'Campaign Completed';
        notificationMessage = `Campaign "${campaign.title}" has been completed. Please review final deliverables.`;
        break;
    }

    // Send notifications to all relevant influencers
    for (const influencerId of influencerIds) {
      await this.createCampaignNotification({
        campaignId,
        recipientId: influencerId,
        notificationType,
        title: notificationTitle,
        message: notificationMessage,
        priority: 'normal'
      });
    }

    // Send notification to brand owner
    await this.createCampaignNotification({
      campaignId,
      recipientId: campaign.brandId,
      notificationType,
      title: notificationTitle,
      message: notificationMessage,
      priority: 'normal'
    });
  }

  async getCampaignAutomationRules(campaignId?: string, brandId?: string): Promise<CampaignAutomationRule[]> {
    const conditions = [];
    if (campaignId) conditions.push(eq(campaignAutomationRules.campaignId, campaignId));
    if (brandId) conditions.push(eq(campaignAutomationRules.brandId, brandId));
    
    return await db
      .select()
      .from(campaignAutomationRules)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async createCampaignAutomationRule(rule: InsertCampaignAutomationRule): Promise<CampaignAutomationRule> {
    const [newRule] = await db.insert(campaignAutomationRules).values(rule).returning();
    return newRule;
  }

  async updateCampaignAutomationRule(id: string, updates: Partial<CampaignAutomationRule>): Promise<CampaignAutomationRule> {
    const [updated] = await db
      .update(campaignAutomationRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignAutomationRules.id, id))
      .returning();
    return updated;
  }

  async triggerCampaignAutomation(campaignId: string): Promise<void> {
    const rules = await this.getCampaignAutomationRules(campaignId);
    const campaign = await this.getBrandCampaign(campaignId);
    
    if (!campaign) return;

    for (const rule of rules) {
      if (!rule.isActive) continue;

      let shouldTrigger = false;

      // Check trigger conditions
      switch (rule.triggerCondition) {
        case 'date_reached':
          const targetDate = new Date(rule.triggerValue || '');
          shouldTrigger = new Date() >= targetDate;
          break;
        case 'status_changed':
          shouldTrigger = campaign.status === rule.triggerValue;
          break;
        case 'manual':
          shouldTrigger = true;
          break;
      }

      if (shouldTrigger) {
        // Execute actions
        switch (rule.actionType) {
          case 'change_status':
            const newStatus = rule.actionParameters?.status;
            if (newStatus) {
              await this.updateBrandCampaign(campaignId, { status: newStatus });
            }
            break;
          case 'send_notification':
            const notificationType = rule.actionParameters?.notificationType;
            if (notificationType) {
              await this.sendAutomatedNotifications(campaignId, notificationType);
            }
            break;
          case 'process_payment':
            // Trigger payment processing logic
            break;
        }

        // Update rule trigger count
        await this.updateCampaignAutomationRule(rule.id, {
          lastTriggered: new Date(),
          triggerCount: (rule.triggerCount || 0) + 1
        });
      }
    }
  }

  // Enhanced campaign status management with activity logging
  async pauseCampaign(campaignId: string, userId: string): Promise<BrandCampaign> {
    const campaign = await this.getBrandCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const updated = await this.updateBrandCampaign(campaignId, { status: 'paused' });

    // Log activity
    await this.logCampaignActivity({
      campaignId,
      userId,
      activityType: 'status_change',
      activityDescription: `Campaign paused by user`,
      previousState: { status: campaign.status },
      newState: { status: 'paused' }
    });

    // Send notifications
    await this.sendAutomatedNotifications(campaignId, 'campaign_paused');

    return updated;
  }

  async resumeCampaign(campaignId: string, userId: string): Promise<BrandCampaign> {
    const campaign = await this.getBrandCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const updated = await this.updateBrandCampaign(campaignId, { status: 'active' });

    // Log activity
    await this.logCampaignActivity({
      campaignId,
      userId,
      activityType: 'status_change',
      activityDescription: `Campaign resumed by user`,
      previousState: { status: campaign.status },
      newState: { status: 'active' }
    });

    // Send notifications
    await this.sendAutomatedNotifications(campaignId, 'campaign_resumed');

    return updated;
  }

  async archiveCampaign(campaignId: string, userId: string): Promise<BrandCampaign> {
    const campaign = await this.getBrandCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const updated = await this.updateBrandCampaign(campaignId, { status: 'archived' });

    // Log activity
    await this.logCampaignActivity({
      campaignId,
      userId,
      activityType: 'status_change',
      activityDescription: `Campaign archived by user`,
      previousState: { status: campaign.status },
      newState: { status: 'archived' }
    });

    return updated;
  }

  // Proposal milestone operations
  async getProposalMilestones(proposalId: string): Promise<ProposalMilestone[]> {
    return await db
      .select()
      .from(proposalMilestones)
      .where(eq(proposalMilestones.proposalId, proposalId))
      .orderBy(proposalMilestones.order);
  }

  async getProposalMilestone(milestoneId: string): Promise<ProposalMilestone | undefined> {
    const [milestone] = await db
      .select()
      .from(proposalMilestones)
      .where(eq(proposalMilestones.id, milestoneId));
    return milestone;
  }

  async createProposalMilestone(proposalId: string, milestone: any): Promise<ProposalMilestone> {
    const milestoneData: InsertProposalMilestone = {
      proposalId,
      campaignId: milestone.campaignId || '',
      influencerId: milestone.influencerId || '',
      title: milestone.title,
      description: milestone.description,
      type: milestone.type || 'custom',
      order: milestone.order,
      estimatedHours: milestone.estimatedHours || '1.00',
      status: milestone.status || 'pending',
      retryCount: milestone.retryCount || 0,
      maxRetries: milestone.maxRetries || 3,
      metadata: milestone.metadata ? JSON.stringify(milestone.metadata) : undefined
    };

    const [created] = await db
      .insert(proposalMilestones)
      .values(milestoneData)
      .returning();

    if (!created) {
      throw new Error('Failed to create proposal milestone');
    }

    return created;
  }

  async updateProposalMilestone(id: string, updates: Partial<ProposalMilestone>): Promise<ProposalMilestone> {
    const [updated] = await db
      .update(proposalMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposalMilestones.id, id))
      .returning();

    if (!updated) {
      throw new Error('Proposal milestone not found');
    }

    return updated;
  }

  async completeProposalMilestone(milestoneId: string, metadata?: any): Promise<ProposalMilestone> {
    const updateData: any = {
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    // Add metadata if provided
    if (metadata) {
      updateData.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
      if (metadata.completedBy) updateData.completedBy = metadata.completedBy;
    }

    const [milestone] = await db
      .update(proposalMilestones)
      .set(updateData)
      .where(eq(proposalMilestones.id, milestoneId))
      .returning();
      
    if (!milestone) {
      throw new Error('Proposal milestone not found');
    }

    return milestone;
  }

  async initializeProposalMilestones(proposalId: string, campaignId: string, influencerId: string): Promise<ProposalMilestone[]> {
    const defaultMilestones = [
      { title: 'Script Writing', type: 'script_writing', order: 1, estimatedHours: '2.00' },
      { title: 'Content Creation', type: 'filming', order: 2, estimatedHours: '4.00' },
      { title: 'Editing', type: 'editing', order: 3, estimatedHours: '3.00' },
      { title: 'Review & Revisions', type: 'review', order: 4, estimatedHours: '1.00' },
      { title: 'Publishing', type: 'posting', order: 5, estimatedHours: '0.50' },
    ];

    const milestones: InsertProposalMilestone[] = defaultMilestones.map(milestone => ({
      proposalId,
      campaignId,
      influencerId,
      ...milestone,
    }));

    const created = await db
      .insert(proposalMilestones)
      .values(milestones)
      .returning();

    return created;
  }

  async updateMilestoneUrgency(proposalId: string): Promise<void> {
    const now = new Date();
    const urgentThreshold = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

    await db
      .update(proposalMilestones)
      .set({ 
        isUrgent: true, 
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(proposalMilestones.proposalId, proposalId),
          eq(proposalMilestones.status, 'pending'),
          sql`${proposalMilestones.dueDate} <= ${urgentThreshold}`
        )
      );
  }

  // Time tracking operations
  async getTimeTrackingSessions(proposalId?: string, milestoneId?: string): Promise<TimeTrackingSession[]> {
    const conditions = [];
    if (proposalId) conditions.push(eq(timeTrackingSessions.proposalId, proposalId));
    if (milestoneId) conditions.push(eq(timeTrackingSessions.milestoneId, milestoneId));
    
    return await db
      .select()
      .from(timeTrackingSessions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(timeTrackingSessions.createdAt));
  }

  async createTimeTrackingSession(session: InsertTimeTrackingSession): Promise<TimeTrackingSession> {
    const [created] = await db
      .insert(timeTrackingSessions)
      .values(session)
      .returning();

    if (!created) {
      throw new Error('Failed to create time tracking session');
    }

    return created;
  }

  async updateTimeTrackingSession(id: string, updates: Partial<TimeTrackingSession>): Promise<TimeTrackingSession> {
    const [updated] = await db
      .update(timeTrackingSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(timeTrackingSessions.id, id))
      .returning();

    if (!updated) {
      throw new Error('Time tracking session not found');
    }

    return updated;
  }

  async startTimeTracking(milestoneId: string, proposalId: string, influencerId: string, description?: string): Promise<TimeTrackingSession> {
    // Stop any active session first
    const activeSessions = await db
      .select()
      .from(timeTrackingSessions)
      .where(
        and(
          eq(timeTrackingSessions.influencerId, influencerId),
          eq(timeTrackingSessions.isActive, true)
        )
      );

    for (const activeSession of activeSessions) {
      await this.stopTimeTracking(activeSession.id);
    }

    const [session] = await db
      .insert(timeTrackingSessions)
      .values({
        milestoneId,
        proposalId,
        influencerId,
        startTime: new Date(),
        description,
        isActive: true,
      })
      .returning();

    if (!session) {
      throw new Error('Failed to start time tracking session');
    }

    return session;
  }

  async stopTimeTracking(sessionId: string): Promise<TimeTrackingSession> {
    const now = new Date();
    
    // Get the session first to calculate duration
    const [session] = await db
      .select()
      .from(timeTrackingSessions)
      .where(eq(timeTrackingSessions.id, sessionId));

    if (!session) {
      throw new Error('Time tracking session not found');
    }

    const duration = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

    const [updated] = await db
      .update(timeTrackingSessions)
      .set({ 
        endTime: now,
        duration,
        isActive: false,
        updatedAt: now
      })
      .where(eq(timeTrackingSessions.id, sessionId))
      .returning();

    if (!updated) {
      throw new Error('Failed to stop time tracking session');
    }

    return updated;
  }

  async pauseTimeTracking(sessionId: string): Promise<TimeTrackingSession> {
    const [updated] = await db
      .update(timeTrackingSessions)
      .set({ 
        pausedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(timeTrackingSessions.id, sessionId))
      .returning();

    if (!updated) {
      throw new Error('Time tracking session not found');
    }

    return updated;
  }

  async resumeTimeTracking(sessionId: string): Promise<TimeTrackingSession> {
    const [updated] = await db
      .update(timeTrackingSessions)
      .set({ 
        resumedAt: new Date(),
        pausedAt: null,
        updatedAt: new Date()
      })
      .where(eq(timeTrackingSessions.id, sessionId))
      .returning();

    if (!updated) {
      throw new Error('Time tracking session not found');
    }

    return updated;
  }

  async getActiveTimeSession(influencerId: string): Promise<TimeTrackingSession | undefined> {
    const [session] = await db
      .select()
      .from(timeTrackingSessions)
      .where(
        and(
          eq(timeTrackingSessions.influencerId, influencerId),
          eq(timeTrackingSessions.isActive, true)
        )
      );

    return session;
  }

  async getTotalTimeSpent(proposalId: string): Promise<number> {
    const sessions = await db
      .select()
      .from(timeTrackingSessions)
      .where(eq(timeTrackingSessions.proposalId, proposalId));

    return sessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);
  }

  // Campaign progress tracking operations
  async getCampaignProgressStage(proposalId: string): Promise<CampaignProgressStage | undefined> {
    const [stage] = await db
      .select()
      .from(campaignProgressStages)
      .where(eq(campaignProgressStages.proposalId, proposalId));

    return stage;
  }

  async createCampaignProgressStage(stage: InsertCampaignProgressStage): Promise<CampaignProgressStage> {
    const [created] = await db
      .insert(campaignProgressStages)
      .values(stage)
      .returning();

    if (!created) {
      throw new Error('Failed to create campaign progress stage');
    }

    return created;
  }

  async updateCampaignProgressStage(proposalId: string, updates: Partial<CampaignProgressStage>): Promise<CampaignProgressStage> {
    const [updated] = await db
      .update(campaignProgressStages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignProgressStages.proposalId, proposalId))
      .returning();

    if (!updated) {
      throw new Error('Campaign progress stage not found');
    }

    return updated;
  }

  async updateStageProgress(proposalId: string, stage: string, progress: number): Promise<CampaignProgressStage> {
    const progressField = `${stage}Progress` as keyof CampaignProgressStage;
    
    const [updated] = await db
      .update(campaignProgressStages)
      .set(sql`${sql.identifier(progressField)} = ${progress}, updated_at = ${new Date()}`)
      .where(eq(campaignProgressStages.proposalId, proposalId))
      .returning();

    if (!updated) {
      throw new Error('Campaign progress stage not found');
    }

    return updated;
  }

  async advanceToNextStage(proposalId: string, currentStage: string): Promise<CampaignProgressStage> {
    const stageOrder = ['content_creation', 'submission', 'review', 'approval', 'payment', 'completed'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : 'completed';

    const [updated] = await db
      .update(campaignProgressStages)
      .set({ 
        currentStage: nextStage,
        updatedAt: new Date()
      })
      .where(eq(campaignProgressStages.proposalId, proposalId))
      .returning();

    if (!updated) {
      throw new Error('Campaign progress stage not found');
    }

    return updated;
  }

  async calculateOverallProgress(proposalId: string): Promise<number> {
    const stage = await this.getCampaignProgressStage(proposalId);
    
    if (!stage) {
      return 0;
    }

    const totalProgress = (
      (stage.contentCreationProgress || 0) +
      (stage.submissionProgress || 0) +
      (stage.reviewProgress || 0) +
      (stage.approvalProgress || 0) +
      (stage.paymentProgress || 0)
    ) / 5;

    // Update the overall progress
    await this.updateCampaignProgressStage(proposalId, { overallProgress: Math.round(totalProgress) });

    return Math.round(totalProgress);
  }
}

export const storage = new DatabaseStorage();
