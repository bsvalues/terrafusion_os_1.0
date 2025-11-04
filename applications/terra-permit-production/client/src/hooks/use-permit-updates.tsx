import { useCallback } from 'react';
import { Permit, CollaborationEventType } from '@/types';
import { updatePermit as updatePermitApi } from '@/lib/api';
import { useNotifications } from './use-notifications';
import { useQueryClient } from '@tanstack/react-query';

/**
 * A hook to handle permit updates with real-time notifications
 */
export function usePermitUpdates() {
  const { isConnected, sendNotification } = useNotifications();
  const queryClient = useQueryClient();

  // Update a permit and send notification
  const updatePermitWithNotification = useCallback(
    async (
      permitId: number,
      permitData: Partial<Permit>,
      userId: number,
      sessionId: string,
      userNickname: string,
      actionDetail: string
    ) => {
      // First, update the permit in the database
      const updatedPermit = await updatePermitApi(
        permitId,
        permitData,
        userId,
        actionDetail
      );

      // If notifications are connected, send a notification
      if (isConnected) {
        sendNotification({
          type: CollaborationEventType.PERMIT_UPDATE,
          sessionId,
          userId: userNickname, // Use the nickname as userId for better UX
          timestamp: new Date().toISOString(),
          payload: {
            permitId,
            permitData,
            userName: userNickname,
            actionDetail,
          },
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/permits', permitId, 'history'],
      });
      
      // If this was part of an upload, invalidate that too
      if (updatedPermit.uploadId) {
        queryClient.invalidateQueries({
          queryKey: ['/api/uploads', updatedPermit.uploadId, 'permits'],
        });
        
        queryClient.invalidateQueries({
          queryKey: ['/api/uploads', updatedPermit.uploadId, 'history'],
        });
      }

      return updatedPermit;
    },
    [isConnected, sendNotification, queryClient]
  );

  return { updatePermitWithNotification };
}