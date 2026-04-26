import React from 'react';
import { AlertTriangle, Bot, ShieldAlert, Workflow } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AISwarmIntelligenceDashboard: React.FC = () => {
  return (
    <div className='space-y-6' data-testid='ai-swarm-dashboard-unavailable'>
      <Card className='tf-glass-card border-yellow-500/30 bg-yellow-500/5'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-yellow-100'>
            <AlertTriangle className='h-6 w-6 text-yellow-400' />
            AI Swarm Intelligence Unavailable
          </CardTitle>
          <CardDescription className='text-yellow-50/80'>
            This surface previously exposed synthetic swarm counts, health scores, and command execution claims. Those claims were removed.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert className='border-yellow-500/40 bg-yellow-500/10'>
            <ShieldAlert className='h-4 w-4 text-yellow-400' />
            <AlertDescription className='text-yellow-50'>
              Governed swarm telemetry and execution are not operational on this route. The dashboard now reports unavailable until a real evidence-backed control plane exists.
            </AlertDescription>
          </Alert>
          <div className='grid gap-4 md:grid-cols-3'>
            <Card className='border-white/10 bg-white/5'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-3'>
                  <Bot className='h-5 w-5 text-slate-300' />
                  <div>
                    <p className='text-sm font-semibold text-white'>Synthetic metrics removed</p>
                    <p className='text-sm text-slate-300'>
                      Agent counts, health scores, and throughput claims are intentionally withheld.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className='border-white/10 bg-white/5'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-3'>
                  <Workflow className='h-5 w-5 text-slate-300' />
                  <div>
                    <p className='text-sm font-semibold text-white'>Command execution blocked</p>
                    <p className='text-sm text-slate-300'>
                      Emergency deployment and optimization actions stay disabled until governed execution is implemented.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className='border-white/10 bg-white/5'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-3'>
                  <ShieldAlert className='h-5 w-5 text-slate-300' />
                  <div>
                    <p className='text-sm font-semibold text-white'>Telemetry feed unavailable</p>
                    <p className='text-sm text-slate-300'>
                      No production telemetry source is attached to this surface for operator use.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button disabled className='w-full md:w-auto'>
            Swarm actions unavailable
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
