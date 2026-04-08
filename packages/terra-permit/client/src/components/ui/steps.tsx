import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const Step: React.FC<StepProps> = ({
  title,
  description,
  icon,
  isActive = false,
  isCompleted = false,
  disabled = false,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 cursor-pointer",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:text-primary",
        isActive && "text-primary",
        !isActive && !isCompleted && !disabled && "text-muted-foreground"
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
          isActive && "border-primary bg-primary/10",
          isCompleted && "border-primary bg-primary text-primary-foreground",
          !isActive && !isCompleted && "border-muted bg-muted/50"
        )}
      >
        {isCompleted ? (
          <Check className="h-4 w-4" />
        ) : (
          icon || <span className="text-sm font-medium"></span>
        )}
      </div>
      <div className="flex flex-col">
        <span className={cn(
          "text-sm font-medium",
          isActive && "text-primary",
          isCompleted && "text-primary"
        )}>
          {title}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  );
};

interface StepsProps {
  children: React.ReactNode;
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export const Steps: React.FC<StepsProps> = ({
  children,
  currentStep,
  onStepClick,
  className,
}) => {
  // Convert children to array and filter to only include Step components
  const steps = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Step
  ) as React.ReactElement<StepProps>[];

  return (
    <div className={cn("flex flex-col gap-2 md:flex-row md:gap-4", className)}>
      {steps.map((step, index) => {
        // Determine if step is completed or active
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        // Get props from original step
        const { title, description, icon, disabled } = step.props;

        // Handle step click
        const handleClick = () => {
          if (onStepClick && !disabled && (isCompleted || index === currentStep || index === currentStep + 1)) {
            onStepClick(index);
          }
        };

        return (
          <React.Fragment key={index}>
            <Step
              title={title}
              description={description}
              icon={icon}
              isActive={isActive}
              isCompleted={isCompleted}
              disabled={disabled}
              onClick={handleClick}
            />
            {index < steps.length - 1 && (
              <div className="md:flex flex-1 items-center hidden">
                <div
                  className={cn(
                    "h-px w-full bg-muted",
                    index < currentStep && "bg-primary"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};