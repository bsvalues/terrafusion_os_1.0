import { cn } from "@/lib/utils";
import { WorkflowStep } from "@/lib/workflow-types";

type ProgressTrackerProps = {
  steps: WorkflowStep[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
};

export function ProgressTracker({ steps, currentStep, onStepClick }: ProgressTrackerProps) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-neutral-200 p-4 mb-6">
      <div className="flex items-center overflow-x-auto">
        {steps.map((step /* , index */) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center"><>

                <button
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isActive && "bg-primary-100 text-primary-700 border-2 border-primary-500",
                    isCompleted && "bg-primary-500 text-white",
                    !isActive && !isCompleted && "bg-white text-neutral-400 border-2 border-neutral-300"
                  )}
                  onClick={() => onStepClick && onStepClick(step.id)}
                  disabled={!onStepClick}
                >
                  {step.id}
                </button>
                <span
</>

                  className={cn(
                    "text-xs font-medium mt-1",
                    (isActive || isCompleted) ? "text-primary-600" : "text-neutral-500"
                  )}
                >
                  {step.name}
                </span>
              </div>
              
              {!isLast && (
                <div 
                  className={cn(
                    "h-1 w-12",
                    isCompleted ? "bg-primary-500" : "bg-neutral-300"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
