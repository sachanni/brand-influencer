import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigation } from "@/components/layout/navigation";
import { ImportProgressModal } from "@/components/ImportProgressModal";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Users, 
  ExternalLink, 
  Upload,
  AlertCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Copy,
  Eye,
  Download
} from "lucide-react";
import { SiInstagram, SiYoutube, SiTiktok, SiFacebook } from "react-icons/si";
import { useLocation } from "wouter";
import ConnectionGamification from "@/components/gamification/ConnectionGamification";

interface SocialPlatform {
  id: string;
  name: string;
  icon: any;
  color: string;
  placeholder: string;
  connected: boolean;
  username?: string;
  followers?: number;
  engagement?: number;
}

interface ProfileImportData {
  bio?: string;
  location?: string;
  website?: string;
  categories?: string[];
}

export default function ProfileImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<(SocialPlatform & { username?: string }) | null>(null);
  const [profileData, setProfileData] = useState<ProfileImportData>({
    bio: '',
    location: '',
    website: '',
    categories: []
  });

  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatform[]>([
    {
      id: 'instagram',
      name: 'Instagram',
      icon: SiInstagram,
      color: 'text-pink-600',
      placeholder: '@username',
      connected: false
    },
    {
      id: 'youtube', 
      name: 'YouTube',
      icon: SiYoutube,
      color: 'text-red-600',
      placeholder: 'Channel ID (UCZgYNmEThHQ8ouzB7C7ISBQ) or @handle',
      connected: false
    },
    {
      id: 'tiktok',
      name: 'TikTok', 
      icon: SiTiktok,
      color: 'text-black',
      placeholder: '@username',
      connected: false
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: SiFacebook,
      color: 'text-blue-600',
      placeholder: 'Page URL or username',
      connected: false
    }
  ]);

  const [importingPlatform, setImportingPlatform] = useState<string | null>(null);
  const [showChannelIdHelp, setShowChannelIdHelp] = useState(false);
  const [showOAuthInfo, setShowOAuthInfo] = useState(false);
  const [importProgress, setImportProgress] = useState({ 
    step: 0, 
    total: 5, 
    startTime: Date.now(),
    estimatedTimeRemaining: 15 // Total estimated time in seconds
  });
  const [showImportProgress, setShowImportProgress] = useState(false);

  // Check for URL parameters to handle OAuth callbacks and pre-select platform
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform');
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    const demo = urlParams.get('demo');
    const username = urlParams.get('username');
    const channelId = urlParams.get('channel_id');
    const pageName = urlParams.get('page_name');

    if (error && platformParam) {
      const errorMessages = {
        'api_not_configured': 'API credentials not configured. Please enter your account details manually using the Import Data button below.',
        'oauth_not_implemented': 'OAuth connection not available. Please enter your account details manually using the Import Data button below.',
        'authorization_failed': 'Authorization was cancelled or failed.',
        'token_exchange_failed': 'Failed to exchange authorization code.',
        'connection_failed': 'Connection failed. Please try manual import.',
        'no_channel_found': 'No channel found for your account. Please verify your channel ID.',
        'no_pages_found': 'No Facebook pages found for your account.',
        'user_info_failed': 'Failed to retrieve user information.'
      };

      toast({
        title: "OAuth Connection Failed",
        description: errorMessages[error as keyof typeof errorMessages] || "An error occurred during connection.",
        variant: "destructive",
      });

      // Clean URL
      window.history.replaceState({}, '', '/profile-import');
    } else if (connected === 'true' && platformParam) {
      // Handle successful OAuth connection
      const platform = socialPlatforms.find(p => p.id === platformParam);
      if (platform) {
        let displayName = platform.name + ' User';
        let successMessage = `${platform.name} account connected successfully!`;
        
        if (username) {
          displayName = username;
          successMessage = `Connected as @${username} on ${platform.name}`;
        } else if (channelId) {
          displayName = channelId;
          successMessage = `Connected YouTube channel: ${channelId}`;
        } else if (pageName) {
          displayName = pageName;
          successMessage = `Connected Facebook page: ${pageName}`;
        }

        // Update platform state to show as connected
        setSocialPlatforms(prev => prev.map(p => 
          p.id === platformParam 
            ? { 
                ...p, 
                connected: true, 
                username: displayName,
                followers: 0, // Will be updated when data is imported
                engagement: 0
              }
            : p
        ));

        toast({
          title: "Connection Successful!",
          description: successMessage,
        });

        // Clean URL
        window.history.replaceState({}, '', '/profile-import');

        // Auto-focus on that platform
        setTimeout(() => {
          const platformElement = document.querySelector(`[data-platform="${platformParam}"]`);
          if (platformElement) {
            platformElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 1000);
      }
    } else if (platformParam) {
      // Regular platform pre-selection
      setTimeout(() => {
        const inputElement = document.getElementById(`${platformParam}-input`);
        if (inputElement) {
          inputElement.focus();
          inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          toast({
            title: `Connect your ${platformParam.charAt(0).toUpperCase() + platformParam.slice(1)} account`,
            description: "Use the one-click button or enter manually to import your data",
          });
        }
      }, 500);
    }
  }, [toast]);

  // Professional YouTube import with comprehensive data extraction
  const importYouTubeMutation = useMutation({
    mutationFn: async (channelInput: string) => {
      const startTime = Date.now();
      
      // Step 1: Validation (2-3 seconds)
      setImportProgress(prev => ({ ...prev, step: 0, estimatedTimeRemaining: 15 }));
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Step 2: Profile Data (3-4 seconds)
      setImportProgress(prev => ({ ...prev, step: 1, estimatedTimeRemaining: 12 }));
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Metrics Analysis (includes API call)
      setImportProgress(prev => ({ ...prev, step: 2, estimatedTimeRemaining: 8 }));
      const response = await apiRequest('/api/import/youtube', 'POST', { channelInput });
      
      // Step 4: Content Processing (3-4 seconds)
      setImportProgress(prev => ({ ...prev, step: 3, estimatedTimeRemaining: 4 }));
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 5: Finalization (1-2 seconds)
      setImportProgress(prev => ({ ...prev, step: 4, estimatedTimeRemaining: 1 }));
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Parse JSON response
      const data = await response.json();
      return data;
    },
    onMutate: () => {
      setShowImportProgress(true);
      const startTime = Date.now();
      setImportProgress({ 
        step: 0, 
        total: 5, 
        startTime,
        estimatedTimeRemaining: 15 // 15 seconds total estimated time
      });
    },
    onSuccess: (data) => {
      const { account, channelData, importStats } = data as any;
      
      // Update platform connection
      setSocialPlatforms(prev => prev.map(platform => 
        platform.id === 'youtube' 
          ? { 
              ...platform, 
              connected: true, 
              username: channelData?.username || channelData?.displayName || 'Unknown',
              followers: (channelData?.followerCount && Number(channelData.followerCount)) || 0,
              engagement: (channelData?.engagementRate && Number(channelData.engagementRate)) || 0
            }
          : platform
      ));
      
      // Auto-populate profile data from comprehensive import
      if (!profileData.bio && channelData?.bio) {
        setProfileData(prev => ({
          ...prev,
          bio: channelData.bio.length > 300 ? channelData.bio.substring(0, 300) + '...' : channelData.bio,
          categories: channelData.categories || [],
        }));
      }
      
      setTimeout(() => {
        setShowImportProgress(false);
        setImportingPlatform(null);
        
        toast({
          title: "Professional import completed!",
          description: `Imported ${channelData?.displayName || 'Profile'} • ${((channelData?.followerCount && Number(channelData.followerCount)) || 0).toLocaleString()} subscribers • ${(importStats?.completenessScore && Number(importStats.completenessScore)) || 0}% data coverage`,
        });
        
        // Invalidate user query to refresh profile data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }, 1000);
    },
    onError: (error: Error) => {
      setShowImportProgress(false);
      setImportingPlatform(null);
      toast({
        title: "Import failed",
        description: error.message || "Could not import YouTube channel. Please check the Channel ID.",
        variant: "destructive",
      });
    }
  });

  // Multi-platform import with professional progress tracking
  const socialImportMutation = useMutation({
    mutationFn: async ({ platform, input }: { platform: any, input: string }) => {
      // Step 1: Validation
      setImportProgress({ step: 0, total: 5, startTime: Date.now(), estimatedTimeRemaining: 15 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Profile Data
      setImportProgress(prev => ({ ...prev, step: 1, estimatedTimeRemaining: 12 }));
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Metrics Analysis (includes API call)
      setImportProgress(prev => ({ ...prev, step: 2, estimatedTimeRemaining: 8 }));
      const response = await apiRequest(`/api/import/${platform.id}`, 'POST', { username: input });
      
      // Step 4: Content Processing
      setImportProgress(prev => ({ ...prev, step: 3, estimatedTimeRemaining: 4 }));
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 5: Finalization
      setImportProgress(prev => ({ ...prev, step: 4, estimatedTimeRemaining: 1 }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Parse JSON response
      const data = await response.json();
      return { response: data, platform };
    },
    onMutate: ({ platform }) => {
      setShowImportProgress(true);
      setImportingPlatform(platform.id);
    },
    onSuccess: ({ response, platform }) => {
      const { account, profileData: importedData, importStats } = response as any;
      
      // Update platform connection
      setSocialPlatforms(prev => prev.map(p => 
        p.id === platform.id 
          ? { 
              ...p, 
              connected: true, 
              username: importedData?.username || importedData?.displayName || 'Unknown',
              followers: (importedData?.followerCount && Number(importedData.followerCount)) || 0,
              engagement: (importedData?.engagementRate && Number(importedData.engagementRate)) || 0
            }
          : p
      ));

      // Auto-populate profile data
      if (!profileData.bio && importedData?.bio) {
        setProfileData(prev => ({
          ...prev,
          bio: importedData.bio.length > 300 ? importedData.bio.substring(0, 300) + '...' : importedData.bio,
          categories: importedData.categories || [],
        }));
      }

      setTimeout(() => {
        setShowImportProgress(false);
        setImportingPlatform(null);
        
        toast({
          title: `${platform.name} imported successfully!`,
          description: `${importedData?.displayName || 'Profile'} • ${((importedData?.followerCount && Number(importedData.followerCount)) || 0).toLocaleString()} followers • ${(importStats?.completenessScore && Number(importStats.completenessScore)) || 0}% data coverage`,
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }, 1000);
    },
    onError: (error: Error, { platform }) => {
      setShowImportProgress(false);
      setImportingPlatform(null);
      toast({
        title: "Import failed",
        description: error.message || `Could not import ${platform.name} profile`,
        variant: "destructive",
      });
    }
  });

  // Handle one-click social media connection
  const handleQuickConnect = (platform: SocialPlatform) => {
    // Show info modal first to explain what will happen
    setShowOAuthInfo(true);
    setPendingPlatform(platform);
  };

  const proceedWithOAuth = () => {
    if (pendingPlatform) {
      // Redirect to platform-specific OAuth flow
      window.location.href = `/api/auth/${pendingPlatform.id}`;
    }
    setShowOAuthInfo(false);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated!",
        description: "Your influencer profile has been saved successfully.",
      });
      // Redirect to dashboard
      window.location.href = '/';
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Generic social media import handler
  const handleSocialImport = async (platform: any) => {
    const input = (document.getElementById(`${platform.id}-input`) as HTMLInputElement)?.value;
    if (!input?.trim()) {
      toast({
        title: "Input required",
        description: `Please enter your ${platform.name} username or profile URL`,
        variant: "destructive",
      });
      return;
    }

    if (platform.id === 'youtube') {
      importYouTubeMutation.mutate(input);
    } else {
      socialImportMutation.mutate({ platform, input });
    }
  };

  const handleConsentConfirm = () => {
    if (!pendingPlatform || !hasConsented) return;
    
    setShowConsentModal(false);
    
    if (pendingPlatform.id === 'youtube') {
      importYouTubeMutation.mutate(pendingPlatform.username!);
    } else {
      socialImportMutation.mutate({ platform: pendingPlatform, input: pendingPlatform.username! });
    }
    
    setPendingPlatform(null);
  };

  const handleConsentCancel = () => {
    setShowConsentModal(false);
    setPendingPlatform(null);
    setHasConsented(false);
  };

  const handleCompleteSetup = () => {
    const connectedAccounts = socialPlatforms.filter(p => p.connected);
    
    const completeProfileData = {
      ...profileData,
      socialAccounts: connectedAccounts.map(account => ({
        platform: account.id,
        username: account.username,
        followers: account.followers,
        engagement: account.engagement,
        isConnected: true
      }))
    };

    updateProfileMutation.mutate(completeProfileData);
  };

  const connectedCount = socialPlatforms.filter(p => p.connected).length;
  const totalFollowers = socialPlatforms.reduce((sum, p) => sum + (p.followers || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-brand-teal" />
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Influencer Profile</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect your social media accounts to automatically import your follower count, engagement rate, 
            and profile information. This helps brands discover and connect with you more effectively.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Profile Setup Progress</span>
            <span>{Math.round(((connectedCount + (profileData.bio ? 1 : 0)) / 4) * 100)}% Complete</span>
          </div>
          <Progress value={((connectedCount + (profileData.bio ? 1 : 0)) / 4) * 100} className="h-2" />
        </div>

        {/* Current Stats */}
        {connectedCount > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-brand-teal/5 to-brand-teal/10 border-brand-teal/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-brand-teal">{connectedCount}</div>
                  <div className="text-sm text-gray-600">Platforms Connected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-teal">{totalFollowers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-teal">
                    {connectedCount > 0 ? 
                      ((socialPlatforms.filter(p => p.connected).reduce((sum, p) => sum + (Number(p.engagement) || 0), 0) / connectedCount) || 0).toFixed(1) 
                      : '0'}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Engagement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Social Media Import */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="text-center pb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 opacity-50"></div>
                <div className="relative">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl transform transition-transform duration-300 hover:scale-110">
                    <ExternalLink className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-teal-800 to-teal-600 bg-clip-text text-transparent mb-4">
                    Connect Social Media Accounts
                  </CardTitle>
                  <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                    Import your profile data and metrics from your social media platforms with our secure, professional-grade data extraction
                  </p>
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-700">
                        <strong className="text-teal-700">Professional Import:</strong> Enter your social media account details below to securely import comprehensive profile data, engagement metrics, and performance analytics.
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            <CardContent className="space-y-6 px-8">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                const isImporting = importingPlatform === platform.id;
                
                return (
                  <div key={platform.id} data-platform={platform.id} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-gray-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-bl-full opacity-50"></div>
                    <div className={`relative p-3 rounded-xl bg-gradient-to-br inline-flex ${
                      platform.id === 'instagram' ? 'from-purple-100 to-pink-100' :
                      platform.id === 'youtube' ? 'from-red-100 to-red-200' :
                      platform.id === 'tiktok' ? 'from-gray-100 to-gray-200' :
                      platform.id === 'facebook' ? 'from-blue-100 to-blue-200' :
                      'from-teal-100 to-teal-200'
                    } ${platform.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 relative ml-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 capitalize">{platform.name}</h3>
                        {platform.connected && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Connected
                          </Badge>
                        )}
                      </div>
                      
                      {platform.connected ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            @{platform.username} • {(platform.followers || 0).toLocaleString()} followers • {Number(platform.engagement) || 0}% engagement
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Allow manual import of additional data for connected accounts
                                const input = document.getElementById(`${platform.id}-input`) as HTMLInputElement;
                                const username = platform.username || '';
                                
                                // Auto-fill the input with connected account username
                                if (input) {
                                  input.value = username;
                                }

                                setPendingPlatform({ ...platform, username });
                                setShowConsentModal(true);
                              }}
                              className="text-brand-teal border-brand-teal hover:bg-brand-teal hover:text-white"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Import Data
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {platform.id === 'youtube' && (
                            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800">
                              <strong>Professional Import:</strong> Automatically extracts profile picture, subscriber count, channel description, engagement metrics, content categories, recent video performance, and more.
                              <div className="mt-2 text-xs text-blue-600">
                                <strong>Available data:</strong> Profile image, bio, total subscribers, total videos, total views, engagement rate, content categories, country, account creation date, recent video performance.
                              </div>
                              <div className="mt-1 text-xs text-blue-500">
                                <strong>Note:</strong> Mobile number and email are private data not available via YouTube API.
                              </div>
                              <div className="mt-2 text-xs text-green-600">
                                <strong>Estimated import time:</strong> 12-15 seconds for comprehensive data extraction
                              </div>
                            </div>
                          )}
                          <div className="space-y-3">
                            {/* Manual entry - now the only option */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-3">Enter your {platform.name} account details:</p>
                              <div className="flex gap-3">
                                <Input
                                  id={`${platform.id}-input`}
                                  placeholder={platform.placeholder}
                                  className="flex-1 h-12 border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 rounded-lg transition-all duration-200 bg-gray-50 focus:bg-white text-lg"
                                  disabled={isImporting}
                                />
                                {platform.id === 'youtube' && (
                                  <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 px-4 border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200"
                                    onClick={() => setShowChannelIdHelp(true)}
                                    disabled={isImporting}
                                  >
                                    <HelpCircle className="h-5 w-5 text-teal-600" />
                                  </Button>
                                )}
                                <Button
                                  className={`font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 px-6 py-2 ${
                                    platform.id === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0' :
                                    platform.id === 'youtube' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0' :
                                    platform.id === 'tiktok' ? 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-black text-white border-0' :
                                    platform.id === 'facebook' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0' :
                                    'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0'
                                  }`}
                                  onClick={() => {
                                const input = document.getElementById(`${platform.id}-input`) as HTMLInputElement;
                                const username = input?.value?.trim();
                                
                                if (!username) {
                                  toast({
                                    title: "Username required",
                                    description: `Please enter your ${platform.name} username or URL`,
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                // Show consent modal before importing
                                setPendingPlatform({ ...platform, username });
                                setShowConsentModal(true);
                              }}
                                  disabled={isImporting}
                                >
                                  {isImporting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                  )}
                                  {isImporting ? 'Importing...' : 'Import Data'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
            </Card>
          </div>

          {/* Gamification Panel */}
          <div className="space-y-6">
            <ConnectionGamification 
              onAchievementEarned={(achievement) => {
                toast({
                  title: "🎉 Achievement Unlocked!",
                  description: `${achievement.title}: ${achievement.description}`,
                  duration: 5000,
                });
              }}
            />
          </div>

        </div>

        {/* Profile Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-teal" />
              Profile Information
            </CardTitle>
            <p className="text-sm text-gray-600">
              Complete your profile to help brands understand your content and audience
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Describe your content and what makes you unique as an influencer..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className="mt-1"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://yourwebsite.com"
                  value={profileData.website}
                  onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Profile Preview */}
              {(profileData.bio || connectedCount > 0) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Profile Preview</h4>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={(user as any)?.profileImageUrl} />
                      <AvatarFallback>
                        {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {(user as any)?.firstName} {(user as any)?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {profileData.bio || 'Add a bio to describe your content...'}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-600">
                        {socialPlatforms.filter(p => p.connected).map(platform => (
                          <span key={platform.id}>
                            {(platform.followers || 0).toLocaleString()} on {platform.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Data Import Consent Modal */}
        <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-brand-teal" />
                Data Import Consent
              </DialogTitle>
              <DialogDescription>
                Before we import your {pendingPlatform?.name} profile data, please review what information will be collected and how it will be used.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What data will be imported from {pendingPlatform?.name}:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Basic Profile:</strong> Picture, display name, bio, username, verification status</li>
                  <li>• <strong>Audience Metrics:</strong> Follower/subscriber count, following count, engagement rates</li>
                  <li>• <strong>Content Portfolio:</strong> Recent posts, top-performing content, media samples</li>
                  <li>• <strong>Performance Data:</strong> Likes, comments, shares, views, reach metrics</li>
                  <li>• <strong>Audience Demographics:</strong> Age groups, gender distribution, top locations</li>
                  <li>• <strong>Growth Analytics:</strong> Historical performance, posting frequency, optimal timing</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">How this data will be used:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Profile Creation:</strong> Build your comprehensive influencer dashboard and portfolio</li>
                  <li>• <strong>Brand Discovery:</strong> Help brands find and evaluate you for partnerships</li>
                  <li>• <strong>Performance Analytics:</strong> Generate insights, trends, and influence scoring</li>
                  <li>• <strong>Content Showcase:</strong> Display your best work in an organized portfolio</li>
                  <li>• <strong>Audience Analysis:</strong> Provide demographic insights to potential brand partners</li>
                  <li>• <strong>Campaign Matching:</strong> Match you with relevant collaboration opportunities</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Your data privacy:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Only public profile information is imported</li>
                  <li>• You can disconnect or update this data anytime</li>
                  <li>• Data is stored securely and never shared without permission</li>
                  <li>• You maintain full control over your profile visibility</li>
                </ul>
              </div>

              <div className="flex items-start space-x-3 pt-4">
                <Checkbox
                  id="data-consent"
                  checked={hasConsented}
                  onCheckedChange={(checked) => setHasConsented(checked === true)}
                />
                <Label htmlFor="data-consent" className="text-sm leading-relaxed">
                  I understand and consent to importing my {pendingPlatform?.name} profile data as described above. 
                  I acknowledge that only public information will be accessed and that I can revoke this access at any time.
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleConsentCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleConsentConfirm}
                disabled={!hasConsented}
                className="bg-brand-teal hover:bg-brand-teal/90"
              >
                Import Profile Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* OAuth Information Modal */}
        <Dialog open={showOAuthInfo} onOpenChange={setShowOAuthInfo}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-teal" />
                One-Click {pendingPlatform?.name} Connection
              </DialogTitle>
              <DialogDescription>
                Connect your {pendingPlatform?.name} account securely using OAuth authentication
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-green-800">How One-Click Connection Works:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <strong>Secure OAuth:</strong> You'll be redirected to {pendingPlatform?.name}'s official login page</li>
                  <li>• <strong>No Password Sharing:</strong> We never see or store your {pendingPlatform?.name} password</li>
                  <li>• <strong>Limited Access:</strong> We only request permission to read your public profile data</li>
                  <li>• <strong>Automatic Import:</strong> Your profile data will be imported instantly after authorization</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">What Data Will Be Accessed:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {pendingPlatform?.id === 'youtube' && (
                    <>
                      <li>• Channel name, description, and subscriber count</li>
                      <li>• Video statistics and engagement metrics</li>
                      <li>• Content categories and upload history</li>
                    </>
                  )}
                  {pendingPlatform?.id === 'instagram' && (
                    <>
                      <li>• Profile information and follower count</li>
                      <li>• Recent posts and engagement data</li>
                      <li>• Account type and verification status</li>
                    </>
                  )}
                  {pendingPlatform?.id === 'tiktok' && (
                    <>
                      <li>• Profile name and follower statistics</li>
                      <li>• Video performance and view counts</li>
                      <li>• Engagement rates and trending content</li>
                    </>
                  )}
                  {pendingPlatform?.id === 'facebook' && (
                    <>
                      <li>• Page information and follower count</li>
                      <li>• Post engagement and reach metrics</li>
                      <li>• Page category and verification status</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-yellow-800">Demo Environment Notice:</h4>
                <p className="text-sm text-yellow-700">
                  This development environment will simulate the OAuth connection process for demonstration purposes. 
                  The "connection" will show how the feature works, but you'll need to use manual import to add real data from your {pendingPlatform?.name} account.
                </p>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowOAuthInfo(false)}>
                Cancel
              </Button>
              <Button 
                onClick={proceedWithOAuth}
                className="bg-brand-teal hover:bg-brand-teal/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect {pendingPlatform?.name} Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Setup */}
        <div className="mt-8 text-center">
          <Card className="p-6">
            <div className="max-w-md mx-auto">
              {connectedCount === 0 ? (
                <div className="text-gray-600">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-medium mb-2">Connect at least one social media account to continue</h3>
                  <p className="text-sm">This helps brands understand your reach and engagement.</p>
                </div>
              ) : (
                <div>
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="font-medium mb-2">Great! Your profile is ready</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You've connected {connectedCount} platform{connectedCount > 1 ? 's' : ''} with {totalFollowers.toLocaleString()} total followers.
                  </p>
                  <Button
                    className="bg-brand-teal hover:bg-brand-teal/90"
                    onClick={() => navigate('/profile-review')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review & Publish Profile
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Channel ID Help Modal */}
        <Dialog open={showChannelIdHelp} onOpenChange={setShowChannelIdHelp}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SiYoutube className="h-5 w-5 text-red-600" />
                How to Find Your YouTube Channel ID
              </DialogTitle>
              <DialogDescription>
                Channel IDs provide more accurate data import than usernames
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What is a Channel ID?</h4>
                <p className="text-sm text-gray-600">
                  A Channel ID is a unique 24-character identifier that starts with "UC" (like UCZgYNmEThHQ8ouzB7C7ISBQ). 
                  It never changes and provides more reliable data access than usernames.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Methods to Find Your Channel ID:</h4>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-2">Method 1: From Channel URL</h5>
                    <p className="text-sm text-gray-600 mb-2">
                      Go to your YouTube channel page. If the URL shows:
                    </p>
                    <code className="text-xs bg-gray-100 p-1 rounded">
                      youtube.com/channel/UCZgYNmEThHQ8ouzB7C7ISBQ
                    </code>
                    <p className="text-xs text-gray-500 mt-1">
                      The part after "/channel/" is your Channel ID
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-2">Method 2: YouTube Studio</h5>
                    <ol className="text-sm text-gray-600 space-y-1">
                      <li>1. Go to YouTube Studio</li>
                      <li>2. Click Settings → Channel → Advanced settings</li>
                      <li>3. Your Channel ID will be displayed there</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-2">Method 3: Custom URL</h5>
                    <p className="text-sm text-gray-600 mb-2">
                      If you have a custom URL like @THANK224, we can also accept:
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• Channel URLs: youtube.com/@THANK224</li>
                      <li>• Custom URLs: youtube.com/c/YourChannelName</li>
                      <li>• @handle format: @THANK224</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-green-800">Example Channel ID:</h4>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-white p-2 rounded border font-mono">
                    UCZgYNmEThHQ8ouzB7C7ISBQ
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText('UCZgYNmEThHQ8ouzB7C7ISBQ');
                      toast({
                        title: "Copied!",
                        description: "Example Channel ID copied to clipboard",
                      });
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  This is the Channel ID for the Bubble_0_0 gaming channel
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowChannelIdHelp(false)}>
                Got it, thanks!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Professional Import Progress Modal */}
        <ImportProgressModal
          isOpen={showImportProgress}
          platform={importingPlatform === 'youtube' ? 'YouTube' : 
                   importingPlatform === 'instagram' ? 'Instagram' : 
                   importingPlatform === 'tiktok' ? 'TikTok' : 
                   importingPlatform === 'facebook' ? 'Facebook' : 'Social Media'}
          currentStep={importProgress.step}
          totalSteps={importProgress.total}
          isComplete={importProgress.step >= importProgress.total}
          estimatedTimeRemaining={importProgress.estimatedTimeRemaining}
          startTime={importProgress.startTime}
        />
      </div>
    </div>
  );
}