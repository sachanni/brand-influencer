import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navigation } from '@/components/layout/navigation';
import { 
  Trophy, 
  Star, 
  Zap, 
  Award, 
  Target, 
  TrendingUp, 
  Crown,
  Flame,
  Medal,
  Users,
  Calendar,
  Gift,
  Rocket,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardUser {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  totalPoints: number;
  currentLevel: number;
  rank: string;
  connectionStreak: number;
  platformsConnected: number;
  achievementCount: number;
  position: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  currentProgress: number;
  targetValue: number;
  isCompleted: boolean;
  icon: string;
  color: string;
  expiresAt: string;
  challengeType: string;
  category: string;
}

export default function GamificationDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('leaderboard');

  // Fetch leaderboard data
  const { data: leaderboard } = useQuery<{ success: boolean; users: LeaderboardUser[] }>({
    queryKey: ['/api/gamification/leaderboard'],
    staleTime: 60000 // 1 minute
  });

  // Fetch daily challenges
  const { data: challenges } = useQuery<DailyChallenge[]>({
    queryKey: ['/api/challenges'],
    staleTime: 300000 // 5 minutes
  });

  // Fetch user's gamification profile
  const { data: profile } = useQuery({
    queryKey: ['/api/gamification/profile'],
    staleTime: 30000
  });

  const leaderboardUsers = leaderboard?.users || [];
  const dailyChallenges = challenges?.challenges || [];
  const userProfile = profile?.profile as any;

  // Mock data for demonstration
  const mockLeaderboard: LeaderboardUser[] = [
    {
      id: '1',
      firstName: 'Alex',
      lastName: 'Johnson',
      profileImageUrl: '',
      totalPoints: 2850,
      currentLevel: 8,
      rank: 'Elite',
      connectionStreak: 15,
      platformsConnected: 4,
      achievementCount: 12,
      position: 1
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Davis',
      profileImageUrl: '',
      totalPoints: 2340,
      currentLevel: 7,
      rank: 'Established',
      connectionStreak: 8,
      platformsConnected: 3,
      achievementCount: 9,
      position: 2
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Chen',
      profileImageUrl: '',
      totalPoints: 1920,
      currentLevel: 6,
      rank: 'Rising',
      connectionStreak: 12,
      platformsConnected: 3,
      achievementCount: 8,
      position: 3
    },
    {
      id: (user as any)?.id || '4',
      firstName: (user as any)?.firstName || 'You',
      lastName: (user as any)?.lastName || '',
      profileImageUrl: (user as any)?.profileImageUrl || '',
      totalPoints: userProfile?.totalPoints || 150,
      currentLevel: userProfile?.currentLevel || 2,
      rank: userProfile?.rank || 'Newcomer',
      connectionStreak: userProfile?.connectionStreak || 2,
      platformsConnected: userProfile?.platformsConnected || 1,
      achievementCount: userProfile?.achievementCount || 2,
      position: 4
    }
  ];

  const mockChallenges: DailyChallenge[] = [
    {
      id: '1',
      title: 'Connect a New Platform',
      description: 'Link your Instagram, TikTok, or YouTube account today',
      points: 100,
      progress: 0,
      maxProgress: 1,
      completed: false,
      icon: 'link',
      color: 'blue',
      expiresAt: '2025-01-25T23:59:59Z'
    },
    {
      id: '2',
      title: 'Update Your Profile',
      description: 'Add a bio and profile photo to increase your visibility',
      points: 50,
      progress: 1,
      maxProgress: 2,
      completed: false,
      icon: 'user',
      color: 'green',
      expiresAt: '2025-01-25T23:59:59Z'
    },
    {
      id: '3',
      title: 'Streak Keeper',
      description: 'Maintain your daily activity streak for 7 days',
      points: 200,
      progress: userProfile?.connectionStreak || 2,
      maxProgress: 7,
      completed: (userProfile?.connectionStreak || 0) >= 7,
      icon: 'flame',
      color: 'orange',
      expiresAt: '2025-01-31T23:59:59Z'
    }
  ];

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  const getChallengeIcon = (icon: string) => {
    const iconMap: { [key: string]: any } = {
      link: Target,
      user: Users,
      flame: Flame,
      star: Star,
      trophy: Trophy
    };
    const IconComponent = iconMap[icon] || Target;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <motion.h1 
            className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            🏆 Gamification Hub
          </motion.h1>
          <p className="text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Compete with other influencers, complete challenges, and climb the leaderboards!
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="leaderboard" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>Achievements</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            {/* User's Current Position */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16 border-4 border-white">
                      <AvatarImage src={(user as any)?.profileImageUrl} alt={(user as any)?.firstName} />
                      <AvatarFallback className="bg-white text-blue-600 font-bold text-xl">
                        {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">Your Ranking</h2>
                      <p className="opacity-90">Level {userProfile?.currentLevel || 2} • {userProfile?.rank || 'Newcomer'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">#4</div>
                    <p className="opacity-90">{userProfile?.totalPoints || 150} XP</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Global Leaderboard</span>
                  <Badge className="ml-auto">Top 10</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLeaderboard.map((leaderUser, index) => (
                    <motion.div
                      key={leaderUser.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:shadow-md ${
                        leaderUser.id === (user as any)?.id 
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-2 border-blue-300 dark:border-blue-700' 
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8">
                          {getPositionIcon(leaderUser.position)}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={leaderUser.profileImageUrl} alt={leaderUser.firstName} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                            {leaderUser.firstName[0]}{leaderUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold flex items-center space-x-2">
                            <span>{leaderUser.firstName} {leaderUser.lastName}</span>
                            {leaderUser.id === (user as any)?.id && <Badge variant="secondary" className="text-xs">You</Badge>}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Level {leaderUser.currentLevel} • {leaderUser.rank}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {leaderUser.totalPoints.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">XP</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center">
                            <Flame className="w-4 h-4 mr-1" />
                            {leaderUser.connectionStreak}
                          </div>
                          <div className="text-xs text-gray-500">Streak</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {leaderUser.platformsConnected}
                          </div>
                          <div className="text-xs text-gray-500">Platforms</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            {!challenges || challenges.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Challenges</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Generate your personalized daily challenges to start earning points!
                  </p>
                  <Button 
                    onClick={async () => {
                      try {
                        await apiRequest('/api/challenges/generate', { method: 'POST' });
                        window.location.reload(); // Refresh to show new challenges
                      } catch (error) {
                        console.error('Failed to generate challenges:', error);
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Today's Challenges
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`border-2 ${challenge.isCompleted ? 'border-green-300 bg-green-50 dark:bg-green-950' : 'border-gray-200 hover:shadow-lg'} transition-all duration-300`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-full ${
                            challenge.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' :
                            challenge.color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                            challenge.color === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
                          }`}>
                            {getChallengeIcon(challenge.icon)}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge className={`${
                              challenge.isCompleted ? 'bg-green-500' : 'bg-yellow-500'
                            } text-white`}>
                              +{challenge.pointsReward} XP
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {challenge.challengeType}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span>Progress</span>
                            <span className="font-medium">
                              {challenge.currentProgress}/{challenge.targetValue}
                            </span>
                          </div>
                          <Progress 
                            value={(challenge.currentProgress / challenge.targetValue) * 100} 
                            className="h-2"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Expires: {new Date(challenge.expiresAt).toLocaleDateString()}
                            </span>
                            {challenge.isCompleted ? (
                              <Badge className="bg-green-500 text-white">
                                Completed! 🎉
                              </Badge>
                            ) : challenge.currentProgress >= challenge.targetValue ? (
                              <Button 
                                size="sm" 
                                className="text-xs"
                                onClick={async () => {
                                  try {
                                    await apiRequest(`/api/challenges/${challenge.id}/complete`, { method: 'POST' });
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Failed to complete challenge:', error);
                                  }
                                }}
                              >
                                <Trophy className="w-3 h-3 mr-1" />
                                Claim Reward
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">In Progress</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Achievement Gallery Coming Soon!
              </h3>
              <p className="text-gray-500">
                View all your earned badges, trophies, and milestone achievements here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}