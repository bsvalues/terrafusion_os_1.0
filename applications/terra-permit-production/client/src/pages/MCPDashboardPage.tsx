import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MCPDashboard from '@/components/mcp/MCPDashboard';
import { MCPEventMonitor } from '@/components/mcp/MCPEventMonitor';
import { BrainCircuit, Network, GitBranch, Activity, Cpu, Grid3X3, Sigma, CircuitBoard, Workflow  } from '@mui/icons-material';
import { globalEventBus } from '@/lib/event-bus';
// Import the event generator for automatic event generation
import '@/lib/event-generator';

// Custom pulse effect component
const PulseEffect = ({ delay = 0, color = 'primary' }) => {
  return (
    <motion.div
      className={`absolute rounded-full bg-${color}/50 z-0`}
      initial={{ width: 20, height: 20, opacity: 0.7 }}
      animate={{ 
        width: [20, 80],
        height: [20, 80],
        opacity: [0.7, 0],
      }}
      transition={{
        duration: 2,
        ease: "easeOut",
        times: [0, 1],
        repeat: Infinity,
        delay: delay
      }}
    />
  );
};

// Animation for floating icons
const floatingAnimation = (delay = 0) => ({
  y: [0, -15, 0],
  transition: {
    duration: 8,
    ease: "easeInOut",
    times: [0, 0.5, 1],
    repeat: Infinity,
    delay: delay
  }
});

// Animation for rotating icons
const rotatingAnimation = (delay = 0, reverse = false) => ({
  rotate: reverse ? [0, -360] : [0, 360],
  transition: {
    duration: 20,
    ease: "linear",
    repeat: Infinity,
    delay: delay
  }
});

// Background Pattern Component
const BackgroundPattern = () => {
  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-primary/5 to-indigo-50/20 dark:from-slate-950/50 dark:via-primary/10 dark:to-blue-950/30" />
      
      {/* Animated grid */}
      <motion.div 
        className="absolute inset-0 opacity-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="h-full w-full bg-grid-primary/30 dark:bg-grid-white/20" />
      </motion.div>

      {/* Floating nodes and connections */}
      <div className="absolute inset-0">
        {/* Large decorative circle */}
        <motion.div 
          className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full border border-primary/20 opacity-20"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
          }}
        />
        
        {/* Small decorative circles */}
        <motion.div 
          className="absolute top-1/3 left-1/4 h-40 w-40 rounded-full border border-blue-500/20 opacity-20"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.25, 0.2],
          }}
          transition={{
            duration: 6,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            delay: 1
          }}
        />
        
        <motion.div 
          className="absolute bottom-1/4 right-1/3 h-60 w-60 rounded-full border border-green-500/20 opacity-15"
          animate={{ 
            scale: [1, 1.08, 1],
            opacity: [0.15, 0.2, 0.15],
          }}
          transition={{
            duration: 7,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            delay: 2
          }}
        />
        
        {/* Connection lines */}
        <svg className="absolute inset-0 h-full w-full overflow-visible opacity-10">
          <motion.path 
            d="M200,200 C300,300 500,200 600,300" 
            stroke="var(--primary)" 
            strokeWidth="1"
            strokeDasharray="5,5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
          />
          <motion.path 
            d="M300,500 C400,400 600,500 700,400" 
            stroke="#3b82f6" 
            strokeWidth="1"
            strokeDasharray="5,5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "loop", repeatDelay: 1, delay: 1 }}
          />
          <motion.path 
            d="M800,200 C700,300 800,500 700,600" 
            stroke="#10b981" 
            strokeWidth="1"
            strokeDasharray="5,5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3.5, repeat: Infinity, repeatType: "loop", repeatDelay: 1.5, delay: 2 }}
          />
        </svg>
      </div>
      
      {/* Floating icons with light trails */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/5 left-1/6 opacity-20"
          animate={floatingAnimation(0)}
        >
          <motion.div animate={rotatingAnimation(0)}>
            <BrainCircuit className="h-10 w-10 text-primary" />
            <div className="absolute inset-0 animate-ping bg-primary rounded-full opacity-20 duration-1000" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="absolute bottom-1/4 right-1/5 opacity-15"
          animate={floatingAnimation(2)}
        >
          <motion.div animate={rotatingAnimation(1, true)}>
            <CircuitBoard className="h-8 w-8 text-blue-500" />
            <div className="absolute inset-0 animate-ping bg-blue-500 rounded-full opacity-20 duration-700 delay-1000" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="absolute top-2/3 left-1/3 opacity-10"
          animate={floatingAnimation(3)}
        >
          <motion.div animate={rotatingAnimation(0.5)}>
            <Cpu className="h-7 w-7 text-green-500" />
            <div className="absolute inset-0 animate-ping bg-green-500 rounded-full opacity-20 duration-1200 delay-500" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="absolute top-1/3 right-1/4 opacity-10"
          animate={floatingAnimation(1)}
        >
          <motion.div animate={rotatingAnimation(1.5, true)}>
            <Grid3X3 className="h-9 w-9 text-yellow-500" />
            <div className="absolute inset-0 animate-ping bg-yellow-500 rounded-full opacity-20 duration-800 delay-300" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="absolute bottom-1/3 left-1/5 opacity-15"
          animate={floatingAnimation(2.5)}
        >
          <motion.div animate={rotatingAnimation(2, true)}>
            <Sigma className="h-6 w-6 text-purple-500" />
            <div className="absolute inset-0 animate-ping bg-purple-500 rounded-full opacity-20 duration-900 delay-200" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default function MCPDashboardPage() {
  return (
    <>
      {/* Animated background */}
      <BackgroundPattern />
      
      {/* Page content */}
      <motion.div 
        className="flex flex-col gap-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10"
        ><>

          <h1 className="text-3xl font-bold tracking-tight">Terrafusion Intelligence Hub</h1>
          <p
</> className="text-muted-foreground mt-2">
            Natural language AI assistants for permit processing, analysis, and optimization
          </p>
        </motion.div>
        
        {/* Interactive floating elements */}
        <div className="absolute top-24 right-32 opacity-20 z-1">
          <div className="relative">
            <BrainCircuit className="h-12 w-12 text-primary" />
            <PulseEffect delay={0} color="primary" />
          </div>
        </div>
        
        <div className="absolute bottom-32 left-24 opacity-20 z-1">
          <div className="relative">
            <Network className="h-10 w-10 text-blue-500" />
            <PulseEffect delay={1.5} color="blue" />
          </div>
        </div>
        
        <div className="absolute top-1/2 left-1/4 opacity-10 z-1">
          <div className="relative">
            <GitBranch className="h-8 w-8 text-green-500" />
            <PulseEffect delay={0.8} color="green" />
          </div>
        </div>
        
        <div className="absolute bottom-1/3 right-1/4 opacity-15 z-1">
          <div className="relative">
            <Activity className="h-9 w-9 text-yellow-500" />
            <PulseEffect delay={2.2} color="yellow" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 relative z-10">
          <MCPDashboard />
          
          {/* Event monitoring section - wrapped properly outside of TabsContent */}
          <div className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-2xl"><>

                  <Activity className="h-6 w-6 mr-2 text-primary" />
                  Event Monitoring
                </CardTitle>
                <div
</> className="text-sm text-muted-foreground">
                  Real-time system and agent event monitoring dashboard
                </div>
              </CardHeader>
              <CardContent>
                <MCPEventMonitor />
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
}