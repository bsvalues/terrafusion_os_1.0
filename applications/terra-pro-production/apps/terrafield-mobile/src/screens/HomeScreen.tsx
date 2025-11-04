import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../hooks/useAuth";
import { ApiService } from "../services/ApiService";
import * as Colors from "../constants/Colors";

// Property interface
interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  status: string;
  lastUpdated: string;
  thumbnail?: string;
}

// Appraisal task interface
interface AppraisalTask {
  id: string;
  propertyId: string;
  address: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "review";
  priority: "low" | "medium" | "high" | "urgent";
  taskType: string;
}

// Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "system" | "task" | "sync";
}

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const apiService = ApiService.getInstance();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [pendingTasks, setPendingTasks] = useState<AppraisalTask[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    pendingChanges: number;
    lastSynced: string | null;
  }>({
    pendingChanges: 0,
    lastSynced: null,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load all data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load data in parallel
      await Promise.all([
        loadRecentProperties(),
        loadPendingTasks(),
        loadNotifications(),
        loadSyncStatus(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load recent properties
  const loadRecentProperties = async () => {
    try {
      if (apiService.isConnected()) {
        const data = await apiService.get<Property[]>("/api/properties/recent");
        setRecentProperties(data || []);
      } else {
        // Try to load from offline cache
        const cached = await loadFromCache("recent_properties");
        if (cached) {
          setRecentProperties(cached);
        }
      }
    } catch (error) {
      console.error("Error loading recent properties:", error);
      // Try to load from offline cache
      const cached = await loadFromCache("recent_properties");
      if (cached) {
        setRecentProperties(cached);
      }
    }
  };

  // Load pending tasks
  const loadPendingTasks = async () => {
    try {
      if (apiService.isConnected()) {
        const data = await apiService.get<AppraisalTask[]>("/api/tasks/pending");
        setPendingTasks(data || []);

        // Cache data for offline use
        saveToCache("pending_tasks", data);
      } else {
        // Try to load from offline cache
        const cached = await loadFromCache("pending_tasks");
        if (cached) {
          setPendingTasks(cached);
        }
      }
    } catch (error) {
      console.error("Error loading pending tasks:", error);
      // Try to load from offline cache
      const cached = await loadFromCache("pending_tasks");
      if (cached) {
        setPendingTasks(cached);
      }
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      if (apiService.isConnected()) {
        const data = await apiService.get<Notification[]>("/api/notifications");
        setNotifications(data || []);

        // Cache data for offline use
        saveToCache("notifications", data);
      } else {
        // Try to load from offline cache
        const cached = await loadFromCache("notifications");
        if (cached) {
          setNotifications(cached);
        }
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      // Try to load from offline cache
      const cached = await loadFromCache("notifications");
      if (cached) {
        setNotifications(cached);
      }
    }
  };

  // Load sync status
  const loadSyncStatus = async () => {
    try {
      // Get pending changes count from ApiService
      const pendingChanges = apiService.getPendingRequestsCount();

      // Get last synced timestamp from cache
      const lastSyncedCache = await loadFromCache("last_synced");

      setSyncStatus({
        pendingChanges,
        lastSynced: lastSyncedCache ? lastSyncedCache.timestamp : null,
      });
    } catch (error) {
      console.error("Error loading sync status:", error);
    }
  };

  // Save data to cache
  const saveToCache = async (key: string, data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`terrafield_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Error saving ${key} to cache:`, error);
    }
  };

  // Load data from cache
  const loadFromCache = async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(`terrafield_${key}`);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        return parsedCache.data;
      }
      return null;
    } catch (error) {
      console.error(`Error loading ${key} from cache:`, error);
      return null;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Handle sync now
  const handleSyncNow = async () => {
    try {
      // Trigger sync in ApiService
      await apiService.syncPendingRequests();

      // Update sync status
      await saveToCache("last_synced", { timestamp: new Date().toISOString() });
      loadSyncStatus();

      // Reload data
      loadData();
    } catch (error) {
      console.error("Error syncing data:", error);
      setError("Failed to sync data. Please try again.");
    }
  };

  // Navigation handlers
  const goToProperty = (propertyId: string) => {
    navigation.navigate("PropertyDetails", { propertyId });
  };

  const goToTask = (task: AppraisalTask) => {
    // Navigate based on task type
    switch (task.taskType) {
      case "field_notes":
        navigation.navigate("FieldNotes", { propertyId: task.propertyId, parcelId: task.id });
        break;
      case "photo_enhancement":
        navigation.navigate("PhotoEnhancement", { propertyId: task.propertyId });
        break;
      case "property_comparison":
        navigation.navigate("PropertyComparison", { propertyId: task.propertyId });
        break;
      default:
        navigation.navigate("PropertyDetails", { propertyId: task.propertyId });
    }
  };

  const goToNotifications = () => {
    // This would be implemented in a future screen
    // navigation.navigate('Notifications');
    console.log("Notifications screen not implemented yet");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return Colors.error;
      case "high":
        return Colors.warning;
      case "medium":
        return Colors.secondary;
      case "low":
      default:
        return Colors.info;
    }
  };

  // Render property item
  const renderPropertyItem = ({ item }: { item: Property }) => (
    <TouchableOpacity style={styles.propertyCard} onPress={() => goToProperty(item.id)}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.propertyImage} />
      ) : (
        <View style={styles.propertyImagePlaceholder}>
          <Ionicons name="home" size={24} color={Colors.textLight} />
        </View>
      )}

      <View style={styles.propertyInfo}><>

        <Text style={styles.propertyAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <Text
</> style={styles.propertyLocation} numberOfLines={1}>
          {item.city}, {item.state} {item.zipCode}
        </Text>
        <View style={styles.propertyMeta}><>

          <Text style={styles.propertyType}>{item.propertyType}</Text>
          <View
</> style={[styles.propertyStatus, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.propertyStatusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return Colors.success + "20";
      case "pending":
        return Colors.warning + "20";
      case "completed":
        return Colors.tertiary + "20";
      case "archived":
        return Colors.textLight + "20";
      default:
        return Colors.background;
    }
  };

  // Render task item
  const renderTaskItem = ({ item }: { item: AppraisalTask }) => (
    <TouchableOpacity style={styles.taskCard} onPress={() => goToTask(item)}>
      <View style={styles.taskHeader}>
        <View
          style={[styles.taskPriority, { backgroundColor: getPriorityColor(item.priority) + "20" }]}
        >
          <Text style={[styles.taskPriorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.taskDueDate}>Due: {formatDate(item.dueDate)}</Text>
      </View><>


      <Text style={styles.taskAddress} numberOfLines={1}>
        {item.address}
      </Text>

      <View
</> style={styles.taskFooter}><>

        <Text style={styles.taskType}>{getTaskTypeLabel(item.taskType)}</Text>
        <View
</> style={[styles.taskStatus, { backgroundColor: getTaskStatusColor(item.status) }]}>
          <Text style={styles.taskStatusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Get task type label
  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "field_notes":
        return "Field Notes";
      case "photo_enhancement":
        return "Photo Enhancement";
      case "property_comparison":
        return "Property Comparison";
      default:
        return type.replace("_", " ");
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get task status color
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return Colors.warning + "20";
      case "in_progress":
        return Colors.primary + "20";
      case "completed":
        return Colors.success + "20";
      case "review":
        return Colors.info + "20";
      default:
        return Colors.background;
    }
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View style={[styles.notificationItem, !item.isRead && styles.notificationUnread]}>
      <View style={styles.notificationIconContainer}><>

        <Ionicons
          name={getNotificationIcon(item.type)}
          size={20}
          color={getNotificationColor(item.type)}
        />
      </View>

      <View
</> style={styles.notificationContent}><>

        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text
</> style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{formatDate(item.timestamp)}</Text>
      </View>

      {!item.isRead && <View style={styles.notificationDot} />}
    </View>
  );

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "system":
        return "information-circle";
      case "task":
        return "checkmark-circle";
      case "sync":
        return "sync";
      default:
        return "notifications";
    }
  };

  // Get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "system":
        return Colors.info;
      case "task":
        return Colors.primary;
      case "sync":
        return Colors.tertiary;
      default:
        return Colors.textLight;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}><>

          <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0] || "User"}</Text>
          <Text
