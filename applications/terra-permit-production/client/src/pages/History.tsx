import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, FileText, MoreHorizontal, Search  } from '@mui/icons-material';

const eventTypes = [
  { name: 'Circuit Breaker Trip', color: 'bg-red-100 text-red-800' },
  { name: 'System Warning', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Maintenance Required', color: 'bg-blue-100 text-blue-800' },
  { name: 'Update Available', color: 'bg-green-100 text-green-800' },
  { name: 'Parameter Change', color: 'bg-purple-100 text-purple-800' },
];

const histories = [
  {
    id: 1,
    title: 'Auth Service Circuit Breaker Trip',
    date: '2023-05-15T14:30:00',
    type: 'Circuit Breaker Trip',
    description: 'The authentication service circuit breaker tripped due to excessive timeouts.',
    user: { name: 'Alex Johnson', avatar: null },
  },
  {
    id: 2,
    title: 'Database Connection Warning',
    date: '2023-05-14T09:15:00',
    type: 'System Warning',
    description: 'Database connection pool reaching maximum capacity, potential performance degradation.',
    user: { name: 'Sarah Chen', avatar: null },
  },
  {
    id: 3,
    title: 'API Gateway Maintenance',
    date: '2023-05-10T11:45:00',
    type: 'Maintenance Required',
    description: 'Scheduled maintenance is required for the API Gateway to update routing tables.',
    user: { name: 'Michael Brown', avatar: null },
  },
  {
    id: 4,
    title: 'Notification Service Update',
    date: '2023-05-08T16:20:00',
    type: 'Update Available',
    description: 'A new version of the notification service is available with improved message delivery.',
    user: { name: 'Emma Wilson', avatar: null },
  },
  {
    id: 5,
    title: 'Logging Level Changed',
    date: '2023-05-05T13:10:00',
    type: 'Parameter Change',
    description: 'System-wide logging level was changed from INFO to DEBUG for troubleshooting.',
    user: { name: 'David Lee', avatar: null },
  },
];

const History: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold tracking-tight">Event History</h1>
          <p
</> className="text-gray-500 mt-2">
            Browse and search through historical system events
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" /><>

            <input
              type="text"
              placeholder="Search events..."
              className="w-full rounded-md border border-input pl-8 py-2 text-sm"
            />
          </div>
          <Button
</>>
            <FileText className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline" className="rounded-full cursor-pointer bg-gray-100">All Events</Badge>
        {eventTypes.map((type /* , index */) => (
          <Badge 
            key={index} 
            variant="outline" 
            className={`rounded-full cursor-pointer ${type.color}`}
          >
            {type.name}
          </Badge>
        ))}
      </div>
      
      <div className="space-y-4">
        {histories.map((history) => (
          <Card key={history.id} className="hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div className="space-y-1"><>

                  <CardTitle className="text-lg">{history.title}</CardTitle>
                  <div
</> className="flex items-center space-x-4"><>

                    <Badge 
                      variant="outline" 
                      className={`${eventTypes.find(t => t.name === history.type)?.color}`}
                    >
                      {history.type}
                    </Badge>
                    <div
</> className="flex items-center text-sm text-gray-500">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(history.date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{history.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={history.user.avatar || ''} />
                  <AvatarFallback>
                    {history.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-500">{history.user.name}</span>
              </div>
              <Link href={`/history/${history.id}`}>
                <Button variant="ghost" size="sm">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default History;