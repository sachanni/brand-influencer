import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  BarChart3, 
  Calculator, 
 
  TrendingUp, 
  Shield, 
  Users, 
  CreditCard,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function CommissionOverview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-purple-600 border-purple-200">
            Phase 1 Launch - Active
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Platform Commission System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our transparent 5% commission model ensures sustainable platform growth while providing exceptional value to influencers and brands
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-green-200 dark:border-green-800 text-center">
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-green-700 dark:text-green-400">Transparent Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clear 5% commission on all payments with full disclosure in invoices and receipts
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800 text-center">
            <CardHeader>
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-purple-700 dark:text-purple-400">Automatic Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Commission automatically deducted during payment processing with secure Razorpay integration
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800 text-center">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <CardTitle className="text-orange-700 dark:text-orange-400">Revenue Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time platform revenue monitoring with detailed analytics and business intelligence
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Commission Dashboard */}
          <Card className="border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                  <div>
                    <CardTitle className="text-purple-700 dark:text-purple-400">Platform Revenue Dashboard</CardTitle>
                    <CardDescription>Track commission earnings and platform metrics</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Commission Rate</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">5.00%</span>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Real-time Tracking</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">Live</span>
                </div>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• View total commission earnings by date range</li>
                <li>• Track commission breakdown by payment type (upfront/completion)</li>
                <li>• Monitor transaction volumes and success rates</li>
                <li>• Export reports for financial analysis</li>
              </ul>
              <Link href="/admin-dashboard">
                <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="button-admin-dashboard">
                  View Revenue Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Commission Calculator */}
          <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-6 w-6 text-orange-600" />
                  <div>
                    <CardTitle className="text-orange-700 dark:text-orange-400">Commission Calculator</CardTitle>
                    <CardDescription>Test and verify commission calculations</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">Test Tool</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Payment Types</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">3</span>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">GST Included</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">18%</span>
                </div>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Calculate commission for any payment amount</li>
                <li>• Test upfront, completion, and full payment scenarios</li>
                <li>• See transparent breakdown including GST calculations</li>
                <li>• Verify platform revenue and influencer net amounts</li>
              </ul>
              <Link href="/commission-test">
                <Button className="w-full bg-orange-600 hover:bg-orange-700" data-testid="button-commission-test">
                  Test Commission Calculator
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mb-8 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>How Platform Commission Works</CardTitle>
            <CardDescription>Step-by-step breakdown of our commission system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h4 className="font-medium mb-2">Campaign Payment</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Brand initiates payment for campaign (upfront, completion, or full)
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h4 className="font-medium mb-2">Commission Deduction</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  5% platform commission automatically deducted from gross payment
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-medium mb-2">GST Calculation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  18% GST applied to net amount (after commission deduction)
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <h4 className="font-medium mb-2">Payment Transfer</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Final amount transferred to influencer via Razorpay with transparent invoice
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase Roadmap */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Platform Monetization Roadmap</CardTitle>
            <CardDescription>Our phased approach to sustainable platform growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Badge variant="default" className="mb-3 bg-green-600">Phase 1 - Current</Badge>
                <h4 className="font-medium mb-2 text-green-700 dark:text-green-400">Commission Model</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 5% commission on all payments</li>
                  <li>• Transparent fee structure</li>
                  <li>• Basic platform features</li>
                  <li>• Revenue tracking system</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Badge variant="outline" className="mb-3 border-blue-600 text-blue-600">Phase 2 - Planned</Badge>
                <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-400">Subscription Tiers</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Basic: 5% commission</li>
                  <li>• Pro: 3% commission + monthly fee</li>
                  <li>• Enterprise: 1% commission + annual fee</li>
                  <li>• Advanced analytics and tools</li>
                </ul>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <Badge variant="outline" className="mb-3 border-purple-600 text-purple-600">Phase 3 - Future</Badge>
                <h4 className="font-medium mb-2 text-purple-700 dark:text-purple-400">Premium Services</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• White-label solutions</li>
                  <li>• API access for agencies</li>
                  <li>• Custom integrations</li>
                  <li>• Dedicated account management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}