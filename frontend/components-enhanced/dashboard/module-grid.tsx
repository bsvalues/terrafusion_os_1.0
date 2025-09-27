'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {useModuleRegistry} from '@/components/modules/module-registry';
import {ModuleCard} from '@/components/modules/module-card';
import {ArrowRight, Grid3X3} from '@mui/icons-material';

export function ModuleGrid() {const { activeModules} = useModuleRegistry();

  const handleLaunch = (moduleId: string) =>{
    console.log(`Launching module: ${moduleId}`);
  };

  const handleConfigure = (moduleId: string) => {
    console.log(`Configuring module: ${moduleId}`);
  };

  // Show first 8 modules in the dashboard
  const displayModules = activeModules.slice(0, 8);

  return (<Card className='transcend-glow'><CardHeader><div className='flex items-center justify-between'><CardTitle className='flex items-center gap-2'><Grid3X3 className='w-5 h-5 text-tf-primary' />Active Modules<Badge
              variant='secondary'
              className='bg-tf-primary/10 text-tf-primary border-tf-primary/20'
            >{activeModules.length} Running</Badge></CardTitle><Button
            variant='outline'
            size='sm'
            className='border-tf-primary text-tf-primary hover:bg-tf-primary/10 bg-transparent'
          >View All Modules<ArrowRight className='w-4 h-4 ml-2' /></Button></div></CardHeader><CardContent><div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>{displayModules.map((module) => (<ModuleCard
              key={module.id}
              module={module}
              onLaunch={handleLaunch}
              onConfigure={handleConfigure}
              showControls={false} />))}</div>{activeModules.length > 8 && (<div className='text-center mt-6'><p className='text-sm text-muted-foreground'>Showing 8 of {activeModules.length} active modules</p></div>)}</CardContent></Card>
  );
}
