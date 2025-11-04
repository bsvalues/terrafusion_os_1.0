import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, Star, Trophy, TrendingUp, CheckCircle, Target, Calendar, Zap  } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserProgress, UserAchievement, Level } from "@shared/schema";

interface UserProgressCardProps {
  userId?: number;
}

export function UserProgressCard({ userId }: UserProgressCardProps) {
  // Fetch user progress
  const userProgressQuery = useQuery({
    queryKey: ["/api/user-progress", userId],
    queryFn: async () => {
      const response = await apiRequest<UserProgress>(`/api/user-progress/${userId || "me"}`);
      return response;
    },
    enabled: !!userId || true, // Default to current user if no ID provided
  });

  // Fetch user achievements
  const userAchievementsQuery = useQuery({
    queryKey: ["/api/user-achievements", userId],
    queryFn: async () => {
      const response = await apiRequest<UserAchievement[]>(
        `/api/user-achievements/${userId || "me"}`
      );
      return response;
    },
    enabled: !!userId || true,
  });

  // Fetch all levels for progress calculations
  const levelsQuery = useQuery({
    queryKey: ["/api/levels"],
    queryFn: async () => {
      const response = await apiRequest<Level[]>("/api/levels");
      return response;
    },
  });

  // Loading state
  if (userProgressQuery.isLoading || userAchievementsQuery.isLoading || levelsQuery.isLoading) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>User Progress</CardTitle>
          <CardDescription
</>>Loading progress data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <span className="animate-pulse">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (userProgressQuery.isError || userAchievementsQuery.isError || levelsQuery.isError) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>User Progress</CardTitle>
          <CardDescription
</>>Error loading progress data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load progress information. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const userProgress = userProgressQuery.data;
  const userAchievements = userAchievementsQuery.data || [];
  const levels = levelsQuery.data || [];

  // Find current and next level
  const currentLevel = levels.find((level) => level.id === userProgress?.level) || levels[0];
  const nextLevelIndex = levels.findIndex((level) => level.id === currentLevel?.id) + 1;
  const nextLevel = nextLevelIndex < levels.length ? levels[nextLevelIndex] : null;

  // Calculate progress to next level
  const currentPoints = userProgress?.totalPoints || 0;
  const currentLevelPoints = currentLevel?.pointThreshold || 0;
  const nextLevelPoints = nextLevel?.pointThreshold || currentLevelPoints + 100;
  const pointsToNextLevel = nextLevelPoints - currentLevelPoints;
  const pointsEarnedTowardsNextLevel = currentPoints - currentLevelPoints;
  const progressPercentage = Math.min(
    Math.round((pointsEarnedTowardsNextLevel / pointsToNextLevel) * 100),
    100
  );

  // Recent achievements (last 3)
  const recentAchievements = [...userAchievements]
    .sort((a, b) => {
      // Sort by completion date, newest first
      return new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime();
    })
    .filter((achievement) => achievement.completed)
    .slice(0, 3);

  // Get completed count
  const completedAchievements = userAchievements.filter((a) => a.completed).length;
  const totalAchievements = userAchievements.length;
  const completionPercentage = Math.round((completedAchievements / (totalAchievements || 1)) * 100);

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><>

            <CardTitle>Appraiser Progress</CardTitle>
            <CardDescription
</>>Track your achievements and progress</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="py-1 px-2 bg-green-50 text-green-700 border-green-200"
            >
              <Trophy className="h-3.5 w-3.5 mr-1" />
              Level {currentLevel?.level || 1}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Level Progress */}
          <div className="space-y-3 col-span-2 border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3 bg-green-100">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-green-700">
                    {currentLevel?.level || 1}
                  </AvatarFallback>
                </Avatar>
                <div><>

                  <h3 className="font-medium">{currentLevel?.name || "Apprentice Appraiser"}</h3>
                  <p
</> className="text-xs text-muted-foreground">XP: {currentPoints} points</p>
                </div>
              </div>
              {nextLevel && (
                <div className="text-right"><>

                  <h4 className="text-sm font-medium text-muted-foreground">Next Level</h4>
                  <p
</> className="font-medium">{nextLevel?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pointsEarnedTowardsNextLevel} / {pointsToNextLevel} XP needed
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm"><>

                <span className="text-muted-foreground">Level Progress</span>
                <span
</> className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>

          {/* Stats */}
          <div className="border rounded-lg p-4 space-y-3"><>

            <h3 className="font-medium text-sm">Statistics</h3>
            <div
</> className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span>Completed Reports</span>
                </div>
                <span className="font-medium">{userProgress?.propertyEvaluations || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-2 text-amber-600" />
                  <span>Accuracy Score</span>
                </div>
                <span className="font-medium">{userProgress?.accuracyScore || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Current Streak</span>
                </div>
                <span className="font-medium">{userProgress?.currentStreak || 0} days</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-purple-600" />
                  <span>Longest Streak</span>
                </div>
                <span className="font-medium">{userProgress?.longestStreak || 0} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3"><>

            <h3 className="font-medium">Recent Achievements</h3>
            <Badge
</> variant="outline">
              {completedAchievements}/{totalAchievements} Completed ({completionPercentage}%)
            </Badge>
          </div>

          {recentAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="border rounded-lg p-3 bg-green-50/30 flex items-center"
                >
                  <div className="bg-green-100 p-2 rounded-full mr-3"><>

                    <Award className="h-5 w-5 text-green-700" />
                  </div>
                  <div
</>><>

                    <h4 className="font-medium text-sm">{achievement.name}</h4>
                    <p
</> className="text-xs text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs mt-1 font-medium text-green-700">
                      +{achievement.pointsAwarded} XP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border rounded-lg bg-muted/10">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><>

              <h3 className="font-medium">No achievements yet</h3>
              <p
</> className="text-sm text-muted-foreground">
                Complete appraisals and tasks to earn achievements and rewards.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <Award className="h-4 w-4 mr-2" />
          View All Achievements
        </Button>
      </CardFooter>
    </Card>
  );
}
