import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, TrendingUp, Users, BarChart3, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CommissionSummary {
  totalCommission: number;
  commissionByType: Record<string, number>;
  transactionCount: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

interface CommissionResponse {
  success: boolean;
  commission: CommissionSummary;
}

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch platform commission data
  const { data: commissionData, isLoading, refetch } = useQuery<CommissionResponse>({
    queryKey: ['/api/platform/commission/summary', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/platform/commission/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch commission data');
      }
      return response.json();
    }
  });

  const commission = commissionData?.commission;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Revenue Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track platform commission (5%) and revenue metrics for business intelligence
          </p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-8 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                  data-testid="input-end-date"
                />
              </div>
              <Button onClick={() => refetch()} className="bg-purple-600 hover:bg-purple-700" data-testid="button-refresh">
                Update Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading commission data...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600" data-testid="text-total-commission">
                    ₹{commission?.totalCommission?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Platform revenue (5% commission)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transaction Count</CardTitle>
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600" data-testid="text-transaction-count">
                    {commission?.transactionCount || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Commission transactions processed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Per Transaction</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-avg-commission">
                    ₹{commission?.transactionCount ? (commission.totalCommission / commission.transactionCount).toFixed(2) : '0.00'}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Average commission per transaction
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">5.00%</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Platform commission rate (Phase 1)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Commission Breakdown */}
            <Card className="mb-8 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle>Commission Breakdown by Payment Type</CardTitle>
                <CardDescription>
                  Detailed breakdown of platform commission by payment stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commission?.commissionByType && Object.keys(commission.commissionByType).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(commission.commissionByType).map(([type, amount]) => (
                      <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize" data-testid={`badge-payment-type-${type}`}>
                            {type.replace('_', ' ')}
                          </Badge>
                          <span className="font-medium capitalize">
                            {type === 'upfront' ? 'Upfront Payments (50%)' : 
                             type === 'completion' ? 'Completion Payments (50%)' : 
                             type === 'full' ? 'Full Payments (100%)' : type}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-600" data-testid={`text-commission-${type}`}>
                            ₹{amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {commission.totalCommission ? ((amount / commission.totalCommission) * 100).toFixed(1) : 0}% of total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No commission transactions found for this period</p>
                    <p className="text-sm">Commission will appear here once payments are processed</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Period Information */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Report Period Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Reporting Period</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-report-period">
                      {commission?.period?.startDate} to {commission?.period?.endDate}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Commission Model</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phase 1 Launch: 5% commission on all campaign payments
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Future phases will include subscription tiers and premium services
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}