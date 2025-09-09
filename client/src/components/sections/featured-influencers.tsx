import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { SiInstagram, SiYoutube, SiTiktok } from "react-icons/si";
import { SearchFilters } from "./search-section";
import { useMemo } from "react";

interface InfluencerCardProps {
  influencer: {
    id: string;
    firstName: string;
    lastName: string;
    bio: string;
    profileImageUrl: string;
    socialAccounts: Array<{
      platform: string;
      followerCount: number;
      engagementRate: string;
    }>;
    categories: Array<{
      category: string;
    }>;
  };
}

function InfluencerCard({ influencer }: InfluencerCardProps) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <SiInstagram className="h-4 w-4 text-pink-500" />;
      case 'youtube':
        return <SiYoutube className="h-4 w-4 text-red-600" />;
      case 'tiktok':
        return <SiTiktok className="h-4 w-4 text-black" />;
      default:
        return null;
    }
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const primaryCategory = influencer.categories[0]?.category || 'Influencer';
  const primarySocialAccount = influencer.socialAccounts[0];

  return (
    <div className="group relative glass rounded-3xl overflow-hidden hover:scale-105 transition-all duration-500 animate-scale-in border border-white/10 shadow-2xl">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl blur-xl -z-10"></div>
      
      <div className="relative">
        <img 
          src={influencer.profileImageUrl || "https://images.unsplash.com/photo-1494790108755-2616b612b632?w=400"} 
          alt={`${influencer.firstName} ${influencer.lastName}`} 
          className="w-full h-52 object-cover"
        />
        
        {/* Verified badge */}
        <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-full shadow-lg backdrop-blur-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        
        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white capitalize font-semibold border-0 shadow-lg">
            {primaryCategory}
          </Badge>
        </div>
      </div>
      
      <div className="p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            {influencer.firstName} {influencer.lastName}
          </h3>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-semibold">4.9</span>
          </div>
        </div>
        
        <p className="text-purple-100 mb-4 text-sm line-clamp-2 leading-relaxed">
          {influencer.bio}
        </p>
        
        {primarySocialAccount && (
          <div className="flex items-center justify-between text-sm text-purple-200 mb-6 bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              {getPlatformIcon(primarySocialAccount.platform)}
              <span className="font-medium">
                {formatFollowerCount(primarySocialAccount.followerCount || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400 fill-current" />
              <span className="font-medium">{primarySocialAccount.engagementRate || '4.2%'}</span>
            </div>
          </div>
        )}
        
        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-2xl font-bold shadow-xl hover:shadow-purple-500/25 transition-all duration-300 border-0">
          View Profile
        </Button>
      </div>
    </div>
  );
}

interface FeaturedInfluencersProps {
  searchFilters?: SearchFilters | null;
  onJoinAsInfluencer?: () => void;
}

export function FeaturedInfluencers({ searchFilters, onJoinAsInfluencer }: FeaturedInfluencersProps) {
  const { data: allInfluencers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/influencers'],
  });

  // Filter influencers based on search criteria
  const influencers = useMemo(() => {
    if (!searchFilters) return allInfluencers;
    
    return allInfluencers.filter((influencer: any) => {
      // Filter by query (search through bio and categories)
      if (searchFilters.query && searchFilters.query.trim()) {
        const query = searchFilters.query.toLowerCase();
        const matchesBio = influencer.bio?.toLowerCase().includes(query);
        const matchesCategory = influencer.categories?.some((cat: any) => 
          cat.category.toLowerCase().includes(query)
        );
        if (!matchesBio && !matchesCategory) return false;
      }
      
      // Filter by platform
      if (searchFilters.platform && searchFilters.platform !== 'any') {
        const hasPlatform = influencer.socialAccounts?.some((account: any) => 
          account.platform.toLowerCase() === searchFilters.platform.toLowerCase()
        );
        if (!hasPlatform) return false;
      }
      
      // Filter by location (simplified matching)
      if (searchFilters.location && searchFilters.location !== 'any') {
        const locationMatch = influencer.location?.toLowerCase().includes(
          searchFilters.location.replace('-', ' ').toLowerCase()
        );
        if (!locationMatch) return false;
      }
      
      return true;
    });
  }, [allInfluencers, searchFilters]);

  if (isLoading) {
    return (
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Featured
              </span>{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Creators
              </span>
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
              Meet verified creators who drive results for brands worldwide
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-3xl overflow-hidden animate-pulse border border-white/10">
                <div className="w-full h-52 bg-white/10"></div>
                <div className="p-6">
                  <div className="h-6 bg-white/10 rounded-2xl mb-3"></div>
                  <div className="h-4 bg-white/10 rounded-2xl mb-4"></div>
                  <div className="h-10 bg-white/10 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (influencers.length === 0) {
    return (
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Featured
            </span>{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Creators
            </span>
          </h2>
          <div className="glass rounded-3xl p-12 max-w-2xl mx-auto">
            <p className="text-xl text-purple-100">Ready to be the first creator on our platform?</p>
            <Button 
              onClick={onJoinAsInfluencer}
              className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-2xl font-bold"
            >
              Join Now
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const sectionTitle = searchFilters ? "Search Results" : "Featured";
  const sectionSubtitle = searchFilters 
    ? `Found ${influencers.length} creators matching your search`
    : "Meet verified creators who drive real results for brands worldwide";

  return (
    <section id="featured-influencers" className="py-20 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full opacity-10 blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              {sectionTitle}
            </span>{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Creators
            </span>
          </h2>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
          
          {/* Clear search button */}
          {searchFilters && (
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Clear Search
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {influencers.map((influencer: any, index: number) => (
            <div
              key={influencer.id}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="animate-scale-in"
            >
              <InfluencerCard influencer={influencer} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
