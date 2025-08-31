import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  Calendar, 
  Hash,
  BarChart3,
  Clock,
  Lightbulb,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { SiInstagram, SiTiktok, SiYoutube, SiFacebook } from "react-icons/si";

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

interface QuickInsight {
  trending_now: string;
  hot_format: string;
  timing_tip: string;
}

const platformIcons = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  facebook: SiFacebook,
};

const platforms = [
  { value: "all", label: "All Platforms" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
];

export default function TrendPredictor() {
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("weekly");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing predictions
  const { data: predictions = [], isLoading: predictionsLoading } = useQuery<TrendPrediction[]>({
    queryKey: ["/api/trends/predictions", selectedPlatform],
    queryFn: async () => {
      const response = await apiRequest(`/api/trends/predictions?platform=${selectedPlatform}`, "GET");
      return response.predictions || [];
    },
  });

  // Fetch quick insights
  const { data: quickInsights } = useQuery<QuickInsight>({
    queryKey: ["/api/trends/quick-insights", selectedPlatform],
    queryFn: async () => {
      if (selectedPlatform === "all") return null;
      const response = await apiRequest(`/api/trends/quick-insights/${selectedPlatform}`, "GET");
      return response;
    },
    enabled: selectedPlatform !== "all",
  });

  // Generate new analysis
  const generateAnalysisMutation = useMutation({
    mutationFn: async (data: { platform: string; timeframe: string }) => {
      return await apiRequest("/api/trends/analyze", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "New trend predictions have been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trends/predictions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate trend analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAnalysis = () => {
    if (selectedPlatform === "all") {
      toast({
        title: "Select a Platform",
        description: "Please select a specific platform for analysis.",
        variant: "destructive",
      });
      return;
    }

    generateAnalysisMutation.mutate({
      platform: selectedPlatform,
      timeframe: selectedTimeframe,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? TrendingUp : TrendingDown;
  };

  const getPlatformIcon = (platform: string) => {
    const IconComponent = platformIcons[platform.toLowerCase()];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <div className="space-y-6" data-testid="trend-predictor">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Trend Predictor
          </h2>
          <p className="text-gray-600 mt-1">
            Get AI-powered insights on upcoming content trends and optimization strategies
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40" data-testid="platform-selector">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32" data-testid="timeframe-selector">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleGenerateAnalysis}
            disabled={generateAnalysisMutation.isPending || selectedPlatform === "all"}
            className="flex items-center gap-2"
            data-testid="generate-analysis-btn"
          >
            {generateAnalysisMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                Analyze Trends
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Insights */}
      {quickInsights && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Zap className="h-5 w-5" />
              Quick Insights for {selectedPlatform}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Hash className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-sm text-gray-800">Trending Now</p>
                <p className="text-xs text-gray-600 mt-1">{quickInsights.trending_now}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Target className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-sm text-gray-800">Hot Format</p>
                <p className="text-xs text-gray-600 mt-1">{quickInsights.hot_format}</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <Clock className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                <p className="font-medium text-sm text-gray-800">Timing Tip</p>
                <p className="text-xs text-gray-600 mt-1">{quickInsights.timing_tip}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Predictions */}
      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predictions">Trend Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Content Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          {predictionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : predictions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Predictions Available</h3>
                <p className="text-gray-600 mb-4">
                  Generate your first AI-powered trend analysis to get personalized predictions.
                </p>
                <Button onClick={handleGenerateAnalysis} disabled={selectedPlatform === "all"}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((prediction) => {
                const GrowthIcon = getGrowthIcon(prediction.predictedGrowth);
                return (
                  <Card key={prediction.id} className="hover:shadow-lg transition-shadow" data-testid={`prediction-${prediction.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(prediction.platform)}
                          <CardTitle className="text-lg">{prediction.trend}</CardTitle>
                        </div>
                        <Badge className={getConfidenceColor(prediction.confidence)}>
                          {Math.round(prediction.confidence * 100)}% confident
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <GrowthIcon className={`h-4 w-4 ${prediction.predictedGrowth > 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <span className="font-medium">
                            {prediction.predictedGrowth > 0 ? '+' : ''}{prediction.predictedGrowth}% growth
                          </span>
                          <span className="text-gray-600">• {prediction.timeframe}</span>
                        </div>

                        <p className="text-sm text-gray-700">{prediction.reasoning}</p>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-800 mb-1">Target Audience</p>
                            <p className="text-xs text-gray-600">{prediction.targetAudience}</p>
                          </div>

                          {prediction.hashtagRecommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-800 mb-1">Recommended Hashtags</p>
                              <div className="flex flex-wrap gap-1">
                                {prediction.hashtagRecommendations.slice(0, 3).map((hashtag) => (
                                  <Badge key={hashtag} variant="outline" className="text-xs">
                                    {hashtag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {prediction.bestPostTimes.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-800 mb-1">Best Posting Times</p>
                              <p className="text-xs text-gray-600">
                                {prediction.bestPostTimes.slice(0, 3).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {predictions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Recommendations Available</h3>
                <p className="text-gray-600 mb-4">
                  Generate trend analysis to get personalized content recommendations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {predictions.map((prediction) => (
                <Card key={`rec-${prediction.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Content Ideas for "{prediction.trend}"
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {prediction.contentSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-700 flex-1">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}