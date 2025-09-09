/**
 * Production-Ready Platform Configuration
 * =====================================
 * 
 * This file contains ALL configurable values for the Influencer Hub platform.
 * No hardcoded values should exist in the codebase - everything should reference this config.
 * 
 * Environment Variables Supported:
 * - PLATFORM_COMMISSION_RATE: Platform commission percentage (default: 0.05 = 5%)
 * - DEFAULT_CURRENCY: Base platform currency (default: INR)
 * - PAYMENT_TERMS_DAYS: Payment deadline in days (default: 7)
 * - DEFAULT_UPFRONT_PERCENTAGE: Default upfront payment % (default: 50)
 * - DEFAULT_COMPLETION_PERCENTAGE: Default completion payment % (default: 50)
 * - DEFAULT_BONUS_PERCENTAGE: Default bonus payment % (default: 0)
 * - DEFAULT_TAX_REGION: Default tax region code (default: IN)
 * - GST_RATE_IN, TAX_RATE_US, VAT_RATE_GB, etc.: Regional tax rates
 * 
 * ALL platform behavior is now configurable through environment variables!
 */

export interface PlatformConfig {
  // Payment Configuration
  payment: {
    defaultCommissionRate: number;
    defaultCurrency: string;
    defaultPaymentTermsDays: number;
    defaultUpfrontPercentage: number;
    defaultCompletionPercentage: number;
    defaultBonusPercentage: number;
  };
  
  // Regional Tax Configuration
  tax: {
    defaultRegion: string;
    rates: Record<string, number>;
  };
  
  // Milestone Configuration
  milestones: {
    defaultStructure: Array<{
      number: number;
      type: 'upfront' | 'content_delivery' | 'completion';
      description: string;
      percentage: number;
      triggerCondition: string;
      requirements: string;
    }>;
  };
  
  // UI Configuration
  ui: {
    defaultPaymentFallbackText: string;
    priorityLevels: Array<{
      id: string;
      label: string;
      icon: string;
      color: string;
    }>;
  };
  
  // Business Rules
  business: {
    maxCampaignDurationDays: number;
    minCompensationAmount: number;
    maxBonusPercentage: number;
    paymentTimeoutDays: number;
  };
}

