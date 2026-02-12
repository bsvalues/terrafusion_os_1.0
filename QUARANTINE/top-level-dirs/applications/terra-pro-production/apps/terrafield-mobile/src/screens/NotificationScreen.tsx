import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NotificationService, Notification } from "../services/NotificationService";
import { NotificationType } from "../services/types";
import { formatDistanceToNow } from "date-fns";

/**
 * Map notification types to icons and colors
 */
const getNotificationMeta = (type: NotificationType) => {
  switch (type) {
    case NotificationType.PHOTO_ENHANCEMENT_STARTED:
      return { icon: "image-edit", color: "#3498db" };
    case NotificationType.PHOTO_ENHANCEMENT_COMPLETED:
      return { icon: "image-check", color: "#2ecc71" };
    case NotificationType.PHOTO_ENHANCEMENT_FAILED:
      return { icon: "image-off", color: "#e74c3c" };
    case NotificationType.SYNC_STARTED:
      return { icon: "sync", color: "#3498db" };
    case NotificationType.SYNC_COMPLETED:
      return { icon: "check-circle", color: "#2ecc71" };
    case NotificationType.SYNC_FAILED:
      return { icon: "sync-off", color: "#e74c3c" };
    case NotificationType.NEW_PHOTO_AVAILABLE:
      return { icon: "image-plus", color: "#9b59b6" };
    case NotificationType.OFFLINE_QUEUE_UPDATED:
      return { icon: "folder-clock", color: "#f39c12" };
    default:
      return { icon: "bell", color: "#7f8c8d" };
  }
};

/**
 * Function to render a single notification item
 */
const NotificationItem = ({ item, onPress }: { item: Notification; onPress: () => void }) => {
  const { icon, color } = getNotificationMeta(item.type as NotificationType);
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  return (
    <TouchableOpacity
      style={[styles.notificationItem, item.read ? styles.readItem : styles.unreadItem]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}><>

        <MaterialCommunityIcons name={icon} size={24} color="white" />
      </View>
      <View
</> style={styles.contentContainer}><>

        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text
</> style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.timestamp}>{timeAgo}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

/**
 * Main NotificationScreen component
 */
const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const notificationService = NotificationService.getInstance();

  // Load and subscribe to notifications
  useEffect(() => {
    // Assume we have the user ID from authentication context
    const userId = 1; // Replace with actual user ID from auth context
    notificationService.connect(userId);

    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      unsubscribe();
      notificationService.disconnect();
    };
  }, []);

  /**
   * Handle refreshing the notification list
   */
  const handleRefresh = () => {
    setRefreshing(true);
    // The notifications will be updated via the subscription
  };

  /**
   * Handle marking a notification as read
   */
  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
    }

    // Navigate based on notification type
    handleNotificationNavigation(notification);
  };

  /**
   * Handle navigating based on notification type
   */
  const handleNotificationNavigation = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.PHOTO_ENHANCEMENT_COMPLETED:
        // Navigate to the enhanced photo
        if (notification.resourceId) {
          navigation.navigate("PhotoDetail", { photoId: notification.resourceId });
        }
        break;

      case NotificationType.NEW_PHOTO_AVAILABLE:
        // Navigate to photo gallery
        navigation.navigate("PhotoGallery");
        break;

      case NotificationType.SYNC_COMPLETED:
      case NotificationType.SYNC_FAILED:
        // Navigate to sync status screen
        navigation.navigate("SyncStatus");
        break;

      default:
        // Don't navigate for other notification types
        break;
    }
  };

  /**
   * Handle clearing all notifications
   */
  const handleClearAll = async () => {
    await notificationService.clearNotifications();
  };

  // Render empty state
  if (!loading && notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="bell-off-outline" size={64} color="#bdc3c7" /><>

        <Text style={styles.emptyText}>No notifications</Text>
        <Text
</> style={styles.emptySubtext}>You're all caught up!</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={() => handleMarkAsRead(item)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3498db"]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  clearAllText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 16,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  readItem: {
    opacity: 0.7,
  },
  unreadItem: {
    opacity: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3498db",
    alignSelf: "flex-start",
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  refreshButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#3498db",
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "500",
  },
});

export default NotificationScreen;
