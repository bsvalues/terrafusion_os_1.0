import React from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Topbar } from "@/components/ui/topbar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  className?: string;
  children?: React.ReactNode;
}

export function AppShell({ className, children }: AppShellProps) {
  return (
    <div className={cn("flex h-screen bg-background", className)}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
