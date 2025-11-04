import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Trophy, Medal, Star, Clock, CheckCircle, Target, Calendar  } from '@mui/icons-material';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserAchievement, AchievementDefinition } from "@shared/schema";

interface AchievementsListProps {
  userId?: number;
}

// Icon mapping based on achievement type
const achievementIcons: Record<string, React.ReactNode> = {
  property: <Target className="h-5 w-5" />,
  adjustment: <Star className="h-5 w-5" />,
  compliance: <CheckCircle className="h-5 w-5" />,
  streak: <Calendar className="h-5 w-5" />,
  completion: <Trophy className="h-5 w-5" />,
  default: <Award className="h-5 w-5" />,
};

// Achievement card for a specific achievement
const AchievementCard = ({ achievement }: { achievement: UserAchievement }) => {
  // Determine the icon based on achievement type
  const icon = achievementIcons[achievement.type] || achievementIcons.default;

  // Determine badge variant and status text based on completion
  const badgeVariant = achievement.completed ? "success" : "outline";
  const statusText = achievement.completed ? "Completed" : "In Progress";

  // Calculate completion percentage for in-progress achievements
  const progressPercentage = achievement.completed ? 100 : achievement.progress || 0;

  return (
    <Card
      className={`hover:shadow-md transition-all ${achievement.completed ? "border-l-4 border-l-green-500" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3"><>

            <div
              className={`p-2 rounded-full ${achievement.completed ? "bg-green-100" : "bg-muted"}`}
            >
              {React.cloneElement(icon as React.ReactElement, {
                className: `${achievement.completed ? "text-green-700" : "text-muted-foreground"}`,
              })}
            </div>
            <div
</>><>

              <CardTitle className="text-base">{achievement.name}</CardTitle>
              <CardDescription
</>>{achievement.description}</CardDescription>
            </div>
          </div>
          <Badge variant={badgeVariant as any}>{statusText}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm"><>

            <span className="text-muted-foreground">Progress</span>
            <div
</> className="flex items-center gap-2">
              <span className="font-medium">{progressPercentage}%</span>
              {achievement.completed && (
                <span className="text-xs text-green-700">+{achievement.pointsAwarded} XP</span>
              )}
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />

          {/* Completion date if completed */}
          {achievement.completed && achievement.completedAt && (
            <div className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Completed on {new Date(achievement.completedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export function AchievementsList({ userId }: AchievementsListProps) {
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

  // Fetch achievement definitions (for category grouping)
  const achievementDefinitionsQuery = useQuery({
    queryKey: ["/api/achievement-definitions"],
    queryFn: async () => {
      const response = await apiRequest<AchievementDefinition[]>("/api/achievement-definitions");
      return response;
    },
  });

  // Loading state
  if (userAchievementsQuery.isLoading || achievementDefinitionsQuery.isLoading) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Achievements</CardTitle>
          <CardDescription
</>>Loading achievements data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <span className="animate-pulse">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (userAchievementsQuery.isError || achievementDefinitionsQuery.isError) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Achievements</CardTitle>
          <CardDescription
</>>Error loading achievements data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load achievements information. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const userAchievements = userAchievementsQuery.data || [];

  // Group achievements by category
  const achievementsByCategory: Record<string, UserAchievement[]> = {};
  userAchievements.forEach((achievement) => {
    const category = achievement.category || "Other";
    if (!achievementsByCategory[category]) {
      achievementsByCategory[category] = [];
    }
    achievementsByCategory[category].push(achievement);
  });

  // Create completed and in progress achievement lists
  const completedAchievements = userAchievements.filter((achievement) => achievement.completed);
  const inProgressAchievements = userAchievements.filter((achievement) => !achievement.completed);

  // Get completed count
  const completedCount = completedAchievements.length;
  const totalCount = userAchievements.length;
  const completionPercentage = Math.round((completedCount / (totalCount || 1)) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle>Appraiser Achievements</CardTitle>
            <CardDescription
</>>
              Track your progress and earn rewards as you appraise properties
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-2 py-1">
            <Trophy className="h-3.5 w-3.5 mr-1.5" />
            <span>
              {completedCount}/{totalCount} Complete ({completionPercentage}%)
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4"><>

            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger
</> value="complete">
              Complete <Badge className="ml-1">{completedAchievements.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress <Badge className="ml-1">{inProgressAchievements.length}</Badge>
            </TabsTrigger>
            {/* Category tabs for quick navigation */}
            {Object.keys(achievementsByCategory)
              .slice(0, 2)
              .map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
          </TabsList>

          {/* All Achievements tab */}
          <TabsContent value="all" className="space-y-6">
            {Object.entries(achievementsByCategory).map(([category, achievements]) => (
              <div key={category} className="space-y-4"><>

                <h3 className="text-lg font-medium">{category}</h3>
                <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Completed Achievements tab */}
          <TabsContent value="complete" className="space-y-4">
            {completedAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/10">
                <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground" /><>

                <h3 className="font-medium mb-1">No Achievements Completed Yet</h3>
                <p
</> className="text-sm text-muted-foreground">
                  Complete appraisal tasks to earn achievements and unlock rewards.
                </p>
              </div>
            )}
          </TabsContent>

          {/* In Progress Achievements tab */}
          <TabsContent value="in-progress" className="space-y-4">
            {inProgressAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgressAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/10">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" /><>

                <h3 className="font-medium mb-1">All Achievements Completed!</h3>
                <p
</> className="text-sm text-muted-foreground">
                  Great job! You've completed all available achievements.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Category tabs content */}
          {Object.entries(achievementsByCategory).map(([category, achievements]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
