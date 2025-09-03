import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, Filter, Send, Star, MapPin, Instagram, Youtube, ChevronRight, UserPlus, Mail, AtSign, ExternalLink, Plus, X } from 'lucide-react';
import { SiTiktok } from 'react-icons/si';

interface Influencer {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  bio: string;
  location: string;
  followerCount: number;
  engagementRate: string;
  categories: string[];
  platforms: string[];
  rating: number;
  collaborationCount: number;
  priceRange: string;
}

interface ExternalInvitation {
  type: 'email' | 'instagram' | 'tiktok' | 'youtube';
  value: string;
  id: string;
}

interface InfluencerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (selectedInfluencers: string[], personalMessage: string, compensationOffer?: string) => void;
  onInviteExternal?: (invitations: ExternalInvitation[], campaignDetails: any) => void;
  campaignTitle: string;
  campaignDescription?: string;
  campaignBudget?: string;
}

export function InfluencerSelectionModal({ 
  isOpen, 
  onClose, 
  onInvite, 
  onInviteExternal,
  campaignTitle,
  campaignDescription,
  campaignBudget 
}: InfluencerSelectionModalProps) {
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [compensationOffer, setCompensationOffer] = useState('');
  const [activeTab, setActiveTab] = useState('existing');
  
  // External invitation state
  const [externalInvitations, setExternalInvitations] = useState<ExternalInvitation[]>([]);
  const [newInvitationType, setNewInvitationType] = useState<'email' | 'instagram' | 'tiktok' | 'youtube'>('email');
  const [newInvitationValue, setNewInvitationValue] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [incentiveOffer, setIncentiveOffer] = useState('');
  
  const [filters, setFilters] = useState({
    minFollowers: '',
    maxFollowers: '',
    category: '',
    location: '',
    platform: ''
  });

  // Fetch influencers list
  const { data: influencers = [], isLoading } = useQuery<Influencer[]>({
    queryKey: ['/api/influencers'],
  });

  // Filter influencers based on search and filters
  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = !searchQuery || 
      `${influencer.firstName} ${influencer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (influencer.bio && influencer.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (influencer.categories && influencer.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesFilters = 
      (!filters.minFollowers || (influencer.followerCount && influencer.followerCount >= parseInt(filters.minFollowers))) &&
      (!filters.maxFollowers || (influencer.followerCount && influencer.followerCount <= parseInt(filters.maxFollowers))) &&
      (!filters.category || (influencer.categories && influencer.categories.some(cat => cat.toLowerCase().includes(filters.category.toLowerCase())))) &&
      (!filters.location || (influencer.location && influencer.location.toLowerCase().includes(filters.location.toLowerCase()))) &&
      (!filters.platform || (influencer.platforms && influencer.platforms.some(platform => platform.toLowerCase().includes(filters.platform.toLowerCase()))));

    return matchesSearch && matchesFilters;
  });

  const handleSelectInfluencer = (influencerId: string) => {
    setSelectedInfluencers(prev => 
      prev.includes(influencerId) 
        ? prev.filter(id => id !== influencerId)
        : [...prev, influencerId]
    );
  };

  const handleInvite = () => {
    if (selectedInfluencers.length === 0) return;
    onInvite(selectedInfluencers, personalMessage, compensationOffer);
    onClose();
    // Reset form
    setSelectedInfluencers([]);
    setPersonalMessage('');
    setCompensationOffer('');
  };

  // External invitation handlers
  const addExternalInvitation = () => {
    if (!newInvitationValue.trim()) return;
    
    // Format the input based on the type
    const formattedValue = newInvitationType === 'email' 
      ? newInvitationValue.trim() 
      : formatSocialMediaInput(newInvitationType, newInvitationValue);
    
    const newInvitation: ExternalInvitation = {
      id: Date.now().toString(),
      type: newInvitationType,
      value: formattedValue
    };
    
    setExternalInvitations(prev => [...prev, newInvitation]);
    setNewInvitationValue('');
  };

  const removeExternalInvitation = (id: string) => {
    setExternalInvitations(prev => prev.filter(inv => inv.id !== id));
  };

  const handleInviteExternal = () => {
    if (externalInvitations.length === 0 || !onInviteExternal) return;
    
    const campaignDetails = {
      title: campaignTitle,
      description: campaignDescription,
      budget: campaignBudget,
      personalMessage: invitationMessage,
      incentiveOffer
    };
    
    onInviteExternal(externalInvitations, campaignDetails);
    onClose();
    // Reset form
    setExternalInvitations([]);
    setInvitationMessage('');
    setIncentiveOffer('');
  };

  // Smart input formatting functions
  const formatSocialMediaInput = (type: string, input: string): string => {
    const cleanInput = input.trim();
    
    switch (type) {
      case 'instagram':
        if (cleanInput.includes('instagram.com/')) return cleanInput;
        if (cleanInput.startsWith('http')) return cleanInput;
        const igUsername = cleanInput.replace('@', '');
        return igUsername ? `https://instagram.com/${igUsername}` : cleanInput;
      
      case 'tiktok':
        if (cleanInput.includes('tiktok.com/')) return cleanInput;
        if (cleanInput.startsWith('http')) return cleanInput;
        const ttUsername = cleanInput.replace('@', '');
        return ttUsername ? `https://tiktok.com/@${ttUsername}` : cleanInput;
      
      case 'youtube':
        if (cleanInput.includes('youtube.com/')) return cleanInput;
        if (cleanInput.startsWith('http')) return cleanInput;
        const ytHandle = cleanInput.replace('@', '');
        // Try to detect if it's a handle vs channel name
        if (ytHandle.length < 20 && !ytHandle.includes(' ')) {
          return ytHandle ? `https://youtube.com/@${ytHandle}` : cleanInput;
        } else {
          return ytHandle ? `https://youtube.com/c/${ytHandle}` : cleanInput;
        }
      
      default:
        return cleanInput;
    }
  };

  const validateInput = (type: string, value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      case 'instagram':
        // Allow usernames (with or without @), full URLs, or partial URLs
        return /^@?[a-zA-Z0-9._]{1,30}$/.test(trimmed) || 
               trimmed.includes('instagram.com/') ||
               /^https?:\/\//.test(trimmed);
      case 'tiktok':
        return /^@?[a-zA-Z0-9._]{1,24}$/.test(trimmed) || 
               trimmed.includes('tiktok.com/') ||
               /^https?:\/\//.test(trimmed);
      case 'youtube':
        return /^@?[a-zA-Z0-9._\s]{1,50}$/.test(trimmed) || 
               trimmed.includes('youtube.com/') ||
               /^https?:\/\//.test(trimmed);
      default:
        return false;
    }
  };

  const getInputPlaceholder = (type: string): string => {
    switch (type) {
      case 'email': return 'influencer@example.com';
      case 'instagram': return 'username (we\'ll auto-format to instagram.com/username)';
      case 'tiktok': return 'username (we\'ll auto-format to tiktok.com/@username)';
      case 'youtube': return 'channel name (we\'ll auto-format to youtube.com/@channel)';
      default: return '';
    }
  };

  const getInputExample = (type: string): string => {
    switch (type) {
      case 'email': return 'Examples: user@gmail.com';
      case 'instagram': return 'Examples: "username", "@username", or full URL';
      case 'tiktok': return 'Examples: "username", "@username", or full URL';
      case 'youtube': return 'Examples: "channelname", "@handle", or full URL';
      default: return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'tiktok': return <SiTiktok className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      default: return <AtSign className="w-4 h-4" />;
    }
  };

  const formatFollowers = (count: number | undefined): string => {
    if (!count || count === 0) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'tiktok': return <SiTiktok className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Influencers for "{campaignTitle}"
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[70vh]">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <TabsTrigger 
              value="existing" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-blue-500 data-[state=inactive]:hover:bg-blue-50 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-blue-400 dark:data-[state=inactive]:hover:bg-blue-950"
            >
              <Users className="w-4 h-4" />
              Existing Influencers
            </TabsTrigger>
            <TabsTrigger 
              value="invite" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-emerald-500 data-[state=inactive]:hover:bg-emerald-50 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-emerald-400 dark:data-[state=inactive]:hover:bg-emerald-950"
            >
              <UserPlus className="w-4 h-4" />
              Invite New Influencers
            </TabsTrigger>
          </TabsList>

          {/* Existing Influencers Tab */}
          <TabsContent value="existing" className="mt-4">
            <div className="flex gap-6 h-[60vh]">
              {/* Left Panel - Search & Filters */}
              <div className="w-1/4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search influencers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-influencers"
                  />
                </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filters</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Followers Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.minFollowers}
                    onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: e.target.value }))}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.maxFollowers}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Category</Label>
                <Input
                  placeholder="e.g. Beauty, Fashion"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Location</Label>
                <Input
                  placeholder="e.g. Mumbai, Delhi"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Platform</Label>
                <Input
                  placeholder="Instagram, YouTube, TikTok"
                  value={filters.platform}
                  onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Middle Panel - Influencers List */}
          <div className="w-1/2 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading influencers...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInfluencers.map((influencer) => (
                  <Card
                    key={influencer.id}
                    className={`cursor-pointer transition-all ${
                      selectedInfluencers.includes(influencer.id) 
                        ? 'ring-2 ring-teal-500 bg-teal-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleSelectInfluencer(influencer.id)}
                    data-testid={`card-influencer-${influencer.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedInfluencers.includes(influencer.id)}
                          onChange={() => handleSelectInfluencer(influencer.id)}
                          className="mt-1"
                        />
                        
                        <img
                          src={influencer.profileImageUrl || "https://images.unsplash.com/photo-1494790108755-2616b612b632?w=60"}
                          alt={`${influencer.firstName} ${influencer.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">
                              {influencer.firstName} {influencer.lastName}
                            </h4>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{influencer.rating}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {influencer.bio || 'No bio available'}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {influencer.location || 'Location not specified'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {formatFollowers(influencer.followerCount)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {(influencer.platforms || []).slice(0, 3).map(platform => (
                                <div key={platform} className="text-gray-600">
                                  {getPlatformIcon(platform)}
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex gap-1">
                              {(influencer.categories || []).slice(0, 2).map(category => (
                                <Badge key={category} variant="outline" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredInfluencers.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    No influencers found matching your criteria
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Selection & Message */}
          <div className="w-1/4 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Selected ({selectedInfluencers.length})</h4>
              {selectedInfluencers.length === 0 ? (
                <p className="text-sm text-gray-500">No influencers selected</p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedInfluencers.map(id => {
                    const influencer = influencers.find(inf => inf.id === id);
                    return influencer ? (
                      <div key={id} className="flex items-center gap-2 text-sm">
                        <img
                          src={influencer.profileImageUrl || "https://images.unsplash.com/photo-1494790108755-2616b612b632?w=24"}
                          alt={`${influencer.firstName} ${influencer.lastName}`}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        {influencer.firstName} {influencer.lastName}
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Personal Message</Label>
                <Textarea
                  placeholder="Add a personal message to introduce your campaign..."
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  className="mt-1 min-h-[80px] text-sm"
                  data-testid="textarea-personal-message"
                />
              </div>

              <div>
                <Label className="text-sm">Compensation Offer (Optional)</Label>
                <Input
                  placeholder="e.g. ₹5,000 per post"
                  value={compensationOffer}
                  onChange={(e) => setCompensationOffer(e.target.value)}
                  className="text-sm"
                  data-testid="input-compensation-offer"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleInvite}
                disabled={selectedInfluencers.length === 0}
                className="w-full bg-teal-600 hover:bg-teal-700"
                data-testid="button-send-invitations"
              >
                <Send className="w-4 h-4 mr-2" />
                Send {selectedInfluencers.length} Invitation{selectedInfluencers.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Invite New Influencers Tab */}
      <TabsContent value="invite" className="mt-4">
        <div className="flex gap-6 h-[60vh]">
          {/* Left Panel - Invitation Form */}
          <div className="w-2/3 space-y-6">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
              <h3 className="text-lg font-semibold text-teal-800 mb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite Influencers to Join the Platform
              </h3>
              <p className="text-teal-700 text-sm">
                Know some amazing influencers who aren't on our platform yet? Invite them to join and collaborate on your campaigns!
              </p>
            </div>

            {/* Add New Invitation */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Add Influencer Contact</h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm">Contact Type</Label>
                      <div className="flex gap-2 mt-1">
                        {(['email', 'instagram', 'tiktok', 'youtube'] as const).map(type => (
                          <Button
                            key={type}
                            variant={newInvitationType === type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewInvitationType(type)}
                            className={`flex items-center gap-1 ${
                              newInvitationType === type ? 'bg-teal-600 hover:bg-teal-700' : ''
                            }`}
                          >
                            {getTypeIcon(type)}
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label className="text-sm">
                        {newInvitationType === 'email' ? 'Email Address' : `${newInvitationType.charAt(0).toUpperCase() + newInvitationType.slice(1)} Handle/URL`}
                      </Label>
                      <div className="space-y-2">
                        <Input
                          placeholder={getInputPlaceholder(newInvitationType)}
                          value={newInvitationValue}
                          onChange={(e) => setNewInvitationValue(e.target.value)}
                          className="mt-1"
                          onKeyPress={(e) => e.key === 'Enter' && addExternalInvitation()}
                        />
                        {/* Show preview of formatted URL for social media */}
                        {newInvitationType !== 'email' && newInvitationValue.trim() && (
                          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            <span className="text-gray-400">Preview:</span> {formatSocialMediaInput(newInvitationType, newInvitationValue)}
                          </div>
                        )}
                        <p className="text-xs text-gray-400">{getInputExample(newInvitationType)}</p>
                      </div>
                    </div>
                    <Button
                      onClick={addExternalInvitation}
                      disabled={!newInvitationValue.trim() || !validateInput(newInvitationType, newInvitationValue)}
                      className="mt-6 bg-teal-600 hover:bg-teal-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invitation List */}
            {externalInvitations.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-medium mb-4">Pending Invitations ({externalInvitations.length})</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {externalInvitations.map(invitation => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {getTypeIcon(invitation.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" title={invitation.value}>
                              {invitation.type === 'email' ? invitation.value : 
                               invitation.value.replace(/^https?:\/\//, '').replace('www.', '')}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {invitation.type === 'email' ? 'Email invitation' : 
                               `${invitation.type} profile invitation`}
                            </p>
                          </div>
                          {invitation.type !== 'email' && (
                            <div className="flex-shrink-0">
                              <a 
                                href={invitation.value} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExternalInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campaign Preview */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Campaign Information to Include</h4>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-sm mb-2">Campaign: {campaignTitle}</h5>
                  {campaignDescription && (
                    <p className="text-sm text-gray-600 mb-2">{campaignDescription}</p>
                  )}
                  {campaignBudget && (
                    <p className="text-sm text-gray-600">Budget: {campaignBudget}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Personal Invitation Message</Label>
                    <Textarea
                      placeholder="Hi [Name], I'd love to collaborate with you on our upcoming campaign. Join our platform to get started!"
                      value={invitationMessage}
                      onChange={(e) => setInvitationMessage(e.target.value)}
                      className="mt-1 min-h-[80px] text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Sign-up Incentive (Optional)</Label>
                    <Input
                      placeholder="e.g. ₹1,000 bonus for joining + priority campaign access"
                      value={incentiveOffer}
                      onChange={(e) => setIncentiveOffer(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview & Send */}
          <div className="w-1/3 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Invitation Preview
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="font-medium">Subject: Collaboration Opportunity - {campaignTitle}</p>
                <div className="bg-white p-3 rounded border text-xs">
                  <p>Hi there,</p>
                  <p className="mt-2">{invitationMessage || "I'd love to collaborate with you on our upcoming campaign."}</p>
                  <p className="mt-2">Campaign: <strong>{campaignTitle}</strong></p>
                  {campaignBudget && <p>Budget: {campaignBudget}</p>}
                  {incentiveOffer && (
                    <p className="mt-2 bg-green-50 p-2 rounded">
                      🎁 <strong>Special Offer:</strong> {incentiveOffer}
                    </p>
                  )}
                  <p className="mt-2">Click here to join our platform and apply for this campaign!</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-4 text-sm">
                <h5 className="font-medium text-blue-800 mb-2">📊 Industry Standards:</h5>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• 40-60% email open rates for influencer invites</li>
                  <li>• 15-25% sign-up conversion rates</li>
                  <li>• Social media invites perform 2x better</li>
                  <li>• Personal messages increase response by 45%</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleInviteExternal}
                  disabled={externalInvitations.length === 0 || !onInviteExternal}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send {externalInvitations.length} Invitation{externalInvitations.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
      </DialogContent>
    </Dialog>
  );
}