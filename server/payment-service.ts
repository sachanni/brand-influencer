import Razorpay from 'razorpay';
import { storage } from './storage';

// Platform configuration
export const PLATFORM_CONFIG = {
  COMMISSION_RATE: 0.05, // 5% platform commission for Phase 1 launch
  CURRENCY: 'INR',
  PAYMENT_TERMS_DAYS: 7,
  TAX_RATE: 0.18 // 18% GST for India
} as const;

export class PaymentService {
  // Helper method to get brand's currency preference
  private async getBrandCurrency(brandId: string): Promise<string> {
    try {
      const brandProfile = await storage.getBrandProfile(brandId);
      return brandProfile?.preferredCurrency || 'INR';
    } catch (error) {
      console.error('Error fetching brand currency preference:', error);
      return 'INR'; // fallback to INR
    }
  }

  // Get currency symbol for notes
  private getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'INR': '₹',
      'USD': '$', 
      'GBP': '£',
      'EUR': '€'
    };
    return symbols[currency] || currency;
  }
  private getRazorpayInstance(): Razorpay {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured in system environment');
    }

    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(amount: number, currency = 'INR', notes?: any) {
    try {
      const razorpay = this.getRazorpayInstance();
      
      const orderOptions = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        notes: notes || {},
      };

      const order = await razorpay.orders.create(orderOptions);
      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    try {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        throw new Error('Razorpay secret not found in system environment');
      }

      const crypto = require('crypto');
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpaySignature;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  async processInfluencerPayment(campaignId: string, proposalId: string) {
    try {
      // Get campaign and proposal details
      const campaign = await storage.getBrandCampaign(campaignId);
      const proposal = await storage.getCampaignProposal(proposalId);
      
      if (!campaign || !proposal) {
        throw new Error('Campaign or proposal not found');
      }

      if (campaign.status !== 'completed') {
        throw new Error('Campaign must be completed before payment can be processed');
      }

      // Check if payment already exists
      const existingPayments = await storage.getCampaignPayments(campaignId, proposal.influencerId);
      if (existingPayments.length > 0) {
        return existingPayments[0]; // Payment already exists
      }

      // Default payment terms
      const paymentTerms = 7; // Default 7 days
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTerms);

      // Get brand's preferred currency
      const brandCurrency = await this.getBrandCurrency(campaign.brandId);
      const currencySymbol = this.getCurrencySymbol(brandCurrency);

      // Create payment record
      const payment = await storage.createCampaignPayment({
        campaignId,
        proposalId,
        influencerId: proposal.influencerId,
        brandId: campaign.brandId,
        paymentType: 'full',
        amount: String(parseFloat(String(proposal.proposedCompensation || 0).replace(/[$,]/g, ''))),
        currency: brandCurrency,
        status: 'pending',
        dueDate,
        notes: `Payment for completed campaign: ${campaign.title}`,
      });

      return payment;
    } catch (error) {
      console.error('Error processing influencer payment:', error);
      throw error;
    }
  }

  // Create upfront payment (50%) after proposal approval
  async createUpfrontPayment(proposalId: string) {
    try {
      const proposal = await storage.getCampaignProposal(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.status !== 'approved') {
        throw new Error('Proposal must be approved to create upfront payment');
      }

      const campaign = await storage.getBrandCampaign(proposal.campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check if upfront payment already exists
      const existingPayments = await storage.getCampaignPayments(proposal.campaignId, proposal.influencerId);
      const upfrontPayment = existingPayments.find(p => p.paymentType === 'upfront');
      if (upfrontPayment) {
        return upfrontPayment;
      }

      // Calculate 50% upfront payment with platform commission
      const totalAmount = parseFloat(String(proposal.proposedCompensation || 0).replace(/[$,]/g, ''));
      const platformCommission = totalAmount * PLATFORM_CONFIG.COMMISSION_RATE;
      const influencerAmount = totalAmount - platformCommission;
      const upfrontAmount = influencerAmount * 0.5;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3); // 3 days to pay upfront

      // Get brand's preferred currency
      const brandCurrency = await this.getBrandCurrency(campaign.brandId);
      const currencySymbol = this.getCurrencySymbol(brandCurrency);

      // Create upfront payment record
      const payment = await storage.createCampaignPayment({
        campaignId: proposal.campaignId,
        proposalId,
        influencerId: proposal.influencerId,
        brandId: campaign.brandId,
        paymentType: 'upfront',
        amount: String(upfrontAmount),
        currency: brandCurrency,
        status: 'pending',
        dueDate,
        notes: `Upfront payment (50%) for campaign: ${campaign.title}. Platform commission: ${(platformCommission * 0.5).toFixed(2)} ${currencySymbol} deducted.`,
      });

      // Create platform commission record for upfront payment
      await this.createPlatformCommissionRecord({
        campaignId: proposal.campaignId,
        proposalId,
        influencerId: proposal.influencerId,
        brandId: campaign.brandId,
        paymentType: 'upfront',
        grossAmount: totalAmount * 0.5,
        commissionAmount: platformCommission * 0.5,
        netAmount: upfrontAmount,
        description: `Platform commission (5%) - Upfront payment for campaign: ${campaign.title}`
      });

      // Update payment status (separate from approval status)
      await storage.updateCampaignProposal(proposalId, {
        paymentStatus: 'upfront_payment_pending'
      });

      return payment;
    } catch (error) {
      console.error('Error creating upfront payment:', error);
      throw error;
    }
  }

  // Create completion payment (50%) after deliverables submitted
  async createCompletionPayment(proposalId: string) {
    try {
      const proposal = await storage.getCampaignProposal(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.status !== 'deliverables_submitted') {
        throw new Error('Deliverables must be submitted to create completion payment');
      }

      const campaign = await storage.getBrandCampaign(proposal.campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check if completion payment already exists
      const existingPayments = await storage.getCampaignPayments(proposal.campaignId, proposal.influencerId);
      const completionPayment = existingPayments.find(p => p.paymentType === 'completion');
      if (completionPayment) {
        return completionPayment;
      }

      // Calculate 50% completion payment with platform commission
      const totalAmount = parseFloat(String(proposal.proposedCompensation || 0).replace(/[$,]/g, ''));
      const platformCommission = totalAmount * PLATFORM_CONFIG.COMMISSION_RATE;
      const influencerAmount = totalAmount - platformCommission;
      const completionAmount = influencerAmount * 0.5;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay completion

      // Get brand's preferred currency
      const brandCurrency = await this.getBrandCurrency(campaign.brandId);
      const currencySymbol = this.getCurrencySymbol(brandCurrency);

      // Create completion payment record
      const payment = await storage.createCampaignPayment({
        campaignId: proposal.campaignId,
        proposalId,
        influencerId: proposal.influencerId,
        brandId: campaign.brandId,
        paymentType: 'completion',
        amount: String(completionAmount),
        currency: brandCurrency,
        status: 'pending',
        dueDate,
        notes: `Completion payment (50%) for campaign: ${campaign.title}. Platform commission: ${(platformCommission * 0.5).toFixed(2)} ${currencySymbol} deducted.`,
      });

      // Create platform commission record for completion payment
      await this.createPlatformCommissionRecord({
        campaignId: proposal.campaignId,
        proposalId,
        influencerId: proposal.influencerId,
        brandId: campaign.brandId,
        paymentType: 'completion',
        grossAmount: totalAmount * 0.5,
        commissionAmount: platformCommission * 0.5,
        netAmount: completionAmount,
        description: `Platform commission (5%) - Completion payment for campaign: ${campaign.title}`
      });

      // Update payment status (separate from approval status)
      await storage.updateCampaignProposal(proposalId, {
        paymentStatus: 'completion_payment_pending'
      });

      return payment;
    } catch (error) {
      console.error('Error creating completion payment:', error);
      throw error;
    }
  }

  async processPaymentOrder(paymentId: string) {
    try {
      const payment = await storage.getCampaignPayment(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      // Create Razorpay order
      const order = await this.createOrder(
        Number(payment.amount),
        payment.currency || 'INR',
        {
          campaignId: payment.campaignId,
          influencerId: payment.influencerId,
          paymentId: payment.id,
        }
      );

      // Update payment with Razorpay order ID
      const updatedPayment = await storage.updateCampaignPayment(paymentId, {
        razorpayOrderId: order.id,
        status: 'processing',
      });

      return {
        payment: updatedPayment,
        order,
      };
    } catch (error) {
      console.error('Error processing payment order:', error);
      throw error;
    }
  }

  async confirmPayment(paymentId: string, razorpayPaymentId: string, razorpaySignature: string) {
    try {
      const payment = await storage.getCampaignPayment(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify payment signature
      const isValid = await this.verifyPayment(
        payment.razorpayOrderId || '',
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isValid) {
        throw new Error('Invalid payment signature');
      }

      // Update payment status
      const updatedPayment = await storage.updateCampaignPayment(paymentId, {
        razorpayPaymentId,
        status: 'completed',
        paidAt: new Date(),
      });

      // Create transaction record
      await storage.createPaymentTransaction({
        paymentId,
        transactionType: 'payment',
        amount: String(payment.amount),
        razorpayTransactionId: razorpayPaymentId,
        status: 'success',
        processedAt: new Date(),
      });

      // Update payment status based on payment type (keep approval status intact)
      if (payment.proposalId) {
        if (payment.paymentType === 'upfront') {
          await storage.updateCampaignProposal(payment.proposalId, { 
            paymentStatus: 'work_in_progress',
            workStartedAt: new Date()
          });
        } else if (payment.paymentType === 'completion') {
          await storage.updateCampaignProposal(payment.proposalId, { 
            paymentStatus: 'completed',
            completedAt: new Date()
          });
        } else {
          // Legacy full payment
          await storage.updateCampaignProposal(payment.proposalId, { paymentStatus: 'paid' });
        }

        // Update related invoice status
        await this.updateInvoiceStatusAfterPayment(payment);
      }

      return updatedPayment;
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      
      // Update payment status to failed
      if (paymentId) {
        await storage.updateCampaignPayment(paymentId, {
          status: 'failed',
          failureReason: error.message,
        });
        
        // Create failed transaction record
        await storage.createPaymentTransaction({
          paymentId,
          transactionType: 'payment',
          amount: '0',
          status: 'failed',
          processedAt: new Date(),
        });
      }

      throw error;
    }
  }

  // Webhook-specific payment confirmation (no signature verification needed as webhook is already verified)
  async confirmPaymentFromWebhook(paymentId: string, razorpayPaymentId: string, razorpayOrderId: string) {
    try {
      const payment = await storage.getCampaignPayment(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status
      const updatedPayment = await storage.updateCampaignPayment(paymentId, {
        razorpayPaymentId,
        status: 'completed',
        paidAt: new Date(),
      });

      // Create transaction record
      await storage.createPaymentTransaction({
        paymentId,
        transactionType: 'payment',
        amount: String(payment.amount),
        razorpayTransactionId: razorpayPaymentId,
        status: 'success',
        processedAt: new Date(),
      });

      // Update payment status based on payment type (keep approval status intact)
      if (payment.proposalId) {
        if (payment.paymentType === 'upfront') {
          await storage.updateCampaignProposal(payment.proposalId, { 
            paymentStatus: 'work_in_progress',
            workStartedAt: new Date()
          });
        } else if (payment.paymentType === 'completion') {
          await storage.updateCampaignProposal(payment.proposalId, { 
            paymentStatus: 'completed',
            completedAt: new Date()
          });
        } else {
          // Legacy full payment
          await storage.updateCampaignProposal(payment.proposalId, { paymentStatus: 'paid' });
        }

        // Update related invoice status
        await this.updateInvoiceStatusAfterPayment(payment);
      }

      return updatedPayment;
    } catch (error: any) {
      console.error('Error confirming payment from webhook:', error);
      throw error;
    }
  }

  async getPendingPayments(brandId: string) {
    try {
      const completedCampaigns = await storage.getCompletedCampaigns();
      const brandCampaigns = completedCampaigns.filter(c => c.brandId === brandId);
      
      const pendingPayments = [];
      
      for (const campaign of brandCampaigns) {
        // Get approved proposals for this campaign
        const proposals = await storage.getCampaignProposals(campaign.id);
        const approvedProposals = proposals.filter(p => p.status === 'approved');
        
        for (const proposal of approvedProposals) {
          // Check if payment already exists
          const existingPayments = await storage.getCampaignPayments(campaign.id, proposal.influencerId);
          
          if (existingPayments.length === 0) {
            // No payment exists, this is pending
            pendingPayments.push({
              campaign,
              proposal,
              influencer: await storage.getUser(proposal.influencerId),
            });
          }
        }
      }
      
      return pendingPayments;
    } catch (error) {
      console.error('Error getting pending payments:', error);
      throw error;
    }
  }

  /**
   * Create platform commission record for tracking revenue
   */
  async createPlatformCommissionRecord(data: {
    campaignId: string;
    proposalId: string;
    influencerId: string;
    brandId: string;
    paymentType: 'upfront' | 'completion' | 'full';
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    description: string;
  }) {
    try {
      // Create platform commission record in financial transactions
      await storage.createFinancialTransaction({
        transactionId: `COMM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        campaignId: data.campaignId,
        proposalId: data.proposalId,
        brandId: data.brandId,
        influencerId: data.influencerId,
        transactionType: 'platform_commission',
        status: 'completed',
        grossAmount: String(data.grossAmount),
        platformFee: String(data.commissionAmount),
        processingFee: '0.00',
        netAmount: String(data.netAmount),
        currency: PLATFORM_CONFIG.CURRENCY,
        description: data.description,
        paymentMethod: 'razorpay',
        metadata: {
          paymentType: data.paymentType,
          commissionRate: PLATFORM_CONFIG.COMMISSION_RATE
        }
      });

      console.log(`Platform commission recorded: ${data.commissionAmount} ${PLATFORM_CONFIG.CURRENCY} for ${data.paymentType} payment`);
    } catch (error) {
      console.error('Error recording platform commission:', error);
      // Don't throw error here to avoid breaking payment flow
    }
  }

  /**
   * Get platform commission summary for a period
   */
  async getPlatformCommissionSummary(startDate: Date, endDate: Date) {
    try {
      const commissions = await storage.getFinancialTransactions({
        transactionType: 'platform_commission',
        status: 'completed'
      });
      
      const totalCommission = commissions.reduce((sum: number, transaction) => {
        return sum + parseFloat(transaction.platformFee || '0');
      }, 0);

      const commissionByType = commissions.reduce((acc: Record<string, number>, transaction) => {
        const metadata = transaction.metadata as any;
        const paymentType = metadata?.paymentType || 'unknown';
        acc[paymentType] = (acc[paymentType] || 0) + parseFloat(transaction.platformFee || '0');
        return acc;
      }, {} as Record<string, number>);

      return {
        totalCommission,
        commissionByType,
        transactionCount: commissions.length,
        period: { startDate, endDate }
      };
    } catch (error) {
      console.error('Error fetching platform commission summary:', error);
      throw error;
    }
  }

  /**
   * Update invoice status after payment is confirmed
   * Handles partial payments (upfront/completion) and full payments
   */
  async updateInvoiceStatusAfterPayment(payment: any) {
    try {
      if (!payment.proposalId) {
        return;
      }

      // Find the invoice related to this proposal
      const invoices = await storage.getInvoicesByProposal(payment.proposalId);
      
      if (invoices.length === 0) {
        console.log(`No invoice found for proposal ${payment.proposalId}`);
        return;
      }

      // Get the main invoice (there should typically be one per proposal)
      const invoice = invoices[0];
      
      // Get all payments for this proposal to calculate total paid amount
      const allPayments = await storage.getCampaignPayments(payment.campaignId, payment.influencerId);
      const completedPayments = allPayments.filter(p => p.status === 'completed' && p.proposalId === payment.proposalId);
      
      const totalPaidAmount = completedPayments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
      const invoiceAmount = parseFloat(String(invoice.totalAmount));
      
      // Determine new invoice status based on payment completion
      let newStatus = 'sent'; // default
      
      if (payment.paymentType === 'full' || totalPaidAmount >= invoiceAmount) {
        // Full payment or total payments equal/exceed invoice amount
        newStatus = 'paid';
        
        // Mark invoice as fully paid
        await storage.markInvoiceAsPaid(invoice.id, {
          paidAmount: totalPaidAmount,
          paidAt: new Date(),
          paymentMethod: 'razorpay'
        });
        
        console.log(`Invoice ${invoice.invoiceNumber} marked as paid - Full payment received`);
        
      } else if (totalPaidAmount > 0) {
        // Partial payment received
        newStatus = 'partially_paid';
        
        // Update invoice with partial payment info
        await storage.updateInvoice(invoice.id, {
          status: newStatus,
          paidAmount: String(totalPaidAmount),
          notes: invoice.notes ? 
            `${invoice.notes}\n\nPartial payment received: ${totalPaidAmount} INR on ${new Date().toLocaleDateString()}` :
            `Partial payment received: ${totalPaidAmount} INR on ${new Date().toLocaleDateString()}`
        });
        
        console.log(`Invoice ${invoice.invoiceNumber} marked as partially paid - ${totalPaidAmount} INR of ${invoiceAmount} INR`);
      }

    } catch (error) {
      console.error('Error updating invoice status after payment:', error);
      // Don't throw error to avoid breaking payment flow
    }
  }
}

export const paymentService = new PaymentService();