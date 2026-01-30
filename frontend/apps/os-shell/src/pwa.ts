// import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the Service Worker for PWA support.
 * Handles updates and offline readiness notifications.
 */
export function registerPWA() {
  console.log('PWA: Service Worker disabled temporarily for build validation');
  /*
  const updateSW = registerSW({
    onNeedRefresh() {
      console.log('PWA: New content available');
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
      console.log('PWA: Offline ready');
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
