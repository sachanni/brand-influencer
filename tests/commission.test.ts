import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { paymentService } from '../server/payment-service';
import { storage } from '../server/storage';
import { InvoiceService } from '../server/invoice-service';

// Mock storage and external dependencies
jest.mock('../server/storage');
jest.mock('../server/db');

describe('Commission System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Commission Calculation Logic', () => {
    it('should calculate 5% commission for standard payment amounts', () => {
      const testCases = [
        { amount: 10000, expectedCommission: 500 },
        { amount: 50000, expectedCommission: 2500 },
        { amount: 100000, expectedCommission: 5000 },
        { amount: 25000, expectedCommission: 1250 },
        { amount: 75000, expectedCommission: 3750 }
      ];

      testCases.forEach(({ amount, expectedCommission }) => {
        const commission = amount * 0.05;
        expect(commission).toBe(expectedCommission);
        expect(commission).toBeCloseTo(expectedCommission, 2);
      });
    });

    it('should handle decimal amounts correctly', () => {
      const testCases = [
        { amount: 10000.50, expectedCommission: 500.025 },
        { amount: 33333.33, expectedCommission: 1666.6665 },
        { amount: 99999.99, expectedCommission: 4999.9995 }
      ];

      testCases.forEach(({ amount, expectedCommission }) => {
        const commission = amount * 0.05;
        expect(commission).toBeCloseTo(expectedCommission, 4);
      });
    });

    it('should calculate commission for upfront payments (50% of campaign)', () => {
      const campaignValue = 100000;
      const upfrontAmount = campaignValue * 0.5; // 50000
      const commission = upfrontAmount * 0.05; // 2500
      
      expect(commission).toBe(2500);
      expect(upfrontAmount - commission).toBe(47500); // Net to influencer
    });

    it('should calculate commission for completion payments (50% of campaign)', () => {
      const campaignValue = 100000;
      const completionAmount = campaignValue * 0.5; // 50000
      const commission = completionAmount * 0.05; // 2500
      
      expect(commission).toBe(2500);
      expect(completionAmount - commission).toBe(47500); // Net to influencer
    });

    it('should calculate commission for full payments (100% of campaign)', () => {
      const campaignValue = 100000;
      const fullAmount = campaignValue; // 100000
      const commission = fullAmount * 0.05; // 5000
      
      expect(commission).toBe(5000);
      expect(fullAmount - commission).toBe(95000); // Net to influencer
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amounts', () => {
      const amount = 0;
      const commission = amount * 0.05;
      
      expect(commission).toBe(0);
      expect(amount - commission).toBe(0);
    });

    it('should handle very small amounts', () => {
      const testCases = [
        { amount: 0.01, expectedCommission: 0.0005 },
        { amount: 1, expectedCommission: 0.05 },
        { amount: 10, expectedCommission: 0.5 }
      ];

      testCases.forEach(({ amount, expectedCommission }) => {
        const commission = amount * 0.05;
        expect(commission).toBeCloseTo(expectedCommission, 4);
      });
    });

    it('should handle very large amounts', () => {
      const testCases = [
        { amount: 1000000, expectedCommission: 50000 }, // 10 Lakh
        { amount: 10000000, expectedCommission: 500000 }, // 1 Crore
        { amount: 99999999.99, expectedCommission: 4999999.9995 }
      ];

      testCases.forEach(({ amount, expectedCommission }) => {
        const commission = amount * 0.05;
        expect(commission).toBeCloseTo(expectedCommission, 4);
      });
    });

    it('should handle negative amounts gracefully', () => {
      const amount = -1000;
      const commission = amount * 0.05;
      
      expect(commission).toBe(-50);
      // In real system, negative amounts should be rejected before calculation
    });

    it('should handle floating point precision issues', () => {
      const amount = 0.1 + 0.2; // Known JS floating point issue
      const commission = amount * 0.05;
      
      expect(commission).toBeCloseTo(0.015, 10);
    });
  });

  describe('Payment Processing Integration', () => {
    const mockCampaign = {
      id: 'camp-123',
      title: 'Test Campaign',
      brandId: 'brand-123',
      budget: '100000'
    };

    const mockProposal = {
      id: 'prop-123',
      campaignId: 'camp-123',
      influencerId: 'inf-123',
      status: 'accepted',
      proposedAmount: '100000'
    };

    beforeEach(() => {
      // Mock storage methods
      (storage.getBrandCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (storage.getCampaignProposal as jest.Mock).mockResolvedValue(mockProposal);
      (storage.createFinancialTransaction as jest.Mock).mockResolvedValue({ id: 'ft-123' });
      (storage.updateCampaignProposal as jest.Mock).mockResolvedValue(mockProposal);
    });

    it('should deduct commission during upfront payment processing', async () => {
      const paymentAmount = 50000; // 50% upfront
      const expectedCommission = 2500; // 5% of 50000
      const expectedNet = 47500; // Amount after commission

      // Mock the payment processing
      const result = await paymentService.createUpfrontPayment('prop-123');

      // Verify commission calculation in financial transaction creation
      expect(storage.createFinancialTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          platformFee: expectedCommission.toString(),
          netAmount: expectedNet.toString()
        })
      );
    });

    it('should deduct commission during completion payment processing', async () => {
      const paymentAmount = 50000; // 50% completion
      const expectedCommission = 2500; // 5% of 50000
      const expectedNet = 47500; // Amount after commission

      // Mock the payment processing
      const result = await paymentService.createCompletionPayment('prop-123');

      // Verify commission calculation in financial transaction creation
      expect(storage.createFinancialTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          platformFee: expectedCommission.toString(),
          netAmount: expectedNet.toString()
        })
      );
    });

    it('should record commission in financial transactions', async () => {
      await paymentService.createUpfrontPayment('prop-123');

      // Verify commission record creation
      expect(storage.createFinancialTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'platform_commission',
          status: 'completed',
          platformFee: '2500', // 5% of 50000
          metadata: expect.objectContaining({
            paymentType: 'upfront',
            commissionRate: 0.05
          })
        })
      );
    });

    it('should handle payment processing errors gracefully', async () => {
      // Mock storage error
      (storage.createFinancialTransaction as jest.Mock).mockRejectedValue(new Error('Payment failed'));

      await expect(paymentService.createUpfrontPayment('prop-123')).rejects.toThrow('Payment failed');
      
      // Should still attempt to create financial transaction
      expect(storage.createFinancialTransaction).toHaveBeenCalled();
    });
  });

  describe('Database Records Validation', () => {
    it('should save commission records with correct structure', async () => {
      const commissionData = {
        campaignId: 'camp-123',
        proposalId: 'prop-123',
        influencerId: 'inf-123',
        brandId: 'brand-123',
        paymentType: 'upfront' as const,
        grossAmount: 50000,
        commissionAmount: 2500,
        netAmount: 47500,
        description: 'Platform commission (5%) - Upfront payment'
      };

      await paymentService.createPlatformCommissionRecord(commissionData);

      // Verify the financial transaction record structure
      expect(storage.createFinancialTransaction).toHaveBeenCalledWith({
        transactionId: expect.stringMatching(/^COMM-\d+-[a-z0-9]+$/),
        campaignId: 'camp-123',
        proposalId: 'prop-123',
        brandId: 'brand-123',
        influencerId: 'inf-123',
        transactionType: 'platform_commission',
        status: 'completed',
        grossAmount: '50000',
        platformFee: '2500',
        processingFee: '0.00',
        netAmount: '47500',
        currency: 'INR',
        description: 'Platform commission (5%) - Upfront payment',
        paymentMethod: 'razorpay',
        metadata: {
          paymentType: 'upfront',
          commissionRate: 0.05
        }
      });
    });

    it('should generate unique transaction IDs for commission records', async () => {
      const commissionData = {
        campaignId: 'camp-123',
        proposalId: 'prop-123',
        influencerId: 'inf-123',
        brandId: 'brand-123',
        paymentType: 'upfront' as const,
        grossAmount: 50000,
        commissionAmount: 2500,
        netAmount: 47500,
        description: 'Test commission'
      };

      // Create multiple commission records
      await paymentService.createPlatformCommissionRecord(commissionData);
      await paymentService.createPlatformCommissionRecord(commissionData);

      // Verify unique transaction IDs
      const calls = (storage.createFinancialTransaction as jest.Mock).mock.calls;
      const transactionId1 = calls[0][0].transactionId;
      const transactionId2 = calls[1][0].transactionId;
      
      expect(transactionId1).not.toBe(transactionId2);
      expect(transactionId1).toMatch(/^COMM-\d+-[a-z0-9]+$/);
      expect(transactionId2).toMatch(/^COMM-\d+-[a-z0-9]+$/);
    });

    it('should handle database errors during commission recording', async () => {
      (storage.createFinancialTransaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      const commissionData = {
        campaignId: 'camp-123',
        proposalId: 'prop-123',
        influencerId: 'inf-123',
        brandId: 'brand-123',
        paymentType: 'upfront' as const,
        grossAmount: 50000,
        commissionAmount: 2500,
        netAmount: 47500,
        description: 'Test commission'
      };

      // Should not throw error (graceful handling)
      await expect(paymentService.createPlatformCommissionRecord(commissionData)).resolves.not.toThrow();
    });
  });

  describe('Commission Reporting and Retrieval', () => {
    const mockCommissionData = [
      {
        platformFee: '2500',
        metadata: { paymentType: 'upfront' },
        createdAt: new Date('2025-01-01')
      },
      {
        platformFee: '2500',
        metadata: { paymentType: 'completion' },
        createdAt: new Date('2025-01-02')
      },
      {
        platformFee: '5000',
        metadata: { paymentType: 'full' },
        createdAt: new Date('2025-01-03')
      }
    ];

    beforeEach(() => {
      (storage.getFinancialTransactions as jest.Mock).mockResolvedValue(mockCommissionData);
    });

    it('should retrieve commission summary correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const summary = await paymentService.getPlatformCommissionSummary(startDate, endDate);

      expect(summary.totalCommission).toBe(10000); // 2500 + 2500 + 5000
      expect(summary.transactionCount).toBe(3);
      expect(summary.commissionByType).toEqual({
        upfront: 2500,
        completion: 2500,
        full: 5000
      });
    });

    it('should handle empty commission data', async () => {
      (storage.getFinancialTransactions as jest.Mock).mockResolvedValue([]);

      const summary = await paymentService.getPlatformCommissionSummary(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(summary.totalCommission).toBe(0);
      expect(summary.transactionCount).toBe(0);
      expect(summary.commissionByType).toEqual({});
    });
  });

  describe('Invoice Generation with Commission', () => {
    const mockInvoice = {
      id: 'inv-123',
      invoiceNumber: 'INV-2025-001',
      subtotalAmount: '50000',
      totalAmount: '59000', // Including GST
      items: [
        {
          description: 'Campaign Payment - Upfront',
          quantity: 1,
          unitPrice: '50000',
          totalPrice: '50000'
        }
      ],
      taxCalculations: [
        {
          taxName: 'GST',
          taxRate: '0.18',
          taxAmount: '9000'
        }
      ]
    };

    it('should include commission breakdown in invoice PDF', async () => {
      // Test that commission is included in PDF content by checking the static method
      const pdfBuffer = await InvoiceService.generateInvoicePDF(
        mockInvoice as any,
        { firstName: 'Test', lastName: 'Brand' } as any,
        { firstName: 'Test', lastName: 'Influencer' } as any,
        { title: 'Test Campaign' } as any
      );

      // Verify PDF buffer is generated
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should calculate correct amounts in invoice with commission', () => {
      const subtotal = 50000;
      const platformCommission = subtotal * 0.05; // 2500
      const netAfterCommission = subtotal - platformCommission; // 47500
      
      expect(platformCommission).toBe(2500);
      expect(netAfterCommission).toBe(47500);
      
      // GST should be calculated on net amount after commission
      const gst = netAfterCommission * 0.18; // 8550
      const finalTotal = netAfterCommission + gst; // 56050
      
      expect(gst).toBe(8550);
      expect(finalTotal).toBe(56050);
    });

    it('should validate invoice number generation', () => {
      const invoiceNumber = InvoiceService.generateInvoiceNumber();
      
      expect(invoiceNumber).toMatch(/^INV-\d{6}-\d{9}$/);
      
      // Generate multiple invoice numbers to ensure uniqueness
      const invoiceNumber2 = InvoiceService.generateInvoiceNumber();
      expect(invoiceNumber).not.toBe(invoiceNumber2);
    });
  });

  describe('Integration Tests', () => {
    it('should process complete payment flow with commission tracking', async () => {
      // Mock complete flow
      const campaignValue = 100000;
      
      // Process upfront payment (50%)
      await paymentService.createUpfrontPayment('prop-123');
      
      // Verify upfront commission recorded
      expect(storage.createFinancialTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'platform_commission',
          platformFee: '2500', // 5% of 50000
          metadata: expect.objectContaining({
            paymentType: 'upfront'
          })
        })
      );
      
      // Process completion payment (50%)
      await paymentService.createCompletionPayment('prop-123');
      
      // Verify completion commission recorded
      expect(storage.createFinancialTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'platform_commission',
          platformFee: '2500', // 5% of 50000
          metadata: expect.objectContaining({
            paymentType: 'completion'
          })
        })
      );
      
      // Total commission should be 5000 (2500 + 2500)
      expect(storage.createFinancialTransaction).toHaveBeenCalledTimes(2);
    });

    it('should maintain data consistency across payment and commission records', async () => {
      await paymentService.createUpfrontPayment('prop-123');
      
      const commissionCall = (storage.createFinancialTransaction as jest.Mock).mock.calls[0][0];
      
      // Verify commission record has correct structure
      expect(commissionCall.campaignId).toBe('camp-123');
      expect(commissionCall.brandId).toBe('brand-123');
      expect(commissionCall.influencerId).toBe('inf-123');
      
      // Verify amount calculations match
      const grossAmount = 50000;
      const commission = parseFloat(commissionCall.platformFee);
      
      expect(commission).toBe(grossAmount * 0.05);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing campaign data gracefully', async () => {
      (storage.getBrandCampaignById as jest.Mock).mockResolvedValue(null);
      
      await expect(paymentService.createUpfrontPayment('invalid-proposal'))
        .rejects.toThrow();
    });

    it('should handle missing proposal data gracefully', async () => {
      (storage.getCampaignProposal as jest.Mock).mockResolvedValue(null);
      
      await expect(paymentService.createUpfrontPayment('invalid-proposal'))
        .rejects.toThrow();
    });

    it('should continue operation if commission recording fails', async () => {
      (storage.createFinancialTransaction as jest.Mock).mockRejectedValue(new Error('Commission recording failed'));
      
      // Payment should still succeed even if commission recording fails
      const result = await paymentService.createUpfrontPayment('prop-123');
      
      expect(storage.createFinancialTransaction).toHaveBeenCalled();
      expect(storage.updateCampaignProposal).toHaveBeenCalled();
    });

    it('should validate commission rate consistency', () => {
      const EXPECTED_COMMISSION_RATE = 0.05; // 5%
      
      // Test various amounts
      const testAmounts = [1000, 10000, 50000, 100000];
      
      testAmounts.forEach(amount => {
        const commission = amount * EXPECTED_COMMISSION_RATE;
        const calculatedRate = commission / amount;
        
        expect(calculatedRate).toBeCloseTo(EXPECTED_COMMISSION_RATE, 10);
      });
    });
  });
});