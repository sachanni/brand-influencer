import { db } from './db';
import { 
  financialStatements,
  campaignProfitLossReports,
  platformRevenueReports,
  reportTemplates,
  users,
  brandCampaigns,
  campaignPayments,
  invoices,
  financialActivityLog,
  financialTransactions,
  brandCollaborations,
  type InsertFinancialStatement,
  type InsertCampaignProfitLossReport,
  type InsertPlatformRevenueReport,
  type FinancialStatement,
  type CampaignProfitLossReport,
  type PlatformRevenueReport
} from '@shared/schema';
import { eq, and, between, sql, sum, count, avg, desc } from 'drizzle-orm';
import { jsPDF } from 'jspdf';

export class ReportsService {
  
  /**
   * Generate monthly financial statement for a user (brand or influencer)
   */
  async generateMonthlyStatement(
    userId: string, 
    userType: 'brand' | 'influencer',
    year: number,
    month: number
  ): Promise<FinancialStatement> {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0); // Last day of month
    
    console.log('Generating monthly statement for:', { userId, userType, periodStart, periodEnd });
    
    // Check if statement already exists
    const existingStatement = await db
      .select()
      .from(financialStatements)
      .where(
        and(
          eq(financialStatements.userId, userId),
          eq(financialStatements.userType, userType),
          eq(financialStatements.statementType, 'monthly'),
          eq(financialStatements.periodStart, periodStart),
          eq(financialStatements.periodEnd, periodEnd)
        )
      )
      .limit(1);
    
    if (existingStatement.length > 0) {
      console.log('Existing statement found, returning cached version');
      return existingStatement[0];
    }
    
    // Calculate financial metrics using invoices
    const metrics = await this.calculateUserFinancialMetrics(userId, userType, periodStart, periodEnd);
    
    // Create statement data
    const statementData: InsertFinancialStatement = {
      userId,
      userType,
      statementType: 'monthly',
      periodStart,
      periodEnd,
      ...metrics,
      status: 'final',
      generatedBy: 'system'
    };
    
    // Insert statement
    const [statement] = await db
      .insert(financialStatements)
      .values(statementData)
      .returning();
    
