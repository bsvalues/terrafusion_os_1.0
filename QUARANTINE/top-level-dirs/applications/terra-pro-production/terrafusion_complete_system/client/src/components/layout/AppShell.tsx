import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface SyncStatusIndicatorProps {
  status: "synced" | "syncing" | "error";
  message?: string;
}

function SyncStatusIndicator({ status, message = "All changes synced" }: SyncStatusIndicatorProps) {
  const statusColors = {
    synced: "bg-status-success",
    syncing: "bg-accent",
    error: "bg-status-error",
  };

  const statusMessages = {
    synced: "All changes synced",
    syncing: "Syncing changes...",
    error: "Sync error",
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-md p-2 flex items-center"><>

      <div className={`w-3 h-3 rounded-full ${statusColors[status]} mr-2`}></div>
      <span
</> className="text-sm font-medium pr-1">{message || statusMessages[status]}</span>
    </div>
  );
}

interface AIAssistantButtonProps {
  onClick?: () => void;
}

function AIAssistantButton({ onClick }: AIAssistantButtonProps) {
  return (
    <button
      className="fixed bottom-4 left-4 bg-accent text-white rounded-full shadow-md p-3 flex items-center justify-center hover:bg-accent-dark"
      onClick={onClick}
      title="AI Assistant"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </button>
  );
}

interface AppShellProps {
  children: ReactNode;
  currentReport?: string;
  userName?: string;
  syncStatus?: "synced" | "syncing" | "error";
  syncMessage?: string;
  onAIAssistantClick?: () => void;
  activeSidebarPath?: string;
  onSidebarItemClick?: (section: string, item: string) => void;
}

export default function AppShell({
  children,
  currentReport,
  userName,
  syncStatus = "synced",
  syncMessage,
  onAIAssistantClick,
  activeSidebarPath,
  onSidebarItemClick,
}: AppShellProps) {
  return (
    <div className="h-screen flex flex-col">
      <Header currentReport={currentReport} userName={userName} />

      <main className="flex flex-1 overflow-hidden">
        <Sidebar activePath={activeSidebarPath} onSectionItemClick={onSidebarItemClick} />

        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </main>

      <SyncStatusIndicator status={syncStatus} message={syncMessage} />
      <AIAssistantButton onClick={onAIAssistantClick} />
    </div>
  );
}
