import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Mouse, 
  Navigation, 
  Edit,
  Hand,
  ZoomIn,
  Crosshair,
  Move,
  RotateCcw,
  Users,
  Eye,
  EyeOff
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  status: 'online' | 'offline' | 'away';
}

interface Cursor {
  id: string;
  user: User;
  x: number;
  y: number;
  lastUpdate: Date;
  tool?: 'select' | 'edit' | 'pan' | 'zoom' | 'measure' | 'draw';
  isVisible: boolean;
}

interface Selection {
  id: string;
  user: User;
  type: 'rectangle' | 'polygon' | 'circle' | 'line';
  coordinates: Array<{ x: number; y: number }>;
  isActive: boolean;
  timestamp: Date;
}

interface CollaborativeCursorsProps {
  currentUser: User;
  collaborators?: User[];
  onCursorMove?: (x: number, y: number) => void;
  onSelectionChange?: (selection: Selection) => void;
  showUserList?: boolean;
  maxCursors?: number;
  className?: string;
}

const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  currentUser,
  collaborators = [],
  onCursorMove,
  onSelectionChange,
  showUserList = true,
  maxCursors = 10,
  className = ''
}) => {
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [myPosition, setMyPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentTool, setCurrentTool] = useState<Cursor['tool']>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeSelection, setActiveSelection] = useState<Selection | null>(null);
  const [showCursors, setShowCursors] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Sample collaborators
  const sampleCollaborators: User[] = [
    {
      id: 'user-1',
      name: 'Dr. Sarah Chen',
      avatar: '/avatars/sarah.jpg',
      color: '#3B82F6',
      status: 'online'
    },
    {
      id: 'user-2',
      name: 'Michael Rodriguez',
      avatar: '/avatars/michael.jpg',
      color: '#EF4444',
      status: 'online'
    },
    {
      id: 'user-3',
      name: 'Emily Johnson',
      color: '#10B981',
      status: 'away'
    },
    {
      id: 'user-4',
      name: 'James Wilson',
      color: '#F59E0B',
      status: 'online'
    }
  ];

  // Initialize cursors for collaborators
  useEffect(() => {
    const currentCollaborators = collaborators.length > 0 ? collaborators : sampleCollaborators;
    
    const initialCursors: Cursor[] = currentCollaborators
      .filter(user => user.id !== currentUser.id)
      .slice(0, maxCursors)
      .map(user => ({
        id: `cursor-${user.id}`,
        user,
        x: Math.random() * 800 + 100,
        y: Math.random() * 600 + 100,
        lastUpdate: new Date(),
        tool: 'select',
        isVisible: user.status === 'online'
      }));

    setCursors(initialCursors);
  }, [collaborators, currentUser.id, maxCursors]);

  // Simulate cursor movements
  useEffect(() => {
    const interval = setInterval(() => {
      setCursors(prev => prev.map(cursor => {
        if (!cursor.isVisible || cursor.user.status !== 'online') return cursor;

        // Simulate natural cursor movement
        const deltaX = (Math.random() - 0.5) * 20;
        const deltaY = (Math.random() - 0.5) * 20;
        
        return {
          ...cursor,
          x: Math.max(0, Math.min(cursor.x + deltaX, 1200)),
          y: Math.max(0, Math.min(cursor.y + deltaY, 800)),
          lastUpdate: new Date()
        };
      }));
    }, 150 + Math.random() * 100);

    return () => clearInterval(interval);
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMyPosition({ x, y });

    if (onCursorMove) {
      onCursorMove(x, y);
    }

    // Update animation frame for smooth rendering
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      // Cursor position updated
    });
  }, [onCursorMove]);

  // Handle mouse down (start selection)
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (currentTool === 'select' || currentTool === 'draw') {
      setIsDrawing(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const newSelection: Selection = {
          id: `selection-${Date.now()}`,
          user: currentUser,
          type: 'rectangle',
          coordinates: [{ x, y }],
          isActive: true,
          timestamp: new Date()
        };
        
        setActiveSelection(newSelection);
      }
    }
  }, [currentTool, currentUser]);

  // Handle mouse up (end selection)
  const handleMouseUp = useCallback(() => {
    if (isDrawing && activeSelection) {
      setSelections(prev => [...prev, { ...activeSelection, isActive: false }]);
      setActiveSelection(null);
      setIsDrawing(false);

      if (onSelectionChange) {
        onSelectionChange(activeSelection);
      }
    }
  }, [isDrawing, activeSelection, onSelectionChange]);

  // Update active selection while drawing
  useEffect(() => {
    if (isDrawing && activeSelection) {
      setActiveSelection(prev => prev ? {
        ...prev,
        coordinates: [prev.coordinates[0], myPosition]
      } : null);
    }
  }, [myPosition, isDrawing, activeSelection]);

  // Clean up old cursors
  useEffect(() => {
    const cleanup = setInterval(() => {
      setCursors(prev => prev.filter(cursor => {
        const timeSinceUpdate = Date.now() - cursor.lastUpdate.getTime();
        return timeSinceUpdate < 10000; // Remove cursors older than 10 seconds
      }));
    }, 5000);

    return () => clearInterval(cleanup);
  }, []);

  // Get tool icon
  const getToolIcon = (tool: Cursor['tool']) => {
    switch (tool) {
      case 'edit': return <Edit className="h-3 w-3" />;
      case 'pan': return <Hand className="h-3 w-3" />;
      case 'zoom': return <ZoomIn className="h-3 w-3" />;
      case 'measure': return <Crosshair className="h-3 w-3" />;
      case 'draw': return <Edit className="h-3 w-3" />;
      default: return <Mouse className="h-3 w-3" />;
    }
  };

  // Render cursor
  const renderCursor = (cursor: Cursor) => {
    if (!cursor.isVisible || !showCursors) return null;

    return (
      <TooltipProvider key={cursor.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute pointer-events-none transition-all duration-100 ease-out z-50"
              style={{
                left: cursor.x,
                top: cursor.y,
                transform: 'translate(-2px, -2px)'
              }}
            >
              {/* Cursor pointer */}
              <div
                className="relative"
                style={{ color: cursor.user.color }}
              >
                <Navigation 
                  className="h-5 w-5 drop-shadow-lg" 
                  style={{ 
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                    color: cursor.user.color
                  }}
                />
                
                {/* User indicator */}
                <div
                  className="absolute -top-8 left-4 flex items-center gap-1 px-2 py-1 rounded-md text-white text-xs font-medium shadow-lg pointer-events-none"
                  style={{ backgroundColor: cursor.user.color }}
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={cursor.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {cursor.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="whitespace-nowrap">{cursor.user.name}</span>
                  {cursor.tool && cursor.tool !== 'select' && (
                    <div className="ml-1">
                      {getToolIcon(cursor.tool)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">{cursor.user.name}</p>
              <p className="text-xs opacity-75">
                {cursor.tool ? `Using ${cursor.tool}` : 'Active'}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Render selection
  const renderSelection = (selection: Selection) => {
    if (selection.coordinates.length < 2) return null;

    const [start, end] = selection.coordinates;
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);

    return (
      <div
        key={selection.id}
        className="absolute pointer-events-none z-40"
        style={{
          left,
          top,
          width,
          height,
          border: `2px ${selection.isActive ? 'dashed' : 'solid'} ${selection.user.color}`,
          backgroundColor: `${selection.user.color}15`,
          borderRadius: '2px'
        }}
      >
        {/* Selection label */}
        <div
          className="absolute -top-6 left-0 px-2 py-1 rounded text-white text-xs font-medium"
          style={{ backgroundColor: selection.user.color }}
        >
          {selection.user.name}
        </div>
      </div>
    );
  };

  const activeCursors = cursors.filter(c => c.isVisible);
  const onlineCollaborators = collaborators.length > 0 ? 
    collaborators.filter(c => c.status === 'online') : 
    sampleCollaborators.filter(c => c.status === 'online');

  return (
    <div className={`relative ${className}`}>
      {/* Collaborative workspace overlay */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-30"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ cursor: currentTool === 'pan' ? 'grab' : 'crosshair' }}
      >
        {/* Render cursors */}
        {activeCursors.map(renderCursor)}

        {/* Render selections */}
        {selections.map(renderSelection)}
        {activeSelection && renderSelection(activeSelection)}
      </div>

      {/* Collaborators panel */}
      {showUserList && (
        <div className="absolute top-4 right-4 z-40">
          <div className="bg-white rounded-lg shadow-lg border p-3 min-w-[200px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Collaborators ({onlineCollaborators.length})
              </h3>
              <button
                onClick={() => setShowCursors(!showCursors)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {showCursors ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="space-y-2">
              {onlineCollaborators.map(user => {
                const cursor = cursors.find(c => c.user.id === user.id);
                return (
                  <div key={user.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: user.color }}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{user.name}</p>
                      {cursor && cursor.tool && cursor.tool !== 'select' && (
                        <p className="text-xs text-muted-foreground">
                          Using {cursor.tool}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={user.status === 'online' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.status}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Tool selector */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Your tool:</p>
              <div className="flex flex-wrap gap-1">
                {(['select', 'edit', 'pan', 'zoom', 'draw'] as const).map(tool => (
                  <button
                    key={tool}
                    onClick={() => setCurrentTool(tool)}
                    className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                      currentTool === tool 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {getToolIcon(tool)}
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-3 pt-3 border-t">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">{activeCursors.length}</span> active cursors
                </div>
                <div>
                  <span className="font-medium">{selections.length}</span> selections
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current user position indicator */}
      <div
        className="absolute pointer-events-none z-50"
        style={{
          left: myPosition.x,
          top: myPosition.y,
          transform: 'translate(-2px, -2px)'
        }}
      >
        <div
          className="w-1 h-1 rounded-full opacity-50"
          style={{ backgroundColor: currentUser.color || '#3B82F6' }}
        />
      </div>
    </div>
  );
};

export default CollaborativeCursors;
