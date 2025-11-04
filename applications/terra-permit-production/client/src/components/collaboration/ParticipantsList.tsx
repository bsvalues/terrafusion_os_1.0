import { CollaborationParticipant } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FaUserFriends } from 'react-icons/fa';

interface ParticipantsListProps {
  participants: CollaborationParticipant[];
  currentUserId?: string | null;
}

export function ParticipantsList({ participants, currentUserId }: ParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FaUserFriends className="h-4 w-4" />
            <span>Participants</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No participants yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FaUserFriends className="h-4 w-4" />
          <span>Participants ({participants.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[180px] pr-4">
          <div className="space-y-2">
            {participants.map((participant) => (
              <div 
                key={participant.id} 
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: `${participant.color}10` }}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2" style={{ borderColor: participant.color }}>
                    <AvatarFallback style={{ backgroundColor: participant.color, color: 'white' }}>
                      {participant.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {participant.name}
                    {participant.id === currentUserId && <span className="ml-1.5 text-xs">(you)</span>}
                  </span>
                </div>
                <Badge variant={participant.isActive ? "default" : "outline"}>
                  {participant.isActive ? "Active" : "Idle"}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}