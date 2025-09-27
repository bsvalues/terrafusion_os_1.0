/**
 * Terrafusion OS 1.0 - Real-Time Session Manager
 * Government-Grade Live Collaboration Hub
 * 
 * Comprehensive real-time collaboration session management with
 * video calls, screen sharing, whiteboarding, and live chat.
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,} from '../../ui/card';
import {Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,} from '../../ui';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from '../../ui/dialog';
import {DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,} from '../../ui/dropdown-menu';
import {Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,} from '../../ui/tabs';
import {Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  MessageCircle,
  Settings,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MoreVertical,
  Record,
  StopCircle,
  Hand,
  UserX,
  Crown,
  Eye,
  PaintBucket,
  Eraser,
  Type,
  Circle,
  Square,
  ArrowRight,} from '@mui/icons-material';
import {useToast} from '../../ui/use-toast';
import {useMutation, useQueryClient} from 'react-query';
import {CollaborationSession,
  SessionParticipant,
  SessionType,
  SessionStatus,
  SessionRole,
  CollaborationUser,
  ChatMessage,
  WhiteboardSession,
  CanvasElement,
  WhiteboardTool,
  CollaborationComponentProps,} from '../types/CollaborationTypes';
import {collaborationService} from '../services/CollaborationService';
import {LiveChat} from './LiveChat';
import {WhiteboardCanvas} from './WhiteboardCanvas';

interface RealTimeSessionManagerProps extends CollaborationComponentProps {session?: CollaborationSession;
  projectId?: string;
  onSessionEnd?: () => void;
  onSessionUpdate?: (session: CollaborationSession) => void;}

export const RealTimeSessionManager: React.FC<RealTimeSessionManagerProps> = ({className = '',
  session: initialSession,
  projectId,
  currentUser,
  onSessionEnd,
  onSessionUpdate,
  onUpdate,
  onError,}) => {const { toast} = useToast();
  const queryClient = useQueryClient();
  
  const [session, setSession] = useState<CollaborationSession | null>(initialSession || null);
  const [activeTab, setActiveTab] = useState('video');
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<WhiteboardTool>(WhiteboardTool.PEN);
  const [handRaised, setHandRaised] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Start session mutation
  const startSessionMutation = useMutation({mutationFn: ({ projectId, type}: {projectId: string; type: SessionType}) =>collaborationService.startSession(projectId, type),
    onSuccess: (newSession) => {setSession(newSession);
      onSessionUpdate?.(newSession);
      toast({
        title: 'Session Started',
        description: 'Real-time collaboration session is now active.',});
    },
    onError: (error) => {console.error('Failed to start session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start collaboration session.',
        variant: 'destructive',});
      onError?.(error as Error);
    },
  });

  // Join session
  const joinSession = useCallback(async (sessionId: string) => {try {
      await collaborationService.joinSession(sessionId);
      toast({
        title: 'Joined Session',
        description: 'You have joined the collaboration session.',});
    } catch (error) {console.error('Failed to join session:', error);
      toast({
        title: 'Error',
        description: 'Failed to join session.',
        variant: 'destructive',});
    }
  }, [toast]);

  // Leave session
  const leaveSession = useCallback(async () => {if (!session) return;
    
    try {
      await collaborationService.leaveSession(session.id);
      setSession(null);
      onSessionEnd?.();
      toast({
        title: 'Left Session',
        description: 'You have left the collaboration session.',});
    } catch (error) {console.error('Failed to leave session:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave session.',
        variant: 'destructive',});
    }
  }, [session, onSessionEnd, toast]);

  // Media controls
  const toggleVideo = useCallback(async () => {try {
      if (!isVideoEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioEnabled});
        if (videoRef.current) {videoRef.current.srcObject = stream;}
      } else {if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getVideoTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;}
      }
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {console.error('Failed to toggle video:', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera. Please check permissions.',
        variant: 'destructive',});
    }
  }, [isVideoEnabled, isAudioEnabled, toast]);

  const toggleAudio = useCallback(async () => {try {
      if (!isAudioEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoEnabled, audio: true});
        if (videoRef.current) {videoRef.current.srcObject = stream;}
      } else {if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getAudioTracks().forEach(track => track.stop());}
      }
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {console.error('Failed to toggle audio:', error);
      toast({
        title: 'Microphone Error',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive',});
    }
  }, [isAudioEnabled, isVideoEnabled, toast]);

  const toggleScreenShare = useCallback(async () => {try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true});
        if (screenShareRef.current) {screenShareRef.current.srcObject = stream;}
        
        // Handle when user stops sharing through browser UI
        stream.getVideoTracks()[0].addEventListener('ended', () => {setIsScreenSharing(false);});
      } else {if (screenShareRef.current && screenShareRef.current.srcObject) {
          const stream = screenShareRef.current.srcObject as MediaStream;
          stream.getVideoTracks().forEach(track => track.stop());
          screenShareRef.current.srcObject = null;}
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {console.error('Failed to toggle screen share:', error);
      toast({
        title: 'Screen Share Error',
        description: 'Failed to start screen sharing. Please check permissions.',
        variant: 'destructive',});
    }
  }, [isScreenSharing, toast]);

  const toggleRecording = useCallback(() => {setIsRecording(!isRecording);
    toast({
      title: isRecording ? 'Recording Stopped' : 'Recording Started',
      description: isRecording 
        ? 'Session recording has been stopped.'
        : 'Session is now being recorded.',});
  }, [isRecording, toast]);

  const toggleHandRaise = useCallback(() => {setHandRaised(!handRaised);
    toast({
      title: handRaised ? 'Hand Lowered' : 'Hand Raised',
      description: handRaised 
        ? 'Your hand has been lowered.'
        : 'Your hand has been raised.',});
  }, [handRaised, toast]);

  // Real-time session updates
  useEffect(() => {if (!session) return;

    const handleParticipantJoined = (data: { sessionId: string; participant: SessionParticipant}) => {if (data.sessionId === session.id) {
        setSession(prev => prev ? {
          ...prev,
          participants: [...prev.participants, data.participant]} : null);
        
        toast({
          title: 'Participant Joined',
          description: `${data.participant.user.name} joined the session.`,
        });
      }
    };

    const handleParticipantLeft = (data: {sessionId: string; userId: string}) => {if (data.sessionId === session.id) {
        setSession(prev => prev ? {
          ...prev,
          participants: prev.participants.filter(p => p.user.id !== data.userId)} : null);
      }
    };

    const handleScreenShareStarted = (data: {sessionId: string; userId: string}) => {if (data.sessionId === session.id) {
        toast({
          title: 'Screen Sharing Started',
          description: 'A participant started sharing their screen.',});
      }
    };

    const handleScreenShareEnded = (data: {sessionId: string; userId: string}) => {if (data.sessionId === session.id) {
        toast({
          title: 'Screen Sharing Ended',
          description: 'Screen sharing has ended.',});
      }
    };

    collaborationService.on('participant-joined', handleParticipantJoined);
    collaborationService.on('participant-left', handleParticipantLeft);
    collaborationService.on('screen-share-started', handleScreenShareStarted);
    collaborationService.on('screen-share-ended', handleScreenShareEnded);

    return () => {collaborationService.off('participant-joined', handleParticipantJoined);
      collaborationService.off('participant-left', handleParticipantLeft);
      collaborationService.off('screen-share-started', handleScreenShareStarted);
      collaborationService.off('screen-share-ended', handleScreenShareEnded);};
  }, [session, toast]);

  // Cleanup on unmount
  useEffect(() => {return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());}
      if (screenShareRef.current && screenShareRef.current.srcObject) {const stream = screenShareRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());}
    };
  }, []);

  const getSessionStatusBadgeVariant = (status: SessionStatus) => {switch (status) {
      case SessionStatus.ACTIVE:
        return 'default';
      case SessionStatus.SCHEDULED:
        return 'secondary';
      case SessionStatus.PAUSED:
        return 'outline';
      case SessionStatus.ENDED:
        return 'destructive';
      default:
        return 'outline';}
  };

  const getParticipantRoleIcon = (role: SessionRole) => {switch (role) {
      case SessionRole.HOST:
        return<Crown className="h-3 w-3 text-yellow-500" />;
      case SessionRole.PRESENTER:
        return <Monitor className="h-3 w-3 text-blue-500" />;
      case SessionRole.PARTICIPANT:
        return <Users className="h-3 w-3 text-gray-500" />;
      case SessionRole.OBSERVER:
        return <Eye className="h-3 w-3 text-gray-400" />;
      default:
        return null;}
  };

  // Start session dialog
  if (!session) {
    return (
      <Card className={className}><CardHeader><CardTitle className="flex items-center gap-2"><><Video className="h-5 w-5" />Real-Time Collaboration</CardTitle><CardDescription
</></>>Start a live collaboration session with your team</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">{Object.values(SessionType).map((type) => (<Button
                key={type}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  if (projectId) {
                    startSessionMutation.mutate({ projectId, type});
                  }
                }}
                disabled={!projectId || startSessionMutation.isLoading}
              ><><div className="text-2xl">{type === SessionType.MEETING && '🤝'}
                  {type === SessionType.BRAINSTORM && '💡'}
                  {type === SessionType.REVIEW && '👁️'}
                  {type === SessionType.TRAINING && '📚'}
                  {type === SessionType.PRESENTATION && '📊'}</div><span
</>
className="text-sm capitalize">{type.replace('_', ' ')}</span></Button>))}</div></CardContent></Card>);
  }

  return (<div className={`space-y-4 ${className}`}>{/* Session Header */}<Card><CardHeader><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex items-center gap-2"><Video className="h-5 w-5" /><><h3 className="font-semibold">Collaboration Session</h3><Badge
