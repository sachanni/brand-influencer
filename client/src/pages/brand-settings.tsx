import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrencyOptions, type SupportedCurrency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings,
  User,
  CreditCard,
  Bell,
  Shield,
  Building,
  Camera,
  Globe,
  MapPin,
  Upload,
  Save,
  Edit,
  Trash2,
  Palette
} from "lucide-react";
import { Navigation } from "@/components/layout/navigation";
import { BrandNav } from "@/components/BrandNav";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, type ThemeType } from "@/contexts/ThemeContext";

// Theme Selector Component
function ThemeSelector() {
  const { currentTheme, themeConfig, setTheme, isLoading } = useTheme();

  const themes = [
    { 
      value: 'rich-gradient' as ThemeType, 
      name: 'Rich Gradient Dark',
      description: 'Modern dark theme with gradient backgrounds and glassmorphism effects',
      preview: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)'
    },
    { 
      value: 'minimal-light' as ThemeType, 
      name: 'Minimal Light',
      description: 'Clean and professional light theme with subtle shadows',
      preview: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'
    },
    { 
      value: 'warm-sunset' as ThemeType, 
      name: 'Warm Sunset',
      description: 'Warm and inviting theme with orange and pink tones',
      preview: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #fed7d7 100%)'
    },
    { 
      value: 'light-purple' as ThemeType, 
      name: 'Light Purple',
      description: 'Soft purple theme with gentle gradients and light backgrounds',
      preview: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)'
    },
    { 
      value: 'purple-orange-gradient' as ThemeType, 
      name: 'Purple Orange Gradient',
      description: 'Dynamic gradient theme transitioning from purple to orange',
      preview: 'linear-gradient(90deg, #800080 0%, #FFA500 100%)'
    },
    { 
      value: 'purple-blue-gradient' as ThemeType, 
      name: 'Purple Blue Gradient',
      description: 'Beautiful vertical gradient transitioning from purple to blue',
      preview: 'linear-gradient(180deg, #8b5cf6 0%, #3b82f6 100%)'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Theme Selection</h3>
        <p className="text-sm text-gray-600 mb-6">Choose your preferred theme for the platform interface</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.value}
            className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              currentTheme === theme.value
                ? 'border-brand-teal bg-teal-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setTheme(theme.value)}
          >
            <div className="flex items-center space-x-4">
              {/* Theme Preview */}
              <div
                className="w-16 h-12 rounded-lg border shadow-inner"
                style={{ background: theme.preview }}
              />
              
              {/* Theme Details */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">{theme.name}</h4>
                  {currentTheme === theme.value && (
                    <Badge className="bg-brand-teal text-white">Current</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{theme.description}</p>
              </div>

              {/* Selection Indicator */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                currentTheme === theme.value
                  ? 'border-brand-teal bg-brand-teal'
                  : 'border-gray-300'
              }`}>
                {currentTheme === theme.value && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {isLoading && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-600">Applying theme...</p>
        </div>
      )}
    </div>
  );
}

export default function BrandSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Fetch brand profile data
  const { data: brandProfileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/brand/profile'],
    enabled: !!user && user.role === 'brand'
  });

  const brandProfile = brandProfileData?.profile;
  
  const [profileData, setProfileData] = useState({
    companyName: "Luxe Beauty Co.",
    industry: "Fashion & Beauty",
    website: "www.luxebeauty.com",
    location: "New York, USA",
    description: "Premium beauty brand focused on sustainable, cruelty-free cosmetics for the modern woman.",
    logoUrl: ""
  });

  const [paymentMethods] = useState([
    {
      id: "1",
      type: "Visa",
      last4: "4242",
      expiry: "12/25",
      isDefault: true
    },
    {
      id: "2",
      type: "Mastercard",
      last4: "8901",
      expiry: "08/26",
      isDefault: false
    }
  ]);

  const [preferences, setPreferences] = useState({
    autoApprovalBudget: "₹40K",
    defaultCampaignDuration: "30 days",
    autoOptimizeSpend: true,
    requireApprovalLargePayments: true,
    currentPlan: "Professional",
    preferredCurrency: (brandProfile?.preferredCurrency as SupportedCurrency) || "INR"
  });

  // Mutation for updating brand profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest('/api/brand/profile', 'PATCH', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand/profile'] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings.",
        variant: "destructive"
      });
    }
  });

  const [notifications, setNotifications] = useState({
    campaignUpdates: true,
    newInfluencers: false,
    weeklyReports: true,
    paymentAlerts: true,
    systemUpdates: false
  });

  const tabs = [
    { id: "profile", label: "Profile Management", icon: User },
    { id: "payment", label: "Payment Settings", icon: CreditCard },
    { id: "campaigns", label: "Campaign Preferences", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Shield }
  ];

  const handleSaveProfile = () => {
    // In a real app, this would save to the API
    console.log("Saving profile:", profileData);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderProfileManagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={profileData.companyName}
                onChange={(e) => setProfileData(prev => ({ ...prev, companyName: e.target.value }))}
                data-testid="input-company-name"
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select value={profileData.industry} onValueChange={(value) => setProfileData(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger data-testid="select-industry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fashion & Beauty">Fashion & Beauty</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Health & Fitness">Health & Fitness</SelectItem>
                  <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                  <SelectItem value="Travel & Lifestyle">Travel & Lifestyle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  className="pl-10"
                  value={profileData.website}
                  onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                  data-testid="input-website"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  className="pl-10"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  data-testid="input-location"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Brand Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe your brand, values, and what makes you unique..."
              value={profileData.description}
              onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
              data-testid="textarea-description"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Brand Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-teal-100 rounded-lg flex items-center justify-center">
              <Building className="w-8 h-8 text-teal-600" />
            </div>
            <div className="flex-1">
              <Button variant="outline" className="mb-2" data-testid="button-upload-logo">
                <Upload className="w-4 h-4 mr-2" />
                Upload New Logo
              </Button>
              <p className="text-sm text-gray-500">
                Recommended: Square image, at least 400x400px. Max file size: 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} className="bg-teal-600 hover:bg-teal-700" data-testid="button-save-changes">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">{method.type} ending in {method.last4}</p>
                  <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                </div>
                {method.isDefault && (
                  <Badge variant="outline">Default</Badge>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" data-testid="button-add-payment-method">
            + Add New Payment Method
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-approve bills under this amount</Label>
              <p className="text-sm text-gray-500">Automatic payment approval threshold</p>
            </div>
            <Switch checked={preferences.requireApprovalLargePayments} />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Require approval for large payments</Label>
              <p className="text-sm text-gray-500">Payments over ₹80K need manual approval</p>
            </div>
            <Switch checked={preferences.requireApprovalLargePayments} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCampaignPreferences = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-followers">Minimum Followers</Label>
              <Select>
                <SelectTrigger data-testid="select-min-followers">
                  <SelectValue placeholder="10K" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1k">1K+</SelectItem>
                  <SelectItem value="10k">10K+</SelectItem>
                  <SelectItem value="50k">50K+</SelectItem>
                  <SelectItem value="100k">100K+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="min-engagement">Minimum Engagement Rate</Label>
              <Select>
                <SelectTrigger data-testid="select-min-engagement">
                  <SelectValue placeholder="2%" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1%+</SelectItem>
                  <SelectItem value="2">2%+</SelectItem>
                  <SelectItem value="3">3%+</SelectItem>
                  <SelectItem value="5">5%+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="default-duration">Default Campaign Duration</Label>
            <Select>
              <SelectTrigger data-testid="select-default-duration">
                <SelectValue placeholder="30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-optimize campaign spend</Label>
              <p className="text-sm text-gray-500">Automatically adjust budget allocation for better performance</p>
            </div>
            <Switch 
              checked={preferences.autoOptimizeSpend}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, autoOptimizeSpend: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require content approval</Label>
              <p className="text-sm text-gray-500">Review content before publishing</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="preferred-currency">Preferred Currency</Label>
            <p className="text-sm text-gray-500 mb-2">Choose the currency for all financial displays and calculations</p>
            <Select 
              value={preferences.preferredCurrency} 
              onValueChange={(value: SupportedCurrency) => {
                setPreferences(prev => ({ ...prev, preferredCurrency: value }));
                updateProfileMutation.mutate({ preferredCurrency: value });
              }}
            >
              <SelectTrigger data-testid="select-preferred-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCurrencyOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Campaign Updates</Label>
              <p className="text-sm text-gray-500">Get notified about campaign progress and milestones</p>
            </div>
            <Switch 
              checked={notifications.campaignUpdates}
              onCheckedChange={(checked) => handleNotificationChange('campaignUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>New Influencer Matches</Label>
              <p className="text-sm text-gray-500">Alerts when new influencers match your criteria</p>
            </div>
            <Switch 
              checked={notifications.newInfluencers}
              onCheckedChange={(checked) => handleNotificationChange('newInfluencers', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly Performance Reports</Label>
              <p className="text-sm text-gray-500">Receive weekly analytics summaries</p>
            </div>
            <Switch 
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Payment Alerts</Label>
              <p className="text-sm text-gray-500">Notifications for payment confirmations and issues</p>
            </div>
            <Switch 
              checked={notifications.paymentAlerts}
              onCheckedChange={(checked) => handleNotificationChange('paymentAlerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>System Updates</Label>
              <p className="text-sm text-gray-500">Platform maintenance and feature announcements</p>
            </div>
            <Switch 
              checked={notifications.systemUpdates}
              onCheckedChange={(checked) => handleNotificationChange('systemUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Login Notifications</Label>
              <p className="text-sm text-gray-500">Get alerts for new device logins</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <Button variant="outline" className="w-full">
              Download Account Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return renderProfileManagement();
      case "payment": return renderPaymentSettings();
      case "campaigns": return renderCampaignPreferences();
      case "notifications": return renderNotificationSettings();
      case "appearance": return renderAppearanceSettings();
      case "security": return renderSecuritySettings();
      default: return renderProfileManagement();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrandNav />
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-gray-900">Brand Settings</h1>
          </div>
          <p className="text-gray-600">Manage your brand profile, preferences, and account security</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        data-testid={`tab-${tab.id}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}