import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Zap, 
  Award, 
  Target, 
  TrendingUp, 
  Link,
  Check,
  Flame,
  Crown,
  Sparkles,
  Medal,
  Gift,
  Rocket,
  Bolt
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';

interface GamificationProfile {
  id: string;
  userId: string;
  totalPoints: number;
  currentLevel: number;
  connectionStreak: number;
  longestStreak: number;
  platformsConnected: number;
  verifiedPlatforms: number;
  totalConnections: number;
  achievementCount: number;
  rank: string;
  nextLevelPoints: number;
  lastActivityDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ConnectionAchievement {
  id: string;
  userId: string;
  achievementType: string;
  level: number;
  title: string;
  description: string;
  badgeIcon: string;
  badgeColor: string;
  pointsEarned: number;
  platform?: string;
  isViewed: boolean;
  earnedAt: string;
}

interface ConnectionGamificationProps {
  onAchievementEarned?: (achievement: ConnectionAchievement) => void;
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  award: Award,
  target: Target,
  link: Link,
  verified: Check,
  flame: Flame,
  crown: Crown,
  sparkles: Sparkles,
  medal: Medal,
  gift: Gift,
  rocket: Rocket,
  bolt: Bolt
};

const colorMap = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  silver: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
};

export default function ConnectionGamification({ onAchievementEarned }: ConnectionGamificationProps) {
  const [newAchievements, setNewAchievements] = useState<ConnectionAchievement[]>([]);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<{ success: boolean; profile: GamificationProfile }>({
    queryKey: ['/api/gamification/profile'],
    staleTime: 30000 // 30 seconds
  });

  const { data: achievements } = useQuery<{ success: boolean; achievements: ConnectionAchievement[] }>({
    queryKey: ['/api/gamification/achievements'],
    staleTime: 30000 // 30 seconds
  });

  const { data: streak } = useQuery<{ success: boolean; streak: number }>({
    queryKey: ['/api/gamification/streak'],
    staleTime: 30000 // 30 seconds
  });

  const checkAchievementsMutation = useMutation({
    mutationFn: async (): Promise<{ success: boolean; newAchievements: ConnectionAchievement[] }> => {
      const response = await fetch('/api/gamification/check-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return response.json();
    },
    onSuccess: (data: { success: boolean; newAchievements: ConnectionAchievement[] }) => {
      if (data.newAchievements && data.newAchievements.length > 0) {
        setNewAchievements(data.newAchievements);
        data.newAchievements.forEach(achievement => {
          onAchievementEarned?.(achievement);
        });
        // Refresh profile and achievements
        queryClient.invalidateQueries({ queryKey: ['/api/gamification/profile'] });
        queryClient.invalidateQueries({ queryKey: ['/api/gamification/achievements'] });
      }
    }
  });

  const markAsViewedMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const response = await fetch(`/api/gamification/achievements/${achievementId}/viewed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/achievements'] });
    }
  });

  // Check for new achievements on component mount
  useEffect(() => {
    checkAchievementsMutation.mutate();
  }, []);

  const handleDismissAchievement = (achievement: ConnectionAchievement) => {
    markAsViewedMutation.mutate(achievement.id);
    setNewAchievements(prev => prev.filter(a => a.id !== achievement.id));
  };

  const currentProfile = profile?.profile;
  const userAchievements = achievements?.achievements || [];
  const currentStreak = streak?.streak || 0;

  // Calculate progress to next level
  const progressToNextLevel = currentProfile?.nextLevelPoints ? 
    Math.max(0, 100 - currentProfile.nextLevelPoints) : 0;

  return (
    <div className="space-y-6">
      {/* New Achievement Notifications */}
      {newAchievements.map((achievement) => {
        const IconComponent = iconMap[achievement.badgeIcon as keyof typeof iconMap] || Star;
        const colorClass = colorMap[achievement.badgeColor as keyof typeof colorMap] || colorMap.blue;
        
        return (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, x: 300 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              duration: 0.6
            }}
          >
            <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950 dark:via-amber-950 dark:to-orange-950 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4 relative overflow-hidden">
                {/* Celebration particles background */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 left-4 animate-bounce">
                    <Sparkles className="w-4 h-4 text-yellow-400 opacity-60" />
                  </div>
                  <div className="absolute top-6 right-8 animate-pulse">
                    <Star className="w-3 h-3 text-amber-400 opacity-40" />
                  </div>
                  <div className="absolute bottom-3 left-12 animate-ping">
                    <div className="w-2 h-2 bg-yellow-300 rounded-full opacity-30"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <motion.div 
                      className={`p-3 rounded-full ${colorClass} relative`}
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 0.6,
                        repeat: 2
                      }}
                    >
                      <IconComponent className="w-7 h-7" />
                      <motion.div 
                        className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.3 }}
                      >
                        <Sparkles className="w-2 h-2 text-yellow-800" />
                      </motion.div>
                    </motion.div>
                    <div>
                      <motion.h4 
                        className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                      >
                        🎉 Achievement Unlocked!
                      </motion.h4>
                      <p className="font-bold text-lg text-yellow-800 dark:text-yellow-200 mb-1">{achievement.title}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{achievement.description}</p>
                      <motion.div 
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="flex items-center text-green-600 dark:text-green-400 font-bold text-sm">
                          <Zap className="w-4 h-4 mr-1" />
                          +{achievement.pointsEarned} XP
                        </div>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                          Level {achievement.level}
                        </Badge>
                      </motion.div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDismissAchievement(achievement)}
                    className="hover:bg-yellow-100 dark:hover:bg-yellow-900 transition-colors"
                  >
                    Awesome!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Gamification Stats */}
      <Card data-testid="gamification-stats" className="bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 3 
                }}
              >
                <Trophy className="w-6 h-6 text-yellow-500" />
              </motion.div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Connection Progress
              </span>
            </div>
            {currentProfile && currentProfile.currentLevel > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-1"
              >
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 font-medium">Elite Member</span>
              </motion.div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Level Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <motion.span 
                  className="font-bold text-xl text-blue-600 dark:text-blue-400"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Level {currentProfile?.currentLevel || 1}
                </motion.span>
                <Bolt className="w-4 h-4 text-yellow-500" />
              </div>
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium px-3 py-1"
              >
                {currentProfile?.rank || 'Newcomer'}
              </Badge>
            </div>
            
            <div className="relative">
              <Progress 
                value={progressToNextLevel} 
                className="h-4 bg-gray-200 dark:bg-gray-700" 
                data-testid="level-progress" 
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-20"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ 
                  backgroundSize: '200% 100%',
                  width: `${progressToNextLevel}%`
                }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {currentProfile?.totalPoints || 0} XP
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {currentProfile?.nextLevelPoints || 100} XP to level up!
              </span>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Streak Counter with Fire Effect */}
            <motion.div 
              className="text-center p-4 bg-gradient-to-br from-orange-100 via-red-50 to-pink-100 dark:from-orange-950 dark:via-red-950 dark:to-pink-950 rounded-xl border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300 cursor-pointer group" 
              data-testid="connection-streak"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={currentStreak >= 3 ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                } : {}}
                transition={{
                  duration: 0.8,
                  repeat: currentStreak >= 3 ? Infinity : 0,
                  repeatDelay: 1
                }}
              >
                <Flame className={`w-8 h-8 mx-auto mb-2 ${currentStreak >= 7 ? 'text-red-500' : currentStreak >= 3 ? 'text-orange-500' : 'text-gray-400'}`} />
              </motion.div>
              <motion.div 
                className="font-bold text-2xl text-orange-600 dark:text-orange-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {currentStreak}
              </motion.div>
              <div className="text-sm text-orange-700 dark:text-orange-300 font-medium">Day Streak</div>
              {currentStreak >= 7 && (
                <motion.div 
                  className="text-xs text-red-600 dark:text-red-400 font-bold mt-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ON FIRE! 🔥
                </motion.div>
              )}
            </motion.div>
            
            {/* Connected Platforms */}
            <motion.div 
              className="text-center p-4 bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 rounded-xl border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 cursor-pointer group" 
              data-testid="platforms-connected"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Link className="w-8 h-8 text-green-500 mx-auto mb-2" />
              </motion.div>
              <div className="font-bold text-2xl text-green-600 dark:text-green-400">{currentProfile?.platformsConnected || 0}</div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">Platforms</div>
              {(currentProfile?.platformsConnected || 0) >= 3 && (
                <Badge className="mt-1 bg-green-500 text-white text-xs">
                  Multi-Platform Pro!
                </Badge>
              )}
            </motion.div>
            
            {/* Achievements */}
            <motion.div 
              className="text-center p-4 bg-gradient-to-br from-purple-100 via-violet-50 to-indigo-100 dark:from-purple-950 dark:via-violet-950 dark:to-indigo-950 rounded-xl border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 cursor-pointer group" 
              data-testid="total-achievements"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              </motion.div>
              <div className="font-bold text-2xl text-purple-600 dark:text-purple-400">{userAchievements.length}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">Achievements</div>
              {userAchievements.length >= 5 && (
                <Badge className="mt-1 bg-purple-500 text-white text-xs">
                  Achievement Hunter!
                </Badge>
              )}
            </motion.div>
            
            {/* Total Points with Sparkle Effect */}
            <motion.div 
              className="text-center p-4 bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100 dark:from-yellow-950 dark:via-amber-950 dark:to-orange-950 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden" 
              data-testid="total-points"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Sparkle particles for high point values */}
              {(currentProfile?.totalPoints || 0) > 100 && (
                <>
                  <motion.div 
                    className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full"
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0
                    }}
                  />
                  <motion.div 
                    className="absolute top-4 right-3 w-1.5 h-1.5 bg-amber-400 rounded-full"
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.5
                    }}
                  />
                  <motion.div 
                    className="absolute bottom-3 left-4 w-1 h-1 bg-orange-400 rounded-full"
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 1
                    }}
                  />
                </>
              )}
              
              <motion.div
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              </motion.div>
              <motion.div 
                className="font-bold text-2xl text-yellow-600 dark:text-yellow-400"
                animate={{
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                {currentProfile?.totalPoints || 0}
              </motion.div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Total XP</div>
              {(currentProfile?.totalPoints || 0) >= 500 && (
                <Badge className="mt-1 bg-yellow-500 text-white text-xs">
                  Point Master! 🌟
                </Badge>
              )}
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {userAchievements.length > 0 && (
        <Card data-testid="recent-achievements">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span>Your Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userAchievements.slice(0, 5).map((achievement) => {
                const IconComponent = iconMap[achievement.badgeIcon as keyof typeof iconMap] || Star;
                const colorClass = colorMap[achievement.badgeColor as keyof typeof colorMap] || colorMap.blue;
                
                return (
                  <div key={achievement.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{achievement.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      +{achievement.pointsEarned}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Challenges */}
      <Card data-testid="connection-challenges">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span>Connection Challenges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div>
                <p className="font-medium">Connect 2 Platforms</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Unlock Cross-Platform Creator badge</p>
              </div>
              <Badge variant={(currentProfile?.platformsConnected ?? 0) >= 2 ? "default" : "secondary"}>
                {(currentProfile?.platformsConnected ?? 0) >= 2 ? "Complete" : `${currentProfile?.platformsConnected || 0}/2`}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div>
                <p className="font-medium">7-Day Streak</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Stay active for a week</p>
              </div>
              <Badge variant={currentStreak >= 7 ? "default" : "secondary"}>
                {currentStreak >= 7 ? "Complete" : `${currentStreak}/7`}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div>
                <p className="font-medium">Verified Account</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Connect an account with 1K+ followers</p>
              </div>
              <Badge variant={(currentProfile?.verifiedPlatforms ?? 0) >= 1 ? "default" : "secondary"}>
                {(currentProfile?.verifiedPlatforms ?? 0) >= 1 ? "Complete" : "Pending"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}