import React, { useState } from "react";
import {
  UADFormSection as UADFormSectionType,
  getFieldsBySection,
  getFieldsBySubsection,
} from "./constants";
import { UADFormField } from "./UADFormField";
import { useUADForm } from "@/contexts/UADFormContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Check, AlertCircle  } from '@mui/icons-material';
import { cn } from "@/lib/utils";

interface UADFormSectionProps {
  title: string;
  description?: string;
  section: UADFormSectionType;
  subsections?: { id: string; title: string }[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  onSectionComplete?: (section: UADFormSectionType, isComplete: boolean) => void;
  className?: string;
}

export const UADFormSection: React.FC<UADFormSectionProps> = ({
  title,
  description,
  section,
  subsections,
  isCollapsible = true,
  defaultExpanded = true,
  onSectionComplete,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Check if the section has any fields
  const sectionFields = getFieldsBySection(section);
  const hasFields = sectionFields.length > 0;

  const toggleExpanded = () => {
    if (isCollapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  // Render section content based on whether it has subsections
  const renderContent = () => {
    if (!hasFields) {
      return (
        <div className="py-4 text-center text-muted-foreground">
          No fields available for this section
        </div>
      );
    }

    if (subsections && subsections.length > 0) {
      // Render with subsections
      return subsections.map((subsection) => {
        const subsectionFields = getFieldsBySubsection(section, subsection.id);

        if (subsectionFields.length === 0) return null;

        return (
          <div key={subsection.id} className="mb-6 last:mb-0"><>

            <h4 className="text-lg font-medium mb-3">{subsection.title}</h4>
            <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subsectionFields.map((field) => (<>

                <UADFormField key={field.id} field={field} />
              ))}
            </div>
            <Separator
</> className="mt-4" />
          </div>
        );
      });
    } else {
      // Render without subsections
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionFields.map((field) => (
            <UADFormField key={field.id} field={field} />
          ))}
        </div>
      );
    }
  };

  // Status indicator for the section
  const SectionStatusIndicator = () => {
    // Simple status display
    // This is a simplified version without the form data usage
    const requiredFieldsCount = getFieldsBySection(section).filter(
      (field) => field.required
    ).length;

    return (
      <div className="ml-auto flex items-center">
        {requiredFieldsCount === 0 ? (
          <div className="flex items-center text-blue-500">
            <Check size={16} className="mr-1" />
            <span className="text-sm">Optional</span>
          </div>
        ) : (
          <div className="flex items-center text-amber-500">
            <AlertCircle size={16} className="mr-1" />
            <span className="text-sm">{requiredFieldsCount} Required Fields</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader
        className={cn("flex flex-row items-center", isCollapsible && "cursor-pointer")}
        onClick={toggleExpanded}
      >
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <SectionStatusIndicator />

          {isCollapsible && (
            <div className="text-muted-foreground">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && <CardContent>{renderContent()}</CardContent>}
    </Card>
  );
};
