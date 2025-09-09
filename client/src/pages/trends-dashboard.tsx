import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/layout/navigation";
import { InfluencerNav } from "@/components/InfluencerNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Brain, 
  Lightbulb, 
  Target, 
  Clock, 
  Sparkles,
  ChevronRight,
  Calendar,
  Hash,
  Users,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { SiInstagram, SiYoutube, SiTiktok } from "react-icons/si";

interface TrendPrediction {
  id: string;
  platform: string;
  trend: string;
  confidence: number;
  timeframe: string;
  predictedGrowth: number;
  contentSuggestions: string[];
  hashtagRecommendations: string[];
  bestPostTimes: string[];
  targetAudience: string;
  reasoning: string;
}

interface QuickInsights {
  topTrend: string;
  confidence: number;
  quickTips: string[];
  nextAnalysis: string;
}

const platformIcons = {
  instagram: SiInstagram,
  youtube: SiYoutube,
  tiktok: SiTiktok
};

const platformColors = {
  instagram: 'text-pink-600',
  youtube: 'text-red-600',
  tiktok: 'text-black'
};

function PlatformIcon({ platform }: { platform: string }) {
  const platformKey = platform?.toLowerCase() || '';
  const Icon = platformIcons[platformKey as keyof typeof platformIcons] || TrendingUp;
  const colorClass = platformColors[platformKey as keyof typeof platformColors] || 'text-gray-600';
  
  return <Icon className={`w-5 h-5 ${colorClass}`} />;
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? 'text-green-600' : confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = confidence >= 0.8 ? 'bg-green-100' : confidence >= 0.6 ? 'bg-yellow-100' : 'bg-red-100';
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${color}`}>
      <Target className="w-3 h-3" />
      {percentage}% confidence
    </div>
  );
}

function GrowthIndicator({ growth }: { growth: number }) {
  const Icon = growth > 0 ? ArrowUp : growth < 0 ? ArrowDown : Minus;
  const color = growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600';
  
  return (
    <div className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{Math.abs(growth)}%</span>
    </div>
  );
}

function TrendCard({ prediction }: { prediction: TrendPrediction }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <PlatformIcon platform={prediction.platform} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {prediction.trend}
              </CardTitle>
              <p className="text-sm text-gray-600 capitalize">
                {prediction.platform} • {prediction.timeframe}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ConfidenceIndicator confidence={prediction.confidence} />
            <GrowthIndicator growth={prediction.predictedGrowth} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Target Audience */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{prediction.targetAudience}</span>
          </div>
          
          {/* Quick Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Content Ideas
              </h4>
              <ul className="space-y-1">
                {(prediction.contentSuggestions || []).slice(0, 2).map((suggestion, index) => (
                  <li key={index} className="text-gray-600 flex items-start gap-1">
                    <span className="text-blue-500 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
                {(prediction.contentSuggestions || []).length > 2 && (
                  <li className="text-blue-600 text-xs">
                    +{(prediction.contentSuggestions || []).length - 2} more ideas
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                <Hash className="w-4 h-4 text-blue-500" />
                Top Hashtags
              </h4>
              <div className="flex flex-wrap gap-1">
                {(prediction.hashtagRecommendations || []).slice(0, 3).map((hashtag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {hashtag}
                  </Badge>
                ))}
                {(prediction.hashtagRecommendations || []).length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(prediction.hashtagRecommendations || []).length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Expand/Collapse */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            data-testid={`button-expand-trend-${prediction.id}`}
          >
            {expanded ? 'Show Less' : 'View Details'}
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
          
          {/* Expanded Content */}
          {expanded && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Why This Trend?</h4>
                <p className="text-sm text-gray-600">{prediction.reasoning}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-green-500" />
                  Best Posting Times
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(prediction.bestPostTimes || []).map((time, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">All Content Suggestions</h4>
                <ul className="space-y-2">
                  {(prediction.contentSuggestions || []).map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickInsightsCard({ platform, insights }: { platform: string; insights: QuickInsights }) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={platform} />
            <CardTitle className="text-lg capitalize">{platform} Insights</CardTitle>
          </div>
          <ConfidenceIndicator confidence={insights.confidence} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Top Trending</h4>
            <p className="text-blue-600 font-semibold">{insights.topTrend}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Quick Wins</h4>
            <ul className="space-y-1">
              {insights.quickTips.map((tip, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <Zap className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Next analysis: {new Date(insights.nextAnalysis).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyzeForm({ onAnalyze }: { onAnalyze: (platform: string, timeframe: string) => void }) {
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');
  
  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: SiInstagram },
    { id: 'youtube', name: 'YouTube', icon: SiYoutube },
    { id: 'tiktok', name: 'TikTok', icon: SiTiktok }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Generate New Analysis
        </CardTitle>
        <p className="text-sm text-gray-600">
          AI will analyze your content performance and predict upcoming trends
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Button
                    key={platform.id}
                    variant={selectedPlatform === platform.id ? "default" : "outline"}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className="flex items-center gap-2 h-12"
                    data-testid={`button-platform-${platform.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    {platform.name}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Timeframe</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'weekly', name: '1 Week' },
                { id: 'monthly', name: '1 Month' },
                { id: 'quarterly', name: '3 Months' }
              ].map((timeframe) => (
                <Button
                  key={timeframe.id}
                  variant={selectedTimeframe === timeframe.id ? "default" : "outline"}
                  onClick={() => setSelectedTimeframe(timeframe.id)}
                  className="h-10"
                  data-testid={`button-timeframe-${timeframe.id}`}
                >
                  {timeframe.name}
                </Button>
              ))}
            </div>
          </div>
          
          <Button
            onClick={() => onAnalyze(selectedPlatform, selectedTimeframe)}
            className="w-full bg-purple-600 hover:bg-purple-700"
            data-testid="button-generate-analysis"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate AI Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrendsDashboard() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  
  // Fetch trend predictions
  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ['/api/trends/predictions', selectedPlatform === 'all' ? undefined : selectedPlatform],
    queryFn: async () => {
      const platform = selectedPlatform === 'all' ? '' : `?platform=${selectedPlatform}`;
      const response = await fetch(`/api/trends/predictions${platform}`);
      if (!response.ok) throw new Error('Failed to fetch predictions');
      return response.json();
    },
    enabled: isAuthenticated,
  });
  
  // Fetch quick insights for all platforms
  const platforms = ['instagram', 'youtube', 'tiktok'];
  const insightsQueries = platforms.map(platform =>
    useQuery({
      queryKey: ['/api/trends/quick-insights', platform],
      queryFn: async () => {
        const response = await fetch(`/api/trends/quick-insights/${platform}`);
        if (!response.ok) throw new Error('Failed to fetch insights');
        return response.json();
      },
      enabled: isAuthenticated,
    })
  );
  
  // Generate new analysis mutation
  const generateAnalysisMutation = useMutation({
    mutationFn: async ({ platform, timeframe }: { platform: string; timeframe: string }) => {
      const response = await apiRequest('/api/trends/analyze', 'POST', { platform, timeframe });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "✨ Analysis Generated!",
        description: "New trend predictions have been generated based on your content performance.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trends/predictions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trends/quick-insights'] });
    },
    onError: (error: any) => {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Temporarily Unavailable",
        description: "Our AI service is currently at capacity. Please try again in a few minutes, or check the existing predictions.",
        variant: "destructive",
      });
    }
  });
  
  const predictions = predictionsData?.predictions || [];
  const availablePlatforms: string[] = ['all', ...Array.from(new Set(predictions.map((p: TrendPrediction) => p.platform).filter(Boolean)))];
  
  const handleAnalyze = (platform: string, timeframe: string) => {
    generateAnalysisMutation.mutate({ platform, timeframe });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InfluencerNav />
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                AI Trend Insights
              </h1>
              <p className="text-gray-600 mt-2">
                AI-powered content trend predictions tailored to your performance data
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/trends/predictions'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/trends/quick-insights'] });
                }}
                disabled={generateAnalysisMutation.isPending}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights" className="flex items-center gap-2" data-testid="tab-insights">
              <Zap className="w-4 h-4" />
              Quick Insights
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2" data-testid="tab-predictions">
              <Brain className="w-4 h-4" />
              Trend Predictions
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2" data-testid="tab-analyze">
              <Sparkles className="w-4 h-4" />
              Generate Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insightsQueries.map((query, index) => {
                const platform = platforms[index];
                if (query.isLoading) {
                  return (
                    <Card key={platform} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                if (query.error || !query.data?.success) {
                  return (
                    <Card key={platform} className="border-red-200">
                      <CardContent className="p-6 text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-red-600">Failed to load insights</p>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <QuickInsightsCard
                    key={platform}
                    platform={platform}
                    insights={query.data.insights}
                  />
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="predictions" className="space-y-6">
            {/* Platform Filter */}
            {availablePlatforms.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filter by platform:</span>
                <div className="flex gap-1">
                  {availablePlatforms.map((platform: string) => (
                    <Button
                      key={platform}
                      variant={selectedPlatform === platform ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPlatform(platform)}
                      className="capitalize"
                      data-testid={`filter-platform-${platform}`}
                    >
                      {platform === 'all' ? 'All Platforms' : platform}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Predictions Grid */}
            {predictionsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : predictions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Predictions Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Generate your first AI trend analysis to see personalized predictions
                  </p>
                  <Button
                    onClick={() => handleAnalyze('instagram', 'monthly')}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="button-first-analysis"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate First Analysis
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {predictions.map((prediction: TrendPrediction) => (
                  <TrendCard key={prediction.id} prediction={prediction} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analyze" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <AnalyzeForm onAnalyze={handleAnalyze} />
              
              {generateAnalysisMutation.isPending && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin">
                        <Brain className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Analyzing Your Content...</p>
                        <p className="text-sm text-gray-600">
                          AI is processing your performance data to generate trend predictions
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={75} className="w-full" />
                      <p className="text-xs text-gray-500 mt-2">This may take 30-60 seconds</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}