import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { storage } from './storage';
import { PLATFORM_CONFIG } from '../shared/config.js';
import type { 
  Invoice, 
  InvoiceItem, 
  InvoiceTaxCalculation, 
  PaymentMilestone,
  InsertPaymentMilestone,
  User, 
  BrandCampaign,
  CampaignProposal 
} from '@shared/schema';

// Tax rates by region (this would typically come from a tax service API)
export const TAX_RATES = {
  // United States
  'US-CA': { rate: 0.0825, type: 'Sales Tax', name: 'California Sales Tax' },
  'US-NY': { rate: 0.08, type: 'Sales Tax', name: 'New York Sales Tax' },
  'US-TX': { rate: 0.0625, type: 'Sales Tax', name: 'Texas Sales Tax' },
  'US-FL': { rate: 0.06, type: 'Sales Tax', name: 'Florida Sales Tax' },
  'US-WA': { rate: 0.065, type: 'Sales Tax', name: 'Washington Sales Tax' },
  
  // European Union (VAT)
  'EU-DE': { rate: 0.19, type: 'VAT', name: 'German VAT' },
  'EU-FR': { rate: 0.20, type: 'VAT', name: 'French VAT' },
  'EU-UK': { rate: 0.20, type: 'VAT', name: 'UK VAT' },
  'EU-IT': { rate: 0.22, type: 'VAT', name: 'Italian VAT' },
  'EU-ES': { rate: 0.21, type: 'VAT', name: 'Spanish VAT' },
  'EU-NL': { rate: 0.21, type: 'VAT', name: 'Dutch VAT' },
  
  // Canada (GST/HST)
  'CA-ON': { rate: 0.13, type: 'HST', name: 'Ontario HST' },
  'CA-BC': { rate: 0.12, type: 'PST + GST', name: 'BC PST + GST' },
  'CA-AB': { rate: 0.05, type: 'GST', name: 'Alberta GST' },
  'CA-QC': { rate: 0.14975, type: 'GST + QST', name: 'Quebec GST + QST' },
  
  // Australia (GST)
  'AU': { rate: 0.10, type: 'GST', name: 'Australian GST' },
  
  // India (GST)
  'IN': { rate: 0.18, type: 'GST', name: 'Indian GST' }
} as const;

export interface InvoiceGenerationData {
  campaign: BrandCampaign;
  proposal: CampaignProposal;
  brand: User;
  influencer: User;
  deliverables: Array<{
    id: string;
    description: string;
    amount: number;
    quantity?: number;
  }>;
  paymentTerms?: string;
  notes?: string;
}

export interface TaxCalculationResult {
  subtotal: number;
  taxCalculations: Array<{
    jurisdiction: string;
    region: string;
    name: string;
    taxableAmount: number;
    rate: number;
    amount: number;
    type: string;
  }>;
  totalTax: number;
  total: number;
}

export class InvoiceService {
  // Helper method to get brand's currency preference
  private static async getBrandCurrency(brandId: string): Promise<string> {
    try {
      const brand = await storage.getBrandProfile(brandId);
      return brand?.preferredCurrency || 'INR';
    } catch (error) {
      console.error('Error fetching brand currency preference:', error);
      return 'INR'; // fallback to INR
    }
  }

