import * as React from "react"

import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
          
          // Variants
          variant === "default" && "bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90",
          variant === "destructive" && "bg-red-500 text-slate-50 shadow-sm hover:bg-red-500/90",
          variant === "outline" && "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900",
          variant === "secondary" && "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80",
          variant === "ghost" && "hover:bg-slate-100 hover:text-slate-900",
          variant === "link" && "text-slate-900 underline-offset-4 hover:underline",
          
          // Sizes
          size === "default" && "h-9 px-4 py-2",
          size === "sm" && "h-8 rounded-md px-3 text-xs",
          size === "lg" && "h-10 rounded-md px-8",
          size === "icon" && "h-9 w-9",
          
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// This function is being used by other components like calendar.tsx and pagination.tsx
export function buttonVariants({
  variant = "default",
  size = "default",
  className = "",
}: ButtonProps) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
    
    // Variants
    variant === "default" && "bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90",
    variant === "destructive" && "bg-red-500 text-slate-50 shadow-sm hover:bg-red-500/90",
    variant === "outline" && "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900",
    variant === "secondary" && "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80",
    variant === "ghost" && "hover:bg-slate-100 hover:text-slate-900",
    variant === "link" && "text-slate-900 underline-offset-4 hover:underline",
    
    // Sizes
    size === "default" && "h-9 px-4 py-2",
    size === "sm" && "h-8 rounded-md px-3 text-xs",
    size === "lg" && "h-10 rounded-md px-8",
    size === "icon" && "h-9 w-9",
    
    className
  )
}

export { Button }