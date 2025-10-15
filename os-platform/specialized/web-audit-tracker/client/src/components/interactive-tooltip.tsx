import {useState, useEffect, useRef} from "react";
import {createPortal} from "react-dom";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {X, 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  Info,
  Lightbulb,
  CheckCircle} from '@mui/icons-material';

interface TooltipStep {id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  action?: {
    label: string;
    onClick: () => void;};
  highlight?: boolean;
}

interface InteractiveTooltipProps {steps: TooltipStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  autoStart?: boolean;}

interface TooltipPosition {top: number;
  left: number;
  position: 'top' | 'bottom' | 'left' | 'right';}

export default function InteractiveTooltip({steps, 
  isActive, 
  onComplete, 
  onSkip,
  autoStart = false}: InteractiveTooltipProps) {const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate tooltip position based on target element
  const calculatePosition = (targetElement: Element, preferredPosition: string = 'auto'): TooltipPosition =>{
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const tooltipWidth = tooltipRect?.width || 300;
    const tooltipHeight = tooltipRect?.height || 150;
    
    let position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    let top = 0;
    let left = 0;

    // Auto-determine best position if not specified
    if (preferredPosition === 'auto') {
      const spaceAbove = targetRect.top;
      const spaceBelow = viewportHeight - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = viewportWidth - targetRect.right;

      if (spaceBelow >= tooltipHeight + 20) {
        position = 'bottom';} else if (spaceAbove >= tooltipHeight + 20) {position = 'top';} else if (spaceRight >= tooltipWidth + 20) {position = 'right';} else if (spaceLeft >= tooltipWidth + 20) {position = 'left';} else {position = 'bottom'; // Fallback}
    } else {position = preferredPosition as any;}

    // Calculate position based on determined placement
    switch (position) {case 'top':
        top = targetRect.top - tooltipHeight - 15;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 15;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - 15;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + 15;
        break;}

    // Ensure tooltip stays within viewport
    left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10));
    top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10));

    return {top, left, position};
  };

  // Update tooltip position when step changes
  useEffect(() => {if (!isActive || !currentStepData) return;

    const updateTooltipPosition = () => {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        const position = calculatePosition(targetElement, currentStepData.position);
        setTooltipPosition(position);
        setIsVisible(true);

        // Highlight target element
        if (currentStepData.highlight !== false) {
          targetElement.classList.add('tooltip-highlight');
          // Scroll target into view
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center'});
        }
      } else {
        console.warn(`Tooltip target not found: ${currentStepData.target}`);
        setIsVisible(false);
      }
    };

    // Wait for DOM to be ready
    const timer = setTimeout(updateTooltipPosition, 100);
    
    // Update position on resize
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition);

    return () => {clearTimeout(timer);
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition);
      
      // Remove highlight from all elements
      document.querySelectorAll('.tooltip-highlight').forEach(el => {
        el.classList.remove('tooltip-highlight');});
    };
  }, [currentStep, isActive, currentStepData]);

  // Auto-start functionality
  useEffect(() => {if (autoStart && isActive && steps.length > 0) {
      setCurrentStep(0);}
  }, [autoStart, isActive, steps.length]);

  const handleNext = () => {if (isLastStep) {
      handleComplete();} else {setCurrentStep(prev => prev + 1);}
  };

  const handlePrevious = () => {if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);}
  };

  const handleComplete = () => {setIsVisible(false);
    // Remove all highlights
    document.querySelectorAll('.tooltip-highlight').forEach(el => {
      el.classList.remove('tooltip-highlight');});
    onComplete();
  };

  const handleSkip = () => {setIsVisible(false);
    // Remove all highlights
    document.querySelectorAll('.tooltip-highlight').forEach(el => {
      el.classList.remove('tooltip-highlight');});
    onSkip();
  };

  if (!isActive || !isVisible || !tooltipPosition || !currentStepData) {return null;}

  const tooltipContent = (<div
      ref={tooltipRef}
      className="fixed z-[9999] animate-in fade-in-0 zoom-in-95"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,}}
    ><Card className="bg-slate-800 border-terrafusion-cyan/30 shadow-2xl max-w-sm"><CardContent className="p-4"><div className="flex items-start justify-between mb-3"><div className="flex items-center gap-2"><div className="h-8 w-8 bg-terrafusion-cyan/20 border border-terrafusion-cyan/30 rounded-full flex items-center justify-center"><><Lightbulb className="h-4 w-4 text-terrafusion-cyan" /></div><div
