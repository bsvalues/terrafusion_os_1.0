import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, ArrowRight  } from '@mui/icons-material';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserProgress, Level, UserAchievement } from "@shared/schema";

export function ProfileMiniCard() {
  const [_, setLocation] = useLocation();

  // Fetch user progress
  const userProgressQuery = useQuery({
    queryKey: ["/api/user-progress/me"],
    queryFn: async () => {
      const response = await apiRequest<UserProgress>("/api/user-progress/me");
      return response;
    },
  });

  // Fetch all levels for progress calculations
  const levelsQuery = useQuery({
    queryKey: ["/api/levels"],
    queryFn: async () => {
      const response = await apiRequest<Level[]>("/api/levels");
      return response;
    },
  });

  // Fetch user achievements (recently completed)
  const recentAchievementsQuery = useQuery({
    queryKey: ["/api/user-achievements/recent"],
    queryFn: async () => {
      const response = await apiRequest<UserAchievement[]>("/api/user-achievements/recent");
      return response;
    },
  });

  // Loading state
  if (userProgressQuery.isLoading || levelsQuery.isLoading) {
    return (
      <Card className="hover:shadow-md transition-all">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 mb-4"><>

            <div className="animate-pulse rounded-full bg-muted h-10 w-10"></div>
            <div
</> className="space-y-2"><>

              <div className="animate-pulse h-4 w-24 bg-muted rounded"></div>
              <div
</> className="animate-pulse h-3 w-16 bg-muted rounded"></div>
            </div>
          </div><>

          <div className="animate-pulse h-2 w-full bg-muted rounded mb-4"></div>
          <div
</> className="animate-pulse h-8 w-full bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Error state - show minimal version with button to achievements
  if (userProgressQuery.isError || levelsQuery.isError) {
    return (
      <Card className="hover:shadow-md transition-all">
        <CardContent className="pt-6">
          <div className="text-center space-y-3 mb-4">
            <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Unable to load progress data</p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setLocation("/achievements")}>
            <Award className="mr-2 h-4 w-4" />
            View Achievements
          </Button>
        </CardContent>
      </Card>
    );
  }

  const userProgress = userProgressQuery.data;
  const levels = levelsQuery.data || [];
  const recentAchievements = recentAchievementsQuery.data || [];

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

  // Get most recent achievement (if any)
  const mostRecentAchievement = recentAchievements.length > 0 ? recentAchievements[0] : null;

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {currentLevel?.level || 1}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center"><>

              <h3 className="font-medium">{currentLevel?.name || "Appraiser"}</h3>
              <Badge
</> variant="outline" className="ml-2 text-xs">
                Level {currentLevel?.level || 1}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{currentPoints} XP total</p>
          </div>
        </div>

        {nextLevel && (
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between text-xs"><>

              <span className="text-muted-foreground">
                {pointsEarnedTowardsNextLevel} / {pointsToNextLevel} XP to Level {nextLevel.level}
              </span>
              <span
</>>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {mostRecentAchievement && (
          <div className="border rounded p-2 mb-4 bg-muted/10 flex items-center">
            <Award className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
            <div className="flex-1 min-w-0"><>

              <p className="text-xs font-medium truncate">{mostRecentAchievement.name}</p>
              <p
</> className="text-xs text-muted-foreground truncate">
                +{mostRecentAchievement.pointsAwarded} XP earned
              </p>
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={() => setLocation("/achievements")}>
          <Trophy className="mr-2 h-4 w-4" />
          View Achievements
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
