import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  Users,
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  Star,
  Plus,
  Send
} from "lucide-react";
import { Navigation } from "@/components/layout/navigation";
import { BrandNav } from "@/components/BrandNav";

interface Influencer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: string;
  followers: number;
  engagement: string;
  location: string;
  category: string;
  verified: boolean;
  rating: number;
  priceRange: string;
}

export default function BrandInfluencerDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedEngagement, setSelectedEngagement] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  const [influencers] = useState<Influencer[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      username: "@sarahj.lifestyle",
      avatar: "/api/placeholder/64/64",
      platform: "Instagram",
      followers: 245000,
      engagement: "4.8%",
      location: "Los Angeles, CA",
      category: "Beauty & Lifestyle",
      verified: true,
      rating: 4.9,
      priceRange: "₹40K-₹80K"
    },
    {
      id: "2",
      name: "Mike Chen",
      username: "@mikefitness",
      avatar: "/api/placeholder/64/64",
      platform: "TikTok",
      followers: 180000,
      engagement: "6.2%",
      location: "New York, NY",
      category: "Fitness",
      verified: true,
      rating: 4.7,
      priceRange: "₹25K-₹65K"
    },
    {
      id: "3",
      name: "Emma Wilson",
      username: "@emmastyle",
      avatar: "/api/placeholder/64/64",
      platform: "Instagram",
      followers: 320000,
      engagement: "3.9%",
      location: "London, UK",
      category: "Fashion",
      verified: true,
      rating: 4.8,
      priceRange: "₹65K-₹1.2L"
    },
    {
      id: "4",
      name: "David Rodriguez",
      username: "@davidcooks",
      avatar: "/api/placeholder/64/64",
      platform: "YouTube",
      followers: 89000,
      engagement: "5.3%",
      location: "Los Angeles, CA",
      category: "Food & Cooking",
      verified: false,
      rating: 4.6,
      priceRange: "₹15K-₹48K"
    },
    {
      id: "5",
      name: "Jessica Park",
      username: "@jessicatravels",
      avatar: "/api/placeholder/64/64",
      platform: "Instagram",
      followers: 156000,
      engagement: "7.1%",
      location: "Miami, FL",
      category: "Travel",
      verified: true,
      rating: 4.9,
      priceRange: "₹32K-₹72K"
    }
  ]);

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'tiktok': return 'bg-purple-100 text-purple-800';
      case 'youtube': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(0) + 'K';
    }
    return count.toString();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         influencer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         influencer.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === "all" || influencer.category === selectedCategory;
    const matchesLocation = !selectedLocation || selectedLocation === "all" || influencer.location.includes(selectedLocation);
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrandNav />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover Influencers</h1>
          <p className="text-gray-600 mt-1">Find the perfect creators for your brand campaigns</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, niche, or keywords..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-influencers"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Beauty & Lifestyle">Beauty & Lifestyle</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Fitness">Fitness</SelectItem>
                  <SelectItem value="Food & Cooking">Food & Cooking</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-location">
                  <SelectValue placeholder="Any Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Location</SelectItem>
                  <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                  <SelectItem value="London">London</SelectItem>
                  <SelectItem value="Miami">Miami</SelectItem>
                  <SelectItem value="Toronto">Toronto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedEngagement} onValueChange={setSelectedEngagement}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-engagement">
                  <SelectValue placeholder="Engagement Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Rate</SelectItem>
                  <SelectItem value="high">High (5%+)</SelectItem>
                  <SelectItem value="medium">Medium (2-5%)</SelectItem>
                  <SelectItem value="low">Low (0-2%)</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Apply Filters
              </Button>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                1,247 influencers found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Influencers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Influencers</h2>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40" data-testid="select-sort-featured">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInfluencers.map((influencer) => (
              <Card key={influencer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{influencer.name}</h3>
                          {influencer.verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{influencer.username}</p>
                      </div>
                    </div>
                    <Badge className={getPlatformColor(influencer.platform)}>
                      {influencer.platform}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-teal-600">{formatFollowers(influencer.followers)}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{influencer.engagement}</p>
                      <p className="text-xs text-gray-500">Engagement</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{influencer.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {renderStars(influencer.rating)}
                      <span className="text-sm text-gray-500 ml-1">{influencer.rating}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {influencer.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-900">{influencer.priceRange}</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" data-testid={`button-view-profile-${influencer.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700" data-testid={`button-invite-${influencer.id}`}>
                        <Send className="w-4 h-4 mr-1" />
                        Invite
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Load More */}
        <div className="text-center">
          <Button variant="outline" className="px-8" data-testid="button-load-more">
            Load More Influencers
          </Button>
        </div>
      </div>
    </div>
  );
}