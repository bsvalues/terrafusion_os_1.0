import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface WorksheetCellProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  editable?: boolean;
  className?: string;
}

export function WorksheetCell({
  value,
  onChange,
  onBlur,
  editable = true,
  className = "",
}: WorksheetCellProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle focusing the input when clicked
  const handleClick = useCallback(() => {
    if (editable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editable]);

  // Handle keyboard navigation between cells
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" || e.key === "Enter") {
      if (e.key === "Enter") {
        e.preventDefault();
        // Navigate to the cell below (or handle as needed)
        const currentCell = e.currentTarget;
        const cellsInColumn = document.querySelectorAll("input[data-worksheet-cell]");
        const currentIndex = Array.from(cellsInColumn).indexOf(currentCell);

        if (currentIndex >= 0 && currentIndex < cellsInColumn.length - 1) {
          (cellsInColumn[currentIndex + 1] as HTMLInputElement).focus();
        }
      }

      // For Tab, let the default behavior handle it
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const currentCell = e.currentTarget;
      const cellsInColumn = document.querySelectorAll("input[data-worksheet-cell]");
      const currentIndex = Array.from(cellsInColumn).indexOf(currentCell);

      if (e.key === "ArrowUp" && currentIndex > 0) {
        (cellsInColumn[currentIndex - 1] as HTMLInputElement).focus();
      } else if (e.key === "ArrowDown" && currentIndex < cellsInColumn.length - 1) {
        (cellsInColumn[currentIndex + 1] as HTMLInputElement).focus();
      }
    }
  }, []);

  return (
    <div className={`w-full h-full ${className}`} onClick={handleClick}>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onKeyDown={handleKeyDown}
        readOnly={!editable}
        className={`
          w-full h-full
          border-0
          bg-transparent
          text-right
          font-mono
          focus:ring-0
          focus:outline-none
          ${editable ? "cursor-text" : "cursor-default"}
          ${!editable ? "text-neutral-dark" : ""}
        `}
        data-worksheet-cell
      />
    </div>
  );
}