</></>><><h3 className="font-semibold text-white text-sm">{currentStepData.title}</h3><Badge
</>variant="outline" className="text-xs border-terrafusion-cyan/30 text-terrafusion-cyan">
                  {currentStep + 1} of {steps.length}</Badge></div></div><Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            ><X className="h-4 w-4" /></Button></div><p className="text-gray-300 text-sm mb-4 leading-relaxed">{currentStepData.content}</p>{currentStepData.action && (<Button
              size="sm"
              onClick={currentStepData.action.onClick}
              className="w-full mb-3 bg-terrafusion-cyan/20 hover:bg-terrafusion-cyan/30 text-terrafusion-cyan border border-terrafusion-cyan/30"
            ><Target className="h-3 w-3 mr-2" />{currentStepData.action.label}</Button>)}<div className="flex justify-between items-center"><Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            ><><ArrowLeft className="h-3 w-3 mr-1" />Back</Button><div
</>className="flex gap-1">
              {steps.map((_ /* , index */) => (<><div
                  key={index}
                  className={`h-1.5 w-4 rounded-full transition-all duration-200 ${
                    index <= currentStep ? 'bg-terrafusion-cyan' : 'bg-slate-600'}`} />))}</div><Button
</>size="sm"
              onClick={handleNext}
              className="bg-terrafusion-cyan hover:bg-terrafusion-cyan/80 text-slate-900 font-medium"
            >
              {isLastStep ? (<CheckCircle className="h-3 w-3 mr-1" />Done

              ) : (

                  Next<ArrowRight className="h-3 w-3 ml-1" />)}</Button></div></CardContent></Card>{/* Tooltip arrow */}<div
        className={`absolute w-3 h-3 bg-slate-800 border transform rotate-45 ${
          tooltipPosition.position === 'top' ? 'bottom-[-6px] border-b-0 border-r-0 border-terrafusion-cyan/30' :
          tooltipPosition.position === 'bottom' ? 'top-[-6px] border-t-0 border-l-0 border-terrafusion-cyan/30' :
          tooltipPosition.position === 'left' ? 'right-[-6px] border-r-0 border-b-0 border-terrafusion-cyan/30' :
          'left-[-6px] border-l-0 border-t-0 border-terrafusion-cyan/30'}`}
        style={{
          left: tooltipPosition.position === 'top' || tooltipPosition.position === 'bottom' ? '50%' : undefined,
          top: tooltipPosition.position === 'left' || tooltipPosition.position === 'right' ? '50%' : undefined,
          transform: tooltipPosition.position === 'top' || tooltipPosition.position === 'bottom' 
            ? 'translateX(-50%) rotate(45deg)' 
            : 'translateY(-50%) rotate(45deg)'}} /></div>
  );

  return createPortal(tooltipContent, document.body);
}

// CSS for highlighting target elements (add to global styles)
export const tooltipStyles = `
  .tooltip-highlight {position: relative;
    z-index: 1000;
    box-shadow: 0 0 0 4px rgba(0, 210, 255, 0.3), 0 0 0 2px rgba(0, 210, 255, 0.6);
    border-radius: 8px;
    animation: tooltip-pulse 2s infinite;}
  
  @keyframes tooltip-pulse {0%, 100% {
      box-shadow: 0 0 0 4px rgba(0, 210, 255, 0.3), 0 0 0 2px rgba(0, 210, 255, 0.6);}
    50% {box-shadow: 0 0 0 8px rgba(0, 210, 255, 0.1), 0 0 0 2px rgba(0, 210, 255, 0.8);}
  }
`;