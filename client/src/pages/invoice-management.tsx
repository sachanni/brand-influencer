import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useBrandCurrency } from "@/hooks/useBrandCurrency";
import { Navigation } from "@/components/layout/navigation";
import { BrandNav } from "@/components/BrandNav";
import { InfluencerNav } from "@/components/InfluencerNav";
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Receipt,
  Building,
  User,
  ExternalLink,
  Target,
  TrendingUp
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  brandId: string;
  influencerId: string;
  campaignId: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoiceType: 'campaign_payment' | 'milestone_payment' | 'bonus_payment';
  subtotalAmount: string;
  vatGstAmount: string;
  totalAmount: string;
  paidAmount?: string;
  currency: string;
  issueDate: string;
  paymentDueDate: string;
  paidDate?: string;
  brandName?: string;
  influencerName?: string;
  campaignTitle?: string;
  billingAddress?: string;
  paymentTerms?: string;
  notes?: string;
  items?: InvoiceItem[];
  taxCalculations?: TaxCalculation[];
  milestones?: PaymentMilestone[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface TaxCalculation {
  id: string;
  taxType: string;
  taxRate: number;
  taxableAmount: string;
  taxAmount: string;
  region: string;
}

interface PaymentMilestone {
  id: string;
  milestoneNumber: number;
  description: string;
  milestoneType: 'upfront' | 'content_delivery' | 'completion' | 'performance_bonus';
  amount: string;
  percentage: string;
  status: 'pending' | 'ready' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: string;
  paidDate?: string;
  paidAmount?: string;
  requirements?: string;
  notes?: string;
}

export default function InvoiceManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatBrandCurrency } = useBrandCurrency();
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    invoiceType: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['/api/invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      
      const response = await apiRequest(`/api/invoices?${params}`, 'GET');
      return response.json();
    },
  });

  // Fetch invoice statistics
  const { data: statsData } = useQuery({
    queryKey: ['/api/invoices/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/invoices/stats', 'GET');
      return response.json();
    },
  });

  const invoices = invoicesData?.invoices || [];
  const stats = statsData?.stats || {};

  // Download PDF mutation
  const downloadPdfMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiRequest(`/api/invoices/${invoiceId}/pdf`, 'GET');
      return response.blob();
    },
    onSuccess: (blob, invoiceId) => {
      const invoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice?.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: "Invoice PDF has been downloaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to download invoice PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  // View invoice details
  const viewInvoiceDetails = async (invoice: Invoice) => {
    try {
      const response = await apiRequest(`/api/invoices/${invoice.id}`, 'GET');
      const data = await response.json();
      setSelectedInvoice(data.invoice);
      setShowInvoiceDetail(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invoice details.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'sent': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Currency formatting now uses brand's preferred currency via useBrandCurrency hook

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-based Navigation */}
        {(user as any)?.role === 'brand' ? <BrandNav /> : <InfluencerNav />}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Receipt className="h-8 w-8 text-brand-teal" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
              <p className="text-gray-600">
                {(user as any)?.role === 'brand' ? 'Manage your campaign invoices and payments' : 'Track your earnings and invoice history'}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-invoices" className="border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Invoices</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">All time</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-paid-invoices" className="border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Paid Invoices</p>
                  <p className="text-3xl font-bold text-green-700">{stats.paid || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Completed</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-invoices" className="border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Pending</p>
                  <p className="text-3xl font-bold text-orange-700">{stats.pending || 0}</p>
                  <p className="text-xs text-orange-600 mt-1">Awaiting payment</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-amount" className="border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Value</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {formatBrandCurrency(String(stats.totalAmount || 0))}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Revenue</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="mb-8 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white" data-testid="card-filters">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-gray-800">Smart Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Invoice number, campaign..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters({...filters, status: value})}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="invoiceType">Type</Label>
                <Select 
                  value={filters.invoiceType} 
                  onValueChange={(value) => setFilters({...filters, invoiceType: value})}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="campaign_payment">Campaign Payment</SelectItem>
                    <SelectItem value="milestone_payment">Milestone Payment</SelectItem>
                    <SelectItem value="bonus_payment">Bonus Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  data-testid="input-start-date"
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  data-testid="input-end-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beautiful Card-Based Invoice Display */}
        <Card data-testid="card-invoices-display" className="border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-gray-800">
                {(user as any)?.role === 'brand' ? 'Campaign Invoices' : 'Your Invoices'}
              </span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {invoices.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4 text-lg">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No invoices found</h3>
                <p className="text-gray-500">Your invoices will appear here once created</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {invoices.map((invoice: Invoice) => (
                  <Card 
                    key={invoice.id} 
                    className="border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer bg-gradient-to-r from-white to-blue-50/30"
                    data-testid={`card-invoice-${invoice.id}`}
                    onClick={() => viewInvoiceDetails(invoice)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        {/* Left Side - Invoice Info */}
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 rounded-full">
                            {getStatusIcon(invoice.status)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-bold text-gray-900">{invoice.invoiceNumber}</h3>
                              <Badge className={`${getStatusColor(invoice.status)} border font-medium`}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                {(user as any)?.role === 'brand' ? (
                                  <>
                                    <User className="h-4 w-4" />
                                    <span>{invoice.influencerName || 'Unknown'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Building className="h-4 w-4" />
                                    <span>{invoice.brandName || 'Unknown'}</span>
                                  </>
                                )}
                              </span>
                              <span>•</span>
                              <span>{invoice.campaignTitle || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Issued: {formatDate(invoice.issueDate)}</span>
                              <span>•</span>
                              <span className={`flex items-center space-x-1 ${
                                new Date(invoice.paymentDueDate) < new Date() && invoice.status !== 'paid' 
                                  ? 'text-red-600 font-medium' 
                                  : 'text-gray-500'
                              }`}>
                                <Calendar className="h-4 w-4" />
                                <span>Due: {formatDate(invoice.paymentDueDate)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Side - Amount & Actions */}
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {formatBrandCurrency(invoice.totalAmount)}
                            </p>
                            <p className="text-sm text-gray-500">Total Amount</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewInvoiceDetails(invoice);
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                              data-testid={`button-view-${invoice.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadPdfMutation.mutate(invoice.id);
                              }}
                              disabled={downloadPdfMutation.isPending}
                              className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-200"
                              data-testid={`button-download-${invoice.id}`}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {downloadPdfMutation.isPending ? 'Loading...' : 'PDF'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Detail Modal */}
        <Dialog open={showInvoiceDetail} onOpenChange={setShowInvoiceDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Invoice Details</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Invoice Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}</div>
                      <div><strong>Issue Date:</strong> {formatDate(selectedInvoice.issueDate)}</div>
                      <div><strong>Due Date:</strong> {formatDate(selectedInvoice.paymentDueDate)}</div>
                      <div><strong>Payment Terms:</strong> {selectedInvoice.paymentTerms || 'Net 30'}</div>
                      <div className="flex items-center space-x-2">
                        <strong>Status:</strong>
                        <Badge className={`${getStatusColor(selectedInvoice.status)} border`}>
                          {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {(user as any)?.role === 'brand' ? 'Influencer Details' : 'Brand Details'}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Name:</strong> {
                          (user as any)?.role === 'brand' 
                            ? selectedInvoice.influencerName 
                            : selectedInvoice.brandName
                        }
                      </div>
                      <div><strong>Campaign:</strong> {selectedInvoice.campaignTitle}</div>
                      {selectedInvoice.billingAddress && (
                        <div><strong>Address:</strong> {selectedInvoice.billingAddress}</div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Invoice Items */}
                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item: InvoiceItem) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatBrandCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatBrandCurrency(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <Separator />

                {/* Tax Calculations */}
                {selectedInvoice.taxCalculations && selectedInvoice.taxCalculations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tax Breakdown</h3>
                    <div className="space-y-2">
                      {selectedInvoice.taxCalculations.map((tax: TaxCalculation) => (
                        <div key={tax.id} className="flex justify-between text-sm">
                          <span>{tax.taxType} ({tax.taxRate}%) - {tax.region}</span>
                          <span>{formatBrandCurrency(tax.taxAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Invoice Totals */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatBrandCurrency(selectedInvoice.subtotalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT/GST (18%):</span>
                      <span>{formatBrandCurrency(selectedInvoice.vatGstAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>{formatBrandCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    {selectedInvoice.paidAmount && (
                      <div className="flex justify-between text-green-600">
                        <span>Paid:</span>
                        <span>{formatBrandCurrency(selectedInvoice.paidAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestone Payment Structure */}
                {selectedInvoice.milestones && selectedInvoice.milestones.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Milestone Payment Structure</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedInvoice.milestones.map((milestone) => (
                          <div key={milestone.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={
                                      milestone.status === 'paid' ? 'default' : 
                                      milestone.status === 'ready' ? 'secondary' : 'outline'
                                    }
                                    data-testid={`badge-milestone-${milestone.milestoneNumber}`}
                                  >
                                    {milestone.status === 'paid' ? 'Paid' : 
                                     milestone.status === 'ready' ? 'Ready' : 'Pending'}
                                  </Badge>
                                  <span className="font-medium text-sm">
                                    Milestone {milestone.milestoneNumber}: {milestone.percentage}%
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                {milestone.requirements && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    <strong>Requirements:</strong> {milestone.requirements}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold" data-testid={`amount-milestone-${milestone.milestoneNumber}`}>
                                  {formatBrandCurrency(milestone.amount)}
                                </div>
                                {milestone.status === 'paid' && milestone.paidDate && (
                                  <div className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Paid {new Date(milestone.paidDate).toLocaleDateString()}
                                  </div>
                                )}
                                {milestone.status === 'ready' && milestone.dueDate && (
                                  <div className="text-xs text-orange-600 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Due {new Date(milestone.dueDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 text-blue-800">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Payment Schedule Overview</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          This invoice follows a milestone-based payment structure with 50% upfront, 30% on content delivery, and 20% on completion.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => downloadPdfMutation.mutate(selectedInvoice.id)}
                    disabled={downloadPdfMutation.isPending}
                    data-testid="button-download-pdf"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}