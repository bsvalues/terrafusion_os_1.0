/**
 * Productivity Tracker Widget
 *
 * Main container component for the productivity tracking features
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, LayoutPanelTop, LineChart  } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import EnergyLevelSelector from './energy-level-selector';
import FocusLevelSelector from './focus-level-selector';
import ActivitySessionTracker from './activity-session-tracker';
import ProductivityStats from './productivity-stats';

const ProductivityTrackerWidget = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Fetch current user's productivity data for today
  const { data: todayData, isLoading: isLoadingToday } = useQuery({
    queryKey: ['/api/productivity/today'],
    queryFn: async () => {
      const response = await fetch('/api/productivity/today');
      if (!response.ok) {
        throw new Error("Failed to fetch today's productivity data");
      }
      return await response.json();
    },
  });

  // Fetch active sessions
  const { data: activeSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/productivity/sessions/active'],
    queryFn: async () => {
      const response = await fetch('/api/productivity/sessions/active');
      if (!response.ok) {
        throw new Error('Failed to fetch active sessions');
      }
      return await response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update energy level mutation
  const updateEnergyMutation = useMutation({
    mutationFn: async (energyLevel: string) => {
      const response = await fetch('/api/productivity/energy-level', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ energyLevel, date: today }),
      });

      if (!response.ok) {
        throw new Error('Failed to update energy level');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/today'] });
      toast({
        title: 'Energy level updated',
        description: 'Your energy level has been updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update energy level',
        description: 'There was an error updating your energy level',
        variant: 'destructive',
      });
    },
  });

  // Update focus level mutation
  const updateFocusMutation = useMutation({
    mutationFn: async (focusLevel: string) => {
      const response = await fetch('/api/productivity/focus-level', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ focusLevel, date: today }),
      });

      if (!response.ok) {
        throw new Error('Failed to update focus level');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/productivity/today'] });
      toast({
        title: 'Focus level updated',
        description: 'Your focus level has been updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update focus level',
        description: 'There was an error updating your focus level',
        variant: 'destructive',
      });
    },
  });

  // Handle energy level change
  const handleEnergyChange = (level: string) => {
    updateEnergyMutation.mutate(level);
  };

  // Handle focus level change
  const handleFocusChange = (level: string) => {
    updateFocusMutation.mutate(level);
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary/10 p-2">
            <Zap className="h-5 w-5 text-primary" />
          </div>
        </div><>

        <CardTitle className="mt-2">Developer Productivity</CardTitle>
        <CardDescription
</>>Track your energy, focus, and activity sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="energy" className="space-y-4">
          <TabsList className="grid grid-cols-3 h-9">
            <TabsTrigger value="energy" className="text-xs"><>

              <Zap className="h-3 w-3 mr-1" /> Energy
            </TabsTrigger>
            <TabsTrigger
</> value="sessions" className="text-xs"><>

              <LayoutPanelTop className="h-3 w-3 mr-1" /> Sessions
            </TabsTrigger>
            <TabsTrigger
</> value="stats" className="text-xs">
              <LineChart className="h-3 w-3 mr-1" /> Stats
            </TabsTrigger>
          </TabsList>

          {/* Energy & Focus Tab */}
          <TabsContent value="energy" className="space-y-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Energy Level</p>
                {isLoadingToday ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (<>

                  <EnergyLevelSelector
                    currentLevel={todayData?.energyLevel || 'MEDIUM'}
                    onLevelChange={handleEnergyChange}
                    isUpdating={updateEnergyMutation.isPending}
                  />
                )}
              </div>

              <div
</>>
                <p className="text-sm font-medium mb-2">Current Focus Level</p>
                {isLoadingToday ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <FocusLevelSelector
                    currentLevel={todayData?.focusLevel || 'MODERATE'}
                    onLevelChange={handleFocusChange}
                    isUpdating={updateFocusMutation.isPending}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Activity Sessions Tab */}
          <TabsContent value="sessions">
            <ActivitySessionTracker activeSessions={activeSessions} isLoading={isLoadingSessions} />
          </TabsContent>

          {/* Productivity Stats Tab */}
          <TabsContent value="stats">
            <ProductivityStats />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProductivityTrackerWidget;
