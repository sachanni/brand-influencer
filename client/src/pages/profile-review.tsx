import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Navigation } from "@/components/layout/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  CheckCircle2, 
  Edit3, 
  Eye,
  Users, 
  TrendingUp,
  MapPin,
  Calendar,
  ExternalLink,
  ArrowRight,
  Sparkles,
  BarChart3
} from "lucide-react";
import { SiInstagram, SiYoutube, SiTiktok, SiFacebook } from "react-icons/si";

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  followerCount: number;
  engagementRate: string;
  profileUrl: string;
  isConnected: boolean;
}

interface ProfilePreview {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  role: 'influencer' | 'brand';
  socialAccounts: SocialAccount[];
  categories: string[];
  totalFollowers: number;
  averageEngagement: number;
  contentCategories: string[];
}

const platformIcons = {
  youtube: SiYoutube,
  instagram: SiInstagram,
  tiktok: SiTiktok,
  facebook: SiFacebook,
};

const platformColors = {
  youtube: 'text-red-600',
  instagram: 'text-pink-600', 
  tiktok: 'text-black',
  facebook: 'text-blue-600',
};

export function ProfileReview() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  
  const [editedProfile, setEditedProfile] = useState({
    bio: '',
    location: '',
    categories: [] as string[],
  });

  // Fetch complete profile data
  const { data: profileData, isLoading: profileLoading } = useQuery<ProfilePreview>({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
  });

  useEffect(() => {
    if (profileData) {
      setEditedProfile({
        bio: profileData.bio || '',
        location: profileData.location || '',
        categories: profileData.categories || [],
      });
    }
  }, [profileData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest('/api/profile/update', 'PATCH', updates);
    },
    onSuccess: () => {
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Publish profile mutation
  const publishProfileMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/profile/publish', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Profile published!",
        description: "Your influencer profile is now live and visible to brands",
      });
      navigate('/influencer-dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: "Publish failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveChanges = () => {
    updateProfileMutation.mutate(editedProfile);
  };

  const handlePublish = () => {
    setShowPublishConfirm(false);
    publishProfileMutation.mutate();
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-300 rounded"></div>
                <div className="h-48 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-300 rounded"></div>
                <div className="h-48 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto p-6">
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                No profile data found. Please complete your profile setup first.
              </div>
              <Button 
                className="mt-4"
                onClick={() => navigate('/profile-import')}
              >
                Complete Profile Setup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Review</h1>
              <p className="text-gray-600 mt-2">
                Review how your profile will appear to brands, make any final changes, and publish when ready
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
              <Button
                onClick={() => setShowPublishConfirm(true)}
                className="bg-brand-teal hover:bg-brand-teal/90 flex items-center gap-2"
                disabled={publishProfileMutation.isPending}
              >
                {publishProfileMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Publish Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData.profileImageUrl} />
                    <AvatarFallback className="text-2xl">
                      {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">
                        {profileData.firstName} {profileData.lastName}
                      </h2>
                      <Badge variant="secondary" className="bg-brand-teal/10 text-brand-teal">
                        {profileData.role}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-gray-600">
                      <p className="text-sm">{profileData.email}</p>
                      {profileData.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{profileData.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-teal">
                          {(Number(profileData.totalFollowers) || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-teal">
                          {(Number(profileData.averageEngagement) || 0).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-teal">
                          {profileData.socialAccounts.length}
                        </div>
                        <div className="text-sm text-gray-600">Platforms</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-teal" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell brands about your content and what makes you unique..."
                        value={editedProfile.bio}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={editedProfile.location}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleSaveChanges} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      {profileData.bio || 'No bio provided yet.'}
                    </p>
                    {profileData.contentCategories.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Content Categories</h4>
                        <div className="flex flex-wrap gap-2">
                          {profileData.contentCategories.map((category) => (
                            <Badge key={category} variant="outline">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-teal" />
                  Connected Platforms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileData.socialAccounts.map((account) => {
                    const Icon = platformIcons[account.platform as keyof typeof platformIcons];
                    const colorClass = platformColors[account.platform as keyof typeof platformColors];
                    
                    // Skip rendering if Icon is undefined
                    if (!Icon) {
                      console.warn(`No icon found for platform: ${account.platform}`);
                      return null;
                    }
                    
                    return (
                      <div key={account.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-6 w-6 ${colorClass || 'text-gray-600'}`} />
                            <div>
                              <div className="font-medium">{account.displayName}</div>
                              <div className="text-sm text-gray-600">@{account.username}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{(Number(account.followerCount) || 0).toLocaleString()}</div>
                            <div className="text-sm text-gray-600">{Number(account.engagementRate) || 0}% engagement</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={account.profileUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-brand-teal" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This is how your profile will appear to brands in search results
                </p>
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profileData.profileImageUrl} />
                      <AvatarFallback>
                        {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {profileData.firstName} {profileData.lastName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {(Number(profileData.totalFollowers) || 0).toLocaleString()} followers
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3">
                    {profileData.bio?.substring(0, 120)}...
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {profileData.contentCategories.slice(0, 3).map((category) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-brand-teal" />
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Profile Completeness</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Connected Platforms</span>
                    <span className="font-medium">{profileData.socialAccounts.length}/4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Content Categories</span>
                    <span className="font-medium">{profileData.contentCategories.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Profile Status</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Draft
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Publish Confirmation Modal */}
        <Dialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-teal" />
                Publish Your Profile
              </DialogTitle>
              <DialogDescription>
                Your profile will be made visible to brands looking for influencers. Are you ready to go live?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">What happens when you publish:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Profile becomes visible in brand searches</li>
                  <li>✓ Brands can view your metrics and content</li>
                  <li>✓ You'll start receiving collaboration opportunities</li>
                  <li>✓ You can still edit your profile anytime</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPublishConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  className="flex-1 bg-brand-teal hover:bg-brand-teal/90"
                  disabled={publishProfileMutation.isPending}
                >
                  {publishProfileMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Publish Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}