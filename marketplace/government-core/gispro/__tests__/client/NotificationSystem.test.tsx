import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { NotificationProvider, useNotifications } from '@/hooks/use-notifications';
import { useQuery } from '@tanstack/react-query';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

// Create test component to access hook
const NotificationTestHarness = () => {
  const { 
    notifications, 
    markAsRead, 
    dismissNotification,
    dismissAll,
    unreadCount 
  } = useNotifications();
  
  return (
    <div><>

      <div data-testid="unread-count">{unreadCount}</div>
      <button
</>
onClick={() => markAsRead(1)}>Mark #1 as Read</button><>

      <button onClick={() => dismissNotification(1)}>Dismiss #1</button>
      <button
</>
onClick={dismissAll}>Dismiss All</button>
      <div>
        {notifications.map(notification => (
          <div key={notification.id} data-testid={`notification-${notification.id}`}>
            {notification.title}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Notification System', () => {
  // Sample notifications for testing
  const mockNotifications = [
    {
      id: 1,
      title: 'Document Classified',
      message: 'Boundary Survey.pdf has been classified as a survey document',
      type: 'info',
      read: false,
      createdAt: '2025-03-01T09:30:00Z',
      entityType: 'document',
      entityId: 123
    },
    {
      id: 2,
      title: 'Parcel Linked',
      message: 'Document has been linked to parcel #12345-67-89',
      type: 'success',
      read: true,
      createdAt: '2025-03-01T10:15:00Z',
      entityType: 'document',
      entityId: 123
    },
    {
      id: 3,
      title: 'Low Confidence Classification',
      message: 'Deed.pdf was classified with low confidence (45%)',
      type: 'warning',
      read: false,
      createdAt: '2025-03-01T11:45:00Z',
      entityType: 'document',
      entityId: 456
    }
  ];
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock query response
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/notifications') {
        return {
          data: mockNotifications,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
  });
  
  test('should render notification center with correct notifications', async () => {
    render(
      <NotificationProvider>
        <NotificationCenter />
      </NotificationProvider>
    );
    
    // Check if notifications are displayed
    await waitFor(() => {
      expect(screen.getByText('Document Classified')).toBeInTheDocument();
      expect(screen.getByText('Parcel Linked')).toBeInTheDocument();
      expect(screen.getByText('Low Confidence Classification')).toBeInTheDocument();
    });
    
    // Check for unread indicator badge
    const unreadBadge = screen.getByText('2');
    expect(unreadBadge).toBeInTheDocument();
  });
  
  test('should allow marking notifications as read', async () => {
    // Mock the mutation for marking as read
    const markAsReadMock = jest.fn().mockResolvedValue({});
    (window as any).apiRequest = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
      ok: true
    });
    
    render(
      <NotificationProvider>
        <NotificationTestHarness />
      </NotificationProvider>
    );
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    });
    
    // Mark notification as read
    fireEvent.click(screen.getByText('Mark #1 as Read'));
    
    // Check that API was called
    await waitFor(() => {
      expect((window as any).apiRequest).toHaveBeenCalledWith(
        'PATCH',
        '/api/notifications/1/read',
        { read: true }
      );
    });
    
    // Mock the updated notifications response
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/notifications') {
        return {
          data: [
            { ...mockNotifications[0], read: true },
            ...mockNotifications.slice(1)
          ],
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
    
    // Check unread count is updated
    await waitFor(() => {
      expect(screen.getByTestId('unread-count').textContent).toBe('1');
    });
  });
  
  test('should allow dismissing notifications', async () => {
    // Mock the mutation for dismissing
    const dismissMock = jest.fn().mockResolvedValue({});
    (window as any).apiRequest = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
      ok: true
    });
    
    render(
      <NotificationProvider>
        <NotificationTestHarness />
      </NotificationProvider>
    );
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(screen.getByTestId('notification-1')).toBeInTheDocument();
      expect(screen.getByTestId('notification-2')).toBeInTheDocument();
      expect(screen.getByTestId('notification-3')).toBeInTheDocument();
    });
    
    // Dismiss notification
    fireEvent.click(screen.getByText('Dismiss #1'));
    
    // Check that API was called
    await waitFor(() => {
      expect((window as any).apiRequest).toHaveBeenCalledWith(
        'DELETE',
        '/api/notifications/1',
        undefined
      );
    });
    
    // Mock the updated notifications response (without the dismissed notification)
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/notifications') {
        return {
          data: mockNotifications.slice(1), // Remove the first notification
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
    
    // Check notification is removed
    await waitFor(() => {
      expect(screen.queryByTestId('notification-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('notification-2')).toBeInTheDocument();
      expect(screen.getByTestId('notification-3')).toBeInTheDocument();
    });
  });
  
  test('should group notifications by type and entity', async () => {
    // Add more mock notifications of the same type/entity
    const groupedMockNotifications = [
      ...mockNotifications,
      {
        id: 4,
        title: 'Document Updated',
        message: 'Boundary Survey.pdf has been updated',
        type: 'info',
        read: false,
        createdAt: '2025-03-01T12:30:00Z',
        entityType: 'document',
        entityId: 123
      },
      {
        id: 5,
        title: 'Document Updated Again',
        message: 'Boundary Survey.pdf has been updated again',
        type: 'info',
        read: false,
        createdAt: '2025-03-01T13:15:00Z',
        entityType: 'document',
        entityId: 123
      }
    ];
    
    // Update mock query
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/notifications') {
        return {
          data: groupedMockNotifications,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
    
    render(
      <NotificationProvider>
        <NotificationCenter groupNotifications={true} />
      </NotificationProvider>
    );
    
    // Check for grouped notification indicator
    await waitFor(() => {
      const groupedNotification = screen.getByText(/3 updates for Boundary Survey.pdf/i);
      expect(groupedNotification).toBeInTheDocument();
    });
  });
  
  test('should filter notifications by type', async () => {
    render(
      <NotificationProvider>
        <NotificationCenter />
      </NotificationProvider>
    );
    
    // Wait for notifications to load
    await waitFor(() => {
      expect(screen.getByText('Document Classified')).toBeInTheDocument();
      expect(screen.getByText('Parcel Linked')).toBeInTheDocument();
      expect(screen.getByText('Low Confidence Classification')).toBeInTheDocument();
    });
    
    // Click filter to show only warnings
    fireEvent.click(screen.getByText(/Filter/));
    fireEvent.click(screen.getByText(/Warnings/));
    
    // Verify only warning notifications are displayed
    await waitFor(() => {
      expect(screen.queryByText('Document Classified')).not.toBeInTheDocument();
      expect(screen.queryByText('Parcel Linked')).not.toBeInTheDocument();
      expect(screen.getByText('Low Confidence Classification')).toBeInTheDocument();
    });
  });
  
  test('should show empty state when no notifications are available', async () => {
    // Update mock to return empty array
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === '/api/notifications') {
        return {
          data: [],
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
    
    render(
      <NotificationProvider>
        <NotificationCenter />
      </NotificationProvider>
    );
    
    // Check for empty state
    await waitFor(() => {
      expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
    });
  });
});