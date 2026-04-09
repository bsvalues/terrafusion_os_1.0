/**
 * MCPMaintenancePanel Component
 * 
 * This component displays AI-powered maintenance recommendations
 * for system health and optimization.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
  ChevronRight,
  List,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  ListFilter
} from 'lucide-react';

import { 
  recommendationStore, 
  Recommendation, 
  RecommendationStatus, 
  RecommendationPriority,
  RecommendationType,
  maintenanceEngine 
} from '@/lib/maintenance';

/**
 * Priority badge component for recommendations
 */
const PriorityBadge = ({ priority }: { priority: RecommendationPriority }) => {
  const getVariant = () => {
    switch (priority) {
      case RecommendationPriority.HIGH:
        return 'destructive';
      case RecommendationPriority.MEDIUM:
        return 'warning';
      case RecommendationPriority.LOW:
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getLabel = () => {
    switch (priority) {
      case RecommendationPriority.HIGH:
        return 'High';
      case RecommendationPriority.MEDIUM:
        return 'Medium';
      case RecommendationPriority.LOW:
        return 'Low';
      default:
        return 'Unknown';
    }
  };
  
  const getIcon = () => {
    switch (priority) {
      case RecommendationPriority.HIGH:
        return <ArrowUpCircle className="h-3 w-3 mr-1" />;
      case RecommendationPriority.MEDIUM:
        return <MinusCircle className="h-3 w-3 mr-1" />;
      case RecommendationPriority.LOW:
        return <ArrowDownCircle className="h-3 w-3 mr-1" />;
      default:
        return <Circle className="h-3 w-3 mr-1" />;
    }
  };
  
  return (
    <Badge variant={getVariant() as any} className="flex items-center">
      {getIcon()}
      {getLabel()}
    </Badge>
  );
};

/**
 * Status badge component for recommendations
 */
const StatusBadge = ({ status }: { status: RecommendationStatus }) => {
  const getVariant = () => {
    switch (status) {
      case RecommendationStatus.NEW:
        return 'default';
      case RecommendationStatus.ACKNOWLEDGED:
        return 'secondary';
      case RecommendationStatus.IN_PROGRESS:
        return 'warning';
      case RecommendationStatus.RESOLVED:
        return 'success';
      case RecommendationStatus.IGNORED:
        return 'outline';
      default:
        return 'outline';
    }
  };
  
  const getLabel = () => {
    switch (status) {
      case RecommendationStatus.NEW:
        return 'New';
      case RecommendationStatus.ACKNOWLEDGED:
        return 'Acknowledged';
      case RecommendationStatus.IN_PROGRESS:
        return 'In Progress';
      case RecommendationStatus.RESOLVED:
        return 'Resolved';
      case RecommendationStatus.IGNORED:
        return 'Ignored';
      default:
        return 'Unknown';
    }
  };
  
  const getIcon = () => {
    switch (status) {
      case RecommendationStatus.NEW:
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case RecommendationStatus.ACKNOWLEDGED:
        return <Clock className="h-3 w-3 mr-1" />;
      case RecommendationStatus.IN_PROGRESS:
        return <Wrench className="h-3 w-3 mr-1" />;
      case RecommendationStatus.RESOLVED:
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case RecommendationStatus.IGNORED:
        return <XCircle className="h-3 w-3 mr-1" />;
      default:
        return <Circle className="h-3 w-3 mr-1" />;
    }
  };
  
  return (
    <Badge variant={getVariant() as any} className="flex items-center">
      {getIcon()}
      {getLabel()}
    </Badge>
  );
};

interface RecommendationItemProps {
  recommendation: Recommendation;
  onClick: (recommendation: Recommendation) => void;
}

/**
 * Individual recommendation item component
 */
const RecommendationItem = ({ recommendation, onClick }: RecommendationItemProps) => {
  const { id, title, service, timestamp, priority, status, type } = recommendation;
  const date = new Date(timestamp);
  
  const getTypeIcon = () => {
    switch (type) {
      case RecommendationType.CIRCUIT_BREAKER_FAILURE:
        return <div className="p-2 rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="h-4 w-4" /></div>;
      case RecommendationType.PERFORMANCE_DEGRADATION:
        return <div className="p-2 rounded-full bg-yellow-100 text-yellow-600"><Clock className="h-4 w-4" /></div>;
      case RecommendationType.ERROR_THRESHOLD_EXCEEDED:
        return <div className="p-2 rounded-full bg-red-100 text-red-600"><XCircle className="h-4 w-4" /></div>;
      case RecommendationType.OPTIMIZATION_OPPORTUNITY:
        return <div className="p-2 rounded-full bg-green-100 text-green-600"><CheckCircle2 className="h-4 w-4" /></div>;
      default:
        return <div className="p-2 rounded-full bg-gray-100 text-gray-600"><Circle className="h-4 w-4" /></div>;
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex items-center p-3 mb-2 border rounded-lg hover:bg-accent/50 cursor-pointer"
      onClick={() => onClick(recommendation)}
      data-testid="recommendation-item"
    >
      <div className="mr-3">{getTypeIcon()}</div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">
          Service: {service} • {date.toLocaleString()}
        </div>
      </div>
      <div className="flex flex-col gap-2 items-end">
        <PriorityBadge priority={priority} />
        <StatusBadge status={status} />
      </div>
      <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground" />
    </motion.div>
  );
};

interface EmptyStateProps {
  message?: string;
  submessage?: string;
}

/**
 * Empty state component for when there are no recommendations
 */
const EmptyState = ({ message = "No maintenance recommendations", submessage = "System is operating normally" }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-medium mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground">{submessage}</p>
    </div>
  );
};

export interface MCPMaintenancePanelProps {
  recommendations?: Recommendation[];
  onAcknowledge?: (id: string) => void;
  onStartWork?: (id: string) => void;
  onResolve?: (id: string) => void;
  onIgnore?: (id: string) => void;
}

/**
 * Main Maintenance Panel component
 */
export function MCPMaintenancePanel({ 
  recommendations,
  onAcknowledge,
  onStartWork,
  onResolve,
  onIgnore
}: MCPMaintenancePanelProps) {
  const [localRecommendations, setLocalRecommendations] = useState<Recommendation[]>(recommendations || []);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [filterPriority, setFilterPriority] = useState<RecommendationPriority | 'all'>('all');
  const [selectedTab, setSelectedTab] = useState<'active' | 'resolved' | 'ignored'>('active');
  
  // If no recommendations prop provided, use the store
  useEffect(() => {
    if (!recommendations) {
      const updateFromStore = () => {
        setLocalRecommendations(recommendationStore.getRecommendations());
      };
      
      // Initial load
      updateFromStore();
      
      // Subscribe to store changes
      const unsubscribe = recommendationStore.subscribe(updateFromStore);
      
      return () => unsubscribe();
    } else {
      setLocalRecommendations(recommendations);
    }
  }, [recommendations]);
  
  // Helper to handle recommendation status changes
  const handleStatusChange = (id: string, status: RecommendationStatus) => {
    switch (status) {
      case RecommendationStatus.ACKNOWLEDGED:
        onAcknowledge ? onAcknowledge(id) : recommendationStore.updateStatus(id, status);
        break;
      case RecommendationStatus.IN_PROGRESS:
        onStartWork ? onStartWork(id) : recommendationStore.updateStatus(id, status);
        break;
      case RecommendationStatus.RESOLVED:
        onResolve ? onResolve(id) : recommendationStore.updateStatus(id, status);
        break;
      case RecommendationStatus.IGNORED:
        onIgnore ? onIgnore(id) : recommendationStore.updateStatus(id, status);
        break;
    }
    
    // Close detail view after action
    setSelectedRecommendation(null);
  };
  
  // Filter recommendations by selected tab
  const filteredByTab = localRecommendations.filter(rec => {
    if (selectedTab === 'active') {
      return rec.status !== RecommendationStatus.RESOLVED && rec.status !== RecommendationStatus.IGNORED;
    } else if (selectedTab === 'resolved') {
      return rec.status === RecommendationStatus.RESOLVED;
    } else {
      return rec.status === RecommendationStatus.IGNORED;
    }
  });
  
  // Apply priority filter
  const filteredRecommendations = filterPriority === 'all' 
    ? filteredByTab 
    : filteredByTab.filter(rec => rec.priority === filterPriority);
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center text-xl">
                <Wrench className="h-5 w-5 mr-2 text-primary" />
                Maintenance Recommendations
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => maintenanceEngine.processEvents()}>
                <ListFilter className="h-4 w-4 mr-2" />
                Analyze Events
              </Button>
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-2" />
                Rules
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            System maintenance guidance and issue resolution
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="active" data-testid="active-tab">Active</TabsTrigger>
              <TabsTrigger value="resolved" data-testid="resolved-tab">Resolved</TabsTrigger>
              <TabsTrigger value="ignored" data-testid="ignored-tab">Ignored</TabsTrigger>
            </TabsList>
            
            <div className="flex mb-4 gap-2">
              <Button 
                size="sm" 
                variant={filterPriority === 'all' ? 'default' : 'outline'} 
                onClick={() => setFilterPriority('all')}
              >
                All
              </Button>
              <Button 
                size="sm" 
                variant={filterPriority === RecommendationPriority.HIGH ? 'default' : 'outline'} 
                onClick={() => setFilterPriority(RecommendationPriority.HIGH)}
              >
                High Priority
              </Button>
              <Button 
                size="sm" 
                variant={filterPriority === RecommendationPriority.MEDIUM ? 'default' : 'outline'} 
                onClick={() => setFilterPriority(RecommendationPriority.MEDIUM)}
              >
                Medium Priority
              </Button>
              <Button 
                size="sm" 
                variant={filterPriority === RecommendationPriority.LOW ? 'default' : 'outline'} 
                onClick={() => setFilterPriority(RecommendationPriority.LOW)}
              >
                Low Priority
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <AnimatePresence>
                {filteredRecommendations.length > 0 ? (
                  filteredRecommendations.map((recommendation) => (
                    <RecommendationItem 
                      key={recommendation.id} 
                      recommendation={recommendation} 
                      onClick={setSelectedRecommendation}
                    />
                  ))
                ) : (
                  <EmptyState 
                    message={
                      selectedTab === 'active' 
                        ? "No active recommendations" 
                        : selectedTab === 'resolved'
                          ? "No resolved recommendations"
                          : "No ignored recommendations"
                    }
                    submessage={
                      selectedTab === 'active' 
                        ? "System is operating normally" 
                        : selectedTab === 'resolved'
                          ? "No maintenance has been completed yet"
                          : "No recommendations have been ignored"
                    }
                  />
                )}
              </AnimatePresence>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Recommendation detail dialog */}
      <Dialog open={!!selectedRecommendation} onOpenChange={(open) => !open && setSelectedRecommendation(null)}>
        <DialogContent className="sm:max-w-[600px]" data-testid="recommendation-details">
          <DialogHeader>
            <DialogTitle>{selectedRecommendation?.title || 'Recommendation Details'}</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Service: {selectedRecommendation?.service} • {selectedRecommendation && new Date(selectedRecommendation.timestamp).toLocaleString()}
            </div>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            {selectedRecommendation && (
              <>
                <PriorityBadge priority={selectedRecommendation.priority} />
                <StatusBadge status={selectedRecommendation.status} />
              </>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedRecommendation?.description}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium">Related Events</h4>
              <div className="text-sm text-muted-foreground mt-1 border rounded-md p-2">
                {selectedRecommendation?.relatedEvents?.length ? (
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {selectedRecommendation.relatedEvents.map((event, i) => (
                        <div key={i} className="text-xs border-b pb-2 last:border-0 last:pb-0">
                          <div className="font-medium">{typeof event.type === 'string' ? event.type : 'Event'}</div>
                          <div>{event.description || (event.data ? JSON.stringify(event.data) : '')}</div>
                          <div className="text-[10px] text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="py-2 text-center">No related events</div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedRecommendation?.status === RecommendationStatus.NEW && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange(selectedRecommendation.id, RecommendationStatus.ACKNOWLEDGED)}
                >
                  Acknowledge
                </Button>
                
                <Button 
                  onClick={() => handleStatusChange(selectedRecommendation.id, RecommendationStatus.IN_PROGRESS)}
                >
                  Start Work
                </Button>
              </>
            )}
            
            {selectedRecommendation?.status === RecommendationStatus.ACKNOWLEDGED && (
              <Button 
                onClick={() => handleStatusChange(selectedRecommendation.id, RecommendationStatus.IN_PROGRESS)}
              >
                Start Work
              </Button>
            )}
            
            {selectedRecommendation?.status === RecommendationStatus.IN_PROGRESS && (
              <Button 
                onClick={() => handleStatusChange(selectedRecommendation.id, RecommendationStatus.RESOLVED)}
              >
                Mark Resolved
              </Button>
            )}
            
            {(selectedRecommendation?.status === RecommendationStatus.NEW || 
              selectedRecommendation?.status === RecommendationStatus.ACKNOWLEDGED ||
              selectedRecommendation?.status === RecommendationStatus.IN_PROGRESS) && (
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange(selectedRecommendation.id, RecommendationStatus.IGNORED)}
              >
                Ignore
              </Button>
            )}
            
            <Button variant="secondary" onClick={() => setSelectedRecommendation(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}