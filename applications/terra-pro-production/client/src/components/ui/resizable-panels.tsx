import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ReactNode } from "react";

interface ResizablePanelsProps {
  direction?: "horizontal" | "vertical";
  children: ReactNode[];
  defaultSizes?: number[];
  minSizes?: number[];
  className?: string;
}

export function ResizablePanels({
  direction = "horizontal",
  children,
  defaultSizes,
  minSizes,
  className = "",
}: ResizablePanelsProps) {
  // Ensure we have a default size for each child
  const sizes = defaultSizes || Array(children.length).fill(100 / children.length);
  const mins = minSizes || Array(children.length).fill(10);

  return (
    <ResizablePanelGroup direction={direction} className={className}>
      {children.map((child /* , index */) => (
        <>
          <ResizablePanel
            key={`panel-${index}`}
            defaultSize={sizes[index]}
            minSize={mins[index]}
            className="overflow-auto"
          >
            {child}
          </ResizablePanel>
          {index < children.length - 1 && <ResizableHandle key={`handle-${index}`} />}
        </>
      ))}
    </ResizablePanelGroup>
  );
}
