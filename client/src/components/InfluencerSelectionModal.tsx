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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, Users, Filter, Send, Star, MapPin, Instagram, Youtube, ChevronRight, UserPlus, Mail, AtSign, ExternalLink, Plus, X, MessageCircle, CheckCircle2, Eye, ChevronDown, ChevronUp, Clock, CheckCheck } from 'lucide-react';
import { SiTiktok } from 'react-icons/si';
import { useLocation } from 'wouter';

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

interface ApprovedInfluencer {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  bio: string;
  followerCount: number;
  engagementRate: string;
  categories: string[];
  platforms: string[];
  rating: number;
  approvedAt: string;
  status: 'approved' | 'in_progress' | 'completed';
  conversationId?: string;
}

interface InfluencerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (selectedInfluencers: string[], personalMessage: string, compensationOffer?: string) => void;
  onInviteExternal?: (invitations: ExternalInvitation[], campaignDetails: any) => void;
  campaignTitle: string;
  campaignDescription?: string;
  campaignBudget?: string;
  campaignId?: string;
}

export function InfluencerSelectionModal({ 
  isOpen, 
  onClose, 
  onInvite, 
  onInviteExternal,
  campaignTitle,
  campaignDescription,
  campaignBudget,
  campaignId 
}: InfluencerSelectionModalProps) {
  const [, setLocation] = useLocation();
  
  // Get current user for conversation creation
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [compensationOffer, setCompensationOffer] = useState('');
  const [activeTab, setActiveTab] = useState(campaignId ? 'approved' : 'existing');
  
  // Chat state management
  const [activeChatInfluencer, setActiveChatInfluencer] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
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

  // Fetch approved influencers for this campaign
  const { data: approvedInfluencers = [], isLoading: isLoadingApproved } = useQuery<ApprovedInfluencer[]>({
    queryKey: [`/api/brand/campaigns/${campaignId}/approved-influencers`],
    enabled: !!campaignId && isOpen,
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

  const queryClient = useQueryClient();

  // Chat functions
  const openChat = async (influencerId: string, conversationId?: string) => {
    setActiveChatInfluencer(influencerId);
    setIsChatLoading(true);
    
    try {
      if (conversationId) {
        // Load existing conversation
        setActiveConversationId(conversationId);
        const response = await apiRequest(`/api/conversations/${conversationId}/messages`, 'GET') as any;
        setChatMessages(response.messages || []);
      } else {
        // Create new conversation
        const response = await apiRequest('/api/conversations', 'POST', {
          campaignId,
          brandId: user?.id,
          influencerId: influencerId,
          participantIds: [influencerId],
          title: `Chat with Approved Influencer`
        }) as any;
        const newConversationId = response.conversation?.id;
        setActiveConversationId(newConversationId);
        setChatMessages([]);
        console.log('Created conversation for chat:', newConversationId);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setChatMessages([]);
    }
    
    setIsChatLoading(false);
  };

  const closeChat = () => {
    setActiveChatInfluencer(null);
    setActiveConversationId(null);
    setChatMessages([]);
    setNewMessage('');
  };

  const sendMessage = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest(`/api/conversations/${messageData.conversationId}/messages`, 'POST', {
        content: messageData.content,
        messageType: 'text'
      }) as any;
      return response;
    },
    onSuccess: (data: any) => {
      if (data.message) {
        setChatMessages(prev => [...prev, data.message]);
      }
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
    }
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatInfluencer) return;
    
    // Use stored conversation ID first
    let conversationId = activeConversationId;
    
    // If no stored ID, try to get it from the approved influencers data  
    if (!conversationId) {
      const influencer = approvedInfluencers.find(inf => inf.id === activeChatInfluencer);
      conversationId = influencer?.conversationId;
    }
    
    // If still no conversation ID, create a new conversation
    if (!conversationId) {
      try {
        const response = await apiRequest('/api/conversations', 'POST', {
          campaignId,
          brandId: user?.id,
          influencerId: activeChatInfluencer,
          title: `Chat with Approved Influencer`
        }) as any;
        conversationId = response.conversation?.id;
        setActiveConversationId(conversationId);
        
        console.log('Created new conversation for message:', conversationId);
      } catch (error) {
        console.error('Error creating conversation:', error);
        return;
      }
    }
    
    if (conversationId) {
      console.log('Sending message to conversation:', conversationId, 'Message:', newMessage);
      sendMessage.mutate({ conversationId, content: newMessage });
    } else {
      console.error('No conversation ID available for sending message');
    }
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
          <div id="influencer-selection-description" className="sr-only">
            Modal for selecting and managing influencers for the campaign including approved collaborators with chat functionality.
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[70vh]">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <TabsTrigger 
              value="approved" 
              className="flex items-center gap-2 px-3 py-2.5 rounded-md font-medium transition-all duration-200 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-green-500 data-[state=inactive]:hover:bg-green-50 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-green-400 dark:data-[state=inactive]:hover:bg-green-950"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approved ({approvedInfluencers.length})
            </TabsTrigger>
            <TabsTrigger 
              value="existing" 
              className="flex items-center gap-2 px-3 py-2.5 rounded-md font-medium transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-blue-500 data-[state=inactive]:hover:bg-blue-50 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-blue-400 dark:data-[state=inactive]:hover:bg-blue-950"
            >
              <Users className="w-4 h-4" />
              Invite More
            </TabsTrigger>
            <TabsTrigger 
              value="invite" 
              className="flex items-center gap-2 px-3 py-2.5 rounded-md font-medium transition-all duration-200 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-emerald-500 data-[state=inactive]:hover:bg-emerald-50 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-emerald-400 dark:data-[state=inactive]:hover:bg-emerald-950"
            >
              <UserPlus className="w-4 h-4" />
              Invite External
            </TabsTrigger>
          </TabsList>

          {/* Approved Collaborators Tab */}
          <TabsContent value="approved" className="mt-4">
            <div className="space-y-4 h-[60vh] overflow-y-auto">
              {isLoadingApproved ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-600">Loading approved collaborators...</p>
                  </div>
                </div>
              ) : approvedInfluencers.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">No Approved Collaborators Yet</h3>
                      <p className="text-sm text-gray-600">Once you approve influencer proposals, they'll appear here for collaboration.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedInfluencers.map((influencer) => (
                    <Card key={influencer.id} className="relative border-2 border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/80 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4 space-y-3">
                        {/* Header with status badge */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {influencer.profileImageUrl ? (
                              <img 
                                src={influencer.profileImageUrl} 
                                alt={`${influencer.firstName} ${influencer.lastName}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-green-300" 
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full flex items-center justify-center border-2 border-green-300">
                                <span className="text-green-700 font-semibold text-lg">
                                  {influencer.firstName[0]}{influencer.lastName[0]}
                                </span>
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {influencer.firstName} {influencer.lastName}
                              </h4>
                              <p className="text-xs text-gray-600 truncate max-w-32">
                                {formatFollowers(influencer.followerCount)} followers
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs">
                            {influencer.status === 'completed' ? 'Completed' : 
                             influencer.status === 'in_progress' ? 'Active' : 'Approved'}
                          </Badge>
                        </div>

                        {/* Bio */}
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {influencer.bio || 'No bio available'}
                        </p>

                        {/* Platforms and Categories */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {influencer.platforms?.slice(0, 3).map(platform => (
                              <div key={platform} className="flex items-center gap-1 text-xs bg-white/80 px-2 py-1 rounded-full border border-gray-200">
                                {getPlatformIcon(platform)}
                                <span className="capitalize">{platform}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {influencer.categories?.slice(0, 2).map(category => (
                              <Badge key={category} variant="secondary" className="text-xs bg-gray-100 text-gray-700 border border-gray-200">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center bg-white/70 rounded-lg p-2 border border-gray-200">
                            <div className="font-semibold text-orange-600">{influencer.engagementRate}</div>
                            <div className="text-gray-600">Engagement</div>
                          </div>
                          <div className="text-center bg-white/70 rounded-lg p-2 border border-gray-200">
                            <div className="font-semibold text-purple-600 flex items-center justify-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              {influencer.rating}
                            </div>
                            <div className="text-gray-600">Rating</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              if (activeChatInfluencer === influencer.id) {
                                closeChat();
                              } else {
                                openChat(influencer.id, influencer.conversationId);
                              }
                            }}
                            className={`flex-1 ${
                              activeChatInfluencer === influencer.id 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                            data-testid={`button-chat-${influencer.id}`}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {activeChatInfluencer === influencer.id ? 'Close Chat' : 'Chat'}
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              // Navigate to influencer profile or details
                              onClose();
                              setLocation(`/brand-campaign-management?tab=collaborations&profile=${influencer.id}`);
                            }}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                            data-testid={`button-view-profile-${influencer.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Approved Date */}
                        <div className="text-xs text-gray-500 pt-1 border-t border-green-200">
                          Approved on {new Date(influencer.approvedAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                      
                      {/* Inline Chat Window */}
                      {activeChatInfluencer === influencer.id && (
                        <div className="border-t-2 border-green-300 bg-gradient-to-br from-blue-50/90 to-indigo-50/90">
                          <div className="p-4 space-y-3">
                            {/* Chat Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                              <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-800">Chat with {influencer.firstName}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span>Online</span>
                              </div>
                            </div>
                            
                            {/* Chat Messages */}
                            <div className="h-48 overflow-y-auto bg-white/80 rounded-lg border border-blue-200 p-3 space-y-2">
                              {isChatLoading ? (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-center space-y-2">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-sm text-blue-600">Loading chat...</p>
                                  </div>
                                </div>
                              ) : chatMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-center space-y-3">
                                    <MessageCircle className="w-8 h-8 text-blue-400 mx-auto" />
                                    <div>
                                      <p className="text-sm font-medium text-blue-800">Start a conversation</p>
                                      <p className="text-xs text-blue-600">Send a message to begin collaborating with {influencer.firstName}</p>
                                    </div>
                                    {/* Auto-tips */}
                                    <div className="bg-blue-100/60 rounded-lg p-2 text-xs text-blue-700 max-w-xs">
                                      <div className="font-medium mb-1">💡 Pro Tips:</div>
                                      <ul className="text-left space-y-1 text-xs">
                                        <li>• Be specific about deliverables</li>
                                        <li>• Share brand guidelines early</li>
                                        <li>• Set clear deadlines</li>
                                        <li>• Ask about their content ideas</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                chatMessages.map((message, index) => (
                                  <div key={index} className={`flex ${message.senderId === message.currentUserId ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                                      message.senderId === message.currentUserId 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      <p className="text-sm">{message.content}</p>
                                      <div className="flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3 opacity-60" />
                                        <span className="text-xs opacity-60">
                                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {message.senderId === message.currentUserId && (
                                          <CheckCheck className="w-3 h-3 opacity-60" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                            
                            {/* Message Input */}
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Input
                                  placeholder="Type your message..."
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendMessage();
                                    }
                                  }}
                                  className="border-blue-300 focus:border-blue-500 bg-white/90"
                                  disabled={sendMessage.isPending}
                                  data-testid={`input-chat-message-${influencer.id}`}
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || sendMessage.isPending}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                data-testid={`button-send-message-${influencer.id}`}
                              >
                                {sendMessage.isPending ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            
                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setNewMessage('Hi! Looking forward to working together on this campaign. When can we discuss the deliverables?')}
                                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                👋 Quick Hello
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setNewMessage('Can you share some ideas for the content format and timeline?')}
                                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                💡 Ask Ideas
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setNewMessage('I\'ll send over our brand guidelines and campaign brief.')}
                                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                📋 Share Brief
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Existing Influencers Tab */}
          <TabsContent value="existing" className="mt-4">
            <div className="flex gap-6 h-[60vh]">
              {/* Left Panel - Search & Filters */}
              <div className="w-1/4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-teal-500" />
                  <Input
                    placeholder="Search influencers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-2 border-teal-300 focus:border-teal-500 bg-gradient-to-r from-teal-50/50 to-cyan-50/50"
                    data-testid="input-search-influencers"
                  />
                </div>

            {/* Filters */}
            <div className="bg-gradient-to-r from-blue-100/70 to-purple-100/70 rounded-lg p-4 border-2 border-blue-300">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-700">Smart Filters</span>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Followers Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.minFollowers}
                    onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: e.target.value }))}
                    className="text-sm border-2 border-blue-200 focus:border-blue-400"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.maxFollowers}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: e.target.value }))}
                    className="text-sm border-2 border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <Input
                  placeholder="e.g. Beauty, Fashion"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="text-sm border-2 border-blue-200 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Location</Label>
                <Input
                  placeholder="e.g. Mumbai, Delhi"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="text-sm border-2 border-blue-200 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Platform</Label>
                <Input
                  placeholder="Instagram, YouTube, TikTok"
                  value={filters.platform}
                  onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
                  className="text-sm border-2 border-blue-200 focus:border-blue-400"
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
                    className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 border-2 rounded-xl ${
                      selectedInfluencers.includes(influencer.id) 
                        ? 'ring-2 ring-teal-500 bg-teal-100/80 border-teal-400 shadow-lg shadow-teal-200/50' 
                        : 'hover:shadow-lg border-gray-300 hover:border-blue-400 bg-gradient-to-r from-gray-50/80 to-blue-50/80 hover:from-blue-100/90 hover:to-purple-100/90'
                    }`}
                    onClick={() => handleSelectInfluencer(influencer.id)}
                    data-testid={`card-influencer-${influencer.id}`}
                  >
                    <CardContent className="p-4 relative">
                      {/* Colored left border accent */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-xl transition-all duration-300 ${
                        selectedInfluencers.includes(influencer.id)
                          ? 'bg-teal-500 group-hover:w-2'
                          : 'bg-blue-400 group-hover:bg-purple-400'
                      }`} />
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
                            <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100/80 to-orange-100/80 px-2 py-1 rounded-full border border-yellow-300">
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm font-semibold text-yellow-700">{influencer.rating}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {influencer.bio || 'No bio available'}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs mb-2 gap-2">
                            <div className="flex items-center gap-1 bg-green-100/80 px-2 py-1 rounded-md border border-green-200">
                              <MapPin className="w-3 h-3 text-green-600" />
                              <span className="text-green-700 font-medium">{influencer.location || 'Location not specified'}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-blue-100/80 px-2 py-1 rounded-md border border-blue-200">
                              <Users className="w-3 h-3 text-blue-600" />
                              <span className="text-blue-700 font-medium">{formatFollowers(influencer.followerCount)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {(influencer.platforms || []).slice(0, 3).map(platform => (
                                <div key={platform} className="bg-purple-100/80 p-1.5 rounded-md border border-purple-200 text-purple-600">
                                  {getPlatformIcon(platform)}
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex gap-1">
                              {(influencer.categories || []).slice(0, 2).map(category => (
                                <Badge key={category} className="text-xs bg-gradient-to-r from-teal-100/80 to-cyan-100/80 text-teal-700 border border-teal-300 hover:from-teal-200/90 hover:to-cyan-200/90">
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
            <div className="bg-gradient-to-r from-teal-100/80 to-green-100/80 rounded-lg p-4 border-2 border-teal-300">
              <h4 className="font-medium mb-2 text-teal-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Selected ({selectedInfluencers.length})
              </h4>
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

            <div className="bg-gradient-to-r from-purple-100/70 to-blue-100/70 rounded-lg p-4 border-2 border-purple-300 space-y-3">
              <div>
                <Label className="text-sm font-medium text-purple-700">Personal Message</Label>
                <Textarea
                  placeholder="Add a personal message to introduce your campaign..."
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  className="mt-1 min-h-[80px] text-sm border-2 border-purple-200 focus:border-purple-400"
                  data-testid="textarea-personal-message"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-purple-700">Compensation Offer (Optional)</Label>
                <Input
                  placeholder="e.g. ₹5,000 per post"
                  value={compensationOffer}
                  onChange={(e) => setCompensationOffer(e.target.value)}
                  className="text-sm border-2 border-purple-200 focus:border-purple-400"
                  data-testid="input-compensation-offer"
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-gray-300">
              <Button
                onClick={handleInvite}
                disabled={selectedInfluencers.length === 0}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg border-2 border-teal-500 hover:border-teal-600 transition-all duration-300"
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
            <div className="bg-gradient-to-r from-teal-100/80 to-blue-100/80 rounded-lg p-6 border-2 border-teal-400">
              <h3 className="text-lg font-semibold text-teal-800 mb-2 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite Influencers to Join the Platform
              </h3>
              <p className="text-teal-700 text-sm font-medium">
                Know some amazing influencers who aren't on our platform yet? Invite them to join and collaborate on your campaigns!
              </p>
            </div>

            {/* Add New Invitation */}
            <Card className="border-2 border-emerald-300 bg-gradient-to-r from-emerald-50/80 to-green-50/80">
              <CardContent className="p-6">
                <h4 className="font-medium mb-4 text-emerald-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Influencer Contact
                </h4>
                
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