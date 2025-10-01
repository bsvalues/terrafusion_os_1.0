import React, { useEffect, useState, useCallback } from "react";

interface ExplainTooltip {
  element: HTMLElement;
  text: string;
  position: { x: number; y: number };
}

/**
 * TerraFusion Explain-Mode Overlay
 * Provides contextual tooltips for any element with data-explain attribute
 * Toggleable with Ctrl/Cmd+E or click button
 * MIT/PhD-grade user experience enhancement
 */
export function ExplainOverlay() {
  const [isActive, setIsActive] = useState(false);
  const [tooltips, setTooltips] = useState<ExplainTooltip[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const toggleExplainMode = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  const calculatePosition = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      x: rect.left + scrollLeft + (rect.width / 2),
      y: rect.top + scrollTop - 10 // Position above the element
    };
  }, []);

  const updateTooltips = useCallback(() => {
    const explainElements = document.querySelectorAll<HTMLElement>("[data-explain]");
    const newTooltips: ExplainTooltip[] = [];

    explainElements.forEach(element => {
      const explainText = element.dataset.explain;
      if (explainText) {
        const position = calculatePosition(element);
        newTooltips.push({
          element,
          text: explainText,
          position
        });
      }
    });

    setTooltips(newTooltips);
  }, [calculatePosition]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleExplainMode();
      }
      
      // ESC to close
      if (e.key === "Escape" && isActive) {
        setIsActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleExplainMode, isActive]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => updateTooltips();
    const handleScroll = () => updateTooltips();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isActive, updateTooltips]);

  // Update tooltips when explain mode is activated
  useEffect(() => {
    if (isActive) {
      // Small delay to ensure DOM is ready
      setTimeout(updateTooltips, 100);
      setIsVisible(true);
      
      // Add visual indicators to elements
      document.querySelectorAll<HTMLElement>("[data-explain]").forEach(element => {
        element.style.outline = "2px dashed rgba(110, 231, 255, 0.6)";
        element.style.outlineOffset = "2px";
        element.style.position = element.style.position || "relative";
        element.style.zIndex = element.style.zIndex || "1";
        
        // Add a subtle glow effect
        element.style.boxShadow = "0 0 0 4px rgba(110, 231, 255, 0.1)";
        element.style.transition = "all 0.2s ease";
        
        // Add hover effect
        const originalCursor = element.style.cursor;
        element.style.cursor = "help";
        
        element.addEventListener("mouseenter", () => {
          element.style.outline = "2px solid rgba(110, 231, 255, 0.8)";
          element.style.boxShadow = "0 0 0 6px rgba(110, 231, 255, 0.2)";
        });
        
        element.addEventListener("mouseleave", () => {
          element.style.outline = "2px dashed rgba(110, 231, 255, 0.6)";
          element.style.boxShadow = "0 0 0 4px rgba(110, 231, 255, 0.1)";
        });
        
        // Store original styles for cleanup
        element.dataset.originalCursor = originalCursor;
      });
    } else {
      setIsVisible(false);
      
      // Remove visual indicators
      document.querySelectorAll<HTMLElement>("[data-explain]").forEach(element => {
        element.style.outline = "";
        element.style.outlineOffset = "";
        element.style.boxShadow = "";
        element.style.cursor = element.dataset.originalCursor || "";
        
        // Remove event listeners by cloning the element
        const newElement = element.cloneNode(true) as HTMLElement;
        element.parentNode?.replaceChild(newElement, element);
      });
      
      setTooltips([]);
    }
  }, [isActive, updateTooltips]);

  // Auto-hide after inactivity
  useEffect(() => {
    if (!isActive) return;

    const timeout = setTimeout(() => {
      setIsActive(false);
    }, 30000); // Auto-hide after 30 seconds of inactivity

    const resetTimeout = () => {
      clearTimeout(timeout);
      setTimeout(() => {
        if (isActive) {
          setIsActive(false);
        }
      }, 30000);
    };

    window.addEventListener("mousemove", resetTimeout);
    window.addEventListener("keydown", resetTimeout);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keydown", resetTimeout);
    };
  }, [isActive]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleExplainMode}
        className={`
          fixed bottom-6 right-6 z-50
          px-4 py-3 rounded-full text-sm font-medium
          border border-slate-600/50 backdrop-blur-sm
          transition-all duration-200 ease-out
          ${isActive 
            ? 'bg-blue-600/90 text-white border-blue-500 shadow-lg shadow-blue-500/25' 
            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
          }
          hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
        `}
        title="Toggle Explain Mode (Ctrl/Cmd+E)"
      >
        {isActive ? (
          <>
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            Hide Explanations
          </>
        ) : (
          <>
            <span className="mr-2">💡</span>
            Explain This
          </>
        )}
      </button>

      {/* Overlay Instructions */}
      {isActive && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-600/50 rounded-lg px-4 py-3 shadow-xl">
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <span className="flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                Explain Mode Active
              </span>
              <span className="text-slate-500">•</span>
              <span>Hover over highlighted elements for details</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded">ESC to exit</span>
            </div>
          </div>
        </div>
      )}

      {/* Tooltips */}
      {isVisible && tooltips.map((tooltip, index) => (
        <ExplainTooltip
          key={index}
          text={tooltip.text}
          position={tooltip.position}
          isVisible={isActive}
        />
      ))}

      {/* Background Overlay */}
      {isActive && (
        <div 
          className="fixed inset-0 bg-black/5 z-10 pointer-events-none"
          style={{
            backdropFilter: 'blur(0.5px)',
            transition: 'all 0.3s ease'
          }}
        />
      )}
    </>
  );
}

