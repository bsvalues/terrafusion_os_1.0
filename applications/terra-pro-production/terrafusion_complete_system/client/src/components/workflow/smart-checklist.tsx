import React, { useState } from "react";
import { CheckCircle, Circle, AlertCircle, CheckCircle2, Sparkles  } from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { enhancedToast } from "@/components/ui/enhanced-toast";
import { cn } from "@/lib/utils";

export enum CheckItemStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  WARNING = "warning",
  ERROR = "error",
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  status: CheckItemStatus;
  requiredForCompletion?: boolean;
  aiRecommended?: boolean;
  detail?: string;
  group?: string;
}

interface ChecklistItemProps {
  item: ChecklistItem;
  onClick: (item: ChecklistItem) => void;
}

const ChecklistItemComponent: React.FC<ChecklistItemProps> = ({ item, onClick }) => {
  const getIcon = () => {
    switch (item.status) {
      case CheckItemStatus.COMPLETED:
        return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />;
      case CheckItemStatus.WARNING:
        return <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
      case CheckItemStatus.ERROR:
        return <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-start p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
        item.status === CheckItemStatus.COMPLETED ? "bg-green-50" : "",
        item.status === CheckItemStatus.WARNING ? "bg-amber-50" : "",
        item.status === CheckItemStatus.ERROR ? "bg-red-50" : ""
      )}
      onClick={() => onClick(item)}
    ><>

      <div className="flex-shrink-0 mt-0.5 mr-3">{getIcon()}</div>
      <div
</> className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{item.title}</p>
          {item.requiredForCompletion && (
            <Badge variant="outline" className="text-xs font-normal">
              Required
            </Badge>
          )}
          {item.aiRecommended && (
            <Badge variant="outline" className="text-xs font-normal bg-blue-50">
              <Sparkles className="h-3 w-3 mr-1" /> AI Suggested
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        )}
        {item.detail && item.status !== CheckItemStatus.PENDING && (
          <p
            className={cn(
              "text-sm mt-1 p-2 rounded-md",
              item.status === CheckItemStatus.COMPLETED ? "bg-green-100 text-green-800" : "",
              item.status === CheckItemStatus.WARNING ? "bg-amber-100 text-amber-800" : "",
              item.status === CheckItemStatus.ERROR ? "bg-red-100 text-red-800" : ""
            )}
          >
            {item.detail}
          </p>
        )}
      </div>
    </div>
  );
};

interface SmartChecklistProps {
  items: ChecklistItem[];
  onItemClick?: (item: ChecklistItem) => void;
  onRunAiCheck?: () => Promise<void>;
  title?: string;
  description?: string;
  className?: string;
  grouped?: boolean;
}

export function SmartChecklist({
  items,
  onItemClick,
  onRunAiCheck,
  title = "Appraisal Checklist",
  description = "Complete these items to finalize your appraisal",
  className,
  grouped = false,
}: SmartChecklistProps) {
  const [isRunningAiCheck, setIsRunningAiCheck] = useState(false);

  // Calculate completion stats
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.status === CheckItemStatus.COMPLETED).length;
  const warningItems = items.filter((item) => item.status === CheckItemStatus.WARNING).length;
  const errorItems = items.filter((item) => item.status === CheckItemStatus.ERROR).length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  const handleItemClick = (item: ChecklistItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleRunAiCheck = async () => {
    if (!onRunAiCheck) return;

    try {
      setIsRunningAiCheck(true);
      await onRunAiCheck();
      enhancedToast.success({
        title: "AI Analysis Complete",
        description: "The checklist has been updated with AI recommendations",
      });
    } catch (error) {
      enhancedToast.error({
        title: "AI Analysis Failed",
        description: "Could not complete AI analysis. Please try again.",
      });
    } finally {
      setIsRunningAiCheck(false);
    }
  };

  // Group items if needed
  const groupedItems = React.useMemo(() => {
    if (!grouped) return { default: items };

    return items.reduce(
      (acc, item) => {
        const group = item.group || "Other";
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(item);
        return acc;
      },
      {} as Record<string, ChecklistItem[]>
    );
  }, [items, grouped]);

  return (
    <Card className={className}>
      <CardHeader><>

        <CardTitle>{title}</CardTitle>
        <CardDescription
</>>{description}</CardDescription>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between"><>

            <span className="text-sm font-medium">Completion</span>
            <span
</> className="text-sm text-muted-foreground">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />

          <div className="flex items-center justify-between pt-1 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span>{completedItems} complete</span>
              </div>
              {warningItems > 0 && (
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                  <span>{warningItems} warnings</span>
                </div>
              )}
              {errorItems > 0 && (
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-destructive mr-1" />
                  <span>{errorItems} errors</span>
                </div>
              )}
            </div>

            {onRunAiCheck && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={handleRunAiCheck}
                disabled={isRunningAiCheck}
              >
                <Sparkles className="h-3 w-3" />
                {isRunningAiCheck ? "Running..." : "AI Check"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group} className="space-y-2">
              {grouped && group !== "default" && (
                <><>

                  <h3 className="text-sm font-semibold text-muted-foreground">{group}</h3>
                  <Separator
</> className="my-2" />
                </>
              )}

              <div className="space-y-1">
                {groupItems.map((item) => (
                  <ChecklistItemComponent key={item.id} item={item} onClick={handleItemClick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
