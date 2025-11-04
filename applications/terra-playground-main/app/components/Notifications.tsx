'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationState } from '../hooks/useNotificationState';

export default function Notifications() {
  const { notifications, removeNotification } = useNotificationState();

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`rounded-lg shadow-lg p-4 max-w-sm w-full ${
              notification.type === 'success'
                ? 'bg-green-500'
                : notification.type === 'error'
                ? 'bg-red-500'
                : notification.type === 'warning'
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-1">
                {notification.title && (
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {notification.title}
                  </h3>
                )}
                <p className="text-sm text-white">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 text-white hover:text-gray-200 focus:outline-none"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 