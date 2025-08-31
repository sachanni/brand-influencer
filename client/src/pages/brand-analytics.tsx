import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  CreditCard,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  Download,
  Calendar
} from "lucide-react";
import { Navigation } from "@/components/layout/navigation";
import { BrandNav } from "@/components/BrandNav";

interface PerformanceData {
  metric: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

interface ContentPerformance {
  id: string;
  title: string;
  type: string;
  engagement: string;
  reach: string;
  platform: string;
  date: string;
}

interface InfluencerPerformance {
  id: string;
  name: string;
  category: string;
  followers: string;
  engagement: string;
  roi: string;
  status: string;
}

export default function BrandAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("all");

  const performanceData: PerformanceData[] = [
    { metric: "Total Campaigns", value: "47", change: "+12%", trend: "up" },
    { metric: "Active Influencers", value: "61", change: "+8%", trend: "up" },
    { metric: "Total Reach", value: "1.234M", change: "+15%", trend: "up" },
    { metric: "Avg Engagement", value: "4.2%", change: "-2%", trend: "down" }
  ];

  const topContent: ContentPerformance[] = [
    {
      id: "1",
      title: "Summer Skincare Collection",
      type: "Reel",
      engagement: "8.5%",
      reach: "245K",
      platform: "Instagram",
      date: "Dec 15"
    },
    {
      id: "2",
      title: "Fitness Transformation Challenge",
      type: "Video",
      engagement: "7.2%",
      reach: "189K",
      platform: "TikTok",
      date: "Dec 12"
    },
    {
      id: "3",
      title: "Luxury Perfume Review",
      type: "Story",
      engagement: "6.8%",
      reach: "156K",
      platform: "Instagram",
      date: "Dec 10"
    }
  ];

  const topInfluencers: InfluencerPerformance[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      category: "Beauty",
      followers: "245K",
      engagement: "4.8%",
      roi: "3.2x",
      status: "Active"
    },
    {
      id: "2",
      name: "Mike Chen",
      category: "Fitness",
      followers: "180K",
      engagement: "6.2%",
      roi: "4.1x",
      status: "Active"
    },
    {
      id: "3",
      name: "Emma Wilson",
      category: "Lifestyle",
      followers: "320K",
      engagement: "3.9%",
      roi: "2.8x",
      status: "Active"
    }
  ];

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'tiktok': return 'bg-purple-100 text-purple-800';
      case 'youtube': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrandNav />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Track your campaign performance and ROI</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32" data-testid="select-time-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2" data-testid="button-export">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {performanceData.map((data, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{data.metric}</p>
                    <p className="text-2xl font-bold text-gray-900">{data.value}</p>
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    data.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    <span>{data.change}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Campaign Performance Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Campaign Performance Over Time
              </CardTitle>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                {/* Chart placeholder - in a real app, use a charting library like recharts */}
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Campaign performance chart</p>
                  <p className="text-xs text-gray-400">15% increase in engagement this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Rate by Category */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Engagement Rate by Category
              </CardTitle>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Category engagement breakdown</p>
                  <p className="text-xs text-gray-400">Beauty: 34% • Fashion: 28% • Lifestyle: 38%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ROI Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                ROI Analysis by Platform
              </CardTitle>
              <Button variant="outline" size="sm">
                View Report
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-pink-600">IG</span>
                    </div>
                    <span className="font-medium">Instagram</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">284%</p>
                    <p className="text-xs text-gray-500">ROI</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-600">TT</span>
                    </div>
                    <span className="font-medium">TikTok</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">312%</p>
                    <p className="text-xs text-gray-500">ROI</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-red-600">YT</span>
                    </div>
                    <span className="font-medium">YouTube</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">198%</p>
                    <p className="text-xs text-gray-500">ROI</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reach Growth Trends */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Reach Growth Trends
              </CardTitle>
              <Button variant="outline" size="sm">
                View Trends
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Growth trend visualization</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-medium">+15% growth</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Best Performing</span>
                  <span className="font-medium">TikTok (+23%)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Reach</span>
                  <span className="font-medium">1.2M followers</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Content */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Performing Content</CardTitle>
            <Button variant="outline" size="sm">
              View All Content
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-left">
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-medium text-gray-600">Content</th>
                    <th className="pb-3 font-medium text-gray-600">Type</th>
                    <th className="pb-3 font-medium text-gray-600">Platform</th>
                    <th className="pb-3 font-medium text-gray-600">Engagement</th>
                    <th className="pb-3 font-medium text-gray-600">Reach</th>
                    <th className="pb-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {topContent.map((content) => (
                    <tr key={content.id} className="border-b border-gray-100">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded">
                            {/* Content thumbnail placeholder */}
                          </div>
                          <span className="font-medium">{content.title}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="outline">{content.type}</Badge>
                      </td>
                      <td className="py-4">
                        <Badge className={getPlatformColor(content.platform)}>
                          {content.platform}
                        </Badge>
                      </td>
                      <td className="py-4 font-medium">{content.engagement}</td>
                      <td className="py-4 font-medium">{content.reach}</td>
                      <td className="py-4 text-gray-500">{content.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Influencers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Performing Influencers</CardTitle>
            <Button variant="outline" size="sm">
              View All Influencers
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-left">
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-medium text-gray-600">Influencer</th>
                    <th className="pb-3 font-medium text-gray-600">Category</th>
                    <th className="pb-3 font-medium text-gray-600">Followers</th>
                    <th className="pb-3 font-medium text-gray-600">Engagement</th>
                    <th className="pb-3 font-medium text-gray-600">ROI</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topInfluencers.map((influencer) => (
                    <tr key={influencer.id} className="border-b border-gray-100">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full">
                            {/* Avatar placeholder */}
                          </div>
                          <span className="font-medium">{influencer.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="outline">{influencer.category}</Badge>
                      </td>
                      <td className="py-4 font-medium">{influencer.followers}</td>
                      <td className="py-4 font-medium">{influencer.engagement}</td>
                      <td className="py-4 font-medium text-green-600">{influencer.roi}</td>
                      <td className="py-4">
                        <Badge className={getStatusColor(influencer.status)}>
                          {influencer.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}