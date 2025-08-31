import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CreditCard, CheckCircle, AlertCircle, XCircle, Settings, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment system status
  const { data: systemData, isLoading } = useQuery({
    queryKey: ['/api/payment-system-status'],
    queryFn: async () => {
      const response = await apiRequest('/api/payment-system-status', 'GET');
      return response.json();
    },
  });

  // Fetch pending payments
  const { data: pendingPaymentsData } = useQuery({
    queryKey: ['/api/pending-payments'],
    queryFn: async () => {
      const response = await apiRequest('/api/pending-payments', 'GET');
      return response.json();
    },
  });

  const systemStatus = systemData || {};
  const pendingPayments = pendingPaymentsData?.pendingPayments || [];


  const processPaymentMutation = useMutation({
    mutationFn: ({ campaignId, proposalId }: { campaignId: string; proposalId: string }) =>
      apiRequest('/api/payments/process', 'POST', { campaignId, proposalId }),
    onSuccess: () => {
      toast({
        title: 'Payment Initiated',
        description: 'Payment has been processed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pending-payments'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    },
  });


  const handleProcessPayment = (campaignId: string, proposalId: string) => {
    processPaymentMutation.mutate({ campaignId, proposalId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6" data-testid="payment-settings-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-muted-foreground">
          Configure your payment gateway and manage influencer payments
        </p>
      </div>

      {/* System Payment Status */}
      <Card data-testid="payment-system-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Payment System Status
          </CardTitle>
          <CardDescription>
            Centralized payment processing powered by Razorpay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${systemStatus.configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div>
                <p className="font-medium">Payment Gateway</p>
                <p className="text-sm text-gray-600">
                  {systemStatus.configured ? 'Active and Ready' : 'Configuring...'}
                </p>
              </div>
            </div>
            <Badge variant={systemStatus.configured ? 'default' : 'secondary'}>
              {systemStatus.configured ? 'Operational' : 'Setup Required'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-gray-600">Default Currency:</p>
              <p className="font-medium">INR (Indian Rupee)</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">Payment Terms:</p>
              <p className="font-medium">7 days</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">Processing Fee:</p>
              <p className="font-medium">2.9% + ₹3</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">Settlement:</p>
              <p className="font-medium">T+2 days</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <Settings className="w-4 h-4 inline mr-1" />
              Payment processing is handled centrally for security and compliance.
              All payments are processed securely through Razorpay.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card data-testid="pending-payments-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pending Payments
              <Badge variant="secondary">{pendingPayments.length}</Badge>
            </CardTitle>
            <CardDescription>
              Process payments for completed campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((item: any) => (
                <div
                  key={`${item.campaign.id}-${item.proposal.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`pending-payment-${item.campaign.id}`}
                >
                  <div className="space-y-1">
                    <h4 className="font-medium">{item.campaign.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Influencer: {item.influencer?.username || 'Unknown'}
                    </p>
                    <p className="text-sm">
                      Amount: ₹{item.proposal.proposedCompensation?.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-600">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                    <Button
                      onClick={() => handleProcessPayment(item.campaign.id, item.proposal.id)}
                      disabled={processPaymentMutation.isPending}
                      size="sm"
                      data-testid={`button-process-payment-${item.campaign.id}`}
                    >
                      {processPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}