</> style={styles.date}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncNow}
            disabled={syncStatus.pendingChanges === 0}
          >
            <Ionicons
              name="sync"
              size={20}
              color={syncStatus.pendingChanges > 0 ? Colors.primary : Colors.textLight}
            />
            {syncStatus.pendingChanges > 0 && (
              <View style={styles.syncBadge}>
                <Text style={styles.syncBadgeText}>{syncStatus.pendingChanges}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationButton} onPress={goToNotifications}>
            <Ionicons name="notifications" size={20} color={Colors.primary} />
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications.filter((n) => !n.isRead).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} /><>

          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
</> style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Sync status */}
          {!apiService.isConnected() && (
            <View style={styles.offlineNotice}>
              <Ionicons name="cloud-offline" size={16} color={Colors.white} />
              <Text style={styles.offlineText}>
                You are offline. Changes will sync when you reconnect.
              </Text>
            </View>
          )}

          {syncStatus.pendingChanges > 0 && (
            <View style={styles.syncNotice}>
              <Ionicons name="sync" size={16} color={Colors.primary} /><>

              <Text style={styles.syncText}>
                {syncStatus.pendingChanges} {syncStatus.pendingChanges === 1 ? "change" : "changes"}{" "}
                pending synchronization.
              </Text>
              <TouchableOpacity
</> onPress={handleSyncNow}>
                <Text style={styles.syncNowText}>Sync Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pending Tasks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}><>

              <Text style={styles.sectionTitle}>Pending Tasks</Text>
              <TouchableOpacity
</> onPress={() => navigation.navigate("Tasks")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {pendingTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.textLight} />
                <Text style={styles.emptyText}>No pending tasks</Text>
              </View>
            ) : (
              <FlatList
                data={pendingTasks.slice(0, 3)}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.taskListContent}
              />
            )}
          </View>

          {/* Recent Properties */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}><>

              <Text style={styles.sectionTitle}>Recent Properties</Text>
              <TouchableOpacity
