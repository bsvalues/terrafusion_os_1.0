/**
 * Terrafusion Intelligence Hub Event Monitor
 * 
 * This component provides a real-time view of events flowing through the Terrafusion
 * system, including agent messages, workflow events, and system notifications.
 * 
 * Enhanced with:
 * - Integration with the EventBus for real-time event monitoring
 * - Natural language filtering and search capabilities
 * - Detailed event visualization with human-readable format
 * - Animations and micro-interactions for improved user experience
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity,
  Search,
  Warning,
  Info,
  MessageSquare,
  CheckCircle,
  Clock,
  Refresh,
  Download,
  Filter,
  X,
  Cpu,
  Zap,
  BrainCircuit,
  ArrowRightLeft,
  Code,
  Trash2,
  PauseCircle,
  PlayCircle,
  GitBranch,
  FileSymlink,
  NetworkIcon
 } from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { EventBus, Event, EventSubscription, EventCategory } from '@/lib/event-bus';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MCPEventVisualizer } from '@/components/mcp/MCPEventVisualizer';

/**
 * Component props
 */
export interface MCPEventMonitorProps {
  eventBus?: EventBus;
  className?: string;
}

/**
 * The main event monitor component
 */
export function MCPEventMonitor({ eventBus = new EventBus({ persistEvents: true }), className }: MCPEventMonitorProps) {
  // State hooks
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("live");
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>(
    Object.values(EventCategory).reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Ref to store subscription for cleanup
  const subscriptionRef = useRef<EventSubscription | null>(null);

  // Initialize event listener and get initial events
  useEffect(() => {
    // Get initial events from event bus
    const initialEvents = eventBus.getPersistedEvents();
    setEvents(initialEvents);
    setFilteredEvents(initialEvents);
    
    // Subscribe to new events
    subscriptionRef.current = eventBus.subscribe('*', (event) => {
      if (!isPaused) {
        setEvents(prevEvents => [event, ...prevEvents]);
      }
    });
    
    // Cleanup subscription when component unmounts
    return () => {
      if (subscriptionRef.current) {
        eventBus.unsubscribe(subscriptionRef.current);
      }
    };
  }, [eventBus, isPaused]);

  // Apply filters whenever events, search, or filters change
  useEffect(() => {
    const filtered = events.filter(event => {
      // Check if this event category is selected
      if (!selectedCategories[event.type]) return false;
      
      // Apply natural language search filter if there's a query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const eventString = JSON.stringify(event).toLowerCase();
        
        // Check for exact matches
        if (eventString.includes(query)) return true;
        
        // Check for semantic meaning (simple implementation - could be enhanced with NLP)
        const semanticMatches = {
          "error": ["failed", "exception", "issue", "problem", "crash"],
          "warning": ["caution", "alert", "attention", "notice"],
          "success": ["completed", "finished", "done", "processed"],
          "permit": ["application", "document", "form", "approval"],
          "TerraFusion": ["tf", "terra", "fusion"]
        };
        
        // Check if any semantic match keywords are in the query and event
        for (const [key, synonyms] of Object.entries(semanticMatches)) {
          if ((query.includes(key) || synonyms.some(s => query.includes(s))) && 
              (eventString.includes(key) || synonyms.some(s => eventString.includes(s)))) {
            return true;
          }
        }
        
        return false;
      }
      
      return true;
    });
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedCategories]);

  /**
   * Event handlers
   */
  const handleClearEvents = () => {
    eventBus.clearPersistedEvents();
    setEvents([]);
    setFilteredEvents([]);
  };
  
  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const toggleAllCategories = (value: boolean) => {
    const newState = Object.keys(selectedCategories).reduce((acc, key) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, boolean>);
    
    setSelectedCategories(newState);
  };
  
  const handleExportEvents = () => {
    const exportData = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-events-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Helper functions for display formatting
   */
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case EventCategory.AGENT_MESSAGE:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case EventCategory.WORKFLOW:
        return <GitBranch className="h-4 w-4 text-green-500" />;
      case EventCategory.CIRCUIT_BREAKER:
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case EventCategory.SYSTEM:
        return <Cpu className="h-4 w-4 text-purple-500" />;
      case EventCategory.ERROR:
        return <Warning className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getCategoryColor = (type: string) => {
    switch (type) {
      case EventCategory.AGENT_MESSAGE:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case EventCategory.WORKFLOW:
        return 'bg-green-100 text-green-800 border-green-300';
      case EventCategory.CIRCUIT_BREAKER:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case EventCategory.SYSTEM:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case EventCategory.ERROR:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getCategoryLabel = (type: string) => {
    // Convert "SNAKE_CASE" to "Snake Case"
    const words = type.split('_');
    return words.map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // Animation variants for micro-interactions
  const listItemVariants = {
    initial: { opacity: 0, y: -5 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const filterVariants = {
    closed: { opacity: 0, height: 0, overflow: 'hidden' },
    open: { opacity: 1, height: 'auto', transition: { duration: 0.3 } }
  };
  
  const detailsVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    }
  };

  return (
    <Card className={cn("shadow-md", className)} data-testid="event-monitor">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg"><>

          <Activity className="h-5 w-5 mr-2 text-primary" />
          Event Monitor
        </CardTitle>
        <div
</> className="text-sm text-muted-foreground">
          Real-time monitoring of system events
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList>
            <TabsTrigger value="live"><>

              <Clock className="h-4 w-4 mr-2" />
              Live Stream
            </TabsTrigger>
            <TabsTrigger
</> value="analytics">
              <BrainCircuit className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="m-0 p-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-grow mr-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search events..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="event-search"
                  />
                  {searchQuery && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setIsPaused(!isPaused)}
                      title={isPaused ? "Resume event stream" : "Pause event stream"}
                      className="relative overflow-hidden"
                    >
                      {isPaused ? 
                        <PlayCircle className="h-4 w-4" /> : 
                        <PauseCircle className="h-4 w-4" />
                      }
                      {!isPaused && (
                        <span className="absolute inset-0 bg-primary/10 animate-ping rounded-full" />
                      )}
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleClearEvents}
                      title="Clear all events"
                      data-testid="clear-filters"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleExportEvents}
                      title="Export events"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant={isFilterOpen ? "default" : "outline"}
                      size="icon"
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      title="Toggle filters"
                      data-testid="filter-dropdown"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    variants={filterVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    <Card className="p-4 bg-muted/40">
                      <div>
                        <div className="flex items-center justify-between mb-2"><>

                          <h3 className="text-sm font-medium">Event Categories</h3>
                          <div
</> className="space-x-2"><>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleAllCategories(true)}
                              className="h-7 text-xs"
                            >
                              Select All
                            </Button>
                            <Button
</> 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleAllCategories(false)}
                              className="h-7 text-xs"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.values(EventCategory).map(category => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`category-${category}`} 
                                checked={selectedCategories[category]}
                                onCheckedChange={() => toggleCategoryFilter(category)}
                              />
                              <Label 
                                htmlFor={`category-${category}`}
                                className="flex items-center space-x-2 cursor-pointer text-xs"
                              >
                                <motion.div 
                                  className="flex items-center gap-1.5"
                                  whileHover={{ x: 2 }}
                                >
                                  {getEventIcon(category)}
                                  <span>{getCategoryLabel(category)}</span>
                                </motion.div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="rounded-md border">
                <div className="flex items-center justify-between p-2 bg-muted/50"><>

                  <div className="text-sm font-medium">
                    Showing {filteredEvents.length} events 
                    {events.length !== filteredEvents.length && ` (filtered from ${events.length})`}
                  </div>
                  <Badge
</> variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {isPaused ? "Paused" : "Live"}
                  </Badge>
                </div>
                
                <ScrollArea className="h-[400px]">
                  <AnimatePresence mode="popLayout">
                    {selectedEvent ? (
                      <motion.div 
                        className="p-4 space-y-3"
                        variants={detailsVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        key="details"
                        data-testid="event-details"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getEventIcon(selectedEvent.type)}<>

                            <h3 className="text-lg font-medium">{getCategoryLabel(selectedEvent.type)}</h3>
                            <Badge
</> variant="outline" className={cn("ml-2", getCategoryColor(selectedEvent.type))}>
                              {selectedEvent.type}
                            </Badge>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedEvent(null)}
                              className="h-7"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Close
                            </Button>
                          </motion.div>
                        </div>
                        
                        <Separator />
                        
                        <div><>

                          <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
                          <div
</> className="font-mono text-xs bg-muted p-1 rounded">
                            {selectedEvent.timestamp}
                          </div>
                        </div>
                        
                        <div><>

                          <div className="text-sm text-muted-foreground mb-1">Data</div>
                          <div
</> className="font-mono text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                            <pre>{JSON.stringify(selectedEvent.data, null, 2)}</pre>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        key="list"
                      >
                        {filteredEvents.length > 0 ? (
                          filteredEvents.map((event /* , index */) => (
                            <motion.div 
                              key={event.timestamp + index}
                              variants={listItemVariants}
                              className="border-b last:border-0 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => setSelectedEvent(event)}
                              data-testid="event-item"
                              whileHover={{ x: 3, backgroundColor: 'rgba(0,0,0,0.03)' }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {getEventIcon(event.type)}<>

                                  <span className="font-medium text-sm">
                                    {getCategoryLabel(event.type)}
                                  </span>
                                  <Badge
</> variant="outline" className={cn("text-xs", getCategoryColor(event.type))}>
                                    {event.type}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(event.timestamp)}
                                </span>
                              </div>
                              <div className="text-sm ml-6 text-muted-foreground line-clamp-1">
                                {JSON.stringify(event.data)}
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div 
                            className="p-8 text-center text-muted-foreground"
                            data-testid="empty-state"
                          >
                            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" /><>

                            <div>No events to display</div>
                            <div
</> className="text-xs mt-1">Events will appear here as they occur</div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="m-0 p-0">
            {/* Use our event visualizer in non-standalone mode to avoid nested tabs */}
            <MCPEventVisualizer eventBus={eventBus} standalone={false} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}