import { getRandomMicrocopy } from "@/lib/brand"

interface LoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function Loading({ message, size = "md" }: LoadingProps) {
  const loadingMessage = message || getRandomMicrocopy("loading")

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className={`${sizeClasses[size]} relative`}><>

        <div className="absolute inset-0 rounded-full border-2 border-tf-primary/20"></div>
        <div
</> className="absolute inset-0 rounded-full border-2 border-transparent border-t-tf-transcend animate-spin"></div>
        <div className="absolute inset-1 rounded-full border border-transparent border-t-tf-accent animate-spin animation-delay-150"></div>
      </div>
      <p className="text-sm text-muted-foreground font-medium animate-pulse">{loadingMessage}</p>
    </div>
  )
}