</> onPress={() => navigation.navigate("Properties")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentProperties.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="home" size={32} color={Colors.textLight} />
                <Text style={styles.emptyText}>No recent properties</Text>
              </View>
            ) : (
              <FlatList
                data={recentProperties.slice(0, 3)}
                renderItem={renderPropertyItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.propertyListContent}
              />
            )}
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}><>

              <Text style={styles.sectionTitle}>Notifications</Text>
              <TouchableOpacity
</> onPress={goToNotifications}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications" size={32} color={Colors.textLight} />
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            ) : (
              <View style={styles.notificationsList}>
                {notifications.slice(0, 3).map((notification) => (
                  <View key={notification.id}>
                    {renderNotificationItem({ item: notification })}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}><>

            <Text style={styles.quickActionsTitle}>Quick Actions</Text>

            <View
</> style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => navigation.navigate("NewAppraisal")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + "15" }]}><>

                  <Ionicons name="add" size={24} color={Colors.primary} />
                </View>
                <Text
</> style={styles.quickActionText}>New Appraisal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => navigation.navigate("PhotoEnhancement")}
              >
                <View
                  style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + "15" }]}
                ><>

                  <Ionicons name="camera" size={24} color={Colors.secondary} />
                </View>
                <Text
</> style={styles.quickActionText}>Enhance Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => navigation.navigate("PropertyComparison")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.tertiary + "15" }]}><>

                  <Ionicons name="git-compare" size={24} color={Colors.tertiary} />
                </View>
                <Text
</> style={styles.quickActionText}>Compare Properties</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => navigation.navigate("GenerateReport")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + "15" }]}><>

                  <Ionicons name="document-text" size={24} color={Colors.info} />
                </View>
                <Text
</> style={styles.quickActionText}>Generate Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  date: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  syncButton: {
    padding: 8,
    marginRight: 8,
  },
  syncBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  syncBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: Colors.error,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: Colors.text,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: "bold",
  },
  offlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 4,
  },
  offlineText: {
    color: Colors.white,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  syncNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "10",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 4,
  },
  syncText: {
    color: Colors.text,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  syncNowText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.primary,
  },
  emptyContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 8,
    color: Colors.textLight,
  },
  propertyListContent: {
    paddingRight: 10,
  },
  propertyCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginRight: 10,
    width: 250,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  propertyImage: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.backgroundDark,
  },
  propertyImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  propertyInfo: {
    padding: 15,
  },
  propertyAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  propertyLocation: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  propertyMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  propertyType: {
    fontSize: 11,
    color: Colors.textLight,
  },
  propertyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  propertyStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.text,
  },
  taskListContent: {
    paddingRight: 10,
  },
  taskCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginRight: 10,
    width: 250,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  taskPriority: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskPriorityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  taskDueDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  taskAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 10,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskType: {
    fontSize: 11,
    color: Colors.textLight,
  },
  taskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.text,
  },
  notificationsList: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notificationUnread: {
    backgroundColor: Colors.primary + "05",
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  notificationMessage: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  quickActions: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.text,
    textAlign: "center",
  },
});

export default HomeScreen;