</>variant={getSessionStatusBadgeVariant(session.status)}>
                  {session.status}</Badge>{isRecording && (<Badge variant="destructive" className="animate-pulse"><Record className="h-3 w-3 mr-1" />Recording</Badge>)}</div></div><div className="flex items-center gap-2"><><span className="text-sm text-muted-foreground">{session.participants.length} participant{session.participants.length !== 1 ? 's' : ''}</span><DropdownMenu
</></>><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><><DropdownMenuLabel>Session Settings</DropdownMenuLabel><DropdownMenuItem
</>onClick={toggleRecording}>
                    {isRecording ? (<StopCircle className="h-4 w-4 mr-2" />Stop Recording
                    ) : (<><Record className="h-4 w-4 mr-2" />Start Recording
                    )}</DropdownMenuItem><DropdownMenuSeparator
</> /><DropdownMenuItem onClick={leaveSession} className="text-red-600"><PhoneOff className="h-4 w-4 mr-2" />Leave Session</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div></CardHeader></Card>{/* Main Collaboration Interface */}<div className="grid gap-4 lg:grid-cols-4">{/* Main Content Area */}<div className="lg:col-span-3"><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="video"><><Video className="h-4 w-4 mr-2" />Video</TabsTrigger><TabsTrigger
</>
value="screen"><><Monitor className="h-4 w-4 mr-2" />Screen</TabsTrigger><TabsTrigger
</>
value="whiteboard"><PaintBucket className="h-4 w-4 mr-2" />Whiteboard</TabsTrigger></TabsList><TabsContent value="video" className="mt-0"><Card className="h-96"><CardContent className="p-0"><div className="grid grid-cols-2 gap-1 h-full">{/* Self Video */}<div className="relative bg-gray-900 rounded-lg overflow-hidden">{isVideoEnabled ? (<video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center"><div className="text-center text-white"><VideoOff className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Camera Off</p></div></div>)}<div className="absolute bottom-2 left-2"><Badge variant="secondary" className="text-xs">You {!isAudioEnabled && '(Muted)'}</Badge></div></div>{/* Other Participants */}
                    {session.participants
                      .filter(p => p.user.id !== currentUser?.id)
                      .slice(0, 3)
                      .map((participant) => (<div
                          key={participant.user.id}
                          className="relative bg-gray-900 rounded-lg overflow-hidden"
                        ><div className="w-full h-full flex items-center justify-center"><div className="text-center text-white"><Avatar className="h-16 w-16 mx-auto mb-2"><AvatarImage src={participant.user.avatar} /><AvatarFallback>{participant.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><p className="text-sm">{participant.user.name}</p></div></div><div className="absolute bottom-2 left-2 flex items-center gap-1">{getParticipantRoleIcon(participant.role)}<Badge variant="secondary" className="text-xs">{participant.user.name.split(' ')[0]}
                              {!participant.hasVideo && ' (Camera Off)'}
                              {participant.isMuted && ' (Muted)'}</Badge></div></div>))}</div></CardContent></Card></TabsContent><TabsContent value="screen" className="mt-0"><Card className="h-96"><CardContent className="p-0">{isScreenSharing ? (<video
                      ref={screenShareRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-gray-900 rounded-lg" />) : (<div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg"><div className="text-center text-muted-foreground"><MonitorOff className="h-16 w-16 mx-auto mb-4" /><><p className="text-lg font-medium mb-2">No Screen Sharing</p><p
</>className="text-sm">
                          Click the screen share button to share your screen</p></div></div>)}</CardContent></Card></TabsContent><TabsContent value="whiteboard" className="mt-0"><Card className="h-96"><CardHeader className="pb-2"><div className="flex items-center justify-between"><><CardTitle className="text-sm">Collaborative Whiteboard</CardTitle><div
</>className="flex items-center gap-1">
                      {[
                        {tool: WhiteboardTool.PEN, icon: ArrowRight, label: 'Pen'},
                        {tool: WhiteboardTool.HIGHLIGHTER, icon: ArrowRight, label: 'Highlighter'},
                        {tool: WhiteboardTool.ERASER, icon: Eraser, label: 'Eraser'},
                        {tool: WhiteboardTool.TEXT, icon: Type, label: 'Text'},
                        {tool: WhiteboardTool.SHAPE, icon: Circle, label: 'Shape'},
                      ].map(({tool, icon: Icon, label}) => (<Button
                          key={tool}
                          variant={selectedTool === tool ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setSelectedTool(tool)}
                          title={label}
                        ><Icon className="h-4 w-4" /></Button>))}</div></div></CardHeader><CardContent className="p-0"><WhiteboardCanvas
                    sessionId={session.id}
                    currentTool={selectedTool}
                    currentUser={currentUser}
                    className="w-full h-80" /></CardContent></Card></TabsContent></Tabs></div>{/* Sidebar */}<div className="space-y-4">{/* Participants */}<Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Participants ({session.participants.length})</CardTitle></CardHeader><CardContent className="space-y-2">{session.participants.map((participant) => (<div
                  key={participant.user.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted"
                ><div className="relative"><Avatar className="h-8 w-8"><AvatarImage src={participant.user.avatar} /><AvatarFallback className="text-xs">{participant.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>{participant.user.isOnline && (<div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>)}</div><div className="flex-1 min-w-0"><><p className="text-sm font-medium truncate">{participant.user.name}
                      {participant.user.id === currentUser?.id && ' (You)'}</p><div
</>className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getParticipantRoleIcon(participant.role)}<span>{participant.role}</span></div></div><div className="flex items-center gap-1">{!participant.hasVideo &&<VideoOff className="h-3 w-3 text-muted-foreground" />}
                    {participant.isMuted && <MicOff className="h-3 w-3 text-muted-foreground" />}
                    {participant.isPresenting && <Monitor className="h-3 w-3 text-blue-500" />}
                  </div></div>))}</CardContent></Card>{/* Live Chat */}<LiveChat
            sessionId={session.id}
            currentUser={currentUser}
            className="h-64" /></div></div>{/* Control Bar */}<Card><CardContent className="p-4"><div className="flex items-center justify-center gap-2"><Button
              variant={isVideoEnabled ? 'default' : 'destructive'}
              size="sm"
              onClick={toggleVideo}
            >{isVideoEnabled ?<Video className="h-4 w-4" />:<VideoOff className="h-4 w-4" />}
            </Button><Button
              variant={isAudioEnabled ? 'default' : 'destructive'}
              size="sm"
              onClick={toggleAudio}
            >{isAudioEnabled ?<Mic className="h-4 w-4" />:<MicOff className="h-4 w-4" />}
            </Button><Button
              variant={isScreenSharing ? 'default' : 'outline'}
              size="sm"
              onClick={toggleScreenShare}
            >{isScreenSharing ?<Monitor className="h-4 w-4" />:<MonitorOff className="h-4 w-4" />}
            </Button><Button
              variant={handRaised ? 'default' : 'outline'}
              size="sm"
              onClick={toggleHandRaise}
            ><><Hand className="h-4 w-4" /></Button><div
</>
className="mx-4 border-l h-6"></div><Button
              variant="destructive"
              size="sm"
              onClick={leaveSession}
            ><PhoneOff className="h-4 w-4 mr-2" />Leave</Button></div></CardContent></Card></div>
  );
};

export default RealTimeSessionManager;