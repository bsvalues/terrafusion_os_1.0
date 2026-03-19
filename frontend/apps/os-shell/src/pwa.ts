// import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the Service Worker for PWA support.
 * Handles updates and offline readiness notifications.
 */
export function registerPWA() {
  /*
  const updateSW = registerSW({
    onNeedRefresh() {
      useNotificationStore.getState().addNotification(
        {
          title: 'Update Available',
          message: 'A new version of TerraFusion OS is available.',
          type: 'info',
        },
        {
          duration: 0, // Persistent until clicked
          action: {
            label: 'Reload',
            onClick: () => {
              updateSW(true);
            },
          },
        }
      );
    },
    onOfflineReady() {
      useNotificationStore.getState().addNotification(
        {
          title: 'Offline Ready',
          message: 'TerraFusion OS is ready to work offline.',
          type: 'success',
        },
        {
          duration: 5000,
        }
      );
    },
    onRegisterError(error) {
      console.error('PWA: Registration failed', error);
    },
  });
  */
}
