import React from 'react';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, FileText, User, XCircle  } from '@mui/icons-material';

const UploadDetail: React.FC = () => {
  const { id } = useParams();
  
  // Mock data based on ID
  const event = {
    id: parseInt(id || '0'),
    title: 'Auth Service Circuit Breaker Trip',
    date: '2023-05-15T14:30:00',
    type: 'Circuit Breaker Trip',
    status: 'Resolved',
    description: 'The authentication service circuit breaker tripped due to excessive timeouts. This was caused by a network partition that affected connectivity to the authentication database. The system automatically recovered once connectivity was restored.',
    user: { name: 'Alex Johnson', email: 'alex@example.com' },
    metrics: [
      { name: 'Error Rate', value: '12.5%', status: 'high' },
      { name: 'Response Time', value: '2750ms', status: 'high' },
      { name: 'Failure Threshold', value: '10%', status: 'exceeded' },
      { name: 'Duration', value: '15min', status: 'normal' },
    ],
    timeline: [
      { time: '14:30:00', description: 'Circuit breaker tripped', status: 'error' },
      { time: '14:32:15', description: 'Alert notification sent', status: 'warning' },
      { time: '14:35:45', description: 'On-call engineer acknowledged', status: 'info' },
      { time: '14:42:30', description: 'Network partition identified', status: 'info' },
      { time: '14:45:00', description: 'Network connectivity restored', status: 'success' },
      { time: '14:45:30', description: 'Circuit breaker reset', status: 'success' },
      { time: '14:46:15', description: 'Service back to normal operation', status: 'success' },
    ],
    actions: [
      { description: 'Update network monitoring', status: 'complete' },
      { description: 'Adjust circuit breaker thresholds', status: 'pending' },
      { description: 'Create runbook for similar issues', status: 'pending' },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/history">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Event Details</h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
            <div><>

              <CardTitle className="text-xl">{event.title}</CardTitle>
              <CardDescription
</>>ID: {event.id} • {new Date(event.date).toLocaleString()}</CardDescription>
            </div>
            <Badge variant="outline" className="self-start md:self-center bg-red-100 text-red-800 w-fit">
              {event.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md border"><>

            <h3 className="font-medium mb-2">Description</h3>
            <p
</> className="text-gray-700">{event.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {event.metrics.map((metric /* , index */) => (
              <Card key={index}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4"><>

                  <div className="text-2xl font-bold">{metric.value}</div>
                  <Badge
</> 
                    variant="outline" 
                    className={`mt-1 ${
                      metric.status === 'high' ? 'bg-amber-100 text-amber-800' : 
                      metric.status === 'exceeded' ? 'bg-red-100 text-red-800' : 
                      'bg-green-100 text-green-800'
                    }`}
                  >
                    {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="timeline">
        <TabsList><>

          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger
</> value="actions">Actions</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="space-y-4 mt-4">
          <Card>
            <CardHeader><>

              <CardTitle className="text-lg">Event Timeline</CardTitle>
              <CardDescription
</>>Chronological events related to this incident</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.timeline.map((item /* , index */) => (
                  <div key={index} className="relative pl-6">
                    {index < event.timeline.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-0 w-[2px] bg-gray-200" />
                    )}
                    <div className={`absolute left-0 top-1 h-4 w-4 rounded-full ${
                      item.status === 'error' ? 'text-red-500' : 
                      item.status === 'warning' ? 'text-amber-500' : 
                      item.status === 'success' ? 'text-green-500' : 
                      'text-blue-500'
                    }`}>
                      {item.status === 'error' ? <AlertCircle className="h-4 w-4" /> : 
                       item.status === 'warning' ? <Clock className="h-4 w-4" /> : 
                       item.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <>

                       <FileText className="h-4 w-4" />}
                    </div>
                    <div
</>>
                      <div className="flex items-baseline"><>

                        <h4 className="text-sm font-medium">{item.time}</h4>
                        <span
</> className="ml-2 text-gray-600">{item.description}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="actions" className="space-y-4 mt-4">
          <Card>
            <CardHeader><>

              <CardTitle className="text-lg">Remediation Actions</CardTitle>
              <CardDescription
</>>Actions taken or planned to prevent future occurrences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.actions.map((action /* , index */) => (
                  <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-b-0 last:pb-0">
                    {action.status === 'complete' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                    )}
                    <div><>

                      <p className="font-medium">{action.description}</p>
                      <Badge
</> 
                        variant="outline" 
                        className={`mt-1 ${
                          action.status === 'complete' ? 'bg-green-100 text-green-800' : 
                          'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Add Action Item</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card>
            <CardHeader><>

              <CardTitle className="text-lg">System Logs</CardTitle>
              <CardDescription
</>>Detailed system logs from the event period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-200 font-mono text-xs p-4 rounded-md h-64 overflow-auto">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="py-1">
                    <span className="text-gray-500">[2023-05-15 {14 + Math.floor(i/5)}:{30 + (i % 5) * 3}:{Math.floor(Math.random() * 60).toString().padStart(2, '0')}]</span>{' '}
                    <span className={
                      i % 7 === 0 ? 'text-red-400' : 
                      i % 5 === 0 ? 'text-yellow-400' : 
                      'text-blue-400'
                    }>
                      {i % 7 === 0 ? 'ERROR' : i % 5 === 0 ? 'WARN' : 'INFO'}
                    </span>{' '}
                    <span>
                      {i % 7 === 0 ? 'Connection to authentication database failed: Timeout after 5000ms' : 
                       i % 5 === 0 ? 'Circuit breaker threshold approaching: current error rate 9.8%' : 
                       `Processing request ${Math.floor(Math.random() * 1000000)} with status ${i % 3 === 0 ? '500' : '200'}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between"><>

              <Button variant="outline">Download Logs</Button>
              <Button
</> variant="outline">Filter Logs</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reported By</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"><>

              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div
</>><>

              <p className="font-medium">{event.user.name}</p>
              <p
</> className="text-sm text-gray-500">{event.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadDetail;