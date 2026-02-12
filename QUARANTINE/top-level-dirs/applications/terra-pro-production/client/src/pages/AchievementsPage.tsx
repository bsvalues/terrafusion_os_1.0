import React from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProgressCard } from "@/components/gamification/UserProgress";
import { AchievementsList } from "@/components/gamification/AchievementsList";
import { Award, Trophy, Zap, Target, Medal  } from '@mui/icons-material';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserProgress, Level } from "@shared/schema";

export default function AchievementsPage() {
  // Fetch user progress data
  const userProgressQuery = useQuery({
    queryKey: ["/api/user-progress/me"],
    queryFn: async () => {
      const response = await apiRequest<UserProgress>("/api/user-progress/me");
      return response;
    },
  });

  // Fetch levels data
  const levelsQuery = useQuery({
    queryKey: ["/api/levels"],
    queryFn: async () => {
      const response = await apiRequest<Level[]>("/api/levels");
      return response;
    },
  });

  // Calculate next milestones based on user progress
  const nextMilestones = React.useMemo(() => {
    if (userProgressQuery.isLoading || !userProgressQuery.data) {
      return [];
    }

    const progress = userProgressQuery.data;
    const milestones = [];

    // Property evaluations milestone
    const currentEvaluations = progress.propertyEvaluations || 0;
    const nextEvaluationMilestone = Math.ceil(currentEvaluations / 5) * 5;
    if (nextEvaluationMilestone > currentEvaluations) {
      milestones.push({
        title: `Complete ${nextEvaluationMilestone} Property Evaluations`,
        description: `You've completed ${currentEvaluations} so far`,
        progress: (currentEvaluations / nextEvaluationMilestone) * 100,
        icon: <Target className="h-10 w-10 text-blue-600" />,
      });
    }

    // Accuracy score milestone
    const currentAccuracy = progress.accuracyScore || 0;
    const nextAccuracyMilestone = Math.min(100, Math.ceil(currentAccuracy / 10) * 10);
    if (nextAccuracyMilestone > currentAccuracy) {
      milestones.push({
        title: `Reach ${nextAccuracyMilestone}% Accuracy Score`,
        description: `Your current accuracy score is ${currentAccuracy}%`,
        progress: (currentAccuracy / nextAccuracyMilestone) * 100,
        icon: <Medal className="h-10 w-10 text-amber-600" />,
      });
    }

    // Streak milestone
    const currentStreak = progress.currentStreak || 0;
    const nextStreakMilestone = Math.ceil(currentStreak / 5) * 5;
    if (nextStreakMilestone > currentStreak) {
      milestones.push({
        title: `Maintain a ${nextStreakMilestone}-Day Activity Streak`,
        description: `Your current streak is ${currentStreak} days`,
        progress: (currentStreak / nextStreakMilestone) * 100,
        icon: <Zap className="h-10 w-10 text-purple-600" />,
      });
    }

    return milestones;
  }, [userProgressQuery.data]);

  return (
    <PageLayout
      title="Achievements & Progress"
      description="Track your appraisal activities, earn achievements, and level up your appraiser profile"
      showSyncStatus={true}
    >
      <div className="space-y-6">
        {/* User Progress Card */}
        <UserProgressCard />

        {/* Next Milestones */}
        {nextMilestones.length > 0 && (
          <Card>
            <CardHeader><>

              <CardTitle>Next Milestones</CardTitle>
              <CardDescription
</>>Upcoming goals to help you level up faster</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {nextMilestones.map((milestone /* , index */) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 flex flex-col items-center text-center"
                  ><>

                    <div className="bg-primary/10 p-3 rounded-full mb-3">{milestone.icon}</div>
                    <h3
</> className="font-medium mb-1">{milestone.title}</h3><>

                    <p className="text-sm text-muted-foreground mb-4">{milestone.description}</p>
                    <div
</> className="w-full bg-muted rounded-full h-2 mb-2"><>

                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                    <span
</> className="text-xs font-medium">
                      {Math.round(milestone.progress)}% Complete
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements List */}
        <AchievementsList />

        {/* Leaderboard Preview */}
        <Card className="bg-muted/10">
          <CardHeader><>

            <CardTitle>Appraiser Leaderboard</CardTitle>
            <CardDescription
</>>
              See how you rank among other appraisers in your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-amber-500 opacity-70" /><>

            <h3 className="text-lg font-medium mb-2">Leaderboard Coming Soon!</h3>
            <p
</> className="text-muted-foreground mb-6 max-w-md mx-auto">
              The appraiser leaderboard feature is under development and will be available soon.
              Keep completing reports and earning achievements to secure your spot on the
              leaderboard!
            </p>
            <Button variant="outline" disabled>
              <Trophy className="mr-2 h-4 w-4" />
              View Leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
