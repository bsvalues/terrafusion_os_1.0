/**
 * TerraFusion OS Taskbar with Notifications Integration
 *
 * Thin wrapper that renders the Taskbar.
 * Notifications now live in the top bar (DesktopTopSystemBar),
 * but this wrapper is preserved for backward compatibility with Desktop.tsx.
 *
 * @module shell/desktop/TaskbarWithNotifications
 */

import React from 'react';
import { Taskbar, type TaskbarProps } from './Taskbar';

// ============================================================================
// Types
// ============================================================================

export type TaskbarWithNotificationsProps = TaskbarProps;

// ============================================================================
// Component
// ============================================================================

export const TaskbarWithNotifications: React.FC<TaskbarWithNotificationsProps> = (props) => {
  return <Taskbar {...props} />;
};

export default TaskbarWithNotifications;