// Environment-based configuration
const getEnvironmentConfig = (): PlatformConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    payment: {
      defaultCommissionRate: parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.05'),
      defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
      defaultPaymentTermsDays: parseInt(process.env.PAYMENT_TERMS_DAYS || '7'),
      defaultUpfrontPercentage: parseInt(process.env.DEFAULT_UPFRONT_PERCENTAGE || '50'),
      defaultCompletionPercentage: parseInt(process.env.DEFAULT_COMPLETION_PERCENTAGE || '50'),
      defaultBonusPercentage: parseInt(process.env.DEFAULT_BONUS_PERCENTAGE || '0'),
    },
    
    tax: {
      defaultRegion: process.env.DEFAULT_TAX_REGION || 'IN',
      rates: {
        'IN': parseFloat(process.env.GST_RATE_IN || '0.18'), // India GST
        'US': parseFloat(process.env.TAX_RATE_US || '0.08'), // US Sales Tax
        'GB': parseFloat(process.env.VAT_RATE_GB || '0.20'), // UK VAT
        'CA': parseFloat(process.env.TAX_RATE_CA || '0.13'), // Canada Tax
        'AU': parseFloat(process.env.GST_RATE_AU || '0.10'), // Australia GST
      },
    },
    
    milestones: {
      defaultStructure: [
        {
          number: 1,
          type: 'upfront' as const,
          description: process.env.MILESTONE_1_DESC || 'Upfront Payment - Campaign Initiation',
          percentage: parseInt(process.env.MILESTONE_1_PERCENT || '50'),
          triggerCondition: 'campaign_approval',
          requirements: process.env.MILESTONE_1_REQ || 'Campaign proposal acceptance and contract signing'
        },
        {
          number: 2,
          type: 'content_delivery' as const,
          description: process.env.MILESTONE_2_DESC || 'Content Delivery Payment',
          percentage: parseInt(process.env.MILESTONE_2_PERCENT || '30'),
          triggerCondition: 'content_submission',
          requirements: process.env.MILESTONE_2_REQ || 'Delivery of agreed content according to campaign specifications'
        },
        {
          number: 3,
          type: 'completion' as const,
          description: process.env.MILESTONE_3_DESC || 'Campaign Completion Payment',
          percentage: parseInt(process.env.MILESTONE_3_PERCENT || '20'),
          triggerCondition: 'performance_target_met',
          requirements: process.env.MILESTONE_3_REQ || 'Campaign completion and performance metrics achievement'
        }
      ]
    },
    
    ui: {
      defaultPaymentFallbackText: process.env.DEFAULT_PAYMENT_TEXT || 'Custom Payment Plan',
      priorityLevels: [
        {
          id: 'low',
          label: process.env.PRIORITY_LOW_LABEL || 'Low',
          icon: '🟢',
          color: 'green'
        },
        {
          id: 'normal',
          label: process.env.PRIORITY_NORMAL_LABEL || 'Normal',
          icon: '🟡',
          color: 'yellow'
        },
        {
          id: 'high',
          label: process.env.PRIORITY_HIGH_LABEL || 'High',
          icon: '🔴',
          color: 'red'
        }
      ]
    },
    
    business: {
      maxCampaignDurationDays: parseInt(process.env.MAX_CAMPAIGN_DAYS || '90'),
      minCompensationAmount: parseInt(process.env.MIN_COMPENSATION || '1000'),
      maxBonusPercentage: parseInt(process.env.MAX_BONUS_PERCENT || '50'),
      paymentTimeoutDays: parseInt(process.env.PAYMENT_TIMEOUT_DAYS || '30'),
    }
  };
};

// Export the configuration
export const PLATFORM_CONFIG = getEnvironmentConfig();

// Helper functions for common operations
export const getDefaultPaymentStructure = () => ({
  upfront: PLATFORM_CONFIG.payment.defaultUpfrontPercentage,
  completion: PLATFORM_CONFIG.payment.defaultCompletionPercentage,
  bonus: PLATFORM_CONFIG.payment.defaultBonusPercentage,
});

export const getTaxRate = (region: string): number => {
  return PLATFORM_CONFIG.tax.rates[region] || PLATFORM_CONFIG.tax.rates[PLATFORM_CONFIG.tax.defaultRegion];
};

export const formatPaymentTerms = (paymentStructure: any): string => {
  if (!paymentStructure || typeof paymentStructure !== 'object') {
    const defaultStructure = getDefaultPaymentStructure();
    return `${defaultStructure.upfront}% Upfront, ${defaultStructure.completion}% on Completion`;
  }
  
  const upfront = paymentStructure.upfront || 0;
  const completion = paymentStructure.completion || 0;
  const bonus = paymentStructure.bonus || 0;
  
  let terms = [];
  if (upfront > 0) terms.push(`${upfront}% Upfront`);
  if (completion > 0) terms.push(`${completion}% on Completion`);
  if (bonus > 0) terms.push(`${bonus}% Performance Bonus`);
  
  return terms.length > 0 ? terms.join(', ') : PLATFORM_CONFIG.ui.defaultPaymentFallbackText;
};

export const formatPaymentTimeline = (paymentStructure: any): string => {
  if (!paymentStructure || typeof paymentStructure !== 'object') {
    const defaultStructure = getDefaultPaymentStructure();
    return `${defaultStructure.upfront}% upfront, ${defaultStructure.completion}% upon completion and approval`;
  }
  
  const upfront = paymentStructure.upfront || 0;
  const completion = paymentStructure.completion || 0;
  const bonus = paymentStructure.bonus || 0;
  
  let timeline = `${upfront}% upfront, ${completion}% upon completion and approval`;
  if (bonus > 0) {
    timeline += `, ${bonus}% performance bonus after content goes live`;
  }
  return timeline;
};