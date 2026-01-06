/**
 * TerraFusion OS Desktop Shell Components
 *
 * Government-Grade Desktop Interface
 *
 * @module shell/desktop
 */

// Core Layout
export { Desktop, DesktopWithErrorBoundary } from './Desktop';
export type { DesktopProps } from './Desktop';

export { DesktopBackground } from './DesktopBackground';
export type { DesktopBackgroundProps } from './DesktopBackground';

// Taskbar
export { Taskbar } from './Taskbar';
export type { TaskbarProps } from './Taskbar';

export { TaskbarWithNotifications } from './TaskbarWithNotifications';
export type { TaskbarWithNotificationsProps } from './TaskbarWithNotifications';

// Start Menu
export { StartMenu } from './StartMenu';
export type { StartMenuProps } from './StartMenu';

export { RecentAppsSection } from './RecentAppsSection';
export type { RecentAppsSectionProps } from './RecentAppsSection';

export { AppContextMenu } from './AppContextMenu';
export type { AppContextMenuProps } from './AppContextMenu';

export { DesktopContextMenu } from './DesktopContextMenu';
export type { DesktopContextMenuProps } from './DesktopContextMenu';

// Window System
export { Window } from './Window';
export type { WindowProps } from './Window';

export { WindowManager } from './WindowManager';
export type { WindowManagerProps } from './WindowManager';

export { ModuleLoader } from './ModuleLoader';

// System Tray Components
export { AIStatusIndicator, AIStatusPanel, defaultAIStatus } from './AIStatusPanel';
export type { AIStatus, AIAgentCategory, AIStatusIndicatorProps, AIStatusPanelProps } from './AIStatusPanel';

export { SystemHealthIndicator, SystemHealthPanel, defaultHealthStatus } from './SystemHealthPanel';
export type { SystemHealthStatus, SystemHealthIndicatorProps, SystemHealthPanelProps } from './SystemHealthPanel';

export { NotificationBell, NotificationPanel } from './NotificationBell';
export type { Notification, NotificationType, NotificationBellProps, NotificationPanelProps } from './NotificationBell';

export { Clock } from './Clock';
export type { ClockProps } from './Clock';

// Snap Preview
export { SnapPreview } from './SnapPreview';
export type { SnapPreviewProps } from './SnapPreview';

// Error Boundaries
export { WindowErrorBoundary } from './WindowErrorBoundary';
export type { WindowErrorBoundaryProps } from './WindowErrorBoundary';

export { DesktopErrorBoundary } from './DesktopErrorBoundary';
export type { DesktopErrorBoundaryProps } from './DesktopErrorBoundary';