interface TooltipProps {
  text: string;
  position: { x: number; y: number };
  isVisible: boolean;
}

function ExplainTooltip({ text, position, isVisible }: TooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    // Adjust position to keep tooltip in viewport
    const tooltipWidth = 280;
    const tooltipHeight = 80; // Approximate height
    const padding = 20;

    let x = position.x - (tooltipWidth / 2);
    let y = position.y - tooltipHeight - 10;

    // Keep within viewport horizontally
    if (x < padding) {
      x = padding;
    } else if (x + tooltipWidth > window.innerWidth - padding) {
      x = window.innerWidth - tooltipWidth - padding;
    }

    // Keep within viewport vertically
    if (y < padding) {
      y = position.y + 10; // Position below element instead
    }

    setAdjustedPosition({ x, y });
  }, [position]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed z-30 pointer-events-auto
        max-w-xs p-3 rounded-lg text-xs leading-relaxed
        bg-slate-900/95 backdrop-blur-sm
        border border-slate-600/50 shadow-xl
        text-slate-200
        transition-all duration-200 ease-out
        ${isHovered ? 'scale-105 shadow-2xl' : 'scale-100'}
      `}
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translateX(-50%)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
      </div>
      
      {/* Tooltip Content */}
      <div className="relative">
        <div className="flex items-start space-x-2">
          <span className="text-blue-400 mt-0.5 flex-shrink-0">💡</span>
          <p className="text-slate-200">{text}</p>
        </div>
        
        {/* TerraFusion branding */}
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs">TerraFusion Explain-Mode</span>
            <span className="text-slate-600 text-xs">💻</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to easily add explain mode to any component
 */
export function useExplainMode() {
  const addExplanation = useCallback((ref: React.RefObject<HTMLElement>, explanation: string) => {
    if (ref.current) {
      ref.current.setAttribute('data-explain', explanation);
    }
  }, []);

  const removeExplanation = useCallback((ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.removeAttribute('data-explain');
    }
  }, []);

  return { addExplanation, removeExplanation };
}

/**
 * HOC to automatically add explanations to components
 */
export function withExplanation<P extends object>(
  Component: React.ComponentType<P>, 
  explanation: string
) {
  return React.forwardRef<HTMLElement, P>((props, ref) => {
    const internalRef = React.useRef<HTMLElement>(null);
    const elementRef = ref || internalRef;

    React.useEffect(() => {
      if (elementRef && 'current' in elementRef && elementRef.current) {
        elementRef.current.setAttribute('data-explain', explanation);
      }
    }, [elementRef]);

    return <Component {...props} ref={elementRef} />;
  });
}

/**
 * Component wrapper that adds explanation attribute
 */
export function Explainable({ 
  children, 
  explanation, 
  className = "",
  as: Component = "div",
  ...props 
}: {
  children: React.ReactNode;
  explanation: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}) {
  return (
    <Component 
      className={className}
      data-explain={explanation}
      {...props}
    >
      {children}
    </Component>
  );
}