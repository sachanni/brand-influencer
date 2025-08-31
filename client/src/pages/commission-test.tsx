import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calculator, CreditCard, TrendingDown, TrendingUp, Info } from "lucide-react";
import { useBrandCurrency } from "@/hooks/useBrandCurrency";

export default function CommissionTest() {
  const { formatBrandCurrency } = useBrandCurrency();
  const [paymentAmount, setPaymentAmount] = useState("10000");
  const [paymentType, setPaymentType] = useState<"upfront" | "completion" | "full">("upfront");
  const [gstRate] = useState(18); // Fixed 18% GST for India

  // Calculate commission breakdown
  const grossAmount = parseFloat(paymentAmount) || 0;
  const platformCommission = grossAmount * 0.05; // 5% platform commission
  const netAfterCommission = grossAmount - platformCommission;
  const gstAmount = netAfterCommission * (gstRate / 100);
  const finalAmount = netAfterCommission + gstAmount;

  // Payment structure breakdown
  const getPaymentBreakdown = () => {
    if (paymentType === "upfront") {
      return {
        description: "Upfront Payment (50% of campaign value)",
        platformCommission: platformCommission * 0.5,
        netAmount: netAfterCommission * 0.5,
        gstAmount: gstAmount * 0.5,
        finalAmount: finalAmount * 0.5
      };
    } else if (paymentType === "completion") {
      return {
        description: "Completion Payment (50% of campaign value)",
        platformCommission: platformCommission * 0.5,
        netAmount: netAfterCommission * 0.5,
        gstAmount: gstAmount * 0.5,
        finalAmount: finalAmount * 0.5
      };
    } else {
      return {
        description: "Full Payment (100% of campaign value)",
        platformCommission,
        netAmount: netAfterCommission,
        gstAmount,
        finalAmount
      };
    }
  };

  const breakdown = getPaymentBreakdown();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Commission Calculator & Test
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test and verify the 5% platform commission system with different payment scenarios
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-600" />
                Payment Parameters
              </CardTitle>
              <CardDescription>
                Enter campaign payment details to see commission breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="payment-amount">Campaign Payment Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount in INR"
                  className="mt-1"
                  data-testid="input-payment-amount"
                />
              </div>

              <div>
                <Label>Payment Type</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={paymentType === "upfront" ? "default" : "outline"}
                    onClick={() => setPaymentType("upfront")}
                    className="flex-1"
                    data-testid="button-upfront"
                  >
                    Upfront (50%)
                  </Button>
                  <Button
                    variant={paymentType === "completion" ? "default" : "outline"}
                    onClick={() => setPaymentType("completion")}
                    className="flex-1"
                    data-testid="button-completion"
                  >
                    Completion (50%)
                  </Button>
                  <Button
                    variant={paymentType === "full" ? "default" : "outline"}
                    onClick={() => setPaymentType("full")}
                    className="flex-1"
                    data-testid="button-full"
                  >
                    Full (100%)
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Payment Structure:</p>
                    <p>• Upfront: 50% of campaign value when project starts</p>
                    <p>• Completion: 50% when project is delivered and approved</p>
                    <p>• Full: 100% for smaller campaigns or custom arrangements</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                Commission Breakdown
              </CardTitle>
              <CardDescription>
                {breakdown.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Gross Amount */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">Gross Campaign Value</span>
                  <span className="font-bold text-green-600" data-testid="text-gross-amount">
                    {formatBrandCurrency(grossAmount)}
                  </span>
                </div>

                {/* Platform Commission */}
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Platform Commission (5%)</span>
                    <Badge variant="secondary" className="text-xs">Platform Revenue</Badge>
                  </div>
                  <span className="font-bold text-red-600" data-testid="text-platform-commission">
                    -{formatBrandCurrency(breakdown.platformCommission)}
                  </span>
                </div>

                {/* Net After Commission */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="font-medium">Net After Commission</span>
                  <span className="font-bold text-blue-600" data-testid="text-net-after-commission">
                    {formatBrandCurrency(breakdown.netAmount)}
                  </span>
                </div>

                <Separator />

                {/* GST Calculation */}
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <span className="font-medium">GST (18%)</span>
                  <span className="font-bold text-yellow-600" data-testid="text-gst-amount">
                    +{formatBrandCurrency(breakdown.gstAmount)}
                  </span>
                </div>

                <Separator />

                {/* Final Amount */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-lg">Final Amount to Influencer</span>
                  </div>
                  <span className="font-bold text-xl text-green-600" data-testid="text-final-amount">
                    {formatBrandCurrency(breakdown.finalAmount)}
                  </span>
                </div>

                {/* Payment Type Badge */}
                <div className="text-center pt-4">
                  <Badge variant="outline" className="capitalize text-sm" data-testid="badge-payment-type">
                    {paymentType} Payment
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="text-platform-revenue">
                {formatBrandCurrency(breakdown.platformCommission)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                5% commission earned by platform
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Influencer Receives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-influencer-receives">
                {formatBrandCurrency(breakdown.finalAmount)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Net amount after commission + GST
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Effective Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {grossAmount > 0 ? ((breakdown.platformCommission / grossAmount) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Actual commission rate applied
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Phase 1 Information */}
        <Card className="mt-8 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Phase 1 Monetization Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-purple-600">Current Model (Phase 1)</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 5% commission on all campaign payments</li>
                  <li>• Transparent fee structure with clear disclosure</li>
                  <li>• Automatic deduction from all payment types</li>
                  <li>• Revenue tracking for business intelligence</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-orange-600">Future Phases</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Subscription tiers with reduced commission rates</li>
                  <li>• Premium services and tools</li>
                  <li>• Advanced analytics and insights</li>
                  <li>• White-label solutions for agencies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}