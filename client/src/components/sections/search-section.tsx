import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { useState } from "react";

interface SearchSectionProps {
  onSearch?: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  location: string;
  platform: string;
}

export function SearchSection({ onSearch }: SearchSectionProps) {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    location: 'any',
    platform: 'any'
  });

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchFilters);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  return (
    <section className="relative -mt-24 z-20 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glassmorphism search container */}
        <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-in-up">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Find Your Perfect Match</h2>
            <p className="text-purple-100">Search through thousands of verified creators</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 h-5 w-5 group-hover:text-white transition-colors" />
                <Input 
                  type="text"
                  placeholder="Search by niche (e.g., Fashion, Beauty, Tech)"
                  value={searchFilters.query}
                  onChange={(e) => updateFilter('query', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-purple-200 backdrop-blur-sm hover:bg-white/15 transition-all"
                />
              </div>
            </div>
            
            <div className="lg:w-52">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 h-5 w-5 z-10" />
                <Select value={searchFilters.location} onValueChange={(value) => updateFilter('location', value)}>
                  <SelectTrigger className="w-full pl-12 pr-8 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white backdrop-blur-sm hover:bg-white/15 transition-all">
                    <SelectValue placeholder="Any Location" className="text-purple-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="any" className="text-white hover:bg-slate-700">Any Location</SelectItem>
                    <SelectItem value="new-york" className="text-white hover:bg-slate-700">New York</SelectItem>
                    <SelectItem value="los-angeles" className="text-white hover:bg-slate-700">Los Angeles</SelectItem>
                    <SelectItem value="london" className="text-white hover:bg-slate-700">London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="lg:w-52">
              <div className="relative">
                <SiInstagram className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 h-5 w-5 z-10" />
                <Select value={searchFilters.platform} onValueChange={(value) => updateFilter('platform', value)}>
                  <SelectTrigger className="w-full pl-12 pr-8 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white backdrop-blur-sm hover:bg-white/15 transition-all">
                    <SelectValue placeholder="Any Platform" className="text-purple-200" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="any" className="text-white hover:bg-slate-700">Any Platform</SelectItem>
                    <SelectItem value="instagram" className="text-white hover:bg-slate-700">Instagram</SelectItem>
                    <SelectItem value="tiktok" className="text-white hover:bg-slate-700">TikTok</SelectItem>
                    <SelectItem value="youtube" className="text-white hover:bg-slate-700">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              size="lg"
              onClick={handleSearch}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 lg:w-auto"
            >
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