  // Get currency symbol for PDF display
  private static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'INR': '₹',
      'USD': '$', 
      'GBP': '£',
      'EUR': '€'
    };
    return symbols[currency] || currency;
  }

  // Format currency amount for PDF display
  private static formatCurrencyForPDF(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  }
  /**
   * Calculate VAT/GST based on user location and tax jurisdiction
   */
  static calculateTax(
    subtotal: number, 
    taxRegion: string,
    exemptionReason?: string
  ): TaxCalculationResult {
    if (exemptionReason) {
      return {
        subtotal,
        taxCalculations: [],
        totalTax: 0,
        total: subtotal
      };
    }

    const taxConfig = TAX_RATES[taxRegion as keyof typeof TAX_RATES];
    
    if (!taxConfig) {
      // No tax configuration found - assume tax-free region
      return {
        subtotal,
        taxCalculations: [],
        totalTax: 0,
        total: subtotal
      };
    }

    const taxAmount = subtotal * taxConfig.rate;
    
    return {
      subtotal,
      taxCalculations: [{
        jurisdiction: taxRegion.includes('-') ? 'state' : 'federal',
        region: taxRegion,
        name: taxConfig.name,
        taxableAmount: subtotal,
        rate: taxConfig.rate,
        amount: taxAmount,
        type: taxConfig.type.toLowerCase().replace(/ /g, '_')
      }],
      totalTax: taxAmount,
      total: subtotal + taxAmount
    };
  }

  /**
   * Generate unique invoice number
   */
  static generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `INV-${year}${month}-${timestamp.toString().slice(-6)}${random}`;
  }

  /**
   * Generate professional PDF invoice
   */
  static async generateInvoicePDF(
    invoice: Invoice & {
      items: InvoiceItem[];
      taxCalculations: InvoiceTaxCalculation[];
    },
    brandData: User,
    influencerData: User,
    campaignData: BrandCampaign
  ): Promise<Buffer> {
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: `Invoice ${invoice.invoiceNumber}`,
      subject: `Invoice for Campaign: ${campaignData.title}`,
      author: 'Influencer Hub Platform',
      keywords: 'invoice, campaign, influencer, marketing',
      creator: 'Influencer Hub'
    });

    // Colors and styling
    const primaryColor = [51, 51, 51] as [number, number, number]; // Dark gray
    const accentColor = [59, 130, 246] as [number, number, number]; // Blue
    const lightGray = [245, 245, 245] as [number, number, number];
    
    let yPosition = 20;

    // Header with platform branding
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('INVOICE', 20, 16);
    
    doc.setFontSize(12);
    doc.text('Influencer Hub Platform', 150, 16);
    
    yPosition = 35;

    // Invoice details box
    doc.setFillColor(...lightGray);
    doc.rect(130, yPosition, 70, 35, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.text('Invoice Number:', 135, yPosition + 8);
    doc.setFontSize(12);
    doc.text(invoice.invoiceNumber, 135, yPosition + 15);
    
    doc.setFontSize(10);
    doc.text('Issue Date:', 135, yPosition + 22);
    doc.text(format(invoice.issueDate ? new Date(invoice.issueDate) : new Date(), 'MMM dd, yyyy'), 135, yPosition + 29);
    
    if (invoice.paymentDueDate) {
      doc.text('Due Date:', 135, yPosition + 36);
      doc.text(format(new Date(invoice.paymentDueDate), 'MMM dd, yyyy'), 135, yPosition + 43);
    }

    yPosition += 50;

    // Bill From (Brand) and Bill To (Influencer) sections
    doc.setFontSize(14);
    doc.setTextColor(...accentColor);
    doc.text('Bill From:', 20, yPosition);
    doc.text('Bill To:', 110, yPosition);
    
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    
    // Brand information
    const brandName = brandData.firstName && brandData.lastName 
      ? `${brandData.firstName} ${brandData.lastName}` 
      : brandData.email || 'Brand';
    doc.text(brandName, 20, yPosition);
    if (invoice.brandBillingAddress) {
      const address = invoice.brandBillingAddress as any;
      if (address.company) doc.text(address.company, 20, yPosition + 6);
      if (address.street) doc.text(address.street, 20, yPosition + 12);
      if (address.city && address.state) {
        doc.text(`${address.city}, ${address.state} ${address.zipCode || ''}`, 20, yPosition + 18);
      }
      if (address.country) doc.text(address.country, 20, yPosition + 24);
    }
    
    // Influencer information
    const influencerName = influencerData.firstName && influencerData.lastName 
      ? `${influencerData.firstName} ${influencerData.lastName}` 
      : influencerData.email || 'Influencer';
    doc.text(influencerName, 110, yPosition);
    if (invoice.influencerBillingAddress) {
      const address = invoice.influencerBillingAddress as any;
      if (address.company) doc.text(address.company, 110, yPosition + 6);
      if (address.street) doc.text(address.street, 110, yPosition + 12);
      if (address.city && address.state) {
        doc.text(`${address.city}, ${address.state} ${address.zipCode || ''}`, 110, yPosition + 18);
      }
      if (address.country) doc.text(address.country, 110, yPosition + 24);
    }

    yPosition += 40;

    // Campaign information
    doc.setFillColor(...lightGray);
    doc.rect(20, yPosition, 170, 20, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(...accentColor);
    doc.text('Campaign Details:', 25, yPosition + 8);
    
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text(`Campaign: ${campaignData.title}`, 25, yPosition + 8);
    if (campaignData.description) {
      const description = campaignData.description.length > 80 
        ? campaignData.description.substring(0, 80) + '...'
        : campaignData.description;
      doc.text(`Description: ${description}`, 25, yPosition + 15);
    }

    yPosition += 35;

    // Invoice items table
    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      InvoiceService.formatCurrencyForPDF(Number(item.unitPrice), invoice.currency || 'INR'),
      InvoiceService.formatCurrencyForPDF(Number(item.totalPrice), invoice.currency || 'INR')
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: accentColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: primaryColor
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Tax calculations and totals
    const totalsStartX = 130;
    
    doc.setFontSize(10);
    doc.text('Subtotal:', totalsStartX, yPosition);
    doc.text(InvoiceService.formatCurrencyForPDF(Number(invoice.subtotalAmount), invoice.currency || 'INR'), 185, yPosition, { align: 'right' });
    
    yPosition += 8;

    // No platform fee deduction on invoice - brand pays full amount
    // Platform commission is handled separately in payment processing

    // Tax breakdown
    if (invoice.taxCalculations && invoice.taxCalculations.length > 0) {
      invoice.taxCalculations.forEach(tax => {
        doc.text(`${tax.taxName} (${(Number(tax.taxRate) * 100).toFixed(2)}%):`, totalsStartX, yPosition);
        doc.text(InvoiceService.formatCurrencyForPDF(Number(tax.taxAmount), invoice.currency || 'INR'), 185, yPosition, { align: 'right' });
        yPosition += 6;
      });
      yPosition += 2;
    }

    // Total line
    doc.setFillColor(...accentColor);
    doc.rect(totalsStartX - 5, yPosition - 2, 70, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('TOTAL:', totalsStartX, yPosition + 6);
    doc.text(InvoiceService.formatCurrencyForPDF(Number(invoice.totalAmount), invoice.currency || 'INR'), 185, yPosition + 6, { align: 'right' });

    yPosition += 20;

    // Payment terms and notes
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    
    // Payment information
    doc.text('Payment Information:', 20, yPosition);
    const paymentInfo = doc.splitTextToSize(
      'This invoice represents the full campaign compensation amount to be paid by the brand. Upon payment, a 5% platform commission will be automatically deducted to cover platform services, with the remaining amount transferred to the influencer.',
      170
    );
    doc.text(paymentInfo, 20, yPosition + 6);
    yPosition += paymentInfo.length * 4 + 15;
    
    if (invoice.paymentTerms) {
      doc.text('Payment Terms:', 20, yPosition);
      const paymentTermsText = this.formatPaymentTerms(invoice.paymentTerms);
      doc.text(paymentTermsText, 20, yPosition + 6);
      yPosition += 15;
    }
    
    if (invoice.notes) {
      doc.text('Notes:', 20, yPosition);
      const notes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(notes, 20, yPosition + 6);
      yPosition += notes.length * 5 + 10;
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'Generated by Influencer Hub Platform | This invoice was automatically generated.',
      105, pageHeight - 10, 
      { align: 'center' }
    );

    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Format payment terms for display
   */
  private static formatPaymentTerms(terms: string): string {
    const termMap: Record<string, string> = {
      'immediate': 'Payment due immediately upon receipt',
      'net_15': 'Payment due within 15 days',
      'net_30': 'Payment due within 30 days', 
      'net_60': 'Payment due within 60 days'
    };
    
    return termMap[terms] || terms;
  }

  /**
   * Calculate payment due date based on payment terms
   */
  static calculateDueDate(issueDate: Date, paymentTerms: string): Date {
    const dueDate = new Date(issueDate);
    
    switch (paymentTerms) {
      case 'immediate':
        return dueDate;
      case 'net_15':
        dueDate.setDate(dueDate.getDate() + 15);
        break;
      case 'net_30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'net_60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 30); // Default to 30 days
    }
    
    return dueDate;
  }

  /**
   * Determine tax region based on user location
   */
  static determineTaxRegion(user: User): string {
    // This would typically integrate with a tax service or user profile data
    // For now, we'll use a simple mapping based on user data
    // Note: In a real implementation, you'd store country/state in user profile
    
    // Check user location for specific country indicators
    const location = user.location?.toUpperCase() || '';
    
    // Check for specific countries in location
    if (location.includes('CANADA')) {
      return 'CA-ON'; // Default to Ontario
    }
    if (location.includes('UNITED STATES') || location.includes('USA')) {
      return 'US-CA'; // Default to California
    }
    if (location.includes('AUSTRALIA')) {
      return 'AU';
    }
    if (location.includes('GERMANY')) {
      return 'EU-DE';
    }
    if (location.includes('FRANCE')) {
      return 'EU-FR';
    }
    if (location.includes('UNITED KINGDOM') || location.includes('UK')) {
      return 'EU-UK';
    }
    
    // Default to configured tax region
    return PLATFORM_CONFIG.tax.defaultRegion;
  }

  /**
   * Generate milestone payments for an invoice
   */
  static async generateMilestonePayments(invoice: Invoice): Promise<PaymentMilestone[]> {
    // Import db here to avoid circular dependencies
    const { db } = await import('./db');
    const { paymentMilestones } = await import('@shared/schema');

    const milestones: InsertPaymentMilestone[] = [];
    const totalAmount = parseFloat(invoice.totalAmount);

    // Use configurable milestone structure from platform config
    const milestoneStructure = PLATFORM_CONFIG.milestones.defaultStructure;

    // Create milestone payment records
    for (const milestone of milestoneStructure) {
      const amount = (totalAmount * milestone.percentage) / 100;
      
      milestones.push({
        invoiceId: invoice.id,
        milestoneNumber: milestone.number,
        description: milestone.description,
        milestoneType: milestone.type,
        amount: amount.toFixed(2),
        percentage: milestone.percentage.toString(),
        status: milestone.number === 1 ? 'ready' : 'pending', // First milestone is ready for payment
        triggerCondition: milestone.triggerCondition,
        requirements: milestone.requirements,
        conditionMet: milestone.number === 1, // First milestone condition is automatically met
        dueDate: milestone.number === 1 ? new Date() : undefined, // First milestone due immediately
        notes: `Milestone ${milestone.number} of 3 - ${milestone.percentage}% of total campaign value`
      });
    }

    // Insert milestone payments into database
    const createdMilestones = await db.insert(paymentMilestones).values(milestones).returning();
    
    return createdMilestones;
  }
}