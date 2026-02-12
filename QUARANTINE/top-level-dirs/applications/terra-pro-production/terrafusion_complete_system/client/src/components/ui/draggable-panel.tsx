import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { ipcRenderer } from "@/lib/electron";

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  onClose?: () => void;
  onMinimize?: () => void;
  className?: string;
  initialWidth?: number;
  initialHeight?: number;
  id: string;
}

export function DraggablePanel({
  title,
  children,
  initialPosition = { x: 100, y: 100 },
  onClose,
  onMinimize,
  className = "",
  initialWidth = 400,
  initialHeight = 300,
  id,
}: DraggablePanelProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [isDetached, setIsDetached] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // Handle mouse down on panel header (start dragging)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left clicks

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Handle mouse down on resize handle
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ width: size.width, height: size.height });
  };

  // Handle detaching panel to new window
  const handleDetach = () => {
    // In a real implementation, we would communicate with Electron to create a new window
    if (ipcRenderer) {
      ipcRenderer.send("detach-panel", {
        id,
        title,
        position,
        size,
      });
      setIsDetached(true);
    }
  };

  // Global mouse move and mouse up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing) {
        const dx = e.clientX - resizeStartPos.x;
        const dy = e.clientY - resizeStartPos.y;

        setSize({
          width: Math.max(200, resizeStartSize.width + dx),
          height: Math.max(150, resizeStartSize.height + dy),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStartPos, resizeStartSize]);

  // Listen for panel reattach events from Electron
  useEffect(() => {
    if (ipcRenderer) {
      const handleReattach = (_event: any, data: any) => {
        if (data.id === id) {
          setIsDetached(false);
          if (data.position) setPosition(data.position);
          if (data.size) setSize(data.size);
        }
      };

      ipcRenderer.on("reattach-panel", handleReattach);

      return () => {
        ipcRenderer.removeListener("reattach-panel", handleReattach);
      };
    }
  }, [id]);

  if (isDetached) {
    return null; // Don't render if detached to another window
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isDragging || isResizing ? 100 : 10,
      }}
      className={`${className} flex flex-col`}
    >
      <Card className="h-full flex flex-col overflow-hidden shadow-lg">
        <div
          className="draggable-panel-header p-3 border-b border-neutral-medium bg-neutral-light flex justify-between items-center cursor-grab"
          onMouseDown={handleMouseDown}
        ><>

          <h3 className="font-medium text-sm">{title}</h3>
          <div
</> className="flex space-x-1">
            <button
              onClick={onMinimize}
              className="p-1 text-neutral-gray hover:text-neutral-dark"
              title="Minimize"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
              </svg>
            </button>
            <button
              onClick={handleDetach}
              className="p-1 text-neutral-gray hover:text-neutral-dark"
              title="Detach to new window"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-gray hover:text-status-error"
              title="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div><>

        <div className="flex-1 overflow-auto p-4">{children}</div>
        <div
</>
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-medium"
          >
            <polyline points="15 10 20 15 15 20" />
            <path d="M4 4v7a4 4 0 0 0 4 4h12" />
          </svg>
        </div>
      </Card>
    </div>
  );
}
