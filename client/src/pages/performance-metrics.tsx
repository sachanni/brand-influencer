import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Instagram, Youtube, Play, Heart, MessageCircle, Share, Eye } from "lucide-react";
import { SiInstagram, SiYoutube, SiTiktok } from "react-icons/si";
import { InfluencerNav } from "@/components/InfluencerNav";
import { Navigation } from "@/components/layout/navigation";

export default function PerformanceMetrics() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access performance metrics.</div>;
  }

  const engagementData = [
    { month: 'Jan', rate: 7.2 },
    { month: 'Feb', rate: 7.8 },
    { month: 'Mar', rate: 8.1 },
    { month: 'Apr', rate: 7.6 },
    { month: 'May', rate: 8.4 },
    { month: 'Jun', rate: 8.9 },
    { month: 'Jul', rate: 8.7 },
    { month: 'Aug', rate: 9.2 },
    { month: 'Sep', rate: 8.5 },
    { month: 'Oct', rate: 9.1 },
    { month: 'Nov', rate: 8.8 },
    { month: 'Dec', rate: 9.3 }
  ];

  const reachData = [
    { name: 'Week 1', reach: 850000, impressions: 1200000 },
    { name: 'Week 2', reach: 920000, impressions: 1350000 },
    { name: 'Week 3', reach: 780000, impressions: 1100000 },
    { name: 'Week 4', reach: 1100000, impressions: 1600000 }
  ];

  const topContent = [
    {
      title: "Fashion Week Recap",
      platform: "Instagram",
      likes: 45678,
      comments: 1234,
      shares: 890,
      engagement: "12.4%",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200"
    },
    {
      title: "Skincare Routine",
      platform: "YouTube",
      likes: 32450,
      comments: 567,
      shares: 423,
      engagement: "9.8%",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200"
    },
    {
      title: "Quick Style Tips",
      platform: "TikTok",
      likes: 78900,
      comments: 2341,
      shares: 1567,
      engagement: "15.2%",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200"
    }
  ];

  const followerGrowthData = [
    { month: 'Jan', followers: 1200000 },
    { month: 'Feb', followers: 1230000 },
    { month: 'Mar', followers: 1280000 },
    { month: 'Apr', followers: 1320000 },
    { month: 'May', followers: 1380000 },
    { month: 'Jun', followers: 1420000 },
    { month: 'Jul', followers: 1450000 },
    { month: 'Aug', followers: 1480000 },
    { month: 'Sep', followers: 1510000 },
    { month: 'Oct', followers: 1540000 },
    { month: 'Nov', followers: 1580000 },
    { month: 'Dec', followers: 1620000 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <img
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
              alt="Profile"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sophia Williams - Performance Metrics</h1>
              <p className="text-gray-600">Lifestyle & Fashion Influencer</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="text-brand-teal border-brand-teal">
              Connect
            </Button>
            <Button className="bg-brand-teal hover:bg-brand-teal/90">
              Edit Profile
            </Button>
          </div>
        </div>

        <InfluencerNav />

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-teal rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">9.3%</div>
            <div className="text-sm opacity-90">Avg Engagement</div>
          </div>
          <div className="bg-green-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">2.8M</div>
            <div className="text-sm opacity-90">Monthly Reach</div>
          </div>
          <div className="bg-purple-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">4.2M</div>
            <div className="text-sm opacity-90">Monthly Impressions</div>
          </div>
          <div className="bg-orange-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">156K</div>
            <div className="text-sm opacity-90">Monthly Profile Views</div>
          </div>
        </div>

        {/* Engagement Over Time */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Engagement Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#0F766E" 
                  strokeWidth={2}
                  dot={{ fill: '#0F766E', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Reach & Impressions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Weekly Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reachData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reach" fill="#0F766E" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-brand-teal">2.8M</div>
                  <div className="text-sm text-gray-600">Avg Weekly Reach</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">4.2M</div>
                  <div className="text-sm text-gray-600">Avg Impressions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Performing Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topContent.map((content, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={content.image}
                      alt={content.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{content.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {content.platform === "Instagram" && <SiInstagram className="h-4 w-4 text-pink-600" />}
                        {content.platform === "YouTube" && <SiYoutube className="h-4 w-4 text-red-600" />}
                        {content.platform === "TikTok" && <SiTiktok className="h-4 w-4 text-black" />}
                        <span className="text-xs text-gray-600">{content.platform}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span>{(Number(content.likes) || 0).toLocaleString()} likes</span>
                        <span>{Number(content.comments) || 0} comments</span>
                        <span className="text-brand-teal font-medium">{content.engagement}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Growth Analytics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Follower Growth (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={followerGrowthData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="followers" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fill="url(#colorGrowth)"
                />
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 mr-1" />
                  +25.2%
                </div>
                <div className="text-sm text-gray-600">6-Month Growth</div>
              </div>
              <div>
                <div className="text-lg font-bold text-brand-teal">+42K</div>
                <div className="text-sm text-gray-600">Monthly Avg Growth</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">1.62M</div>
                <div className="text-sm text-gray-600">Current Followers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Collaboration Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Brand Collaboration Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-brand-teal rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm opacity-90">Total Campaigns</div>
              </div>
              <div className="bg-green-500 rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">97%</div>
                <div className="text-sm opacity-90">Client Satisfaction</div>
              </div>
              <div className="bg-purple-500 rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">8.9%</div>
                <div className="text-sm opacity-90">Avg Campaign Engagement</div>
              </div>
              <div className="bg-orange-500 rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">156%</div>
                <div className="text-sm opacity-90">ROI for Brands</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-medium mb-3">Campaign Success Rate</h4>
                <div className="text-3xl font-bold text-green-600 mb-2">97%</div>
                <p className="text-sm text-gray-600">24 of 25 campaigns exceeded KPIs</p>
              </div>
              <div className="text-center">
                <h4 className="font-medium mb-3">Average Brand Reach</h4>
                <div className="text-3xl font-bold text-brand-teal mb-2">2.1M</div>
                <p className="text-sm text-gray-600">Per campaign audience reach</p>
              </div>
              <div className="text-center">
                <h4 className="font-medium mb-3">Conversion Rate</h4>
                <div className="text-3xl font-bold text-purple-600 mb-2">4.7%</div>
                <p className="text-sm text-gray-600">Average click-to-conversion rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}