import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Check, Clock, Warning, ArrowRight} from '@mui/icons-material';
import {cn} from '@/lib/utils';
import {WorkflowType, workflowSteps, WorkflowStep} from '@/lib/workflow-types';
import {Progress} from '@/components/ui/progress';
import {Badge} from '@/components/ui/badge';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';

export interface AnimatedProgressTrackerProps {workflowType: WorkflowType;
  currentStep: number;
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived' | null;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showPercentage?: boolean;
  className?: string;}

export function AnimatedProgressTracker({workflowType,
  currentStep,
  status,
  animationSpeed = 'medium',
  size = 'md',
  orientation = 'horizontal',
  showLabels = true,
  showPercentage = true,
  className,}: AnimatedProgressTrackerProps) {const steps = workflowSteps[workflowType] || [];
  const [progressValue, setProgressValue] = useState(0);
  const [prevStep, setPrevStep] = useState(currentStep);

  // Calculate total progress percentage
  const totalSteps = steps.length;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  // Animation speed in milliseconds
  const animationDuration = {
    slow: 1500,
    medium: 1000,
    fast: 500,}[animationSpeed];

  // Size classes
  const sizeClasses = {sm: {
      container: 'text-xs',
      step: 'h-6 w-6 text-xs',
      line: 'h-1',
      label: 'text-xs',},
    md: {container: 'text-sm',
      step: 'h-8 w-8 text-sm',
      line: 'h-1.5',
      label: 'text-sm',},
    lg: {container: 'text-base',
      step: 'h-10 w-10 text-base',
      line: 'h-2',
      label: 'text-sm',},
  }[size];

  // Handle step change animation
  useEffect(() =>{// If the step has changed
    if (currentStep !== prevStep) {
      // Reset progress to previous value
      setProgressValue(Math.round((prevStep / totalSteps) * 100));

      // Animate to new value
      const timer = setTimeout(() => {
        setProgressValue(progressPercentage);}, 100);

      setPrevStep(currentStep);
      return () => clearTimeout(timer);
    } else {// Initial setup
      setProgressValue(progressPercentage);}
  }, [currentStep, prevStep, totalSteps, progressPercentage]);

  // Get step status
  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {if (stepIndex + 1< currentStep) return 'completed';
    if (stepIndex + 1 === currentStep) return 'current';
    return 'upcoming';};

  // Step status colors
  const getStepColor = (status: 'completed' | 'current' | 'upcoming') =>{switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-blue-500 text-white';
      case 'upcoming':
        return 'bg-gray-200 text-gray-500';}
  };

  // Step line colors
  const getLineColor = (status: 'completed' | 'current' | 'upcoming') => {switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-blue-500';
      case 'upcoming':
        return 'bg-gray-200';}
  };

  // Get step icon
  const getStepIcon = (status: 'completed' | 'current' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return<Check className="h-4 w-4" />;
      case 'current':
        return <Clock className="h-4 w-4" />;
      case 'upcoming':
        return <span className="text-xs">{steps.length}</span>;
    }
  };

  // Horizontal layout rendering
  if (orientation === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>{/* Overall progress */}<div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className={cn('font-medium', sizeClasses.container)}>Workflow Progress</span>{status && (<Badge
                variant={status === 'completed'
                    ? 'default'
                    : status === 'in_progress'
                      ? 'default'
                      : status === 'review'
                        ? 'secondary'
                        : 'secondary'}
                className={cn(
                  status === 'completed'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : status === 'review'
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : '',
                  'ml-2'
                )}
              >{status.replace('_', ' ')}</Badge>)}</div>{showPercentage && (<motion.span
              key={`percent-${progressValue}`}
              initial={{ opacity: 0, y: -10}}
              animate={{ opacity: 1, y: 0}}
              className={cn('font-semibold', sizeClasses.container)}
            >{progressValue}%</motion.span>)}</div>{/* Progress bar */}<motion.div className="mb-6"><Progress
            value={progressValue}
            className={cn('w-full transition-all', sizeClasses.line)}
            // Animated using Framer Motion via CSS transitions /></motion.div>{/* Step indicators */}<div className="flex w-full justify-between relative">{/* Connecting line behind the steps */}<div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 -translate-y-1/2 z-0" />{steps.map((step /* , index */) => {
            const stepStatus = getStepStatus(index);
            const isActive = index + 1 === currentStep;

            return (<div key={step.id} className="flex flex-col items-center z-10"><TooltipProvider><Tooltip><TooltipTrigger asChild><motion.div
                        className={cn(
                          'rounded-full flex items-center justify-center',
                          getStepColor(stepStatus),
                          sizeClasses.step,
                          {
                            'ring-4 ring-blue-200': isActive,}
                        )}
                        initial={isActive ? { scale: 0.8} : {scale: 1}}
                        animate={isActive
                            ? {
                                scale: [0.8, 1.1, 1],
                                transition: {
                                  duration: 0.5,
                                  times: [0, 0.6, 1],},
                              }
                            : {scale: 1}
                        }
                        transition={{ duration: 0.3}}
                      >{isActive ? (<span className="font-medium">{index + 1}</span>) : stepStatus === 'completed' ? (<Check className="h-4 w-4" />) : (<span>{index + 1}</span>)}</motion.div></TooltipTrigger><TooltipContent side="top"><p>{step.name}</p>{step.description &&<p className="text-xs opacity-80">{step.description}</p>}
                    </TooltipContent></Tooltip></TooltipProvider>{showLabels && (<motion.div
                    className="mt-2 text-center"
                    initial={{ opacity: 0}}
                    animate={{ opacity: 1}}
                    transition={{ delay: 0.1 * index, duration: 0.3}}
                  ><span
                      className={cn(
                        sizeClasses.label,
                        isActive ? 'font-medium text-primary' : 'text-muted-foreground'
                      )}
                    >{step.name}</span></motion.div>)}</div>);
          })}</div></div>);
  }

  // Vertical layout rendering
  return (<div className={cn('w-full', className)}><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className={cn('font-medium', sizeClasses.container)}>Workflow Progress</span>{status && (<Badge
              variant={status === 'completed'
                  ? 'default'
                  : status === 'in_progress'
                    ? 'default'
                    : status === 'review'
                      ? 'secondary'
                      : 'secondary'}
              className={cn(
                status === 'completed'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : status === 'review'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : '',
                'ml-2'
              )}
            >{status.replace('_', ' ')}</Badge>)}</div>{showPercentage && (<motion.span
            key={`percent-${progressValue}`}
            initial={{ opacity: 0, y: -10}}
            animate={{ opacity: 1, y: 0}}
            className={cn('font-semibold', sizeClasses.container)}
          >{progressValue}%</motion.span>)}</div>{/* Progress bar */}<motion.div className="mb-6"><Progress value={progressValue} className={cn('w-full transition-all', sizeClasses.line)} /></motion.div>{/* Vertical step indicators */}<div className="flex flex-col space-y-8 pl-2 relative">{/* Vertical connecting line */}<div className="absolute top-0 bottom-0 left-4 w-px bg-gray-200 z-0" />{steps.map((step /* , index */) => {
          const stepStatus = getStepStatus(index);
          const isActive = index + 1 === currentStep;

          return (<div key={step.id} className="flex items-start relative z-10"><TooltipProvider><Tooltip><TooltipTrigger asChild><motion.div
                      className={cn(
                        'rounded-full flex items-center justify-center mr-4',
                        getStepColor(stepStatus),
                        sizeClasses.step,
                        {
                          'ring-4 ring-blue-200': isActive,}
                      )}
                      initial={isActive ? { scale: 0.8} : {scale: 1}}
                      animate={isActive
                          ? {
                              scale: [0.8, 1.1, 1],
                              transition: {
                                duration: 0.5,
                                times: [0, 0.6, 1],},
                            }
                          : {scale: 1}
                      }
                      transition={{ duration: 0.3}}
                    >{isActive ? (<span className="font-medium">{index + 1}</span>) : stepStatus === 'completed' ? (<Check className="h-4 w-4" />) : (<span>{index + 1}</span>)}</motion.div></TooltipTrigger><TooltipContent side="right"><p>{step.name}</p>{step.description &&<p className="text-xs opacity-80">{step.description}</p>}
                  </TooltipContent></Tooltip></TooltipProvider><div className="flex flex-col"><span
                  className={cn(
                    sizeClasses.label,
                    'font-medium',
                    isActive ? 'text-primary' : 'text-foreground'
                  )}
                >{step.name}</span>{step.description && (<motion.span
                    className={cn('text-muted-foreground text-xs')}
                    initial={{ opacity: 0}}
                    animate={{ opacity: 1}}
                    transition={{ delay: 0.1 * index, duration: 0.3}}
                  >{step.description}</motion.span>)}

                {isActive && (<motion.div
                    className="mt-2 text-sm text-blue-600"
                    initial={{ opacity: 0, x: -10}}
                    animate={{ opacity: 1, x: 0}}
                    transition={{ delay: 0.2, duration: 0.3}}
                  ><span className="flex items-center">Current step<Clock className="ml-1 h-3 w-3" /></span></motion.div>)}</div></div>);
        })}</div></div>
  );
}
