import React, { useCallback, useEffect, useState } from 'react';

export type NotificationSeverity = 'success' | 'error' | 'info';

export interface CanonNotificationItem {
  id: string;
  message: string;
  severity: NotificationSeverity;
}

interface Props {
  items: CanonNotificationItem[];
  onDismiss: (id: string) => void;
}

const SEVERITY_CLASS: Record<NotificationSeverity, string> = {
  success: 'canon-notification--success',
  error: 'canon-notification--error',
  info: 'canon-notification--info',
};

function NotificationToast({
  item,
  onDismiss,
}: {
  item: CanonNotificationItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 4000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      className={`canon-notification ${SEVERITY_CLASS[item.severity]}`}
      data-testid={`canon-notification-${item.severity}`}
      role="status"
    >
      <span className="canon-notification__message">{item.message}</span>
      <button
        className="canon-notification__dismiss"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function CanonNotificationHost({ items, onDismiss }: Props): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <div className="canon-notification-host" data-testid="canon-notification-host">
      {items.map((item) => (
        <NotificationToast key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

let notifyCounter = 0;

export function useCanonNotifications() {
  const [items, setItems] = useState<CanonNotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((message: string, severity: NotificationSeverity = 'info') => {
    notifyCounter += 1;
    const id = `notif-${notifyCounter}-${Date.now()}`;
    setItems((prev) => [...prev.slice(-4), { id, message, severity }]);
  }, []);

  return { items, dismiss, notify };
}
