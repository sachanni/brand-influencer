import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Settings, User, Bell, CreditCard, Shield, Camera, Palette } from "lucide-react";
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

export default function InfluencerSettings() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access settings.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Settings className="h-8 w-8 text-brand-teal" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account preferences and privacy settings</p>
            </div>
          </div>
          <Link href="/influencer-dashboard">
            <Button variant="outline" className="text-brand-teal border-brand-teal">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <a href="#profile" className="flex items-center space-x-3 px-3 py-2 bg-brand-teal text-white rounded-lg">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Profile Management</span>
                  </a>
                  <a href="#notifications" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">Notifications</span>
                  </a>
                  <a href="#billing" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Billing</span>
                  </a>
                  <a href="#theme" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Palette className="h-4 w-4" />
                    <span className="text-sm font-medium">Appearance</span>
                  </a>
                  <a href="#privacy" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Privacy</span>
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Management */}
            <Card id="profile">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-brand-teal" />
                  <span>Profile Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
                      alt="Profile"
                      className="w-24 h-24 rounded-full"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-brand-teal hover:bg-brand-teal/90 p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Profile Picture</h3>
                    <p className="text-sm text-gray-600">Update your profile picture and settings</p>
                    <Button className="mt-2 bg-brand-teal hover:bg-brand-teal/90" size="sm">
                      Upload New Photo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="sophia@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" defaultValue="Los Angeles, CA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" defaultValue="www.sophiawilliams.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input id="specialty" defaultValue="Lifestyle & Fashion" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    defaultValue="Passionate lifestyle and fashion influencer creating authentic content that resonates with modern audiences. Specializing in sustainable fashion, beauty tips, and wellness lifestyle content with a focus on accessibility and inclusivity."
                  />
                </div>

                <Button className="bg-brand-teal hover:bg-brand-teal/90">
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card id="theme">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-brand-teal" />
                  <span>Appearance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ThemeSelector />
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card id="notifications">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-brand-teal" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Campaign Updates</h4>
                      <p className="text-sm text-gray-600">Get notified about new campaign opportunities</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Payment Notifications</h4>
                      <p className="text-sm text-gray-600">Receive alerts about payments and invoices</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Performance Reports</h4>
                      <p className="text-sm text-gray-600">Weekly performance summaries and insights</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Updates</h4>
                      <p className="text-sm text-gray-600">Updates about new features and platform news</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card id="billing">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-brand-teal" />
                  <span>Payment Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Current Payment Method</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        VISA
                      </div>
                      <span className="text-sm">•••• •••• •••• 4567</span>
                    </div>
                    <Badge variant="secondary">Primary</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Bank Account</Label>
                      <Input id="bank-name" defaultValue="Chase Bank •••• 8901" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routing">Routing Number</Label>
                      <Input id="routing" defaultValue="•••••••••" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Withdrawal Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-amount">Minimum Withdrawal Amount</Label>
                      <Input id="min-amount" defaultValue="\u20b98K" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Auto-withdrawal</Label>
                      <Input id="frequency" defaultValue="Monthly" />
                    </div>
                  </div>
                </div>

                <Button className="bg-brand-teal hover:bg-brand-teal/90">
                  Update Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Privacy Controls */}
            <Card id="privacy">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-brand-teal" />
                  <span>Privacy Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Profile Visibility</h4>
                      <p className="text-sm text-gray-600">Allow brands to discover your profile</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Campaign History</h4>
                      <p className="text-sm text-gray-600">Show completed campaigns on your profile</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Performance Metrics</h4>
                      <p className="text-sm text-gray-600">Display performance data to potential partners</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Data Management</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Download My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Request Data Deletion
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}