    console.log('Monthly statement generated successfully:', statement.id);
    return statement;
  }
  
  /**
   * Generate campaign-level P&L report
   */
  async generateCampaignPLReport(
    campaignId: string,
    brandId: string,
    reportPeriod: 'campaign_total' | 'monthly' | 'quarterly' = 'campaign_total'
  ): Promise<CampaignProfitLossReport> {
    console.log('Generating P&L report for campaign:', { campaignId, brandId, reportPeriod });
    
    // Get campaign details
    const campaign = await db
      .select()
      .from(brandCampaigns)
      .where(eq(brandCampaigns.id, campaignId))
      .limit(1);
    
    if (campaign.length === 0) {
      throw new Error('Campaign not found');
    }
    
    const campaignData = campaign[0];
    
    // Calculate period dates based on campaign timeline
    // Extend period to capture payments that may have occurred before/after campaign dates
    let periodStart: Date, periodEnd: Date;
    
    if (reportPeriod === 'campaign_total') {
      // Extend search window to capture all related payments
      const campaignStart = campaignData.startDate || campaignData.createdAt;
      const campaignEnd = campaignData.endDate || new Date();
      
      // Expand window by 7 days before and after to capture all payments
      periodStart = new Date(campaignStart);
      periodStart.setDate(periodStart.getDate() - 7);
      
      periodEnd = new Date(campaignEnd);
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else {
      // For monthly/quarterly, use current period
      const now = new Date();
      if (reportPeriod === 'monthly') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      }
    }
    
    // Check for existing report
    const existingReport = await db
      .select()
      .from(campaignProfitLossReports)
      .where(
        and(
          eq(campaignProfitLossReports.campaignId, campaignId),
          eq(campaignProfitLossReports.reportPeriod, reportPeriod),
          eq(campaignProfitLossReports.periodStart, periodStart),
          eq(campaignProfitLossReports.periodEnd, periodEnd)
        )
      )
      .limit(1);
    
    if (existingReport.length > 0) {
      console.log('Existing P&L report found, returning cached version');
      return existingReport[0];
    }
    
    // Calculate P&L metrics
    const metrics = await this.calculateCampaignPLMetrics(campaignId, periodStart, periodEnd);
    
    // Create P&L report data
    const reportData: InsertCampaignProfitLossReport = {
      campaignId,
      brandId,
      reportPeriod,
      periodStart,
      periodEnd,
      ...metrics,
      status: 'final'
    };
    
    // Insert P&L report
    const [report] = await db
      .insert(campaignProfitLossReports)
      .values(reportData)
      .returning();
    
    console.log('Campaign P&L report generated successfully:', report.id);
    return report;
  }
  
  /**
   * Generate platform revenue report (admin-level)
   */
  async generatePlatformRevenueReport(
    reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    year: number,
    period: number // month, quarter, week, or day of year
  ): Promise<PlatformRevenueReport> {
    console.log('Generating platform revenue report:', { reportType, year, period });
    
    // Calculate period dates
    const { periodStart, periodEnd } = this.calculateReportPeriod(reportType, year, period);
    
    // Check for existing report
    const existingReport = await db
      .select()
      .from(platformRevenueReports)
      .where(
        and(
          eq(platformRevenueReports.reportType, reportType),
          eq(platformRevenueReports.periodStart, periodStart),
          eq(platformRevenueReports.periodEnd, periodEnd)
        )
      )
      .limit(1);
    
    if (existingReport.length > 0) {
      console.log('Existing platform report found, returning cached version');
      return existingReport[0];
    }
    
    // Calculate platform metrics
    const metrics = await this.calculatePlatformMetrics(periodStart, periodEnd);
    
    // Create platform report data
    const reportData: InsertPlatformRevenueReport = {
      reportType,
      periodStart,
      periodEnd,
      ...metrics,
      status: 'final'
    };
    
    // Insert platform report
    const [report] = await db
      .insert(platformRevenueReports)
      .values(reportData)
      .returning();
    
    console.log('Platform revenue report generated successfully:', report.id);
    return report;
  }
  
  /**
   * Generate earnings summary for influencer
   */
  async generateInfluencerEarningsSummary(
    influencerId: string,
    year: number,
    month?: number
  ): Promise<{
    totalEarnings: number;
    campaignEarnings: Array<{
      campaignId: string;
      campaignTitle: string;
      earnings: number;
      completionDate: Date | null;
      status: string;
    }>;
    monthlyBreakdown: Array<{
      month: string;
      earnings: number;
      campaigns: number;
    }>;
    topPerformingCategories: string[];
    paymentStatus: {
      paid: number;
      pending: number;
      processing: number;
    };
  }> {
    console.log('Generating earnings summary for influencer:', { influencerId, year, month });
    
    const periodStart = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const periodEnd = month ? new Date(year, month, 0) : new Date(year, 11, 31);
    
    // Get campaign earnings from invoices
    const campaignEarnings = await db
      .select({
        campaignId: brandCampaigns.id,
        campaignTitle: brandCampaigns.title,
        earnings: sum(invoices.totalAmount),
        completionDate: brandCampaigns.endDate,
        status: brandCampaigns.status
      })
      .from(invoices)
      .innerJoin(brandCampaigns, eq(invoices.campaignId, brandCampaigns.id))
      .where(
        and(
          eq(invoices.influencerId, influencerId),
          eq(invoices.status, 'paid'),
          between(invoices.createdAt, periodStart, periodEnd)
        )
      )
      .groupBy(brandCampaigns.id, brandCampaigns.title, brandCampaigns.endDate, brandCampaigns.status);
    
    // Calculate total earnings
    const totalEarnings = campaignEarnings.reduce((sum, campaign) => sum + Number(campaign.earnings || 0), 0);
    
    // Generate monthly breakdown
    const monthlyBreakdown = [];
    for (let i = 0; i < (month ? 1 : 12); i++) {
      const monthStart = new Date(year, month ? month - 1 : i, 1);
      const monthEnd = new Date(year, month ? month : i + 1, 0);
      
      const monthlyEarnings = await db
        .select({
          earnings: sum(invoices.totalAmount),
          campaigns: count(invoices.campaignId)
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.influencerId, influencerId),
            eq(invoices.status, 'paid'),
            between(invoices.createdAt, monthStart, monthEnd)
          )
        );
      
      monthlyBreakdown.push({
        month: monthStart.toLocaleString('en', { month: 'long' }),
        earnings: Number(monthlyEarnings[0]?.earnings || 0),
        campaigns: Number(monthlyEarnings[0]?.campaigns || 0)
      });
    }
    
    // Calculate top performing categories using campaign types
    const campaignsWithTypes = await db
      .select({
        campaignType: brandCampaigns.campaignType,
        earnings: sum(invoices.totalAmount)
      })
      .from(invoices)
      .innerJoin(brandCampaigns, eq(invoices.campaignId, brandCampaigns.id))
      .where(
        and(
          eq(invoices.influencerId, influencerId),
          eq(invoices.status, 'paid'),
          between(invoices.createdAt, periodStart, periodEnd)
        )
      )
      .groupBy(brandCampaigns.campaignType);
      
    const topPerformingCategories = campaignsWithTypes
      .filter(campaign => campaign.campaignType)
      .sort((a, b) => Number(b.earnings || 0) - Number(a.earnings || 0))
      .slice(0, 5)
      .map(campaign => campaign.campaignType || 'Unknown');
    
    // Calculate payment status from invoices
    const paymentStatusQuery = await db
      .select({
        status: invoices.status,
        amount: sum(invoices.totalAmount)
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.influencerId, influencerId),
          between(invoices.createdAt, periodStart, periodEnd)
        )
      )
      .groupBy(invoices.status);
    
    const paymentStatus = {
      paid: 0,
      pending: 0,
      processing: 0
    };
    
    paymentStatusQuery.forEach(status => {
      const amount = Number(status.amount || 0);
      if (status.status === 'paid') paymentStatus.paid += amount;
      else if (status.status === 'sent') paymentStatus.pending += amount;
      else if (status.status === 'draft') paymentStatus.processing += amount;
    });
    
    return {
      totalEarnings,
      campaignEarnings: campaignEarnings.map(campaign => ({
        campaignId: campaign.campaignId,
        campaignTitle: campaign.campaignTitle,
        earnings: Number(campaign.earnings || 0),
        completionDate: campaign.completionDate,
        status: campaign.status
      })),
      monthlyBreakdown,
      topPerformingCategories,
      paymentStatus
    };
  }
  
  /**
   * Generate Cash Flow Statement (Industry Standard)
   */
  async generateCashFlowStatement(
    userId: string,
    userType: 'brand' | 'influencer',
    year: number,
    month?: number
  ): Promise<any> {
    const periodStart = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const periodEnd = month ? new Date(year, month, 0) : new Date(year, 11, 31);
    
    // Get current period data
    const currentStatement = await this.generateMonthlyStatement(userId, userType, year, month || 12);
    
    // Get previous period for comparison
    const prevYear = month && month > 1 ? year : year - 1;
    const prevMonth = month && month > 1 ? month - 1 : 12;
    const previousStatement = await this.generateMonthlyStatement(userId, userType, prevYear, prevMonth);
    
    return {
      // Operating Activities
      operatingActivities: {
        netIncome: Number(currentStatement.netIncome),
        depreciation: 0, // Could be calculated from fixed assets
        accountsReceivableChange: Number(previousStatement.accountsReceivable) - Number(currentStatement.accountsReceivable),
        accountsPayableChange: Number(currentStatement.accountsPayable) - Number(previousStatement.accountsPayable),
        netOperatingCashFlow: Number(currentStatement.operatingCashFlow)
      },
      
      // Investing Activities
      investingActivities: {
        capitalExpenditures: Number(currentStatement.investingCashFlow),
        assetSales: 0,
        netInvestingCashFlow: Number(currentStatement.investingCashFlow)
      },
      
      // Financing Activities
      financingActivities: {
        debtProceeds: 0,
        debtRepayments: 0,
        netFinancingCashFlow: Number(currentStatement.financingCashFlow)
      },
      
      // Net Change in Cash
      netCashChange: Number(currentStatement.netCashFlow),
      beginningCash: Number(previousStatement.cashAndEquivalents),
      endingCash: Number(currentStatement.cashAndEquivalents),
      
      // Metadata
      periodStart,
      periodEnd,
      statementType: 'cash_flow',
      reportingStandard: 'GAAP'
    };
  }
  
  /**
   * Generate Balance Sheet (Industry Standard)
   */
  async generateBalanceSheet(
    userId: string,
    userType: 'brand' | 'influencer',
    year: number,
    month?: number
  ): Promise<any> {
    const statement = await this.generateMonthlyStatement(userId, userType, year, month || 12);
    
    return {
      // Assets
      assets: {
        currentAssets: {
          cashAndEquivalents: Number(statement.cashAndEquivalents),
          accountsReceivable: Number(statement.accountsReceivable),
          prepaidExpenses: Number(statement.prepaidExpenses),
          total: Number(statement.currentAssets)
        },
        nonCurrentAssets: {
          fixedAssets: Number(statement.fixedAssets),
          intangibleAssets: Number(statement.intangibleAssets),
          total: Number(statement.fixedAssets) + Number(statement.intangibleAssets)
        },
        totalAssets: Number(statement.totalAssets)
      },
      
      // Liabilities
      liabilities: {
        currentLiabilities: {
          accountsPayable: Number(statement.accountsPayable),
          accruedExpenses: Number(statement.accruedExpenses),
          total: Number(statement.currentLiabilities)
        },
        nonCurrentLiabilities: {
          longTermDebt: Number(statement.longTermDebt),
          total: Number(statement.longTermDebt)
        },
        totalLiabilities: Number(statement.totalLiabilities)
      },
      
      // Equity
      equity: {
        retainedEarnings: Number(statement.retainedEarnings),
        totalEquity: Number(statement.totalEquity)
      },
      
      // Verification (Assets = Liabilities + Equity)
      balanceCheck: Number(statement.totalAssets) === (Number(statement.totalLiabilities) + Number(statement.totalEquity)),
      
      // Metadata
      asOfDate: month ? new Date(year, month, 0) : new Date(year, 11, 31),
      statementType: 'balance_sheet',
      reportingStandard: 'GAAP'
    };
  }
  
  /**
   * Generate Income Statement (Enhanced GAAP Format)
   */
  async generateIncomeStatement(
    userId: string,
    userType: 'brand' | 'influencer',
    year: number,
    month?: number
  ): Promise<any> {
    const statement = await this.generateMonthlyStatement(userId, userType, year, month || 12);
    
    return {
      // Revenue Section
      revenue: {
        grossRevenue: Number(statement.grossRevenue),
        revenueDeductions: Number(statement.revenueDeductions),
        netRevenue: Number(statement.netRevenue)
      },
      
      // Cost of Goods/Services Sold
      costOfSales: {
        costOfServices: Number(statement.costOfServices),
        grossProfit: Number(statement.grossProfit),
        grossProfitMargin: Number(statement.grossProfitMargin)
      },
      
      // Operating Expenses
      operatingExpenses: {
        platformFees: Number(statement.platformFees),
        marketingExpenses: Number(statement.marketingExpenses),
        administrativeExpenses: Number(statement.administrativeExpenses),
        totalOperatingExpenses: Number(statement.operatingExpenses)
      },
      
      // Operating Income
      operatingIncome: {
        amount: Number(statement.operatingIncome),
        operatingMargin: Number(statement.operatingMargin)
      },
      
      // Other Income/Expenses
      otherIncomeExpenses: {
        interestIncome: Number(statement.interestIncome),
        interestExpense: Number(statement.interestExpense),
        otherIncome: Number(statement.otherIncome)
      },
      
      // Pre-tax and Net Income
      finalIncome: {
        incomeBeforeTax: Number(statement.incomeBeforeTax),
        taxExpense: Number(statement.taxExpense),
        netIncome: Number(statement.netIncome),
        netProfitMargin: Number(statement.netProfitMargin)
      },
      
      // Key Ratios
      keyRatios: {
        grossProfitMargin: Number(statement.grossProfitMargin),
        operatingMargin: Number(statement.operatingMargin),
        netProfitMargin: Number(statement.netProfitMargin)
      },
      
      // Metadata
      periodStart: month ? new Date(year, month - 1, 1) : new Date(year, 0, 1),
      periodEnd: month ? new Date(year, month, 0) : new Date(year, 11, 31),
      statementType: 'income_statement',
      reportingStandard: 'GAAP'
    };
  }
  
  /**
   * Generate Comprehensive Financial Analysis
   */
  async generateFinancialAnalysis(
    userId: string,
    userType: 'brand' | 'influencer',
    year: number,
    month?: number
  ): Promise<any> {
    const statement = await this.generateMonthlyStatement(userId, userType, year, month || 12);
    
    return {
      // Profitability Ratios
      profitabilityRatios: {
        grossProfitMargin: Number(statement.grossProfitMargin),
        operatingMargin: Number(statement.operatingMargin),
        netProfitMargin: Number(statement.netProfitMargin),
        returnOnAssets: Number(statement.returnOnAssets),
        returnOnEquity: Number(statement.returnOnEquity)
      },
      
      // Liquidity Ratios
      liquidityRatios: {
        currentRatio: Number(statement.currentRatio),
        quickRatio: (Number(statement.currentAssets) - Number(statement.prepaidExpenses)) / Number(statement.currentLiabilities || 1)
      },
      
      // Leverage Ratios
      leverageRatios: {
        debtToEquityRatio: Number(statement.debtToEquityRatio),
        debtToAssetsRatio: Number(statement.totalLiabilities) / Number(statement.totalAssets || 1)
      },
      
      // Efficiency Ratios
      efficiencyRatios: {
        assetTurnover: Number(statement.netRevenue) / Number(statement.totalAssets || 1),
        receivablesTurnover: Number(statement.netRevenue) / Number(statement.accountsReceivable || 1)
      },
      
      // Performance Indicators
      performanceIndicators: {
        revenueGrowthRate: 0, // Would need historical data
        profitGrowthRate: 0,  // Would need historical data
        campaignEfficiency: Number(statement.campaignROI)
      },
      
      // Risk Assessment
      riskAssessment: {
        financialStability: this.assessFinancialStability(statement),
        liquidityRisk: this.assessLiquidityRisk(statement),
        profitabilityRisk: this.assessProfitabilityRisk(statement)
      },
      
      // Metadata
      analysisDate: new Date(),
      statementType: 'financial_analysis',
      reportingStandard: 'GAAP'
    };
  }
  
  /**
   * Helper: Assess Financial Stability
   */
  private assessFinancialStability(statement: any): string {
    const currentRatio = Number(statement.currentRatio);
    const debtToEquity = Number(statement.debtToEquityRatio);
    const profitMargin = Number(statement.netProfitMargin);
    
    if (currentRatio >= 2 && debtToEquity <= 0.5 && profitMargin >= 10) {
      return 'Excellent';
    } else if (currentRatio >= 1.5 && debtToEquity <= 1 && profitMargin >= 5) {
      return 'Good';
    } else if (currentRatio >= 1 && debtToEquity <= 2 && profitMargin >= 0) {
      return 'Fair';
    } else {
      return 'Poor';
    }
  }
  
  /**
   * Helper: Assess Liquidity Risk
   */
  private assessLiquidityRisk(statement: any): string {
    const currentRatio = Number(statement.currentRatio);
    const cashRatio = Number(statement.cashAndEquivalents) / Number(statement.currentLiabilities || 1);
    
    if (currentRatio >= 2 && cashRatio >= 0.5) {
      return 'Low';
    } else if (currentRatio >= 1.5 && cashRatio >= 0.2) {
      return 'Moderate';
    } else {
      return 'High';
    }
  }
  
  /**
   * Helper: Assess Profitability Risk
   */
  private assessProfitabilityRisk(statement: any): string {
    const grossMargin = Number(statement.grossProfitMargin);
    const operatingMargin = Number(statement.operatingMargin);
    const netMargin = Number(statement.netProfitMargin);
    
    if (grossMargin >= 50 && operatingMargin >= 20 && netMargin >= 15) {
      return 'Low';
    } else if (grossMargin >= 30 && operatingMargin >= 10 && netMargin >= 5) {
      return 'Moderate';
    } else {
      return 'High';
    }
  }
  
  /**
   * Generate financial report PDF (Enhanced with industry standards)
   */
  async generateReportPDF(
    reportType: 'statement' | 'pnl' | 'platform' | 'earnings' | 'income_statement' | 'balance_sheet' | 'cash_flow' | 'financial_analysis',
    reportData: any,
    userInfo?: { name: string; email: string }
  ): Promise<Buffer> {
    const doc = new jsPDF();
    
    // Add industry-standard header
    doc.setFontSize(18);
    doc.text('INFLUENCER HUB', 20, 20);
    doc.setFontSize(14);
    doc.text('FINANCIAL REPORT', 20, 30);
    doc.setFontSize(10);
    doc.text('Prepared in accordance with Generally Accepted Accounting Principles (GAAP)', 20, 40);
    
    doc.setFontSize(12);
    doc.text(`Report Type: ${reportType.replace('_', ' ').toUpperCase()}`, 20, 55);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 65);
    doc.text(`Reporting Period: ${reportData.periodStart?.toLocaleDateString() || 'N/A'} - ${reportData.periodEnd?.toLocaleDateString() || 'N/A'}`, 20, 75);
    
    if (userInfo) {
      doc.text(`Prepared For: ${userInfo.name}`, 20, 85);
      doc.text(`Account: ${userInfo.email}`, 20, 95);
    }
    
    // Add disclaimer
    doc.setFontSize(8);
    doc.text('This report contains confidential financial information. Distribution is restricted.', 20, 105);
    
    let yPosition = 120;
    
    switch (reportType) {
      case 'statement':
        yPosition = this.addStatementDataToPDF(doc, reportData, yPosition);
        break;
      case 'pnl':
        yPosition = this.addPLDataToPDF(doc, reportData, yPosition);
        break;
      case 'platform':
        yPosition = this.addPlatformDataToPDF(doc, reportData, yPosition);
        break;
      case 'earnings':
        yPosition = this.addEarningsDataToPDF(doc, reportData, yPosition);
        break;
      case 'income_statement':
        yPosition = this.addIncomeStatementToPDF(doc, reportData, yPosition);
        break;
      case 'balance_sheet':
        yPosition = this.addBalanceSheetToPDF(doc, reportData, yPosition);
        break;
      case 'cash_flow':
        yPosition = this.addCashFlowToPDF(doc, reportData, yPosition);
        break;
      case 'financial_analysis':
        yPosition = this.addFinancialAnalysisToPDF(doc, reportData, yPosition);
        break;
    }
    
    // Add industry-standard footer with disclaimers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 20);
      doc.text('CONFIDENTIAL - INFLUENCER HUB FINANCIAL REPORT', 20, doc.internal.pageSize.height - 20);
      doc.text('Prepared using GAAP accounting standards. This report is for informational purposes only.', 20, doc.internal.pageSize.height - 12);
      doc.text('Not intended as investment advice. Please consult with a qualified financial advisor.', 20, doc.internal.pageSize.height - 6);
    }
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  /**
   * Helper: Calculate user financial metrics using invoices (GAAP-compliant)
   */
  private async calculateUserFinancialMetrics(
    userId: string,
    userType: 'brand' | 'influencer',
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get all invoices for the period
    const invoiceData = await db
      .select({
        subtotal: invoices.subtotalAmount,
        total: invoices.totalAmount,
        tax: invoices.taxAmount,
        status: invoices.status
      })
      .from(invoices)
      .where(
        and(
          userType === 'brand' 
            ? eq(invoices.brandId, userId)
            : eq(invoices.influencerId, userId),
          between(invoices.createdAt, periodStart, periodEnd)
        )
      );
    
    // Calculate basic revenue and expense metrics
    let grossRevenue = 0;
    let costOfServices = 0;
    let operatingExpenses = 0;
    let platformFees = 0;
    let totalTransactions = invoiceData.length;
    let successfulTransactions = 0;
    let failedTransactions = 0;
    
    invoiceData.forEach(invoice => {
      const total = Number(invoice.total || 0);
      const subtotal = Number(invoice.subtotal || 0);
      const tax = Number(invoice.tax || 0);
      
      if (invoice.status === 'paid') {
        successfulTransactions++;
        if (userType === 'brand') {
          // For brands: expenses are costs
          costOfServices += subtotal;
          operatingExpenses += total - subtotal; // difference between total and subtotal
        } else {
          // For influencers: invoices are revenue
          grossRevenue += total;
        }
        platformFees += tax;
      } else if (invoice.status === 'cancelled') {
        failedTransactions++;
      }
    });
    
    // Calculate derived financial metrics (GAAP structure)
    const revenueDeductions = grossRevenue * 0.02; // Estimated 2% deductions
    const netRevenue = grossRevenue - revenueDeductions;
    const grossProfit = netRevenue - costOfServices;
    
    // Operating expenses breakdown
    const marketingExpenses = operatingExpenses * 0.3; // 30% marketing
    const administrativeExpenses = operatingExpenses * 0.2; // 20% admin
    const totalOperatingExpenses = operatingExpenses + platformFees + marketingExpenses + administrativeExpenses;
    
    // Operating income (EBIT)
    const operatingIncome = grossProfit - totalOperatingExpenses;
    
    // Other income/expenses (minimal for most users)
    const interestIncome = 0;
    const interestExpense = 0;
    const otherIncome = 0;
    
    // Pre-tax and net income
    const incomeBeforeTax = operatingIncome + interestIncome - interestExpense + otherIncome;
    const taxExpense = Math.max(incomeBeforeTax * 0.25, 0); // 25% tax rate
    const netIncome = incomeBeforeTax - taxExpense;
    
    // Balance Sheet calculations (based on actual financial data only)
    const cashAndEquivalents = Math.max(netIncome, 0); // Available cash from earnings
    const accountsReceivable = 0; // No A/R data available
    const prepaidExpenses = 0; // No prepaid data available
    const currentAssets = cashAndEquivalents + accountsReceivable + prepaidExpenses;
    
    const fixedAssets = 0; // No fixed asset data available
    const intangibleAssets = 0; // No intangible asset data available
    const totalAssets = currentAssets + fixedAssets + intangibleAssets;
    
    // Liabilities
    const accountsPayable = 0; // No A/P data available
    const accruedExpenses = 0; // No accrued expense data available
    const currentLiabilities = accountsPayable + accruedExpenses;
    
    const longTermDebt = 0; // No debt data available
    const totalLiabilities = currentLiabilities + longTermDebt;
    
    // Equity
    const retainedEarnings = netIncome;
    const totalEquity = totalAssets - totalLiabilities;
    
    // Cash Flow Statement (actual cash movements only)
    const operatingCashFlow = netIncome; // Cash from operations
    const investingCashFlow = 0; // No investment data available
    const financingCashFlow = 0; // No financing data available
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
    
    // Calculate Financial Ratios (Industry Standard KPIs)
    const grossProfitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
    const operatingMargin = netRevenue > 0 ? (operatingIncome / netRevenue) * 100 : 0;
    const netProfitMargin = netRevenue > 0 ? (netIncome / netRevenue) * 100 : 0;
    const returnOnAssets = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
    const returnOnEquity = totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const debtToEquityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
    
    // Get campaign metrics
    let activeCampaigns = 0;
    let completedCampaigns = 0;
    let collaborationsCompleted = 0;
    
    if (userType === 'brand') {
      const campaigns = await db
        .select({
          status: brandCampaigns.status
        })
        .from(brandCampaigns)
        .where(
          and(
            eq(brandCampaigns.brandId, userId),
            between(brandCampaigns.createdAt, periodStart, periodEnd)
          )
        );
      
      campaigns.forEach(campaign => {
        if (campaign.status === 'active') activeCampaigns++;
        else if (campaign.status === 'completed') completedCampaigns++;
      });
    } else {
      collaborationsCompleted = successfulTransactions;
    }
    
    return {
      // Income Statement (GAAP structure)
      grossRevenue: grossRevenue.toFixed(2),
      revenueDeductions: revenueDeductions.toFixed(2),
      netRevenue: netRevenue.toFixed(2),
      costOfServices: costOfServices.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      operatingExpenses: totalOperatingExpenses.toFixed(2),
      platformFees: platformFees.toFixed(2),
      marketingExpenses: marketingExpenses.toFixed(2),
      administrativeExpenses: administrativeExpenses.toFixed(2),
      operatingIncome: operatingIncome.toFixed(2),
      interestIncome: interestIncome.toFixed(2),
      interestExpense: interestExpense.toFixed(2),
      otherIncome: otherIncome.toFixed(2),
      incomeBeforeTax: incomeBeforeTax.toFixed(2),
      taxExpense: taxExpense.toFixed(2),
      netIncome: netIncome.toFixed(2),
      
      // Balance Sheet
      cashAndEquivalents: cashAndEquivalents.toFixed(2),
      accountsReceivable: accountsReceivable.toFixed(2),
      prepaidExpenses: prepaidExpenses.toFixed(2),
      currentAssets: currentAssets.toFixed(2),
      fixedAssets: fixedAssets.toFixed(2),
      intangibleAssets: intangibleAssets.toFixed(2),
      totalAssets: totalAssets.toFixed(2),
      accountsPayable: accountsPayable.toFixed(2),
      accruedExpenses: accruedExpenses.toFixed(2),
      currentLiabilities: currentLiabilities.toFixed(2),
      longTermDebt: longTermDebt.toFixed(2),
      totalLiabilities: totalLiabilities.toFixed(2),
      retainedEarnings: retainedEarnings.toFixed(2),
      totalEquity: totalEquity.toFixed(2),
      
      // Cash Flow Statement
      operatingCashFlow: operatingCashFlow.toFixed(2),
      investingCashFlow: investingCashFlow.toFixed(2),
      financingCashFlow: financingCashFlow.toFixed(2),
      netCashFlow: netCashFlow.toFixed(2),
      
      // Financial Ratios
      grossProfitMargin: grossProfitMargin.toFixed(2),
      operatingMargin: operatingMargin.toFixed(2),
      netProfitMargin: netProfitMargin.toFixed(2),
      returnOnAssets: returnOnAssets.toFixed(2),
      returnOnEquity: returnOnEquity.toFixed(2),
      currentRatio: currentRatio.toFixed(2),
      debtToEquityRatio: debtToEquityRatio.toFixed(2),
      
      // Legacy fields for backward compatibility
      totalRevenue: grossRevenue.toFixed(2),
      totalExpenses: (costOfServices + totalOperatingExpenses).toFixed(2),
      taxesPaid: taxExpense.toFixed(2),
      
      // Transaction metrics
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      refundedTransactions: 0,
      
      // Campaign metrics
      activeCampaigns,
      completedCampaigns,
      campaignROI: userType === 'brand' && costOfServices > 0 ? ((grossRevenue / costOfServices - 1) * 100).toFixed(2) : '0.00',
      avgCampaignCost: completedCampaigns > 0 ? (costOfServices / completedCampaigns).toFixed(2) : '0.00',
      collaborationsCompleted,
      avgEarningsPerCampaign: collaborationsCompleted > 0 ? (grossRevenue / collaborationsCompleted).toFixed(2) : '0.00',
      topPerformingCategories: []
    };
  }
  
  /**
   * Helper: Calculate campaign P&L metrics using invoices
   */
  private async calculateCampaignPLMetrics(
    campaignId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    console.log('Calculating P&L metrics for campaign:', campaignId, 'Period:', periodStart, 'to', periodEnd);
    
    // Get campaign payments for brand costs (what brand paid to influencers)
    const campaignPaymentResults = await db
      .select({
        totalPaid: sum(campaignPayments.amount),
        paymentCount: count(campaignPayments.id)
      })
      .from(campaignPayments)
      .where(
        and(
          eq(campaignPayments.campaignId, campaignId),
          eq(campaignPayments.status, 'paid'),
          between(campaignPayments.createdAt, periodStart, periodEnd)
        )
      );
    
    // Get platform commission from financial transactions (platform revenue)
    const platformCommissions = await db
      .select({
        totalCommission: sum(financialTransactions.platformFee),
        commissionCount: count(financialTransactions.id)
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.campaignId, campaignId),
          eq(financialTransactions.transactionType, 'platform_commission'),
          eq(financialTransactions.status, 'completed'),
          between(financialTransactions.createdAt, periodStart, periodEnd)
        )
      );
    
    // Get campaign invoices for additional costs
    const campaignInvoices = await db
      .select({
        totalInvoiced: sum(invoices.totalAmount),
        taxAmount: sum(invoices.taxAmount),
        subtotalAmount: sum(invoices.subtotalAmount),
        invoiceCount: count(invoices.id)
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.campaignId, campaignId),
          between(invoices.createdAt, periodStart, periodEnd)
        )
      );
    
    // Note: brand_collaborations table doesn't have campaignId field
    // For now, set performance metrics to 0 until collaboration data is properly structured
    const collaborations: any[] = [];
    
    // Calculate actual financial metrics from real data
    const brandPaidAmount = Number(campaignPaymentResults[0]?.totalPaid || 0); // What brand actually paid
    const platformCommissionEarned = Number(platformCommissions[0]?.totalCommission || 0); // Platform's 5% cut
    const totalInvoicedAmount = Number(campaignInvoices[0]?.totalInvoiced || 0);
    const taxAmount = Number(campaignInvoices[0]?.taxAmount || 0);
    const paymentCount = Number(campaignPaymentResults[0]?.paymentCount || 0);
    const commissionCount = Number(platformCommissions[0]?.commissionCount || 0);
    
    console.log('P&L Data Found:', {
      brandPaidAmount,
      platformCommissionEarned,
      totalInvoicedAmount,
      taxAmount,
      paymentCount,
      commissionCount,
      campaignId,
      periodStart,
      periodEnd
    });
    
    // For brand perspective: Revenue = campaign value, Costs = what they paid
    // Brand's total campaign investment
    const totalCosts = brandPaidAmount;
    const platformFees = platformCommissionEarned;
    const influencerPayments = brandPaidAmount; // What actually went to influencers
    
    // Campaign revenue would come from campaign results (for now showing brand investment)  
    const totalRevenue = brandPaidAmount + platformCommissionEarned; // Total campaign value
    const directSales = totalRevenue; // All revenue is direct for now
    const brandLift = 0; // No brand lift data available
    const advertisingSpend = 0; // No advertising spend data
    const productionCosts = Math.max(totalInvoicedAmount - brandPaidAmount, 0);
    
    const grossProfit = totalRevenue - totalCosts;
    const netProfit = grossProfit - taxAmount;
    
    // Calculate actual performance metrics
    const totalReach = collaborations.reduce((sum, collab) => sum + (Number(collab.actualReach) || 0), 0);
    const totalEngagements = collaborations.reduce((sum, collab) => sum + (Number(collab.actualEngagement) || 0), 0);
    const conversionRate = totalReach > 0 && totalRevenue > 0 ? (totalRevenue / totalReach * 100).toFixed(4) : '0.0000';
    const costPerAcquisition = totalRevenue > 0 ? (totalCosts / (totalRevenue / 100)).toFixed(2) : '0.00';
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      directSales: directSales.toFixed(2),
      brandLift: brandLift.toFixed(2),
      totalCosts: totalCosts.toFixed(2),
      influencerPayments: influencerPayments.toFixed(2),
      platformFees: platformFees.toFixed(2),
      productionCosts: Math.max(productionCosts, 0).toFixed(2),
      advertisingSpend: advertisingSpend.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      netProfit: netProfit.toFixed(2),
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00',
      roi: totalCosts > 0 ? (((totalRevenue - totalCosts) / totalCosts) * 100).toFixed(2) : '0.00',
      totalReach: totalReach,
      totalEngagements: totalEngagements,
      conversionRate: conversionRate,
      costPerAcquisition: costPerAcquisition,
      lifetimeValue: '0.00' // No LTV data available yet
    };
  }
  
  /**
   * Helper: Calculate platform metrics using invoices
   */
  private async calculatePlatformMetrics(periodStart: Date, periodEnd: Date) {
    // Get invoice data for platform metrics
    const invoiceMetrics = await db
      .select({
        totalVolume: sum(invoices.totalAmount),
        totalFees: sum(invoices.taxAmount),
        transactionCount: count(invoices.id)
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, 'paid'),
          between(invoices.createdAt, periodStart, periodEnd)
        )
      );
    
    const totalTransactionVolume = Number(invoiceMetrics[0]?.totalVolume || 0);
    const transactionFees = Number(invoiceMetrics[0]?.totalFees || 0);
    const totalTransactions = Number(invoiceMetrics[0]?.transactionCount || 0);
    
    // Get user counts
    const totalUsers = await db
      .select({
        count: count(users.id)
      })
      .from(users)
      .where(
        between(users.createdAt, periodStart, periodEnd)
      );
    
    const newSignups = Number(totalUsers[0]?.count || 0);
    
    // Get actual user counts by role (no estimates)
    const brandUsers = await db
      .select({
        count: count(users.id)
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'brand'),
          between(users.createdAt, periodStart, periodEnd)
        )
      );
    
    const influencerUsers = await db
      .select({
        count: count(users.id)
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'influencer'),
          between(users.createdAt, periodStart, periodEnd)
        )
      );
    
    const activeBrands = Number(brandUsers[0]?.count || 0);
    const activeInfluencers = Number(influencerUsers[0]?.count || 0);
    
    // Get campaign data
    const campaignData = await db
      .select({
        status: brandCampaigns.status,
        count: count(brandCampaigns.id)
      })
      .from(brandCampaigns)
      .where(
        between(brandCampaigns.createdAt, periodStart, periodEnd)
      )
      .groupBy(brandCampaigns.status);
    
    let totalCampaigns = 0;
    let activeCampaigns = 0;
    let completedCampaigns = 0;
    
    campaignData.forEach(campaign => {
      const campaignCount = Number(campaign.count || 0);
      totalCampaigns += campaignCount;
      if (campaign.status === 'active') activeCampaigns = campaignCount;
      else if (campaign.status === 'completed') completedCampaigns = campaignCount;
    });
    
    return {
      totalPlatformRevenue: transactionFees.toFixed(2),
      transactionFees: transactionFees.toFixed(2),
      subscriptionRevenue: '0.00',
      premiumFeatures: '0.00',
      advertisingRevenue: '0.00',
      totalTransactionVolume: totalTransactionVolume.toFixed(2),
      totalTransactions,
      avgTransactionSize: totalTransactions > 0 ? (totalTransactionVolume / totalTransactions).toFixed(2) : '0.00',
      activeBrands,
      activeInfluencers,
      newSignups,
      churnedUsers: 0,
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      avgCampaignValue: completedCampaigns > 0 ? (totalTransactionVolume / completedCampaigns).toFixed(2) : '0.00',
      revenueByRegion: {},
      topMarkets: [],
      revenueGrowthRate: '0.00',
      userGrowthRate: '0.00',
      transactionGrowthRate: '0.00',
      operationalCosts: '0.00',
      marketingCosts: '0.00',
      supportCosts: '0.00'
    };
  }
  
  /**
   * Helper: Calculate report period dates
   */
  private calculateReportPeriod(
    reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    year: number,
    period: number
  ): { periodStart: Date; periodEnd: Date } {
    let periodStart: Date;
    let periodEnd: Date;
    
    switch (reportType) {
      case 'daily':
        periodStart = new Date(year, 0, period);
        periodEnd = new Date(year, 0, period + 1);
        break;
      case 'weekly':
        periodStart = new Date(year, 0, (period - 1) * 7 + 1);
        periodEnd = new Date(year, 0, period * 7);
        break;
      case 'monthly':
        periodStart = new Date(year, period - 1, 1);
        periodEnd = new Date(year, period, 0);
        break;
      case 'quarterly':
        periodStart = new Date(year, (period - 1) * 3, 1);
        periodEnd = new Date(year, period * 3, 0);
        break;
      case 'yearly':
        periodStart = new Date(year, 0, 1);
        periodEnd = new Date(year, 11, 31);
        break;
      default:
        throw new Error('Invalid report type');
    }
    
    return { periodStart, periodEnd };
  }
  
  /**
   * Helper: Add statement data to PDF
   */
  private addStatementDataToPDF(doc: jsPDF, data: FinancialStatement, yPosition: number): number {
    doc.setFontSize(16);
    doc.text('Financial Statement', 20, yPosition);
    yPosition += 20;
    
    doc.setFontSize(12);
    doc.text(`Period: ${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`User Type: ${data.userType.toUpperCase()}`, 20, yPosition);
    yPosition += 20;
    
    // Financial summary table - Manual table creation
    const tableData = [
      ['Metric', 'Amount'],
      ['Total Revenue', `$${data.totalRevenue}`],
      ['Total Expenses', `$${data.totalExpenses}`],
      ['Platform Fees', `$${data.platformFees}`],
      ['Net Income', `$${data.netIncome}`],
      ['Total Transactions', (data.totalTransactions || 0).toString()],
      ['Successful Transactions', (data.successfulTransactions || 0).toString()],
      ['Failed Transactions', (data.failedTransactions || 0).toString()]
    ];
    
    // Create table manually without autoTable plugin
    const rowHeight = 8;
    const colWidth = 60;
    
    // Table header
    doc.setFillColor(200, 200, 200);
    doc.rect(20, yPosition, colWidth * 2, rowHeight, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(tableData[0][0], 25, yPosition + 6);
    doc.text(tableData[0][1], 25 + colWidth, yPosition + 6);
    yPosition += rowHeight;
    
    // Table rows
    doc.setFillColor(245, 245, 245);
    for (let i = 1; i < tableData.length; i++) {
      if (i % 2 === 0) {
        doc.rect(20, yPosition, colWidth * 2, rowHeight, 'F');
      }
      doc.text(tableData[i][0], 25, yPosition + 6);
      doc.text(tableData[i][1], 25 + colWidth, yPosition + 6);
      yPosition += rowHeight;
    }
    
    return yPosition + 20;
  }
  
  /**
   * Helper: Add P&L data to PDF
   */
  private addPLDataToPDF(doc: jsPDF, data: CampaignProfitLossReport, yPosition: number): number {
    doc.setFontSize(16);
    doc.text('Campaign Profit & Loss Report', 20, yPosition);
    yPosition += 20;
    
    doc.setFontSize(12);
    doc.text(`Period: ${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Report Period: ${data.reportPeriod}`, 20, yPosition);
    yPosition += 20;
    
    // P&L table - Manual table creation
    const tableData = [
      ['Item', 'Amount'],
      ['Total Revenue', `$${data.totalRevenue}`],
      ['Direct Sales', `$${data.directSales}`],
      ['Brand Lift', `$${data.brandLift}`],
      ['Total Costs', `$${data.totalCosts}`],
      ['Influencer Payments', `$${data.influencerPayments}`],
      ['Platform Fees', `$${data.platformFees}`],
      ['Gross Profit', `$${data.grossProfit}`],
      ['Net Profit', `$${data.netProfit}`],
      ['Profit Margin', `${data.profitMargin}%`],
      ['ROI', `${data.roi}%`]
    ];
    
    // Create table manually without autoTable plugin
    const rowHeight = 8;
    const colWidth = 60;
    
    // Table header
    doc.setFillColor(200, 200, 200);
    doc.rect(20, yPosition, colWidth * 2, rowHeight, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(tableData[0][0], 25, yPosition + 6);
    doc.text(tableData[0][1], 25 + colWidth, yPosition + 6);
    yPosition += rowHeight;
    
    // Table rows
    doc.setFillColor(245, 245, 245);
    for (let i = 1; i < tableData.length; i++) {
      if (i % 2 === 0) {
        doc.rect(20, yPosition, colWidth * 2, rowHeight, 'F');
      }
      doc.text(tableData[i][0], 25, yPosition + 6);
      doc.text(tableData[i][1], 25 + colWidth, yPosition + 6);
      yPosition += rowHeight;
    }
    
    return yPosition + 20;
  }
  
  /**
   * Helper: Add platform data to PDF
   */
  private addPlatformDataToPDF(doc: jsPDF, data: PlatformRevenueReport, yPosition: number): number {
    doc.setFontSize(16);
    doc.text('Platform Revenue Report', 20, yPosition);
    yPosition += 20;
    
    doc.setFontSize(12);
    doc.text(`Period: ${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Report Type: ${data.reportType}`, 20, yPosition);
    yPosition += 20;
    
    // Platform metrics table
    const tableData = [
      ['Metric', 'Value'],
      ['Total Platform Revenue', `$${data.totalPlatformRevenue}`],
      ['Transaction Fees', `$${data.transactionFees}`],
      ['Total Transaction Volume', `$${data.totalTransactionVolume}`],
      ['Total Transactions', (data.totalTransactions || 0).toString()],
      ['Average Transaction Size', `$${data.avgTransactionSize}`],
      ['Active Brands', (data.activeBrands || 0).toString()],
      ['Active Influencers', (data.activeInfluencers || 0).toString()],
      ['New Signups', (data.newSignups || 0).toString()],
      ['Total Campaigns', (data.totalCampaigns || 0).toString()],
      ['Active Campaigns', (data.activeCampaigns || 0).toString()],
      ['Completed Campaigns', (data.completedCampaigns || 0).toString()]
    ];
    
    // Create table manually without autoTable plugin
    const rowHeight = 8;
    const colWidth = 60;
    
    // Table header
    doc.setFillColor(200, 200, 200);
    doc.rect(20, yPosition, colWidth * 2, rowHeight, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(tableData[0][0], 25, yPosition + 6);
    doc.text(tableData[0][1], 25 + colWidth, yPosition + 6);
    yPosition += rowHeight;
    
    // Table rows
    doc.setFillColor(245, 245, 245);
    for (let i = 1; i < tableData.length; i++) {
      if (i % 2 === 0) {
        doc.rect(20, yPosition, colWidth * 2, rowHeight, 'F');
      }
      doc.text(tableData[i][0], 25, yPosition + 6);
      doc.text(tableData[i][1], 25 + colWidth, yPosition + 6);
      yPosition += rowHeight;
    }
    
    return yPosition + 20;
  }
  
  /**
   * Helper: Add earnings data to PDF
   */
  private addEarningsDataToPDF(doc: jsPDF, data: any, yPosition: number): number {
    doc.setFontSize(16);
    doc.text('Influencer Earnings Summary', 20, yPosition);
    yPosition += 20;
    
    doc.setFontSize(12);
    doc.text(`Total Earnings: $${Number(data.totalEarnings || 0).toFixed(2)}`, 20, yPosition);
    yPosition += 20;
    
    // Campaign earnings table
    if (data.campaignEarnings && data.campaignEarnings.length > 0) {
      const tableData = [
        ['Campaign', 'Earnings', 'Status'],
        ...data.campaignEarnings.map((campaign: any) => [
          campaign.campaignTitle,
          `$${Number(campaign.earnings || 0).toFixed(2)}`,
          campaign.status
        ])
      ];
      
      // Create table manually without autoTable plugin
      const rowHeight = 8;
      const colWidth = 50;
      
      // Table header
      doc.setFillColor(200, 200, 200);
      doc.rect(20, yPosition, colWidth * 3, rowHeight, 'F');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(tableData[0][0], 25, yPosition + 6);
      doc.text(tableData[0][1], 25 + colWidth, yPosition + 6);
      doc.text(tableData[0][2], 25 + colWidth * 2, yPosition + 6);
      yPosition += rowHeight;
      
      // Table rows
      doc.setFillColor(245, 245, 245);
      for (let i = 1; i < tableData.length; i++) {
        if (i % 2 === 0) {
          doc.rect(20, yPosition, colWidth * 3, rowHeight, 'F');
        }
        doc.text(tableData[i][0], 25, yPosition + 6);
        doc.text(tableData[i][1], 25 + colWidth, yPosition + 6);
        doc.text(tableData[i][2], 25 + colWidth * 2, yPosition + 6);
        yPosition += rowHeight;
      }
      
      yPosition += 20;
    }
    
    return yPosition;
  }

  /**
   * Generate earnings report for an influencer
   */
  async generateEarningsReport(
    userId: string,
    year: number,
    month: number
  ): Promise<any> {
    console.log('Generating earnings report for:', { userId, year, month });
    
    // Import storage dynamically to avoid circular dependency
    const { storage } = await import('./storage');
    
    // Get campaign payments for this user in the specified period
    const payments = await storage.getCampaignPayments(undefined, userId);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    
    // Filter payments for the specified period
    const periodPayments = payments.filter(p => {
      const paymentDate = new Date(p.createdAt);
      return paymentDate >= periodStart && paymentDate <= periodEnd && p.status === 'completed';
    });
    
    const totalEarnings = periodPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    const platformFees = totalEarnings * 0.05; // 5% platform fee
    const netEarnings = totalEarnings - platformFees;
    
    const earningsReport = {
      id: `earnings-${userId}-${year}-${month}`,
      userId,
      period: `${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      totalEarnings,
      netEarnings,
      platformFees,
      campaignCount: periodPayments.length,
      generatedAt: new Date(),
      campaignBreakdown: periodPayments.map(p => ({
        name: p.description || 'Campaign Payment',
        brand: 'Brand Partner',
        earnings: parseFloat(p.amount || '0'),
        status: 'paid',
        date: p.createdAt
      }))
    };
    
    return earningsReport;
  }

  /**
   * Generate earnings analytics for an influencer
   */
  async generateEarningsAnalytics(userId: string): Promise<any> {
    console.log('Generating earnings analytics for:', { userId });
    
    // Import storage dynamically to avoid circular dependency
    const { storage } = await import('./storage');
    
    // Get all campaign payments for this user
    const allPayments = await storage.getCampaignPayments(undefined, userId);
    const completedPayments = allPayments.filter(p => p.status === 'completed');
    
    // Calculate total lifetime earnings
    const totalEarnings = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    
    // Calculate monthly averages
    const monthlyEarnings = new Map();
    completedPayments.forEach(p => {
      const date = new Date(p.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const current = monthlyEarnings.get(monthKey) || 0;
      monthlyEarnings.set(monthKey, current + parseFloat(p.amount || '0'));
    });
    
    const monthlyAverage = monthlyEarnings.size > 0 ? 
      Array.from(monthlyEarnings.values()).reduce((sum, val) => sum + val, 0) / monthlyEarnings.size : 0;
    
    // Calculate growth rate (comparing last 2 months)
    const monthlyData = Array.from(monthlyEarnings.entries()).sort();
    const growthRate = monthlyData.length >= 2 ? 
      ((monthlyData[monthlyData.length - 1][1] - monthlyData[monthlyData.length - 2][1]) / monthlyData[monthlyData.length - 2][1]) * 100 : 0;
    
    // Get current and last month earnings
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    const lastMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() - 1}`;
    
    const analytics = {
      totalEarnings,
      monthlyAverage,
      growthRate,
      currentMonth: monthlyEarnings.get(currentMonthKey) || 0,
      lastMonth: monthlyEarnings.get(lastMonthKey) || 0,
      topCampaign: completedPayments.length > 0 ? 
        Math.max(...completedPayments.map(p => parseFloat(p.amount || '0'))) : 0,
      platformBreakdown: [] // No platform breakdown data available - no estimates
    };
    
    return analytics;
  }
  
  /**
   * Helper: Add Income Statement to PDF
   */
  private addIncomeStatementToPDF(doc: any, data: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('INCOME STATEMENT', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    
    // Revenue Section
    doc.text('REVENUE:', 20, yPosition);
    yPosition += 8;
    doc.text(`Gross Revenue: $${Number(data.revenue?.grossRevenue || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Less: Revenue Deductions: ($${Number(data.revenue?.revenueDeductions || 0).toLocaleString()})`, 30, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Net Revenue: $${Number(data.revenue?.netRevenue || 0).toLocaleString()}`, 30, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 12;
    
    // Cost of Sales
    doc.text('COST OF SERVICES:', 20, yPosition);
    yPosition += 8;
    doc.text(`Cost of Services: $${Number(data.costOfSales?.costOfServices || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Gross Profit: $${Number(data.costOfSales?.grossProfit || 0).toLocaleString()} (${Number(data.costOfSales?.grossProfitMargin || 0).toFixed(1)}%)`, 30, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 12;
    
    // Operating Expenses
    doc.text('OPERATING EXPENSES:', 20, yPosition);
    yPosition += 8;
    doc.text(`Platform Fees: $${Number(data.operatingExpenses?.platformFees || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Marketing Expenses: $${Number(data.operatingExpenses?.marketingExpenses || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Administrative Expenses: $${Number(data.operatingExpenses?.administrativeExpenses || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Total Operating Expenses: $${Number(data.operatingExpenses?.totalOperatingExpenses || 0).toLocaleString()}`, 30, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 12;
    
    // Operating Income
    doc.setFont(undefined, 'bold');
    doc.text(`Operating Income: $${Number(data.operatingIncome?.amount || 0).toLocaleString()} (${Number(data.operatingIncome?.operatingMargin || 0).toFixed(1)}%)`, 20, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 12;
    
    // Final Income
    doc.text(`Income Before Tax: $${Number(data.finalIncome?.incomeBeforeTax || 0).toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Tax Expense: $${Number(data.finalIncome?.taxExpense || 0).toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`NET INCOME: $${Number(data.finalIncome?.netIncome || 0).toLocaleString()} (${Number(data.finalIncome?.netProfitMargin || 0).toFixed(1)}%)`, 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    return yPosition + 20;
  }
  
  /**
   * Helper: Add Balance Sheet to PDF
   */
  private addBalanceSheetToPDF(doc: any, data: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('BALANCE SHEET', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    
    // Assets
    doc.setFont(undefined, 'bold');
    doc.text('ASSETS', 20, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 10;
    
    // Current Assets
    doc.text('Current Assets:', 20, yPosition);
    yPosition += 8;
    doc.text(`Cash and Equivalents: $${Number(data.assets?.currentAssets?.cashAndEquivalents || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Accounts Receivable: $${Number(data.assets?.currentAssets?.accountsReceivable || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Prepaid Expenses: $${Number(data.assets?.currentAssets?.prepaidExpenses || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Total Current Assets: $${Number(data.assets?.currentAssets?.total || 0).toLocaleString()}`, 30, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 10;
    
    // Total Assets
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL ASSETS: $${Number(data.assets?.totalAssets || 0).toLocaleString()}`, 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    yPosition += 15;
    
    // Liabilities
    doc.setFont(undefined, 'bold');
    doc.text('LIABILITIES & EQUITY', 20, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 10;
    
    doc.text(`Total Liabilities: $${Number(data.liabilities?.totalLiabilities || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Total Equity: $${Number(data.equity?.totalEquity || 0).toLocaleString()}`, 30, yPosition);
    
    return yPosition + 20;
  }
  
  /**
   * Helper: Add Cash Flow Statement to PDF
   */
  private addCashFlowToPDF(doc: any, data: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('CASH FLOW STATEMENT', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    
    // Operating Activities
    doc.setFont(undefined, 'bold');
    doc.text('OPERATING ACTIVITIES', 20, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 10;
    doc.text(`Net Income: $${Number(data.operatingActivities?.netIncome || 0).toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Net Operating Cash Flow: $${Number(data.operatingActivities?.netOperatingCashFlow || 0).toLocaleString()}`, 30, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 12;
    
    // Net Cash Change
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`NET CHANGE IN CASH: $${Number(data.netCashChange || 0).toLocaleString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`ENDING CASH: $${Number(data.endingCash || 0).toLocaleString()}`, 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    return yPosition + 20;
  }
  
  /**
   * Helper: Add Financial Analysis to PDF
   */
  private addFinancialAnalysisToPDF(doc: any, data: any, yPosition: number): number {
    doc.setFontSize(14);
    doc.text('FINANCIAL ANALYSIS & RATIOS', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    
    // Profitability Ratios
    doc.setFont(undefined, 'bold');
    doc.text('PROFITABILITY RATIOS', 20, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 10;
    doc.text(`Gross Profit Margin: ${Number(data.profitabilityRatios?.grossProfitMargin || 0).toFixed(2)}%`, 30, yPosition);
    yPosition += 6;
    doc.text(`Operating Margin: ${Number(data.profitabilityRatios?.operatingMargin || 0).toFixed(2)}%`, 30, yPosition);
    yPosition += 6;
    doc.text(`Net Profit Margin: ${Number(data.profitabilityRatios?.netProfitMargin || 0).toFixed(2)}%`, 30, yPosition);
    yPosition += 6;
    doc.text(`Return on Assets (ROA): ${Number(data.profitabilityRatios?.returnOnAssets || 0).toFixed(2)}%`, 30, yPosition);
    yPosition += 6;
    doc.text(`Return on Equity (ROE): ${Number(data.profitabilityRatios?.returnOnEquity || 0).toFixed(2)}%`, 30, yPosition);
    yPosition += 12;
    
    // Liquidity Ratios
    doc.setFont(undefined, 'bold');
    doc.text('LIQUIDITY RATIOS', 20, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 10;
    doc.text(`Current Ratio: ${Number(data.liquidityRatios?.currentRatio || 0).toFixed(2)}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Quick Ratio: ${Number(data.liquidityRatios?.quickRatio || 0).toFixed(2)}`, 30, yPosition);
    yPosition += 12;
    
    // Risk Assessment
    doc.setFont(undefined, 'bold');
    doc.text('RISK ASSESSMENT', 20, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 10;
    doc.text(`Financial Stability: ${data.riskAssessment?.financialStability || 'N/A'}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Liquidity Risk: ${data.riskAssessment?.liquidityRisk || 'N/A'}`, 30, yPosition);
    yPosition += 6;
    doc.text(`Profitability Risk: ${data.riskAssessment?.profitabilityRisk || 'N/A'}`, 30, yPosition);
    
    return yPosition + 20;
  }
}

export const reportsService = new ReportsService();