import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InfluencerNav } from "@/components/InfluencerNav";
import { Navigation } from "@/components/layout/navigation";

export default function AudienceDemographics() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access audience demographics.</div>;
  }

  const ageData = [
    { name: '18-24 years', value: 32.1, count: '485K' },
    { name: '25-34 years', value: 28.7, count: '431K' },
    { name: '35-44 years', value: 22.8, count: '342K' },
    { name: '45-54 years', value: 11.2, count: '168K' },
    { name: '55+ years', value: 5.2, count: '78K' }
  ];

  const genderData = [
    { name: 'Female', value: 485, percentage: 68.5 },
    { name: 'Male', value: 223, percentage: 31.5 }
  ];

  const geographicData = [
    { country: 'United States', percentage: 33.2 },
    { country: 'Canada', percentage: 16.7 },
    { country: 'United Kingdom', percentage: 13.1 },
    { country: 'Australia', percentage: 9.4 },
    { country: 'Germany', percentage: 6.8 },
    { country: 'Others', percentage: 20.8 }
  ];

  const interestsData = [
    { interest: 'Beauty & Make-up', percentage: 89.4, color: '#f97316' },
    { interest: 'Travel & Vacation', percentage: 76.2, color: '#06b6d4' },
    { interest: 'Fashion & Style', percentage: 71.8, color: '#8b5cf6' },
    { interest: 'Food & Dining', percentage: 64.3, color: '#10b981' },
    { interest: 'Health & Fitness', percentage: 58.7, color: '#ef4444' },
    { interest: 'Home Design', percentage: 52.1, color: '#f59e0b' }
  ];

  const COLORS = ['#0F766E', '#8B5CF6', '#EF4444', '#F59E0B', '#10B981'];

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
              <h1 className="text-2xl font-bold text-gray-900">Sophia Williams - Audience Demographics</h1>
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
            <div className="text-2xl font-bold">1.5M</div>
            <div className="text-sm opacity-90">Total Followers</div>
          </div>
          <div className="bg-purple-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">68%</div>
            <div className="text-sm opacity-90">Female Audience</div>
          </div>
          <div className="bg-pink-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">25-34</div>
            <div className="text-sm opacity-90">Primary Age Group</div>
          </div>
          <div className="bg-orange-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">33%</div>
            <div className="text-sm opacity-90">US Based</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Age Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ageData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${item.value * 3}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-[200px] h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                        data={genderData}
                        cx={100}
                        cy={100}
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        <Cell fill="#0F766E" />
                        <Cell fill="#8B5CF6" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">485K</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-brand-teal rounded-full"></div>
                    <span className="text-sm">Female (68.5%)</span>
                  </div>
                  <span className="text-sm font-medium">485K</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Male (31.5%)</span>
                  </div>
                  <span className="text-sm font-medium">223K</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-pink-800">
                  <strong>Female Majority:</strong> Your audience consists predominantly of female followers, making it ideal for beauty, fashion, and lifestyle brand partnerships.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-4">Top Countries</h4>
                <div className="space-y-3">
                  {geographicData.map((item, index) => (
                    <div key={item.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-3 bg-gray-300 rounded-sm"></div>
                        <span className="text-sm font-medium">{item.country}</span>
                      </div>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4">Geographic Insights</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    <strong>Primary English Markets:</strong> Strong presence in English-speaking countries makes content highly accessible.
                  </p>
                  <p>
                    <strong>Global Reach:</strong> Diverse international audience from 45+ countries provides excellent brand expansion opportunities.
                  </p>
                  <p>
                    <strong>Timezone Coverage:</strong> Audience spans multiple time zones for optimal content scheduling.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audience Interests & Behaviors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Audience Interests & Behaviors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-4">Top Interests</h4>
                <div className="space-y-3">
                  {interestsData.map((item, index) => (
                    <div key={item.interest} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.interest}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: item.color
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4">Engagement Behaviors</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Peak Activity Hours</span>
                    <span className="text-sm text-brand-teal">6-9 PM EST</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Most Active Days</span>
                    <span className="text-sm text-brand-teal">Wed, Thu, Sun</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Average Session Time</span>
                    <span className="text-sm text-brand-teal">8.7 minutes</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Story Completion Rate</span>
                    <span className="text-sm text-brand-teal">76.3%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}