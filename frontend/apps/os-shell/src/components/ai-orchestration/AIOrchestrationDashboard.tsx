import React from 'react';
import { AlertTriangle, Gauge, ShieldAlert, Workflow } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AIOrchestrationDashboard() {
  return (
    <div className='space-y-6 p-6' data-testid='ai-orchestration-dashboard-unavailable'>
      <Card className='border-yellow-500/30 bg-yellow-500/5'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-yellow-100'>
            <AlertTriangle className='h-6 w-6 text-yellow-400' />
            AI Orchestration Unavailable
          </CardTitle>
          <CardDescription className='text-yellow-50/80'>
            The `/api/ai/orchestration/*` route family was not used because it is built on seeded
            in-memory agent hierarchies and simulated performance values.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert className='border-yellow-500/40 bg-yellow-500/10'>
            <ShieldAlert className='h-4 w-4 text-yellow-400' />
            <AlertDescription className='text-yellow-50'>
              No governed orchestration backend exists for this surface. The dashboard now reports
              unavailable instead of projecting synthetic agent counts, efficiency, or optimization
              results.
            </AlertDescription>
          </Alert>
          <div className='grid gap-4 md:grid-cols-3'>
            <EvidenceCard
              icon={<Gauge className='h-5 w-5 text-slate-300' />}
              title='Telemetry withheld'
              detail='Health scores, coordination scores, and load-balancing metrics are intentionally suppressed.'
            />
            <EvidenceCard
              icon={<Workflow className='h-5 w-5 text-slate-300' />}
              title='Optimization disabled'
              detail='Swarm optimization and task distribution actions remain blocked until a governed execution plane exists.'
            />
            <EvidenceCard
              icon={<ShieldAlert className='h-5 w-5 text-slate-300' />}
              title='No fallback lane'
              detail='This surface is not silently mapped to a different backend because the underlying contract does not match the live county-scoped assistant lane.'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EvidenceCardProps {
  icon: React.ReactNode;
  title: string;
  detail: string;
}

function EvidenceCard({ icon, title, detail }: EvidenceCardProps) {
  return (
    <Card className='border-white/10 bg-white/5'>
      <CardContent className='flex items-start gap-3 pt-6'>
        {icon}
        <div>
          <p className='text-sm font-semibold text-white'>{title}</p>
          <p className='text-sm text-slate-300'>{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIOrchestrationDashboard;
